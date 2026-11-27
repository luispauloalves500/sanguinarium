// Sistema de sangue: jatos, gotas, poças persistentes, pedaços (finalizações) e faíscas.
import * as THREE from 'three';
import { ParticlePool, FloorDecals } from './particles.js';

const RED = [new THREE.Color(0x5a0000), new THREE.Color(0x420000), new THREE.Color(0x6e0606), new THREE.Color(0x2a0000)];

export class BloodSystem {
  constructor(scene, opts) {
    this.opts = opts; // { intensity: 0..2, persist: bool }
    this.decals = new FloorDecals(scene, 460);
    const dropMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.1, emissive: 0x220000 });
    this.drops = new ParticlePool(scene, {
      count: 1100, geometry: new THREE.IcosahedronGeometry(0.03, 0), material: dropMat, gravity: 0.0045, drag: 0.992,
      onFloor: (p) => { if (Math.random() < 0.35) this.decals.add(p.x, p.z, 0.05 + p.size * 0.11 + Math.random() * 0.06, RED[(Math.random() * 4) | 0], 2.5, 1 + Math.random() * 0.8); },
    });
    const chunkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    this.chunks = new ParticlePool(scene, { count: 140, geometry: new THREE.BoxGeometry(0.09, 0.07, 0.08), material: chunkMat, gravity: 0.006, drag: 0.99 });
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
    this.sparks = new ParticlePool(scene, { count: 400, geometry: new THREE.TetrahedronGeometry(0.04), material: sparkMat, gravity: 0.002, floor: false, drag: 0.93 });
    this.magic = new ParticlePool(scene, { count: 700, geometry: new THREE.OctahedronGeometry(0.05), material: sparkMat.clone(), gravity: -0.0006, floor: false, drag: 0.96 });
    this.pools = [];
  }
  get k() { return this.opts.intensity ?? 1; }

  burst(x, y, z, dir, amount = 20, power = 1) {
    const n = Math.round(amount * this.k);
    for (let i = 0; i < n; i++) {
      const sp = (0.03 + Math.random() * 0.07) * power;
      this.drops.spawn(x, y + (Math.random() - 0.5) * 0.2, z + (Math.random() - 0.5) * 0.2,
        dir * sp * (0.4 + Math.random()) + (Math.random() - 0.5) * 0.03, sp * (0.5 + Math.random() * 1.2), (Math.random() - 0.5) * 0.07,
        1.4 + Math.random() * 1.2, 0.6 + Math.random() * 1.6, RED[(Math.random() * 4) | 0]);
    }
  }
  fountain(x, y, z, dirX, dirY, amount, power = 1) {
    const n = Math.round(amount * this.k);
    for (let i = 0; i < n; i++) {
      const sp = (0.06 + Math.random() * 0.05) * power;
      this.drops.spawn(x, y, z, dirX * sp + (Math.random() - 0.5) * 0.025, dirY * sp + Math.random() * 0.03, (Math.random() - 0.5) * 0.04, 2, 0.8 + Math.random() * 1.5, RED[(Math.random() * 4) | 0]);
    }
  }
  drip(x, y, z) { if (this.k > 0) this.drops.spawn(x, y, z, (Math.random() - 0.5) * 0.005, -0.005, 0, 2, 0.6 + Math.random(), RED[1]); }
  pool(x, z, size) { if (this.k > 0) this.decals.add(x, z, size * Math.min(1.5, this.k), RED[3], 0.25, 1.3); }
  gore(x, y, z, n, colors) {
    for (let i = 0; i < n; i++) {
      const c = colors[(Math.random() * colors.length) | 0];
      this.chunks.spawn(x + (Math.random() - 0.5) * 0.4, y + Math.random() * 0.6, z + (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.16, 0.06 + Math.random() * 0.14, (Math.random() - 0.5) * 0.12, 9, 0.7 + Math.random() * 1.6, c);
    }
  }
  spark(x, y, z, n, color, power = 1) {
    const col = new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (0.03 + Math.random() * 0.07) * power;
      this.sparks.spawn(x, y, z, Math.cos(a) * sp, Math.sin(a) * sp, (Math.random() - 0.5) * sp, 0.2 + Math.random() * 0.25, 0.6 + Math.random(), col);
    }
  }
  aura(x, y, z, n, color, spread = 0.5, up = 0.02) {
    const col = new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      this.magic.spawn(x + (Math.random() - 0.5) * spread, y + (Math.random() - 0.5) * spread * 1.5, z + (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * 0.01, up * Math.random(), (Math.random() - 0.5) * 0.01, 0.4 + Math.random() * 0.6, 0.5 + Math.random(), col);
    }
  }
  update(dt) { this.drops.update(dt); this.chunks.update(dt); this.sparks.update(dt); this.magic.update(dt); this.decals.update(dt); }
  clearRound() { if (!this.opts.persist) this.decals.clear(); this.drops.clear(); this.sparks.clear(); this.magic.clear(); }
  clearAll() { this.decals.clear(); this.drops.clear(); this.chunks.clear(); this.sparks.clear(); this.magic.clear(); }
}
