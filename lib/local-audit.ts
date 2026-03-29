import { runFallbackAudit } from "@/lib/fallback";
import { buildResponsibilityHashBasis, computeResponsibilityHashAsync, RESPONSIBILITY_HASH_EXPLAIN } from "@/lib/responsibility-hash";
import { runVoidEngine } from "@/lib/void-engine";
import { AuditResponse } from "@/lib/types";

export async function runLocalAudit(message: string): Promise<AuditResponse> {
  const fallback = runFallbackAudit(message, "github-pages-local");
  const verdict = runVoidEngine(message, fallback);
  const hashBasis = buildResponsibilityHashBasis(verdict);

  return {
    ...verdict,
    responsibility_hash: await computeResponsibilityHashAsync(hashBasis),
    hash_basis: hashBasis,
    hash_explain: RESPONSIBILITY_HASH_EXPLAIN,
    meta: {
      ...fallback.meta,
      model: "github-pages-local",
      fallback_used: true
    }
  };
}
