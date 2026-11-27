// Capturas de uma cinemática: node tools/cineshot.mjs <p1> <p2> <arena> <fatalidade|super:<id>> <quadros,csv> <prefixo>
import { launch, open, waitFor, toFinish } from './lib.mjs';
const [p1, p2, arena, id, frames, prefix] = process.argv.slice(2);
const b = await launch(); const { page, logs } = await open(b);
if (id.startsWith('super:')) {
  await page.evaluate(([p1, p2, arena]) => { SANG.start({ p1, p2, arena, mode: 'cpu', difficulty: 0 }); SANG.app.ctrl[1] = null; }, [p1, p2, arena]);
  await waitFor(page, () => SANG.match.phase === 'fight');
  await page.evaluate((sid) => { const m = SANG.match; const f = m.fighters[0], o = m.fighters[1]; f.x = -0.6; o.x = 0.6; m.startCine(f, o, f.ch.moves[sid]); }, id.slice(6));
} else {
  await toFinish(page, p1, p2, arena);
  await page.evaluate((fid) => { const m = SANG.match; const f = m.fighters[0], o = m.fighters[1]; const fat = f.ch.fatalities.find((x) => x.id === fid); m.startFatality(f, o, fat); }, id);
}
const src = id.startsWith('super:') ? 'cine' : 'fatal';
for (const fr of frames.split(',').map(Number)) {
  await waitFor(page, ([fr, src]) => { const c = SANG.match[src]; return !c || c.f >= fr; }, [fr, src], 60000);
  await page.screenshot({ path: `${prefix}-${fr}.png` });
}
console.log(JSON.stringify({ logs, errors: await page.evaluate(() => SANG.app.errors) }));
await b.close();
