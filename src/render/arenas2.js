// v0.4: arenas do GDD — Templo dos Samurais Mortos (estátuas destrutíveis, espíritos ancestrais) e
// Forja Infernal (lava, correntes, fornalhas), cada uma com o cenário pós-transição. Geometria procedural (placeholder).
import * as THREE from 'three';
import { std, add, setupShadow, edgeChains, edgeVents, mulberry } from './arenas.js';
import { stoneWallTexture, lavaTexture, glowSprite, woodTexture, ironTexture, sandTexture } from './textures.js';

const glow = (c, o = {}) => new THREE.SpriteMaterial({ map: glowSprite(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, ...o });
function sprite(g, mat, pos, sc) { const s = new THREE.Sprite(mat); s.position.set(...pos); s.scale.set(...sc); g.add(s); return s; }

// estátua de samurai de pedra (decorativa e Estátua do Guardião)
function samuraiStatue(mat, dark) {
  const s = new THREE.Group();
  add(s, new THREE.BoxGeometry(1.0, 0.5, 0.9), dark, [0, 0.25, 0], [0, 0, 0], { cast: true, receive: true });
  add(s, new THREE.BoxGeometry(0.22, 0.9, 0.26), mat, [-0.18, 0.95, 0]); add(s, new THREE.BoxGeometry(0.22, 0.9, 0.26), mat, [0.18, 0.95, 0]);
  add(s, new THREE.CylinderGeometry(0.32, 0.5, 0.65, 8, 1, true), mat, [0, 1.25, 0]); // kusazuri (saia)
  add(s, new THREE.BoxGeometry(0.62, 0.7, 0.42), mat, [0, 1.85, 0], [0, 0, 0], { cast: true, receive: true }); // dō
  for (const sx of [-1, 1]) {
    add(s, new THREE.BoxGeometry(0.34, 0.08, 0.44), mat, [sx * 0.42, 2.12, 0], [0, 0, sx * -0.5]); // sode
    add(s, new THREE.BoxGeometry(0.34, 0.08, 0.44), mat, [sx * 0.46, 2.0, 0], [0, 0, sx * -0.6]);
    add(s, new THREE.BoxGeometry(0.14, 0.55, 0.16), mat, [sx * 0.36, 1.68, 0.12], [0.5, 0, 0]);
  }
  add(s, new THREE.SphereGeometry(0.2, 10, 8), mat, [0, 2.38, 0]); // kabuto
  add(s, new THREE.CylinderGeometry(0.36, 0.36, 0.06, 12), mat, [0, 2.32, 0], [0.12, 0, 0]);
  add(s, new THREE.BoxGeometry(0.04, 0.42, 0.04), mat, [-0.12, 2.68, 0.1], [0, 0, 0.45]); // kuwagata
  add(s, new THREE.BoxGeometry(0.04, 0.42, 0.04), mat, [0.12, 2.68, 0.1], [0, 0, -0.45]);
  add(s, new THREE.BoxGeometry(0.22, 0.12, 0.05), dark, [0, 2.32, 0.2]); // menpo
  add(s, new THREE.BoxGeometry(0.05, 1.5, 0.03), mat, [0, 1.25, 0.35]); // katana fincada
  add(s, new THREE.BoxGeometry(0.22, 0.04, 0.08), mat, [0, 1.95, 0.35]);
  return s;
}

// ---------------- elementos interativos do Templo
// Altar dos Ancestrais (Espírito Ancestral): lanterna de pedra com chama azul; apaga quando o espírito é usado
function edgeAltars(g, updaters, stone) {
  const flameMat = () => glow('#6aa0ff');
  const altars = {};
  for (const side of [-1, 1]) {
    const x = side * 8.25, z = -1.9;
    add(g, new THREE.BoxGeometry(1.1, 0.25, 1.1), stone, [x, 0.12, z], [0, 0, 0], { cast: true, receive: true });
    add(g, new THREE.CylinderGeometry(0.13, 0.2, 1.1, 8), stone, [x, 0.8, z]);
    add(g, new THREE.BoxGeometry(0.62, 0.12, 0.62), stone, [x, 1.4, z]);
    add(g, new THREE.BoxGeometry(0.42, 0.42, 0.42), std(0x2a2a30, { roughness: 0.7 }), [x, 1.67, z]);
    add(g, new THREE.ConeGeometry(0.58, 0.42, 4), stone, [x, 2.1, z], [0, Math.PI / 4, 0]);
    add(g, new THREE.SphereGeometry(0.08, 6, 5), stone, [x, 2.36, z]);
    const fl = sprite(g, flameMat(), [x, 1.68, z + 0.22], [0.55, 0.6, 1]);
    const wisp = sprite(g, flameMat(), [x, 2.9, z], [0.9, 1.4, 1]); wisp.material.opacity = 0.25;
    const pl = new THREE.PointLight(0x5080ff, 4, 5, 1.6); pl.position.set(x, 1.8, z + 0.4); g.add(pl);
    altars[side] = { fl, wisp, pl, used: false, flare: 99 };
  }
  updaters.push((dt, t) => {
    for (const side of [-1, 1]) {
      const a = altars[side]; a.flare += dt;
      const k = a.flare < 0.8 ? Math.sin((a.flare / 0.8) * Math.PI) : 0;
      const base = a.used ? 0.15 : 1;
      a.fl.material.opacity = base * (0.8 + Math.sin(t * 9 + side) * 0.2) + k;
      a.fl.scale.set(0.55 + k * 1.4, 0.6 + k * 2.2, 1);
      a.wisp.material.opacity = a.used ? 0 : 0.2 + Math.sin(t * 1.3 + side) * 0.08; a.wisp.position.y = 2.9 + Math.sin(t * 0.9 + side) * 0.15;
      a.pl.intensity = base * 4 + k * 20;
    }
  });
  return {
    flare(side) { const a = altars[side]; if (a) a.flare = 0; },
    sync(st) { if (!st || !st.spirits) return; for (const side of [-1, 1]) altars[side].used = st.spirits[side] !== 'up'; },
  };
}
// Estátua do Guardião (perigo destrutível): quebra ao receber o oponente derrubado, uma vez por lado/round
function edgeGuardians(g, updaters, stone, dark) {
  const guards = {};
  const shardGeo = new THREE.BoxGeometry(0.22, 0.26, 0.2), shardMat = stone;
  for (const side of [-1, 1]) {
    const x = side * 8.9, z = -0.15;
    const whole = samuraiStatue(stone, dark); whole.position.set(x, 0, z); whole.rotation.y = -side * 0.5; whole.scale.setScalar(1.05); g.add(whole);
    const rubble = new THREE.Group(); rubble.position.set(x, 0, z); rubble.visible = false; g.add(rubble);
    add(rubble, new THREE.BoxGeometry(1.0, 0.5, 0.9), dark, [0, 0.25, 0]);
    const rnd = mulberry(side > 0 ? 11 : 5);
    for (let i = 0; i < 9; i++) add(rubble, shardGeo, shardMat, [(rnd() - 0.5) * 1.6, 0.1 + rnd() * 0.2, (rnd() - 0.5) * 1.0], [rnd() * 3, rnd() * 3, rnd() * 3]);
    add(rubble, new THREE.BoxGeometry(0.22, 0.6, 0.26), stone, [-0.18, 0.75, 0]);
    const shards = [];
    for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(shardGeo, shardMat); m.visible = false; m.castShadow = true; g.add(m); shards.push({ m, v: new THREE.Vector3(), r: new THREE.Vector3() }); }
    guards[side] = { whole, rubble, shards, x, z, t: 99, broken: false };
  }
  updaters.push((dt) => {
    for (const side of [-1, 1]) {
      const gd = guards[side]; gd.t += dt;
      for (const s of gd.shards) {
        if (!s.m.visible) continue;
        s.v.y -= 9.8 * dt; s.m.position.addScaledVector(s.v, dt);
        s.m.rotation.x += s.r.x * dt; s.m.rotation.y += s.r.y * dt;
        if (s.m.position.y < 0.1) { s.m.position.y = 0.1; s.v.multiplyScalar(0.4); s.v.y = Math.abs(s.v.y) * 0.3; }
        if (gd.t > 2.5) s.m.visible = false;
      }
    }
  });
  return {
    shatter(side) {
      const gd = guards[side]; if (!gd) return;
      gd.t = 0; gd.broken = true; gd.whole.visible = false; gd.rubble.visible = true;
      for (const s of gd.shards) {
        s.m.visible = true; s.m.position.set(gd.x + (Math.random() - 0.5) * 0.6, 0.6 + Math.random() * 2, gd.z + (Math.random() - 0.5) * 0.5);
        s.v.set(-side * (1 + Math.random() * 4), 2 + Math.random() * 4, (Math.random() - 0.3) * 3);
        s.r.set(Math.random() * 10, Math.random() * 10, 0);
      }
    },
    sync(st) {
      if (!st || !st.guards) return;
      for (const side of [-1, 1]) {
        const b = st.guards[side] !== 'up', gd = guards[side];
        if (b !== gd.broken && !b) { gd.broken = false; gd.whole.visible = true; gd.rubble.visible = false; }
        else if (b && !gd.broken) { gd.broken = true; gd.whole.visible = false; gd.rubble.visible = true; }
      }
    },
  };
}
// pétalas vermelhas caindo (instanciadas)
function petals(g, updaters, quality, color = 0xa01020, area = [30, 9, 12]) {
  const n = quality === 'baixa' ? 90 : 260;
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.06), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }), n);
  const P = []; const rnd = mulberry(3);
  for (let i = 0; i < n; i++) P.push({ x: (rnd() - 0.5) * area[0], y: rnd() * area[1], z: -rnd() * area[2] + 1.5, ph: rnd() * 6, sp: 0.4 + rnd() * 0.5 });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  g.add(mesh);
  updaters.push((dt, t) => {
    for (let i = 0; i < n; i++) {
      const p = P[i]; p.y -= dt * p.sp; p.x += Math.sin(t * 0.7 + p.ph) * dt * 0.4 + dt * 0.15;
      if (p.y < 0) { p.y = area[1]; p.x = (Math.random() - 0.5) * area[0]; }
      e.set(t * 2 + p.ph, t * 1.3 + p.ph, 0); q.setFromEuler(e);
      mesh.setMatrixAt(i, m4.compose(v.set(p.x, p.y, p.z), q, sc));
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
}
function wisps(g, updaters, n, color, box) {
  const mat = glow(color, { opacity: 0.35 });
  const W = [];
  for (let i = 0; i < n; i++) { const s = sprite(g, mat, [0, 0, 0], [0.7, 1.1, 1]); W.push({ s, ph: i * 1.7, x: box[0] + (i / n) * (box[1] - box[0]) }); }
  updaters.push((dt, t) => W.forEach((w) => { w.s.position.set(w.x + Math.sin(t * 0.3 + w.ph) * 1.5, box[2] + Math.sin(t * 0.8 + w.ph) * 0.6, box[3] + Math.cos(t * 0.4 + w.ph)); }));
}

// ------------------------------------------------------------------ Templo dos Samurais Mortos
export function templo(scene, quality) {
  const g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color(0x0b0610);
  scene.fog = new THREE.Fog(0x1c0c14, 14, 42);
  const updaters = [];
  add(g, new THREE.PlaneGeometry(40, 18), std(0xffffff, { map: woodTexture(), roughness: 0.7, metalness: 0.05 }), [0, 0, -2], [-Math.PI / 2, 0, 0]).name = 'floor';
  const lacquer = std(0x6a0c0c, { roughness: 0.55 }), darkWood = std(0x1c100a, { roughness: 0.85 });
  const stone = std(0x5c5a60, { roughness: 0.75 }), stoneDark = std(0x2c2a30, { roughness: 0.85 });
  // salão do templo: plataforma, painéis shoji iluminados por dentro, pilares laqueados e telhado com beirais
  add(g, new THREE.BoxGeometry(34, 0.45, 3.2), darkWood, [0, 0.22, -7.6], [0, 0, 0], { cast: false, receive: true });
  const paper = new THREE.MeshBasicMaterial({ color: 0x7a4020 });
  for (let i = 0; i < 10; i++) {
    const x = -13.5 + i * 3;
    add(g, new THREE.PlaneGeometry(2.8, 3.0), paper, [x, 2.0, -8.95]);
    for (const dx of [-1.4, -0.47, 0.47, 1.4]) add(g, new THREE.BoxGeometry(0.06, 3.0, 0.05), darkWood, [x + dx, 2.0, -8.9]);
    for (const dy of [0.5, 1.5, 2.5, 3.5]) add(g, new THREE.BoxGeometry(2.8, 0.06, 0.05), darkWood, [x, dy, -8.9]);
  }
  add(g, new THREE.PlaneGeometry(40, 6), std(0x140a08), [0, 6.4, -9.0]);
  for (const x of [-15, -10.5, -6, 6, 10.5, 15]) add(g, new THREE.CylinderGeometry(0.28, 0.32, 6.2, 12), lacquer, [x, 3.1, -7.9], [0, 0, 0], { cast: true, receive: true });
  const roof = std(0x18120f, { roughness: 0.6, metalness: 0.2 });
  add(g, new THREE.BoxGeometry(36, 0.35, 4.6), roof, [0, 6.35, -7.6], [0.32, 0, 0]);
  add(g, new THREE.BoxGeometry(34, 0.5, 0.5), lacquer, [0, 5.95, -6.2]);
  for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(2.4, 0.3, 4.4), roof, [s * 18.6, 6.7, -7.6], [0.32, 0, s * 0.35]);
  // torii carmesim emoldurando a luta ao fundo
  for (const x of [-4.6, 4.6]) add(g, new THREE.CylinderGeometry(0.26, 0.3, 5.6, 12), lacquer, [x, 2.8, -5.2], [0, 0, 0], { cast: true, receive: true });
  add(g, new THREE.BoxGeometry(11.6, 0.4, 0.5), lacquer, [0, 5.5, -5.2]);
  add(g, new THREE.BoxGeometry(12.6, 0.28, 0.6), std(0x120808), [0, 5.9, -5.2], [0, 0, 0]);
  add(g, new THREE.BoxGeometry(10.4, 0.25, 0.35), lacquer, [0, 4.7, -5.2]);
  add(g, new THREE.BoxGeometry(0.9, 0.9, 0.12), std(0x120808), [0, 5.1, -4.98]);
  // lanternas de papel balançando
  const lantMat = new THREE.MeshBasicMaterial({ color: 0xff7a30 }), lgl = glow('#ff8a30', { opacity: 0.7 });
  const lanterns = [];
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Group(); p.position.set(-9 + i * 3, 5.8, -6.3); g.add(p);
    add(p, new THREE.CylinderGeometry(0.01, 0.01, 0.8, 3), darkWood, [0, -0.4, 0]);
    const l = add(p, new THREE.SphereGeometry(0.28, 10, 8), lantMat, [0, -1.05, 0]); l.scale.y = 1.4;
    add(p, new THREE.CylinderGeometry(0.16, 0.16, 0.06, 8), darkWood, [0, -0.66, 0]); add(p, new THREE.CylinderGeometry(0.16, 0.16, 0.06, 8), darkWood, [0, -1.45, 0]);
    sprite(p, lgl, [0, -1.05, 0.05], [1.3, 1.5, 1]);
    lanterns.push(p);
  }
  updaters.push((dt, t) => lanterns.forEach((p, i) => { p.rotation.z = Math.sin(t * 0.9 + i) * 0.06; }));
  // fileira de armaduras de samurais mortos ao fundo
  for (const x of [-12.8, -8.3, 8.3, 12.8]) { const s = samuraiStatue(stone, stoneDark); s.position.set(x, 0.45, -7.4); g.add(s); }
  // lua pálida e árvores secas
  const moon = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 16), new THREE.MeshBasicMaterial({ color: 0xd8c8c0, fog: false })); moon.position.set(10, 20, -40); g.add(moon);
  sprite(g, glow('#ff4040', { fog: false }), [10, 20, -40], [18, 18, 1]);
  petals(g, updaters, quality);
  wisps(g, updaters, 5, '#7aa8ff', [-12, 12, 3.5, -6.5]);
  const altars = edgeAltars(g, updaters, stone);
  const guards = edgeGuardians(g, updaters, stone, stoneDark);
  g.add(new THREE.HemisphereLight(0x8a70a0, 0x120608, 1.0));
  const key = new THREE.DirectionalLight(0xffd0b8, 2.0); key.position.set(-4, 10, 7); key.castShadow = quality !== 'baixa';
  setupShadow(key); g.add(key); g.add(key.target);
  const warm = new THREE.PointLight(0xff7030, 12, 16, 1.4); warm.position.set(0, 4.5, -4.5); g.add(warm);
  const rim = new THREE.DirectionalLight(0x6080ff, 1.2); rim.position.set(5, 5, -9); g.add(rim);
  updaters.push((dt, t) => { warm.intensity = 11 + Math.sin(t * 2.3) * 1.5; });
  return { group: g, id: 'templo', update: (dt, t) => updaters.forEach((u) => u(dt, t)), cheer: () => {}, emberColor: 0x80a0ff, bloodTint: 1,
    onEvent: (e) => { if (e.type === 'interact' && e.kind === 'spirit') altars.flare(e.side); if (e.type === 'hazard') guards.shatter(e.side); },
    sync: (st) => { altars.sync(st); guards.sync(st); } };
}

