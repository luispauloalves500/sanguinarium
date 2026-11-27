// Simulação determinística da luta (60 Hz). Sem dependência de renderização.
import * as C from '../core/constants.js';
import { CHARACTERS, getMove } from './moves.js';
import { InputBuffer } from './input.js';
import { worldBox, overlap, hurtboxes, pushbox } from '../hitboxes/boxes.js';
import { createStage, resetStageRound, tryInteract, updateVault, stepStage, afterHit, stepTransition } from './arena.js';

const NEUTRAL = new Set(['idle', 'walk', 'crouch']);
const BTN_ORDER = ['hk', 'hp', 'lk', 'lp'];

export function baseBtn(id) {
  const m = /^(c|j)?(lp|hp|lk|hk)2?$/.exec(id);
  return m ? m[2] : null;
}

export function createFighter(idx, charId) {
  const ch = CHARACTERS[charId];
  if (!ch) throw new Error('Lutador inexistente: ' + charId);
  return {
    idx, charId, ch, x: 0, y: 0, vx: 0, vy: 0, pushV: 0, facing: idx === 0 ? 1 : -1,
    hp: C.MAX_HP, meter: 0, fury: 0, furyActive: 0, wins: 0,
    state: 'idle', sf: 0, move: null, mf: 0, hitsDone: 0, connected: false, ex: false,
    hitstun: 0, blockstun: 0, frozen: 0, kdTimer: 0, invuln: 0, hidden: false,
    crouching: false, blocking: false, airborne: false, airUsed: false, jumpDir: 0,
    juggle: 0, juggleProt: false, comboHits: 0, comboDmg: 0, lastBlockEdge: -99,
    regenUses: C.REGEN_USES, healAcc: 0, poison: 0, poisonBy: -1, frozenIce: false, used: -1, inp: new InputBuffer(), stats: { hits: 0, maxCombo: 0, dmg: 0, blocks: 0, specials: 0 },
  };
}

export class Match {
  constructor(opts = {}) {
    this.opts = { p1: 'varkhan', p2: 'lilith', arena: 'coliseu', training: false, timer: C.ROUND_TIME, hazards: true, ...opts };
    this.stage = createStage(this.opts.arena, this.opts.hazards);
    this.frame = 0; this.round = 1; this.events = [];
    this.fighters = [createFighter(0, this.opts.p1), createFighter(1, this.opts.p2)];
    this.result = null; this.finishWinner = -1;
    this.resetRound();
  }

  emit(e) {
    e.frame = this.frame; this.events.push(e);
    if (this.events.length > 800) this.events.splice(0, this.events.length - 800);
  }
  drainEvents() { const e = this.events; this.events = []; return e; }
  setPhase(p) { this.phase = p; this.pf = 0; this.emit({ type: 'phase', phase: p, round: this.round }); }

  resetRound() {
    const [a, b] = this.fighters;
    for (const f of this.fighters) {
      Object.assign(f, {
        y: 0, vx: 0, vy: 0, pushV: 0, hp: C.MAX_HP, fury: 0, furyActive: 0, state: 'idle', sf: 0, move: null, mf: 0,
        hitstun: 0, blockstun: 0, frozen: 0, kdTimer: 0, invuln: 0, hidden: false, crouching: false, blocking: false,
        airborne: false, airUsed: false, juggle: 0, juggleProt: false, comboHits: 0, comboDmg: 0, regenUses: C.REGEN_USES, healAcc: 0,
        poison: 0, poisonBy: -1, frozenIce: false, swing: null,
      });
      f.inp.reset(); f.used = -1;
    }
    a.x = -C.START_GAP; b.x = C.START_GAP; a.facing = 1; b.facing = -1;
    resetStageRound(this.stage);
    this.projectiles = []; this.cine = null; this.fatal = null; this.hitstop = 0;
    this.timer = this.opts.timer; this.timerAcc = 0; this.koLoser = -1;
    this.setPhase('intro');
  }

  isMatchOver() { return this.phase === 'matchEnd'; }

  // ---------------------------------------------------------------- passo principal
  step(inputs = [0, 0]) {
    this.frame++; this.pf++;
    const F = this.fighters;
    const control = this.phase === 'fight' || this.phase === 'finish';
    for (const f of F) {
      let bits = control ? (inputs[f.idx] | 0) : 0;
      if (this.phase === 'finish' && f.idx !== this.finishWinner) bits = 0;
      f.inp.push(bits, f.facing);
    }
    if (this.phase === 'intro') {
      for (const f of F) f.sf++;
      if (this.pf >= C.INTRO_FRAMES) this.setPhase('fight');
      return;
    }
    if (this.phase === 'fatality') {
      this.fatal.f++;
      if (this.fatal.f >= this.fatal.dur) this.endMatch(this.fatal.att, this.fatal.id);
      return;
    }
    if (this.phase === 'transition') { stepTransition(this); return; }
    if (this.cine) { this.updateCine(); return; }
    if (this.hitstop > 0) { this.hitstop--; return; }

    const [a, b] = F;
    const px = [a.x, b.x];
    this.updateFighter(a, b);
    this.updateFighter(b, a);
    for (const f of F) this.physics(f);
    this.constrain(px);
    for (const f of F) this.updateFacing(f, F[1 - f.idx]);
    this.updateProjectiles();
    stepStage(this);
    this.collide();
    this.tickPoison();
    this.rules();
  }

  // v0.4 (Pestilus): veneno — dano contínuo pequeno; nunca nocauteia sozinho (para em 1 de vida)
  tickPoison() {
    for (const f of this.fighters) {
      if (!(f.poison > 0)) continue;
      f.poison--;
      if (f.poison % 15 === 0 && f.hp > 1 && this.phase === 'fight') {
        const d = Math.min(C.POISON_TICK, f.hp - 1);
        f.hp -= d;
        const att = this.fighters[f.poisonBy] || this.fighters[1 - f.idx];
        att.stats.dmg += d;
        this.emit({ type: 'poison', who: f.idx, x: f.x, dmg: d, left: f.poison });
      }
    }
  }

