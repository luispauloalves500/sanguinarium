// PLACEHOLDER: lutadores montados com primitivas 3D procedurais (sem GLB/rig final).
// Registrado em CHECKPOINTS.md — substituir por modelos GLB com rig completo no CP02 final.
import * as THREE from 'three';
import { glowSprite } from '../render/textures.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.08, ...o });

function mk(parent, geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos); m.rotation.set(...rot); m.scale.set(...scale);
  m.castShadow = true; m.receiveShadow = false;
  parent.add(m);
  return m;
}
const G = {
  cyl: (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  sph: (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h),
  cone: (r, h, s = 10) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t) => new THREE.TorusGeometry(r, t, 6, 12),
};

// membro: grupo de articulação + malha centrada no meio do segmento
function limb(parent, pos, len, rTop, rBot, mat) {
  const j = new THREE.Group(); j.position.set(...pos); parent.add(j);
  mk(j, G.cyl(rTop, rBot, len, 9), mat, [0, -len / 2, 0]);
  return j;
}

const PALETTES = {
  varkhan: { skin: 0x5c6a58, leather: 0x2a1c16, iron: 0x4b4f55, hood: 0x141116, cloth: 0x3a0d0d, eye: 0xff2a00, blade: 0x8b9096, wood: 0x3b2416 },
  varkhanAlt: { skin: 0x8a7f6c, leather: 0x1b1b22, iron: 0x7a6a3a, hood: 0xd8d0c0, cloth: 0x10202a, eye: 0x30c0ff, blade: 0xa8a090, wood: 0x2a1a10 },
  lilith: { skin: 0xe8d6cf, robe: 0x7a0c18, robeDark: 0x2b0509, hair: 0x0c0809, gold: 0xb08a3a, eye: 0xff1030, magic: 0xff1838, boot: 0x1a0a0c },
  lilithAlt: { skin: 0xd8c9e0, robe: 0x3a1460, robeDark: 0x150828, hair: 0xd9d4e8, gold: 0x9aa0b0, eye: 0xb040ff, magic: 0xb030ff, boot: 0x120818 },
};

export function buildFighter(charId, alt = false) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const pelvis = new THREE.Group(); body.add(pelvis);
  const rig = { root, body, pelvis };
  const dmg = { 1: [], 2: [], 3: [], remove2: [], skinMats: [] };
  let mats;
  if (charId === 'varkhan') mats = buildVarkhan(rig, dmg, PALETTES[alt ? 'varkhanAlt' : 'varkhan']);
  else mats = buildLilith(rig, dmg, PALETTES[alt ? 'lilithAlt' : 'lilith']);
  for (const k of [1, 2, 3]) for (const m of dmg[k]) m.visible = false;
  const baseSkin = dmg.skinMats.map((m) => m.color.clone());
  const fighter = {
    charId, root, rig, mats, dims: rig.dims, tier: 0, furyOn: false,
    setDamageTier(t) {
      if (t === this.tier) return;
      this.tier = t;
      for (const k of [1, 2, 3]) for (const m of dmg[k]) m.visible = t >= k;
      for (const m of dmg.remove2) m.visible = t < 2;
      dmg.skinMats.forEach((m, i) => m.color.copy(baseSkin[i]).lerp(new THREE.Color(0x5a0a08), t * 0.12));
    },
    setFury(on, time = 0) {
      this.furyOn = on;
      const e = mats.furyEmissive;
      for (const m of e) { m.emissive.setHex(on ? mats.furyColor : m.userData.baseEmissive || 0); m.emissiveIntensity = on ? 0.9 + Math.sin(time * 12) * 0.4 : m.userData.baseEI ?? 1; }
    },
    // movimento secundário: molas das capas/correntes/cabelo, chamas e orbes (somente visual)
    update(dt, time, info = {}) {
      dt = Math.min(dt, 0.05);
      const fwd = info.fwdSpeed || 0, jolt = info.jolt || 0;
      for (const s of rig.swing || []) {
        let target = Math.sin(time * s.freq + s.ph) * s.amp + fwd * s.drag + jolt * s.drag * 0.6;
        if (s.followK && rig.hipA) target += ((rig.hipA.rotation.x + rig.hipB.rotation.x) * 0.5) * s.followK;
        s.vel += (target - s.ang) * s.k * dt; s.vel *= Math.exp(-s.damp * dt); s.ang += s.vel * dt;
        s.obj.rotation[s.axis] = s.base + s.ang;
      }
      if (rig.skirtPanels) for (const { pv, hip } of rig.skirtPanels) { pv.rotation.x = Math.max(-0.95, Math.min(0.45, hip.rotation.x * 0.62)); pv.rotation.z = hip.rotation.z * 0.5; }
      if (rig.skirtTail) rig.skirtTail.rotation.x = Math.max(-0.1, Math.min(0.4, Math.max(0, -Math.min(rig.hipA.rotation.x, rig.hipB.rotation.x) - 0.5) * 0.35 + Math.max(0, Math.max(rig.hipA.rotation.x, rig.hipB.rotation.x)) * 0.5 + fwd * 0.3));
      if (rig.flames) {
        rig.flames.visible = this.furyOn;
        if (this.furyOn) rig.flames.children.forEach((f, i) => { const k = 0.8 + Math.sin(time * 23 + i * 1.7) * 0.25; f.scale.set(0.32 * k, 0.55 * k, 1); f.position.x = Math.sin(time * 17 + i) * 0.03; });
      }
      if (rig.orbs) {
        const sp = this.furyOn ? 4.5 : 1.6, r = this.furyOn ? 0.55 : 0.42;
        rig.orbs.children.forEach((o) => { const a = time * sp + o.userData.ph; o.position.set(Math.cos(a) * r, Math.sin(a * 2) * 0.12, Math.sin(a) * r * 0.8); });
      }
    },
    dispose() {
      root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((mm) => mm.dispose()); } });
    },
  };
  for (const m of mats.furyEmissive) { m.userData.baseEmissive = m.emissive.getHex(); m.userData.baseEI = m.emissiveIntensity; }
  return fighter;
}

