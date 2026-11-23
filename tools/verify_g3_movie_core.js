/**
 * tools/verify_g3_movie_core.js
 * G3 概念小教室「成片」共享門禁：巢狀插件原始碼／米米 PNG／字幕安全框／
 * MP4 1920x1080@30fps／AAC／AV 同步／-14 LUFS／抽幀自檢／shell.js 掛載。
 * 由 verify_n37_movie.js、verify_n38_movie.js 呼叫；也可直接帶參數執行。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

function fail(msg) { throw new Error('FAIL: ' + msg); }
function pass(msg) { console.log('PASS: ' + msg); }

function probe(file) {
  const out = execFileSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,duration',
    '-show_entries', 'format=duration,size',
    '-of', 'json', file,
  ], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const data = JSON.parse(out);
  const streams = data.streams || [];
  const v = streams.find((s) => s.codec_type === 'video');
  const a = streams.find((s) => s.codec_type === 'audio');
  if (!v || !a) fail('缺少-video-或-audio-串流');
  return {
    width: Number(v.width), height: Number(v.height),
    fps: v.r_frame_rate, videoCodec: v.codec_name, audioCodec: a.codec_name,
    vdur: Number(v.duration), adur: Number(a.duration),
    size: Number((data.format || {}).size || 0),
  };
}

function measureLufs(file) {
  const r = spawnSync('ffmpeg', [
    '-nostats', '-hide_banner', '-v', 'info', '-i', file,
    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json',
    '-f', 'null', '-',
  ], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (r.error || r.status !== 0) fail('ffmpeg loudnorm 執行失敗：' + (r.error || r.stderr));
  const out = String(r.stderr || '') + String(r.stdout || '');
  const blocks = out.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/g);
  if (!blocks || !blocks.length) fail('loudnorm 未回傳 input_i');
  const stats = JSON.parse(blocks[blocks.length - 1]);
  return Number(stats.input_i);
}

function verifyMovie(opts) {
  const { code, slug, mp4, title, keyframeMin = 4 } = opts;
  console.log('=== ' + code + ' 概念小教室成片門禁 ===');

  // 1. 插件原始碼：4 幕、指定姿勢、禁止 SVG 自繪角色
  const pluginPath = path.join(ROOT, 'tools', 'classroom_engine', 'units', slug + '.py');
  if (!fs.existsSync(pluginPath)) fail('插件不存在：' + pluginPath);
  const src = fs.readFileSync(pluginPath, 'utf8');
  if (!src.includes('"layout": "full_stage"')) fail('缺少 full_stage 全畫面走位');
  const scenes = new Set([...src.matchAll(/"scene":\s*(\d)/g)].map((m) => Number(m[1])));
  if (![0, 1, 2, 3].every((s) => scenes.has(s))) fail('四幕不完整，實際=' + [...scenes].join(','));
  ['pose": "wave"', 'pose": "point"', 'pose": "think"', 'pose": "cheer"'].forEach((p) => {
    if (!src.includes(p)) fail('缺少米米姿勢 ' + p);
  });
  if (/pose_\$\{m\.pose\}/.test(fs.readFileSync(path.join(ROOT, 'tools', 'classroom_engine', 'stage_template.html'), 'utf8')) === false) {
    fail('stage_template 未使用 app/assets/mimi_poses PNG');
  }
  if (/（[^）]*[×÷＝＋－][^）]*）/.test(src)) fail('三年級禁止混合算式括號');
  pass('插件四幕完整、使用 mimi_poses PNG、無混合算式括號');

  // 2. 字幕安全框：中心 y <= 960，底邊淨空 >= 76px
  const tpl = fs.readFileSync(path.join(ROOT, 'tools', 'classroom_engine', 'stage_template.html'), 'utf8');
  const subMatch = tpl.match(/id="subtitle-bar"\s+transform="translate\(960,\s*(\d+)\)"/);
  if (!subMatch || Number(subMatch[1]) > 960) fail('字幕中心 y 超過 960');
  const bgMatch = tpl.match(/id="subtitle-bg"[^>]*y="-(\d+)"[^>]*height="(\d+)"/);
  if (!bgMatch) fail('找不到字幕黑框尺寸');
  const bottom = Number(subMatch[1]) + Number(bgMatch[2]) - Number(bgMatch[1]);
  if (1080 - bottom < 76) fail('字幕底邊淨空不足 76px，實際 ' + (1080 - bottom));
  pass('字幕中心 y=' + subMatch[1] + '，底邊淨空 ' + (1080 - bottom) + 'px');

  // 3. 成片檔案與串流
  const moviePath = path.join(ROOT, 'app', 'assets', 'classroom_videos', mp4);
  if (!fs.existsSync(moviePath)) fail('成片不存在：' + mp4);
  const p = probe(moviePath);
  if (p.width !== 1920 || p.height !== 1080) fail('解析度非 1920x1080');
  if (p.fps !== '30/1') fail('幀率非 30fps，實際 ' + p.fps);
  if (p.audioCodec !== 'aac') fail('音訊非 AAC');
  if (Math.abs(p.vdur - p.adur) > 0.15) fail('AV 誤差過大 ' + Math.abs(p.vdur - p.adur));
  if (p.size > 25 * 1024 * 1024) fail('單檔超過 25 MiB');
  pass('成片 ' + p.width + 'x' + p.height + '@30fps / AAC / ' + p.vdur + 's / ' + (p.size / 1048576).toFixed(2) + ' MiB / AV差 ' + Math.abs(p.vdur - p.adur).toFixed(3) + 's');

  // 4. 響度 -14 LUFS
  const lufs = measureLufs(moviePath);
  if (!(lufs >= -14.8 && lufs <= -13.2)) fail('響度偏離 -14 LUFS，實際 ' + lufs);
  pass('響度 ' + lufs + ' LUFS（YouTube -14 標準）');

  // 5. 抽幀自檢（至少每幕一張）
  const kfDir = path.join(ROOT, '_scratch', 'classroom_' + slug.split('_')[0].replace(/-/g, ''), 'keyframes');
  if (!fs.existsSync(kfDir)) fail('抽幀目錄不存在：' + kfDir);
  const kfs = fs.readdirSync(kfDir).filter((f) => f.endsWith('.png'));
  const small = kfs.filter((f) => fs.statSync(path.join(kfDir, f)).size < 1024);
  if (kfs.length < keyframeMin || small.length) fail('抽幀不足或損壞：' + kfs.length + ' 張，壞檔 ' + small.length);
  pass('抽幀自檢 ' + kfs.length + ' 張（每幕至少一張，零損壞）');

  // 6. shell.js 掛載
  const shell = fs.readFileSync(path.join(ROOT, 'app', 'shell.js'), 'utf8');
  if (!shell.includes('"' + code + '": "assets/classroom_videos/' + mp4 + '"')) fail('shell.js 未掛載 ' + code);
  if (!shell.includes('"' + code + '": "' + title + '"')) fail('shell.js 缺少 ' + code + ' 標題');
  pass('shell.js 已掛載 ' + code + ' 並開放概念小教室按鈕');

  console.log('PASS: ' + code + ' 成片六道門禁全綠');
  return true;
}

module.exports = { verifyMovie };

if (require.main === module) {
  const arg = (name) => {
    const a = process.argv.find((x) => x.startsWith('--' + name + '='));
    return a ? a.slice(name.length + 3) : null;
  };
  try {
    verifyMovie({
      code: arg('code'), slug: arg('slug'), mp4: arg('mp4'),
      title: arg('title'), keyframeMin: Number(arg('min') || 4),
    });
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
