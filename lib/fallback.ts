import { AuditResponse, RiskLevel, ScbkrScore } from "@/lib/types";

const urgentRegex = /(立即|馬上|緊急|urgent|today|今日|18:00|失效|停用|封鎖|逾期)/i;
const sensitiveRegex = /(轉帳|匯款|otp|驗證碼|密碼|password|login|登入|帳戶|account|身分確認|重新驗證|點擊|連結|網址|http)/i;
const senderRegex = /(銀行|健保|行政院|客服|official|公司|政府|台灣商業銀行|中華郵政|物流)/i;
const basisRegex = /(合約|policy|政策|官方app|官方網站|客服專線|reference|公文|案號)/i;
const fakeOfficialRegex = /(行政院|健保|銀行|政府|官方).*(更新|驗證|確認|失效|中斷)/i;

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function deriveRisk(score: ScbkrScore, sensitive: boolean, fakeOfficial: boolean): RiskLevel {
  if (score.R < 0.4 || score.S < 0.4 || score.B < 0.4) return "RISK";
  if (sensitive && (score.K < 0.5 || score.R < 0.5)) return "SCAM";
  if (fakeOfficial && score.R < 0.5) return "SCAM";
  if (score.C < 0.55 || score.K < 0.55) return "UNCLEAR";
  return "SAFE";
}

export function runFallbackAudit(message: string, reason = "fallback"): AuditResponse {
  const hasUrgent = urgentRegex.test(message);
  const hasSensitive = sensitiveRegex.test(message);
  const hasSender = senderRegex.test(message);
  const hasBasis = basisRegex.test(message);
  const fakeOfficial = fakeOfficialRegex.test(message);
  const hasResponsibilityChannel = /(客服\s?\d|官方客服|申訴|窗口|責任|賠償|02-\d{4}-\d{4})/i.test(message);

  const score: ScbkrScore = {
    S: hasSender ? 0.62 : 0.25,
    C: hasUrgent && hasSensitive ? 0.3 : 0.62,
    B: /(\d{1,2}:\d{2}|前|期限|範圍|金額)/.test(message) ? 0.58 : 0.35,
    K: hasBasis ? 0.65 : 0.25,
    R: hasResponsibilityChannel ? 0.62 : 0.2
  };

  // Non-sensitive casual message: keep as UNCLEAR instead of over-escalating to fraud.
  if (!hasSensitive && !hasUrgent) {
    score.S = hasSender ? 0.7 : 0.58;
    score.C = 0.64;
    score.B = score.B > 0.55 ? Math.max(score.B, 0.68) : 0.62;
    score.K = hasBasis ? Math.max(score.K, 0.66) : 0.6;
    score.R = hasResponsibilityChannel ? Math.max(score.R, 0.7) : 0.6;
  }

  if (hasUrgent && hasSensitive && !hasSender) {
    score.S = 0.2;
    score.C = 0.2;
    score.R = 0.15;
  }

  if (!hasSender && !hasBasis) {
    score.S = Math.min(score.S, 0.25);
    score.K = Math.min(score.K, 0.2);
  }

  if (!hasResponsibilityChannel) {
    score.R = Math.min(score.R, 0.25);
  }

  const risk = deriveRisk(score, hasSensitive, fakeOfficial);
  const fraudScore = clamp(1 - (score.S + score.C + score.B + score.K + score.R) / 5 + (risk === "SCAM" ? 0.2 : 0));

  return {
    scbkr: score,
    fraud_score: fraudScore,
    risk_level: risk,
    reason_en:
      risk === "SAFE"
        ? "Message has relatively complete structure with no obvious sensitive coercion."
        : "Structural responsibility is weak or sensitive actions are requested without verifiable accountability.",
    reason_zh:
      risk === "SAFE"
        ? "訊息內容相對完整，且未強迫你進行敏感操作。"
        : "這則訊息要求你做敏感操作，但沒有可驗證的責任與正式查核依據。",
    advice_zh:
      risk === "SAFE"
        ? "仍建議透過你熟悉的官方管道再次確認。"
        : "先不要照做，請改用你原本就知道的官方 App、官方網站或客服電話查證。",
    explain_mode: {
      subject_analysis: hasSender ? "有提到單位名稱，但仍需自行查證是否真實。" : "發送者身分不清楚，無法確認誰負責。",
      cause_analysis: hasUrgent && hasSensitive ? "以急迫語氣要求敏感操作，因果鏈薄弱。" : "有基本原因描述，但細節仍不足。",
      boundary_analysis: score.B > 0.5 ? "有時間或範圍資訊，但規則並不完整。" : "缺少明確範圍、步驟或限制說明。",
      basis_analysis: hasBasis
        ? "有提到政策或官方字眼，但仍缺少可獨立驗證來源與成本落點說明。"
        : "沒有提供可自行驗證的正式依據，也沒說清楚照做後風險成本由誰承擔。",
      responsibility_analysis: hasResponsibilityChannel
        ? "有提供責任窗口跡象，但仍要使用既有官方管道確認。"
        : "未說明出事時誰負責、如何追責，責任不可驗。",
      r_lock_triggered: score.R < 0.4
    },
    meta: {
      model: reason,
      fallback_used: true
    }
  };
}
