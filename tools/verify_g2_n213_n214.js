/**
 * tools/verify_g2_n213_n214.js
 * G2-N-2-13【鐘面的時刻】與 G2-N-2-14【時間（年、月、星期、日）】靜態資料契約與組件守門員
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
  if (!data.video_url || !/^https:\/\/youtu\.be\//.test(data.video_url)) {
    errors.push(`[VIDEO_URL_INVALID] ${unitCode} 缺少合法的 unit 層級 video_url`);
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
    if (!q.video_url || !/^https:\/\/youtu\.be\//.test(q.video_url)) {
      errors.push(`[NO_QUESTION_VIDEO] ${qid} 缺少題目層級 YouTube 微影片 video_url`);
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
        if (!content.includes('window.check')) {
          errors.push(`[NO_WINDOW_CHECK] ${qid} 組件缺少 window.check 契約`);
        }
        if (!content.includes('window.__q')) {
          errors.push(`[NO_WINDOW_Q] ${qid} 組件缺少 window.__q 契約`);
        }
        // 微影片導流按鈕：詳解卡片 .vq 頂部必須無縫綁定 YouTube 連結
        const vqIdx = content.indexOf('class="vq"');
        const ytIdx = content.indexOf('youtu.be/');
        if (vqIdx < 0) {
          errors.push(`[NO_VQ_CARD] ${qid} 組件缺少詳解卡片 .vq`);
        } else if (ytIdx < 0 || ytIdx < vqIdx) {
          errors.push(`[NO_VIDEO_BINDING] ${qid} .vq 詳解卡片內未綁定 YouTube 導流按鈕`);
        }
        if (!content.includes('video-guide-banner') || !content.includes('video-link')) {
          errors.push(`[NO_VIDEO_BANNER] ${qid} 缺少 video-guide-banner / video-link 導流結構`);
        }
      }
    }
  });
}

// 算理抽驗：正解與算理閉環（防止 answer_index 與算理脫鉤）
function checkMathLogic() {
  const u1 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'units', 'G2', 'N-2-13.json'), 'utf8'));
  const u2 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'units', 'G2', 'N-2-14.json'), 'utf8'));
  const expectations = [
    ['G2-N-2-13-Q01', 3, '分針走一大格就是走了 1 分鐘'],  // 1 大格 = 5 小格 = 5 分
    ['G2-N-2-13-Q02', 0, '3 時 47 分'],                   // 9×5+2=47，時針在 3~4 間
    ['G2-N-2-13-Q03', 2, '下午 6 時 37 分'],              // 15 + (4×5+2) = 37
    ['G2-N-2-13-Q04', 1, '下午 7 時 10 分'],              // 40+30=70 → 進位 1 小時
    ['G2-N-2-13-Q05', 1, '下午 1 時 30 分'],              // 3:30 逆推 2 小時
    ['G2-N-2-14-Q06', 0, '28 天，365 天'],                // 平年 2 月 28 天/全年 365 天
    ['G2-N-2-14-Q07', 2, '3 年 2 個月'],                  // 38 = 12×3 + 2
    ['G2-N-2-14-Q08', 1, '9 天'],                          // 30-22+1=9（算頭又算尾）
    ['G2-N-2-14-Q09', 1, '5 月 4 日'],                     // 4 月走 5 天 + 5 月 4 天
    ['G2-N-2-14-Q10', 1, '6 月 26 日星期四']               // 6/24(二)+2 = 6/26(四)
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

console.log('=== 開始執行 G2-N-2-13 & G2-N-2-14 靜態契約驗收 ===');
checkUnit('N-2-13', 5);
checkUnit('N-2-14', 5);
checkMathLogic();

if (errors.length > 0) {
  console.error(`❌ 靜態驗收失敗，發現 ${errors.length} 項錯誤：`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ G2-N-2-13 & G2-N-2-14 雙單元 10 題靜態資料契約、微影片導流綁定與組件檢查全部通過！');
  process.exit(0);
}
