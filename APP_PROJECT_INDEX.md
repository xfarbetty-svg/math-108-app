# 028-1 國小數學 APP — 全專案總覽索引（APP_PROJECT_INDEX）

> 產生日期：2026-11-20｜適用對象：外部教材設計 AI
> 資料來源：本專案 `028-1_國小數學APP/`、跨專案 `D:\ANTIGRAVITY\034_anatomy_interactive_svg\`（教具）、`D:\ANTIGRAVITY\036_local_painter\`（主持人／角色）。
> 所有內容由實際檔案讀取產生；找不到對應檔案者標註「**尚未建立**」。

---

## 1. 專案與技術規格摘要

### 1.1 年級範圍與開發階段

| 項目 | 實際狀態 | 依據 |
|---|---|---|
| 課綱範圍 | **G1～G6（1～6 年級）**，官方 131 條內容單元 + 58 條學習表現 | `data/curriculum_108_official.json:13-22` |
| 每年級條目 | G1=11、G2=24、G3=24、G4=26、G5=27、G6=19（共 131） | 同上 `:23-30` |
| 已開放 | **G1+G2+G3 = 59 / 131（45.0%）**，全數 `status: ready` | `data/curriculum.json`、`PROGRESS.md:20` |
| 待開發 | **G4+G5+G6 = 72 條**，`upcoming`／`question_count=0`／`verified_source=null` | `data/curriculum.json:510-1105` |
| 目前主線 | N34 米米概念小教室三階段完成；`N34_Final.mp4`（1920×1080/101.633s/約19.5MB）已本地 commit，待確認 S05 後 push | `handoff.md:8-34` |
| 上線 | Cloudflare Pages `https://math-108.pages.dev`（Build `20261119_120548`） | `PROGRESS.md:21` |

### 1.2 技術棧與跨專案分工

- 本 APP：純前端 Vanilla JS / SVG / Web Components（Shadow DOM）/ ESM，零打包、零外部網路依賴，可離線；入口 `app/index.html` → 微核心 `app/shell.js`（`shell.js:1-7`）。
- 教具來源：034 `dist/anatomy-tools.js` **整檔複製**到 `app/components/anatomy-tools.js`（註冊 4 標籤）；掛載點 `app/index.html:426`。
- 角色／影院來源：036 `theater/`、`output/`、`MIMI GEMINI/`；成片如 `output/mimi_fraction_lesson_final_84s.mp4`、`output/concept_theater_1000_voiceover.mp4`。
- 跨專案世界觀：`docs/CROSS_PROJECT_TOPOLOGY_AND_CHANNELS_GUIDE.md:100-104`（036 負責背景氛圍與動態分鏡，034 負責前景數學骨架，結合成「會呼吸的數學影院」）。
- 語音：APP 米米用 Edge-TTS 曉臻 `zh-TW-HsiaoChenNeural`（`docs/mimi_classroom/N34_script.json:14`）；036 bridge 另用 `zh-TW-YunJheNeural`（親切活力小男童音，`bridge/generate_audio_from_manifest.py:10`）。
- 資料格式：全專案僅 JSON；**CSV / SQLite / .db / JSONL / XLSX / YAML / TOML：尚未建立**。

### 1.3 題庫與教材實際資料結構（真實範例）

**(A) 課綱 SSOT** `data/curriculum_108_official.json`（`課綱/curriculum_108_math.json` 為同內容副本）：

```json
{
  "metadata": { "total_content_items": 131, "total_performance_items": 58,
    "grades_covered": ["1","2","3","4","5","6"],
    "grade_counts": { "G1": 11, "G2": 24, "G3": 24, "G4": 26, "G5": 27, "G6": 19 } },
  "learning_performances": { "d-I-1": { "code": "d-I-1", "referenced_in_content": ["D-1-1","D-2-1"] } },
  "content_units": { "N-1-1": { "code": "N-1-1", "title": "一百以內的數", "基本說明": "…", "釋例": "…", "錯誤類型": "…", "評量": "…" } }
}
```

**(B) 前台狀態表** `data/curriculum.json`（`$schema: math-app-curriculum-v2`）：

