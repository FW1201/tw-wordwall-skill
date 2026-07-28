# Google OAuth 動作銜接：Wordwall

本文件只描述登入前置；Skill 不保存密碼、Cookie、token 或 MFA，也不代填 Google 憑證。

1. 教師在平常使用的正常 Chrome 個人檔案開啟 Wordwall；登出時先確認首頁有 `Log In`／`Sign Up`。
2. 登入分兩條分支：若出現 Chrome 原生 Google 帳戶提示，由教師確認正確帳戶；若進入 `/account/login`，由教師點選 Google OAuth 或自行完成一般 Email／密碼登入。Skill 不代填憑證、MFA 或 CAPTCHA。
3. 若出現 `This browser or app may not be secure`、`signin/rejected`、嵌入式登入頁或仍停在登入頁，停止自動化，回到正常 Chrome 處理。
4. 工具重新讀取頁面；只有回到 `/myactivities` 或建立活動頁，看到帳戶名稱／`Log Out` 且不再看到登入／註冊，才算成功。

2026-07-28 實測：登出後由 `/account/login` 的 Google OAuth 連結完成登入，回讀 `/myactivities`、帳戶 `chi456789883` 與 `Log Out`；接著進入 Create Activity、Quiz 編輯器並儲存一題 canary，回讀資源頁。未點擊 Share 或 Set Assignment。

Google OAuth 成功只代表登入工作階段成立，不代表內容已貼入、活動已儲存、已發布、已分享或已指派。
