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

// ======================================================================
// v0.3 — KAZURO e BRAKKOR
// ======================================================================
const SPECTRAL = 0x6090ff;
// arco de corte espectral que aparece e some (rastro de lâmina)
function slashArc(vfx, x, y, z, rot, color = SPECTRAL, size = 0.9, life = 0.35) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(size, 0.025, 4, 28, Math.PI * 0.9),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.position.set(x, y, z); m.rotation.set(rot[0], rot[1], rot[2]);
  vfx.add(m, life, (o, age) => { o.material.opacity = Math.max(0, 1 - age / life); o.scale.setScalar(1 + age * 1.2); });
  return m;
}
// imagem residual de um lutador numa pose, em posição do mundo
function afterimage(vfx, charId, color, poseName, x, z, faceX, life = 0.4, scale = 1, op = 0.5) {
  const g = ghostOf(charId, color);
  applyPose(g, POSES[poseName], {});
  g.root.position.set(x, 0, z); g.root.scale.setScalar(scale);
  g.root.lookAt(faceX, 0, 0);
  vfx.add(g.root, life, (o, age) => o.traverse((c) => { if (c.isMesh) c.material.opacity = op * Math.min(1, age * 8) * Math.max(0, 1 - age / life); }));
  return g;
}
// fragmenta o corpo do derrotado em pedaços (cabeça, braços, pernas, tronco)
function shatter(ctx, power = 1, color = null) {
  const { def, dir, vfx, blood } = ctx;
  const r = def.model.rig;
  const parts = [[r.head, [0.02, 0.12, 0]], [r.shA, [0.05, 0.08, 0.04]], [r.shB, [-0.05, 0.08, -0.04]], [r.hipA, [0.04, 0.05, 0.03]], [r.hipB, [-0.04, 0.05, -0.03]], [r.chest, [0, 0.06, 0]]];
  for (const [p, v] of parts) {
    const wp = worldPos(p);
    vfx.detach(p, V((v[0] + (Math.random() - 0.5) * 0.04) * power * dir, v[1] * power, v[2] * power), V(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2), {
      restY: 0.1, bounce: 0.25, trail: (q, age, rest) => { if (!rest && Math.random() < 0.6) blood.drip(q.x, q.y, q.z); } });
    if (color) blood.aura(wp.x, wp.y, wp.z, 8, color, 0.3, 0.02);
    blood.burst(wp.x, wp.y, wp.z, dir, 40, 1.2);
  }
}