function skeleton(rig, d, M) {
  // d: dimensões. M: materiais {torso, upperArm, foreArm, hand, thigh, shin, foot, head}
  const { pelvis } = rig;
  const spine = new THREE.Group(); spine.position.y = 0.06; pelvis.add(spine);
  const chest = new THREE.Group(); chest.position.y = d.torso * 0.5; spine.add(chest);
  const neck = new THREE.Group(); neck.position.y = d.torso * 0.55; chest.add(neck);
  const head = new THREE.Group(); head.position.y = 0.16; neck.add(head);
  const shA = limb(chest, [d.shoulder, d.torso * 0.42, 0], d.uarm, d.armR, d.armR * 0.85, M.upperArm);
  const elA = limb(shA, [0, -d.uarm, 0], d.farm, d.armR * 0.85, d.armR * 0.7, M.foreArm);
  const shB = limb(chest, [-d.shoulder, d.torso * 0.42, 0], d.uarm, d.armR, d.armR * 0.85, M.upperArm);
  const elB = limb(shB, [0, -d.uarm, 0], d.farm, d.armR * 0.85, d.armR * 0.7, M.foreArm);
  const handA = new THREE.Group(); handA.position.y = -d.farm; elA.add(handA);
  const handB = new THREE.Group(); handB.position.y = -d.farm; elB.add(handB);
  mk(handA, G.box(0.11, 0.13, 0.1), M.hand, [0, -0.05, 0]);
  mk(handB, G.box(0.11, 0.13, 0.1), M.hand, [0, -0.05, 0]);
  const hipA = limb(pelvis, [d.hipW, -0.02, 0], d.thigh, d.legR, d.legR * 0.8, M.thigh);
  const knA = limb(hipA, [0, -d.thigh, 0], d.shin, d.legR * 0.8, d.legR * 0.6, M.shin);
  const hipB = limb(pelvis, [-d.hipW, -0.02, 0], d.thigh, d.legR, d.legR * 0.8, M.thigh);
  const knB = limb(hipB, [0, -d.thigh, 0], d.shin, d.legR * 0.8, d.legR * 0.6, M.shin);
  // tornozelos: o pé gira separado da canela para ficar apoiado no chão
  const ankles = [knA, knB].map((kn) => { const a = new THREE.Group(); a.position.y = -d.shin; kn.add(a); mk(a, G.box(0.15, 0.1, 0.3), M.foot, [0, -0.03, 0.06]); return a; });
  Object.assign(rig, { spine, chest, neck, head, shA, elA, shB, elB, handA, handB, hipA, knA, hipB, knB, ankleA: ankles[0], ankleB: ankles[1], dims: d });
}

// ---- movimento secundário (capas, correntes, cabelo): molas amortecidas, só visual
function swinger(rig, obj, o = {}) {
  const s = { obj, axis: o.axis || 'x', base: obj.rotation[o.axis || 'x'], ang: 0, vel: 0, k: o.k ?? 60, damp: o.damp ?? 7, drag: o.drag ?? 0.5, amp: o.amp ?? 0.04, freq: o.freq ?? 1.6, ph: Math.random() * 6, follow: o.follow || null, followK: o.followK ?? 0 };
  (rig.swing || (rig.swing = [])).push(s);
  return s;
}
// tira de pano/corrente pendurada: pivô no topo, malha para baixo
function strip(parent, pos, w, len, mat, rot = [0, 0, 0], thick = 0.02) {
  const pv = new THREE.Group(); pv.position.set(...pos); pv.rotation.set(...rot); parent.add(pv);
  mk(pv, G.box(w, len, thick), mat, [0, -len / 2, 0]);
  return pv;
}
function chainStrand(parent, pos, n, mat, size = 0.032) {
  const pv = new THREE.Group(); pv.position.set(...pos); parent.add(pv);
  for (let i = 0; i < n; i++) mk(pv, G.tor(size, size * 0.32), mat, [0, -size * 1.5 * i - size, 0], [0, i % 2 ? Math.PI / 2 : 0, 0]);
  return pv;
}

