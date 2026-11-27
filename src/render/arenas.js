// Arenas: Coliseu Carmesim e Catedral Profana (geometria procedural).
import * as THREE from 'three';
import { sandTexture, stoneWallTexture, tileTexture, stainedGlassTexture, lavaTexture, glowSprite } from './textures.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function add(g, geo, mat, pos, rot = [0, 0, 0], shadow = { cast: false, receive: true }) {
  const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.rotation.set(...rot);
  m.castShadow = shadow.cast; m.receiveShadow = shadow.receive; g.add(m); return m;
}

// area 0 = cenário principal; area 1 = cenário após a transição (Fosso do Coliseu / Cripta Profana)
export function buildArena(id, scene, quality, area = 0) {
  let a;
  if (id === 'catedral') a = area ? cripta(scene, quality) : catedral(scene, quality);
  else a = area ? fosso(scene, quality) : coliseu(scene, quality);
  a.area = area;
  return a;
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
  const edges = edgeChains(g, updaters, pillarMat);
  const vents = edgeVents(g, updaters, 'lava');
  return { group: g, id: 'coliseu', update: (dt, t) => updaters.forEach((u) => u(dt, t)), cheer: (k) => { excite = Math.min(1.5, excite + k); }, emberColor: 0xff6a20, bloodTint: 1,
    onEvent: (e) => { if (e.type === 'interact' && e.kind === 'vault') edges.swing(e.side); if (e.type === 'hazard') vents.erupt(e.side); }, sync: () => {} };
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
    // olhos da estátua: brilho aditivo (sem luz real, mais leve)
    const eyeG = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ff2020'), blending: THREE.AdditiveBlending, depthWrite: false }));
    eyeG.position.set(0, 3.92, 0.32); eyeG.scale.set(0.7, 0.35, 1); s.add(eyeG);
  }
  // luzes
  g.add(new THREE.HemisphereLight(0x8070c0, 0x100810, 0.8));
  const key = new THREE.DirectionalLight(0xc8b8ff, 2.0); key.position.set(-3, 10, 6); key.castShadow = quality !== 'baixa';
  setupShadow(key); g.add(key); g.add(key.target);
  const red = new THREE.PointLight(0xff2030, 10, 14, 1.4); red.position.set(0, 4, -3); g.add(red);
  updaters.push((dt, t) => { lights.forEach((b, i) => { b.material.opacity = 0.045 + Math.sin(t * 0.7 + i) * 0.015; }); });
  const statues = edgeStatues(g, updaters, colMat, statueMat);
  const vents = edgeVents(g, updaters, 'brasa');
  return { group: g, id: 'catedral', update: (dt, t) => updaters.forEach((u) => u(dt, t)), cheer: () => {}, emberColor: 0x9070ff, bloodTint: 1,
    onEvent: (e) => { if (e.type === 'hazard') vents.erupt(e.side); }, sync: (st) => statues.sync(st) };
}

function setupShadow(l) {
  l.shadow.mapSize.set(1024, 1024);
  const c = l.shadow.camera; c.left = -10; c.right = 10; c.top = 8; c.bottom = -4; c.near = 1; c.far = 30;
  l.shadow.bias = -0.0008;
}

