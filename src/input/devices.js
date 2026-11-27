// Dispositivos de entrada: teclado (2 jogadores), gamepad e controles de toque -> bits da simulação.
import { BTN } from '../combat/input.js';

export const KEYMAP_P1 = {
  KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
  KeyJ: 'lp', KeyK: 'hp', KeyU: 'lk', KeyI: 'hk', KeyL: 'block', KeyO: 'grab', Space: 'dodge', KeyP: 'special',
};
// P2: setas + teclado numérico (alternativa: Insert/Home/PageUp/Delete/End/PageDown)
export const KEYMAP_P2 = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  Numpad1: 'lp', Numpad2: 'hp', Numpad4: 'lk', Numpad5: 'hk', Numpad3: 'block', Numpad6: 'grab', Numpad0: 'dodge', NumpadAdd: 'special',
  Insert: 'lp', Home: 'hp', Delete: 'lk', End: 'hk', PageDown: 'block', PageUp: 'grab', ShiftRight: 'dodge', Enter: 'special',
};
export const ACTIONS = ['up', 'down', 'left', 'right', 'lp', 'hp', 'lk', 'hk', 'block', 'grab', 'dodge', 'special'];
export const ACTION_LABEL = { up: 'Cima', down: 'Baixo', left: 'Esquerda', right: 'Direita', lp: 'Soco rápido', hp: 'Soco forte', lk: 'Chute rápido', hk: 'Chute forte', block: 'Bloqueio', grab: 'Agarrão', dodge: 'Esquiva', special: 'Especial simplificado' };
export function keyName(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num' + code.slice(6);
  return { Space: 'Espaço', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', ShiftLeft: 'Shift esq.', ShiftRight: 'Shift dir.', ControlLeft: 'Ctrl esq.', ControlRight: 'Ctrl dir.', Semicolon: 'Ç/;', Comma: ',', Period: '.', Slash: '/' }[code] || code;
}
// No modo 1 jogador, as setas também controlam o P1
const ARROWS_P1 = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

export class InputDevices {
  constructor() {
    this.keys = new Set();
    // Fila de instantâneos do teclado: cada passo da simulação consome um, para que toques rápidos
    // e sequências de comando não se percam quando o navegador roda abaixo de 60 qps.
    this.queue = []; this.cur = this.keys;
    this.touchBits = 0; this.touchLatch = 0; this.curLatch = 0; // latch: toque curto visto em pelo menos 1 passo
    this.twoPlayers = false;
    this.map1 = { ...KEYMAP_P1 };
    this.capture = null; // remapeamento: próxima tecla vai para este callback
    this.listeners = [];
    window.addEventListener('keydown', (e) => {
      if (this.capture) { e.preventDefault(); const cb = this.capture; this.capture = null; cb(e.code); return; }
      if (e.repeat) { if (this.isGameKey(e.code)) e.preventDefault(); return; }
      this.keys.add(e.code);
      if (this.isGameKey(e.code) || e.code in ARROWS_P1) this.snap();
      if (this.isGameKey(e.code)) e.preventDefault();
      for (const l of this.listeners) l(e.code, e);
    });
    window.addEventListener('keyup', (e) => { if (this.keys.delete(e.code) && (this.isGameKey(e.code) || e.code in ARROWS_P1)) this.snap(); });
    window.addEventListener('blur', () => { this.keys.clear(); this.queue.length = 0; });
  }
  snap() {
    // teclas apertadas juntas (< 12 ms) viram um único instantâneo, para U+I, J+K etc. caírem no mesmo quadro
    const now = performance.now(), last = this.queue[this.queue.length - 1];
    if (last && now - this.lastSnap < 12 && [...last].every((k) => this.keys.has(k))) { this.queue[this.queue.length - 1] = new Set(this.keys); this.lastSnap = now; return; }
    this.lastSnap = now;
    this.queue.push(new Set(this.keys)); if (this.queue.length > 12) this.queue.splice(0, this.queue.length - 12); }
  // chamado uma vez por passo de simulação, antes de read()
  beginStep() { this.cur = this.queue.length ? this.queue.shift() : this.keys; this.curLatch = this.touchLatch; this.touchLatch = 0; }
  clearQueue() { this.queue.length = 0; this.cur = this.keys; }
  onKey(fn) { this.listeners.push(fn); }
  isGameKey(code) { return code in this.map1 || code in KEYMAP_P2; }
  // mapa do P1 no formato { ação: código }
  getBindings() { const out = {}; for (const [code, a] of Object.entries(this.map1)) if (!out[a]) out[a] = code; return out; }
  setBindings(b) {
    const map = {};
    for (const a of ACTIONS) { const code = (b && b[a]) || Object.keys(KEYMAP_P1).find((c) => KEYMAP_P1[c] === a); if (code) map[code] = a; }
    this.map1 = map; this.keys.clear(); this.clearQueue();
  }
  // troca a tecla de uma ação; se a tecla já era de outra ação, as duas trocam
  rebind(action, code) {
    const b = this.getBindings();
    const other = ACTIONS.find((a) => a !== action && b[a] === code);
    if (other) b[other] = b[action];
    b[action] = code;
    this.setBindings(b);
    return this.getBindings();
  }
  bitsFromMap(map) {
    let b = 0;
    for (const code of this.cur) { const a = map[code]; if (a) b |= BTN[a]; }
    return b;
  }
  gamepadBits(index) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && pads[index];
    if (!gp) return 0;
    let b = 0;
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, bt = (i) => gp.buttons[i] && gp.buttons[i].pressed;
    if (ax < -0.45 || bt(14)) b |= BTN.left; if (ax > 0.45 || bt(15)) b |= BTN.right;
    if (ay < -0.5 || bt(12)) b |= BTN.up; if (ay > 0.5 || bt(13)) b |= BTN.down;
    if (bt(2)) b |= BTN.lp; if (bt(3)) b |= BTN.hp; if (bt(0)) b |= BTN.lk; if (bt(1)) b |= BTN.hk;
    if (bt(5) || bt(7)) b |= BTN.block; if (bt(4)) b |= BTN.grab; if (bt(6)) b |= BTN.dodge; if (bt(10) || bt(11)) b |= BTN.special;
    return b;
  }
  read(player) {
    if (player === 0) {
      let b = this.bitsFromMap(this.map1) | this.touchBits | this.curLatch | this.gamepadBits(0);
      if (!this.twoPlayers) b |= this.bitsFromMap(ARROWS_P1);
      return clean(b);
    }
    return clean(this.bitsFromMap(KEYMAP_P2) | this.gamepadBits(1));
  }
  menuPressed(code) { return this.keys.has(code); }
}
function clean(b) {
  if ((b & BTN.left) && (b & BTN.right)) b &= ~(BTN.left | BTN.right);
  if ((b & BTN.up) && (b & BTN.down)) b &= ~BTN.up;
  return b;
}
