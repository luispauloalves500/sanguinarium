// Câmera 2.5D: segue os lutadores, tremor de impacto e modo cinematográfico.
import * as THREE from 'three';
import * as C from '../core/constants.js';

export class CameraRig {
  constructor(aspect) {
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 200);
    this.pos = new THREE.Vector3(0, 1.8, 9); this.look = new THREE.Vector3(0, 1.1, 0);
    this.camera.position.copy(this.pos);
    this.shakeAmt = 0; this.reduceShake = false;
    this.cine = null; // { pos: Vector3, look: Vector3, speed }
    this.zoom = 0; // aproximação adicional
  }
  shake(a) { this.shakeAmt = Math.min(0.5, this.shakeAmt + a * (this.reduceShake ? 0.25 : 1)); }
  setCine(pos, look, speed = 4) {
    if (!this.cine) this.cine = { pos: new THREE.Vector3(), look: new THREE.Vector3(), speed };
    // afasta a câmera proporcionalmente (mais em telas retrato)
    const k = this.camera.aspect < 1 ? 1.9 : 1.3;
    this.cine.pos.copy(look).addScaledVector(pos.clone().sub(look), k); this.cine.look.copy(look); this.cine.speed = speed;
  }
  clearCine() { this.cine = null; }
  update(fighters, dt, mode = 'fight', time = 0) {
    let tp, tl, speed = 5;
    if (this.cine) { tp = this.cine.pos; tl = this.cine.look; speed = this.cine.speed; }
    else if (mode === 'showroom') {
      tp = new THREE.Vector3(Math.sin(time * 0.15) * 2.5, 2.1, 7.6); tl = new THREE.Vector3(0, 1.2, 0); speed = 2;
    } else {
      const [a, b] = fighters;
      const sep = Math.abs(a.x - b.x);
      const cx = THREE.MathUtils.clamp((a.x + b.x) / 2, -C.STAGE_HALF + 2.6, C.STAGE_HALF - 2.6);
      const cy = Math.max(a.y, b.y) * 0.35;
      // v0.3: lutadores altos (Brakkor) afastam e elevam um pouco a câmera para a cabeça caber no quadro
      const tall = Math.max(0, Math.max((a.ch && a.ch.height) || 1.9, (b.ch && b.ch.height) || 1.9) - 2.0);
      const z = 5.6 + sep * 0.48 - this.zoom + tall * 2.2;
      tp = new THREE.Vector3(cx, 1.75 + cy + tall * 0.6, z); tl = new THREE.Vector3(cx, 1.12 + cy * 0.8 + tall * 0.5, 0);
    }
    const k = 1 - Math.exp(-dt * speed);
    this.pos.lerp(tp, k); this.look.lerp(tl, k);
    this.camera.position.copy(this.pos);
    if (this.shakeAmt > 0.001) {
      const s = this.shakeAmt;
      this.camera.position.x += (Math.random() - 0.5) * s; this.camera.position.y += (Math.random() - 0.5) * s;
      this.shakeAmt *= Math.exp(-dt * 9);
    }
    this.camera.lookAt(this.look);
  }
  snap() { if (this.cine) { this.pos.copy(this.cine.pos); this.look.copy(this.cine.look); } }
}
