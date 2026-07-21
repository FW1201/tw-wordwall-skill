<p align="center"><img src="assets/logo.png" width="88" alt="Wordwall logo"></p>

# tw-wordwall-skill

> ⚠️ **非官方工具**：本套件**不是** Wordwall 官方產品，也**非**其認可的整合。Wordwall 無內容創建/批次匯入 API，故本套件以 Playwright 在**老師自己的可見編輯器 session** 內逐項代填（是「手動輸入加速」，非抓取或繞過），受 Wordwall 服務條款約束。請以老師本人帳號、由本人完成登入，操作自己的內容，風險自負。

台灣 K-12 教師用的 Wordwall agent skill：一句話就能把題目 JSON 一路做到「建立活動 → 逐題代填 → 設定指派 → 回傳指派連結」，並可一鍵換模板做差異化、唯讀查詢學生完成度。

自 [edu-agent-kit](https://github.com/FW1201/edu-agent-kit) 的 Wordwall adapter 獨立而來（來源 commit `a7eaa0f`）。

## 這套 skill 能做什麼

老師把題目給 agent，agent 就能：建立活動並代填題目（quiz 已完整驗證）→ 設定指派（記名/期限）→ 回傳 `wordwall.net/play/...` 連結。也能一鍵把同一份內容換成別的遊戲模板，或唯讀讀取「My Results」的完成度。

唯二人工點：**登入**、**指派前確認**。

## 快速上手（一鍵流程，推薦）

```bash
cd <skill-dir> && npm install && npx playwright install chromium   # 首次

node scripts/preflight.mjs                                  # 確認依賴/登入
node scripts/pw/login.mjs                                   # 若未登入，老師本人登入一次
node scripts/run.mjs input.json --stage prepare --template quiz   # 建活動+代填，回傳 activityUrl
# ⇧ agent 跟老師確認是否記名/期限後：
node scripts/run.mjs input.json --stage deliver \
  --activity-url <activityUrl> --named false               # 設定指派，回傳連結
```

> `input.json` 需符合 `WordwallContentInput`（`quiz.questions[]` / `pairs[]` / `words[]` / `groups[]`）；可先用 `build-content.mjs` 檢視轉換結果。

## 自然指令範例

| 老師說 | 觸發 |
|---|---|
| 「把這 10 題做成 Wordwall 測驗、設定匿名指派給我連結」 | `run.mjs … --template quiz` + `--named false` |
| 「做一個配對遊戲」 | `create-activity.mjs --template match_up` |
| 「同一份內容幫我換成 Match up」 | `switch-template.mjs --to "Match up"` |
| 「學生做了多少？」 | `get-results.mjs`（唯讀） |

## 功能總覽

| 腳本 | 用途 | 輸入 | 輸出 |
|---|---|---|---|
| `scripts/preflight.mjs` | 前置檢查（依賴/登入） | — | `{loggedIn}` |
| `scripts/run.mjs` | **一鍵串接器**（prepare/deliver） | `input.json` | activityUrl / 指派連結 |
| `scripts/build-content.mjs` | 產生貼上用 `.csv`/`.txt`（五模板） | `input.json` | 檔案 + warnings |
| `scripts/get-oembed.mjs` | 讀已發布活動 oEmbed（唯讀、免登入） | `<url>` | oEmbed |
| `scripts/pw/login.mjs` | 可見視窗登入 | — | 登入狀態 |
| `scripts/pw/create-activity.mjs` | 代填題目建活動 | `<input.json> --template --title` | activityUrl |
| `scripts/pw/set-assignment.mjs` | Set Assignment 取得指派連結 | `--activity-url [--named][--deadline]` | assignmentUrl |
| `scripts/pw/switch-template.mjs` | 一鍵換模板（差異化） | `--activity-url --to` | 切換結果 |
| `scripts/pw/get-results.mjs` | **唯讀**讀取 My Results 完成度 | `[--limit N]` | 結果清單 |

模板支援：**quiz 已完整驗證**。`match_up` 的編輯器結構已 live 驗證（巢狀 pair-row + leaf `.js-item-input`，與 quiz 不同），已用「依序填 leaf cell」策略實作；`group_sort`/`anagram`/`open_the_box` 沿用同策略但仍 `experimental`，請老師覆核。（Wordwall 的 Generate With AI 對免費帳號為鎖定狀態，不列入自動化。）

## 自動化邊界（ToS 風險控管）

- 這是四平台中選擇器最脆弱者：`.txt` 手動貼入為保底路徑，代填僅在老師明確要求時使用；選擇器失敗立即停止並交還人工。
- 登入/MFA 親自完成；指派前 agent 需在對話中確認；cookies 只存本機 Chromium profile。
- **代填功能需在本機、有螢幕的互動式 agent session 執行**；雲端背景任務/遠端無頭 sandbox/CI 無法顯示瀏覽器視窗，不適用（`.txt` 手動貼入不受此限制）。

## Playwright 流程狀態

`references/flows.md` 記錄步驟與成功證據；quiz/match_up 以外模板標記 experimental。

## License

MIT
