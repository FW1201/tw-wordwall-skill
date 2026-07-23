<p align="center"><img src="assets/logo.png" width="88" alt="Wordwall logo"></p>

# tw-wordwall-skill 使用手冊

非官方的 Wordwall 貼上內容產生器。它輸出模板對應的 `.csv`、`.txt` 與 `.quality.json`，由教師自行貼入、預覽、發布或指派；不登入、不寫入 Wordwall，也不保證未實測模板的欄位會與平台相符。

## 事前條件

- Node.js 18 以上，先執行 `npm install`。
- `quiz` 驅動的活動：備妥可定位來源、受測者、目標、用途與藍圖，從 [assessment-brief.example.json](references/assessment-brief.example.json) 擴充。
- 直接資料模板（`pairs`、`words`、`groups`、`sentences`）：CLI 不會阻擋，但教師仍應先確認來源、受測者及活動目標，避免把不適齡或脫離教材的資料直接做成遊戲。

## 標準使用

```bash
npm install
node scripts/build-content.mjs input.json --template quiz --out-dir out/
```

可用模板：`quiz`、`match_up`、`anagram`、`group_sort`、`open_box_or_wheel`、`true_false`、`matching_pairs`、`find_the_match`、`flash_cards`、`speaking_cards`、`complete_the_sentence`。加 `--bom` 只是在 Excel 開 CSV 時保留中文編碼；`.txt` 是較保守的手動貼入檔。

輸出中的 `qualityReportPath` 指向 `<slug>.quality.json`。含 `quiz` 時，只有 `status: "ready"` 可交付，請讀 `blockers/warnings/perQuestion/blueprint`；沒有 quiz 的直接資料輸入會是 `not-applicable` 並提醒確認活動 brief。stdout `warnings` 必須完整提供給教師。

## assessment v1 契約

`input.json` 有 `quiz` 時，該 Quiz 必須有 `title/questions[]/assessment.version:1`。`assessment.sources[]` 每筆有 `id/title/locator`；`audience` 有 `gradeLevel/proficiency/language/prerequisites[]`；`objectives[]` 有 `id/text`；還要有 `purpose` 與 `blueprint[]`（`objectiveId/cognitiveLevel/difficulty/count`）。每題有 `sourceRefIds[]`、`objectiveIds[]`、`cognitiveLevel`、`difficulty`。

允許認知層次：`remember`、`understand`、`apply`、`analyze`、`evaluate`、`create`；難度：`basic`、`developing`、`proficient`、`advanced`。每題的來源與目標要已登錄；藍圖的題數總和及每一格實際數量都要相同。選擇題至少一個正解，單選題剛好一個；應提供 `explanation` 供教師複核。

缺資料或不一致會以 `assessment-quality-blocked` 停止。不要因趕課直接換 `--legacy`。

## 模板狀態與教師貼入

只有 `quiz`、`match_up` 已在對應 Wordwall 編輯器實測。其他模板皆為 `experimental`，即使沿用相同資料形狀也**不得稱為官方格式已驗證**；看到 `experimental: true` 時，教師要在該模板編輯器逐欄檢查。`match_up` 從 quiz 推導會把完整題幹作為 term、第一正解作為 definition，若需精準配對請提供 `pairs[]`。

教師操作：Wordwall → Create Activity → 選擇相同模板 → 以 `.txt` 貼入（或在該模板可用時匯入 `.csv`）→ 對照 warnings、逐欄核對 → 再決定分享、發布或指派。`node scripts/get-oembed.mjs <activity-url>` 只讀取已發布活動的 oEmbed。

## 舊資料、隱私、維護

對含 quiz 的舊資料，只有明確資料救援才使用 `--legacy`。它會產生 `legacy-unverified` report，不能宣稱已驗題。不要把學生個資、帳密或 token 放入輸入和產物。

維護者若要將 experimental 模板升級為已驗證，需以當日教師帳號在該模板建立未公開活動，逐欄貼入 CSV/TXT、檢查題目／答案／編碼與預覽，並把可重跑的證據與測試更新；程式測試不能取代此步驟。

## 疑難排解與驗證

| 現象 | 處理 |
|---|---|
| `assessment-quality-blocked` | 補 quiz.assessment 與每題追溯資料，勿將 legacy 當作修正。 |
| `experimental: true` | 在該模板的編輯器逐欄預覽，確認後才使用。 |
| 空白或 `no-content` | 按模板提供 `quiz/pairs/words/groups/sentences`，並讀 stdout warnings。 |

```bash
npm test
```

測試不會登入、建立或發布活動。壓力情境見 [skill-evaluations.md](references/skill-evaluations.md)。
