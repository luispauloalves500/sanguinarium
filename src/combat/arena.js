// Regras de arena (simulação determinística): elementos interativos, perigos de borda e transições.
// Tudo pode ser desligado pela opção "Perigos da arena" (GDD: desativáveis no competitivo).
import * as C from '../core/constants.js';

export const EDGE_ZONE = 1.0;           // distância da borda em que o elemento interativo responde
export const HAZARD_ZONE = 0.9;         // borda "perigosa" para golpes de queda
export const TRANSITION_ZONE = 0.6;     // borda para a transição de cenário
export const TRANSITION_FRAMES = 150;
export const VAULT_FRAMES = 38;
export const STATUE = { windup: 30, active: [30, 36], reach: 3.5, dmg: 90, pivot: 7.85, pivotY: 0.8, theta: 1.72 };
// ângulo de queda da estátua no quadro f (o render usa a mesma curva)
export function statueAngle(f) { const k = Math.min(1, f / STATUE.active[1]); return STATUE.theta * k * k; }
export const LAVA_DMG = 50;
// v0.4: Templo (Espírito Ancestral = projétil invocado do altar; Estátua do Guardião = perigo destrutível)
// e Forja (Corrente da Forja = balanço com chute por cima do oponente; Boca da Fornalha = perigo de lava)
export const SPIRIT = { spawnAt: 14, vx: 0.19, life: 70, dmg: 70 };
export const SWING = { f0: 10, f1: 30, range: 1.25, dmg: 75 };
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
  templo: {
    areas: ['Templo dos Samurais Mortos', 'Cemitério dos Ronins'],
    interact: 'spirit', interactName: 'Espírito Ancestral',
    hazard: 'shatter', hazardName: 'Estátua do Guardião',
    transitionName: 'Escadaria Ancestral',
  },
  forja: {
    areas: ['Forja Infernal', 'Coração da Forja'],
    interact: 'swing', interactName: 'Corrente da Forja',
    hazard: 'lava', hazardName: 'Boca da Fornalha',
    transitionName: 'Queda no Cadinho',
  },
};
const fresh = () => ({ '-1': 'up', '1': 'up' });

export function createStage(arena, hazards) {
  return {
    arena, rules: ARENA_RULES[arena] || null, enabled: hazards !== false && !!ARENA_RULES[arena],
    area: 0, transUsed: false, trans: null, statues: fresh(), statueAct: [], spirits: fresh(), guards: fresh(), spiritAct: [],
    hazardCd: [0, 0], interactCd: [0, 0],
  };
}

export function resetStageRound(st) {
  st.statues = fresh(); st.statueAct = []; st.spirits = fresh(); st.guards = fresh(); st.spiritAct = []; st.hazardCd = [0, 0]; st.interactCd = [0, 0]; st.trans = null;
}

const sideOf = (x) => (x < 0 ? -1 : 1);
const nearEdge = (x, zone) => Math.abs(x) >= C.STAGE_HALF - zone;

