# 🎯 專案施工藍圖：A方案 收斂語音技術債與全站統一音訊服務 (PLAN+PR)

> 生成時間：2026-11-15 20:28:00  
> 架構規劃：通道三 (035 金鑰池 Gemini 2.5 Pro Master Architect)  
> 可指派施工單位：[通道一 OpenCode CLI (首選) / 通道二 A-SERVER SSH / 通道三 035 金鑰池]  

---

## 1. 核心規格與邊界 (Given-When-Then)

- **Given**:
  - 外層 `app/index.html` 與 `app/shell.js` 為微核心容器，內嵌 20+ 套概念小教室實驗室 (`app/components/*_lab.html`)。
  - 後端 Cloudflare Pages Functions `/api/tts` 已就緒，支援微軟 Edge-TTS 台灣曉臻自然音色 (`zh-TW-HsiaoChenNeural`)。
- **When**:
  - 外層題目點擊「🔊 聽題目」，或內層概念小教室點擊「🔊 聽導讀」/「🔊 語音教學」時。
- **Then**:
  - **絕對禁止** 組件內部裸調 `window.speechSynthesis`。
  - 所有語音請求統一透過 `AudioManager` 單例處理（iframe 透過 `window.parent.postMessage({ type: 'TTS_SPEAK', text: text }, '*')` 向外層匯流）。
  - **硬性互斥鎖 (Exclusive Lock)**：任何新語音啟動時，立即中斷當前所有正在播放的音訊（全域併發發聲源嚴格 $\le 1$）。
  - **全站音質統一**：全站強制統一使用 Edge-TTS 台灣曉臻高音質自然語音，具備 3 級平滑降級（本地 `/api/tts` ➔ 雲端備援 ➔ Web Speech）。
- **邊界禁區**:
  - 嚴禁改動各 Lab 內部的教學算理、SVG 繪圖與 Canvas 幾何邏輯。
  - 嚴禁更動題庫 JSON 資料結構。

---

## 2. 預計建立/修改之檔案結構樹 (File Tree)

```text
d:\ANTIGRAVITY\028-1_國小數學APP\
├── app/
│   ├── js/
│   │   └── audio_manager.js       <-- [NEW] 核心單例：負責全站音訊加載、播放、互斥控制、3級降級
│   ├── index.html                 <-- [MOD] 引入 audio_manager.js
│   ├── shell.js                   <-- [MOD] 重構發聲邏輯，委託 AudioManager，監聽 iframe TTS_SPEAK postMessage
│   └── components/
│       └── *_lab.html             <-- [MOD] 替換內部 speak()，改為向 parent postMessage 派發事件
├── tools/
│   └── verify_audio_singleton.js  <-- [NEW] Gate 4 守門員：靜態掃描組件裸調 speechSynthesis 並作 CDP 發聲測試
└── tests/
    └── test_tts_endpoint.py       <-- [KEEP] 既有端點測試
```

---

## 3. 通用功能與接口驗收地圖 (Capability & Interface Map)

| 編號 | 功能模組 | 執行入口（指令 / 腳本 / 端點） | 輸入參數 / 測試樣本 | 預期可觀測結果（Pass 條件） |
| :--- | :--- | :--- | :--- | :--- |
| **F-01** | **單例初始化與接口** | `app/js/audio_manager.js` | `AudioManager.play(text)` | 回傳單例，全域唯一音訊實例，重複調用不產生新實例 |
| **F-02** | **iframe 跨層廣播通信** | `window.postMessage` | `{ type: 'TTS_SPEAK', text: '測試語音' }` | 外層接收並觸發 `AudioManager.play()`，終端輸出播放日誌 |
| **F-03** | **全局硬性互斥中斷** | 連續兩次觸發 `play()` | 第一次長句 ➔ 第二次短句 | 第一次音訊立即中斷（pause & reset），第二次音訊清晰播放，併發發聲數 $\le 1$ |
| **F-04** | **Gate 4 靜態與動態守門員** | `node tools/verify_audio_singleton.js` | 掃描 `app/components/*.html` | 組件內 0 處裸調 `speechSynthesis.speak`，Exit Code 為 0 |

---

## 4. 單步執行清單 (Step-by-Step Checklist)

- [x] **Step 1: 建立核心音訊單例 `app/js/audio_manager.js`**
  - 封裝全域 `AudioManager` 物件，提供 `play(text, options)`, `stop()`, `isPlaying()`。
  - 內建 3 級降級（本地 `/api/tts` ➔ 雲端備援 `math3-bank.pages.dev` ➔ Web Speech 兜底）。
  - 驗證方式：在瀏覽器中執行 `AudioManager.play('測試')`，確認聲音正常且具備 epoch 序號防競態。
  - 狀態：✅ 完工 (Exit Code 0)。

- [x] **Step 2: 外層 `app/index.html` 引入並於 `app/shell.js` 註冊 message 監聽**
  - 在 `app/index.html` 加入 `<script src="js/audio_manager.js"></script>`。
  - 在 `app/shell.js` 將原有的 `speakCurrentProblem()` 改造為呼叫 `AudioManager.play()`。
  - 註冊 `window.addEventListener('message', e => { if (e.data?.type === 'TTS_SPEAK') AudioManager.play(e.data.text); if (e.data?.type === 'TTS_STOP') AudioManager.stop(); });`
  - 狀態：✅ 完工 (Exit Code 0)。

- [x] **Step 3: 批次收攏 `app/components/*_lab.html` 內部 `speak()` 函式**
  - 23 套概念小教室與預覽頁面全面收攏，消除所有直接調用 `window.speechSynthesis`。
  - 透過 `postMessage` 向外層發送 `TTS_SPEAK` / `TTS_STOP`，由外層 `AudioManager` 統一排隊播放。
  - 狀態：✅ 完工 (全域 71 套組件 0 處裸調，Exit Code 0)。

- [x] **Step 4: 撰寫 Gate 4 守門員腳本 `tools/verify_audio_singleton.js`**
  - 掃描 `app/components/` 下所有 `.html`，檢驗是否殘留裸調 `speechSynthesis.speak`（實際 0 處）。
  - 執行原生 Chrome CDP 實機載入頁面，模擬點擊發聲，驗證網路請求確實命中 `/api/tts`，且互斥中斷生效。
  - 執行指令：`node tools/verify_audio_singleton.js` ➔ ✅ Exit Code 0。

- [x] **Step 5: 納入 `tools/release.py` S1 守門員清單**
  - 將 `tools/verify_audio_singleton.js` 正式登記為 S1 必跑門禁，全綠方准發布。
  - 狀態：✅ 完工。

---

## 5. 施工守則與不可碰觸區

1. **嚴禁破壞繪圖與算理代碼**：修改 `*_lab.html` 時，僅精準替換 `speak()` 函式定義，絕對不可更動幾何繪圖、SVG 節點、事件監聽與題幹邏輯。
2. **路徑與編碼規範**：所有音訊請求文字必須經過 `encodeURIComponent`，防止數學加減符號造成 URL 解析中斷。
3. **無感降級保障**：離線環境下依然具備 Web Speech 兜底機制，不可直接 Crash。
