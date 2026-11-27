// Bits de entrada, histórico e detecção de comandos direcionais.
// Direções relativas em notação numérica: 6 = frente, 4 = trás, 2 = baixo, 8 = cima.
export const BTN = {
  up: 1, down: 2, left: 4, right: 8,
  lp: 16, hp: 32, lk: 64, hk: 128,
  block: 256, grab: 512, dodge: 1024, special: 2048,
};
export const ATTACK_BTNS = ['lp', 'hp', 'lk', 'hk'];

export function dirDigit(bits, facing) {
  const fwd = facing >= 0 ? BTN.right : BTN.left;
  const back = facing >= 0 ? BTN.left : BTN.right;
  const h = (bits & fwd) && !(bits & back) ? 1 : (bits & back) && !(bits & fwd) ? -1 : 0;
  const v = (bits & BTN.up) && !(bits & BTN.down) ? 1 : (bits & BTN.down) && !(bits & BTN.up) ? -1 : 0;
  return 5 + h + v * 3;
}

// um dígito do comando casa com diagonais vizinhas (ex.: '2' aceita 1/2/3)
export function digitMatches(want, got) {
  switch (want) {
    case 2: return got === 1 || got === 2 || got === 3;
    case 8: return got === 7 || got === 8 || got === 9;
    case 6: return got === 3 || got === 6 || got === 9;
    case 4: return got === 1 || got === 4 || got === 7;
    default: return want === got;
  }
}

const HIST = 64;

export class InputBuffer {
  constructor() { this.bits = []; this.digits = []; this.total = 0; }
  reset() { this.bits.length = 0; this.digits.length = 0; this.total = 0; }
  push(bits, facing) {
    this.total++;
    this.bits.push(bits | 0);
    this.digits.push(dirDigit(bits, facing));
    if (this.bits.length > HIST) { this.bits.shift(); this.digits.shift(); }
  }
  // re-calcula dígitos quando o lutador troca de lado (comandos invertem)
  refacing(facing) {
    for (let i = 0; i < this.bits.length; i++) this.digits[i] = dirDigit(this.bits[i], facing);
  }
  cur() { return this.bits.length ? this.bits[this.bits.length - 1] : 0; }
  held(name) { return (this.cur() & BTN[name]) !== 0; }
  heldDigit() { return this.digits.length ? this.digits[this.digits.length - 1] : 5; }
  // borda de pressionamento i quadros atrás (0 = este quadro)
  edgeAt(name, i) {
    const n = this.bits.length, k = n - 1 - i;
    if (k < 0) return false;
    const b = BTN[name];
    const prev = k > 0 ? this.bits[k - 1] : 0;
    return (this.bits[k] & b) !== 0 && (prev & b) === 0;
  }
  pressed(name) { return this.edgeAt(name, 0); }
  // borda nos últimos 'frames' quadros, posterior ao índice absoluto 'after' (entrada já consumida)
  pressedBuf(name, frames, after = -1) {
    for (let i = 0; i < frames; i++) if (this.total - 1 - i > after && this.edgeAt(name, i)) return true;
    return false;
  }
  pressedWithin(name, frames) {
    for (let i = 0; i < frames; i++) if (this.edgeAt(name, i)) return true;
    return false;
  }
  // Detecta sequência direcional (ex.: [2,6]) dentro de 'window' quadros,
  // terminando no máximo 'lateness' quadros antes do presente.
  motion(seq, window = 16, lateness = 6) {
    const n = this.digits.length;
    if (!n) return false;
    const start = Math.max(0, n - window);
    // comprime em execuções (runs) de dígitos distintos, do mais recente ao mais antigo
    const runs = [];
    for (let i = n - 1; i >= start; i--) {
      const d = this.digits[i];
      if (!runs.length || runs[runs.length - 1].d !== d) runs.push({ d, end: i });
    }
    let k = seq.length - 1;
    for (let r = 0; r < runs.length && k >= 0; r++) {
      const run = runs[r];
      if (k === seq.length - 1 && n - 1 - run.end > lateness) return false;
      if (digitMatches(seq[k], run.d)) {
        // dígitos repetidos (ex.: 2,2) exigem uma execução diferente entre eles
        k--;
        if (k >= 0 && seq[k] === seq[k + 1]) {
          // pula até encontrar uma execução que não case
          let r2 = r + 1;
          while (r2 < runs.length && digitMatches(seq[k], runs[r2].d)) r2++;
          r = r2 - 1;
          if (r2 >= runs.length) return false;
        }
      }
    }
    return k < 0;
  }
}
