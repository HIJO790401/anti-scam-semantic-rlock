import { ResponsibilityHashBasis } from "@/lib/types";
import { VoidEngineVerdict } from "@/lib/void-engine/types";

const GOVERNANCE_CODES = new Set([
  "fakeProReferral",
  "delayEscape",
  "fakeNeutrality",
  "responsibilityEscape",
  "comparisonVoid",
  "frameworkScopeViolation",
  "causalOnlyStructureVoid",
  "whoWhyTrueGateFail",
  "probabilisticEscape"
]);

function stableSort(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableSort);
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries.map(([k, v]) => [k, stableSort(v)]));
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableSort(value));
}

function fallbackHashHex(input: string): string {
  // Deterministic non-crypto fallback for environments without Web Crypto.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 16777619);
    h2 ^= code;
    h2 = Math.imul(h2, 2246822519);
  }
  const a = (h1 >>> 0).toString(16).padStart(8, "0");
  const b = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${a}${b}${a}${b}${a}${b}${a}${b}`;
}

export function buildResponsibilityHashBasis(verdict: VoidEngineVerdict): ResponsibilityHashBasis {
  const governanceInvalid =
    verdict.final_2_state === "VOID_GOVERNANCE" || verdict.void_reason_code.some((code) => GOVERNANCE_CODES.has(code));

  return {
    version: "rhash.v1",
    final_state: verdict.final_2_state,
    action_gate: verdict.action_gate,
    risk_level: verdict.risk_level,
    scbkr: {
      S: Number(verdict.scbkr.S.toFixed(2)),
      C: Number(verdict.scbkr.C.toFixed(2)),
      B: Number(verdict.scbkr.B.toFixed(2)),
      K: Number(verdict.scbkr.K.toFixed(2)),
      R: Number(verdict.scbkr.R.toFixed(2))
    },
    reason_codes: [...verdict.void_reason_code].sort(),
    claim_validity: verdict.claim_validity,
    governance_validity: governanceInvalid ? "INVALID" : "VALID",
    revision_state: verdict.revision_state,
    gate_checks: verdict.gate_checks,
    responsibility_summary: {
      subject: verdict.explain_mode.subject_analysis,
      basis_cost: verdict.explain_mode.basis_analysis,
      responsibility: verdict.explain_mode.responsibility_analysis
    }
  };
}

export async function computeResponsibilityHashAsync(basis: ResponsibilityHashBasis): Promise<string> {
  const stable = stableStringify(basis);

  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(stable);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  return fallbackHashHex(stable);
}

export const RESPONSIBILITY_HASH_EXPLAIN =
  "此指紋不是網站外觀或單純文本雜湊，而是本系統依主體、因果、邊界、依據/成本、責任與最終治理判定生成的責任結構指紋。若後續網站、流程或主張改變，且責任結構與此次判決不一致，可直接判定 VOID。";
