# 測試情境（產生器正確性——2026-07-23 大型縮減後改寫）

本文件原本記錄 Playwright 瀏覽器自動化的 RED/GREEN/REFACTOR TDD 過程（登入、代填、指派）。該自動化層已整個移除（見 README「為什麼沒有瀏覽器自動化」），歷史脈絡保留在 git log，不在此重述。

現在 `build-content.mjs` 是唯一產品面，測試情境改為關注**產生器對官方規範的正確性**，可執行測試見 `tests/build-content.test.mjs`（`npm test` 執行，node:test + node:assert，無需瀏覽器/帳號）。

## 涵蓋情境

1. **quiz/match_up（已驗證模板）**：對合法 fixture 產生內容時不應有非預期 warnings；`experimental` 應為 `false`。
2. **true_false**：正確從 `options` 推導 True/False；沒有正解時要有明確 warning，不可靜默輸出空答案。
3. **alias 模板（matching_pairs/find_the_match/flash_cards/speaking_cards）**：內容 shape 必須與其對應的已驗證模板逐位元組相同（複用同一段邏輯，不重複實作）；但 `experimental` 一律為 `true`——**這是本輪修過的一個真實 bug**：先前誤用「內容 shape 來源」判斷 verified 狀態，導致 alias 模板被誤標為已驗證，已改成檢查使用者實際要求的模板名稱。
4. **complete_the_sentence**：題幹含 `___`/`[blank]` 且有正解時才產生內容；沒有空格標記的題目要被跳過並給出具體 warning，不可誤判。
5. **CSV escaping**：欄位含逗號/雙引號時要正確加雙引號並跳脫內部引號（RFC4180 風格）。
6. **empty input**：所有欄位皆為 optional，空物件應能通過 schema 驗證，但 `buildWordwallContent` 應在該模板缺內容時給出 `requires ...` 的 warning，而不是靜默輸出空檔案又回報成功。

## 何時要補測試

擴充 `TEMPLATES`／新增 `ALIAS_OF` 項目時，`build-content.test.mjs` 至少要補一組「shape 與來源模板一致」+「experimental 仍為 true（除非真的重新 live 驗證過）」的測試，避免重蹈上面第 3 點的 bug。
