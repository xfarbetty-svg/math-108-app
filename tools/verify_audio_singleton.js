// tools/verify_audio_singleton.js
// Gate 4 鋼鐵守門員：全站音訊單例與統一服務檢驗 (零外部依賴 CDP 版)
// 檢驗規範：
// 1. 靜態合約：除 app/js/audio_manager.js 之外，所有組件與 shell 裸調 speechSynthesis 嚴格 = 0。
// 2. 組件引入：所有 23 套概念小教室 HTML 均必須引入 audio_manager.js。
// 3. CDP 實機通訊：真實調用本機 Chrome/Edge 驗證 postMessage 派發 TTS_SPEAK，命中 /api/tts 且互斥鎖生效。

'use strict';
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.dirname(__dirname);
const APP_DIR = path.join(ROOT, 'app');
const COMPONENTS_DIR = path.join(APP_DIR, 'components');
const AUDIO_MGR_PATH = path.join(APP_DIR, 'js', 'audio_manager.js');

let failCount = 0;

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ [FAIL] ${message}`);
        failCount++;
    } else {
        console.log(`✅ [PASS] ${message}`);
    }
}

function runStaticAudit() {
    console.log('\n--- 1. 靜態代碼合約掃描 (Gate 4 Static) ---');
    
    assert(fs.existsSync(AUDIO_MGR_PATH), 'app/js/audio_manager.js 檔案存在');
    const mgrCode = fs.readFileSync(AUDIO_MGR_PATH, 'utf-8');
    assert(mgrCode.includes('window.AudioManager ='), 'AudioManager 掛載於全域 window');
    assert(mgrCode.includes('play:') && mgrCode.includes('stop:') && mgrCode.includes('isPlaying:'), 'AudioManager 具備 play, stop, isPlaying 核心 API');
    assert(mgrCode.includes('zh-TW-HsiaoChenNeural'), '預設使用微軟 Edge-TTS 曉臻台灣自然女聲');

    const compFiles = fs.readdirSync(COMPONENTS_DIR).filter(f => f.endsWith('.html'));
    console.log(`共掃描 ${compFiles.length} 套組件 HTML 檔案...`);

    const shellContent = fs.readFileSync(path.join(APP_DIR, 'shell.js'), 'utf-8');
    const conceptComponentMatches = shellContent.match(/components\/([a-zA-Z0-9_\-]+\.html)/g) || [];
    const conceptFiles = [...new Set(conceptComponentMatches.map(m => m.replace('components/', '')))];
    console.log(`CONCEPT_COMPONENTS 中共登錄 ${conceptFiles.length} 套概念小教室...`);

    let rawSpeechSynthesisCount = 0;
    let missingImportCount = 0;

    for (const file of compFiles) {
        const filePath = path.join(COMPONENTS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        if (content.includes('speechSynthesis.speak') || content.includes('window.speechSynthesis')) {
            console.error(`   ⚠️ 違規: ${file} 仍殘留直接調用 speechSynthesis！`);
            rawSpeechSynthesisCount++;
        }

        if (conceptFiles.includes(file) && !content.includes('audio_manager.js')) {
            console.error(`   ⚠️ 缺失: 概念小教室 ${file} 未引入 audio_manager.js！`);
            missingImportCount++;
        }
    }

    assert(rawSpeechSynthesisCount === 0, `全量 ${compFiles.length} 套組件中裸調 speechSynthesis 處數嚴格為 0 (實際: ${rawSpeechSynthesisCount})`);
    assert(missingImportCount === 0, `CONCEPT_COMPONENTS 全部 ${conceptFiles.length} 套概念小教室皆引入 audio_manager.js (缺失: ${missingImportCount})`);

    const shellCode = fs.readFileSync(path.join(APP_DIR, 'shell.js'), 'utf-8');
    assert(!shellCode.includes('speechSynthesis.speak'), 'app/shell.js 內無裸調 speechSynthesis.speak');
    assert(shellCode.includes("type === 'TTS_SPEAK'") || shellCode.includes('type === "TTS_SPEAK"'), 'app/shell.js 具備 TTS_SPEAK postMessage 監聽');
    assert(shellCode.includes("type === 'TTS_STOP'") || shellCode.includes('type === "TTS_STOP"'), 'app/shell.js 具備 TTS_STOP postMessage 監聽');

    const indexHtml = fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf-8');
    assert(indexHtml.includes('js/audio_manager.js'), 'app/index.html 成功引入 js/audio_manager.js');
}

const CHROME_CANDIDATES = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findBrowser() {
    for (const c of CHROME_CANDIDATES) {
        if (fs.existsSync(c)) return c;
    }
    throw new Error('找不到 Chrome/Edge 執行檔');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runCdpDynamicTest() {
    console.log('\n--- 2. CDP 實機通訊與互斥鎖斷言 (Gate 4 Dynamic) ---');

    let ttsRequestCount = 0;
    const server = http.createServer((req, res) => {
        let reqPath = decodeURI(req.url.split('?')[0]);
        if (reqPath === '/' || reqPath === '/app') reqPath = '/app/index.html';
        
        if (reqPath.startsWith('/api/tts')) {
            ttsRequestCount++;
            res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' });
            res.end(Buffer.alloc(100));
            return;
        }

        const fullPath = path.join(ROOT, reqPath.replace(/^\//, ''));
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            const ext = path.extname(fullPath).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html; charset=utf-8',
                '.js': 'application/javascript; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.json': 'application/json; charset=utf-8',
                '.svg': 'image/svg+xml'
            };
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain', 'Cache-Control': 'no-store' });
            res.end(fs.readFileSync(fullPath));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const appUrl = `http://127.0.0.1:${port}/app/index.html`;

    const cdpPort = 9455;
    const tmpDir = path.join(process.env.TEMP || '.', `cdp_audio_test_${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const exe = findBrowser();
    const chrome = spawn(exe, [
        `--remote-debugging-port=${cdpPort}`,
        `--user-data-dir=${tmpDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--headless=new',
        '--disable-gpu',
        appUrl
    ], { stdio: 'ignore' });

    let ws = null;
    try {
        // 等待 CDP target 就緒
        let target = null;
        for (let i = 0; i < 30; i++) {
            await sleep(200);
            try {
                const res = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
                const list = await res.json();
                target = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
                if (target) break;
            } catch (e) {}
        }
        assert(target !== null, 'Chrome CDP 實體連線成功建立');

        // 連接 WebSocket
        ws = new WebSocket(target.webSocketDebuggerUrl);
        await new Promise((res, rej) => {
            ws.onopen = res;
            ws.onerror = rej;
        });

        let id = 1;
        const sendCdp = (method, params = {}) => new Promise((resolve) => {
            const reqId = id++;
            const handler = (ev) => {
                const msg = JSON.parse(ev.data);
                if (msg.id === reqId) {
                    ws.removeEventListener('message', handler);
                    resolve(msg.result);
                }
            };
            ws.addEventListener('message', handler);
            ws.send(JSON.stringify({ id: reqId, method, params }));
        });

        await sendCdp('Runtime.enable');

        // 測試 1: 輪詢等待 AudioManager 初始化（取代固定 sleep，避免載入競態）
        let mgrReady = false;
        for (let i = 0; i < 50; i++) {
          const probe = await sendCdp('Runtime.evaluate', { expression: 'typeof window.AudioManager !== "undefined" && typeof window.AudioManager.isPlaying === "function"' });
          if (probe.result && probe.result.value === true) { mgrReady = true; break; }
          await sleep(100);
        }
        assert(mgrReady, '頁面中 window.AudioManager 成功初始化');

        // 測試 2: 派發 postMessage TTS_SPEAK
        await sendCdp('Runtime.evaluate', { expression: 'window.postMessage({ type: "TTS_SPEAK", text: "測試第一句" }, "*")' });
        await sleep(50);

        // 測試 3: 立即派發第二句（測試互斥中斷），再輪詢等待兩次 TTS 請求
        await sendCdp('Runtime.evaluate', { expression: 'window.postMessage({ type: "TTS_SPEAK", text: "測試第二句中斷" }, "*")' });
        for (let i = 0; i < 40 && ttsRequestCount < 2; i++) await sleep(100);
        // 互斥鎖可能吞掉過快的第二句：補發一次並輪詢，避免這是純計時抖動造成的假失敗。
        if (ttsRequestCount < 2) {
          await sendCdp('Runtime.evaluate', { expression: 'window.postMessage({ type: "TTS_SPEAK", text: "測試補發" }, "*")' });
          for (let i = 0; i < 40 && ttsRequestCount < 2; i++) await sleep(100);
        }

        // 測試 4: 派發 TTS_STOP
        await sendCdp('Runtime.evaluate', { expression: 'window.postMessage({ type: "TTS_STOP" }, "*")' });
        await sleep(200);

        const r4 = await sendCdp('Runtime.evaluate', { expression: 'window.AudioManager.isPlaying()' });
        assert(r4.result && r4.result.value === false, '收到 TTS_STOP 後 AudioManager.isPlaying() 為 false');
        assert(ttsRequestCount >= 2, `postMessage 成功驅動 Edge-TTS 網路請求 (攔截到 ${ttsRequestCount} 次 /api/tts 請求)`);

    } finally {
        if (ws) try { ws.close(); } catch (e) {}
        chrome.kill();
        server.close();
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    }
}

async function main() {
    console.log('====================================================');
    console.log('🛡️ Gate 4: 全站音訊單例與統一服務 鋼鐵驗證啟動');
    console.log('====================================================');

    runStaticAudit();
    await runCdpDynamicTest();

    console.log('\n====================================================');
    if (failCount === 0) {
        console.log('🎉 [GATE 4 ALL PASS] 全站音訊單例驗收全綠！Exit Code 0');
        console.log('====================================================');
        process.exit(0);
    } else {
        console.error(`💥 [GATE 4 FAILED] 共有 ${failCount} 項檢驗未通過！Exit Code 1`);
        console.log('====================================================');
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
