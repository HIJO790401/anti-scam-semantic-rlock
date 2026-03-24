import { z } from "zod";

export const auditSchema = z.object({
  scbkr: z.object({
    S: z.number().min(0).max(1),
    C: z.number().min(0).max(1),
    B: z.number().min(0).max(1),
    K: z.number().min(0).max(1),
    R: z.number().min(0).max(1)
  }),
  fraud_score: z.number().min(0).max(1),
  risk_level: z.enum(["SAFE", "UNCLEAR", "RISK", "SCAM"]),
  reason_en: z.string().min(1),
  reason_zh: z.string().min(1),
  advice_zh: z.string().min(1),
  explain_mode: z.object({
    subject_analysis: z.string(),
    cause_analysis: z.string(),
    boundary_analysis: z.string(),
    basis_analysis: z.string(),
    responsibility_analysis: z.string(),
    r_lock_triggered: z.boolean()
  })
});

export const auditRequestSchema = z.object({
  message: z.string().min(1).max(5000)
});