```json
{ "grades": [{ "grade": 1, "name": "一年級", "units": [{
  "code": "N-1-1", "title": "一百以內的數", "full_text": "一百以內的數：含操作活動…",
  "status": "ready", "question_count": 4,
  "verified_source": "高雄市忠孝國小 114 學年度第一學期 一年級期中考" }] }] }
```

`status`=`ready`/`upcoming`；`shell.js:67-90` 據此渲染卡片（upcoming 鎖定）。

**(C) 正式題檔** `data/units/<Grade>/<Code>.json`（`$schema: math-app-unit-v1`，節錄 `G1/N-1-1.json:1-38`）：

```json
{
  "unit_id": "G1-N-1-1", "curriculum_code": "N-1-1", "grade": 1,
  "unit_name": "10以內的數與比多少、序數",
  "source_paper": "高雄市忠孝國小 114 學年度第一學期 一年級期中考",
  "questions": [{
    "id": "G1-N-1-1-Q01", "exam_source": "忠孝國小 114-1 期中", "section": "一、填一填",
    "question_num": "1", "title": "魚缸數數",
    "stem": "數一數，魚缸裡有幾條小魚？\n(1) 第一個魚缸有（　）條小魚。…",
    "choices": ["(1) 4 條、(2) 0 條、(3) 6 條", "…"], "answer_index": 0,
    "answer_raw": "(1) 4、(2) 0、(3) 6",
    "component": "fish_tank_demo", "component_path": "components/fish_tank_demo.html",
    "explanation": { "concept": "一對一點數，0 表示「一個也沒有」也是一個數。",
      "steps": ["點擊小魚，每點一條就蓋上號碼牌", "…"],
      "trap": "空空的魚缸容易漏答！「沒有」要寫 0。" }
  }]
}
```

G3 題檔另含 `visual_mode`、`final_check`、`fallback_height: 420`，`component_path` 可帶 `?q=1..10` 切模式（`docs/UNIT_FACTORY_STANDARD.md:73-109`）。硬性規則：4 選項；`answer_index` 與 `choices[answer_index]`／`answer_raw` 一致；`component_path` 必指向實體檔；`explanation` 必含 `concept/steps/trap`；題數彈性 4～10，不准拆題或閹割題幹（`:111-117`）。

**(D) 舊版並存題庫** `data/curriculum_v3/*.json`（18 檔／175 題）：`visual_engine: { type/engine/component, props, interactive }`，與 `data/units/` 非同一 SSOT，欄位名稱不統一，新品請用 `data/units/`。

**(E) 動畫腳本** `docs/mimi_classroom/N34_script.json`：`video_spec`(1920×1080/30fps/曉臻)、`layers`(bg / blackboard_roi / mimi anchor `[340,620]` scale `0.72`)、`scenes[].narration/blackboard_render`。

---

## 2. 角色與世界觀設定（重點掃描 `036_local_painter`）

### 2.1 1～6 年級主持人 IP 矩陣（權威來源：`FIX_PLAN.md:85-94`）

| 年級 | 角色名 | 動物 | 性格與教學定位（原文） | 代表色 | 配件標識 | 完備度 |
|---|---|---|---|---|---|---|
| G1 | **皮皮 Pipi** | 柴犬 | 好奇熱情、初階引導、童趣陪伴 | 亮暖橘 `#FF8C00` | 紅色小探險帽、放大鏡 | **僅藍圖：尚未建立**立繪／資產／台詞 |
| G2 | **波波 Bobo** | 棕熊 | 溫和沉穩、直觀操作、生活化體驗 | 蜂蜜黃 `#F5A623` | 藍色小背心、廚師帽／木尺 | **完整**（Golden Master＋台詞） |
| G3 | **米米 Mimi** | 小白兔 | 靈動敏捷、乘除進階、具象轉抽象 | 薄荷綠 `#2ECC71` | 綠色小吊帶背心、小領結／筆記本 | **完整**（Golden Master＋母版） |
| G4 | **多米 Domi** | 橘貓 | 好奇探索、幾何角度、科學觀察 | 寶石藍 `#3498DB` | 冒險風鏡、星際星圖包 | **僅藍圖：尚未建立** |
| G5 | **凱爾 Kyle** | 狐狸 | 策略嚴謹、多步驟解題、邏輯推演 | 丁香紫 `#9B59B6` | 金邊單片眼鏡、智慧平板 | **僅藍圖：尚未建立** |
| G6 | **歐爾 Dr. Owl** | 貓頭鷹 | 智慧宏觀、國小總複習、思維領航 | 灰深藍 `#34495E` | 博士方帽、卷軸羽毛筆 | **僅藍圖：尚未建立** |

