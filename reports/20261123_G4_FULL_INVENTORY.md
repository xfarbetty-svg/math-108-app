# 20261123 G4（國小四年級）全冊現況與「多米橘貓」角色資產清查報告

> **唯讀盤點宣告**：本報告僅做現況調查與報告輸出。未修改任何程式碼、未製作或渲染任何影片、未執行 Git 提交、未碰觸 `017\` 或「子由」。
> 盤點日期：2026-11-23｜工具：OpenCode CLI（唯讀盤點）
> 唯一寫入檔案：`reports/20261123_G4_FULL_INVENTORY.md`（本報告）

---

## 0. 交付五欄

| 欄位 | 內容 |
|---|---|
| **範圍** | G4 課綱 26 條目現況；真題題庫／互動教具與 Dark-Light／概念小教室影片三面向；`app/assets/`＋`docs/`＋`reports/` 之「多米橘貓」資產清查 |
| **變更** | 僅新增本報告檔；正式程式、題庫、教具、影片、shell 映射、Git 狀態**零修改** |
| **驗證指令** | 見 §5「驗證指令與真實結果」 |
| **真實 Exit Code** | 全部 0（盤點腳本 0／G4 題庫不存在判定 0／G4 影片數 0 判定 0／shell.js 無 G4 映射判定 0／報告存在判定 0） |
| **證據** | `data/curriculum.json:511-`；`data/units/` 僅 G1/G2/G3；`app/shell.js:310-412`；`app/assets/classroom_videos/` 22 支皆 G2/G3；`APP_PROJECT_INDEX.md:94,98,211-212,231,251-252` |

---

## 1. 基準規範（讀取 `docs/PRODUCTION_SOP_G3_DISTILLED.md` 確認）

| 鐵律 | 要求摘要 | G4 現況對照 |
|---|---|---|
| 鐵律一 | 100% 台灣各縣市國小真實段考題，每題標明學校／學年度／出處（SSOT 範本 `docs/G3_REAL_EXAM_MASTER_POOL.md`）；嚴禁 AI 杜撰或湊題數閹割高階題 | **未開始**：G4 無題庫、無出處可稽 |
| 鐵律一（教具） | 「一步一步看算理」＋可操作教具；L2 需真 `pointerdown/move/up`；Dark/Light 雙模式高對比度目視通過；教具 ≤420px、全屏 ≤740px、390px 零溢出 | **未開始**：無教具、無雙模式檢查紀錄 |
| 鐵律二 | 四幕暖米色畫布；角色只用 `app/assets/mimi_poses/` 3D PNG（嚴禁 SVG 自繪）；字幕距底 ≥76px；4 幕影格自檢 | **未開始**：G4 無成片；且 G4 指定角色多米橘貓亦無資產 |
| 鐵律三 | `loudnorm` 雙階段 −14.0 LUFS；1920×1080/30fps；>25 MiB 放 `_scratch/` | **未開始**：G4 無音訊／影片產出 |
| 鐵律四 | 兩段式 YouTube 總合集 SOP、oEmbed 驗真 | **未開始**：G4 無合集 |
| 交付前檢查清單 | 10 項全數勾選才可交付 | G4 目前 10 項**全未通過**（因無任何產出） |

> 補註：`AGENTS.md` 軍規四「動態 vs 靜態分級」與軍規五「One-Screen」同為 G4  future 強制門禁，現況尚無物件可檢驗。

---

## 2. G4 全冊課綱與現況盤點

### 2.1 課綱來源與總數

- 課綱骨架：`data/curriculum.json` → `grades[grade=4]`（起於 `:511`）。
- 官方 SSOT：`data/curriculum_108_official.json` 的 `content_units` 共 131 條，其中 **grade=4 計 26 條**；與 `curriculum.json` 的 26 個代码**完全一致**（集合比對 True）。
- 各年級條目：G1=11、G2=24、G3=24、**G4=26**、G5=27、G6=19（合計 131）。
- G4 26 條狀態：**全部 `upcoming`**；`question_count` **全部 0**；`verified_source` **全部 null**。
- 附註：`docs/108課綱規格書_全學年視覺教具對照表.md:43-51` 另有 G4 教具規格草案（N-4-1／N-4-2／N-4-5／N-4-7／S-4-2 共 5 條），屬**規格文件**，非已實裝教具。

### 2.2 逐單元現況總表

圖例：題庫＝`data/units/G4/<code>.json`（不存在）；教具＝`app/components/` 對應 lab（不存在）；影片＝`app/shell.js` 映射＋`app/assets/classroom_videos/` 成片（不存在）。

| # | 代碼 | 單元名稱 | 狀態 | 宣告題數 | a. 真題題庫／出處 | b. 教具／算理／Dark-Light | c. 概念小教室影片 |
|---|---|---|---|---|---|---|---|
| 1 | N-4-1 | 一億以內的數 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 2 | N-4-2 | 較大位數之乘除計算 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 3 | N-4-3 | 解題（兩步驟應用問題（乘除，連除）） | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 4 | N-4-4 | 解題（對大數取概數） | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 5 | N-4-5 | 同分母分數 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 6 | N-4-6 | 等值分數 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 7 | N-4-7 | 二位小數 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 8 | N-4-8 | 數線與分數、小數 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 9 | N-4-9 | 長度（「公里」） | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 10 | N-4-10 | 角度 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 11 | N-4-11 | 面積（「平方公尺」） | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 12 | N-4-12 | 體積與「立方公分」 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 13 | N-4-13 | 解題（日常生活的時間加減問題） | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 14 | S-4-1 | 角度 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 15 | S-4-2 | 解題（旋轉角） | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 16 | S-4-3 | 正方形與長方形的面積與周長 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 17 | S-4-4 | 體積 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 18 | S-4-5 | 垂直與平行 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 19 | S-4-6 | 平面圖形的全等 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 20 | S-4-7 | 三角形 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 21 | S-4-8 | 四邊形 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 22 | R-4-1 | 兩步驟問題併式 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 23 | R-4-2 | 四則計算規律（I） | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 24 | R-4-3 | 以文字表示數學公式 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 25 | R-4-4 | 數量模式與推理（II） | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |
| 26 | D-4-1 | 報讀長條圖與折線圖以及製作長條圖 | upcoming | 0 | 無題檔、0 題、無出處 | 無；雙模式未檢 | 無成片、無映射（缺 1） |

### 2.3 三面向總結

**a. 真題題庫狀態**
- `data/units/` 實測僅 `G1\`、`G2\`、`G3\`，**無 `G4\` 目錄**、無任何 `*-4-*.json` 題檔。
- G4 真題題數 **0 / 26 單元**；標明台灣縣市學校／學年度／出處者 **0 題**。
- 與已完工年级對比：G1 11 檔 50 題、G2 24 檔 121 題、G3 24 檔 205 題（`APP_PROJECT_INDEX.md:224-233`）。

**b. 互動教具與深淺色模式**
- `app/shell.js` 的 `CONCEPT_COMPONENTS`（`:363-412`）與 `UNIT_CONCEPT_MOVIES`（`:310-337`）**无任何 `-4-` 或 `g4_` 條目**；`app/components/` 亦無 `g4`／`-4-` 檔名。
- G4 教具 **0 / 26**；「一步一步看算理」拆解 **0**； Dark/Light 雙模式對比檢查 **無紀錄可查**（因無教具可測，非「檢查未通過」）。
- `app/shell.js` 本身已具備全域 Light/Dark 切換與 iframe `THEME_CHANGE` 廣播（`:987-1011`），但 G4 無教具可套用。

**c. 概念小教室影片狀態**
- `app/assets/classroom_videos/` 實測 **22 支** MP4，全部為 G2／G3 代號（N31–N317、S32–S34、R31/R32、D31），**G4 成片 0 支**。
- `app/assets/video/` 另有 3 支（g2_n21、g2_n22、g3_n39），亦非 G4；兩資料夾合計 25 支，皆非 G4。
- `app/shell.js` 的 `UNIT_CONCEPT_MOVIES` 映射共 26 條，全為 G2／G3（其中 S-3-1 復用 N313）；**G4 映射 0 條**。
- 結論：**已有 0 支、尚缺 26 支**（若採 G3 同義整合慣例，N-4-10 與 S-4-1 可共用一片，則實務缺口下限為 25 支；本報告以「一單元一片」的保守口徑記 26）。

---

## 3.「多米橘貓」角色資產清查

### 3.1 清查範圍與結果

| 清查項目 | 路徑／方法 | 結果 |
|---|---|---|
| 專屬資料夾 | `app/assets/` 遞迴目錄（含隱檔） | 僅 `characters\`、`classroom_videos\`、`demo\`、`mimi_poses\`、`video\`；**無 `domi`／`多米`／`g4_*` 資料夾** |
| 角色圖片 | 同上全檔名 | **無多米／橘貓立繪**；`mimi_poses/` 4 張（wave/think/point/cheer）與 `characters/mimi_stand.png` 皆為兔子米米 |
| 風格設定／metadata／motions／台詞 | `docs/`、`reports/` 全文關鍵字 `多米|Domi|橘貓|多米橘` | **0 命中**；無 `master_metadata.json`、無 character DNA、無口頭禪台詞檔 |
| 角色藍圖文字 | `APP_PROJECT_INDEX.md:94` | **唯一明確記載**：G4｜**多米 Domi**｜橘貓｜好奇探索、幾何角度、科學觀察｜寶石藍 `#3498DB`｜冒險風鏡、星際星圖包｜**僅藍圖：尚未建立** |
| 藍圖層級註記 | `APP_PROJECT_INDEX.md:98` | 「定案 1~6 年級跨科通用吉祥物藍圖（皮皮／波波／米米／多米／凱爾／歐爾）——定案僅至藍圖層」 |
| 缺口清單 | `APP_PROJECT_INDEX.md:251-252` | 「G4/G5/G6 共 72 條：題檔／教具／角色動畫全數尚未建立」；「G1 皮皮、G4 多米、G5 凱爾、G6 歐爾僅有 IP 藍圖一列，無立繪／metadata／motions／台詞」 |
| 權威來源追溯 | `APP_PROJECT_INDEX.md:87` 指向 `FIX_PLAN.md:85-94` | **本工作區查無 `FIX_PLAN.md`**（`D:\ANTIGRAVITY` 遞迴 glob 無命中），故無法再往上追溯到原始定案檔 |

