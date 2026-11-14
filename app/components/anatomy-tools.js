/**
 * Anatomy Universal Tools Bundle (034_anatomy_interactive_svg)
 * 零外部依賴、純原生 JavaScript Web Components 教具庫
 * 專為國小數學、自然、社會、英文 APP 跨通道調用打造
 * v1.1.0: 擴充手繪幾何黑板 (<math-sketch-canvas>) 與探索故事卡 (<interactive-story-card>)
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

  // --- 2. 手繪粉筆向量核心 (Sketchy Core - Rough.js 靈感) ---
  const Sketchy = {
    createRandom(seed = 42) {
      let s = seed % 2147483647;
      if (s <= 0) s += 2147483646;
      return function () {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    },

    linePath(x1, y1, x2, y2, roughness = 1.5, rand) {
      rand = rand || this.createRandom(123);
      const midX = (x1 + x2) / 2 + (rand() - 0.5) * roughness * 2;
      const midY = (y1 + y2) / 2 + (rand() - 0.5) * roughness * 2;
      const endX1 = x2 + (rand() - 0.5) * roughness;
      const endY1 = y2 + (rand() - 0.5) * roughness;
      const path1 = `M ${x1.toFixed(1)},${y1.toFixed(1)} Q ${midX.toFixed(1)},${midY.toFixed(1)} ${endX1.toFixed(1)},${endY1.toFixed(1)}`;

      const offsetStart = (rand() - 0.5) * roughness * 1.2;
      const offsetEnd = (rand() - 0.5) * roughness * 1.2;
      const midX2 = (x1 + x2) / 2 + (rand() - 0.5) * roughness * 1.8;
      const midY2 = (y1 + y2) / 2 + (rand() - 0.5) * roughness * 1.8;
      const path2 = `M ${(x1 + offsetStart).toFixed(1)},${(y1 - offsetStart).toFixed(1)} Q ${midX2.toFixed(1)},${midY2.toFixed(1)} ${(x2 + offsetEnd).toFixed(1)},${(y2 - offsetEnd).toFixed(1)}`;

      return `${path1} ${path2}`;
    },

    polygonPaths(points, roughness = 1.5, rand) {
      if (!points || points.length < 2) return '';
      rand = rand || this.createRandom(123);
      const paths = [];
      const n = points.length;
      for (let i = 0; i < n; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        paths.push(this.linePath(p1[0], p1[1], p2[0], p2[1], roughness, rand));
      }
      return paths.join(' ');
    },

    circlePath(cx, cy, r, roughness = 1.8, rand) {
      rand = rand || this.createRandom(123);
      const steps = 8;
      const pathSegments = [];
      for (let pass = 0; pass < 2; pass++) {
        const rOffset = pass === 0 ? 0 : (rand() - 0.5) * roughness;
        const pts = [];
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const currentR = r + rOffset + (rand() - 0.5) * roughness * 1.5;
          const x = cx + Math.cos(theta) * currentR;
          const y = cy + Math.sin(theta) * currentR;
          pts.push([x, y]);
        }
        let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
        for (let i = 1; i < pts.length; i++) {
          d += ` L ${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`;
        }
        pathSegments.push(d);
      }
      return pathSegments.join(' ');
    },

    hatchFill(points, angleDeg = 45, step = 8, roughness = 1.0, rand) {
      if (!points || points.length < 3) return '';
      rand = rand || this.createRandom(123);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      points.forEach(p => {
        minX = Math.min(minX, p[0]);
        maxX = Math.max(maxX, p[0]);
        minY = Math.min(minY, p[1]);
        maxY = Math.max(maxY, p[1]);
      });

      const lines = [];
      for (let y = minY; y <= maxY; y += step) {
        const xStart = minX + (rand() - 0.5) * roughness * 2;
        const xEnd = maxX + (rand() - 0.5) * roughness * 2;
        const y1 = y + (rand() - 0.5) * roughness;
        const y2 = y + (xEnd - xStart) * 0.2 + (rand() - 0.5) * roughness;
        lines.push(`M ${xStart.toFixed(1)},${y1.toFixed(1)} L ${xEnd.toFixed(1)},${y2.toFixed(1)}`);
      }
      return lines.join(' ');
    }
  };

  // --- 3. <iso-block-viewer> 自定義元件 ---
  class IsoBlockViewer extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._blocks = [[0, 0, 0]];
      this._view = 'iso';
      this._interactive = true;
      this._rotation = 0;
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
      const sorted = [...blocks].sort((a, b) => Isometric.depthOf(a.x, a.y, a.z) - Isometric.depthOf(b.x, b.y, b.z));
      
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
      const grid = new Set();
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

  // --- 4. <physics-lever-balance> 槓桿天平元件 ---
  class PhysicsLeverBalance extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._left = 1;
      this._right = 1;
      this._angle = 0;
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
      const diff = this._right - this._left;
      const maxAngle = 15;
      const targetAngle = Math.max(-maxAngle, Math.min(maxAngle, diff * 5));

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
          <polygon points="160,100 140,170 180,170" fill="#475569" stroke="#64748b" stroke-width="2" />
          <rect x="110" y="170" width="100" height="12" rx="4" fill="#334155" />
          <circle cx="160" cy="100" r="6" fill="#f59e0b" />
          <g id="beam-group" transform="rotate(${this._angle}, 160, 100)">
            <rect x="40" y="96" width="240" height="8" rx="3" fill="#cbd5e1" stroke="#475569" />
            <line x1="60" y1="104" x2="60" y2="140" stroke="#94a3b8" stroke-width="1.5" />
            <ellipse cx="60" cy="140" rx="28" ry="6" fill="#38bdf8" />
            <rect x="52" y="${140 - Math.min(this._left * 6, 36)}" width="16" height="${Math.min(this._left * 6, 36)}" fill="#0284c7" rx="2" />
            <text x="60" y="${135 - Math.min(this._left * 6, 36)}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">${this._left}</text>

            <line x1="260" y1="104" x2="260" y2="140" stroke="#94a3b8" stroke-width="1.5" />
            <ellipse cx="260" cy="140" rx="28" ry="6" fill="#38bdf8" />
            <rect x="252" y="${140 - Math.min(this._right * 6, 36)}" width="16" height="${Math.min(this._right * 6, 36)}" fill="#0284c7" rx="2" />
            <text x="260" y="${135 - Math.min(this._right * 6, 36)}" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">${this._right}</text>
          </g>
        </svg>
        <div class="label">左: ${this._left} vs 右: ${this._right} (${this._left === this._right ? '平衡 ⚖️' : this._left > this._right ? '左傾 ◀' : '右傾 ▶'})</div>
      `;
    }
  }

  // --- 5. <math-sketch-canvas> 手繪黑板幾何元件 (Rough.js 風格) ---
  class MathSketchCanvas extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._shapes = [
        { type: 'polygon', points: [[60, 60], [240, 60], [150, 180]], stroke: '#f59e0b', fill: '#fde68a', label: '幾何圖形' }
      ];
      this._theme = 'chalk'; // 'chalk' or 'paper'
      this._width = 320;
      this._height = 240;
    }

    static get observedAttributes() {
      return ['shapes', 'theme', 'width', 'height'];
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
      if (this.hasAttribute('shapes')) {
        try {
          const parsed = JSON.parse(this.getAttribute('shapes'));
          if (Array.isArray(parsed)) this._shapes = parsed;
        } catch (e) {
          console.warn('MathSketchCanvas: shapes JSON parse failed', e);
        }
      }
      if (this.hasAttribute('theme')) this._theme = this.getAttribute('theme');
      if (this.hasAttribute('width')) this._width = parseInt(this.getAttribute('width'), 10) || 320;
      if (this.hasAttribute('height')) this._height = parseInt(this.getAttribute('height'), 10) || 240;
    }

    render() {
      const isChalk = this._theme === 'chalk';
      const bgColor = isChalk ? '#1e293b' : '#fefefe';
      const defaultStroke = isChalk ? '#f8fafc' : '#1e293b';
      const gridColor = isChalk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
      const textColor = isChalk ? '#cbd5e1' : '#334155';

      let renderedElements = '';
      const rand = Sketchy.createRandom(42);

      this._shapes.forEach((s, idx) => {
        const stroke = s.stroke || defaultStroke;
        const fill = s.fill || 'none';
        const label = s.label || '';

        if (s.type === 'polygon' && s.points) {
          const pathD = Sketchy.polygonPaths(s.points, 1.6, rand);
          let hatchD = '';
          if (fill !== 'none') {
            hatchD = Sketchy.hatchFill(s.points, 45, 10, 1.0, rand);
          }
          renderedElements += `
            <g class="shape-group" data-idx="${idx}">
              ${hatchD ? `<path d="${hatchD}" stroke="${fill}" stroke-width="1.2" opacity="0.65" fill="none" />` : ''}
              <path d="${pathD}" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              ${label && s.points.length > 0 ? `
                <text x="${s.points[0][0]}" y="${s.points[0][1] - 8}" fill="${stroke}" font-size="12" font-weight="bold">${label}</text>
              ` : ''}
            </g>
          `;
        } else if (s.type === 'circle' && s.cx !== undefined) {
          const cx = s.cx || 160;
          const cy = s.cy || 120;
          const r = s.r || 40;
          const pathD = Sketchy.circlePath(cx, cy, r, 1.8, rand);
          renderedElements += `
            <g class="shape-group" data-idx="${idx}">
              <path d="${pathD}" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              ${label ? `
                <text x="${cx}" y="${cy - r - 8}" text-anchor="middle" fill="${stroke}" font-size="12" font-weight="bold">${label}</text>
              ` : ''}
            </g>
          `;
        } else if (s.type === 'line' && s.x1 !== undefined) {
          const pathD = Sketchy.linePath(s.x1, s.y1, s.x2, s.y2, 1.5, rand);
          renderedElements += `
            <g class="shape-group" data-idx="${idx}">
              <path d="${pathD}" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" fill="none" />
              ${label ? `
                <text x="${(s.x1+s.x2)/2}" y="${(s.y1+s.y2)/2 - 8}" text-anchor="middle" fill="${stroke}" font-size="12">${label}</text>
              ` : ''}
            </g>
          `;
        }
      });

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            font-family: system-ui, -apple-system, sans-serif;
            background: ${bgColor};
            border: 1px solid ${isChalk ? '#334155' : '#e2e8f0'};
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 8px;
            box-sizing: border-box;
          }
          .title-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 8px 6px 8px;
            font-size: 12px;
            color: ${textColor};
            border-bottom: 1px solid ${isChalk ? '#334155' : '#e2e8f0'};
            margin-bottom: 6px;
          }
          .theme-badge {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            background: ${isChalk ? '#0f172a' : '#f1f5f9'};
            color: ${isChalk ? '#94a3b8' : '#64748b'};
          }
          svg {
            display: block;
            touch-action: none;
          }
          .shape-group:hover path {
            filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.6));
            cursor: pointer;
          }
        </style>
        <div class="title-bar">
          <span>📐 手繪幾何黑板</span>
          <span class="theme-badge">${isChalk ? '黑板粉筆風' : '筆記紙墨風'}</span>
        </div>
        <svg width="${this._width}" height="${this._height}" viewBox="0 0 ${this._width} ${this._height}">
          <defs>
            <pattern id="grid-${isChalk?'c':'p'}" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${gridColor}" stroke-width="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-${isChalk?'c':'p'})" />
          ${renderedElements}
        </svg>
      `;

      this.shadowRoot.querySelectorAll('.shape-group').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.getAttribute('data-idx'), 10);
          this.dispatchEvent(new CustomEvent('shape-click', {
            detail: { index: idx, shape: this._shapes[idx] },
            bubbles: true,
            composed: true
          }));
        });
      });
    }
  }

  // --- 6. <interactive-story-card> 互動探索故事卡 (Nicky Case 風格) ---
  class InteractiveStoryCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._title = '探索：三角形的底與面積';
      this._story = '動手拉動滑桿改變「底」，觀察面積如何即時變化！';
      this._min = 1;
      this._max = 10;
      this._val = 5;
      this._heightParam = 4;
      this._unit = '公分';
    }

    static get observedAttributes() {
      return ['title', 'story', 'min', 'max', 'val', 'height-param', 'unit'];
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
      if (this.hasAttribute('title')) this._title = this.getAttribute('title');
      if (this.hasAttribute('story')) this._story = this.getAttribute('story');
      if (this.hasAttribute('min')) this._min = parseFloat(this.getAttribute('min')) || 1;
      if (this.hasAttribute('max')) this._max = parseFloat(this.getAttribute('max')) || 10;
      if (this.hasAttribute('val')) this._val = parseFloat(this.getAttribute('val')) || 5;
      if (this.hasAttribute('height-param')) this._heightParam = parseFloat(this.getAttribute('height-param')) || 4;
      if (this.hasAttribute('unit')) this._unit = this.getAttribute('unit');
    }

    render() {
      const area = (this._val * this._heightParam) / 2;
      const baseWidthPx = this._val * 22;
      const heightPx = this._heightParam * 22;

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            font-family: system-ui, -apple-system, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.25);
            max-width: 340px;
            box-sizing: border-box;
          }
          .card-header {
            font-size: 15px;
            font-weight: bold;
            color: #38bdf8;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .story-body {
            font-size: 13px;
            color: #cbd5e1;
            line-height: 1.5;
            margin-bottom: 12px;
          }
          .vis-box {
            background: #1e293b;
            border-radius: 8px;
            padding: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 140px;
            margin-bottom: 12px;
            border: 1px solid #334155;
          }
          .control-row {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            color: #94a3b8;
          }
          input[type=range] {
            flex: 1;
            accent-color: #38bdf8;
            cursor: pointer;
          }
          .result-badge {
            margin-top: 10px;
            background: rgba(56, 189, 248, 0.15);
            border: 1px solid rgba(56, 189, 248, 0.4);
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 13px;
            color: #bae6fd;
            text-align: center;
          }
          .val-highlight {
            font-weight: bold;
            color: #38bdf8;
          }
        </style>
        <div class="card-header">
          <span>💡</span> <span>${this._title}</span>
        </div>
        <div class="story-body">${this._story}</div>

        <div class="vis-box">
          <svg width="280" height="130" viewBox="0 0 280 130">
            <line x1="20" y1="110" x2="260" y2="110" stroke="#475569" stroke-width="1.5" />
            <polygon points="40,110 ${40 + baseWidthPx},110 ${40 + baseWidthPx * 0.4},${110 - heightPx}" 
                     fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" stroke-width="2" />
            <line x1="${40 + baseWidthPx * 0.4}" y1="${110 - heightPx}" x2="${40 + baseWidthPx * 0.4}" y2="110" 
                  stroke="#f59e0b" stroke-dasharray="3,3" stroke-width="1.5" />
            <text x="${40 + baseWidthPx * 0.4 + 4}" y="${110 - heightPx / 2}" fill="#f59e0b" font-size="11">高 ${this._heightParam}</text>
            <text x="${40 + baseWidthPx / 2}" y="125" text-anchor="middle" fill="#38bdf8" font-size="11" font-weight="bold">底 ${this._val} ${this._unit}</text>
          </svg>
        </div>

        <div class="control-row">
          <span>調整底長:</span>
          <input type="range" min="${this._min}" max="${this._max}" value="${this._val}" step="1" id="slider" />
          <span class="val-highlight" id="val-display">${this._val}</span>
        </div>

        <div class="result-badge">
          面積 = ${this._val} × ${this._heightParam} ÷ 2 = <strong>${area}</strong> 平方${this._unit}
        </div>
      `;

      const slider = this.shadowRoot.querySelector('#slider');
      if (slider) {
        slider.addEventListener('input', (e) => {
          this._val = parseFloat(e.target.value);
          this.render();
          this.dispatchEvent(new CustomEvent('param-change', {
            detail: { value: this._val, area: (this._val * this._heightParam) / 2 },
            bubbles: true,
            composed: true
          }));
        });
      }
    }
  }

  // --- 7. 註冊客製化標籤 ---
  if (!customElements.get('iso-block-viewer')) {
    customElements.define('iso-block-viewer', IsoBlockViewer);
  }
  if (!customElements.get('physics-lever-balance')) {
    customElements.define('physics-lever-balance', PhysicsLeverBalance);
  }
  if (!customElements.get('math-sketch-canvas')) {
    customElements.define('math-sketch-canvas', MathSketchCanvas);
  }
  if (!customElements.get('interactive-story-card')) {
    customElements.define('interactive-story-card', InteractiveStoryCard);
  }

  // 導出全局命名空間
  window.Anatomy = {
    Isometric,
    Sketchy,
    version: '1.1.0'
  };

  console.log('✅ [Anatomy 034] 教具工具櫃已成功載入 (<iso-block-viewer>, <physics-lever-balance>, <math-sketch-canvas>, <interactive-story-card>)');
})();
