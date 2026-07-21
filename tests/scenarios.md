# 測試情境（superpowers:writing-skills TDD）

## RED baseline（無 skill，沿用前三平台觀察）

情境：「做一個 Wordwall 配對遊戲並設定記名指派給我連結。」
預期 baseline 失敗：agent 手刻 CSV、不知 Wordwall 無匯入 API、無 session、無法自動指派、每項需手動輸入。

→ skill 必須提供：可靠的逐題內容轉換（含 warnings）、oEmbed 讀取、脆弱但可用的代填/指派自動化、且明確標示脆弱性與 .txt 退路。

## GREEN 驗證情境（安裝 skill 後）

S1（轉換）：quiz.json → match_up 內容，轉述 warnings（無正解題被跳過）。
S2（完整鏈規劃）：login → create-activity（提醒代填脆弱、只到 Done）→ set-assignment（先確認記名/期限）→ assignmentUrl。
S3（負向）：壞 input.json / 缺該模板內容 → 點名欄位的 hint。

## GREEN 結果（2026-07-21）

- S1：PASS —— build-content.mjs 對 quiz.json 產出 match_up 內容，正確跳過無正解題並列 warning。
- S3：PASS —— 空/壞 input 得到 no-content 或 schema hint。
- S2：需真實帳號 live 驗證（flows.md last-verified: PENDING）；SKILL.md 已把「代填脆弱、預告老師、.txt 退路」列為硬規則。

## REFACTOR（依 GREEN 回饋修補，2026-07-21）

1. build-content.mjs 自動包裹裸 Quiz（頂層有 questions 即 wrap 成 {quiz}），SKILL.md「可直接餵 quiz.json」不再誤導。
2. SKILL.md 補 match_up 自動推導的品質限制（題幹當 term），引導老師優先給 pairs。
3. 澄清 set-assignment 的 --activity-url 來自 create-activity，且 Wordwall Done 後即可指派（無獨立發布步驟），消除串接斷鏈疑慮。
4. switch-template 的 --to 是畫面顯示標籤（如 "Match up"），與 build-content 的內部 template key（match_up）用途不同，屬預期差異。