// ------------------------------------------------------------------ Cemitério dos Ronins (após a transição)
export function cemiterio(scene, quality) {
  const g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color(0x07060c);
  scene.fog = new THREE.Fog(0x14101c, 10, 32);
  const updaters = [];
  const dirt = sandTexture(); dirt.repeat.set(8, 4);
  add(g, new THREE.PlaneGeometry(40, 18), std(0x6a6070, { map: dirt, roughness: 0.95 }), [0, 0, -2], [-Math.PI / 2, 0, 0]).name = 'floor';
  const stone = std(0x55525a, { roughness: 0.8 }), stoneDark = std(0x2a282e, { roughness: 0.9 }), wood = std(0x3a2a1e, { roughness: 0.9 }), steel = std(0x9090a0, { metalness: 0.85, roughness: 0.3 });
  const rnd = mulberry(21);
  // lápides, estelas de madeira (sotoba) e katanas fincadas no chão
  for (let i = 0; i < 26; i++) {
    const x = (rnd() - 0.5) * 30, z = -3.5 - rnd() * 5.5, r = (rnd() - 0.5) * 0.3;
    const k = rnd();
    if (k < 0.35) add(g, new THREE.BoxGeometry(0.5, 1.0 + rnd() * 0.5, 0.25), stone, [x, 0.5, z], [0, r, r * 0.5], { cast: true, receive: true });
    else if (k < 0.65) add(g, new THREE.BoxGeometry(0.12, 1.6 + rnd() * 0.8, 0.04), wood, [x, 0.9, z], [0, r, r]);
    else {
      const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.set(r, rnd() * 3, r * 0.6); g.add(s);
      add(s, new THREE.BoxGeometry(0.04, 1.1, 0.012), steel, [0, 0.55, 0]);
      add(s, new THREE.BoxGeometry(0.16, 0.03, 0.06), std(0x2a2020), [0, 1.12, 0]);
      add(s, new THREE.CylinderGeometry(0.025, 0.025, 0.35, 5), std(0x401010), [0, 1.3, 0]);
    }
  }
  // árvores mortas e o portão em ruínas
  const bark = std(0x1a1210, { roughness: 1 });
  for (const [x, z, h] of [[-11, -7, 6], [-6.5, -8.5, 5], [7.5, -7.8, 6.5], [12, -6.5, 5]]) {
    add(g, new THREE.CylinderGeometry(0.12, 0.3, h, 6), bark, [x, h / 2, z], [0, 0, 0.08], { cast: true, receive: true });
    for (let b = 0; b < 4; b++) add(g, new THREE.CylinderGeometry(0.03, 0.08, 2.2, 4), bark, [x + (b - 1.5) * 0.4, h * 0.65 + b * 0.4, z], [0, b, (b % 2 ? 1 : -1) * 0.9]);
  }
  const lac = std(0x4a0a0a, { roughness: 0.7 });
  add(g, new THREE.CylinderGeometry(0.26, 0.3, 5.2, 10), lac, [-3.8, 2.6, -9]); add(g, new THREE.CylinderGeometry(0.26, 0.3, 3.0, 10), lac, [3.8, 1.5, -9], [0, 0, 0.2]);
  add(g, new THREE.BoxGeometry(9.2, 0.35, 0.45), lac, [-0.6, 5.1, -9], [0, 0, -0.12]);
  add(g, new THREE.PlaneGeometry(60, 20), std(0x0c0a12), [0, 6, -14]);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(4.5, 24, 16), new THREE.MeshBasicMaterial({ color: 0xe8e0d8, fog: false })); moon.position.set(-8, 16, -38); g.add(moon);
  sprite(g, glow('#a0b0ff', { fog: false }), [-8, 16, -38], [24, 24, 1]);
  // névoa rasteira e espíritos de ronins
  const fogMat = new THREE.MeshBasicMaterial({ color: 0x506080, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false });
  const fogs = [];
  for (let i = 0; i < 3; i++) fogs.push(add(g, new THREE.PlaneGeometry(34, 1.4), fogMat, [0, 0.25 + i * 0.22, -3.2 + i * 0.9], [-Math.PI / 2 + 0.2, 0, 0]));
  updaters.push((dt, t) => fogs.forEach((f, i) => { f.position.x = Math.sin(t * 0.18 + i) * 1.8; }));
  wisps(g, updaters, 7, '#8ab0ff', [-13, 13, 2.2, -5]);
  petals(g, updaters, quality, 0x701020, [30, 8, 10]);
  const altars = edgeAltars(g, updaters, stone);
  const guards = edgeGuardians(g, updaters, stone, stoneDark);
  g.add(new THREE.HemisphereLight(0x7080c0, 0x0a0810, 0.95));
  const key = new THREE.DirectionalLight(0xb8c8ff, 2.1); key.position.set(-5, 10, 6); key.castShadow = quality !== 'baixa';
  setupShadow(key); g.add(key); g.add(key.target);
  const blue = new THREE.PointLight(0x5070ff, 8, 14, 1.4); blue.position.set(0, 3, -3); g.add(blue);
  return { group: g, id: 'templo', update: (dt, t) => updaters.forEach((u) => u(dt, t)), cheer: () => {}, emberColor: 0x90b0ff, bloodTint: 1,
    onEvent: (e) => { if (e.type === 'interact' && e.kind === 'spirit') altars.flare(e.side); if (e.type === 'hazard') guards.shatter(e.side); },
    sync: (st) => { altars.sync(st); guards.sync(st); } };
}

