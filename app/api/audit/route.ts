import { NextRequest, NextResponse } from "next/server";
import { auditRequestSchema, auditSchema } from "@/lib/schema";
import {
  auditWithBedrock,
  buildBedrockRequestUrl,
  resolveAwsRegion,
  resolveBedrockModelId,
  resolveCredentialSource,
  resolveStrictMode
} from "@/lib/bedrock";
import { runFallbackAudit } from "@/lib/fallback";
import { AuditResponse } from "@/lib/types";
import { runVoidEngine } from "@/lib/void-engine";
import { buildResponsibilityHashBasis, computeResponsibilityHash, RESPONSIBILITY_HASH_EXPLAIN } from "@/lib/responsibility-hash";

function lowConfidence(result: AuditResponse): boolean {
  const sensitiveMismatch =
    /(點擊|連結|http|otp|密碼|登入|帳戶|匯款)/.test(result.reason_zh) === false && result.risk_level === "SAFE";
  return result.fraud_score < 0.05 || sensitiveMismatch;
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  let rawBody = "";

  try {
    rawBody = await request.text();
    const json = JSON.parse(rawBody);
    const payload = auditRequestSchema.parse(json);

    const provider = process.env.LLM_PROVIDER || "bedrock";
    const strictMode = resolveStrictMode();
    let result: AuditResponse;

    if (provider === "bedrock") {
      result = await auditWithBedrock(payload.message);
    } else {
      result = runFallbackAudit(payload.message, `mock:${provider}`);
      result.meta.fallback_used = false;
      result.meta.model = `mock:${provider}`;
    }

    let sourceForEngine = result;
    if (provider === "bedrock" && strictMode) {
      const deterministic = runFallbackAudit(payload.message, "deterministic-strict");
      sourceForEngine = {
        ...deterministic,
        explain_mode: result.explain_mode,
        meta: {
          model: result.meta.model,
          fallback_used: false
        }
      };
    }

    if (!strictMode && lowConfidence(result)) {
      sourceForEngine = runFallbackAudit(payload.message, "low-confidence-fallback");
      sourceForEngine.meta.model = `${result.meta.model}|fallback`;
    }

    const parsedSource = auditSchema.parse(sourceForEngine);
    const engineVerdict = runVoidEngine(payload.message, { ...parsedSource, meta: sourceForEngine.meta });
    const hashBasis = buildResponsibilityHashBasis(engineVerdict);
    return NextResponse.json({
      ...engineVerdict,
      responsibility_hash: computeResponsibilityHash(hashBasis),
      hash_basis: hashBasis,
      hash_explain: RESPONSIBILITY_HASH_EXPLAIN,
      meta: { ...sourceForEngine.meta, latency_ms: Date.now() - started }
    });
  } catch (error) {
    const err = error as Error;
    const cause = err && "cause" in err ? (err as Error & { cause?: unknown }).cause : undefined;
    const causeObj = cause as { name?: string; message?: string; code?: string } | undefined;
    const modelId = (() => {
      try {
        return resolveBedrockModelId();
      } catch {
        return "MISSING_BEDROCK_MODEL_ID";
      }
    })();
    const awsRegion = resolveAwsRegion();
    const strictMode = resolveStrictMode();
    const useSdkMode = process.env.BEDROCK_USE_SDK !== "false";
    const invokeUrl = process.env.BEDROCK_INVOKE_URL || "N/A";
    const requestUrl = useSdkMode ? buildBedrockRequestUrl(awsRegion, modelId) : invokeUrl;

    console.error("[/api/audit] Bedrock/Audit failure", {
      error_name: err?.name ?? "UnknownError",
      error_message: err?.message ?? "unknown",
      error_stack: err?.stack ?? "no-stack",
      error_cause_name: causeObj?.name ?? "none",
      error_cause_message: causeObj?.message ?? "none",
      error_cause_code: causeObj?.code ?? "none",
      resolved_model_id: modelId,
      aws_region: awsRegion,
      use_sdk_mode: useSdkMode,
      credential_source: resolveCredentialSource(useSdkMode),
      strict_mode: strictMode,
      request_url: requestUrl
    });

    const message = (() => {
      try {
        return JSON.parse(rawBody).message ?? "";
      } catch {
        return "";
      }
    })();

    const fallback = runFallbackAudit(message, "error-fallback");
    const engineVerdict = runVoidEngine(message, fallback);
    const hashBasis = buildResponsibilityHashBasis(engineVerdict);
    return NextResponse.json(
      {
        ...engineVerdict,
        responsibility_hash: computeResponsibilityHash(hashBasis),
        hash_basis: hashBasis,
        hash_explain: RESPONSIBILITY_HASH_EXPLAIN,
        meta: { ...fallback.meta, latency_ms: Date.now() - started }
      },
      { status: 200 }
    );
  }
}
