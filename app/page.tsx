"use client";

import { useMemo, useState } from "react";
import { ModeSwitch } from "@/components/mode-switch";
import { NarratorModal } from "@/components/narrator-modal";
import { ResultPanel } from "@/components/result-panel";
import { AuditResponse, UserMode } from "@/lib/types";
import { demoCases, getNarratorCaseCopy } from "@/lib/ui";

export default function HomePage() {
  const [mode, setMode] = useState<UserMode>("standard");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [raw, setRaw] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showNarratorModal, setShowNarratorModal] = useState(false);

  const containerClass = useMemo(
    () => (mode === "elder" ? "mx-auto max-w-4xl space-y-6 p-4 text-lg" : "mx-auto max-w-5xl space-y-6 p-4"),
    [mode]
  );
  const narrator = useMemo(() => getNarratorCaseCopy(message), [message]);

  async function handleAudit() {
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await resp.json();
      setResult(data);
      setRaw(JSON.stringify(data, null, 2));
    } catch {
      setError("系統目前忙碌，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={containerClass}>
      <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-[url('/rlock-bg-9x16.jpg')] bg-cover bg-center md:bg-[url('/rlock-bg-16x9.jpg')] md:bg-top" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/92 via-blue-50/84 to-white/88 md:from-white/90 md:via-blue-50/78 md:to-white/86" />
        <div className="relative p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-trust-700">SCBKR + R-Lock Uncheatable Anti-Fraud System</p>
          <h1 className={`mt-2 font-bold text-slate-900 ${mode === "elder" ? "text-4xl" : "text-3xl"}`}>SCBKR 智慧防詐小幫手</h1>
          <p className={`mt-2 text-slate-700 ${mode === "elder" ? "text-2xl" : "text-lg"}`}>一句話，先看它有沒有決策資格，再看風險。</p>
          <p className="mt-1 text-sm text-slate-500">One message tells whether it is structurally trustworthy.</p>
          <p className={`mt-4 whitespace-pre-line text-slate-700 ${mode === "elder" ? "text-xl" : "text-sm"}`}>
            把你收到的簡訊、Line、Email 或任何可疑訊息貼上來。
            系統會先跑 SCBKR 五維審計（主體、因果、邊界、依據/成本、責任）與 WHO+WHY+TRUE 決策閘門，
            再給出治理裁決與責任結構指紋。
            如果只有說法沒有責任承接，就不具決策資格。
          </p>
          <div className="mt-4 rounded-xl border border-trust-200 bg-white/88 p-4 shadow-sm backdrop-blur-[1px]">
            <div className="flex gap-3">
              <div className="w-1.5 rounded-full bg-trust-500" />
              <div>
                <p className={`font-semibold text-slate-900 ${mode === "elder" ? "text-2xl leading-snug" : "text-base leading-relaxed"}`}>
                  這不是在判斷它像不像詐騙。<br />
                  這是在判斷：這段訊息，有沒有責任結構資格進入你的決策鏈。
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  This system does not ask only whether a message looks fraudulent.
                  <br />
                  It asks whether the message has accountable structure and can pass decision gating.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <ModeSwitch value={mode} onChange={setMode} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-slate-700">可疑訊息內容</label>
        <textarea
          className={`w-full rounded-xl border border-slate-300 p-4 outline-none ring-trust-300 focus:ring ${mode === "elder" ? "min-h-52 text-xl" : "min-h-44 text-sm"}`}
          placeholder="請貼上可疑訊息，例如：
「這裡是XX銀行，您的帳戶有異常，請立即點擊連結更新資料。」"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {demoCases.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setMessage(item.message)}
              className={`rounded-lg border border-trust-200 bg-trust-50 px-3 py-2 text-trust-700 hover:bg-trust-100 ${mode === "elder" ? "text-lg" : "text-sm"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleAudit}
            disabled={loading}
            className={`rounded-xl bg-trust-500 font-semibold text-white hover:bg-trust-700 disabled:opacity-60 ${mode === "elder" ? "px-8 py-4 text-2xl" : "px-5 py-3 text-sm"}`}
          >
            {loading ? "檢查中..." : "立即檢查"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!result) {
                setError("請先按「立即檢查」，再查看完整結構。");
                return;
              }
              setShowNarratorModal(true);
            }}
            className={`rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 ${mode === "elder" ? "px-8 py-4 text-xl" : "px-5 py-3 text-sm"}`}
          >
            查看完整結構（語言描述彈窗）
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </section>

      {result && <ResultPanel result={result} mode={mode} message={message} />}

      <NarratorModal
        open={showNarratorModal}
        onClose={() => setShowNarratorModal(false)}
        result={result}
        narratorZh={narrator.zh}
        narratorEn={narrator.en}
      />

      <section className="rounded-2xl border border-trust-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-trust-700">這不是在問「像不像詐騙」</h2>
        <p className="mt-2 text-slate-700">本系統在問：「它是否通過 WHO+WHY+TRUE，並具備可驗證責任結構，足以進入你的決策？」</p>
        <p className="mt-2 text-sm text-slate-700">
          不是只看它像不像詐騙，而是看它是否具備可驗證的責任結構，足以進入決策鏈。
        </p>
        <p className="text-xs text-slate-500">
          Not just fraud similarity, but decision-chain qualification through verifiable responsibility structure.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
          <li>SCBKR：拆主語、因果、邊界、依據/成本基礎、責任</li>
          <li>WHO+WHY+TRUE Gate：缺一不可；若缺失或機率逃責語句，直接 VOID</li>
          <li>R-Lock：責任不可驗，直接升級風險</li>
          <li>Responsibility Hash：把本次責任結構裁決固化成可比對指紋</li>
          <li>Explain mode：用白話告訴你哪裡缺、為什麼不能直接信</li>
        </ul>
      </section>

      {mode === "elder" && (
        <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-bold text-trust-700">長輩模式範例</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-lg text-slate-800">
            <li>先不要信。這則訊息沒講清楚出事要找誰負責，所以不能直接照做。</li>
            <li>它一直催你快點處理，可是沒有把事情講完整，這種很容易出問題。</li>
            <li>不要點它給的連結，不要打它給的電話。</li>
            <li>請直接打開你平常就在用的官方 App，或自己找官方電話查。</li>
          </ul>
        </section>
      )}

      {result && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-700">Admin / Debug</h2>
          <p className="text-xs text-slate-500">
            request time: {(result.meta as AuditResponse["meta"] & { latency_ms?: number }).latency_ms ?? "N/A"} ms / model: {result.meta.model} /
            fallback: {String(result.meta.fallback_used)}
          </p>
          <pre className="mt-2 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{raw}</pre>
        </section>
      )}
    </main>
  );
}
