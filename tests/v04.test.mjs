// v0.4 — arenas Templo dos Samurais Mortos e Forja Infernal, balanceamento, novos lutadores, remapeamento P2/controle
import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, BTN, run, place, seq, fightReady } from './helpers.mjs';
import { ARENAS } from '../src/combat/moves.js';
import { ARENA_RULES } from '../src/combat/arena.js';

const U = BTN.up, D = BTN.down;

test('4 arenas selecionáveis, cada uma com elemento interativo, perigo e transição', () => {
  assert.deepEqual(Object.keys(ARENAS), ['coliseu', 'catedral', 'templo', 'forja']);
  for (const id of Object.keys(ARENAS)) {
    const r = ARENA_RULES[id];
    assert.ok(r && r.areas.length === 2 && r.interact && r.hazard && r.transitionName, id);
  }
});

test('Templo: ↑+O de costas para o altar invoca o Espírito Ancestral (projétil, 1 por lado/round)', () => {
  const m = fightReady({ arena: 'templo' });
  place(m, -7.1, -3.5);
  const hp0 = m.fighters[1].hp;
  seq(m, 0, [[U | BTN.grab, 2], [0, 90]]);
  const evs = m.drainEvents();
  assert.ok(evs.some((e) => e.type === 'interact' && e.kind === 'spirit'));
  assert.ok(evs.some((e) => e.type === 'proj' && e.kind === 'spirit'));
  assert.equal(hp0 - m.fighters[1].hp, 70, 'o espírito acerta');
  assert.equal(m.stage.spirits[-1], 'used');
  run(m, 200); place(m, -7.1, -3.5);
  const hp1 = m.fighters[1].hp;
  seq(m, 0, [[U | BTN.grab, 2], [0, 90]]);
  assert.equal(m.fighters[1].hp, hp1, 'altar já usado neste round');
  // bloqueável
  const m2 = fightReady({ arena: 'templo' });
  place(m2, 7.1, 3.5);
  const h2 = m2.fighters[0].hp;
  for (let i = 0; i < 2; i++) m2.step([BTN.block, U | BTN.grab]);
  for (let i = 0; i < 90; i++) m2.step([BTN.block, 0]);
  assert.ok(h2 - m2.fighters[0].hp < 20, 'defesa segura o espírito');
});

test('Templo: Estátua do Guardião quebra ao receber o oponente derrubado (dano extra, uma vez por lado)', () => {
  const m = fightReady({ arena: 'templo' });
  place(m, 5.7, 6.72); m.stage.transUsed = true;
  const hp0 = m.fighters[1].hp;
  seq(m, 0, [[D | BTN.hk, 2], [D, 14]]);
  const hz = m.drainEvents().find((e) => e.type === 'hazard');
  assert.ok(hz && hz.kind === 'shatter' && hz.name === 'Estátua do Guardião');
  assert.equal(m.stage.guards[1], 'broken');
  assert.equal(hp0 - m.fighters[1].hp, 65 + 50);
  run(m, 420); place(m, 5.7, 6.72);
  const hp1 = m.fighters[1].hp;
  seq(m, 0, [[D | BTN.hk, 2], [D, 14]]);
  assert.equal(hp1 - m.fighters[1].hp, 65, 'estátua já quebrada');
});

test('Forja: ↑+O balança na Corrente da Forja e chuta o oponente (bloqueável), caindo à frente dele', () => {
  const m = fightReady({ arena: 'forja' });
  place(m, -7.1, -4.6);
  const hp0 = m.fighters[1].hp;
  seq(m, 0, [[U | BTN.grab, 2], [0, 70]]);
  const evs = m.drainEvents();
  assert.ok(evs.some((e) => e.type === 'interact' && e.kind === 'swing'));
  assert.equal(hp0 - m.fighters[1].hp, 75);
  assert.ok(m.fighters[0].x < m.fighters[1].x, 'não cruza para trás do oponente');
  const m2 = fightReady({ arena: 'forja' });
  place(m2, -7.1, -4.6);
  const h2 = m2.fighters[1].hp;
  for (let i = 0; i < 2; i++) m2.step([U | BTN.grab, BTN.block]);
  for (let i = 0; i < 70; i++) m2.step([0, BTN.block]);
  assert.ok(h2 - m2.fighters[1].hp < 20, 'defesa segura o chute');
});

test('Templo e Forja: transição para o segundo cenário (Cemitério dos Ronins / Coração da Forja)', () => {
  for (const [arena, to] of [['templo', 'Cemitério dos Ronins'], ['forja', 'Coração da Forja']]) {
    const m = fightReady({ arena });
    place(m, 5.9, 6.95);
    seq(m, 0, [[D | BTN.hk, 2], [D, 14]]);
    assert.equal(m.phase, 'transition', arena);
    assert.ok(m.drainEvents().some((e) => e.type === 'transition' && e.to === to));
    run(m, 160);
    assert.equal(m.stage.area, 1);
    assert.equal(m.phase, 'fight');
  }
});