  // ---------------------------------------------------------------- lutador
  updateFighter(f, o) {
    f.sf++;
    if (f.invuln > 0) f.invuln--;
    if (f.furyActive > 0 && --f.furyActive === 0) { f.fury = 0; this.emit({ type: 'furyEnd', who: f.idx }); }
    switch (f.state) {
      case 'hitstun':
        if (this.tryBreaker(f, o)) break;
        if (--f.hitstun <= 0) this.toNeutral(f);
        break;
      case 'blockstun':
        f.crouching = f.inp.heldDigit() <= 3 && f.inp.held('block') ? true : f.crouching;
        if (--f.blockstun <= 0) this.toNeutral(f);
        break;
      case 'frozen':
        if (--f.frozen <= 0) this.toNeutral(f);
        break;
      case 'knockdown':
        if (--f.kdTimer <= 0) { f.state = 'getup'; f.sf = 0; }
        break;
      case 'getup': if (f.sf >= C.GETUP_FRAMES) this.toNeutral(f); break;
      case 'dodge': if (f.sf >= C.DODGE_FRAMES) this.toNeutral(f); else if (f.sf >= C.DODGE_INVULN[0] && f.sf <= C.DODGE_INVULN[1]) f.invuln = Math.max(f.invuln, 1); break;
      case 'vault': updateVault(this, f); break;
      case 'jumpsquat':
        if (f.sf <= 3 && tryInteract(this, f, o)) break;
        if (f.sf >= C.JUMP_SQUAT) {
          f.state = 'air'; f.sf = 0; f.airborne = true; f.airUsed = false;
          f.vy = C.JUMP_VY; f.vx = f.jumpDir * f.ch.jumpVX;
          this.emit({ type: 'jump', who: f.idx });
        }
        break;
      case 'air':
        if (f.move) this.advanceMove(f, o);
        else if (!f.airUsed) {
          const btn = this.pressedAttack(f);
          if (btn) { this.startMove(f, 'j' + btn); f.airUsed = true; }
        }
        break;
      case 'land': if (f.sf >= C.LAND_RECOVERY) this.toNeutral(f); break;
      case 'attack': this.advanceMove(f, o); break;
      case 'throw': this.updateThrow(f, o); break;
      case 'thrown': case 'dizzy': case 'dead': case 'win': case 'cinematic': case 'juggle': break;
      default: this.neutral(f, o);
    }
  }

  toNeutral(f) {
    const down = f.inp.heldDigit() <= 3;
    f.state = down ? 'crouch' : 'idle'; f.crouching = down; f.sf = 0;
    f.move = null; f.hidden = false; f.vx = 0; f.hitstun = 0; f.blockstun = 0;
    if (f.comboHits > 0) f.stats.maxComboTaken = Math.max(f.stats.maxComboTaken || 0, f.comboHits);
    f.comboHits = 0; f.comboDmg = 0; f.juggle = 0; f.juggleProt = false;
  }

  neutral(f, o) {
    const I = f.inp;
    if (I.pressed('block')) f.lastBlockEdge = this.frame;
    f.blocking = false;
    if (this.tryActions(f, o)) return;
    const d = I.heldDigit();
    const down = d <= 3, up = d >= 7;
    if (I.held('block')) {
      f.blocking = true; f.crouching = down; f.state = down ? 'crouch' : 'idle'; f.vx = 0; return;
    }
    if (up) {
      f.state = 'jumpsquat'; f.sf = 0; f.crouching = false; f.vx = 0;
      f.jumpDir = (d === 9 ? 1 : d === 7 ? -1 : 0) * f.facing; return;
    }
    if (down) { if (f.state !== 'crouch') f.sf = 0; f.state = 'crouch'; f.crouching = true; f.vx = 0; return; }
    f.crouching = false;
    const boost = f.furyActive ? 1.12 : 1;
    if (d === 6) { f.state = 'walk'; f.vx = f.facing * f.ch.walkF * boost; }
    else if (d === 4) { f.state = 'walk'; f.vx = -f.facing * f.ch.walkB * boost; }
    else { f.state = 'idle'; f.vx = 0; }
  }

  // pressionamento com buffer (ignora entradas já consumidas por uma ação)
  pb(f, name, n = 4) { return f.inp.pressedBuf(name, n, f.used); }
  consume(f) { f.used = f.inp.total - 1; }
  pressedAttack(f, n = 4) {
    for (const b of BTN_ORDER) if (this.pb(f, b, n)) return b;
    return null;
  }

  tryActions(f, o) {
    const I = f.inp;
    if (this.phase === 'finish' && this.finishWinner === f.idx) {
      const fat = this.checkFatality(f, o);
      if (fat) { this.startFatality(f, o, fat); return true; }
    }
    if (f.fury >= C.FURY_MAX && !f.furyActive && I.pressedWithin('block', 3) && I.pressedWithin('grab', 3) && (I.pressed('block') || I.pressed('grab'))) {
      f.furyActive = C.FURY_DURATION; f.fury = C.FURY_MAX; this.startMove(f, 'fury_on');
      this.emit({ type: 'fury', who: f.idx, name: f.ch.transform }); return true;
    }
    if (this.trySuper(f)) return true;
    if (this.trySpecial(f, o)) return true;
    if (tryInteract(this, f, o)) return true;
    if (this.pb(f, 'grab')) {
      if (this.canThrow(f, o)) this.startThrow(f, o); else this.startMove(f, 'grab_whiff');
      return true;
    }
    if (this.pb(f, 'dodge')) {
      this.consume(f);
      f.state = 'dodge'; f.sf = 0; f.vx = 0; f.crouching = false;
      this.emit({ type: 'dodge', who: f.idx }); return true;
    }
    const btn = this.pressedAttack(f);
    if (btn) { this.startMove(f, (I.heldDigit() <= 3 ? 'c' : '') + btn); return true; }
    return false;
  }