> `AGENTS.md:81`「定案 1~6 年級跨科通用吉祥物藍圖 (皮皮/波波/米米/多米/凱爾/歐爾)」——定案僅至藍圖層。

### 2.2 G2 波波 Bobo（完整設定）

- ID／身分：`theater/g2_n22_shot_manifest.json:5-6`「"name": "小熊波波 (Bobo)"」「"role": "蜂蜜甜點主廚小老師"」；`channel3_puppet_manifest.json:5-8` 另記 `assets_id: bear_teacher_001`、`engine_type: 2.5D_Puppet_Skeleton`。
- Golden Master：`theater/assets_hosts/g2_bobo/master_metadata.json:2-7` character=Bobo / grade=G2 / animal=Brown Bear / role=溫和沉穩、直觀操作、生活化體驗引導者 / theme_color=`#F5A623` / golden_seed=`888888`。
- 外觀 DNA（`:7`）：「Pixar 3D animation style, adorable fluffy teddy bear chef named Bobo, caramel-honey fluffy fur… wearing a tilted mini white pastry chef hat on the left ear, wearing a rustic oatmeal-linen apron with a small brass honeybee pin」。
- 語氣／台詞格式：自稱「波波」，生活化情境＋魔法比喻（『波波拿出魔法鍋鏟一揮！個位跟個位排好，十位跟十位排好』，`g2_n22_shot_manifest.json:51`；『答案是43！鬆餅出爐囉，波波大口咬下，太美味啦！』`:100`；早期口白『小朋友你看，桌上有99個小積木，再加1個會變成什麼呢？』`channel3_puppet_manifest.json:12`；『太棒了！我們下次見！』`:52`）。
- 別名：小熊解說員（`AGENTS.md:21`）、小熊工匠（`theater/shot_manifest.json:9`）。精確字串「小熊小老師」在 036 查無（APP 端 `app/scenes/g2_n21_theater/index.html:6` 有此標題）。

### 2.3 G3 米米 Mimi（完整設定）

- ID／身分：`theater/assets_hosts/g3_mimi/master_metadata.json:2-6` character=Mimi / grade=G3 / animal=White Rabbit / role=靈動敏捷、乘除進階、具象轉抽象引導者 / theme_color=`#2ECC71` / golden_seed=`30105`；`theater/g3_mimi_shot_manifest.json:2-8` 同（status=`GOLDEN_MASTER_LOCKED`）。
- 外觀（`MIMI GEMINI/米米教學SOPV1.1.md:6-7`）：3D 絨毛白兔，粉色長耳內側、粉紅小鼻、溫柔大眼睛；粉色針織短袖＋淺綠翻領＋土黃色雙口袋吊帶褲；另版 DNA（`docs/tasks/task_card_g3_n39_mimi_shots.md:14-18`）為 mint-green overalls + pastel yellow scarf。
- 動作＝語氣對照（`米米教學SOPV1.1.md:17-22`）：`mimi_apose_closed` 對嘴基準／`mimi_apose_standard` 開場講解／`mimi_arm_raised_clean2` 指右側黑板／`mimi_think` 提問／`mimi_clap` 鼓勵轉場／`mimi_thumbs_up` 公布答案與結尾。
- 表情卡點（`task_card_g3_n39_mimi_shots.md:34,43,52,61,70`）：困惑「嘴巴微抿」→ 指盒「開口微笑」→ 數數「嘴型微開像在報數」→ 頓悟「嘴巴張成驚喜 O 形」→ 歡呼「眼睛笑成彎月、開懷大笑」。
- 台詞來源：米米**無固定口頭禪台詞檔**，由外部逐字稿餵入（`:32` 根據旁白音檔驅動嘴型）；APP 端台詞見 `docs/mimi_classroom/N34_script.json:36,58,98`：「各位小朋友大家好，我是米米老師！」「商、乘、減、落」「我們下次見囉，拜拜！」。
- 別名：咪咪（APP 早期文件名）、瀰瀰兔（`MIMI GEMINI/n34.md:60`、`code_artifact.md:1`）。

