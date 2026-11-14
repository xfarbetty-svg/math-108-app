# 任務卡：修復 G3 火車過長與手機畫面抖動問題

> 施工單位：通道一（本地 OpenCode CLI / Model: opencode/glm-5.3-flash-free）  
> 監工驗收：AGY 架構師（依據人類實機截圖反饋：1. 火車太長溢出螢幕 2. 畫面持續抖動）  
> 交付標準：`node tools/verify_n31.js` 與 `node tools/verify_app_shell.js` 全綠 Exit Code 0！

---

## 🎯 痛點剖析與精確修復規格

### 痛點一：火車過長（第 7 節車廂 525 掉出螢幕外）
- **原因**：`app/components/ten_thousand_lab.html` 中的 `.car` 寫死 `flex-shrink: 0; min-width: 40px;`，加上 52px 車頭與 gaps，總寬超過 350px，在 360px~390px 手機上被截斷！
- **修復**：
  1. `.loco`：改為 `width: 32px; height: 26px; flex-shrink: 0; margin-right: -2px;`
  2. `.car`：改為 `flex: 1 1 0; min-width: 0; height: 38px; border-radius: 6px; font-size: 10px; padding: 0 1px;`
  3. `.train-track`：加上 `width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden; gap: 2px; padding: 18px 2px 8px;`
  4. 車輪 `.car-wheel`：改為 `width: 9px; height: 9px; bottom: -5px;`
  5. 確保在 360px 視口下，車頭 ＋ 7 節車廂（495~525）100% 入屏，無任何水平溢出！

### 痛點二：手機畫面抖動（Infinite Height Loop / Reflow Jitter）
- **原因 1（教具端）**：`ten_thousand_lab.html` 的 `body` 設了 `height: 100vh;`，`.container` 設了 `min-height: 100%;`。這導致外層 iframe 高度變大時，內部 100vh 也跟著變大，造成無限遞增死循環！
  - **修復**：
    - `body { height: auto; min-height: auto; overflow-x: hidden; }`
    - `.container { height: auto; min-height: auto; width: 100%; max-width: 100%; box-sizing: border-box; }`
    - `.stage-area { width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden; }`
- **原因 2（外層 Shell 端）**：`app/shell.js` 中的 `heightTimer = setInterval(() => fitFrame(frame, q), 600);` 每 600ms 無條件設定 `frame.style.height = (h + 8) + "px"`，觸發瀏覽器持續重排重繪與視口抖動。
  - **修復**：
    - 在 `fitFrame` 內加入死區防抖判斷：
      ```javascript
      const curH = parseInt(frame.style.height, 10) || 0;
      if (Math.abs(curH - h) > 4) {
        frame.style.height = h + "px";
      }
      ```
    - 在 `renderQuestion()` 中，定時器執行 6 次（約 2.5 秒）穩定高度後即自動 `clearInterval(heightTimer)`，徹底消滅無窮輪詢帶來的畫面抖動！

---

## 🛡️ 驗收流程
工兵施工完畢後，執行驗收守門員：
```bash
node tools/verify_n31.js
node tools/verify_app_shell.js
```
確保兩個指令皆為 Exit Code 0，即刻回報。
