// Timelines cinematográficas das finalizações (Sentenças de Sangue) e supergolpes.
// Sincronizam poses dos dois lutadores, câmera, áudio, VFX e visibilidade por quadro (60 Hz).
import * as THREE from 'three';
import { POSES } from '../animation/poses.js';
import { buildFighter, applyPose } from '../characters/models.js';
import { pentagramTexture, glowSprite } from '../render/textures.js';
import { goreCap } from '../render/vfx.js';
let GLOW_RED = null; const glowRed = () => GLOW_RED || (GLOW_RED = glowSprite('#ff2010'));

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
function pose(vf, name, extra = {}) {
  vf.anim.override = { pose: POSES[name], lie: 0, spin: 0, zoff: 0, lift: 0, tilt: 0, speed: 10, ...extra };
}
const FLESH = [new THREE.Color(0x7a0a0a), new THREE.Color(0x4a0000), new THREE.Color(0xb05050), new THREE.Color(0xd8c8b0), new THREE.Color(0x300505)];

function spinningAxe() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x3b2416 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.9, roughness: 0.25, emissive: 0x400000 });
  const h = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), wood); g.add(h);
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.45), steel); b.position.set(0, 0.45, 0.22); g.add(b);
  return g;
}

// lança de sangue fina: haste escura + ponta farpada brilhante (v0.2: mais fina e legível)
const SPEAR_MATS = {};
function bloodSpear(len) {
  const M = SPEAR_MATS.shaft ? SPEAR_MATS : Object.assign(SPEAR_MATS, {
    shaft: new THREE.MeshStandardMaterial({ color: 0x3a0006, emissive: 0x500008, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.35 }),
    tip: new THREE.MeshStandardMaterial({ color: 0x600010, emissive: 0xff1838, emissiveIntensity: 1.4, metalness: 0.4, roughness: 0.25 }),
  });
  M.shaft.userData.shared = M.tip.userData.shared = true;
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.022, len * 0.82, 6), M.shaft); shaft.position.y = -len * 0.09; g.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.032, len * 0.2, 6), M.tip); tip.position.y = len * 0.4; g.add(tip);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.12, 4), M.tip); b.position.set(s * 0.03, len * 0.33, 0); b.rotation.z = s * 2.6; g.add(b); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export const FATALITIES = {
  // ---------------- VARKHAN: Execução Real (decapitação)
  execucao_real(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(def, f < 200 ? 'kneel' : 'kneel', f >= 205 ? { lie: 1, spin: Math.PI, speed: 3 } : { speed: 6, tilt: Math.sin(f * 0.2) * 0.04 });
    if (f < 60) { pose(att, 'grab_s', { speed: 6 }); cam.setCine(V(mid + dir * 0.2, 1.0, 3.4), V(mid, 1.0, 0), 3); }
    else if (f < 124) { pose(att, 'overhead_w', { speed: 3 }); cam.setCine(V(dx + dir * 1.6, 0.5, 2.2), V(ax, 1.9, 0), 2.5); }
    else if (f < 200) { pose(att, 'overhead_s', { speed: 40 }); }
    else pose(att, 'winVarkhan', { speed: 4 });
    ctx.once('hb1', 70, () => audio.play('heartbeat'));
    ctx.once('hb2', 100, () => audio.play('heartbeat'));
    ctx.once('swing', 124, () => { audio.play('heavyWhoosh'); cam.setCine(V(mid, 1.3, 3.2), V(dx, 0.9, 0), 6); });
    ctx.once('cut', 131, () => {
      const neck = def.model.rig.neck;
      const wp = new THREE.Vector3(); neck.getWorldPosition(wp);
      ctx.neckPos = wp.clone();
      // cabeça: coto vermelho brilhante, halo e rastro de sangue para ficar legível no voo
      goreCap(neck, [0, -0.02, 0], 0.085, glowRed());
      goreCap(def.model.rig.chest, [0, def.model.rig.dims.torso * 0.55 + 0.01, 0], 0.11, glowRed());
      ctx.state.head = vfx.detach(neck, V(dir * 0.045, 0.17, 0.012), V(0.22, 0.08, 0.16), {
        restY: 0.16, bounce: 0.35,
        trail: (p, age, rest) => { if (!rest && Math.random() < 0.9) blood.drip(p.x, p.y, p.z); if (rest && age < 2.5 && Math.random() < 0.15) blood.drip(p.x, p.y + 0.05, p.z); },
      });
      blood.burst(wp.x, wp.y, wp.z, dir, 140, 1.6);
      audio.play('gore'); audio.play('hit', { heavy: true, slash: true });
      cam.shake(0.45);
    });
    if (f > 131 && f < 230 && ctx.neckPos) {
      const np = new THREE.Vector3(); def.model.rig.chest.getWorldPosition(np); np.y += 0.32;
      blood.fountain(np.x, np.y, np.z, dir * 0.3, 1, 3, 1.1 - (f - 131) / 140);
    }
    if (f > 134 && f < 205 && ctx.state.head) {
      const hp = ctx.state.head.obj.position;
      cam.setCine(V(hp.x + dir * 1.3, Math.max(0.8, hp.y + 0.6), hp.z + 2.1), V(hp.x - dir * 0.3, Math.max(0.3, hp.y * 0.8), hp.z), 3.5);
    }
    ctx.once('pool', 215, () => blood.pool(dx, 0.2, 1.4));
    if (f >= 230) cam.setCine(V(ax - dir * 0.8, 1.6, 3.4), V(ax, 1.4, 0), 2);
  },

  // ---------------- VARKHAN: Machado da Condenação (corte na cintura)
  machado_condenacao(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio } = ctx;
    const ax = att.x, dx = def.x;
    if (!ctx.state.axe) ctx.state.axe = null;
    pose(def, 'dizzy', { speed: 5, tilt: Math.sin(f * 0.1) * 0.1 });
    if (f < 55) { pose(att, 'throwAxe_w', { speed: 4 }); cam.setCine(V(ax - dir * 1.6, 1.9, 1.8), V(dx, 1.1, 0), 2.5); }
    else if (f < 200) pose(att, f < 70 ? 'throwAxe_s' : 'stance', { speed: 20 });
    else pose(att, 'winVarkhan', { speed: 4 });
    ctx.once('throw', 55, () => {
      att.model.rig.weapon.visible = false;
      audio.play('heavyWhoosh');
      ctx.state.axe = vfx.add(spinningAxe(), 3.0, null);
      ctx.state.axe.position.set(ax + dir * 0.6, 1.4, 0);
    });
    const axe = ctx.state.axe;
    if (axe && f >= 55 && f < 82) {
      const t = (f - 55) / 27; axe.position.set(lerp(ax + dir * 0.6, dx, t), lerp(1.4, 1.05, t), 0); axe.rotation.z -= 0.55 * dir;
      cam.setCine(V(lerp(ax, dx, t) + 0.3, 1.3, 3.0), V(axe.position.x, 1.1, 0), 5);
    }
    ctx.once('cut', 82, () => {
      const sp = def.model.rig.spine;
      const wp = new THREE.Vector3(); sp.getWorldPosition(wp);
      ctx.state.waist = wp.clone();
      vfx.detach(sp, V(dir * 0.04, 0.09, 0.01), V(0.02, 0.03, -dir * 0.06));
      blood.burst(wp.x, wp.y, wp.z, dir, 160, 1.5);
      blood.gore(wp.x, wp.y, wp.z, 22, FLESH);
      audio.play('gore'); audio.play('hit', { heavy: true, slash: true }); cam.shake(0.5);
    });
    if (f > 82 && f < 170 && ctx.state.waist) blood.fountain(ctx.state.waist.x, ctx.state.waist.y - 0.05, 0, 0, 1, 2, 1 - (f - 82) / 110);
    if (f > 82 && f < 160) cam.setCine(V(dx + dir * 0.8, 1.0, 3.4), V(dx, 0.9, 0), 2);
    if (f >= 150) pose(def, 'lying', { lie: 1, speed: 3 });
    if (axe && f >= 82 && f < 140) { const t = (f - 82) / 58; axe.position.set(lerp(dx, dx + dir * 1.5, t), lerp(1.05, 2.4, Math.sin(t * Math.PI)), 0); axe.rotation.z -= 0.5 * dir; }
    if (axe && f >= 140 && f < 205) { const t = (f - 140) / 65; axe.position.set(lerp(dx + dir * 1.5, ax, t), lerp(2.4, 1.6, t), 0); axe.rotation.z -= 0.5 * dir; }
    ctx.once('catch', 205, () => { att.model.rig.weapon.visible = true; if (ctx.state.axe) ctx.state.axe.visible = false; audio.play('block'); });
    ctx.once('pool', 170, () => blood.pool(dx, 0.1, 1.6));
    if (f >= 210) cam.setCine(V(ax - dir * 1.0, 1.7, 3.6), V(ax + dir * 0.6, 1.2, 0), 2);
  },

  // ---------------- LILITH: Explosão Carmesim
  explosao_carmesim(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio } = ctx;
    const ax = att.x, dx = def.x;
    const lift = Math.min(1.3, f * 0.016);
    if (f < 150) {
      pose(def, 'dangle', { lift, speed: 6, tilt: Math.sin(f * (0.3 + f * 0.004)) * (0.04 + f * 0.001) });
      const s = 1 + Math.max(0, f - 60) * 0.0028; def.model.root.scale.set(s, s, s);
      blood.aura(dx, 1.2 + lift, 0, f > 60 ? 4 : 2, 0xff1838, 1.4, 0.0);
    }
    pose(att, f < 150 ? 'castUp_s' : f < 230 ? 'cast_s' : 'winLilith', { lift: f < 150 ? 0.3 : 0.2, speed: 4 });
    if (f < 150) cam.setCine(V(lerp(ax, dx, 0.5), lerp(1.4, 2.0, f / 150), lerp(5.5, 3.2, f / 150)), V(dx, 1.4 + lift * 0.7, 0), 2);
    for (const [k, t] of [['h1', 40], ['h2', 80], ['h3', 110], ['h4', 130], ['h5', 140]]) ctx.once(k, t, () => audio.play('heartbeat'));
    ctx.once('charge', 20, () => audio.play('magic'));
    ctx.once('boom', 150, () => {
      def.model.root.visible = false;
      const y = 1.2 + lift;
      blood.burst(dx, y, 0, 1, 120, 2.2); blood.burst(dx, y, 0, -1, 120, 2.2);
      blood.gore(dx, y, 0, 60, FLESH);
      const head = def.model.rig.head; const hp = new THREE.Vector3(); head.getWorldPosition(hp);
      def.model.root.visible = true; // o resto fica oculto via escala
      vfx.detach(head, V(dir * 0.06, 0.14, 0.04), V(0.3, 0.2, 0.1));
      def.model.rig.body.visible = false;
      audio.play('explosion'); audio.play('gore'); cam.shake(0.6);
      ctx.hud.flash();
      ctx.view.flash(0xff2020, 80, 0.8, dx, y, 1);
    });
    if (f > 150 && f < 240) { if (f % 2 === 0) blood.drops.spawn(dx + (Math.random() - 0.5) * 3, 4, (Math.random() - 0.5) * 1.5, 0, -0.02, 0, 3, 1 + Math.random(), FLESH[0]); cam.setCine(V(dx, 2.2, 5.5), V(dx, 0.8, 0), 1.5); }
    ctx.once('pool', 190, () => blood.pool(dx, 0.1, 2.0));
    if (f >= 240) cam.setCine(V(ax - dir * 0.6, 1.8, 3.6), V(ax, 1.5, 0), 2);
  },

  // ---------------- LILITH: Ritual Proibido
  ritual_proibido(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio } = ctx;
    const ax = att.x, dx = def.x;
    ctx.once('circle', 1, () => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ map: pentagramTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
      m.rotation.x = -Math.PI / 2; m.position.set(dx, 0.03, 0);
      vfx.add(m, 6, (o, age) => { o.material.opacity = Math.min(1, age * 1.2) * (age > 5 ? 6 - age : 1); o.rotation.z += 0.004; });
      audio.play('magic');
    });
    pose(att, f < 110 ? 'castLow_s' : f < 250 ? 'regen_s' : 'winLilith', { lift: f >= 110 && f < 250 ? 0.4 : 0, speed: 4 });
    const lift = f < 40 ? 0 : Math.min(0.9, (f - 40) * 0.012);
    if (f < 240) pose(def, f < 40 ? 'dizzy' : 'dangle', { lift: f < 240 ? lift : 0, speed: 6 });
    else pose(def, 'lying', { lie: 1, speed: 4 });
    if (f < 40) cam.setCine(V(dx + dir * 2, 2.6, 4), V(dx, 0.2, 0), 2);
    else if (f < 120) cam.setCine(V(dx - dir * 0.3, 0.6, 2.8), V(dx, 1.4, 0), 2);
    else if (f < 240) cam.setCine(V((ax + dx) / 2, 1.6, 3.8), V((ax + dx) / 2, 1.5, 0), 2);
    else cam.setCine(V(ax - dir * 0.6, 1.8, 3.4), V(ax, 1.5, 0), 2);
    // lanças que emergem do chão
    const angles = [-0.5, 0.35, -0.15, 0.6, 0.05];
    angles.forEach((a, i) => ctx.once('spear' + i, 45 + i * 13, () => {
      const sp = bloodSpear(2.6);
      sp.position.set(dx + Math.sin(a) * 0.4, -1.3, Math.cos(a) * 0.3 - 0.15); sp.rotation.z = a * 0.6;
      vfx.add(sp, 5.2, (o, age) => {
        const up = Math.min(1, age * 5);
        o.position.y = -1.3 + up * 2.4 - (age > 3.1 ? (age - 3.1) * 2.5 : 0);
      });
      blood.burst(dx, 1.0 + lift, 0, i % 2 ? 1 : -1, 40, 1.2);
      audio.play('gore'); cam.shake(0.2);
    }));
    // drenagem de vida
    if (f > 110 && f < 230) {
      const hand = new THREE.Vector3(); att.model.rig.handA.getWorldPosition(hand);
      const t = (f % 20) / 20;
      blood.aura(lerp(dx, hand.x, t), lerp(1.3 + lift, hand.y, t), 0, 3, 0xff1030, 0.3, 0);
      const k = (f - 110) / 120;
      for (const m of def.model.mats ? [def.model.mats.skin] : []) m.color.lerp(new THREE.Color(0xd8d0b8), 0.02 + k * 0.02);
    }
    ctx.once('drain', 110, () => audio.play('heal'));
    ctx.once('arms', 205, () => {
      for (const k of ['shA', 'shB']) vfx.detach(def.model.rig[k], V((Math.random() - 0.5) * 0.05, 0.03, 0.03), V(0.1, 0.05, 0.12));
      blood.burst(dx, 1.5 + lift, 0, dir, 60, 1); audio.play('gore');
    });
    ctx.once('pool', 245, () => { blood.pool(dx, 0.1, 1.8); audio.play('land', { heavy: true }); });
  },
};

