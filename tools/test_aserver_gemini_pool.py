# -*- coding: utf-8 -*-
import sys
sys.path.insert(0, 'D:/CCY/ANTIGRAVITY/32_AUTOFLOW與OpenCode算力調度')
from core.gemini_key_pool import GeminiKeyPool

pool = GeminiKeyPool()
print("A-SERVER Gemini Key Pool Status:")
print("Total Keys:", len(pool.keys))
print("Healthy Keys:", len(pool.get_healthy_keys()))
res = pool.generate_text("請回覆：A-SERVER 通道三驗真成功", model="gemini-2.5-flash")
print("Response:", res)
