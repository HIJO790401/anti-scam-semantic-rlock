
# SCBKR + R-Lock Uncheatable Anti-Fraud System

## 決策前結構審計的反詐治理層  
A Governance-Layer Demo for Pre-Decision Structural Auditing

SCBKR + R-Lock 不是一般的詐騙分類器，也不是聊天機器人。  
它的核心問題不是「這段訊息像不像詐騙」，而是：

> **這段訊息，是否具備足夠可驗證的責任結構，值得進入人的決策鏈？**

本專案是為黑客松決賽場景打造的 **治理層 demo**。  
系統會先對訊息進行結構抽取，再透過 **deterministic-first** 的規則層與 **VOID Engine** 做最終裁決，避免只靠模型機率判斷而失真。

---

## 0. Hackathon 最終版自述（Gogolook 可直接貼）

### 一句話定位
**我們不是在判斷訊息「像不像詐騙」，而是在做「決策前責任結構審計」。**

### 我們解的問題
很多社交工程訊息看起來正式、流程完整、語氣可信，但真正危險點在於：  
**責任不可驗、追責不可行、成本落點不清楚。**

### 系統核心機制（評審版）
1. **SCBKR 五維審計**：S/C/B/K/R 拆解訊息責任結構。  
2. **WHO + WHY + TRUE Gate**：  
   - WHO：是否有可驗主體  
   - WHY：是否有可驗因果  
   - TRUE：是否有正式可驗依據、追責路徑與成本承擔  
   任一不成立即不得進入可執行決策。  
3. **R-Lock 責任鎖定**：遇到催促 + 敏感操作 + 責任不可驗，直接升級風險。  
4. **VOID Engine 最終裁決**：輸出 `VOID_CLAIM / VOID_GOVERNANCE / VOID_REVISION` 等治理結果。  
5. **Responsibility Hash（責任結構雜湊碼）**：  
   將本次治理裁決與責任欄位固化為可比對指紋，讓後續版本可做一致性比對與責任追蹤。

### 你在 Demo 會看到什麼
- 三種視圖：Standard / Professional / Elder  
- Explain Mode：可直接展示 SCBKR 五維與 R-Lock 觸發  
- Admin JSON：可展示 `gate_checks`、`void_reason_code`、`responsibility_hash`  
- CLI Demo：可直接在終端機演示同一條治理判定流程（不依賴 UI 點擊）

### 與傳統分類器差異（最短版）
- 傳統：像不像詐騙（相似度/分類）  
- 我們：能不能進入決策鏈（治理有效性/責任可驗性）

### Demo 收尾台詞（可直接講）
**No decision without verifiable responsibility structure.**  
沒有可驗證責任結構，就不應進入人的決策鏈。

---

## 1. 為什麼不是一般防詐分類器

多數防詐系統的核心是：
- 關鍵字比對
- 黑名單
- 類型分類
- 詐騙相似度分數

但真實社交工程常常不是粗糙釣魚，而是：

- **語氣很正式**
- **流程看起來合理**
- **用官方口吻要求你操作**
- **真正危險的地方藏在責任不可驗**

也就是說，詐騙可以模仿清楚、模仿正式、模仿官方，  
但很難模仿一套真正可追責、可驗證、可承擔成本的責任結構。

所以本系統的核心不是判斷「像不像詐騙」，  
而是判斷：

> **它有沒有資格進入人的決策鏈。**

---

## 2. 核心方法：SCBKR 五維責任鏈

本系統用五個維度審計訊息：

- **S — Subject（主體）**  
  誰發出的？身份是否可驗？是否可追溯？

- **C — Cause（因果）**  
  為何要你做這件事？因果是否連續、合理、對得上情境？

- **B — Boundary（邊界）**  
  範圍、時限、條件、步驟是否清楚？要求做到哪一步？

- **K — Basis & Cost Ground（依據／成本基礎）**  
  是否有正式可查的依據？來源是否真正可驗？  
  若照做，帳號／資料／金錢／身分等風險成本落在哪裡？

- **R — Responsibility（責任）**  
  若出事，誰負責？如何追責？是否有明確承接與回溯路徑？

---

## 3. R-Lock：責任鎖定機制

本系統最核心的防呆規則是 **R-Lock（Responsibility Lock）**。

### 核心原理
詐騙者可以模仿：
- 官方語氣
- 形式完整
- 操作流程
- 表面依據

但很難模仿：
- 可驗證的責任承接框架
- 真正的官方追責入口
- 明確的成本承擔者

### R-Lock 規則
只要訊息具有以下特徵：
- 催促你立即操作
- 要求登入、驗證、轉帳、輸入敏感資訊
- 看起來很正式
- 但責任不可驗

系統就會：
- 壓低 **R**
- 提高最低風險地板
- 阻止訊息被當成「可以直接照做」的內容

也就是說：

> **責任不可驗，即使其他維度表面正常，也不能降級。**

---

## 4. VOID Engine：治理層最終裁決

本系統不是把 LLM 的輸出直接拿來當答案。  
LLM 只做結構抽取輔助，**最終一定要再經過 VOID Engine**。

