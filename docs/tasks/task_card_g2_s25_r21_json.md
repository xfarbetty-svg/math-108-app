# 任務卡：G2-S-2-5 與 G2-R-2-1 真題題庫 JSON 落地 (Step 1)

> 依照【PLAN+PR Protocol v3.1】Step 1 數據建模規範。
> 產出目標：
> 1. `data/units/G2/S-2-5.json`（面積以具體操作為主，5 題 Q01~Q05）
> 2. `data/units/G2/R-2-1.json`（大小關係與遞移律，5 題 Q06~Q10）

---

## 嚴格格式契約 (Schema)
每個 JSON 檔案必須包含完整結構：
- `$schema`: "math-app-unit-v1"
- `unit_id`: "G2-S-2-5" 或 "G2-R-2-1"
- `curriculum_code`: "S-2-5" 或 "R-2-1"
- `code`: "S-2-5" 或 "R-2-1"
- `grade`: 2
- `unit_name`: "面積（以具體操作為主）" 或 "大小關係與遞移律"
- `video_url`: ""
- `source_paper`: 試卷出處字串
- `verified_by`: 對齊審查說明
- `questions`: 5 題物件陣列，每題結構：
  - `id`: "G2-S-2-5-Q01" ~ "Q05" / "G2-R-2-1-Q06" ~ "Q10"
  - `exam_source`: 段考真題出處
  - `section`: 大題
  - `question_num`: 題號
  - `title`: 題目標題
  - `stem`: 完整題幹
  - `choices`: 4 個相異選項字串
  - `answer_index`: 0~3 整數
  - `answer_raw`: 必須與 choices[answer_index] 100% 全等字串
  - `component`: 組件識別碼
  - `component_path`: "components/g2_s25_q01.html" ~ "q05.html" / "components/g2_r21_q06.html" ~ "q10.html"
  - `video_url`: ""
  - `explanation`: 包含 `concept`（課綱核心觀念）、`steps`（3 步具體算理）、`trap`（學童最容易犯的錯誤盲區）