// ---------------- peças da Forja
function furnace(g, updaters, x, z, s = 1) {
  const brick = std(0xffffff, { map: (() => { const t = stoneWallTexture('#3a2018', '#120604'); t.repeat.set(2, 2); return t; })(), roughness: 0.9 });
  add(g, new THREE.BoxGeometry(3.2 * s, 4.2 * s, 2.2 * s), brick, [x, 2.1 * s, z], [0, 0, 0], { cast: true, receive: true });
  add(g, new THREE.CylinderGeometry(0.55 * s, 0.75 * s, 5 * s, 10), brick, [x, 6.6 * s, z - 0.2]);
  const tex = lavaTexture(); const mouth = new THREE.MeshBasicMaterial({ map: tex });
  const shape = new THREE.Shape(); shape.moveTo(-0.9, 0); shape.lineTo(-0.9, 1.1); shape.absarc(0, 1.1, 0.9, Math.PI, 0, true); shape.lineTo(0.9, 0); shape.closePath();
  const m = add(g, new THREE.ShapeGeometry(shape, 10), mouth, [x, 0.5 * s, z + 1.11 * s]); m.scale.setScalar(s);
  const gl = sprite(g, glow('#ff6010'), [x, 1.6 * s, z + 1.4 * s], [3.4 * s, 3.0 * s, 1]);
  const pl = new THREE.PointLight(0xff5010, 9 * s, 8, 1.6); pl.position.set(x, 1.6, z + 1.6); g.add(pl);
  updaters.push((dt, t) => { tex.offset.y += dt * 0.08; const k = Math.sin(t * 5 + x) * 0.5 + Math.sin(t * 11.3 + x) * 0.3; pl.intensity = (8 + k * 2.5) * s; gl.material.opacity = 0.75 + k * 0.15; });
}
function gear(g, updaters, x, y, z, r, sp, mat) {
  const p = new THREE.Group(); p.position.set(x, y, z); g.add(p);
  add(p, new THREE.TorusGeometry(r, r * 0.12, 6, 24), mat, [0, 0, 0]);
  add(p, new THREE.CylinderGeometry(r * 0.2, r * 0.2, 0.3, 10), mat, [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; add(p, new THREE.BoxGeometry(r * 0.2, r * 0.25, 0.25), mat, [Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1, 0], [0, 0, a]); }
  for (let i = 0; i < 4; i++) add(p, new THREE.BoxGeometry(r * 2, r * 0.1, 0.12), mat, [0, 0, 0], [0, 0, (i / 4) * Math.PI]);
  updaters.push((dt) => { p.rotation.z += dt * sp; });
}
function anvil(g, x, z, iron) {
  add(g, new THREE.BoxGeometry(0.7, 0.6, 0.6), std(0x2a1c14), [x, 0.3, z], [0, 0, 0], { cast: true, receive: true });
  add(g, new THREE.BoxGeometry(0.45, 0.3, 0.4), iron, [x, 0.75, z], [0, 0, 0], { cast: true, receive: true });
  add(g, new THREE.BoxGeometry(1.1, 0.22, 0.45), iron, [x, 1.0, z], [0, 0, 0], { cast: true, receive: true });
  add(g, new THREE.ConeGeometry(0.11, 0.5, 6), iron, [x + 0.75, 1.0, z], [0, 0, -Math.PI / 2]);
}
function hangingChains(g, updaters, iron, xs, z, y0 = 9) {
  const link = new THREE.TorusGeometry(0.09, 0.025, 5, 8);
  const P = [];
  for (const [x, n] of xs) {
    const p = new THREE.Group(); p.position.set(x, y0, z); g.add(p);
    for (let i = 0; i < n; i++) { const l = new THREE.Mesh(link, iron); l.position.y = -0.15 * i; l.rotation.y = i % 2 ? Math.PI / 2 : 0; p.add(l); }
    add(p, new THREE.TorusGeometry(0.2, 0.04, 5, 10, Math.PI * 1.4), iron, [0, -0.15 * n - 0.1, 0], [0, 0, Math.PI * 0.8]);
    P.push(p);
  }
  updaters.push((dt, t) => P.forEach((p, i) => { p.rotation.z = Math.sin(t * 0.6 + i * 1.3) * 0.04; }));
}

// ------------------------------------------------------------------ Forja Infernal
export function forja(scene, quality) {
  const g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color(0x0c0402);
  scene.fog = new THREE.Fog(0x220804, 13, 40);
  const updaters = [];
  add(g, new THREE.PlaneGeometry(40, 18), std(0xa8a09a, { map: ironTexture(), roughness: 0.75, metalness: 0.2 }), [0, 0, -2], [-Math.PI / 2, 0, 0]).name = 'floor';
  const iron = std(0x2e2a28, { metalness: 0.85, roughness: 0.4 });
  const wallTex = stoneWallTexture('#2a1712', '#0a0403'); wallTex.repeat.set(8, 3);
  const wallMat = std(0xffffff, { map: wallTex, roughness: 0.95 });
  add(g, new THREE.PlaneGeometry(44, 16), wallMat, [0, 8, -9.5]);
  add(g, new THREE.PlaneGeometry(16, 16), wallMat, [-16, 8, -2], [0, Math.PI / 2, 0]);
  add(g, new THREE.PlaneGeometry(16, 16), wallMat, [16, 8, -2], [0, -Math.PI / 2, 0]);
  // fornalhas ao fundo
  for (const x of [-8.5, 0, 8.5]) furnace(g, updaters, x, -8.2, x === 0 ? 1.15 : 1);
  // canal de lava diante das fornalhas, com passarela de ferro
  const lavaTex = lavaTexture(); lavaTex.repeat.set(8, 1);
  add(g, new THREE.PlaneGeometry(44, 1.6), new THREE.MeshBasicMaterial({ map: lavaTex }), [0, 0.02, -6.2], [-Math.PI / 2, 0, 0]);
  for (const z of [-5.35, -7.05]) add(g, new THREE.BoxGeometry(44, 0.2, 0.12), iron, [0, 0.1, z]);
  updaters.push((dt) => { lavaTex.offset.x += dt * 0.05; });
  // cadinho pendurado derramando metal fundido
  const cru = new THREE.Group(); cru.position.set(-4.2, 4.6, -5.4); g.add(cru);
  add(cru, new THREE.CylinderGeometry(0.6, 0.42, 0.9, 12), iron, [0, 0, 0], [0, 0, 0.5]);
  add(cru, new THREE.CylinderGeometry(0.02, 0.02, 5, 4), iron, [0, 2.6, 0]);
  const pourTex = lavaTexture(); pourTex.repeat.set(1, 4);
  const pour = add(g, new THREE.PlaneGeometry(0.22, 4.2), new THREE.MeshBasicMaterial({ map: pourTex }), [-3.75, 2.2, -5.4]);
  sprite(g, glow('#ff7020'), [-3.75, 0.3, -5.6], [2.2, 1.0, 1]);
  updaters.push((dt, t) => { pourTex.offset.y += dt * 1.4; pour.scale.x = 0.8 + Math.sin(t * 13) * 0.2; });
  // bigornas, engrenagens e correntes do teto
  anvil(g, 3.6, -4.4, iron); anvil(g, -7, -4.0, iron);
  gear(g, updaters, -13, 6.5, -9.3, 2.0, 0.25, iron); gear(g, updaters, 12.5, 7.5, -9.3, 2.6, -0.18, iron); gear(g, updaters, 9.4, 4.4, -9.25, 1.2, 0.4, iron);
  hangingChains(g, updaters, iron, [[-10.5, 22], [-2.5, 30], [5.5, 26], [10.5, 18]], -4.8);
  // centelhas do martelo-fantasma na bigorna
  const spark = sprite(g, glow('#ffd060'), [3.6, 1.2, -4.3], [1.6, 1.6, 1]);
  updaters.push((dt, t) => { const ph = (t * 0.9) % 1; spark.material.opacity = ph < 0.08 ? 1 - ph / 0.08 : 0; spark.scale.setScalar(0.6 + (ph < 0.08 ? ph * 20 : 0)); });
  const postMat = std(0x2a2422, { metalness: 0.7, roughness: 0.45 });
  const edges = edgeChains(g, updaters, postMat);
  const vents = edgeVents(g, updaters, 'lava');
  g.add(new THREE.HemisphereLight(0xffa080, 0x100402, 0.75));
  const key = new THREE.DirectionalLight(0xffc8a8, 2.1); key.position.set(4, 10, 7); key.castShadow = quality !== 'baixa';
  setupShadow(key); g.add(key); g.add(key.target);
  const rim = new THREE.DirectionalLight(0xff3010, 1.6); rim.position.set(-4, 4, -9); g.add(rim);
  return { group: g, id: 'forja', update: (dt, t) => updaters.forEach((u) => u(dt, t)), cheer: () => {}, emberColor: 0xff7a20, bloodTint: 1,
    onEvent: (e) => { if (e.type === 'interact' && e.kind === 'swing') edges.swing(e.side); if (e.type === 'hazard') vents.erupt(e.side); }, sync: () => {} };
}

// ------------------------------------------------------------------ Coração da Forja (após a transição)
export function coracao(scene, quality) {
  const g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color(0x140302);
  scene.fog = new THREE.Fog(0x2a0603, 11, 34);
  const updaters = [];
  add(g, new THREE.PlaneGeometry(40, 9), std(0xffffff, { map: ironTexture(), roughness: 0.5, metalness: 0.5 }), [0, 0, 0.5], [-Math.PI / 2, 0, 0]).name = 'floor';
  const iron = std(0x2a2524, { metalness: 0.85, roughness: 0.4 });
  // plataforma suspensa sobre um mar de lava
  const lavaTex = lavaTexture(); lavaTex.repeat.set(10, 4);
  add(g, new THREE.PlaneGeometry(90, 40), new THREE.MeshBasicMaterial({ map: lavaTex }), [0, -1.2, -20], [-Math.PI / 2, 0, 0]);
  add(g, new THREE.BoxGeometry(40, 1.2, 0.3), iron, [0, -0.6, -4.0]);
  for (let x = -18; x <= 18; x += 3) add(g, new THREE.BoxGeometry(0.2, 1.2, 0.2), iron, [x, 0.6, -3.9]);
  add(g, new THREE.BoxGeometry(40, 0.1, 0.1), iron, [0, 1.2, -3.9]);
  updaters.push((dt) => { lavaTex.offset.x += dt * 0.02; lavaTex.offset.y += dt * 0.01; });
  // núcleo derretido gigante preso por correntes
  const coreTex = lavaTexture();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(4.2, 2), new THREE.MeshBasicMaterial({ map: coreTex, fog: false }));
  core.position.set(0, 7, -22); g.add(core);
  sprite(g, glow('#ff5010', { fog: false }), [0, 7, -22], [22, 22, 1]);
  for (const [x, y, rz] of [[-7, 12, 0.7], [7, 12, -0.7], [-7, 2, -0.7], [7, 2, 0.7]]) add(g, new THREE.CylinderGeometry(0.15, 0.15, 10, 5), iron, [x * 0.75, y * 0.8 + 1.5, -21], [0, 0, rz]);
  updaters.push((dt, t) => { core.rotation.y += dt * 0.1; coreTex.offset.y += dt * 0.03; core.scale.setScalar(1 + Math.sin(t * 1.6) * 0.02); });
  // torres de forja e chaminés laterais
  for (const x of [-14, 14]) { add(g, new THREE.CylinderGeometry(1.2, 1.6, 14, 10), iron, [x, 7, -12]); sprite(g, glow('#ff6010'), [x, 14.4, -12], [4, 3, 1]); }
  hangingChains(g, updaters, iron, [[-6, 24], [2, 32], [8, 20]], -3.2, 10);
  // colunas de faíscas subindo da lava
  const emb = glow('#ff9030', { opacity: 0.8 }); const E = [];
  for (let i = 0; i < 14; i++) E.push({ s: sprite(g, emb, [0, 0, 0], [0.25, 0.25, 1]), x: (i - 7) * 2.6, z: -6 - (i % 4) * 2.5, ph: i * 0.37 });
  updaters.push((dt, t) => E.forEach((e) => { const k = (t * 0.25 + e.ph) % 1; e.s.position.set(e.x + Math.sin(t + e.ph * 9) * 0.4, -1 + k * 9, e.z); e.s.material.opacity = 1 - k; }));
  const postMat = std(0x2a2422, { metalness: 0.7, roughness: 0.45 });
  const edges = edgeChains(g, updaters, postMat);
  const vents = edgeVents(g, updaters, 'lava');
  g.add(new THREE.HemisphereLight(0xff8060, 0x2a0402, 0.9));
  const key = new THREE.DirectionalLight(0xffa070, 1.6); key.position.set(3, 10, 7); key.castShadow = quality !== 'baixa';
  setupShadow(key); g.add(key); g.add(key.target);
  const under = new THREE.PointLight(0xff4010, 22, 16, 1.3); under.position.set(0, 1, -6); g.add(under);
  updaters.push((dt, t) => { under.intensity = 20 + Math.sin(t * 3.1) * 4; });
  return { group: g, id: 'forja', update: (dt, t) => updaters.forEach((u) => u(dt, t)), cheer: () => {}, emberColor: 0xff6a10, bloodTint: 1,
    onEvent: (e) => { if (e.type === 'interact' && e.kind === 'swing') edges.swing(e.side); if (e.type === 'hazard') vents.erupt(e.side); }, sync: () => {} };
}
