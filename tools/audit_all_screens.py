# -*- coding: utf-8 -*-
from playwright.sync_api import sync_playwright

tests = [
    ("N-1-1", "Q01 魚缸數數", "components/fish_tank_demo.html"),
    ("N-1-1", "Q02 桌上的鉛筆", "components/pencil_desk_demo.html"),
    ("N-1-1", "Q03 派對帽與蛋糕", "components/party_pairing_demo.html"),
    ("N-1-1", "Q04 水果排一列", "components/fruit_line_demo.html"),
    ("N-1-2", "Q01 盤子裡的披薩", "components/pizza_combine_demo.html"),
    ("N-1-2", "Q02 樹上的小鳥", "components/birds_on_tree_demo.html"),
    ("N-1-2", "Q03 操場比一比", "components/playground_compare_demo.html"),
    ("N-1-2", "Q04 0片餅乾", "components/cookie_zero_demo.html"),
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844})
    print("| 單元 | 題目 | 教具組件檔案 | 內部高度 | 估算外層總高度 | 是否單屏免滑動 (<844px) |")
    print("|---|---|---|---|---|---|")
    for u, q, comp in tests:
        url = f"http://127.0.0.1:3001/app/{comp}"
        page.goto(url)
        h = page.evaluate("""() => {
            const c = document.querySelector('.container') || document.body;
            return Math.ceil(c.getBoundingClientRect().height || c.scrollHeight);
        }""")
        est_outer = h + 92  # 36px stage-head + 46px stage-nav + padding
        ok = est_outer <= 844
        status = "✅ 是 (免滑動)" if ok else f"⚠️ 否 (爆屏 +{est_outer-844}px)"
        print(f"| {u} | {q} | `{comp.split('/')[-1]}` | {h}px | ~{est_outer}px | {status} |")
    browser.close()
