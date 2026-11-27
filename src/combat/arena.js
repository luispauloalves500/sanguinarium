// Regras de arena (simulação determinística): elementos interativos, perigos de borda e transições.
// Tudo pode ser desligado pela opção "Perigos da arena" (GDD: desativáveis no competitivo).
import * as C from '../core/constants.js';

export const EDGE_ZONE = 1.0;           // distância da borda em que o elemento interativo responde
export const HAZARD_ZONE = 0.9;         // borda "perigosa" para golpes de queda
export const TRANSITION_ZONE = 0.6;     // borda para a transição de cenário
export const TRANSITION_FRAMES = 150;
export const VAULT_FRAMES = 38;
export const STATUE = { windup: 30, active: [30, 36], reach: 3.5, dmg: 90 };
export const LAVA_DMG = 50;
export const TRANSITION_DMG = 70;

// Definições por arena. area 0 = cenário principal, area 1 = cenário após a transição.
export const ARENA_RULES = {
  coliseu: {
    areas: ['Coliseu Carmesim', 'Fosso do Coliseu'],
    interact: 'vault', interactName: 'Corrente do Muro',
    hazard: 'lava', hazardName: 'Poço de Lava',
    transitionName: 'Portão do Fosso',
  },
  catedral: {
    areas: ['Catedral Profana', 'Cripta Profana'],
    interact: 'statue', interactName: 'Estátua do Carrasco',
    hazard: 'lava', hazardName: 'Braseiro Profano',
    transitionName: 'Queda na Cripta',
  },
};

export function createStage(arena, hazards) {
  return {
    arena, rules: ARENA_RULES[arena] || null, enabled: hazards !== false && !!ARENA_RULES[arena],
    area: 0, transUsed: false, trans: null, statues: { '-1': 'up', '1': 'up' }, statueAct: [],
    hazardCd: [0, 0], interactCd: [0, 0],
  };
}

export function resetStageRound(st) {
  st.statues = { '-1': 'up', '1': 'up' }; st.statueAct = []; st.hazardCd = [0, 0]; st.interactCd = [0, 0]; st.trans = null;
}

const sideOf = (x) => (x < 0 ? -1 : 1);
const nearEdge = (x, zone) => Math.abs(x) >= C.STAGE_HALF - zone;

// Elemento disponível para o lutador (usado também pelo HUD para mostrar a dica).
export function interactionFor(st, f) {
  if (!st || !st.enabled || !st.rules) return null;
  if (!nearEdge(f.x, EDGE_ZONE)) return null;
  if (st.interactCd[f.idx] > 0) return null;
  const side = sideOf(f.x);
  if (st.rules.interact === 'vault') {
    if (f.facing !== -side) return null; // de costas para o muro
    return { kind: 'vault', side, name: st.rules.interactName };
  }
  if (st.rules.interact === 'statue') {
    if (st.statues[side] !== 'up' || f.facing !== -side) return null;
    return { kind: 'statue', side, name: st.rules.interactName };
  }
  return null;
}

// ↑ + O perto do elemento. Chamado antes do agarrão normal em tryActions.
export function tryInteract(m, f, o) {
  const st = m.stage;
  if (!st || !st.enabled || m.phase !== 'fight') return false;
  const I = f.inp;
  if (!(I.heldDigit() >= 7 && m.pb(f, 'grab'))) return false;
  const it = interactionFor(st, f);
  if (!it) return false;
  m.consume(f);
  st.interactCd[f.idx] = 180;
  if (it.kind === 'vault') {
    // salta pela corrente do muro e cai atrás do oponente
    const target = clamp(o.x + f.facing * 1.1, -C.STAGE_HALF + 0.3, C.STAGE_HALF - 0.3);
    f.state = 'vault'; f.sf = 0; f.move = null; f.airborne = true; f.crouching = false; f.blocking = false;
    f.vy = 0.205; f.vx = (target - f.x) / VAULT_FRAMES; f.invuln = VAULT_FRAMES + 4; f.y = 0.01;
    m.emit({ type: 'interact', kind: 'vault', who: f.idx, side: it.side, x: f.x });
  } else {
    // derruba a estátua na direção do oponente (golpe alto: bloqueável em pé)
    st.statues[it.side] = 'falling';
    st.statueAct.push({ side: it.side, owner: f.idx, f: 0, hit: false });
    m.startMove(f, 'empurra_estatua');
    m.emit({ type: 'interact', kind: 'statue', who: f.idx, side: it.side, x: f.x });
  }
  return true;
}

export function updateVault(m, f) {
  if (!f.airborne) {
    f.state = 'land'; f.sf = 0; f.vx = 0;
  }
}

