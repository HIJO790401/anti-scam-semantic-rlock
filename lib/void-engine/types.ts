import { AuditResponse, ExplainMode, GateChecks, RiskLevel, ScbkrScore } from "@/lib/types";

export type Final2State =
  | "REAL_2"
  | "DRAFT_2"
  | "SAMPLE_2"
  | "VOID_2"
  | "VOID_CLAIM"
  | "VOID_GOVERNANCE"
  | "VOID_REVISION"
  | "VARIANT_DANGER";

export type ClaimValidityState = "VALID" | "INVALID";
export type RevisionState = "VALID_REVISION" | "VOID_REVISION" | null;
export type ActionGate = "ALLOW" | "WARN" | "BLOCK" | "SIGN_AND_CONTINUE";

export type ErrorType =
  | "SCENE_ERROR"
  | "ALGORITHM_ERROR"
  | "RESPONSIBILITY_ERROR"
  | "DEFINITION_ERROR"
  | "COST_ERROR"
  | "BOUNDARY_ERROR"
  | "VALIDATION_ERROR"
  | "OWNER_ERROR"
  | "COMPARISON_ERROR"
  | "UNKNOWN_ERROR";

export type ErrorLayer =
  | "INPUT_LAYER"
  | "DEFINITION_LAYER"
  | "RULE_LAYER"
  | "ALGORITHM_LAYER"
  | "SCENE_LAYER"
  | "CLAIM_LAYER"
  | "RESPONSIBILITY_LAYER"
  | "VALIDATOR_LAYER"
  | "OUTPUT_LAYER";

export interface ExtractedFeatures {
  hasUrgency: boolean;
  hasSensitiveAction: boolean;
  hasOfficialClaim: boolean;
  hasOfficialVerificationRoute: boolean;
  hasSubjectIdentity: boolean;
  hasBoundarySignal: boolean;
  hasBasisSignal: boolean;
  hasResponsibilitySignal: boolean;
  hasComplaintRoute: boolean;
  hasCostBearerSignal: boolean;
  hasExternalContactInMessage: boolean;
  hasRevisionClaim: boolean;
  fakeOfficialStyle: boolean;
}

export interface ClaimValidityResult {
  state: ClaimValidityState;
  codes: string[];
}

export interface GovernanceResult {
  isVoidGovernance: boolean;
  codes: string[];
}

export interface ErrorTypingResult {
  error_type: ErrorType[];
  error_layer: ErrorLayer[];
}

export interface RevisionGateResult {
  revision_state: RevisionState;
  codes: string[];
}

export interface StandardOutput {
  title_zh: string;
  summary_zh: string;
  advice_zh: string;
  summary_en: string | null;
}

export interface ProfessionalOutput {
  title_zh: string;
  summary_zh: string;
  api_note_zh: string;
  raw_structured_view: Record<string, unknown>;
}

export interface ElderModeOutput {
  title_zh: string;
  message_zh: string;
  must_not_do_zh: string[];
  must_do_zh: string[];
}

export interface OutputModes {
  standard: StandardOutput;
  professional: ProfessionalOutput;
  elder: ElderModeOutput;
}

export interface VoidEngineInput {
  message: string;
  source: AuditResponse;
}

export interface VoidEngineVerdict {
  scbkr: ScbkrScore;
  risk_level: RiskLevel;
  fraud_score: number;
  claim_validity: ClaimValidityState;
  final_2_state: Final2State;
  revision_state: RevisionState;
  error_type: ErrorType[];
  error_layer: ErrorLayer[];
  void_reason_code: string[];
  action_gate: ActionGate;
  gate_checks: GateChecks;
  reason_en: string;
  reason_zh: string;
  advice_zh: string;
  explain_mode: ExplainMode;
  output_modes: OutputModes;
}