  trySuper(f) {
    const I = f.inp;
    // U+I = supergolpe 1; ↓ + U+I = supergolpe 2. Simplificado: ESP + ↑/↖ = 1, ESP + ↗ = 2.
    const d = I.heldDigit();
    if (f.meter >= C.SUPER_COST && I.pressedWithin('lk', 3) && I.pressedWithin('hk', 3) && (I.pressed('lk') || I.pressed('hk'))) {
      f.meter -= C.SUPER_COST; this.startMove(f, d <= 3 && f.ch.superMove2 ? f.ch.superMove2 : f.ch.superMove);
      this.emit({ type: 'super', who: f.idx, name: f.move.name }); return true;
    }
    if (I.pressed('special') && d >= 7 && f.meter >= C.SUPER_COST) {
      f.meter -= C.SUPER_COST; this.startMove(f, d === 9 && f.ch.superMove2 ? f.ch.superMove2 : f.ch.superMove);
      this.emit({ type: 'super', who: f.idx, name: f.move.name }); return true;
    }
    return false;
  }

  findSpecial(f, n = 4) {
    const I = f.inp;
    if (this.pb(f, 'special', n)) {
      const d = I.heldDigit();
      const key = d === 6 ? 'f' : d === 4 ? 'b' : d <= 3 ? 'd' : d >= 7 ? null : 'n';
      const s = key && f.ch.specials.find((x) => x.simple === key);
      if (s) return s;
    }
    const p = this.pb(f, 'lp', n) || this.pb(f, 'hp', n), k = this.pb(f, 'lk', n) || this.pb(f, 'hk', n);
    if (!p && !k) return null;
    for (const s of f.ch.specials) {
      if ((s.cmd.btn === 'P' && p) || (s.cmd.btn === 'K' && k)) {
        if (I.motion(s.cmd.motion, 18 + n, 7 + n)) return s;
      }
    }
    return null;
  }

  trySpecial(f, o, n = 4) {
    const s = this.findSpecial(f, n);
    if (!s) return false;
    if (s.move === 'regen' && f.regenUses <= 0) { this.emit({ type: 'denied', who: f.idx, text: 'Regeneração esgotada' }); return false; }
    this.startMove(f, s.move);
    f.stats.specials++;
    if (s.move === 'regen') f.regenUses--;
    this.emit({ type: 'special', who: f.idx, id: s.move, name: f.move.name });
    return true;
  }

  startMove(f, id) {
    const m = getMove(f.charId, id);
    this.consume(f);
    f.move = m; f.mf = 0; f.hitsDone = 0; f.connected = false; f.ex = false; f.healAcc = 0; f.armorUsed = false;
    if (!m.air) { f.state = 'attack'; f.vx = 0; f.crouching = !!m.crouch; }
    f.blocking = false;
    this.emit({ type: 'move', who: f.idx, id, kind: m.kind });
  }

  advanceMove(f, o) {
    const m = f.move, I = f.inp;
    f.mf++;
    if (m.kind === 'special' && !m.internal && !f.ex && f.mf <= 6 && f.meter >= C.EX_COST && I.pressedWithin('lp', 7) && I.pressedWithin('hp', 7)) {
      f.ex = true; f.meter -= C.EX_COST; this.emit({ type: 'ex', who: f.idx, name: m.name });
    }
    if (!m.air) {
      let vx = 0;
      if (m.vel) for (const v of m.vel) if (f.mf >= v.f0 && f.mf <= v.f1) vx = v.vx * f.facing * (f.ex ? 1.15 : 1);
      f.vx = vx;
    }
    if (m.invuln && f.mf >= m.invuln[0] && f.mf <= m.invuln[1]) f.invuln = Math.max(f.invuln, 1);
    f.hidden = !!(m.hideFrames && f.mf >= m.hideFrames[0] && f.mf <= m.hideFrames[1]);
    if (m.spawn) for (const s of m.spawn) if (s.f === f.mf) this.spawnProj(f, o, s);
    if (m.script === 'teleport' && f.mf === 15) {
      const side = f.x < o.x ? 1 : -1; // reaparece do lado oposto
      f.x = clamp(o.x + side * 1.0, -C.STAGE_HALF, C.STAGE_HALF);
      if (Math.abs(f.x - o.x) < 0.5) f.x = clamp(o.x - side * 1.0, -C.STAGE_HALF, C.STAGE_HALF);
      f.facing = o.x > f.x ? 1 : -1; f.inp.refacing(f.facing);
      this.emit({ type: 'teleport', who: f.idx, x: f.x });
      if (f.ex) { const ex = true; this.startMove(f, m.exMove || 'teleporte_ex'); f.ex = ex; return; }
    }
    // agarrão de comando (Brakkor): imbloqueável, só pega oponente no chão e ao alcance
    if (m.cmdGrab && f.mf >= m.cmdGrab.f0 && f.mf <= m.cmdGrab.f1 && !f.connected) {
      const g = m.cmdGrab;
      const ok = Math.abs(f.x - o.x) <= g.range && !o.airborne && o.invuln === 0 && !o.hidden &&
        !['knockdown', 'getup', 'dead', 'cinematic', 'thrown', 'juggle', 'vault'].includes(o.state) && Math.sign(o.x - f.x) === f.facing;
      if (ok) {
        f.connected = true;
        const ex = f.ex;
        this.startThrow(f, o, { dmg: Math.round(g.dmg * (ex ? 1.35 : 1)), heal: g.heal ? Math.round(g.heal * (ex ? 1.5 : 1)) : 0, name: m.name, noTech: true, slam: g.slam });
        return;
      }
    }
    if (m.script === 'heal' && f.mf >= m.heal.f0 && f.mf <= m.heal.f1) {
      const total = f.ex ? m.heal.exTotal : m.heal.total;
      const n = m.heal.f1 - m.heal.f0 + 1, k = f.mf - m.heal.f0;
      const h = Math.floor((total * (k + 1)) / n) - Math.floor((total * k) / n);
      if (h > 0) { f.hp = Math.min(C.MAX_HP, f.hp + h); this.emit({ type: 'heal', who: f.idx, amount: h }); }
    }
    // tolerância de 3 quadros para U+I: se o primeiro chute saiu um quadro antes do segundo, vira supergolpe
    if (m.kind === 'normal' && f.mf <= 3 && !f.connected && (m.id === 'lk' || m.id === 'hk' || m.id === 'clk' || m.id === 'chk') && this.trySuper(f)) return;
    // cancelamentos (só após acerto/bloqueio, dentro da janela autorizada)
    if (f.connected && m.cancel.length && m.hits.length) {
      const w0 = m.hits[0].f0, w1 = m.hits[m.hits.length - 1].f1 + 14;
      if (f.mf >= w0 && f.mf <= w1) {
        if (m.cancel.includes('super') && this.trySuper(f)) return;
        if (m.cancel.includes('special') && this.trySpecial(f, o, 10)) return;
        const btn = this.pressedAttack(f, 10);
        if (btn) {
          const down = I.heldDigit() <= 3;
          const cands = m.cancel.filter((c) => baseBtn(c) === btn);
          const pick = cands.find((c) => c.startsWith('c') === down) || cands.find((c) => !c.startsWith('c') && c.endsWith('2')) || null;
          if (pick) { this.startMove(f, pick); this.emit({ type: 'chain', who: f.idx, id: pick }); return; }
        }
      }
    }
    if (f.mf >= m.frames) {
      if (m.air) f.move = null; else this.toNeutralKeepCombo(f);
    }
  }

