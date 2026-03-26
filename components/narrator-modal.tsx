"use client";

import { useEffect, useMemo, useState } from "react";
import { AuditResponse } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  result: AuditResponse | null;
  narratorZh: string;
  narratorEn: string;
}

export function NarratorModal({ open, onClose, result, narratorZh, narratorEn }: Props) {
  const fullText = useMemo(() => {
    if (!result) return "";
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
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50">
            關閉
          </button>
        </div>
        <div className="max-h-[72vh] overflow-auto px-5 py-4">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-7 text-slate-800">{typedText}</pre>
        </div>
      </div>
    </div>
  );
}
