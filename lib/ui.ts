import { AuditResponse, ElderOutput, RiskLevel } from "@/lib/types";

export const demoCases: { label: string; message: string }[] = [
  {
    label: "假銀行通知",
    message:
      "這裡是台灣商業銀行客戶服務中心，依照最新資安規範，我們需要確認您的帳戶狀態。請於今日 18:00 前完成重新驗證，以確保服務不中斷：https://secure-bank-check.tw"
  },
  {
    label: "假健保更新",
    message:
      "因應行政院最新防詐政策，需立即更新您的健保資料。請點擊官方連結完成作業：gov-nhi-update.tw 否則您的健保卡將暫時失效。"
  },
  {
    label: "假物流驗證",
    message: "您的包裹因地址異常無法配送。請完成身份確認以重新安排物流：http://re-verify-express.tw"
  },
  { label: "一般不明訊息", message: "你明天有空嗎？可以確認一下付款流程？" },
  { label: "一般安全通知", message: "您好，我們正在更新通知設定，如需要協助再告知。" },
  {
    label: "官方維護公告",
    message: "您好，目前系統將於 3/5 02:00–04:00 進行維護，所有交易服務將暫停。如有疑問請洽官方客服 02-1234-5678。"
  }
];

export function riskMeta(level: RiskLevel) {
  const map = {
    SAFE: { label: "結構大致安全", className: "border-green-500 bg-green-50 text-green-900", badge: "SAFE" },
    UNCLEAR: {
      label: "資訊不足，只能當參考",
      className: "border-slate-400 bg-slate-50 text-slate-900",
      badge: "UNCLEAR"
    },
    RISK: { label: "高風險訊息", className: "border-orange-500 bg-orange-50 text-orange-900", badge: "RISK" },
    SCAM: { label: "高度疑似詐騙", className: "border-red-600 bg-red-50 text-red-900", badge: "SCAM" }
  };
  return map[level];
}

const elderDimensionMap: Record<string, string> = {
  C: "它有叫你做事，但沒把原因講清楚，這種先不要照做。",
  B: "它只催你快點做，卻沒有講清楚要做到哪一步，這種不能直接照做。",
  K: "它沒有給你真正能自己查的正式根據，也沒講清楚代價會落在誰身上，所以不能只看它寫得像不像真的。",
  R: "這則訊息沒有講清楚，萬一出事要找誰負責，所以不能直接信。",
  S: "它沒有讓你清楚知道是誰發的，身分不明就不能直接信。"
};

export function toElderOutput(result: AuditResponse, originalMessage: string): ElderOutput {
  const weakest = Object.entries(result.scbkr)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([dimension]) => elderDimensionMap[dimension]);

  const containsExternalContact = /(http|www\.|\d{2,4}-\d{3,4}-\d{3,4}|客服|連結|網址|login|登入)/i.test(originalMessage);
  const doNot = containsExternalContact
    ? ["不要點它給的連結。", "不要打它給的電話，也不要用它給的客服。"]
    : ["這種先不要照做，也不要急著提供個資。", "先不要在同一則訊息裡回覆任何驗證資訊。"];

  const safeAction = "請改用你平常就知道的官方 App、官方網站或官方電話，自己主動查證。";

  return {
    stop_signal: result.risk_level === "SAFE" ? "先核對一下。" : "先不要信，先停一下。",
    why_not_trust: weakest,
    do_not: doNot,
    safe_action: safeAction
  };
}
