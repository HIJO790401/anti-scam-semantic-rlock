"use client";

import { useEffect, useMemo, useState } from "react";
import { AuditResponse } from "@/lib/types";
import { speakText, stopSpeaking } from "@/lib/tts";

interface Props {
  open: boolean;
  onClose: () => void;
  result: AuditResponse | null;
  narratorZh: string;
  narratorEn: string;
}

function explainToEnglish(text: string): string {
  const table: Array<[RegExp, string]> = [
    [/有提到單位名稱.*查證是否真實/, "A named entity is mentioned, but identity authenticity still requires independent verification."],
    [/發送者身分不清楚.*誰負責/, "Sender identity is unclear, so accountability cannot be confirmed."],
    [/以急迫語氣要求敏感操作.*薄弱/, "Urgency plus sensitive-action pressure indicates a weak causal chain."],
    [/有基本原因描述.*不足/, "A basic reason is present, but the rationale remains incomplete."],
    [/有時間或範圍資訊.*不完整/, "Some boundary hints exist (time/scope), but execution boundaries are incomplete."],
    [/缺少明確範圍.*限制說明/, "Clear scope, procedural steps, and constraints are missing."],
    [/有提到政策或官方字眼.*成本落點說明/, "Policy/official terms are mentioned, but independent verification and cost-bearing clarity are still missing."],
    [/沒有提供可自行驗證.*誰承擔/, "No independently verifiable basis is provided, and cost-bearing ownership is undefined."],
    [/有提供責任窗口跡象.*官方管道確認/, "A responsibility channel is hinted, but official-channel verification is still required."],
    [/未說明出事時誰負責.*責任不可驗/, "It does not define who is accountable or how to trace responsibility when incidents occur."],
    [/含依據真偽與成本落點檢查/, "Includes basis-authenticity and cost-bearing verification checks."]
  ];
  for (const [pattern, translated] of table) {
    if (pattern.test(text)) return translated;
  }
  return "Governance explanation generated from SCBKR fields; verify through official channels before acting.";
}

export function NarratorModal({ open, onClose, result, narratorZh, narratorEn }: Props) {
  const fullText = useMemo(() => {
    if (!result) return "";
    const explainLines = [
      `Subject（中文）: ${result.explain_mode.subject_analysis}`,
      `Subject (EN): ${explainToEnglish(result.explain_mode.subject_analysis)}`,
      `Cause（中文）: ${result.explain_mode.cause_analysis}`,
      `Cause (EN): ${explainToEnglish(result.explain_mode.cause_analysis)}`,
      `Boundary（中文）: ${result.explain_mode.boundary_analysis}`,
      `Boundary (EN): ${explainToEnglish(result.explain_mode.boundary_analysis)}`,
      `Basis & Cost Ground（中文）: ${result.explain_mode.basis_analysis}`,
      `Basis & Cost Ground (EN): ${explainToEnglish(result.explain_mode.basis_analysis)}`,
      `Responsibility（中文）: ${result.explain_mode.responsibility_analysis}`,
      `Responsibility (EN): ${explainToEnglish(result.explain_mode.responsibility_analysis)}`,
      `R-Lock（中文）: ${result.explain_mode.r_lock_triggered ? "責任不可驗，已觸發升級。" : "責任鎖未觸發。"}`,
      `R-Lock (EN): ${result.explain_mode.r_lock_triggered ? "Responsibility is not verifiable; R-Lock escalation is triggered." : "R-Lock is not triggered."}`
    ];
    return [
      "【描述模型聲明】",
      "我是語言描述模型，只負責把系統裁決翻成白話；決策與責任定義由 SCBKR + R-Lock + VOID Engine 承擔。",
      "",
      "【Narrator Statement】",
      "I am the narration layer. I translate governance outcomes into plain language.",
      "Final decision authority and accountability belong to SCBKR + R-Lock + VOID Engine.",
      "",
      "【案例說明（中文）】",
      narratorZh,
      "",
      "【Case Narrative (English)】",
      narratorEn,
      "",
      "【SCBKR Explain（中英對照）】",
      ...explainLines,
      "",
      "【本次治理裁決】",
      `risk_level: ${result.risk_level}`,
      `final_2_state: ${result.final_2_state ?? "N/A"}`,
      `action_gate: ${result.action_gate ?? "N/A"}`,
      "",
      "【責任公式雜湊保證】",
      "即便他人更換網址、說法或表面文案，只要責任結構公式無法對齊，本系統即視為不成立。",
      "此流程可回放、可追責、可承擔且有邊界。",
      "",
      "如對責任公式與判定結果有疑慮，請洽專案負責人：沉靜流派工作室 許文耀先生。"
    ].join("\n");
  }, [narratorEn, narratorZh, result]);

  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (!open) return;
    setTypedText("");
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setTypedText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(timer);
    }, 14);
    return () => clearInterval(timer);
  }, [fullText, open]);

  if (!open || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-semibold text-trust-700">Narrator Explain Modal（語言模型描述層）</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => speakText(fullText, "zh-TW")}
              className="rounded-lg border border-trust-300 bg-trust-50 px-3 py-1 text-sm text-trust-700 hover:bg-trust-100"
            >
              女聲朗讀
            </button>
            <button type="button" onClick={stopSpeaking} className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50">
              停止語音
            </button>
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
            >
              關閉
            </button>
          </div>
        </div>
        <div className="max-h-[72vh] overflow-auto px-5 py-4">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-7 text-slate-800">{typedText}</pre>
        </div>
      </div>
    </div>
  );
}
