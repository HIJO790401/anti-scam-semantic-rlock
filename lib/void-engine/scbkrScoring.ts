import { ScbkrScore } from "@/lib/types";
import { ExtractedFeatures } from "@/lib/void-engine/types";

const clamp01 = (n: number) => Math.max(0, Math.min(1, Number(n.toFixed(2))));

export const SCBKR_THRESHOLDS: ScbkrScore = {
  S: 0.9,
  C: 0.8,
  B: 0.9,
  K: 0.85,
  R: 0.95
};

export const SCBKR_WEIGHTS: ScbkrScore = {
  S: 0.25,
  C: 0.15,
  B: 0.2,
  K: 0.15,
  R: 0.25
};

export function normalizeScbkr(input: Partial<ScbkrScore>): ScbkrScore {
  return {
    S: clamp01(input.S ?? 0),
    C: clamp01(input.C ?? 0),
    B: clamp01(input.B ?? 0),
    K: clamp01(input.K ?? 0),
    R: clamp01(input.R ?? 0)
  };
}

export function weightedStructuralScore(score: ScbkrScore): number {
  const total =
    score.S * SCBKR_WEIGHTS.S +
    score.C * SCBKR_WEIGHTS.C +
    score.B * SCBKR_WEIGHTS.B +
    score.K * SCBKR_WEIGHTS.K +
    score.R * SCBKR_WEIGHTS.R;
  return clamp01(total);
}

export function extractFeatures(message: string): ExtractedFeatures {
  const msg = message || "";

  const hasExternalContactInMessage = /(http|www\.|[a-z0-9-]+\.(tw|com|net|org)|電話|客服|連結|網址|login|登入|驗證入口|02-\d{4}-\d{4}|\d{2,4}-\d{3,4}-\d{3,4})/i.test(msg);

  return {
    hasUrgency: /(立即|馬上|緊急|立刻|限時|今日|今天|逾期|停用|失效|18:00|24小時)/i.test(msg),
    hasSensitiveAction: /(匯款|轉帳|otp|驗證碼|密碼|登入|login|帳號確認|帳戶確認|身分驗證|提供證件|點擊連結)/i.test(msg),
    hasOfficialClaim: /(官方|政府|行政院|銀行|健保|法院|檢警|金融|法規)/i.test(msg),
    hasOfficialVerificationRoute: /(官方網站|官方App|官方客服|客服專線|臨櫃|分行|公文號|案號)/i.test(msg),
    hasSubjectIdentity: /(台灣|銀行|公司|單位|客服中心|客服|機關|署|局|商業銀行|中華郵政|系統通知|維護通知)/i.test(msg),
    hasBoundarySignal: /(\d{1,2}:\d{2}|期限|金額|範圍|至|前完成|步驟|第\d步|僅限|僅於)/i.test(msg),
    hasBasisSignal: /(依據|合約|條款|公文|規範|政策|案號|reference|official|法律|維護|公告|通知設定)/i.test(msg),
    hasResponsibilitySignal: /(負責|賠償|申訴|責任窗口|承辦|機關|受理|承擔|追責)/i.test(msg),
    hasComplaintRoute: /(申訴|客服專線|官方客服|受理窗口|金管會|警政署|165)/i.test(msg),
    hasCostBearerSignal: /(本公司承擔|由本單位負責|若有損失|賠償機制|保證|責任歸屬)/i.test(msg),
    hasExternalContactInMessage,
    hasRevisionClaim: /(我們會修正|我們會改善|我們已更新|我們已優化|我們修訂|模型升級|流程修訂)/i.test(msg),
    fakeOfficialStyle: /(依照.*規範|官方通知|最新政策).*(立即|點擊|驗證)/i.test(msg)
  };
}
