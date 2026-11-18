# 任務卡：G2-S-2-3 與 G2-S-2-4 真題題庫 JSON 落地 (Step 1)

> 依照【PLAN+PR Protocol v3.1】Step 1 數據建模規範。
> 產出目標：
> 1. `data/units/G2/S-2-3.json`（直尺操作，5 題 Q01~Q05）
> 2. `data/units/G2/S-2-4.json`（平面圖形的邊長，5 題 Q06~Q10）

---

## 嚴格格式契約 (Schema)
每個 JSON 檔案必須包含完整結構：
- `$schema`: "math-app-unit-v1"
- `unit_id`: "G2-S-2-3" 或 "G2-S-2-4"
- `curriculum_code`: "S-2-3" 或 "S-2-4"
- `code`: "S-2-3" 或 "S-2-4"
- `grade`: 2
- `unit_name`: "直尺操作" 或 "平面圖形的邊長"
- `video_url`: ""
- `source_paper`: 試卷出處字串
- `verified_by`: 對齊審查說明
- `questions`: 5 題物件陣列，每題結構：
  - `id`: 例如 "G2-S-2-3-Q01"
  - `exam_source`: 段考真題出處
  - `section`: 大題
  - `question_num`: 題號
  - `title`: 題目標題
  - `stem`: 完整題幹
  - `choices`: 4 個相異選項字串
  - `answer_index`: 0~3 整數
  - `answer_raw`: 正確選項文字
  - `component`: 組件識別碼
  - `component_path`: "components/..." 路徑
  - `video_url`: ""
  - `explanation`: 包含 `concept`（課綱核心觀念）、`steps`（3 步具體算理）、`trap`（學童最容易犯的錯誤盲區）
