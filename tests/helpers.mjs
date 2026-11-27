import { Match } from '../src/combat/match.js';
import { BTN } from '../src/combat/input.js';
export { Match, BTN };
export function fightReady(opts = {}) {
  const m = new Match({ p1: 'varkhan', p2: 'lilith', ...opts });
  while (m.phase !== 'fight') m.step([0, 0]);
  return m;
}
export function run(m, n, a = 0, b = 0) { for (let i = 0; i < n; i++) m.step([typeof a === 'function' ? a(i) : a, typeof b === 'function' ? b(i) : b]); }
// sequência de entradas: lista de [bits, quadros]
export function seq(m, who, list) {
  for (const [bits, n] of list) for (let i = 0; i < n; i++) m.step(who === 0 ? [bits, 0] : [0, bits]);
}
export function place(m, x0, x1) { m.fighters[0].x = x0; m.fighters[1].x = x1; m.fighters[0].facing = x1 > x0 ? 1 : -1; m.fighters[1].facing = -m.fighters[0].facing; }