// ---------------- Nymera e Pestilus
import { CHARACTERS } from '../src/combat/moves.js';
import * as C from '../src/core/constants.js';
const R = BTN.right, L = BTN.left;
const QCF = (b) => [D, D | R, R | b], QCB = (b) => [D, D | L, L | b], DD = (b) => [D, 0, D | b], BF = (b) => [L, R | b];
function ready(p1, p2) { const m = new Match({ p1, p2 }); while (m.phase !== 'fight') m.step([0, 0]); return m; }
function input(m, list, n, p2 = () => 0) { for (let i = 0; i < n; i++) m.step([list[i] ?? 0, p2(i)]); }

test('Nymera e Pestilus: 8 especiais, EX, 2 supers, transformação, 4 fatalidades, IA e final do arcade', async () => {
  const { ENDINGS } = await import('../src/modes/arcade.js');
  for (const id of ['nymera', 'pestilus']) {
    const ch = CHARACTERS[id];
    assert.equal(ch.specials.length, 8, `${id} especiais`);
    assert.equal(ch.fatalities.length, 4);
    assert.ok(ch.transform && ch.superMove && ch.superMove2 && ch.ai && ch.ai.specials.length >= 6);
    for (const sp of ch.specials) assert.ok(ch.moves[sp.move] && ch.moves[sp.move].name && ch.moves[sp.move].kind === 'special', `${id} ${sp.move}`);
    const { buildLadder } = await import('../src/modes/arcade.js');
    const lad = buildLadder(id, 2);
    assert.equal(lad.length, 6); assert.equal(new Set(lad.slice(0, 5).map((s) => s.p2)).size, 5); assert.equal(lad[5].p2, id);
    assert.ok(ENDINGS[id] && ENDINGS[id].title && ENDINGS[id].text.length >= 2, `${id} final`);
  }
});

test('Nymera: Lança de Gelo acerta; versão EX congela em bloco de gelo', () => {
  for (const ex of [false, true]) {
    const m = ready('nymera', 'varkhan'); place(m, -3, 1); m.fighters[0].meter = 150;
    let frozen = false;
    for (let i = 0; i < 70; i++) { m.step([QCF(BTN.lp | (ex ? BTN.hp : 0))[i] ?? 0, 0]); if (m.fighters[1].state === 'frozen' && m.fighters[1].frozenIce) frozen = true; }
    assert.ok(m.fighters[1].hp < 1000, 'lança acertou');
    assert.equal(frozen, ex, `congelou=${ex}`);
  }
});

test('Nymera: Armadilha de Gelo fica no chão (1 por vez), congela quem pisa e não pode ser bloqueada', () => {
  const m = ready('nymera', 'varkhan'); place(m, 0, 4);
  input(m, QCB(BTN.lk), 50);
  assert.equal(m.projectiles.filter((p) => p.kind === 'trap').length, 1);
  input(m, QCB(BTN.lk), 50);
  assert.equal(m.projectiles.filter((p) => p.kind === 'trap').length, 1, 'máximo 1 armadilha');
  const trap = m.projectiles.find((p) => p.kind === 'trap');
  m.fighters[1].x = trap.x + 0.1;
  let frozen = false;
  for (let i = 0; i < 20; i++) { m.step([0, BTN.block]); if (m.fighters[1].state === 'frozen') frozen = true; }
  assert.ok(frozen && m.fighters[1].hp < 1000, 'congelou mesmo bloqueando');
});

test('Nymera: Clone Congelado contra-ataca e congela; Passo Glacial troca de lado; Nevasca multi-golpe', () => {
  const m = ready('nymera', 'varkhan'); place(m, 0, 1.2);
  let counter = false, frozen = false;
  for (let i = 0; i < 70; i++) { m.step([BF(BTN.lp)[i] ?? 0, i === 5 ? BTN.hp : 0]); if (m.events.some((e) => e.type === 'counterStance')) counter = true; if (m.fighters[1].state === 'frozen') frozen = true; }
  assert.ok(counter && frozen && m.fighters[0].hp === 1000);
  const m2 = ready('nymera', 'varkhan'); place(m2, -2, 2);
  input(m2, DD(BTN.lk), 50);
  assert.ok(m2.fighters[0].x > m2.fighters[1].x, 'reapareceu atrás');
  const m3 = ready('nymera', 'varkhan'); place(m3, 0, 1.4);
  let hits = 0;
  for (let i = 0; i < 70; i++) { m3.step([DD(BTN.lp)[i] ?? 0, 0]); hits += m3.drainEvents().filter((e) => e.type === 'hit' && e.att === 0).length; }
  assert.equal(hits, 4);
});