VOID Engine 會檢查三類問題：

### 4.1 Claim Validity
這段訊息本身是否具備足夠結構，可以進入決策流程？

若缺少：
- 主體
- 邊界
- 正式依據
- 責任承接

則可被判為：
- `VOID_CLAIM`
- `BLOCK`

---

### 4.2 Governance Validity
有些話不是詐騙，但仍然不具備治理有效性，例如：

- 「我們會持續改善」
- 「請洽專業人士」
- 「這還需要更多研究」
- 「很多人都這麼認為」
- 「我們只是機率模型」

這些話如果沒有：
- 責任主體
- 邊界
- 錯誤類型
- 追責結構

就可能被判為：
- `VOID_GOVERNANCE`

---

### 4.3 Revision Gate
如果一個系統聲稱：
- 已修正
- 已優化
- 已改善
- 已更新

但沒有說清楚：
- 錯在哪
- 錯誤層在哪
- 誰定義這是錯
- 誰負責修
- 修完邊界在哪

則可能被判為：
- `VOID_REVISION`

---

## 5. 系統流程

整體流程如下：

1. 使用者貼上一段可疑訊息
2. 前端呼叫 `POST /api/audit`
3. API 驗證輸入格式
4. 根據環境變數決定走：
   - Bedrock 抽取
   - fallback 規則引擎
5. 若模型輸出低信心、失敗或 JSON 無效，系統自動 fallback
6. 所有結果再進入 **VOID Engine**
7. 回傳最終裁決：
   - `risk_level`
   - `claim_validity`
   - `final_2_state`
   - `action_gate`
   - `output_modes`
   - `meta`

---

## 6. 三種輸出模式

三種模式不是三套邏輯，  
而是**同一個 core verdict 的三種呈現層**。

### 一般模式 Standard
給一般使用者：
- 風險等級
- 簡要理由
- 直接建議

### 專業模式 Professional
給評審、工程師、治理／審計人員：
- SCBKR 分數
- VOID 狀態
- 規則命中原因
- 原始結構化輸出

### 長輩模式 Elder
給長者或低技術使用者：
- 字更大
- 資訊密度更低
- 不講抽象術語
- 直接聚焦：
  - 為什麼不能信
  - 現在不要做什麼
  - 應該怎麼安全查

---

## 7. 長輩模式為什麼是本專案亮點

長輩模式不是單純把字放大。

它的任務是**停損**。

當系統偵測到：
- 有連結
- 有電話
- 有登入入口
- 有客服
- 有驗證要求
- 有催促語氣

長輩模式會明確說：

- **不要點它給的連結**
- **不要打它給的電話**
- **不要用它給的客服**
- **請改用你本來就知道的官方 App／官網／官方電話**

而且不只叫你停，還會講清楚：
- 哪裡沒講清楚
- 為什麼危險
- 照做可能損失什麼
- 安全替代路徑是什麼

這讓系統不只是分類器，而是**可執行的停損工具**。

---

## 8. 本次 Hackathon Demo 會展示什麼

本專案在黑客松展示的重點不是「模型多聰明」，  
而是：

> **如何在決策前，先做責任結構審計。**

現場 demo 主要展示：

1. 輸入可疑訊息  
2. 顯示 SCBKR 五維分析  
3. 顯示 R-Lock 是否觸發  
4. 顯示風險結果與實用建議  
5. 切換一般／專業／長輩模式  
6. 顯示 JSON / debug 資訊，說明這不是普通分類器，而是治理裁決流程

---

## 9. 與一般詐騙分類器的差異

| 面向 | 本系統（SCBKR + R-Lock） | 傳統詐騙分類器 |
|---|---|---|
| 核心問題 | 是否具備可驗證責任結構 | 是否像詐騙 |
| 判斷方式 | deterministic 治理規則 + 結構審計 | 關鍵字 / 黑名單 / 機率分類 |
| LLM 角色 | 輔助結構抽取 | 常被當主要判斷依據 |
| 最終裁決 | VOID Engine | 模型分數或分類結果 |
| 風險核心 | 責任是否可驗 | 文本是否相似 |
| 使用者價值 | 決策入口審計 | 類別判斷 |

一句話總結：

> **本系統不是在做詐騙相似度判斷，而是在做決策入口資格審計。**

---

## 10. Project Structure

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
│   ├── bedrock.ts                # Bedrock integration wrapper
│   ├── fallback.ts               # Deterministic fallback engine
│   ├── prompt.ts                 # SCBKR + R-Lock prompt
│   ├── schema.ts                 # Request/response validation
│   ├── types.ts                  # Shared types
│   ├── ui.ts                     # UI helpers / elder wording / examples
│   └── void-engine/
│       ├── claimValidity.ts
│       ├── errorTyping.ts
│       ├── finalVerdict.ts
│       ├── index.ts
│       ├── outputModes.ts
│       ├── rLock.ts
│       ├── revisionGate.ts
│       ├── scbkrScoring.ts
│       ├── testCases.ts
│       ├── types.ts
│       └── voidGovernance.ts
├── .env.example
├── package.json
├── tailwind.config.ts
└── README.md