Object.assign(FATALITIES, {
  // ---------------- KAZURO: Mil Cortes (GDD §9.1) — cortes espectrais velozes, guarda a espada, fragmentação
  mil_cortes(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    if (f < 40) { pose(att, 'iai_w', { speed: 5 }); cam.setCine(V(ax - dir * 0.6, 0.7, 2.2), V(ax + dir * 0.4, 1.0, 0), 3); }
    else if (f < 150) { pose(att, Math.floor(f / 6) % 2 ? 'flurry_s' : 'flurry_w', { speed: 40 }); }
    else if (f < 215) pose(att, f < 175 ? 'iai_s' : 'sheathe', { speed: f < 175 ? 20 : 5 });
    else pose(att, 'winKazuro', { speed: 4 });
    att.model.root.visible = !(f >= 44 && f < 150);
    pose(def, f < 205 ? (f >= 40 && f < 150 && f % 6 < 3 ? 'hitHigh' : 'frozen') : 'frozen', { speed: 30, tilt: f >= 40 && f < 150 ? (Math.random() - 0.5) * 0.06 : 0 });
    ctx.once('a', 1, () => { audio.play('heartbeat'); ctx.view.darken(4.5); });
    ctx.once('vanish', 44, () => { audio.play('teleport'); blood.aura(ax, 1.0, 0, 30, SPECTRAL, 1.0, 0.02); });
    if (f >= 44 && f < 150) {
      if (f % 4 === 0) { slashArc(vfx, dx + (Math.random() - 0.5) * 0.4, 0.6 + Math.random() * 1.2, 0.05, [Math.random() * 3, Math.random() * 3, Math.random() * 3], SPECTRAL, 0.5 + Math.random() * 0.4); audio.play('whoosh'); }
      if (f % 8 === 2) blood.burst(dx, 0.6 + Math.random() * 1.1, 0, Math.random() < 0.5 ? dir : -dir, 14, 0.8);
      if (f % 18 === 0) { const a = Math.random() * Math.PI * 2; afterimage(vfx, 'kazuro', SPECTRAL, 'flurry_s', dx + Math.cos(a) * 1.0, Math.sin(a) * 0.8, dx, 0.3); }
      const ang = f * 0.05;
      cam.setCine(V(dx + Math.sin(ang) * 2.6, 1.3, Math.cos(ang) * 2.6), V(dx, 1.1, 0), 4);
    }
    ctx.once('re', 150, () => { audio.play('teleport'); blood.aura(ax, 1.0, 0, 30, SPECTRAL, 1.0, 0.02); });
    if (f >= 150 && f < 205) cam.setCine(V(ax + dir * 0.9, 1.4, 1.8), V(ax, 1.2, 0), 3);
    ctx.once('click', 198, () => { audio.play('block'); });
    ctx.once('shatter', 205, () => {
      shatter(ctx, 0.9, SPECTRAL);
      blood.gore(dx, 1.0, 0, 50, FLESH);
      audio.play('gore'); audio.play('explosion'); cam.shake(0.5);
      ctx.view.flash(0x80b0ff, 60, 0.6, dx, 1.2, 1);
      pose(def, 'lying', { lie: 1 });
    });
    if (f >= 205) { if (f < 260) blood.fountain(dx, 0.9, 0, 0, 1, 2, 1 - (f - 205) / 60); cam.setCine(V(mid, 1.6, 4.4), V(mid, 0.8, 0), 2); }
    ctx.once('pool', 215, () => blood.pool(dx, 0.1, 2.0));
  },

  // ---------------- KAZURO: Último Suspiro (GDD) — atravessa o oponente; a alma escapa e o corpo se desfaz em dois
  ultimo_suspiro(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x;
    if (f < 50) { pose(att, 'iai_w', { speed: 4 }); cam.setCine(V(ax - dir * 1.0, 1.0, 2.6), V(dx, 1.1, 0), 2.5); }
    else if (f < 200) pose(att, 'iai_s', { speed: 30 });
    else pose(att, f < 230 ? 'sheathe' : 'winKazuro', { speed: 4 });
    pose(def, f < 180 ? 'frozen' : 'kneel', { speed: f < 180 ? 10 : 3 });
    ctx.once('dash', 52, () => {
      audio.play('heavyWhoosh'); ctx.hud.flash(0.4);
      const line = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(dx - ax) + 1.2, 0.025, 0.025), new THREE.MeshBasicMaterial({ color: 0xc0d8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      line.position.set((ax + dx) / 2, 1.2, 0.05);
      vfx.add(line, 0.6, (o, age) => { o.material.opacity = 1 - age / 0.6; o.scale.y = 1 + age * 6; });
      for (let i = 0; i < 4; i++) afterimage(vfx, 'kazuro', SPECTRAL, 'dashSlash_s', lerp(ax, dx, i / 4), 0, dx + dir * 3, 0.5, 1, 0.35);
    });
    if (f >= 52 && f < 180) cam.setCine(V(dx + dir * 1.2, 1.5, 2.4), V(dx, 1.4, 0), 2);
    // a alma escapa
    ctx.once('soul', 80, () => {
      audio.play('heartbeat');
      const g = ghostOf(CHAR_OF(def), 0xc0e0ff);
      applyPose(g, POSES.dangle, {});
      g.root.position.set(dx, 0, 0); g.root.lookAt(ax, 0, 0);
      state.soul = vfx.add(g.root, 1.8, (o, age) => { o.position.y = age * 0.9; o.traverse((c) => { if (c.isMesh) c.material.opacity = 0.45 * Math.max(0, 1 - age / 1.8); }); });
    });
    for (const t of [110, 140]) ctx.once('hb' + t, t, () => audio.play('heartbeat'));
    ctx.once('cut', 180, () => {
      const sp = def.model.rig.chest, wp = worldPos(sp);
      goreCap(sp, [0, -0.02, 0], 0.12, glowRed());
      vfx.detach(sp, V(-dir * 0.02, 0.02, 0.01), V(0, 0, dir * 0.03), { restY: 0.25, bounce: 0.2 });
      state.cut = wp;
      blood.burst(wp.x, wp.y, wp.z, dir, 120, 1.4); blood.gore(wp.x, wp.y, wp.z, 30, FLESH);
      audio.play('gore'); audio.play('hit', { heavy: true, slash: true }); cam.shake(0.45);
      ctx.view.flash(0xc0d8ff, 50, 0.4, dx, 1.3, 1);
    });
    if (state.cut && f < 260) blood.fountain(state.cut.x, state.cut.y - 0.1, 0, 0, 1, 2, 1 - (f - 180) / 90);
    if (f >= 180) cam.setCine(V(lerp(ax, dx, 0.5), 1.4, 3.8), V(lerp(ax, dx, 0.6), 0.9, 0), 2);
    ctx.once('pool', 200, () => blood.pool(dx, 0.1, 1.6));
  },

  // ---------------- KAZURO: Corte Fantasma (nome proposto) — três duplicatas atravessam o oponente ao mesmo tempo
  corte_fantasma(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x;
    pose(att, f < 90 ? 'guard_s' : f < 200 ? 'katana_s' : 'winKazuro', { speed: 6 });
    pose(def, f < 92 ? 'dizzy' : f < 170 ? 'crucified' : 'lying', f >= 170 ? { lie: 1, speed: 3 } : { speed: 12 });
    const spots = [[-1.1, 0.7], [1.1, 0.6], [0.2, -1.1]];
    if (!state.clones) state.clones = [];
    spots.forEach(([ox, oz], i) => ctx.once('c' + i, 25 + i * 16, () => {
      const g = ghostOf('kazuro', SPECTRAL);
      g.root.position.set(dx + ox * dir, 0, oz); g.root.lookAt(dx, 0, 0);
      state.clones.push(g);
      vfx.add(g.root, 2.2, (o, age) => {
        const k = ctx.f;
        applyPose(g, POSES[k < 86 ? 'katana_w' : 'katana_s'], {});
        if (k >= 86 && k < 96) o.position.lerp(V(dx - ox * dir * 0.6, 0, -oz * 0.6), 0.35);
        o.traverse((c) => { if (c.isMesh) c.material.opacity = 0.55 * Math.min(1, age * 4) * (k > 120 ? Math.max(0, 1 - (k - 120) / 20) : 1); });
      });
      audio.play('teleport'); blood.aura(dx + ox * dir, 1.0, oz, 20, SPECTRAL, 0.8, 0.02);
    }));
    if (f < 86) cam.setCine(V(dx + Math.sin(f * 0.03) * 3, 2.0, 3.0), V(dx, 1.0, 0), 2);
    ctx.once('strike', 90, () => {
      audio.play('heavyWhoosh'); audio.play('gore'); cam.shake(0.5); ctx.hud.flash(0.5);
      for (let i = 0; i < 3; i++) slashArc(vfx, dx, 1.0 + i * 0.25, 0, [i * 1.1, i * 0.7, 0.4], SPECTRAL, 1.1, 0.6);
      for (const s of [def.model.rig.shA, def.model.rig.shB]) { const wp = worldPos(s); vfx.detach(s, V((s === def.model.rig.shA ? 1 : -1) * 0.05, 0.1, 0.05), V(0.2, 0.1, 0.2), { restY: 0.1 }); blood.burst(wp.x, wp.y, wp.z, dir, 60, 1.3); }
      blood.gore(dx, 1.2, 0, 30, FLESH);
    });
    if (f >= 90 && f < 170) { if (f % 2 === 0) blood.fountain(dx, 1.45, 0, 0, 1, 2, 0.9); cam.setCine(V(dx + dir * 1.6, 1.3, 2.2), V(dx, 1.2, 0), 3); }
    ctx.once('head', 150, () => { const n = def.model.rig.neck, wp = worldPos(n); goreCap(n, [0, -0.02, 0], 0.08, glowRed()); vfx.detach(n, V(dir * 0.02, 0.1, 0.02), V(0.2, 0.1, 0.1), { restY: 0.15 }); blood.burst(wp.x, wp.y, wp.z, dir, 60, 1.2); audio.play('gore'); });
    ctx.once('pool', 175, () => blood.pool(dx, 0.1, 1.8));
    if (f >= 170) cam.setCine(V(ax - dir * 0.5, 1.6, 3.6), V((ax + dx) / 2, 1.0, 0), 2);
  },

  // ---------------- KAZURO: Possessão Oni (nome proposto) — a entidade deixa Kazuro, possui o oponente e o queima por dentro
  possessao_oni(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x;
    pose(att, f < 40 ? 'roar_w' : f < 160 ? 'roar_s' : f < 250 ? 'guard_s' : 'winKazuro', { speed: 5 });
    pose(def, f < 110 ? 'dizzy' : f < 230 ? 'writhe' : 'lying', f >= 230 ? { lie: 1, speed: 3 } : { speed: 10, tilt: f >= 110 ? Math.sin(f * 0.7) * 0.12 : 0, lift: f >= 140 && f < 230 ? Math.min(0.5, (f - 140) * 0.01) : 0 });
    ctx.once('a', 1, () => { audio.play('heartbeat'); ctx.view.darken(5); });
    ctx.once('oni', 40, () => {
      audio.play('fury');
      const g = ghostOf('kazuro', 0x3050ff);
      applyPose(g, POSES.roar_s, {}); g.root.scale.setScalar(1.7);
      g.root.position.set(ax, 0, -0.3); g.root.lookAt(dx, 0, 0);
      state.oni = vfx.add(g.root, 1.9, (o, age) => {
        const k = ctx.f;
        if (k >= 70) { const t = Math.min(1, (k - 70) / 40); o.position.set(lerp(ax, dx, t), Math.sin(t * Math.PI) * 0.6, lerp(-0.3, 0, t)); o.scale.setScalar(lerp(1.7, 0.8, t)); }
        o.traverse((c) => { if (c.isMesh) c.material.opacity = 0.5 * Math.min(1, age * 3) * (k > 108 ? Math.max(0, 1 - (k - 108) / 6) : 1); });
      });
    });
    if (f < 110) cam.setCine(V(lerp(ax, dx, f / 110) - dir * 0.5, 1.8, 3.8), V(lerp(ax, dx, f / 110), 1.6, 0), 2);
    ctx.once('enter', 110, () => { audio.play('magic'); cam.shake(0.3); tintModel(def.model, 0x202040, 0.35, 0x2040ff, 0.25); blood.aura(dx, 1.0, 0, 50, SPECTRAL, 0.8, 0.03); });
    if (f >= 110 && f < 230) {
      if (f % 3 === 0) blood.aura(dx, 0.9 + Math.random() * 0.8, 0, 2, SPECTRAL, 0.4, 0.03);
      if (f % 20 === 0) { audio.play('heartbeat'); blood.burst(dx, 1.0 + Math.random() * 0.6, 0, Math.random() < 0.5 ? 1 : -1, 25, 0.8); }
      cam.setCine(V(dx + dir * 1.4 + Math.sin(f * 0.02), 1.4, 2.4), V(dx, 1.3, 0), 3);
    }
    ctx.once('rupt', 200, () => tintModel(def.model, 0x101018, 0.5, 0x60a0ff, 0.7));
    ctx.once('burst', 230, () => {
      shatter(ctx, 1.3, SPECTRAL);
      blood.gore(dx, 1.1, 0, 60, ASH); blood.gore(dx, 1.1, 0, 30, FLESH);
      audio.play('explosion'); audio.play('gore'); cam.shake(0.6); ctx.hud.flash();
      ctx.view.flash(0x4070ff, 80, 0.8, dx, 1.3, 1);
    });
    if (f >= 230) cam.setCine(V(ax - dir * 0.4, 1.8, 4.0), V((ax + dx) / 2, 1.1, 0), 2);
    ctx.once('pool', 240, () => blood.pool(dx, 0.1, 1.8));
  },

  // ---------------- BRAKKOR: Devorador de Almas (GDD) — arranca a alma e a devora; o corpo vira casca e pó
  devorador_almas(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x;
    pose(att, f < 40 ? 'grab_s' : f < 200 ? 'devour' : f < 230 ? 'roar_s' : 'winBrakkor', { speed: 6 });
    const lift = f < 30 ? 0 : Math.min(0.8, (f - 30) * 0.02);
    pose(def, f < 200 ? 'dangle' : f < 230 ? 'husk' : 'husk', { lift: f < 215 ? lift : 0, speed: 6, tilt: Math.sin(f * 0.5) * 0.05 });
    if (att.model.rig.jaw) att.model.rig.jaw.rotation.x = f >= 70 && f < 200 ? 0.5 + Math.sin(f * 0.3) * 0.08 : 0;
    ctx.once('a', 1, () => { audio.play('throw'); ctx.view.darken(5); });
    if (f < 70) cam.setCine(V((ax + dx) / 2, 1.4, 3.4), V((ax + dx) / 2, 1.6, 0), 2);
    ctx.once('roar', 60, () => { audio.play('fury'); cam.shake(0.3); });
    ctx.once('soul', 80, () => {
      const g = ghostOf(CHAR_OF(def), 0xa0e0ff);
      applyPose(g, POSES.writhe, {});
      g.root.position.set(dx, lift, 0); g.root.lookAt(ax, 0, 0);
      const mouth = worldPos(att.model.rig.head);
      state.soul = vfx.add(g.root, 2.0, (o, age) => {
        const t = Math.min(1, Math.max(0, (ctx.f - 90) / 80));
        o.position.set(lerp(dx, mouth.x, t), lerp(lift, mouth.y - 1.0, t), lerp(0, mouth.z + 0.1, t));
        o.scale.setScalar(lerp(1, 0.1, t * t));
        o.traverse((c) => { if (c.isMesh) c.material.opacity = 0.5 * (1 - t * 0.6); });
      });
      audio.play('magic');
    });
    if (f >= 80 && f < 175) {
      if (f % 2 === 0) { const m = worldPos(att.model.rig.head); blood.aura(lerp(dx, m.x, Math.random()), lerp(1.3, m.y, Math.random()), 0, 1, 0xa0e0ff, 0.15, 0); }
      cam.setCine(V(lerp(ax, dx, 0.5) + 0.2, 2.0, 2.4), V(lerp(ax, dx, 0.35), 1.9, 0), 2);
      if (f % 25 === 0) audio.play('heartbeat');
    }
    ctx.once('dry', 120, () => tintModel(def.model, 0x5a4a3a, 0.6));
    ctx.once('dry2', 160, () => tintModel(def.model, 0x3a3028, 0.7));
    ctx.once('gulp', 175, () => { audio.play('gore'); cam.shake(0.25); ctx.view.flash(0xa0e0ff, 40, 0.4, ax, 2.2, 1); });
    ctx.once('drop', 215, () => audio.play('land', { heavy: true }));
    ctx.once('dust', 240, () => {
      def.model.root.visible = false;
      blood.gore(dx, 0.9, 0, 80, DUST); blood.gore(dx, 0.5, 0, 40, ASH);
      blood.spark(dx, 0.8, 0, 40, 0x8a7a68, 0.8);
      audio.play('explosion');
    });
    if (f >= 200) cam.setCine(V(ax - dir * 0.6, 1.8, 4.2), V((ax + dx) / 2, 1.2, 0), 2);
  },

  // ---------------- BRAKKOR: Fornalha Infernal (GDD) — sopro de fogo infernal até restarem cinzas
  fornalha_infernal(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x;
    pose(att, f < 40 ? 'breath_w' : f < 210 ? 'breath_s' : 'winBrakkor', { speed: 5 });
    if (att.model.rig.jaw) att.model.rig.jaw.rotation.x = f >= 40 && f < 210 ? 0.55 : 0;
    pose(def, f < 50 ? 'dizzy' : f < 220 ? 'writhe' : 'husk', { speed: 8, tilt: f >= 50 && f < 220 ? Math.sin(f * 0.6) * 0.1 : 0 });
    ctx.once('a', 1, () => { audio.play('fury'); ctx.view.darken(5); });
    if (f >= 40 && f < 210) {
      const m = worldPos(att.model.rig.head);
      for (let i = 0; i < 4; i++) { const t = Math.random(); blood.aura(lerp(m.x + dir * 0.3, dx, t), lerp(m.y - 0.1, 1.1, t) + (Math.random() - 0.5) * 0.4 * t, (Math.random() - 0.5) * 0.4 * t, 1, i % 2 ? 0xff6010 : 0xffb030, 0.2 + t * 0.4, 0.02); }
      if (f % 2 === 0) blood.aura(dx, 0.6 + Math.random() * 1.2, 0, 2, 0xff5010, 0.5, 0.04);
      if (f % 12 === 0) audio.play('proj', { kind: 'fire' });
    }
    ctx.once('burn1', 90, () => tintModel(def.model, 0x3a1808, 0.45, 0xff3000, 0.4));
    ctx.once('burn2', 150, () => tintModel(def.model, 0x100808, 0.6, 0xff2000, 0.7));
    ctx.once('burn3', 200, () => tintModel(def.model, 0x050404, 0.7, 0x401000, 0.3));
    if (f < 40) cam.setCine(V(ax - dir * 0.8, 2.6, 2.2), V(ax + dir * 0.4, 2.0, 0), 2);
    else if (f < 140) cam.setCine(V(lerp(ax, dx, 0.5), 1.5, 3.4), V(lerp(ax, dx, 0.5), 1.5, 0), 2);
    else if (f < 225) cam.setCine(V(dx + dir * 1.2, 1.2, 2.2), V(dx, 1.1, 0), 2);
    ctx.once('ash', 240, () => {
      def.model.root.visible = false;
      blood.gore(dx, 1.0, 0, 90, ASH); blood.spark(dx, 1.0, 0, 50, 0xff6010, 1.0);
      audio.play('explosion'); cam.shake(0.3);
      const sk = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd0c4a8, roughness: 0.6 }));
      sk.position.set(dx, 0.12, 0.1); vfx.add(sk, 3, null);
    });
    if (f >= 225) cam.setCine(V(ax - dir * 0.5, 1.9, 4.0), V((ax + dx) / 2, 1.1, 0), 2);
  },

  // ---------------- BRAKKOR: Esmagamento Sísmico (nome proposto) — salta e esmaga; rochas emergem do chão
  esmagamento_sismico(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x;
    const jt = Math.max(0, Math.min(1, (f - 40) / 50));
    pose(att, f < 40 ? 'leap_w' : f < 95 ? 'leap_s' : f < 200 ? 'groundSlam_s' : 'winBrakkor', { speed: 8, lift: f >= 40 && f < 95 ? Math.sin(jt * Math.PI) * 3.0 : 0, zoff: 0 });
    pose(def, f < 92 ? 'dizzy' : 'lying', f >= 92 ? { lie: 1, speed: 30 } : { speed: 6 });
    if (f < 40) cam.setCine(V(ax - dir * 1.2, 1.0, 3.4), V(ax, 1.4, 0), 2);
    else if (f < 92) cam.setCine(V(dx + dir * 2.0, 0.6, 3.2), V(lerp(ax, dx, jt), 2.4, 0), 3);
    ctx.once('jump', 40, () => audio.play('jump'));
    ctx.once('slam', 92, () => {
      def.model.root.scale.set(1.25, 0.25, 1.25);
      blood.burst(dx, 0.3, 0, dir, 160, 2.0); blood.burst(dx, 0.3, 0, -dir, 120, 1.8); blood.gore(dx, 0.3, 0, 60, FLESH);
      blood.spark(dx, 0.1, 0, 60, 0xff9040, 2.0);
      audio.play('explosion'); audio.play('gore'); audio.play('land', { heavy: true });
      cam.shake(0.8); ctx.hud.flash(0.5);
      blood.pool(dx, 0.1, 2.4);
    });
    ctx.once('rocks', 130, () => {
      const g = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 1, emissive: 0x401000 });
      for (let i = 0; i < 9; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(0.2 + Math.random() * 0.15, 1.2 + Math.random() * 0.8, 5), mat); const a = (i / 9) * Math.PI * 2; r.position.set(Math.cos(a) * 0.7, -1, Math.sin(a) * 0.6); r.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); g.add(r); }
      g.position.set(dx, 0, 0);
      vfx.add(g, 4, (o, age) => o.children.forEach((r) => { r.position.y = lerp(-1, 0.4, age * 4); }));
      audio.play('land', { heavy: true }); cam.shake(0.5);
    });
    if (f >= 92) cam.setCine(V(dx + Math.sin(f * 0.01) * 2.8, 2.2, 3.4), V(dx, 0.4, 0), 2);
  },

  // ---------------- BRAKKOR: Rasgo Duplo (nome proposto) — ergue o oponente e arranca os dois braços
  rasgo_duplo(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x;
    pose(att, f < 30 ? 'grab_w' : f < 140 ? 'grab_s' : f < 200 ? 'roar_s' : f < 230 ? 'groundSlam_s' : 'winBrakkor', { speed: 6 });
    pose(def, f < 140 ? 'crucified' : f < 215 ? 'dangle' : 'lying', f >= 215 ? { lie: 1, speed: 6 } : { lift: f < 30 ? 0 : Math.min(0.7, (f - 30) * 0.02), speed: 6, tilt: Math.sin(f * 0.8) * (f > 90 ? 0.08 : 0.02) });
    ctx.once('a', 1, () => { audio.play('throw'); ctx.view.darken(4); });
    if (f < 140) cam.setCine(V((ax + dx) / 2, 1.8, 2.8 - f * 0.005), V(dx, 1.8, 0), 2);
    for (const t of [70, 100, 125]) ctx.once('hb' + t, t, () => { audio.play('heartbeat'); blood.burst(dx + 0.35, 1.9, 0, 1, 10, 0.4); blood.burst(dx - 0.35, 1.9, 0, -1, 10, 0.4); });
    ctx.once('rip', 140, () => {
      for (const [s, sg] of [[def.model.rig.shA, 1], [def.model.rig.shB, -1]]) {
        const wp = worldPos(s);
        vfx.detach(s, V(sg * 0.07, 0.08, 0.04), V(0.1, 0.2, sg * 0.3), { restY: 0.1, trail: (q, age, rest) => { if (!rest) blood.drip(q.x, q.y, q.z); } });
        blood.burst(wp.x, wp.y, wp.z, sg, 100, 1.6);
      }
      blood.gore(dx, 1.9, 0, 40, FLESH);
      audio.play('gore'); audio.play('hit', { heavy: true }); cam.shake(0.6); ctx.hud.flash(0.4);
      state.rip = true;
    });
    if (state.rip && f < 215) { blood.fountain(dx + 0.25, 2.0, 0, 0.4, 1, 1, 0.9); blood.fountain(dx - 0.25, 2.0, 0, -0.4, 1, 1, 0.9); }
    if (f >= 140 && f < 215) cam.setCine(V(dx + dir * 1.5, 1.6, 3.0), V(dx, 1.6, 0), 3);
    ctx.once('slam', 215, () => { audio.play('land', { heavy: true }); audio.play('gore'); cam.shake(0.6); blood.burst(dx, 0.3, 0, dir, 80, 1.4); blood.pool(dx, 0.1, 2.0); });
    if (f >= 215) cam.setCine(V(ax - dir * 0.6, 2.0, 4.4), V((ax + dx) / 2, 1.2, 0), 2);
  },
});
// id de personagem de um lutador embrulhado (para fantasmas do derrotado)
function CHAR_OF(w) { return w.model.charId; }

