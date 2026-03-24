import { AuditResponse, UserMode } from "@/lib/types";
import { riskMeta, toElderOutput } from "@/lib/ui";

interface Props {
  result: AuditResponse;
  mode: UserMode;
  message: string;
}

function ScoreGrid({ result }: { result: AuditResponse }) {
  const entries = Object.entries(result.scbkr);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {entries.map(([k, v]) => (
        <div key={k} className="rounded-lg bg-slate-100 p-3 text-center">
          <p className="text-xs text-slate-500">{k}</p>
          <p className="text-lg font-semibold">{(v * 100).toFixed(0)}</p>
        </div>
      ))}
    </div>
  );
}

export function ResultPanel({ result, mode, message }: Props) {
  const theme = riskMeta(result.risk_level);

  if (mode === "elder") {
    const elder = toElderOutput(result, message);
    return (
      <section className="space-y-4 rounded-2xl border-2 border-slate-300 bg-white p-6 text-lg leading-relaxed shadow">
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
    </section>
  );
}
