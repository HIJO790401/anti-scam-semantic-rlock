import { RevisionGateResult } from "@/lib/void-engine/types";

export function evaluateRevisionGate(message: string): RevisionGateResult {
  const hasRevisionClaim = /(我們會修正|我們會改善|我們更新了模型|我們優化了安全|我們修訂了流程|已更新|已經修正|持續優化)/i.test(message);
  if (!hasRevisionClaim) {
    return { revision_state: null, codes: [] };
  }

  const requiredFields = [
    "ERROR_TYPE",
    "ERROR_LAYER",
    "ERROR_BOUNDARY",
    "ERROR_DEFINED_BY",
    "ERROR_RESPONSIBILITY"
  ];

  const missing = requiredFields.filter((field) => !new RegExp(field, "i").test(message));

  if (missing.length > 0) {
    return {
      revision_state: "VOID_REVISION",
      codes: ["revision_claim_missing_required_fields", ...missing.map((m) => `missing_${m.toLowerCase()}`)]
    };
  }

  return { revision_state: "VALID_REVISION", codes: [] };
}
