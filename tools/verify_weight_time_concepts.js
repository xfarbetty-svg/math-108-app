// tools/verify_weight_time_concepts.js
const { chromium } = require('playwright');
const path = require('path');

async function testComponent(browser, fileName, title) {
    const page = await browser.newPage({
        viewport: { width: 390, height: 844 }
    });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    const fileUrl = 'file://' + path.resolve(__dirname, '..', 'app', 'components', fileName).replace(/\\/g, '/');
    console.log(`[CDP 驗測] 載入: ${fileName} ...`);
    await page.goto(fileUrl, { waitUntil: 'load' });

    // 1. 測量高度
    const appBox = await page.evaluate(() => {
        const el = document.getElementById('app') || document.body;
        return {
            width: el.offsetWidth,
            height: el.offsetHeight,
            scrollWidth: el.scrollWidth,
            scrollHeight: el.scrollHeight
        };
    });

    console.log(`  - 尺寸測量: width=${appBox.width}px, height=${appBox.height}px (scroll: ${appBox.scrollWidth}x${appBox.scrollHeight})`);
    if (appBox.height > 425) {
        throw new Error(`高度超標: ${appBox.height}px > 425px`);
    }
    if (appBox.scrollWidth > 395) {
        throw new Error(`水平溢出: ${appBox.scrollWidth}px > 395px`);
    }

    // 2. 測試 Act 切換與按鈕交互
    const navItems = await page.$$('.nav-item');
    console.log(`  - 檢測到 ${navItems.length} 個 Act 導航標籤`);
    if (navItems.length !== 4) {
        throw new Error(`Act 標籤數不符: 預期 4 個，實際 ${navItems.length} 個`);
    }

    for (let i = 0; i < navItems.length; i++) {
        await navItems[i].click();
        await page.waitForTimeout(150);
    }

    // 3. 測試特定動作
    if (fileName === 'weight_concept_lab.html') {
        // 切換到 Act 2 點擊放蘋果
        await navItems[1].click();
        const appleBtn = await page.$('button:has-text("蘋果")');
        if (appleBtn) await appleBtn.click();
        await page.waitForTimeout(200);
        const readout = await page.$eval('#display-val', el => el.innerText);
        console.log(`  - Act 2 秤重讀數測試: ${readout}`);
        if (!readout.includes('150')) throw new Error('蘋果 150g 讀數未正確顯示');
    } else if (fileName === 'time_concept_lab.html') {
        // 切換到 Act 2 點擊 +15 分
        await navItems[1].click();
        const plus15Btn = await page.$('button:has-text("+15")');
        if (plus15Btn) await plus15Btn.click();
        await page.waitForTimeout(200);
        const timeReadout = await page.$eval('#digital-display', el => el.innerText);
        console.log(`  - Act 2 時間連動讀數: ${timeReadout}`);
        if (!timeReadout.includes(':15:')) throw new Error('時間連動未正確加 15 分');
    }

    if (errors.length > 0) {
        throw new Error(`Console 報錯: ${errors.join('; ')}`);
    }

    console.log(`  ✓ ${title} CDP 驗收 ALL PASS!`);
    await page.close();
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    try {
        await testComponent(browser, 'weight_concept_lab.html', 'N-3-16 重量四幕式概念小教室');
        await testComponent(browser, 'time_concept_lab.html', 'N-3-17 時間四幕式概念小教室');
        console.log('\n🎉 ALL PASS! 雙單元物理操作概念小教室驗收 Exit Code 0!');
    } finally {
        await browser.close();
    }
}

main().catch(err => {
    console.error('❌ 驗收失敗:', err);
    process.exit(1);
});
