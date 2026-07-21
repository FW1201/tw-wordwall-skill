# 功能擴充構想（2026-07-22 起兩輪 live 驗證觀察，供下一輪升級參考）

> ⚠️ **勘誤**：第一輪記錄的「quiz 編輯器頂部『人工智慧動作』：添加類似問題／新增答案說明／翻譯測驗」**其實是 Wayground 的功能，誤植到本文件**。第二輪已在 Wordwall 實際進入 `Edit content` 畫面核對，該畫面只有一個 disabled 的「Generate With AI」按鈕，**沒有**這種多動作選單。相同的 AI 面板構想已正確歸檔到 tw-wayground-skill 的 enhancement-ideas.md。

> ✅ **v0.2.0 已完成**：新增 `get-results.mjs`（唯讀 My Results，中價值 #3）、`preflight.mjs`、`run.mjs`（一鍵串接）。`create-activity.mjs` 非-quiz 模板改用 leaf-input 依序填策略（match_up 編輯器結構已 live 驗證）。Generate With AI 確認免費帳號鎖定，不列入自動化。

## 高價值

1. **更多模板支援**（create-activity.mjs 目前只驗證 quiz；官方共 18 種免費模板）
   已知未涵蓋：Random Wheel、Random Cards、Whack-a-Mole、Find the Match、Missing Word、Gameshow Quiz、Unjumble、Maze Chase、True or False、Speaking cards、Complete the sentence、Matching pairs、Flash cards。
   本輪已確認 `.js-item-input`/`.js-item` 這套 contenteditable + per-item-container 機制對 quiz 完全可行；下一輪應逐一開啟這些模板，確認是否共用同一套 DOM pattern（很可能是，因為都是同一個 editor 框架），再擴充 `itemsFor()`/欄位填入邏輯。

2. **一鍵換模板**（switch-template.mjs 已實作但受限於 v1 只測 quiz 建立，尚未實測換模板後欄位是否需要重新對應）
   → 下一輪建一個 quiz 活動後，實際測 `switch-template.mjs` 換成 Match up，確認換模板後內容有沒有跑掉、正確答案有沒有保留。

## 中價值

3. **My Results 追蹤（第二輪已完整驗證）**——頂部導覽「My Results」頁面，每筆結果卡片顯示：標題（如「Result 1 for 'Untitled1'」）、學生完成人數、建立時間 + deadline（如「21 Jul 12:38 – No deadline」）。
   → 可做唯讀的 `get-results.mjs`，回報學生完成度，跟 Wayground 的成績報告概念類似。實作上直接抓卡片文字即可，不需要複雜互動。

4. **Generate With AI（第二輪已確認：免費帳號為 disabled 狀態）**——quiz `Edit content` 畫面右上角按鈕，本輪帳號顯示為灰色不可點擊，推測需要付費方案（Upgrade）。
   → 下一輪若有付費帳號可測試，若確認需付費則此項可降級為「低價值／備查」，不必列入自動化開發排程。

5. **尋找問題側邊欄**（quiz 編輯器右側「尋找問題」搜尋框，可搜其他人公開的題目直接引用）
   → 適合老師想參考現成題庫而非從零編寫，可做 `search-questions.mjs`。

## 低價值／備查

6. **Pro 模板**（Spell the word、Gameshow quiz、Wordsearch 等，需訂閱）——付費限定，暫不列入自動化範圍。
7. **列印/下載 PDF**（活動頁「Print」連結）——適合老師要紙本考卷的情境，可做 `pw/print-activity.mjs` 觸發下載。
8. **Embed 嵌入碼**（活動頁「Embed」）——嵌入官網/班級網頁用途，跟核心教學流程關聯較低。
9. **Google Classroom 註冊選項**（Set Assignment 的 Registration 若選 Google Classroom 需先接受 cookie）——下一輪可測試這個整合路徑。
