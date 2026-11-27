import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, BTN, fightReady, run, seq, place } from './helpers.mjs';
import { CHARACTERS, moveFrameData } from '../src/combat/moves.js';
import { InputBuffer } from '../src/combat/input.js';
import { CpuController } from '../src/ai/cpu.js';
import * as C from '../src/core/constants.js';

const R = BTN.right, L = BTN.left, D = BTN.down, U = BTN.up;

test('dados de golpes: todos os golpes têm quadros válidos e caixas coerentes', () => {
  for (const ch of Object.values(CHARACTERS)) {
    for (const m of Object.values(ch.moves)) {
      assert.ok(m.frames > 0, `${ch.id}.${m.id} frames`);
      for (const h of m.hits) {
        assert.ok(h.f0 >= 1 && h.f1 >= h.f0 && h.f1 < m.frames, `${ch.id}.${m.id} janela ativa`);
        assert.ok(h.box[0] < h.box[2] && h.box[1] < h.box[3], `${ch.id}.${m.id} caixa`);
        assert.ok(h.dmg >= 0 && h.dmg <= 200, `${ch.id}.${m.id} dano`);
      }
      for (const c of m.cancel) if (!['special', 'super'].includes(c)) assert.ok(ch.moves[c], `${ch.id}.${m.id} cancela para golpe inexistente ${c}`);
    }
    assert.equal(ch.specials.length, 8, `${ch.id} tem 8 especiais`);
    assert.equal(ch.fatalities.length, 4, `${ch.id} tem 4 fatalidades`);
    assert.ok(ch.superMove2 && ch.moves[ch.superMove2].kind === 'super', `${ch.id} tem 2º supergolpe`);
    assert.equal(new Set(ch.fatalities.map((f) => f.simple)).size, 4, 'atalhos ESP distintos');
    for (const s of ch.specials) assert.ok(ch.moves[s.move], `${ch.id} especial ${s.move}`);
  }
});

test('grafo de cancelamentos é acíclico (sem combos infinitos por encadeamento)', () => {
  for (const ch of Object.values(CHARACTERS)) {
    const seen = new Set(), stack = new Set();
    const dfs = (id) => {
      if (stack.has(id)) {
        // auto-cancelamento só é permitido em golpes baixos rápidos cuja vantagem impede loop real
        return id;
      }
      if (seen.has(id)) return null;
      seen.add(id); stack.add(id);
      for (const c of ch.moves[id].cancel) if (ch.moves[c]) { const r = dfs(c); if (r && r !== c) return r; if (r === c && c !== id) return r; }
      stack.delete(id); return null;
    };
    for (const id of Object.keys(ch.moves)) assert.equal(dfs(id), null, `${ch.id}: ciclo de cancelamento a partir de ${id}`);
  }
});

test('auto-cancelamentos (soco/chute baixo repetido) não geram loop infinito: combo termina', () => {
  const m = fightReady();
  place(m, 0, 0.9);
  // spam de ↓+J alternando a cada quadro
  run(m, 240, (i) => D | (i % 3 === 0 ? BTN.lp : 0), 0);
  assert.ok(m.fighters[1].stats.maxComboTaken === undefined || m.fighters[1].stats.maxComboTaken < 12, 'combo limitado por empurrão/hitstun decrescente');
});

test('detecção de comandos direcionais (↓→, ←→, ↓↓, inversão por lado)', () => {
  const b = new InputBuffer();
  for (const bits of [D, D, D | R, R]) b.push(bits, 1);
  assert.ok(b.motion([2, 6]));
  assert.ok(!b.motion([2, 4]));
  const c = new InputBuffer();
  for (const bits of [D, D, D | L, L]) c.push(bits, -1); // virado para a esquerda: ← é frente
  assert.ok(c.motion([2, 6]));
  const d = new InputBuffer();
  for (const bits of [D, D, 0, 0, D]) d.push(bits, 1);
  assert.ok(d.motion([2, 2]));
  const e = new InputBuffer();
  for (let i = 0; i < 6; i++) e.push(D, 1);
  assert.ok(!e.motion([2, 2]), 'segurar ↓ não conta como ↓↓');
});