function buildVarkhan(rig, dmg, c) {
  const skin = std(c.skin, { roughness: 0.9 });
  const leather = std(c.leather, { roughness: 0.85 });
  const iron = std(c.iron, { metalness: 0.75, roughness: 0.45 });
  const darkIron = std(0x26282c, { metalness: 0.7, roughness: 0.5 });
  const hood = std(c.hood, { roughness: 0.95 });
  const cloth = std(c.cloth, { roughness: 0.9, side: THREE.DoubleSide });
  const eye = std(0x000000, { emissive: c.eye, emissiveIntensity: 2.2 });
  const blade = std(c.blade, { metalness: 0.9, roughness: 0.3, emissive: 0x000000 });
  const wood = std(c.wood, { roughness: 0.8 });
  const bone = std(0xcfc4a8, { roughness: 0.7 });
  const blood = std(0x5a0000, { roughness: 0.35, metalness: 0.1, emissive: 0x200000 });
  const bruise = std(0x2a1430, { roughness: 0.9 });
  const d = { hip: 1.02, thigh: 0.5, shin: 0.5, foot: 0.06, torso: 0.62, shoulder: 0.34, uarm: 0.33, farm: 0.31, armR: 0.1, legR: 0.12, hipW: 0.14 };
  skeleton(rig, d, { upperArm: skin, foreArm: leather, hand: skin, thigh: leather, shin: leather, foot: iron });
  dmg.skinMats.push(skin);
  const { pelvis, spine, chest, head, neck, shA, shB, handA, handB, elA, elB, hipA, hipB, knA, knB, ankleA, ankleB } = rig;
  // torso musculoso + abdômen com faixas de couro
  mk(spine, G.cyl(0.36, 0.27, d.torso + 0.05, 12), skin, [0, d.torso * 0.5, 0], [0, 0, 0], [1, 1, 0.68]);
  for (let i = 0; i < 2; i++) mk(spine, G.cyl(0.285 + i * 0.02, 0.285 + i * 0.02, 0.05, 12), leather, [0, 0.14 + i * 0.1, 0], [0, 0, 0.08 - i * 0.16], [1, 1, 0.72]);
  // peitoral de ferro rebitado com caveira
  const plate = mk(spine, G.box(0.5, 0.34, 0.07), darkIron, [0, d.torso * 0.66, 0.2], [-0.12, 0, 0]);
  for (const [x, y] of [[-0.21, 0.13], [0.21, 0.13], [-0.21, -0.13], [0.21, -0.13]]) mk(plate, G.sph(0.018, 6, 4), iron, [x, y, 0.04]);
  mk(plate, G.sph(0.07, 10, 8), bone, [0, 0.02, 0.05], [0, 0, 0], [1, 1.1, 0.6]);
  mk(plate, G.box(0.06, 0.03, 0.02), bone, [0, -0.06, 0.06]);
  mk(plate, G.box(0.02, 0.025, 0.02), std(0x000000), [-0.025, 0.03, 0.09]); mk(plate, G.box(0.02, 0.025, 0.02), std(0x000000), [0.025, 0.03, 0.09]);
  dmg.remove2.push(plate);
  // cinto largo com fivela e correntes penduradas
  mk(spine, G.cyl(0.3, 0.3, 0.11, 12), leather, [0, 0.02, 0], [0, 0, 0], [1, 1, 0.76]);
  mk(spine, G.box(0.13, 0.1, 0.04), iron, [0, 0.02, 0.24]);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 1.4 - Math.PI * 0.2; mk(spine, G.tor(0.03, 0.01), iron, [Math.cos(a) * 0.3, -0.04 - Math.sin(i) * 0.015, Math.sin(a) * 0.22], [0, a, 0.9]); }
  for (const x of [-0.24, 0.24]) swinger(rig, chainStrand(pelvis, [x, 0.04, 0.12], 7, iron, 0.028), { amp: 0.05, drag: 0.9, k: 40 });
  // tanga e aventais de couro
  const flapF = strip(pelvis, [0, -0.02, 0.21], 0.26, 0.46, cloth, [-0.05, 0, 0], 0.03);
  const flapB = strip(pelvis, [0, -0.02, -0.2], 0.3, 0.42, cloth, [0.05, 0, 0], 0.03);
  swinger(rig, flapF, { amp: 0.03, drag: 0.6, followK: 0.5 }); swinger(rig, flapB, { amp: 0.03, drag: -0.6, followK: 0.5 });
  rig.flapF = flapF; rig.flapB = flapB;
  // correntes cruzando o peito (bandoleira)
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    mk(spine, G.tor(0.035, 0.012), iron, [-0.27 + t * 0.54, 0.1 + t * 0.52, 0.235 - Math.abs(t - 0.5) * 0.03], [0, i % 2 ? Math.PI / 2 : 0, 0.8]);
  }
  // ombreiras com espinhos + capa esfarrapada
  const pA = mk(shA, G.sph(0.17, 12, 8), iron, [0.03, 0.02, 0], [0, 0, 0], [1, 0.7, 1]);
  for (let i = 0; i < 3; i++) mk(pA, G.cone(0.035, 0.18, 6), iron, [0.05, 0.12, -0.08 + i * 0.08], [0, 0, -0.4]);
  mk(pA, G.tor(0.15, 0.015), darkIron, [0, -0.04, 0], [Math.PI / 2, 0, 0]);
  const pB = mk(shB, G.sph(0.17, 12, 8), iron, [-0.03, 0.02, 0], [0, 0, 0], [1, 0.7, 1]);
  for (let i = 0; i < 3; i++) mk(pB, G.cone(0.035, 0.18, 6), iron, [-0.05, 0.12, -0.08 + i * 0.08], [0, 0, 0.4]);
  mk(pB, G.tor(0.15, 0.015), darkIron, [0, -0.04, 0], [Math.PI / 2, 0, 0]);
  dmg.remove2.push(pA);
  const capeMat = std(0x1a0c0e, { roughness: 0.95, side: THREE.DoubleSide });
  rig.cape = [];
  [[-0.2, 1.05, 0.13], [-0.07, 1.18, 0.14], [0.07, 1.12, 0.14], [0.2, 0.98, 0.13]].forEach(([x, len, w], i) => {
    const s = strip(chest, [x, d.torso * 0.4, -0.2], w, len, capeMat, [0.12, 0, x * 0.25], 0.012);
    rig.cape.push(swinger(rig, s, { amp: 0.06, drag: -1.1, k: 30, damp: 5, followK: 0 }));
    if (i === 1) dmg[2].push(mk(s, G.box(w * 0.6, 0.3, 0.015), blood, [0, -len * 0.6, -0.01]));
  });
  // braçadeiras + corrente enrolada no antebraço (mão da corrente)
  for (const e of [elA, elB]) { mk(e, G.cyl(0.1, 0.1, 0.12, 10), iron, [0, -0.22, 0]); for (let i = 0; i < 2; i++) mk(e, G.cyl(0.102, 0.102, 0.012, 10), darkIron, [0, -0.15 - i * 0.14, 0]); }
  for (let i = 0; i < 4; i++) mk(elA, G.tor(0.09, 0.012), iron, [0, -0.06 - i * 0.05, 0], [Math.PI / 2 + (i % 2 ? 0.3 : -0.3), 0, 0]);
  swinger(rig, chainStrand(handA, [0.04, -0.04, 0], 6, iron, 0.026), { amp: 0.08, drag: 0.6, k: 30 });
  // joelheiras, grevas e biqueiras de ferro
  for (const kn of [knA, knB]) { mk(kn, G.sph(0.085, 8, 6), iron, [0, 0, 0.07], [0, 0, 0], [1, 1, 0.7]); mk(kn, G.cyl(0.1, 0.085, 0.26, 10), darkIron, [0, -d.shin * 0.62, 0.0]); }
  for (const an of [ankleA, ankleB]) mk(an, G.box(0.16, 0.06, 0.1), iron, [0, -0.01, 0.17]);
  // capuz de carrasco com costuras
  mk(neck, G.cyl(0.08, 0.1, 0.16, 8), skin, [0, 0.05, 0]);
  mk(head, G.sph(0.16, 14, 10), hood, [0, 0.04, 0], [0, 0, 0], [1, 1.12, 1.05]);
  mk(head, G.cone(0.14, 0.3, 10), hood, [0, 0.27, -0.03], [-0.25, 0, 0]);
  mk(head, G.box(0.24, 0.12, 0.05), hood, [0, 0.03, 0.14]);
  mk(head, G.box(0.012, 0.22, 0.012), std(0x3a2a20), [0, 0.12, 0.15], [-0.3, 0, 0]);
  mk(head, G.sph(0.03, 8, 6), eye, [0.055, 0.06, 0.155]);
  mk(head, G.sph(0.03, 8, 6), eye, [-0.055, 0.06, 0.155]);
  mk(chest, G.cyl(0.24, 0.32, 0.24, 12, 1), hood, [0, d.torso * 0.5, -0.02], [0, 0, 0], [1, 1, 0.8]);
  // machado do carrasco: cabo envolto em couro, lâmina crescente com entalhes, esporão e pomo
  const weapon = new THREE.Group(); weapon.position.set(0, -0.06, 0); handB.add(weapon);
  mk(weapon, G.cyl(0.03, 0.036, 1.3, 8), wood, [0, 0, 0.38], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 4; i++) mk(weapon, G.cyl(0.04, 0.04, 0.05, 8), leather, [0, 0, -0.12 + i * 0.07], [Math.PI / 2, 0, 0]);
  for (const z of [0.55, 0.85]) mk(weapon, G.cyl(0.042, 0.042, 0.03, 8), iron, [0, 0, z], [Math.PI / 2, 0, 0]);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.06); shape.lineTo(0.0, -0.09); shape.quadraticCurveTo(-0.12, -0.36, 0.2, -0.56);
  shape.lineTo(0.24, -0.47); shape.lineTo(0.27, -0.5); // entalhe
  shape.quadraticCurveTo(0.33, -0.22, 0.33, 0.06); shape.lineTo(0.28, 0.1); shape.lineTo(0.3, 0.16); shape.quadraticCurveTo(0.16, 0.08, 0, 0.06);
  const bladeGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 1 });
  const bl = mk(weapon, bladeGeo, blade, [0.015, 0, 0.82], [0, -Math.PI / 2, 0]);
  bl.scale.set(1.25, 1.25, 1);
  mk(weapon, G.cone(0.035, 0.22, 6), darkIron, [0, 0.14, 0.94], [0, 0, 0]); // esporão traseiro
  const edge = mk(weapon, G.box(0.035, 0.4, 0.02), blood, [0, -0.38, 1.08], [0.5, 0, 0]);
  edge.visible = true;
  mk(weapon, G.sph(0.05, 8, 6), iron, [0, 0, 1.03]);
  mk(weapon, G.cone(0.03, 0.1, 6), iron, [0, 0, -0.32], [-Math.PI / 2, 0, 0]); // pomo
  const weaponTip = new THREE.Object3D(); weaponTip.position.set(0, -0.32, 1.0); weapon.add(weaponTip);
  // chamas do Carrasco do Inferno (transformação): sprites aditivos ao longo da lâmina
  const flames = new THREE.Group(); weapon.add(flames); flames.visible = false;
  const fmat = new THREE.SpriteMaterial({ map: glowSprite('#ff6010'), blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 6; i++) { const sp = new THREE.Sprite(fmat); sp.position.set(0, -0.1 - i * 0.09, 0.95 + Math.sin(i) * 0.05); sp.scale.set(0.35, 0.5, 1); flames.add(sp); }
  Object.assign(rig, { weapon, weaponTip, flames });
  // ferimentos progressivos
  dmg[1].push(mk(spine, G.box(0.22, 0.025, 0.02), blood, [0.05, 0.42, 0.25], [0, 0, 0.5]));
  dmg[1].push(mk(spine, G.box(0.18, 0.025, 0.02), blood, [-0.1, 0.28, 0.255], [0, 0, -0.4]));
  dmg[1].push(mk(shB, G.box(0.02, 0.18, 0.025), blood, [-0.1, -0.15, 0.05]));
  dmg[2].push(mk(spine, G.sph(0.09, 8, 6), bruise, [0.16, 0.18, 0.2], [0, 0, 0], [1, 1, 0.3]));
  dmg[2].push(mk(head, G.box(0.18, 0.04, 0.03), blood, [0, 0.16, 0.13], [0, 0, 0.6]));
  dmg[2].push(mk(spine, G.box(0.3, 0.03, 0.03), blood, [0, 0.5, -0.22], [0, 0, 0.3]));
  dmg[3].push(mk(spine, G.sph(0.14, 10, 8), blood, [-0.05, 0.35, 0.22], [0, 0, 0], [1, 1.3, 0.25]));
  dmg[3].push(mk(head, G.sph(0.1, 8, 6), blood, [0.06, -0.02, 0.12], [0, 0, 0], [1, 1.4, 0.4]));
  dmg[3].push(mk(hipA, G.sph(0.09, 8, 6), blood, [0, -0.25, 0.1], [0, 0, 0], [1, 1.6, 0.4]));
  return { furyEmissive: [blade, eye], furyColor: 0xff4a00, blood, eye, skin };
}

