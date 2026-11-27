// v0.3 — Kazuro, Brakkor e mecânicas genéricas (agarrão de comando, superarmadura, terremoto, contra-ataque)
import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, BTN, run, place } from './helpers.mjs';
import { CHARACTERS, FAT_META } from '../src/combat/moves.js';
import { CpuController } from '../src/ai/cpu.js';
import * as C from '../src/core/constants.js';

const R = BTN.right, L = BTN.left, D = BTN.down;
const IDS = ['varkhan', 'lilith', 'kazuro', 'brakkor', 'nymera', 'pestilus'];
function ready(p1, p2) { const m = new Match({ p1, p2 }); while (m.phase !== 'fight') m.step([0, 0]); return m; }
const QCF = (b) => [D, D | R, R | b], QCB = (b) => [D, D | L, L | b], DD = (b) => [D, 0, D | b], BF = (b) => [L, R | b];
function input(m, who, list, n) { for (let i = 0; i < n; i++) m.step(who === 0 ? [list[i] ?? 0, 0] : [0, list[i] ?? 0]); }

test('6 lutadores com dados completos: especiais, 2 supers, transformação, 4 fatalidades com timeline, AI, pose de vitória', async () => {
  const { FATALITIES, SUPERS } = await import('../src/fatalities/timelines.js').catch(() => ({ FATALITIES: null, SUPERS: null }));
  assert.deepEqual(Object.keys(CHARACTERS), IDS);
  for (const ch of Object.values(CHARACTERS)) {
    assert.ok(ch.transform && ch.winPose && ch.aura, ch.id);
    for (const s of [ch.superMove, ch.superMove2]) assert.ok(ch.moves[s].seq, `${ch.id} ${s} cinematográfico`);
    for (const fat of ch.fatalities) { assert.ok(FAT_META[fat.id] && fat.dur > 0, `${fat.id} meta`); if (FATALITIES) assert.ok(FATALITIES[fat.id], `${fat.id} timeline`); }
    if (SUPERS) for (const s of [ch.superMove, ch.superMove2]) assert.ok(SUPERS[s], `${s} timeline`);
    for (const id of ch.ai.specials.concat(ch.ai.close || [], ch.ai.long || [], ch.ai.grabs || [])) assert.ok(ch.moves[id], `${ch.id} AI ${id}`);
  }
});

test('Kazuro: Corte Espectral (projétil), Investida Relâmpago avança e acerta, Lâmina Ascendente lança', () => {
  let m = ready('kazuro', 'varkhan'); place(m, -3, 1);
  let proj = false;
  for (let i = 0; i < 60; i++) { m.step([QCF(BTN.lp)[i] ?? 0, 0]); if (m.projectiles.some((p) => p.kind === 'slash')) proj = true; }
  assert.ok(proj && m.fighters[1].hp < 1000, 'corte espectral acertou');
  m = ready('kazuro', 'varkhan'); place(m, -2, 1);
  input(m, 0, QCF(BTN.lk), 50);
  assert.ok(m.fighters[1].hp < 1000 && m.fighters[1].hp >= 1000 - 70, 'investida');
  m = ready('kazuro', 'varkhan'); place(m, 0, 1.0);
  let launched = false;
  for (let i = 0; i < 40; i++) { m.step([DD(BTN.lp)[i] ?? 0, 0]); if (m.fighters[1].airborne) launched = true; }
  assert.ok(launched, 'lâmina ascendente lança');
});

test('Kazuro: Lâmina Reflexa contra-ataca e Passo das Sombras troca de lado', () => {
  const m = ready('kazuro', 'varkhan'); place(m, 0, 1.2);
  let counter = false;
  for (let i = 0; i < 70; i++) { m.step([QCB(BTN.lk)[i] ?? 0, i === 5 ? BTN.hp : 0]); if (m.events.some((e) => e.type === 'counterStance' && e.name === 'Lâmina Reflexa')) counter = true; }
  assert.ok(counter);
  assert.equal(m.fighters[0].hp, 1000);
  assert.ok(m.fighters[1].hp < 1000);
  const m2 = ready('kazuro', 'varkhan'); place(m2, -2, 2);
  input(m2, 0, DD(BTN.lk), 50);
  assert.ok(m2.fighters[0].x > m2.fighters[1].x, 'reapareceu atrás');
});