test('golpe só acerta durante a janela ativa', () => {
  const m = fightReady();
  place(m, 0, 0.95);
  const lp = CHARACTERS.varkhan.moves.lp;
  m.step([BTN.lp, 0]);
  let hitFrame = -1;
  for (let i = 1; i < 30; i++) {
    m.step([0, 0]);
    if (m.fighters[1].hp < 1000) { hitFrame = m.fighters[0].mf; break; }
  }
  assert.ok(hitFrame >= lp.hits[0].f0 && hitFrame <= lp.hits[0].f1, `acertou no quadro ${hitFrame}`);
});

test('golpe fora de alcance não acerta (sem atravessamento de hitbox)', () => {
  const m = fightReady();
  place(m, 0, 2.5);
  seq(m, 0, [[BTN.lp, 1], [0, 30]]);
  assert.equal(m.fighters[1].hp, 1000);
});

test('pushbox impede atravessar o oponente andando', () => {
  const m = fightReady();
  place(m, 0, 1.0);
  run(m, 120, R, L);
  const [a, b] = m.fighters;
  assert.ok(b.x - a.x >= 0.6, `separação ${b.x - a.x}`);
  assert.equal(a.facing, 1);
});

test('bloqueio: reduz dano a zero em normais, chip em especiais; baixo exige agachar', () => {
  let m = fightReady(); place(m, 0, 0.95);
  for (let i = 0; i < 40; i++) m.step([i === 0 ? BTN.lp : 0, BTN.block]);
  assert.equal(m.fighters[1].hp, 1000, 'normal bloqueado sem dano');
  m = fightReady(); place(m, 0, 1.0);
  for (let i = 0; i < 40; i++) m.step([i === 0 ? D | BTN.lk : D, BTN.block]);
  assert.ok(m.fighters[1].hp < 1000, 'baixo acerta defesa em pé');
  m = fightReady(); place(m, 0, 1.0);
  for (let i = 0; i < 40; i++) m.step([i === 0 ? D | BTN.lk : D, BTN.block | D]);
  assert.equal(m.fighters[1].hp, 1000, 'baixo bloqueado agachado');
  m = fightReady(); place(m, -1, 1.5);
  seq(m, 0, []);
  for (let i = 0; i < 60; i++) m.step([[D, D, D | R, R | BTN.lp][i] ?? 0, BTN.block]);
  const def = m.fighters[1];
  assert.ok(def.hp < 1000 && def.hp > 980, `chip do especial (${def.hp})`);
});

test('ataque por cima (Julgamento) exige bloqueio em pé', () => {
  const m = fightReady(); place(m, 0, 1.2);
  for (let i = 0; i < 60; i++) m.step([[D, D, D | L, L | BTN.lp][i] ?? 0, BTN.block | D]);
  assert.ok(m.fighters[1].hp <= 1000 - 100, 'Julgamento atravessa defesa baixa');
});

test('hitstun e blockstun definidos pelos dados', () => {
  const m = fightReady(); place(m, 0, 0.95);
  const h = CHARACTERS.varkhan.moves.lp.hits[0];
  m.step([BTN.lp, 0]);
  while (m.fighters[1].state !== 'hitstun') m.step([0, 0]);
  assert.ok(Math.abs(m.fighters[1].hitstun - h.hs) <= 1);
});

test('combo encadeado Sentença Tripla (J, J, K) conecta 3 golpes com escala de dano', () => {
  const m = fightReady(); place(m, 0, 0.95);
  const plan = [];
  plan[0] = BTN.lp; plan[10] = BTN.lp; plan[20] = BTN.hp;
  let maxCombo = 0;
  for (let i = 0; i < 90; i++) { m.step([plan[i] || 0, 0]); maxCombo = Math.max(maxCombo, m.fighters[1].comboHits); }
  assert.equal(maxCombo, 3);
  const raw = 35 + 35 + 75;
  const dealt = 1000 - m.fighters[1].hp;
  assert.ok(dealt < raw && dealt > raw * 0.7, `dano escalado ${dealt}`);
});

