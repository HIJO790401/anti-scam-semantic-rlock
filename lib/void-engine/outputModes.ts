import { ScbkrScore } from "@/lib/types";
import { OutputModes, VoidEngineVerdict } from "@/lib/void-engine/types";

const elderReasonMap: Record<keyof ScbkrScore, string> = {
  S: "它沒有讓你清楚知道是誰發的，身分不明很危險。",
  C: "它叫你做事，但沒把原因講清楚。",
  B: "它沒有講清楚要做到哪一步、期限和範圍。",
  K: "它沒有給你可自己查的正式根據，也沒講清楚代價落在哪裡。",
  R: "它沒有講清楚出事要找誰負責。"
};

export function buildOutputModes(core: Omit<VoidEngineVerdict, "output_modes">, message: string): OutputModes {
  const weakest = Object.entries(core.scbkr)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k as keyof ScbkrScore);

  const elderPriority = weakest.filter((k) => ["C", "B", "K", "R"].includes(k)).slice(0, 2);
  const finalWeak = elderPriority.length === 2 ? elderPriority : weakest.slice(0, 2);

  const hasContact = /(http|www\.|[a-z0-9-]+\.(tw|com|net|org)|客服|電話|網址|login|登入|驗證入口|\d{2,4}-\d{3,4}-\d{3,4})/i.test(message);
  const logicZeroGate =
    core.void_reason_code.includes("whoWhyTrueGateFail") || core.void_reason_code.includes("probabilisticEscape");
  const professionalGapNote =
    logicZeroGate
      ? "命中 WHO+WHY+TRUE 決策閘門失敗或機率逃責語句；模型分數已歸零，不具決策資格。"
      : core.final_2_state === "VOID_REVISION" || core.revision_state === "VOID_REVISION"
      ? "修正聲稱缺少 ERROR_TYPE / ERROR_LAYER / ERROR_BOUNDARY / ERROR_DEFINED_BY / ERROR_RESPONSIBILITY，且未說明 owner / timeline。"
      : core.final_2_state === "VOID_GOVERNANCE"
        ? "命中治理逃責語句：主體、範圍或責任承擔者未被具體定義。"
        : "此結果為 deterministic-first VOID Engine 輸出；LLM 只作結構抽取參考。";

  return {
    standard: {
      title_zh: `${core.final_2_state}｜${core.risk_level}`,
      summary_zh: core.reason_zh,
      advice_zh: core.advice_zh,
      summary_en: core.reason_en
    },
    professional: {
      title_zh: `治理判定：${core.final_2_state}`,
      summary_zh: `${core.reason_zh}（claim=${core.claim_validity}, gate=${core.action_gate}）`,
      api_note_zh: professionalGapNote,
      raw_structured_view: {
        final_2_state: core.final_2_state,
        void_reason_code: core.void_reason_code,
        gate_checks: core.gate_checks,
        error_type: core.error_type,
        error_layer: core.error_layer,
        revision_state: core.revision_state,
        scbkr: core.scbkr
      }
    },
    elder: {
      title_zh: core.action_gate === "BLOCK" ? "先不要信，先停一下" : "先確認一下",
      message_zh:
        core.action_gate === "BLOCK"
          ? `先不要照做。${finalWeak.map((k) => elderReasonMap[k]).join(" ")}如果照做，可能會造成帳號、個資或金錢損失。`
          : `先不用緊張，先確認資訊再決定。${finalWeak.map((k) => elderReasonMap[k]).join(" ")}先用你熟悉的官方方式查證。`,
      must_not_do_zh: hasContact
        ? ["不要打它給的電話。", "不要點它給的連結。", "不要用它給的客服。"]
        : ["先不要提供密碼、驗證碼或身分資料。", "先不要照訊息指示操作。"],
      must_do_zh: ["請改用你本來就知道的官方 App 查證。", "或自己找官方網站、官方電話再確認。"]
    }
  };
}