// ------------------------------------------------------------------ elementos interativos de borda
// Corrente do Muro (Coliseu/Fosso): poste com corrente pendurada em cada borda; balança ao ser usada.
function edgeChains(g, updaters, postMat) {
  const iron = std(0x3a3a40, { metalness: 0.85, roughness: 0.35 });
  const linkGeo = new THREE.TorusGeometry(0.075, 0.022, 5, 10);
  const swings = {};
  for (const side of [-1, 1]) {
    const x = side * 8.35, z = -0.9;
    add(g, new THREE.BoxGeometry(0.32, 3.8, 0.32), postMat, [x, 1.9, z], [0, 0, 0], { cast: true, receive: true });
    add(g, new THREE.BoxGeometry(1.25, 0.22, 0.24), postMat, [x - side * 0.5, 3.7, z]);
    add(g, new THREE.SphereGeometry(0.17, 8, 6), std(0xd8c8a8, { roughness: 0.7 }), [x, 3.98, z]); // caveira no topo
    const pivot = new THREE.Group(); pivot.position.set(x - side * 0.95, 3.6, z); g.add(pivot);
    for (let i = 0; i < 11; i++) {
      const l = new THREE.Mesh(linkGeo, iron); l.position.y = -0.13 * i - 0.08; l.rotation.y = i % 2 ? Math.PI / 2 : 0; pivot.add(l);
    }
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 5, 10, Math.PI * 1.4), iron); hook.position.y = -1.55; hook.rotation.z = Math.PI * 0.8; pivot.add(hook);
    swings[side] = { pivot, t: 99, amp: 0 };
  }
  updaters.push((dt, t) => {
    for (const side of [-1, 1]) {
      const s = swings[side]; s.t += dt;
      const a = s.amp * Math.exp(-s.t * 1.4) * Math.sin(s.t * 5.5);
      s.pivot.rotation.z = a + Math.sin(t * 0.9 + side) * 0.03;
    }
  });
  return { swing: (side) => { const s = swings[side]; if (s) { s.t = 0; s.amp = 0.9 * -side; } } };
}

// Perigo de borda: poço de lava (Coliseu) ou braseiro (Catedral). Entra em erupção no evento 'hazard'.
function edgeVents(g, updaters, kind) {
  const lava = kind === 'lava';
  const tex = lavaTexture();
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: lava ? 0xffffff : 0xffb070 });
  const fireMat = new THREE.SpriteMaterial({ map: glowSprite(lava ? '#ff5010' : '#ff8a30'), blending: THREE.AdditiveBlending, depthWrite: false });
  const vents = {};
  for (const side of [-1, 1]) {
    const x = side * 8.85, z = 0.35;
    if (lava) {
      add(g, new THREE.CircleGeometry(0.85, 20), mat, [x, 0.035, z], [-Math.PI / 2, 0, 0]);
      add(g, new THREE.TorusGeometry(0.85, 0.12, 6, 20), std(0x1a0c08), [x, 0.07, z], [-Math.PI / 2, 0, 0]);
      for (let i = 0; i < 4; i++) add(g, new THREE.BoxGeometry(1.6, 0.06, 0.07), std(0x222222, { metalness: 0.7 }), [x, 0.1, z - 0.5 + i * 0.33]); // grade
    } else {
      const bowl = std(0x2a2226, { metalness: 0.8, roughness: 0.4 });
      add(g, new THREE.CylinderGeometry(0.55, 0.3, 0.45, 12, 1, true), bowl, [x, 1.05, z]);
      add(g, new THREE.CircleGeometry(0.5, 12), mat, [x, 1.2, z], [-Math.PI / 2, 0, 0]);
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; add(g, new THREE.CylinderGeometry(0.04, 0.05, 1.0, 5), bowl, [x + Math.cos(a) * 0.25, 0.45, z + Math.sin(a) * 0.25], [Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25]); }
    }
    const fy = lava ? 0.4 : 1.55;
    const fire = new THREE.Sprite(fireMat); fire.position.set(x, fy, z); fire.scale.set(1.4, 1.0, 1); g.add(fire);
    const column = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(lava ? '#ff4008' : '#ff7020'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    column.position.set(x, fy + 1.6, z); column.scale.set(1.8, 4.5, 1); g.add(column);
    vents[side] = { fire, column, t: 99, fy };
  }
  updaters.push((dt, t) => {
    tex.offset.x += dt * 0.03; tex.offset.y += dt * 0.02;
    for (const side of [-1, 1]) {
      const v = vents[side]; v.t += dt;
      const k = v.t < 0.9 ? Math.sin((v.t / 0.9) * Math.PI) : 0;
      v.fire.scale.set(1.4 + k * 1.2, 1.0 + Math.sin(t * 13 + side) * 0.15 + k * 2, 1);
      v.column.material.opacity = k * 0.95; v.column.scale.set(1.6 + k * 0.8, 1 + k * 5, 1); v.column.position.y = v.fy + 0.5 + k * 2.4;
    }
  });
  return { erupt: (side) => { const v = vents[side]; if (v) v.t = 0; } };
}