  // fim de golpe do atacante: não mexe no combo sofrido
  toNeutralKeepCombo(f) {
    const down = f.inp.heldDigit() <= 3;
    f.state = down ? 'crouch' : 'idle'; f.crouching = down; f.sf = 0; f.move = null; f.hidden = false; f.vx = 0;
  }

  spawnProj(f, o, s) {
    const t = f.ch.projectiles[s.proj];
    const ex = f.ex ? t.ex || {} : {};
    const fury = f.furyActive ? 1.15 : 1;
    const x = s.atTarget ? o.x : s.at != null ? f.x + f.facing * s.at : f.x + f.facing * 0.8;
    const hitData = { ...t.hit, dmg: Math.round((ex.dmg ?? t.hit.dmg)), freeze: ex.freeze ?? t.hit.freeze, effect: ex.effect ?? t.hit.effect, poison: ex.poison ?? t.hit.poison, ice: ex.ice ?? t.hit.ice };
    // v0.4: armadilhas com limite de instâncias ativas por dono (a mais antiga some)
    if (t.maxActive) {
      const mine = this.projectiles.filter((q) => q.alive && q.owner === f.idx && q.kind === s.proj);
      while (mine.length >= t.maxActive) mine.shift().alive = false;
    }
    let box = t.box;
    if (ex.wide) box = [box[0] - ex.wide / 2, box[1], box[2] + ex.wide / 2, box[3]];
    const p = {
      id: (this.projId = (this.projId || 0) + 1), owner: f.idx, kind: s.proj, fx: t.fx, x, y: t.y + (t.ground ? 0 : 0),
      vx: (ex.vx ?? t.vx) * f.facing * fury, vy: t.vy || 0, box, life: t.life, delay: t.delay || 0, facing: f.facing,
      clash: t.clash, hit: hitData, ex: f.ex, alive: true, age: 0,
      grav: t.grav || 0, burst: t.burst || null, linger: !!t.linger, tick: t.tick || 0, cd: 0,
    };
    this.projectiles.push(p);
    this.emit({ type: 'proj', who: f.idx, kind: s.proj, x: p.x, y: p.y, ex: f.ex });
    if (f.ex && t.exSpread) {
      for (const dx of [-1.1, 1.1]) this.projectiles.push({ ...p, id: ++this.projId, x: clamp(x + dx, -C.STAGE_HALF, C.STAGE_HALF), delay: p.delay + 6 });
    }
  }

  canThrow(f, o) {
    return Math.abs(f.x - o.x) <= C.THROW_RANGE && !o.airborne && o.invuln === 0 && !o.hidden &&
      ['idle', 'walk', 'crouch', 'land', 'attack', 'blockstun'].includes(o.state) && o.state !== 'blockstun';
  }

  startThrow(f, o, data = null) {
    this.consume(f);
    f.throwData = data;
    f.state = 'throw'; f.sf = 0; f.move = null; f.vx = 0; o.state = 'thrown'; o.sf = 0; o.move = null; o.vx = 0;
    o.crouching = false; o.blocking = false;
    this.emit({ type: 'throw', who: f.idx, name: data ? data.name : f.ch.throwName, cmd: !!data });
  }

  updateThrow(f, o) {
    if (o.state !== 'thrown') { this.toNeutral(f); return; }
    o.x = f.x + f.facing * 0.72; o.y = 0;
    const td = f.throwData;
    if (f.sf <= C.THROW_TECH && !(td && td.noTech) && o.inp.pressedWithin('grab', 3)) {
      this.emit({ type: 'tech', who: o.idx, x: (f.x + o.x) / 2 });
      for (const [g, dir] of [[f, -f.facing], [o, f.facing]]) { g.state = 'blockstun'; g.blockstun = 16; g.pushV = dir * 0.12; g.sf = 0; }
      return;
    }
    if (f.sf === 32) {
      const dmg = Math.round((td ? td.dmg : f.ch.throwDmg) * (f.furyActive ? 1.2 : 1));
      o.hp = Math.max(0, o.hp - dmg);
      const heal = td ? td.heal : f.ch.throwHeal;
      if (heal) { f.hp = Math.min(C.MAX_HP, f.hp + heal); this.emit({ type: 'heal', who: f.idx, amount: heal }); }
      f.meter = Math.min(C.METER_MAX, f.meter + 30); o.fury = Math.min(C.FURY_MAX, o.fury + 8);
      f.stats.dmg += dmg; f.stats.hits++;
      this.emit({ type: 'hit', att: f.idx, def: o.idx, x: o.x, y: 1.2, dmg, heavy: true, throw: true, combo: 1 });
      this.hitstop = 8;
    }
    if (f.sf === 40) {
      o.x = clamp(f.x + f.facing * 1.4, -C.STAGE_HALF, C.STAGE_HALF);
      o.state = 'knockdown'; o.kdTimer = C.KNOCKDOWN_FRAMES; o.sf = 0;
      this.emit({ type: 'land', who: o.idx, x: o.x, heavy: true });
      if (td && td.slam) this.emit({ type: 'quake', who: f.idx, x: o.x });
    }
    if (f.sf >= 50) { f.throwData = null; this.toNeutral(f); }
  }

