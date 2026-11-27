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
