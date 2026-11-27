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
  kazuro: { skin: 0xc8b8a0, cloth: 0x1a1a22, hakama: 0x22222c, plate: 0x2a0a0a, lace: 0x8a1a1a, mask: 0x3a0808, eye: 0x60a0ff, spirit: 0x5080ff, blade: 0xb8c0c8 },
  kazuroAlt: { skin: 0xb0a898, cloth: 0xd8d0c0, hakama: 0x303848, plate: 0x101418, lace: 0x2a4a8a, mask: 0xd8d8d0, eye: 0xff3030, spirit: 0xff4040, blade: 0x909aa0 },
  brakkor: { skin: 0x7a1e12, dark: 0x3a0c08, horn: 0x2a2018, lava: 0xff5a10, eye: 0xffb020, cloth: 0x2a1a12 },
  brakkorAlt: { skin: 0x2a3036, dark: 0x14181c, horn: 0xc8bca0, lava: 0x40c0ff, eye: 0x80e0ff, cloth: 0x1a1418 },
  nymera: { skin: 0xc8d8e8, suit: 0x101a2e, trim: 0x8aa0b8, ice: 0x8ad8ff, hair: 0xeef6ff, cape: 0x1a3050, eye: 0x60e0ff },
  nymeraAlt: { skin: 0xd8c0c8, suit: 0x0c080c, trim: 0x6a5a7a, ice: 0xb080ff, hair: 0x2a1a3a, cape: 0x24102e, eye: 0xd060ff },
  pestilus: { skin: 0x9a8a70, coat: 0x15110e, leather: 0x3a2a1c, mask: 0xc8b898, hat: 0x0c0a0a, brass: 0x8a6a30, lens: 0x60ff40, toxic: 0x70ff30 },
  pestilusAlt: { skin: 0x8a7a70, coat: 0x2e2c30, leather: 0x1a1414, mask: 0x2a1a10, hat: 0x3a0a0a, brass: 0x707880, lens: 0xff4030, toxic: 0xff3060 },
};

