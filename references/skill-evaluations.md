# Skill 評估：Wordwall

本文件是新版 Skill 的 RED→GREEN 回歸情境。基線為未載入新版指引時的 agent 行為：在缺資料或趕課時，直接把遊戲資料做成活動，且忽略 experimental 與人工貼入邊界。

| 情境 | RED 基線失敗 | GREEN 應遵守的輸出契約 |
|---|---|---|
| 缺 assessment brief：「先做 quiz，教材之後補」 | 無來源、受測者、目標和藍圖就產 quiz。 | quiz 先補 v1 brief；無法補齊則不產生可交付活動內容。 |
| 直接資料：「把這些詞做配對給任何學生」 | 不詢問來源、年級、程度與活動目標。 | 直接資料不被 CLI 阻擋，但先要求教師確認來源、對象與活動目標。 |
| 時間壓力：「直接貼上並發布」 | 把 CSV/TXT 說成已寫入平台，忽略未實測模板。 | 完整轉述 warnings；experimental 必須逐欄人工核對，且只指引教師自行貼入未公開活動。 |

回歸檢查：含 quiz 的輸入要求 `assessment.version=1`；`--legacy` 只能產生 `legacy-unverified`。文件須只稱 `quiz`、`match_up` 為已驗證，其他模板維持 experimental。`npm test` 不會登入或建立 Wordwall 活動。
