# R2_AGY_PLAN_REVIEW - N-1-4 解題 (毛玻璃遮罩數線反推儀) 施工放行書

- **條目代號**：N-1-4（一年級：解題 — 加減應用、未知數在不同位置、數線逆運算反推）
- **核心教具**：`<glass-number-line>`
- **審查人**：AGY（外骨骼大腦）
- **依據**：`R0_AGY_BLUEPRINT.md` 與 `R1_BP_EXECUTION_PLAN.md`
- **放行狀態**：`MUTUAL_CONSENT_APPROVED`

---

## 1. 核心規格核准確認

1. **體積預算與技術約束**：
   - 守門硬指標：`app/components/glass-number-line.js` 單檔體積 $\le 12,288$ B（12 KB）。
   - 純原生 Web Component，零外部依賴，純 SVG 向量渲染。
2. **算理與狀態機核准**：
   - 數線主軸：刻度 0~20，X=30 到 X=330，step=15px，刻度吸附。
   - 毛玻璃遮罩盒：寬 24px，高 30px，帶有 `?` 標籤，未揭曉時蓋住未知起點。
   - 反向回溯拋物線：自終點向左弧形回溯，抵達真實起點。
   - 揭曉算理：遮罩盒透明度漸變，顯露金色真實數字，並浮出破招算式（如 `12 - 5 = 7` 或 `15 - 9 = 6`）。
3. **驗收規格**：
   - 獨立驗收頁 `tests/ac_glass_number_line.html`（15 項檢驗）。
   - 納入 `tools/ac_gate.js` 機械化閘門。

---

## 2. 施工派工指令

- **派工單位**：通道 2 (A-SERVER SSH OpenCode CLI Worker `iceman-free`)
- **產出目標**：
  1. `app/components/glass-number-line.js`（$\le 12,288$ B）
  2. `tests/ac_glass_number_line.html`
  3. `R3_WORKER_BUILD_REPORT.md`
- **通關印記**：`MUTUAL_CONSENT_APPROVED`
