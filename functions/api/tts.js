/**
 * Cloudflare Pages Function: /api/tts
 * 完整 Edge-TTS 原生 WebSocket 串流合成器 (微軟 Sec-MS-GEC v2 鑑權協定)
 * 1. 純 Web 標準客製化 SHA-256 鹽值 ＋ CS64 雙層雜湊鑑權演算法 (v2-143.0.3650.75)
 * 2. 透過 fetch(..., { headers: { Upgrade: 'websocket' } }) 或全局 WebSocket 建立握手
 * 3. 接收二進位音訊串流並回傳 audio/mpeg
 * 4. 2.5 秒超時或網路異常時自動優雅降級 (502)，讓前端無縫走原生台灣自然語音
 */

const TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WIN_EPOCH = 11644473600n;
const U32_MASK = 0xFFFFFFFFn;

const CS64_ADJUSTMENT0 = 4076407578n;
const CS64_ADJUSTMENT1 = 186253312n;
const CS64_FACTOR = 2190031155n;
const CS64_COEFFICIENTS = [
  [3895366065n, 3005677776n], [1155409094n, 2296378653n], [1005282748n, 693190712n],
  [3365689651n, 3005795295n], [2367603217n, 3557143765n], [827258325n, 652566332n],
  [3911487921n, 1618477510n], [4037392853n, 2192753147n], [101076211n, 4199654362n],
  [3665427040n, 545047652n], [3201434976n, 1010595059n], [2314848760n, 3536931681n],
  [905590982n, 3137643201n], [3410617286n, 3311559015n]
];

const SHA256_INITIAL = [1779033703n, 3144134277n, 1013904242n, 2773480762n, 1359893119n, 2600822924n, 528734635n, 1541459225n];
const SHA256_STATE = [4255104674n, 2435071207n, 3192492180n, 3442351626n, 1811967817n, 79508907n, 4272990180n, 66059218n];
const SHA256_SCHEDULE = [3945054110n, 358115615n, 2696978146n, 217723578n, 2787307148n, 3520959633n, 3235718560n, 4192668342n, 4039316851n, 1884868174n, 1904797190n, 15051571n, 3529027680n, 1920361828n];
const SHA256_SIGMA0_ADJUSTMENT = 94112640n;
const SHA256_SIGMA1_ADJUSTMENT = 758464n;
const SHA256_ADJUSTMENT = 3386640039n;

const SHA256_ROUND_CONSTANTS = [
  1116352408n, 1899447441n, 3049323471n, 3921009573n, 961987163n, 1508970993n, 2453635748n, 2870763221n,
  3624381080n, 310598401n, 607225278n, 1426881987n, 1925078388n, 2162078206n, 2614888103n, 3248222580n,
  3835390401n, 4022224774n, 264347078n, 604807628n, 770255983n, 1249150122n, 1555081692n, 1996064986n,
  2554220882n, 2821834349n, 2952996808n, 3210313671n, 3336571891n, 3584528711n, 113926993n, 338241895n,
  666307205n, 773529912n, 1294757372n, 1396182291n, 1695183700n, 1986661051n, 2177026350n, 2456956037n,
  2730485921n, 2820302411n, 3259730800n, 3345764771n, 3516065817n, 3600352804n, 4094571909n, 275423344n,
  430227734n, 506948616n, 659060556n, 883997877n, 958139571n, 1322822218n, 1537002063n, 1747873779n,
  1955562222n, 2024104815n, 2227730452n, 2361852424n, 2428436474n, 2756734187n, 3204031479n, 3329325298n
];

const SHA256_BLOCK_CONSTANTS = [...SHA256_ROUND_CONSTANTS];
SHA256_BLOCK_CONSTANTS[14] = 3386640039n;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function rol16(v) {
  const val = BigInt(v) & U32_MASK;
  return ((val << 16n) | (val >> 16n)) & U32_MASK;
}

