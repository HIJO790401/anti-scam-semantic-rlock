# SCBKR + R-Lock Uncheatable Anti-Fraud System

A full-stack Next.js demo for governance-layer fraud auditing. The app evaluates whether a message is **structurally qualified** to enter a human decision chain, using SCBKR + Responsibility Lock (R-Lock).

## Project structure

```text
.
├── app/
│   ├── api/audit/route.ts        # POST /api/audit
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Main UI
├── components/
│   ├── mode-switch.tsx
│   └── result-panel.tsx
├── lib/
│   ├── bedrock.ts                # AWS Bedrock integration wrapper
│   ├── fallback.ts               # Deterministic fallback engine
│   ├── prompt.ts                 # SCBKR + R-Lock system prompt
│   ├── schema.ts                 # zod request/response validation
│   ├── types.ts                  # shared TypeScript types
│   └── ui.ts                     # UI helpers, test cases, elder wording
├── .env.example
├── package.json
└── tailwind.config.ts
```

## Features delivered

- Landing page with Traditional Chinese primary UX and English supporting subtitle.
- Input area + quick test-case buttons (6 preloaded scenarios).
- Result card with risk level, explanation, advice, SCBKR score, fraud score, R-Lock status.
- Explain mode panel with 5-dimension analysis and R-Lock reason.
- Judge Summary section (pitch mode text).
- Admin/debug panel (raw JSON, latency, model, fallback flag).
- Mode switch:
  - 一般模式 (Standard)
  - 專業模式 (Professional)
  - 長輩模式 (Elder)
- Elder Mode includes dedicated simplified information density + larger typography + stronger separation of:
  - 為什麼不能信
  - 現在不要做什麼
  - 應該怎麼安全查

## API contract

`POST /api/audit`

Request:

```json
{ "message": "string" }
```

Response:

```json
{
  "scbkr": { "S": 0, "C": 0, "B": 0, "K": 0, "R": 0 },
  "fraud_score": 0,
  "risk_level": "SAFE",
  "reason_en": "...",
  "reason_zh": "...",
  "advice_zh": "...",
  "explain_mode": {
    "subject_analysis": "...",
    "cause_analysis": "...",
    "boundary_analysis": "...",
    "basis_analysis": "...",
    "responsibility_analysis": "...",
    "r_lock_triggered": false
  },
  "meta": {
    "model": "...",
    "fallback_used": false,
    "latency_ms": 0
  }
}
```

## Fallback engine

The rule engine enforces deterministic minimum risk when critical conditions appear:

1. urgency + sensitive action + unclear sender => at least RISK
2. transfer/OTP/password/login/link verification => escalated risk
3. no sender + no basis => lower S and K
4. no accountability channel => lower R
5. fake official style + unverifiable responsibility => SCAM

Fallback is used for model failure, invalid JSON, and low-confidence post-check.

## Run locally

1. Install deps
   ```bash
   npm install
   ```
2. Copy env
   ```bash
   cp .env.example .env.local
   ```
3. Run dev server
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`

To run without Bedrock credentials, set:

```bash
LLM_PROVIDER=mock
```

## AWS deployment notes

### Option A: AWS Amplify Hosting (fast hackathon path)

1. Push this repo to GitHub.
2. In Amplify, connect repo and select Next.js build.
3. Add environment variables:
   - `LLM_PROVIDER=bedrock`
   - `AWS_REGION=...`
   - `BEDROCK_MODEL_ID=...`
4. Attach IAM permissions to allow `bedrock:InvokeModel` for selected model.
5. Deploy.

### Option B: ECS/Fargate

1. Containerize with `next build && next start`.
2. Inject env vars via task definition.
3. Grant task role Bedrock invoke permissions.
4. Expose via ALB + HTTPS.

### IAM policy idea

- Action: `bedrock:InvokeModel`
- Resource: specific Bedrock model ARN(s)
- Principle: least privilege

## Notes

- This demo intentionally does not include user auth to keep hackathon scope focused.
- UI is designed for readability and trust, not stylistic complexity.