  tryBreaker(f, o) {
    const I = f.inp;
    if (f.comboHits >= 2 && f.meter >= C.BREAKER_COST && this.pb(f, 'dodge', 9) && this.pb(f, 'block', 9)) {
      this.consume(f);
      f.meter -= C.BREAKER_COST;
      this.toNeutral(f); f.invuln = 20;
      o.move = null; o.state = 'juggle'; o.airborne = true; o.vy = 0.11; o.vx = -o.facing * 0.09; o.kdOnLand = true; o.y = Math.max(o.y, 0.01);
      this.emit({ type: 'breaker', who: f.idx, x: o.x });
      this.hitstop = 10;
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- física
  physics(f) {
    if (f.state === 'cinematic' || f.state === 'thrown') return;
    if (f.airborne || f.state === 'juggle') {
      f.x += f.vx; f.y += f.vy; f.vy -= C.GRAVITY;
      if (f.y <= 0 && f.vy < 0) { f.y = 0; f.vy = 0; f.airborne = false; this.land(f); }
    } else {
      f.x += f.vx;
    }
    if (f.pushV) { f.x += f.pushV; f.pushV *= 0.8; if (Math.abs(f.pushV) < 0.002) f.pushV = 0; }
  }

  land(f) {
    if (f.state === 'juggle') {
      f.vx = 0;
      if (f.hp <= 0 && (this.phase !== 'fight')) { f.state = 'dead'; f.sf = 0; }
      else { f.state = 'knockdown'; f.kdTimer = C.KNOCKDOWN_FRAMES; f.sf = 0; }
      this.emit({ type: 'land', who: f.idx, x: f.x, heavy: true });
    } else if (f.state === 'vault') {
      f.state = 'land'; f.sf = 0; f.vx = 0; f.invuln = Math.min(f.invuln, 2); f.swing = null;
      this.emit({ type: 'land', who: f.idx, x: f.x, heavy: false });
    } else if (f.state === 'air') {
      f.move = null; f.state = 'land'; f.sf = 0; f.vx = 0;
      this.emit({ type: 'land', who: f.idx, x: f.x, heavy: false });
    }
  }

  constrain(px) {
    const [a, b] = this.fighters;
    // pushboxes
    if (!a.hidden && !b.hidden && !['thrown', 'cinematic', 'vault'].includes(a.state) && !['thrown', 'cinematic', 'vault'].includes(b.state)) {
      const pa = pushbox(a), pb = pushbox(b);
      if (overlap(pa, pb)) {
        const ov = Math.min(pa[2], pb[2]) - Math.max(pa[0], pb[0]);
        let dir = Math.sign(a.x - b.x) || -a.facing;
        let sa = ov / 2, sb = ov / 2;
        if (Math.abs(a.x + dir * sa) > C.STAGE_HALF) { sb = ov; sa = 0; }
        if (Math.abs(b.x - dir * sb) > C.STAGE_HALF) { sa = ov; sb = 0; }
        a.x += dir * sa; b.x -= dir * sb;
      }
    }
    for (const f of this.fighters) f.x = clamp(f.x, -C.STAGE_HALF, C.STAGE_HALF);
    // distância máxima (câmera)
    const dist = Math.abs(a.x - b.x);
    if (dist > C.MAX_SEPARATION) {
      const ex = dist - C.MAX_SEPARATION;
      const away = Math.sign(a.x - b.x);
      const oa = Math.max(0, (a.x - px[0]) * away), ob = Math.max(0, (b.x - px[1]) * -away);
      const tot = oa + ob || 1;
      const ka = oa + ob ? oa / tot : 0.5, kb = oa + ob ? ob / tot : 0.5;
      a.x -= away * ex * ka; b.x += away * ex * kb;
    }
  }

  updateFacing(f, o) {
    if (!(NEUTRAL.has(f.state) || f.state === 'land' || f.state === 'getup')) return;
    const want = o.x > f.x ? 1 : -1;
    if (Math.abs(o.x - f.x) > 0.08 && want !== f.facing) { f.facing = want; f.inp.refacing(want); }
  }

  // ---------------------------------------------------------------- projéteis
  updateProjectiles() {
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.age++;
      if (p.delay > 0) { p.delay--; continue; }
      p.x += p.vx; p.y += p.vy;
      if (p.cd > 0) p.cd--;
      if (p.grav) {
        p.vy -= p.grav;
        // bomba em arco: ao tocar o chão vira nuvem tóxica (projétil persistente do mesmo dono)
        if (p.y <= 0.12 && p.vy < 0) {
          const t = p.burst && this.fighters[p.owner].ch.projectiles[p.burst];
          if (t) {
            Object.assign(p, { id: (this.projId = (this.projId || 0) + 1), kind: p.burst, fx: t.fx, y: 0, vx: 0, vy: 0, grav: 0, box: t.box, life: t.life, clash: false, linger: !!t.linger, tick: t.tick || 0, cd: 0,
              hit: { ...t.hit, dmg: p.ex ? (t.ex && t.ex.dmg) || t.hit.dmg : t.hit.dmg, poison: p.ex ? (t.ex && t.ex.poison) || t.hit.poison : t.hit.poison } });
            if (p.ex && t.ex && t.ex.wide) p.box = [p.box[0] - t.ex.wide / 2, p.box[1], p.box[2] + t.ex.wide / 2, p.box[3]];
            this.emit({ type: 'burst', who: p.owner, kind: p.kind, x: p.x });
          } else p.alive = false;
        }
      }
      if ((p.fx === 'rain' || p.fx === 'crows') && p.y < 0.5) { p.y = 0.5; p.vy = 0; p.life = Math.min(p.life, 3); }
      if (--p.life <= 0 || Math.abs(p.x) > C.STAGE_HALF + 1.5) p.alive = false;
    }
    // colisão entre projéteis
    const ps = this.projectiles.filter((p) => p.alive && p.clash && p.delay <= 0);
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const p = ps[i], q = ps[j];
      if (p.owner !== q.owner && p.alive && q.alive && overlap(projBox(p), projBox(q))) {
        p.alive = q.alive = false;
        this.emit({ type: 'clash', x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 + 0.2 });
      }
    }
  }

