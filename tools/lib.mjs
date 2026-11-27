import { chromium } from 'playwright-core';
export const BASE = process.env.BASE || 'http://127.0.0.1:8090/index.html';
import fs from 'node:fs';
// procura o Chromium baixado por `npx playwright-core install chromium` (qualquer versão)
function findChrome() {
  const dir = `${process.env.HOME}/.cache/ms-playwright`;
  const vers = fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => /^chromium-\d+$/.test(d)).sort() : [];
  return vers.length ? `${dir}/${vers[vers.length - 1]}/chrome-linux64/chrome` : undefined;
}
const exe = process.env.CHROME || findChrome();
export async function launch() {
  return chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
}
export async function open(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...opts });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/favicon|404/.test(m.text())) logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => logs.push('requestfailed: ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) logs.push('http ' + r.status() + ': ' + r.url()); });
  await page.goto(BASE + (BASE.includes('?') ? '&' : '?') + 'debug=1');
  await page.waitForFunction(() => window.SANG, null, { timeout: 90000 });
  return { page, logs, ctx };
}
export const st = (page) => page.evaluate(() => SANG.state());
export async function waitFor(page, fn, arg, timeout = 120000) {
  await page.waitForFunction(fn, arg, { timeout, polling: 100 });
}
// leva a partida direto à janela de finalização (atalho de depuração) com P1 vencedor
export async function toFinish(page, p1, p2, arena) {
  await page.evaluate(([p1, p2, arena]) => { SANG.start({ p1, p2, arena, mode: 'cpu', difficulty: 0 }); SANG.app.ctrl[1] = null; }, [p1, p2, arena]);
  await waitFor(page, () => SANG.match.phase === 'fight');
  await page.evaluate(() => {
    const m = SANG.match; m.fighters[0].wins = 1; m.fighters[1].hp = 5; m.fighters[0].x = 0; m.fighters[1].x = 0.95;
    let t0 = m.frame; SANG.app.script[0] = (f) => (f === t0 + 1 ? 32 : 0); // K
  });
  await waitFor(page, () => SANG.match.phase === 'finish');
  await page.evaluate(() => { delete SANG.app.script[0]; });
}
export const B = { up: 1, down: 2, left: 4, right: 8, lp: 16, hp: 32, lk: 64, hk: 128, block: 256, grab: 512, dodge: 1024, special: 2048 };
