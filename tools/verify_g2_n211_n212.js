/**
 * tools/verify_g2_n211_n212.js
 * G2-N-2-11【長度（公分、公尺）】與 G2-N-2-12【容量、重量、面積】靜態資料契約與組件守門員
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

// 算理抽驗：正解與算理閉環（防止 answer_index 與算理脫鉤）
function checkMathLogic() {
  const u1 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'units', 'G2', 'N-2-11.json'), 'utf8'));
  const u2 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'units', 'G2', 'N-2-12.json'), 'utf8'));
  const expectations = [
    ['G2-N-2-11-Q01', 2, '305 公分'],   // 3m5cm = 305cm
    ['G2-N-2-11-Q02', 3, '教室黑板長 4 公尺'],
    ['G2-N-2-11-Q03', 2, '6 公分'],     // 9-3=6
    ['G2-N-2-11-Q04', 2, '小芳的'],
    ['G2-N-2-11-Q05', 1, '<'],          // 607 < 670
    ['G2-N-2-12-Q06', 0, '白色'],       // 9 > 7
    ['G2-N-2-12-Q07', 2, '一樣重'],
    ['G2-N-2-12-Q08', 1, '果汁'],       // 5 > 3
    ['G2-N-2-12-Q09', 3, '2 個積木'],   // 6-4=2
    ['G2-N-2-12-Q10', 1, '20 張']       // 14+6=20
  ];
  const all = [...u1.questions, ...u2.questions];
  expectations.forEach(([qid, idx, raw]) => {
    const q = all.find((x) => x.id === qid);
    if (!q) { errors.push(`[MATH_MISSING] ${qid} 不存在`); return; }
    if (q.answer_index !== idx || q.answer_raw !== raw) {
      errors.push(`[MATH_MISMATCH] ${qid} 期望 (${idx},${raw})，實得 (${q.answer_index},${q.answer_raw})`);
    }
  });
}

console.log('=== 開始執行 G2-N-2-11 & G2-N-2-12 靜態契約驗收 ===');
checkUnit('N-2-11', 5);
checkUnit('N-2-12', 5);
checkMathLogic();

if (errors.length > 0) {
  console.error(`❌ 靜態驗收失敗，發現 ${errors.length} 項錯誤：`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ G2-N-2-11 & G2-N-2-12 雙單元 10 題靜態資料契約與組件檢查全部通過！');
  process.exit(0);
}