### 2.4 情境教室／世界觀

- **48:52 空間割席**：左 48% 角色、右 52% 034 向量黑板演武場，0 穿模 0 遮擋（`FIX_PLAN.md:150`、`g3_mimi_shot_manifest.json:48`）。
- **三大黃金法則**（`AGENTS.md:21-23`）：空間構圖一人一半、時間節奏（演示口白分段留足）、文題相對（文圖對題一致）；動作提前 0.3s、口白後留 1.5s（`FIX_PLAN.md:151`）。
- **背景底圖**：16:9 教室（左木質書架與講桌、右深綠黑板、柔和 bokeh），畫面不可含預設角色（`米米教學SOPV1.1.md:9`）。
- **影院播放器**：`theater/concept_theater_g2_n22.html`（46.5s）、`concept_theater_fixed.html`（20s）、`concept_classroom_v2.html`（9 幕）（`INDEX.md:18-24`）。
- **成片**：`output/mimi_fraction_lesson_final_84s.mp4`、`output/concept_theater_1000_voiceover.mp4`；N39 已凍結不再重產（`PROGRESS.md:12`）。
- **禁用**：APP 端禁止「王國、森林、山脈」等自嗨世界觀（`docs/108課綱規格書…md:3`）。

> 開發流程角色（AGY／Big Pickle／OpenCode CLI／035 金鑰池）為施工者，非畫面角色：見 `FIX_PLAN.md:3-5`、`docs/CROSS_PROJECT_TOPOLOGY_AND_CHANNELS_GUIDE.md:46-48`。

---

## 3. 現有教具與互動元件規格（重點掃描 `034_anatomy_interactive_svg`）

### 3.1 034 工具櫃：4 個正式 Web Component（權威登錄 `dist/anatomy-tools.js:874-886`）

```js
customElements.define('iso-block-viewer', IsoBlockViewer);
customElements.define('physics-lever-balance', PhysicsLeverBalance);
customElements.define('math-sketch-canvas', MathSketchCanvas);
customElements.define('interactive-story-card', InteractiveStoryCard);
window.Anatomy = { Isometric, Sketchy, version: '1.1.0' };   // :888-893
```

| # | 教具名稱 / 標籤 | ID／別名 | 適用年級／主題 | 參數規格 | 事件／API |
|---|---|---|---|---|---|
| 1 | 立體等角積木與三視圖 `<iso-block-viewer>` | CLI `iso-block` | 空間幾何、積木計數、三視圖；原型頁標「國小六年級」 | `blocks`（JSON `[[x,y,z]]` 或 `[{x,y,z}]`，預設 `[[0,0,0]]`）、`view`=`iso/top/front/side`（預設 iso）、`interactive`（預設 true）、`rotation`(0/90/180/270)、`autoplay`（`:152-154,179-195`） | `Isometric.project(x,y,z,160,160,36)`、`depthOf`、`cubePaths`；按鈕 `data-view` / `data-action="rotate"` click；autoplay 5 步×2s |
| 2 | 物理槓桿力矩天平 `<physics-lever-balance>` | CLI `lever-balance`；原型 `lever_balance.html` | 等式平衡／重量比較；原型頁「國小五年級」 | `left`、`right`（parseFloat，預設 0）（`:452-454,468-470`） | 阻尼動畫 `spring=0.08`、`damping=0.82`、`maxAngle=15`；狀態文字「平衡 ⚖️／左傾 ◀／右傾 ▶」（`:476-481,552`） |
| 3 | 手繪黑板幾何 `<math-sketch-canvas>` | CLI `math-sketch` | 幾何作圖、手繪粉筆風 | `shapes`（JSON：`{type:'polygon',points,stroke,fill,label}` / `{type:'circle',cx,cy,r}` / `{type:'line',x1,y1,x2,y2}`）、`theme`=`chalk/paper`、`width`(320)、`height`(240)（`:570-572,562-567,613-641`） | `shape-click` CustomEvent `{index,shape}`（`:708-716`）；`window.Anatomy.Sketchy.createRandom(seed=42)` 等 |
| 4 | 互動探索故事卡 `<interactive-story-card>` | CLI `story-card`（僅 `synthesize_scene.py:310`） | 參數探索、面積公式 | `title`、`story`、`min`(1)、`max`(10)、`val`(5)、`height-param`(4)、`unit`('公分')（`:735-737,726-732`） | 公式 `area=(val*heightParam)/2`（`:760`）；`param-change` CustomEvent `{value,area}`（`:859-868`） |

