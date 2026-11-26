---
name: tw-wordwall-skill
description: Design and create source-aware Wordwall teaching activities, choose compatible templates, prepare paste-ready content, and use available browser tools to build or verify the activity.
---

使用平台特有模式時，先查閱 [模式與驗證指引](references/platform-modes.md)。以 [教學 brief 範例](assets/lesson-brief-v1.example.json) 定義年級、來源、目標、活動、時間和玩家回饋；用既有 CLI 的 `lesson --input <brief.json>` 檢查時間及來源關聯，結果不取代教師審查。

## 跨 Agent 環境與工具發現

首次安裝前及需要外部平台操作前，執行 `node scripts/portable-core/agent-doctor.mjs --agent codex`；可將 codex 換為 claude、antigravity、opencode 或 other。診斷不會讀出或測試金鑰；unknown 不是可用。依診斷提示與當前 Agent 工具清單檢查 connector/MCP、權限、瀏覽器與登入，不能由本機 CLI 是否存在推論工具可用。詳見 [跨 Agent 與模式指引](references/portable-integration.md)。

連接器與 MCP 路徑僅在當前工具庫確認操作、權限與使用者需求後使用；使用具體工具前確認其參數及輸出。原有下方 CLI 與人工流程、品質檢查及外部寫入限制仍適用於原工具；不能宣稱未測試的工具路徑已完成。完成後讀回並區分草稿、發布及分享狀態。

# Wordwall 活動內容

既有 CLI 產生 Wordwall 可貼入的 `.csv` 與 `.txt`；已登入且具可用 Computer Use 的 Agent 可依使用者授權建立及核對活動。**以 `quiz` 驅動的任何模板都先走 assessment 品質關卡；直接資料模板雖不會被 CLI 阻擋，仍要先確認來源、受測者與活動目標。**

## 必要工作流

1. `quiz` 活動：先蒐集 assessment brief，缺來源、受測者、目標或藍圖即停止。直接資料（pairs/words/groups/sentences）：先與教師確認來源、對象與活動目標。
2. 建立 input JSON；若含 `quiz`，每題必須具來源、目標、認知層次和難度。
3. 執行 `node scripts/build-content.mjs input.json --template quiz --out-dir out/`。
4. `quiz` 先讀 `<slug>.quality.json`，僅 `ready` 可交付；非 quiz 會是 `not-applicable` 並提醒教師完成活動 brief。
5. 完整轉述 stdout `warnings`。`experimental: true` 代表該**實際 Wordwall 模板**尚未實測，必須在編輯器逐欄核對。
6. 視可用工具與授權，由 Agent 或教師在現有登入頁建立活動、選模板、填入並核對；讀回題目、答案、連結及分享狀態。

## assessment v1 契約（含 quiz 時必填）

```json
{
  "title": "單元檢核",
  "quiz": {
    "title": "單元檢核",
    "questions": [{
      "type": "multiple_choice", "prompt": "題幹",
      "options": [{"text": "選項 A", "correct": true}, {"text": "選項 B", "correct": false}],
      "explanation": "供教師複核的說明",
      "sourceRefIds": ["src-1"], "objectiveIds": ["obj-1"],
      "cognitiveLevel": "understand", "difficulty": "basic"
    }],
    "assessment": {
      "version": 1,
      "sources": [{"id": "src-1", "title": "教材名稱", "locator": "第 3 頁／段落"}],
      "audience": {"gradeLevel": "國七", "proficiency": "基礎", "language": "zh-TW", "prerequisites": ["已學過…"]},
      "objectives": [{"id": "obj-1", "text": "能…"}], "purpose": "形成性檢核",
      "blueprint": [{"objectiveId": "obj-1", "cognitiveLevel": "understand", "difficulty": "basic", "count": 1}]
    }
  }
}
```

