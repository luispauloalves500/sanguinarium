// Arenas: Coliseu Carmesim e Catedral Profana (geometria procedural).
import * as THREE from 'three';
import { sandTexture, stoneWallTexture, tileTexture, stainedGlassTexture, lavaTexture, glowSprite } from './textures.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function add(g, geo, mat, pos, rot = [0, 0, 0], shadow = { cast: false, receive: true }) {
  const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.rotation.set(...rot);
  m.castShadow = shadow.cast; m.receiveShadow = shadow.receive; g.add(m); return m;
}

export function buildArena(id, scene, quality) {
  return id === 'catedral' ? catedral(scene, quality) : coliseu(scene, quality);
}

function coliseu(scene, quality) {
  const g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color(0x1a0505);
  scene.fog = new THREE.Fog(0x2a0806, 16, 48);
  const updaters = [];
  // chão de areia ensanguentada
  const floor = add(g, new THREE.CircleGeometry(15, 48), std(0xffffff, { map: sandTexture(), roughness: 0.95 }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  floor.name = 'floor';
  // muro da arena
  const wallTex = stoneWallTexture('#3a2420', '#140a08'); wallTex.repeat.set(10, 1);
  add(g, new THREE.CylinderGeometry(15, 15, 3.2, 48, 1, true), std(0xffffff, { map: wallTex, side: THREE.BackSide }), [0, 1.6, 0]);
  // arquibancadas em degraus
  const standMat = std(0x2a1a18, { roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    add(g, new THREE.CylinderGeometry(15.6 + i * 1.6, 15.6 + i * 1.6, 0.9, 48, 1, true, Math.PI * 0.55, Math.PI * 0.9), std(0x1f1412, { side: THREE.BackSide }), [0, 3.2 + i * 0.95, 0]);
    add(g, new THREE.RingGeometry(15 + i * 1.6, 16.6 + i * 1.6, 48, 1, Math.PI * 0.05, Math.PI * 0.9), standMat, [0, 3.65 + i * 0.95, 0], [-Math.PI / 2, 0, 0]);
  }
  // multidão demoníaca (instanciada) com olhos brilhantes
  const nCrowd = quality === 'baixa' ? 220 : 520;
  const crowd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 0.9, 0.35), std(0x150b0b, { roughness: 1 }), nCrowd);
  const eyes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0xff3a10 }), nCrowd);
  const horns = new THREE.InstancedMesh(new THREE.ConeGeometry(0.06, 0.25, 4), std(0x2a1410), nCrowd * 2);
  const seats = [];
  for (let i = 0; i < nCrowd; i++) {
    const row = i % 5; const th = -Math.PI * (0.06 + Math.random() * 0.88);
    const r = 16.2 + row * 1.6 + Math.random() * 0.3;
    seats.push({ x: Math.cos(th) * r, z: Math.sin(th) * r, y: 4.1 + row * 0.95, ph: Math.random() * 6, sp: 4 + Math.random() * 6 });
  }
  g.add(crowd); g.add(eyes); g.add(horns);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
  let excite = 0;
  updaters.push((dt, t) => {
    excite = Math.max(0, excite - dt * 0.5);
    for (let i = 0; i < seats.length; i++) {
      const s = seats[i];
      const bob = Math.abs(Math.sin(t * s.sp * (0.4 + excite) + s.ph)) * (0.08 + excite * 0.35);
      q.setFromAxisAngle(up, Math.atan2(-s.x, -s.z));
      m4.compose(v.set(s.x, s.y + bob, s.z), q, sc); crowd.setMatrixAt(i, m4);
      m4.compose(v.set(s.x * 0.985, s.y + bob + 0.28, s.z * 0.985), q, sc); eyes.setMatrixAt(i, m4);
      m4.compose(v.set(s.x * 0.99 + 0.12, s.y + bob + 0.55, s.z * 0.99), q, sc); horns.setMatrixAt(i * 2, m4);
      m4.compose(v.set(s.x * 0.99 - 0.12, s.y + bob + 0.55, s.z * 0.99), q, sc); horns.setMatrixAt(i * 2 + 1, m4);
    }
    crowd.instanceMatrix.needsUpdate = eyes.instanceMatrix.needsUpdate = horns.instanceMatrix.needsUpdate = true;
  });
  // poços de lava
  const lavaTex = lavaTexture();
  const lavaMat = new THREE.MeshBasicMaterial({ map: lavaTex, color: 0xffffff });
  for (const x of [-6.2, 6.2]) {
    add(g, new THREE.CircleGeometry(2.0, 24), lavaMat, [x, 0.03, -7.2], [-Math.PI / 2, 0, 0]);
    add(g, new THREE.TorusGeometry(2.0, 0.22, 6, 24), std(0x1a0c08), [x, 0.08, -7.2], [-Math.PI / 2, 0, 0]);
    const pl = new THREE.PointLight(0xff4a10, 22, 11, 1.6); pl.position.set(x, 1.0, -7.2); g.add(pl);
    updaters.push((dt, t) => { pl.intensity = 18 + Math.sin(t * 7 + x) * 4 + Math.sin(t * 13) * 2; });
  }
  updaters.push((dt) => { lavaTex.offset.x += dt * 0.02; lavaTex.offset.y += dt * 0.013; });
  // pilares com tochas
  const pillarMat = std(0x3a2a26, { map: stoneWallTexture('#3a2a26', '#1a100c') });
  const glow = new THREE.SpriteMaterial({ map: glowSprite('#ff9030'), blending: THREE.AdditiveBlending, depthWrite: false });
  for (const x of [-12, -6.5, 6.5, 12]) {
    const z = -Math.sqrt(Math.max(0, 14.2 ** 2 - x * x));
    add(g, new THREE.CylinderGeometry(0.45, 0.55, 5.5, 10), pillarMat, [x, 2.75, z], [0, 0, 0], { cast: true, receive: true });
    add(g, new THREE.ConeGeometry(0.3, 0.4, 8, 1, true), std(0x222222, { metalness: 0.6 }), [x, 5.7, z + 0.2], [Math.PI, 0, 0]);
    const sp = new THREE.Sprite(glow); sp.position.set(x, 6.1, z + 0.2); sp.scale.set(1.6, 2.2, 1); g.add(sp);
    updaters.push((dt, t) => { sp.scale.y = 2.0 + Math.sin(t * 15 + x) * 0.3; });
  }
  // lua de sangue
  const moon = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 16), new THREE.MeshBasicMaterial({ color: 0xb0200a, fog: false }));
  moon.position.set(-14, 22, -40); g.add(moon);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ff2010'), blending: THREE.AdditiveBlending, fog: false, depthWrite: false }));
  halo.position.copy(moon.position); halo.scale.set(22, 22, 1); g.add(halo);
  // luzes
  const hemi = new THREE.HemisphereLight(0xff9a80, 0x200404, 0.9); g.add(hemi);
  const key = new THREE.DirectionalLight(0xffc0a0, 2.2); key.position.set(4, 10, 7); key.castShadow = quality !== 'baixa';
  setupShadow(key); g.add(key); g.add(key.target);
  const rim = new THREE.DirectionalLight(0xff2010, 1.6); rim.position.set(-6, 5, -8); g.add(rim);
  return { group: g, id: 'coliseu', update: (dt, t) => updaters.forEach((u) => u(dt, t)), cheer: (k) => { excite = Math.min(1.5, excite + k); }, emberColor: 0xff6a20, bloodTint: 1 };
}