---

11. Core Features

Traditional Chinese primary UI

English supporting copy

Input box + quick test cases

Risk card + explanation + advice

SCBKR scoring

R-Lock trigger display

Explain Mode

Judge Summary block

Admin / Debug JSON output

Standard / Professional / Elder modes

Deterministic fallback

VOID Engine governance verdict

Structured final JSON



---

12. API Contract

Request

{
  "message": "可疑訊息全文"
}

Response

{
  "scbkr": { "S": 0, "C": 0, "B": 0, "K": 0, "R": 0 },
  "fraud_score": 0,
  "risk_level": "SAFE | UNCLEAR | RISK | SCAM",
  "claim_validity": "VALID | INVALID",
  "final_2_state": "REAL_2 | DRAFT_2 | SAMPLE_2 | VOID_2 | VOID_CLAIM | VOID_GOVERNANCE | VOID_REVISION | VARIANT_DANGER",
  "revision_state": "VALID_REVISION | VOID_REVISION | null",
  "error_type": [],
  "error_layer": [],
  "void_reason_code": [],
  "action_gate": "ALLOW | WARN | BLOCK | SIGN_AND_CONTINUE",
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
  "output_modes": {
    "standard": {},
    "professional": {},
    "elder": {}
  },
  "meta": {
    "model": "...",
    "fallback_used": false,
    "latency_ms": 0
  }
}


---

13. Run Locally

1. Install

npm install

2. Copy env

cp .env.example .env.local

3. Run dev

npm run dev

4. Open

http://localhost:3000

If you want to run without Bedrock credentials:

LLM_PROVIDER=mock npm run dev

5. CLI demo (for judges)

Run web app locally first, then use CLI:

npm run dev
npm run demo:cli -- --case bank_alert

You can also target deployed Amplify URL:

DEMO_URL=https://<your-amplify-domain> npm run demo:cli -- --case gov_notice

CLI output now includes:
- Governance verdict summary
- Narrator-layer statement (ZH/EN)
- Responsibility-formula hash guarantee note + accountable contact

UI Explain flow:
- Click `查看完整結構（語言描述彈窗）`
- Modal pops up and shows narrator-style typing text
- Includes role disclaimer, case-specific narration, SCBKR explain lines in ZH/EN pairs, governance verdict, and responsibility-hash guarantee
- Built-in local speech mode (female-voice priority, browser SpeechSynthesis, no cloud TTS required)
- Elder mode also includes one-click voice playback for non-text users


---

14. Hackathon Deployment Notes

Fastest demo path

Run locally with LLM_PROVIDER=mock

Use built-in quick test cases

Show Standard / Elder / Professional modes

Show JSON / VOID Engine result in debug section


If Bedrock is used

Prepare environment variables in advance

Confirm invoke path / gateway / IAM permission before event

Keep fallback path available in case Bedrock is unavailable


Important demo boundary

This repository is a hackathon demo, not a production anti-fraud platform.
Please use de-identified sample messages during demo.
Do not input real personal data, real account credentials, or sensitive private information.


---

15. Why this project matters

Digital trust is breaking down not only because fake messages exist,
but because too many messages can still push people into action without carrying real accountability.

This project tries to restore one basic rule:

> No decision without verifiable responsibility structure.




---

16. Final Positioning Line

This system does not judge whether a message merely looks fraudulent.
It audits whether the message deserves to enter a human decision chain.


---

17. AWS Amplify Deployment (Strict + Bedrock IAM Role)

This repo is deployment-ready for AWS Amplify Hosting (Next.js SSR + API routes).

Runtime behavior:
- `DECISION_ENGINE_MODE` defaults to `strict`; set `relaxed` only for controlled experiments.
- LLM is used for extract/explain text.
- Final decision fields are deterministic (SCBKR / risk / final state / action gate).
- If Bedrock fails or lacks permission, API returns fallback verdict and service stays available.

Recommended Amplify environment variables:
- `LLM_PROVIDER=bedrock`
- `BEDROCK_USE_SDK=true`
- `AWS_REGION=us-west-2`
- `BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0`

Do not manually inject long-term AWS keys (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN`).
Use Amplify SSR compute role IAM permissions for Bedrock.

Minimum IAM permissions for Bedrock:
- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream` (optional, keep for future model adapters)

Suggested resource scope:
- `arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`


Runtime debug log fields (non-secret):
- `resolved_model_id`
- `signed_path`
- `request_url`
- `aws_region`
- `use_sdk_mode`
- `has_access_key`
- `has_session_token`
- `credential_source`
- `strict_mode`

Post-deploy smoke test:
1) Open `/` and confirm page renders.
2) POST `/api/audit` with a sample message.
3) Check response:
   - `meta.model` should be Bedrock model ID (not `mock:*`, not `error-fallback`) when IAM/network is correct.
   - `meta.fallback_used` should be `false` when Bedrock call succeeds.
