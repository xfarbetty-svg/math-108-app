# 斷點交接日誌 (handoff.md)

## ⏯️ 目前做到哪
- **第 3 支概念小教室影片（R-3-1）已完工**：
  1. 新增 `tools/classroom_engine/units/r31_mul_div.py`，4 幕／13 cues，使用 `mimi_poses` 4 組 PNG 立繪真實走位（wave / point / think / cheer），焦點高光由 `getBoundingClientRect()` 橘金色框依序框住 `4×3=12`、`12÷4=3`、`12÷3=4`。
  2. 成片 `app/assets/classroom_videos/R31_Final.mp4`：1920×1080 / 30fps / 109.967s / 9.40 MiB / AV diff 0.015s；已掛載 `app/shell.js` 的 `UNIT_CONCEPT_MOVIES["R-3-1"]`。
  3. 抽幀目視 6 張全綠：12 顆陣列零重疊、驗算與方框逆推算式正確、字幕中心 y=960 距底 76px 無裁切、米米無遮擋右卡。
- **S-3-4 三處精修已覆蓋上線**：
  1. 正方體／長方體 3 個可見面 `fill-opacity=0.25`，背面 3 條虛線與第 8 頂點空心虛線點透出。
  2. 第 2 幕米米 3 個 cue 全改 x=240，左卡膠囊「8 個頂點｜12 條邊｜6 個正方形面」完全無遮擋；圓錐圖示上移 10px。
  3. 成片 `S34_Final.mp4`：106.133s / 9.50 MiB / AV diff 0.000s。
- **破音字根治**：動詞「量」liáng 全改二聲「涼」（量折線／量取／量一量／量量看／量出／量長度／量角器／怎麼量／量看／用圓規量／測量／度量）；名詞「重量／數量／容量／質量／力量」保留四聲。TTS 對照表：`reports/20261123_012_TTS_LIANG_CONVERSION_TABLE.md`。
- **門禁**：`verify_curriculum_131.js`、`verify_app_shell.js`、`verify_tts_polyphone.js` (25 PASS)、`verify_r31.js`、`verify_s34.js` 全部 Exit 0；五欄驗收報告 `reports/20261123_013_R31_S34_VIDEO_ACCEPTANCE.md`。
- **步數上限**：全域 `~/.config/opencode/opencode.json` 與專案 `opencode.json` 皆設 `maxSteps=50`／`agent.build.steps=50`（全域檔修改已於交付報告點名）。

## 🚦 目前狀態
- 兩支 MP4 已重渲染覆蓋，`git commit` + `git push origin main` 已執行；Cloudflare Pages 依 main 自動部署（https://math-108.pages.dev）。
- `_scratch/` 關鍵幀與渲染日誌維持隔離，未進版控；`handoff.md` 為唯一追蹤的交接檔。

## ➡️ 下一步（接續建議）
1. 線上探針確認 `R31_Final.mp4` / `S34_Final.mp4` HTTP 200（報告內附網址）。
2. 剩餘 2 支概念小教室影片（第 4、5 支）依同一 `full_stage` 模板推進。
3. 或回到 `R-3-2`／`D-3-1` 教具微調工單（P0~P3）。

## ⚠️ 注意事項
- 破音字 SSOT 仍為 `app/js/audio_manager.js`；`tts_pipeline.py` 會直接解析其 `POLYPHONE_FIXES`，新增規則兩邊需同步（FALLBACK 亦已同步）。
- 字幕安全基準線 $y=960$、教具 $\le 420px$、全屏 $\le 740px$ 規範不變。
- 本對話框已達 45+ 步警示段點，建議開新框接續。

## 🕐 最後更新
- **時間**：2026-11-23（UTC+8）
- **更新者**：OpenCode CLI @ DESKTOP-6ELKIRH
- **Git Push 狀態**：✅ 已執行（詳見 `git log -1`）


---

## 2026-11-23 終局任務斷點（session 超 45 步，交接下一框）

### 已完成（exit 0 驗真）
- 渲染管線永久升級：`tools/classroom_engine/tts_pipeline.py` 加 `LOUDNORM_FILTER = loudnorm=I=-14:TP=-1.5:LRA=11` + `normalize_loudness()`；`render_video.py` mux 輸出再加同一濾鏡把關。
- 批次響度：`tools/normalize_video_loudness.py`（two-pass + 迭代 dB 修正，`-c:v copy`）。12 支既有 G3 影片全數由 -19/-27 LUFS 提升至 -13.99 ~ -14.63 LUFS，AV diff <= 0.067s，全數 < 25MiB。
- 新插件：`tools/classroom_engine/units/r32_patterns.py`（R-3-2 四幕）、`d31_tables.py`（D-3-1 四幕），皆 full_stage、米米兔 PNG 走位、焦點高光、ID 對應完成，`py_compile` 通過。
- `app/shell.js` 的 `UNIT_CONCEPT_MOVIES` / `UNIT_CONCEPT_MOVIE_TITLES` 已掛載 R-3-2、D-3-1。

### 進行中（背景 shell：sh_2083cb462001MiDGFDWr2mDNSd）
- `python -m tools.classroom_engine.units.r32_patterns` → `R32_Final.mp4`
- `python -m tools.classroom_engine.units.d31_tables` → `D31_Final.mp4`
- 日誌：`_scratch/render_r32.log` / `_scratch/render_d31.log`（開新框先讀最後 30 行確認 exit code）。

### 下一框待辦（依序）
1. 確認兩支 MP4 存在，跑 `python tools/normalize_video_loudness.py` 讓新片也到 -14 LUFS。
2. 抽幀自檢：`_scratch/classroom_r32/keyframes/`、`_scratch/classroom_d31/keyframes/` 各 7 張，視覺確認零重疊、零裁切、字幕底 >= 76px。
3. 產出 `reports/20261123_G3_VIDEO_INVENTORY.md`：掃 24 單元 + shell.js；如實揭露 24/24 盤點涵蓋、影片掛載數（勿虚假宣称每单元都有影片）。
4. 門禁：`node tools/verify_curriculum_131.js`、`verify_app_shell.js`、`verify_tts_polyphone.js`、`verify_r32.js`、`verify_d31.js` 全數 exit 0。
5. `git add -A && git commit && git push origin main`。

### 紀律
- `_scratch/` 已 gitignore，維持隔離；嚴禁碰 `017\` 或「子由」。
