// 閘門一（靜態資料契約）：G3-N-3-9 咪咪草莓派概念小教室三件套驗收
// 用法：node tests/verify_g3_n39_mimi.js  → 全綠 exit 0
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const AVATAR = path.join(ROOT, 'app/components/mimi_rabbit_avatar.js');
const LESSON = path.join(ROOT, 'app/components/g3_n39_mimi_lesson.html');

let fail = 0;
function check(label, cond, extra) {
  if (cond) console.log(`PASS ${label}`);
  else { console.log(`FAIL ${label}${extra ? ' — ' + extra : ''}`); fail++; }
}

/* ---------- 0) 檔案存在 ---------- */
check('avatar 檔案存在', fs.existsSync(AVATAR), AVATAR);
check('lesson 檔案存在', fs.existsSync(LESSON), LESSON);
if (fail > 0) { console.log('FAILED: 缺件'); process.exit(1); }

const avatar = fs.readFileSync(AVATAR, 'utf8');
const html = fs.readFileSync(LESSON, 'utf8');

/* ---------- 1) 咪咪角色組件契約 ---------- */
check("avatar: customElements.define('mimi-rabbit')", avatar.includes("customElements.define('mimi-rabbit'"));
check('avatar: extends HTMLElement Web Component', /class\s+\w+\s+extends\s+HTMLElement/.test(avatar));
['normal', 'confused', 'eureka', 'happy'].forEach(function (s) {
  check(`avatar: 支援狀態 ${s}`, avatar.includes("'" + s + "'"));
});
check('avatar: setState API', avatar.includes('setState(state)'));
check('avatar: getState API', avatar.includes('getState()'));
check("avatar: 'state-change' 事件", avatar.includes("'state-change'"));
check('avatar: attributeChangedCallback', avatar.includes('attributeChangedCallback'));
check('avatar: 粉紅耳窩 #ffc7d4', avatar.includes('#ffc7d4'));
check('avatar: 金黃燈泡 #ffd166', avatar.includes('#ffd166'));
check('avatar: 純向量 SVG（無外部圖檔）', !/\.png|\.jpg|\.webp|\.gif/i.test(avatar));
check('avatar: prefers-reduced-motion 無障礙', avatar.includes('prefers-reduced-motion'));

/* ---------- 2) 課程頁契約 ---------- */
check('lesson: 載入 audio_manager.js（Edge-TTS 曉臻管線）', html.includes('js/audio_manager.js'));
check('lesson: 載入 mimi_rabbit_avatar.js', html.includes('mimi_rabbit_avatar.js'));
const amPath = path.join(ROOT, 'app/js/audio_manager.js');
check('lesson: audio_manager.js 實體存在', fs.existsSync(amPath));
check('lesson: AudioManager TTS 帶 zh-TW-HsiaoChenNeural', fs.readFileSync(amPath, 'utf8').includes('zh-TW-HsiaoChenNeural'));
check('lesson: <mimi-rabbit> 元素', html.includes('<mimi-rabbit'));

/* 75 秒五幕分鏡 */
const T_KEYWORDS = [
  [0, '哈囉！我是咪咪'],
  [10, '平分成了 4 塊'],
  [25, '分母'],
  [45, '四分之二'],
  [60, '口訣']
];
T_KEYWORDS.forEach(function (k) {
  check(`lesson: 分鏡 ${k[0]}s 台詞「${k[1].slice(0, 6)}…」`, html.includes(`t: ${k[0]},`) && html.includes(k[1]));
});
check('lesson: 分母教學關鍵詞', html.includes('分母'));
check('lesson: 分子教學關鍵詞', html.includes('分子'));
check('lesson: 注音 ㄙˋ ㄈㄣ ㄓ ㄧ', html.includes('ㄙˋ ㄈㄣ ㄓ ㄧ'));
check('lesson: 口訣「分母在下看平分，分子在上看幾份」', html.includes('分母在下看平分，分子在上看幾份'));
check('lesson: CTA 換我動手做按鈕', html.includes('btn-cta'));

/* 幾何無偽造：360/4 = 90 度等分 */
check('lesson: 扇形步進 STEP = 2π/4（嚴格 90 度）', /STEP\s*=\s*Math\.PI\s*\*\s*2\s*\/\s*4/.test(html));
check('lesson: sectorPath 圓弧路徑', html.includes('sectorPath') && /A'?\s*\+\s*R/.test(html));
check('lesson: 4 個扇形迴圈 i < 4', /for\s*\(\s*var i = 0; i < 4;/.test(html));

/* 音畫同步：分母 bump → 分子 bump + 注音 */
check('lesson: 分母高亮 bump 相位', html.includes("sc.key === 's3' && subPhase === 'den'"));
check('lesson: 分子 + 注音相位（8 秒後）', html.includes("subPhase === 'num'") && html.includes('8000'));
check('lesson: 扇形金邊 flash-gold 同步', html.includes('flash-gold'));

/* 手機單屏 */
check('lesson: 390px viewport meta', html.includes('width=device-width, initial-scale=1.0'));
check('lesson: overflow-x 隱藏（零橫向溢出）', html.includes('overflow-x: hidden'));
check('lesson: 按鈕熱區 ≥ 44px', /min-height:\s*44px/.test(html));

/* 互動真實性（軍規：無互動死圖） */
const listeners = (html.match(/addEventListener\(/g) || []).length;
check('lesson: 互動事件監聽 ≥ 8', listeners >= 8, `僅 ${listeners} 個`);
check('lesson: 自由探究點扇形吃派監聽', /freeSvg\.addEventListener\('click'/.test(html));

/* 禁用外部框架（純前端離線軍規七） */
check('lesson: 禁 Three.js', !/three\.js/i.test(html));
check('lesson: 禁 React/Vue CDN', !/react|vue(\.min)?\.js/i.test(html));

/* ---------- 3) 總結 ---------- */
console.log(fail === 0 ? 'ALL PASS — G3-N-3-9 咪咪草莓派三件套靜態契約全綠' : `FAILED: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
