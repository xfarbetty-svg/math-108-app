# 任務卡：Step 17 - G2-S-2-2 簡單幾何形體 概念小教室

## 任務目標
基於 `app/components/g2_template_lab.html` 黃金樣板，為 108 課綱二年級單元 `G2-S-2-2 簡單幾何形體（正方體、長方體、圓柱、球的面邊頂點結構、沾印泥蓋印章拓印平面圖形、正方體與長方體對比）` 打造專屬的「四幕式物理概念小教室」：
1. 產出檔案：`app/components/g2_shapes_lab.html`
2. 路由更新：在 `app/shell.js` 的 `CONCEPT_COMPONENTS` 中註冊 `S-2-2`：
   ```js
   "S-2-2": "components/g2_shapes_lab.html",
   ```

## 課綱教學標準與四幕設計要求
1. **Act 1: 觀念大解剖 (3D 積木解剖儀 / 面、邊、頂點大點名)**
   - 繪製純 SVG 3D 等角透視立體積木（正方體/長方體可切換）。
   - 提供三個互動按鈕：
     - 【數面 (Face)】：6 個面依序染色閃爍，計數器亮出「6 個面」。
     - 【數頂點 (Vertex)】：8 個尖尖角亮起金色星星，計數器亮出「8 個頂點」。
     - 【數邊 (Edge)】：12 條稜邊亮起高光，計數器亮出「12 條邊」。
     - 調用 `AudioManager.play("正方體有6個面, 8個頂點, 12條邊")`。

2. **Act 2: 物理探索器 (印章拓印工坊 / 立體印出平面)**
   - 舞台提供白紙與印泥。
   - 點選積木蓋印章：
     - 正方體 ➔ 蓋出「正方形」！
     - 長方體 ➔ 蓋出「長方形」！
     - 圓柱 ➔ 蓋出「圓形」！
     - 深刻體會立體形體與平面圖形之間的關聯（面是立體的外皮）。

3. **Act 3: 規律大發現 (正方體 vs 長方體 雙胞胎透視鏡)**
   - 雙欄對比卡片：
     - 正方體：6 個面都一樣大、12 條邊一樣長。
     - 長方體：相對的面一樣大、邊有長有短。
     - 圓柱與球體的特殊特徵對照。
   - 點選卡片高亮說明，並調用 `AudioManager.play` 語音導覽。

4. **Act 4: 小小挑戰賽 (形體結構神算手)**
   - 3 題形體特徵互動題（面邊頂點數量、蓋印章圖形辨識、形體名稱判斷）。
   - 選項按鈕即時判定反饋，正確綠色慶祝，錯誤給予解剖提示，語音正向鼓勵。

## 硬性品質標準
- 手機視口 390px 寬度 100% 入屏，零橫向溢出 (`overflow-x: hidden`)。
- 操作區 stage 高度 $\le 420\text{px}$，全屏總高 $\le 740\text{px}$ 免滑動。
- 強制引入 `<script src="../js/audio_manager.js"></script>` 並調用 `window.AudioManager.play()`，禁用 `speechSynthesis`。
- 暴露 `window.G2_LAB_SELFTEST` 包含 `switchAct`、`reset`、`state`。

## 驗收指令
```bash
node tools/verify_g2_concept_labs.js --unit g2_shapes_lab.html
```
Exit code 必須為 0！
