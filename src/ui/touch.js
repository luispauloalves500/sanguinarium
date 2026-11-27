// Controles de toque: direcional virtual (8 direções) + botões com multitoque.
import { BTN } from '../combat/input.js';

export class TouchControls {
  constructor(devices) {
    this.dev = devices;
    this.el = document.getElementById('touch');
    this.stick = document.getElementById('stick'); this.knob = document.getElementById('knob');
    this.dirBits = 0; this.btnBits = 0; this.stickId = null; this.btnTouches = new Map(); this.downAt = new Map();
    this.stick.addEventListener('pointerdown', (e) => { e.preventDefault(); this.stickId = e.pointerId; this.stick.setPointerCapture(e.pointerId); this.moveStick(e); });
    this.stick.addEventListener('pointermove', (e) => { if (e.pointerId === this.stickId) this.moveStick(e); });
    const endStick = (e) => { if (e.pointerId === this.stickId) { this.stickId = null; this.dirBits = 0; this.knob.style.transform = ''; this.sync(); } };
    this.stick.addEventListener('pointerup', endStick); this.stick.addEventListener('pointercancel', endStick);
    for (const b of this.el.querySelectorAll('.tbtns button')) {
      const bit = BTN[b.dataset.b];
      // toques muito rápidos (< 3 quadros) são mantidos por um instante para a simulação a 60 Hz enxergá-los
      const MIN_HOLD = 55;
      const down = (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); this.btnTouches.set(e.pointerId, bit); this.dev.touchLatch |= bit | this.dirBits; this.downAt.set(e.pointerId, performance.now()); b.classList.add('on'); this.sync(); if (navigator.vibrate) navigator.vibrate(8); };
      const release = (id) => { this.btnTouches.delete(id); this.downAt.delete(id); b.classList.remove('on'); this.sync(); };
      const up = (e) => { const id = e.pointerId; const held = performance.now() - (this.downAt.get(id) ?? 0); if (held < MIN_HOLD) setTimeout(() => release(id), MIN_HOLD - held); else release(id); };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }
  moveStick(e) {
    const r = this.stick.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const max = r.width * 0.4, len = Math.hypot(dx, dy);
    if (len > max) { dx *= max / len; dy *= max / len; }
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const dead = r.width * 0.12;
    let bits = 0;
    if (len > dead) {
      const a = Math.atan2(-dy, dx); // 0 = direita
      const oct = Math.round(a / (Math.PI / 4));
      const map = { 0: BTN.right, 1: BTN.right | BTN.up, 2: BTN.up, 3: BTN.up | BTN.left, 4: BTN.left, '-4': BTN.left, '-3': BTN.down | BTN.left, '-2': BTN.down, '-1': BTN.down | BTN.right };
      bits = map[oct] || 0;
    }
    this.dirBits = bits; this.sync();
  }
  sync() {
    let b = this.dirBits;
    for (const v of this.btnTouches.values()) b |= v;
    this.dev.touchBits = b;
  }
  show(on) { this.el.classList.toggle('hidden', !on); if (!on) { this.dirBits = 0; this.btnTouches.clear(); this.sync(); } }
  setAlpha(low) { this.el.classList.toggle('lowalpha', low); }
}
