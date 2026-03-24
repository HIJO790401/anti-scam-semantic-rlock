import { UserMode } from "@/lib/types";

interface Props {
  value: UserMode;
  onChange: (mode: UserMode) => void;
}

const options: { key: UserMode; label: string }[] = [
  { key: "standard", label: "一般模式" },
  { key: "professional", label: "專業模式" },
  { key: "elder", label: "長輩模式" }
];

export function ModeSwitch({ value, onChange }: Props) {
  return (
    <div className="inline-flex w-full max-w-lg rounded-xl border border-slate-300 bg-white p-1 shadow-sm">
      {options.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            value === item.key ? "bg-trust-500 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