test('agarrão vence bloqueio; escape com O na janela', () => {
  let m = fightReady(); place(m, 0, 0.9);
  for (let i = 0; i < 80; i++) m.step([i === 0 ? BTN.grab : 0, BTN.block]);
  assert.equal(m.fighters[1].hp, 1000 - CHARACTERS.varkhan.throwDmg);
  m = fightReady(); place(m, 0, 0.9);
  for (let i = 0; i < 80; i++) m.step([i === 0 ? BTN.grab : 0, i === 4 ? BTN.grab : 0]);
  assert.equal(m.fighters[1].hp, 1000, 'escapou');
});

test('projéteis colidem entre si e se anulam', () => {
  const m = new Match({ p1: 'varkhan', p2: 'lilith' });
  while (m.phase !== 'fight') m.step([0, 0]);
  place(m, -3, 3);
  const cmd = [D, D, D | R, R | BTN.lp];
  const cmd2 = [D, D, D | L, L | BTN.lp];
  let clash = false;
  for (let i = 0; i < 60; i++) { m.step([cmd[i] ?? 0, cmd2[i] ?? 0]); if (m.events.some((e) => e.type === 'clash')) clash = true; }
  assert.ok(clash);
  assert.equal(m.fighters[0].hp, 1000); assert.equal(m.fighters[1].hp, 1000);
});

test('especial potencializado consome 1 barra e causa mais dano', () => {
  const dmgOf = (ex) => {
    const m = fightReady(); place(m, -2, 1);
    m.fighters[0].meter = 150;
    const cmd = [D, D, D | R, R | BTN.lp | (ex ? BTN.hp : 0)];
    for (let i = 0; i < 80; i++) m.step([cmd[i] ?? 0, 0]);
    return { dmg: 1000 - m.fighters[1].hp, meter: m.fighters[0].meter };
  };
  const a = dmgOf(false), b = dmgOf(true);
  assert.ok(b.dmg > a.dmg, `EX ${b.dmg} > normal ${a.dmg}`);
  assert.ok(b.meter < a.meter - 50);
});

test('supergolpe exige 2 barras e gera sequência cinematográfica', () => {
  const m = fightReady(); place(m, 0, 1.2);
  m.fighters[0].meter = 100;
  let superEv = false;
  for (let i = 0; i < 20; i++) { m.step([i === 0 ? BTN.lk | BTN.hk : 0, 0]); if (m.events.some((e) => e.type === 'super')) superEv = true; }
  assert.ok(!m.cine && !superEv, 'sem barras suficientes não sai supergolpe');
  const m2 = fightReady(); place(m2, 0, 1.2);
  m2.fighters[0].meter = 200;
  let sawCine = false;
  for (let i = 0; i < 220; i++) { m2.step([i === 0 ? BTN.lk | BTN.hk : 0, 0]); if (m2.cine) sawCine = true; }
  assert.ok(sawCine);
  assert.equal(m2.fighters[0].meter < 100, true);
  assert.equal(1000 - m2.fighters[1].hp, 330);
});

test('Prisão Infernal imobiliza e Corrente da Morte puxa', () => {
  let m = fightReady(); place(m, -2.5, 1);
  let froze = false;
  for (let i = 0; i < 80; i++) { m.step([[L, R | BTN.lk][i] ?? 0, 0]); if (m.fighters[1].state === 'frozen') froze = true; }
  assert.ok(froze);
  m = fightReady(); place(m, -2, 1.2);
  for (let i = 0; i < 30; i++) m.step([[L, R | BTN.lp][i] ?? 0, 0]);
  assert.ok(Math.abs(m.fighters[1].x - m.fighters[0].x) < 1.4, 'puxado para perto');
});

test('Lilith: teletransporte troca de lado, regeneração limitada a 2 usos', () => {
  const m = new Match({ p1: 'lilith', p2: 'varkhan' });
  while (m.phase !== 'fight') m.step([0, 0]);
  place(m, -2, 2);
  for (let i = 0; i < 50; i++) m.step([[D, 0, D | BTN.lk][i] ?? 0, 0]);
  assert.ok(m.fighters[0].x > m.fighters[1].x, 'reapareceu atrás');
  const m2 = new Match({ p1: 'lilith', p2: 'varkhan' });
  while (m2.phase !== 'fight') m2.step([0, 0]);
  m2.fighters[0].hp = 500;
  for (let k = 0; k < 3; k++) for (let i = 0; i < 70; i++) m2.step([[D, 0, D | BTN.lp][i] ?? 0, 0]);
  assert.equal(m2.fighters[0].hp, 500 + 160, 'curou 2x80 e a 3ª foi negada');
});

