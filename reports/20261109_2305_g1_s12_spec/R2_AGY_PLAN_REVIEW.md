# R2_AGY_PLAN_REVIEW - S-1-2 形體操作 (堆疊與滾動) 施工放行書

- **條目代號**：S-1-2（一年級：形體操作 — 滾動、堆疊與滾落）
- **教具標籤**：`<stack-physics-bench>`
- **審查人**：AGY（外骨骼大腦）
- **依據**：`R0_AGY_BLUEPRINT.md` 與 `R1_BP_EXECUTION_PLAN.md`
- **放行狀態**：`MUTUAL_CONSENT_APPROVED`

---

## 1. 核心規格核准確認

1. **體積預算**：
   - 嚴格守門：`app/components/stack-physics-bench.js` 總體積 $\le 12,288$ B（12 KB）。
   - 純原生 Web Component，零外部 CDN，零 Three.js / Canvas，純原生 SVG + RequestAnimationFrame / CSS transition。
2. **物理算理與狀態機**：
   - 四大形體：正方體（cube）、長方體（box）、圓柱體（cylinder）、球體（sphere）。
   - 堆疊規則（AC-06-1~4）：
     - 正方體 / 長方體：接觸平坦面，形成穩定吸附 `STACK_STABLE`。
     - 球體：放置在任何形體上方或接觸弧面，強制觸發拋物線滾落 `ROLL_COLLAPSE`，平躺地面平穩。
     - 圓柱體（方向性）：立放（upright）可穩固堆疊，橫躺（side）無法在其上堆疊且橫躺滾動。
3. **驗收規格**：
   - 專屬獨立驗收頁 `tests/ac_stack_physics_bench.html`。
   - 390px / 768px / 960px 三端響應式熱區 $\ge 33$px。
   - 整合進 `tools/ac_gate.js` 機械化自動守門員。

---

## 2. 施工授權與派工

- **派工單位**：通道 2 (A-SERVER SSH OpenCode CLI Worker)
- **施工任務**：
  1. 產出 `app/components/stack-physics-bench.js`（$\le 12,288$ B）
  2. 產出 `tests/ac_stack_physics_bench.html`（含 15 項自動檢驗項目）
  3. 產出 `R3_WORKER_BUILD_REPORT.md`
- **通關印記**：`MUTUAL_CONSENT_APPROVED`
