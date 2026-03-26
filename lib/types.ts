export type RiskLevel = "SAFE" | "UNCLEAR" | "RISK" | "SCAM";

export type UserMode = "standard" | "professional" | "elder";

export interface ScbkrScore {
  S: number;
  C: number;
  B: number;
  /** K = Basis & Cost Ground: verifiable basis + where real-world cost/risk lands. */
  K: number;
  R: number;
}

export interface ExplainMode {
  subject_analysis: string;
  cause_analysis: string;
  boundary_analysis: string;
  basis_analysis: string;
  responsibility_analysis: string;
  r_lock_triggered: boolean;
}

export interface GateChecks {
  who_pass: boolean;
  why_pass: boolean;
  true_pass: boolean;
  probabilistic_escape: boolean;
}

export interface ResponsibilityHashBasis {
  version: string;
  final_state: string;
  action_gate: string;
  risk_level: RiskLevel;
  scbkr: ScbkrScore;
  reason_codes: string[];
  claim_validity: "VALID" | "INVALID";
  governance_validity: "VALID" | "INVALID";
  revision_state: "VALID_REVISION" | "VOID_REVISION" | null;
  gate_checks: GateChecks;
  responsibility_summary: {
    subject: string;
    basis_cost: string;
    responsibility: string;
  };
}

export interface AuditMeta {
  model: string;
  fallback_used: boolean;
}

export interface AuditResponse {
  scbkr: ScbkrScore;
  fraud_score: number;
  risk_level: RiskLevel;
  claim_validity?: "VALID" | "INVALID";
  final_2_state?: "REAL_2" | "DRAFT_2" | "SAMPLE_2" | "VOID_2" | "VOID_CLAIM" | "VOID_GOVERNANCE" | "VOID_REVISION" | "VARIANT_DANGER";
  revision_state?: "VALID_REVISION" | "VOID_REVISION" | null;
  error_type?: string[];
  error_layer?: string[];
  void_reason_code?: string[];
  action_gate?: "ALLOW" | "WARN" | "BLOCK" | "SIGN_AND_CONTINUE";
  gate_checks?: GateChecks;
  responsibility_hash?: string;
  hash_basis?: ResponsibilityHashBasis;
  hash_explain?: string;
  reason_en: string;
  reason_zh: string;
  advice_zh: string;
  explain_mode: ExplainMode;
  output_modes?: {
    standard: {
      title_zh: string;
      summary_zh: string;
      advice_zh: string;
      summary_en: string | null;
    };
    professional: {
      title_zh: string;
      summary_zh: string;
      api_note_zh: string;
      raw_structured_view: Record<string, unknown>;
    };
    elder: {
      title_zh: string;
      message_zh: string;
      must_not_do_zh: string[];
      must_do_zh: string[];
    };
  };
  meta: AuditMeta;
}

export interface AuditRequest {
  message: string;
}

export interface ElderOutput {
  stop_signal: string;
  why_not_trust: string[];
  do_not: string[];
  safe_action: string;
}
