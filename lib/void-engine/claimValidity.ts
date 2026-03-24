import { ScbkrScore } from "@/lib/types";
import { ClaimValidityResult, ExtractedFeatures } from "@/lib/void-engine/types";

export function evaluateClaimValidity(message: string, score: ScbkrScore, f: ExtractedFeatures): ClaimValidityResult {
  const codes: string[] = [];
  const decisionPush = f.hasSensitiveAction || f.hasUrgency || /(請完成|請確認|請點擊|請登入|否則|身份驗證|重新驗證|帳號驗證|轉帳|匯款)/i.test(message);

  if ((!f.hasSubjectIdentity || score.S < 0.4) && decisionPush) codes.push("noSubject");
  if ((!f.hasBoundarySignal || score.B < 0.4) && decisionPush) codes.push("noBoundary");
  if ((!f.hasBasisSignal || score.K < 0.45) && decisionPush) codes.push("noBasis");
  if ((!f.hasResponsibilitySignal || score.R < 0.4) && decisionPush) codes.push("noResponsibility");

  if (f.hasOfficialClaim && !f.hasOfficialVerificationRoute && decisionPush) codes.push("fakeVerification");
  if (f.hasUrgency && f.hasSensitiveAction && (score.S < 0.7 || score.B < 0.7 || score.R < 0.7)) codes.push("urgentSensitiveRequest");

  if (/(你朋友|你同事|你家人|代辦)/i.test(message) && score.S < 0.6) codes.push("subjectContextShift");
  if (f.hasSensitiveAction && score.C < 0.5 && score.K < 0.5) codes.push("costCauseVoid");
  if (/(停權|凍結|追訴|法律責任|帳戶停用)/i.test(message) && score.K < 0.6) codes.push("threatWithoutGround");
  if (f.hasSensitiveAction && /(可能|疑似|參考|建議)/i.test(message) && score.R < 0.6) codes.push("grayScam");

  return {
    state: codes.length > 0 ? "INVALID" : "VALID",
    codes
  };
}