// Estátua do Carrasco (Catedral/Cripta): tomba em direção ao centro quando ativada.
function edgeStatues(g, updaters, baseMat, stoneMat) {
  const statues = {};
  const THETA = 1.72;
  for (const side of [-1, 1]) {
    const x = side * 8.4, z = -0.55;
    add(g, new THREE.BoxGeometry(1.3, 0.8, 1.3), baseMat, [x, 0.4, z], [0, 0, 0], { cast: true, receive: true });
    const pivot = new THREE.Group(); pivot.position.set(x - side * 0.55, 0.8, z); g.add(pivot);
    const fig = new THREE.Group(); fig.position.x = side * 0.55; pivot.add(fig);
    add(fig, new THREE.ConeGeometry(0.62, 2.7, 10), stoneMat, [0, 1.35, 0], [0, 0, 0], { cast: true, receive: true }); // manto
    add(fig, new THREE.CylinderGeometry(0.34, 0.5, 0.9, 10), stoneMat, [0, 2.45, 0]); // ombros
    add(fig, new THREE.ConeGeometry(0.36, 0.95, 10), stoneMat, [0, 3.25, -0.02]); // capuz
    add(fig, new THREE.SphereGeometry(0.22, 10, 8), std(0x18161c), [0, 3.0, 0.14]); // rosto vazio
    const eye = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite('#ff2020'), blending: THREE.AdditiveBlending, depthWrite: false }));
    eye.position.set(0, 3.02, 0.36); eye.scale.set(0.55, 0.25, 1); fig.add(eye);
    // machado de pedra apoiado no ombro, lâmina voltada para o centro
    const axe = new THREE.Group(); axe.position.set(-side * 0.3, 2.3, 0.35); axe.rotation.z = side * 0.35; fig.add(axe);
    add(axe, new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), stoneMat, [0, 0.1, 0]);
    add(axe, new THREE.BoxGeometry(0.75, 0.6, 0.08), stoneMat, [-side * 0.35, 1.0, 0]);
    statues[side] = { pivot, eye, cur: 0 };
  }
  const st0 = { state: 'up', f: 0 };
  let last = { '-1': st0, '1': st0 };
  updaters.push((dt) => {
    for (const side of [-1, 1]) {
      const s = statues[side], L = last[side];
      let target = 0;
      if (L.state === 'falling') { const k = Math.min(1, L.f / 36); target = THETA * k * k; }
      else if (L.state === 'down') target = THETA;
      s.cur += (target - s.cur) * (L.state === 'up' ? 0.08 : 0.6);
      s.pivot.rotation.z = side * s.cur;
      s.eye.visible = s.cur < 0.2;
    }
  });
  return {
    sync(st) {
      if (!st) return;
      for (const side of [-1, 1]) {
        const act = st.statueAct && st.statueAct.find((a) => a.side === side);
        last[side] = { state: st.statues[side], f: act ? act.f : 0 };
      }
    },
  };
}

