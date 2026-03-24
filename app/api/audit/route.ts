import { NextRequest, NextResponse } from "next/server";
import { auditRequestSchema, auditSchema } from "@/lib/schema";
import { auditWithBedrock } from "@/lib/bedrock";
import { runFallbackAudit } from "@/lib/fallback";
import { AuditResponse } from "@/lib/types";

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

    if (
      result.scbkr.R < 0.4 && (result.risk_level === "SAFE" || result.risk_level === "UNCLEAR")
    ) {
      const fallback = runFallbackAudit(payload.message, "post-check-r-lock");
      return NextResponse.json({ ...fallback, meta: { ...fallback.meta, latency_ms: Date.now() - started } });
    }

    if (lowConfidence(result)) {
      const fallback = runFallbackAudit(payload.message, "low-confidence-fallback");
      return NextResponse.json({ ...fallback, meta: { ...fallback.meta, latency_ms: Date.now() - started } });
    }

    const validated = auditSchema.parse(result);
    return NextResponse.json({ ...validated, meta: { ...result.meta, latency_ms: Date.now() - started } });
  } catch {
    const message = (() => {
      try {
        return JSON.parse(rawBody).message ?? "";
      } catch {
        return "";
      }
    })();

    const fallback = runFallbackAudit(message, "error-fallback");
    return NextResponse.json({ ...fallback, meta: { ...fallback.meta, latency_ms: Date.now() - started } }, { status: 200 });
  }
}