function buildLilith(rig, dmg, c) {
  const skin = std(c.skin, { roughness: 0.55 });
  const robe = std(c.robe, { roughness: 0.7, side: THREE.DoubleSide });
  const robeDark = std(c.robeDark, { roughness: 0.8, side: THREE.DoubleSide });
  const hair = std(c.hair, { roughness: 0.6, side: THREE.DoubleSide });
  const gold = std(c.gold, { metalness: 0.85, roughness: 0.35 });
  const eye = std(0x000000, { emissive: c.eye, emissiveIntensity: 2.4 });
  const magic = std(0x200005, { emissive: c.magic, emissiveIntensity: 1.6 });
  const rune = std(0x200005, { emissive: c.magic, emissiveIntensity: 0.9, side: THREE.DoubleSide });
  const boot = std(c.boot, { roughness: 0.6 });
  const blood = std(0x5a0000, { roughness: 0.35, emissive: 0x200000 });
  const bruise = std(0x3a1838, { roughness: 0.9 });
  const d = { hip: 0.96, thigh: 0.47, shin: 0.47, foot: 0.06, torso: 0.55, shoulder: 0.25, uarm: 0.3, farm: 0.28, armR: 0.065, legR: 0.085, hipW: 0.11 };
  skeleton(rig, d, { upperArm: skin, foreArm: robe, hand: skin, thigh: skin, shin: boot, foot: boot });
  dmg.skinMats.push(skin);
  const { pelvis, spine, chest, head, neck, shA, shB, handA, handB, elA, elB, hipA, hipB, knA, knB, ankleA, ankleB } = rig;
  // corpo esguio + corpete com acabamento dourado e cordões
  mk(spine, G.cyl(0.24, 0.19, d.torso, 12), robeDark, [0, d.torso * 0.5, 0], [0, 0, 0], [1, 1, 0.7]);
  mk(spine, G.cyl(0.2, 0.2, 0.08, 12), gold, [0, 0.05, 0], [0, 0, 0], [1, 1, 0.72]);
  mk(spine, G.cyl(0.235, 0.235, 0.025, 12), gold, [0, d.torso * 0.72, 0], [0, 0, 0], [1, 1, 0.72]);
  for (let i = 0; i < 4; i++) { const y = 0.14 + i * 0.075; mk(spine, G.box(0.11, 0.008, 0.008), gold, [0, y, 0.15], [0, 0, 0.5]); mk(spine, G.box(0.11, 0.008, 0.008), gold, [0, y, 0.15], [0, 0, -0.5]); }
  mk(chest, G.sph(0.13, 12, 8), skin, [0, d.torso * 0.36, 0.06], [0, 0, 0], [1.5, 0.55, 0.6]);
  mk(chest, G.sph(0.022, 8, 6), magic, [0, d.torso * 0.3, 0.155]); // gema no decote
  // gola alta com espinhos atrás do pescoço
  const collar = mk(chest, new THREE.CylinderGeometry(0.2, 0.15, 0.34, 14, 1, true, Math.PI * 0.6, Math.PI * 0.8), robeDark, [0, d.torso * 0.62, -0.02]);
  for (let i = 0; i < 5; i++) { const a = Math.PI * (0.65 + i * 0.175); mk(collar, G.cone(0.02, 0.14, 5), gold, [Math.sin(a) * 0.2, 0.2, Math.cos(a) * 0.2], [Math.cos(a) * -0.3, 0, Math.sin(a) * 0.3]); }
  // ombreiras douradas
  for (const sh of [shA, shB]) { const p = mk(sh, G.sph(0.095, 10, 8), gold, [0, 0.01, 0], [0, 0, 0], [1.1, 0.7, 1.1]); mk(p, G.cone(0.02, 0.1, 5), gold, [sh === shA ? 0.06 : -0.06, 0.07, 0], [0, 0, sh === shA ? -0.6 : 0.6]); }
  // saia em painéis presos às coxas (seguem as pernas, sem atravessar) + cauda traseira com mola
  const panelGeo = new THREE.CylinderGeometry(0.15, 0.28, 0.82, 12, 1, true, Math.PI * 0.85, Math.PI * 1.3);
  rig.skirtPanels = [];
  for (const [hip, sgn] of [[hipA, 1], [hipB, -1]]) {
    // pivô na pelve: acompanha parcialmente a coxa (o tecido não levanta como uma asa nos chutes)
    const pv = new THREE.Group(); pv.position.copy(hip.position); pelvis.add(pv);
    rig.skirtPanels.push({ pv, hip });
    const pnl = mk(pv, panelGeo, robe, [sgn * 0.02, -0.36, -0.02], [0, sgn * 0.6, 0]);
    mk(pnl, new THREE.CylinderGeometry(0.281, 0.281, 0.03, 12, 1, true, Math.PI * 0.85, Math.PI * 1.3), gold, [0, -0.4, 0]);
    // runas brilhantes no tecido
    for (let i = 0; i < 3; i++) mk(pnl, G.box(0.012, 0.09, 0.005), rune, [Math.sin(Math.PI * 1.5 + i * 0.4) * 0.235, -0.12 - i * 0.08, Math.cos(Math.PI * 1.5 + i * 0.4) * 0.235], [0, Math.PI * 1.5 + i * 0.4, 0.3]);
  }
  const tail = new THREE.Group(); tail.position.set(0, -0.05, -0.12); pelvis.add(tail);
  mk(tail, new THREE.CylinderGeometry(0.2, 0.42, 0.95, 14, 1, true, Math.PI * 0.72, Math.PI * 0.56), robe, [0, -0.45, 0.05], [0.08, 0, 0]);
  rig.skirtTail = tail;
  const sash = strip(pelvis, [0, 0.02, 0.19], 0.12, 0.62, robeDark, [-0.04, 0, 0], 0.012);
  mk(sash, G.box(0.13, 0.02, 0.015), gold, [0, -0.6, 0]);
  swinger(rig, sash, { amp: 0.04, drag: 0.8, followK: 0.45 });
  mk(pelvis, G.cyl(0.2, 0.2, 0.05, 12), gold, [0, 0.03, 0], [0, 0, 0], [1, 1, 0.75]);
  dmg.remove2.push(sash);
  // mangas largas em sino
  const sleeveA = mk(elA, G.cone(0.14, 0.32, 12, 1, true), robe, [0, -0.21, 0], [Math.PI, 0, 0]);
  mk(elB, G.cone(0.14, 0.32, 12, 1, true), robe, [0, -0.21, 0], [Math.PI, 0, 0]);
  dmg.remove2.push(sleeveA);
  // mãos com magia e garras
  for (const h of [handA, handB]) {
    mk(h, G.sph(0.06, 8, 6), magic, [0, -0.08, 0]);
    for (let i = 0; i < 4; i++) mk(h, G.cone(0.01, 0.07, 4), std(0x1a0508, { metalness: 0.5, roughness: 0.3 }), [-0.035 + i * 0.023, -0.14, 0.03], [0.3, 0, 0]);
    const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ff1838'), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 }));
    g.scale.set(0.3, 0.3, 1); g.position.set(0, -0.08, 0); h.add(g);
  }
  // botas altas com salto
  for (const kn of [knA, knB]) mk(kn, G.cyl(0.075, 0.07, 0.08, 10), gold, [0, -0.02, 0]);
  for (const an of [ankleA, ankleB]) mk(an, G.box(0.04, 0.08, 0.04), boot, [0, -0.04, -0.06]);
  // cabeça, cabelo em mechas com mola e coroa de chifres
  mk(neck, G.cyl(0.05, 0.06, 0.14, 8), skin, [0, 0.04, 0]);
  mk(head, G.sph(0.13, 14, 10), skin, [0, 0.03, 0], [0, 0, 0], [0.92, 1.12, 1]);
  mk(head, G.sph(0.022, 8, 6), eye, [0.045, 0.05, 0.11]);
  mk(head, G.sph(0.022, 8, 6), eye, [-0.045, 0.05, 0.11]);
  mk(head, G.box(0.06, 0.015, 0.01), blood, [0, -0.04, 0.125]);
  mk(head, G.sph(0.14, 12, 8), hair, [0, 0.07, -0.02], [0, 0, 0], [1, 1.05, 1.08]);
  rig.hair = [];
  [[-0.09, 0.62, 0.1], [0, 0.72, 0.13], [0.09, 0.62, 0.1]].forEach(([x, len, w]) => {
    const s = strip(head, [x, 0.06, -0.1], w, len, hair, [0.15, 0, x * 0.6], 0.05);
    rig.hair.push(swinger(rig, s, { amp: 0.05, drag: -0.9, k: 35, damp: 5 }));
  });
  rig.hairMesh = rig.hair[1].obj;
  mk(head, G.box(0.05, 0.4, 0.05), hair, [0.12, -0.1, 0.03]);
  mk(head, G.box(0.05, 0.4, 0.05), hair, [-0.12, -0.1, 0.03]);
  mk(head, G.tor(0.12, 0.012), gold, [0, 0.13, 0], [Math.PI / 2 + 0.1, 0, 0]);
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.5;
    mk(head, G.cone(0.02, 0.16 + (i === 2 ? 0.08 : 0), 6), robeDark, [Math.sin(a) * 0.12, 0.2, Math.cos(a) * 0.1], [0.3 * Math.cos(a) - 0.1, 0, -a * 0.5]);
  }
  mk(head, G.sph(0.018, 6, 4), magic, [0, 0.2, 0.11]);
  // orbes de sangue que orbitam a cintura (efeito carmesim)
  const orbs = new THREE.Group(); pelvis.add(orbs); orbs.position.y = 0.25;
  const orbGlow = new THREE.SpriteMaterial({ map: glowSprite('#ff1030'), blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 3; i++) { const o = mk(orbs, G.sph(0.035, 8, 6), magic, [0, 0, 0]); const g = new THREE.Sprite(orbGlow); g.scale.set(0.25, 0.25, 1); o.add(g); o.userData.ph = (i / 3) * Math.PI * 2; }
  rig.orbs = orbs;
  // ferimentos
  dmg[1].push(mk(spine, G.box(0.16, 0.02, 0.02), blood, [0.04, 0.38, 0.17], [0, 0, 0.6]));
  dmg[1].push(mk(head, G.box(0.02, 0.09, 0.02), blood, [0.06, -0.02, 0.115]));
  dmg[1].push(mk(hipA, G.box(0.02, 0.16, 0.02), blood, [0.03, -0.2, 0.08]));
  dmg[2].push(mk(spine, G.sph(0.07, 8, 6), bruise, [-0.1, 0.22, 0.15], [0, 0, 0], [1, 1, 0.3]));
  dmg[2].push(mk(shA, G.box(0.02, 0.2, 0.02), blood, [0.06, -0.15, 0.05]));
  dmg[3].push(mk(spine, G.sph(0.12, 10, 8), blood, [0.02, 0.3, 0.16], [0, 0, 0], [1, 1.4, 0.25]));
  dmg[3].push(mk(head, G.sph(0.08, 8, 6), blood, [-0.04, 0.0, 0.1], [0, 0, 0], [1, 1.5, 0.4]));
  dmg[3].push(mk(tail, G.box(0.3, 0.25, 0.02), blood, [0, -0.4, -0.3]));
  rig.weaponTip = new THREE.Object3D(); handA.add(rig.weaponTip); rig.weaponTip.position.y = -0.08;
  return { furyEmissive: [magic, eye, hair, rune], furyColor: 0xff0820, blood, eye, skin };
}