test('Véu Escarlate contra-ataca golpe recebido', () => {
  const m = new Match({ p1: 'lilith', p2: 'varkhan' });
  while (m.phase !== 'fight') m.step([0, 0]);
  place(m, 0, 1.2);
  const p1 = [D, D | L, L | BTN.lk];
  for (let i = 0; i < 70; i++) m.step([p1[i] ?? 0, i === 5 ? BTN.hp : 0]);
  assert.equal(m.fighters[0].hp, 1000);
  assert.ok(m.fighters[1].hp < 1000);
});

test('limite de relançamento aéreo (juggle) protege contra sequências infinitas', () => {
  const m = fightReady(); place(m, 0, 0.9);
  for (let i = 0; i < 400; i++) m.step([(i % 4 === 0 ? D | BTN.hp : D), 0]);
  assert.ok((m.fighters[1].stats.maxComboTaken || 0) <= C.JUGGLE_MAX + 2);
});

test('round termina por nocaute; partida com 2 vitórias leva à janela de finalização', () => {
  const m = fightReady();
  m.fighters[1].hp = 10; place(m, 0, 0.95);
  run(m, 30, (i) => (i === 0 ? BTN.hp : 0), 0);
  while (m.phase === 'ko') m.step([0, 0]);
  assert.equal(m.phase, 'roundEnd'); assert.equal(m.fighters[0].wins, 1);
  while (m.phase !== 'fight') m.step([0, 0]);
  assert.equal(m.round, 2);
  m.fighters[1].hp = 10; place(m, 0, 0.95);
  run(m, 30, (i) => (i === 0 ? BTN.hp : 0), 0);
  while (m.phase === 'ko') m.step([0, 0]);
  assert.equal(m.phase, 'finish');
  assert.equal(m.fighters[1].state, 'dizzy');
});

test('cronômetro: tempo esgotado dá vitória a quem tem mais vida', () => {
  const m = new Match({ p1: 'varkhan', p2: 'lilith', timer: 3 });
  while (m.phase !== 'fight') m.step([0, 0]);
  m.fighters[1].hp = 900;
  run(m, 200);
  assert.equal(m.fighters[0].wins, 1);
});

function toFinish(p1 = 'varkhan', p2 = 'lilith') {
  const m = new Match({ p1, p2 });
  while (m.phase !== 'fight') m.step([0, 0]);
  m.fighters[0].wins = 1; m.fighters[1].hp = 5; place(m, 0, 0.95);
  run(m, 30, (i) => (i === 0 ? BTN.hp : 0), 0);
  while (m.phase !== 'finish') m.step([0, 0]);
  return m;
}

for (const [ch, fat, dist, inputs] of [
  ['varkhan', 'execucao_real', 1.2, [D, D, D | R, R, D, D | BTN.hp]],
  ['varkhan', 'machado_condenacao', 3.2, [L, L, 0, R, R, 0, L, L | BTN.hk]],
  ['lilith', 'explosao_carmesim', 2.5, [D, D, D | R, R, 0, R | BTN.hp]],
  ['lilith', 'ritual_proibido', 1.5, [L, L, 0, L, L, D, D | BTN.hk]],
  ['varkhan', 'correntes_suplicio', 2.4, [R, R, 0, L, L, 0, R, R | BTN.lp]],
  ['varkhan', 'ruptura_infernal', 1.2, [D, D, 0, D, D, 0, D, D | BTN.lk]],
  ['lilith', 'beijo_morte', 1.2, [R, R, 0, R, R, D, D | BTN.lp]],
  ['lilith', 'chuva_final', 3.4, [L, L, D, D, L, L | BTN.lk]],
]) {
  test(`fatalidade ${fat}: comando validado na distância e retorno ao fim da partida`, () => {
    const m = toFinish(ch, ch === 'varkhan' ? 'lilith' : 'varkhan');
    const [a, b] = m.fighters;
    a.x = b.x - dist; a.facing = 1;
    for (const bits of inputs) m.step([bits, 0]);
    assert.equal(m.phase, 'fatality', `fase ${m.phase}`);
    assert.equal(m.fatal.id, fat);
    while (m.phase === 'fatality') m.step([0, 0]);
    assert.equal(m.phase, 'matchEnd');
    assert.equal(m.result.fatality, fat);
    assert.equal(m.result.winner, 0);
  });
}

