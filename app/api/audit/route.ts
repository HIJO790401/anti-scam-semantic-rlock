import { NextRequest, NextResponse } from "next/server";
import { auditRequestSchema, auditSchema } from "@/lib/schema";
import { auditWithBedrock } from "@/lib/bedrock";
import { runFallbackAudit } from "@/lib/fallback";
import { AuditResponse } from "@/lib/types";
import { runVoidEngine } from "@/lib/void-engine";

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
    let result: AuditResponse;

    if (provider === "bedrock") {
      result = await auditWithBedrock(payload.message);
    } else {
      result = runFallbackAudit(payload.message, `mock:${provider}`);
      result.meta.fallback_used = false;
      result.meta.model = `mock:${provider}`;
    }

    let sourceForEngine = result;
    if (lowConfidence(result)) {
      sourceForEngine = runFallbackAudit(payload.message, "low-confidence-fallback");
      sourceForEngine.meta.model = `${result.meta.model}|fallback`;
    }

    const parsedSource = auditSchema.parse(sourceForEngine);
    const engineVerdict = runVoidEngine(payload.message, { ...parsedSource, meta: sourceForEngine.meta });
    return NextResponse.json({ ...engineVerdict, meta: { ...sourceForEngine.meta, latency_ms: Date.now() - started } });
  } catch {
    const message = (() => {
      try {
        return JSON.parse(rawBody).message ?? "";
      } catch {
        return "";
      }
    })();

    const fallback = runFallbackAudit(message, "error-fallback");
    const engineVerdict = runVoidEngine(message, fallback);
    return NextResponse.json({ ...engineVerdict, meta: { ...fallback.meta, latency_ms: Date.now() - started } }, { status: 200 });
  }
}
