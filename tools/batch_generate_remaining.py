# -*- coding: utf-8 -*-
"""
tools/batch_generate_remaining.py
調用通道三 (035 Key Pool 8把 Key 輪詢閘道) 依序原子生成 G2 最後四大單元微教具組件。
"""

import os
import sys
import time
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
ROOT_DIR = TOOLS_DIR.parent
DISPATCH_WORKER = TOOLS_DIR / "dispatch_worker.py"
SPEC_FILE = ROOT_DIR / "docs" / "tasks" / "SPEC_G2_FINAL_4_UNITS_R0.md"

sys.path.insert(0, str(TOOLS_DIR))
from dispatch_worker import run_channel3_gemini_pool

ITEMS = [
    {
        "target": "app/components/g2_r22_q05.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-R-2-2 Q05 規格，實作 app/components/g2_r22_q05.html。計算 53+27+14 最佳分步與括號先算卡片。純 SVG，日系繪本風，單屏緊湊 <=420px，高對比配色。"
    },
    {
        "target": "app/components/g2_r23_q06.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-R-2-3 Q06 規格，實作 app/components/g2_r23_q06.html。蘋果陣列 90 度視角旋轉（5x2 與 2x5 視角切換，總數10不變）。純 SVG，單屏緊湊 <=420px，鮮紅蘋果與綠葉。"
    },
    {
        "target": "app/components/g2_r23_q07.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-R-2-3 Q07 規格，實作 app/components/g2_r23_q07.html。九九乘法交換表對角線高亮（8x4 與 4x8 對稱視覺）。純 SVG，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_r23_q08.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-R-2-3 Q08 規格，實作 app/components/g2_r23_q08.html。砝碼天平（左盤3個6kg砝碼，右盤6個3kg砝碼，兩端各18kg，天平必須 100% 水平平衡，指針指向正中央0刻度）。純 SVG，日系繪本風，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_r23_q09.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-R-2-3 Q09 規格，實作 app/components/g2_r23_q09.html。巧克力包裝盒矩陣比對（3盒每盒9顆 vs 9盒每盒3顆，總數27）。純 SVG，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_r23_q10.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-R-2-3 Q10 規格，實作 app/components/g2_r23_q10.html。排隊倍數陣列（6的7倍與7的6倍結果相同 42）。純 SVG，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_r24_q01.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-R-2-4 Q01 規格，實作 app/components/g2_r24_q01.html。加減互逆線段圖（Tape Diagram，全長72金色，分為45藍與27綠，點擊移走45留下27）。純 SVG，基準線對齊，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_r24_q02.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-R-2-4 Q02 規格，實作 app/components/g2_r24_q02.html。求被減數未知數（□ - 18 = 36，量尺逆向延伸推算54）。純 SVG，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_r24_q03.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-R-2-4 Q03 規格，實作 app/components/g2_r24_q03.html。減法驗算天平（80 - 23 = 57，用 57 + 23 驗算，天平水平平衡）。純 SVG，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_r24_q04.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-R-2-4 Q04 規格，實作 app/components/g2_r24_q04.html。存錢筒零用錢（□ + 50 = 120，動態推算70）。純 SVG，日系繪本風，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_r24_q05.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-R-2-4 Q05 規格，實作 app/components/g2_r24_q05.html。代數差距線段（A + 15 = B，線段差距 B - A = 15 高亮展示）。純 SVG，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_d21_q06.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-D-2-1 Q06 規格，實作 app/components/g2_d21_q06.html。幾何圖形分類整理（紅圓形、藍三角形、綠方形，點擊分類整齊切齊左側欄位）。純 SVG，高對比三原色，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_d21_q07.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-D-2-1 Q07 規格，實作 app/components/g2_d21_q07.html。正字記號計數器（點擊筆劃劃「正正下」，對應數字13人）。純 SVG，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_d21_q08.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-D-2-1 Q08 規格，實作 app/components/g2_d21_q08.html。水果受歡迎直條圖（西瓜12、芭樂8、芒果15、香蕉6，0刻度粗黑實線基準線，所有直條底部100%切齊0刻度底座）。純 SVG，高對比色彩，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_d21_q09.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-D-2-1 Q09 規格，實作 app/components/g2_d21_q09.html。直條圖差距比對（芒果15 vs 芭樂8，兩直條高差引出虛線標註差7人）。純 SVG，基準線切齊，單屏緊湊 <=420px。"
    },
    {
        "target": "app/components/g2_d21_q10.html",
        "prompt": "請依據 SPEC_G2_FINAL_4_UNITS_R0.md 中 G2-D-2-1 Q10 規格，實作 app/components/g2_d21_q10.html。二維交叉分類統計表（年級x項目，二年級與跑步交叉儲存格高亮）。純 SVG/HTML，單屏緊湊 <=420px。"
    }
]

def main():
    print(f"==================================================")
    print(f"🚀 [Batch Generator] 啟動通道三 (035 Key Pool) 自動生成")
    print(f"📦 待生成微教具總數: {len(ITEMS)} 套")
    print(f"==================================================")

    for idx, item in enumerate(ITEMS, 1):
        target_path = ROOT_DIR / item["target"]
        if target_path.exists() and target_path.stat().st_size > 2000:
            print(f"[{idx}/{len(ITEMS)}] ⏩ 已存在且完整，跳過: {item['target']}")
            continue

        print(f"[{idx}/{len(ITEMS)}] ⏳ 正在生成: {item['target']} ...")
        t0 = time.time()
        ret = run_channel3_gemini_pool(prompt=item["prompt"], task_file=str(SPEC_FILE))
        elapsed = time.time() - t0

        if ret == 0 and target_path.exists():
            print(f"[{idx}/{len(ITEMS)}] ✅ 成功產生: {item['target']} ({target_path.stat().st_size} bytes, 耗時 {elapsed:.2f}s)")
        else:
            print(f"[{idx}/{len(ITEMS)}] ❌ 產生失敗: {item['target']}", file=sys.stderr)
            sys.exit(1)
        
        time.sleep(1)

    print(f"==================================================")
    print(f"🎉 [Batch Generator SUCCESS] 16 套微教具全部生成完畢！")
    print(f"==================================================")

if __name__ == "__main__":
    main()
