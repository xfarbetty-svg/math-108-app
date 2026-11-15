# 任務卡：Step 13 - G2-N-2-12 容量、重量、面積感官比較 概念小教室

## 任務目標
基於 `app/components/g2_template_lab.html` 黃金樣板，為 108 課綱二年級單元 `G2-N-2-12 容量、重量、面積感官比較（水杯互倒容量比較、天平槓桿比重量、疊合與方塊鋪排比面積）` 打造專屬的「四幕式物理概念小教室」：
1. 產出檔案：`app/components/g2_measure_compare_lab.html`
2. 路由更新：在 `app/shell.js` 的 `CONCEPT_COMPONENTS` 中註冊 `N-2-12`：
   ```js
   "N-2-12": "components/g2_measure_compare_lab.html",
   ```

## 課綱教學標準與四幕設計要求
1. **Act 1: 觀念大解剖 (容量倒水實驗室 / 水杯大比小)**
   - 繪製純 SVG 高瘦杯（A）與矮胖杯（B）。
   - 提供「裝滿 A」與「把 A 倒進 B」按鈕：
     - 動態倒水動畫。
     - 若水滿溢出來 ➔ 表示杯 A 容量大於杯 B！
     - 若水裝不滿 ➔ 表示杯 B 容量大於杯 A！
     - 旁白氣泡：「把水倒過去，溢出來表示原本的水比較多，容量比較大！」
     - 調用 `AudioManager.play("把水倒過去, 溢出來代表原本的水比較多, 容量比較大")`。

2. **Act 2: 物理探索器 (天平秤重大師 / 重量直接比較)**
   - 繪製純 SVG 雙盤天平與指針。
   - 提供西瓜、蘋果、鐵球、棉花等物品：
     - 點選或拖曳放上左右托盤。
     - 天平根據重量即時物理傾斜：
       - 下沉的一端 ➔ 【比較重】
       - 上升的一端 ➔ 【比較輕】
       - 平衡水平 ➔ 【一樣重】
     - 特別展示棉花與鐵球對比：直觀破除「體積大一定比較重」的迷思！

3. **Act 3: 規律大發現 (面積疊合與方格鋪排 / 面積量感)**
   - 展示長方形 A 與 L 型圖形 B。
   - 提供兩種比較法切換：
     - ① **疊合法**：圖形 B 移動疊在圖形 A 上，露出邊界看誰大。
     - ② **積木鋪排法**：圖形自動鋪上一格格黃色小方塊，數數看 A 有 12 格、B 有 10 格 ➔ 12 格 > 10 格，A 面積比較大！
   - 點選卡片高亮說明，並調用 `AudioManager.play` 語音導覽。

4. **Act 4: 小小挑戰賽 (度量三合一大挑戰)**
   - 3 題生活感官度量題（容量比大小、天平比輕重、磁磚格子比面積）。
   - 選項按鈕即時判定，正確綠色慶祝，錯誤給予圖解提示，語音正向鼓勵。

## 硬性品質標準
- 手機視口 390px 寬度 100% 入屏，零橫向溢出 (`overflow-x: hidden`)。
- 操作區 stage 高度 $\le 420\text{px}$，全屏總高 $\le 740\text{px}$ 免滑動。
- 強制引入 `<script src="../js/audio_manager.js"></script>` 並調用 `window.AudioManager.play()`，禁用 `speechSynthesis`。
- 暴露 `window.G2_LAB_SELFTEST` 包含 `switchAct`、`reset`、`state`。

## 驗收指令
```bash
node tools/verify_g2_concept_labs.js --unit g2_measure_compare_lab.html
```
Exit code 必須為 0！
