/**
 * tools/verify_g2_n29_n210.js
 * G2-N-2-9【分裝與平分】與 G2-N-2-10【單位分數】靜態資料契約與組件守門員
 * Exit Code: 0 為全部通過，1 為異常
 */
const fs = require('fs');
const path = require('path');

let errors = [];

function checkUnit(unitCode, expectedCount) {
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
    const qid = q.id || `Q${idx+1}`;
    if (!q.stem || q.stem.trim().length === 0) {
      errors.push(`[EMPTY_STEM] ${qid} 題幹為空`);
    }
    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      errors.push(`[CHOICES_INVALID] ${qid} 選項數量非 4 個 (實得 ${q.choices ? q.choices.length : 0})`);
    } else {
      const set = new Set(q.choices);
      if (set.size !== 4) {
        errors.push(`[CHOICES_DUPLICATE] ${qid} 選項有重複值`);
      }
    }
    if (typeof q.answer_index !== 'number' || q.answer_index < 0 || q.answer_index >= 4) {
      errors.push(`[ANSWER_INDEX_INVALID] ${qid} answer_index 無效 (${q.answer_index})`);
    }
    if (!q.component_path) {
      errors.push(`[NO_COMPONENT_PATH] ${qid} 缺少 component_path`);
    } else {
      const compFull = path.join(__dirname, '..', 'app', q.component_path);
      if (!fs.existsSync(compFull)) {
        errors.push(`[COMPONENT_NOT_FOUND] ${qid} 組件檔案不存在: ${compFull}`);
      } else {
        const content = fs.readFileSync(compFull, 'utf8');
        if (content.length < 500) {
          errors.push(`[COMPONENT_TOO_SMALL] ${qid} 組件長度異常 (<500B): ${content.length}B`);
        }
        if (!content.includes('<svg')) {
          errors.push(`[NO_SVG] ${qid} 組件缺少 <svg 標籤`);
        }
        if (!content.includes('window.check')) {
          errors.push(`[NO_WINDOW_CHECK] ${qid} 組件缺少 window.check 契約`);
        }
        if (!content.includes('window.__q')) {
          errors.push(`[NO_WINDOW_Q] ${qid} 組件缺少 window.__q 契約`);
        }
      }
    }
  });
}

console.log('=== 開始執行 G2-N-2-9 & G2-N-2-10 靜態契約驗收 ===');
checkUnit('N-2-9', 5);
checkUnit('N-2-10', 5);

if (errors.length > 0) {
  console.error(`❌ 靜態驗收失敗，發現 ${errors.length} 項錯誤：`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ G2-N-2-9 & G2-N-2-10 雙單元 10 題靜態資料契約與組件檢查全部通過！');
  process.exit(0);
}
