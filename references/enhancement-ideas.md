# 功能擴充構想（2026-07-22 live 驗證時觀察到，供下一輪升級參考）

## 高價值

1. **更多模板支援**（create-activity.mjs 目前只驗證 quiz；官方共 18 種免費模板）
   已知未涵蓋：Random Wheel、Random Cards、Whack-a-Mole、Find the Match、Missing Word、Gameshow Quiz、Unjumble、Maze Chase、True or False、Speaking cards、Complete the sentence、Matching pairs、Flash cards。
   本輪已確認 `.js-item-input`/`.js-item` 這套 contenteditable + per-item-container 機制對 quiz 完全可行；下一輪應逐一開啟這些模板，確認是否共用同一套 DOM pattern（很可能是，因為都是同一個 editor 框架），再擴充 `itemsFor()`/欄位填入邏輯。

2. **一鍵換模板**（switch-template.mjs 已實作但受限於 v1 只測 quiz 建立，尚未實測換模板後欄位是否需要重新對應）
   → 下一輪建一個 quiz 活動後，實際測 `switch-template.mjs` 換成 Match up，確認換模板後內容有沒有跑掉、正確答案有沒有保留。

3. **AI 動作選單**（quiz 編輯器頂部「人工智慧動作」：添加類似問題／新增答案說明／翻譯測驗／更多的選擇，本輪完全沒碰）
   → 可做 `pw/ai-enhance-activity.mjs`，建好活動後自動幫每題加答案解釋、或翻譯成其他語言版本，一次產出雙語教材。

## 中價值

4. **My Results 追蹤**（頂部導覽「My Results」，本輪沒進去看）
   → 可做唯讀的 `get-results.mjs`，回報學生完成度/分數，跟 Wayground 的成績報告概念類似。

5. **Generate With AI**（quiz 內容編輯畫面右上角按鈕，本輪看到是 disabled 狀態，可能需要付費方案或特定前置條件）
   → 下一輪確認觸發條件（是否需要 Upgrade），若免費可用則能作為 build-content.mjs 之外的替代出題路徑。

6. **尋找問題側邊欄**（quiz 編輯器右側「尋找問題」搜尋框，可搜其他人公開的題目直接引用）
   → 適合老師想參考現成題庫而非從零編寫，可做 `search-questions.mjs`。

## 低價值／備查

7. **Pro 模板**（Spell the word、Gameshow quiz、Wordsearch 等，需訂閱）——付費限定，暫不列入自動化範圍。
8. **列印/下載 PDF**（活動頁「Print」連結）——適合老師要紙本考卷的情境，可做 `pw/print-activity.mjs` 觸發下載。
9. **Embed 嵌入碼**（活動頁「Embed」）——嵌入官網/班級網頁用途，跟核心教學流程關聯較低。
10. **Google Classroom 註冊選項**（Set Assignment 的 Registration 若選 Google Classroom 需先接受 cookie）——下一輪可測試這個整合路徑，對已用 Google Classroom 管理班級的老師很實用。