### 3.2 易混淆項（避免誤判為已存在）

- `app/concept_preview.html:595` 的 `{ id: "cat", name: "店長小橘貓", ... }` 是 **G2 重量情境的計價角色**（點心店）、非 G4 主持人「多米」；且 id 為 `cat`、無 Domi／G4 關聯。
- `reports/20261122_N314_ACCEPTANCE.md:10` 與 `reports/20261123_010_R32_INTERACTIVE_ACCEPTANCE.md:8-9` 出现的「G4」分別是**門禁編號 G1~G4**與**未來擴充標記**，**不是四年級已完成之證據**。
- `docs/PRODUCTION_SOP_G3_DISTILLED.md:34` 強制角色只用 `app/assets/mimi_poses/` 兔子 PNG；若 G4 改由多米橘貓主持，將與現行 SOP 角色條文衝突，**需先修規範再施工**（本次盤點不修改）。

### 3.3 清查結論

> **「多米橘貓」目前只是 IP 藍圖中的一列文字**：有名字（多米 Domi）、動物（橘貓）、定位（好奇探索／幾何角度／科學觀察）、代表色（`#3498DB`）、配件（冒險風鏡、星際星圖包）；**沒有資料夾、沒有圖片、沒有風格檔、沒有動畫、沒有台詞**。
> 完整度可類比 G1 皮皮／G5 凱爾／G6 歐爾，明顯落後於已 Golden Master 化的 G2 波波與 G3 米米。

