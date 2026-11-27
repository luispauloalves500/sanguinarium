// Texturas procedurais via canvas (sem assets externos).
import * as THREE from 'three';

function canvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function noise(g, w, h, n, colors, rmin, rmax, alpha = 0.3) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = alpha * Math.random();
    g.fillStyle = colors[(Math.random() * colors.length) | 0];
    const r = rmin + Math.random() * (rmax - rmin);
    g.beginPath(); g.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
}
export function sandTexture() {
  const t = canvas(512, 512, (g, w, h) => {
    g.fillStyle = '#4a2a1e'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 2500, ['#5e3424', '#3a1e15', '#6b3c28', '#2a120c'], 1, 6, 0.5);
    noise(g, w, h, 60, ['#3a0505', '#520808'], 10, 40, 0.35);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6);
  return t;
}
export function stoneWallTexture(base = '#3a3236', line = '#1c1719') {
  const t = canvas(512, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    noise(g, w, h, 1500, ['#4a4044', '#2a2326', '#55494d'], 1, 5, 0.5);
    g.strokeStyle = line; g.lineWidth = 4;
    for (let y = 0; y < h; y += 64) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      for (let x = (y / 64) % 2 ? 0 : 64; x < w; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
export function tileTexture() {
  const t = canvas(512, 512, (g, w, h) => {
    const s = 64;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const dark = ((x + y) / s) % 2 === 0;
      g.fillStyle = dark ? '#1d1a20' : '#3b3640'; g.fillRect(x, y, s, s);
    }
    noise(g, w, h, 1800, ['#000', '#555', '#2a0808'], 1, 4, 0.35);
    g.strokeStyle = '#0c0a0e'; g.lineWidth = 3;
    for (let i = 0; i <= w; i += s) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 3);
  return t;
}
export function stainedGlassTexture(seed = 0) {
  return canvas(256, 512, (g, w, h) => {
    const cols = ['#8a0a14', '#1a2a8a', '#c08a10', '#5a0a6a', '#0a6a5a', '#d02020'];
    g.fillStyle = '#050307'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = cols[(i * 7 + seed * 3 + ((Math.random() * 3) | 0)) % cols.length];
      const x = Math.random() * w, y = Math.random() * h, r = 12 + Math.random() * 40;
      g.beginPath();
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + Math.random(); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      g.closePath(); g.fill(); g.strokeStyle = '#050307'; g.lineWidth = 4; g.stroke();
    }
    // figura central (silhueta ritualística)
    g.fillStyle = '#ffd890'; g.globalAlpha = 0.8;
    g.beginPath(); g.arc(w / 2, h * 0.3, 30, 0, Math.PI * 2); g.fill();
    g.fillRect(w / 2 - 8, h * 0.3, 16, h * 0.45); g.fillRect(w / 2 - 60, h * 0.42, 120, 14);
    g.globalAlpha = 1;
  });
}
export function lavaTexture() {
  const t = canvas(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ff5a00'); gr.addColorStop(1, '#b01800');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    noise(g, w, h, 300, ['#ffd040', '#ff8000', '#601000', '#200000'], 4, 22, 0.6);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
export function glowSprite(color = '#ff3020') {
  const t = canvas(64, 64, (g, w, h) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  return t;
}
export function pentagramTexture() {
  return canvas(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#ff2030'; g.lineWidth = 10; g.shadowColor = '#ff0000'; g.shadowBlur = 20;
    g.beginPath(); g.arc(256, 256, 230, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(256, 256, 200, 0, Math.PI * 2); g.stroke();
    g.beginPath();
    for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5; g.lineTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200); }
    g.stroke();
  });
}
