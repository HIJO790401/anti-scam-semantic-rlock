# SCBKR + R-Lock 反詐騙治理層 Demo

> No decision without verifiable responsibility structure.

這是我做的反詐騙治理層專案。  
我不是在做「訊息像不像詐騙」的分類器，我做的是：

**在你做決策前，先審計這段訊息是否具備可驗證、可追責、可承擔成本的責任結構。**

---

## 我這個專案在解什麼問題

我在實務上看到很多訊息看起來很像官方、流程很完整、語氣很專業，
但真正危險點是：

- 主體不可驗
- 原因講不清
- 邊界模糊
- 依據/成本落點不明
- 出事時責任無法追

所以我把核心問題改成：

> 這段訊息，有沒有資格進入人的決策鏈？

---

## 我的方法（SCBKR + R-Lock + VOID Engine）

### 1) SCBKR 五維責任審計
- **S — Subject**：誰發的？可不可驗？
- **C — Cause**：為什麼要你做這件事？
- **B — Boundary**：時限、範圍、步驟清不清楚？
- **K — Basis & Cost Ground**：正式依據在哪？成本落點在哪？
- **R — Responsibility**：出事誰承擔？怎麼追責？

### 2) WHO + WHY + TRUE Gate
任一閘門不過，就不該直接進入可執行決策。

### 3) R-Lock（責任鎖）
遇到「催促 + 敏感操作 + 責任不可驗」時，直接提高風險地板。

### 4) VOID Engine 最終裁決
輸出：`VOID_CLAIM` / `VOID_GOVERNANCE` / `VOID_REVISION` 等治理結果。

### 5) Responsibility Hash
我把本次裁決與責任結構欄位固化成雜湊指紋，供後續版本比對與追責。

---

## 我在 Demo 會展示什麼

- Standard / Professional / Elder 三種模式
- 可疑訊息輸入 + 快速案例
- SCBKR 分數與缺口說明
- WHO+WHY+TRUE 判準結果
- VOID Engine 治理裁決
- Responsibility Hash + 結構摘要
- Narrator 說明彈窗（中英）

---

## 專案結構

```text
.
├── app/
│   ├── api/audit/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── mode-switch.tsx
│   ├── narrator-modal.tsx
│   └── result-panel.tsx
├── lib/
│   ├── fallback.ts
│   ├── responsibility-hash.ts
│   ├── ui.ts
│   └── void-engine/
├── scripts/
│   └── demo-cli.sh
└── README.md
```

---

## 本地執行

### 1. 安裝
```bash
npm install
```

### 2. 複製環境變數
```bash
cp .env.example .env.local
```

### 3. 啟動
```bash
npm run dev
```

### 4. 開啟
- http://localhost:3000

---

## API（`POST /api/audit`）

### Request
```json
{
  "message": "可疑訊息全文"
}
```

### Response（摘要）
```json
{
  "scbkr": { "S": 0, "C": 0, "B": 0, "K": 0, "R": 0 },
  "risk_level": "SAFE | UNCLEAR | RISK | SCAM",
  "claim_validity": "VALID | INVALID",
  "final_2_state": "...",
  "action_gate": "ALLOW | WARN | BLOCK | SIGN_AND_CONTINUE",
  "void_reason_code": [],
  "gate_checks": {
    "who_pass": true,
    "why_pass": true,
    "true_pass": false,
    "probabilistic_escape": false
  },
  "responsibility_hash": "...",
  "meta": {
    "model": "...",
    "fallback_used": false
  }
}
```

---

## 三種模式定位（我怎麼設計）

### Standard
給一般使用者：聚焦風險與可行動建議。

### Professional
給評審/工程/治理審計：
- 規則命中脈絡
- 結構化資料
- 責任鏈可回放資訊

### Elder
給長者或低技術使用者：
- 大字
- 低資訊密度
- 直接停損指令（不要點、不要打、改用官方管道）

---

## AWS Amplify 部署（我建議）

這個 repo 可直接部署在 AWS Amplify（Next.js SSR + API routes）。

建議環境變數：
- `LLM_PROVIDER=bedrock`
- `BEDROCK_USE_SDK=true`
- `AWS_REGION=us-west-2`
- `BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0`

我建議使用 Amplify SSR compute role，不要直接塞長期金鑰。

---

## GitHub Pages 展示（不連後端）

如果我要純前端展示，我會用：

```bash
npm run build:github
```

此模式會走本地 deterministic 審計路徑，不依賴外部 AI 或 `/api/*`。

### Pages 來源建議
- 優先：`GitHub Actions`
- 也可：`Deploy from branch (main/docs)`

repo 內已提供：
- `.github/workflows/deploy-pages.yml`（Actions artifact deploy）
- `.github/workflows/sync-docs-pages.yml`（同步 `out/` 到 `docs/`）

---

## 重要聲明

- 這是治理層 Demo，不是最終商用防詐平台。
- Demo 請使用去識別化訊息。
- 請勿輸入真實個資、帳密、驗證碼等敏感資訊。

---

## 我的一句話定位

**我不是在做詐騙相似度分類；我在做決策前的責任結構審計。**
