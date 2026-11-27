// RNG determinístico (mulberry32) — nunca usar Math.random na simulação.
export function makeRng(seed = 1) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.range = (a0, b0) => a0 + r() * (b0 - a0);
  return r;
}