  // ---------------------------------------------------------------- colisões
  collide() {
    const F = this.fighters;
    const pending = [];
    for (const att of F) {
      const def = F[1 - att.idx];
      const m = att.move;
      if (!m || !(att.state === 'attack' || att.state === 'air')) continue;
      for (let i = 0; i < m.hits.length; i++) {
        const h = m.hits[i];
        if (att.mf < h.f0 || att.mf > h.f1 || (att.hitsDone & (1 << i)) || !h.box) continue;
        const hb = worldBox(att, h.box);
        const hurt = hurtboxes(def);
        if (def.state === 'dizzy' || hurt.some((u) => overlap(hb, u))) pending.push({ att, def, h, i, hb, move: m });
      }
    }
    for (const p of pending) {
      p.att.hitsDone |= 1 << p.i;
      if (p.def.state === 'dizzy' && !overlap(p.hb, worldBox(p.def, [-0.4, 0, 0.4, p.def.ch.height]))) continue;
      const ix = (Math.max(p.hb[0], p.def.x - 0.35) + Math.min(p.hb[2], p.def.x + 0.35)) / 2;
      const iy = clamp((p.hb[1] + p.hb[3]) / 2, p.def.y + 0.3, p.def.y + p.def.ch.height - 0.2);
      this.applyHit(p.att, p.def, p.h, p.move, null, ix, iy);
    }
    for (const pr of this.projectiles) {
      if (!pr.alive || pr.delay > 0 || pr.cd > 0) continue;
      const att = F[pr.owner], def = F[1 - pr.owner];
      const pb = projBox(pr);
      const hurt = def.state === 'dizzy' ? [worldBox(def, [-0.4, 0, 0.4, def.ch.height])] : hurtboxes(def);
      if (hurt.some((u) => overlap(pb, u)) && !(pr.linger && (def.state === 'knockdown' || def.state === 'getup' || def.invuln > 0))) {
        if (pr.linger) pr.cd = pr.tick; else pr.alive = false;
        this.applyHit(att, def, pr.hit, { kind: 'special', name: pr.kind }, pr, def.x - pr.facing * 0.2, clamp(pr.y + (pr.box[1] + pr.box[3]) / 2, 0.3, 1.7));
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.alive);
  }

  canBlock(def, level) {
    if (!def.blocking || def.airborne) return false;
    if (!(NEUTRAL.has(def.state) || def.state === 'blockstun')) return false;
    if (level === 'unblockable' || level === 'throw') return false;
    if (level === 'low') return def.crouching;
    if (level === 'overhead') return !def.crouching;
    return true;
  }

  applyHit(att, def, h, move, proj, ix, iy) {
    att.connected = true;
    // postura de contra-ataque (Véu Escarlate)
    if (def.move && def.move.counterStance && def.mf >= def.move.counterStance[0] && def.mf <= def.move.counterStance[1]) {
      const ex = def.ex;
      def.x = clamp(att.x - att.facing * 0.95, -C.STAGE_HALF, C.STAGE_HALF);
      def.facing = att.x > def.x ? 1 : -1; def.inp.refacing(def.facing);
      const cm = def.move.counterMove || 'veu_contra', cname = def.move.name;
      this.startMove(def, cm); def.ex = ex; def.invuln = 6;
      if (att.move && !proj) { att.state = 'hitstun'; att.hitstun = 18; att.move = null; }
      this.emit({ type: 'counterStance', who: def.idx, x: def.x, name: cname });
      this.hitstop = 6;
      return;
    }
    // golpe no lutador atordoado (fim da janela de finalização)
    if (def.state === 'dizzy') {
      def.state = 'juggle'; def.airborne = true; def.vy = 0.13; def.vx = att.facing * 0.06; def.y = 0.01;
      this.emit({ type: 'hit', att: att.idx, def: def.idx, x: ix, y: iy, dmg: 0, heavy: true, slash: !!h.slash, combo: 1 });
      this.hitstop = 10;
      this.endMatch(att.idx, null);
      return;
    }
    if (def.juggleProt && (def.airborne || def.state === 'juggle')) return;
    // superarmadura (Brakkor): absorve 1 golpe durante a janela, sofrendo o dano sem atordoamento
    if (def.move && def.move.armor && def.mf >= def.move.armor[0] && def.mf <= def.move.armor[1] && !def.armorUsed &&
      h.effect !== 'cinematic' && h.level !== 'unblockable' && h.level !== 'throw' && !this.canBlock(def, h.level)) {
      def.armorUsed = true;
      const ad = Math.max(1, Math.round(h.dmg * 0.8));
      def.hp = Math.max(this.opts.training ? 1 : 0, def.hp - ad);
      att.stats.dmg += ad; att.stats.hits++;
      def.meter = Math.min(C.METER_MAX, def.meter + 6);
      this.hitstop = 7;
      this.emit({ type: 'armor', att: att.idx, def: def.idx, x: ix, y: iy, dmg: ad });
      return;
    }
    const kindChip = move.kind === 'special' || move.kind === 'super';
    if (this.canBlock(def, h.level)) {
      const perfect = this.frame - def.lastBlockEdge <= C.PERFECT_BLOCK_WINDOW + this.hitstop;
      const chip = perfect || !kindChip ? 0 : Math.max(1, Math.round(h.dmg * 0.12));
      def.hp = Math.max(this.opts.training ? 1 : 0, def.hp - chip);
      def.state = 'blockstun'; def.sf = 0; def.blockstun = perfect ? Math.round((h.bs || 10) * 0.6) : h.bs || 10;
      def.move = null; def.vx = 0;
      this.applyPush(att, def, (h.push || 0.07) * 0.9, proj);
      att.meter = Math.min(C.METER_MAX, att.meter + 4);
      def.meter = Math.min(C.METER_MAX, def.meter + (perfect ? 14 : 5));
      def.stats.blocks++;
      this.emit({ type: 'block', att: att.idx, def: def.idx, x: ix, y: iy, perfect, chip, heavy: !!h.heavy });
      this.hitstop = perfect ? 8 : 5;
      return;
    }
    const counter = !!(def.move && def.move.hits.length && def.mf <= def.move.hits[def.move.hits.length - 1].f1) && !proj;
    const scale = Math.max(0.35, 1 - 0.1 * def.comboHits);
    let dmg = h.dmg * scale * (counter ? 1.2 : 1) * (att.furyActive ? 1.2 : 1) * (proj ? 1 : att.ex ? 1.4 : 1);
    if (proj && proj.ex) dmg *= 1; // dano potencializado do projétil já vem do template
    dmg = Math.max(1, Math.round(dmg));
    if (h.effect === 'cinematic') {
      this.startCine(att, def, move);
      return;
    }
    def.hp = Math.max(0, def.hp - dmg);
    if (this.opts.training && def.hp <= 0) def.hp = 1;
    if (h.poison) { def.poison = Math.max(def.poison || 0, h.poison); def.poisonBy = att.idx; }
    def.comboHits++; def.comboDmg += dmg;
    att.stats.hits++; att.stats.dmg += dmg; att.stats.maxCombo = Math.max(att.stats.maxCombo, def.comboHits);
    const wasAir = def.airborne || def.state === 'juggle';
    def.move = null; def.hidden = false; def.blocking = false;
    if (wasAir || h.launch || h.kd) {
      def.state = 'juggle'; def.sf = 0; def.airborne = true; def.y = Math.max(def.y, 0.01);
      def.vy = h.launch ? h.launch * (wasAir ? 0.6 : 1) : wasAir ? 0.1 : 0.09;
      def.vx = att.facing * (h.kd ? 0.05 : 0.03);
      def.juggle++;
      if (def.juggle >= C.JUGGLE_MAX) def.juggleProt = true;
    } else if (h.effect === 'freeze') {
      def.state = 'frozen'; def.frozen = h.freeze || 70; def.sf = 0; def.vx = 0; def.frozenIce = !!h.ice;
      this.emit({ type: 'freeze', who: def.idx, frames: def.frozen });
    } else {
      def.state = 'hitstun'; def.sf = 0; def.vx = 0;
      def.hitstun = Math.round((h.hs || 14) * Math.max(0.55, 1 - 0.04 * (def.comboHits - 1))) + (counter ? 4 : 0);
      if (!def.crouching) def.crouching = false;
    }
    if (h.effect === 'pull') {
      def.x = clamp(att.x + att.facing * 1.0, -C.STAGE_HALF, C.STAGE_HALF);
      this.emit({ type: 'pull', att: att.idx, def: def.idx });
    } else {
      this.applyPush(att, def, h.push || 0.07, proj);
    }
    att.meter = Math.min(C.METER_MAX, att.meter + Math.round(dmg * 0.45));
    def.meter = Math.min(C.METER_MAX, def.meter + Math.round(dmg * 0.3));
    if (!att.furyActive) att.fury = Math.min(C.FURY_MAX, att.fury + dmg * 0.03);
    if (!def.furyActive) def.fury = Math.min(C.FURY_MAX, def.fury + dmg * 0.07);
    this.hitstop = h.hitstop || (dmg >= 60 ? 9 : 6);
    this.emit({ type: 'hit', att: att.idx, def: def.idx, x: ix, y: iy, dmg, heavy: !!h.heavy || dmg >= 60, slash: !!h.slash,
      counter, combo: def.comboHits, level: h.level, proj: proj ? proj.kind : null, hpAfter: def.hp });
    afterHit(this, att, def, h, proj);
  }

  applyPush(att, def, push, proj) {
    const dir = proj ? proj.facing : att.facing;
    if (Math.abs(def.x + dir * push * 5) >= C.STAGE_HALF - 0.05 && !proj) att.pushV = -dir * push;
    else def.pushV = dir * push;
  }

  // ---------------------------------------------------------------- supergolpe cinematográfico
  startCine(att, def, move) {
    this.cine = { kind: 'super', id: move.id, att: att.idx, def: def.idx, f: 0, dur: move.seq.dur, hits: move.seq.hits, fury: !!att.furyActive };
    att.state = 'cinematic'; def.state = 'cinematic'; def.move = null; att.vx = def.vx = 0;
    def.y = 0; att.y = 0; def.airborne = att.airborne = false;
    def.x = clamp(att.x + att.facing * 1.1, -C.STAGE_HALF, C.STAGE_HALF);
    if (Math.abs(def.x - att.x) < 1) att.x = clamp(def.x - att.facing * 1.1, -C.STAGE_HALF, C.STAGE_HALF);
    this.projectiles = [];
    this.emit({ type: 'superHit', att: att.idx, def: def.idx, id: move.id, name: move.name });
  }

  updateCine() {
    const c = this.cine; c.f++;
    const att = this.fighters[c.att], def = this.fighters[c.def];
    for (const h of c.hits) if (h.f === c.f) {
      const dmg = Math.round(h.dmg * (c.fury ? 1.2 : 1));
      def.hp = Math.max(this.opts.training ? 1 : 0, def.hp - dmg);
      def.comboHits++; att.stats.dmg += dmg; att.stats.hits++;
      if (h.heal) { att.hp = Math.min(C.MAX_HP, att.hp + h.heal); this.emit({ type: 'heal', who: c.att, amount: h.heal, frame: 0 }); }
      this.emit({ type: 'hit', att: c.att, def: c.def, x: def.x, y: 1.2, dmg, heavy: true, slash: true, cinematic: true, combo: def.comboHits, hpAfter: def.hp });
    }
    if (c.f >= c.dur) {
      this.cine = null;
      att.state = 'idle'; att.sf = 0; att.move = null;
      def.state = 'juggle'; def.airborne = true; def.y = 0.01; def.vy = 0.12; def.vx = att.facing * 0.07; def.juggleProt = true;
      this.hitstop = 4;
      this.rules();
    }
  }

  // ---------------------------------------------------------------- finalizações
  checkFatality(f, o) {
    const I = f.inp;
    const dist = Math.abs(f.x - o.x);
    let cand = null;
    if (I.pressed('special')) {
      const d = I.heldDigit();
      cand = f.ch.fatalities.find((x) => x.simple === (d <= 3 ? 'd' : d === 6 ? 'f' : d === 4 ? 'b' : 'n'));
    } else {
      for (const fat of f.ch.fatalities) if (I.pressed(fat.btn) && I.motion(fat.motion, 40, 10)) { cand = fat; break; }
    }
    if (!cand) return null;
    if (dist < cand.range[0] || dist > cand.range[1]) {
      this.emit({ type: 'fatalHint', who: f.idx, text: dist < cand.range[0] ? 'Muito perto!' : 'Muito longe!', name: cand.name });
      return null;
    }
    return cand;
  }

  startFatality(f, o, fat) {
    this.fatal = { id: fat.id, name: fat.name, att: f.idx, def: o.idx, f: 0, dur: fat.dur };
    f.state = 'cinematic'; o.state = 'cinematic'; f.move = o.move = null; f.vx = o.vx = 0; f.y = o.y = 0;
    let ox = f.x + f.facing * fat.dist;
    if (Math.abs(ox) > C.STAGE_HALF - 0.5) { const shift = ox - Math.sign(ox) * (C.STAGE_HALF - 0.5); ox -= shift; f.x -= shift; }
    o.x = ox; o.facing = -f.facing; f.inp.refacing(f.facing);
    this.projectiles = [];
    this.setPhase('fatality');
    this.emit({ type: 'fatality', who: f.idx, id: fat.id, name: fat.name });
  }

  endMatch(winner, fatalityId) {
    const w = this.fighters[winner], l = this.fighters[1 - winner];
    this.result = { winner, fatality: fatalityId, fatalityName: fatalityId ? this.fatal.name : null, rounds: this.round };
    w.state = 'win'; w.sf = 0; w.move = null;
    if (l.state === 'cinematic' || l.state === 'dizzy') { l.state = 'dead'; l.sf = 0; }
    this.cine = null;
    this.setPhase('matchEnd');
    this.emit({ type: 'matchEnd', winner, fatality: fatalityId });
  }

  // ---------------------------------------------------------------- regras de round
  rules() {
    const F = this.fighters;
    if (this.opts.training) {
      for (const f of F) {
        if (f.hp <= 1 || (f.comboHits === 0 && NEUTRAL.has(f.state) && f.sf > 90 && f.hp < C.MAX_HP)) f.hp = C.MAX_HP;
        f.meter = C.METER_MAX;
      }
      return;
    }
    if (this.phase === 'fight') {
      if (++this.timerAcc >= 60) { this.timerAcc = 0; this.timer = Math.max(0, this.timer - 1); }
      const ko = F.filter((f) => f.hp <= 0);
      if (ko.length && !this.cine) {
        this.projectiles = [];
        for (const f of ko) {
          if (f.state !== 'juggle' && f.state !== 'knockdown') { f.state = 'juggle'; f.airborne = true; f.y = Math.max(f.y, 0.01); f.vy = 0.09; f.vx = -f.facing * 0.04; f.move = null; }
          f.juggleProt = true;
        }
        this.hitstop = 14;
        if (ko.length === 2) { this.koLoser = -2; this.emit({ type: 'ko', who: -1, double: true }); }
        else { this.koLoser = ko[0].idx; F[1 - ko[0].idx].wins++; this.emit({ type: 'ko', who: ko[0].idx }); }
        this.setPhase('ko');
        return;
      }
      if (this.timer <= 0) {
        this.projectiles = [];
        if (F[0].hp === F[1].hp) { this.koLoser = -2; }
        else { const l = F[0].hp < F[1].hp ? 0 : 1; this.koLoser = l; F[1 - l].wins++; }
        this.emit({ type: 'timeout', who: this.koLoser });
        this.setPhase('ko');
      }
    } else if (this.phase === 'ko') {
      if (this.pf >= C.KO_FRAMES) {
        const winIdx = this.koLoser >= 0 ? 1 - this.koLoser : -1;
        const over = F.some((f) => f.wins >= C.ROUNDS_TO_WIN) || this.round >= 6;
        if (over && winIdx >= 0 && F[winIdx].wins >= C.ROUNDS_TO_WIN) {
          const l = F[this.koLoser];
          l.state = 'dizzy'; l.sf = 0; l.y = 0; l.vy = 0; l.vx = 0; l.airborne = false; l.move = null; l.hidden = false;
          const w = F[winIdx];
          if (!NEUTRAL.has(w.state)) this.toNeutral(w);
          w.inp.reset(); w.used = -1;
          this.finishWinner = winIdx;
          this.setPhase('finish');
        } else if (over) {
          this.result = { winner: -1, fatality: null, rounds: this.round };
          this.setPhase('matchEnd');
        } else {
          if (winIdx >= 0) { F[winIdx].state = 'win'; F[winIdx].sf = 0; F[winIdx].move = null; }
          this.setPhase('roundEnd');
        }
      }
    } else if (this.phase === 'roundEnd') {
      if (this.pf >= C.ROUND_END_FRAMES) { this.round++; this.resetRound(); }
    } else if (this.phase === 'finish') {
      if (this.pf >= C.FINISH_WINDOW) {
        const l = F[1 - this.finishWinner];
        l.state = 'juggle'; l.airborne = true; l.y = 0.01; l.vy = 0.05; l.vx = 0;
        this.endMatch(this.finishWinner, null);
      }
    }
  }

  // fase 'roundEnd'/'ko'/'matchEnd' continuam a física (corpos caindo)
  snapshot() {
    return JSON.stringify({
      f: this.frame, p: this.phase, r: this.round, t: this.timer,
      F: this.fighters.map((f) => [f.x, f.y, f.hp, f.meter, f.fury, f.state, f.mf, f.move && f.move.id, f.wins, f.comboHits]),
      P: this.projectiles.map((p) => [p.kind, p.x, p.y, p.life]),
    });
  }
}

function projBox(p) {
  const [x0, y0, x1, y1] = p.box;
  return p.facing >= 0 ? [p.x + x0, p.y + y0, p.x + x1, p.y + y1] : [p.x - x1, p.y + y0, p.x - x0, p.y + y1];
}
export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
