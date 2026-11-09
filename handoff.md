# Handoff - 028_1 國小數學APP

## 🏆 重大里程碑：一年級 108 課綱官方 9 大單元 100% 全量大滿貫！
- **【一年級全量九大核心課綱單元全數落地 ＋ 九大獨立教具完工驗收】**：
  1. **單元一：N-1-1 100以內的數 (位值盒與滿十進位)**（`app/unit_n11.html` ＋ `data/curriculum_v3/g1_n11_place_value.json`）：10 題段考真題，掛載 `<place-value-box>` 雙艙位值盒，支援 300ms 滿十震動光暈與聚合滑移進位。
  2. **單元二：N-1-3 湊十法與拆十法**（`app/unit_n13.html` ＋ `data/curriculum_v3/g1_n13_make_ten.json`）：10 題段考真題，十格陣拋物線飛補（324ms 實測耗時）與三步分解樹。
  3. **單元三：N-1-2 比較型減法**（`app/unit_n12.html` ＋ `data/curriculum_v3/g1_n12_diff_compare.json`）：10 題段考真題，雙軌差值一對一虛線連線與金色超量框。
  4. **單元四：N-1-4 解題 (毛玻璃遮罩數線反推儀)**（`app/unit_n14.html` ＋ `data/curriculum_v3/g1_n14_solve_problem.json`）：10 題段考真題，掛載 `<glass-number-line>`（6,999 B），毛玻璃遮罩未知起點、自終點向左弧形回溯拋物線、遮罩漸變顯露金色真實數字與浮出破招算式。
  5. **單元五：N-1-5 長度 (碰壁基準牆與迴紋針卡尺鏈)**（`app/unit_n15.html` ＋ `data/curriculum_v3/g1_n15_length_compare.json`）：10 題段考真題，掛載 `<snap-caliper-wall>`（4,624 B），碰壁基準線 X=30 磁吸對齊、45px 迴紋針個別單位無縫相扣成鏈、自動量測讀數徽章與雙物體直接比較模式。
  6. **單元六：R-1-1 算式與符號**（`app/unit_r11.html` ＋ `data/curriculum_v3/g1_r11_balance_equal.json`）：10 題段考真題，真力矩天平平衡配平與等號雙向真義。
  7. **單元七：S-1-1 形體之辨認 (向量等角旋轉投影儀)**（`app/unit_s11.html` ＋ `data/curriculum_v3/g1_s11_shape_identify.json`）：10 題段考真題，掛載 `<isometric-rotator>`（8,518 B），破解轉 45° 菱形方位偏見，圓柱拓印長方形展開與上下底圓翻出。
  8. **單元八：S-1-2 形體操作 (物理堆疊與滾動台)**（`app/unit_s12.html` ＋ `data/curriculum_v3/g1_s12_stack_roll.json`）：10 題段考真題，掛載 `<stack-physics-bench>`（3,336 B），正方體平坦面穩定吸附 `STACK_STABLE`、球體弧面接觸連鎖滾落 `ROLL_COLLAPSE`、圓柱直立可堆橫躺會滾。
  9. **單元九：D-1-1 統計與分類 (分類抽屜與正字計數台)**（`app/unit_d11.html` ＋ `data/curriculum_v3/g1_d11_data_sort.json`）：10 題段考真題，掛載 `<data-sorter-bench>`（4,732 B），3 槽分類抽屜不重不漏、正字 5 劃向量筆劃繪製、五的倍數跳數累加、極值分析與一維直條統計長條圖平滑切換。
  10. **統一首頁導航門戶**：`app/index.html` 頂部直通九大正式落地單元與教具調試展台，達成一年級全課綱 100% 大滿貫！
- **【CDP 實機驗真全綠】**：九大單元題卡在 390px / 768px / 960px 視口全數通過（全部 Exit Code 0，CONSOLE_NOISE_COUNT=0），實測截圖全數落盤至 `evidence/`。
- **【全量機械化硬閘門升級】**：`node tools/ac_gate.js` 擴充至 **28 項檢查全部通過 (`GATE_GREEN 28/28`)**，Exit Code **0**。
- **【026 算力閉環實證】**：透過 **通道 2（A-SERVER SSH 備援）** 調用遠端 OpenCode CLI（`iceman-free`）秒級完成帶手腳施工並同步回本機，全流程雲端額度消耗 **$0.00**！

## 🌟 二年級 108 課綱首批單元落地 (2026-11-10)
- **【G2-T01: N-2-6 乘法意義與陣列模型】**：
  - 教具：`app/components/multiplication-array.js` (3,997 B <= 12 KB)
  - 頁面：`app/unit_n26.html`
  - 題庫：`data/curriculum_v3/g2_n26_multiplication.json` (嚴選 10 題段考真題)
  - Git Commit: `b97f5d5`