Object.assign(SUPERS, {
  // ---------------- KAZURO: Tempestade de Lâminas (nome proposto)
  tempestade(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio } = ctx;
    const dx = def.x, mid = (att.x + dx) / 2;
    const hits = [24, 36, 48, 60, 72];
    const near = hits.some((h) => f >= h - 2 && f <= h + 2);
    att.model.root.visible = !(f >= 18 && f < 108);
    pose(att, f < 108 ? 'dashSlash_s' : f < 125 ? 'iai_s' : 'sheathe', { speed: 20 });
    pose(def, f < 118 ? (near ? 'hitHigh' : 'frozen') : 'tumble', { speed: 30, lift: f >= 118 ? 0.4 : 0 });
    ctx.once('fx', 1, () => { audio.play('super'); ctx.hud.flash(0.4); ctx.view.darken(2.4); });
    hits.forEach((h, i) => ctx.once('h' + i, h, () => {
      slashArc(vfx, dx, 1.0 + (i % 3) * 0.3, 0.05, [i * 0.9, i * 1.3, i * 0.6], SPECTRAL, 0.8);
      const a = i * 2.1; afterimage(vfx, 'kazuro', SPECTRAL, 'dashSlash_s', dx + Math.cos(a) * 1.1, Math.sin(a) * 0.7, dx, 0.35);
      blood.burst(dx, 1.0 + Math.random() * 0.6, 0, i % 2 ? dir : -dir, 30, 1.0); audio.play('hit', { slash: true });
    }));
    ctx.once('final', 112, () => { for (const r of [0.8, -0.8]) slashArc(vfx, dx, 1.2, 0.1, [0, 0, r], 0xc0d8ff, 1.3, 0.6); });
    ctx.once('boom', 118, () => { cam.shake(0.5); ctx.hud.flash(); blood.burst(dx, 1.2, 0, dir, 120, 1.6); audio.play('explosion'); ctx.view.flash(0x80b0ff, 30, 0.6, dx, 1.4, 1); blood.pool(dx, 0.2, 1.0); });
    const ang = f * 0.035;
    cam.setCine(V(dx + Math.sin(ang) * 3.0 * dir, 1.4, Math.cos(ang) * 3.0), V(f > 108 ? mid : dx, 1.2, 0), f > 108 ? 5 : 3);
  },
  // ---------------- KAZURO: Despertar do Oni (nome proposto) — a entidade gigante corta três vezes
  despertar(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(att, f < 30 ? 'roar_w' : 'roar_s', { speed: 6 });
    const hit = [46, 70, 94, 140].some((h) => f >= h && f < h + 6);
    pose(def, f < 140 ? (hit ? 'hitHigh' : 'dizzy') : 'tumble', { speed: 24, lift: f >= 140 ? 0.4 : 0 });
    ctx.once('fx', 1, () => { audio.play('super'); audio.play('fury'); ctx.hud.flash(0.3); ctx.view.darken(2.8); });
    ctx.once('oni', 20, () => {
      const g = ghostOf('kazuro', 0x3050ff); g.root.scale.setScalar(2.2);
      g.root.position.set(ax - dir * 0.6, 0, -0.6); g.root.lookAt(dx, 0, -0.6);
      state.oni = g;
      vfx.add(g.root, 2.4, (o, age) => {
        const k = ctx.f;
        const ph = [46, 70, 94, 140].findIndex((h) => k < h);
        const local = ph < 0 ? 99 : k - (ph ? [46, 70, 94, 140][ph - 1] : 20);
        applyPose(g, POSES[ph < 0 ? 'iai_s' : local < 14 ? 'katana_w' : 'katana_s'], {});
        o.traverse((c) => { if (c.isMesh) c.material.opacity = 0.45 * Math.min(1, age * 3) * (k > 150 ? Math.max(0, 1 - (k - 150) / 12) : 1); });
      });
    });
    [46, 70, 94].forEach((h, i) => ctx.once('h' + i, h, () => { slashArc(vfx, dx, 1.3, 0.05, [0.3, 0.2, i % 2 ? 0.9 : -0.9], 0x4070ff, 1.4, 0.5); blood.burst(dx, 1.2, 0, dir, 50, 1.2); audio.play('heavyWhoosh'); cam.shake(0.3); }));
    ctx.once('final', 140, () => { slashArc(vfx, dx, 1.2, 0.05, [0, 0, 0], 0xc0d8ff, 2.0, 0.7); cam.shake(0.6); ctx.hud.flash(); blood.burst(dx, 1.2, 0, dir, 130, 1.8); audio.play('explosion'); ctx.view.flash(0x4070ff, 40, 0.7, dx, 1.5, 1); blood.pool(dx, 0.2, 1.1); });
    if (f % 3 === 0) blood.aura(ax, 1.2, 0, 2, 0x4070ff, 0.8, 0.03);
    cam.setCine(V(mid - Math.sin(f * 0.015) * 3.6 * dir, 1.8 + f * 0.004, 4.0), V(mid, 1.6, 0), 3);
  },
  // ---------------- BRAKKOR: Apocalipse Ígneo (nome proposto) — rugido invoca meteoros e um pilar de fogo
  apocalipse(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(att, f < 30 ? 'roar_w' : 'roar_s', { speed: 6 });
    const hits = [36, 60, 84];
    pose(def, f < 126 ? (hits.some((h) => f >= h && f < h + 8) ? 'hitHigh' : 'dizzy') : 'tumble', { speed: 24, lift: f >= 126 ? Math.min(1.2, (f - 126) * 0.05) : 0 });
    ctx.once('fx', 1, () => { audio.play('super'); audio.play('fury'); ctx.hud.flash(0.3); ctx.view.darken(2.6); cam.shake(0.3); });
    hits.forEach((h, i) => ctx.once('m' + i, h - 16, () => {
      const m = new THREE.Group();
      m.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), new THREE.MeshStandardMaterial({ color: 0x200800, emissive: 0xff5010, emissiveIntensity: 1.8 })));
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ff6010'), blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.set(2, 2, 1); m.add(s);
      const from = V(dx - dir * (2 - i), 7, -0.5 + i * 0.3), to = V(dx, 1.0, 0);
      vfx.add(m, 16 / 60, (o, age) => { o.position.lerpVectors(from, to, Math.min(1, age * 60 / 16)); blood.aura(o.position.x, o.position.y, o.position.z, 2, 0xff6010, 0.2, 0.02); });
      ctx.once('mh' + i, h, () => { blood.spark(dx, 1.0, 0, 40, 0xff8030, 1.8); blood.burst(dx, 1.1, 0, dir, 30, 1); audio.play('explosion'); cam.shake(0.35); ctx.view.flash(0xff6010, 30, 0.3, dx, 1.2, 1); });
    }));
    ctx.once('pillar', 120, () => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 8, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xff5010, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      p.position.set(dx, 4, 0);
      vfx.add(p, 0.6, (o, age) => { o.scale.set(1 + age, Math.min(1, age * 6), 1 + age); o.material.opacity = 0.75 * (1 - age / 0.6); });
      audio.play('explosion');
    });
    ctx.once('boom', 126, () => { cam.shake(0.7); ctx.hud.flash(); blood.burst(dx, 1.2, 0, dir, 100, 1.6); ctx.view.flash(0xff5010, 60, 0.7, dx, 1.5, 1); });
    if (f >= 120 && f < 150) blood.aura(dx, 0.3 + Math.random() * 3, 0, 4, 0xffa030, 0.6, 0.06);
    cam.setCine(V(mid + Math.sin(f * 0.02) * 3.8 * dir, 1.2 + f * 0.01, 4.4), V(mid, 1.6, 0), 3);
  },
  // ---------------- BRAKKOR: Banquete do Devorador (nome proposto) — agarra, morde duas vezes e arremessa
  banquete(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio } = ctx;
    const ax = att.x, dx = def.x;
    pose(att, f < 40 ? 'grab_s' : f < 130 ? 'devour' : f < 150 ? 'throwAxe_s' : 'roar_s', { speed: 8 });
    const bitten = [50, 80].some((h) => f >= h && f < h + 8);
    pose(def, f < 140 ? (bitten ? 'writhe' : 'dangle') : 'tumble', { lift: f < 140 ? Math.min(0.8, f * 0.02) : Math.max(0, 0.8 - (f - 140) * 0.05), speed: 12 });
    if (att.model.rig.jaw) att.model.rig.jaw.rotation.x = f >= 40 && f < 130 ? (bitten ? 0.1 : 0.55) : 0;
    ctx.once('fx', 1, () => { audio.play('super'); audio.play('throw'); ctx.hud.flash(0.3); ctx.view.darken(2.6); });
    [50, 80].forEach((h, i) => ctx.once('b' + i, h, () => { const p = worldPos(def.model.rig.neck); blood.burst(p.x, p.y, p.z, -dir, 70, 1.3); blood.gore(p.x, p.y, p.z, 10, FLESH); audio.play('gore'); cam.shake(0.3); }));
    ctx.once('heal', 90, () => blood.aura(ax, 1.4, 0, 40, 0xff4060, 1.0, 0.03));
    ctx.once('throw', 135, () => audio.play('heavyWhoosh'));
    ctx.once('slam', 140, () => { cam.shake(0.7); ctx.hud.flash(); blood.burst(dx, 0.4, 0, dir, 110, 1.6); audio.play('land', { heavy: true }); audio.play('explosion'); blood.pool(dx, 0.2, 1.2); });
    if (f < 130) cam.setCine(V((ax + dx) / 2 + dir * 0.3, 2.0, 2.6), V((ax + dx) / 2, 1.8, 0), 2);
    else cam.setCine(V(dx + dir * 2, 1.2, 3.6), V(dx, 0.6, 0), 3);
  },
});