// ------------------------------------------------------------------ Fosso do Coliseu (após a transição)
function fosso(scene, quality) {
  const g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color(0x0c0202);
  scene.fog = new THREE.Fog(0x220402, 11, 32);
  const updaters = [];
  const rockTex = stoneWallTexture('#2a1a16', '#0a0504'); rockTex.repeat.set(8, 4);
  add(g, new THREE.PlaneGeometry(40, 18), std(0x8a6a60, { map: rockTex, roughness: 0.95 }), [0, 0, -2], [-Math.PI / 2, 0, 0]).name = 'floor';
  const lavaTex = lavaTexture();
  const lavaMat = new THREE.MeshBasicMaterial({ map: lavaTex });
  // rio de lava ao fundo e rachaduras no chão
  add(g, new THREE.PlaneGeometry(44, 2.6), lavaMat, [0, 0.02, -5.6], [-Math.PI / 2, 0, 0]);
  for (const [x, z, w, r] of [[-5, -2.6, 3.2, 0.3], [3.5, -3.1, 2.6, -0.4], [-1, -3.8, 2.2, 0.1], [6.5, -2.2, 1.8, 0.7]]) add(g, new THREE.PlaneGeometry(w, 0.09), lavaMat, [x, 0.012, z], [-Math.PI / 2, 0, r]);
  // paredes do fosso com cascatas de lava
  const wallTex = stoneWallTexture('#24140f', '#090403'); wallTex.repeat.set(8, 3);
  const wallMat = std(0xffffff, { map: wallTex, roughness: 0.95 });
  add(g, new THREE.PlaneGeometry(44, 14), wallMat, [0, 7, -7]);
  add(g, new THREE.PlaneGeometry(14, 14), wallMat, [-13, 7, -1], [0, Math.PI / 2, 0]);
  add(g, new THREE.PlaneGeometry(14, 14), wallMat, [13, 7, -1], [0, -Math.PI / 2, 0]);
  const fallTex = lavaTexture(); fallTex.repeat.set(1, 3);
  const fallMat = new THREE.MeshBasicMaterial({ map: fallTex });
  for (const x of [-7.5, 0.5, 8]) {
    add(g, new THREE.PlaneGeometry(1.4, 12), fallMat, [x, 6, -6.9]);
    const pl = new THREE.PointLight(0xff4a10, 16, 10, 1.6); pl.position.set(x, 1.5, -5); g.add(pl);
    updaters.push((dt, t) => { pl.intensity = 14 + Math.sin(t * 6 + x) * 3; });
  }
  updaters.push((dt) => { lavaTex.offset.x += dt * 0.03; fallTex.offset.y += dt * 0.5; });
  // gaiolas penduradas
  const iron = std(0x2c2c30, { metalness: 0.85, roughness: 0.4 });
  const cages = [];
  for (const [x, z, y] of [[-4.5, -3.4, 4.2], [2.8, -3.8, 4.8], [9.5, -3.0, 4.4]]) {
    const c = new THREE.Group(); c.position.set(x, y, z); g.add(c);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; add(c, new THREE.CylinderGeometry(0.025, 0.025, 1.6, 4), iron, [Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45]); }
    add(c, new THREE.CylinderGeometry(0.5, 0.5, 0.06, 10), iron, [0, -0.8, 0]);
    add(c, new THREE.ConeGeometry(0.52, 0.4, 10), iron, [0, 1.0, 0]);
    add(c, new THREE.CylinderGeometry(0.02, 0.02, 6, 4), iron, [0, 4.2, 0]);
    add(c, new THREE.SphereGeometry(0.16, 8, 6), std(0xd0c0a0), [0.1, -0.6, 0.1]); // caveira do prisioneiro
    cages.push(c);
  }
  updaters.push((dt, t) => cages.forEach((c, i) => { c.rotation.z = Math.sin(t * 0.8 + i * 2) * 0.05; c.rotation.y += dt * 0.1; }));
  // ossos espalhados
  const bone = std(0xcfc2a4, { roughness: 0.7 });
  const rnd = mulberry(7);
  for (let i = 0; i < 18; i++) {
    const x = (rnd() - 0.5) * 22, z = -2 - rnd() * 3;
    if (rnd() < 0.35) add(g, new THREE.SphereGeometry(0.13, 7, 5), bone, [x, 0.1, z]);
    else add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), bone, [x, 0.04, z], [Math.PI / 2, rnd() * 3, 0]);
  }
  const postMat = std(0x3a2a26, { map: stoneWallTexture('#3a2a26', '#1a100c') });
  const edges = edgeChains(g, updaters, postMat);
  const vents = edgeVents(g, updaters, 'lava');
  g.add(new THREE.HemisphereLight(0xff8060, 0x1a0202, 0.75));
  const key = new THREE.DirectionalLight(0xffb090, 1.7); key.position.set(3, 10, 7); key.castShadow = quality !== 'baixa';
  setupShadow(key); g.add(key); g.add(key.target);
  const rim = new THREE.DirectionalLight(0xff3010, 1.8); rim.position.set(0, 3, -8); g.add(rim);
  return { group: g, id: 'coliseu', update: (dt, t) => updaters.forEach((u) => u(dt, t)), cheer: () => {}, emberColor: 0xff7a20, bloodTint: 1,
    onEvent: (e) => { if (e.type === 'interact' && e.kind === 'vault') edges.swing(e.side); if (e.type === 'hazard') vents.erupt(e.side); }, sync: () => {} };
}

