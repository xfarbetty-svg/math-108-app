# 任務卡：單點修復 G2-N-2-13-Q01 教具組件 (g2_n213_q1_clock.html)

請完全參照 `app/components/g2_n213_q2_clock.html` 的完整架構與風格，嚴格實作 `app/components/g2_n213_q1_clock.html`：

## 題目規格
- **題幹**：`有關鐘面，下列哪一個敘述不正確？`
- **選項**：`["短針又叫做時針", "長針又叫做分針", "上午 6 點就是上午 6 時", "分針走一大格就是走了 1 分鐘"]`
- **正解**：`分針走一大格就是走了 1 分鐘` (answer_index: 3)
- **微影片導流按鈕**：`https://youtu.be/cP9GA_MXfDc`
- **算理**：分針走 1 小格是 1 分鐘，走 1 大格（5 小格）是 5 分鐘；時針走 1 大格是 1 小時。

## 必要契約與 DOM 結構（守門員強制檢查）
1. `window.check = function() { ... }` 檢查正解邏輯。
2. `window.__q = { answer: 3, choices: [...] }` 契約。
3. 日系繪本風格 SVG（`<svg class="scene-svg" viewBox="0 0 360 224">`），鐘面清晰呈現 12 大格 60 小格，提供「點擊大格放大」或按鈕「看 1 大格藏了什麼 ✨」，動態高亮 1 大格內有 5 個小格。
4. 詳解卡片 `<div class="vq" id="vq" aria-live="polite">`，未檢查答案前必須 `display: none`（嚴防劇透）。
5. 詳解卡片頂部加入微影片導流按鈕：
```html
<div class="video-guide-banner">
  <a href="https://youtu.be/cP9GA_MXfDc" target="_blank" rel="noopener noreferrer" class="video-link">
    📺 觀看教學微影片
  </a>
</div>
```
6. 引用 `<script src="../js/audio_manager.js"></script>`。
7. 整體高度嚴格 $\le 420\text{px}$，適配手機 390px 寬度。
