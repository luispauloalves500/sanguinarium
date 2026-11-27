// Efeitos transitórios: malhas temporárias e destroços com física simples (somente visual).
import * as THREE from 'three';

export class Vfx {
  constructor(scene) { this.scene = scene; this.items = []; this.debris = []; }
  add(obj, life, update) { this.scene.add(obj); this.items.push({ obj, life, age: 0, update }); return obj; }
  // destaca uma parte do rig preservando a transformação no mundo
  detach(part, vel, angVel) {
    this.scene.attach(part);
    const d = { obj: part, vel: vel.clone(), ang: angVel.clone(), resting: false };
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
      if (d.resting) continue;
      d.vel.y -= 0.006 * s;
      d.obj.position.addScaledVector(d.vel, s);
      d.obj.rotation.x += d.ang.x * s; d.obj.rotation.y += d.ang.y * s; d.obj.rotation.z += d.ang.z * s;
      if (d.obj.position.y < 0.12) {
        d.obj.position.y = 0.12;
        if (Math.abs(d.vel.y) < 0.03) { d.resting = true; continue; }
        d.vel.y = -d.vel.y * 0.3; d.vel.x *= 0.5; d.vel.z *= 0.5; d.ang.multiplyScalar(0.5);
      }
    }
  }
  clear() {
    for (const it of this.items) { this.scene.remove(it.obj); dispose(it.obj); }
    for (const d of this.debris) { this.scene.remove(d.obj); }
    this.items = []; this.debris = [];
  }
}
export function dispose(o) {
  o.traverse((c) => { if (c.geometry) c.geometry.dispose(); if (c.material && !c.material.userData.shared) { (Array.isArray(c.material) ? c.material : [c.material]).forEach((m) => m.dispose()); } });
}