允許的認知層次：`remember/understand/apply/analyze/evaluate/create`；難度：`basic/developing/proficient/advanced`。每筆來源須有 `id/title/locator`，受測者須完整，藍圖總數與每一格實際題數須吻合；選擇題至少一個正解，單選題剛好一個。

## 模板與貼入提醒

- 已驗證：`quiz`、`match_up`。`anagram`、`group_sort`、`open_box_or_wheel` 和 `true_false`、`matching_pairs`、`find_the_match`、`flash_cards`、`speaking_cards`、`complete_the_sentence` 均輸出 `experimental`；不得稱其為官方格式已驗證。
- `match_up` 從 quiz 推導時，題幹會成為 term、第一正解成為 definition；要做精準配對請提供 `pairs`。
- `--bom` 僅供以 Excel 開啟 CSV 時避免中文亂碼；`.txt` 是保守的手動貼入路徑。`get-oembed.mjs <activity-url>` 只讀已發布活動資料。

## 錄製後的草稿動作

先依 [google-oauth-handoff.md](references/google-oauth-handoff.md) 在教師平常使用的正常 Chrome 個人檔案完成登入；可走 Chrome 原生 Google 帳戶提示或 Wordwall `/account/login` 一般登入頁兩條分支。Skill 不代填 Email、密碼、MFA，也不接管嵌入式 WebView 或新開的自動化瀏覽器。若出現 `This browser or app may not be secure`、`signin/rejected` 或仍在登入頁，停止並請教師回到正常 Chrome 完成登入。

只有在 Wordwall 回到 `/myactivities` 或建立活動頁、顯示帳戶入口／`Log Out` 且不再顯示登入／註冊後，才可接管同一個已登入 Chrome 工作階段。教師以 Record-a-Skill 提供可檢視錄製後，才可依 [recorded-action-handoff.md](references/recorded-action-handoff.md) 將錄到的模板貼入與未公開預覽接回工作流；沒有錄製時不可猜測網站操作。貼入前確認 quality `ready`（或直接資料的 `not-applicable` 及 brief 警告），並核對模板、欄位、題數、答案與編碼。

Publish、Share、Set assignment、學生名單與擴大能見度都要在發布前停止並回報證據；不能把看見發布按鈕當成已完成外部寫入。

## 例外與限制

`--legacy` 對含 quiz 的輸入輸出 `legacy-unverified`，不可當作品質已驗證。未有已審核 action map 前，沒有內容建立 API、瀏覽器控制、發布或指派功能。

## 常見錯誤

| 症狀 | 處理 |
|---|---|
| `assessment-quality-blocked` | 補足 quiz.assessment 與每題追溯欄位；不可用 legacy 規避。 |
| `experimental: true` | 在對應的 Wordwall 編輯器逐欄核對貼入結果，再由教師決定是否使用。 |
| no-content／空白輸出 | 依模板提供 `quiz`、`pairs`、`words`、`groups` 或 `sentences`，並讀 warnings。 |

## CLI 教學帳戶控制（錄製後啟用）

`tw-edtech-wordwall` 串接產檔、已驗證模板目錄、計畫與外部動作確認。先跑 `doctor`、`validate --input input.json`、`catalog scan`、`plan`；沒有可檢視的 Canary action map 時，`run` 必須停止，不能用固定座標或活動 ID 取代。

```bash
tw-edtech-wordwall validate --input input.json
tw-edtech-wordwall plan --action activity.create --resource CANARY-activity
```

建立與編輯需 `--confirm-write`；公開、Share、嵌入、Set assignment、結果匯出及刪除另需 `--confirm-plan` 加 `--confirm-impact`。含學生資料的流程還需 `--confirm-student-data`，CLI 只顯示遮罩摘要。

## 匯入內容保真

處理教材轉換前，讀取 [平台模式與核對](references/platform-modes.md)；完整回報跳過與限制，並逐題核對題幹、選項和正解。不得將部分轉換或未實際匯入的檔案描述為已建立的平台活動。