// ================= v0.4 — NYMERA (gelo) e PESTILUS (peste)
const ICE = 0x9ae0ff, TOXIC = 0x70ff30;
const ICE_COLS = [new THREE.Color(0xd8f4ff), new THREE.Color(0x9ae0ff), new THREE.Color(0x5aa8d8), new THREE.Color(0x7a0a0a)];
const ROT = [new THREE.Color(0x3a4a10), new THREE.Color(0x5a6a20), new THREE.Color(0x2a1a08), new THREE.Color(0x6a0a0a), new THREE.Color(0x8aa030)];
const iceMat = (op = 0.55) => new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x4aa0d8, emissiveIntensity: 0.85, roughness: 0.08, metalness: 0.3, transparent: true, opacity: op, depthWrite: false });
// bloco de gelo que cresce a partir dos pés (escala Y de 0 a 1)
function iceBlock(vfx, x, h = 2.1, life = 6) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1, 0.8), iceMat()); m.position.y = 0.5; g.add(m);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0xe8faff, transparent: true, opacity: 0.8 })); e.position.y = 0.5; g.add(e);
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5 + Math.random() * 0.4, 5), iceMat(0.8)); c.position.set((Math.random() - 0.5) * 0.9, 1.0, (Math.random() - 0.5) * 0.7); c.rotation.z = (Math.random() - 0.5) * 0.8; g.add(c); }
  g.position.set(x, 0, 0); g.scale.set(1, 0.001, 1); g.userData.h = h;
  vfx.add(g, life, null);
  return g;
}
function growIce(b, k) { if (b) b.scale.set(1, Math.max(0.001, b.userData.h * Math.min(1, k)), 1); }
// estaca de gelo que irrompe do chão
function iceSpike(vfx, x, z, len, tilt, life = 3, delay = 0) {
  const s = new THREE.Mesh(new THREE.ConeGeometry(0.12, len, 6), iceMat(0.85)); s.castShadow = true;
  s.position.set(x, 0, z); s.rotation.z = tilt; s.scale.setScalar(0.001);
  vfx.add(s, life, (o, age) => { const k = Math.max(0, Math.min(1, (age - delay) * 7)); o.scale.setScalar(Math.max(0.001, k)); o.position.y = len * 0.5 * k - 0.1; if (age > life - 0.4) o.material.opacity = Math.max(0, (life - age) / 0.4) * 0.85; });
  return s;
}
// nuvem tóxica (sprites aditivos)
function toxicCloud(vfx, x, y, r, life, color = '#70ff30') {
  const g = new THREE.Group();
  const mat = new THREE.SpriteMaterial({ map: glowSprite(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 9; i++) { const s = new THREE.Sprite(mat); s.position.set((Math.random() - 0.5) * r, (Math.random() - 0.3) * r * 0.6, (Math.random() - 0.5) * r * 0.6); s.scale.setScalar(r * (0.7 + Math.random() * 0.5)); s.userData.ph = Math.random() * 6; g.add(s); }
  g.position.set(x, y, 0);
  vfx.add(g, life, (o, age) => { mat.opacity = 0.5 * Math.min(1, age * 3) * Math.min(1, (life - age) * 1.5); o.children.forEach((c) => { c.position.y += 0.002; c.material.rotation = age + c.userData.ph; }); o.scale.setScalar(1 + age * 0.15); });
  return g;
}
// corvo simples (corpo + asas que batem) e rato (corpo + cauda)
const CROW_MAT = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.6 }); CROW_MAT.userData.shared = true;
function crow() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), CROW_MAT)).scale.set(1, 0.8, 1.6);
  const b = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.09, 5), std2(0x2a2a20)); b.rotation.x = Math.PI / 2; b.position.z = 0.14; g.add(b);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.01, 0.12), CROW_MAT); w.position.x = s * 0.15; w.userData.s = s; g.add(w); g.userData['w' + s] = w; }
  return g;
}
function flap(g, t) { for (const s of [-1, 1]) { const w = g.userData['w' + s]; if (w) w.rotation.z = s * Math.sin(t * 30) * 0.9; } }
function rat() {
  const g = new THREE.Group();
  const m = std2(0x2a2420);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), m)).scale.set(1, 0.7, 1.8);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.16, 4), std2(0x8a6a60)); t.rotation.x = Math.PI / 2 - 0.3; t.position.set(0, 0.01, -0.17); g.add(t);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.008, 4, 3), new THREE.MeshBasicMaterial({ color: 0xff3020 })); e.position.set(s * 0.025, 0.03, 0.09); g.add(e); }
  return g;
}
function std2(c) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }); }