// Elemento disponível para o lutador (usado também pelo HUD para mostrar a dica).
export function interactionFor(st, f) {
  if (!st || !st.enabled || !st.rules) return null;
  if (!nearEdge(f.x, EDGE_ZONE)) return null;
  if (st.interactCd[f.idx] > 0) return null;
  const side = sideOf(f.x);
  if (st.rules.interact === 'vault' || st.rules.interact === 'swing') {
    if (f.facing !== -side) return null; // de costas para o muro
    return { kind: st.rules.interact, side, name: st.rules.interactName };
  }
  if (st.rules.interact === 'spirit') {
    if (st.spirits[side] !== 'up' || f.facing !== -side) return null;
    return { kind: 'spirit', side, name: st.rules.interactName };
  }
  if (false) {
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
  if (it.kind === 'vault' || it.kind === 'swing') {
    // vault: salta pela corrente do muro e cai atrás do oponente; swing (Forja): balança e chuta, caindo à frente dele
    const swing = it.kind === 'swing';
    const target = clamp(swing ? o.x - f.facing * 0.9 : o.x + f.facing * 1.1, -C.STAGE_HALF + 0.3, C.STAGE_HALF - 0.3);
    f.swing = swing ? { hit: false } : null;
    f.state = 'vault'; f.sf = 0; f.move = null; f.airborne = true; f.crouching = false; f.blocking = false;
    f.vy = 0.205; f.vx = (target - f.x) / VAULT_FRAMES; f.invuln = VAULT_FRAMES + 4; f.y = 0.01; if (swing) f.invuln = 20;
    m.emit({ type: 'interact', kind: it.kind, who: f.idx, side: it.side, x: f.x, name: it.name });
  } else if (it.kind === 'spirit') {
    // invoca o espírito de um samurai ancestral do altar às suas costas (projétil que atravessa o chão)
    st.spirits[it.side] = 'used';
    st.spiritAct.push({ side: it.side, owner: f.idx, f: 0 });
    m.startMove(f, 'invoca_espirito');
    m.emit({ type: 'interact', kind: 'spirit', who: f.idx, side: it.side, x: f.x, name: it.name });
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
  const o = m.fighters[1 - f.idx];
  // Corrente da Forja: o chute do balanço acerta uma vez durante o arco
  if (f.swing && !f.swing.hit && f.sf >= SWING.f0 && f.sf <= SWING.f1 && Math.abs(f.x - o.x) <= SWING.range &&
    o.invuln === 0 && !o.hidden && !['knockdown', 'getup', 'dead', 'cinematic', 'thrown'].includes(o.state)) {
    f.swing.hit = true;
    m.applyHit(f, o, { dmg: SWING.dmg, level: 'mid', kd: true, launch: 0.12, heavy: true, push: 0.14, hs: 30, bs: 16, hitstop: 10 },
      { kind: 'hazard', name: 'corrente_forja' }, { facing: f.facing, kind: 'corrente', hazard: true }, o.x, 1.3);
    f.vx *= 0.25;
  }
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
    const def = m.fighters[1 - s.owner], att = m.fighters[s.owner];
    // v0.3: contato real — a estátua é uma haste que gira no pivô (mesma curva do render); acerta quando
    // a sua altura sobre a posição do oponente desce até a cabeça dele, e não depois de atravessá-lo
    if (!s.hit && s.f >= 8 && s.f <= STATUE.active[1]) {
      const th = statueAngle(s.f);
      const pivot = s.side * STATUE.pivot, dx = Math.abs(pivot - def.x) - 0.3;
      const along = STATUE.reach * Math.sin(Math.min(th, Math.PI / 2));
      const top = def.y + (def.crouching ? 1.12 : def.ch.height - 0.05);
      const hY = STATUE.pivotY + Math.max(0, dx) * Math.cos(th) / Math.max(0.05, Math.sin(th));
      if (dx <= along && hY <= top && def.invuln === 0 && !def.hidden &&
        !['knockdown', 'getup', 'dead', 'cinematic', 'thrown'].includes(def.state)) {
        s.hit = true;
        const hp0 = def.hp;
        m.applyHit(att, def, { dmg: STATUE.dmg, level: 'overhead', kd: true, launch: 0.1, heavy: true, push: 0.1, hs: 20, bs: 16, hitstop: 12 },
          { kind: 'hazard', name: 'estatua' }, { facing: -s.side, kind: 'estatua', hazard: true }, def.x, Math.min(top, 1.7));
        // empurra o oponente para fora da área onde a estátua vai repousar (derrubado ou defendendo)
        const rest = s.side * (STATUE.pivot - STATUE.reach * Math.sin(STATUE.theta) - 0.55);
        const need = (Math.abs(def.x) - Math.abs(rest));
        s.shove = need > 0 ? { left: 16, vx: (-s.side * need) / 16 } : null;
        s.blocked = def.hp === hp0 || def.state === 'blockstun';
        if (!s.blocked) { def.vx = 0; }
      }
    }
    if (s.shove && s.shove.left > 0) {
      s.shove.left--;
      def.x = Math.max(-C.STAGE_HALF, Math.min(C.STAGE_HALF, def.x + s.shove.vx));
    }
    if (s.f === STATUE.active[1]) { st.statues[s.side] = 'down'; m.emit({ type: 'statueDown', side: s.side, hit: s.hit }); }
  }
  st.statueAct = st.statueAct.filter((s) => s.f < 60);
  for (const s of st.spiritAct) {
    s.f++;
    if (s.f === SPIRIT.spawnAt) {
      const f = m.fighters[s.owner], facing = -s.side;
      m.projId = (m.projId || 0) + 1;
      m.projectiles.push({ id: m.projId, owner: s.owner, kind: 'spirit', fx: 'spirit', x: clamp(f.x + facing * 0.6, -C.STAGE_HALF, C.STAGE_HALF), y: 0,
        vx: SPIRIT.vx * facing, vy: 0, box: [-0.35, 0.3, 0.4, 1.8], life: SPIRIT.life, delay: 0, facing, clash: true, ex: false, alive: true, age: 0, hazard: true,
        hit: { f0: 0, f1: 0, box: null, dmg: SPIRIT.dmg, level: 'mid', kd: true, launch: 0.1, hs: 30, bs: 14, push: 0.1, heavy: true, slash: true } });
      m.emit({ type: 'proj', who: s.owner, kind: 'spirit', x: f.x, y: 0, ex: false });
    }
  }
  st.spiritAct = st.spiritAct.filter((s) => s.f < SPIRIT.spawnAt + 1);
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
  // perigo de borda (lava / braseiro / estátua destrutível do Templo)
  const shatter = st.rules.hazard === 'shatter';
  if (nearEdge(def.x, HAZARD_ZONE) && st.hazardCd[def.idx] === 0 && (!shatter || st.guards[side] === 'up')) {
    if (shatter) st.guards[side] = 'broken';
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
    st.statues = fresh(); st.spirits = fresh(); st.guards = fresh(); st.statueAct = []; st.spiritAct = [];
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
