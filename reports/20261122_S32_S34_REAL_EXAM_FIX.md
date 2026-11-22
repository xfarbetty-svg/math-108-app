# 20261122 S-3-2 / S-3-4 真題替換與教具重修驗收報告

> 主導：本機 OpenCode CLI（Hy4 Flash）｜唯一題源：`docs/G3_REAL_EXAM_MASTER_POOL.md`｜未讀取 `017\`、未引用「子由」

## 5 欄結案報告

| 欄位 | 內容 |
|---|---|
| **範圍** | `S-3-2` 10 題全量替換＋教具重修；`S-3-4` 清除 10 題自編/超綱題→4 題真題＋手機教具重修；契約與課綱同步 |
| **變更** | 8 個檔案：2 題庫 JSON、1 課綱 JSON、3 verify 腳本、2 教具 HTML（明細如下） |
| **驗證指令** | `node tools/verify_s32.js; node tools/verify_s34.js; node tools/verify_g3_contract_240.js; node tools/verify_curriculum_131.js; node tools/verify_app_shell.js; node _scratch/real_exam_batch1/20261122_001_capture_measure.js` |
| **真實 Exit Code** | 五道法定門禁全數 **0**；CDP 截圖量測 **0**（28/28 PASS, FAILURES=0） |
| **證據** | `_scratch/real_exam_batch1/` 28 張 390×844 Light/Dark PNG ＋ `20261122_001_measure_report.json`；本機 CDP 親自目視 |

## 一、題庫替換明細

### S-3-2（10 題，全部來自 master pool S-3-2 段落）

| 題號 | 真題來源 | 型態 |
|---|---|---|
| Q01 | 111-1期末 一、3 | 是非題轉四選項概念辨識（四邊等長 ≠ 必為正方形） |
| Q02 | 111-1期末 三、2 題組 | ㄅ～ㄉ 五圖形，4 小題複合選項，未拆題 |
| Q03 | 111-1期末 五、2(1) | 1cm 方格紙邊長 4 公分正方形格數/周長 |
| Q04 | 111-1期末 五、2(2) | 1cm 方格紙長 5 寬 3 長方形格數/周長 |
| Q05 | 111-2期末 五、4 | 正方形海報四邊總長 160 公分求邊長 |
| Q06 | 112-1期末 一、4 | 邊長 3、5、3、5 與 4 直角原題選項 |
| Q07 | 112-1期末 一、5 | 3 根 2cm＋2 根 4cm 吸管原題選項 |
| Q08 | 112-2期末 一、1 | 正方形內切圓直徑 4 公分求邊長 |
| Q09 | 113-1期末 一、2 | 長方形/正方形性質找錯誤原題選項 |
| Q10 | 114-1期末 二、4 題組 | ㄅ～ㄊ 六圖形（旋轉 45°、圓角、平行四邊形陷阱）複合選項 |

每題均含真實 `source_paper`（原卷 PDF 檔名）＋`exam_source`＋`section`/`question_num`、標準 4 選項、`choices[answer_index] === answer_raw`、`concept`/`steps`/`trap`、`fallback_height: 420`、`?q=1..10`。

### S-3-4（4 題 100% 真題，符合 4～10 題彈性規範）

- Q01：112-2期中 二、6 木棍圖案規律題組（2 小題複合選項，未拆題）。
- Q02：113-2期末 四、1 圓規複製折線甲（作圖題轉方法辨識四選項）。
- Q03：112-1期中 一、(1) base-ten 積木（1 千 5 百 4 十 16 一 → 1556），N-3-1 跨域真題。
- Q04：114-1期中 二、1 base-ten 積木（4 千 5 百 8 十 3 一 → 4583），N-3-1 跨域真題。
- 原 10 題 AI 自編與五年級超綱圖形已**全數移除**；`verify_s34.js` 增加超綱關鍵字與浮動徽章零容忍檢查。
- `data/curriculum.json` 之 `question_count` 改為 4；`verify_g3_contract_240.js` 改為由課綱 SSOT 動態推導（23×10＋4＝**234** 題，檔名為歷史沿用）。

## 二、教具重修

- `square_rectangle_lab.html`：依 `?q=1..10` 以 SVG 繪製各題真實題幹（五/六圖形、1cm 方格網、海報紙、3/5 邊長、吸管、內切圓）；僅呈現已知條件，答案揭曉字串經 verify 擋下；可拖曳直尺＋直角量具（真實 pointer 事件）、方格點選；移除所有含數值答案的 q-focus 劇透提示。
- `solid_geometry_lab.html`：完全移除「角柱角錐」分頁與畫面；移除右上角浮動 `q-badge`（改為頂列內嵌 `qtag`，實測未切字）；四題各自 SVG（木棍圖①②③、折線甲＋A 點＋圓規、兩組 base-ten 積木）；Light/Dark 雙模式，容器 390×420。

## 三、CDP 實機量測與目視

- 腳本：`_scratch/real_exam_batch1/20261122_001_capture_measure.js`（已隔離，不進 git）。
- 390×844、deviceScaleFactor 2、Light/Dark × 14 題＝**28 張**截圖。
- 自動量測：容器 390×420、SVG ≤352、主題切換正確、頂列題號未溢出、HTML/SVG 文字零溢出、禁用字串零命中、圖形元素存在 → **28/28 PASS**。
- 親自目視：S-3-2 Q02/Q10 圖形與 Dark 對比、S-3-4 Q01～Q04 全部場景，無超綱畫面、無切字、無答案劇透；並修正量具遮擋底部說明與方格標題文字溢出兩處缺陷後重跑全綠。

## 四、門禁輸出摘要

```
PASS: G3-S-3-2 ... 全綠                       (exit 0)
PASS: G3-S-3-4 ... 4 題真題契約 ... 全綠        (exit 0)
PASS: G3 24 單元 / 234 題 / 234 題四選項 ...    (exit 0)
CURRICULUM_131_VERIFIED ... ALL PASS           (exit 0)
APP_SHELL_CDP_VERIFIED ... ALL PASS            (exit 0)
SNAPSHOTS=28 FAILURES=0                        (exit 0)
```

## 五、其他如實註記

- 111-1期末 三(2) 題組基準檔標註【待覆核：需以三角板、直尺實測】，已如實寫入詳解 trap，未偽稱已核對原卷。
- 工作區原有未提交之 `AGENTS.md` 里程碑記事與兩份 N315/N316 驗收報告，非本次改寫，**未納入本次 commit**，保持原狀。
