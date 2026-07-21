# Playwright flow manifests

四平台中選擇器最脆弱者。stop-on-mismatch 最嚴格：任何結構不符即 handoff，改用 build-content.mjs 的 .txt 人工貼入。

## Flow: create activity

- version: 1
- entry URL: https://wordwall.net/create
- login detector: URL matches `wordwall.net/(myactivities|community|create)`
- declared steps: 選模板 → 填標題 → 逐列填入內容欄位（不足時 Add row）→ Done
- success evidence: URL 轉到 `wordwall.net/(resource|myactivities|play)`；輸出 activityUrl + itemsFilled
- verified templates: quiz, match_up（v1）；group_sort/anagram/open_the_box 標 experimental
- cleanup plan: 欄位不符 → editor-selector-failure handoff，不留半成品發布（只到 Done）
- fallback artifact: build-content.mjs 的 .txt（逐項貼入）
- trace policy: 失敗截圖存 `~/.tw-edu-skills/wordwall/diagnostics/`
- last-verified: PENDING

## Flow: set assignment

- entry: activity URL；步驟：Share → Set Assignment → 記名/期限 → 確認 → 擷取指派連結
- precondition: agent 已確認記名與期限
- success evidence: 指派連結（wordwall.net/play|resource）
- 擷取不到 → assignment-link-not-found handoff
- last-verified: PENDING

## Flow: switch template

- entry: activity URL；步驟：Switch template → 選目標模板
- 已知限制：非所有模板可互換（目標未出現即不支援）
- last-verified: PENDING