test('Kazuro: Dança das Mil Lâminas conecta 5 golpes; Duplicata Sombria é projétil', () => {
  const m = ready('kazuro', 'varkhan'); place(m, 0, 1.1);
  let hits = 0;
  for (let i = 0; i < 80; i++) { m.step([BF(BTN.lp)[i] ?? 0, 0]); hits += m.drainEvents().filter((e) => e.type === 'hit' && e.att === 0).length; }
  assert.equal(hits, 5);
  const m2 = ready('kazuro', 'varkhan'); place(m2, -3, 1);
  let clone = false;
  for (let i = 0; i < 40; i++) { m2.step([BF(BTN.lk)[i] ?? 0, 0]); if (m2.projectiles.some((p) => p.kind === 'clone')) clone = true; }
  assert.ok(clone);
});

test('Brakkor: Esmagamento é agarrão de comando (vence bloqueio, sem escape) e Devorar cura', () => {
  const m = ready('brakkor', 'varkhan'); place(m, 0, 1.1);
  for (let i = 0; i < 80; i++) m.step([QCB(BTN.lp)[i] ?? 0, BTN.block | (i > 10 && i % 2 ? BTN.grab : 0)]);
  assert.equal(m.fighters[1].hp, 1000 - 125, 'esmagamento ignora defesa e escape');
  const m2 = ready('brakkor', 'varkhan'); place(m2, 0, 1.0);
  m2.fighters[0].hp = 600;
  input(m2, 0, DD(BTN.lk), 80);
  assert.equal(m2.fighters[1].hp, 1000 - 95);
  assert.equal(m2.fighters[0].hp, 660);
  // agarrão de comando não pega oponente no ar
  const m3 = ready('brakkor', 'varkhan'); place(m3, 0, 1.1);
  m3.fighters[1].airborne = true; m3.fighters[1].state = 'air'; m3.fighters[1].y = 1.2; m3.fighters[1].vy = 0.0;
  input(m3, 0, QCB(BTN.lp), 12);
  assert.notEqual(m3.fighters[0].state, 'throw');
});

test('Brakkor: superarmadura absorve 1 golpe na Investida do Touro e o golpe continua', () => {
  const m = ready('brakkor', 'varkhan'); place(m, 0, 2.2);
  let armor = false;
  for (let i = 0; i < 60; i++) { m.step([QCF(BTN.lk)[i] ?? 0, i === 6 ? BTN.lp : 0]); if (m.events.some((e) => e.type === 'armor')) armor = true; }
  assert.ok(armor, 'armadura absorveu');
  assert.ok(m.fighters[0].hp < 1000, 'sofre dano reduzido');
  assert.ok(m.fighters[1].hp < 1000, 'investida conectou mesmo assim');
});

test('Brakkor: Terremoto é baixo (bloqueio em pé falha, agachado segura) e pulo escapa', () => {
  const tryQ = (bits) => { const m = ready('brakkor', 'varkhan'); place(m, 0, 2.0); for (let i = 0; i < 70; i++) m.step([DD(BTN.lp)[i] ?? 0, bits]); return 1000 - m.fighters[1].hp; };
  assert.ok(tryQ(BTN.block) >= 80, 'em pé não segura');
  assert.ok(tryQ(BTN.block | D) < 20, 'agachado segura');
  const m = ready('brakkor', 'varkhan'); place(m, 0, 2.0);
  for (let i = 0; i < 70; i++) m.step([DD(BTN.lp)[i] ?? 0, i >= 12 && i < 14 ? BTN.up : 0]);
  assert.equal(m.fighters[1].hp, 1000, 'pulou por cima');
});