---

## 4. 文件與現況落差（如實記錄）

| 項目 | 文件陳述 | 實測 | 判讀 |
|---|---|---|---|
| `app/assets/characters/` | `APP_PROJECT_INDEX.md:256` 稱「存在但為空」 | 實有 `mimi_stand.png`（734,233 bytes） | 索引文件陳舊；不影響 G4 結論（仍無多米資產） |
| G4 題庫 | `APP_PROJECT_INDEX.md:231,251` 稱尚未建立 | 實測一致 | 相符 |
| G4 角色 | `APP_PROJECT_INDEX.md:94,252` 稱僅藍圖 | 實測一致 | 相符 |
| G4 影片 | 索引未逐支列 G4 | `classroom_videos/` 22 支全 G2/G3 | 相符 |

---

## 5. 驗證指令與真實結果

以下指令於 `D:\ANTIGRAVITY\028-1_國小數學APP` 執行，**全部 Exit 0**；皆為唯讀。

```powershell
# 1) 課綱解析：G4=26、全 upcoming、question_count 全 0、verified_source 全 null
python -c "import json; d=json.load(open('data/curriculum.json',encoding='utf-8')); g=[x for x in d['grades'] if x['grade']==4][0]; print(len(g['units']), set(u['status'] for u in g['units']), set(u['question_count'] for u in g['units']), set(str(u['verified_source']) for u in g['units']))"
# 2) 官方 SSOT 26 條與 curriculum G4 代码集合一致
python -c "import json; off=json.load(open('data/curriculum_108_official.json',encoding='utf-8'))['content_units']; a=[k for k,v in off.items() if v.get('grade')==4]; d=json.load(open('data/curriculum.json',encoding='utf-8')); g=[x for x in d['grades'] if x['grade']==4][0]; print(len(a), sorted(a)==sorted(u['code'] for u in g['units']))"
# 3) G4 題庫不存在判定：存在則 Exit 1
powershell -c "if (Test-Path 'data/units/G4') { exit 1 } else { Write-Output 'NO_G4_UNIT_DIR'; exit 0 }"
# 4) shell.js 無 -4- / g4_ 映射判定：有則 Exit 1
powershell -c "if (Select-String -Path 'app/shell.js' -Pattern '\-4\-|g4_') { exit 1 } else { Write-Output 'NO_G4_SHELL_MAPPING'; exit 0 }"
# 5) 成片清點：22 支，G4=0（G4 檔名特徵為 -4-，不能以數字 4 泛比對）
powershell -c "$f=Get-ChildItem 'app/assets/classroom_videos/*.mp4'; $g4=@($f|Where-Object { $_.Name -match '-[NSRD]-4-' }); Write-Output ('MP4='+$f.Count+' G4='+$g4.Count); exit 0"
# 6) 報告落檔判定
powershell -c "if (Test-Path 'reports/20261123_G4_FULL_INVENTORY.md') { exit 0 } else { exit 1 }"
```

