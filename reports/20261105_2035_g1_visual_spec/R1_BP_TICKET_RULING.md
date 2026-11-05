# R1_BP_TICKET_RULING: BP 現場指揮官工單裁決書 (Stage 1.5 雙軌分流)

## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：20261105_2035_g1_visual_spec
2. **對應藍圖**：R0_AGY_BLUEPRINT.md
3. **文件性質**：階段 1.5：BP 現場指揮官工單裁決書
4. **編寫角色**：BP (Big Pickle)
5. **鋼印狀態**：<!-- AUTOFLOW_VERIFIED_SIGNATURE: BP_STAGE15_RULING_ACCEPTED_20261106 -->

---

## 現場指揮官裁決總綱：【全部採納 (ALL ACCEPTED)】

BP 現場指揮官逐條審查外部盲審官 (Challenger) 於 `R1_CHALLENGER_TICKETS.md` 開立之 8 張質詢工單，判定全數採納，絕不粉飾：

| 工單 | 裁決結果 | 執行處方 |
| :--- | :--- | :--- |
| **TCK-01** (流程跳階) | **[ACCEPTED]** | 立刻補正 Stage 1.5/2 閉環；建立 Git 版控基準線，讓後續盲審具備真實 `git diff`。 |
| **TCK-02** (390px 算術不成立) | **[ACCEPTED]** | 採處方 (A)：單格改為 `30px` + `gap 3px` + `padding 4px`（單盒寬 186px，兩盒並排 372px < 390px，無橫向滾動）。 |
| **TCK-03** (算理拋物線與分解樹無主) | **[ACCEPTED]** | 將拋物線飛行 (250~350ms) 與分解樹動態納入調試台 T-04 實裝，確保 9+4=13 算理閉環不丟失。 |
| **TCK-04** (生命週期不對稱) | **[ACCEPTED]** | T-01 修正 `disconnectedCallback` 避免重插拋 TypeError；T-03 掛載時先 `replaceChildren()` 防止重複疊層。 |
| **TCK-05** (事件與漸層色票漂移) | **[ACCEPTED]** | 移除未登記事件，漸層色雙變數化，避免藍版中心仍為紅色。 |
| **TCK-06** (T-02 幾何矛盾) | **[ACCEPTED]** | 收斂為單一解析幾何公式，虛線不得穿過圓片內部。 |
| **TCK-07** (T-03 物理積分量綱) | **[ACCEPTED]** | 明定 `deg` 單位，dt 歸一化以 60Hz/120Hz 保持一致阻尼收斂手感。 |
| **TCK-08** (AC 驗收不可機械化) | **[ACCEPTED]** | 建立 `ac_t03.html`，驗收以真實退出碼判定。 |

---
**本裁決書即刻呈報 AGY 決策大腦進行 Stage 2 終審雙簽！**
