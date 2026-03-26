import { RiskLevel, ScbkrScore } from "@/lib/types";
import { buildOutputModes } from "@/lib/void-engine/outputModes";
import { applyRLock } from "@/lib/void-engine/rLock";
import { extractFeatures, normalizeScbkr, SCBKR_THRESHOLDS, weightedStructuralScore } from "@/lib/void-engine/scbkrScoring";
import { evaluateClaimValidity } from "@/lib/void-engine/claimValidity";
import { detectVoidGovernance } from "@/lib/void-engine/voidGovernance";
import { classifyErrorTyping } from "@/lib/void-engine/errorTyping";
import { evaluateRevisionGate } from "@/lib/void-engine/revisionGate";
import { Final2State, VoidEngineInput, VoidEngineVerdict } from "@/lib/void-engine/types";

function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  const rank: Record<RiskLevel, number> = { SAFE: 0, UNCLEAR: 1, RISK: 2, SCAM: 3 };
  return rank[a] > rank[b] ? a : b;
}

function computeRiskFloor(scores: ScbkrScore, sensitive: boolean, weakStructure: boolean, decisionPush: boolean): RiskLevel {
  let risk: RiskLevel = "SAFE";
  if (decisionPush && (scores.S < 0.4 || scores.B < 0.4 || scores.R < 0.4)) risk = "RISK";
  if (sensitive && weakStructure) risk = "SCAM";
  return risk;
}

function determineBaseState(score: ScbkrScore): Final2State {
  if (score.S >= SCBKR_THRESHOLDS.S && score.C >= SCBKR_THRESHOLDS.C && score.B >= SCBKR_THRESHOLDS.B && score.K >= SCBKR_THRESHOLDS.K && score.R >= SCBKR_THRESHOLDS.R) {
    return "REAL_2";
  }
  if (score.S >= 0.7 && score.B >= 0.7 && score.K >= 0.7 && score.R >= 0.7) return "DRAFT_2";
  if (score.S >= 0.5 && score.B >= 0.5 && score.R >= 0.5) return "SAMPLE_2";
  return "VOID_2";
}

function logicZeroScore(): ScbkrScore {
  return { S: 0, C: 0, B: 0, K: 0, R: 0 };
}

