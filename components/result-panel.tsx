import { AuditResponse, UserMode } from "@/lib/types";
import { riskMeta, toElderOutput } from "@/lib/ui";
import { speakText, stopSpeaking } from "@/lib/tts";

interface Props {
  result: AuditResponse;
  mode: UserMode;
  message: string;
}

function ScoreGrid({ result }: { result: AuditResponse }) {
  const entries = Object.entries(result.scbkr);
  const labelMap: Record<string, string> = {
    S: "主體 Subject",
    C: "因果 Cause",
    B: "邊界 Boundary",
    K: "依據/成本 Basis&Cost",
    R: "責任 Responsibility"
  };
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {entries.map(([k, v]) => (
        <div key={k} className="rounded-lg bg-slate-100 p-3 text-center">
          <p className="text-xs text-slate-500">{labelMap[k] ?? k}</p>
          <p className="text-lg font-semibold">{(v * 100).toFixed(0)}</p>
          <p className={`text-xs ${v < 0.6 ? "text-red-700" : "text-green-700"}`}>{v < 0.6 ? "缺口" : "可用"}</p>
        </div>
      ))}
    </div>
  );
}

function MissingReasons({ result }: { result: AuditResponse }) {
  const dimensionExplain = {
    S: result.explain_mode.subject_analysis,
    C: result.explain_mode.cause_analysis,
    B: result.explain_mode.boundary_analysis,
    K: result.explain_mode.basis_analysis,
    R: result.explain_mode.responsibility_analysis
  };

  const labelMap: Record<keyof typeof dimensionExplain, string> = {
    S: "S 主體 Subject",
    C: "C 因果 Cause",
    B: "B 邊界 Boundary",
    K: "K 依據/成本 Basis&Cost",
    R: "R 責任 Responsibility"
  };

  const missing = (Object.entries(result.scbkr) as Array<[keyof typeof dimensionExplain, number]>)
    .filter(([, v]) => v < 0.6)
    .sort((a, b) => a[1] - b[1]);

  if (!missing.length) {
    return <p className="text-sm text-green-700">目前五維都在可用區間，未見明顯結構缺口。</p>;
  }

  return (
    <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
      {missing.map(([dimension, value]) => (
        <li key={dimension}>
          <span className="font-semibold text-red-700">
            {labelMap[dimension]}（{(value * 100).toFixed(0)}）
          </span>
          ：{dimensionExplain[dimension]}
        </li>
      ))}
    </ul>
  );
}

function SystemLogic({ result }: { result: AuditResponse }) {
  const codes = new Set(result.void_reason_code ?? []);
  const whoPass = result.scbkr.S > 0 && !codes.has("whoWhyTrueGateFail");
  const whyPass = result.scbkr.C > 0 && !codes.has("whoWhyTrueGateFail");
  const truePass = result.scbkr.K > 0 && result.scbkr.R > 0 && !codes.has("whoWhyTrueGateFail");
  const maybeEscape = codes.has("probabilisticEscape");

  const badge = (ok: boolean) =>
    ok ? <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">PASS</span> : <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">FAIL</span>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">依系統判準的最終邏輯（WHO + WHY + TRUE）</h3>
      <ul className="mt-2 space-y-2 text-sm text-slate-700">
        <li className="flex items-center gap-2">WHO（可驗主體）{badge(whoPass)}</li>
        <li className="flex items-center gap-2">WHY（因果理由）{badge(whyPass)}</li>
        <li className="flex items-center gap-2">TRUE（依據可驗＋責任可追）{badge(truePass)}</li>
        <li className="flex items-center gap-2">機率逃責語句（可能/maybe）{badge(!maybeEscape)}</li>
      </ul>
      <p className="mt-3 text-sm text-slate-600">LLM 需先解釋上述四點；任一 FAIL 即不具決策資格，會進入 VOID 治理判定。</p>
    </div>
  );
}

