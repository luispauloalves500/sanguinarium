// IA da CPU: lê apenas estados observáveis da partida (posições, estado/animação do oponente,
// projéteis) com tempo de reação e margem de erro por dificuldade. Não lê os comandos do jogador.
import { BTN } from '../combat/input.js';
import { makeRng } from '../core/rng.js';
import { interactionFor } from '../combat/arena.js';

export const DIFFICULTIES = ['Fácil', 'Normal', 'Difícil', 'Pesadelo', 'Infernal'];
const P = {
  reaction: [26, 16, 10, 6, 3],
  block: [0.12, 0.38, 0.6, 0.76, 0.9],
  antiAir: [0.05, 0.25, 0.5, 0.7, 0.86],
  combo: [0.15, 0.45, 0.75, 0.9, 1],
  punish: [0.1, 0.35, 0.6, 0.82, 0.95],
  breaker: [0, 0.08, 0.25, 0.45, 0.65],
  fatal: [0.5, 0.8, 1, 1, 1],
  special: [0.25, 0.45, 0.6, 0.7, 0.8],
  idle: [0.4, 0.22, 0.12, 0.06, 0.02],
};

export class CpuController {
  constructor(idx, difficulty = 1, seed = 1234) {
    this.idx = idx; this.d = Math.max(0, Math.min(4, difficulty)); this.rng = makeRng(seed + idx * 7919);
    this.plan = []; this.wait = 0; this.hold = 0; this.lastDecision = -99; this.fatalTried = false;
  }
  p(k) { return P[k][this.d]; }

  next(match) {
    const me = match.fighters[this.idx], op = match.fighters[1 - this.idx];
    if (match.phase === 'finish') return this.finish(match, me, op);
    if (match.phase !== 'fight') { this.plan.length = 0; this.fatalTried = false; return 0; }
    if (this.plan.length) {
      const step = this.plan[0];
      if (--step.n <= 0) this.plan.shift();
      return this.abs(me, step.bits);
    }
    if (match.frame - this.lastDecision < this.p('reaction') * (0.6 + this.rng() * 0.8)) return this.abs(me, this.hold);
    this.lastDecision = match.frame;
    this.decide(match, me, op);
    return this.abs(me, this.hold);
  }

  // bits relativos (fwd/back) -> absolutos
  abs(me, rel) {
    let out = rel & ~(BTN.left | BTN.right);
    const fwd = rel & BTN.right, back = rel & BTN.left; // em rel: right = frente, left = trás
    if (fwd) out |= me.facing > 0 ? BTN.right : BTN.left;
    if (back) out |= me.facing > 0 ? BTN.left : BTN.right;
    return out;
  }
  digitBits(d) {
    let b = 0;
    if (d <= 3) b |= BTN.down; if (d >= 7) b |= BTN.up;
    if (d % 3 === 0) b |= BTN.right; if (d % 3 === 1) b |= BTN.left;
    return b;
  }
  push(bits, n = 1) { this.plan.push({ bits, n }); }
  motion(seq, btnBits) {
    for (let i = 0; i < seq.length; i++) {
      const d = seq[i], next = seq[i + 1];
      if (i > 0 && seq[i - 1] === d) this.push(0, 2);
      this.push(this.digitBits(d), 2);
      if (next && ((d === 2 && next === 6) || (d === 6 && next === 2))) this.push(this.digitBits(3), 1);
      if (next && ((d === 2 && next === 4) || (d === 4 && next === 2))) this.push(this.digitBits(1), 1);
    }
    this.push(this.digitBits(seq[seq.length - 1]) | btnBits, 1);
    this.push(0, 3);
  }
  special(me, id) {
    const s = me.ch.specials.find((x) => x.move === id);
    if (!s) return;
    const btn = s.cmd.btn === 'P' ? (this.rng() < 0.5 ? BTN.lp : BTN.hp) : (this.rng() < 0.5 ? BTN.lk : BTN.hk);
    this.motion(s.cmd.motion, btn);
    if (me.meter >= 100 && this.d >= 2 && this.rng() < 0.25) { this.push(BTN.lp | BTN.hp, 1); this.push(0, 2); }
  }
  combo(me) {
    const list = me.ch.combos.filter((c) => !c.seq.some((x) => me.ch.specials.find((s) => s.move === x)) || this.d >= 2);
    const c = this.rng.pick(list);
    const full = this.rng() < this.p('combo');
    const n = full ? c.seq.length : 1;
    for (let i = 0; i < n; i++) {
      const id = c.seq[i];
      const sp = me.ch.specials.find((s) => s.move === id);
      if (sp) { this.special(me, id); break; }
      const base = id.replace(/2$/, '').replace(/^c/, '');
      const crouch = id.startsWith('c') ? BTN.down : 0;
      this.push(crouch | BTN[base], 1);
      const m = me.ch.moves[id];
      const wait = m.hits.length ? m.hits[0].f0 + 4 : 8;
      this.push(crouch, wait);
    }
  }

