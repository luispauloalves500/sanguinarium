// Efeitos transitórios: malhas temporárias e destroços com física simples (somente visual).
import * as THREE from 'three';

export class Vfx {
  constructor(scene) { this.scene = scene; this.items = []; this.debris = []; }
  add(obj, life, update) { this.scene.add(obj); this.items.push({ obj, life, age: 0, update }); return obj; }
  // destaca uma parte do rig preservando a transformação no mundo
  // opts.trail(posMundo, idade): chamado a cada quadro enquanto o destroço voa (rastro de sangue)
  detach(part, vel, angVel, opts = {}) {
    this.scene.attach(part);
    const d = { obj: part, vel: vel.clone(), ang: angVel.clone(), resting: false, trail: opts.trail || null, age: 0, restY: opts.restY ?? 0.12, bounce: opts.bounce ?? 0.3 };
    this.debris.push(d);
    return d;
  }
  update(dt) {
    const s = dt * 60;
    for (const it of this.items) {
      it.age += dt;
      if (it.update) it.update(it.obj, it.age, dt);
      if (it.age >= it.life) { this.scene.remove(it.obj); dispose(it.obj); it.dead = true; }
    }
    this.items = this.items.filter((i) => !i.dead);
    for (const d of this.debris) {
      d.age += dt;
      if (d.trail && d.age < 4) { d.obj.getWorldPosition(this._p || (this._p = new THREE.Vector3())); d.trail(this._p, d.age, d.resting); }
      if (d.resting) continue;
      d.vel.y -= 0.006 * s;
      d.obj.position.addScaledVector(d.vel, s);
      d.obj.rotation.x += d.ang.x * s; d.obj.rotation.y += d.ang.y * s; d.obj.rotation.z += d.ang.z * s;
      if (d.obj.position.y < d.restY) {
        d.obj.position.y = d.restY;
        if (Math.abs(d.vel.y) < 0.03) { d.resting = true; continue; }
        d.vel.y = -d.vel.y * d.bounce; d.vel.x *= 0.55; d.vel.z *= 0.5; d.ang.multiplyScalar(0.6);
      }
    }
  }
  clear() {
    for (const it of this.items) { this.scene.remove(it.obj); dispose(it.obj); }
    for (const d of this.debris) { this.scene.remove(d.obj); dispose(d.obj); }
    this.items = []; this.debris = [];
  }
}
// coto de ferimento: disco vermelho brilhante + halo aditivo, para a parte cortada ficar legível
export function goreCap(parent, pos, r, glowMap) {
  const cap = new THREE.Mesh(new THREE.CircleGeometry(r, 12), new THREE.MeshStandardMaterial({ color: 0x8a0008, emissive: 0x6a0004, emissiveIntensity: 0.9, roughness: 0.35, side: THREE.DoubleSide }));
  cap.position.set(...pos); cap.rotation.x = Math.PI / 2; parent.add(cap);
  if (glowMap) { const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.7 })); g.scale.set(r * 7, r * 7, 1); g.position.set(...pos); parent.add(g); }
  return cap;
}
export function dispose(o) {
  o.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (c.material && !c.material.userData.shared) { (Array.isArray(c.material) ? c.material : [c.material]).forEach((m) => m.dispose()); } });
}
