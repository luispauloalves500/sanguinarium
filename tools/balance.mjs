// Estatísticas de balanceamento: CPU x CPU em todos os confrontos (uso: node tools/balance.mjs [partidas por par] [dificuldade])
import { Match } from '../src/combat/match.js';
import { CpuController } from '../src/ai/cpu.js';
import { CHARACTERS } from '../src/combat/moves.js';
const IDS = Object.keys(CHARACTERS);
const N = +(process.argv[2] || 10), DIFF = +(process.argv[3] || 2);
const mat = {}, tot = Object.fromEntries(IDS.map((i) => [i, [0, 0]]));
let s = 0;
for (const p1 of IDS) for (const p2 of IDS) {
  if (p1 === p2) continue;
  let w1 = 0;
  for (let k = 0; k < N; k++, s++) {
    const m = new Match({ p1, p2, arena: k % 2 ? 'catedral' : 'coliseu' });
    const a = new CpuController(0, DIFF, s * 7 + 11), b = new CpuController(1, DIFF, s * 31 + 3);
    let n = 0;
    while (m.phase !== 'matchEnd' && n < 60 * 60 * 12) { m.step([a.next(m), b.next(m)]); n++; }
    if (m.result.winner === 0) w1++;
  }
  mat[`${p1} x ${p2}`] = (w1 / N).toFixed(2);
  tot[p1][0] += w1; tot[p1][1] += N; tot[p2][0] += N - w1; tot[p2][1] += N;
}
console.log(JSON.stringify(mat, null, 1));
console.log('TOTAL', JSON.stringify(Object.fromEntries(Object.entries(tot).map(([k, [w, t]]) => [k, +(w / t).toFixed(3)]))));