function sigma0(val) {
  const v = BigInt(val) & U32_MASK;
  return ((v >> 7n) ^ ((v << 25n) & U32_MASK) ^ (v >> 18n) ^ ((v << 14n) & U32_MASK) ^ (v >> 3n)) & U32_MASK;
}

function sigma1(val) {
  const v = BigInt(val) & U32_MASK;
  return ((v >> 17n) ^ ((v << 15n) & U32_MASK) ^ (v >> 19n) ^ ((v << 13n) & U32_MASK) ^ (v >> 10n)) & U32_MASK;
}

function expandSha256Schedule(words, firstWord = 16) {
  for (let i = firstWord; i < 64; i++) {
    const x = words[i - 2], y = words[i - 15];
    const s1 = sigma1(x);
    const s0 = sigma0(y);
    words.push((s1 + words[i - 7] + s0 + words[i - 16]) & U32_MASK);
  }
}

function sha256Rounds(state, words, firstRound = 0) {
  let [a, b, c, d, e, f, g, h] = state;
  const constants = firstRound === 14 ? SHA256_BLOCK_CONSTANTS : SHA256_ROUND_CONSTANTS;
  const aligned = Math.min(64, Math.floor((firstRound + 7) / 8) * 8);

  for (let idx = firstRound; idx < aligned; idx++) {
    const rotE = e * 0x100000001n;
    const rotA = a * 0x100000001n;
    const t1 = (h + ((rotE >> 6n) ^ (rotE >> 11n) ^ (rotE >> 25n)) + (g ^ (e & (f ^ g))) + constants[idx] + words[idx]) & U32_MASK;
    const t2 = (((rotA >> 2n) ^ (rotA >> 13n) ^ (rotA >> 22n)) + ((a & b) | (c & (a | b)))) & U32_MASK;
    h = g; g = f; f = e; e = (d + t1) & U32_MASK; d = c; c = b; b = a; a = (t1 + t2) & U32_MASK;
  }

  for (let idx = aligned; idx < 64; idx += 8) {
    for (let r = 0; r < 8; r++) {
      const rotE = e * 0x100000001n;
      const rotA = a * 0x100000001n;
      const t1 = (h + ((rotE >> 6n) ^ (rotE >> 11n) ^ (rotE >> 25n)) + (g ^ (e & (f ^ g))) + constants[idx + r] + words[idx + r]) & U32_MASK;
      const t2 = (((rotA >> 2n) ^ (rotA >> 13n) ^ (rotA >> 22n)) + ((a & b) | (c & (a | b)))) & U32_MASK;
      h = g; g = f; f = e; e = (d + t1) & U32_MASK; d = c; c = b; b = a; a = (t1 + t2) & U32_MASK;
    }
  }

  return [a, b, c, d, e, f, g, h];
}

function sha256Init(data) {
  const d3 = (BigInt(data[0]) << 16n) | (BigInt(data[1]) << 8n) | BigInt(data[2]);
  const d4 = (BigInt(data[3]) << 24n) | (BigInt(data[4]) << 16n) | (BigInt(data[5]) << 8n) | BigInt(data[6]);
  const words = new Array(14).fill(0n);
  words.push(d3, d4);

  for (let idx = 16; idx < 30; idx++) {
    let val = SHA256_SCHEDULE[idx - 16];
    if (idx - 2 >= 14) {
      val += idx === 16 ? (sigma1(words[idx - 2]) ^ SHA256_SIGMA1_ADJUSTMENT) : sigma1(words[idx - 2]);
    }
    if (idx - 7 >= 14) {
      val += words[idx - 7];
    }
    if (idx - 15 >= 14) {
      val += idx === 29 ? (sigma0(words[idx - 15]) ^ SHA256_SIGMA0_ADJUSTMENT) : sigma0(words[idx - 15]);
    }
    words.push(val & U32_MASK);
  }

  words.push((sigma1(words[28]) + words[23] + sigma0(words[15]) + words[14] + SHA256_ADJUSTMENT - SHA256_ROUND_CONSTANTS[14]) & U32_MASK);
  expandSha256Schedule(words, 31);
  const working = sha256Rounds(SHA256_STATE, words, 14);
  return SHA256_INITIAL.map((x, i) => (x + working[i]) & U32_MASK);
}

