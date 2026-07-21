---
name: tw-wordwall-skill
description: Use when a teacher wants to build a Wordwall activity — 產生 Wordwall 逐題貼上內容（quiz/配對/字謎/分組/開箱轉盤）、查詢已發布活動 oEmbed、自動代填題目、設定記名指派並取得連結。Triggers include Wordwall, 配對遊戲, match up, 字謎, 分組, 指派連結, input.json.
---

# tw-wordwall-skill

Wordwall 無批次匯入 API——每個項目都要在編輯器逐一輸入。本 skill：產生貼上用 `.csv`/`.txt`（可靠、預設路徑）+ Playwright 代填/指派（自動化，但選擇器最脆弱）。

## 首次使用

```bash
cd <skill-dir> && npm install && npx playwright install chromium
```

只在 `node_modules/` 不存在時執行。

⚠️ **執行環境**：自動代填功能開啟**可見（headed）瀏覽器**供老師登入，需在**本機、有螢幕的互動式 agent session**執行（Claude Code CLI/Desktop、Codex CLI、OpenCode 終端機皆可）。**雲端背景任務/遠端無頭 sandbox/CI（如 Codex Cloud tasks）無法顯示瀏覽器視窗，登入步驟會卡住或失敗**——請改在本機互動式 session 執行；`.txt` 手動貼入路徑不受此限制。

## 一鍵流程（推薦）

先 `node scripts/preflight.mjs` 確認依賴已裝、老師已登入。再用串接器一次跑完，中間只停在「指派前確認」：

```bash
node scripts/run.mjs input.json --stage prepare --template quiz            # 建活動+代填，回傳 activityUrl
node scripts/run.mjs input.json --stage deliver --activity-url <url> --named false   # 設定指派
```

唯讀查詢學生完成度：`node scripts/pw/get-results.mjs`。下方單支腳本用於需要細部控制時。

## 工作流程

1. **產生貼上內容（必經）**：
   ```bash
   node scripts/build-content.mjs input.json --template quiz --out-dir out/
   ```
   input.json = `{title?, quiz?, pairs?, words?, groups?}`（也可直接餵裸 quiz.json，會自動包成 `{quiz}`）。輸出 `csvPath`/`txtPath`/`warnings`——**warnings 一定轉述**。`.txt` 就是老師手動貼入的預設路徑。
   ⚠️ **match_up 從 quiz 自動推導時，term＝整段題幹、definition＝第一個正解**，配對常不精煉。若老師在意品質，請引導改用明確的 `pairs`（`[{term,definition}]`）再重跑。
2. **（可選）自動代填**——**Wordwall 編輯器選擇器極易改版，只在老師明確要求自動填入時才用**：
   - 登入：`node scripts/pw/login.mjs`（timeout ≥360000ms）。
   - 建活動：`node scripts/pw/create-activity.mjs input.json --template quiz --title "..."`。v1 驗證 **quiz、match_up**；group_sort/anagram/open_the_box 標記 `experimental`（回報時提醒老師覆核）。
3. **設定指派（外部寫入，先確認記名與期限）**：用 `create-activity.mjs` 輸出的 `activityUrl`。
   ```bash
   node scripts/pw/set-assignment.mjs --activity-url <create-activity的activityUrl> --named true --deadline 2026-07-31
   ```
   Wordwall 活動 Done 後即可指派（Set Assignment 內含發布），不需另外的發布步驟。輸出 `assignmentUrl`——最終交付物。
4. **（可選）差異化**：`node scripts/pw/switch-template.mjs --activity-url <url> --to "Match up"`（官方一鍵換模板，非所有模板可互換）。

## 輔助
- 查已發布活動：`node scripts/get-oembed.mjs <activity-url>`（唯讀，免登入）。

## 規則

- **走自動代填前，先向老師預告**：這是四平台中最脆弱的流程，介面一改版就會停在 `editor-selector-failure`；`.txt` 手動貼入永遠是穩妥退路。
- 每支腳本輸出單行 JSON；失敗照 `hint` 做，同一支 pw 腳本最多重試 1 次；出現 `handoff` 把 `resumeUrl`/`screenshot` 交還老師。
- 指派是外部寫入：先確認記名/期限。`create-activity` 只做到 Done，不自動發布，讓老師覆核。
- `experimental` 模板結果一定請老師覆核。
- 絕不讀取或輸出瀏覽器 profile 內容。

## 常見錯誤

| 症狀 | 處理 |
|---|---|
| `not-logged-in` | 先跑 `scripts/pw/login.mjs` |
| `editor-selector-failure` | Wordwall 改版；改用 `.txt` 人工貼入 |
| `no-content` | input.json 缺該模板所需欄位；先用 build-content.mjs 檢視 |
| schema 驗證失敗 | hint 點名壞欄位；轉譯給老師，不貼原始 zod |
