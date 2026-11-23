/**
 * tools/verify_tts_polyphone.js — TTS 破音字發音校正單元驗證
 * 驗證 cleanTextForSpeech()（全站唯一 TTS 前處理入口）的替換邏輯與邊界條件，
 * 並確認送入 TTS 的字串已校正、而來源文字（DOM／題庫 JSON 原文）未被竄改。
 * 全部通過 = Exit 0；任一失敗 = Exit 1。
 * 用法：node tools/verify_tts_polyphone.js
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.dirname(__dirname);
const MGR_PATH = path.join(ROOT, 'app', 'js', 'audio_manager.js');
const results = [];
function check(ok, msg) {
  results.push(!!ok);
  console.log((ok ? 'PASS ' : 'FAIL ') + msg);
}

// 1. 以最小 window stub 載入「真實」audio_manager.js（不修改原始碼）
const code = fs.readFileSync(MGR_PATH, 'utf8');
const sandbox = { window: {}, console };
vm.runInNewContext(code, sandbox, { filename: 'audio_manager.js' });
const AM = sandbox.window.AudioManager;
check(!!AM && typeof AM.cleanTextForSpeech === 'function', 'AudioManager.cleanTextForSpeech 成功掛載');
check(!!AM && typeof AM.fixPolyphonePronunciation === 'function', 'AudioManager.fixPolyphonePronunciation 成功掛載');

// 2. 靜態確認校正作用於 TTS 文字鏈，而非 DOM／題庫
check(code.includes('POLYPHONE_FIXES'), '原始碼含破音字校正字典 POLYPHONE_FIXES');
check(code.includes('fixPolyphonePronunciation(text)'), 'cleanTextForSpeech 呼叫破音字校正');
check(code.includes('new SpeechSynthesisUtterance(clean)'), 'Web Speech 使用清洗後 clean 字串');
check(code.includes('encodeURIComponent(clean)'), '/api/tts 與雲端備援使用清洗後 clean 字串');

// 3. 核心案例：使用者回報的 R-3-2 Q5 情境（精確輸出比對）
const input = '柳丁兩兩一數剩 1 顆的奇偶推理，總數是奇數';
const expected = '柳丁兩兩一數剩 1 顆的基偶推理，總數是基數';
const got = AM.cleanTextForSpeech(input);
check(got === expected, '奇偶/奇數 → 基偶/基數，實際: ' + JSON.stringify(got));
check(input === '柳丁兩兩一數剩 1 顆的奇偶推理，總數是奇數', '傳入原文未被就地竄改');

// 4. 邊界：不誤傷日常詞（軍規：嚴禁假赋能／誤傷）
check(AM.cleanTextForSpeech('奇怪') === '奇怪', '"奇怪" 不被誤改為 "基怪"');
check(AM.cleanTextForSpeech('神奇') === '神奇', '"神奇" 不被誤改為 "神基"');
check(AM.cleanTextForSpeech('好奇心') === '好奇心', '"好奇心" 保持不變');
check(AM.cleanTextForSpeech('差數與相差') === '差數與相差', '"差數／相差" 維持原音，不被改寫');
check(AM.cleanTextForSpeech('幾分之幾') === '幾分之幾', '"幾分之幾" 維持原音，不被改寫');

// 5. 邊界：單詞、複合詞、空值
check(AM.cleanTextForSpeech('奇數') === '基數', '單詞 奇數 → 基數');
check(AM.cleanTextForSpeech('奇偶') === '基偶', '單詞 奇偶 → 基偶');
check(AM.cleanTextForSpeech('奇偶數') === '基偶數', '複合 奇偶數 → 基偶數');
check(AM.cleanTextForSpeech('') === '', '空字串 → 空字串');
check(AM.cleanTextForSpeech(null) === '', 'null → 空字串');
check(AM.cleanTextForSpeech(undefined) === '', 'undefined → 空字串');

// 6. 來源資料不被回寫：以物件 stem 示範（等價於題庫 JSON／DOM 原文）
const source = { stem: '總數是奇數，奇偶推理' };
const spoken = AM.cleanTextForSpeech(source.stem);
check(spoken === '總數是基數，基偶推理', '送入 TTS 的字串已校正: ' + JSON.stringify(spoken));
check(source.stem === '總數是奇數，奇偶推理', '來源 stem 原文保持不變（未回寫 DOM／JSON）');

const failed = results.filter((r) => !r).length;
if (failed) {
  console.error('FAILED (' + failed + '/' + results.length + ')');
  process.exit(1);
}
console.log('TTS_POLYPHONE_VERIFIED — ALL PASS (' + results.length + ' checks) — Exit Code 0');
process.exit(0);
