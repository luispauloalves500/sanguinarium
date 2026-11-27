// QA de navegador (Chromium headless + SwiftShader/WebGL): partidas reais com entradas de teclado/toque,
// capturas de tela e verificação de erros de console. Uso: node tools/qa.mjs  (servidor em BASE)
import fs from 'node:fs';
import { launch, open, st, waitFor, toFinish, B } from './lib.mjs';
const OUT = process.env.OUT || '/workspace/sanguinarium-shots';
fs.mkdirSync(OUT, { recursive: true });
const report = { started: new Date().toISOString(), checks: [], errors: [] };
const check = (name, ok, info = {}) => { report.checks.push({ name, ok: !!ok, ...info }); console.log((ok ? 'OK  ' : 'FALHA ') + name, JSON.stringify(info)); };
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tap(page, code, ms = 60) { await page.keyboard.down(code); await sleep(ms); await page.keyboard.up(code); }
async function keys(page, seq, ms = 55) { // seq: arrays de teclas pressionadas simultaneamente
  let held = new Set();
  for (const step of seq) {
    const want = new Set(step);
    for (const k of held) if (!want.has(k)) await page.keyboard.up(k);
    for (const k of want) if (!held.has(k)) await page.keyboard.down(k);
    held = want; await sleep(ms);
  }
  for (const k of held) await page.keyboard.up(k);
}

// bot de teclado para o P1 (Varkhan): usa somente teclas reais
async function keyboardBot(page, maxMs, until) {
  const t0 = Date.now(); let n = 0;
  while (Date.now() - t0 < maxMs) {
    const s = await st(page);
    const m = s.match;
    if (!m || until(m)) return m;
    if (m.phase !== 'fight') { await sleep(120); continue; }
    const [a, b] = m.fighters; const dist = Math.abs(a.x - b.x);
    const fwd = b.x > a.x ? 'KeyD' : 'KeyA', back = fwd === 'KeyD' ? 'KeyA' : 'KeyD';
    n++;
    if (b.state === 'attack' && dist < 1.8 && n % 3 === 0) { await keys(page, [['KeyL']], 260); continue; }
    if (dist > 2.6) {
      if (n % 3 === 0) await keys(page, [['KeyS'], ['KeyS', fwd], [fwd, 'KeyJ'], []]); // Machado do Abismo
      else if (n % 7 === 0) await keys(page, [[back], [fwd, 'KeyJ'], []]); // Corrente da Morte
      else await keys(page, [[fwd]], 320);
    } else if (dist > 1.5) {
      if (n % 4 === 0) await keys(page, [['KeyS'], ['KeyS', fwd], [fwd, 'KeyU'], []]); // Passo Fantasma
      else await keys(page, [[fwd]], 180);
    } else {
      const r = n % 6;
      if (r === 0) await keys(page, [['KeyJ'], [], ['KeyJ'], [], ['KeyK'], []], 70); // Sentença Tripla
      else if (r === 1) await keys(page, [['KeyS', 'KeyI'], ['KeyS'], []], 80); // rasteira
      else if (r === 2) await keys(page, [['KeyO'], []], 80); // agarrão
      else if (r === 3) await keys(page, [['KeyU'], [], ['KeyK'], []], 80);
      else if (r === 4) await keys(page, [['KeyS'], ['KeyS', 'KeyK'], ['KeyS'], []], 80); // gancho
      else await keys(page, [['KeyS'], ['KeyS', back], [back, 'KeyJ'], []]); // Julgamento
    }
  }
  return (await st(page)).match;
}

