// Capturas dos elementos interativos de arena: node tools/arenashot.mjs <cenario> <prefixo>
// cenários: statue | vault | lava | trans-coliseu | trans-catedral | brasa
import { launch, open, waitFor } from './lib.mjs';
const [scn, prefix] = process.argv.slice(2);
const SC = {
  statue: { arena: 'catedral', p: [7.1, 4.6], p1: 'varkhan', p2: 'lilith', in0: [1 | 512, 2], in1: 2, shots: [8, 22, 34, 60] },
  vault: { arena: 'coliseu', p: [-7.1, -5.9], p1: 'lilith', p2: 'varkhan', in0: [1 | 512, 2], shots: [6, 16, 26, 44] },
  lava: { arena: 'coliseu', p: [5.7, 6.72], p1: 'varkhan', p2: 'lilith', in0: [2 | 128, 2, 2], noTrans: true, shots: [16, 24, 34] },
  brasa: { arena: 'catedral', p: [5.7, 6.72], p1: 'lilith', p2: 'varkhan', in0: [2 | 128, 2, 2], noTrans: true, shots: [16, 24, 34] },
  'trans-coliseu': { arena: 'coliseu', p: [5.9, 6.95], p1: 'varkhan', p2: 'lilith', in0: [2 | 128, 2, 2], trans: [20, 50, 75, 110, 150, 200] },
  'trans-catedral': { arena: 'catedral', p: [5.9, 6.95], p1: 'varkhan', p2: 'lilith', in0: [2 | 128, 2, 2], trans: [20, 50, 75, 110, 150, 200] },
}[scn];
const b = await launch(); const { page, logs } = await open(b);
await page.evaluate((c) => { SANG.start({ p1: c.p1, p2: c.p2, arena: c.arena, mode: 'cpu', difficulty: 0 }); SANG.app.ctrl[1] = null; }, SC);
await waitFor(page, () => SANG.match.phase === 'fight');
const t0 = await page.evaluate((c) => {
  const m = SANG.match; const [a, o] = m.fighters;
  a.x = c.p[0]; o.x = c.p[1]; a.facing = o.x > a.x ? 1 : -1; o.facing = -a.facing; a.inp.refacing(a.facing); o.inp.refacing(o.facing);
  if (c.noTrans) m.stage.transUsed = true;
  const t0 = m.frame + 2;
  SANG.app.script[0] = (f) => (f >= t0 && f < t0 + c.in0[1] ? c.in0[0] : f >= t0 && f < t0 + 16 ? (c.in0[2] || 0) : 0);
  if (c.in1) SANG.app.script[1] = () => c.in1;
  return t0;
}, SC);
if (SC.shots) for (const d of SC.shots) {
  await waitFor(page, (fr) => SANG.match.frame >= fr, t0 + d);
  await page.screenshot({ path: `${prefix}-${d}.png` });
}
if (SC.trans) {
  await waitFor(page, () => SANG.match.phase === 'transition');
  for (const d of SC.trans) {
    if (d <= 150) await waitFor(page, (fr) => SANG.match.phase !== 'transition' || SANG.match.stage.trans.f >= fr, d);
    else await waitFor(page, (fr) => SANG.match.phase === 'fight' && SANG.match.pf >= fr - 150, d);
    await page.screenshot({ path: `${prefix}-${d}.png` });
  }
}
const info = await page.evaluate(() => ({ phase: SANG.match.phase, area: SANG.match.stage.area, hp: SANG.match.fighters.map((f) => f.hp), statues: SANG.match.stage.statues, errors: SANG.app.errors }));
console.log(JSON.stringify({ info, logs }));
await b.close();
