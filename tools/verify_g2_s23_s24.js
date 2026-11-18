/**
 * tools/verify_g2_s23_s24.js
 * G2-S-2-3【直尺操作】與 G2-S-2-4【平面圖形的邊長】靜態資料契約守門員
 * Exit Code: 0 為全部通過，1 為異常
 */
const fs = require('fs');
const path = require('path');

let errors = [];
const checkComponents = process.argv.includes('--components');

function checkUnit(unitCode, expectedCount, idPrefix, startNum) {
  const jsonPath = path.join(__dirname, '..', 'data', 'units', 'G2', `${unitCode}.json`);
  if (!fs.existsSync(jsonPath)) {
    errors.push(`[MISSING_JSON] 題庫契約不存在: ${jsonPath}`);
    return;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    errors.push(`[JSON_PARSE_ERROR] ${jsonPath} 解析失敗: ${e.message}`);
    return;
  }

  if (!Array.isArray(data.questions) || data.questions.length !== expectedCount) {
    errors.push(`[QUESTION_COUNT] ${unitCode} 題數應為 ${expectedCount}，實得 ${data.questions ? data.questions.length : 0}`);
  }

  (data.questions || []).forEach((q, idx) => {
    const expectedId = `${idPrefix}-Q${String(startNum + idx).padStart(2, '0')}`;
    const qid = q.id || expectedId;
    if (q.id !== expectedId) {
      errors.push(`[ID_MISMATCH] 預期 ${expectedId}，實得 ${q.id}`);
    }
    if (!q.stem || q.stem.trim().length === 0) {
      errors.push(`[EMPTY_STEM] ${qid} 題幹為空`);
    }
    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      errors.push(`[CHOICES_INVALID] ${qid} 選項數量非 4 個 (實得 ${q.choices ? q.choices.length : 0})`);
    } else {
      const set = new Set(q.choices);
      if (set.size !== 4) {
        errors.push(`[CHOICES_DUPLICATE] ${qid} 選項有重複值: ${JSON.stringify(q.choices)}`);
      }
    }
    if (typeof q.answer_index !== 'number' || q.answer_index < 0 || q.answer_index >= 4) {
      errors.push(`[ANSWER_INDEX_INVALID] ${qid} answer_index 無效 (${q.answer_index})`);
    }
    if (q.answer_raw !== q.choices[q.answer_index]) {
      errors.push(`[ANSWER_RAW_MISMATCH] ${qid} answer_raw (${q.answer_raw}) 與 choices[${q.answer_index}] (${q.choices[q.answer_index]}) 不一致`);
    }
    if (!q.explanation || !q.explanation.concept || !Array.isArray(q.explanation.steps) || !q.explanation.trap) {
      errors.push(`[EXPLANATION_INCOMPLETE] ${qid} 詳解缺 concept/steps/trap`);
    }
    if (!q.component_path) {
      errors.push(`[NO_COMPONENT_PATH] ${qid} 缺少 component_path`);
    } else if (checkComponents) {
      const compFull = path.join(__dirname, '..', 'app', q.component_path);
      if (!fs.existsSync(compFull)) {
        errors.push(`[COMPONENT_NOT_FOUND] ${qid} 組件檔案不存在: ${compFull}`);
      } else {
        const content = fs.readFileSync(compFull, 'utf8');
        if (content.length < 500) {
          errors.push(`[COMPONENT_TOO_SMALL] ${qid} 組件檔案小於 500 位元組，可能為空骨架`);
        }
      }
    }
  });
}

const targetUnit = process.argv.find(a => a.startsWith('--unit='))?.split('=')[1];

console.log('=== G2-S-2-3 & G2-S-2-4 資料契約與組件靜態守門員檢測 ===');
if (!targetUnit || targetUnit === 'S-2-3') {
  checkUnit('S-2-3', 5, 'G2-S-2-3', 1);
}
if (!targetUnit || targetUnit === 'S-2-4') {
  checkUnit('S-2-4', 5, 'G2-S-2-4', 6);
}

if (errors.length > 0) {
  console.error(`❌ 檢測失敗，共有 ${errors.length} 項錯誤：`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ 靜態契約檢測全數通過！題庫結構、選項、正解、解析完全合規。');
  process.exit(0);
}