test('fatalidade fora da distância é recusada; janela expira encerrando a partida', () => {
  const m = toFinish();
  const [a, b] = m.fighters; a.x = b.x - 4; a.facing = 1;
  for (const bits of [D, D, D | R, R, D, D | BTN.hp]) m.step([bits, 0]);
  assert.equal(m.phase, 'finish');
  assert.ok(m.events.some((e) => e.type === 'fatalHint'));
  run(m, C.FINISH_WINDOW + 10);
  assert.equal(m.phase, 'matchEnd'); assert.equal(m.result.fatality, null);
});

test('quebra de combo custa 2 barras e interrompe a sequência', () => {
  const m = fightReady(); place(m, 0, 0.95);
  m.fighters[1].meter = 200;
  const plan = []; plan[0] = BTN.lp; plan[10] = BTN.lp;
  let broke = false;
  for (let i = 0; i < 40; i++) { m.step([plan[i] || 0, i === 22 ? BTN.dodge | BTN.block : 0]); if (m.events.some((e) => e.type === 'breaker')) broke = true; }
  assert.ok(broke); assert.ok(m.fighters[1].meter < 100, 'consumiu 2 barras');
});

test('transformação (Fúria) dura o tempo definido e restaura o estado', () => {
  const m = fightReady(); m.fighters[0].fury = 100;
  m.step([BTN.block | BTN.grab, 0]);
  assert.ok(m.fighters[0].furyActive > 0);
  run(m, C.FURY_DURATION + 5);
  assert.equal(m.fighters[0].furyActive, 0); assert.equal(m.fighters[0].fury, 0);
});

test('simulação determinística: mesmas entradas => mesmo estado', () => {
  const play = () => {
    const m = new Match({ p1: 'varkhan', p2: 'lilith' });
    const a = new CpuController(0, 3, 11), b = new CpuController(1, 2, 22);
    const snaps = [];
    for (let i = 0; i < 3000; i++) { m.step([a.next(m), b.next(m)]); if (i % 250 === 0) snaps.push(m.snapshot()); }
    return snaps.join('|');
  };
  assert.equal(play(), play());
});

test('CPU vs CPU: 20 partidas completas terminam sem exceções, nas 5 dificuldades', () => {
  for (let s = 0; s < 20; s++) {
    const ids = ['varkhan', 'lilith'];
    const m = new Match({ p1: ids[s % 2], p2: ids[(s >> 1) % 2] });
    const a = new CpuController(0, s % 5, s + 1), b = new CpuController(1, (s + 2) % 5, s * 13 + 5);
    let n = 0;
    while (m.phase !== 'matchEnd' && n < 60 * 60 * 10) { m.step([a.next(m), b.next(m)]); n++; }
    assert.equal(m.phase, 'matchEnd', `partida ${s} terminou`);
    for (const f of m.fighters) { assert.ok(Math.abs(f.x) <= C.STAGE_HALF + 1e-6); assert.ok(f.hp >= 0 && f.hp <= C.MAX_HP); }
  }
});

test('frame data derivado disponível para lista de golpes', () => {
  const fd = moveFrameData(CHARACTERS.varkhan.moves.lp);
  assert.equal(fd.startup, 6); // v0.4: Golpe de Cabo 1 quadro mais rápido
  assert.equal(typeof fd.advBlock, 'number');
});

test('U+I com 1–2 quadros de diferença ainda sai supergolpe (tolerância de entrada)', () => {
  const m = fightReady(); place(m, 0, 1.2);
  m.fighters[0].meter = 300;
  m.step([BTN.lk, 0]); m.step([BTN.lk, 0]); m.step([BTN.lk | BTN.hk, 0]);
  assert.equal(m.fighters[0].move && m.fighters[0].move.kind, 'super');
  assert.equal(m.fighters[0].meter, 100);
});

