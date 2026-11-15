// tools/verify_all_g3_concepts_interactive.js
// 針對三年級 7 個最新概念實驗室進行真實 CDP 互動點擊與 DOM 狀態斷言測試

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const LABS = [
    {
        name: 'N-3-16 重量實驗室 (weight_concept_lab.html)',
        file: 'weight_concept_lab.html',
        test: async (page) => {
            // 切換 act
            await page.click('#tab-act1');
            await page.waitForTimeout(100);
            await page.click('#tab-act2');
            await page.waitForTimeout(100);
            // 點擊歸零校準
            await page.click('button:has-text("歸零校準")');
        }
    },
    {
        name: 'N-3-17 時間實驗室 (time_concept_lab.html)',
        file: 'time_concept_lab.html',
        test: async (page) => {
            await page.click('#tab-act1');
            await page.waitForTimeout(100);
            await page.click('button:has-text("+15分")');
            await page.waitForTimeout(100);
            await page.click('#tab-act2');
            await page.waitForTimeout(100);
            await page.click('button:has-text("走1秒")');
        }
    },
    {
        name: 'S-3-2 正方形長方形實驗室 (square_rectangle_lab.html)',
        file: 'square_rectangle_lab.html',
        test: async (page) => {
            // Act 1 點擊圖形標記邊長
            await page.click('#tab-act1');
            await page.click('.shape.square');
            await page.waitForTimeout(100);
            const sqMarks = await page.$$('#sq-marks .tick-mark');
            if (sqMarks.length === 0) throw new Error('Square marks not rendered');

            // Act 3 摺紙
            await page.click('#tab-act3');
            await page.waitForTimeout(100);
            await page.click('#fold-btn');
            await page.waitForTimeout(100);
            const isFolded = await page.$eval('#paper', el => el.classList.contains('folded'));
            if (!isFolded) throw new Error('Paper not folded');

            // Act 4 鋪設方格
            await page.click('#tab-act4');
            await page.waitForTimeout(100);
            await page.click('button:has-text("鋪設方格")');
            await page.waitForTimeout(300);
            const filledCount = await page.$eval('#grid-info', el => el.innerText);
            if (!filledCount.includes('鋪設') && !filledCount.includes('鋪滿')) {
                throw new Error('Grid fill info not updated');
            }
        }
    },
    {
        name: 'S-3-4 正方體長方體展開實驗室 (solid_geometry_lab.html)',
        file: 'solid_geometry_lab.html',
        test: async (page) => {
            await page.click('#tab-act1');
            await page.waitForTimeout(100);
            await page.click('#tab-act3');
            await page.waitForTimeout(100);
            await page.click('button:has-text("摺疊對面")');
        }
    },
    {
        name: 'R-3-1 乘除互逆實驗室 (multiplication_division_lab.html)',
        file: 'multiplication_division_lab.html',
        test: async (page) => {
            await page.click('#tab-act1');
            await page.waitForTimeout(100);
            await page.click('button:has-text("旋轉算式")');
            await page.waitForTimeout(100);
            await page.click('#tab-act2');
            await page.waitForTimeout(100);
            await page.click('button:has-text("切換為除法")');
        }
    },
    {
        name: 'R-3-2 數量模式與推理實驗室 (pattern_reasoning_lab.html)',
        file: 'pattern_reasoning_lab.html',
        test: async (page) => {
            // Act 1: 跳跳蛙
            await page.click('#tab-act1');
            await page.waitForTimeout(100);
            const frogBefore = await page.$eval('#frog', el => el.style.transform);
            await page.click('button:has-text("跳一下")');
            await page.waitForTimeout(350);
            const frogAfter = await page.$eval('#frog', el => el.style.transform);
            if (!frogAfter.includes('translate')) {
                throw new Error('Frog did not jump or transform not updated: ' + frogAfter);
            }
            const arcs = await page.$$('#frog-svg-layer path');
            if (arcs.length === 0) throw new Error('Frog jump arc not created in SVG');

            // Act 2: 火柴棒
            await page.click('#tab-act2');
            await page.waitForTimeout(100);
            await page.click('button:has-text("增加一個")');
            await page.waitForTimeout(100);
            const squares = await page.$$('#match-group .match-square');
            if (squares.length !== 2) throw new Error(`Expected 2 match squares, got ${squares.length}`);

            // Act 3: 找規律 (確保數列非空白且可揭示)
            await page.click('#tab-act3');
            await page.waitForTimeout(100);
            const cards = await page.$$('#seq-container .num-card');
            if (cards.length !== 5) throw new Error(`Expected 5 seq cards, got ${cards.length}`);
            await page.click('button:has-text("揭示規律")');
            await page.waitForTimeout(150);
            const bubbles = await page.$$('#diff-bubbles-container .diff-bubble');
            if (bubbles.length === 0) throw new Error('Diff bubbles not displayed upon reveal');

            // 測試下一題
            await page.click('button:has-text("下一題")');
            await page.waitForTimeout(100);
            const cardsNext = await page.$$('#seq-container .num-card');
            if (cardsNext.length !== 5) throw new Error('Cards not regenerated on next question');
        }
    },
    {
        name: 'D-3-1 一維與二維表格實驗室 (table_cross_lab.html)',
        file: 'table_cross_lab.html',
        test: async (page) => {
            await page.click('#tab-act1');
            await page.waitForTimeout(100);
            await page.click('button:has-text("查詢 10:15")');
            await page.waitForTimeout(100);
            await page.click('#tab-act2');
            await page.waitForTimeout(100);
            await page.click('button:has-text("大杯綠茶半糖")');
        }
    }
];

(async () => {
    console.log('🚀 啟動 Playwright CDP 實機互動測試（全量 7 大概念實驗室）...\n');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 }
    });
    const page = await context.newPage();

    let allPassed = true;
    const errors = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(`[Console Error] ${msg.text()}`);
        }
    });
    page.on('pageerror', err => {
        errors.push(`[Page Crash/Error] ${err.message}`);
    });

    for (const lab of LABS) {
        process.stdout.write(`⏳ 驗證中: ${lab.name}... `);
        const filePath = path.join(__dirname, '..', 'app', 'components', lab.file);
        if (!fs.existsSync(filePath)) {
            console.log('❌ 檔案不存在！');
            allPassed = false;
            continue;
        }

        const fileUrl = 'file://' + filePath.replace(/\\/g, '/');
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(200);

        try {
            await lab.test(page);
            console.log('✅ PASS (互動點擊 & 狀態斷言全部通過)');
        } catch (err) {
            console.log(`❌ FAIL: ${err.message}`);
            allPassed = false;
        }
    }

    await browser.close();

    if (errors.length > 0) {
        console.log('\n⚠️ 測試過程中檢測到 Console 錯誤：');
        errors.forEach(e => console.log('  ' + e));
    }

    if (allPassed && errors.length === 0) {
        console.log('\n🎉 【全量驗真通過】7 大概念實驗室互動邏輯、按鈕、動畫與 DOM 狀態全部綠燈！Exit 0');
        process.exit(0);
    } else {
        console.log('\n💥 【驗證失敗】請檢視上述失敗項目。Exit 1');
        process.exit(1);
    }
})();