// avanço por quadro (cooldowns, estátuas caindo)
export function stepStage(m) {
  const st = m.stage;
  if (!st || !st.enabled) return;
  for (let i = 0; i < 2; i++) { if (st.hazardCd[i] > 0) st.hazardCd[i]--; if (st.interactCd[i] > 0) st.interactCd[i]--; }
  for (const s of st.statueAct) {
    s.f++;
    if (!s.hit && s.f >= STATUE.active[0] && s.f <= STATUE.active[1]) {
      const def = m.fighters[1 - s.owner], att = m.fighters[s.owner];
      const edge = s.side * C.STAGE_HALF;
      const x0 = Math.min(edge, edge - s.side * STATUE.reach), x1 = Math.max(edge, edge - s.side * STATUE.reach);
      const hb = [x0, 0, x1, 1.7];
      if (def.x + 0.36 > hb[0] && def.x - 0.36 < hb[2] && def.y < 1.6 && def.invuln === 0 && !def.hidden &&
        !['knockdown', 'getup', 'dead', 'cinematic', 'thrown'].includes(def.state)) {
        s.hit = true;
        m.applyHit(att, def, { dmg: STATUE.dmg, level: 'overhead', kd: true, heavy: true, push: 0.1, hs: 20, bs: 16, hitstop: 12 },
          { kind: 'hazard', name: 'estatua' }, { facing: -s.side, kind: 'estatua', hazard: true }, def.x, 1.2);
      }
    }
    if (s.f === STATUE.active[1]) { st.statues[s.side] = 'down'; m.emit({ type: 'statueDown', side: s.side, hit: s.hit }); }
  }
  st.statueAct = st.statueAct.filter((s) => s.f < 60);
}

// Depois de um golpe que derruba: perigo de borda e transição de cenário.
export function afterHit(m, att, def, h, proj) {
  const st = m.stage;
  if (!st || !st.enabled || m.phase !== 'fight') return;
  if (proj && proj.hazard) return;
  if (!h.kd || def.hp <= 0) return;
  const side = sideOf(def.x);
  const towardEdge = (proj ? proj.facing : att.facing) === side;
  if (!towardEdge) return;
  // transição: golpe pesado que derruba bem na borda, uma vez por luta, só no cenário principal
  if (!st.transUsed && st.area === 0 && h.heavy && nearEdge(def.x, TRANSITION_ZONE) && def.hp > TRANSITION_DMG) {
    st.transUsed = true;
    def.hp = Math.max(1, def.hp - TRANSITION_DMG);
    def.comboDmg += TRANSITION_DMG; att.stats.dmg += TRANSITION_DMG;
    st.trans = { att: att.idx, def: def.idx, side, f: 0, x0: def.x };
    m.projectiles = [];
    m.emit({ type: 'transition', att: att.idx, def: def.idx, side, name: st.rules.transitionName, to: st.rules.areas[1], dmg: TRANSITION_DMG });
    m.setPhase('transition');
    return;
  }
  // perigo de borda (lava / braseiro)
  if (nearEdge(def.x, HAZARD_ZONE) && st.hazardCd[def.idx] === 0) {
    st.hazardCd[def.idx] = 360;
    const dmg = Math.min(LAVA_DMG, Math.max(0, def.hp - (m.opts.training ? 1 : 0)));
    def.hp -= dmg; def.comboDmg += dmg; att.stats.dmg += dmg;
    def.vy = Math.max(def.vy, 0.12);
    m.emit({ type: 'hazard', kind: st.rules.hazard, name: st.rules.hazardName, who: def.idx, side, x: side * (C.STAGE_HALF + 0.6), dmg });
  }
}

// fase 'transition': a vítima é arremessada para fora, a tela escurece e a luta continua no novo cenário
export function stepTransition(m) {
  const st = m.stage, tr = st.trans;
  if (!tr) { m.setPhase('fight'); return; }
  tr.f++;
  const att = m.fighters[tr.att], def = m.fighters[tr.def];
  if (tr.f <= 60) {
    def.state = 'juggle'; def.airborne = true;
    def.x = tr.x0 + tr.side * tr.f * 0.05;
    def.y = Math.max(0.01, 0.9 * Math.sin((tr.f / 60) * Math.PI) + (tr.f > 40 ? -(tr.f - 40) * 0.08 : 0));
    att.state = 'idle'; att.move = null; att.vx = 0;
  }
  if (tr.f === 90) {
    st.area = 1;
    // nova arena: a vítima cai no centro-lado, o atacante salta atrás
    def.x = tr.side * 1.0; def.y = 0; def.vy = 0; def.vx = 0; def.airborne = false;
    def.state = 'knockdown'; def.kdTimer = 50; def.sf = 0; def.move = null;
    att.x = -tr.side * 1.4; att.y = 0; att.vx = 0; att.vy = 0; att.airborne = false; att.state = 'idle'; att.sf = 0; att.move = null;
    att.facing = tr.side; def.facing = -tr.side;
    att.inp.refacing(att.facing); def.inp.refacing(def.facing);
    m.emit({ type: 'areaChange', area: 1, name: st.rules.areas[1] });
  }
  if (tr.f >= TRANSITION_FRAMES) { st.trans = null; m.setPhase('fight'); }
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