function catedral(scene, quality) {
  const g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color(0x07050c);
  scene.fog = new THREE.Fog(0x120a1e, 14, 40);
  const updaters = [];
  add(g, new THREE.PlaneGeometry(40, 18), std(0xffffff, { map: tileTexture(), roughness: 0.35, metalness: 0.25 }), [0, 0, -2], [-Math.PI / 2, 0, 0]).name = 'floor';
  // tapete ritual
  add(g, new THREE.PlaneGeometry(3, 12), std(0x4a0610, { roughness: 0.95 }), [0, 0.006, -6], [-Math.PI / 2, 0, 0]);
  const wallTex = stoneWallTexture('#2c2834', '#120f16'); wallTex.repeat.set(6, 3);
  const wallMat = std(0xffffff, { map: wallTex, roughness: 0.9 });
  add(g, new THREE.PlaneGeometry(40, 16), wallMat, [0, 8, -9]);
  add(g, new THREE.PlaneGeometry(18, 16), wallMat, [-16, 8, -2], [0, Math.PI / 2, 0]);
  add(g, new THREE.PlaneGeometry(18, 16), wallMat, [16, 8, -2], [0, -Math.PI / 2, 0]);
  // vitrais góticos (arco ogival)
  const lights = [];
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 7;
    const shape = new THREE.Shape();
    shape.moveTo(-1.3, 0); shape.lineTo(-1.3, 4); shape.quadraticCurveTo(-1.3, 5.6, 0, 6.6); shape.quadraticCurveTo(1.3, 5.6, 1.3, 4); shape.lineTo(1.3, 0); shape.closePath();
    const geo = new THREE.ShapeGeometry(shape, 12);
    // UV manual para mapear a textura no arco
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let k = 0; k < pos.count; k++) uv.setXY(k, (pos.getX(k) + 1.3) / 2.6, pos.getY(k) / 6.6);
    const glass = new THREE.MeshBasicMaterial({ map: stainedGlassTexture(i), color: 0xffffff });
    add(g, geo, glass, [x, 3.2, -8.95]);
    add(g, new THREE.TorusGeometry(1.45, 0.12, 6, 20, Math.PI), std(0x1a1720), [x, 7.2, -8.9]);
    // feixe de luz volumétrico falso
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 2.4, 10, 12, 1, true), new THREE.MeshBasicMaterial({ color: i === 1 ? 0xff6050 : 0x6070ff, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(x * 0.8, 4.5, -5); beam.rotation.x = 0.55; g.add(beam);
    lights.push(beam);
  }
  // colunas góticas
  const colMat = std(0x37323c, { roughness: 0.75 });
  for (const x of [-12, -8.5, 8.5, 12]) for (const z of [-7.5]) {
    add(g, new THREE.CylinderGeometry(0.5, 0.5, 11, 12), colMat, [x, 5.5, z], [0, 0, 0], { cast: true, receive: true });
    add(g, new THREE.BoxGeometry(1.4, 0.5, 1.4), colMat, [x, 0.25, z]);
    add(g, new THREE.BoxGeometry(1.3, 0.4, 1.3), colMat, [x, 11, z]);
  }
  // altar ritualístico com velas
  add(g, new THREE.BoxGeometry(3.2, 1.1, 1.3), std(0x2a2430), [0, 0.55, -7.2], [0, 0, 0], { cast: true, receive: true });
  add(g, new THREE.BoxGeometry(3.3, 0.06, 1.4), std(0x6a0a12, { roughness: 0.9 }), [0, 1.12, -7.2]);
  add(g, new THREE.BoxGeometry(0.15, 1.6, 0.15), std(0x8a7030, { metalness: 0.8, roughness: 0.3 }), [0, 1.95, -7.4]);
  add(g, new THREE.BoxGeometry(0.9, 0.12, 0.12), std(0x8a7030, { metalness: 0.8, roughness: 0.3 }), [0, 2.2, -7.4], [0, 0, Math.PI]);
  const flameMat = new THREE.SpriteMaterial({ map: glowSprite('#ffb040'), blending: THREE.AdditiveBlending, depthWrite: false });
  const candles = [];
  for (let i = 0; i < 9; i++) {
    const x = -1.4 + i * 0.35, h = 0.2 + (i % 3) * 0.12;
    add(g, new THREE.CylinderGeometry(0.04, 0.04, h, 6), std(0xe8dcc0), [x, 1.15 + h / 2, -6.85]);
    const f = new THREE.Sprite(flameMat); f.position.set(x, 1.2 + h + 0.05, -6.85); f.scale.set(0.25, 0.4, 1); g.add(f); candles.push(f);
  }
  const altarLight = new THREE.PointLight(0xff9040, 14, 9, 1.5); altarLight.position.set(0, 2, -6.3); g.add(altarLight);
  updaters.push((dt, t) => { altarLight.intensity = 12 + Math.sin(t * 11) * 2 + Math.sin(t * 23) * 1; candles.forEach((c, i) => { c.scale.y = 0.35 + Math.sin(t * 17 + i) * 0.06; }); });
  // estátuas encapuzadas sobre pedestais
  const statueMat = std(0x55525a, { roughness: 0.6 });
  for (const x of [-4.2, 4.2]) {
    const s = new THREE.Group(); s.position.set(x, 0, -7.6); g.add(s);
    add(s, new THREE.BoxGeometry(1.2, 1.4, 1.2), colMat, [0, 0.7, 0], [0, 0, 0], { cast: true, receive: true });
    add(s, new THREE.ConeGeometry(0.55, 2.4, 10), statueMat, [0, 2.6, 0], [0, 0, 0], { cast: true, receive: true });
    add(s, new THREE.SphereGeometry(0.28, 10, 8), statueMat, [0, 3.9, 0.05]);
    add(s, new THREE.ConeGeometry(0.33, 0.7, 10), statueMat, [0, 4.15, -0.05]);
    // asas de pedra
    add(s, new THREE.BoxGeometry(0.1, 1.8, 0.9), statueMat, [x > 0 ? -0.45 : 0.45, 3.0, -0.3], [0.2, 0, x > 0 ? 0.5 : -0.5]);
    add(s, new THREE.BoxGeometry(0.1, 1.8, 0.9), statueMat, [x > 0 ? 0.45 : -0.45, 3.0, -0.3], [0.2, 0, x > 0 ? -0.5 : 0.5]);
    const eye = new THREE.PointLight(0xff2020, 2.5, 3); eye.position.set(0, 3.95, 0.5); s.add(eye);
  }
  // luzes
  g.add(new THREE.HemisphereLight(0x8070c0, 0x100810, 0.8));
  const key = new THREE.DirectionalLight(0xc8b8ff, 2.0); key.position.set(-3, 10, 6); key.castShadow = quality !== 'baixa';
  setupShadow(key); g.add(key); g.add(key.target);
  const red = new THREE.PointLight(0xff2030, 10, 14, 1.4); red.position.set(0, 4, -3); g.add(red);
  updaters.push((dt, t) => { lights.forEach((b, i) => { b.material.opacity = 0.045 + Math.sin(t * 0.7 + i) * 0.015; }); });
  return { group: g, id: 'catedral', update: (dt, t) => updaters.forEach((u) => u(dt, t)), cheer: () => {}, emberColor: 0x9070ff, bloodTint: 1 };
}

function setupShadow(l) {
  l.shadow.mapSize.set(1024, 1024);
  const c = l.shadow.camera; c.left = -10; c.right = 10; c.top = 8; c.bottom = -4; c.near = 1; c.far = 30;
  l.shadow.bias = -0.0008;
}