// ------------------------------------------------------------------ Cripta Profana (após a transição)
function cripta(scene, quality) {
  const g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color(0x040307);
  scene.fog = new THREE.Fog(0x0c0814, 10, 30);
  const updaters = [];
  add(g, new THREE.PlaneGeometry(40, 18), std(0x8a8098, { map: tileTexture(), roughness: 0.55, metalness: 0.15 }), [0, 0, -2], [-Math.PI / 2, 0, 0]).name = 'floor';
  const wallTex = stoneWallTexture('#26222c', '#0c0a10'); wallTex.repeat.set(7, 2);
  const wallMat = std(0xffffff, { map: wallTex, roughness: 0.9 });
  add(g, new THREE.PlaneGeometry(40, 8), wallMat, [0, 4, -6.5]);
  add(g, new THREE.PlaneGeometry(14, 8), wallMat, [-13, 4, -1], [0, Math.PI / 2, 0]);
  add(g, new THREE.PlaneGeometry(14, 8), wallMat, [13, 4, -1], [0, -Math.PI / 2, 0]);
  add(g, new THREE.PlaneGeometry(40, 14), std(0x1a1720, { side: THREE.DoubleSide }), [0, 6.6, -1], [Math.PI / 2, 0, 0]); // teto baixo
  // arcos góticos
  const archMat = std(0x34303a, { roughness: 0.8 });
  for (let i = -3; i <= 3; i++) {
    const x = i * 4;
    add(g, new THREE.TorusGeometry(2.0, 0.22, 6, 14, Math.PI), archMat, [x, 4.4, -6.2]);
    add(g, new THREE.BoxGeometry(0.5, 4.4, 0.5), archMat, [x - 2, 2.2, -6.2], [0, 0, 0], { cast: true, receive: true });
  }
  // nichos de caveiras (instanciadas)
  const nSk = quality === 'baixa' ? 60 : 140;
  const skulls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.14, 7, 5), std(0xc9bc9c, { roughness: 0.75 }), nSk);
  const m4 = new THREE.Matrix4(); const rnd = mulberry(11); const q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), sc4 = new THREE.Vector3(), p4 = new THREE.Vector3();
  for (let i = 0; i < nSk; i++) {
    // pilhas irregulares dentro dos nichos entre os arcos
    const niche = Math.floor(rnd() * 7) - 3, nx = niche * 4 + 0.2;
    const row = Math.floor(rnd() * 5);
    p4.set(nx + (rnd() - 0.5) * 2.6, 0.25 + row * 0.42 + rnd() * 0.12, -6.3 + rnd() * 0.15);
    e4.set((rnd() - 0.5) * 0.6, (rnd() - 0.5) * 1.2, (rnd() - 0.5) * 0.5); q4.setFromEuler(e4);
    const k = 0.8 + rnd() * 0.5; sc4.set(k, k * 0.9, k);
    skulls.setMatrixAt(i, m4.compose(p4, q4, sc4));
  }
  g.add(skulls);
  // sarcófagos
  const sarc = std(0x3c3842, { roughness: 0.6 });
  for (const x of [-4.2, 4.2]) {
    add(g, new THREE.BoxGeometry(2.4, 0.8, 1.0), sarc, [x, 0.4, -4.6], [0, 0, 0], { cast: true, receive: true });
    const lid = add(g, new THREE.BoxGeometry(2.5, 0.16, 1.1), std(0x48444e), [x, 0.88, -4.6], [0, x > 0 ? 0.25 : -0.2, 0]);
    lid.castShadow = true;
    add(g, new THREE.BoxGeometry(0.1, 0.02, 0.6), std(0x8a7030, { metalness: 0.8, roughness: 0.3 }), [x, 0.97, -4.6], [0, x > 0 ? 0.25 : -0.2, 0]);
  }
  // caixão acorrentado pendurado
  const coffin = new THREE.Group(); coffin.position.set(0.5, 4.8, -3.6); g.add(coffin);
  add(coffin, new THREE.BoxGeometry(0.8, 2.0, 0.4), std(0x2a1810, { roughness: 0.9 }), [0, 0, 0]);
  add(coffin, new THREE.CylinderGeometry(0.02, 0.02, 2.2, 4), std(0x333338, { metalness: 0.8 }), [0, 2.0, 0]);
  updaters.push((dt, t) => { coffin.rotation.z = Math.sin(t * 0.6) * 0.06; coffin.rotation.y = Math.sin(t * 0.4) * 0.3; });
  // velas em grupos
  const flameMat = new THREE.SpriteMaterial({ map: glowSprite('#ffb040'), blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [];
  for (const cx of [-9, -2.2, 2.2, 9]) for (let i = 0; i < 5; i++) {
    const x = cx + (i - 2) * 0.22, h = 0.15 + ((i * 7) % 3) * 0.1, z = -5.4 + (i % 2) * 0.2;
    add(g, new THREE.CylinderGeometry(0.035, 0.035, h, 6), std(0xe8dcc0), [x, h / 2, z]);
    const f = new THREE.Sprite(flameMat); f.position.set(x, h + 0.06, z); f.scale.set(0.2, 0.32, 1); g.add(f); flames.push(f);
  }
  updaters.push((dt, t) => flames.forEach((f, i) => { f.scale.y = 0.3 + Math.sin(t * 17 + i) * 0.05; }));
  // névoa verde-arroxeada (planos aditivos)
  const fogMat = new THREE.MeshBasicMaterial({ color: 0x40205a, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false });
  const fogs = [];
  for (let i = 0; i < 3; i++) { const f = add(g, new THREE.PlaneGeometry(30, 1.2), fogMat, [0, 0.25 + i * 0.2, -3 + i * 0.8], [-Math.PI / 2 + 0.2, 0, 0]); fogs.push(f); }
  updaters.push((dt, t) => fogs.forEach((f, i) => { f.position.x = Math.sin(t * 0.2 + i) * 1.5; }));
  const colMat = std(0x37323c, { roughness: 0.75 }), statueMat = std(0x55525a, { roughness: 0.6 });
  const statues = edgeStatues(g, updaters, colMat, statueMat);
  const vents = edgeVents(g, updaters, 'brasa');
  g.add(new THREE.HemisphereLight(0x8a70c0, 0x140a18, 1.15));
  const key = new THREE.DirectionalLight(0xc8b8ff, 2.3); key.position.set(-3, 9, 6); key.castShadow = quality !== 'baixa';
  setupShadow(key); g.add(key); g.add(key.target);
  const green = new THREE.PointLight(0x50ff90, 9, 14, 1.4); green.position.set(0, 3, -4); g.add(green);
  const red = new THREE.PointLight(0xff2030, 8, 12, 1.4); red.position.set(0, 3.5, -1); g.add(red);
  updaters.push((dt, t) => { green.intensity = 8 + Math.sin(t * 1.3) * 2; });
  return { group: g, id: 'catedral', update: (dt, t) => updaters.forEach((u) => u(dt, t)), cheer: () => {}, emberColor: 0x70ff90, bloodTint: 1,
    onEvent: (e) => { if (e.type === 'hazard') vents.erupt(e.side); }, sync: (st) => statues.sync(st) };
}

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
