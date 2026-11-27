// Máquina de estados de animação: converte o estado da simulação em pose-alvo.
// Não altera a simulação (somente leitura).
import { POSES, STANCE, POSE_KEYS, lerpPose } from './poses.js';
import * as C from '../core/constants.js';
import { CHARACTERS } from '../combat/moves.js';

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const smoother = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (t * (t * 6 - 15) + 10));

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
    let lie = 0, spin = 0, zoff = 0, lift = 0, tilt = 0, speed = 18, flip = 0;
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
      if ((anim === 'rage' || m.multi) && hits.length > 1) {
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
      if (m.leap && f.mf >= m.leap.f0 && f.mf <= m.leap.f1) lift = Math.sin(((f.mf - m.leap.f0) / (m.leap.f1 - m.leap.f0)) * Math.PI) * m.leap.h;
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
        case 'vault': {
          // v0.3: cambalhota suave — acelera/desacelera (smootherstep), encolhe no meio e estende para aterrissar
          const t = Math.min(1, f.sf / 38);
          if (f.swing) {
            // v0.4 Corrente da Forja: pendura-se na corrente (braços para cima) e solta o chute no meio do arco
            if (t < 0.25) mix('jumpUp', 'castUp_s', t / 0.25);
            else if (t < 0.75) mix('castUp_s', 'jkick_s', Math.min(1, (t - 0.25) / 0.2));
            else mix('jkick_s', 'jumpDown', (t - 0.75) / 0.25);
            speed = 16; break;
          }
          flip = smoother(Math.min(1, t / 0.9)) * Math.PI * 2;
          if (t < 0.2) mix('jumpUp', 'tuck', t / 0.2);
          else if (t < 0.7) set('tuck');
          else mix('tuck', 'jumpDown', (t - 0.7) / 0.3);
          speed = 14; break;
        }
        case 'jumpsquat': set('land'); speed = 30; break;
        case 'land': set('land'); speed = 20; break;
        case 'air': set(f.vy > 0.02 ? 'jumpUp' : 'jumpDown'); if (f.jumpDir !== 0 && f.vy > -0.1) spin = 0; speed = 12; break;
        case 'hitstun': set(f.comboHits % 2 ? 'hitHigh' : 'hitLow'); speed = 40; break;
        case 'frozen': set('frozen'); speed = 60; break;
        case 'juggle': {
          // v0.3: queda contínua — subindo fica mais em pé, descendo deita progressivamente e se prepara para o chão
          const fall = Math.max(0, Math.min(1, -(f.vy || 0) / 0.14));
          mix('tumble', 'lying', fall * 0.6);
          lie = Math.min(0.92, 0.3 + Math.min(1, f.sf / 20) * 0.3 + fall * 0.32);
          speed = 9; break;
        }
        case 'knockdown': case 'dead': {
          // impacto: pequeno quique e acomodação do corpo nos primeiros quadros
          const k = Math.min(1, f.sf / 12);
          mix('tumble', 'lying', 0.6 + 0.4 * k);
          lie = 1; lift = f.sf < 12 ? Math.sin(k * Math.PI) * 0.09 : 0;
          speed = 12; break;
        }
        case 'getup': mix('lying', 'crouch', f.sf / C.GETUP_FRAMES); lie = 1 - ease(f.sf / C.GETUP_FRAMES); speed = 20; break;
        case 'dodge': {
          set('dodge');
          const t = f.sf / C.DODGE_FRAMES;
          zoff = Math.sin(t * Math.PI) * 1.1 * (f.idx === 0 ? 1 : -1);
          speed = 26; break;
        }
        case 'dizzy': set('dizzy'); tilt = Math.sin(time * 2.1) * 0.12; out.spz = Math.sin(time * 1.7) * 0.15; speed = 6; break;
        case 'win': { const ch = CHARACTERS[this.charId]; set(ch.winPose || 'winVarkhan'); if (ch.winLift) lift = ch.winLift + Math.sin(time * 2) * 0.06; speed = 6; break; }
        case 'throw': set(f.sf < 30 ? 'grab_s' : 'overhead_s'); speed = 18; break;
        case 'thrown': set('thrown'); lift = f.sf < 30 ? Math.min(0.5, f.sf * 0.03) : 0; speed = 16; break;
        default: set('stance');
      }
    }
    const air = st === 'air' || st === 'juggle' || st === 'thrown' || (f.y || 0) > 0.05;
    return { pose: out, lie, spin, zoff, lift, tilt, speed, air, plant: st !== 'walk', flip };
  }

  update(f, match, time, dt) {
    let t;
    if (this.override) t = this.override;
    else t = this.target(f, match, time);
    const k = 1 - Math.exp(-dt * t.speed);
    for (const key of POSE_KEYS) this.cur[key] += (t.pose[key] - this.cur[key]) * k;
    const k2 = 1 - Math.exp(-dt * 12);
    this.lie += (t.lie - this.lie) * (1 - Math.exp(-dt * 9));
    this.zoff += (t.zoff - this.zoff) * Math.min(1, k * 1.5);
    this.lift += (t.lift - this.lift) * k2;
    this.tilt += (t.tilt - this.tilt) * k2;
    this.spin = t.spin; // giro é direto
    this.flip = t.flip || 0;
    this.air = !!t.air; this.plant = t.plant !== false;
    return this.cur;
  }
}