test('2º supergolpe: ↓ + U+I sai o supergolpe 2 (2 barras) e a cinemática termina devolvendo o controle', () => {
  for (const [ch, op, id] of [['varkhan', 'lilith', 'tribunal'], ['lilith', 'varkhan', 'saba']]) {
    const m = fightReady({ p1: ch, p2: op }); place(m, 0, 1.4);
    m.fighters[0].meter = 250;
    m.step([BTN.down, 0]); m.step([BTN.down | BTN.lk | BTN.hk, 0]);
    assert.equal(m.fighters[0].move && m.fighters[0].move.id, id);
    assert.equal(m.fighters[0].meter, 50);
    let cine = false;
    for (let i = 0; i < 400 && m.phase === 'fight'; i++) { m.step([0, 0]); if (m.cine) cine = true; if (!m.cine && cine) break; }
    assert.ok(cine, `${id} iniciou a cinemática`);
    assert.ok(m.fighters[1].hp < 1000 - 250, `${id} causou dano (${m.fighters[1].hp})`);
    run(m, 120);
    assert.notEqual(m.fighters[0].state, 'cinematic');
  }
});

test('Sabá Sangrento é golpe baixo: defesa em pé não segura, agachada segura', () => {
  const m = fightReady({ p1: 'lilith', p2: 'varkhan' }); place(m, 0, 1.4);
  m.fighters[0].meter = 200;
  m.step([BTN.down, BTN.block]); m.step([BTN.down | BTN.lk | BTN.hk, BTN.block | BTN.down]);
  for (let i = 0; i < 40; i++) m.step([0, BTN.block | BTN.down]);
  assert.ok(!m.cine, 'agachado bloqueou');
});

test('ESP + direção escolhe a fatalidade simplificada (n, ↓, →, ←)', () => {
  const ids = [];
  for (const dir of [0, D, R, L]) {
    const m = toFinish('lilith', 'varkhan');
    const [a, b] = m.fighters; a.facing = 1;
    const fat = a.ch.fatalities.find((f) => f.simple === { 0: 'n', [D]: 'd', [R]: 'f', [L]: 'b' }[dir]);
    a.x = b.x - (fat.range[0] + Math.min(fat.range[1], 4)) / 2;
    m.step([dir, 0]); m.step([dir | BTN.special, 0]);
    ids.push(m.fatal && m.fatal.id);
  }
  assert.deepEqual(ids, ['explosao_carmesim', 'ritual_proibido', 'beijo_morte', 'chuva_final']);
});

// ---------------------------------------------------------------- CP10: arenas interativas
test('Coliseu: golpe pesado que derruba na borda leva ao Fosso (transição única, dano extra, luta continua)', () => {
  const m = fightReady({ arena: 'coliseu' });
  place(m, 5.9, 6.95);
  const hp0 = m.fighters[1].hp;
  seq(m, 0, [[D | BTN.hk, 2], [D, 14]]);
  assert.equal(m.phase, 'transition');
  const evs = m.drainEvents();
  assert.ok(evs.some((e) => e.type === 'transition' && e.to === 'Fosso do Coliseu'));
  run(m, 160);
  assert.equal(m.phase, 'fight');
  assert.equal(m.stage.area, 1);
  assert.ok(hp0 - m.fighters[1].hp >= 65 + 70, 'dano do golpe + transição');
  assert.ok(Math.abs(m.fighters[0].x) < 3 && Math.abs(m.fighters[1].x) < 3, 'reposicionados no novo cenário');
  // segunda vez na borda: não há nova transição (uma por luta)
  run(m, 80);
  place(m, 5.9, 6.95);
  seq(m, 0, [[D | BTN.hk, 2], [D, 14]]);
  assert.notEqual(m.phase, 'transition');
});