呼叫範例（`docs/CHANNEL_DISPATCH_KEY.md:26,38`）：

```html
<iso-block-viewer blocks='[[0,0,0],[1,0,0],[0,1,0],[0,0,1]]' view="iso" interactive="true"></iso-block-viewer>
<physics-lever-balance left="2" right="5"></physics-lever-balance>
```

⚠️ 真實不一致：`bridge/synthesize_scene.py:110` 與 APP `app/scenes/bakery_cookies_q01.html:131` 用 `scenario=` 傳劇情，但元件監聽的是 `story=`，故該橋接劇情文字不會生效。

### 3.2 034 原型教具（`components/`，尚未註冊為 Web Component）

| 檔案 | 年級／主題 | 呼叫方式 |
|---|---|---|
| `components/lever_balance.html` | 國小五年級・槓桿力矩天平 | `setWeight(10/20/30)`；`arm.style.transform='rotate(±7deg/0deg)'`（`:80,118-122,130-149`） |
| `components/circuit_switch.html` | 國小四年級・電路通斷 | `toggleSwitch()`；改 `knife` 座標、`bulbLight.opacity`（`:74,124,128-163`）。**正式元件尚未建立** |
| `components/block_projection.html` | 國小六年級・空間積木三視圖 | `BLOCKS=[{x,y,z,color}×4]`；`switchView('iso'/'top'/'front'/'side')`（`:82,104-110,172-193`） |

### 3.3 034 CLI／橋接器呼叫規格

- `bridge/dispatch_anatomy_tool.py:256-278`：`--tool {iso-block,lever-balance,math-sketch}`、`--data`、`--blocks`、`--shapes`、`--theme {chalk,paper}`、`--left`、`--right`、`--view {iso,top,front,side}`、`--out`；成功 Exit 0（`:308`）。
- `bridge/synthesize_scene.py:306-315`：`--tool {lever-balance,iso-block,math-sketch,story-card}`、`--title`、`--stem`、`--tool-data JSON`、`--bg-prompt`、`--options`、`--out-html`、`--render-png`、`--reuse-bg`。
- `bridge/make_math_shorts.py:238-245`：`--template`（目前僅 iso-block）、`--data`、`--title`、`--seconds`、`--fps`、`--out`。
- 集中登錄：無獨立 JSON registry；前端 `customElements.define` 4 筆為權威，CLI choices 為不完整子集（3／4）；`tests/test_anatomy_key.py:19-26` 僅檢查前兩標籤與 `window.Anatomy`。

### 3.4 APP 端（028-1）既有通用元件（補充，非 034 定義）

`app/components/` 共 238 檔 = 19 個 `.js` Web Component + 219 個題目／實驗室 `.html`。高頻通用件與參數：

