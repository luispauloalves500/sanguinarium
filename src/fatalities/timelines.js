// Timelines cinematográficas das finalizações (Sentenças de Sangue) e supergolpes.
// Sincronizam poses dos dois lutadores, câmera, áudio, VFX e visibilidade por quadro (60 Hz).
import * as THREE from 'three';
import { POSES } from '../animation/poses.js';
import { pentagramTexture } from '../render/textures.js';

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
      vfx.detach(neck, V(dir * 0.05, 0.13, 0.03), V(0.25, 0.1, 0.18));
      blood.burst(wp.x, wp.y, wp.z, dir, 140, 1.6);
      audio.play('gore'); audio.play('hit', { heavy: true, slash: true });
      cam.shake(0.45);
    });
    if (f > 131 && f < 230 && ctx.neckPos) {
      const np = new THREE.Vector3(); def.model.rig.chest.getWorldPosition(np); np.y += 0.32;
      blood.fountain(np.x, np.y, np.z, dir * 0.3, 1, 3, 1.1 - (f - 131) / 140);
    }
    if (f > 140 && f < 205) cam.setCine(V(dx + dir * 2.5, 1.2, 3.6), V(dx + dir * 1.2, 0.5, 0), 2);
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
      const light = new THREE.PointLight(0xff2020, 80, 14); light.position.set(dx, y, 1);
      vfx.add(light, 0.8, (o, age) => { o.intensity = 80 * (1 - age / 0.8); });
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
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.06, 2.6, 6), new THREE.MeshStandardMaterial({ color: 0x5a0008, emissive: 0xff1030, emissiveIntensity: 0.8, metalness: 0.4, roughness: 0.3 }));
      sp.position.set(dx + Math.sin(a) * 0.4, -1.3, Math.cos(a) * 0.3 - 0.15); sp.rotation.z = a * 0.6; sp.castShadow = true;
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
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.07, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x400008, emissive: 0xff1030, emissiveIntensity: 1.2 }));
      const target = new THREE.Vector3(def.x, 1.2 + Math.min(1, t * 0.012), 0);
      const from = target.clone().add(new THREE.Vector3(Math.cos(a) * 4, Math.sin(a) * 3 + 1, 0.5));
      sp.position.copy(from); sp.lookAt(target); sp.rotateX(Math.PI / 2);
      vfx.add(sp, 1.2, (o, age) => { const k = Math.min(1, age * 4); o.position.lerpVectors(from, target, k); if (age > 0.9) o.scale.setScalar(Math.max(0.01, 1 - (age - 0.9) * 3)); });
      audio.play('proj', { kind: 'spear' });
    });
    if (f % 2 === 0) blood.aura(def.x, 1.6, 0, 3, 0xff1838, 1.6, 0);
  },
};
