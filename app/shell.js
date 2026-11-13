/* ============================================================
   028-1 國小數學APP — G1~G6 主入口容器 Shell
   - 資料同步自 data/curriculum.json 與 data/units/G1/N-1-1.json（SSOT）
   - 內嵌以支援 file:// 雙擊離線秒開（鐵律五：純前端零外部依賴）
   - 三端自適應：手機 390px / 平板 768px / 電腦 960px+
   ============================================================ */

const CURRICULUM = {
  grades: [
    { grade: 1, label: "一年級", icon: "🌱", units: [
      { code: "N-1-1", name: "10以內的數與比多少、序數", core: "數數、位值、十進位結構", visual: "百數表、白色1積木、橘色10條積木", status: "ready", unitData: { unitId: "G1-N-1-1", sourcePaper: "高雄市忠孝國小 114 學年度第一學期 一年級期中考", questions: [
        { id: "G1-N-1-1-Q01", title: "魚缸數數", examSource: "忠孝國小 114-1 期中", section: "一、填一填", componentPath: "components/fish_tank_demo.html", stem: "數一數，魚缸裡有幾條小魚？" },
        { id: "G1-N-1-1-Q02", title: "桌上的鉛筆", examSource: "忠孝國小 114-1 期中", section: "三、看圖圈圈看", componentPath: "components/pencil_desk_demo.html", stem: "桌上排著一列鉛筆，數一數、比一比、找序數。" },
        { id: "G1-N-1-1-Q03", title: "派對帽與蛋糕", examSource: "忠孝國小 114-1 期中", section: "三、看圖圈圈看", componentPath: "components/party_pairing_demo.html", stem: "派對開始啦！用一對一配對比一比。" },
        { id: "G1-N-1-1-Q04", title: "水果排一列圈圈看", examSource: "忠孝國小 114-1 期中", section: "三、看圖圈圈看", componentPath: "components/fruit_line_demo.html", stem: "水果排排站，套索圈圈看：西瓜第 5 顆 vs 蓮霧前 8 顆。" }
      ]}},
      { code: "N-1-2", name: "20以內的加減", core: "合成、分解、心算加減", visual: "雙色十格陣 (Ten Frame)、五五聚合圓點", status: "upcoming" },
      { code: "N-1-3", name: "基本加減法", core: "湊十法 (Make 10)、拆十法", visual: "荷葉跳步數線、雙色吸鐵拆合動畫", status: "upcoming" },
      { code: "S-1-1", name: "形狀與幾何感知", core: "認識正方形、長方形、三角形、圓形", visual: "觸控等角積木、邊與頂點高亮標籤", status: "upcoming" }
    ]},
    { grade: 2, label: "二年級", icon: "🌿", units: [
      { code: "N-2-1", name: "1000以內的數", core: "三位數、百位位值", visual: "百格板 (100)、橘色十條、白色積木合成分解", status: "upcoming" },
      { code: "N-2-2", name: "加減算式與直式計算", core: "兩位數直式、二次進位、一次退位", visual: "位值格線表、借退位小字標記", status: "upcoming" },
      { code: "N-2-6", name: "乘法意義", core: "連加轉化為「倍」、單位量與單位數", visual: "雞蛋盒矩陣陣列 (Array Model)、同心分組圈", status: "upcoming" },
      { code: "N-2-7", name: "九九乘法", core: "乘法九九表、乘法交換律", visual: "九九乘法階梯跳步數線、旋轉長方陣", status: "upcoming" },
      { code: "S-2-1", name: "幾何形體與角", core: "邊、角、頂點、直角", visual: "動態夾角展開扇、直角三角形比對角規", status: "upcoming" }
    ]},
    { grade: 3, label: "三年級", icon: "🌷", units: [
      { code: "N-3-2", name: "加減直式計算", core: "三位數加減、二次進位、兩次退位", visual: "三位數格線直式、連續退位借位標註", status: "upcoming" },
      { code: "N-3-3", name: "乘以一位數", core: "二三位數乘一位數直式", visual: "分層部分積 (Partial Products) 位值展開圖", status: "upcoming" },
      { code: "N-3-4", name: "除法與長直式", core: "分裝與平分、商與餘數", visual: "長除法階梯（商、相乘、相減、落位）", status: "upcoming" },
      { code: "N-3-9", name: "簡單同分母分數", core: "連續量/離散量等分、同分母加減", visual: "長條等分尺、等分圓餅圖形", status: "upcoming" },
      { code: "S-3-1", name: "圓", core: "圓心、半徑、直徑", visual: "動態圓規旋轉軌跡、直徑=2倍半徑標籤", status: "upcoming" }
    ]},
    { grade: 4, label: "四年級", icon: "🌳", units: [
      { code: "N-4-1", name: "一億以內的數", core: "大數十進位、四位一圈（萬、億）", visual: "位值記數板（每 4 位顏色分區分組）", status: "upcoming" },
      { code: "N-4-2", name: "整數四則運算", core: "多位數乘除直式、先乘除後加減", visual: "兩位數乘兩位數矩陣模型、估商試商階梯", status: "upcoming" },
      { code: "N-4-5", name: "同分母分數", core: "假分數、帶分數轉換與加減", visual: "積木長條串聯圖、帶分數雙軌條", status: "upcoming" },
      { code: "N-4-7", name: "二位小數", core: "小數點對齊、二位小數直式加減", visual: "位值表對齊虛線、小數點防跌落指示線", status: "upcoming" },
      { code: "S-4-2", name: "周長與面積", core: "長方形/正方形周長與面積公式", visual: "周長拉直一維線段 vs 面積二維網格", status: "upcoming" }
    ]},
    { grade: 5, label: "五年級", icon: "🏔️", units: [
      { code: "N-5-1", name: "因數與倍數", core: "因數、公因數、質數認識", visual: "矩形因數拼圖陣列、倍數跳步光點數線", status: "upcoming" },
      { code: "N-5-2", name: "短除法與最大公因數", core: "質因數分解、短除法原理", visual: "短除法階梯表（I 型找 GCD、L 型找 LCM）", status: "upcoming" },
      { code: "N-5-4", name: "異分母分數加減", core: "約分、擴分、通分", visual: "二維矩陣橫縱雙向切割通分動畫", status: "upcoming" },
      { code: "N-5-7", name: "分數乘法", core: "整數乘分數、分數乘分數", visual: "面積重疊交集模型 (Area Model)", status: "upcoming" },
      { code: "S-5-1", name: "三角形與平行四邊形面積", core: "底高垂直關係、底×高、底×高÷2", visual: "高線垂足動態投影、割補旋轉拼成長方形", status: "upcoming" }
    ]},
    { grade: 6, label: "六年級", icon: "🚀", units: [
      { code: "N-6-2", name: "分數除法", core: "包含除、等分除、除以分數等於乘倒數", visual: "雙重數線 (Double Number Line)、單位量縮放尺", status: "upcoming" },
      { code: "N-6-3", name: "小數除法", core: "小數點向右平移直式、求商與餘數", visual: "除數小數點平移軌跡、餘數小數點對齊原位", status: "upcoming" },
      { code: "S-6-3", name: "圓面積與扇形", core: "圓周率 3.14、圓面積公式 r×r×π", visual: "圓形無窮細分扇形切片、拉直拼成平行四邊形", status: "upcoming" },
      { code: "R-6-4", name: "速度與行程問題", core: "距離、速度、時間三者關係，追趕與相遇", visual: "動態雙向火車/跑者數線、相對速度向量圖", status: "upcoming" }
    ]}
  ]
};

