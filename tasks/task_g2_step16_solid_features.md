# 任務卡：Step 16 - G2-S-2-1 物體之幾何特徵 概念小教室

## 任務目標
基於 `app/components/g2_template_lab.html` 黃金樣板，為 108 課綱二年級單元 `G2-S-2-1 物體之幾何特徵（滾動與滑動斜坡實驗、平面與曲面、積木堆疊穩定性、生活形體分類）` 打造專屬的「四幕式物理概念小教室」：
1. 產出檔案：`app/components/g2_solid_features_lab.html`
2. 路由更新：在 `app/shell.js` 的 `CONCEPT_COMPONENTS` 中註冊 `S-2-1`：
   ```js
   "S-2-1": "components/g2_solid_features_lab.html",
   ```

## 課綱教學標準與四幕設計要求
1. **Act 1: 觀念大解剖 (斜坡滾動與滑動實驗室)**
   - 繪製純 SVG 斜坡。
   - 提供物體切換按鈕：
     - 【皮球】：點擊出發，球體在斜坡上旋轉「滾動」而下，標註「曲面會滾動」。
     - 【方塊積木】：點擊出發，積木平貼斜坡「滑動」溜下，標註「平面只能滑動」。
     - 【圓柱罐子】：橫躺放會滾動，直立放會滑動！
     - 調用 `AudioManager.play("有曲面的東西可以滾動, 平平的面只能滑動")`。

2. **Act 2: 物理探索器 (積木堆疊高塔大挑戰)**
   - 提供正方體、直立圓柱、橫躺圓柱與皮球。
   - 點擊「往上堆疊」：
     - 平面對平面（正方體疊正方體、圓柱平面朝上）：穩固堆高，亮綠燈「成功堆疊」！
     - 曲面對平面（皮球放在積木上、或橫躺圓柱）：物體滑落滾開，亮橘燈「曲面無法穩固堆疊」！
     - 深刻體會平面的堆疊穩定性。

3. **Act 3: 規律大發現 (平面 vs 曲面 觸摸顯微鏡)**
   - 展示三大形體的面結構：
     - 正方體：6 個平面（平平的）
     - 圓柱：2 個平面 + 1 個曲面（能滾也能疊）
     - 球體：只有 1 個曲面（四面八方都能滾）
   - 點選卡片高亮重點，並調用 `AudioManager.play` 語音導覽。

4. **Act 4: 小小挑戰賽 (形體特徵分類大師)**
   - 3 題生活形體特徵題（能滾又能疊的物體、只能滑動的物體、堆疊高塔選擇題）。
   - 選項按鈕即時判定反饋，正確綠色慶祝，錯誤給予斜坡提示，語音正向鼓勵。

## 硬性品質標準
- 手機視口 390px 寬度 100% 入屏，零橫向溢出 (`overflow-x: hidden`)。
- 操作區 stage 高度 $\le 420\text{px}$，全屏總高 $\le 740\text{px}$ 免滑動。
- 強制引入 `<script src="../js/audio_manager.js"></script>` 並調用 `window.AudioManager.play()`，禁用 `speechSynthesis`。
- 暴露 `window.G2_LAB_SELFTEST` 包含 `switchAct`、`reset`、`state`。

## 驗收指令
```bash
node tools/verify_g2_concept_labs.js --unit g2_solid_features_lab.html
```
Exit code 必須為 0！
