/**
 * tools/verify_g2_final_4_units.js
 * 驗收 G2-R-2-2、G2-R-2-3、G2-R-2-4、G2-D-2-1 四大單元題庫 JSON 與微教具檔案完整性
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const UNITS = [
  { code: 'R-2-2', qCount: 5, startIdx: 1 },
  { code: 'R-2-3', qCount: 5, startIdx: 6 },
  { code: 'R-2-4', qCount: 5, startIdx: 1 },
  { code: 'D-2-1', qCount: 5, startIdx: 6 },
];

let failed = false;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed = true;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

for (const unit of UNITS) {
  const jsonPath = path.join(ROOT, 'data', 'units', 'G2', `${unit.code}.json`);
  assert(fs.existsSync(jsonPath), `題庫 JSON 存在: ${unit.code}.json`);
  if (!fs.existsSync(jsonPath)) continue;

  let data;
  try {
    data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    assert(false, `題庫 JSON 解析成功: ${unit.code}.json (${e.message})`);
    continue;
  }

  assert(data.code === unit.code, `${unit.code} code 欄位正確 (${data.code})`);
  assert(data.unit_id === `G2-${unit.code}`, `${unit.code} unit_id 欄位正確 (${data.unit_id})`);
  assert(Array.isArray(data.questions), `${unit.code} questions 必須為陣列`);
  assert(data.questions.length === unit.qCount, `${unit.code} 題數等於 ${unit.qCount} (實際 ${data.questions ? data.questions.length : 0})`);

  if (!data.questions) continue;

  for (let i = 0; i < unit.qCount; i++) {
    const qNum = unit.startIdx + i;
    const qSuffix = qNum < 10 ? `Q0${qNum}` : `Q${qNum}`;
    const expectedId = `G2-${unit.code}-${qSuffix}`;
    const q = data.questions[i];
    if (!q) {
      assert(false, `${unit.code} 缺少第 ${i+1} 題`);
      continue;
    }
    assert(q.id === expectedId, `${unit.code} 題號正確 (${q.id} === ${expectedId})`);
    assert(typeof q.stem === 'string' && q.stem.length > 0, `${unit.code} ${qSuffix} 題幹非空`);
    assert(q.component_path && typeof q.component_path === 'string', `${unit.code} ${qSuffix} component_path 存在`);
    
    if (q.component_path) {
      // 支援 component_path 為 components/... 或 app/components/...
      const relPath = q.component_path.startsWith('app/') ? q.component_path : path.join('app', q.component_path);
      const compFullPath = path.join(ROOT, relPath);
      assert(fs.existsSync(compFullPath), `${unit.code} ${qSuffix} 微教具實體檔案存在 (${relPath})`);
      if (fs.existsSync(compFullPath)) {
        const compHtml = fs.readFileSync(compFullPath, 'utf8');
        assert(compHtml.includes('<!DOCTYPE html>'), `${unit.code} ${qSuffix} 為完整 HTML 文件`);
        assert(compHtml.length < 35000, `${unit.code} ${qSuffix} 體積小於 35KB (實際 ${(compHtml.length/1024).toFixed(1)}KB)`);
      }
    }
  }
}

if (failed) {
  console.error('\n🚨 [G2 Final 4 Units] 靜態契約驗收失敗！');
  process.exit(1);
} else {
  console.log('\n🎉 [G2 Final 4 Units] 4 大單元 20 題靜態契約全部通過！');
  process.exit(0);
}
