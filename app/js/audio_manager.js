/* ============================================================
 * 全站音訊單例 AudioManager
 * - 唯一發聲入口：epoch 機制保證「後發聲必中斷前發聲」
 * - 三級雙通道平滑降級：
 *   1) 本地 /api/tts (Edge-TTS 曉臻)
 *   2) 雲端備援 math3-bank.pages.dev/api/tts
 *   3) window.speechSynthesis (Web Speech 兜底，zh-TW 優先)
 * ============================================================ */
(function () {
  "use strict";
  if (window.AudioManager) return; // 單例保護

  let currentAudio = null;      // 當前 HTMLAudioElement
  let currentEpoch = 0;         // 發聲世代：遞增以作廢舊回調
  let isSpeaking = false;       // 當前是否正在發聲
  let activeOptions = null;     // 當前這一輪的回調組

  /* ---------- 破音字（多音字）發音校正 ----------
   * 僅作用於「即將送進 TTS 的純文字字串」（/api/tts 的 text 參數、
   * Web Speech 的 SpeechSynthesisUtterance.text），絕不回寫 DOM 或題庫 JSON。
   * cleanTextForSpeech 一律回傳新字串，原始傳入文字保持不變。
   * 採「完整詞」精確匹配（先長後短），嚴禁單字替換，避免誤傷「奇怪、神奇」等日常詞。
   * 已檢查並刻意不改：差數／相差（chā）、幾分之幾（jǐ）— 引擎讀音已正確，不改動以免誤傷。
   */
  const POLYPHONE_FIXES = [
    { from: "奇數", to: "基數" }, // 奇數 jī-shù（odd）→ 避免誤讀為「騎數」qí-shù
    { from: "奇偶", to: "基偶" }, // 奇偶 jī-ǒu（odd-even）→ 避免誤讀為「騎偶」
    { from: "量折線", to: "良折線" }, // 測量動詞 liáng → 避免誤讀為四聲「亮」
    { from: "量取", to: "良取" },
    { from: "量出", to: "良出" },
    { from: "量一量", to: "良一良" },
    { from: "測量", to: "測良" },
    { from: "度量", to: "度良" },
    { from: "量角器", to: "良角器" },
    { from: "量長度", to: "良長度" },
    { from: "量量看", to: "良良看" }
  ];

  function fixPolyphonePronunciation(text) {
    let s = String(text);
    for (const fix of POLYPHONE_FIXES) {
      s = s.split(fix.from).join(fix.to);
    }
    return s;
  }

  /* ---------- 文字清洗 ---------- */
  function cleanTextForSpeech(text) {
    if (!text) return "";
    let s = fixPolyphonePronunciation(text);
    // 去除 Emoji 與裝飾符號
    s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2190}-\u{21FF}\u{2500}-\u{25FF}]/gu, "");
    // 數學運算符號轉易讀中文
    s = s.replace(/\+/g, "加")
         .replace(/[－\-–—]/g, "減")
         .replace(/[×✕✖]/g, "乘")
         .replace(/÷/g, "除")
         .replace(/＝|=/g, "等於");
    // 單位轉易讀中文（先長詞後短詞，避免誤切）
    s = s.replace(/mm/gi, "毫米")
         .replace(/cm/gi, "公分")
         .replace(/mL/g, "毫升")
         .replace(/\bkg\b/gi, "公斤")
         .replace(/\bL\b/g, "公升")
         .replace(/\bg\b/g, "公克");
    // 去除括號與底線類裝飾
    s = s.replace(/[()（）_\-–—~·]/g, " ");
    // 收斂多餘空白與換行
    s = s.replace(/\s+/g, " ").trim();
    return s;
  }

  /* ---------- 中斷既有發聲 ---------- */
  function abortCurrent() {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.src = "";
      } catch (e) { /* 忽略中斷時的無效狀態錯誤 */ }
      currentAudio = null;
    }
    if ("speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* 同上 */ }
    }
  }

  /* ---------- Web Speech 兜底 ---------- */
  function webSpeechFallback(clean, options, epoch) {
    if (epoch !== currentEpoch) return;
    isSpeaking = false;
    activeOptions = null;
    if (!("speechSynthesis" in window)) {
      if (options.onError) options.onError();
      return;
    }
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = "zh-TW";
    utter.rate = 0.95;
    utter.pitch = 1.05;

    // 台灣女聲優先（曉臻 / 雅婷），其次任意 zh-TW 聲音
    const voices = window.speechSynthesis.getVoices() || [];
    const twVoice = voices.find(v => v.name && (v.name.includes("HsiaoChen") || v.name.includes("曉臻") || v.name.includes("Yating") || v.name.includes("雅婷") || v.name.includes("Taiwan") || v.name.includes("臺灣"))) ||
                    voices.find(v => (v.lang === "zh-TW" || v.lang === "zh_TW") && !v.lang.toLowerCase().includes("hk"));
    if (twVoice) utter.voice = twVoice;

    utter.onstart = () => {
      if (epoch === currentEpoch) {
        isSpeaking = true;
        if (options.onStart) options.onStart();
      }
    };
    utter.onend = () => {
      if (epoch === currentEpoch) {
        isSpeaking = false;
        activeOptions = null;
        if (options.onEnd) options.onEnd();
      }
    };
    utter.onerror = () => {
      if (epoch === currentEpoch) {
        isSpeaking = false;
        activeOptions = null;
        if (options.onError) options.onError();
      }
    };

    window.speechSynthesis.speak(utter);
  }

  /* ---------- 播放（三級雙通道平滑降級） ---------- */
  function play(text, options) {
    options = options || {};
    const clean = cleanTextForSpeech(text);
    if (!clean) {
      if (options.onError) options.onError();
      return;
    }

    // 世代推進：立刻作廢舊回調並中斷既有發聲
    currentEpoch++;
    const thisEpoch = currentEpoch;
    abortCurrent();

    isSpeaking = true;
    activeOptions = options;
    if (options.onStart) options.onStart();

    const primaryUrl = "/api/tts?text=" + encodeURIComponent(clean) + "&voice=zh-TW-HsiaoChenNeural";
    const fallbackCloudUrl = "https://math3-bank.pages.dev/api/tts?text=" + encodeURIComponent(clean) + "&voice=zh-TW-HsiaoChenNeural";

    const audio = new Audio();
    currentAudio = audio;
    let fellBack = false;
    let timer = null;

    const dead = () => thisEpoch !== currentEpoch;

    function clearTimer() {
      if (timer) { clearTimeout(timer); timer = null; }
    }

    // 2.5 秒內未能開播 → 降級
    function armTimeout(url, isLast) {
      clearTimer();
      timer = setTimeout(() => {
        if (dead() || fellBack) return;
        if (!audio.duration || audio.paused) {
          if (isLast) webSpeechFallback(clean, options, thisEpoch);
          else tryUrl(fallbackCloudUrl, true);
        }
      }, 2500);
    }

    function tryUrl(url, isLast) {
      if (dead() || fellBack) return;
      audio.src = url;
      audio.load();
      armTimeout(url, isLast);
    }

    audio.oncanplay = () => {
      clearTimer();
      if (dead() || fellBack) return;
      // 音訊就緒：確保 Web Speech 不會疊音
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      const p = audio.play();
      if (p && p.catch) p.catch(() => webSpeechFallback(clean, options, thisEpoch));
    };

    audio.onended = () => {
      clearTimer();
      if (dead()) return;
      isSpeaking = false;
      currentAudio = null;
      activeOptions = null;
      if (options.onEnd) options.onEnd();
    };

    audio.onerror = () => {
      clearTimer();
      if (dead() || fellBack) return;
      const src = audio.src || "";
      if (src.includes("/api/tts") && !src.includes("math3-bank.pages.dev")) {
        // 一級失敗 → 二級雲端備援
        tryUrl(fallbackCloudUrl, true);
      } else {
        // 二級也失敗 → 三級 Web Speech 兜底
        webSpeechFallback(clean, options, thisEpoch);
      }
    };

    tryUrl(primaryUrl, false);
  }

  /* ---------- 停止 ---------- */
  function stop() {
    currentEpoch++;
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.src = "";
      } catch (e) { /* 忽略 */ }
      currentAudio = null;
    }
    if ("speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
    }
    const hadSpeech = isSpeaking;
    isSpeaking = false;
    const cbs = activeOptions;
    activeOptions = null;
    // 若有未完成回調，觸發 onEnd 讓 UI 復位
    if (hadSpeech && cbs && cbs.onEnd) cbs.onEnd();
  }

  /* ---------- 狀態查詢 ---------- */
  function isPlaying() {
    return isSpeaking;
  }

  window.AudioManager = {
    play: play,
    stop: stop,
    isPlaying: isPlaying,
    cleanTextForSpeech: cleanTextForSpeech,
    fixPolyphonePronunciation: fixPolyphonePronunciation
  };
})();
