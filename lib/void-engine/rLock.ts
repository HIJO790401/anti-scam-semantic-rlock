import { RiskLevel, ScbkrScore } from "@/lib/types";
import { ExtractedFeatures } from "@/lib/void-engine/types";

interface RLockResult {
  scores: ScbkrScore;
  triggered: boolean;
  floorRisk: RiskLevel | null;
  reasonCodes: string[];
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, Number(n.toFixed(2))));

export function applyRLock(message: string, input: ScbkrScore, features: ExtractedFeatures): RLockResult {
  const reasons: string[] = [];

  const unverifiedSender = !features.hasSubjectIdentity || (features.hasOfficialClaim && !features.hasOfficialVerificationRoute);
  const implicitResponsibilityOnly = !features.hasResponsibilitySignal;
  const noComplaintRoute = !features.hasComplaintRoute;
  const noCostBearer = !features.hasCostBearerSignal;
  const polishedButUnaccountable = features.fakeOfficialStyle && !features.hasResponsibilitySignal;

  const shouldTrigger = unverifiedSender || implicitResponsibilityOnly || noComplaintRoute || noCostBearer || polishedButUnaccountable;

  if (!shouldTrigger) {
    return { scores: input, triggered: false, floorRisk: null, reasonCodes: [] };
  }

  if (unverifiedSender) reasons.push("rlock_unverified_sender");
  if (implicitResponsibilityOnly) reasons.push("rlock_implicit_responsibility_only");
  if (noComplaintRoute) reasons.push("rlock_no_complaint_route");
  if (noCostBearer) reasons.push("rlock_no_cost_bearer");
  if (polishedButUnaccountable) reasons.push("rlock_polished_without_accountability");

  const adjustedR = clamp01(Math.min(input.R, 0.3));
  const adjustedScores: ScbkrScore = { ...input, R: adjustedR };

  const floorRisk: RiskLevel = features.hasSensitiveAction ? "SCAM" : "RISK";

  return {
    scores: adjustedScores,
    triggered: true,
    floorRisk,
    reasonCodes: reasons
  };
}
