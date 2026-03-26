import { auditSchema } from "@/lib/schema";
import { SCBKR_SYSTEM_PROMPT } from "@/lib/prompt";
import { AuditResponse } from "@/lib/types";
import crypto from "crypto";

/**
 * Lightweight Bedrock wrapper.
 *
 * Amplify-friendly Bedrock wrapper:
 * 1) Default: direct Bedrock Runtime via SigV4 (`BEDROCK_USE_SDK=true`)
 *    - Uses runtime IAM role credentials exposed by AWS execution environment.
 * 2) Optional: gateway/proxy mode via BEDROCK_INVOKE_URL
 */
const DEFAULT_REGION = "us-west-2";

function hmac(key: crypto.BinaryLike, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

interface RuntimeDebugContext {
  resolved_model_id: string;
  signed_path: string;
  request_url: string;
  aws_region: string;
  use_sdk_mode: boolean;
  has_access_key: boolean;
  has_session_token: boolean;
  credential_source: "container-role" | "env-static" | "none";
  strict_mode: boolean;
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

async function loadRoleCredentialsFromContainerEndpoint(): Promise<AwsCredentials | null> {
  const relative = process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI;
  const full = process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI;
  const endpoint = full || (relative ? `http://169.254.170.2${relative}` : null);
  if (!endpoint) return null;

  const headers: Record<string, string> = {};
  if (process.env.AWS_CONTAINER_AUTHORIZATION_TOKEN) {
    headers.Authorization = process.env.AWS_CONTAINER_AUTHORIZATION_TOKEN;
  }

  const resp = await fetch(endpoint, { headers });
  if (!resp.ok) return null;
  const payload = (await resp.json()) as {
    AccessKeyId?: string;
    SecretAccessKey?: string;
    Token?: string;
  };
  if (!payload.AccessKeyId || !payload.SecretAccessKey) return null;
  return {
    accessKeyId: payload.AccessKeyId,
    secretAccessKey: payload.SecretAccessKey,
    sessionToken: payload.Token
  };
}

async function resolveAwsCredentials(): Promise<{ credentials: AwsCredentials | null; source: RuntimeDebugContext["credential_source"] }> {
  const roleCredentials = await loadRoleCredentialsFromContainerEndpoint();
  if (roleCredentials) {
    return { credentials: roleCredentials, source: "container-role" };
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;
  if (accessKeyId && secretAccessKey) {
    return {
      credentials: { accessKeyId, secretAccessKey, sessionToken },
      source: "env-static"
    };
  }

  return { credentials: null, source: "none" };
}

function logInvokeDebug(context: RuntimeDebugContext) {
  console.info("[bedrock] invoke debug", context);
}

async function invokeBedrockBySigV4(modelId: string, body: string): Promise<unknown> {
  const region = resolveAwsRegion();
  const strictMode = resolveStrictMode();
  const { credentials, source } = await resolveAwsCredentials();
  if (!credentials) {
    throw new Error("Missing AWS credentials in runtime. Check Amplify compute role credential injection.");
  }

  const host = `bedrock-runtime.${region}.amazonaws.com`;
  const signedPath = `/model/${modelId}/invoke`;
  const requestUrl = `https://${host}${signedPath}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = sha256Hex(body);
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n${credentials.sessionToken ? `x-amz-security-token:${credentials.sessionToken}\n` : ""}`;
  const signedHeaders = credentials.sessionToken
    ? "content-type;host;x-amz-content-sha256;x-amz-date;x-amz-security-token"
    : "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `POST\n${signedPath}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${region}/bedrock/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;
  const kDate = hmac(`AWS4${credentials.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "bedrock");
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const resp = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Amz-Date": amzDate,
      "X-Amz-Content-Sha256": payloadHash,
      ...(credentials.sessionToken ? { "X-Amz-Security-Token": credentials.sessionToken } : {}),
      Authorization: authorization
    },
    body
  });

  logInvokeDebug({
    resolved_model_id: modelId,
    signed_path: signedPath,
    request_url: requestUrl,
    aws_region: region,
    use_sdk_mode: true,
    has_access_key: Boolean(credentials.accessKeyId),
    has_session_token: Boolean(credentials.sessionToken),
    credential_source: source,
    strict_mode: strictMode
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Bedrock SigV4 invoke failed: status=${resp.status} body=${errBody.slice(0, 1200)}`);
  }
  return resp.json();
}

function safeJsonParse(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const jsonSlice = start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
  return JSON.parse(jsonSlice);
}

export async function auditWithBedrock(message: string): Promise<AuditResponse> {
  const invokeUrl = process.env.BEDROCK_INVOKE_URL;
  const modelId = resolveBedrockModelId();
  const apiKey = process.env.BEDROCK_API_KEY;
  const useSdkMode = process.env.BEDROCK_USE_SDK !== "false";
  const region = resolveAwsRegion();
  const strictMode = resolveStrictMode();

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

  const payload = (useSdkMode
    ? await invokeBedrockBySigV4(modelId, JSON.stringify(requestBody))
    : await (async () => {
        logInvokeDebug({
          resolved_model_id: modelId,
          signed_path: "N/A(gateway mode)",
          request_url: invokeUrl!,
          aws_region: region,
          use_sdk_mode: false,
          has_access_key: Boolean(process.env.AWS_ACCESS_KEY_ID),
          has_session_token: Boolean(process.env.AWS_SESSION_TOKEN),
          credential_source: "none",
          strict_mode: strictMode
        });
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
        return resp.json();
      })()) as { content?: { text?: string }[]; output_text?: string };

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

export { resolveAwsRegion, resolveStrictMode, resolveAwsCredentials };
