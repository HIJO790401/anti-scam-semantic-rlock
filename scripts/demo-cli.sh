#!/usr/bin/env bash
set -euo pipefail

URL="${DEMO_URL:-http://localhost:3000}"
CASE="bank_alert"
MESSAGE=""

usage() {
  cat <<'USAGE'
CLI Demo for SCBKR + R-Lock

Usage:
  bash scripts/demo-cli.sh [--url <base_url>] [--case <name>] [--message <text>]

Cases:
  bank_alert      高風險：銀行異常+催促點連結
  gov_notice      中低風險：政府公告但缺少追責
  normal_notice   低風險：一般非敏感通知
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      URL="$2"; shift 2 ;;
    --case)
      CASE="$2"; shift 2 ;;
    --message)
      MESSAGE="$2"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1 ;;
  esac
done

if [[ -z "$MESSAGE" ]]; then
  case "$CASE" in
    bank_alert)
      MESSAGE="【台灣商業銀行】您的帳戶異常，請於今日18:00前點擊連結完成重新驗證，否則將停用帳戶。https://fake-bank-verify.example" ;;
    gov_notice)
      MESSAGE="我們會持續優化流程，若有疑問可自行查詢相關資訊。" ;;
    normal_notice)
      MESSAGE="提醒您：本週五系統維護，期間查詢速度可能變慢，造成不便敬請見諒。" ;;
    *)
      echo "Unknown case: $CASE" >&2
      exit 1 ;;
  esac
fi

payload=$(python3 - <<'PY' "$MESSAGE"
import json, sys
print(json.dumps({"message": sys.argv[1]}, ensure_ascii=False))
PY
)

response=$(curl -sS -X POST "$URL/api/audit" -H 'content-type: application/json' --data "$payload")

echo "\n=== DEMO INPUT ==="
echo "$MESSAGE"

case "$CASE" in
  bank_alert)
    NARRATOR_ZH="這則訊息以銀行名義催促限時驗證，屬於高壓敏感操作。重點不是語氣像官方，而是責任結構能否被驗證。"
    NARRATOR_EN="This message uses urgent bank-style verification pressure. The issue is accountability-structure verifiability, not official tone." ;;
  gov_notice)
    NARRATOR_ZH="這類公告可能不是詐騙，但若缺少可追責路徑與正式依據，仍不具決策資格。"
    NARRATOR_EN="This notice may not be scam by default, but without accountable routes and verifiable basis it is not decision-eligible." ;;
  normal_notice)
    NARRATOR_ZH="這類訊息偏中性，通常風險較低；仍建議用既有官方管道二次查證。"
    NARRATOR_EN="This type is neutral and usually lower risk, but secondary verification through known official channels is still recommended." ;;
  *)
    NARRATOR_ZH="我是描述模型，只負責翻譯系統判定。最終決策由治理引擎承擔。"
    NARRATOR_EN="I am a narration layer; final decision authority belongs to the governance engine." ;;
esac

echo "\n=== DEMO SUMMARY ==="
python3 - <<'PY' "$response"
import json, sys
obj = json.loads(sys.argv[1])
print(f"risk_level       : {obj.get('risk_level')}")
print(f"final_2_state    : {obj.get('final_2_state')}")
print(f"action_gate      : {obj.get('action_gate')}")
print(f"fallback_used    : {obj.get('meta',{}).get('fallback_used')}")
print(f"model            : {obj.get('meta',{}).get('model')}")
print(f"reason_zh        : {obj.get('reason_zh')}")
print(f"advice_zh        : {obj.get('advice_zh')}")
print("\n[SCBKR]")
for k,v in obj.get('scbkr',{}).items():
    print(f"  {k}: {v}")
print("\n[Explain mode]")
exp = obj.get('explain_mode',{})
for key in ['subject_analysis','cause_analysis','boundary_analysis','basis_analysis','responsibility_analysis']:
    print(f"- {key}: {exp.get(key)}")
print(f"- r_lock_triggered: {exp.get('r_lock_triggered')}")
PY

echo "\n=== NARRATOR LAYER ==="
echo "ZH: $NARRATOR_ZH"
echo "EN: $NARRATOR_EN"
echo "聲明：我是語言描述模型；決策與責任定義由 SCBKR + R-Lock + VOID Engine 承擔。"
echo "責任公式雜湊說明：若網址/話術變更但責任結構公式無法對齊，判定即不成立。"
echo "如需責任公式保證與回放追責，請洽專案負責人：沉靜流派工作室 許文耀先生。"

echo "\n=== RAW JSON ==="
python3 -m json.tool <<< "$response"
