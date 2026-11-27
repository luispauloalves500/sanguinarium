// Pools reutilizáveis de partículas (InstancedMesh) — sangue, faíscas, magia, brasas e decals no chão.
import * as THREE from 'three';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();
const _qz = new THREE.Quaternion(), _z = new THREE.Vector3(0, 0, 1);
const FLAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

export class ParticlePool {
  constructor(scene, { count = 500, geometry, material, gravity = 0.0, floor = true, drag = 0.995, onFloor = null }) {
    this.n = count; this.gravity = gravity; this.floor = floor; this.drag = drag; this.onFloor = onFloor;
    this.mesh = new THREE.InstancedMesh(geometry, material, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    scene.add(this.mesh);
    this.p = Array.from({ length: count }, () => ({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 1, rot: 0, vr: 0, grow: 0 }));
    this.i = 0;
    _m.makeScale(0, 0, 0);
    for (let k = 0; k < count; k++) this.mesh.setMatrixAt(k, _m);
  }
  spawn(x, y, z, vx, vy, vz, life, size, color) {
    const p = this.p[this.i]; const idx = this.i;
    this.i = (this.i + 1) % this.n;
    Object.assign(p, { alive: true, x, y, z, vx, vy, vz, life, max: life, size, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, grow: 0 });
    this.mesh.setColorAt(idx, color);
    this.mesh.instanceColor.needsUpdate = true;
    return p;
  }
  update(dt) {
    const s = dt * 60;
    for (let k = 0; k < this.n; k++) {
      const p = this.p[k];
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) { p.alive = false; _m.makeScale(0, 0, 0); this.mesh.setMatrixAt(k, _m); continue; }
      p.vy -= this.gravity * s;
      p.vx *= this.drag; p.vz *= this.drag;
      p.x += p.vx * s; p.y += p.vy * s; p.z += p.vz * s; p.rot += p.vr * s;
      if (this.floor && p.y <= 0.01) {
        p.y = 0.01;
        if (this.onFloor) { this.onFloor(p); p.alive = false; _m.makeScale(0, 0, 0); this.mesh.setMatrixAt(k, _m); continue; }
        p.vy = -p.vy * 0.3; p.vx *= 0.6; p.vz *= 0.6; p.vr *= 0.5;
      }
      const sc = p.size * Math.min(1, (p.life / p.max) * 3);
      _e.set(p.rot, p.rot * 0.7, 0); _q.setFromEuler(_e);
      _m.compose(_p.set(p.x, p.y, p.z), _q, _s.set(sc, sc, sc));
      this.mesh.setMatrixAt(k, _m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  clear() { for (let k = 0; k < this.n; k++) { this.p[k].alive = false; _m.makeScale(0, 0, 0); this.mesh.setMatrixAt(k, _m); } this.mesh.instanceMatrix.needsUpdate = true; }
}

// Decals planos no chão que crescem (empoçamento) e persistem
export class FloorDecals {
  constructor(scene, count = 420) {
    const geo = new THREE.CircleGeometry(1, 14);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.0, transparent: true, opacity: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    this.mesh.frustumCulled = false; this.mesh.receiveShadow = true; this.mesh.renderOrder = 1;
    scene.add(this.mesh);
    this.n = count; this.i = 0;
    this.d = Array.from({ length: count }, () => ({ alive: false, x: 0, z: 0, r: 0, target: 0, sx: 1, rate: 1, y: 0.012 }));
    this.clear();
    this.active = 0;
  }
  add(x, z, target, color, rate = 1, stretch = 1) {
    const d = this.d[this.i]; const idx = this.i;
    this.i = (this.i + 1) % this.n;
    Object.assign(d, { alive: true, x, z, r: target * 0.2, target, sx: stretch, rate, y: 0.011 + (idx % 7) * 0.0006, rot: Math.random() * Math.PI });
    this.mesh.setColorAt(idx, color); this.mesh.instanceColor.needsUpdate = true;
    this.active++;
    return d;
  }
  update(dt) {
    for (let k = 0; k < this.n; k++) {
      const d = this.d[k];
      if (!d.alive) continue;
      if (d.r < d.target) d.r = Math.min(d.target, d.r + dt * 0.6 * d.rate * Math.max(0.15, d.target));
      _q.copy(FLAT).multiply(_qz.setFromAxisAngle(_z, d.rot));
      _m.compose(_p.set(d.x, d.y, d.z), _q, _s.set(d.r * d.sx, d.r, 1));
      this.mesh.setMatrixAt(k, _m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  clear() { for (let k = 0; k < this.n; k++) { this.d[k].alive = false; _m.makeScale(0, 0, 0); this.mesh.setMatrixAt(k, _m); } this.mesh.instanceMatrix.needsUpdate = true; this.active = 0; }
}