- **【G2-T02: N-2-1 1000以內的數與三艙位值盒】**：
  - 教具：`app/components/thousand-value-box.js` (6,231 B <= 12 KB)
  - 特色：百位 flat (10x10)、十位 rod (1x10)、個位 cube (1x1)，十位為 0 時脈衝警示「0 佔位不可漏！」，支援「展開各位值/收合為標準數」動態切換。
  - 頁面：`app/unit_n21.html`
  - 題庫：`data/curriculum_v3/g2_n21_place_value_1000.json` (嚴選 10 題段考真題，頂層 Array 格式)
  - 門戶：`app/index.html` 首頁已掛載二年級單元導航卡片。
  - Git Commit: `52fdbcd`
- **【G2-T03: N-2-2 加減算式與直式計算】**：
  - 教具：`app/components/vertical-math-grid.js` (5,729 B <= 12 KB)
  - 特色：二位數/三位數直式對齊網格、滿十進位圈標記、退位借位斜線劃記、逐步演算按鈕。
  - 頁面：`app/unit_n22.html`
  - 題庫：`data/curriculum_v3/g2_n22_vertical_math.json` (嚴選 10 題段考真題，選項隨機打亂，防猜題分佈)
  - 門戶：`app/index.html` 首頁已同步掛載 N-2-2 單元導航。
  - Git Commit: `021dadd`
- **【G2-T04: N-2-11 長度公尺與量尺】**：
  - 教具：`app/components/meter-scale-ruler.js` (5,156 B <= 12 KB)
  - 特色：1公尺=100公分刻度、非0起點斷尺測量算理浮水印（終點－起點＝實際長度）、公尺/公分雙向切換鈕。
  - 頁面：`app/unit_n211.html`
  - 題庫：`data/curriculum_v3/g2_n211_meter_length.json` (嚴選 10 題段考真題，覆蓋斷尺陷阱、生活實物估測與單位換算)
  - 門戶：`app/index.html` 首頁已同步掛載 N-2-11 單元導航。
  - Git Commit: `b7cc90e`
- **【G2-T05: S-2-1 物體之幾何特徵與角】**：
  - 教具：`app/components/angle-vertex-explorer.js` (6,792 B <= 12 KB)
  - 特色：三角/正方/長方/角動態切換、邊/角/頂點三階計數標記、角要素「1頂點+2直線邊」算理徽章、正方形4等邊直角檢視。
  - 頁面：`app/unit_s21.html`
  - 題庫：`data/curriculum_v3/g2_s21_shapes_angles.json` (嚴選 10 題段考真題，曲邊非角陷阱、形體特徵比較，選項完美平衡 2/3/3/2)
  - 門戶：`app/index.html` 首頁已同步掛載 S-2-1 單元導航。
  - Git Commit: `1941b03`
- **【G2-T06: N-2-7 乘法算式與倍數關係】**：
  - 教具：`app/components/multiple-relator.js` (4,915 B <= 12 KB)
  - 特色：單位量（被乘數）與單位數（乘數）分組視覺模型、破招按鈕「6×4 vs 4×6 物理意義對照」。
  - 頁面：`app/unit_n27.html`
  - 題庫：`data/curriculum_v3/g2_n27_multiplication_formula.json` (嚴選 10 題段考真題，被乘數/乘數先後順序、幾的幾倍、0與1的乘法意義)
  - 門戶：`app/index.html` 首頁已同步掛載 N-2-7 單元導航。
  - Git Commit: `7a055cd`
- **【G2-T07: N-2-3 分數之初步認識】**：
  - 教具：`app/components/fraction-pizza-slice.js` (6,008 B <= 12 KB)
  - 特色：圓形披薩幾何等分扇形、點擊高亮選片、**「平分 vs 不平分 陷阱解密」**脈衝警示「⚠️ 每份大小不同，不是平分！不能用分數表示！」。
  - 頁面：`app/unit_n23.html`
  - 題庫：`data/curriculum_v3/g2_n23_fraction_intro.json` (嚴選 10 題段考真題，平分判定、幾分之一記法/讀法、單位分數比較)
  - 門戶：`app/index.html` 首頁已同步掛載 N-2-3 單元導航。
  - Git Commit: `3de2c35`
- **【G2-T08: N-2-4 容量之初步認識（公升與毫升）】**：
  - 教具：`app/components/liquid-measuring-cup.js` (5,941 B <= 12 KB)
  - 特色：動態半透明藍色液位量杯、刻度線 100~1000mL、**「視線平視凹液面」**水平視角圖示防視差徽章、公升/毫升雙向切換鈕。
  - 頁面：`app/unit_n24.html`
  - 題庫：`data/curriculum_v3/g2_n24_volume_capacity.json` (嚴選 10 題段考真題，1公升=1000毫升換算、量杯刻度讀取、溢出比較與生活容量排序)
  - 門戶：`app/index.html` 首頁已同步掛載 N-2-4 單元導航。
  - Git Commit: `d94ab53`