const browser = await launch();
try {
  // ---------------------------------------------------------------- 1. menus reais por teclado
  {
    const { page, logs } = await open(browser);
    await sleep(1500);
    await shot(page, '01-titulo');
    await tap(page, 'Enter'); await sleep(600);
    check('título -> menu principal', (await st(page)).screen === 'main');
    await shot(page, '02-menu-principal');
    await tap(page, 'KeyS'); await tap(page, 'KeyS'); await tap(page, 'KeyS'); await tap(page, 'KeyS'); await sleep(200); await tap(page, 'Enter'); await sleep(500);
    check('menu: Lista de Golpes abre', (await st(page)).screen === 'moves');
    await shot(page, '03-lista-de-golpes');
    await tap(page, 'Escape'); await sleep(300);
    await tap(page, 'KeyS'); await tap(page, 'Enter'); await sleep(700); // 1 Jogador vs CPU
    check('menu: seleção de lutador', (await st(page)).screen === 'select');
    await tap(page, 'KeyJ'); await sleep(400);  // P1 confirma Varkhan
    await sleep(600);
    await shot(page, '04-selecao-lutador');
    await tap(page, 'KeyJ'); await sleep(900);  // CPU: Lilith
    check('seleção -> arena', (await st(page)).screen === 'arena');
    await sleep(800);
    await shot(page, '05-selecao-arena');
    await tap(page, 'KeyJ'); await sleep(500);  // Coliseu
    let s = await st(page);
    check('luta iniciada pelo fluxo de menus', s.app === 'fight' && s.match.fighters[0].char === 'varkhan' && s.match.fighters[1].char === 'lilith', { arena: 'coliseu' });
    await waitFor(page, () => SANG.match.phase === 'fight');
    // ------------------------------------------------------------ 2. partida REAL completa: teclado (P1) vs CPU
    let shotMid = false;
    const end = await keyboardBot(page, 330000, (m) => {
      return m.phase === 'finish' || m.phase === 'matchEnd';
    });
    s = await st(page);
    check('partida real chegou ao fim (finish/matchEnd)', s.match && ['finish', 'matchEnd', 'fatality'].includes(s.match.phase), { phase: s.match && s.match.phase, rounds: s.match && s.match.round, fighters: s.match && s.match.fighters });
    check('partida real: golpes conectaram e sangue no chão', s.match.fighters[0].hits > 3 && s.decals > 20, { p1hits: s.match.fighters[0].hits, p2hits: s.match.fighters[1].hits, decals: s.decals });
    report.realMatch = s.match;
    if (s.match.phase === 'finish') await shot(page, '10-finalize-o');
    // se o P1 venceu, executa a Sentença de Sangue pelo teclado
    if (s.match.phase === 'finish' && s.match.result === null) {
      const m = s.match; const winner = m.fighters[0].state !== 'dizzy' ? 0 : 1;
      if (winner === 0) {
        // aproxima e executa Execução Real (↓ → ↓ + K)
        for (let i = 0; i < 30; i++) { const mm = (await st(page)).match; const d = Math.abs(mm.fighters[0].x - mm.fighters[1].x); if (d < 1.6) break; await keys(page, [[mm.fighters[1].x > mm.fighters[0].x ? 'KeyD' : 'KeyA']], 120); }
        const mm = (await st(page)).match; const fwd = mm.fighters[1].x > mm.fighters[0].x ? 'KeyD' : 'KeyA';
        await keys(page, [['KeyS'], ['KeyS', fwd], [fwd], ['KeyS'], ['KeyS', 'KeyK'], []], 50);
      }
      await waitFor(page, () => SANG.match.phase === 'fatality' || SANG.match.phase === 'matchEnd', null, 60000);
      if ((await st(page)).match.phase === 'fatality') { await waitFor(page, () => SANG.match.phase !== 'fatality' || SANG.match.fatal.f > 140); await shot(page, '11-fatalidade-partida-real'); }
    }
    await waitFor(page, () => SANG.state().app === 'results', null, 90000);
    s = await st(page);
    check('resultado exibido após a partida real', s.screen === 'results', { result: s.match.result });
    await shot(page, '12-resultado');
    report.realMatchResult = s.match.result;
    await tap(page, 'Enter'); await sleep(800); // Revanche
    check('revanche reinicia a partida', (await st(page)).app === 'fight');
    report.errors.push(...logs, ...s.errors);
    await page.close();
  }
  // ---------------------------------------------------------------- 3. Catedral: luta + especiais + supergolpe por teclado
  {
    const { page, logs } = await open(browser);
    await page.evaluate(() => SANG.start({ p1: 'varkhan', p2: 'lilith', arena: 'catedral', mode: 'cpu', difficulty: 2 }));
    await waitFor(page, () => SANG.match.phase === 'fight');
    await keyboardBot(page, 25000, (m) => m.fighters[1].hp < 700 || m.phase !== 'fight');
    await shot(page, '06-luta-catedral');
    // supergolpe: 2 barras + U+I de perto
    await page.evaluate(() => { const m = SANG.match; SANG.app.ctrl[1] = null; m.fighters[1].hp = Math.max(m.fighters[1].hp, 500); });
    for (let tries = 0; tries < 4; tries++) {
      await waitFor(page, () => SANG.match.phase === 'fight' && SANG.match.fighters[0].state === 'idle' && SANG.match.fighters[1].state === 'idle', null, 10000).catch(() => {});
      await page.evaluate(() => { const m = SANG.match; m.fighters[0].meter = 300; m.fighters[1].x = Math.min(Math.max(m.fighters[1].x, -5), 5); m.fighters[0].x = m.fighters[1].x - 1.2; });
      await sleep(200);
      await keys(page, [['KeyU', 'KeyI'], []], 80);
      const ok = await waitFor(page, () => SANG.match.cine && SANG.match.cine.f > 60, null, 6000).then(() => true).catch(() => false);
      if (ok) break;
    }
    const sup = (await page.evaluate(() => !!SANG.match.cine));
    await shot(page, '07-supergolpe-execucao-carmesim');
    check('supergolpe por teclado (U+I) iniciou a cinemática', sup);
    await waitFor(page, () => !SANG.match.cine, null, 20000);
    // Lilith especial por toque? (verificado no teste mobile). Aqui: Lança vs Machado colidindo
    await page.evaluate(() => { const m = SANG.match; m.fighters[0].x = -3; m.fighters[1].x = 3; m.fighters[1].hp = 900; SANG.app.script[1] = (f) => { const t = (f % 90); return [2, 2, 6, 6 | 16][t] || 0; }; });
    await sleep(500);
    await keys(page, [['KeyS'], ['KeyS', 'KeyD'], ['KeyD', 'KeyJ'], []]);
    await sleep(700);
    const s = await st(page);
    check('projéteis por teclado + roteiro em cena sem erros', s.errors.length === 0, { audio: s.audio.slice(-6) });
    await page.evaluate(() => { delete SANG.app.script[1]; });
    report.errors.push(...logs, ...s.errors);
    await page.close();
  }
  // ---------------------------------------------------------------- 4. As 4 Sentenças de Sangue via teclado real
  const FAT = [
    ['varkhan', 'lilith', 'coliseu', 'execucao_real', 1.2, [['KeyS'], ['KeyS', 'KeyD'], ['KeyD'], ['KeyS'], ['KeyS', 'KeyK'], []], 135],
    ['varkhan', 'lilith', 'catedral', 'machado_condenacao', 3.2, [['KeyA'], [], ['KeyD'], [], ['KeyA'], ['KeyA', 'KeyI'], []], 100],
    ['lilith', 'varkhan', 'coliseu', 'explosao_carmesim', 2.5, [['KeyS'], ['KeyS', 'KeyD'], ['KeyD'], [], ['KeyD', 'KeyK'], []], 152],
    ['lilith', 'varkhan', 'catedral', 'ritual_proibido', 1.5, [['KeyA'], [], ['KeyA'], ['KeyA', 'KeyS'], ['KeyS', 'KeyI'], []], 120],
  ];
  let idx = 8;
  for (const [p1, p2, arena, id, dist, seq, frame] of FAT) {
    const { page, logs } = await open(browser);
    await toFinish(page, p1, p2, arena);
    await page.evaluate((dist) => { const m = SANG.match; m.fighters[0].x = m.fighters[1].x - dist; }, dist);
    await waitFor(page, () => ['idle', 'crouch', 'walk'].includes(SANG.match.fighters[0].state), null, 5000).catch(() => {});
    await sleep(200);
    await keys(page, seq, 50);
    let ok = true;
    await waitFor(page, () => SANG.match.phase === 'fatality', null, 8000).catch(() => { ok = false; });
    if (ok) {
      await waitFor(page, (fr) => SANG.match.phase !== 'fatality' || SANG.match.fatal.f >= fr, frame);
      await shot(page, `0${idx}-fatalidade-${id}`.replace(/^0(\d\d)/, '$1'));
      await waitFor(page, () => SANG.match.phase === 'matchEnd', null, 60000);
    }
    const s = await st(page);
    check(`Sentença de Sangue por teclado: ${id}`, ok && s.match.result && s.match.result.fatality === id, { result: s.match.result });
    report.errors.push(...logs, ...s.errors);
    idx++;
    await page.close();
  }
  // ---------------------------------------------------------------- v0.2: Sentenças 3 e 4 por teclado real
  const FAT2 = [
    ['varkhan', 'lilith', 'coliseu', 'correntes_suplicio', 2.5, [['KeyD'], [], ['KeyA'], [], ['KeyD'], ['KeyD', 'KeyJ'], []], 205],
    ['varkhan', 'lilith', 'catedral', 'ruptura_infernal', 1.2, [['KeyS'], [], ['KeyS'], [], ['KeyS'], ['KeyS', 'KeyU'], []], 110],
    ['lilith', 'varkhan', 'coliseu', 'beijo_morte', 1.0, [['KeyD'], [], ['KeyD'], [], ['KeyS'], ['KeyS', 'KeyJ'], []], 215],
    ['lilith', 'varkhan', 'catedral', 'chuva_final', 3.2, [['KeyA'], [], ['KeyS'], [], ['KeyA'], ['KeyA', 'KeyU'], []], 200],
  ];
  let idx2 = 17;
  for (const [p1, p2, arena, id, dist, seq, frame] of FAT2) {
    const { page, logs } = await open(browser);
    await toFinish(page, p1, p2, arena);
    await page.evaluate((dist) => { const m = SANG.match; m.fighters[1].x = 2; m.fighters[0].x = m.fighters[1].x - dist; }, dist);
    await waitFor(page, () => ['idle', 'crouch', 'walk'].includes(SANG.match.fighters[0].state), null, 5000).catch(() => {});
    await sleep(200);
    await keys(page, seq, 50);
    let ok = true;
    await waitFor(page, () => SANG.match.phase === 'fatality', null, 8000).catch(() => { ok = false; });
    if (ok) {
      await waitFor(page, (fr) => SANG.match.phase !== 'fatality' || SANG.match.fatal.f >= fr, frame);
      await shot(page, `${idx2}-fatalidade-${id}`);
      await waitFor(page, () => SANG.match.phase === 'matchEnd', null, 60000);
    }
    const s = await st(page);
    check(`Sentença de Sangue (v0.2) por teclado: ${id}`, ok && s.match.result && s.match.result.fatality === id, { result: s.match.result });
    report.errors.push(...logs, ...s.errors);
    idx2++;
    await page.close();
  }
  // ---------------------------------------------------------------- v0.2: 2º supergolpe por teclado (S + U + I)
  for (const [p1, p2, sid, n] of [['varkhan', 'lilith', 'tribunal', 21], ['lilith', 'varkhan', 'saba', 22]]) {
    const { page, logs } = await open(browser);
    await page.evaluate(([p1, p2]) => { SANG.start({ p1, p2, arena: p1 === 'varkhan' ? 'catedral' : 'coliseu', mode: 'cpu', difficulty: 0 }); SANG.app.ctrl[1] = null; }, [p1, p2]);
    await waitFor(page, () => SANG.match.phase === 'fight');
    let got = null;
    for (let tries = 0; tries < 4 && !got; tries++) {
      await page.evaluate(() => { const m = SANG.match; m.fighters[0].meter = 300; m.fighters[0].x = -0.7; m.fighters[1].x = 0.7; });
      await sleep(250);
      await keys(page, [['KeyS'], ['KeyS', 'KeyU', 'KeyI'], ['KeyS'], []], 70);
      got = await waitFor(page, () => SANG.match.cine && SANG.match.cine.f > 70, null, 6000).then(() => page.evaluate(() => SANG.match.cine.id)).catch(() => null);
    }
    await shot(page, `${n}-supergolpe2-${sid}`);
    check(`2º supergolpe por teclado (S+U+I): ${sid}`, got === sid, { got });
    await waitFor(page, () => !SANG.match.cine, null, 20000).catch(() => {});
    const s = await st(page);
    report.errors.push(...logs, ...s.errors);
    await page.close();
  }
  // ---------------------------------------------------------------- v0.2: arenas interativas por teclado real
  {
    const { page, logs } = await open(browser);
    const prep = async (arena, p1x, p2x) => {
      await page.evaluate(([arena]) => { SANG.start({ p1: 'varkhan', p2: 'lilith', arena, mode: 'cpu', difficulty: 0 }); SANG.app.ctrl[1] = null; }, [arena]);
      await waitFor(page, () => SANG.match.phase === 'fight');
      await page.evaluate(([a, b]) => { const m = SANG.match; const [f, o] = m.fighters; f.x = a; o.x = b; f.facing = b > a ? 1 : -1; o.facing = -f.facing; f.inp.refacing(f.facing); o.inp.refacing(o.facing); }, [p1x, p2x]);
      await sleep(250);
    };
    // Estátua do Carrasco: P1 de costas para a borda direita, ↑ + O
    await prep('catedral', 7.1, 4.6);
    await page.evaluate(() => { SANG.app.script[1] = () => 2; }); // P2 agachado (não bloqueia golpe alto)
    await keys(page, [['KeyW', 'KeyO'], []], 60);
    await waitFor(page, () => SANG.match.stage.statues[1] === 'down', null, 10000).catch(() => {});
    await sleep(300);
    let r = await page.evaluate(() => ({ statue: SANG.match.stage.statues[1], hp: SANG.match.fighters[1].hp }));
    await shot(page, '23-arena-estatua-do-carrasco');
    check('Catedral: ↑+O derruba a Estátua do Carrasco no oponente', r.statue === 'down' && r.hp === 910, r);
    await page.evaluate(() => { delete SANG.app.script[1]; });
    // Corrente do Muro: P1 encurralado à esquerda salta por cima
    await prep('coliseu', -7.1, -5.9);
    await keys(page, [['KeyW', 'KeyO'], []], 60);
    await waitFor(page, () => SANG.match.fighters[0].state === 'vault' && SANG.match.fighters[0].sf >= 12, null, 8000).catch(() => {});
    await shot(page, '24-arena-corrente-do-muro');
    await waitFor(page, () => SANG.match.fighters[0].state !== 'vault', null, 8000).catch(() => {});
    await sleep(300);
    r = await page.evaluate(() => ({ x: SANG.match.fighters.map((f) => +f.x.toFixed(2)) }));
    check('Coliseu: ↑+O na Corrente do Muro salta para trás do oponente', r.x[0] > r.x[1], r);
    // Transição: rasteira (↓+I) colada à borda -> Fosso do Coliseu
    await prep('coliseu', 5.9, 6.95);
    await keys(page, [['KeyS', 'KeyI'], ['KeyS'], []], 90);
    await waitFor(page, () => SANG.match.stage.area === 1 && SANG.match.phase === 'fight', null, 60000).catch(() => {});
    await sleep(1200);
    r = await page.evaluate(() => ({ area: SANG.match.stage.area, phase: SANG.match.phase, hp: SANG.match.fighters[1].hp }));
    await shot(page, '25-arena-transicao-fosso');
    check('Transição de cenário por teclado: Coliseu -> Fosso do Coliseu', r.area === 1 && r.phase === 'fight', r);
    await prep('catedral', 5.9, 6.95);
    await keys(page, [['KeyS', 'KeyI'], ['KeyS'], []], 90);
    await waitFor(page, () => SANG.match.stage.area === 1 && SANG.match.phase === 'fight', null, 60000).catch(() => {});
    await sleep(1200);
    r = await page.evaluate(() => ({ area: SANG.match.stage.area, phase: SANG.match.phase }));
    await shot(page, '26-arena-transicao-cripta');
    check('Transição de cenário por teclado: Catedral -> Cripta Profana', r.area === 1 && r.phase === 'fight', r);
    // opção desliga perigos
    await page.evaluate(() => SANG.app.setOption('hazards', '0'));
    await prep('coliseu', 5.9, 6.95);
    await keys(page, [['KeyS', 'KeyI'], ['KeyS'], []], 90);
    await sleep(1500);
    r = await page.evaluate(() => ({ enabled: SANG.match.stage.enabled, area: SANG.match.stage.area, phase: SANG.match.phase }));
    check('Opção "Perigos e transições de arena" desativada: sem transição', !r.enabled && r.area === 0, r);
    await page.evaluate(() => SANG.app.setOption('hazards', '1'));
    const s = await st(page);
    report.errors.push(...logs, ...s.errors);
    await page.close();
  }
  // ---------------------------------------------------------------- v0.2: modo Arcade pelo menu
  {
    const { page, logs } = await open(browser);
    await sleep(800);
    await tap(page, 'Enter'); await sleep(500); // título
    await tap(page, 'Enter'); await sleep(600); // Modo Arcade (1º item)
    let s = await st(page);
    await shot(page, '27-arcade-selecao');
    check('Arcade: menu abre a seleção com a escada', s.screen === 'select' && (await page.evaluate(() => document.querySelectorAll('.ladder li').length)) === 3);
    await tap(page, 'KeyJ'); await sleep(1200);
    s = await st(page);
    check('Arcade: luta 1 começa contra Lilith no Coliseu', s.app === 'fight' && s.match.fighters[1].char === 'lilith', { f: s.match && s.match.fighters.map((f) => f.char) });
    const winNow = async () => {
      await waitFor(page, () => SANG.match.phase === 'fight', null, 20000);
      await page.evaluate(() => { const m = SANG.match; SANG.app.ctrl[1] = null; m.fighters[0].wins = 1; m.fighters[1].hp = 0; SANG.app.timeScale = 3; });
      await waitFor(page, () => SANG.app.state === 'results', null, 120000);
      await page.evaluate(() => { SANG.app.timeScale = 1; });
      await sleep(300);
    };
    await winNow();
    let btns = await page.evaluate(() => [...document.querySelectorAll('#resultMenu button')].map((b) => b.dataset.act));
    check('Arcade: vitória oferece "Próxima luta"', btns[0] === 'next', { btns });
    await page.click('#resultMenu button[data-act="next"]'); await sleep(800);
    s = await st(page);
    check('Arcade: luta 2 é o Reflexo Sombrio (espelho) na Catedral', s.match.fighters[1].char === 'varkhan', {});
    await page.evaluate(() => { SANG.app.arcade.stage = 2; });
    await winNow();
    btns = await page.evaluate(() => [...document.querySelectorAll('#resultMenu button')].map((b) => b.dataset.act));
    check('Arcade: última vitória oferece "Ver o final"', btns[0] === 'ending', { btns });
    await page.click('#resultMenu button[data-act="ending"]'); await sleep(800);
    s = await st(page);
    const endTxt = await page.evaluate(() => document.getElementById('endText').textContent);
    await shot(page, '28-arcade-final-varkhan');
    check('Arcade: tela de final do personagem (pt-BR)', s.screen === 'ending' && /Varkhan/.test(endTxt), { len: endTxt.length });
    report.errors.push(...logs, ...s.errors);
    await page.close();
  }
  // ---------------------------------------------------------------- v0.2: remapeamento de teclas
  {
    const { page, logs } = await open(browser);
    await page.evaluate(() => { SANG.app.screens.show('options'); });
    await sleep(300);
    await page.click('#keymapList button[data-a="lp"]');
    await tap(page, 'KeyF'); await sleep(300);
    const lbl = await page.evaluate(() => document.querySelector('#keymapList button[data-a="lp"]').textContent);
    await shot(page, '29-opcoes-remapeamento');
    const saved = await page.evaluate(() => JSON.parse(SANG.app.settings.keymap1 || '{}'));
    check('Remapeamento: Soco rápido -> F salvo nas opções', lbl === 'F' && saved.lp === 'KeyF', { lbl, saved: saved.lp });
    await page.reload(); await page.waitForFunction(() => window.SANG);
    await page.evaluate(() => { SANG.start({ p1: 'varkhan', p2: 'lilith', arena: 'coliseu', mode: 'cpu', difficulty: 0 }); SANG.app.ctrl[1] = null; });
    await waitFor(page, () => SANG.match.phase === 'fight');
    await page.evaluate(() => { window._mv = []; const m = SANG.match; const orig = m.emit.bind(m); m.emit = (e) => { if (e.type === 'move' && e.who === 0) window._mv.push(e.id); orig(e); }; });
    await tap(page, 'KeyF', 70); await sleep(800);
    const mv = await page.evaluate(() => window._mv[0]);
    check('Remapeamento persiste após recarregar e F dispara o soco rápido', mv === 'lp', { mv });
    await page.evaluate(() => { SANG.app.devices.setBindings(null); SANG.app.setOption('keymap1', ''); });
    const s = await st(page);
    report.errors.push(...logs, ...s.errors);
    await page.close();
  }
  // ---------------------------------------------------------------- 5. 2 jogadores locais no mesmo teclado
  {
    const { page, logs } = await open(browser);
    await page.evaluate(() => SANG.start({ p1: 'lilith', p2: 'varkhan', arena: 'coliseu', mode: 'versus' }));
    await waitFor(page, () => SANG.match.phase === 'fight');
    const x0 = await page.evaluate(() => [SANG.match.fighters[0].x, SANG.match.fighters[1].x]);
    await keys(page, [['KeyD', 'ArrowLeft']], 600);
    const x1 = await page.evaluate(() => [SANG.match.fighters[0].x, SANG.match.fighters[1].x]);
    await keys(page, [['Numpad1'], []], 80);
    await keys(page, [['KeyJ'], []], 80);
    await sleep(500);
    const s = await st(page);
    check('2P local: P1 (WASD) e P2 (setas) se movem de forma independente', x1[0] > x0[0] && x1[1] < x0[1], { x0, x1 });
    check('2P local: P2 ataca pelo teclado numérico', s.audio.filter((a) => a === 'whoosh' || a === 'heavyWhoosh' || a === 'hit' || a === 'block').length >= 1, { audio: s.audio });
    report.errors.push(...logs, ...s.errors);
    await page.close();
  }
  // ---------------------------------------------------------------- 6. CPU x CPU nas duas arenas (estabilidade de render)
  for (const arena of ['coliseu', 'catedral']) {
    const { page, logs } = await open(browser);
    await page.evaluate((arena) => { SANG.start({ p1: 'lilith', p2: 'varkhan', arena, mode: 'cpu', cpu1: true, difficulty: 3 }); SANG.app.timeScale = 3; }, arena);
    let shotDone = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 240000) {
      const s = await st(page);
      if (!shotDone && s.match.phase === 'fight' && s.match.fighters.some((f) => f.hp < 600)) { await page.evaluate(() => { SANG.app.timeScale = 1; }); await sleep(400); await shot(page, `14-cpu-vs-cpu-${arena}`); shotDone = true; await page.evaluate(() => { SANG.app.timeScale = 3; }); }
      if (s.app === 'results') break;
      await sleep(500);
    }
    const s = await st(page);
    check(`CPU x CPU completa em ${arena}`, s.app === 'results', { result: s.match.result, frames: s.match.frame });
    report.errors.push(...logs, ...s.errors);
    await page.close();
  }
  // ---------------------------------------------------------------- 7. Celular (toque)
  {
    const { page, logs } = await open(browser, { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await sleep(800);
    await page.touchscreen.tap(400, 200); await sleep(500);
    check('celular: toque no título abre menu', (await st(page)).screen === 'main');
    await shot(page, '15-celular-menu');
    await page.evaluate(() => SANG.start({ p1: 'lilith', p2: 'varkhan', arena: 'catedral', mode: 'cpu', difficulty: 0 }));
    await waitFor(page, () => SANG.match.phase === 'fight');
    await page.evaluate(() => { SANG.app.ctrl[1] = null; });
    const vis = await page.evaluate(() => !document.getElementById('touch').classList.contains('hidden'));
    check('celular: controles de toque visíveis', vis);
    const box = await page.locator('button[data-b="special"]').boundingBox();
    const before = (await st(page)).audio.length;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(900);
    const s = await st(page);
    const projs = s.audio.slice(-10).filter((a) => a === 'proj').length;
    check('celular: botão ESP dispara Lança Carmesim', projs >= 1, { audio: s.audio.slice(-8) });
    await shot(page, '16-celular-luta');
    report.errors.push(...logs, ...s.errors);
    await page.close();
  }
} catch (e) {
  report.errors.push('QA exception: ' + (e && e.stack || e));
  console.error(e);
} finally {
  await browser.close();
  report.finished = new Date().toISOString();
  report.consoleErrors = report.errors.filter((e) => !/favicon/.test(e));
  report.allPassed = report.checks.every((c) => c.ok) && report.consoleErrors.length === 0;
  fs.writeFileSync(`${OUT}/qa-report.json`, JSON.stringify(report, null, 2));
  console.log('\nRESUMO:', report.checks.filter((c) => c.ok).length + '/' + report.checks.length, 'verificações OK; erros de console:', report.consoleErrors.length);
}
