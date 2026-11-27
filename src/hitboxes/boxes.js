// Hitboxes, hurtboxes e pushboxes independentes (AABB no plano x/y).
export function worldBox(f, box, ox = f.x, oy = f.y) {
  const [x0, y0, x1, y1] = box;
  return f.facing >= 0
    ? [ox + x0, oy + y0, ox + x1, oy + y1]
    : [ox - x1, oy + y0, ox - x0, oy + y1];
}
export function overlap(a, b) {
  return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}
const STAND = [-0.36, 0, 0.36, 1];
const CROUCH = [-0.42, 0, 0.42, 1.12];
// Retorna lista de hurtboxes em coordenadas do mundo (vazia = invulnerável/intangível)
export function hurtboxes(f) {
  if (f.invuln > 0) return [];
  switch (f.state) {
    case 'knockdown': case 'getup': case 'dead': case 'cinematic': case 'thrown': case 'hidden': return [];
  }
  if (f.hidden) return [];
  const h = f.ch.height, w = f.ch.width || 1; // largura relativa (Brakkor é mais largo: alvo maior)
  const out = [];
  if (f.state === 'juggle' || f.airborne) {
    out.push([f.x - 0.38 * w, f.y + 0.1, f.x + 0.38 * w, f.y + 1.45 * Math.max(1, w * 0.9)]);
  } else if (f.crouching) {
    out.push(worldBox(f, [CROUCH[0] * w, 0, CROUCH[2] * w, CROUCH[3] * Math.max(1, w * 0.95)]));
  } else {
    out.push(worldBox(f, [STAND[0] * w, 0, STAND[2] * w, h - 0.05]));
  }
  // membro estendido durante golpe (permite punir golpes que erram)
  if (f.move && f.move.hits.length) {
    const last = f.move.hits[f.move.hits.length - 1];
    const first = f.move.hits[0];
    if (f.mf >= first.f0 && f.mf <= Math.min(f.move.frames, last.f1 + 10) && first.box) {
      const b = first.box;
      out.push(worldBox(f, [0, b[1], Math.max(0.3, b[2] - 0.2), b[3]]));
    }
  }
  return out;
}
export function pushbox(f) {
  const w = (f.state === 'juggle' ? 0.25 : 0.32) * (f.ch.width || 1);
  return [f.x - w, f.y, f.x + w, f.y + (f.crouching ? 1.1 : f.ch.height - 0.2)];
}