export function computeFinalVerdict(input: VoidEngineInput): VoidEngineVerdict {
  const features = extractFeatures(input.message);
  const normalized = normalizeScbkr(input.source.scbkr);

  const rLock = applyRLock(input.message, normalized, features);
  const adjustedScores = rLock.scores;

  const claim = evaluateClaimValidity(input.message, adjustedScores, features);
  const governance = detectVoidGovernance(input.message, features);
  const revisionGate = evaluateRevisionGate(input.message);
  const errorTyping = classifyErrorTyping(input.message);
  const hasWho = features.hasSubjectIdentity;
  const hasWhy = adjustedScores.C >= 0.5 || /(因為|因此|所以|為了|原因|why)/i.test(input.message);
  const hasTrue =
    features.hasBasisSignal &&
    (features.hasOfficialVerificationRoute || features.hasComplaintRoute) &&
    (features.hasResponsibilitySignal || features.hasCostBearerSignal);
  const probabilisticEscape = /(可能|也許|或許|大概|疑似|機率|probability|probably|maybe)/i.test(input.message);
  const whoWhyTrueGateFail = !hasWho || !hasWhy || !hasTrue;
  const gateChecks = {
    who_pass: hasWho,
    why_pass: hasWhy,
    true_pass: hasTrue,
    probabilistic_escape: probabilisticEscape
  };
  const decisionPush =
    features.hasSensitiveAction || features.hasUrgency || /(請完成|請確認|請點擊|請登入|否則|身份驗證|重新驗證|帳號驗證)/i.test(input.message);

  const weakStructure = adjustedScores.S < 0.7 || adjustedScores.B < 0.7 || adjustedScores.R < 0.7;
  let risk = computeRiskFloor(adjustedScores, features.hasSensitiveAction, weakStructure, decisionPush);
  if (rLock.floorRisk) risk = maxRisk(risk, rLock.floorRisk);

  const weighted = weightedStructuralScore(adjustedScores);
  if (risk === "SAFE") {
    risk = weighted >= 0.82 ? "SAFE" : weighted >= 0.65 ? "UNCLEAR" : "RISK";
  }
  if (!decisionPush && claim.state === "VALID" && !governance.isVoidGovernance && revisionGate.revision_state === null && risk !== "SCAM") {
    risk = risk === "SAFE" ? "SAFE" : "UNCLEAR";
  }

  let finalState: Final2State = determineBaseState(adjustedScores);
  let actionGate: VoidEngineVerdict["action_gate"] = risk === "SAFE" ? "ALLOW" : risk === "UNCLEAR" ? "WARN" : "BLOCK";

  const voidReasonCode = [...rLock.reasonCodes, ...claim.codes, ...governance.codes, ...revisionGate.codes];
  if (whoWhyTrueGateFail) voidReasonCode.push("whoWhyTrueGateFail");
  if (probabilisticEscape) voidReasonCode.push("probabilisticEscape");

  const hardClaimCodes = new Set([
    "fakeVerification",
    "urgentSensitiveRequest",
    "costCauseVoid",
    "threatWithoutGround",
    "grayScam"
  ]);
  const hardClaimFail = claim.codes.some((c) => hardClaimCodes.has(c));

  if (claim.state === "INVALID" && hardClaimFail) {
    finalState = "VOID_CLAIM";
    actionGate = "BLOCK";
  } else if (claim.state === "INVALID") {
    finalState = "VOID_2";
    actionGate = "WARN";
    risk = maxRisk(risk, "UNCLEAR");
  }
  if (governance.isVoidGovernance) {
    finalState = "VOID_GOVERNANCE";
    actionGate = "BLOCK";
  }
  if (revisionGate.revision_state === "VOID_REVISION") {
    finalState = governance.isVoidGovernance ? "VOID_GOVERNANCE" : "VOID_REVISION";
    actionGate = "BLOCK";
  }
  if (whoWhyTrueGateFail || probabilisticEscape) {
    finalState = "VOID_GOVERNANCE";
    actionGate = "BLOCK";
    risk = maxRisk(risk, "RISK");
  }

  if (risk === "SCAM" && finalState !== "VOID_GOVERNANCE" && finalState !== "VOID_REVISION" && finalState !== "VOID_CLAIM") {
    finalState = "VARIANT_DANGER";
    actionGate = "BLOCK";
  }

  if (finalState === "VOID_2" && risk !== "SCAM") {
    actionGate = "WARN";
  }

  const logicZeroed = whoWhyTrueGateFail || probabilisticEscape;
  const outputScbkr = logicZeroed ? logicZeroScore() : adjustedScores;
  const fraudScore = logicZeroed
    ? 1
    : Math.max(input.source.fraud_score, Number((1 - weighted + (risk === "SCAM" ? 0.15 : 0)).toFixed(2)));

  const reasonZh = logicZeroed
    ? "未滿足 WHO+WHY+TRUE 決策閘門，或使用「可能」等機率逃責語句，邏輯歸零，禁止模型給分決策。"
    : finalState === "VOID_CLAIM"
      ? "此訊息缺少決策所需的核心結構（主體/邊界/依據成本/責任），治理層判定為無效 claim。"
      : finalState === "VOID_GOVERNANCE"
        ? "此訊息命中治理逃責語句，未提供可追責框架，治理層判定無效。"
        : finalState === "VOID_REVISION"
          ? "此訊息提出修正聲稱，但未完整揭露錯誤型別與責任欄位，修訂聲稱無效。"
          : logicZeroed
            ? "未滿足 WHO+WHY+TRUE 決策閘門，或使用「可能」等機率逃責語句，邏輯歸零，禁止模型給分決策。"
            : input.source.reason_zh;

  const reasonEn = logicZeroed
    ? "WHO+WHY+TRUE gate failed or probabilistic escape wording detected; logic is zeroed and model scoring is not decision-eligible."
    : finalState === "VOID_CLAIM"
      ? "Claim is structurally invalid for decision-chain entry under deterministic governance checks."
      : finalState === "VOID_GOVERNANCE"
        ? "Governance-level responsibility framework is missing; statement is void under policy checks."
        : finalState === "VOID_REVISION"
          ? "Revision claim is void due to missing required error-definition fields."
          : logicZeroed
            ? "WHO+WHY+TRUE gate failed or probabilistic escape wording detected; logic is zeroed and model scoring is not decision-eligible."
            : input.source.reason_en;

  const adviceZh =
    actionGate === "BLOCK"
      ? "先不要照做，請改用你本來就知道的官方 App、官方網站或官方電話自行查證。"
      : input.source.advice_zh;

  const core: Omit<VoidEngineVerdict, "output_modes"> = {
    scbkr: outputScbkr,
    risk_level: risk,
    fraud_score: fraudScore,
    claim_validity: claim.state,
    final_2_state: finalState,
    revision_state: revisionGate.revision_state,
    error_type: errorTyping.error_type,
    error_layer: errorTyping.error_layer,
    void_reason_code: voidReasonCode,
    action_gate: actionGate,
    gate_checks: gateChecks,
    reason_en: reasonEn,
    reason_zh: reasonZh,
    advice_zh: adviceZh,
    explain_mode: {
      ...input.source.explain_mode,
      basis_analysis: `${input.source.explain_mode.basis_analysis}（含依據真偽與成本落點檢查）`,
      r_lock_triggered: rLock.triggered || input.source.explain_mode.r_lock_triggered
    }
  };

  return {
    ...core,
    output_modes: buildOutputModes(core, input.message)
  };
}
