# R2_AGY_PLAN_REVIEW - N-1-5 長度比較 (碰壁基準牆與迴紋針卡尺鏈) 施工放行書

- **條目代號**：N-1-5（一年級：長度 — 長度直接比較、間接比較與個別單位）
- **核心教具**：`<snap-caliper-wall>`
- **審查人**：AGY（外骨骼大腦）
- **依據**：`R0_AGY_BLUEPRINT.md` 與 `R1_BP_EXECUTION_PLAN.md`
- **放行狀態**：`MUTUAL_CONSENT_APPROVED`

---

## 1. 核心規格核准確認

1. **體積預算與技術約束**：
   - 守門硬指標：`app/components/snap-caliper-wall.js` 單檔體積 $\le 12,288$ B（12 KB）。
   - 純原生 Web Component，零外部 CDN，純 SVG + 原生 DOM。
2. **算理與狀態機核准**：
   - 碰壁基準牆（左側 $X=30\text{px}$ 垂直紅線）：支援 `alignWall()` 與接近磁吸（`WALL_ALIGN`），未對齊時不可進行有效讀數。
   - 個別單位鏈（45px 迴紋針）：首枚必緊貼 $X=30$，後續枚自動銜接在 $30 + (k-1) \times 45$，零空隙零重疊（`CHAIN_SNAP`）。
   - 自動讀數：排滿時顯示「剛好 X 根迴紋針長」（`READOUT_EXACT`）。
   - 雙物體直接比較模式：兩物體在同一基準線（$X=30$）並排，超量部分高亮框選（`DUAL_COMPARE`）。
3. **驗收規格**：
   - 獨立驗收頁 `tests/ac_snap_caliper_wall.html`（15 項檢驗）。
   - 納入 `tools/ac_gate.js` 機械化閘門。

---

## 2. 施工派工指令

- **派工單位**：通道 2 (A-SERVER SSH OpenCode CLI Worker `iceman-free`)
- **產出目標**：
  1. `app/components/snap-caliper-wall.js`（$\le 12,288$ B）
  2. `tests/ac_snap_caliper_wall.html`
  3. `R3_WORKER_BUILD_REPORT.md`
- **通關印記**：`MUTUAL_CONSENT_APPROVED`