export const SUPERS = {
  execucao(ctx) {
    const { f, att, def, dir, cam, blood, audio } = ctx;
    const mid = (att.x + def.x) / 2;
    const seq = [28, 52, 76, 108];
    const i = seq.findIndex((h) => f < h);
    const phase = i < 0 ? 4 : i;
    const local = phase < 4 ? f - (phase ? seq[phase - 1] : 0) : 0;
    const winding = phase < 4 && local < (phase ? seq[phase] - seq[phase - 1] : seq[0]) * 0.75;
    pose(att, phase === 3 ? (winding ? 'overhead_w' : 'overhead_s') : (winding ? 'rage_w' : 'rage_s'), { speed: winding ? 8 : 40 });
    pose(def, phase >= 4 ? 'tumble' : phase % 2 ? 'hitLow' : 'hitHigh', { speed: 20, lift: phase >= 4 ? 0.3 : 0 });
    const ang = f * 0.025;
    cam.setCine(V(mid + Math.sin(ang) * 3.2, 1.4 + Math.sin(f * 0.05) * 0.3, Math.cos(ang) * 3.2), V(mid, 1.2, 0), phase >= 3 ? 6 : 3);
    ctx.once('fx', 1, () => { audio.play('super'); ctx.hud.flash(0.4); });
    if (f % 3 === 0) { const p = new THREE.Vector3(); att.model.rig.weaponTip.getWorldPosition(p); blood.aura(p.x, p.y, p.z, 2, 0xff4010, 0.2, 0.01); }
    ctx.once('slam', 108, () => { cam.shake(0.5); blood.pool(def.x, 0.2, 0.9); });
  },
  eclipse(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio } = ctx;
    const mid = (att.x + def.x) / 2;
    pose(att, f < 100 ? 'castUp_s' : 'cast_s', { lift: 0.4, speed: 5 });
    pose(def, f < 110 ? 'dangle' : 'tumble', { lift: Math.min(1, f * 0.012), speed: 8, tilt: Math.sin(f * 0.4) * 0.05 });
    cam.setCine(V(mid - Math.sin(f * 0.02) * 3, 1.0 + f * 0.008, 3.6), V(def.x, 1.6, 0), 3);
    ctx.once('fx', 1, () => { audio.play('super'); ctx.hud.flash(0.4); ctx.view.darken(1.8); });
    for (const [k, t, a] of [['s1', 22, 0.6], ['s2', 42, -0.7], ['s3', 62, 2.6], ['s4', 98, 1.6]]) ctx.once(k, t, () => {
      const sp = bloodSpear(1.6);
      const target = new THREE.Vector3(def.x, 1.2 + Math.min(1, t * 0.012), 0);
      const from = target.clone().add(new THREE.Vector3(Math.cos(a) * 4, Math.sin(a) * 3 + 1, 0.5));
      sp.position.copy(from); sp.lookAt(target); sp.rotateX(Math.PI / 2);
      vfx.add(sp, 1.2, (o, age) => { const k = Math.min(1, age * 4); o.position.lerpVectors(from, target, k); if (age > 0.9) o.scale.setScalar(Math.max(0.01, 1 - (age - 0.9) * 3)); });
      audio.play('proj', { kind: 'spear' });
    });
    if (f % 2 === 0) blood.aura(def.x, 1.6, 0, 3, 0xff1838, 1.6, 0);
  },
};

