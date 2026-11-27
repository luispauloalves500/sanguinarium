// PLACEHOLDER: lutadores montados com primitivas 3D procedurais (sem GLB/rig final).
// Registrado em CHECKPOINTS.md — substituir por modelos GLB com rig completo no CP02 final.
import * as THREE from 'three';

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
  for (const kn of [knA, knB]) mk(kn, G.box(0.15, 0.1, 0.3), M.foot, [0, -d.shin - 0.03, 0.06]);
  Object.assign(rig, { spine, chest, neck, head, shA, elA, shB, elB, handA, handB, hipA, knA, hipB, knB, dims: d });
}

function buildVarkhan(rig, dmg, c) {
  const skin = std(c.skin, { roughness: 0.9 });
  const leather = std(c.leather, { roughness: 0.85 });
  const iron = std(c.iron, { metalness: 0.75, roughness: 0.45 });
  const hood = std(c.hood, { roughness: 0.95 });
  const cloth = std(c.cloth, { roughness: 0.9 });
  const eye = std(0x000000, { emissive: c.eye, emissiveIntensity: 2.2 });
  const blade = std(c.blade, { metalness: 0.9, roughness: 0.3, emissive: 0x000000 });
  const wood = std(c.wood, { roughness: 0.8 });
  const blood = std(0x5a0000, { roughness: 0.35, metalness: 0.1, emissive: 0x200000 });
  const bruise = std(0x2a1430, { roughness: 0.9 });
  const d = { hip: 1.02, thigh: 0.5, shin: 0.5, foot: 0.06, torso: 0.62, shoulder: 0.34, uarm: 0.33, farm: 0.31, armR: 0.1, legR: 0.12, hipW: 0.14 };
  skeleton(rig, d, { upperArm: skin, foreArm: leather, hand: skin, thigh: leather, shin: leather, foot: iron });
  dmg.skinMats.push(skin);
  const { pelvis, spine, chest, head, neck, shA, shB, handB, elA, elB, hipA, hipB } = rig;
  // torso musculoso + cinto + tanga
  mk(spine, G.cyl(0.36, 0.27, d.torso + 0.05, 10), skin, [0, d.torso * 0.5, 0], [0, 0, 0], [1, 1, 0.68]);
  mk(spine, G.cyl(0.29, 0.29, 0.1, 10), leather, [0, 0.02, 0], [0, 0, 0], [1, 1, 0.75]);
  mk(pelvis, G.box(0.26, 0.42, 0.04), cloth, [0, -0.2, 0.2]);
  mk(pelvis, G.box(0.26, 0.36, 0.04), cloth, [0, -0.18, -0.2]);
  // correntes cruzando o peito
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    mk(spine, G.tor(0.035, 0.012), iron, [-0.26 + t * 0.52, 0.12 + t * 0.48, 0.22], [0, i % 2 ? Math.PI / 2 : 0, 0.8]);
  }
  // ombreiras com espinhos
  const pA = mk(shA, G.sph(0.17, 10, 8), iron, [0.03, 0.02, 0], [0, 0, 0], [1, 0.7, 1]);
  for (let i = 0; i < 3; i++) mk(pA, G.cone(0.035, 0.16, 6), iron, [0.05, 0.12, -0.08 + i * 0.08], [0, 0, -0.4]);
  const pB = mk(shB, G.sph(0.17, 10, 8), iron, [-0.03, 0.02, 0], [0, 0, 0], [1, 0.7, 1]);
  for (let i = 0; i < 3; i++) mk(pB, G.cone(0.035, 0.16, 6), iron, [-0.05, 0.12, -0.08 + i * 0.08], [0, 0, 0.4]);
  dmg.remove2.push(pA);
  // braçadeiras
  for (const e of [elA, elB]) mk(e, G.cyl(0.1, 0.1, 0.12, 8), iron, [0, -0.22, 0]);
  // capuz de carrasco
  mk(neck, G.cyl(0.08, 0.1, 0.16, 8), skin, [0, 0.05, 0]);
  mk(head, G.sph(0.16, 14, 10), hood, [0, 0.04, 0], [0, 0, 0], [1, 1.12, 1.05]);
  mk(head, G.cone(0.14, 0.3, 10), hood, [0, 0.27, -0.03], [-0.25, 0, 0]);
  mk(head, G.box(0.24, 0.12, 0.05), hood, [0, 0.03, 0.14]);
  mk(head, G.sph(0.028, 8, 6), eye, [0.055, 0.06, 0.155]);
  mk(head, G.sph(0.028, 8, 6), eye, [-0.055, 0.06, 0.155]);
  mk(chest, G.cyl(0.24, 0.3, 0.22, 10, 1), hood, [0, d.torso * 0.5, -0.02], [0, 0, 0], [1, 1, 0.8]);
  // machado (empunhadura no eixo +z da mão; lâmina em -y)
  const weapon = new THREE.Group(); weapon.position.set(0, -0.06, 0); handB.add(weapon);
  mk(weapon, G.cyl(0.03, 0.035, 1.2, 8), wood, [0, 0, 0.35], [Math.PI / 2, 0, 0]);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.05); shape.lineTo(0.0, -0.08); shape.quadraticCurveTo(-0.1, -0.32, 0.18, -0.48);
  shape.quadraticCurveTo(0.26, -0.22, 0.3, 0.12); shape.quadraticCurveTo(0.16, 0.06, 0, 0.05);
  const bladeGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.01, bevelSegments: 1 });
  const bl = mk(weapon, bladeGeo, blade, [0.015, 0, 0.78], [0, -Math.PI / 2, 0]);
  bl.scale.set(1.25, 1.25, 1);
  const edge = mk(weapon, G.box(0.035, 0.38, 0.02), blood, [0, -0.36, 1.02], [0.5, 0, 0]);
  edge.visible = true;
  mk(weapon, G.sph(0.05, 8, 6), iron, [0, 0, 0.95]);
  const weaponTip = new THREE.Object3D(); weaponTip.position.set(0, -0.3, 0.95); weapon.add(weaponTip);
  Object.assign(rig, { weapon, weaponTip });
  // ferimentos progressivos
  dmg[1].push(mk(spine, G.box(0.22, 0.025, 0.02), blood, [0.05, 0.42, 0.25], [0, 0, 0.5]));
  dmg[1].push(mk(spine, G.box(0.18, 0.025, 0.02), blood, [-0.1, 0.28, 0.24], [0, 0, -0.4]));
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
  const hair = std(c.hair, { roughness: 0.6 });
  const gold = std(c.gold, { metalness: 0.85, roughness: 0.35 });
  const eye = std(0x000000, { emissive: c.eye, emissiveIntensity: 2.4 });
  const magic = std(0x200005, { emissive: c.magic, emissiveIntensity: 1.6 });
  const boot = std(c.boot, { roughness: 0.6 });
  const blood = std(0x5a0000, { roughness: 0.35, emissive: 0x200000 });
  const bruise = std(0x3a1838, { roughness: 0.9 });
  const d = { hip: 0.96, thigh: 0.47, shin: 0.47, foot: 0.06, torso: 0.55, shoulder: 0.25, uarm: 0.3, farm: 0.28, armR: 0.065, legR: 0.085, hipW: 0.11 };
  skeleton(rig, d, { upperArm: skin, foreArm: robe, hand: skin, thigh: skin, shin: boot, foot: boot });
  dmg.skinMats.push(skin);
  const { pelvis, spine, chest, head, neck, shA, shB, handA, handB, elA, elB, hipA } = rig;
  // corpo esguio + corpete
  mk(spine, G.cyl(0.24, 0.19, d.torso, 10), robeDark, [0, d.torso * 0.5, 0], [0, 0, 0], [1, 1, 0.7]);
  mk(spine, G.cyl(0.2, 0.2, 0.08, 10), gold, [0, 0.05, 0], [0, 0, 0], [1, 1, 0.72]);
  mk(chest, G.sph(0.13, 10, 8), skin, [0, d.torso * 0.36, 0.06], [0, 0, 0], [1.5, 0.55, 0.6]);
  // saia de manto aberta na frente (fenda)
  const skirtB = mk(pelvis, new THREE.CylinderGeometry(0.2, 0.52, 0.95, 14, 1, true, Math.PI * 0.62, Math.PI * 1.76), robe, [0, -0.42, 0]);
  const skirtF = mk(pelvis, G.box(0.16, 0.6, 0.02), robeDark, [0, -0.28, 0.2], [-0.15, 0, 0]);
  dmg.remove2.push(skirtF);
  // mangas largas
  const sleeveA = mk(elA, G.cone(0.13, 0.3, 10), robe, [0, -0.2, 0], [Math.PI, 0, 0]);
  mk(elB, G.cone(0.13, 0.3, 10), robe, [0, -0.2, 0], [Math.PI, 0, 0]);
  dmg.remove2.push(sleeveA);
  mk(shA, G.sph(0.09, 8, 6), robeDark, [0, 0, 0]);
  mk(shB, G.sph(0.09, 8, 6), robeDark, [0, 0, 0]);
  // mãos com magia
  mk(handA, G.sph(0.06, 8, 6), magic, [0, -0.08, 0]);
  mk(handB, G.sph(0.06, 8, 6), magic, [0, -0.08, 0]);
  // cabeça, cabelo e coroa de chifres
  mk(neck, G.cyl(0.05, 0.06, 0.14, 8), skin, [0, 0.04, 0]);
  mk(head, G.sph(0.13, 14, 10), skin, [0, 0.03, 0], [0, 0, 0], [0.92, 1.12, 1]);
  mk(head, G.sph(0.022, 8, 6), eye, [0.045, 0.05, 0.11]);
  mk(head, G.sph(0.022, 8, 6), eye, [-0.045, 0.05, 0.11]);
  mk(head, G.box(0.06, 0.015, 0.01), blood, [0, -0.04, 0.125]);
  const hairM = mk(head, G.box(0.28, 0.7, 0.1), hair, [0, -0.2, -0.1], [0.12, 0, 0]);
  mk(head, G.sph(0.14, 12, 8), hair, [0, 0.07, -0.02], [0, 0, 0], [1, 1.05, 1.08]);
  mk(head, G.box(0.06, 0.4, 0.06), hair, [0.12, -0.1, 0.03]);
  mk(head, G.box(0.06, 0.4, 0.06), hair, [-0.12, -0.1, 0.03]);
  mk(head, G.tor(0.12, 0.012), gold, [0, 0.13, 0], [Math.PI / 2 + 0.1, 0, 0]);
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.5;
    mk(head, G.cone(0.02, 0.16 + (i === 2 ? 0.08 : 0), 6), robeDark, [Math.sin(a) * 0.12, 0.2, Math.cos(a) * 0.1], [0.3 * Math.cos(a) - 0.1, 0, -a * 0.5]);
  }
  // ferimentos
  dmg[1].push(mk(spine, G.box(0.16, 0.02, 0.02), blood, [0.04, 0.38, 0.17], [0, 0, 0.6]));
  dmg[1].push(mk(head, G.box(0.02, 0.09, 0.02), blood, [0.06, -0.02, 0.115]));
  dmg[1].push(mk(hipA, G.box(0.02, 0.16, 0.02), blood, [0.03, -0.2, 0.08]));
  dmg[2].push(mk(spine, G.sph(0.07, 8, 6), bruise, [-0.1, 0.22, 0.15], [0, 0, 0], [1, 1, 0.3]));
  dmg[2].push(mk(shA, G.box(0.02, 0.2, 0.02), blood, [0.06, -0.15, 0.05]));
  dmg[3].push(mk(spine, G.sph(0.12, 10, 8), blood, [0.02, 0.3, 0.16], [0, 0, 0], [1, 1.4, 0.25]));
  dmg[3].push(mk(head, G.sph(0.08, 8, 6), blood, [-0.04, 0.0, 0.1], [0, 0, 0], [1, 1.5, 0.4]));
  dmg[3].push(mk(skirtB, G.box(0.3, 0.25, 0.02), blood, [0, -0.1, -0.4]));
  rig.hairMesh = hairM;
  rig.weaponTip = new THREE.Object3D(); handA.add(rig.weaponTip); rig.weaponTip.position.y = -0.08;
  return { furyEmissive: [magic, eye, hair], furyColor: 0xff0820, blood, eye, skin };
}