test('Perigo de borda (Poço de Lava): derrubar perto da borda causa dano extra com recarga', () => {
  const m = fightReady({ arena: 'coliseu' });
  place(m, 5.7, 6.72);
  m.stage.transUsed = true;
  const hp0 = m.fighters[1].hp;
  seq(m, 0, [[D | BTN.hk, 2], [D, 14]]);
  const evs = m.drainEvents();
  const hz = evs.find((e) => e.type === 'hazard');
  assert.ok(hz && hz.kind === 'lava' && hz.dmg === 50, 'evento de perigo');
  assert.equal(hp0 - m.fighters[1].hp, 65 + 50);
});

test('Perigos desligados: sem transição, sem perigo, ↑+O vira pulo/agarrão comum', () => {
  const m = fightReady({ arena: 'coliseu', hazards: false });
  place(m, 5.9, 6.95);
  const hp0 = m.fighters[1].hp;
  seq(m, 0, [[D | BTN.hk, 2], [D, 14]]);
  assert.notEqual(m.phase, 'transition');
  assert.equal(hp0 - m.fighters[1].hp, 65);
  assert.ok(!m.drainEvents().some((e) => e.type === 'hazard' || e.type === 'transition'));
});

test('Coliseu: ↑+O de costas para o muro salta pela Corrente do Muro e cai atrás do oponente', () => {
  const m = fightReady({ arena: 'coliseu' });
  place(m, -7.1, -5.9);
  seq(m, 0, [[U | BTN.grab, 2], [0, 60]]);
  const [a, b] = m.fighters;
  assert.ok(a.x > b.x, `P1 cruzou para o outro lado (${a.x.toFixed(2)} > ${b.x.toFixed(2)})`);
  assert.ok(m.drainEvents().some((e) => e.type === 'interact' && e.kind === 'vault'));
  assert.equal(a.facing, -1, 'virou para o oponente');
  assert.ok(['idle', 'crouch', 'walk'].includes(a.state));
});

test('Catedral: ↑+O na borda derruba a Estátua do Carrasco (alto: acerta agachado, bloqueável em pé), uma por lado/round', () => {
  // longe da borda o ↑+O não ativa nada
  const m = fightReady({ arena: 'catedral' });
  place(m, 7.1, 4.6);
  const hp0 = m.fighters[0].hp;
  seq(m, 1, [[U | BTN.grab, 2], [0, 50]]);
  assert.equal(m.fighters[0].hp, hp0);
  assert.ok(!m.drainEvents().some((e) => e.type === 'interact'));
  const m2 = fightReady({ arena: 'catedral' });
  place(m2, 7.1, 4.6);
  const h2 = m2.fighters[1].hp;
  for (let i = 0; i < 2; i++) m2.step([U | BTN.grab, D]);
  for (let i = 0; i < 50; i++) m2.step([0, D]);
  assert.equal(h2 - m2.fighters[1].hp, 90, 'agachado leva o golpe alto da estátua');
  assert.equal(m2.stage.statues[1], 'down');
  run(m2, 120);
  place(m2, 7.1, 4.6);
  const h3 = m2.fighters[1].hp;
  seq(m2, 0, [[U | BTN.grab, 2], [0, 50]]);
  assert.equal(m2.fighters[1].hp, h3, 'estátua já caída: nada acontece');
  // bloqueio em pé segura
  const m3 = fightReady({ arena: 'catedral' });
  place(m3, -7.1, -4.6);
  const h4 = m3.fighters[1].hp;
  for (let i = 0; i < 2; i++) m3.step([U | BTN.grab, BTN.block]);
  for (let i = 0; i < 50; i++) m3.step([0, BTN.block]);
  assert.equal(m3.fighters[1].hp, h4, 'defesa em pé bloqueia');
  assert.ok(m3.drainEvents().some((e) => e.type === 'block'));
});

test('simulação determinística com arenas interativas (transição incluída)', () => {
  const go = () => {
    const m = fightReady({ arena: 'catedral' });
    place(m, 5.9, 6.95);
    seq(m, 0, [[D | BTN.hk, 2], [D, 14]]);
    run(m, 300, (i) => (i % 17 === 0 ? BTN.lp : i % 23 === 0 ? (U | BTN.grab) : BTN.right), (i) => (i % 13 === 0 ? BTN.hk : BTN.left));
    return m.snapshot() + m.stage.area;
  };
  assert.equal(go(), go());
});
