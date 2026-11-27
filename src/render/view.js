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

const GTEX = {};
const glowTex = (c) => GTEX[c] || (GTEX[c] = glowSprite(c));

export class GameView {
  constructor(canvas, settings, audio, hud) {
    this.settings = settings; this.audio = audio; this.hud = hud;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.quality !== 'baixa', powerPreference: 'high-performance', preserveDrawingBuffer: !!settings.preserve });
    this.basePR = Math.min(window.devicePixelRatio || 1, settings.quality === 'alta' ? 2 : settings.quality === 'baixa' ? 1 : 1.25);
    this.resScale = 1;
    this.renderer.setPixelRatio(this.basePR);
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
    // luz de clarão reutilizável (evita criar luzes em tempo real, que recompilam todos os shaders)
    this.flashLight = new THREE.PointLight(0xff2020, 0, 14); this.flashLight.position.set(0, 1.5, 1); this.scene.add(this.flashLight);
    this.flashT = 0; this.flashDur = 1; this.flashPeak = 0;
    this._v = new THREE.Vector3();
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

  setResolutionScale(k) {
    this.resScale = k;
    this.renderer.setPixelRatio(this.basePR * k);
    this.resize();
  }
  setShadows(on) {
    if (this.renderer.shadowMap.enabled === on) return;
    this.renderer.shadowMap.enabled = on;
    this.scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.needsUpdate = true; }); });
  }
  // clarão de luz (cinemáticas/explosões) usando a luz persistente
  flash(color, intensity, dur, x = 0, y = 1.5, z = 1) {
    this.flashLight.color.setHex(color); this.flashLight.position.set(x, y, z);
    this.flashPeak = intensity; this.flashDur = dur; this.flashT = dur;
  }
  // pré-compila shaders para não travar no primeiro golpe/efeito
  warmup() { try { this.renderer.compile(this.scene, this.cam.camera); } catch (e) { /* opcional */ } }

  loadArena(id, area = 0) {
    if (this.arenaId === id && this.arenaArea === area) return;
    if (this.arena) { this.scene.remove(this.arena.group); dispose(this.arena.group); }
    this.arena = buildArena(id, this.scene, this.settings.quality, area);
    this.arenaId = id; this.arenaArea = area;
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
      if (this.arena && this.arena.onEvent) this.arena.onEvent(e);
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
          else if (e.kind === 'special') A.play(e.who !== undefined && match.fighters[e.who].ch.magicSfx ? 'magic' : 'heavyWhoosh');
          if (e.id === 'corrente' || e.id === 'prisao') A.play('chain');
          break;
        }
        case 'proj': A.play('proj', { kind: e.kind }); if (e.kind === 'quake') { cam.shake(0.5); A.play('land', { heavy: true }); } break;
        case 'clash': B.spark(e.x, e.y, 0.2, 30, 0xff8040, 2); A.play('clash'); cam.shake(0.15); break;
        case 'teleport': { const f = match.fighters[e.who]; B.aura(f.x, 1, 0, 40, f.ch.aura || 0xff1838, 1.2, 0.03); A.play('teleport'); break; }
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
        case 'counterStance': { const ch = match.fighters[e.who].ch; this.hud.message((e.name || 'Véu Escarlate').toUpperCase() + '!', 'small', 50); B.aura(e.x, 1, 0, 50, ch.aura || 0xff1838, 1.2, 0.03); A.play(ch.magicSfx ? 'teleport' : 'clash'); break; }
        case 'armor': B.spark(e.x, e.y, 0.2, 18, 0xffc060, 1.6); A.play('block'); this.hud.message('SUPERARMADURA', 'small', 30); cam.shake(0.12); break;
        case 'quake': cam.shake(0.45); A.play('land', { heavy: true }); B.spark(e.x, 0.1, 0.2, 30, 0xff8040, 1.8); break;
        case 'freeze': A.play('freeze'); break;
        case 'poison': { const f = match.fighters[e.who]; B.aura(f.x, 1.2, 0, 6, 0x70ff30, 0.4, 0.02); if (e.left < 16) B.spark(f.x, 1.2, 0.2, 6, 0x70ff30, 0.5); break; }
        case 'burst': B.spark(e.x, 0.15, 0.2, 30, 0x70ff30, 1.4); A.play('explosion'); cam.shake(0.15); break;
        case 'pull': A.play('chain'); break;
        case 'jump': A.play('jump'); break;
        case 'dodge': A.play('whoosh'); break;
        case 'denied': this.hud.message(e.text, 'small', 50); break;
        case 'fatalHint': this.hud.message(e.text, 'small', 40); break;
        case 'superHit': this.cineCtx = this.newCtx('super', e.id); break;
        case 'fatality': this.cineCtx = this.newCtx('fatal', e.id); A.play('heartbeat'); break;
        case 'ko': this.cam.shake(0.3); A.play('explosion'); break;
        // ---- arenas interativas
        case 'interact':
          if (e.kind === 'vault') { A.play('chain'); A.play('jump'); this.hud.message('CORRENTE DO MURO', 'small', 40); }
          else if (e.kind === 'swing') { A.play('chain'); A.play('heavyWhoosh'); this.hud.message('CORRENTE DA FORJA!', 'small', 45); }
          else if (e.kind === 'spirit') { A.play('teleport'); B.aura(e.x, 1.2, -0.6, 50, 0x6a9cff, 1.4, 0.04); this.hud.message('ESPÍRITO ANCESTRAL!', 'small', 50); }
          else { A.play('heavyWhoosh'); this.hud.message('ESTÁTUA DO CARRASCO!', 'small', 50); }
          break;
        case 'statueDown': {
          cam.shake(0.45); A.play('land', { heavy: true }); A.play('explosion');
          const x0 = e.side * 7.5;
          for (let i = 0; i < 6; i++) B.spark(x0 - e.side * (0.5 + i * 0.55), 0.15, -1.4, 10, 0xb0a8b8, 1.1);
          break;
        }
        case 'hazard':
          cam.shake(0.35); A.play('explosion'); A.play('gore');
          if (e.kind === 'shatter') {
            // Estátua do Guardião: estilhaços de pedra e o espírito do guardião se dispersa
            for (let i = 0; i < 5; i++) B.spark(e.x - e.side * (0.8 + i * 0.1), 0.4 + i * 0.4, -0.1, 14, 0xa8a4b0, 1.6);
            B.aura(e.x - e.side * 0.9, 1.2, -0.1, 40, 0x6a9cff, 1.6, 0.05);
          } else {
            B.spark(e.x, 0.6, 0.35, 40, e.kind === 'lava' ? 0xff7020 : 0xffa040, 2.2);
            B.aura(e.x - e.side * 0.6, 1.0, 0.2, 30, 0xff5010, 1.6, 0.05);
          }
          this.hud.message(e.name.toUpperCase() + '!', 'big', 60);
          break;
        case 'transition':
          cam.shake(0.6); A.play('explosion'); A.play('gore'); this.hud.flash(0.35);
          this.hud.message(e.name.toUpperCase() + '!', 'big', 90);
          break;
        case 'areaChange':
          this.loadArena(match.opts.arena, e.area);
          this.blood.clearAll(); this.warmup();
          this.hud.showStageName(e.name.toUpperCase(), 200);
          A.play('land', { heavy: true });
          break;
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
    this.cam.cineTall = Math.max(0, Math.max(match.fighters[src.att].ch.height || 1.9, match.fighters[src.def].ch.height || 1.9) - 2.0);
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
    if (match.stage && (match.stage.area || 0) !== (this.arenaArea || 0)) this.loadArena(match.opts.arena, match.stage.area || 0);
    if (this.arena && this.arena.sync) this.arena.sync(match.stage);
    let cinematic = this.runCinematic(match);
    if (!cinematic && match.phase === 'transition' && match.stage && match.stage.trans) {
      // câmera da transição: acompanha a vítima arremessada para fora e depois desce no novo cenário
      const tr = match.stage.trans, d = match.fighters[tr.def];
      if (tr.f >= 38 && this._transFx !== match.frame - tr.f) {
        // vítima atravessa o portão/piso: estilhaços e sangue
        this._transFx = match.frame - tr.f;
        for (let i = 0; i < 4; i++) this.blood.spark(d.x + tr.side * 0.3, 0.4 + i * 0.45, 0.2, 18, ({ catedral: 0x9890a0, templo: 0x7a6a5a, forja: 0xff7a30 })[match.opts.arena] || 0x8a5a40, 1.8);
        this.blood.burst(d.x, 1.0, 0.1, tr.side, 70, 1.4);
        this.cam.shake(0.7); this.audio.play('explosion'); this.audio.play('land', { heavy: true });
      }
      if (tr.f < 90) this.cam.setCine(new THREE.Vector3(d.x - tr.side * 2.4, 1.6 + tr.f * 0.01, 5.0), new THREE.Vector3(d.x + tr.side * 0.6, Math.max(0.6, d.y + 0.8), 0), 3);
      else this.cam.setCine(new THREE.Vector3(0, 4.5 - Math.min(1, (tr.f - 90) / 50) * 2.6, 7.5), new THREE.Vector3(0, 1.0, 0), 2.5);
      cinematic = true;
    }
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
    m.update(dt, this.time, { fwdSpeed: (f.vx || 0) * f.facing * 10 + (f.pushV || 0) * -f.facing * 6, jolt: v.flash || 0 });
    // flash de impacto
    if (v.flash > 0) { v.flash = Math.max(0, v.flash - dt * 8); }
    // sangramento contínuo com pouca vida
    if (tier >= 3 && Math.random() < dt * 6 && !f.hidden) {
      const wp = this._v; m.rig.chest.getWorldPosition(wp); this.blood.drip(wp.x + (Math.random() - 0.5) * 0.2, wp.y, wp.z + 0.1);
    }
    // fúria: chamas na arma / mãos
    if (f.furyActive > 0 && !f.hidden) {
      const tp = this._v; m.rig.weaponTip.getWorldPosition(tp);
      this.blood.aura(tp.x, tp.y, tp.z, 2, f.ch.aura || 0xff1030, 0.25, 0.03);
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
      const ice = !!f.frozenIce;
      if (ice && !v.iceBlock) {
        // v0.4: congelamento da Nymera — bloco de gelo em vez das correntes
        v.iceBlock = new THREE.Group();
        const im = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x2a6a9a, emissiveIntensity: 0.5, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.5, depthWrite: false });
        const bx = new THREE.Mesh(new THREE.BoxGeometry(0.95, f.ch.height + 0.2, 0.8), im); bx.position.y = (f.ch.height + 0.2) / 2; v.iceBlock.add(bx);
        const ed = new THREE.LineSegments(new THREE.EdgesGeometry(bx.geometry), new THREE.LineBasicMaterial({ color: 0xe8faff, transparent: true, opacity: 0.8 })); ed.position.copy(bx.position); v.iceBlock.add(ed);
        for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.5, 5), im); c.position.set((i - 2) * 0.2, f.ch.height + 0.3, (Math.random() - 0.5) * 0.5); c.rotation.z = (i - 2) * 0.2; v.iceBlock.add(c); }
        this.scene.add(v.iceBlock);
      }
      if (v.iceBlock) { v.iceBlock.visible = ice; v.iceBlock.position.set(f.x, 0, 0); }
      v.prison.visible = !ice; v.prison.position.set(f.x, 0, 0); v.prison.rotation.y += dt * 2;
    } else { if (v.prison) v.prison.visible = false; if (v.iceBlock) v.iceBlock.visible = false; }
    // veneno: bolhas verdes
    if (f.poison > 0 && Math.random() < 0.25) this.blood.aura(f.x + (Math.random() - 0.5) * 0.4, 0.6 + Math.random() * 1.0, 0, 1, 0x70ff30, 0.2, 0.02);
    // aura do Véu Escarlate / regeneração
    if (f.move && (f.move.id === 'veu' || f.move.id === 'regen') && f.mf % 2 === 0) this.blood.aura(f.x, 1.1, 0, 2, 0xff1838, 0.9, f.move.id === 'regen' ? 0.03 : 0);
    if (f.move && f.move.id === 'passo' && f.mf < 18) this.blood.aura(f.x - f.facing * 0.3, 1.1, 0, 3, 0x80a0ff, 0.6, 0);
    if (f.move && f.move.id === 'tormenta' && f.mf >= 10 && f.mf <= 40) { const tp = new THREE.Vector3(); m.rig.weaponTip.getWorldPosition(tp); this.blood.spark(tp.x, tp.y, tp.z, 1, 0xffc080, 0.4); }
    // Kazuro / Brakkor (v0.3)
    if (f.move) {
      const id = f.move.id, mf = f.mf;
      const tip = () => { const tp = new THREE.Vector3(); m.rig.weaponTip.getWorldPosition(tp); return tp; };
      if (f.charId === 'kazuro' && f.move.hits.some((h) => h.slash) && f.move.hits.some((h) => mf >= h.f0 - 2 && mf <= h.f1 + 1)) { const tp = tip(); this.blood.aura(tp.x, tp.y, tp.z, 2, 0x6090ff, 0.15, 0); }
      if ((id === 'investida' || id === 'passo_sombras' || id === 'tempestade') && mf < 16 && mf % 2 === 0) this.blood.aura(f.x - f.facing * 0.4, 1.0, 0, 2, 0x4060c0, 0.5, 0);
      if (id === 'reflexo' && mf % 3 === 0 && mf <= 24) this.blood.aura(f.x + f.facing * 0.3, 1.2, 0, 1, 0x80b0ff, 0.5, 0);
      if (id === 'iaijutsu' && mf === 14) { this.hud.flash(0.12); this.cam.shake(0.2); }
      if (id === 'sopro' && mf >= 12 && mf <= 36) { const hx = f.x + f.facing * 0.5, hy = f.ch.height * 0.9; for (let i = 0; i < 3; i++) this.blood.aura(hx + f.facing * Math.random() * 1.8, hy - Math.random() * 0.7, (Math.random() - 0.5) * 0.4, 1, i % 2 ? 0xff7010 : 0xffb030, 0.35, 0.02); }
      if (id === 'investida_touro' && mf >= 7 && mf <= 26 && mf % 2 === 0) { this.blood.spark(f.x - f.facing * 0.5, 0.05, 0.3, 2, 0x8a6a50, 0.6); }
      if (id === 'punho_magma' && mf >= 6 && mf <= 22) { const h = new THREE.Vector3(); m.rig.handA.getWorldPosition(h); this.blood.aura(h.x, h.y, h.z, 2, 0xff5010, 0.25, 0.02); }
      if (f.move.armor && mf >= f.move.armor[0] && mf <= f.move.armor[1] && mf % 3 === 0) this.blood.aura(f.x, 1.2, 0, 1, 0xffc060, 0.9, 0);
      if (id === 'salto' && mf === 34) { this.cam.shake(0.4); this.blood.spark(f.x + f.facing * 0.6, 0.1, 0.2, 26, 0xff9040, 1.6); this.audio.play('land', { heavy: true }); }
      // Nymera / Pestilus (v0.4)
      if (f.charId === 'nymera' && f.move.hits.some((h) => mf >= h.f0 - 2 && mf <= h.f1 + 1) && mf % 2 === 0) { const tp = tip(); this.blood.aura(tp.x, tp.y, tp.z, 1, 0x9ae0ff, 0.12, 0); }
      if ((id === 'deslize' || id === 'passo_glacial' || id === 'passo_glacial_ex') && mf < 20 && mf % 2 === 0) this.blood.aura(f.x - f.facing * 0.3, 0.3, 0, 3, 0xbfe8ff, 0.5, 0);
      if (id === 'nevasca' && mf >= 8 && mf <= 40) { for (let i = 0; i < 2; i++) this.blood.aura(f.x + (Math.random() - 0.5) * 2.6, 0.2 + Math.random() * 2, (Math.random() - 0.5) * 0.6, 1, 0xe8faff, 0.3, 0.02); }
      if (id === 'garra_inverno' && mf >= 6 && mf <= 16) { const h = new THREE.Vector3(); m.rig.handA.getWorldPosition(h); this.blood.aura(h.x, h.y, h.z, 2, 0x9ae0ff, 0.2, 0.02); }
      if (id === 'miasma' && mf >= 8 && mf <= 24) { for (let i = 0; i < 4; i++) this.blood.aura(f.x + (Math.random() - 0.5) * 2.4, 0.3 + Math.random() * 1.6, (Math.random() - 0.5) * 0.6, 1, 0x70ff30, 0.4, 0.03); if (mf === 10) { this.cam.shake(0.25); this.audio.play('explosion'); } }
      if ((id === 'bisturi' || id === 'frasco') && f.move.hits.some((h) => mf >= h.f0 - 1 && mf <= h.f1)) { const tp = tip(); this.blood.aura(tp.x, tp.y, tp.z, 2, 0x70ff30, 0.12, 0); }
      if (id === 'terremoto' && mf === 20) { this.blood.spark(f.x + f.facing * 0.8, 0.1, 0.2, 24, 0xff9040, 1.5); }
    }
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
      case 'slash': {
        // meia-lua espectral (Kazuro)
        const mat = new THREE.MeshBasicMaterial({ color: 0x80b0ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        const arc = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 4, 24, Math.PI), mat); arc.rotation.z = -Math.PI / 2 * p.facing; arc.scale.set(1, p.ex ? 1.5 : 1.1, 0.4); g.add(arc);
        const arc2 = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 4, 20, Math.PI), mat); arc2.rotation.z = arc.rotation.z; arc2.position.x = -p.facing * 0.15; g.add(arc2);
        const s = new THREE.Sprite(glowMat('#6090ff')); s.scale.set(1.2, 1.4, 1); g.add(s);
        break;
      }
      case 'fireball': {
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(p.ex ? 0.36 : 0.28, 1), em(0xff7010, 2.2)); g.add(core);
        const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(p.ex ? 0.5 : 0.4, 1), new THREE.MeshBasicMaterial({ color: 0xff3000, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
        g.add(shell); g.userData.shell = shell;
        const s = new THREE.Sprite(glowMat('#ff5010')); s.scale.set(1.9, 1.9, 1); g.add(s);
        break;
      }
      case 'quake': {
        const mat = new THREE.MeshStandardMaterial({ color: 0x3a2018, roughness: 1, emissive: 0x501800 });
        const n = p.ex ? 12 : 8;
        for (let i = 0; i < n; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(0.16 + Math.random() * 0.14, 0.5 + Math.random() * 0.6, 5), mat); r.position.set((i / (n - 1) - 0.5) * (p.box[2] - p.box[0]), 0.2, (Math.random() - 0.5) * 0.6); r.rotation.set((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.7); g.add(r); }
        const s = new THREE.Sprite(glowMat('#ff6010')); s.scale.set(p.box[2] - p.box[0], 0.8, 1); s.position.y = 0.15; g.add(s);
        break;
      }
      case 'spikes': {
        const mat = em(0xff1030, 0.9);
        for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.3, 5), mat); c.position.set((i - 2.5) * 0.18, 0.65, (Math.random() - 0.5) * 0.3); c.rotation.z = (i - 2.5) * 0.12; g.add(c); }
        break;
      }
      case 'spirit': {
        // v0.4: Espírito Ancestral do Templo — samurai fantasma azul-pálido (reaproveita o modelo placeholder do Kazuro)
        const ghost = buildFighter('kazuro', true);
        const gm = new THREE.MeshBasicMaterial({ color: 0x7aa8ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
        ghost.root.traverse((o) => { if (o.isMesh) { o.material = gm; o.castShadow = false; } });
        applyPose(ghost, POSES.dashSlash_s || POSES.katana_s, {});
        ghost.root.rotation.y = p.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
        g.add(ghost.root);
        const s = new THREE.Sprite(glowMat('#5a8cff')); s.scale.set(1.6, 2.6, 1); s.position.y = 1.0; g.add(s);
        break;
      }
      case 'icelance': {
        const im = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x4aa8ff, emissiveIntensity: 1.2, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.9 });
        const c = new THREE.Mesh(new THREE.ConeGeometry(p.ex ? 0.11 : 0.08, p.ex ? 1.3 : 1.0, 6), im); c.rotation.z = -Math.PI / 2 * p.facing; g.add(c);
        for (const s2 of [-1, 1]) { const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.35, 4), im); f2.position.set(-p.facing * 0.35, s2 * 0.07, 0); f2.rotation.z = -Math.PI / 2 * p.facing + s2 * 0.5; g.add(f2); }
        const s = new THREE.Sprite(glowMat('#80d8ff')); s.scale.set(1.5, 0.7, 1); g.add(s);
        break;
      }
      case 'icespikes': case 'trap': {
        const im = new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x2a7ab8, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.85 });
        if (p.fx === 'icespikes') for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.0 + Math.random() * 0.6, 5), im); c.position.set((i - 3) * 0.16, 0.6, (Math.random() - 0.5) * 0.35); c.rotation.z = (i - 3) * 0.14; g.add(c); }
        else {
          const ring = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.42, 6), new THREE.MeshBasicMaterial({ color: 0x80d8ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
          ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring); g.userData.trapRing = ring;
          for (let i = 0; i < 6; i++) { const a2 = i / 6 * Math.PI * 2; const c = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.18, 4), im); c.position.set(Math.cos(a2) * 0.3, 0.08, Math.sin(a2) * 0.3); c.rotation.set(Math.sin(a2) * 0.5, 0, -Math.cos(a2) * 0.5); g.add(c); }
        }
        break;
      }
      case 'bomb': {
        const glass = new THREE.MeshStandardMaterial({ color: 0x0a1a08, emissive: 0x70ff30, emissiveIntensity: 1.4, roughness: 0.1, transparent: true, opacity: 0.9 });
        g.add(new THREE.Mesh(new THREE.SphereGeometry(p.ex ? 0.16 : 0.12, 10, 8), glass));
        const n = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a30, metalness: 0.8 })); n.position.y = 0.13; g.add(n);
        const s = new THREE.Sprite(glowMat('#70ff30')); s.scale.set(0.9, 0.9, 1); g.add(s);
        break;
      }
      case 'cloud': {
        const mat = new THREE.SpriteMaterial({ map: glowTex('#70ff30'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.45 });
        const w = (p.box[2] - p.box[0]), h = p.box[3];
        for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(mat); s.position.set((Math.random() - 0.5) * w, 0.3 + Math.random() * h * 0.7, (Math.random() - 0.5) * 0.6); s.scale.setScalar(0.9 + Math.random() * 0.7); s.userData.ph = Math.random() * 6; g.add(s); }
        g.userData.cloudMat = mat;
        break;
      }
      case 'rats': {
        const m2 = new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.8 });
        const eye = new THREE.MeshBasicMaterial({ color: 0xff3020 });
        const n = p.ex ? 9 : 6;
        for (let i = 0; i < n; i++) { const r = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), m2); b.scale.set(1.8, 0.7, 1); r.add(b); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.16, 4), m2); t.rotation.z = Math.PI / 2 - 0.3; t.position.x = -p.facing * 0.17; r.add(t); const e2 = new THREE.Mesh(new THREE.SphereGeometry(0.01, 4, 3), eye); e2.position.set(p.facing * 0.09, 0.03, 0.02); r.add(e2); r.position.set((Math.random() - 0.5) * 0.8, 0.05, (Math.random() - 0.5) * 0.5); r.userData.ph = Math.random() * 6; g.add(r); }
        break;
      }
      case 'syringe': {
        const glass = new THREE.MeshStandardMaterial({ color: 0x0a1a08, emissive: 0x70ff30, emissiveIntensity: 1.3, transparent: true, opacity: 0.9 });
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), glass); b.rotation.z = Math.PI / 2; g.add(b);
        const nd = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 4), new THREE.MeshStandardMaterial({ color: 0xc0c0c8, metalness: 0.9 })); nd.rotation.z = Math.PI / 2; nd.position.x = p.facing * 0.24; g.add(nd);
        const s = new THREE.Sprite(glowMat('#70ff30')); s.scale.set(0.8, 0.4, 1); g.add(s);
        break;
      }
      case 'crows': {
        const cm = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.6 });
        for (let i = 0; i < (p.ex ? 4 : 3); i++) { const c = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), cm); b.scale.set(1, 0.8, 1.6); c.add(b); for (const s2 of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.12), cm); w.position.x = s2 * 0.16; w.userData.s = s2; c.add(w); } c.position.set((i - 1) * 0.3, i * 0.15, (Math.random() - 0.5) * 0.4); c.rotation.x = 0.6; g.add(c); }
        break;
      }
      case 'clone': {
        const ghost = buildFighter(match.fighters[p.owner].charId, false);
        const och = match.fighters[p.owner].ch;
        const gm = new THREE.MeshBasicMaterial({ color: och.aura || 0xff1030, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
        ghost.root.traverse((o) => { if (o.isMesh) { o.material = gm; o.castShadow = false; } });
        applyPose(ghost, POSES[och.clonePose || 'lunge_s'], {});
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
      if (v && v.fx !== p.fx) { this.scene.remove(v.obj); dispose(v.obj); v = null; }
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
      if (p.fx === 'spirit') { o.position.y = 0.05 + Math.sin(this.time * 6) * 0.05; if (Math.random() < 0.6) this.blood.aura(p.x - p.facing * 0.4, 1 + Math.random() * 0.6, 0, 1, 0x6a9cff, 0.25, 0.02); }
      if (p.fx === 'slash' && Math.random() < 0.7) this.blood.aura(p.x - p.facing * 0.3, p.y, 0, 1, 0x6090ff, 0.2, 0);
      if (p.fx === 'fireball') { o.rotation.y += dt * 6; o.rotation.x += dt * 4; o.userData.shell.scale.setScalar(1 + Math.sin(this.time * 25) * 0.12); if (Math.random() < 0.9) this.blood.aura(p.x - p.facing * 0.3, p.y, 0, 1, 0xff5010, 0.15, 0.02); }
      if (p.fx === 'quake') { o.position.y = 0; const k = p.delay > 0 ? 0.2 : Math.min(1, 0.4 + (10 - p.life) * 0.2); o.scale.set(1, k, 1); if (Math.random() < 0.6) this.blood.spark(p.x + (Math.random() - 0.5) * 3, 0.1, 0.2, 1, 0xff8040, 0.8); }
      if (p.fx === 'icelance' && Math.random() < 0.8) this.blood.aura(p.x - p.facing * 0.4, p.y, 0, 1, 0xbfe8ff, 0.1, 0);
      if (p.fx === 'icespikes') { o.position.y = 0; const k = p.delay > 0 ? 0.1 + (1 - p.delay / 16) * 0.15 : 1; o.scale.set(p.ex ? 1.5 : 1, k, 1); }
      if (p.fx === 'trap') { o.position.y = 0; o.visible = true; o.scale.setScalar(p.delay > 0 ? 0.3 : 1); if (o.userData.trapRing) o.userData.trapRing.material.opacity = 0.35 + Math.sin(this.time * 6) * 0.2; }
      if (p.fx === 'bomb') { o.rotation.z -= dt * 10 * p.facing; if (Math.random() < 0.6) this.blood.aura(p.x, p.y, 0, 1, 0x70ff30, 0.1, 0.01); }
      if (p.fx === 'cloud') { o.position.y = 0; const life0 = p.life0 || (p.life0 = p.life); const k = Math.min(1, (life0 - p.life) / 12) * Math.min(1, p.life / 20); if (p.delay > 0) o.scale.setScalar(0.3); else o.scale.setScalar(0.6 + k * 0.5); o.userData.cloudMat.opacity = 0.45 * (p.delay > 0 ? 0.3 : k); o.children.forEach((c) => { c.material.rotation = this.time * 0.5 + c.userData.ph; c.position.y += Math.sin(this.time * 2 + c.userData.ph) * 0.002; }); }
      if (p.fx === 'rats') { o.position.y = 0; o.children.forEach((r) => { r.position.y = 0.05 + Math.abs(Math.sin(this.time * 28 + r.userData.ph)) * 0.04; }); }
      if (p.fx === 'crows') { o.visible = p.delay <= 0; o.children.forEach((c, i) => c.children.forEach((w) => { if (w.userData.s) w.rotation.z = w.userData.s * Math.sin(this.time * 30 + i) * 0.9; })); }
      if (p.fx === 'spikes') { o.position.y = 0; const k = p.delay > 0 ? 0.15 + (1 - p.delay / 8) * 0.2 : 1; o.scale.set(p.ex ? 1.6 : 1, k, 1); }
    }
    for (const [id, v] of this.proj) {
      if (!seen.has(id)) {
        if (v.fx === 'spear' || v.fx === 'axe' || v.fx === 'chains' || v.fx === 'fireball' || v.fx === 'slash') this.blood.spark(v.obj.position.x, v.obj.position.y, 0.2, 10, 0xff4020, 1);
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
      v.model.setDamageTier(0); v.model.setFury(false); v.model.update(dt, this.time, {});
    });
    this.cam.clearCine();
    this.common(dt, dummies, 'showroom');
  }

  common(dt, fighters, mode) {
    if (this.flashT > 0) { this.flashT = Math.max(0, this.flashT - dt); this.flashLight.intensity = this.flashPeak * (this.flashT / this.flashDur); } else this.flashLight.intensity = 0;
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
