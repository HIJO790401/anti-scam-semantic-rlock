export type RiskLevel = "SAFE" | "UNCLEAR" | "RISK" | "SCAM";

export type UserMode = "standard" | "professional" | "elder";

export interface ScbkrScore {
  S: number;
  C: number;
  B: number;
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

export interface AuditMeta {
  model: string;
  fallback_used: boolean;
}

export interface AuditResponse {
  scbkr: ScbkrScore;
  fraud_score: number;
  risk_level: RiskLevel;
  reason_en: string;
  reason_zh: string;
  advice_zh: string;
  explain_mode: ExplainMode;
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
