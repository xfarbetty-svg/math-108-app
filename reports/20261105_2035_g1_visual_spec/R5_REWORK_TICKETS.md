# R5_REWORK_TICKETS: 國小一年級 (G1) 教具重工任務卡

## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：`20261105_2035_g1_visual_spec`
2. **對應藍圖**：`R0_AGY_BLUEPRINT.md`
3. **文件性質**：階段 4.5：BP 現場指揮官開立之重工工單
4. **編寫角色**：BP (Big Pickle, 現場指揮官)
5. **放行狀態**：派工通道 1 Worker 施工 (DISPATCH_PENDING)

---

### 🎫 RK-01: 修復 T-02 `<dual-track-diff>` DOM 重連拋錯 (F-01)
- **受影響檔案**：`app/components/dual-track-diff.js`
- **缺陷**：`disconnectedCallback` 將內部元素置空，重連時 `_render()` 呼叫 `replaceChildren()` 丟出 `TypeError`。
- **修復要求**：重構生命週期，保持 `connectedCallback` 與 `disconnectedCallback` 對稱；重連時若已被清空需安全重置或保留根容器。

### 🎫 RK-02: 修復 T-01 `<ten-frame-grid>` 填格後無障礙狀態同步 (F-02)
- **受影響檔案**：`app/components/ten-frame-grid.js`
- **缺陷**：填格後未呼叫 `_syncTheme()`，導致 `aria-label` 與 `disabledCells` 停留在初始 0 格狀態。
- **修復要求**：在狀態變更與 DOM 更新路徑中，確保呼叫 `_syncTheme()` 同步屬性。

### 🎫 RK-03: 修復 tests/ac_t02.html 的空洞驗收 (F-01 關聯)
- **受影響檔案**：`tests/ac_t02.html`
- **修復要求**：AC-02-6 增加重連後呼叫 `setAttribute()` 與 `setCount()` 的 no-throw 斷言，杜絕假通過。

### 🎫 RK-04: 機械化閘門 tools/ac_gate.js 納入控制台雜訊攔截 (F-03)
- **受影響檔案**：`tools/ac_gate.js`
- **修復要求**：將 CDP 捕獲之 `CONSOLE_NOISE_COUNT` 納入退出碼判準，大於 0 時強制 Exit 1。

### 🎫 RK-05: 調試台 window.__t04 量測實效化 (F-04)
- **受影響檔案**：`app/playground.html`
- **修復要求**：拋物線動畫耗時以 `performance.now()` 實際起迄時間記錄，拒絕假寫死常數。
