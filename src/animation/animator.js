// Máquina de estados de animação: converte o estado da simulação em pose-alvo.
// Não altera a simulação (somente leitura).
import { POSES, STANCE, POSE_KEYS, lerpPose } from './poses.js';
import * as C from '../core/constants.js';

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

export class Animator {
  constructor(charId) {
    this.charId = charId;
    this.cur = { ...STANCE };
    this.tmp = { ...STANCE };
    this.lie = 0; this.spin = 0; this.zoff = 0; this.lift = 0; this.tilt = 0;
    this.override = null; // pose forçada por timeline cinematográfica
  }

  target(f, match, time) {
    const out = this.tmp;
    let lie = 0, spin = 0, zoff = 0, lift = 0, tilt = 0, speed = 18;
    const st = f.state;
    const breathe = Math.sin(time * 2.2 + f.idx) * 0.035;
    const set = (name) => Object.assign(out, POSES[name]);
    const mix = (a, b, t) => lerpPose(out, POSES[a], POSES[b], ease(t));
    if (f.move && (st === 'attack' || st === 'air')) {
      const m = f.move, anim = m.anim || 'jab';
      const hits = m.hits;
      let k0, k1;
      if (hits.length) { k0 = hits[0].f0; k1 = hits[hits.length - 1].f1; }
      else if (m.spawn) { k0 = m.spawn[0].f; k1 = k0 + 6; }
      else { k0 = Math.min(10, m.frames * 0.3); k1 = m.frames * 0.7; }
      const w = POSES[anim + '_w'] ? anim + '_w' : 'jab_w', s = POSES[anim + '_s'] ? anim + '_s' : 'jab_s';
      const base = st === 'air' ? 'jumpUp' : m.crouch ? 'crouch' : 'stance';
      if (anim === 'rage' && hits.length > 1) {
        // alterna preparação/golpe a cada acerto
        let i = hits.findIndex((h) => f.mf <= h.f1);
        if (i < 0) i = hits.length - 1;
        const h = hits[i], prevEnd = i > 0 ? hits[i - 1].f1 : 0;
        if (f.mf < h.f0) mix(i ? s : base, w, (f.mf - prevEnd) / Math.max(1, h.f0 - prevEnd));
        else set(s);
        speed = 30;
      } else if (f.mf < k0) { mix(base, w, f.mf / Math.max(1, k0)); speed = 26; }
      else if (f.mf <= k1) { set(s); speed = 40; }
      else { mix(s, base, (f.mf - k1) / Math.max(1, m.frames - k1)); speed = 16; }
      if (anim === 'spin' && f.mf >= 8 && f.mf <= 40) spin = (f.mf - 8) * 0.42;
      if (m.id === 'fury_on') lift = Math.sin(Math.min(1, f.mf / 40) * Math.PI) * 0.25;
      if (anim === 'regen') lift = 0.15 + Math.sin(time * 3) * 0.05;
      if (st === 'air') lift = 0;
    } else {
      switch (st) {
        case 'idle':
          if (f.blocking) set('block'); else { set('stance'); out.spx += breathe; out.py += breathe * 0.5; }
          break;
        case 'walk': {
          const ph = f.x * 7 * f.facing;
          mix('walkA', 'walkB', 0.5 + Math.sin(ph) * 0.5);
          speed = 22; break;
        }
        case 'crouch': set(f.blocking ? 'crouchBlock' : 'crouch'); break;
        case 'blockstun': set(f.crouching ? 'crouchBlock' : 'block'); zoff = 0; tilt = -0.06; break;
        case 'jumpsquat': case 'land': set('land'); speed = 30; break;
        case 'air': set(f.vy > 0.02 ? 'jumpUp' : 'jumpDown'); if (f.jumpDir !== 0 && f.vy > -0.1) spin = 0; speed = 12; break;
        case 'hitstun': set(f.comboHits % 2 ? 'hitHigh' : 'hitLow'); speed = 40; break;
        case 'frozen': set('frozen'); speed = 60; break;
        case 'juggle': set('tumble'); lie = Math.min(0.85, 0.25 + f.sf * 0.03); speed = 14; break;
        case 'knockdown': case 'dead': set('lying'); lie = 1; speed = 10; break;
        case 'getup': mix('lying', 'crouch', f.sf / C.GETUP_FRAMES); lie = 1 - ease(f.sf / C.GETUP_FRAMES); speed = 20; break;
        case 'dodge': {
          set('dodge');
          const t = f.sf / C.DODGE_FRAMES;
          zoff = Math.sin(t * Math.PI) * 1.1 * (f.idx === 0 ? 1 : -1);
          speed = 26; break;
        }
        case 'dizzy': set('dizzy'); tilt = Math.sin(time * 2.1) * 0.12; out.spz = Math.sin(time * 1.7) * 0.15; speed = 6; break;
        case 'win': set(this.charId === 'varkhan' ? 'winVarkhan' : 'winLilith'); if (this.charId === 'lilith') lift = 0.35 + Math.sin(time * 2) * 0.06; speed = 6; break;
        case 'throw': set(f.sf < 30 ? 'grab_s' : 'overhead_s'); speed = 18; break;
        case 'thrown': set('thrown'); lift = f.sf < 30 ? Math.min(0.5, f.sf * 0.03) : 0; speed = 16; break;
        default: set('stance');
      }
    }
    return { pose: out, lie, spin, zoff, lift, tilt, speed };
  }

  update(f, match, time, dt) {
    let t;
    if (this.override) t = this.override;
    else t = this.target(f, match, time);
    const k = 1 - Math.exp(-dt * t.speed);
    for (const key of POSE_KEYS) this.cur[key] += (t.pose[key] - this.cur[key]) * k;
    const k2 = 1 - Math.exp(-dt * 12);
    this.lie += (t.lie - this.lie) * k2;
    this.zoff += (t.zoff - this.zoff) * Math.min(1, k * 1.5);
    this.lift += (t.lift - this.lift) * k2;
    this.tilt += (t.tilt - this.tilt) * k2;
    this.spin = t.spin; // giro é direto
    return this.cur;
  }
}
