<p align="center"><img src="assets/logo.png" width="88" alt="Wordwall logo"></p>

# tw-wordwall-skill

把教師教材與學習目標整理為 Wordwall 活動，依模板產生可貼入內容，並說明轉換損失與教師確認項目。 目前版本：**0.5.0-rc.6（候選版）**。本專案為獨立教師工具，並非 Wordwall 官方產品。

## 能力與限制

| 項目 | 本 Skill 協助 | 範圍與限制 |
|---|---|---|
| 模板與內容 | 依 `quiz`、`match_up` 等模板產生 CSV、TXT；其他模板保留 experimental 標示 | 教師確認目標模板欄位及實際呈現；不保證 CSV 自動匯入 |
| 資料保真 | 不猜測無法判斷的真偽答案；多正解配對題不靜默丟棄 | 被跳過時回報 partial 和 warnings，需人工修訂 |
| 活動建立 | 依宿主可用能力、授權及現有登入介面操作或交由教師貼入 | 範例驗證是逐欄輸入；CLI 自動建立未驗證 |
| 延伸模式 | 提供模板切換、紙本、指派與結果的操作指引 | 實際選項依帳號、模板及平台介面 |

## 從教材到平台

1. 提供教材檔案或連結、適用年級、學習目標、課堂時間、設備與希望使用的模式。未能讀取的來源會標示，不根據檔名猜測。
2. Agent 整理來源、目標、活動、操作、回饋與學習證據；使用 [教學 brief 範例](assets/lesson-brief-v1.example.json) 與 `lesson` 檢查來源 ID 和時間等結構。
3. 根據實際可用的 connector／MCP、官方 API、CLI、已登入瀏覽器或人工匯入路徑準備內容；建立或上傳僅在使用者授權且工具可用時執行。
4. 回報來源對應、產物、連結與已知狀態，列出跳過、格式轉換、媒體損失及需手動補入項目。逾時或結果不明時先核對現有資源，避免重複建立。
5. **平台成果與最終驗收交由教師人工確認。** Agent 不自動試玩或模擬學生操作，也不將試玩列為交付條件；未經確認的內容不宣稱已驗收。分享、發布與指派依授權及當時工具能力處理。

## Wordwall 內容轉換

```bash
node scripts/build-content.mjs input.json --template quiz --out-dir out/
```

輸入與命題藍圖參見 [assessment 範例](references/assessment-brief.example.json)。含 quiz 的輸出須檢查 quality report，直接資料模板另須確認來源、對象與目標。輸出中的 warnings、`experimental` 和 `partial` 應完整交給教師。更多模板與既有 CLI 指令見 [CLI 使用手冊](references/cli-guide.md)。

## 給 Agent 的指令範例

> 請依這份七年級教材設計 15 分鐘 Wordwall 配對活動，保留來源與答案，產生可貼入資料並列出教師需檢查的項目。

教學 brief 範例可用下列命令檢查；結構通過不代表學科內容已經教師審核：

```bash
node scripts/tw-edtech-wordwall.mjs lesson --input assets/lesson-brief-v1.example.json
```

## 安裝與環境檢查

需要 Node.js 18 以上；平台操作另依所選路徑需要網路、平台權限與使用者登入。沒有 connector 不會阻止本地教材設計或現有支援的匯入檔產生。

```bash
git clone https://github.com/FW1201/tw-wordwall-skill.git
cd tw-wordwall-skill
npm ci --ignore-scripts
node scripts/portable-core/agent-doctor.mjs --agent codex
```

`codex` 可改成 `claude`、`antigravity`、`opencode` 或 `other`。診斷檢查 Node、npm、作業系統、安裝位置與同名 Skill；它不會顯示憑證，也不會憑本機程序推定 connector、平台登入或權限可用。結果為 `unknown` 時，請在當前 Agent 中確認。

### 安裝到 Agent 專案

先將下列 `<既有專案目錄>` 換成實際路徑；安裝器先執行診斷，預設只預覽：

```bash
node scripts/portable-core/install.mjs --agent codex --project <既有專案目錄>
node scripts/portable-core/install.mjs --agent codex --project <既有專案目錄> --apply --with-deps
```

其他 Agent 將 `codex` 換成對應名稱。同名目標預設拒絕覆蓋；升級時先預覽 `--upgrade`，確認目標後使用 `--upgrade --apply --with-deps`。舊版會備份至專案 `.edtech-skill-backups/`，準備依賴失敗時保留原版。安裝器僅處理專案 Skill，不會設定全域 MCP、登入或保證自動觸發。重新載入 Agent，確認實際讀取的 Skill 路徑。詳細修復與回復見 [跨 Agent 整合](references/portable-integration.md)。

## Connector、MCP 與替代路徑

本 Skill 優先評估當前宿主工具是否能完成指定任務，再依可用性選擇 connector、MCP、官方 API、CLI、Computer Use 或人工匯入。工具路由需要本次實際的能力與權限證據；CLI 本身不能直接呼叫 Codex 的內建 connector。呼叫失敗、逾時或回應不明時會與成功分開處理，不自動重送可能已寫入的動作。

四平台另有獨立的 MCP Skills 套件，提供 Skill 入口及參考資源；它不附帶平台 connector，不代表宿主會自動啟用 Skill。MCP 套件並非本儲存庫的一部分；需取得其獨立發佈檔再配置。

## 相容性與驗證狀態

| Agent | 目前證據 | 尚待確認 |
|---|---|---|
| Codex | 曾以明確指名在新對話讀取四個 Skill；一般 MCP 清單與讀取工具曾測試 | 自動觸發、各帳號及所有平台操作不保證 |
| OpenCode | 曾在新對話測試 Padlet Skill 的明確指名與自然語句載入 | 本 Skill 各版本及 connector 路徑未逐一實測 |
| Claude Code | 本機已安裝，當時 OAuth 工作階段過期 | 登入後載入、新對話與工具路徑待實測 |
| Antigravity | 本機已安裝並確認 CLI 版本 | 技能載入及工具路徑待實測 |
| Grok Bot | 已納入可攜式設計考量 | 雲端安裝、執行與 MCP 相容性未實測 |

平台方案、介面、權限與工具可能變動。各模式已觀察範圍見 [平台模式](references/platform-modes.md) 與 [驗證紀錄](references/release-validation.md)；不把單次範例延伸成所有功能已驗證。

## 維護與測試

```bash
npm test
git diff --check
```

自動化測試不登入、不代替平台成果的人工審查。詳細既有命令、格式與疑難排解見 [CLI 使用手冊](references/cli-guide.md)；平台與 API 使用均依授權及各平台當前條件。不要將密碼、API key、Cookie 或不必要的學生資料放進教材、日誌或版本庫。

## 四平台專案

[Wordwall](https://github.com/FW1201/tw-wordwall-skill) · [Padlet](https://github.com/FW1201/tw-padlet-skill) · [Wayground](https://github.com/FW1201/tw-wayground-skill) · [Kahoot](https://github.com/FW1201/tw-kahoot-skill)

MIT License
