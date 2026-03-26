import { AuditResponse } from "@/lib/types";

const DEFAULT_REGION = "us-west-2";

type CredentialSource = "none";

function resolveAwsRegion(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || DEFAULT_REGION;
}

function resolveStrictMode(): boolean {
  const mode = process.env.DECISION_ENGINE_MODE?.trim().toLowerCase() || "strict";
  return mode !== "relaxed";
}

function resolveBedrockModelId(): string {
  const modelId = process.env.BEDROCK_MODEL_ID?.trim();
  if (!modelId) throw new Error("Missing BEDROCK_MODEL_ID");
  return modelId;
}

function resolveCredentialSource(): CredentialSource {
  return "none";
}

function buildBedrockRequestUrl(region: string, modelId: string): string {
  return `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`;
}

async function auditWithBedrock(): Promise<AuditResponse> {
  throw new Error("Bedrock disabled in restore-build mode");
}

export {
  auditWithBedrock,
  buildBedrockRequestUrl,
  resolveAwsRegion,
  resolveBedrockModelId,
  resolveCredentialSource,
  resolveStrictMode
};
