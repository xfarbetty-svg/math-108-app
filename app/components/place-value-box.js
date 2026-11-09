/* place-value-box.js — T-05 十進位位值盒與磁吸十條 (N-1-1 一百以內的數與位值化聚)
 * 雙艙結構：十位艙 (55%) vs 個位艙 (45%)
 * 狀態機：EMPTY_OR_PARTIAL -> FUSION_TRIGGER (300ms光暈) -> MERGED_TO_TEN (聚合為橘色十條滑移) -> COMPUTE_DISPLAY
 * 嚴格自足零依賴，IIFE。
 */
(function () {
  'use strict';

  var FUSION_MS = 300;
  var CSS = [
    ':host{display:block;font-family:system-ui,"Microsoft JhengHei","PingFang TC",sans-serif;',
    '--pvb-tens-bg:rgba(251,146,60,0.08);--pvb-tens-border:#FB923C;',
    '--pvb-ones-bg:rgba(148,163,184,0.08);--pvb-ones-border:#94A3B8;',
    '--pvb-orange:#EA580C;--pvb-gold:#F59E0B;--pvb-ink:#0F172A;}',
    '.container{display:flex;width:100%;max-width:440px;min-height:160px;margin:0 auto;',
    'background:#FFFFFF;border:2px solid #CBD5E1;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);}',
    '.pod-tens{flex:1.1;background:var(--pvb-tens-bg);border-right:2px dashed var(--pvb-tens-border);',
    'display:flex;flex-direction:column;align-items:center;padding:8px;position:relative;}',
    '.pod-ones{flex:0.9;background:var(--pvb-ones-bg);display:flex;flex-direction:column;',
    'align-items:center;padding:8px;position:relative;}',
    '.pod-label{font-size:12px;font-weight:800;margin-bottom:8px;text-align:center;}',
    '.pod-tens .pod-label{color:var(--pvb-orange);}',
    '.pod-ones .pod-label{color:#475569;}',
    '.shelf{display:flex;flex-wrap:wrap;gap:6px;width:100%;min-height:110px;',
    'justify-content:center;align-content:flex-start;}',
    '.block-one{width:22px;height:22px;border-radius:3px;background:linear-gradient(135deg,#FFF 0%,#CBD5E1 100%);',
    'border:1px solid #64748B;box-shadow:1px 1px 2px rgba(0,0,0,0.25);animation:pvb-pop 180ms ease-out both;',
    'touch-action:manipulation;cursor:pointer;}',
    '.block-one.is-fusing{animation:pvb-shake 300ms ease-in-out both;}',
    '.block-ten{width:20px;height:100px;border-radius:4px;background:#FB923C;border:1.5px solid #EA580C;',
    'display:flex;flex-direction:column;box-shadow:2px 2px 4px rgba(0,0,0,0.2);animation:pvb-slide-in 260ms ease-out both;}',
    '.block-ten-cell{flex:1;border-bottom:1px solid rgba(234,88,12,0.4);box-sizing:border-box;}',
    '.block-ten-cell:last-child{border-bottom:none;}',
    '@keyframes pvb-pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}',
    '@keyframes pvb-shake{',
    '0%,100%{transform:translateX(0);box-shadow:0 0 0 0 rgba(245,158,11,0)}',
    '25%{transform:translateX(-3px);box-shadow:0 0 12px 4px rgba(245,158,11,0.9)}',
    '75%{transform:translateX(3px);box-shadow:0 0 12px 4px rgba(245,158,11,0.9)}}',
    '@keyframes pvb-slide-in{from{transform:translateX(40px) scale(0.9);opacity:0}to{transform:translateX(0) scale(1);opacity:1}}',
    '.readout{width:100%;text-align:center;font-size:13px;font-weight:700;color:var(--pvb-ink);padding:6px 0;background:#F8FAFC;border-top:1px solid #E2E8F0;}',
    '@media (prefers-reduced-motion:reduce){.block-one,.block-ten,.block-one.is-fusing{animation:none!important;}}'
  ].join('');

  class PlaceValueBox extends HTMLElement {
    static get observedAttributes() {
      return ['tens', 'ones', 'interactive'];
    }

    constructor() {
      super();
      this._tens = 0;
      this._ones = 0;
      this._fusing = false;
      this._updating = false;
      this._root = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      if (!this._built) {
        this._build();
        this._built = true;
      }
      this._syncAttributes();
      this._render();
    }

    disconnectedCallback() {
      // 保留容器參照，確保生命週期對稱不爆 TypeError
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (this._updating || oldVal === newVal) return;
      this._syncAttributes();
      if (this._built) this._render();
    }

    _syncAttributes() {
      var t = Number(this.getAttribute('tens'));
      this._tens = Number.isFinite(t) ? Math.min(9, Math.max(0, Math.round(t))) : 0;
      var o = Number(this.getAttribute('ones'));
      this._ones = Number.isFinite(o) ? Math.min(10, Math.max(0, Math.round(o))) : 0;
    }

    _build() {
      var style = document.createElement('style');
      style.textContent = CSS;
      this._root.appendChild(style);

      var wrap = document.createElement('div');
      wrap.style.width = '100%';

      var box = document.createElement('div');
      box.className = 'container';

      // 十位艙
      var pTens = document.createElement('div');
      pTens.className = 'pod-tens';
      var lTens = document.createElement('div');
      lTens.className = 'pod-label';
      lTens.textContent = '十位 (十條)';
      pTens.appendChild(lTens);
      this._shelfTens = document.createElement('div');
      this._shelfTens.className = 'shelf';
      pTens.appendChild(this._shelfTens);

      // 個位艙
      var pOnes = document.createElement('div');
      pOnes.className = 'pod-ones';
      var lOnes = document.createElement('div');
      lOnes.className = 'pod-label';
      lOnes.textContent = '個位 (積木)';
      pOnes.appendChild(lOnes);
      this._shelfOnes = document.createElement('div');
      this._shelfOnes.className = 'shelf';
      pOnes.appendChild(this._shelfOnes);

      box.appendChild(pTens);
      box.appendChild(pOnes);

      // 算理指示列
      this._readout = document.createElement('div');
      this._readout.className = 'readout';

      wrap.appendChild(box);
      wrap.appendChild(this._readout);
      this._root.appendChild(wrap);
    }

    _render() {
      if (!this._shelfTens || !this._shelfOnes) return;

      this._shelfTens.replaceChildren();
      for (var i = 0; i < this._tens; i++) {
        var t = document.createElement('div');
        t.className = 'block-ten';
        for (var j = 0; j < 10; j++) {
          var c = document.createElement('div');
          c.className = 'block-ten-cell';
          t.appendChild(c);
        }
        this._shelfTens.appendChild(t);
      }

      this._shelfOnes.replaceChildren();
      for (var k = 0; k < Math.min(10, this._ones); k++) {
        var o = document.createElement('div');
        o.className = 'block-one' + (this._fusing ? ' is-fusing' : '');
        this._shelfOnes.appendChild(o);
      }

      var displayTotal = this._tens * 10 + (this._ones === 10 ? 10 : this._ones);
      this._readout.textContent = this._tens + ' 個十 ＋ ' + this._ones + ' 個一 ＝ ' + displayTotal;
      this.setAttribute('aria-label', '位值盒：' + displayTotal);
    }

    // 公開 API
    setValue(tens, ones) {
      this._updating = true;
      this._fusing = false;
      this._tens = Math.min(9, Math.max(0, Math.round(Number(tens) || 0)));
      this._ones = Math.min(10, Math.max(0, Math.round(Number(ones) || 0)));
      this.setAttribute('tens', this._tens);
      this.setAttribute('ones', this._ones);
      this._updating = false;
      this._render();
      this._emitChange();
    }

    addOne() {
      if (this._fusing) return;
      if (this._ones < 9) {
        this._updating = true;
        this._ones++;
        this.setAttribute('ones', this._ones);
        this._updating = false;
        this._render();
        this._emitChange();
      } else {
        // 滿十聚合觸發
        this._fusing = true;
        this._ones = 10;
        this._render();

        var self = this;
        setTimeout(function () {
          self._updating = true;
          self._tens++;
          self._ones = 0;
          self.setAttribute('tens', self._tens);
          self.setAttribute('ones', 0);
          self._updating = false;
          self._fusing = false;
          self._render();
          self.dispatchEvent(new CustomEvent('place-value:fusion', {
            detail: { tens: self._tens, ones: 0, total: self._tens * 10 },
            bubbles: true,
            composed: true
          }));
          self._emitChange();
        }, FUSION_MS);
      }
    }

    reset() {
      this.setValue(0, 0);
    }

    getValue() {
      return { tens: this._tens, ones: this._ones, total: this._tens * 10 + this._ones };
    }

    _emitChange() {
      this.dispatchEvent(new CustomEvent('place-value:change', {
        detail: this.getValue(),
        bubbles: true,
        composed: true
      }));
    }
  }

  if (!customElements.get('place-value-box')) {
    customElements.define('place-value-box', PlaceValueBox);
  }
})();
