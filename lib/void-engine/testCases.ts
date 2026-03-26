import { runFallbackAudit } from "@/lib/fallback";
import { runVoidEngine } from "@/lib/void-engine";

export const voidEngineTestCases = [
  {
    name: "fake_bank_urgent_link",
    message:
      "這裡是台灣商業銀行客戶服務中心，請於今日18:00前完成帳戶驗證：https://secure-bank-check.tw，否則將停用。"
  },
  {
    name: "governance_escape",
    message: "我們只是機率式系統，很多人都這樣認為，法規會處理，請自行承擔。"
  },
  {
    name: "revision_claim_missing_fields",
    message: "我們會修正並優化流程，請大家放心。"
  },
  {
    name: "causal_only_boundary_blur_no_accountability",
    message:
      "這段訊息只有說因果，但邊界模糊，成本與依據不平衡，最後沒有誰承擔，直接VOID。1+1=2不是對不對，而是這句話在哪個場景對，對到哪裡失效。"
  },
  {
    name: "probabilistic_escape_should_logic_zero",
    message: "可能是官方流程，大家也許可以先照做看看，後續再說。"
  }
];

export function runVoidEngineSelfCheck() {
  return voidEngineTestCases.map((tc) => {
    const source = runFallbackAudit(tc.message, "self-check");
    const verdict = runVoidEngine(tc.message, source);
    return {
      name: tc.name,
      final_2_state: verdict.final_2_state,
      risk_level: verdict.risk_level,
      action_gate: verdict.action_gate,
      void_reason_code: verdict.void_reason_code
    };
  });
}
