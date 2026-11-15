# 斷點交接日誌 (Handoff Log)

## ⏯️ 目前做到哪（Session 48：2026-11-15 23:55）

本 Session 遵照使用者最高指示，開啟二年級 (G2) 兩階段推進實驗（概念探索優先，嚴格遵守 AGY 手腳鎖定、雙簽門禁、全通道 $0 算力派工與新語音標準）：

1. **資產全面盤點**：
   - 深入檢測 `D:\ANTIGRAVITY\028_國小數學APP\data\question_bank.json`，確認其中完整保存 **26 個主題、497 道二年級真題**（398 題中央大學子由小學堂官方教研題 + 77 題台北市課綱評量真題 + 16 份原始 PDF）。
   - 與使用者確立**兩階段戰略**：第一階段專注「24 單元四幕式物理概念小教室」；第二階段再將 497 題真題清洗映射入庫。

2. **Step 1：G2 規範樣板與 CDP 驗收骨架落地**：
   - 通道一派工完成 `app/components/g2_template_lab.html`（613 行）與專屬守門員 `tools/verify_g2_concept_labs.js`。
   - 確立四大硬規：手機 390px 視口零橫溢、教具高度 $\le 420\text{px}$、強制接入 `AudioManager` 曉臻高音質自然語音、暴露 `window.G2_LAB_SELFTEST`。

3. **Step 2：G2-N-2-1 一千以內的數 概念小教室落地**：
   - 產出 `app/components/g2_place_value_1000_lab.html` (1017 行)。
   - 四幕活動：千/百/十/個別位值解剖、百格板真實拖曳磁吸堆疊滿 10 個融合成「金色 1000 立方體」、三位數計數器連動數線指針、積木辨識答題。
   - CDP 實機測量通過，Exit Code 0。

4. **Step 3：G2-N-2-2 加減算式與直式計算 概念小教室落地**：
   - 產出 `app/components/g2_vertical_addition_subtraction_lab.html` (38.4 KB)。
   - 四幕活動：位值算柱橫式轉直式對齊、滿十進一拖曳融合與借一當十碎裂拆解、直式分步逐步引導計算器、直式填空挑戰。
   - 更新 `app/shell.js` 完成 `N-2-1` 與 `N-2-2` 路由註冊。

5. **Step 4：G2-N-2-5 幣值與錢幣換算 概念小教室落地**：
   - 產出 `app/components/g2_money_change_lab.html` (39.2 KB)。
   - 四幕活動：新台幣千元/五百/百元大鈔與硬幣擬物化解剖、自動換錢機拖曳兌換、超市付錢與找零計算機、收銀找零挑戰。
   - 更新 `app/shell.js` 完成 `N-2-5` 路由註冊。

6. **全量 CDP 回歸測試全綠**：
   - 執行 `node tools/verify_g2_concept_labs.js`，全部 4 套實驗室（template, N-2-1, N-2-2, N-2-5）手機 390px 視口、4 幕按鈕連動、高度閘門、Console 0 報錯全項綠燈通過！

---

## 🚦 目前狀態

- **可運行狀態**：全站與新概念小教室完美可運行，純前端離線可用。
- **已註冊路由**：
  - `N-2-1`: `components/g2_place_value_1000_lab.html`
  - `N-2-2`: `components/g2_vertical_addition_subtraction_lab.html`
  - `N-2-5`: `components/g2_money_change_lab.html`
- **施工進度**：Wave 1 完成 3/6 單元（N-2-1, N-2-2, N-2-5 已勾選 `[x]`，剩餘 Step 5~7 待接續）。

---

## ➡️ 下一步（Next Session 目標）

1. **接續推進 Wave 1 剩餘 3 個單元概念小教室**：
   - Step 5: `G2-N-2-6 乘法啟蒙` (`g2_multiplication_intro_lab.html`) —— 盤子裝蘋果幾個幾、連加算式與乘號動態誕生、倍數階梯。
   - Step 6: `G2-N-2-7 九九乘法表` (`g2_multiplication_table_lab.html`) —— 點子陣列矩陣、乘法表斜對角對稱規律。
   - Step 7: `G2-N-2-11 長度（公分與公尺）` (`g2_meter_length_lab.html`) —— 100公分拼接長尺、伸縮捲尺拉出1公尺。
2. **跑通全量 CDP 驗證後，推進 Wave 2**。

---

## ⚠️ 注意事項

- **語音規範**：所有新建實驗室必須 `<script src="../js/audio_manager.js"></script>` 並使用 `AudioManager.play(text)`，禁止呼叫原生 `speechSynthesis`。
- **算力排程**：通道一 (OpenCode CLI) 帶真實工具施工；若遇到超時保護，自動容災至通道二 (A-SERVER SSH)，AGY 嚴禁動手寫業務代碼。
- **真題資產儲備**：028 庫存 497 題 G2 題目已確認完好，待概念探索全部攻克後，再執行第二階段資料映射。

---

## 🕐 最後更新
- **時間**：2026-11-15 23:56 (Session 48)
- **更新者**：Antigravity (AGY) @ DESKTOP-6ELKIRH
- **Git Push 狀態**：✅ 已推 (`6caa696`，Cloudflare Pages 自動部署完成)
