# 任務卡：Step 3 - G2-N-2-2 加減算式與直式計算 概念小教室

## 任務目標
基於 `app/components/g2_template_lab.html` 黃金樣板，為 108 課綱二年級單元 `G2-N-2-2 加減算式與直式計算` 打造專屬的「四幕式物理概念小教室」：
1. 產出檔案：`app/components/g2_vertical_addition_subtraction_lab.html`
2. 路由更新：在 `app/shell.js` 的 `CONCEPT_COMPONENTS` 中註冊 `N-2-1` 與 `N-2-2`：
   ```js
   "N-2-1": "components/g2_place_value_1000_lab.html",
   "N-2-2": "components/g2_vertical_addition_subtraction_lab.html",
   ```

## 課綱教學標準與四幕設計要求
1. **Act 1: 觀念大解剖 (位值對齊與算柱結構)**
   - 繪製純 SVG 雙色位值算柱（十位藍色、個位橘色）。
   - 橫式算式（例如 38 + 25）動態拆解飛入直式算柱：個位對齊個位（8+5）、十位對齊十位（3+2）。
   - 語音提示「個位對齊個位，十位對齊十位，這是直式計算的第一法則！」。

2. **Act 2: 物理探索器 (滿十進一與借一當十)**
   - 支援「加法進位」與「減法退位」雙模式切換。
   - **加法進位模式**：個位盤內有 10 個小橘點，觸控拖曳框選或拖曳第 10 顆圓點向左拖入「十位算柱」，觸發融合動畫（10 顆橘點融合成 1 顆藍點），上方小進位數字標註「1」。
   - **減法退位模式**：個位不夠減時，從十位算柱拖曳 1 顆十位藍點向右進入個位算柱，觸發碎裂拆解動畫（1 顆藍點拆成 10 顆橘點），十位數字劃線減 1、個位加上 10。
   - 真實指針事件監聽（`pointerdown`, `pointermove`, `pointerup`, `setPointerCapture`），支援觸控與滑鼠拖曳磁吸。

3. **Act 3: 規律大發現 (分步直式動態計算機)**
   - 提供「上一步 / 下一步」分步引導演示：
     - Step 1：個位相加（8 + 5 = 13），個位寫 3，十位頭上小「1」亮起飛入。
     - Step 2：十位相加（3 + 2 + 進位1 = 6），十位寫 6。
     - Step 3：最終答案 63。
   - 附帶減法退位分步切換。

4. **Act 4: 小小挑戰賽 (直式填空互動挑戰)**
   - 提供直式算式填空互動題（例如填寫個位數、進位小標記或十位數）。
   - 即時判定對錯，綠色慶祝/紅色提示，連動 `AudioManager.play` 曉臻高音質語音反饋。

## 硬性品質標準
- 手機視口 390px 寬度 100% 入屏，零橫向溢出 (`overflow-x: hidden`)。
- 操作區 stage 高度 $\le 420\text{px}$，全屏總高 $\le 740\text{px}$ 免滑動。
- 強制引入 `<script src="../js/audio_manager.js"></script>` 並調用 `window.AudioManager.play()`，禁用 `speechSynthesis`。
- 暴露 `window.G2_LAB_SELFTEST` 包含 `switchAct`、`reset`、`state`。

## 驗收指令
```bash
node tools/verify_g2_concept_labs.js --unit g2_vertical_addition_subtraction_lab.html
```
Exit code 必須為 0！