Object.assign(FATALITIES, {
  // ---------------- NYMERA: Estilhaços Humanos (GDD) — congela o oponente e o despedaça com um chute
  estilhacos_humanos(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(att, f < 30 ? 'castUp_w' : f < 150 ? 'castUp_s' : f < 172 ? 'kickHigh_w' : f < 200 ? 'kickHigh_s' : 'winNymera', { speed: f >= 150 && f < 200 ? 30 : 6 });
    pose(def, f < 40 ? 'dizzy' : 'frozen', { speed: f < 40 ? 6 : 2 });
    ctx.once('a', 1, () => { audio.play('heartbeat'); ctx.view.darken(4.0); });
    ctx.once('ice', 40, () => { state.block = iceBlock(vfx, dx, 2.15, 6); audio.play('freeze'); });
    if (f >= 40 && f < 130) {
      growIce(state.block, (f - 40) / 80);
      if (f % 3 === 0) blood.aura(dx, 0.2 + (f - 40) / 40, 0, 3, ICE, 0.5, 0.01);
      if (f === 90) tintModel(def.model, 0x9ad8ff, 0.6, 0x2a6aa0, 0.6);
    }
    if (f < 150) cam.setCine(V(mid + dir * 0.2 + Math.sin(f * 0.01) * 0.8, 1.2, 3.0), V(dx, 1.1, 0), 2.5);
    ctx.once('kick', 180, () => {
      if (state.block) state.block.visible = false;
      shatter(ctx, 1.5, ICE);
      const p = worldPos(def.model.rig.chest);
      blood.gore(p.x, p.y, p.z, 40, ICE_COLS); blood.spark(p.x, p.y, p.z, 80, 0xd8f4ff, 2.0);
      audio.play('explosion'); audio.play('gore'); audio.play('freeze'); cam.shake(0.6); ctx.hud.flash();
      ctx.view.flash(0xbfe8ff, 50, 0.6, dx, 1.2, 1);
      def.model.root.visible = false;
    });
    if (f >= 180) cam.setCine(V(dx + dir * 1.6, 1.0, 3.6), V(dx, 0.6, 0), 3);
    ctx.once('pool', 200, () => blood.pool(dx, 0.1, 1.3));
    if (f >= 250) cam.setCine(V(ax - dir * 0.6, 1.6, 3.2), V(ax, 1.3, 0), 2);
  },
  // ---------------- NYMERA: Frio Absoluto (GDD) — onda glacial congela à distância; o corpo racha e desaba
  frio_absoluto(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(att, f < 40 ? 'cast_w' : f < 200 ? 'cast_s' : 'winNymera', { speed: 5 });
    const k = Math.max(0, Math.min(1, (f - 60) / 90));
    pose(def, f < 60 ? 'dizzy' : f < 210 ? 'frozen' : 'kneel', { speed: f < 210 ? 1 + (1 - k) * 4 : 2, tilt: f >= 210 ? Math.min(0.6, (f - 210) * 0.02) * dir : 0 });
    ctx.once('a', 1, () => { audio.play('magic'); ctx.view.darken(4.2); });
    if (f >= 40 && f < 150) {
      const t = (f - 40) / 40, x = lerp(ax + dir * 0.5, dx, t);
      if (f % 2 === 0) blood.aura(x, 0.15 + Math.random() * 1.6, (Math.random() - 0.5) * 0.6, 3, ICE, 0.4, 0.0);
      if (f % 6 === 0 && t <= 1) iceSpike(vfx, x, (Math.random() - 0.5) * 0.6, 0.5 + Math.random() * 0.4, (Math.random() - 0.5) * 0.6, 3.2);
    }
    if (f === 80 || f === 110 || f === 140) { tintModel(def.model, 0xbfe8ff, 0.3, 0x3a7ab0, 0.35 + k * 0.5); audio.play('freeze'); }
    if (f < 90) cam.setCine(V(ax - dir * 1.4, 1.2, 2.6), V(dx, 1.0, 0), 2.5);
    else if (f < 210) cam.setCine(V(dx + dir * 1.3, 1.5, 3.0), V(dx, 1.1, 0), 2);
    ctx.once('crack', 210, () => { audio.play('block'); blood.spark(dx, 1.2, 0, 40, 0xe8faff, 1.2); cam.shake(0.25); });
    ctx.once('fall', 240, () => {
      shatter(ctx, 0.45, ICE);
      const p = worldPos(def.model.rig.chest);
      blood.gore(p.x, p.y, p.z, 30, ICE_COLS); audio.play('gore'); audio.play('land', { heavy: true }); cam.shake(0.5);
    });
    if (f >= 210) cam.setCine(V(mid + dir * 0.8, 1.3, 3.8), V(dx, 0.7, 0), 2.5);
    ctx.once('pool', 260, () => blood.pool(dx, 0.1, 1.1));
  },
  // ---------------- NYMERA: Coração de Gelo (nome proposto) — arranca o coração congelado e o esmaga
  coracao_gelo(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x;
    pose(att, f < 40 ? 'lunge_w' : f < 70 ? 'lunge_s' : f < 120 ? 'yank' : f < 200 ? 'castUp_s' : 'winNymera', { speed: f < 70 ? 20 : 6 });
    pose(def, f < 50 ? 'dizzy' : f < 150 ? 'writhe' : 'lying', f >= 150 ? { lie: 1, speed: 3 } : { speed: 10, tilt: f > 50 ? 0.15 * dir : 0 });
    ctx.once('a', 1, () => { audio.play('heartbeat'); ctx.view.darken(3.6); });
    ctx.once('stab', 52, () => { const p = worldPos(def.model.rig.chest); blood.burst(p.x, p.y + 0.2, p.z, -dir, 60, 1.2); audio.play('gore'); audio.play('hit', { heavy: true, slash: true }); cam.shake(0.3); });
    ctx.once('heart', 90, () => {
      const h = new THREE.Group();
      h.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 1), new THREE.MeshStandardMaterial({ color: 0x8a0a10, emissive: 0x4a0010, emissiveIntensity: 0.6, roughness: 0.2 })));
      h.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), iceMat(0.5)));
      att.model.rig.handA.add(h); h.position.set(0, -0.12, 0.05);
      state.heart = h; audio.play('freeze'); audio.play('gore');
      const p = worldPos(def.model.rig.chest); blood.burst(p.x, p.y + 0.2, p.z, dir, 90, 1.4); blood.gore(p.x, p.y, p.z, 14, FLESH);
    });
    if (f >= 95 && f < 160 && f % 6 === 0) audio.play('heartbeat');
    if (state.heart && f < 200) { const s = 1 + Math.sin(f * 0.6) * 0.08 * Math.max(0, 1 - (f - 90) / 70); state.heart.scale.setScalar(s); }
    ctx.once('crush', 200, () => {
      const p = worldPos(state.heart); state.heart.visible = false;
      blood.spark(p.x, p.y, p.z, 60, 0xd8f4ff, 1.4); blood.gore(p.x, p.y, p.z, 20, ICE_COLS); blood.burst(p.x, p.y, p.z, dir, 40, 0.8);
      audio.play('explosion'); cam.shake(0.4); ctx.hud.flash(0.5);
    });
    if (f < 120) cam.setCine(V((ax + dx) / 2 + dir * 0.1, 1.45, 2.3), V((ax + dx) / 2, 1.3, 0), 2.5);
    else cam.setCine(V(ax + dir * 0.9, 1.7, 2.0), V(ax, 1.5, 0), 2.5);
    ctx.once('pool', 170, () => blood.pool(dx, 0.1, 1.4));
  },
  // ---------------- NYMERA: Prisão Cristalina (nome proposto) — estacas de gelo empalam e erguem o oponente
  prisao_cristalina(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(att, f < 30 ? 'castLow_w' : f < 180 ? 'castLow_s' : 'winNymera', { speed: 6 });
    const lift = f < 70 ? 0 : f < 200 ? Math.min(1.1, (f - 70) * 0.05) : Math.max(0, 1.1 - (f - 200) * 0.08);
    pose(def, f < 70 ? 'dizzy' : f < 210 ? 'crucified' : 'lying', f >= 210 ? { lie: 1, speed: 4 } : { lift, speed: 8, tilt: f > 70 && f < 200 ? Math.sin(f * 0.8) * 0.02 : 0 });
    ctx.once('a', 1, () => { audio.play('magic'); ctx.view.darken(4); });
    for (const [t, ox, oz, len, tilt] of [[40, -0.7, 0.3, 1.4, -0.5], [48, 0.7, -0.2, 1.5, 0.5], [56, 0, 0.5, 1.3, 0.1], [64, 0.3, -0.5, 1.6, -0.3]]) ctx.once('s' + t, t, () => { iceSpike(vfx, dx + ox, oz, len, tilt, 3.3); audio.play('freeze'); blood.spark(dx + ox, 0.2, oz, 20, ICE, 1); cam.shake(0.15); });
    ctx.once('impale', 72, () => { state.big = iceSpike(vfx, dx, 0, 2.8, 0, 2.5); const p = worldPos(def.model.rig.spine); blood.burst(p.x, p.y, p.z, dir, 120, 1.5); blood.gore(p.x, p.y, p.z, 20, FLESH); audio.play('gore'); audio.play('hit', { heavy: true }); cam.shake(0.5); ctx.hud.flash(0.5); });
    if (f > 72 && f < 200 && f % 4 === 0) { const p = worldPos(def.model.rig.spine); blood.drip(p.x, p.y - 0.1, p.z); blood.drip(p.x + 0.05, p.y - 0.2, p.z); }
    ctx.once('break', 200, () => { blood.spark(dx, 1.4, 0, 90, 0xd8f4ff, 1.8); audio.play('explosion'); cam.shake(0.4); });
    ctx.once('pool', 215, () => { blood.pool(dx, 0.1, 1.8); audio.play('land', { heavy: true }); });
    if (f < 72) cam.setCine(V(mid, 1.1, 3.4), V(dx, 0.8, 0), 2.5);
    else cam.setCine(V(dx + dir * 1.4 + Math.sin(f * 0.02) * 0.6, 1.0, 3.2), V(dx, 1.6, 0), 2.5);
  },

  // ---------------- PESTILUS: Decomposição (GDD) — injeção que apodrece o corpo até virar uma poça
  decomposicao(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x;
    pose(att, f < 30 ? 'lunge_w' : f < 55 ? 'lunge_s' : f < 220 ? 'stance' : 'winPestilus', { speed: f < 55 ? 18 : 4 });
    const rot = Math.max(0, Math.min(1, (f - 70) / 180));
    pose(def, f < 60 ? 'dizzy' : f < 200 ? 'writhe' : 'husk', { speed: f < 200 ? 12 : 3, tilt: f >= 200 ? 0.2 * dir : 0 });
    ctx.once('a', 1, () => { audio.play('heartbeat'); ctx.view.darken(4.2); });
    ctx.once('inject', 48, () => { const p = worldPos(def.model.rig.neck); blood.spark(p.x, p.y, p.z, 30, TOXIC, 1); audio.play('hit', { slash: true }); audio.play('magic'); });
    for (const t of [90, 140, 190]) ctx.once('rot' + t, t, () => { tintModel(def.model, t < 150 ? 0x5a6a20 : 0x2a2010, 0.35, 0x203000, 0.3); audio.play('gore'); });
    if (f >= 70 && f < 300) {
      if (f % 3 === 0) { const p = worldPos(Math.random() < 0.5 ? def.model.rig.chest : def.model.rig.head); blood.aura(p.x, p.y, p.z, 2, TOXIC, 0.4, 0.015); blood.drip(p.x, p.y, p.z); }
      if (f % 20 === 0) { const p = worldPos(def.model.rig.chest); blood.gore(p.x, p.y, p.z, 6, ROT); }
      if (f >= 200) def.model.root.scale.set(1 + rot * 0.15, Math.max(0.12, 1 - (f - 200) / 110), 1 + rot * 0.15);
    }
    ctx.once('cloud', 210, () => toxicCloud(vfx, dx, 0.5, 1.4, 2.5));
    ctx.once('pool', 230, () => { blood.pool(dx, 0.1, 2.0); audio.play('gore'); });
    if (f < 60) cam.setCine(V((ax + dx) / 2, 1.5, 2.6), V(dx, 1.4, 0), 2.5);
    else if (f < 200) cam.setCine(V(dx + dir * 1.0, 1.4, 2.8), V(dx, 1.15, 0), 2);
    else cam.setCine(V(dx + dir * 1.2, 1.4, 3.2), V(dx, 0.4, 0), 2.5);
  },
  // ---------------- PESTILUS: Último Experimento (GDD) — força o frasco goela abaixo; o corpo incha e explode
  ultimo_experimento(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x;
    pose(att, f < 70 ? 'grab_s' : f < 90 ? 'throwAxe_s' : f < 230 ? 'stance' : 'winPestilus', { speed: 8 });
    pose(def, f < 30 ? 'dizzy' : f < 70 ? 'dangle' : 'writhe', { lift: f >= 30 && f < 70 ? 0.25 : 0, speed: 12 });
    ctx.once('a', 1, () => { audio.play('throw'); ctx.view.darken(3.6); });
    ctx.once('drink', 40, () => { const p = worldPos(def.model.rig.head); blood.spark(p.x, p.y, p.z, 30, TOXIC, 0.8); audio.play('magic'); });
    if (f >= 90 && f < 170) {
      const k = (f - 90) / 80, ch = def.model.rig.chest, hd = def.model.rig.head;
      ch.scale.setScalar(1 + k * 0.9); hd.scale.setScalar(1 + k * 0.4);
      if (f % 10 === 0) { audio.play('heartbeat'); blood.aura(dx, 1.2, 0, 6, TOXIC, 0.5, 0.01); }
      if (f === 130) tintModel(def.model, 0x6a8a20, 0.4, 0x305000, 0.6);
    }
    ctx.once('boom', 172, () => {
      shatter(ctx, 1.7, TOXIC);
      const p = worldPos(def.model.rig.chest);
      blood.burst(p.x, p.y, p.z, dir, 200, 2.0); blood.gore(p.x, p.y, p.z, 45, ROT); blood.spark(p.x, p.y, p.z, 60, TOXIC, 2);
      toxicCloud(vfx, dx, 1.1, 2.2, 3);
      audio.play('explosion'); audio.play('gore'); cam.shake(0.8); ctx.hud.flash(); ctx.view.flash(0x70ff30, 50, 0.7, dx, 1.2, 1);
      def.model.root.visible = false;
    });
    ctx.once('pool', 190, () => blood.pool(dx, 0.1, 2.2));
    if (f < 172) cam.setCine(V((ax + dx) / 2 + dir * 0.3, 1.5, 2.5), V(dx, 1.3, 0), 2.5);
    else cam.setCine(V(dx + dir * 1.8, 1.4, 4.0), V(dx, 0.8, 0), 3);
  },
  // ---------------- PESTILUS: Enxame Faminto (nome proposto) — ratos e corvos devoram o oponente até o osso
  enxame_faminto(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(att, f < 40 ? 'castLow_w' : f < 220 ? 'castLow_s' : 'winPestilus', { speed: 5 });
    pose(def, f < 70 ? 'dizzy' : f < 200 ? 'writhe' : 'lying', f >= 200 ? { lie: 1, speed: 3 } : { speed: 14 });
    ctx.once('a', 1, () => { audio.play('magic'); ctx.view.darken(4); });
    if (!state.rats && f >= 30) {
      state.rats = [];
      for (let i = 0; i < 18; i++) {
        const r = rat(); r.scale.setScalar(1.7); const z0 = (Math.random() - 0.5) * 1.2, x0 = ax - dir * (0.2 + Math.random() * 0.8), delay = Math.random() * 0.5;
        r.position.set(x0, 0.05, z0); r.lookAt(dx, 0.05, 0);
        vfx.add(r, 5, (o, age) => {
          const k = Math.max(0, Math.min(1, (age - delay) / 0.9));
          const tx = dx + Math.sin(i * 1.7 + age * 6) * 0.25, tz = Math.cos(i * 1.3 + age * 6) * 0.25;
          o.position.x = lerp(x0, tx, k); o.position.z = lerp(z0, tz, k);
          o.position.y = 0.05 + (k >= 1 ? Math.min(1.3, (age - delay - 0.9) * 0.8) * ((i % 3) / 2) : Math.abs(Math.sin(age * 30)) * 0.02);
          if (k >= 1) o.lookAt(dx, o.position.y + 0.3, 0);
          if (Math.random() < 0.06) blood.aura(o.position.x, o.position.y + 0.05, o.position.z, 1, 0xff3020, 0.05, 0);
        });
        state.rats.push(r);
      }
      audio.play('whoosh');
    }
    if (!state.crows && f >= 90) {
      state.crows = [];
      for (let i = 0; i < 7; i++) {
        const c = crow(); vfx.add(c, 4, (o, age) => { const a = age * 3 + i; o.position.set(dx + Math.cos(a) * (0.6 + (i % 3) * 0.2), 1.3 + Math.sin(a * 1.3) * 0.4 + (i % 2) * 0.4, Math.sin(a) * 0.6); o.lookAt(dx, 1.2, 0); flap(o, age + i); });
        state.crows.push(c);
      }
    }
    if (f >= 80 && f < 220 && f % 5 === 0) { const p = worldPos([def.model.rig.chest, def.model.rig.hipA, def.model.rig.head, def.model.rig.shB][f % 4]); blood.burst(p.x, p.y, p.z, Math.random() < 0.5 ? dir : -dir, 10, 0.6); if (f % 15 === 0) { blood.gore(p.x, p.y, p.z, 4, FLESH); audio.play('gore'); } }
    ctx.once('bone', 170, () => tintModel(def.model, 0xd8ccb0, 0.7, 0x000000, 0));
    ctx.once('pool', 200, () => { blood.pool(dx, 0.1, 1.9); audio.play('land', { heavy: true }); });
    if (f < 70) cam.setCine(V(mid, 0.6, 3.2), V(mid, 0.3, 0), 2.5);
    else cam.setCine(V(dx + dir * 1.2 + Math.sin(f * 0.015), 1.3, 2.8), V(dx, 0.9, 0), 2.5);
  },
  // ---------------- PESTILUS: Dissecação (nome proposto) — prende, abre o tórax e remove os membros
  dissecacao(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x;
    pose(att, f < 200 ? (Math.floor(f / 10) % 2 ? 'claw_s' : 'claw_w') : 'winPestilus', { speed: 14 });
    pose(def, f < 30 ? 'dizzy' : f < 220 ? 'crucified' : 'lying', f >= 220 ? { lie: 1, speed: 3 } : { lift: Math.min(0.2, f * 0.01), speed: 6 });
    ctx.once('a', 1, () => { audio.play('heartbeat'); ctx.view.darken(4.4); });
    for (const [t, y, r] of [[40, 1.3, 0.9], [60, 1.1, -0.9], [80, 1.25, 0]]) ctx.once('c' + t, t, () => { slashArc(vfx, dx - dir * 0.1, y, 0.12, [0, 0, r], TOXIC, 0.35, 0.3); blood.burst(dx, y, 0.1, -dir, 40, 0.9); audio.play('hit', { slash: true }); });
    ctx.once('open', 100, () => { const p = worldPos(def.model.rig.chest); blood.gore(p.x, p.y, p.z, 30, FLESH); blood.burst(p.x, p.y, p.z, -dir, 120, 1.3); audio.play('gore'); cam.shake(0.3); });
    ctx.once('armA', 140, () => { const r = def.model.rig; goreCap(r.chest, [r.dims.shoulder, r.dims.torso * 0.42, 0], 0.07, glowRed()); vfx.detach(r.shA, V(-dir * 0.03, 0.05, 0.03), V(0.1, 0.1, 0.2), { restY: 0.08, bounce: 0.2 }); const p = worldPos(r.shA); blood.burst(p.x, p.y, p.z, -dir, 60, 1.2); audio.play('gore'); });
    ctx.once('armB', 175, () => { const r = def.model.rig; goreCap(r.chest, [-r.dims.shoulder, r.dims.torso * 0.42, 0], 0.07, glowRed()); vfx.detach(r.shB, V(-dir * 0.03, 0.06, -0.03), V(0.2, 0.1, 0.1), { restY: 0.08, bounce: 0.2 }); const p = worldPos(r.shB); blood.burst(p.x, p.y, p.z, -dir, 60, 1.2); audio.play('gore'); cam.shake(0.3); });
    if (f > 100 && f < 260 && f % 3 === 0) { const p = worldPos(def.model.rig.chest); blood.drip(p.x, p.y, p.z + 0.1); }
    ctx.once('pool', 225, () => { blood.pool(dx, 0.1, 1.7); audio.play('land', { heavy: true }); });
    if (f < 200) cam.setCine(V((ax + dx) / 2 + dir * 0.2, 1.5, 2.2), V(dx, 1.2, 0), 2.5);
    else cam.setCine(V(ax - dir * 0.6, 1.7, 3.2), V(ax, 1.4, 0), 2);
  },
});

