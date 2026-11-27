// Renderização Three.js: cena, arenas, lutadores, projéteis, sangue, cinemáticas. Lê a simulação, nunca a altera.
import * as THREE from 'three';
import { buildFighter, applyPose } from '../characters/models.js';
import { Animator } from '../animation/animator.js';
import { POSES } from '../animation/poses.js';
import { buildArena } from './arenas.js';
import { BloodSystem } from '../blood/blood.js';
import { CameraRig } from '../camera/camera.js';
import { Vfx, dispose } from './vfx.js';
import { glowSprite } from './textures.js';
import { FATALITIES, SUPERS } from '../fatalities/timelines.js';
import * as C from '../core/constants.js';

const GLOW = {};
function glowMat(color) {
  if (!GLOW[color]) { GLOW[color] = new THREE.SpriteMaterial({ map: glowSprite(color), blending: THREE.AdditiveBlending, depthWrite: false }); GLOW[color].userData.shared = true; }
  return GLOW[color];
}

export class GameView {
  constructor(canvas, settings, audio, hud) {
    this.settings = settings; this.audio = audio; this.hud = hud;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.quality !== 'baixa', powerPreference: 'high-performance', preserveDrawingBuffer: !!settings.preserve });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.quality === 'alta' ? 2 : 1.25));
    this.renderer.shadowMap.enabled = settings.quality !== 'baixa';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.cam = new CameraRig(1);
    this.cam.reduceShake = !!settings.reduceShake;
    this.blood = new BloodSystem(this.scene, settings.blood);
    this.vfx = new Vfx(this.scene);
    this.vf = [];
    this.proj = new Map();
    this.arena = null; this.arenaId = null;
    this.time = 0; this.dark = 0; this.cineCtx = null;
    const embersGeo = new THREE.BufferGeometry();
    const n = 160, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 30; pos[i * 3 + 1] = Math.random() * 10; pos[i * 3 + 2] = -Math.random() * 12 + 2; }
    embersGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.embers = new THREE.Points(embersGeo, new THREE.PointsMaterial({ color: 0xff6a20, size: 0.06, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.scene.add(this.embers);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const c = this.renderer.domElement;
    const w = c.clientWidth || window.innerWidth, h = c.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.cam.camera.aspect = w / h;
    this.cam.camera.fov = w / h < 1 ? 58 : 38; // retrato no celular: campo de visão maior
    this.cam.camera.updateProjectionMatrix();
  }

  loadArena(id) {
    if (this.arenaId === id) return;
    if (this.arena) { this.scene.remove(this.arena.group); dispose(this.arena.group); }
    this.arena = buildArena(id, this.scene, this.settings.quality);
    this.arenaId = id;
    this.embers.material.color.setHex(this.arena.emberColor);
  }

  setFighters(ids) {
    for (const v of this.vf) { this.scene.remove(v.model.root); v.model.dispose(); }
    this.vfx.clear();
    this.vf = ids.map((id, i) => {
      const model = buildFighter(id, i === 1 && ids[0] === ids[1]);
      model.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      this.scene.add(model.root);
      const v = { id, model, anim: new Animator(id), sim: null, yaw: i === 0 ? Math.PI / 2 : -Math.PI / 2, chain: null, prison: null, aura: 0 };
      return v;
    });
    for (const p of this.proj.values()) { this.scene.remove(p.obj); }
    this.proj.clear();
    this.blood.clearAll();
    this.cineCtx = null;
  }

  // ------------------------------------------------------------ eventos da simulação
  handleEvents(match, events) {
    const A = this.audio, B = this.blood, cam = this.cam;
    for (const e of events) {
      switch (e.type) {
        case 'hit': {
          const att = match.fighters[e.att];
          const dir = e.proj ? Math.sign(match.fighters[e.def].x - att.x) || 1 : att.facing;
          const amt = Math.min(90, 8 + e.dmg * 0.45) * (e.counter ? 1.3 : 1);
          B.burst(e.x, e.y, 0.05, dir, amt, e.heavy ? 1.4 : 1);
          B.spark(e.x, e.y, 0.2, e.heavy ? 14 : 6, e.counter ? 0xffe060 : 0xffffff, 1.2);
          if (e.heavy) { cam.shake(e.cinematic ? 0.3 : 0.18); B.decals.add(e.x + dir * 0.6, (Math.random() - 0.5) * 0.6, 0.12 + e.dmg * 0.002, new THREE.Color(0x3a0000), 3, 1.6); }
          A.play('hit', { heavy: e.heavy, slash: e.slash });
          if (this.arena) this.arena.cheer(e.heavy ? 0.4 : 0.15);
          const v = this.vf[e.def]; if (v) v.flash = 1;
          if (e.counter) this.hud.message('CONTRA-ATAQUE!', 'small', 50);
          if (e.combo >= 2) this.hud.combo(e.att, e.combo, match.fighters[e.def].comboDmg);
          break;
        }
        case 'block':
          B.spark(e.x, e.y, 0.2, e.perfect ? 22 : 10, e.perfect ? 0x60c0ff : 0xffd070, e.perfect ? 1.6 : 1);
          A.play('block', { perfect: e.perfect });
          if (e.perfect) this.hud.message('DEFESA PERFEITA', 'small', 50);
          break;
        case 'move': {
          const m = match.fighters[e.who].move;
          if (e.kind === 'normal') A.play(m && m.hits[0] && m.hits[0].heavy ? 'heavyWhoosh' : 'whoosh');
          else if (e.kind === 'special') A.play(e.who !== undefined && match.fighters[e.who].charId === 'lilith' ? 'magic' : 'heavyWhoosh');
          if (e.id === 'corrente' || e.id === 'prisao') A.play('chain');
          break;
        }
        case 'proj': A.play('proj', { kind: e.kind }); break;
        case 'clash': B.spark(e.x, e.y, 0.2, 30, 0xff8040, 2); A.play('clash'); cam.shake(0.15); break;
        case 'teleport': { const f = match.fighters[e.who]; B.aura(f.x, 1, 0, 40, 0xff1838, 1.2, 0.03); A.play('teleport'); break; }
        case 'heal': { const f = match.fighters[e.who]; if (e.frame % 3 === 0) B.aura(f.x, 1, 0, 3, 0xff4060, 0.9, 0.03); if (e.frame % 15 === 0) A.play('heal'); break; }
        case 'fury': { const f = match.fighters[e.who]; B.aura(f.x, 1, 0, 80, 0xff5010, 1.6, 0.05); A.play('fury'); this.hud.message(e.name.toUpperCase() + '!', 'big', 80); cam.shake(0.2); break; }
        case 'furyEnd': break;
        case 'super': this.hud.message(e.name.toUpperCase(), 'big', 70); A.play('super'); this.hud.flash(0.25); break;
        case 'ex': this.hud.message('POTENCIALIZADO', 'small', 40); { const f = match.fighters[e.who]; B.spark(f.x, 1.2, 0.2, 20, 0xffb030, 1.4); } break;
        case 'special': break;
        case 'throw': A.play('throw'); break;
        case 'tech': this.hud.message('ESCAPOU!', 'small', 50); A.play('tech'); B.spark(e.x, 1.2, 0.2, 14, 0xffffff); break;
        case 'land':
          A.play('land', { heavy: e.heavy });
          if (e.heavy) { cam.shake(0.12); const f = match.fighters[e.who]; if (f.hp < 500) B.pool(f.x, 0.1, 0.5 + (500 - f.hp) / 600); }
          break;
        case 'breaker': this.hud.message('QUEBRA DE COMBO!', 'big', 60); B.spark(e.x, 1.2, 0.2, 40, 0x60c0ff, 2); A.play('clash'); break;
        case 'counterStance': this.hud.message('VÉU ESCARLATE!', 'small', 50); B.aura(e.x, 1, 0, 50, 0xff1838, 1.2, 0.03); A.play('teleport'); break;
        case 'freeze': A.play('freeze'); break;
        case 'pull': A.play('chain'); break;
        case 'jump': A.play('jump'); break;
        case 'dodge': A.play('whoosh'); break;
        case 'denied': this.hud.message(e.text, 'small', 50); break;
        case 'fatalHint': this.hud.message(e.text, 'small', 40); break;
        case 'superHit': this.cineCtx = this.newCtx('super', e.id); break;
        case 'fatality': this.cineCtx = this.newCtx('fatal', e.id); A.play('heartbeat'); break;
        case 'ko': this.cam.shake(0.3); A.play('explosion'); break;
      }
    }
  }

  newCtx(kind, id) {
    return { kind, id, done: new Set(), state: {} };
  }

  runCinematic(match) {
    const c = this.cineCtx;
    const src = match.fatal && c && c.kind === 'fatal' ? match.fatal : match.cine && c && c.kind === 'super' ? match.cine : null;
    if (!src) return false;
    const fn = c.kind === 'fatal' ? FATALITIES[c.id] : SUPERS[c.id];
    if (!fn) return false;
    const att = this.vf[src.att], def = this.vf[src.def];
    const ctx = {
      f: src.f, att: this.wrap(att), def: this.wrap(def), dir: match.fighters[src.att].facing, cam: this.cam, blood: this.blood, vfx: this.vfx,
      audio: this.audio, hud: this.hud, view: this, state: c.state,
      once: (k, at, fn2) => { if (src.f >= at && !c.done.has(k)) { c.done.add(k); fn2(); } },
    };
    fn(ctx);
    return true;
  }
  wrap(v) { return { model: v.model, anim: v.anim, get x() { return v.sim.x; } }; }

  darken(sec) { this.dark = sec; }

  // ------------------------------------------------------------ quadro
  update(match, dt, events) {
    this.time += dt;
    if (events && events.length) this.handleEvents(match, events);
    for (const v of this.vf) v.anim.override = null;
    const cinematic = this.runCinematic(match);
    if (!cinematic) { this.cam.clearCine(); if (!match.fatal && !match.cine) this.cineCtx = null; }
    for (let i = 0; i < this.vf.length; i++) this.updateFighter(this.vf[i], match.fighters[i], match, dt);
    this.updateProjectiles(match, dt);
    if (match.phase === 'matchEnd' && !this.cineCtx) {
      const w = match.result && match.result.winner >= 0 ? match.fighters[match.result.winner] : null;
      if (w) this.cam.setCine(new THREE.Vector3(w.x, 1.7, 4.2), new THREE.Vector3(w.x, 1.3, 0), 1.2);
    }
    this.cam.zoom = match.phase === 'finish' ? 1.0 : 0;
    this.common(dt, match.fighters, 'fight');
  }

  updateFighter(v, f, match, dt) {
    v.sim = f;
    const m = v.model;
    const p = v.anim.update(f, match, this.time, Math.min(dt, 0.05));
    applyPose(m, p, v.anim);
    m.root.position.set(f.x, f.y, v.anim.zoff);
    const wantYaw = f.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    v.yaw += (wantYaw - v.yaw) * (1 - Math.exp(-dt * 18));
    m.root.rotation.y = v.yaw;
    m.root.visible = !f.hidden;
    const tier = f.hp <= 250 ? 3 : f.hp <= 500 ? 2 : f.hp <= 750 ? 1 : 0;
    m.setDamageTier(tier);
    m.setFury(f.furyActive > 0, this.time);
    // flash de impacto
    if (v.flash > 0) { v.flash = Math.max(0, v.flash - dt * 8); }
    // sangramento contínuo com pouca vida
    if (tier >= 3 && Math.random() < dt * 6 && !f.hidden) {
      const wp = new THREE.Vector3(); m.rig.chest.getWorldPosition(wp); this.blood.drip(wp.x + (Math.random() - 0.5) * 0.2, wp.y, wp.z + 0.1);
    }
    // fúria: chamas na arma / mãos
    if (f.furyActive > 0 && !f.hidden) {
      const tp = new THREE.Vector3(); m.rig.weaponTip.getWorldPosition(tp);
      this.blood.aura(tp.x, tp.y, tp.z, 2, f.charId === 'varkhan' ? 0xff6010 : 0xff1030, 0.25, 0.03);
    }
    // visual da Corrente da Morte
    const chainOn = f.move && f.move.id === 'corrente' && f.state === 'attack' && f.mf >= 8 && f.mf <= 24;
    if (chainOn) {
      if (!v.chain) {
        v.chain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 6), new THREE.MeshStandardMaterial({ color: 0x555a60, metalness: 0.9, roughness: 0.3, emissive: 0x300000 }));
        this.scene.add(v.chain);
      }
      const hand = new THREE.Vector3(); m.rig.handA.getWorldPosition(hand);
      const reach = f.mf <= 18 ? Math.min(3.4, (f.mf - 7) * 0.45) : Math.max(0.1, 3.4 - (f.mf - 18) * 0.6);
      const end = new THREE.Vector3(f.x + f.facing * (0.4 + reach), 1.3, 0);
      v.chain.position.copy(hand).lerp(end, 0.5);
      v.chain.scale.set(1, hand.distanceTo(end), 1);
      v.chain.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(hand).normalize());
      v.chain.visible = true;
    } else if (v.chain) v.chain.visible = false;
    // correntes da Prisão Infernal
    if (f.state === 'frozen') {
      if (!v.prison) {
        v.prison = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x40444a, metalness: 0.9, roughness: 0.3, emissive: 0x500000 });
        for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 6, 18), mat); t.rotation.x = Math.PI / 2; t.position.y = 0.6 + i * 0.45; v.prison.add(t); }
        this.scene.add(v.prison);
      }
      v.prison.visible = true; v.prison.position.set(f.x, 0, 0); v.prison.rotation.y += dt * 2;
    } else if (v.prison) v.prison.visible = false;
    // aura do Véu Escarlate / regeneração
    if (f.move && (f.move.id === 'veu' || f.move.id === 'regen') && f.mf % 2 === 0) this.blood.aura(f.x, 1.1, 0, 2, 0xff1838, 0.9, f.move.id === 'regen' ? 0.03 : 0);
    if (f.move && f.move.id === 'passo' && f.mf < 18) this.blood.aura(f.x - f.facing * 0.3, 1.1, 0, 3, 0x80a0ff, 0.6, 0);
    if (f.move && f.move.id === 'tormenta' && f.mf >= 10 && f.mf <= 40) { const tp = new THREE.Vector3(); m.rig.weaponTip.getWorldPosition(tp); this.blood.spark(tp.x, tp.y, tp.z, 1, 0xffc080, 0.4); }
    if (f.move && (f.move.id === 'julgamento' || f.move.id === 'ruptura') && f.mf === (f.move.id === 'julgamento' ? 21 : 18)) { this.cam.shake(0.25); this.blood.spark(f.x + f.facing * 1.4, 0.1, 0.2, 20, 0xff9040, 1.5); this.audio.play('land', { heavy: true }); }
  }

  // ------------------------------------------------------------ projéteis
  makeProj(p, match) {
    const g = new THREE.Group();
    const em = (c, e = 1.2) => new THREE.MeshStandardMaterial({ color: 0x220000, emissive: c, emissiveIntensity: e, metalness: 0.5, roughness: 0.4 });
    switch (p.fx) {
      case 'axe': {
        const h = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), em(0x802010, 0.6)); g.add(h);
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.4), em(0xff3010, 1.4)); b.position.set(0, 0.3, 0.18); g.add(b);
        const s = new THREE.Sprite(glowMat('#ff3010')); s.scale.set(1.4, 1.4, 1); g.add(s);
        break;
      }
      case 'chains': {
        const mat = em(0xff2000, 0.8);
        for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 5, 10), mat); const a = i / 6 * Math.PI * 2; t.position.set(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0); t.rotation.set(0, i % 2 ? Math.PI / 2 : 0, a); g.add(t); }
        const s = new THREE.Sprite(glowMat('#ff2000')); s.scale.set(1.3, 1.3, 1); g.add(s);
        break;
      }
      case 'wave': {
        const mat = new THREE.MeshStandardMaterial({ color: 0x3a2018, roughness: 1, emissive: 0x401000 });
        for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(0.14 + Math.random() * 0.1, 0.4 + Math.random() * 0.4, 5), mat); r.position.set((i - 1.5) * 0.22, 0.15, (Math.random() - 0.5) * 0.4); r.rotation.z = (Math.random() - 0.5) * 0.6; g.add(r); }
        const s = new THREE.Sprite(glowMat('#ff7020')); s.scale.set(1.6, 0.9, 1); s.position.y = 0.2; g.add(s);
        break;
      }
      case 'spear': {
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.07, 1.0, 6), em(0xff1030, 1.6)); c.rotation.z = -Math.PI / 2; g.add(c);
        const s = new THREE.Sprite(glowMat('#ff1030')); s.scale.set(1.5, 0.7, 1); g.add(s);
        break;
      }
      case 'rain': {
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.2, 6), em(0xff1030, 1.6)); c.rotation.z = Math.PI; g.add(c);
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 20), new THREE.MeshBasicMaterial({ color: 0xff1030, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; g.userData.ring = ring; this.scene.add(ring);
        break;
      }
      case 'spikes': {
        const mat = em(0xff1030, 0.9);
        for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.3, 5), mat); c.position.set((i - 2.5) * 0.18, 0.65, (Math.random() - 0.5) * 0.3); c.rotation.z = (i - 2.5) * 0.12; g.add(c); }
        break;
      }
      case 'clone': {
        const ghost = buildFighter(match.fighters[p.owner].charId, false);
        const gm = new THREE.MeshBasicMaterial({ color: 0xff1030, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
        ghost.root.traverse((o) => { if (o.isMesh) { o.material = gm; o.castShadow = false; } });
        applyPose(ghost, POSES.lunge_s, {});
        ghost.root.rotation.y = p.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
        g.add(ghost.root);
        break;
      }
    }
    this.scene.add(g);
    return { obj: g, fx: p.fx };
  }

  updateProjectiles(match, dt) {
    const seen = new Set();
    for (const p of match.projectiles) {
      seen.add(p.id);
      let v = this.proj.get(p.id);
      if (!v) { v = this.makeProj(p, match); this.proj.set(p.id, v); }
      const o = v.obj;
      o.position.set(p.x, p.y, 0);
      if (p.fx === 'axe') o.rotation.z -= dt * 22 * p.facing;
      if (p.fx === 'chains') o.rotation.z += dt * 8;
      if (p.fx === 'wave') { o.position.y = 0; o.children.forEach((c, i) => { c.position.y = 0.1 + Math.abs(Math.sin(this.time * 20 + i)) * 0.15; }); if (Math.random() < 0.5) this.blood.spark(p.x, 0.1, 0.2, 1, 0xff8040, 0.5); }
      if (p.fx === 'spear' && Math.random() < 0.8) this.blood.aura(p.x - p.facing * 0.4, p.y, 0, 1, 0xff1030, 0.1, 0);
      if (p.fx === 'rain') {
        o.visible = p.delay <= 0; o.position.y = p.y + 0.5;
        const r = o.userData.ring; r.position.set(p.x, 0.03, 0); r.scale.setScalar(1 + Math.sin(this.time * 20) * 0.1);
      }
      if (p.fx === 'spikes') { o.position.y = 0; const k = p.delay > 0 ? 0.15 + (1 - p.delay / 8) * 0.2 : 1; o.scale.set(p.ex ? 1.6 : 1, k, 1); }
    }
    for (const [id, v] of this.proj) {
      if (!seen.has(id)) {
        if (v.fx === 'spear' || v.fx === 'axe' || v.fx === 'chains') this.blood.spark(v.obj.position.x, v.obj.position.y, 0.2, 10, 0xff4020, 1);
        if (v.obj.userData.ring) { this.scene.remove(v.obj.userData.ring); dispose(v.obj.userData.ring); }
        this.scene.remove(v.obj); dispose(v.obj); this.proj.delete(id);
      }
    }
  }

  // ------------------------------------------------------------ vitrine (menus)
  showroom(ids, dt, poses = ['stance', 'stance']) {
    this.time += dt;
    if (this.vf.length !== 2 || this.vf[0].id !== ids[0] || this.vf[1].id !== ids[1]) this.setFighters(ids);
    const dummies = this._dummies || (this._dummies = [0, 1].map((i) => ({ idx: i, x: i ? 1.3 : -1.3, y: 0, facing: i ? -1 : 1, state: 'idle', sf: 0, hp: 1000, furyActive: 0, blocking: false, move: null, charId: ids[i], hidden: false })));
    dummies.forEach((d, i) => {
      d.charId = ids[i];
      const v = this.vf[i];
      v.anim.override = poses[i] === 'stance' ? null : { pose: POSES[poses[i]], lie: 0, spin: 0, zoff: 0, lift: poses[i] === 'winLilith' ? 0.3 : 0, tilt: 0, speed: 4 };
      const p = v.anim.update(d, { phase: 'menu' }, this.time, dt);
      applyPose(v.model, p, v.anim);
      v.model.root.position.set(d.x, 0, 0);
      v.model.root.rotation.y = d.facing > 0 ? Math.PI / 2 - 0.5 : -Math.PI / 2 + 0.5;
      v.model.root.visible = true;
      v.model.setDamageTier(0); v.model.setFury(false);
    });
    this.cam.clearCine();
    this.common(dt, dummies, 'showroom');
  }

  common(dt, fighters, mode) {
    this.blood.update(dt);
    this.vfx.update(dt);
    if (this.arena) this.arena.update(dt, this.time);
    const pos = this.embers.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { let y = pos.getY(i) + dt * 0.6; if (y > 10) y = 0; pos.setY(i, y); pos.setX(i, pos.getX(i) + Math.sin(this.time + i) * dt * 0.1); }
    pos.needsUpdate = true;
    if (this.dark > 0) this.dark -= dt;
    const targetExp = this.dark > 0 ? 0.45 : 1.05;
    this.renderer.toneMappingExposure += (targetExp - this.renderer.toneMappingExposure) * (1 - Math.exp(-dt * 4));
    this.cam.update(fighters, dt, mode, this.time);
    this.renderer.render(this.scene, this.cam.camera);
  }
}