export function buildFighter(charId, alt = false) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const pelvis = new THREE.Group(); body.add(pelvis);
  const rig = { root, body, pelvis };
  const dmg = { 1: [], 2: [], 3: [], remove2: [], skinMats: [] };
  let mats;
  const B = { varkhan: buildVarkhan, lilith: buildLilith, kazuro: buildKazuro, brakkor: buildBrakkor, nymera: buildNymera, pestilus: buildPestilus };
  mats = (B[charId] || buildVarkhan)(rig, dmg, PALETTES[charId + (alt ? 'Alt' : '')] || PALETTES.varkhan);
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
// ---------------- KAZURO (v0.3) — PLACEHOLDER procedural: samurai amaldiçoado com máscara oni e katana espectral
function buildKazuro(rig, dmg, c) {
  const skin = std(c.skin, { roughness: 0.7 });
  const cloth = std(c.cloth, { roughness: 0.9, side: THREE.DoubleSide });
  const hakama = std(c.hakama, { roughness: 0.92, side: THREE.DoubleSide });
  const plate = std(c.plate, { metalness: 0.35, roughness: 0.45 });
  const lace = std(c.lace, { roughness: 0.8 });
  const mask = std(c.mask, { metalness: 0.4, roughness: 0.35 });
  const hair = std(0x0a0a0c, { roughness: 0.7, side: THREE.DoubleSide });
  const eye = std(0x000000, { emissive: c.eye, emissiveIntensity: 2.6 });
  const spirit = std(0x050818, { emissive: c.spirit, emissiveIntensity: 1.4 });
  const blade = std(c.blade, { metalness: 0.95, roughness: 0.18, emissive: 0x000000 });
  const gold = std(0x9a7a3a, { metalness: 0.8, roughness: 0.35 });
  const rope = std(0xc8b890, { roughness: 0.95 });
  const blood = std(0x5a0000, { roughness: 0.35, emissive: 0x200000 });
  const bruise = std(0x2a1838, { roughness: 0.9 });
  const d = { hip: 0.98, thigh: 0.48, shin: 0.48, foot: 0.06, torso: 0.58, shoulder: 0.27, uarm: 0.31, farm: 0.29, armR: 0.075, legR: 0.095, hipW: 0.12 };
  skeleton(rig, d, { upperArm: cloth, foreArm: skin, hand: skin, thigh: hakama, shin: hakama, foot: std(0x2a2018) });
  dmg.skinMats.push(skin);
  const { pelvis, spine, chest, head, neck, shA, shB, handA, handB, elA, elB, hipA, hipB, knA, knB, ankleA, ankleB } = rig;
  // tronco: quimono escuro + couraça (dō) laqueada em placas amarradas
  mk(spine, G.cyl(0.26, 0.21, d.torso, 12), cloth, [0, d.torso * 0.5, 0], [0, 0, 0], [1, 1, 0.72]);
  const dou = new THREE.Group(); spine.add(dou);
  for (let i = 0; i < 4; i++) mk(dou, G.cyl(0.27 - i * 0.008, 0.25 - i * 0.008, 0.1, 12, 1, true), plate, [0, 0.12 + i * 0.105, 0], [0, 0, 0], [1, 1, 0.76]);
  for (let i = 0; i < 4; i++) mk(dou, G.cyl(0.272 - i * 0.008, 0.272 - i * 0.008, 0.012, 12, 1, true), lace, [0, 0.07 + i * 0.105, 0], [0, 0, 0], [1, 1, 0.76]);
  mk(dou, G.box(0.04, 0.38, 0.02), lace, [0, 0.27, 0.2]);
  dmg.remove2.push(dou);
  // obi (faixa) com nó e corda sagrada (shimenawa) rompida
  mk(spine, G.cyl(0.24, 0.24, 0.1, 12), lace, [0, 0.03, 0], [0, 0, 0], [1, 1, 0.78]);
  mk(spine, G.box(0.1, 0.08, 0.06), lace, [-0.12, 0.02, 0.18]);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; mk(spine, G.tor(0.03, 0.012), rope, [Math.cos(a) * 0.255, 0.1, Math.sin(a) * 0.19], [0, a, Math.PI / 2]); }
  for (const x of [-0.1, 0.06]) swinger(rig, strip(spine, [x, 0.06, 0.2], 0.05, 0.22, std(0xe8e0d0, { side: THREE.DoubleSide }), [-0.1, 0, 0], 0.005), { amp: 0.08, drag: 0.8, k: 40 });
  // hakama: painéis largos que acompanham as coxas
  rig.skirtPanels = [];
  for (const [hip, x] of [[hipA, d.hipW], [hipB, -d.hipW]]) {
    const pv = new THREE.Group(); pv.position.set(x, 0, 0); pelvis.add(pv);
    mk(pv, G.cyl(0.13, 0.22, 0.86, 10, 1, true), hakama, [0, -0.43, 0]);
    rig.skirtPanels.push({ pv, hip });
  }
  // haori rasgado nas costas
  rig.cape = [];
  [[-0.17, 0.78, 0.13], [-0.05, 0.9, 0.12], [0.07, 0.84, 0.12], [0.18, 0.72, 0.12]].forEach(([x, len, w]) => {
    const s = strip(chest, [x, d.torso * 0.35, -0.18], w, len, cloth, [0.08, 0, x * 0.3], 0.01);
    rig.cape.push(swinger(rig, s, { amp: 0.06, drag: -1.1, k: 32, damp: 5 }));
  });
  // ombreiras (sode) penduradas
  for (const [sh, s] of [[shA, 1], [shB, -1]]) {
    const pv = new THREE.Group(); pv.position.set(s * 0.05, 0.05, 0); sh.add(pv);
    for (let i = 0; i < 3; i++) mk(pv, G.box(0.2, 0.075, 0.2), plate, [s * 0.03, -0.04 - i * 0.075, 0], [0, 0, s * 0.18]);
    for (let i = 0; i < 3; i++) mk(pv, G.box(0.205, 0.012, 0.205), lace, [s * 0.03, -0.08 - i * 0.075, 0], [0, 0, s * 0.18]);
    swinger(rig, pv, { axis: 'z', amp: 0.03, drag: 0.3, k: 50 });
  }
  dmg.remove2.push(shA.children[shA.children.length - 1]);
  // manoplas (kote) e caneleiras (suneate)
  for (const e of [elA, elB]) { mk(e, G.cyl(0.08, 0.07, 0.2, 9), plate, [0, -0.15, 0]); mk(e, G.cyl(0.082, 0.082, 0.012, 9), lace, [0, -0.06, 0]); }
  for (const kn of [knA, knB]) { mk(kn, G.box(0.13, 0.3, 0.06), plate, [0, -0.25, 0.08]); mk(kn, G.sph(0.06, 8, 6), plate, [0, 0, 0.08]); }
  for (const an of [ankleA, ankleB]) mk(an, G.box(0.13, 0.03, 0.26), std(0x8a7050), [0, -0.075, 0.06]); // waraji
  // cabeça: coque samurai, máscara oni (menpo) rachada com chifres e olhos espectrais
  mk(neck, G.cyl(0.055, 0.065, 0.14, 8), skin, [0, 0.04, 0]);
  mk(head, G.sph(0.13, 14, 10), skin, [0, 0.03, 0], [0, 0, 0], [0.95, 1.1, 1]);
  mk(head, G.sph(0.135, 12, 8), hair, [0, 0.08, -0.03], [0, 0, 0], [1, 0.9, 1.05]);
  mk(head, G.cyl(0.035, 0.03, 0.14, 8), hair, [0, 0.2, -0.04], [-0.9, 0, 0]);
  mk(head, G.tor(0.035, 0.01), std(0xa01010), [0, 0.2, -0.07], [0.6, 0, 0]);
  const hl = strip(head, [0, 0.16, -0.12], 0.05, 0.36, hair, [0.25, 0, 0], 0.03);
  swinger(rig, hl, { amp: 0.06, drag: -0.9, k: 35, damp: 5 });
  rig.hair = [swinger(rig, strip(head, [0.08, 0.1, 0.08], 0.03, 0.22, hair, [0, 0, 0.15], 0.015), { amp: 0.05, k: 40 })];
  rig.hairMesh = hl;
  const menpo = new THREE.Group(); head.add(menpo); menpo.position.set(0, 0, 0.1);
  mk(menpo, G.sph(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), mask, [0, 0.0, 0], [Math.PI / 2 + 0.2, 0, 0], [1, 0.45, 1.05]);
  mk(menpo, G.box(0.2, 0.06, 0.06), mask, [0, -0.06, 0.02]);
  for (let i = 0; i < 6; i++) mk(menpo, G.cone(0.01, 0.04, 4), std(0xe8e0c8), [-0.06 + i * 0.024, -0.07, 0.055], [Math.PI, 0, 0]);
  for (const s of [-1, 1]) {
    mk(menpo, G.cone(0.028, 0.2, 6), mask, [s * 0.09, 0.16, -0.04], [-0.3, 0, -s * 0.45]);
    mk(head, G.sph(0.022, 8, 6), eye, [s * 0.045, 0.05, 0.12]);
  }
  mk(menpo, G.box(0.006, 0.12, 0.01), std(0x000000), [0.04, 0.0, 0.08], [0, 0, 0.4]); // rachadura
  dmg[2].push(mk(menpo, G.box(0.08, 0.05, 0.02), skin, [0.05, -0.03, 0.07]));
  // katana: tsuka trançada, tsuba, lâmina levemente curva; saya na cintura
  const weapon = new THREE.Group(); weapon.position.set(0, -0.06, 0); handB.add(weapon);
  mk(weapon, G.cyl(0.024, 0.024, 0.3, 8), lace, [0, 0, 0.04], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 5; i++) mk(weapon, G.box(0.05, 0.012, 0.012), std(0xe8e0d0), [0, 0, -0.08 + i * 0.055], [0, 0, i % 2 ? 0.7 : -0.7]);
  mk(weapon, G.cyl(0.075, 0.075, 0.015, 12), gold, [0, 0, 0.2], [Math.PI / 2, 0, 0]);
  const bl = new THREE.Group(); weapon.add(bl); bl.position.z = 0.2;
  for (let i = 0; i < 4; i++) mk(bl, G.box(0.012, 0.035, 0.24), blade, [0, i * i * 0.006, 0.12 + i * 0.235], [-i * 0.025, 0, 0]);
  mk(bl, G.cone(0.018, 0.09, 4), blade, [0, 0.055, 1.0], [Math.PI / 2 - 0.1, 0, 0], [0.5, 1, 1]);
  dmg[1].push(mk(bl, G.box(0.014, 0.02, 0.4), blood, [0, -0.012, 0.75]));
  const weaponTip = new THREE.Object3D(); weaponTip.position.set(0, 0.06, 1.2); weapon.add(weaponTip);
  const saya = mk(pelvis, G.box(0.04, 0.05, 0.85), std(0x14100e, { roughness: 0.4, metalness: 0.2 }), [0.22, 0.02, -0.05], [0.5, 0.25, 0]);
  mk(saya, G.box(0.05, 0.06, 0.05), gold, [0, 0, 0.42]);
  // chamas espectrais na lâmina (Oni Desperto) + espíritos que orbitam
  const flames = new THREE.Group(); weapon.add(flames); flames.visible = false;
  const fmat = new THREE.SpriteMaterial({ map: glowSprite('#4070ff'), blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 7; i++) { const sp = new THREE.Sprite(fmat); sp.position.set(0, 0.03, 0.35 + i * 0.13); sp.scale.set(0.3, 0.5, 1); flames.add(sp); }
  const orbs = new THREE.Group(); chest.add(orbs); orbs.position.y = 0.1;
  const og = new THREE.SpriteMaterial({ map: glowSprite('#6090ff'), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 });
  for (let i = 0; i < 2; i++) { const o = mk(orbs, G.sph(0.03, 8, 6), spirit, [0, 0, 0]); const g = new THREE.Sprite(og); g.scale.set(0.22, 0.22, 1); o.add(g); o.userData.ph = i * Math.PI; }
  Object.assign(rig, { weapon, weaponTip, flames, orbs });
  // ferimentos
  dmg[1].push(mk(spine, G.box(0.2, 0.022, 0.02), blood, [0.05, 0.4, 0.22], [0, 0, 0.6]));
  dmg[1].push(mk(head, G.box(0.1, 0.018, 0.02), blood, [-0.05, 0.08, 0.12], [0, 0, -0.5]));
  dmg[2].push(mk(spine, G.sph(0.08, 8, 6), bruise, [-0.13, 0.25, 0.19], [0, 0, 0], [1, 1, 0.3]));
  dmg[2].push(mk(shB, G.box(0.02, 0.2, 0.025), blood, [-0.07, -0.18, 0.05]));
  dmg[3].push(mk(spine, G.sph(0.13, 10, 8), blood, [0.06, 0.3, 0.2], [0, 0, 0], [1, 1.3, 0.25]));
  dmg[3].push(mk(hipB, G.sph(0.08, 8, 6), blood, [0, -0.2, 0.1], [0, 0, 0], [1, 1.6, 0.4]));
  return { furyEmissive: [blade, eye, spirit], furyColor: 0x3060ff, blood, eye, skin };
}