// ---------------- utilitários das cinemáticas v0.2
const CHAIN_MAT = () => new THREE.MeshStandardMaterial({ color: 0x40444a, metalness: 0.9, roughness: 0.3, emissive: 0x500000, emissiveIntensity: 0.8 });
// corrente esticada entre dois pontos (cilindro fino reposicionado a cada quadro)
function chainBetween(obj, a, b) {
  obj.position.copy(a).lerp(b, 0.5);
  obj.scale.set(1, Math.max(0.01, a.distanceTo(b)), 1);
  obj.quaternion.setFromUnitVectors(UP, TMP.copy(b).sub(a).normalize());
}
const UP = new THREE.Vector3(0, 1, 0), TMP = new THREE.Vector3();
// fantasma aditivo de um lutador (aparições do Tribunal)
function ghostOf(charId, color) {
  const g = buildFighter(charId, false);
  const gm = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const old = new Set();
  g.root.traverse((o) => { if (o.isMesh) { old.add(o.material); o.material = gm; o.castShadow = false; } if (o.isSprite) o.visible = false; });
  old.forEach((m) => m.dispose());
  return g;
}
// tinge todos os materiais de um lutador (carbonizar, ressecar)
function tintModel(model, color, k, emissive = null, ei = 0) {
  const c = new THREE.Color(color);
  model.root.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.color) return;
    o.material.color.lerp(c, k);
    if (emissive !== null && o.material.emissive) { o.material.emissive.setHex(emissive); o.material.emissiveIntensity = ei; }
  });
}
const ASH = [new THREE.Color(0x1a1412), new THREE.Color(0x2a2220), new THREE.Color(0x3a1008), new THREE.Color(0x0c0a0a)];
const DUST = [new THREE.Color(0x8a7a68), new THREE.Color(0x5a4a3c), new THREE.Color(0x6a2a20), new THREE.Color(0xa09080)];
function worldPos(o) { const v = new THREE.Vector3(); o.getWorldPosition(v); return v; }