| 驗證項 | 真實輸出 | Exit Code |
|---|---|---|
| 課綱解析 | `26 {'upcoming'} {0} {'None'}` | 0 |
| 官方 SSOT 比對 | `26 True` | 0 |
| G4 題庫不存在 | `NO_G4_UNIT_DIR` | 0 |
| shell.js 無 G4 映射 | `NO_G4_SHELL_MAPPING` | 0 |
| 成片清點 | `MP4=22 G4=0` | 0 |
| 報告存在 | (無輸出，Test-Path 成功) | 0 |

---

## 6. 後續建議（僅建議，本次不執行）

1. G4 若啟動，先決條件依序為：**確立多米橘貓角色規格（含與 SOP 鐵律二角色條文之衝突裁決）→ 建 26 條真題 SSOT → 教具 → 影片**。
2. 真題source可直接沿用 `docs/G3_REAL_EXAM_MASTER_POOL.md` 採集範本，嚴禁用 AI 補題。
3. 優先可以既有 G4 教具規格草案（N-4-1／N-4-2／N-4-5／N-4-7／S-4-2）作為第一批施工標的。
4. 開工前先修正 `APP_PROJECT_INDEX.md:256` 的陳舊描述，並補上 `FIX_PLAN.md` 原始藍圖檔或將其路徑明確化。