/* ---------------- Shell 狀態機 ---------------- */
const app = document.getElementById("app");
let state = { view: "grade", grade: 1, unit: null, qIndex: 0, visited: new Set() };

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/* ---------------- View 1：年級視圖 ---------------- */
function renderGrade() {
  app.innerHTML = "";
  const g = CURRICULUM.grades.find(g => g.grade === state.grade);

  const hero = el("div", "hero");
  hero.innerHTML = `<div class="hero-emoji">${g.icon}</div>
    <h1>${g.label}・108 課綱數學</h1>
    <p class="hero-sub">真題・真算理・真教具｜每單元嚴選 10 題段考真題</p>`;
  app.appendChild(hero);

  const nav = el("nav", "grade-nav");
  CURRICULUM.grades.forEach(gd => {
    const b = el("button", "pill" + (gd.grade === state.grade ? " pill-active" : ""));
    b.innerHTML = `<span class="pill-emoji">${gd.icon}</span>${gd.label}`;
    b.onclick = () => { state.grade = gd.grade; state.view = "grade"; render(); };
    nav.appendChild(b);
  });
  app.appendChild(nav);

  const grid = el("div", "unit-grid");
  g.units.forEach(u => {
    const ready = u.status === "ready";
    const card = el(ready ? "button" : "div", "unit-card " + (ready ? "unit-ready" : "unit-locked"));
    if (ready) {
      card.innerHTML = `
        <div class="card-top"><span class="code-badge code-ready">${u.code}</span>
          <span class="badge badge-ready">✔ 已就緒</span></div>
        <div class="card-name">${u.name}</div>
        <div class="card-core">🎯 ${u.core}</div>
        <div class="card-visual">🧩 ${u.visual}</div>
        <div class="card-cta">✏️ 點我開始做真題 →</div>`;
      card.onclick = () => { state.view = "unit"; state.unit = u; state.qIndex = 0; state.visited = new Set([0]); render(); };
    } else {
      card.innerHTML = `
        <div class="card-top"><span class="code-badge">${u.code}</span>
          <span class="badge badge-upcoming">即將開放</span></div>
        <div class="card-name">${u.name}</div>
        <div class="card-core">🎯 ${u.core}</div>
        <div class="card-visual">🧩 ${u.visual}</div>
        <div class="card-cta card-cta-muted">🔒 籌備中</div>`;
    }
    grid.appendChild(card);
  });
  app.appendChild(grid);
}

