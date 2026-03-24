import { auditSchema } from "@/lib/schema";
import { SCBKR_SYSTEM_PROMPT } from "@/lib/prompt";
import { AuditResponse } from "@/lib/types";

/**
 * Lightweight Bedrock wrapper.
 *
 * For hackathon portability (and to avoid hard-coding credential logic in demo code),
 * this wrapper supports two deployment patterns:
 * 1) Direct Bedrock-compatible gateway URL via BEDROCK_INVOKE_URL
 * 2) Local/edge proxy that signs AWS requests on behalf of this app
 */
const DEFAULT_MODEL = "anthropic.claude-3-5-sonnet-20240620-v1:0";

function safeJsonParse(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const jsonSlice = start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
  return JSON.parse(jsonSlice);
}

export async function auditWithBedrock(message: string): Promise<AuditResponse> {
  const invokeUrl = process.env.BEDROCK_INVOKE_URL;
  const modelId = process.env.BEDROCK_MODEL_ID || DEFAULT_MODEL;
  const apiKey = process.env.BEDROCK_API_KEY;

  if (!invokeUrl) {
    throw new Error("Missing BEDROCK_INVOKE_URL");
  }

  const requestBody = {
    modelId,
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

  const resp = await fetch(invokeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify(requestBody)
  });

  if (!resp.ok) {
    throw new Error(`Bedrock invoke failed: ${resp.status}`);
  }

  const payload = (await resp.json()) as { content?: { text?: string }[]; output_text?: string };
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