Object.assign(FATALITIES, {
  // ---------------- VARKHAN 3: Correntes do Suplício (nome proposto) — correntes do chão esquartejam
  correntes_suplicio(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    const lift = f < 30 ? 0 : Math.min(0.7, (f - 30) * 0.02);
    if (f < 200) pose(def, f < 30 ? 'dizzy' : 'crucified', { lift, speed: 5, tilt: f > 60 && f < 150 ? Math.sin(f * 0.9) * 0.025 : 0 });
    else pose(def, 'lying', { lie: 1, speed: 3 });
    pose(att, f < 140 ? 'chainCast_s' : f < 175 ? 'yank' : 'winVarkhan', { speed: f < 140 ? 4 : 12 });
    ctx.once('cast', 2, () => audio.play('chain'));
    // quatro correntes nascem do chão e prendem pulsos e tornozelos
    if (!state.chains && f >= 18) {
      state.chains = [];
      const mat = CHAIN_MAT();
      const anchors = [[-1.4, 2.6], [1.4, 2.6], [-0.8, 0], [0.8, 0]];
      anchors.forEach(([ox, oy], i) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 6), mat); m.castShadow = true;
        vfx.add(m, 4.0, null);
        state.chains.push({ m, anchor: new THREE.Vector3(dx + ox, oy, -0.35 + (i % 2) * 0.1), part: ['handA', 'handB', 'ankleA', 'ankleB'][i], grow: 0 });
        blood.spark(dx + ox, oy || 0.05, 0, 14, 0xff6020, 1.2);
      });
      audio.play('chain'); cam.shake(0.15);
    }
    if (state.chains) for (const c of state.chains) {
      if (c.detached) { c.m.visible = f < 230; continue; }
      c.grow = Math.min(1, c.grow + 0.08);
      const end = worldPos(def.model.rig[c.part]);
      chainBetween(c.m, c.anchor, TMP.copy(c.anchor).lerp(end, c.grow).clone());
    }
    for (const [k, t] of [['h1', 70], ['h2', 100], ['h3', 125]]) ctx.once(k, t, () => audio.play('heartbeat'));
    if (f > 60 && f < 140 && f % 10 === 0) { audio.play('chain'); const p = worldPos(def.model.rig.chest); blood.burst(p.x, p.y, p.z, dir, 6, 0.5); }
    // puxão: braços arrancados
    ctx.once('arms', 150, () => {
      for (const [k, sx] of [['shA', 1], ['shB', -1]]) {
        const part = def.model.rig[k];
        goreCap(part, [0, 0, 0], 0.06, glowRed());
        const d = vfx.detach(part, V(-sx * dir * 0.08, 0.06, (sx > 0 ? -1 : 1) * 0.03), V(0.2, 0.1, 0.3 * sx), { trail: (p, age, rest) => { if (!rest && Math.random() < 0.8) blood.drip(p.x, p.y, p.z); } });
        const pp = worldPos(part); blood.burst(pp.x, pp.y, pp.z, -sx * dir, 70, 1.3);
        state.chains[sx > 0 ? 0 : 1].detached = true; void d;
      }
      audio.play('gore'); audio.play('hit', { heavy: true, slash: true }); cam.shake(0.45); ctx.hud.flash(0.3);
    });
    ctx.once('legs', 182, () => {
      for (const [k, sx] of [['hipA', 1], ['hipB', -1]]) {
        const part = def.model.rig[k];
        goreCap(part, [0, 0, 0], 0.07, glowRed());
        vfx.detach(part, V(sx * 0.04, 0.04, 0.02 * sx), V(0.15, 0, 0.2 * sx));
        state.chains[sx > 0 ? 2 : 3].detached = true;
      }
      const p = worldPos(def.model.rig.pelvis); blood.burst(p.x, p.y, p.z, dir, 90, 1.2); blood.gore(p.x, p.y, p.z, 20, FLESH);
      audio.play('gore'); cam.shake(0.35);
    });
    if (f > 150 && f < 260) { const p = worldPos(def.model.rig.chest); if (f % 2 === 0) blood.fountain(p.x, p.y + 0.2, p.z, (Math.random() - 0.5) * 0.6, 0.6, 2, 0.8); }
    ctx.once('pool', 215, () => { blood.pool(dx, 0.1, 1.9); audio.play('land', { heavy: true }); });
    if (f < 60) cam.setCine(V(mid, 0.6, 3.6), V(dx, 1.3, 0), 2);
    else if (f < 150) { const a = (f - 60) * 0.012; cam.setCine(V(dx + Math.sin(a) * 2.6 * dir, 1.3, Math.cos(a) * 3.2), V(dx, 1.5, 0), 2); }
    else if (f < 230) cam.setCine(V(mid + dir * 0.5, 1.6, 4.2), V(dx, 1.0, 0), 3);
    else cam.setCine(V(ax - dir * 0.8, 1.6, 3.4), V(ax, 1.4, 0), 2);
  },

  // ---------------- VARKHAN 4: Ruptura Infernal (nome proposto) — fogo do inferno carboniza e esfarela
  ruptura_infernal(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(att, f < 60 ? 'overhead_w' : f < 220 ? 'groundSlam_s' : 'winVarkhan', { speed: f < 60 ? 3 : f < 70 ? 40 : 4 });
    if (f < 70) pose(def, 'dizzy', { speed: 5 });
    else if (f < 160) pose(def, 'writhe', { lift: Math.min(0.5, (f - 70) * 0.01), speed: 8, tilt: Math.sin(f * 0.7) * 0.08 });
    else pose(def, 'husk', { speed: 4 });
    ctx.once('hb', 30, () => audio.play('heartbeat'));
    ctx.once('slam', 62, () => {
      audio.play('explosion'); cam.shake(0.55); ctx.hud.flash(0.3);
      blood.spark(ax + dir * 0.9, 0.1, 0.2, 40, 0xff8030, 1.8);
      // rachaduras incandescentes do machado até a vítima
      const mat = new THREE.MeshBasicMaterial({ color: 0xff6010, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const g = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const len = 0.5 + Math.random() * 0.9, a = (Math.random() - 0.5) * 1.2;
        const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.01, 0.05), mat);
        const t = i / 8; m.position.set(lerp(ax + dir * 0.8, dx, t) + (Math.random() - 0.5) * 0.3, 0.02, (Math.random() - 0.5) * 0.6); m.rotation.y = a; g.add(m);
      }
      vfx.add(g, 4.2, (o, age) => { mat.opacity = age < 3.5 ? 0.7 + Math.sin(age * 20) * 0.2 : Math.max(0, 1 - (age - 3.5) * 1.5); });
    });
    // pilar de fogo infernal sob a vítima
    ctx.once('pillar', 72, () => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 4, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xff5010, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.position.set(dx, 2, 0); vfx.add(m, 1.6, (o, age) => { o.material.opacity = Math.min(0.55, age * 3) * (age > 1.3 ? (1.6 - age) / 0.3 : 1); o.scale.set(1 + Math.sin(age * 30) * 0.05, 1, 1 + Math.cos(age * 27) * 0.05); });
      ctx.view.flash(0xff6010, 60, 1.6, dx, 1.2, 1);
      audio.play('fury');
    });
    if (f > 72 && f < 165) {
      blood.aura(dx, 0.8 + Math.random() * 1.4, 0, 5, f % 3 ? 0xff7020 : 0xffc040, 0.9, 0.05);
      tintModel(def.model, 0x0a0606, 0.035, 0xff3000, 0.35 + Math.sin(f * 0.5) * 0.25);
      if (f % 12 === 0) audio.play('hit', { heavy: true });
    }
    ctx.once('cool', 168, () => { tintModel(def.model, 0x0a0606, 0.6, 0x401000, 0.6); audio.play('freeze'); });
    if (f > 168 && f < 230 && f % 3 === 0) blood.aura(dx, 1.4, 0, 2, 0x504848, 0.6, 0.03);
    // o corpo carbonizado esfarela
    ctx.once('crumble', 210, () => {
      for (const k of ['neck', 'shA', 'shB', 'hipA', 'hipB']) vfx.detach(def.model.rig[k], V((Math.random() - 0.5) * 0.03, 0.02, (Math.random() - 0.5) * 0.03), V(Math.random() * 0.1, 0, Math.random() * 0.1), { bounce: 0.1 });
      const p = worldPos(def.model.rig.chest); blood.gore(p.x, p.y - 0.4, p.z, 45, ASH);
      blood.aura(p.x, p.y, p.z, 60, 0x302826, 1.2, 0.02);
      state.crumble = true; audio.play('land', { heavy: true }); audio.play('gore'); cam.shake(0.2);
    });
    if (state.crumble) { const s = Math.max(0.01, 1 - (f - 210) * 0.03); def.model.rig.spine.scale.setScalar(s); }
    if (f < 62) cam.setCine(V(mid - dir * 0.5, 0.5, 3.0), V(ax, 1.9, 0), 2.5);
    else if (f < 170) cam.setCine(V(dx + dir * 1.5, 1.0, 3.8), V(dx, 1.4, 0), 3);
    else if (f < 250) cam.setCine(V(dx + dir * 0.6, 1.0, 2.8), V(dx, 0.8, 0), 2);
    else cam.setCine(V(ax - dir * 0.8, 1.6, 3.4), V(ax, 1.4, 0), 2);
  },

  // ---------------- LILITH 3: Beijo da Morte (nome proposto) — drena a vida até virar casca e pó
  beijo_morte(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(att, f < 40 ? 'grab_w' : f < 190 ? 'kiss' : f < 215 ? 'point' : 'winLilith', { speed: f < 40 ? 4 : 6, lift: f >= 60 && f < 190 ? Math.min(0.12, (f - 60) * 0.002) : 0 });
    if (f < 50) pose(def, 'dizzy', { speed: 4 });
    else if (f < 215) pose(def, 'husk', { speed: 1.5 + (f - 50) * 0.01, tilt: Math.sin(f * 0.3) * 0.02 });
    ctx.once('grab', 40, () => { audio.play('throw'); audio.play('magic'); });
    for (const [k, t] of [['h1', 60], ['h2', 92], ['h3', 130], ['h4', 175]]) ctx.once(k, t, () => audio.play('heartbeat'));
    if (f > 55 && f < 190) {
      // corrente de vida da vítima para a boca de Lilith
      const from = worldPos(def.model.rig.chest), to = worldPos(att.model.rig.head);
      const t = (f % 16) / 16;
      blood.aura(lerp(from.x, to.x, t), lerp(from.y + 0.2, to.y, t), lerp(from.z, to.z, t), 3, 0xff1838, 0.15, 0);
      if (f % 4 === 0) blood.aura(to.x, to.y, to.z, 2, 0xff4060, 0.3, 0.02);
      tintModel(def.model, 0x7a6a58, 0.018);
      const k = Math.min(1, (f - 55) / 135);
      def.model.rig.spine.scale.set(1 - k * 0.18, 1 - k * 0.08, 1 - k * 0.25);
      for (const l of ['hipA', 'hipB', 'shA', 'shB']) def.model.rig[l].scale.set(1 - k * 0.3, 1, 1 - k * 0.3);
      if (f % 30 === 0) audio.play('heal');
    }
    ctx.once('glow', 120, () => { ctx.view.flash(0xff1030, 25, 1.5, ax, 1.6, 1); });
    // toque final: a casca vira pó
    ctx.once('dust', 205, () => {
      for (const k of ['neck', 'shA', 'shB', 'hipA', 'hipB']) vfx.detach(def.model.rig[k], V((Math.random() - 0.5) * 0.02, 0.01, (Math.random() - 0.5) * 0.02), V(Math.random() * 0.08, 0, Math.random() * 0.08), { bounce: 0.05 });
      const p = worldPos(def.model.rig.chest);
      blood.gore(p.x, p.y - 0.4, p.z, 40, DUST); blood.aura(p.x, p.y - 0.2, p.z, 90, 0x8a7a68, 1.0, 0.02);
      state.dust = true; audio.play('freeze'); audio.play('land');
    });
    if (state.dust) { const s = Math.max(0.01, 1 - (f - 205) * 0.05); def.model.rig.spine.scale.setScalar(s); }
    if (f < 50) cam.setCine(V(mid, 1.2, 3.4), V(mid, 1.3, 0), 2);
    else if (f < 190) { const a = (f - 50) * 0.006; cam.setCine(V(mid - dir * Math.sin(a) * 1.2, 1.65, 1.9 + Math.cos(a) * 0.3), V(mid, 1.55, 0), 1.8); }
    else if (f < 245) cam.setCine(V(dx + dir * 0.4, 1.0, 3.0), V(dx, 0.7, 0), 2.5);
    else cam.setCine(V(ax - dir * 0.6, 1.8, 3.4), V(ax, 1.5, 0), 2);
  },

  // ---------------- LILITH 4: Chuva de Lanças Final (nome proposto) — chuva de lanças e empalamento
  chuva_final(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x;
    pose(att, f < 170 ? 'castUp_s' : f < 240 ? 'cast_s' : 'winLilith', { lift: 0.3, speed: 4 });
    ctx.once('sky', 2, () => { ctx.view.darken(3); audio.play('magic'); ctx.hud.flash(0.2); });
    ctx.once('circle', 10, () => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: pentagramTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
      m.rotation.x = -Math.PI / 2; m.position.set(dx, 0.03, 0);
      vfx.add(m, 5, (o, age) => { o.material.opacity = Math.min(1, age * 1.5) * (age > 4.3 ? (5 - age) / 0.7 : 1); o.rotation.z -= 0.01; });
    });
    // chuva: lanças caem; as que acertam ficam cravadas
    for (let i = 0; i < 14; i++) ctx.once('r' + i, 40 + i * 8, () => {
      const onTarget = i % 2 === 0;
      const sp = bloodSpear(1.3);
      const tx = onTarget ? dx + (Math.random() - 0.5) * 0.4 : dx + (Math.random() - 0.5) * 3.2;
      const ty = onTarget ? 0.8 + Math.random() * 0.8 : 0.0;
      const tz = (Math.random() - 0.5) * (onTarget ? 0.3 : 1.6);
      const tilt = (Math.random() - 0.5) * 0.5;
      sp.rotation.set(Math.PI + tilt * 0.4, 0, tilt);
      const from = new THREE.Vector3(tx + tilt * 2, 6.5, tz), to = new THREE.Vector3(tx, ty + 0.4, tz);
      sp.position.copy(from);
      vfx.add(sp, 4.6 - i * 0.12, (o, age) => { const k = Math.min(1, age * 3.2); o.position.lerpVectors(from, to, k); });
      ctx.state['hit' + i] = { at: 40 + i * 8 + 18, onTarget, x: tx, y: ty, z: tz };
      audio.play('proj', { kind: 'spear' });
    });
    for (let i = 0; i < 14; i++) { const h = state['hit' + i]; if (h && !h.done && f >= h.at) { h.done = true; if (h.onTarget) { blood.burst(h.x, h.y, h.z, dir, 35, 1.1); audio.play('gore'); cam.shake(0.12); state.hits = (state.hits || 0) + 1; } else { blood.spark(h.x, 0.05, h.z, 8, 0xff3030, 0.8); audio.play('land'); } } }
    if (f < 160) pose(def, (state.hits || 0) > 0 ? (f % 16 < 8 ? 'hitHigh' : 'hitLow') : 'dizzy', { speed: 14 });
    // lança gigante emerge do chão e empala
    ctx.once('impale', 165, () => {
      const g = bloodSpear(4.2); g.scale.set(2.2, 1, 2.2);
      g.position.set(dx, -2.2, 0);
      vfx.add(g, 4.5, (o, age) => { o.position.y = -2.2 + Math.min(1, age * 6) * 2.9; });
      blood.burst(dx, 1.2, 0, dir, 140, 1.8); blood.burst(dx, 1.2, 0, -dir, 100, 1.5); blood.gore(dx, 1.4, 0, 25, FLESH);
      audio.play('explosion'); audio.play('gore'); cam.shake(0.6); ctx.hud.flash();
      ctx.view.flash(0xff1030, 16, 0.8, dx, 2, 1);
    });
    if (f >= 165) { pose(def, 'dangle', { lift: Math.min(1.45, (f - 165) * 0.25), speed: 10, tilt: Math.sin(f * 0.05) * 0.03 }); if (f < 280 && f % 2 === 0) blood.drip(dx + (Math.random() - 0.5) * 0.2, 1.6, (Math.random() - 0.5) * 0.2); }
    ctx.once('pool', 200, () => blood.pool(dx, 0.1, 1.7));
    if (f < 40) cam.setCine(V(dx + dir * 1.6, 2.8, 4.2), V(dx, 1.0, 0), 2);
    else if (f < 160) cam.setCine(V(dx - dir * 0.8, 0.9, 4.0), V(dx, 1.5, 0), 2);
    else if (f < 250) cam.setCine(V(dx + dir * 1.8, 0.4, 3.4), V(dx, 2.0, 0), 3);
    else cam.setCine(V(ax - dir * 0.6, 1.8, 3.4), V(ax, 1.5, 0), 2);
  },
});

