# 📋 Act 1 專屬派工任務卡：G3-N-3-9 一體化教室 3D 黏土米米 (Act 1 獨立驗收)

<!-- STATUS: APPROVED_FOR_DISPATCH -->
<!-- DISPATCH_WORKER: Channel 1 (OpenCode CLI) -->
<!-- REVIEWER: Channel 3 (035 Gemini Pool) + User -->

> **主角定錨**：100% 鎖定 Pixar 原生 3D 黏土白兔米米（黃金種子 30105，薄荷綠吊帶褲、琥珀眼、白毛黏土質感）！
> **嚴格禁令**：100% 徹底清除任何 2D 扁平 SVG 假兔標籤與樣式，嚴禁任何 SVG 偽資產！
> **單元與幕次**：G3-N-3-9 同分母分數【Act 1：情境導入】

---

## 🛠️ 通道一施工規格指示 (Worker Instructions)

請 OpenCode CLI 施工：
1. **修改目標**：`app/scenes/g3_n39_theater/index.html`。
2. **主角層重構**：
   - 徹底移除 `<svg class="mimi-svg">` 及其內部所有手繪 path。
   - 角色層（`.mimi-zone`）僅保留 3D 米米資產：
     - 使用真正的 3D 視訊 `<video id="mimiVideo" class="mimi-video" src="video/mimi_n39_act1.mp4" playsinline muted autoplay loop></video>`。
     - 若影片尚未就緒或備援，底圖使用 `assets_hosts/g3_mimi/textures/mimi_front_1024.png`（真正 3D 黏土本尊）。
3. **空間佈局**：
   - 一體化溫馨教室舞台，無 48:52 硬分割。
   - 米米老師位於講台側邊（`left: 4% ~ 36%`，高 64% 放大身形）。
   - 黑板看板位於中央偏右（`left: 37% ~ 96%`）。
   - **米米老師與黑板 100% 絕不互相遮擋**！
4. **Act 1 算理與語音聯動**：
   - 載入 `audio/act1.mp3`（曉臻自然女聲，27.5 秒）。
   - 黑板展示 12 格長條巧克力，前 10 塊高亮（3 塊藍、7 塊橘、2 塊深灰未取）。
   - 字幕與台詞 100% 對齊新版情境導入台詞。

完工後退出 Exit Code 0，以備通道 3 進行 Act 1 獨立視覺審查與使用者親驗！
