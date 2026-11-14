# 斷點交接日誌 (Handoff Log)

## 📌 當前斷點狀態（Session 25 推進：2026-11-14 10:53）
- **當前進度**：
  1. 三年級首個官方條目 **G3-N-3-1 一萬以內的數** 100% 正式掛載開放上線！
  2. **實機反饋修復完畢**：
     - **火車太長溢出**：`.car` 改為 `flex: 1 1 0; min-width: 0;` 自適應，車頭縮減至 32px，7 節車廂（495~525）100% 緊湊入屏，徹底消除橫向溢出。
     - **畫面抖動消滅**：拔除 `ten_thousand_lab.html` 的 `100vh` 與 `min-height: 100%`，`shell.js` 加入 `Math.abs(curH - h) > 4` 門檻並在穩定 6 次（約 3.6 秒）後自動停止定時器，徹底杜絕無窮重排引發的手機抖動。
- **守門員狀態（全部 Exit Code 0 全綠）**：
  - `verify_n31.js` ➔ **ALL PASS (10 題 CDP 實機全綠，單屏高度 278px~445px ≤ 450px，答題反饋正常，結算無誤)**
  - `verify_curriculum_131.js` ➔ **ALL PASS (131 條目、12 ready / 119 upcoming 契約全綠)**
  - `verify_app_shell.js` ➔ **ALL PASS (6 年級、G3 hero 顯示已開放 1/24、單元卡可點擊開始挑戰)**
- **手機實機體驗網址**：
  - **主入口（三年級 N-3-1 可直接挑戰）**：
    - Tailscale：`http://100.91.241.21:3001/app/index.html`
    - 區網：`http://121.254.69.139:3001/app/index.html`
  - **教具打樣 Showcase**：
    - Tailscale：`http://100.91.241.21:3001/app/g3_showcase.html`

---

## 🎯 下次開工接續目標
1. 人類真機體驗驗收 `app/g3_showcase.html` 手感與視覺。
2. 驗收合格後，依照此高質感打樣將教具獨立組件化，並掛載 N-3-1 的 10 題實體段考真題。