Object.assign(SUPERS, {
  // ---------------- VARKHAN: Tribunal dos Condenados (GDD) — aparições de carrascos julgam o réu acorrentado
  tribunal(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const dx = def.x, mid = (att.x + def.x) / 2;
    pose(att, f < 30 ? 'chainCast_s' : f < 135 ? 'roar_s' : f < 150 ? 'overhead_s' : 'stance', { speed: 6 });
    const hitPhase = [40, 62, 84].findIndex((h) => f < h + 6 && f > h - 4);
    pose(def, f < 140 ? (hitPhase >= 0 ? 'hitHigh' : 'crucified') : 'tumble', { lift: f < 140 ? Math.min(0.5, f * 0.015) : 0.4, speed: hitPhase >= 0 ? 30 : 6 });
    ctx.once('fx', 1, () => { audio.play('super'); audio.play('chain'); ctx.hud.flash(0.3); ctx.view.darken(2.6); });
    if (!state.rings) {
      state.rings = new THREE.Group(); const mat = CHAIN_MAT();
      for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 6, 18), mat); t.rotation.x = Math.PI / 2; t.position.y = 0.7 + i * 0.45; state.rings.add(t); }
      vfx.add(state.rings, 2.9, null);
    }
    state.rings.position.set(dx, Math.min(0.5, f * 0.015), 0); state.rings.rotation.y += 0.05; state.rings.visible = f < 140;
    // três carrascos espectrais
    [[30, 40, -1.1, 0.9], [52, 62, 1.0, -0.8], [74, 84, 0.0, -1.2]].forEach(([t0, th, ox, oz], i) => ctx.once('g' + i, t0, () => {
      const gh = ghostOf('varkhan', 0x60a0ff);
      const pos = new THREE.Vector3(dx + ox, 0, oz);
      gh.root.position.copy(pos); gh.root.lookAt(dx, 0, 0);
      vfx.add(gh.root, 0.75, (o, age) => {
        applyPose(gh, POSES[age < (th - t0) / 60 ? 'overhead_w' : 'overhead_s'], {});
        o.traverse((c) => { if (c.isMesh) c.material.opacity = 0.55 * Math.min(1, age * 5) * Math.max(0, 1 - Math.max(0, age - 0.5) * 4); });
      });
      audio.play('teleport');
      ctx.once('s' + i, th, () => { audio.play('heavyWhoosh'); blood.aura(dx, 1.3, 0, 30, 0x60a0ff, 1.2, 0.02); });
    }));
    // o grande machado do julgamento cai
    ctx.once('axe', 105, () => {
      const ax = spinningAxe(); ax.scale.setScalar(2.6);
      ax.traverse((c) => { if (c.isMesh) c.material = new THREE.MeshBasicMaterial({ color: 0x80b0ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }); });
      vfx.add(ax, 1.2, (o, age) => { const k = Math.min(1, Math.max(0, age - 0.4) * 2.6); o.position.set(dx, 6 - k * 4.6, 0); o.rotation.z = Math.PI * 0.5 * dir - k * 1.2 * dir; });
      audio.play('heavyWhoosh');
    });
    ctx.once('verdict', 140, () => { cam.shake(0.6); ctx.hud.flash(); blood.burst(dx, 1.0, 0, dir, 120, 1.6); blood.burst(dx, 1.0, 0, -dir, 80, 1.2); blood.pool(dx, 0.2, 1.1); audio.play('explosion'); ctx.view.flash(0x80b0ff, 14, 0.7, dx, 1.5, 1); });
    const ang = f * 0.02;
    cam.setCine(V(mid + Math.sin(ang) * 3.4 * dir, 1.5 + Math.sin(f * 0.04) * 0.4, Math.cos(ang) * 3.4), V(dx, 1.3, 0), f > 130 ? 6 : 3);
  },

  // ---------------- LILITH: Sabá Sangrento (nome proposto) — espinhos do círculo ritual e coroa de sangue
  saba(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const dx = def.x, mid = (att.x + def.x) / 2;
    pose(att, f < 30 ? 'castLow_s' : f < 120 ? 'regen_s' : 'castUp_s', { lift: f > 30 ? 0.35 : 0, speed: 5 });
    const juggles = [34, 52, 70, 88].filter((h) => f >= h).length;
    pose(def, f < 132 ? (juggles % 2 ? 'tumble' : 'hitHigh') : 'tumble', { lift: Math.min(1.2, juggles * 0.28 + (f >= 132 ? 0.2 : 0)), speed: 16, tilt: Math.sin(f * 0.3) * 0.1 });
    ctx.once('fx', 1, () => {
      audio.play('super'); ctx.hud.flash(0.3); ctx.view.darken(2.4);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: pentagramTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
      m.rotation.x = -Math.PI / 2; m.position.set(dx, 0.03, 0);
      vfx.add(m, 2.7, (o, age) => { o.material.opacity = Math.min(1, age * 3) * (age > 2.3 ? (2.7 - age) / 0.4 : 1); o.rotation.z += 0.03; });
    });
    [34, 52, 70, 88].forEach((t, i) => ctx.once('sp' + i, t - 6, () => {
      const g = new THREE.Group();
      for (let k = 0; k < 7; k++) { const s = bloodSpear(1.1 + Math.random() * 0.6); const a = (k / 7) * Math.PI * 2 + i; s.position.set(Math.cos(a) * 0.35, -1.2, Math.sin(a) * 0.3); s.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); g.add(s); }
      g.position.set(dx, 0, 0);
      vfx.add(g, 0.5, (o, age) => { o.children.forEach((s) => { s.position.y = -1.2 + Math.sin(Math.min(1, age * 2) * Math.PI) * 1.6; }); });
      audio.play('proj', { kind: 'spear' });
      ctx.once('b' + i, t, () => { blood.burst(dx, 0.9 + i * 0.25, 0, i % 2 ? dir : -dir, 40, 1.2); audio.play('gore'); cam.shake(0.15); });
    }));
    // coroa de espinhos explode
    ctx.once('crown', 126, () => {
      const g = new THREE.Group();
      for (let k = 0; k < 12; k++) { const s = bloodSpear(1.0); const a = (k / 12) * Math.PI * 2; s.position.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5); s.lookAt(Math.cos(a) * 3, 0, Math.sin(a) * 3); s.rotateX(Math.PI / 2); g.add(s); }
      g.position.set(dx, 1.6, 0);
      vfx.add(g, 0.8, (o, age) => { const k = Math.min(1, age * 4); o.scale.setScalar(0.2 + k * 1.3); o.rotation.y += 0.08; });
      audio.play('magic');
    });
    ctx.once('boom', 132, () => { blood.burst(dx, 1.6, 0, dir, 110, 1.8); blood.burst(dx, 1.6, 0, -dir, 90, 1.6); cam.shake(0.5); ctx.hud.flash(); audio.play('explosion'); ctx.view.flash(0xff1030, 14, 0.7, dx, 1.6, 1); blood.pool(dx, 0.2, 1.0); });
    if (f % 2 === 0) blood.aura(dx, 0.2, 0, 3, 0xff1838, 1.4, 0.04);
    cam.setCine(V(mid - Math.sin(f * 0.018) * 3.2 * dir, 0.8 + f * 0.006, 3.6), V(dx, 1.2 + Math.min(1, juggles * 0.25), 0), 3);
  },
});