| 元件 | 關鍵參數（實際 observedAttributes／API） |
|---|---|
| `<balance-beam>` | `left-weight`(0–10)、`right-weight`、`right-expression`、`damping`、`animate`；`reset()`／`step(dt)`；事件 `balance:balanced/change/clamped` |
| `<ten-frame-grid>` | `value`、`fill-color`、`interactive`、`locked`、`label`；`takeAway(count,cb)`；真 click 10 格，滿十 300ms 聚合 |
| `<place-value-box>` | `tens`(0–9)、`ones`(0–10)、`interactive`；`addOne()`／`setValue()`；滿十轉橘色十條（無 pointer 監聽，靠 API） |
| `<fraction-pizza-slice>` | `denominator`∈{2,3,4,6,8}、`selected-slices`、`fair=false`（不公平陷阱）；真 click，事件 `slice-change` |
| `<glass-number-line>` | 無 attr；`setEquation({mode,start,jump,end})`、`moveToTick()`、`stepReverse()`、`reveal()`；事件 `numline-event`／`numline:snap` |
| `<isometric-rotator>` | `shape`、`angle`(0–360)、`show-labels`、`progress`(0–1)；`rotator:change/unfolded` |
| 其他 13 個 | `dual-track-diff`、`vertical-math-grid`、`thousand-value-box`、`liquid-measuring-cup`、`stack-physics-bench`、`weight-balance-scale`、`meter-scale-ruler`、`snap-caliper-wall`、`multiple-relator`、`multiplication-array`、`data-sorter-bench`、`angle-vertex-explorer` + `anatomy-tools`（034 整檔複製） |

**034 中尚未建立**：分數圓餅、位值盒、數線教具（034 原始碼 grep 無命中；APP 自有 `fraction_lab.html`、`number_line_lab.html` 等不屬 034 定義）。

### 3.5 制式規格（設計新題必遵循）

- **One-Screen**（`docs/UNIT_FACTORY_STANDARD.md:51-61`）：360–390px 零橫向捲軸；SVG `viewBox` + `width:100%;height:auto`；教具高 **≤420px**；外層約 740px；**嚴禁 `height:100vh`**，須 `body{margin:0;padding:8px;height:auto;min-height:0}`。
- **L0/L1 靜態 vs L2 物理**（`AGENTS.md` 軍規四）：靜態認知題用繪本＋點選高亮；L2 操作題須真 `pointerdown/move/up`＋軸心＋磁吸，經自動化拖曳驗證，死圖 Exit 1。
- **三閘門**（`UNIT_FACTORY_STANDARD.md:140-173`）：① `verify_<unit>.js` 資料契約；② `verify_<unit>_cdp.js` 390×844 實測高 ≤420px／零溢出／零 console error；③ `verify_curriculum_131.js` 131 條目帳實閉環。任一 Exit≠0 打回。

---

## 4. 各年級課綱與單元清單（Curriculum Index）

> 順序依 `data/curriculum_108_official.json`；G4～G6 已有課綱條目但尚無題庫。

### G1（11，全 ready）
N-1-1 一百以內的數｜N-1-2 加法和減法的意義與應用｜N-1-3 基本加減法｜N-1-4 解題（1/5/10/50 元）｜N-1-5 長度（同 S-1-1）｜N-1-6 日常時間用語｜S-1-1 長度（同 N-1-5）｜S-1-2 形體的操作｜R-1-1 算式與符號｜R-1-2 兩數相加順序不影響其和｜D-1-1 簡單分類

### G2（24，全 ready）
N-2-1 一千以內的數｜N-2-2 加減算式與直式計算｜N-2-3 解題（加減應用）｜N-2-4 解題（簡單加減估算）｜N-2-5 解題（100/500/1000 元）※｜N-2-6 乘法｜N-2-7 十十乘法｜N-2-8 解題（兩步驟加減乘）｜N-2-9 解題（分裝與平分）｜N-2-10 單位分數｜N-2-11 長度（公分、公尺）｜N-2-12 容量重量面積｜N-2-13 鐘面的時刻｜N-2-14 時間（年月日星期）｜S-2-1 物體幾何特徵｜S-2-2 簡單幾何形體｜S-2-3 直尺操作｜S-2-4 平面圖形邊長｜S-2-5 面積（具体操作）｜R-2-1 大小關係與遞移律｜R-2-2 三數相加順序不影響和｜R-2-3 兩數相乘順序不影響積｜R-2-4 加法與減法關係｜D-2-1 分類與呈現
※ 官方原文為「解題（100 元、500 元、100）」（`curriculum_108_official.json:1097`）。