- **【G2-T09: N-2-12 重量的認識（公斤與公克）】**：
  - 教具：`app/components/weight-balance-scale.js` (6,602 B <= 12 KB)
  - 特色：圓盤指針式磅秤（0~1000g / 1kg）、動態指針指向 `weight-g + tare-offset`、**「未歸零倒扣計算陷阱」**警告（讀數 - 歸零誤差 = 實際重量）、公斤/公克即時切換。
  - 頁面：`app/unit_n212.html`
  - 題庫：`data/curriculum_v3/g2_n212_weight_mass.json` (嚴選 10 題段考真題，頂層 Array，平衡分佈 [2, 3, 3, 2])
  - 門戶：`app/index.html` 首頁已同步掛載 N-2-12 單元導航。
  - Git Commit: `46243a6`

## 📱 人類真機盲審驗收與防破版交付 (2026-11-10 Session 17)
- **【十格陣算理借位連動修復】**：針對調試台 T-01 面板湊滿 10 時「右盒 4 沒扣 1 變成 3」之算理視覺脫節，完成卡片面板操作項（`#tfFull`、`#tfPlus`、`#tfMinus`、`#tfNine`、`#tfReset`）與 `ten-frame:full` 全域監聽的借位扣減雙向閉環（右盒真確執行 $4 - 1 = 3$）。
- **【三大教具手機速驗台落地】**：應使用者「每教具 2 題就好」需求，打造 `app/quick_trial.html`（十格陣、雙軌差值、力矩天平各 2 題段考真題，共 6 題）。
- **【Android 360px 窄螢幕防破版深度修復】**：
  - 十格陣在 `<= 420px` 與 `<= 375px` 下透過 CSS 變數動態縮放格距（33px $\rightarrow$ 26px），兩盒並排完全收斂在 288px 內，徹底根除左右兩側被裁切問題。
  - 頂部狀態列精簡為「第 N / 6 題」，右側來源增加省略號防溢出，徹底杜絕折行。
- **【CDP 實機驗真全綠】**：`node tools/ac_run.js app/quick_trial.html tests/ac_quick_trial.js --viewport=360x780` 實測 7/7 checks 全部 PASS，無任何水平滾動溢出（scrollWidth=360），CONSOLE_NOISE_COUNT=0。

## 🚨 額度過量消耗事故覆盤紀錄 (2026-11-10 Session 18)
- **事件通報**：肇事對話框 `3c6ef165` 因使用者詢問「傳動軸在哪裡？」，誤判為啟動整條流水線，陷入 Reactive Wakeup 喚醒死迴圈狂跑 6 小時（4,234 步），直耗雲端付費 Usage 至 20%。
- **核心根因**：混淆「通道三 035 Key Pool 免費 API」與「AGY 對話框付費大腦」；且 026 handoff 第 13 行誤載「優先調用 Flash 分流」，導致 Agent 未打通道三而是在對話框自問自答狂燒付費 Usage。
- **產出覆盤報告**：詳細紀錄已落盤至 `reports/20261110_0440_usage_incident_postmortem/INCIDENT_REPORT.md`。
- **防禦狀態**：已確認所有背景進程（`task`、`subagent`、`schedule`）100% 徹底終止，即刻啟動額度保溫戒嚴。

## 🚦 目前狀態
- **當前版本**：`v14.1.1` (Incident Postmortem Recorded, Background Process Fully Terminated, System Idle)
- **健康狀態**：🟢 18 個單元 180 題真實段考題全量通過 ＋ 6 題極速體驗台，`tools/ac_gate.js` 28/28 全綠 (Exit 0)
- **Git 狀態**：本地工作區完全乾淨
- **工作區處置**：本專案靜止待命，待 026 修正分流邏輯後再行接續。

## ➡️ 下一步（開新框首要任務）
1. **026 調度器修復確認**：確認 026 已廢除雲端 Flash 偷跑通道，貫徹通道 1/2 本地帶手腳施工。
2. **實機體驗 6 題極速體驗台**：開啟 `app/quick_trial.html`，以手機體驗十格陣、雙軌差值、力矩天平 6 題手感。
3. **啟動 G2-T10: N-2-13 鐘面的認識**：由 A-SERVER 帶手腳施工 `<clock-time-explorer>` 與 10 題真題。

## ⚠️ 注意事項
- **純靜態自足**：全頁面 0 外部庫依賴，離線秒開。
- **嚴格 10 題憲法**：每單元嚴格只做 10 題真實段考題，杜絕隨機刷題。
- **戒嚴防燒乾**：Usage < 30% 嚴禁任何雲端測試或探索性執行。

## 🕐 最後更新
- 時間：2026-11-10T04:38:00+08:00
- 更新者：AGY (Session 18 收工歸檔)
- Git push 狀態：本地已 commit（Commit 278562e，無遠端 remote）