test('Pestilus: Seringa envenena (dano por tempo, nunca abaixo de 1 PV) e Bisturi também', () => {
  const m = ready('pestilus', 'varkhan'); place(m, -3, 1);
  input(m, BF(BTN.lp), 30);
  assert.ok(m.fighters[1].poison > 0, 'envenenado');
  const hp0 = m.fighters[1].hp;
  input(m, [], 120);
  assert.ok(m.fighters[1].hp <= hp0 - C.POISON_TICK * 6, `veneno tirou ${hp0 - m.fighters[1].hp}`);
  const m2 = ready('pestilus', 'varkhan'); place(m2, -1, 1);
  m2.fighters[1].hp = 3;
  m2.fighters[1].poison = 200;
  input(m2, [], 200);
  assert.equal(m2.fighters[1].hp, 1, 'veneno não mata');
  const m3 = ready('pestilus', 'varkhan'); place(m3, -1.6, 1);
  input(m3, QCF(BTN.lk), 40);
  assert.ok(m3.fighters[1].hp < 1000 && m3.fighters[1].poison > 0, 'bisturi envenena');
});

test('Pestilus: Bomba Tóxica faz arco e vira nuvem ao tocar o chão; Nuvem Corrosiva causa dano contínuo', () => {
  const m = ready('pestilus', 'varkhan'); place(m, -3, 3);
  let peak = 0, burst = false, cloud = false;
  for (let i = 0; i < 140; i++) {
    m.step([QCF(BTN.lp)[i] ?? 0, 0]);
    const b = m.projectiles.find((p) => p.kind === 'bomb'); if (b) peak = Math.max(peak, b.y);
    if (m.events.some((e) => e.type === 'burst')) burst = true;
    if (m.projectiles.some((p) => p.kind === 'bombcloud')) cloud = true;
  }
  assert.ok(peak > 2.0 && burst && cloud, `arco ${peak.toFixed(2)} / nuvem`);
  const m2 = ready('pestilus', 'varkhan'); place(m2, 0, 2.0);
  let hits = 0;
  for (let i = 0; i < 170; i++) { m2.step([QCB(BTN.lp)[i] ?? 0, 0]); hits += m2.drainEvents().filter((e) => e.type === 'hit' && e.att === 0).length; }
  assert.ok(hits >= 3, `nuvem acertou ${hits}x`);
});

test('Pestilus: Enxame de Ratos é baixo; Corvos da Peste são por cima; Explosão Miasmática derruba', () => {
  const tryM = (cmd, bits, dist = 2.5) => { const m = ready('pestilus', 'varkhan'); place(m, 0, dist); for (let i = 0; i < 80; i++) m.step([cmd[i] ?? 0, bits]); return 1000 - m.fighters[1].hp; };
  assert.ok(tryM(QCB(BTN.lk), BTN.block) > 20, 'ratos: em pé não segura');
  assert.ok(tryM(QCB(BTN.lk), BTN.block | D) < 10, 'ratos: agachado segura');
  assert.ok(tryM(BF(BTN.lk), BTN.block | D, 3) > 20, 'corvos: agachado não segura');
  const m = ready('pestilus', 'varkhan'); place(m, 0, 1.2);
  let down = false;
  for (let i = 0; i < 60; i++) { m.step([DD(BTN.lp)[i] ?? 0, 0]); if (m.fighters[1].state === 'knockdown' || m.fighters[1].airborne) down = true; }
  assert.ok(down);
});

test('supergolpes de Nymera e Pestilus: cinemática, dano e controle devolvido', () => {
  for (const [id, alt] of [['nymera', false], ['nymera', true], ['pestilus', false], ['pestilus', true]]) {
    const m = ready(id, 'varkhan'); place(m, 0, 1.2);
    m.fighters[0].meter = 200;
    let cine = null;
    for (let i = 0; i < 260; i++) { m.step([alt ? (i < 2 ? D : i === 2 ? D | BTN.lk | BTN.hk : 0) : i === 0 ? BTN.lk | BTN.hk : 0, 0]); if (m.cine) cine = m.cine.id; }
    assert.equal(cine, alt ? CHARACTERS[id].superMove2 : CHARACTERS[id].superMove, `${id} ${alt}`);
    assert.ok(1000 - m.fighters[1].hp >= 250, `${id} dano ${1000 - m.fighters[1].hp}`);
    assert.ok(!m.cine && m.fighters[0].state !== 'cinematic');
  }
});
