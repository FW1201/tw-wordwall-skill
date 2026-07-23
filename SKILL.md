---
name: tw-wordwall-skill
description: Use when a teacher needs source-aware Wordwall paste-ready activity content, especially quiz activities that must be aligned to a learner audience and assessment blueprint.
---

# Wordwall 活動內容

產生 Wordwall 可貼入的 `.csv` 與 `.txt`，不直接建立、發布或指派活動。**以 `quiz` 驅動的任何模板都先走 assessment 品質關卡；直接資料模板雖不會被 CLI 阻擋，仍要先確認來源、受測者與活動目標。**

## 必要工作流

1. `quiz` 活動：先蒐集 assessment brief，缺來源、受測者、目標或藍圖即停止。直接資料（pairs/words/groups/sentences）：先與教師確認來源、對象與活動目標。
2. 建立 input JSON；若含 `quiz`，每題必須具來源、目標、認知層次和難度。
3. 執行 `node scripts/build-content.mjs input.json --template quiz --out-dir out/`。
4. `quiz` 先讀 `<slug>.quality.json`，僅 `ready` 可交付；非 quiz 會是 `not-applicable` 並提醒教師完成活動 brief。
5. 完整轉述 stdout `warnings`。`experimental: true` 代表該**實際 Wordwall 模板**尚未實測，必須在編輯器逐欄核對。
6. 教師自行 Create Activity、選模板、貼入並檢查後才決定發布或指派。

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

## 例外與限制

`--legacy` 對含 quiz 的輸入輸出 `legacy-unverified`，不可當作品質已驗證。沒有內容建立 API、瀏覽器自動化、發布或指派功能。

## 常見錯誤

| 症狀 | 處理 |
|---|---|
| `assessment-quality-blocked` | 補足 quiz.assessment 與每題追溯欄位；不可用 legacy 規避。 |
| `experimental: true` | 在對應的 Wordwall 編輯器逐欄核對貼入結果，再由教師決定是否使用。 |
| no-content／空白輸出 | 依模板提供 `quiz`、`pairs`、`words`、`groups` 或 `sentences`，並讀 warnings。 |