### G3（24，全 ready）
N-3-1 一萬以內的數｜N-3-2 加減直式計算｜N-3-3 乘以一位數｜N-3-4 除法｜N-3-5 除以一位數｜N-3-6 解題（乘除應用）｜N-3-7 解題（兩步驟加減與除、連乘）｜N-3-8 解題（四則估算）｜N-3-9 簡單同分母分數｜N-3-10 一位小數｜N-3-11 整數數線｜N-3-12 長度（毫米）｜N-3-13 角與角度（同 S-3-1）｜N-3-14 面積（平方公分）｜N-3-15 容量（公升毫升）｜N-3-16 重量（公斤公克）｜N-3-17 時間（日時分秒）｜S-3-1 角與角度（同 N-3-13）｜S-3-2 正方形和長方形｜S-3-3 圓｜S-3-4 幾何形體操作｜R-3-1 乘除關係｜R-3-2 數量模式與推理(I)｜D-3-1 一維與二維表格

### G4（26，全 upcoming）
N-4-1 一億以內的數｜N-4-2 較大位數乘除｜N-4-3 兩步驟乘除連除｜N-4-4 大數取概數｜N-4-5 同分母分數｜N-4-6 等值分數｜N-4-7 二位小數｜N-4-8 數線與分數小數｜N-4-9 公里｜N-4-10 角度｜N-4-11 平方公尺｜N-4-12 立方公分｜N-4-13 時間加減｜S-4-1 角度｜S-4-2 旋轉角｜S-4-3 面積與周長｜S-4-4 體積｜S-4-5 垂直與平行｜S-4-6 全等｜S-4-7 三角形｜S-4-8 四邊形｜R-4-1 兩步驟併式｜R-4-2 四則規律(I)｜R-4-3 文字公式｜R-4-4 模式推理(II)｜D-4-1 長條圖折線圖

### G5（27，全 upcoming）
N-5-1 十進位位值｜N-5-2 多步驟應用｜N-5-3 公因數公倍數｜N-5-4 異分母分數｜N-5-5 分數乘法｜N-5-6 整數相除分數表示｜N-5-7 分數除以整數｜N-5-8 小數乘法｜N-5-9 整數小數除以整數｜N-5-10 比率應用｜N-5-11 小數取概數｜N-5-12 公畝公頃平方公里｜N-5-13 公噸｜N-5-14 體積｜N-5-15 容積｜N-5-16 時間乘除｜S-5-1 三角形四邊形性質｜S-5-2 面積｜S-5-3 扇形｜S-5-4 線對稱｜S-5-5 正方體長方體｜S-5-6 面與面關係｜S-5-7 球柱錐｜R-5-1 三步驟併式｜R-5-2 四則規律(II)｜R-5-3 符號公式｜D-5-1 折線圖

### G6（19，全 upcoming）
N-6-1 質數與質因數分解｜N-6-2 最大公因數最小公倍數｜N-6-3 分數除法｜N-6-4 小數除法｜N-6-5 四則應用｜N-6-6 比與比值｜N-6-7 速度｜N-6-8 基準量比較量｜N-6-9 數量關係列式｜S-6-1 放大縮小｜S-6-2 比例尺｜S-6-3 圓周率圓面積扇形面積｜S-6-4 柱體體積表面積｜R-6-1 計算規律｜R-6-2 數量關係｜R-6-3 數量關係表示｜R-6-4 數量關係列式｜D-6-1 圓形圖｜D-6-2 可能性

---

## 5. 目前已完成的內容進度盤點（Completed Status）

### 5.1 題庫（實測 `data/units/` 共 59 檔）

| 年級 | 檔案數 | 實際題數 | 路徑 |
|---|---|---|---|
| G1 | 11 | **50** | `data/units/G1/*.json` |
| G2 | 24 | **121** | `data/units/G2/*.json` |
| G3 | 24 | **205** | `data/units/G3/*.json` |
| G4/G5/G6 | 0 | 0 | **尚未建立**（無目錄／題檔／教具） |

舊版 `data/curriculum_v3/` 另有 18 檔／175 題（G1 9、G2 9），為並存舊格式，不計入正式題數。

