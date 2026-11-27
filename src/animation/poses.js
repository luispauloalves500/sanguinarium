// Biblioteca de poses (ângulos em radianos) — DADOS de animação, sem lógica.
// Chaves: py (altura da pelve), spx/spy/spz (coluna), nx (pescoço),
// aAx/aAz/eA (braço A: ombro/cotovelo), aBx/aBz/eB (braço B), lAx/lAz/kA (perna A), lBx/lBz/kB (perna B).
export const STANCE = {
  py: 0, spx: 0.12, spy: 0, spz: 0, nx: -0.05,
  aAx: -1.1, aAz: 0.15, eA: -1.7, aBx: -0.75, aBz: -0.15, eB: -1.4,
  lAx: -0.32, lAz: 0.06, kA: 0.45, lBx: 0.26, lBz: -0.06, kB: 0.32,
};
const P = (o) => ({ ...STANCE, ...o });
const CROUCH = { spx: 0.42, lAx: -1.05, kA: 1.95, lBx: -0.15, kB: 1.6, nx: -0.2 };
const AIR = { lAx: -1.2, kA: 1.9, lBx: -0.7, kB: 2.0, spx: 0.2 };

export const POSES = {
  stance: P({}),
  walkA: P({ lAx: -0.7, kA: 0.35, lBx: 0.45, kB: 0.6 }),
  walkB: P({ lAx: 0.1, kA: 0.7, lBx: -0.25, kB: 0.25 }),
  crouch: P(CROUCH),
  crouchBlock: P({ ...CROUCH, aAx: -1.3, eA: -2.4, aBx: -1.2, eB: -2.4, nx: 0.2 }),
  block: P({ aAx: -1.35, eA: -2.45, aBx: -1.25, eB: -2.45, nx: 0.3, spx: 0.22 }),
  jumpUp: P({ ...AIR, aAx: -1.6, aBx: -1.4 }),
  jumpDown: P({ lAx: -0.5, kA: 0.7, lBx: 0.2, kB: 0.6, aAx: -1.0, aBx: -0.8 }),
  land: P({ ...CROUCH, spx: 0.3, kA: 1.4, kB: 1.3, lAx: -0.8, lBx: 0.1 }),
  // golpes [preparação, golpe]
  jab_w: P({ aAx: -1.0, eA: -2.0, spy: -0.2 }), jab_s: P({ aAx: -1.55, eA: -0.05, aAz: 0, spy: 0.4, spx: 0.2 }),
  jab2_w: P({ aBx: -1.0, eB: -2.1, spy: 0.25 }), jab2_s: P({ aBx: -1.55, eB: -0.05, aBz: 0, spy: -0.4, spx: 0.2 }),
  axeSwing_w: P({ aBx: -2.9, eB: -0.5, aBz: -0.2, spx: -0.2, spy: 0.35 }), axeSwing_s: P({ aBx: -0.65, eB: -0.1, spx: 0.5, spy: -0.3, lAx: -0.75, kA: 0.85 }),
  claw_w: P({ aAx: -2.3, aAz: 0.7, eA: -0.6, spy: -0.4 }), claw_s: P({ aAx: -1.1, aAz: -0.4, eA: -0.15, spy: 0.55, spx: 0.3 }),
  kickMid_w: P({ lAx: -1.3, kA: 2.1, lBx: 0.1, kB: 0.2, spx: -0.05 }), kickMid_s: P({ lAx: -1.55, kA: 0.05, lBx: 0.12, kB: 0.1, spx: -0.25 }),
  kickHigh_w: P({ lAx: -1.7, kA: 2.3, lBx: 0.1, kB: 0.15, spx: -0.2, spz: 0.1 }), kickHigh_s: P({ lAx: -2.15, kA: 0.05, lBx: 0.15, kB: 0.05, spx: -0.5, aAx: -0.6, aBx: -0.3 }),
  cjab_w: P({ ...CROUCH, aAx: -1.1, eA: -2.0 }), cjab_s: P({ ...CROUCH, aAx: -1.45, eA: -0.05, spy: 0.3 }),
  uppercut_w: P({ ...CROUCH, aBx: -0.2, eB: -1.9, spy: 0.3 }), uppercut_s: P({ aBx: -2.95, eB: -0.35, spx: -0.25, spy: -0.4, lAx: -0.2, kA: 0.2, lBx: 0.3, kB: 0.1 }),
  clow_w: P({ ...CROUCH, lAx: -1.0, kA: 2.0 }), clow_s: P({ ...CROUCH, lAx: -1.45, kA: 0.15, spx: 0.2 }),
  sweep_w: P({ ...CROUCH, spx: 0.55, lAx: -1.1, kA: 1.8, aAx: -0.3, aBx: -0.4 }), sweep_s: P({ ...CROUCH, spx: 0.6, lAx: -1.57, lAz: 0.3, kA: 0.0, aAx: -0.2, aBx: -0.2 }),
  jpunch_w: P({ ...AIR, aAx: -1.0, eA: -2.0 }), jpunch_s: P({ ...AIR, aAx: -1.1, eA: -0.05, spx: 0.4 }),
  jaxe_w: P({ ...AIR, aBx: -3.0, eB: -0.4, spx: -0.2 }), jaxe_s: P({ ...AIR, aBx: -0.6, eB: -0.1, spx: 0.6 }),
  jknee_w: P({ ...AIR }), jknee_s: P({ ...AIR, lAx: -1.7, kA: 2.4, spx: 0.1 }),
  jkick_w: P({ ...AIR, lAx: -1.0, kA: 2.2 }), jkick_s: P({ ...AIR, lAx: -1.2, kA: 0.05, lBx: 0.4, kB: 1.8, spx: -0.3 }),
  grab_w: P({ aAx: -1.2, eA: -1.0, aBx: -1.2, eB: -1.0, spx: 0.3 }), grab_s: P({ aAx: -1.55, eA: -0.3, aBx: -1.55, eB: -0.3, spx: 0.4, aAz: -0.2, aBz: 0.2 }),
  throwAxe_w: P({ aBx: -2.9, eB: -0.6, spy: 0.5, spx: -0.2 }), throwAxe_s: P({ aBx: -1.2, eB: -0.05, spy: -0.5, spx: 0.4 }),
  chainCast_w: P({ aAx: -0.3, eA: -1.6, spy: 0.4 }), chainCast_s: P({ aAx: -1.57, eA: -0.02, aAz: 0, spy: -0.3, spx: 0.25 }),
  overhead_w: P({ aBx: -3.05, aAx: -3.0, eA: -0.6, eB: -0.4, spx: -0.35, nx: -0.3 }), overhead_s: P({ aBx: -0.85, aAx: -0.8, eA: -0.2, eB: -0.1, spx: 0.75, lAx: -0.95, kA: 1.1, lBx: 0.6, kB: 0.5 }),
  spin_w: P({ aAz: 1.3, aBz: -1.3, aAx: -0.2, aBx: -0.3, eA: -0.1, eB: -0.1, spx: 0.1 }), spin_s: P({ aAz: 1.45, aBz: -1.45, aAx: -0.1, aBx: -0.1, eA: 0, eB: 0, spx: 0.05 }),
  dashSlash_w: P({ spx: 0.55, aBx: 0.6, eB: -0.4, lAx: -0.9, kA: 1.2, lBx: 0.7, kB: 0.3 }), dashSlash_s: P({ aBx: -1.6, eB: 0, spy: 0.7, spx: 0.4, lAx: -0.9, kA: 0.8, lBx: 0.7, kB: 0.2 }),
  groundSlam_w: P({ aBx: -3.0, aAx: -3.0, eA: -0.5, eB: -0.5, spx: -0.3 }), groundSlam_s: P({ ...CROUCH, aBx: -0.45, aAx: -0.5, eB: 0, eA: 0, spx: 0.85 }),
  superStart_w: P({ ...CROUCH, spx: 0.6, aBx: 0.5 }), superStart_s: P({ aBx: -1.6, eB: 0, spy: 0.6, spx: 0.45, lAx: -1.0, kA: 0.9, lBx: 0.8, kB: 0.2 }),
  cast_w: P({ aAx: -0.6, eA: -2.2, aBx: -0.4, eB: -2.0, spy: -0.3 }), cast_s: P({ aAx: -1.57, eA: 0, aAz: 0, aBx: -1.35, eB: -0.3, spy: 0.3, spx: 0.15 }),
  castUp_w: P({ aAx: -0.5, aBx: -0.5, eA: -2, eB: -2 }), castUp_s: P({ aAx: -3.0, aBx: -3.0, aAz: 0.3, aBz: -0.3, eA: 0, eB: 0, nx: -0.4, spx: -0.2 }),
  castLow_w: P({ aAx: -2.4, aBx: -2.4, eA: -0.3, eB: -0.3 }), castLow_s: P({ ...CROUCH, aAx: -0.7, aBx: -0.7, eA: 0, eB: 0, spx: 0.7 }),
  vanish_w: P({ ...CROUCH, aAx: -2.5, aBx: -2.5 }), vanish_s: P({ ...CROUCH }),
  lunge_w: P({ spx: 0.45, aAx: -0.2, eA: -1.0, lAx: -0.9, kA: 1.1, lBx: 0.6, kB: 0.4 }), lunge_s: P({ aAx: -1.6, eA: 0, aAz: 0, spx: 0.6, spy: 0.5, lAx: -1.1, kA: 0.6, lBx: 0.9, kB: 0.1 }),
  regen_w: P({ aAz: 0.9, aBz: -0.9, aAx: -0.4, aBx: -0.4, eA: -0.3, eB: -0.3, nx: -0.4, spx: -0.15 }), regen_s: P({ aAz: 1.3, aBz: -1.3, aAx: -0.6, aBx: -0.6, eA: -0.2, eB: -0.2, nx: -0.6, spx: -0.25 }),
  parry_w: P({ aAx: -1.4, eA: -2.3, aBx: -1.4, eB: -2.3, aAz: -0.3, aBz: 0.3, spx: -0.1 }), parry_s: P({ aAx: -1.5, eA: -2.4, aBx: -1.5, eB: -2.4, aAz: -0.4, aBz: 0.4, spx: -0.15 }),
  roar_w: P({ ...CROUCH, aAx: -0.3, aBx: -0.3 }), roar_s: P({ aAx: -2.5, aBx: -2.5, aAz: 0.7, aBz: -0.7, eA: -0.2, eB: -0.2, nx: -0.6, spx: -0.35 }),
  rage_w: P({ aBx: -2.9, eB: -0.5, aAx: -2.6, spx: -0.2 }), rage_s: P({ aBx: -0.6, eB: -0.1, aAx: -0.7, spx: 0.55, lAx: -0.8, kA: 0.9 }),
  // reações
  hitHigh: P({ spx: -0.5, nx: -0.55, aAx: -0.3, aBx: -0.2, eA: -0.6, eB: -0.5, aAz: 0.4, aBz: -0.4, lAx: -0.2, lBx: 0.5, kB: 0.6 }),
  hitLow: P({ spx: 0.65, nx: 0.35, aAx: -0.6, aBx: -0.7, eA: -1.2, eB: -1.2, lAx: -0.3, kA: 0.8, lBx: 0.4, kB: 0.7 }),
  tumble: P({ spx: -0.6, nx: -0.4, aAx: -2.4, aBx: -2.2, aAz: 0.6, aBz: -0.6, eA: -0.3, eB: -0.3, lAx: -0.9, kA: 0.9, lBx: -0.2, kB: 0.6 }),
  lying: P({ spx: 0, nx: 0, aAx: -2.9, aBx: -0.2, aAz: 0.5, aBz: -0.6, eA: -0.2, eB: -0.3, lAx: -0.15, kA: 0.25, lBx: 0.1, kB: 0.1 }),
  dizzy: P({ spx: 0.25, nx: 0.55, aAx: -0.12, aBx: -0.15, aAz: 0.12, aBz: -0.12, eA: -0.3, eB: -0.3, lAx: -0.12, kA: 0.3, lBx: 0.1, kB: 0.25 }),
  // v0.3: cambalhota encolhida (Corrente do Muro)
  tuck: P({ ...AIR, lAx: -2.1, kA: 2.5, lBx: -1.9, kB: 2.5, aAx: -1.3, eA: -1.9, aBx: -1.2, eB: -1.9, spx: 0.55, nx: 0.4 }),
  // v0.3 — Kazuro (katana na mão B) e Brakkor
  katana_w: P({ aBx: -2.7, aBz: 0.5, eB: -0.9, aAx: -2.4, eA: -1.2, spy: 0.5, spx: -0.1 }), katana_s: P({ aBx: -0.9, aBz: -0.5, eB: -0.1, aAx: -0.9, eA: -1.0, spy: -0.5, spx: 0.45, lAx: -0.85, kA: 0.9, lBx: 0.5, kB: 0.3 }),
  slashUp_w: P({ ...CROUCH, aBx: -0.1, eB: -0.3, aBz: -0.3, spy: 0.5 }), slashUp_s: P({ aBx: -3.0, eB: -0.1, aBz: 0.1, aAx: -0.5, spx: -0.3, spy: -0.4, lAx: -0.3, kA: 0.2, lBx: 0.4, kB: 0.2 }),
  iai_w: P({ ...CROUCH, spx: 0.5, spy: 0.8, aBx: -0.3, aBz: 0.9, eB: -1.6, aAx: -0.4, aAz: 0.5, eA: -1.4 }), iai_s: P({ spx: 0.5, spy: -0.9, aBx: -1.5, aBz: -0.9, eB: 0, aAx: -0.2, aAz: 0.6, eA: -0.6, lAx: -1.2, kA: 1.2, lBx: 0.9, kB: 0.3 }),
  guard_w: P({ aBx: -1.8, aBz: 0.6, eB: -1.4, aAx: -1.5, eA: -1.9, spx: 0.05, spy: 0.3, lAx: -0.5, kA: 0.8, lBx: 0.4, kB: 0.6 }), guard_s: P({ aBx: -1.9, aBz: 0.7, eB: -1.5, aAx: -1.6, eA: -2.0, spx: 0.0, spy: 0.35, lAx: -0.55, kA: 0.9, lBx: 0.45, kB: 0.7 }),
  flurry_w: P({ aBx: -2.6, aBz: -0.4, eB: -0.6, spy: -0.4, spx: 0.2, lAx: -0.7, kA: 0.8 }), flurry_s: P({ aBx: -0.8, aBz: 0.6, eB: -0.1, spy: 0.6, spx: 0.45, lAx: -0.9, kA: 0.9, lBx: 0.5, kB: 0.3 }),
  smash_w: P({ aAx: -0.4, aAz: 0.3, eA: -2.2, spy: -0.6, spx: 0.0, lAx: -0.5, kA: 0.6 }), smash_s: P({ aAx: -1.6, aAz: 0, eA: -0.05, spy: 0.6, spx: 0.45, lAx: -1.0, kA: 1.0, lBx: 0.6, kB: 0.25 }),
  charge_w: P({ ...CROUCH, spx: 0.7, nx: 0.4, aAx: -0.6, aBx: -0.6, eA: -1.5, eB: -1.5 }), charge_s: P({ spx: 0.85, nx: 0.6, aAx: -0.3, aBx: -0.3, aAz: 0.5, aBz: -0.5, eA: -1.2, eB: -1.2, lAx: -1.2, kA: 1.0, lBx: 0.8, kB: 0.4 }),
  breath_w: P({ spx: -0.35, nx: -0.6, aAx: -0.4, aAz: 0.8, aBx: -0.4, aBz: -0.8, eA: -1.0, eB: -1.0 }), breath_s: P({ spx: 0.4, nx: 0.25, aAx: -0.6, aAz: 0.9, aBx: -0.6, aBz: -0.9, eA: -1.2, eB: -1.2, lAx: -0.7, kA: 0.8, lBx: 0.5, kB: 0.3 }),
  leap_w: P({ ...CROUCH, aAx: -2.9, aBx: -2.9, eA: -0.5, eB: -0.5, spx: 0.1 }), leap_s: P({ ...CROUCH, aAx: -0.5, aBx: -0.5, eA: 0, eB: 0, spx: 0.9, kA: 1.6, kB: 1.4 }),
  winKazuro: P({ aBx: -1.6, aBz: 0.9, eB: -1.2, aAx: -0.2, aAz: 0.2, eA: -0.3, spy: 0.25, nx: 0.1, spx: 0.05, lAx: -0.15, kA: 0.15, lBx: 0.15, kB: 0.1 }),
  // v0.4 — Nymera / Pestilus
  slide_w: P({ ...CROUCH, spx: 0.3, aAx: -0.8, aBx: -0.6 }), slide_s: P({ py: -0.55, spx: -0.55, nx: 0.3, lAx: -1.45, kA: 0.1, lBx: -0.4, kB: 1.4, aAx: -0.9, eA: -0.4, aBx: 0.6, eB: -0.3 }),
  winNymera: P({ aAx: -2.2, aAz: 0.5, eA: -0.9, aBx: -0.5, aBz: -0.6, eB: -0.4, spy: 0.35, nx: 0.25, spx: -0.05, lAx: -0.05, kA: 0.1, lBx: 0.25, lBz: -0.1, kB: 0.35 }),
  winPestilus: P({ aAx: -1.4, aAz: 0.3, eA: -1.9, aBx: -0.4, aBz: -0.3, eB: -1.6, spx: 0.35, nx: 0.45, spy: -0.25, lAx: -0.2, kA: 0.3, lBx: 0.2, kB: 0.25 }),
  winBrakkor: P({ aAx: -2.6, aAz: 0.9, eA: -0.6, aBx: -2.6, aBz: -0.9, eB: -0.6, nx: -0.7, spx: -0.4, lAx: -0.5, lAz: 0.25, kA: 0.6, lBx: 0.4, lBz: -0.25, kB: 0.5 }),
  devour: P({ aAx: -2.0, eA: -1.6, aBx: -1.6, eB: -0.8, spx: 0.5, nx: 0.6, lAx: -0.6, kA: 0.7 }),
  sheathe: P({ aBx: -0.3, aBz: 0.8, eB: -1.8, aAx: -0.2, aAz: 0.5, eA: -1.6, spy: 0.1, nx: 0.2, spx: 0.1 }),
  winVarkhan: P({ aBx: -3.05, eB: -0.25, aBz: -0.15, aAx: -0.3, aAz: 0.4, eA: -0.4, nx: -0.35, spx: -0.12, lAx: -0.3, kA: 0.3, lBx: 0.3, kB: 0.2 }),
  winLilith: P({ aAx: -2.0, aAz: 1.0, aBx: -2.0, aBz: -1.0, eA: -0.4, eB: -0.4, nx: -0.3, spx: -0.1, lAx: -0.1, kA: 0.5, lBx: 0.1, kB: 0.9 }),
  kneel: P({ spx: 0.35, nx: 0.8, aAx: 0.25, aBx: 0.2, aAz: 0.12, aBz: -0.12, eA: -0.25, eB: -0.25, lAx: -0.38, kA: 2.08, lBx: -0.22, kB: 1.98 }),
  dangle: P({ spx: -0.2, nx: -0.7, aAx: -0.3, aBx: -0.2, aAz: 0.6, aBz: -0.6, eA: -0.1, eB: -0.1, lAx: 0.1, kA: 0.2, lBx: -0.1, kB: 0.3 }),
  thrown: P({ spx: -0.3, nx: -0.6, aAx: -0.9, aBx: -0.8, eA: -0.6, eB: -0.6, lAx: -0.3, kA: 0.5, lBx: 0.2, kB: 0.4 }),
  frozen: P({ spx: 0.1, aAx: -0.2, aBx: -0.2, aAz: 0.05, aBz: -0.05, eA: -0.3, eB: -0.3, lAx: -0.1, kA: 0.1, lBx: 0.1, kB: 0.1 }),
  crucified: P({ spx: -0.15, nx: -0.55, aAx: -0.25, aBx: -0.25, aAz: 1.4, aBz: -1.4, eA: -0.15, eB: -0.15, lAx: -0.05, lAz: 0.28, kA: 0.15, lBx: 0.05, lBz: -0.28, kB: 0.15 }),
  writhe: P({ spx: -0.45, nx: -0.7, aAx: -2.6, aBx: -2.2, aAz: 0.5, aBz: -0.7, eA: -1.2, eB: -0.8, lAx: -0.6, kA: 1.2, lBx: 0.2, kB: 0.9 }),
  husk: P({ spx: 0.55, nx: 0.6, aAx: -0.1, aBx: -0.15, aAz: 0.08, aBz: -0.08, eA: -0.9, eB: -1.1, lAx: -0.25, kA: 0.55, lBx: 0.15, kB: 0.5 }),
  kiss: P({ spx: 0.3, nx: 0.25, aAx: -1.45, aAz: -0.35, eA: -0.6, aBx: -1.2, aBz: 0.3, eB: -0.9, lAx: -0.35, kA: 0.35, lBx: 0.3, kB: 0.25 }),
  point: P({ aAx: -1.57, eA: -0.02, aAz: 0, spy: 0.25, spx: 0.1, aBx: -0.3, eB: -0.8 }),
  yank: P({ spx: -0.35, spy: -0.4, aAx: -0.6, eA: -1.9, aBx: -0.5, eB: -1.7, lAx: 0.35, kA: 0.6, lBx: -0.55, kB: 0.3 }),
  dodge: P({ ...CROUCH, spx: 0.3, kA: 1.2, kB: 1.1, lAx: -0.7, lBx: 0.2, aAx: -1.3, aBx: -1.1, eA: -2.2, eB: -2.2 }),
};
export const POSE_KEYS = Object.keys(STANCE);

export function lerpPose(out, a, b, t) {
  for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}
export function pose(name) {
  const p = POSES[name];
  if (!p) throw new Error('Pose inexistente: ' + name);
  return p;
}
