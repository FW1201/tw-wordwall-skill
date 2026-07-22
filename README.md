<p align="center"><img src="assets/logo.png" width="88" alt="Wordwall logo"></p>

# tw-wordwall-skill

> ⚠️ **非官方工具**：本套件**不是** Wordwall 官方產品，也**非**其認可的整合。Wordwall 沒有內容創建/批次匯入 API，本套件只產生老師可以直接貼上/匯入 Wordwall 編輯器的檔案，不做任何瀏覽器自動化或登入。

台灣 K-12 教師用的 Wordwall agent skill：一句話把題目 JSON 轉成 Wordwall 逐模板貼上就緒的 `.csv`/`.txt`，老師自行到 wordwall.net 建立活動、發布、設定指派。

自 [edu-agent-kit](https://github.com/FW1201/edu-agent-kit) 的 Wordwall adapter 獨立而來（來源 commit `a7eaa0f`）。

## 這套 skill 能做什麼

老師把題目給 agent，agent 產生對應模板的貼上內容檔案（quiz/配對/字謎/分組/開箱轉盤/是非題/完成句子…共 10 種模板），附上完整度警告（哪些題目因欄位不足被略過），老師拿著檔案登入 Wordwall 自行貼入、發布、設定指派。

## 快速上手

```bash
cd <skill-dir> && npm install                                        # 首次
node scripts/build-content.mjs input.json --template quiz --out-dir out/
```

> `input.json` 需符合 `WordwallContentInput`（`quiz.questions[]` / `pairs[]` / `words[]` / `groups[]` / `sentences[]`）；也可直接餵裸 quiz.json。

## 自然指令範例

| 老師說 | 觸發 |
|---|---|
| 「把這 10 題轉成 Wordwall 測驗貼上內容」 | `build-content.mjs --template quiz` |
| 「做一個配對遊戲的內容」 | `build-content.mjs --template match_up` |
| 「幫我做是非題版本」 | `build-content.mjs --template true_false` |
| 「查一下這個已發布活動的資訊」 | `get-oembed.mjs`（唯讀） |

## 功能總覽

| 腳本 | 用途 | 輸入 | 輸出 |
|---|---|---|---|
| `scripts/build-content.mjs` | 產生貼上用 `.csv`/`.txt`（10 種模板） | `input.json` | 檔案 + warnings + experimental |
| `scripts/get-oembed.mjs` | 讀已發布活動 oEmbed（唯讀、免登入） | `<url>` | oEmbed |

模板支援：**quiz、match_up 已完整驗證**（曾以真實登入帳號測過編輯器）；`anagram`/`group_sort`/`open_box_or_wheel` 沿用既有格式；`true_false`/`matching_pairs`/`find_the_match`/`flash_cards`/`speaking_cards`/`complete_the_sentence` 是本輪新增，內容形狀與已驗證模板相同但標記 `experimental`，請老師貼入後核對。

## 為什麼沒有瀏覽器自動化

這套 skill 原本用 Playwright 自動化登入＋逐題代填＋設定指派整條鏈。Google OAuth 會拒絕 Playwright 自動化的瀏覽器，之後改用連接使用者另外啟動的「正常 Chrome」（CDP）解決登入問題；但即便如此，**選擇器驅動的 UI 自動化本身仍然不穩定**——Wordwall 又是四平台中選擇器最脆弱的一個。現在改成只產生最大程度符合 Wordwall 貼上慣例的檔案，平台 UI 的最後一哩路（貼入、發布、指派）交給老師，不再嘗試自動操作瀏覽器。

## License

MIT