// Aplica pose ao rig, com contato analítico dos pés no chão.
export function applyPose(fm, p, extra) {
  const r = fm.rig, d = r.dims;
  const legReach = (lx, k) => d.thigh * Math.cos(lx) + d.shin * Math.cos(lx + k);
  const ground = Math.max(legReach(p.lAx, p.kA), legReach(p.lBx, p.kB)) + d.foot;
  r.pelvis.position.y = ground + p.py + (extra.lift || 0);
  r.spine.rotation.set(p.spx, p.spy, p.spz);
  r.neck.rotation.set(p.nx, 0, 0);
  r.shA.rotation.set(p.aAx, 0, p.aAz);
  r.elA.rotation.set(p.eA, 0, 0);
  r.shB.rotation.set(p.aBx, 0, p.aBz);
  r.elB.rotation.set(p.eB, 0, 0);
  r.hipA.rotation.set(p.lAx, 0, p.lAz);
  r.knA.rotation.set(p.kA, 0, 0);
  r.hipB.rotation.set(p.lBx, 0, p.lBz);
  r.knB.rotation.set(p.kB, 0, 0);
  const lie = extra.lie || 0;
  r.body.rotation.set(-lie * Math.PI / 2, extra.spin || 0, extra.tilt || 0);
  r.body.position.set(0, lie * 0.16, lie * (d.hip * 0.9));
}