  decide(match, me, op) {
    const r = this.rng;
    const dist = Math.abs(op.x - me.x);
    const prof = me.ch.ai;
    this.hold = 0;
    // quebra de combo
    if (me.state === 'hitstun' && me.comboHits >= 2 && me.meter >= 200 && r() < this.p('breaker')) {
      this.push(BTN.dodge | BTN.block, 1); this.push(0, 2); return;
    }
    if (!['idle', 'walk', 'crouch', 'blockstun', 'land'].includes(me.state)) { this.hold = me.blocking ? BTN.block : 0; return; }
    // ameaças observáveis
    const opAtk = op.move && op.state === 'attack' && op.move.hits.length && op.mf <= op.move.hits[op.move.hits.length - 1].f1;
    const reach = opAtk ? op.move.hits[0].box[2] + 0.6 : 0;
    const proj = match.projectiles.find((p) => p.owner === op.idx && Math.sign(me.x - p.x) === Math.sign(p.vx || (me.x - p.x)) && Math.abs(me.x - p.x) < 3.2);
    if ((opAtk && dist < reach) || proj || (op.state === 'air' && op.move && dist < 2.2)) {
      if (r() < this.p('block')) {
        const lvl = proj ? proj.hit.level : opAtk ? op.move.hits[0].level : 'overhead';
        const errorRoll = r() < 0.15 + 0.05 * (4 - this.d);
        let low = lvl === 'low';
        if (errorRoll) low = !low;
        this.hold = BTN.block | (low ? BTN.down : 0);
        return;
      }
      if (proj && r() < 0.3) { this.push(BTN.up | BTN.right, 2); this.push(0, 30); return; }
      if (opAtk && prof.counter && r() < 0.05 * this.d) { this.special(me, prof.counter); return; }
    }
    // antiaéreo
    if (op.airborne && op.vy < 0.08 && dist < 2.4 && prof.antiAir && r() < this.p('antiAir') * 0.5) { this.special(me, prof.antiAir); return; }
    if (op.airborne && op.vy < 0.08 && dist < 2.4 && r() < this.p('antiAir')) {
      this.push(BTN.down, 3); this.push(BTN.down | BTN.hp, 1); this.push(BTN.down, 6); return;
    }
    // punição de golpe em recuperação
    const recovering = op.move && op.state === 'attack' && op.move.hits.length && op.mf > op.move.hits[op.move.hits.length - 1].f1;
    if (recovering && dist < 1.6 && r() < this.p('punish')) { this.combo(me); return; }
    if (op.state === 'frozen' && dist < 1.6) { this.combo(me); return; }
    if (op.state === 'knockdown' || op.state === 'getup') { this.hold = dist > prof.preferred ? BTN.right : 0; return; }
    if (r() < this.p('idle')) { this.hold = 0; return; }
    // elementos da arena quando encurralado (Corrente do Muro / Estátua do Carrasco)
    const it = this.d >= 1 ? interactionFor(match.stage, me) : null;
    if (it && ((it.kind === 'vault' && dist < 2.4) || (it.kind === 'statue' && dist < 3.2 && !op.blocking) || (it.kind === 'swing' && dist < 2.8 && !op.blocking) || (it.kind === 'spirit' && dist > 1.6 && !op.blocking)) && r() < 0.3) { this.push(BTN.up | BTN.grab, 2); this.push(0, 8); return; }
    // supergolpe
    if (me.meter >= 200 && dist < (me.ch.superRange || 2.4) && r() < 0.35) { const alt = r() < 0.5; if (alt) this.push(BTN.down, 2); this.push(BTN.lk | BTN.hk | (alt ? BTN.down : 0), 1); this.push(0, 3); return; }
    // fúria
    if (me.fury >= 100 && !me.furyActive && r() < 0.5) { this.push(BTN.block | BTN.grab, 1); this.push(0, 3); return; }
    if (me.charId === 'lilith' && me.hp < 450 && me.regenUses > 0 && dist > 3.5 && r() < 0.4) { this.special(me, 'regen'); return; }
    if (dist < 1.1 && (op.blocking || op.state === 'blockstun') && r() < 0.45) { this.push(BTN.grab, 1); this.push(0, 4); return; }
    if (prof.grabs && dist < 1.3 && r() < ((op.blocking || op.state === 'blockstun') ? 0.12 + 0.06 * this.d : 0.12)) { this.special(me, r.pick(prof.grabs)); return; }
    if (dist < 1.5) {
      const roll = r();
      if (roll < 0.62) this.combo(me);
      else if (roll < 0.72) { this.push(BTN.down | BTN.hk, 1); this.push(BTN.down, 10); }
      else if (roll < 0.8) { this.push(BTN.grab, 1); this.push(0, 4); }
      else if (roll < 0.9) { this.push(BTN.left, 14); }
      else this.special(me, r.pick(prof.close || prof.specials.slice(1, 6)));
      return;
    }
    if (r() < this.p('special') * prof.zoning && dist > 2.0) {
      const longRange = prof.long || prof.specials.filter((id) => ['machado', 'lanca', 'ruptura', 'chuva', 'prisao', 'clone', 'corrente', 'passo', 'garra', 'espinhos', 'teleporte'].includes(id));
      let pick = r.pick(longRange);
      if (pick === 'corrente' && dist > 3.4) pick = 'machado';
      if (pick === 'garra' && dist > 2.6) pick = 'lanca';
      if (pick === 'espinhos' && Math.abs(dist - 2.3) > 0.8) pick = 'lanca';
      this.special(me, pick); return;
    }
    if (dist > prof.preferred + 0.4) {
      if (r() < 0.12 * prof.aggression) { this.push(BTN.up | BTN.right, 2); this.push(0, 14); const b = r() < 0.5 ? BTN.hk : BTN.hp; this.push(b, 1); this.push(0, 20); return; }
      this.hold = BTN.right; return;
    }
    if (dist < prof.preferred - 0.8 && prof.zoning > 0.5 && r() < 0.5) { this.hold = BTN.left; return; }
    this.hold = r() < prof.aggression ? BTN.right : (r() < 0.3 ? BTN.block : 0);
  }

  finish(match, me, op) {
    if (match.finishWinner !== this.idx) return 0;
    if (this.plan.length) { const s = this.plan[0]; if (--s.n <= 0) this.plan.shift(); return this.abs(me, s.bits); }
    if (!this.fatalChoice) {
      this.fatalChoice = this.rng() < this.p('fatal') ? this.rng.pick(me.ch.fatalities) : 'none';
    }
    if (this.fatalChoice === 'none') {
      if (match.pf < 120) return 0;
      // golpe final simples
      const dist = Math.abs(op.x - me.x);
      return this.abs(me, dist > 1.2 ? BTN.right : (match.frame % 6 === 0 ? BTN.hk : 0));
    }
    const fat = this.fatalChoice;
    const dist = Math.abs(op.x - me.x);
    const [lo, hi] = fat.range;
    const target = lo + (Math.min(hi, 4) - lo) * 0.4;
    if (match.pf < 40) return 0;
    if (Math.abs(dist - target) > 0.3 && match.pf < 260) return this.abs(me, dist > target ? BTN.right : BTN.left);
    if (this.fatalTried && match.pf % 40 !== 0) return 0;
    this.fatalTried = true;
    this.motion(fat.motion, BTN[fat.btn]);
    return 0;
  }
}
