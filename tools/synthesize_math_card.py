# -*- coding: utf-8 -*-
"""
028-1 國小數學 APP: 情境題視覺化背景合成器 (tools/synthesize_math_card.py)
跨專案調度 034 純向量教具與 035 本地顯卡 FP8 高清插圖，為數學題庫注入生活化情境。

守門規範：
- 退出碼只認 Exit Code 0，底層必須 sys.exit(0 if ok else 1)
- 禁 except: pass
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
PROJECT_028_DIR = TOOLS_DIR.parent
PROJECT_034_DIR = PROJECT_028_DIR.parent / "034_anatomy_interactive_svg"
SYNTHESIZE_034 = PROJECT_034_DIR / "bridge" / "synthesize_scene.py"


def main():
    parser = argparse.ArgumentParser(description="028-1 Math Card Background Synthesizer")
    parser.add_argument("--title", type=str, required=True, help="題目情境標題")
    parser.add_argument("--stem", type=str, required=True, help="數學題幹描述")
    parser.add_argument("--tool", type=str, choices=["lever-balance", "iso-block", "math-sketch", "story-card"], default="lever-balance", help="034 向量教具元件")
    parser.add_argument("--tool-data", type=str, default="{}", help="教具屬性 JSON 字串")
    parser.add_argument("--bg-prompt", type=str, required=True, help="035 底圖英文提示詞")
    parser.add_argument("--options", type=str, default="[]", help="選項清單 JSON 字串")
    parser.add_argument("--out-name", type=str, default="card_preview", help="輸出檔案名稱 (不含副檔名)")
    parser.add_argument("--render-png", action="store_true", help="是否同時產出 PNG 截圖")

    args = parser.parse_args()

    if not SYNTHESIZE_034.exists():
        print(f"Error: 034 合成橋接器未找到: {SYNTHESIZE_034}", file=sys.stderr)
        sys.exit(1)

    out_scenes_dir = PROJECT_028_DIR / "app" / "scenes"
    out_scenes_dir.mkdir(parents=True, exist_ok=True)
    out_html = out_scenes_dir / f"{args.out_name}.html"
    out_png = out_scenes_dir / f"{args.out_name}.png"

    cmd = [
        sys.executable,
        str(SYNTHESIZE_034),
        "--title", args.title,
        "--stem", args.stem,
        "--tool", args.tool,
        "--tool-data", args.tool_data,
        "--bg-prompt", args.bg_prompt,
        "--options", args.options,
        "--out-html", str(out_html),
    ]
    if args.render_png:
        cmd.extend(["--render-png", str(out_png)])

    print(f"[028-1] 正在調用 034/035 生成情境題卡: {args.title}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error: 合成失敗 (Exit {res.returncode}):\n{res.stderr}\n{res.stdout}", file=sys.stderr)
        sys.exit(1)

    print(f"[028-1] 成功產出情境題卡: {out_html}")
    if args.render_png and out_png.exists():
        print(f"[028-1] 成功產出高清截圖: {out_png}")

    sys.exit(0)


if __name__ == "__main__":
    main()