### 5.2 已完成教案／腳本／影音

| 產出 | 規格 | 路徑 |
|---|---|---|
| G1 11 單元情境教具 | 28 個 `*_demo.html` + 多模式 lab | `app/components/` |
| G2 24 單元真題與教具 | 每單元 5 題（N-2-3 為 6），約 100 個 `g2_*_q*.html` | `data/units/G2/`、`app/components/` |
| G3 24 單元真題與教具 | N-3-1～15 各 10 題，其餘 7 單元各 5 題；14 個概念小教室 | `data/units/G3/`、`app/components/*_concept_lab.html` |
| G3-N-3-9 阿德曼黏土定格片 | 84.72s / 18.72MB / 2,034 幀，已上線 | `app/scenes/g3_n39_theater/`、036 `output/mimi_fraction_lesson_final_84s.mp4` |
| G2-N-2-1 小熊影院 | 20s / 5 幕 | `app/scenes/g2_n21_theater/index.html`、036 `theater/channel3_puppet_manifest.json` |
| G2-N-2-2 波波甜點教室 | 46.5s / 4 幕，1280×720 | 036 `theater/concept_theater_g2_n22.html`、`output/g2_n22_theater_46s.mp4` |
| N34 米米概念小教室 | 1920×1080/101.633s/約19.5MB，本地 commit 待 push | `app/assets/classroom_videos/N34_Final.mp4`、腳本 `docs/mimi_classroom/N34_script.json` |
| 034 工具櫃 | 4 正式 Web Component + 3 原型；`tests/test_sketch_and_story.py` 9 passed Exit 0 | `034_anatomy_interactive_svg/dist/anatomy-tools.js`、`components/` |
| 036 角色資產 | G2 波波、G3 米米 Golden Master + motions + 台詞 | `036_local_painter/theater/assets_hosts/{g2_bobo,g3_mimi}/` |

### 5.3 TODO / 空殼與資料落差

1. **G4/G5/G6 共 72 條**：課綱有條目，題檔／教具／角色動畫全數**尚未建立**。
2. **角色尚未建立**：G1 皮皮、G4 多米、G5 凱爾、G6 歐爾僅有 IP 藍圖一列，無立繪／metadata／motions／台詞；米米無固定口頭禪台詞檔。
3. **宣告 vs 實際題數不符**：`curriculum.json` 宣告 G3 各 10 題（240），實際 7 單元各 5 題（205），差 35：`N-3-16`、`N-3-17`、`S-3-2`、`S-3-4`、`R-3-1`、`R-3-2`、`D-3-1`。
4. `G3/S-3-1.json` 題 id 誤用 `G3-N-3-13-Q01~Q10`；`G2/S-2-3.json`、`S-2-4.json` 的 `source_paper` 為佔位字「Track A 處方落盤」；`G3/N-3-1.json` 的 `component` 混用 `ten_thousand_lab`／`ten-thousand-lab`。
5. **034 尚未建立**：分數圓餅／位值盒／數線教具、電路正式標籤 `<circuit-board-viewer>`、光學 `<optics-ray-box>`（僅見於 `docs/FUTURE_EXTRACTION_SPEC.md:32-33,56`）、`story-card` 的 CLI 通道。
6. `app/assets/characters/` 存在但為空 — **尚未建立**。

---

## 附：外部教材設計 AI 快速指引

1. 先確認課綱代碼存在於 `data/curriculum_108_official.json`；G4～G6 尚無題庫，需先建置。
2. 題檔寫入 `data/units/<G>/<Code>.json`，遵循 §1.3(C)，每題 4 選項 + concept/steps/trap + 實體 `component_path`。
3. 主持人依年級選 §2.1 角色（G2 波波、G3 米米可用；其餘僅藍圖）；84:52／48:52 與 0.3s／1.5s 節奏須遵守。
4. 教具優先用 §3.1 的 034 四標籤或 §3.4 的 APP 通用件；L2 題務必落實真 pointer 事件與機械化拖曳驗證。
5. 完成後跑三道閘門，並同步更新 `data/curriculum.json`（注意 §5.3 既有落差）。