// Aplica pose ao rig, com contato analítico dos pés no chão.
// v0.2: IK de duas articulações planta o pé de apoio no chão (evita pé flutuando/afundando)
// e o tornozelo compensa a rotação para o pé ficar plano.
const PLANT_GAP = 0.34; // até esta folga (m) o pé é considerado de apoio
function legIK(L1, L2, z, h) {
  // quadril na origem; alvo do tornozelo em (z à frente, h abaixo). Joelho dobra para a frente.
  let D = Math.hypot(z, h);
  const maxD = L1 + L2 - 1e-4, minD = Math.abs(L1 - L2) + 1e-3;
  if (D > maxD) { const k = maxD / D; z *= k; h *= k; D = maxD; }
  if (D < minD) D = minD;
  const phi = Math.atan2(z, h);
  const a = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))));
  const kneeIn = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2))));
  return { lx: -(phi + a), k: Math.PI - kneeIn };
}
export function applyPose(fm, p, extra) {
  const r = fm.rig, d = r.dims;
  const legReach = (lx, k) => d.thigh * Math.cos(lx) + d.shin * Math.cos(lx + k);
  const legFwd = (lx, k) => -(d.thigh * Math.sin(lx) + d.shin * Math.sin(lx + k));
  let lAx = p.lAx, kA = p.kA, lBx = p.lBx, kB = p.kB;
  const hA = legReach(lAx, kA), hB = legReach(lBx, kB);
  const ground = Math.max(hA, hB) + d.foot;
  const lift = extra.lift || 0, lie = extra.lie || 0;
  r.pelvis.position.y = ground + p.py + lift;
  const canPlant = !extra.air && lift < 0.05 && lie < 0.3 && extra.plant !== false;
  const H = ground - d.foot + p.py;
  let plantA = false, plantB = false;
  if (canPlant) {
    if (H - hA < PLANT_GAP) { const s = legIK(d.thigh, d.shin, legFwd(lAx, kA), H); lAx = s.lx; kA = s.k; plantA = true; }
    if (H - hB < PLANT_GAP) { const s = legIK(d.thigh, d.shin, legFwd(lBx, kB), H); lBx = s.lx; kB = s.k; plantB = true; }
  }
  r.spine.rotation.set(p.spx, p.spy, p.spz);
  r.neck.rotation.set(p.nx, 0, 0);
  r.shA.rotation.set(p.aAx, 0, p.aAz);
  r.elA.rotation.set(p.eA, 0, 0);
  r.shB.rotation.set(p.aBx, 0, p.aBz);
  r.elB.rotation.set(p.eB, 0, 0);
  r.hipA.rotation.set(lAx, 0, p.lAz);
  r.knA.rotation.set(kA, 0, 0);
  r.hipB.rotation.set(lBx, 0, p.lBz);
  r.knB.rotation.set(kB, 0, 0);
  // pé plano no chão quando apoiado; no ar acompanha parcialmente a canela (ponta esticada)
  if (r.ankleA) {
    r.ankleA.rotation.x = -(lAx + kA) * (plantA ? 1 : 0.35);
    r.ankleB.rotation.x = -(lBx + kB) * (plantB ? 1 : 0.35);
  }
  const flip = extra.flip || 0; // cambalhota (Corrente do Muro) girando em torno do quadril
  r.body.rotation.set(-lie * Math.PI / 2 - flip, extra.spin || 0, extra.tilt || 0);
  const c = d.hip;
  r.body.position.set(0, lie * 0.16 + (flip ? c - c * Math.cos(flip) : 0), lie * (d.hip * 0.9) + (flip ? c * Math.sin(flip) : 0));
}
