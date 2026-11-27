// node tools/poseshot.mjs <char> <poses,csv> <out.png> [view] [extra query]
import { launch } from './lib.mjs';
const [char, poses, out, view = 'side', extra = ''] = process.argv.slice(2);
const b = await launch(); const p = await b.newPage({ viewport: { width: 1800, height: 800 } });
const errs = []; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(`http://127.0.0.1:8090/tools/poselab.html?char=${char}&poses=${poses}&view=${view}${extra}`);
await p.waitForFunction(() => window.DONE, null, { timeout: 60000 });
await p.screenshot({ path: out, fullPage: true }); if (errs.length) console.log(errs); await b.close();
