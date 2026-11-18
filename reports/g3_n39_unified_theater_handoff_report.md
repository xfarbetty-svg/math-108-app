# G3-N-3-9 一體化教室劇院重構｜交付報告

| 欄位 | 內容 |
|---|---|
| **範圍** | `app/scenes/g3_n39_theater/index.html`、`audio/g3_n39_timeline.json`、`tests/verify_g3_n39_theater_cdp.js`、`tools/verify_g3_n39_theater_visual_qa.py`；新增本報告與計畫檔 |
| **變更** | ① 移除 48:52（`.actor-zone`/`.blackboard-zone` 全數刪除），改單一教室舞台：牆面／木地板／暖光＋掛牆黑板（x 44–98%）＋講台（x 33–43%）＋米米（x 1–27%，z=5）。② 米米改透明底 SVG，淺藍底影片 `display:none` 退場但保留四幕 src 切換。③ 移除會壓住米米頭部的氣泡，台詞由底部字幕承接。④ 四幕新版台詞／標題寫入 `PHASES`，並由 `fetch()` 讀 JSON 覆寫（SSOT，離線 fallback 內建實測值）。⑤ 分母 12 加金色地基鎖定框，Act4 加獎章＋進入挑戰入口。⑥ JSON 時間依 ffprobe 實測由 108.61s 修正為 84.74s（22.35/20.22/25.17/17.00）。⑦ CDP 新增零遮擋幾何斷言、原始碼 48:52 殘留檢查、新版台詞檢查、四幕截圖。 |
| **驗證指令** | `node tests/verify_g3_n39_theater_cdp.js`；`python tools/verify_g3_n39_theater_visual_qa.py` |
| **真實 Exit Code** | CDP **0**（ALL PASS）／通道三視覺 **1**（A1、Total PASS；A2、A3、A4 FAIL） |
| **證據** | `reports/screenshots/theater_n39_{act1..4,cdp}.png`；`reports/g3_n39_theater_visual_qa.json`；CDP 輸出：`米米與黑板／講台／字幕幾何零重疊`、`原始碼已徹底移除 48:52`、`手機內容底部 479.28px <= 844px`、`Console 零 Error` |

## 通道三視覺判定明細（如實揭露，未隱瞞）

| 閘門 | 結果 | モデル回饋 |
|---|---|---|
| A1 | PASS | 無瑕疵 |
| A2 | FAIL | 「米米下半身被講台遮擋」 |
| A3 | FAIL | 「米米腿部被講台遮擋」 |
| A4 | FAIL | 「耳朵頂部被畫面邊緣裁切、下半身被講台遮擋」 |
| Total（四幕合併） | PASS | 無瑕疵 |

##  Self-check 與不一致說明

- CDP 幾何實測：米米 right=108px < 講台 left≈129px < 黑板 left≈172px，z-index 5>3>2，米米 feet 與字幕相距 >20px；原始碼無 48%/52% 殘留。
- 通道三單幕閘門與全片閘門判定矛盾（Total PASS 但 A2–A4 FAIL），且單幕回饋「被講台遮擋」與 CDP 座標實測不符；推測為小尺寸截圖的視覺模型幻覺／過度保守。
- 依軍規二「實事求是」：**不竄改判定、不虛報全綠**。此任務未完成五閘門全綠，需下一框以更高解析度截圖或人工覆核釐清。

## 待辦（交下一框）

1. 以 2x deviceScaleFactor 重截四幕，再跑 `verify_g3_n39_theater_visual_qa.py`。
2. 若仍 FAIL，改用通道三 gemini-2.5-pro 覆核，或請使用者親眼審查 `reports/screenshots/theater_n39_act{2,3,4}.png` 裁決。
3. 全綠後再執行 `python tools/release.py` 發布。