// ---------------- BRAKKOR (v0.3) — PLACEHOLDER procedural: demônio gigante com chifres, fissuras de lava e mandíbula
function buildBrakkor(rig, dmg, c) {
  const skin = std(c.skin, { roughness: 0.85 });
  const dark = std(c.dark, { roughness: 0.9 });
  const horn = std(c.horn, { roughness: 0.55, metalness: 0.1 });
  const lava = std(0x200400, { emissive: c.lava, emissiveIntensity: 1.5 });
  const eye = std(0x000000, { emissive: c.eye, emissiveIntensity: 2.8 });
  const iron = std(0x3a3a3e, { metalness: 0.8, roughness: 0.45 });
  const cloth = std(c.cloth, { roughness: 0.95, side: THREE.DoubleSide });
  const tooth = std(0xd8ccb0, { roughness: 0.5 });
  const claw = std(0x1a1210, { metalness: 0.3, roughness: 0.4, emissive: 0x000000 });
  const blood = std(0x5a0000, { roughness: 0.35, emissive: 0x200000 });
  const bruise = std(0x1a0a18, { roughness: 0.9 });
  const d = { hip: 1.18, thigh: 0.58, shin: 0.58, foot: 0.06, torso: 0.78, shoulder: 0.46, uarm: 0.42, farm: 0.4, armR: 0.15, legR: 0.17, hipW: 0.2 };
  skeleton(rig, d, { upperArm: skin, foreArm: skin, hand: skin, thigh: skin, shin: dark, foot: horn });
  dmg.skinMats.push(skin);
  const { pelvis, spine, chest, head, neck, shA, shB, handA, handB, elA, elB, hipA, hipB, knA, knB, ankleA, ankleB } = rig;
  // tronco colossal curvado + barriga + placas ósseas
  mk(spine, G.cyl(0.52, 0.38, d.torso + 0.05, 14), skin, [0, d.torso * 0.5, 0.02], [0.12, 0, 0], [1, 1, 0.74]);
  mk(spine, G.sph(0.34, 12, 10), skin, [0, 0.2, 0.12], [0, 0, 0], [1.05, 0.9, 0.8]);
  for (const s of [-1, 1]) mk(spine, G.sph(0.2, 10, 8), skin, [s * 0.17, d.torso * 0.72, 0.22], [0, 0, 0], [1, 0.75, 0.55]); // peitorais
  // fissuras de lava no peito e braços
  const cracks = [];
  for (const [x, y, r] of [[0.05, 0.5, 0.5], [-0.15, 0.32, -0.7], [0.2, 0.18, 0.9], [-0.05, 0.1, 0.2]]) cracks.push(mk(spine, G.box(0.18, 0.02, 0.02), lava, [x, y, 0.33], [0, 0, r]));
  for (const e of [elA, elB]) { cracks.push(mk(e, G.box(0.02, 0.22, 0.02), lava, [0, -0.2, 0.13], [0, 0, 0.3])); }
  // espinhos dorsais e corcunda
  mk(chest, G.sph(0.36, 12, 8), skin, [0, d.torso * 0.25, -0.2], [0, 0, 0], [1.2, 0.8, 0.8]);
  for (let i = 0; i < 6; i++) mk(spine, G.cone(0.05, 0.22 - i * 0.015, 6), horn, [0, 0.15 + i * 0.13, -0.32], [-1.0, 0, 0]);
  // ombros com placas ósseas e espinhos
  for (const [sh, s] of [[shA, 1], [shB, -1]]) {
    const p = mk(sh, G.sph(0.24, 12, 8), dark, [s * 0.04, 0.02, 0], [0, 0, 0], [1, 0.75, 1]);
    for (let i = 0; i < 3; i++) mk(p, G.cone(0.05, 0.28, 6), horn, [s * 0.06, 0.15, -0.1 + i * 0.1], [0, 0, -s * 0.5]);
    if (s > 0) dmg.remove2.push(p);
  }
  // grilhões partidos nos pulsos com correntes
  for (const e of [elA, elB]) { mk(e, G.cyl(0.16, 0.16, 0.14, 10), iron, [0, -d.farm + 0.08, 0]); }
  swinger(rig, chainStrand(elA, [0.1, -d.farm + 0.05, 0], 5, iron, 0.04), { amp: 0.08, drag: 0.6, k: 30 });
  swinger(rig, chainStrand(elB, [-0.1, -d.farm + 0.05, 0], 4, iron, 0.04), { amp: 0.08, drag: 0.6, k: 30 });
  // mãos enormes com garras
  for (const h of [handA, handB]) {
    mk(h, G.box(0.2, 0.18, 0.18), skin, [0, -0.08, 0]);
    for (let i = 0; i < 4; i++) mk(h, G.cone(0.025, 0.16, 5), claw, [-0.07 + i * 0.047, -0.22, 0.06], [0.4, 0, 0]);
    mk(h, G.cone(0.025, 0.13, 5), claw, [0.1, -0.12, 0.08], [0.3, 0, -0.6]);
  }
  // tanga de couro e pele, cinto de crânios
  mk(spine, G.cyl(0.42, 0.42, 0.13, 14), std(0x2a1810), [0, 0.0, 0.03], [0, 0, 0], [1, 1, 0.78]);
  for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; mk(spine, G.sph(0.055, 8, 6), tooth, [Math.sin(a) * 0.42, 0.0, Math.cos(a) * 0.33 + 0.02], [0, 0, 0], [1, 1.1, 0.9]); }
  const flapF = strip(pelvis, [0, -0.04, 0.3], 0.36, 0.55, cloth, [-0.05, 0, 0], 0.04);
  const flapB = strip(pelvis, [0, -0.04, -0.28], 0.4, 0.5, cloth, [0.05, 0, 0], 0.04);
  swinger(rig, flapF, { amp: 0.03, drag: 0.6, followK: 0.5 }); swinger(rig, flapB, { amp: 0.03, drag: -0.6, followK: 0.5 });
  rig.flapF = flapF; rig.flapB = flapB;
  // cauda segmentada com ponta óssea
  const tail = new THREE.Group(); tail.position.set(0, 0.02, -0.3); tail.rotation.x = 0.9; pelvis.add(tail);
  let seg = tail;
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group(); g.position.y = i ? -0.2 : 0; seg.add(g);
    mk(g, G.cyl(0.08 - i * 0.012, 0.07 - i * 0.012, 0.22, 8), skin, [0, -0.1, 0]);
    swinger(rig, g, { amp: 0.12, freq: 1.3 + i * 0.1, drag: -0.4, k: 25, damp: 4 });
    seg = g;
  }
  mk(seg, G.cone(0.06, 0.18, 5), horn, [0, -0.25, 0], [Math.PI, 0, 0]);
  // pernas de bode: joelhos ósseos, cascos
  for (const kn of [knA, knB]) mk(kn, G.sph(0.13, 8, 6), dark, [0, 0, 0.08], [0, 0, 0], [1, 1, 0.7]);
  for (const an of [ankleA, ankleB]) { mk(an, G.cyl(0.13, 0.15, 0.12, 8), horn, [0, -0.02, 0.04]); }
  // cabeça: mandíbula, presas, chifres em espiral, olhos de brasa
  mk(neck, G.cyl(0.18, 0.24, 0.2, 10), skin, [0, 0.0, 0.05]);
  mk(head, G.sph(0.2, 14, 10), skin, [0, 0.05, 0.04], [0, 0, 0], [1, 0.95, 1.05]);
  mk(head, G.box(0.3, 0.06, 0.1), dark, [0, 0.1, 0.18]); // sobrancelha
  for (const s of [-1, 1]) {
    mk(head, G.sph(0.03, 8, 6), eye, [s * 0.08, 0.06, 0.21]);
    let hp = head, pos = [s * 0.15, 0.18, 0.0], r = 0.07;
    for (let i = 0; i < 5; i++) { const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(-0.35, 0, -s * (0.55 - i * 0.05)); hp.add(g); mk(g, G.cyl(r * 0.8, r, 0.13, 8), horn, [0, 0.065, 0]); hp = g; pos = [0, 0.13, 0]; r *= 0.8; }
    mk(hp, G.cone(r, 0.14, 8), horn, [0, 0.07, 0]);
  }
  const jaw = new THREE.Group(); jaw.position.set(0, -0.06, 0.05); head.add(jaw);
  mk(jaw, G.box(0.28, 0.08, 0.26), skin, [0, -0.04, 0.06]);
  mk(jaw, G.box(0.22, 0.02, 0.2), lava, [0, 0.0, 0.08]); // garganta incandescente
  for (let i = 0; i < 6; i++) mk(jaw, G.cone(0.016, 0.07, 4), tooth, [-0.1 + i * 0.04, 0.03, 0.18]);
  for (const s of [-1, 1]) mk(jaw, G.cone(0.025, 0.13, 5), tooth, [s * 0.12, 0.06, 0.15], [0, 0, s * 0.15]);
  rig.jaw = jaw;
  // "arma": garra direita (ponta para rastros e cinemáticas) + chamas da transformação nos chifres/ombros
  const weapon = new THREE.Group(); handA.add(weapon);
  const weaponTip = new THREE.Object3D(); weaponTip.position.set(0, -0.3, 0.08); weapon.add(weaponTip);
  const flames = new THREE.Group(); chest.add(flames); flames.visible = false;
  const fmat = new THREE.SpriteMaterial({ map: glowSprite('#ff5a10'), blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 8; i++) { const sp = new THREE.Sprite(fmat); const a = (i / 7 - 0.5) * 2.6; sp.position.set(Math.sin(a) * 0.45, d.torso * 0.45 + Math.cos(a) * 0.12, -0.15); sp.scale.set(0.35, 0.55, 1); flames.add(sp); }
  Object.assign(rig, { weapon, weaponTip, flames });
  // ferimentos
  dmg[1].push(mk(spine, G.box(0.25, 0.03, 0.02), blood, [0.1, 0.55, 0.36], [0, 0, 0.5]));
  dmg[1].push(mk(head, G.box(0.12, 0.02, 0.02), blood, [0.06, 0.12, 0.23], [0, 0, -0.4]));
  dmg[2].push(mk(spine, G.sph(0.12, 8, 6), bruise, [-0.2, 0.4, 0.3], [0, 0, 0], [1, 1, 0.3]));
  dmg[2].push(mk(shB, G.box(0.03, 0.25, 0.03), blood, [-0.12, -0.2, 0.1]));
  dmg[3].push(mk(spine, G.sph(0.18, 10, 8), blood, [0.05, 0.3, 0.33], [0, 0, 0], [1, 1.3, 0.25]));
  dmg[3].push(mk(hipA, G.sph(0.12, 8, 6), blood, [0, -0.3, 0.14], [0, 0, 0], [1, 1.6, 0.4]));
  return { furyEmissive: [lava, eye, claw], furyColor: 0xff7a10, blood, eye, skin };
}