/* ---------------- View 2：單元測驗舞台 ---------------- */
function renderUnit() {
  app.innerHTML = "";
  const u = state.unit;
  const ud = u.unitData;
  const qs = ud.questions;
  const qi = state.qIndex;
  const q = qs[qi];

  /* 頂部：返回 + 單元標題 */
  const top = el("div", "stage-top");
  const back = el("button", "btn-back", "← 回年級");
  back.onclick = () => { state.view = "grade"; render(); };
  const titleBox = el("div", "stage-title");
  titleBox.innerHTML = `<span class="code-badge code-ready">${u.code}</span><h2>${u.name}</h2>`;
  const source = el("div", "exam-source", `📄 真題來源：${ud.sourcePaper}｜${q.examSource}・${q.section}`);
  top.append(back, titleBox);
  app.append(top, source);

  /* 題號分頁 */
  const tabs = el("div", "q-tabs");
  qs.forEach((qq, i) => {
    const t = el("button", "q-tab" + (i === qi ? " q-tab-active" : "") + (state.visited.has(i) ? " q-tab-visited" : ""));
    t.innerHTML = `<span class="q-tab-num">第 ${i + 1} 題</span><span class="q-tab-title">${qq.title}</span>`;
    t.onclick = () => { state.qIndex = i; state.visited.add(i); render(); };
    tabs.appendChild(t);
  });
  app.appendChild(tabs);

  /* 舞台中央：具象考題 iframe 無痕嵌入 */
  const stage = el("div", "stage-frame");
  const frame = el("iframe", "demo-frame");
  frame.src = q.componentPath;
  frame.title = q.title;
  frame.setAttribute("allowfullscreen", "");
  stage.appendChild(frame);
  app.appendChild(stage);

  /* 底部導航 */
  const bottom = el("div", "stage-bottom");
  const prev = el("button", "btn-nav" + (qi === 0 ? " btn-disabled" : ""), "⬅️ 上一題");
  prev.onclick = () => { if (qi > 0) { state.qIndex = qi - 1; state.visited.add(qi - 1); render(); } };
  const submit = el("button", "btn-submit", "🏆 交卷結算");
  submit.onclick = () => showResult(ud, u);
  const next = el("button", "btn-nav" + (qi === qs.length - 1 ? " btn-disabled" : ""), "➡️ 下一題");
  next.onclick = () => { if (qi < qs.length - 1) { state.qIndex = qi + 1; state.visited.add(qi + 1); render(); } };
  bottom.append(prev, submit, next);
  app.appendChild(bottom);
}

/* ---------------- 交卷結算 ---------------- */
function showResult(ud, u) {
  const qs = ud.questions;
  const done = state.visited.size;
  const list = qs.map((q, i) =>
    `<li class="${state.visited.has(i) ? "res-done" : "res-miss"}">${state.visited.has(i) ? "✅" : "⬜"} 第 ${i + 1} 題・${q.title}</li>`).join("");
  const overlay = el("div", "overlay");
  overlay.innerHTML = `
    <div class="result-card">
      <div class="result-emoji">🏆</div>
      <h3>交卷結算</h3>
      <p class="result-unit">${u.code} ${u.name}</p>
      <p class="result-count">已挑戰 ${done} / ${qs.length} 題真題</p>
      <ul class="result-list">${list}</ul>
      <p class="result-note">每題都請在實機算理解析核對後，才寫入題庫喔（人類盲審鐵律）！</p>
      <button class="btn-nav btn-close">關閉</button>
    </div>`;
  overlay.querySelector(".btn-close").onclick = () => overlay.remove();
  document.body.appendChild(overlay);
}

/* ---------------- 主渲染 ---------------- */
function render() {
  window.scrollTo({ top: 0 });
  if (state.view === "grade") renderGrade();
  else renderUnit();
}

render();