test('Brakkor: Bola de Fogo, Salto Esmagador (por cima) e Sopro Infernal multi-golpe', () => {
  let m = ready('brakkor', 'varkhan'); place(m, -3, 1);
  input(m, 0, QCF(BTN.lp), 90);
  assert.equal(1000 - m.fighters[1].hp, 75);
  m = ready('brakkor', 'varkhan'); place(m, -1.5, 1.2);
  for (let i = 0; i < 70; i++) m.step([BF(BTN.lk)[i] ?? 0, BTN.block | D]);
  assert.ok(m.fighters[1].hp < 1000, 'agachado não segura golpe por cima');
  m = ready('brakkor', 'varkhan'); place(m, 0, 1.5);
  let hits = 0;
  for (let i = 0; i < 70; i++) { m.step([QCB(BTN.lk)[i] ?? 0, 0]); hits += m.drainEvents().filter((e) => e.type === 'hit' && e.att === 0).length; }
  assert.equal(hits, 4);
});

test('supergolpes 1 e 2 de Kazuro e Brakkor: cinemática, dano e controle devolvido', () => {
  for (const [id, alt, total] of [['kazuro', false, 330], ['kazuro', true, 330], ['brakkor', false, 340], ['brakkor', true, 350]]) {
    const m = ready(id, 'varkhan'); place(m, 0, 1.2);
    m.fighters[0].meter = 200; m.fighters[0].hp = 800;
    let cine = null;
    for (let i = 0; i < 260; i++) { m.step([alt ? (i < 2 ? D : i === 2 ? D | BTN.lk | BTN.hk : 0) : i === 0 ? BTN.lk | BTN.hk : 0, 0]); if (m.cine) cine = m.cine.id; }
    assert.equal(cine, alt ? CHARACTERS[id].superMove2 : CHARACTERS[id].superMove, `${id} ${alt}`);
    assert.equal(1000 - m.fighters[1].hp, total, `${id} dano do super`);
    assert.ok(!m.cine && m.fighters[0].state !== 'cinematic');
    if (id === 'brakkor' && alt) assert.equal(m.fighters[0].hp, 880, 'banquete cura');
  }
});

function toFinish(p1, p2) {
  const m = ready(p1, p2);
  m.fighters[0].wins = 1; m.fighters[1].hp = 5; place(m, 0, 0.95);
  run(m, 30, (i) => (i === 0 ? BTN.lp : 0), 0);
  while (m.phase !== 'finish') m.step([0, 0]);
  return m;
}
for (const id of ['kazuro', 'brakkor', 'nymera', 'pestilus']) {
  test(`${id}: as 4 fatalidades saem pelo comando completo e pelo atalho ESP+direção`, () => {
    for (const fat of CHARACTERS[id].fatalities) {
      // comando completo
      const m = toFinish(id, 'lilith');
      const [a, b] = m.fighters; a.facing = 1; b.facing = -1;
      a.x = b.x - (fat.range[0] + Math.min(fat.range[1], 4)) / 2;
      const dig = { 2: D, 4: L, 6: R };
      for (const d of fat.motion) { m.step([dig[d], 0]); m.step([0, 0]); }
      m.step([dig[fat.motion[fat.motion.length - 1]] | BTN[fat.btn], 0]);
      assert.equal(m.fatal && m.fatal.id, fat.id, `${fat.id} comando`);
      run(m, fat.dur + 30);
      assert.equal(m.phase, 'matchEnd'); assert.equal(m.result.fatality, fat.id);
      // atalho
      const m2 = toFinish(id, 'lilith');
      const [a2, b2] = m2.fighters; a2.facing = 1;
      a2.x = b2.x - (fat.range[0] + Math.min(fat.range[1], 4)) / 2;
      const dir = { n: 0, d: D, f: R, b: L }[fat.simple];
      m2.step([dir, 0]); m2.step([dir | BTN.special, 0]);
      assert.equal(m2.fatal && m2.fatal.id, fat.id, `${fat.id} atalho`);
    }
  });
}