export function ResultPanel({ result, mode, message }: Props) {
  const theme = riskMeta(result.risk_level);

  if (mode === "elder") {
    const elder = toElderOutput(result, message);
    const elderSpeech = [
      elder.stop_signal,
      "為什麼不能信：",
      ...elder.why_not_trust,
      "現在不要做什麼：",
      ...elder.do_not,
      "應該怎麼安全查：",
      elder.safe_action
    ].join("\n");
    return (
      <section className="space-y-4 rounded-2xl border-2 border-slate-300 bg-white p-6 text-lg leading-relaxed shadow">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => speakText(elderSpeech, "zh-TW")}
            className="rounded-lg border border-trust-300 bg-trust-50 px-4 py-2 text-base font-semibold text-trust-700 hover:bg-trust-100"
          >
            語音模式（女聲）
          </button>
          <button type="button" onClick={stopSpeaking} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-base text-slate-700 hover:bg-slate-50">
            停止語音
          </button>
        </div>
        <div className={`rounded-xl border-l-8 px-4 py-4 ${theme.className}`}>
          <p className="text-sm font-semibold">風險判定</p>
          <p className="text-3xl font-bold">{theme.label}</p>
          <p className="mt-2 text-xl font-semibold">{elder.stop_signal}</p>
        </div>

        <div className="rounded-xl border border-slate-300 p-5">
          <h3 className="text-2xl font-bold text-slate-900">為什麼不能信</h3>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-800">
            {elder.why_not_trust.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h3 className="text-2xl font-bold text-red-900">現在不要做什麼</h3>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-red-900">
            {elder.do_not.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-trust-200 bg-trust-50 p-5">
          <h3 className="text-2xl font-bold text-trust-700">應該怎麼安全查</h3>
          <p className="mt-2 text-slate-900">{elder.safe_action}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`rounded-xl border-l-8 p-4 ${theme.className}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm">風險判定 / Risk</p>
            <p className="text-2xl font-bold">{theme.label}</p>
          </div>
          <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold">{theme.badge}</span>
        </div>
        <p className="mt-2 text-sm">{result.reason_zh}</p>
        {mode === "professional" && <p className="mt-1 text-xs text-slate-700">EN: {result.reason_en}</p>}
      </div>

      <div className="rounded-xl bg-slate-100 p-4">
        <p className="text-sm font-semibold text-slate-700">實用建議</p>
        <p className="text-sm">{result.advice_zh}</p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">SCBKR 分數</h3>
        <ScoreGrid result={result} />
        <p className="mt-3 text-sm text-slate-600">
          Fraud Score: {(result.fraud_score * 100).toFixed(0)} / R-Lock: {result.explain_mode.r_lock_triggered ? "Triggered" : "Not triggered"}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">SCBKR 哪裡缺失（LLM 解釋）</h3>
        <MissingReasons result={result} />
      </div>

      <SystemLogic result={result} />

      {result.responsibility_hash && (
        <div className="rounded-xl border border-trust-200 bg-trust-50/40 p-4">
          <h3 className="text-sm font-semibold text-trust-700">責任結構指紋</h3>
          <p className="mt-2 break-all rounded bg-white px-3 py-2 font-mono text-xs text-slate-800">{result.responsibility_hash}</p>
          <p className="mt-3 text-sm text-slate-700">
            {result.hash_explain ??
              "此指紋不是網站外觀或單純文本雜湊，而是本系統依主體、因果、邊界、依據/成本、責任與最終治理判定生成的責任結構指紋。若後續網站、流程或主張改變，且責任結構與此次判決不一致，可直接判定 VOID。"}
          </p>
          {result.hash_basis && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
              <p>
                basis：state={result.hash_basis.final_state} / gate={result.hash_basis.action_gate} / risk={result.hash_basis.risk_level}
              </p>
              <p>reason_codes：{result.hash_basis.reason_codes.join(", ") || "none"}</p>
              <p>
                who/why/true：{result.hash_basis.gate_checks.who_pass ? "1" : "0"}/{result.hash_basis.gate_checks.why_pass ? "1" : "0"}/
                {result.hash_basis.gate_checks.true_pass ? "1" : "0"}（escape={result.hash_basis.gate_checks.probabilistic_escape ? "1" : "0"}）
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