Object.assign(SUPERS, {
  // ---------------- NYMERA: Inverno Eterno (nome proposto) — nevasca + lanças de gelo; o oponente fica preso no gelo
  inverno_eterno(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(att, f < 30 ? 'castUp_w' : f < 120 ? 'cast_s' : 'castUp_s', { speed: 6 });
    pose(def, f < 125 ? (f > 30 && f % 20 < 5 ? 'hitHigh' : 'frozen') : 'tumble', { speed: 20, lift: f >= 125 ? 0.4 : 0 });
    ctx.once('fx', 1, () => { audio.play('super'); audio.play('freeze'); ctx.hud.flash(0.4); ctx.view.darken(2.4); });
    ctx.once('blk', 24, () => { state.block = iceBlock(vfx, dx, 2.15, 1.75); });
    if (f >= 24 && f < 60) growIce(state.block, (f - 24) / 30);
    if (f % 2 === 0) blood.aura(mid + (Math.random() - 0.5) * 4, 3, (Math.random() - 0.5) * 2, 3, 0xe8faff, 0.2, -0.03);
    [40, 60, 80, 100].forEach((h, i) => ctx.once('l' + i, h - 10, () => {
      const l = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.8, 6), iceMat(0.9));
      const a = -0.9 + i * 0.6, from = V(dx + Math.cos(a) * 3 * -dir, 1.2 + Math.sin(a) * 1.5 + 1, 0.4), to = V(dx, 1.2, 0);
      l.position.copy(from); l.lookAt(to); l.rotateX(Math.PI / 2);
      vfx.add(l, 10 / 60 + 0.05, (o, age) => o.position.lerpVectors(from, to, Math.min(1, age * 6)));
      ctx.once('lh' + i, h, () => { blood.spark(dx, 1.2, 0, 30, ICE, 1.3); blood.burst(dx, 1.2, 0, dir, 20, 0.8); audio.play('hit', { slash: true }); cam.shake(0.2); });
    }));
    ctx.once('boom', 125, () => { if (state.block) state.block.visible = false; blood.spark(dx, 1.1, 0, 120, 0xd8f4ff, 2.0); blood.burst(dx, 1.2, 0, dir, 80, 1.4); audio.play('explosion'); cam.shake(0.6); ctx.hud.flash(); ctx.view.flash(0xbfe8ff, 40, 0.6, dx, 1.3, 1); });
    const ang = f * 0.03;
    cam.setCine(V(mid + Math.sin(ang) * 3.2 * dir, 1.5, Math.cos(ang) * 3.2), V(dx, 1.2, 0), 3);
  },
  // ---------------- NYMERA: Túmulo de Gelo (nome proposto) — estacas fecham um sarcófago e implodem
  tumulo_gelo(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(att, f < 30 ? 'castLow_w' : f < 140 ? 'castLow_s' : 'winNymera', { speed: 6 });
    pose(def, f < 140 ? (f > 50 && f < 60 ? 'hitHigh' : 'frozen') : 'tumble', { speed: 20, lift: f >= 140 ? Math.min(1, (f - 140) * 0.05) : Math.min(0.5, Math.max(0, f - 50) * 0.02) });
    ctx.once('fx', 1, () => { audio.play('super'); ctx.hud.flash(0.4); ctx.view.darken(2.8); });
    for (let i = 0; i < 8; i++) ctx.once('sp' + i, 20 + i * 4, () => { const a = (i / 8) * Math.PI * 2; iceSpike(vfx, dx + Math.cos(a) * 0.7, Math.sin(a) * 0.5, 2.4, -Math.cos(a) * 0.35, 2.2); audio.play('freeze'); });
    ctx.once('lock', 54, () => { cam.shake(0.3); blood.burst(dx, 1.2, 0, dir, 40, 1); audio.play('hit', { heavy: true }); });
    if (f > 60 && f < 140 && f % 4 === 0) blood.aura(dx, 0.4 + Math.random() * 2, 0, 3, ICE, 0.6, 0.01);
    ctx.once('boom', 140, () => { blood.spark(dx, 1.3, 0, 140, 0xd8f4ff, 2.2); blood.burst(dx, 1.4, 0, dir, 110, 1.6); audio.play('explosion'); cam.shake(0.7); ctx.hud.flash(); ctx.view.flash(0x9ae0ff, 50, 0.7, dx, 1.4, 1); blood.pool(dx, 0.2, 1.0); });
    cam.setCine(V(mid + dir * 0.4 - Math.sin(f * 0.012) * 2.6 * dir, 1.0 + f * 0.006, 3.8), V(dx, 1.3, 0), 3);
  },
  // ---------------- PESTILUS: Pandemia (nome proposto) — nuvem pestilenta que se expande e corrói
  pandemia(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(att, f < 30 ? 'castUp_w' : 'castUp_s', { speed: 6 });
    const hits = [40, 62, 84, 106];
    pose(def, f < 130 ? (hits.some((h) => f >= h && f < h + 8) ? 'writhe' : 'dizzy') : 'tumble', { speed: 18, lift: f >= 130 ? 0.3 : 0 });
    ctx.once('fx', 1, () => { audio.play('super'); audio.play('magic'); ctx.hud.flash(0.4); ctx.view.darken(2.6); });
    ctx.once('cl', 20, () => { toxicCloud(vfx, mid, 1.0, 2.6, 2.3); toxicCloud(vfx, dx, 1.4, 1.8, 2.1, '#a0ff50'); });
    hits.forEach((h, i) => ctx.once('h' + i, h, () => { blood.spark(dx, 1.1 + i * 0.1, 0, 30, TOXIC, 1.2); blood.burst(dx, 1.2, 0, i % 2 ? dir : -dir, 25, 0.8); audio.play('hit'); cam.shake(0.2); }));
    if (f % 3 === 0) blood.aura(dx, 0.3 + Math.random() * 2, 0, 3, TOXIC, 0.8, 0.02);
    ctx.once('boom', 130, () => { blood.spark(dx, 1.2, 0, 120, TOXIC, 2.0); blood.burst(dx, 1.2, 0, dir, 100, 1.6); audio.play('explosion'); cam.shake(0.6); ctx.hud.flash(); ctx.view.flash(0x70ff30, 50, 0.6, dx, 1.3, 1); });
    cam.setCine(V(mid + Math.sin(f * 0.025) * 3.4 * dir, 1.6, Math.cos(f * 0.025) * 3.4), V(mid, 1.2, 0), 3);
  },
  // ---------------- PESTILUS: Praga Negra (nome proposto) — revoada de corvos bica o oponente até cair
  praga_negra(ctx) {
    const { f, att, def, dir, cam, blood, vfx, audio, state } = ctx;
    const ax = att.x, dx = def.x, mid = (ax + dx) / 2;
    pose(att, f < 30 ? 'cast_w' : f < 140 ? 'cast_s' : 'winPestilus', { speed: 6 });
    const peck = f > 40 && f < 140 && f % 12 < 4;
    pose(def, f < 140 ? (peck ? 'hitHigh' : 'block') : 'tumble', { speed: 22, lift: f >= 140 ? 0.4 : 0 });
    ctx.once('fx', 1, () => { audio.play('super'); ctx.hud.flash(0.4); ctx.view.darken(2.8); });
    if (!state.crows && f >= 20) {
      state.crows = [];
      for (let i = 0; i < 14; i++) {
        const c = crow(); c.scale.setScalar(1.5); const from = V(ax - dir * 0.5, 2.6 + Math.random(), (Math.random() - 0.5) * 2);
        vfx.add(c, 2.4, (o, age) => {
          const k = Math.min(1, age * 1.6), a = age * (4 + i * 0.2) + i;
          const to = V(dx + Math.cos(a) * (0.4 + (i % 4) * 0.15), 0.9 + (i % 5) * 0.2 + Math.sin(a * 2) * 0.2, Math.sin(a) * 0.5);
          o.position.lerpVectors(from, to, k); o.lookAt(dx, 1.2, 0); flap(o, age + i);
          if (Math.random() < 0.15) blood.aura(o.position.x, o.position.y, o.position.z, 1, 0x60ff20, 0.05, 0);
          if (ctx.f > 140) o.position.y += (ctx.f - 140) * 0.06;
        });
        state.crows.push(c);
      }
      audio.play('whoosh');
    }
    if (peck && f % 12 === 1) { blood.burst(dx, 1.0 + Math.random() * 0.8, 0, Math.random() < 0.5 ? dir : -dir, 20, 0.8); audio.play('hit', { slash: true }); }
    ctx.once('boom', 140, () => { blood.burst(dx, 1.2, 0, dir, 100, 1.5); blood.spark(dx, 1.2, 0, 60, 0x60ff20, 1.6); audio.play('explosion'); cam.shake(0.5); ctx.hud.flash(); blood.pool(dx, 0.2, 1.0); });
    cam.setCine(V(mid - Math.sin(f * 0.02) * 3.4 * dir, 1.5 + f * 0.004, 3.8), V(dx, 1.3, 0), 3);
  },
});