test('CPU vs CPU: todos os 36 confrontos terminam; nenhum lutador domina (taxa de vitória 25–75%)', () => {
  const wins = Object.fromEntries(IDS.map((i) => [i, [0, 0]]));
  let n0 = 0;
  const N = IDS.length * IDS.length * 2;
  for (let s = 0; s < N; s++) {
    const p1 = IDS[s % IDS.length], p2 = IDS[Math.floor(s / IDS.length) % IDS.length];
    const m = new Match({ p1, p2, arena: ['coliseu', 'catedral', 'templo', 'forja'][s % 4] });
    const a = new CpuController(0, 2, s * 7 + 1), b = new CpuController(1, 2, s * 31 + 5);
    let n = 0;
    while (m.phase !== 'matchEnd' && n < 60 * 60 * 12) { m.step([a.next(m), b.next(m)]); n++; }
    assert.equal(m.phase, 'matchEnd', `partida ${p1} x ${p2}`);
    n0 += n;
    for (const f of m.fighters) assert.ok(f.hp >= 0 && f.hp <= C.MAX_HP && Math.abs(f.x) <= C.STAGE_HALF + 1e-6);
    if (p1 === p2) continue;
    const w = m.result.winner;
    wins[p1][1]++; wins[p2][1]++;
    wins[w === 0 ? p1 : p2][0]++;
  }
  const rates = Object.fromEntries(Object.entries(wins).map(([k, [w, t]]) => [k, +(w / t).toFixed(2)]));
  console.log('# taxa de vitória CPU x CPU (dif. 2, 60 partidas não-espelho):', JSON.stringify(rates), 'quadros médios', Math.round(n0 / N));
  for (const [k, r] of Object.entries(rates)) assert.ok(r >= 0.25 && r <= 0.75, `${k} ${r}`);
});

test('bugfix v0.2: a Estátua do Carrasco colide (acerta no contato, antes de deitar) e tira o oponente de baixo dela', async () => {
  const { STATUE, statueAngle } = await import('../src/combat/arena.js');
  const rest = STATUE.pivot - STATUE.reach * Math.sin(STATUE.theta);
  for (const [x1, bits, blocked] of [[4.6, 0, false], [6.0, D, false], [5.2, BTN.block, true]]) {
    const mm = new Match({ p1: 'varkhan', p2: 'lilith', arena: 'catedral' }); while (mm.phase !== 'fight') mm.step([0, 0]);
    place(mm, 7.1, x1);
    let hitF = -1;
    for (let i = 0; i < 2; i++) mm.step([BTN.up | BTN.grab, bits]);
    for (let i = 0; i < 70; i++) { mm.step([0, bits]); const a = mm.stage.statueAct[0]; if (hitF < 0 && a && a.hit) hitF = a.f; }
    assert.ok(hitF > 0 && hitF <= STATUE.active[1], `contato no quadro ${hitF}`);
    // no quadro do contato a estátua ainda está acima do topo do oponente (não atravessou)
    const th = statueAngle(hitF - 1), dx = STATUE.pivot - x1 - 0.3;
    assert.ok(STATUE.pivotY + dx / Math.tan(th) > (bits === D ? 1.12 : 1.75) - 0.01 || dx > STATUE.reach * Math.sin(th), 'antes do contato ela não atravessa');
    assert.ok(mm.fighters[1].x <= rest - 0.4, `oponente fora da estátua (${mm.fighters[1].x.toFixed(2)} ≤ ${(rest - 0.4).toFixed(2)})`);
    if (!blocked) assert.ok(mm.fighters[1].hp < 1000);
  }
});
