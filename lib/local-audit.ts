import { runFallbackAudit } from "@/lib/fallback";
import { runVoidEngine } from "@/lib/void-engine";
import { AuditResponse } from "@/lib/types";

export function runLocalAudit(message: string): AuditResponse {
  const fallback = runFallbackAudit(message, "github-pages-local");
  const verdict = runVoidEngine(message, fallback);

  return {
    ...verdict,
    meta: {
      ...fallback.meta,
      model: "github-pages-local",
      fallback_used: true
    }
  };
}
