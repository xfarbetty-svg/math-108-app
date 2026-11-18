# -*- coding: utf-8 -*-
import asyncio
import os
import edge_tts

VOICE = "zh-TW-HsiaoChenNeural"
OUT_DIR = "app/assets/characters/g3_mimi/audio"

ACTS = {
    "act1.mp3": "哈囉小朋友！我是米米。今天我們有一條平分成 12 塊的巧克力，米米拿了 3 塊，好朋友又拿了 7 塊。兩個人合起來，總共拿了幾塊呢？",
    "act2.mp3": "算算看：3 塊加上 7 塊，合起來是 10 塊！但一整條巧克力總共有 12 塊，每一塊都是 12 塊裡的 1 塊，也就是十二分之一條。",
    "act3.mp3": "所以呀，3 塊就是 12 塊裡的 3 塊，也就是十二分之三條；7 塊是 12 塊裡的 7 塊，也就是十二分之七條。合起來的 10 塊，就是 12 塊裡面的 10 塊，也就是十二分之十條！分母 12 告訴我們一整條有幾塊，永遠不會變，只有上面的塊數相加喔！千萬不要把分母加成 24 喔！",
    "act4.mp3": "太棒了！12 塊裡面的 10 塊，答案就是十二分之十條！分母代表平分幾塊，分子算拿了幾塊，你已經把分數加法完全搞懂囉！"
}

async def generate_all():
    os.makedirs(OUT_DIR, exist_ok=True)
    for fname, text in ACTS.items():
        out_path = os.path.join(OUT_DIR, fname)
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(out_path)
        print(f"Generated {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == "__main__":
    asyncio.run(generate_all())
    print("ALL_AUDIO_GENERATED_SUCCESS")
