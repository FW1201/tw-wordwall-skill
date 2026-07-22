# Playwright flow manifests

四平台中選擇器最脆弱者。stop-on-mismatch 最嚴格：任何結構不符即 handoff，改用 build-content.mjs 的 .txt 人工貼入。

## Flow: create activity

- version: 1
- entry URL: https://wordwall.net/create
- login detector: URL matches `wordwall.net/(myactivities|community|create)`
- declared steps: 選模板 → 填標題 → 逐列填入內容欄位（不足時 Add row）→ Done
- success evidence: URL 轉到 `wordwall.net/(resource|myactivities|play)`；輸出 activityUrl + itemsFilled
- verified templates: quiz（完整）；**match_up 結構 2026-07-22 live 驗證**——編輯器與 quiz 不同：`.js-item` 為巢狀（collection wrapper > pair rows > cells），**無** `.js-editor-add-answer`，cell 是 leaf `.js-item-input`，依序為 term1/def1/term2/def2…（row-by-row、左到右）。故非-quiz 模板改用「依序填 leaf `.js-item-input`、以 `.js-editor-add-item` 增列」策略。group_sort/anagram/open_the_box 沿用同策略但仍 experimental。
- two editor families: quiz（per-question box + `.js-question-check` 正解切換）vs flat-cell（leaf inputs 依序填）
- cleanup plan: 欄位不符 → editor-selector-failure handoff，不留半成品發布（只到 Done）
- fallback artifact: build-content.mjs 的 .txt（逐項貼入）
- trace policy: 失敗截圖存 `~/.tw-edu-skills/wordwall/diagnostics/`
- last-verified: 2026-07-22（quiz 端到端；match_up 編輯器結構）

## Flow: get results（唯讀）

- entry URL: https://wordwall.net/myresults
- declared steps: 讀 `.js-result-item` 卡片 → 每張取 `.js-item-name`（標題）、`.js-item-players`（完成人數）、`.result-info` 殘餘文字（建立時間+截止）
- success evidence: 回傳 results 陣列；純讀取無外部寫入
- last-verified: 2026-07-22

## Flow: set assignment

- entry: activity URL；步驟：Share → Set Assignment → 記名/期限 → 確認 → 擷取指派連結
- precondition: agent 已確認記名與期限
- success evidence: 指派連結（wordwall.net/play|resource）
- 擷取不到 → assignment-link-not-found handoff
- last-verified: PENDING
- capability-status: pending（external assignment link and duplicate-write recovery require live canary）

## Flow: switch template

- entry: activity URL；步驟：Switch template → 選目標模板
- 已知限制：非所有模板可互換（目標未出現即不支援）
- last-verified: PENDING
- capability-status: pending（template-switch completion evidence and resume behavior require live canary）
