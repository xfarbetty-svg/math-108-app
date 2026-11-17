/**
 * tools/verify_g2_s21_s22.js
 * G2-S-2-1【物體之幾何特徵】與 G2-S-2-2【簡單幾何形體】靜態資料契約與組件守門員
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
    if (q.answer_raw !== q.choices[q.answer_index]) {
      errors.push(`[ANSWER_RAW_MISMATCH] ${qid} answer_raw 與 choices[answer_index] 不一致`);
    }
    if (!q.explanation || !q.explanation.concept || !Array.isArray(q.explanation.steps) || !q.explanation.trap) {
      errors.push(`[EXPLANATION_INCOMPLETE] ${qid} 詳解缺 concept/steps/trap`);
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
        // 嚴防未作答前直接渲染正解文字
        if (content.includes('result-banner success') && !content.includes('display:none') && !content.includes('display: none')) {
          errors.push(`[LEAK_ANSWER] ${qid} 疑似預先暴雷正解`);
        }
      }
    }
  });
}

console.log('=== G2-S-2-1 & G2-S-2-2 靜態資料與組件契約檢核 ===');
checkUnit('S-2-1', 5);
checkUnit('S-2-2', 5);

if (errors.length > 0) {
  console.error(`❌ 檢驗失敗，共發現 ${errors.length} 項缺失:`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ 全部通過！10 道真題題庫契約與組件檔案結構均 100% 合規。');
  process.exit(0);
}
