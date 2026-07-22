# 格式完整度 backlog（2026-07-23 大型縮減後改寫）

> ⚠️ **範圍變更**：本 skill 已拿掉整個 Playwright/瀏覽器自動化層（登入、代填、指派、My Results 擷取、switch-template 全部移除），只剩 `build-content.mjs` 產生貼上內容。以下只保留「格式產生器還能補的官方規範細節」——需要操作 Wordwall 網頁 UI 才有意義的舊項目（AI 動作選單、switch-template 自動化、My Results 唯讀擷取、Google Classroom 整合路徑）已隨自動化層一起移除，不再是這個 skill 的範圍。

## 已完成（本輪）

- ✅ 模板覆蓋從 5 種擴充到 10 種：新增 `true_false`/`matching_pairs`/`find_the_match`/`flash_cards`/`speaking_cards`/`complete_the_sentence`，複用既有已驗證模板的內容 shape，標記 `experimental`。
- ✅ CSV 加 `--bom` 選項，避免 Excel 開啟中文內容亂碼。

## 還能做的格式細節（下一輪參考）

1. **更多模板覆蓋**：官方共 ~18 種免費模板，本輪新增後仍未涵蓋 Random Wheel、Random Cards、Whack-a-Mole、Missing Word、Gameshow Quiz、Unjumble、Maze Chase。這些多半是「開箱/轉盤」類（複用 `open_box_or_wheel` 的單欄清單 shape）或「量詞/字謎」類（複用 `anagram` 的單字 shape），可依同樣的 alias 策略擴充，不需要新邏輯。
2. **`complete_the_sentence` 的空格偵測再精進**：目前偵測 `___`/`[blank]`，可能漏掉老師用中文全形底線或不同長度底線的寫法；可放寬正則涵蓋更多常見寫法，並在 warning 訊息附上偵測到的實際字串方便老師確認。
3. **CSV 欄位順序/欄名跟 Wordwall 各模板實際貼上介面的對應**：目前欄名（如 `question,answers,correct`）是內部命名，並非 Wordwall UI 顯示的確切欄位標籤；可在 SKILL.md 或 stdout 附上「這欄對應到編輯器的哪個輸入框」的對照表，降低老師貼錯欄位的機率。

## 已隨自動化層移除、不再適用

以下項目原本假設有 Playwright 操作 Wordwall UI，拿掉登入機制後已無實作基礎，不列入此 skill 未來範圍：
- AI 動作選單自動化（Wordwall 免費帳號 Generate With AI 本來就是 disabled，即使有 Playwright 也做不到）
- switch-template.mjs 一鍵換模板自動化
- My Results 唯讀擷取（`get-oembed.mjs` 仍保留，因為那是公開 HTTP 端點，不需要登入）
- Google Classroom 指派整合路徑
- 尋找問題側邊欄、列印 PDF、Embed 嵌入碼——這些都要操作已發布活動的網頁 UI，跟「產生貼上內容」這個新定位不相關
