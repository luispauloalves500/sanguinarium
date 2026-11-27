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
  return { Space: 'Espaço', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', ShiftLeft: 'Shift esq.', ShiftRight: 'Shift dir.', ControlLeft: 'Ctrl esq.', ControlRight: 'Ctrl dir.', Semicolon: 'Ç/;', Comma: ',', Period: '.', Slash: '/', Insert: 'Insert', Home: 'Home', End: 'End', Delete: 'Delete', PageUp: 'PgUp', PageDown: 'PgDn', Enter: 'Enter', NumpadAdd: 'Num+', NumpadSubtract: 'Num-', NumpadMultiply: 'Num*', NumpadDivide: 'Num/', NumpadEnter: 'NumEnter', NumpadDecimal: 'Num,', Backspace: 'Backspace', Tab: 'Tab' }[code] || code;
}
// v0.4: gamepad remapeável (só botões; direções ficam no analógico esquerdo + direcional)
export const PAD_ACTIONS = ['lp', 'hp', 'lk', 'hk', 'block', 'grab', 'dodge', 'special'];
export const PAD_DEFAULT = { lp: [2], hp: [3], lk: [0], hk: [1], block: [5, 7], grab: [4], dodge: [6], special: [10, 11] };
const PAD_NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Select', 'Start', 'L3', 'R3', 'D↑', 'D↓', 'D←', 'D→', 'Guia'];
export function padName(list) { return (list || []).map((i) => PAD_NAMES[i] || `B${i}`).join(' / ') || '—'; }
const DEFAULT_MAPS = [KEYMAP_P1, KEYMAP_P2];
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
    this.map1 = { ...KEYMAP_P1 }; this.map2 = { ...KEYMAP_P2 };
    this.pad = [clonePad(PAD_DEFAULT), clonePad(PAD_DEFAULT)];
    this.padCapture = null;
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
  isGameKey(code) { return code in this.map1 || code in this.map2; }
  mapOf(player) { return player === 1 ? this.map2 : this.map1; }
  // mapa de um jogador no formato { ação: código } (primeira tecla de cada ação)
  getBindings(player = 0) { const out = {}; for (const [code, a] of Object.entries(this.mapOf(player))) if (!out[a]) out[a] = code; return out; }
  setBindings(b, player = 0) {
    const def = DEFAULT_MAPS[player], map = {};
    for (const a of ACTIONS) { const code = (b && b[a]) || Object.keys(def).find((c) => def[c] === a); if (code) map[code] = a; }
    // P2: as teclas alternativas padrão (Insert/Home/…) continuam valendo se não forem usadas por outra ação
    if (player === 1) for (const [code, a] of Object.entries(def)) if (!(code in map) && (!b || !b[a] || b[a] === Object.keys(def).find((c) => def[c] === a))) map[code] = a;
    if (player === 1) this.map2 = map; else this.map1 = map;
    this.keys.clear(); this.clearQueue();
  }
  // troca a tecla de uma ação; se a tecla já era de outra ação do mesmo jogador, as duas trocam.
  // Tecla usada pelo outro jogador é recusada (retorna null) para os dois não dividirem a mesma tecla.
  rebind(action, code, player = 0) {
    const other = this.mapOf(1 - player);
    if (code in other) return null;
    const b = this.getBindings(player);
    const swap = ACTIONS.find((a) => a !== action && b[a] === code);
    if (swap) b[swap] = b[action];
    b[action] = code;
    this.setBindings(b, player);
    return this.getBindings(player);
  }
  getPad(player = 0) { return clonePad(this.pad[player]); }
  setPad(m, player = 0) { this.pad[player] = clonePad({ ...PAD_DEFAULT, ...(m || {}) }); }
  rebindPad(action, index, player = 0) {
    const m = this.pad[player];
    const swap = PAD_ACTIONS.find((a) => a !== action && m[a].includes(index)), prev = m[action][0];
    if (swap) { m[swap] = m[swap].filter((i) => i !== index); if (!m[swap].length && prev != null) m[swap] = [prev]; }
    m[action] = [index];
    return this.getPad(player);
  }
  // espera o próximo botão pressionado no gamepad do jogador (cb(índice) ou cb(null) ao cancelar/expirar)
  capturePad(player, cb, timeoutMs = 8000) {
    this.cancelPadCapture();
    const t0 = performance.now(), pressed = () => { const gp = (navigator.getGamepads ? navigator.getGamepads() : [])[player]; return gp ? gp.buttons.map((b) => b && b.pressed) : null; };
    let base = pressed();
    const cap = { cb, raf: 0 };
    const loop = () => {
      if (this.padCapture !== cap) return;
      const now = pressed();
      if (now) {
        if (!base) base = now.map(() => false);
        const i = now.findIndex((p, k) => p && !base[k]);
        if (i >= 0) { this.padCapture = null; cb(i); return; }
        base = base.map((b, k) => b && now[k]);
      }
      if (performance.now() - t0 > timeoutMs) { this.padCapture = null; cb(null); return; }
      cap.raf = requestAnimationFrame(loop);
    };
    this.padCapture = cap; cap.raf = requestAnimationFrame(loop);
  }
  cancelPadCapture() { if (this.padCapture) { cancelAnimationFrame(this.padCapture.raf); const cb = this.padCapture.cb; this.padCapture = null; cb(null); } }
  padConnected(player) { const pads = navigator.getGamepads ? navigator.getGamepads() : []; return !!(pads && pads[player]); }
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
    const m = this.pad[index] || PAD_DEFAULT;
    for (const a of PAD_ACTIONS) if (m[a].some(bt)) b |= BTN[a];
    return b;
  }
  read(player) {
    if (player === 0) {
      let b = this.bitsFromMap(this.map1) | this.touchBits | this.curLatch | this.gamepadBits(0);
      if (!this.twoPlayers) b |= this.bitsFromMap(ARROWS_P1);
      return clean(b);
    }
    return clean(this.bitsFromMap(this.map2) | this.gamepadBits(1));
  }
  menuPressed(code) { return this.keys.has(code); }
}
function clonePad(m) { const o = {}; for (const a of PAD_ACTIONS) o[a] = [...((m && m[a]) || PAD_DEFAULT[a])]; return o; }
function clean(b) {
  if ((b & BTN.left) && (b & BTN.right)) b &= ~(BTN.left | BTN.right);
  if ((b & BTN.up) && (b & BTN.down)) b &= ~BTN.up;
  return b;
}