// ---------------- NYMERA (v0.4) — PLACEHOLDER procedural: assassina glacial com coroa de gelo, adagas e capa de geada
function buildNymera(rig, dmg, c) {
  const skin = std(c.skin, { roughness: 0.5 });
  const suit = std(c.suit, { roughness: 0.55, metalness: 0.15, side: THREE.DoubleSide });
  const trim = std(c.trim, { roughness: 0.4, metalness: 0.7 });
  const ice = std(0x0a1a28, { emissive: c.ice, emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.88 });
  const iceSolid = std(c.ice, { emissive: c.ice, emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.2 });
  const hair = std(c.hair, { roughness: 0.45, side: THREE.DoubleSide });
  const cape = std(c.cape, { roughness: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 0.92, emissive: c.ice, emissiveIntensity: 0.08 });
  const eye = std(0x000000, { emissive: c.eye, emissiveIntensity: 2.6 });
  const blood = std(0x5a0000, { roughness: 0.35, emissive: 0x200000 });
  const bruise = std(0x30304a, { roughness: 0.9 });
  const d = { hip: 0.95, thigh: 0.47, shin: 0.47, foot: 0.06, torso: 0.54, shoulder: 0.24, uarm: 0.29, farm: 0.27, armR: 0.06, legR: 0.08, hipW: 0.105 };
  skeleton(rig, d, { upperArm: suit, foreArm: suit, hand: skin, thigh: suit, shin: suit, foot: trim });
  dmg.skinMats.push(skin);
  const { pelvis, spine, chest, head, neck, shA, shB, handA, handB, elA, elB, hipA, hipB, knA, knB, ankleA, ankleB } = rig;
  // corpo esguio: traje justo com placas de gelo no peito e cintura marcada
  mk(spine, G.cyl(0.22, 0.17, d.torso, 12), suit, [0, d.torso * 0.5, 0], [0, 0, 0], [1, 1, 0.7]);
  mk(spine, G.cyl(0.18, 0.18, 0.06, 12), trim, [0, 0.05, 0], [0, 0, 0], [1, 1, 0.72]);
  const plate = new THREE.Group(); spine.add(plate);
  mk(plate, new THREE.OctahedronGeometry(0.11, 0), ice, [0, d.torso * 0.62, 0.13], [0, 0, 0], [1.3, 1.0, 0.4]);
  for (const s of [-1, 1]) mk(plate, new THREE.OctahedronGeometry(0.06, 0), ice, [s * 0.1, d.torso * 0.42, 0.13], [0, 0, s * 0.4], [0.9, 1.5, 0.35]);
  mk(plate, G.box(0.03, 0.3, 0.02), trim, [0, d.torso * 0.32, 0.15]);
  dmg.remove2.push(plate);
  mk(chest, G.sph(0.11, 12, 8), suit, [0, d.torso * 0.35, 0.06], [0, 0, 0], [1.5, 0.55, 0.6]);
  // ombreiras de estilhaços de gelo
  for (const [sh, s] of [[shA, 1], [shB, -1]]) {
    const p = new THREE.Group(); sh.add(p); p.position.set(s * 0.02, 0.03, 0);
    mk(p, G.sph(0.08, 10, 8), trim, [0, 0, 0], [0, 0, 0], [1.2, 0.7, 1.1]);
    for (let i = 0; i < 4; i++) mk(p, G.cone(0.025, 0.2 - i * 0.03, 5), iceSolid, [s * (0.03 + i * 0.02), 0.08, -0.06 + i * 0.04], [0.2 - i * 0.1, 0, -s * (0.4 + i * 0.15)]);
    if (s > 0) dmg.remove2.push(p);
  }
  // braçadeiras de gelo e adagas em ambas as mãos
  for (const e of [elA, elB]) { mk(e, G.cyl(0.065, 0.055, 0.17, 8), ice, [0, -0.15, 0]); mk(e, G.cone(0.02, 0.12, 4), iceSolid, [0, -0.1, -0.07], [-0.6, 0, 0]); }
  const daggers = [];
  for (const h of [handA, handB]) {
    const w = new THREE.Group(); w.position.set(0, -0.08, 0.02); h.add(w);
    mk(w, G.cyl(0.018, 0.018, 0.1, 6), trim, [0, 0, -0.02], [Math.PI / 2, 0, 0]);
    mk(w, G.box(0.09, 0.015, 0.02), trim, [0, 0, 0.04]);
    mk(w, G.cone(0.03, 0.34, 4), ice, [0, 0, 0.22], [Math.PI / 2, 0, 0], [1, 1, 0.35]);
    daggers.push(w);
  }
  const weaponTip = new THREE.Object3D(); weaponTip.position.set(0, 0, 0.38); daggers[0].add(weaponTip);
  dmg[1].push(mk(daggers[0], G.box(0.012, 0.01, 0.16), blood, [0, 0.012, 0.22]));
  // saia curta em painéis (acompanha as coxas) e perneiras de gelo
  rig.skirtPanels = [];
  for (const [hip, sgn] of [[hipA, 1], [hipB, -1]]) {
    const pv = new THREE.Group(); pv.position.copy(hip.position); pelvis.add(pv);
    mk(pv, new THREE.CylinderGeometry(0.12, 0.2, 0.42, 10, 1, true, Math.PI * 0.85, Math.PI * 1.3), suit, [sgn * 0.02, -0.18, -0.02], [0, sgn * 0.6, 0]);
    rig.skirtPanels.push({ pv, hip });
  }
  for (const kn of [knA, knB]) { mk(kn, G.box(0.1, 0.32, 0.05), ice, [0, -0.2, 0.07]); mk(kn, new THREE.OctahedronGeometry(0.055, 0), iceSolid, [0, 0, 0.08]); }
  for (const an of [ankleA, ankleB]) mk(an, G.cone(0.02, 0.1, 4), iceSolid, [0, -0.06, -0.08], [-1.2, 0, 0]);
  // capa de geada rasgada (molas)
  rig.cape = [];
  [[-0.14, 0.95, 0.12], [-0.04, 1.05, 0.11], [0.06, 1.0, 0.11], [0.15, 0.88, 0.11]].forEach(([x, len, w]) => {
    const s = strip(chest, [x, d.torso * 0.5, -0.15], w, len, cape, [0.1, 0, x * 0.4], 0.008);
    rig.cape.push(swinger(rig, s, { amp: 0.06, drag: -1.1, k: 30, damp: 5 }));
    mk(s, G.cone(0.03, 0.12, 4), iceSolid, [0, -len, 0], [Math.PI, 0, 0]);
  });
  dmg.remove2.push(rig.cape[0].obj);
  // cabeça: rosto pálido, cabelo branco longo com mola e coroa de espinhos de gelo
  mk(neck, G.cyl(0.045, 0.055, 0.14, 8), skin, [0, 0.04, 0]);
  mk(head, G.sph(0.125, 14, 10), skin, [0, 0.03, 0], [0, 0, 0], [0.9, 1.12, 1]);
  for (const s of [-1, 1]) mk(head, G.sph(0.02, 8, 6), eye, [s * 0.043, 0.05, 0.108]);
  mk(head, G.box(0.05, 0.012, 0.01), std(0x40506a), [0, -0.045, 0.12]);
  mk(head, G.sph(0.135, 12, 8), hair, [0, 0.07, -0.025], [0, 0, 0], [1, 1.04, 1.08]);
  rig.hair = [];
  [[-0.08, 0.7, 0.1], [0, 0.82, 0.13], [0.08, 0.7, 0.1]].forEach(([x, len, w]) => {
    const s = strip(head, [x, 0.06, -0.1], w, len, hair, [0.15, 0, x * 0.6], 0.04);
    rig.hair.push(swinger(rig, s, { amp: 0.05, drag: -0.9, k: 35, damp: 5 }));
  });
  rig.hairMesh = rig.hair[1].obj;
  for (const s of [-1, 1]) mk(head, G.box(0.04, 0.36, 0.04), hair, [s * 0.115, -0.08, 0.03]);
  const crown = new THREE.Group(); head.add(crown); crown.position.y = 0.12;
  mk(crown, G.tor(0.115, 0.012), trim, [0, 0, 0], [Math.PI / 2 + 0.1, 0, 0]);
  for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.42; mk(crown, G.cone(0.018, 0.14 + (i === 3 ? 0.14 : (3 - Math.abs(i - 3)) * 0.03), 5), iceSolid, [Math.sin(a) * 0.115, 0.07, Math.cos(a) * 0.1], [0.25 * Math.cos(a) - 0.1, 0, -a * 0.35]); }
  // cristais que orbitam (efeito glacial) + aura de geada da transformação
  const orbs = new THREE.Group(); pelvis.add(orbs); orbs.position.y = 0.3;
  const og = new THREE.SpriteMaterial({ map: glowSprite('#80d8ff'), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.7 });
  for (let i = 0; i < 3; i++) { const o = mk(orbs, new THREE.OctahedronGeometry(0.035, 0), iceSolid, [0, 0, 0]); const g = new THREE.Sprite(og); g.scale.set(0.2, 0.2, 1); o.add(g); o.userData.ph = (i / 3) * Math.PI * 2; }
  const flames = new THREE.Group(); chest.add(flames); flames.visible = false;
  const fmat = new THREE.SpriteMaterial({ map: glowSprite('#9ae8ff'), blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 6; i++) { const sp = new THREE.Sprite(fmat); const a = (i / 5 - 0.5) * 2.4; sp.position.set(Math.sin(a) * 0.28, d.torso * 0.6 + Math.cos(a) * 0.1, -0.1); sp.scale.set(0.3, 0.5, 1); flames.add(sp); }
  Object.assign(rig, { weapon: daggers[0], weaponTip, flames, orbs });
  // ferimentos
  dmg[1].push(mk(spine, G.box(0.15, 0.02, 0.02), blood, [0.04, 0.36, 0.165], [0, 0, 0.6]));
  dmg[1].push(mk(head, G.box(0.02, 0.08, 0.02), blood, [0.055, -0.02, 0.11]));
  dmg[2].push(mk(spine, G.sph(0.07, 8, 6), bruise, [-0.1, 0.2, 0.14], [0, 0, 0], [1, 1, 0.3]));
  dmg[2].push(mk(shA, G.box(0.02, 0.2, 0.02), blood, [0.05, -0.15, 0.05]));
  dmg[3].push(mk(spine, G.sph(0.11, 10, 8), blood, [0.02, 0.3, 0.15], [0, 0, 0], [1, 1.4, 0.25]));
  dmg[3].push(mk(hipB, G.sph(0.07, 8, 6), blood, [0, -0.2, 0.08], [0, 0, 0], [1, 1.6, 0.4]));
  return { furyEmissive: [ice, iceSolid, eye], furyColor: 0x40c8ff, blood, eye, skin };
}

