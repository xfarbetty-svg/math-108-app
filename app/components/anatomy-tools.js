/**
 * Anatomy Universal Tools Bundle (034_anatomy_interactive_svg)
 * 零外部依賴、純原生 JavaScript Web Components 教具庫
 * 專為國小數學、自然、社會、英文 APP 跨通道調用打造
 */
(function() {
  'use strict';

  // --- 1. 等角透視幾何核心 (Isometric Core) ---
  const Isometric = {
    PROJECT_ANGLE: Math.PI / 6, // 30 deg

    project(x, y, z, originX = 160, originY = 160, scale = 36) {
      const cos30 = Math.cos(this.PROJECT_ANGLE);
      const sin30 = Math.sin(this.PROJECT_ANGLE);
      const px = x * scale;
      const py = y * scale;
      const pz = z * scale;
      const sx = originX + (px - py) * cos30;
      const sy = originY + (px + py) * sin30 - pz;
      return { x: Math.round(sx * 10) / 10, y: Math.round(sy * 10) / 10 };
    },

    depthOf(x, y, z) {
      // 深度排序：x+y 愈大愈靠近觀察者，z 愈大愈高
      return (x + y) * 10 + z;
    },

    cubePaths(x, y, z, originX, originY, scale = 36) {
      const p = (dx, dy, dz) => this.project(x + dx, y + dy, z + dz, originX, originY, scale);
      
      const v000 = p(0, 0, 0);
      const v100 = p(1, 0, 0);
      const v110 = p(1, 1, 0);
      const v010 = p(0, 1, 0);
      const v001 = p(0, 0, 1);
      const v101 = p(1, 0, 1);
      const v111 = p(1, 1, 1);
      const v011 = p(0, 1, 1);

      return {
        top: `M ${v001.x},${v001.y} L ${v101.x},${v101.y} L ${v111.x},${v111.y} L ${v011.x},${v011.y} Z`,
        frontRight: `M ${v100.x},${v100.y} L ${v101.x},${v101.y} L ${v111.x},${v111.y} L ${v110.x},${v110.y} Z`,
        frontLeft: `M ${v010.x},${v010.y} L ${v011.x},${v011.y} L ${v111.x},${v111.y} L ${v110.x},${v110.y} Z`
      };
    }
  };

  // --- 2. <iso-block-viewer> 自定義元件 ---
  class IsoBlockViewer extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._blocks = [[0, 0, 0]];
      this._view = 'iso'; // iso, top, front, side
      this._interactive = true;
      this._rotation = 0; // 0, 90, 180, 270
    }

    static get observedAttributes() {
      return ['blocks', 'view', 'interactive', 'rotation'];
    }

    connectedCallback() {
      this.parseAttributes();
      this.render();
    }

    attributeChangedCallback() {
      this.parseAttributes();
      this.render();
    }

    parseAttributes() {
      const blocksAttr = this.getAttribute('blocks');
      if (blocksAttr) {
        try {
          const parsed = JSON.parse(blocksAttr);
          if (Array.isArray(parsed)) {
            // 支援 [[x,y,z], ...] 或 [{x,y,z}, ...]
            this._blocks = parsed.map(b => Array.isArray(b) ? { x: b[0], y: b[1], z: b[2] } : b);
          }
        } catch (e) {
          console.warn('IsoBlockViewer: blocks JSON parse failed', e);
        }
      }
      if (this.hasAttribute('view')) this._view = this.getAttribute('view');
      if (this.hasAttribute('interactive')) this._interactive = this.getAttribute('interactive') !== 'false';
      if (this.hasAttribute('rotation')) this._rotation = parseInt(this.getAttribute('rotation') || '0', 10);
    }

    // 依旋轉角度變換坐標
    getRotatedBlocks() {
      const rot = (this._rotation % 360 + 360) % 360;
      return this._blocks.map(b => {
        let { x, y, z } = b;
        if (rot === 90) return { x: y, y: -x, z };
        if (rot === 180) return { x: -x, y: -y, z };
        if (rot === 270) return { x: -y, y: x, z };
        return { x, y, z };
      });
    }

    render() {
      const blocks = this.getRotatedBlocks();
      let contentHtml = '';

      if (this._view === 'iso') {
        contentHtml = this.renderIsoSvg(blocks);
      } else {
        contentHtml = this.render2DProjectionSvg(blocks, this._view);
      }

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            font-family: system-ui, -apple-system, sans-serif;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 12px;
            color: #f8fafc;
            box-sizing: border-box;
            max-width: 100%;
          }
          .canvas-wrap {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 240px;
          }
          svg {
            max-width: 100%;
            height: auto;
            overflow: visible;
          }
          .toolbar {
            display: flex;
            gap: 6px;
            margin-top: 10px;
            flex-wrap: wrap;
          }
          button {
            flex: 1;
            background: #1e293b;
            color: #94a3b8;
            border: 1px solid #475569;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          button:hover {
            background: #334155;
            color: #f8fafc;
          }
          button.active {
            background: #3b82f6;
            color: #ffffff;
            border-color: #60a5fa;
            font-weight: bold;
          }
        </style>
        <div class="canvas-wrap">
          ${contentHtml}
        </div>
        ${this._interactive ? `
          <div class="toolbar">
            <button class="${this._view === 'iso' ? 'active' : ''}" data-view="iso">立體等角</button>
            <button class="${this._view === 'top' ? 'active' : ''}" data-view="top">俯視圖(上)</button>
            <button class="${this._view === 'front' ? 'active' : ''}" data-view="front">正視圖(前)</button>
            <button class="${this._view === 'side' ? 'active' : ''}" data-view="side">側視圖(右)</button>
            <button data-action="rotate">旋轉 90° ↻</button>
          </div>
        ` : ''}
      `;

      if (this._interactive) {
        this.shadowRoot.querySelectorAll('button[data-view]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            this._view = e.target.getAttribute('data-view');
            this.render();
          });
        });
        const rotBtn = this.shadowRoot.querySelector('button[data-action="rotate"]');
        if (rotBtn) {
          rotBtn.addEventListener('click', () => {
            this._rotation = (this._rotation + 90) % 360;
            this.render();
          });
        }
      }
    }

    renderIsoSvg(blocks) {
      // 深度排序：遠 -> 近
      const sorted = [...blocks].sort((a, b) => Isometric.depthOf(a.x, a.y, a.z) - Isometric.depthOf(b.x, b.y, b.z));
      
      // 自動計算中心偏移
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      sorted.forEach(b => {
        const p = Isometric.project(b.x, b.y, b.z, 0, 0, 36);
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
      const originX = 160 - (minX + maxX) / 2;
      const originY = 140 - (minY + maxY) / 2;

      const cubeSvgStrings = sorted.map(b => {
        const paths = Isometric.cubePaths(b.x, b.y, b.z, originX, originY, 36);
        return `
          <g class="cube" data-coord="${b.x},${b.y},${b.z}">
            <path d="${paths.frontLeft}" fill="#1d4ed8" stroke="#1e293b" stroke-width="1.5" />
            <path d="${paths.frontRight}" fill="#2563eb" stroke="#1e293b" stroke-width="1.5" />
            <path d="${paths.top}" fill="#60a5fa" stroke="#1e293b" stroke-width="1.5" />
          </g>
        `;
      }).join('');

      return `<svg width="320" height="260" viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg">${cubeSvgStrings}</svg>`;
    }

    render2DProjectionSvg(blocks, view) {
      // 2D 投影 (top: x vs y, front: x vs z, side: y vs z)
      const grid = new Set();
      let maxCols = 1, maxRows = 1;

      blocks.forEach(b => {
        let col = 0, row = 0;
        if (view === 'top') {
          col = b.x;
          row = b.y;
        } else if (view === 'front') {
          col = b.x;
          row = -b.z;
        } else if (view === 'side') {
          col = b.y;
          row = -b.z;
        }
        grid.add(`${col},${row}`);
      });

      // 找出邊界
      let minCol = Infinity, maxCol = -Infinity, minRow = Infinity, maxRow = -Infinity;
      grid.forEach(k => {
        const [c, r] = k.split(',').map(Number);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
      });

      const cellSize = 40;
      const cols = (maxCol - minCol + 1) || 1;
      const rows = (maxRow - minRow + 1) || 1;
      const startX = 160 - (cols * cellSize) / 2;
      const startY = 130 - (rows * cellSize) / 2;

      let rects = '';
      grid.forEach(k => {
        const [c, r] = k.split(',').map(Number);
        const x = startX + (c - minCol) * cellSize;
        const y = startY + (r - minRow) * cellSize;
        rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#3b82f6" stroke="#ffffff" stroke-width="2" rx="4" />`;
      });

      return `
        <svg width="320" height="260" viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg">
          <text x="160" y="30" text-anchor="middle" fill="#94a3b8" font-size="14">${view === 'top' ? '俯視圖 (上)' : view === 'front' ? '正視圖 (前)' : '側視圖 (右)'}</text>
          ${rects}
        </svg>
      `;
    }
  }

  // --- 3. <physics-lever-balance> 自定義元件 ---
  class PhysicsLeverBalance extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._left = 1;
      this._right = 1;
      this._angle = 0;
      this._animating = false;
    }

    static get observedAttributes() {
      return ['left', 'right'];
    }

    connectedCallback() {
      this.parseAttributes();
      this.render();
      this.animateToTargetAngle();
    }

    attributeChangedCallback() {
      this.parseAttributes();
      this.render();
      this.animateToTargetAngle();
    }

    parseAttributes() {
      if (this.hasAttribute('left')) this._left = parseFloat(this.getAttribute('left')) || 0;
      if (this.hasAttribute('right')) this._right = parseFloat(this.getAttribute('right')) || 0;
    }

    animateToTargetAngle() {
      // 依照左右力矩計算目標傾角 (-15度 ~ +15度)
      const diff = this._right - this._left;
      const maxAngle = 15;
      const targetAngle = Math.max(-maxAngle, Math.min(maxAngle, diff * 5));

      // 阻尼簡諧擺動動畫 (Damped Harmonic Motion)
      let current = this._angle;
      let velocity = 0;
      const spring = 0.08;
      const damping = 0.82;
      let stepCount = 0;

      const frame = () => {
        const force = (targetAngle - current) * spring;
        velocity = (velocity + force) * damping;
        current += velocity;
        stepCount++;

        const beam = this.shadowRoot.querySelector('#beam-group');
        if (beam) {
          beam.setAttribute('transform', `rotate(${current}, 160, 100)`);
        }

        if (Math.abs(velocity) > 0.05 || Math.abs(targetAngle - current) > 0.05) {
          if (stepCount < 180) {
            requestAnimationFrame(frame);
          } else {
            this._angle = targetAngle;
            if (beam) beam.setAttribute('transform', `rotate(${targetAngle}, 160, 100)`);
          }
        } else {
          this._angle = targetAngle;
          if (beam) beam.setAttribute('transform', `rotate(${targetAngle}, 160, 100)`);
        }
      };

      requestAnimationFrame(frame);
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            font-family: system-ui, -apple-system, sans-serif;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 16px;
            color: #f8fafc;
            box-sizing: border-box;
          }
          svg {
            display: block;
            margin: 0 auto;
          }
          .label {
            text-align: center;
            font-size: 13px;
            color: #94a3b8;
            margin-top: 8px;
          }
        </style>
        <svg width="320" height="200" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
          <!-- 支架底座 -->
          <polygon points="160,100 140,170 180,170" fill="#475569" stroke="#64748b" stroke-width="2" />
          <rect x="110" y="170" width="100" height="12" rx="4" fill="#334155" />
          <!-- 支點軸承 -->
          <circle cx="160" cy="100" r="6" fill="#f59e0b" />

          <!-- 可擺動橫梁 -->
          <g id="beam-group" transform="rotate(${this._angle}, 160, 100)">
            <rect x="40" y="96" width="240" height="8" rx="3" fill="#cbd5e1" stroke="#475569" />
            <!-- 左托盤吊線與托盤 -->
            <line x1="60" y1="104" x2="60" y2="140" stroke="#94a3b8" stroke-width="1.5" />
            <ellipse cx="60" cy="140" rx="28" ry="6" fill="#38bdf8" />
            <!-- 左砝碼 -->
            <rect x="52" y="${140 - Math.min(this._left * 6, 36)}" width="16" height="${Math.min(this._left * 6, 36)}" fill="#0284c7" rx="2" />
            <text x="60" y="${135 - Math.min(this._left * 6, 36)}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">${this._left}</text>

            <!-- 右托盤吊線與托盤 -->
            <line x1="260" y1="104" x2="260" y2="140" stroke="#94a3b8" stroke-width="1.5" />
            <ellipse cx="260" cy="140" rx="28" ry="6" fill="#38bdf8" />
            <!-- 右砝碼 -->
            <rect x="252" y="${140 - Math.min(this._right * 6, 36)}" width="16" height="${Math.min(this._right * 6, 36)}" fill="#0284c7" rx="2" />
            <text x="260" y="${135 - Math.min(this._right * 6, 36)}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">${this._right}</text>
          </g>
        </svg>
        <div class="label">左: ${this._left} vs 右: ${this._right} (${this._left === this._right ? '平衡 ⚖️' : this._left > this._right ? '左傾 ◀' : '右傾 ▶'})</div>
      `;
    }
  }

  // --- 4. 註冊客製化標籤 ---
  if (!customElements.get('iso-block-viewer')) {
    customElements.define('iso-block-viewer', IsoBlockViewer);
  }
  if (!customElements.get('physics-lever-balance')) {
    customElements.define('physics-lever-balance', PhysicsLeverBalance);
  }

  // 導出全局命名空間
  window.Anatomy = {
    Isometric,
    version: '1.0.0'
  };

  console.log('✅ [Anatomy 034] 教具工具櫃已成功載入 (<iso-block-viewer>, <physics-lever-balance>)');
})();