function customSha256Digest(data) {
  const length = 57 + data.length;
  const padZeroCount = (55 - (length % 64) + 64) % 64;
  const padded = new Uint8Array(data.length - 7 + 1 + padZeroCount + 8);
  for (let i = 7; i < data.length; i++) padded[i - 7] = data[i];
  padded[data.length - 7] = 0x80;
  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
  const bitLen = BigInt(length) * 8n;
  view.setBigUint64(padded.length - 8, bitLen, false);

  let state = sha256Init(data);
  for (let offset = 0; offset < padded.length; offset += 64) {
    const words = [];
    for (let w = 0; w < 16; w++) {
      words.push(BigInt(view.getUint32(offset + w * 4, false)));
    }
    expandSha256Schedule(words, 16);
    const working = sha256Rounds(state, words, 0);
    state = state.map((x, i) => (x + working[i]) & U32_MASK);
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) {
    outView.setUint32(i * 4, Number(state[i]), false);
  }
  return out;
}

function generateSecMsGecV2(unixTimestamp) {
  const ts = typeof unixTimestamp === 'number' || typeof unixTimestamp === 'bigint'
    ? BigInt(unixTimestamp)
    : BigInt(Math.floor(Date.now() / 1000));

  let ticks = ts + WIN_EPOCH;
  ticks -= ticks % 300n;
  ticks *= 10000000n;
  const rawStr = ticks.toString() + TRUSTED_TOKEN;
  const encoder = new TextEncoder();
  const data = encoder.encode(rawStr);

  const sha256Buf = customSha256Digest(data);
  const sha256View = new DataView(sha256Buf.buffer, sha256Buf.byteOffset, sha256Buf.byteLength);
  const sha256Hex = Array.from(sha256Buf).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  const keyA = BigInt(sha256View.getUint32(0, true)) | 1n;
  const keyB = BigInt(sha256View.getUint32(4, true)) | 1n;

  const factors = [
    (keyA * CS64_FACTOR) & U32_MASK,
    (keyB * CS64_FACTOR) & U32_MASK
  ];

  const terms = CS64_COEFFICIENTS.map(([c], idx) => (c * factors[idx % 2]) & U32_MASK);
  const offsets = CS64_COEFFICIENTS.map(([, o]) => o);

  const paddedLen = Math.ceil((data.length + 1) / 4) * 4;
  const buf = new Uint8Array(paddedLen);
  buf[0] = 0;
  buf.set(data, 1);
  const bufView = new DataView(buf.buffer);

  let wordCount = paddedLen / 4;
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(BigInt(bufView.getUint32(i * 4, true)));
  }
  if (words.length % 2 !== 0) words.push(0n);

  for (let idx = 0; idx < words.length; idx++) {
    const word = words[idx];
    let term = (word * (idx % 2 === 0 ? keyA : keyB)) & U32_MASK;
    let offset = (rol16(word) * (idx % 2 === 0 ? 0xEF0569FBn : 0xC31713DBn)) & U32_MASK;
    if (idx === 0) {
      term = (term + CS64_ADJUSTMENT0 * factors[0]) & U32_MASK;
      offset = (offset + CS64_ADJUSTMENT1) & U32_MASK;
    }
    terms.push(term);
    offsets.push(offset);
  }

  let swapAcc = 0n, swapLast = 0n, state = 0n, acc = 0n;
  for (let i = 0; i < terms.length; i += 2) {
    const x = terms[i], y = terms[i + 1];
    let t = rol16((offsets[i] + x) & U32_MASK);
    let q = (t * 0x76F50F34n) & U32_MASK;
    swapAcc = (swapAcc + rol16(q) * 0xC3EFEA97n + q) & U32_MASK;
    t = rol16((offsets[i + 1] + y) & U32_MASK);
    q = (t * 0x1881CE3Cn) & U32_MASK;
    swapLast = (rol16(q) * 0x35BD1EC9n + q) & U32_MASK;
    swapAcc = (swapAcc + swapLast) & U32_MASK;

    state = (state * keyA + x) & U32_MASK;
    state = (rol16(state) * 0xCF98B111n) & U32_MASK;
    state = (rol16(state) * 0x87085B9Fn) & U32_MASK;
    state = (rol16(state) * 0x12CEB96Dn) & U32_MASK;
    state = (rol16(state) * 0x257E1D83n) & U32_MASK;
    acc = (acc + state) & U32_MASK;
    t = (state * keyB + y) & U32_MASK;
    t = (rol16(t) * 0xA27416F5n) & U32_MASK;
    t = (rol16(t) * 0xD38396FFn) & U32_MASK;
    state = (rol16((rol16(t) * 0x7C932B89n) & U32_MASK) * 0xBFA49F69n) & U32_MASK;
    acc = (acc + state) & U32_MASK;
  }

  const w1 = swapLast ^ state;
  const w2 = swapAcc ^ acc;
  const cs64Buf = new Uint8Array(8);
  const cs64View = new DataView(cs64Buf.buffer);
  cs64View.setUint32(0, Number(w1), true);
  cs64View.setUint32(4, Number(w2), true);
  const cs64Hex = Array.from(cs64Buf).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  return `${cs64Hex}-${sha256Hex}`;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);

  const text = url.searchParams.get("text");
  if (!text || !text.trim()) {
    return new Response(JSON.stringify({ error: "Missing text parameter" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const cleanText = text.trim();
  const voice = url.searchParams.get("voice") || "zh-TW-HsiaoChenNeural";

  try {
    const secMsGec = generateSecMsGecV2();
    const connId = crypto.randomUUID().replace(/-/g, "");
    const reqId = crypto.randomUUID().replace(/-/g, "");
    const muid = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    const wsUrl = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=2-143.0.3650.75&ConnectionId=${connId}`;

    const resp = await fetch(wsUrl, {
      headers: {
        "Upgrade": "websocket",
        "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "Cookie": `muid=${muid};`
      }
    });

    const ws = resp.webSocket;
    if (!ws) {
      const respBody = await resp.text().catch((textErr) => {
        console.warn("[TTS] resp.text() non-fatal error:", textErr);
        return "";
      });
      return new Response(JSON.stringify({
        status: "fallback_to_browser",
        message: "Use native Web Speech",
        upstream_status: resp.status,
        upstream_body: respBody.slice(0, 200),
        sec_ms_gec: secMsGec.slice(0, 30)
      }), {
        status: 502,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
          "X-Degraded-Reason": `upstream_http_${resp.status}`
        },
      });
    }

    if (ws) {
      ws.accept();

      const audioChunks = [];
      const debugEvents = [];
      let closeInfo = null;

      const synthPromise = new Promise((resolve) => {
        const timer = setTimeout(() => {
          try {
            ws.close();
          } catch (closeErr) {
            console.warn("[TTS] ws close timeout non-fatal:", closeErr);
          }
          resolve(); // 逾時不拋錯，留給後續檢查 audioChunks 降級並附帶 debugEvents
        }, 2500);

        function handleBinary(buf) {
          if (buf.length > 2) {
            const headerLen = (buf[0] << 8) | buf[1];
            const audioChunk = buf.slice(2 + headerLen);
            if (audioChunk.length > 0) {
              audioChunks.push(audioChunk);
            }
          }
        }

        ws.addEventListener("message", async (event) => {
          const data = event.data;
          const typeName = data && data.constructor ? data.constructor.name : typeof data;
          
          if (typeof data === "string") {
            debugEvents.push({ type: "text", preview: data.slice(0, 120) });
            if (data.includes("Path:turn.end")) {
              clearTimeout(timer);
              try {
                ws.close();
              } catch (closeErr) {
                console.warn("[TTS] ws close end non-fatal:", closeErr);
              }
              resolve();
            }
          } else if (data instanceof ArrayBuffer) {
            debugEvents.push({ type: "arraybuffer", len: data.byteLength });
            handleBinary(new Uint8Array(data));
          } else if (typeof Blob !== "undefined" && data instanceof Blob) {
            debugEvents.push({ type: "blob", size: data.size });
            const arrayBuf = await data.arrayBuffer();
            handleBinary(new Uint8Array(arrayBuf));
          } else if (ArrayBuffer.isView(data)) {
            debugEvents.push({ type: "view", len: data.byteLength });
            handleBinary(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
          } else {
            debugEvents.push({ type: "unknown", name: typeName });
          }
        });

        ws.addEventListener("error", (err) => {
          clearTimeout(timer);
          debugEvents.push({ type: "error", err: String(err) });
          try {
            ws.close();
          } catch (closeErr) {
            console.warn("[TTS] ws close on error non-fatal:", closeErr);
          }
          resolve();
        });

        ws.addEventListener("close", (evt) => {
          clearTimeout(timer);
          closeInfo = { code: evt.code, reason: evt.reason, wasClean: evt.wasClean };
          resolve();
        });

        // 產生符合微軟 Edge-TTS 規範之日期字串
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        const jsDate = `${days[now.getUTCDay()]} ${months[now.getUTCMonth()]} ${String(now.getUTCDate()).padStart(2, "0")} ${now.getUTCFullYear()} ${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")} GMT+0000 (Coordinated Universal Time)`;

        // 1. 發送語音格式配置
        const configMsg = `X-Timestamp:${jsDate}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
          JSON.stringify({
            context: {
              synthesis: {
                audio: {
                  metadataoptions: { sentenceBoundaryEnabled: "false", wordBoundaryEnabled: "false" },
                  outputFormat: "audio-24khz-48kbitrate-mono-mp3"
                }
              }
            }
          }) + "\r\n";
        ws.send(configMsg);

        // 2. 發送 SSML
        const escapedText = cleanText
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-TW'><voice name='${voice}'><prosody pitch='+0Hz' rate='+0%'>${escapedText}</prosody></voice></speak>`;
        const ssmlMsg = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${jsDate}Z\r\nPath:ssml\r\n\r\n${ssml}`;
        ws.send(ssmlMsg);
      });

      await synthPromise;

      if (audioChunks.length > 0) {
        // 合併二進位 Chunks
        const totalLen = audioChunks.reduce((acc, cur) => acc + cur.length, 0);
        const mergedAudio = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of audioChunks) {
          mergedAudio.set(chunk, offset);
          offset += chunk.length;
        }

        return new Response(mergedAudio.buffer, {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err);
    console.error(`[Edge-TTS-Degraded] ${errMsg}`);
    return new Response(JSON.stringify({
      status: "fallback_to_browser",
      message: "Use native Web Speech",
      degraded_reason: errMsg
    }), {
      status: 502,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "X-Degraded-Reason": encodeURIComponent(errMsg.slice(0, 200))
      },
    });
  }

  return new Response(JSON.stringify({
    status: "fallback_to_browser",
    message: "Use native Web Speech",
    degraded_reason: "no_audio_chunks_received",
    debug_events: typeof debugEvents !== "undefined" ? debugEvents : [],
    close_info: typeof closeInfo !== "undefined" ? closeInfo : null
  }), {
    status: 502,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "X-Degraded-Reason": "no_audio_chunks"
    },
  });
}
