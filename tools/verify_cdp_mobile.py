# -*- coding: utf-8 -*-
"""tools/verify_cdp_mobile.py
使用 Playwright 模擬 390x844 手機實機畫面，檢驗 One-Screen 容納程度與小鳥視覺。
"""
import os
import sys
import time
from playwright.sync_api import sync_playwright

def main():
    os.makedirs("reports/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15"
        )
        page = context.new_page()
        print("[CDP] 前往 http://127.0.0.1:3001/app/index.html ...")
        page.goto("http://127.0.0.1:3001/app/index.html", wait_until="networkidle")
        time.sleep(1)

        # 點擊 N-1-2 單元
        print("[CDP] 點擊 G1-N-1-2 加法與減法單元卡 ...")
        card = page.locator('.unit-card.ready[data-code="N-1-2"]')
        if card.count() == 0:
            print("[ERROR] 找不到 N-1-2 單元卡！")
            sys.exit(1)
        card.click()
        time.sleep(1.5)

        # 切換到第 2 題（樹上的小鳥）
        print("[CDP] 點擊『下一題 →』切換到第 2 題（樹上的小鳥）...")
        next_btn = page.locator("#btnNext")
        next_btn.click()
        time.sleep(2)

        # 檢查 iframe 內部小鳥教具
        iframe = page.frame_locator("#stageFrame")
        fly_btn = iframe.locator("#flyBtn")
        if fly_btn.count() == 0:
            print("[ERROR] iframe 內未找到 flyBtn！")
            sys.exit(1)

        print("[CDP] 模擬點擊『🕊 再飛來 3 隻！』...")
        fly_btn.click()
        time.sleep(0.5)
        fly_btn.click()
        time.sleep(0.5)
        fly_btn.click()
        time.sleep(1)

        # 測量總體高度與可見性
        metrics = page.evaluate("""() => {
            const frame = document.getElementById('stageFrame');
            const doc = frame.contentDocument;
            const checkBtn = doc ? doc.querySelector('.check-btn') : null;
            const stageNav = document.querySelector('.stage-nav');
            
            const winH = window.innerHeight;
            const bodyScrollH = document.body.scrollHeight;
            const stageNavRect = stageNav ? stageNav.getBoundingClientRect() : null;
            
            return {
                windowHeight: winH,
                bodyScrollHeight: bodyScrollH,
                frameHeight: frame.offsetHeight,
                stageNavBottom: stageNavRect ? stageNavRect.bottom : null,
                isOneScreen: (stageNavRect && stageNavRect.bottom <= winH + 20)
            };
        }""")

        print(f"[CDP 測量數值]：")
        print(f" - 手機可視高度: {metrics['windowHeight']}px")
        print(f" - 頁面捲動總高度: {metrics['bodyScrollHeight']}px")
        print(f" - 教具 iframe 高度: {metrics['frameHeight']}px")
        print(f" - 底部導航欄底部位置: {metrics['stageNavBottom']}px")
        print(f" - 是否滿足單屏容納 (One-Screen): {metrics['isOneScreen']}")

        # 截取手機實機畫面（整屏 390x844）
        screenshot_path = "reports/screenshots/mobile_390_birds_q2.png"
        page.screenshot(path=screenshot_path, full_page=False)
        print(f"[CDP] 手機實機畫面已截圖保存至: {screenshot_path}")

        # 另外單獨截取 iframe 內部的小鳥向量圖樣特寫
        iframe_screenshot_path = "reports/screenshots/birds_vector_detail.png"
        iframe_stage = iframe.locator("#treeStage")
        if iframe_stage.count() > 0:
            iframe_stage.screenshot(path=iframe_screenshot_path)
            print(f"[CDP] 小鳥向量特寫已截圖保存至: {iframe_screenshot_path}")

        browser.close()
        print("[SUCCESS] CDP 驗收完成！")

if __name__ == "__main__":
    main()
