import { auditSchema } from "@/lib/schema";
import { SCBKR_SYSTEM_PROMPT } from "@/lib/prompt";
import { AuditResponse } from "@/lib/types";

/**
 * Amplify-friendly Bedrock wrapper:
 * 1) Default: AWS SDK v3 Bedrock Runtime (`BEDROCK_USE_SDK=true`)
 *    - Uses runtime IAM role / default credential provider chain.
 * 2) Optional: gateway/proxy mode via BEDROCK_INVOKE_URL
 */
const DEFAULT_REGION = "us-west-2";

type CredentialSource = "sdk-default-provider" | "none";

interface RuntimeDebugContext {
  resolved_model_id: string;
  aws_region: string;
  use_sdk_mode: boolean;
  credential_source: CredentialSource;
  strict_mode: boolean;
  request_url: string;
}

function resolveAwsRegion(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || DEFAULT_REGION;
}

function resolveStrictMode(): boolean {
  const mode = process.env.DECISION_ENGINE_MODE?.trim().toLowerCase() || "strict";
  return mode !== "relaxed";
}

export function resolveBedrockModelId(): string {
  const modelId = process.env.BEDROCK_MODEL_ID?.trim();
  if (!modelId) throw new Error("Missing BEDROCK_MODEL_ID");
  return modelId;
}

function resolveCredentialSource(useSdkMode: boolean): CredentialSource {
  return useSdkMode ? "sdk-default-provider" : "none";
}

function buildBedrockRequestUrl(region: string, modelId: string): string {
  return `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`;
}

function logInvokeDebug(context: RuntimeDebugContext) {
  console.info("[bedrock] invoke debug", context);
}

function safeJsonParse(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const jsonSlice = start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
  return JSON.parse(jsonSlice);
}

async function invokeBedrockBySdk(modelId: string, region: string, body: string): Promise<{ content?: { text?: string }[]; output_text?: string }> {
  const sdkModuleName = "@aws-sdk/client-bedrock-runtime";
  type SdkModule = {
    BedrockRuntimeClient: new (input: { region: string }) => { send: (command: unknown) => Promise<{ body: Uint8Array }> };
    InvokeModelCommand: new (input: unknown) => unknown;
  };

  let sdkModule: SdkModule;

  try {
    const runtimeImport = new Function("moduleName", "return import(moduleName);") as (moduleName: string) => Promise<unknown>;
    sdkModule = (await runtimeImport(sdkModuleName)) as SdkModule;
  } catch {
    throw new Error(`Missing dependency ${sdkModuleName}. Add it to dependencies for SDK mode.`);
  }

  const client = new sdkModule.BedrockRuntimeClient({ region });
  const command = new sdkModule.InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: new TextEncoder().encode(body)
  });

  const response = await client.send(command);
  const raw = new TextDecoder().decode(response.body);
  return JSON.parse(raw) as { content?: { text?: string }[]; output_text?: string };
}


export async function auditWithBedrock(message: string): Promise<AuditResponse> {
  const invokeUrl = process.env.BEDROCK_INVOKE_URL;
  const modelId = resolveBedrockModelId();
  const apiKey = process.env.BEDROCK_API_KEY;
  const useSdkMode = process.env.BEDROCK_USE_SDK !== "false";
  const region = resolveAwsRegion();
  const strictMode = resolveStrictMode();
  const credentialSource = resolveCredentialSource(useSdkMode);
  const requestUrl = useSdkMode ? buildBedrockRequestUrl(region, modelId) : invokeUrl || "N/A";

  if (!useSdkMode && !invokeUrl) throw new Error("Missing BEDROCK_INVOKE_URL");

  const requestBody = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1200,
    temperature: 0,
    system: SCBKR_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: `請審計以下訊息：\n${message}` }]
      }
    ]
  };

  logInvokeDebug({
    resolved_model_id: modelId,
    aws_region: region,
    use_sdk_mode: useSdkMode,
    credential_source: credentialSource,
    strict_mode: strictMode,
    request_url: requestUrl
  });

  const payload = useSdkMode
    ? await invokeBedrockBySdk(modelId, region, JSON.stringify(requestBody))
    : await (async () => {
        const resp = await fetch(invokeUrl!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
          },
          body: JSON.stringify({ modelId, ...requestBody })
        });
        if (!resp.ok) {
          const errBody = await resp.text();
          throw new Error(`Bedrock invoke failed: status=${resp.status} body=${errBody.slice(0, 1200)}`);
        }
        return resp.json() as Promise<{ content?: { text?: string }[]; output_text?: string }>;
      })();

  const llmText = payload.content?.[0]?.text ?? payload.output_text ?? "";
  const parsed = safeJsonParse(llmText);
  const validated = auditSchema.parse(parsed);

  return {
    ...validated,
    meta: {
      model: modelId,
      fallback_used: false
    }
  };
}

export { resolveAwsRegion, resolveStrictMode, resolveCredentialSource, buildBedrockRequestUrl };
