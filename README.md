# tw-wordwall-skill

台灣 K-12 教師用的 Wordwall agent skill：產生逐題貼上的 `.csv`/`.txt`（quiz/配對/字謎/分組/開箱轉盤），查詢已發布活動 oEmbed，並以 Playwright 輔助代填題目與設定指派。

自 [edu-agent-kit](https://github.com/FW1201/edu-agent-kit) 的 Wordwall adapter 獨立而來（來源 commit `a7eaa0f`）。Wordwall 無內容創建/批次匯入 API。

## 安裝

```bash
npx skills add FW1201/tw-wordwall-skill
cd <skill-dir> && npm install && npx playwright install chromium
```

## 腳本

| 腳本 | 功能 |
|---|---|
| `scripts/build-content.mjs` | 產生貼上用 `.csv`/`.txt`（五模板，含 warnings） |
| `scripts/get-oembed.mjs` | 讀已發布活動 oEmbed（唯讀、免登入） |
| `scripts/pw/login.mjs` | 可見視窗登入（session 存 `~/.tw-edu-skills/wordwall/profile/`） |
| `scripts/pw/create-activity.mjs` | 代填題目建活動（v1：quiz/match_up；其餘 experimental） |
| `scripts/pw/set-assignment.mjs` | Set Assignment 並取得指派連結 |
| `scripts/pw/switch-template.mjs` | 一鍵換模板（差異化） |

## 自動化邊界（ToS 風險控管）

- Wordwall 無 API：自動代填＝在老師自己的可見編輯器 session 逐項輸入，是「手動輸入加速」，非抓取或繞過。
- 這是四平台中選擇器最脆弱者：`.txt` 手動貼入為預設路徑，代填僅在老師明確要求時使用；選擇器失敗立即停止並交還人工。
- 登入/MFA 由使用者親自完成；指派前 agent 需在對話中確認；cookies 只存本機 Chromium profile。

## Playwright 流程狀態

`references/flows.md` 記錄步驟與成功證據；quiz/match_up 以外模板標記 experimental，`last-verified: PENDING` 前皆為 provisional。

## License

MIT
