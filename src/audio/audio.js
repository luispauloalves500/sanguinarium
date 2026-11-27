// Áudio procedural (Web Audio API): efeitos, locução sintetizada e trilha ambiente original.
export class AudioSystem {
  constructor() {
    this.ctx = null; this.vol = { master: 0.8, music: 0.5, sfx: 0.9, voice: 0.9 };
    this.musicOn = false; this.voiceOn = true; this.log = [];
  }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;
    this.master = c.createGain(); this.master.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.music = c.createGain(); this.music.connect(this.master);
    const comp = c.createDynamicsCompressor(); this.sfx.disconnect(); this.sfx.connect(comp); comp.connect(this.master);
    this.noiseBuf = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.applyVolumes();
  }
  applyVolumes() {
    if (!this.ctx) return;
    this.master.gain.value = this.vol.master; this.sfx.gain.value = this.vol.sfx; this.music.gain.value = this.vol.music * 0.5;
  }
  get ok() { return !!this.ctx && this.ctx.state !== 'closed'; }
  t() { return this.ctx.currentTime; }

  noise(dur, freq, q, gain, type = 'bandpass', sweepTo = null, when = 0) {
    if (!this.ok) return;
    const c = this.ctx, t0 = this.t() + when;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.sfx); src.start(t0, Math.random()); src.stop(t0 + dur + 0.05);
  }
  tone(freq, dur, gain, type = 'sine', slideTo = null, when = 0, dest = null) {
    if (!this.ok) return;
    const c = this.ctx, t0 = this.t() + when;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t0); o.stop(t0 + dur + 0.05);
  }

  play(name, o = {}) {
    this.log.push(name); if (this.log.length > 200) this.log.shift();
    if (!this.ok) return;
    switch (name) {
      case 'hit': {
        const h = o.heavy;
        this.tone(h ? 95 : 150, h ? 0.25 : 0.12, h ? 0.9 : 0.6, 'sine', h ? 40 : 70);
        this.noise(h ? 0.22 : 0.1, h ? 900 : 1600, 0.8, h ? 0.8 : 0.5, 'lowpass');
        if (o.slash) this.noise(0.18, 3500, 2, 0.35, 'bandpass', 1200);
        this.noise(0.25, 500, 1.5, h ? 0.35 : 0.15, 'bandpass', 200, 0.03); // respingo
        break;
      }
      case 'block':
        for (const f of [820, 1240, 1710]) this.tone(f * (o.perfect ? 1.3 : 1), 0.22, 0.12, 'square', f * 0.9);
        this.noise(0.08, 3000, 1, 0.3);
        break;
      case 'whoosh': this.noise(0.16, 600, 1.2, 0.18, 'bandpass', 2400); break;
      case 'heavyWhoosh': this.noise(0.28, 300, 1.2, 0.3, 'bandpass', 1400); break;
      case 'jump': this.noise(0.1, 400, 1, 0.12, 'lowpass'); break;
      case 'land': this.tone(70, 0.2, o.heavy ? 0.7 : 0.25, 'sine', 35); this.noise(0.2, 300, 1, o.heavy ? 0.4 : 0.15, 'lowpass'); break;
      case 'proj': {
        const m = { axe: [180, 'sawtooth'], spear: [600, 'triangle'], prison: [120, 'square'], wave: [60, 'sawtooth'], rain: [900, 'triangle'], spikes: [200, 'sawtooth'], clone: [400, 'sine'] }[o.kind] || [300, 'sine'];
        this.tone(m[0], 0.35, 0.25, m[1], m[0] * 0.5); this.noise(0.3, m[0] * 4, 2, 0.2, 'bandpass', m[0] * 2);
        break;
      }
      case 'clash': this.tone(300, 0.5, 0.5, 'sawtooth', 60); this.noise(0.4, 2000, 0.6, 0.6, 'lowpass', 200); break;
      case 'magic': this.tone(440, 0.6, 0.2, 'triangle', 880); this.tone(660, 0.6, 0.15, 'sine', 1320, 0.05); break;
      case 'teleport': this.tone(1200, 0.3, 0.2, 'sine', 200); this.noise(0.3, 4000, 3, 0.2, 'bandpass', 500); break;
      case 'heal': this.tone(520, 0.4, 0.08, 'sine', 780); break;
      case 'chain': for (let i = 0; i < 5; i++) this.tone(1800 + Math.random() * 1500, 0.05, 0.08, 'square', null, i * 0.03); break;
      case 'super': this.tone(55, 1.4, 0.6, 'sawtooth', 110); this.tone(110, 1.2, 0.3, 'square', 220); this.noise(1.2, 200, 0.5, 0.4, 'lowpass', 2000); break;
      case 'fury': this.tone(70, 1.5, 0.7, 'sawtooth', 35); this.noise(1.4, 500, 0.5, 0.6, 'lowpass', 3000); break;
      case 'explosion': this.tone(60, 1.2, 1, 'sine', 25); this.noise(1.3, 1200, 0.5, 1, 'lowpass', 80); break;
      case 'gore': this.noise(0.5, 400, 1, 0.8, 'lowpass', 120); this.tone(90, 0.3, 0.5, 'sine', 40); this.noise(0.6, 900, 2, 0.4, 'bandpass', 300, 0.08); break;
      case 'tech': this.tone(600, 0.15, 0.3, 'square', 300); this.noise(0.1, 2000, 1, 0.3); break;
      case 'throw': this.noise(0.3, 300, 1, 0.4, 'lowpass'); break;
      case 'freeze': this.play('chain'); this.tone(150, 0.6, 0.3, 'square', 80); break;
      case 'ui': this.tone(o.alt ? 520 : 760, 0.08, 0.15, 'triangle'); break;
      case 'confirm': this.tone(220, 0.4, 0.4, 'sawtooth', 110); this.tone(330, 0.35, 0.2, 'square', 165); break;
      case 'gong': this.tone(62, 3, 0.7, 'sine', 58); this.tone(124, 2.4, 0.3, 'triangle'); this.tone(187, 2, 0.15, 'sine'); break;
      case 'heartbeat': this.tone(55, 0.15, 0.6, 'sine', 40); this.tone(50, 0.15, 0.45, 'sine', 38, 0.22); break;
      case 'crowd': this.noise(1.5, 700, 0.4, (o.k || 0.4) * 0.5, 'bandpass', 500); break;
    }
  }

  // locução: sintetizador de voz do navegador (pt-BR) + acorde grave
  announce(text) {
    this.play('gong');
    try {
      if (this.voiceOn && window.speechSynthesis && this.vol.voice > 0) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'pt-BR'; u.pitch = 0.3; u.rate = 0.82; u.volume = this.vol.voice * this.vol.master;
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      }
    } catch (e) { /* sem voz disponível */ }
  }

  // trilha procedural original: drone grave, percussão ritual e sinos
  startMusic(theme = 'coliseu') {
    if (!this.ok) return;
    this.stopMusic();
    const c = this.ctx;
    const out = c.createGain(); out.gain.value = 0; out.connect(this.music);
    out.gain.linearRampToValueAtTime(0.9, c.currentTime + 2);
    const nodes = [];
    // v0.4: Templo (escala japonesa in, flauta de sinos espaçada) e Forja (mais grave, batida de martelo)
    const TH = { catedral: [49, 900, 70, [0, 3, 7, 8, 12, 15]], templo: [46.25, 1100, 62, [0, 1, 5, 7, 8, 12]], forja: [36.7, 420, 108, [0, 1, 3, 6, 7, 10]] };
    const th = TH[theme] || [41.2, 500, 96, [0, 1, 5, 7, 8, 12]];
    const base = th[0];
    for (const [mul, type, g] of [[1, 'sawtooth', 0.08], [1.5, 'sine', 0.06], [2.01, 'sawtooth', 0.03]]) {
      const o = c.createOscillator(); o.type = type; o.frequency.value = base * mul;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = th[1];
      const lfo = c.createOscillator(); lfo.frequency.value = 0.07 * mul; const lg = c.createGain(); lg.gain.value = 200; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
      const gg = c.createGain(); gg.gain.value = g;
      o.connect(f); f.connect(gg); gg.connect(out); o.start(); nodes.push(o, lfo);
    }
    let step = 0;
    const bpm = th[2], spb = 60 / bpm / 2;
    const scale = th[3];
    let next = c.currentTime + 0.5;
    const tick = () => {
      if (!this.musicTimer) return;
      while (next < c.currentTime + 0.3) {
        const s = step % 16;
        if (s === 0 || s === 6 || s === 10) this.drum(next, out, 1);
        if (s === 4 || s === 12) this.drum(next, out, 0.5, 180);
        if ((theme === 'catedral' || (theme === 'templo' && s % 16 === 0)) && s % 8 === 0) this.bell(next, out, base * 4 * Math.pow(2, scale[(step / 8 | 0) % scale.length] / 12));
        if (theme === 'forja' && (s === 2 || s === 8)) this.drum(next, out, 0.7, 320);
        if (theme !== 'catedral' && theme !== 'forja' && s % 4 === 2 && Math.random() < 0.5) this.bell(next, out, base * 8 * Math.pow(2, scale[(Math.random() * scale.length) | 0] / 12), 0.03);
        next += spb; step++;
      }
    };
    this.musicTimer = setInterval(tick, 100);
    this.musicNodes = { out, nodes };
    this.musicOn = true;
  }
  drum(t, out, g, f = 60) {
    const c = this.ctx, o = c.createOscillator(); o.frequency.setValueAtTime(f * 2, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.3);
    const gg = c.createGain(); gg.gain.setValueAtTime(0.5 * g, t); gg.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(gg); gg.connect(out); o.start(t); o.stop(t + 0.45);
  }
  bell(t, out, f, g = 0.05) {
    const c = this.ctx;
    for (const m of [1, 2.76, 5.4]) {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * m;
      const gg = c.createGain(); gg.gain.setValueAtTime(g / m, t); gg.gain.exponentialRampToValueAtTime(0.0001, t + 2.5 / m);
      o.connect(gg); gg.connect(out); o.start(t); o.stop(t + 2.6);
    }
  }
  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.musicNodes) {
      const { out, nodes } = this.musicNodes;
      try { out.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6); setTimeout(() => nodes.forEach((n) => n.stop()), 800); } catch (e) {}
      this.musicNodes = null;
    }
    this.musicOn = false;
  }
}
