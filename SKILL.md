---
name: tw-wordwall-skill
description: Use when a teacher wants Wordwall paste-ready activity content generated — 產生 Wordwall 逐題貼上內容（quiz/配對/字謎/分組/開箱轉盤/是非題/完成句子等）、查詢已發布活動 oEmbed。Triggers include Wordwall, 配對遊戲, match up, 字謎, 分組, input.json.
---

# tw-wordwall-skill

Wordwall 沒有批次匯入 API，官方唯一可靠的建立方式是老師自己在編輯器逐項輸入。本 skill 產生每個模板對應的 `.csv`/`.txt` 貼上內容，老師拿著檔案自行到 Wordwall 建立活動、發布、設定指派。

## 首次使用

```bash
cd <skill-dir> && npm install
```

只在 `node_modules/` 不存在時執行。

## 工作流程

1. **產生貼上內容（唯一步驟）**：
   ```bash
   node scripts/build-content.mjs input.json --template quiz --out-dir out/ [--bom]
   ```
   input.json = `{title?, quiz?, pairs?, words?, groups?, sentences?}`（也可直接餵裸 quiz.json，會自動包成 `{quiz}`）。輸出 `csvPath`/`txtPath`/`warnings`/`experimental`——**warnings 一定要完整轉述給老師**；`experimental: true` 的模板請提醒老師貼入後自行核對欄位對應。`--bom` 讓 Excel 開啟 CSV 時中文不會亂碼；`.txt` 永遠是最保險的手動貼入路徑。

   支援模板：
   - **quiz、match_up**：已在官方編輯器完整驗證。
   - **anagram、group_sort、open_box_or_wheel**：既有支援，格式合理但未逐一 live 驗證。
   - **true_false、matching_pairs、find_the_match、flash_cards、speaking_cards、complete_the_sentence**：內容形狀與已驗證模板相同（複用同一套邏輯），標記 `experimental`。

   ⚠️ **match_up 從 quiz 自動推導時，term＝整段題幹、definition＝第一個正解**，配對常不精煉。若老師在意品質，請引導改用明確的 `pairs`（`[{term,definition}]`）再重跑。

2. **上傳後，請老師在 Wordwall 官網做的事**：登入 wordwall.net → Create Activity → 選對應模板 → 貼入 `.txt`（或匯入 `.csv`，依模板介面而定）→ 檢查 warnings 提到的略過題目 → 自行設定 Share/Set Assignment（記名/期限）→ 取得指派連結。

## 輔助

- 查已發布活動：`node scripts/get-oembed.mjs <activity-url>`（唯讀，免登入，HTTP 直接呼叫，不受下方變更影響）。

## 規則

- 每支腳本輸出單行 JSON：`{ok:true,...}` 或 `{ok:false,error,hint}`。
- `warnings` 一定完整轉述；不支援/略過的題目一定要點名，讓老師知道需要人工補建。
- `experimental` 模板結果一定請老師覆核再送出。
- 這裡沒有任何瀏覽器/登入自動化——本 skill 只產生檔案，見下方「為什麼沒有瀏覽器自動化」。

## 常見錯誤

| 症狀 | 處理 |
|---|---|
| `no-content` | input.json 缺該模板所需欄位；先看 stdout 的 warnings 確認缺什麼 |
| schema 驗證失敗 | hint 點名壞欄位；對照 `scripts/lib/models.mjs` 的 `WordwallContentInput` |
