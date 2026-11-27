// Governador de desempenho: mede o tempo de quadro e ajusta a resolução interna (e, em último caso,
// desliga sombras) para manter ~60 qps. Usado com a qualidade "Automática".
export class PerfGovernor {
  constructor(view, { enabled = true, minScale = 0.5, maxScale = 1 } = {}) {
    this.view = view; this.enabled = enabled;
    this.minScale = minScale; this.maxScale = maxScale; this.scale = maxScale;
    this.acc = 0; this.n = 0; this.goodTime = 0; this.fps = 60; this.shadowsCut = false;
    this.samples = []; // histórico para relatório
  }
  // dt em segundos (tempo real entre quadros)
  tick(dt, active) {
    if (dt <= 0 || dt > 0.5) return;
    this.acc += dt; this.n++;
    if (this.acc < 1.0) return;
    this.fps = this.n / this.acc; this.acc = 0; this.n = 0;
    this.samples.push(Math.round(this.fps)); if (this.samples.length > 120) this.samples.shift();
    if (!this.enabled || !active) return;
    if (this.fps < 52 && this.scale > this.minScale) {
      this.scale = Math.max(this.minScale, this.scale * (this.fps < 35 ? 0.8 : 0.9));
      this.view.setResolutionScale(this.scale); this.goodTime = 0;
    } else if (this.fps < 40 && this.scale <= this.minScale && !this.shadowsCut) {
      this.shadowsCut = true; this.view.setShadows(false);
    } else if (this.fps >= 58) {
      this.goodTime += 1;
      if (this.goodTime >= 6 && this.scale < this.maxScale) { this.scale = Math.min(this.maxScale, this.scale * 1.1); this.view.setResolutionScale(this.scale); this.goodTime = 0; }
    } else this.goodTime = 0;
  }
}
