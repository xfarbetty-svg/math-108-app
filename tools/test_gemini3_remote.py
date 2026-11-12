# -*- coding: utf-8 -*-
import glob, importlib.util

matches = glob.glob('D:/CCY/ANTIGRAVITY/*32*/**/gemini_key_pool.py', recursive=True)
p = matches[0]
spec = importlib.util.spec_from_file_location("gemini_key_pool", p)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

req = {
    "model": "gemini-3-flash-preview",
    "messages": [{"role": "user", "content": "請回覆一句：A-SERVER 通道三 gemini-3-flash-preview 實測秒通！"}]
}
print("正在調用 A-SERVER 的 Gemini Key Pool...")
resp = mod.invoke_gemini_chat_direct(req)
print("Response:", resp.get("choices", [{}])[0].get("message", {}).get("content"))