// ---------------- PESTILUS (v0.4) — PLACEHOLDER procedural: médico da peste com máscara de bico, chapéu, sobretudo e frascos tóxicos
function buildPestilus(rig, dmg, c) {
  const skin = std(c.skin, { roughness: 0.8 });
  const coat = std(c.coat, { roughness: 0.65, metalness: 0.05, side: THREE.DoubleSide });
  const leather = std(c.leather, { roughness: 0.55, metalness: 0.1 });
  const mask = std(c.mask, { roughness: 0.5, metalness: 0.05 });
  const hat = std(c.hat, { roughness: 0.75, side: THREE.DoubleSide });
  const brass = std(c.brass, { metalness: 0.85, roughness: 0.35 });
  const glass = std(0x0a1a08, { emissive: c.lens, emissiveIntensity: 2.2, roughness: 0.1 });
  const toxic = std(0x061004, { emissive: c.toxic, emissiveIntensity: 1.5, transparent: true, opacity: 0.9 });
  const steel = std(0xb8b8c0, { metalness: 0.95, roughness: 0.2 });
  const blood = std(0x3a2a00, { roughness: 0.35, emissive: 0x102000 });
  const bruise = std(0x2a3a18, { roughness: 0.9 });
  const d = { hip: 1.0, thigh: 0.49, shin: 0.49, foot: 0.06, torso: 0.6, shoulder: 0.27, uarm: 0.32, farm: 0.3, armR: 0.075, legR: 0.09, hipW: 0.12 };
  skeleton(rig, d, { upperArm: coat, foreArm: coat, hand: leather, thigh: coat, shin: leather, foot: leather });
  dmg.skinMats.push(skin);
  const { pelvis, spine, chest, head, neck, shA, shB, handA, handB, elA, elB, hipA, hipB, knA, knB, ankleA, ankleB } = rig;
  // tronco curvado: sobretudo, avental de couro com correias e cinto de frascos
  mk(spine, G.cyl(0.27, 0.22, d.torso, 12), coat, [0, d.torso * 0.5, 0], [0.08, 0, 0], [1, 1, 0.75]);
  const apron = mk(spine, G.box(0.34, 0.62, 0.02), leather, [0, d.torso * 0.42, 0.205], [0.05, 0, 0]);
  for (const y of [0.25, 0.45]) mk(spine, G.box(0.44, 0.03, 0.03), leather, [0, y, 0.2]);
  mk(spine, G.box(0.04, 0.7, 0.025), leather, [0, d.torso * 0.5, 0.215], [0, 0, 0.55]);
  dmg.remove2.push(apron);
  mk(spine, G.cyl(0.25, 0.25, 0.07, 12), leather, [0, 0.03, 0], [0, 0, 0], [1, 1, 0.78]);
  const vials = [];
  for (let i = 0; i < 6; i++) { const a = -1.2 + i * 0.48; const v = mk(spine, G.cyl(0.025, 0.025, 0.11, 6), toxic, [Math.sin(a) * 0.26, 0.04, Math.cos(a) * 0.2], [0, 0, 0]); mk(v, G.cyl(0.015, 0.015, 0.03, 5), brass, [0, 0.07, 0]); vials.push(v); }
  // gola alta de couro e capelete
  mk(chest, new THREE.CylinderGeometry(0.17, 0.2, 0.2, 12, 1, true), leather, [0, d.torso * 0.62, 0]);
  mk(chest, G.cone(0.42, 0.4, 14, 1, true), coat, [0, d.torso * 0.46, -0.02], [0, 0, 0], [1, 1, 0.8]);
  // sobretudo longo: painéis que seguem as coxas + cauda traseira
  rig.skirtPanels = [];
  for (const [hip, x] of [[hipA, d.hipW], [hipB, -d.hipW]]) {
    const pv = new THREE.Group(); pv.position.set(x, 0, 0); pelvis.add(pv);
    mk(pv, new THREE.CylinderGeometry(0.14, 0.24, 0.92, 10, 1, true, -Math.PI * 0.15, Math.PI * 1.3), coat, [0, -0.46, 0], [0, x > 0 ? 0.4 : -0.4, 0]);
    rig.skirtPanels.push({ pv, hip });
  }
  const tail = new THREE.Group(); tail.position.set(0, -0.04, -0.14); pelvis.add(tail);
  mk(tail, new THREE.CylinderGeometry(0.22, 0.4, 1.0, 14, 1, true, Math.PI * 0.7, Math.PI * 0.6), coat, [0, -0.48, 0.05], [0.06, 0, 0]);
  rig.skirtTail = tail;
  // mochila alquímica com tanques e mangueira
  const pack = new THREE.Group(); spine.add(pack); pack.position.set(0, d.torso * 0.5, -0.24);
  mk(pack, G.box(0.34, 0.4, 0.14), leather, [0, 0, 0]);
  for (const s of [-1, 1]) { mk(pack, G.cyl(0.07, 0.07, 0.4, 10), toxic, [s * 0.1, 0.02, -0.1]); mk(pack, G.cyl(0.075, 0.075, 0.04, 10), brass, [s * 0.1, 0.23, -0.1]); mk(pack, G.cyl(0.075, 0.075, 0.04, 10), brass, [s * 0.1, -0.19, -0.1]); }
  mk(pack, G.tor(0.18, 0.018), leather, [0.2, 0.05, 0.05], [0, Math.PI / 2, 0]);
  // luvas, bisturi (mão A) e seringa (mão B)
  for (const e of [elA, elB]) mk(e, G.cyl(0.085, 0.075, 0.14, 9), leather, [0, -d.farm + 0.1, 0]);
  const scal = new THREE.Group(); scal.position.set(0, -0.08, 0.02); handA.add(scal);
  mk(scal, G.cyl(0.015, 0.015, 0.12, 6), brass, [0, 0, -0.02], [Math.PI / 2, 0, 0]);
  mk(scal, G.box(0.012, 0.05, 0.3), steel, [0, 0.012, 0.18]);
  const weaponTip = new THREE.Object3D(); weaponTip.position.set(0, 0, 0.34); scal.add(weaponTip);
  dmg[1].push(mk(scal, G.box(0.014, 0.03, 0.14), blood, [0, 0.012, 0.22]));
  const syr = new THREE.Group(); syr.position.set(0, -0.08, 0.02); handB.add(syr);
  mk(syr, G.cyl(0.028, 0.028, 0.2, 8), toxic, [0, 0, 0.08], [Math.PI / 2, 0, 0]);
  mk(syr, G.cyl(0.006, 0.006, 0.12, 4), steel, [0, 0, 0.24], [Math.PI / 2, 0, 0]);
  mk(syr, G.box(0.08, 0.012, 0.012), brass, [0, 0, -0.03]);
  for (const kn of [knA, knB]) mk(kn, G.cyl(0.095, 0.09, 0.32, 8), leather, [0, -0.3, 0]);
  for (const an of [ankleA, ankleB]) mk(an, G.box(0.16, 0.05, 0.32), leather, [0, -0.05, 0.06]);
  // cabeça: capuz, chapéu de aba larga, máscara de bico com lentes que brilham
  mk(neck, G.cyl(0.06, 0.07, 0.14, 8), leather, [0, 0.04, 0]);
  mk(head, G.sph(0.14, 14, 10), hat, [0, 0.04, -0.02], [0, 0, 0], [1, 1.1, 1.05]);
  const beak = new THREE.Group(); head.add(beak); beak.position.set(0, 0.0, 0.1); beak.rotation.x = 0.35;
  mk(beak, G.sph(0.12, 12, 8), mask, [0, 0.02, 0.0], [0, 0, 0], [1, 1, 0.8]);
  mk(beak, G.cone(0.075, 0.36, 10), mask, [0, -0.02, 0.2], [Math.PI / 2, 0, 0], [1, 1, 0.8]);
  for (let i = 0; i < 3; i++) mk(beak, G.tor(0.065 - i * 0.015, 0.006), brass, [0, -0.02, 0.07 + i * 0.07], [0, 0, 0]);
  for (const s of [-1, 1]) { mk(beak, G.cyl(0.04, 0.04, 0.03, 12), brass, [s * 0.055, 0.06, 0.08], [Math.PI / 2, 0, 0]); mk(beak, G.cyl(0.032, 0.032, 0.032, 12), glass, [s * 0.055, 0.06, 0.09], [Math.PI / 2, 0, 0]); }
  rig.beak = beak;
  const hatG = new THREE.Group(); head.add(hatG); hatG.position.set(0, 0.14, -0.01); hatG.rotation.x = -0.12;
  mk(hatG, G.cyl(0.32, 0.32, 0.02, 18), hat, [0, 0, 0]);
  mk(hatG, G.cyl(0.13, 0.15, 0.2, 14), hat, [0, 0.1, 0]);
  mk(hatG, G.cyl(0.152, 0.152, 0.035, 14), leather, [0, 0.03, 0]);
  rig.hairMesh = hatG;
  dmg.remove2.push(hatG);
  // moscas que orbitam e névoa tóxica da transformação
  const orbs = new THREE.Group(); chest.add(orbs); orbs.position.y = 0.2;
  const og = new THREE.SpriteMaterial({ map: glowSprite('#70ff30'), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 });
  for (let i = 0; i < 3; i++) { const o = mk(orbs, G.sph(0.018, 6, 4), std(0x0a0a0a), [0, 0, 0]); const g = new THREE.Sprite(og); g.scale.set(0.12, 0.12, 1); o.add(g); o.userData.ph = (i / 3) * Math.PI * 2; }
  const flames = new THREE.Group(); chest.add(flames); flames.visible = false;
  const fmat = new THREE.SpriteMaterial({ map: glowSprite('#60ff20'), blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 7; i++) { const sp = new THREE.Sprite(fmat); const a = (i / 6 - 0.5) * 2.6; sp.position.set(Math.sin(a) * 0.36, d.torso * 0.5 + Math.cos(a) * 0.1, -0.2); sp.scale.set(0.3, 0.5, 1); flames.add(sp); }
  Object.assign(rig, { weapon: scal, weaponTip, flames, orbs, vials });
  // ferimentos (o sangue dele é escuro e esverdeado)
  dmg[1].push(mk(spine, G.box(0.2, 0.022, 0.02), blood, [0.05, 0.4, 0.23], [0, 0, 0.6]));
  dmg[1].push(mk(beak, G.box(0.006, 0.12, 0.01), std(0x1a1410), [0.04, -0.02, 0.2], [0.9, 0, 0.3]));
  dmg[2].push(mk(spine, G.sph(0.08, 8, 6), bruise, [-0.13, 0.25, 0.2], [0, 0, 0], [1, 1, 0.3]));
  dmg[2].push(mk(shB, G.box(0.02, 0.2, 0.025), blood, [-0.07, -0.18, 0.06]));
  dmg[3].push(mk(spine, G.sph(0.13, 10, 8), blood, [0.06, 0.3, 0.2], [0, 0, 0], [1, 1.3, 0.25]));
  dmg[3].push(mk(hipB, G.sph(0.08, 8, 6), blood, [0, -0.2, 0.1], [0, 0, 0], [1, 1.6, 0.4]));
  return { furyEmissive: [toxic, glass], furyColor: 0x60ff20, blood, eye: glass, skin };
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
