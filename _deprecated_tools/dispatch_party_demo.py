# -*- coding: utf-8 -*-
import subprocess
import time
import os
import sys

PROMPT = """你現在是國小數學 APP 的前線施工工兵（通道一：本地 OpenCode CLI）。
請在工作目錄下的 `app/components/` 目錄中，建立一個純前端單一離線可互動 HTML 檔案：`app/components/party_pairing_demo.html`。

【任務來源】：高雄市鳳山區忠孝國小 114 學年度第一學期一年級期中考 真實試卷第三大題第 1 題（看圖圈圈看 · 派對配對題）。

【真實插圖與物品精確數據（經通道三視覺檢驗 100% 精確）】：
畫面為一個溫馨可愛的生日派對情境（純 SVG / CSS 繪製）：
1. 3 位可愛的小朋友（女孩、男孩、女孩）坐在派對桌前。
2. 5 頂色彩繽紛的派對帽（尖角錐形帽，桌上有 3 頂、旁邊有 2 頂）。
3. 3 塊切片三角蛋糕。
4. 3 顆紅櫻桃。
5. 3 杯柳橙果汁（透明杯裝橘色果汁，插著條紋吸管）。

【原卷 4 道連續小題】：
(1) 1人戴1頂派對帽，派對帽夠不夠？
    - 选项：【 夠 】 【 不夠 】
    - 解析：人有 3 位，帽子有 5 頂（5 > 3），所以派對帽【 夠 】！
(2) 1塊蛋糕上放1顆櫻桃，櫻桃夠不夠？
    - 选项：【 夠 】 【 不夠 】
    - 解析：蛋糕 3 塊，櫻桃 3 顆（3 = 3，剛好一人一顆），所以櫻桃【 夠 】！
(3) 果汁和櫻桃，哪一種比較少？
    - 选项：【 果汁 】 【 櫻桃 】（若數量相同，提示一樣多；或依試卷設計連線一對一對應）
(4) 果汁和蛋糕，哪一種比較多？
    - 选项：【 果汁 】 【 蛋糕 】

【互動與視覺呈現核心要求（靈魂在於具象與一對一配對，嚴禁抽象死板紅點！）】：
1. 視覺：
   - 頂部模擬溫暖童趣的慶生派對房間（純 SVG / CSS 繪製）。
   - 小朋友、蛋糕、果汁、派對帽皆具象、圓潤可愛、色彩飽滿。
2. 互動：
   - 包含分步驟/關卡（第 1 題到第 4 題）。
   - 第 (1) 題：學童可以點擊派對帽，帽子會以動畫飛戴到小朋友頭上！戴滿 3 位後，桌上還剩 2 頂，視覺一目了然「帽子還有剩，所以夠」，下方點選按鈕作答。
   - 第 (2) 題：點擊櫻桃一顆顆跳到蛋糕上，3 塊蛋糕正好配完，下方點選按鈕作答。
   - 支援重播與清晰的大按鈕選項（44px 以上觸控熱區）。
3. 響應式與純前端：
   - 手機 (390px) 與寬螢幕皆能自適應排版。
   - 純單一 HTML，零外鏈 CDN 依賴。

請直接使用寫入工具建立 `app/components/party_pairing_demo.html`。
"""

def main():
    print("[AGY 監工] 派工通道一 (本地 OpenCode CLI) 施工「派對帽與蛋糕一對一配對」真實考題 Demo...")
    t0 = time.time()
    cmd = ["opencode", "run", "-m", "opencode/glm-5.3-flash-free", "--auto"]
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True
    )
    stdout_b, stderr_b = proc.communicate(input=PROMPT.encode("utf-8"))
    elapsed = time.time() - t0
    out = stdout_b.decode("utf-8", errors="replace")
    err = stderr_b.decode("utf-8", errors="replace")
    print(f"[Channel 1] 施工結束，耗時={elapsed:.1f}s，Exit Code={proc.returncode}")
    target = "app/components/party_pairing_demo.html"
    if os.path.exists(target):
        sz = os.path.getsize(target)
        print(f"[AGY 驗收] 成功！{target} 已生成，大小={sz} bytes")
        sys.exit(0)
    else:
        print(f"[AGY 驗收] 失敗：{target} 未生成！")
        print("Stdout:", out[-500:])
        sys.exit(1)

if __name__ == "__main__":
    main()
