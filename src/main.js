// Fluxo do jogo: menus -> seleção -> luta -> resultados. Loop fixo de 60 Hz com renderização independente.
import { Match } from './combat/match.js';
import { CHARACTERS } from './combat/moves.js';
import { CpuController } from './ai/cpu.js';
import { GameView } from './render/view.js';
import { AudioSystem } from './audio/audio.js';
import { InputDevices } from './input/devices.js';
import { Hud } from './ui/hud.js';
import { TouchControls } from './ui/touch.js';
import { Screens } from './ui/screens.js';

const SIM_DT = 1 / 60;
const params = new URLSearchParams(location.search);
const isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && matchMedia('(pointer: coarse)').matches;
const DEFAULTS = { vol_master: 0.8, vol_music: 0.45, vol_sfx: 0.9, vol_voice: 0.8, bloodLevel: '1', bloodPersist: '1', quality: isTouch ? 'baixa' : 'media', reduceShake: '0', reduceFlash: '0', touchMode: 'auto', touchAlpha: '0', difficulty: 1 };

class App {
  constructor() {
    this.settings = { ...DEFAULTS, ...this.loadSettings() };
    if (params.get('q')) this.settings.quality = params.get('q');
    this.errors = [];
    this.audio = new AudioSystem();
    this.applyAudio();
    this.devices = new InputDevices();
    this.hud = new Hud();
    this.hud.reduceFlash = this.settings.reduceFlash === '1';
    this.bloodOpts = { intensity: +this.settings.bloodLevel, persist: this.settings.bloodPersist === '1' };
    this.view = new GameView(document.getElementById('game'), {
      quality: this.settings.quality, blood: this.bloodOpts, reduceShake: this.settings.reduceShake === '1', preserve: params.has('debug'),
    }, this.audio, this.hud);
    this.touch = new TouchControls(this.devices);
    this.touch.setAlpha(this.settings.touchAlpha === '1');
    document.body.classList.toggle('touch', this.touchEnabled());
    this.mode = 'cpu';
    this.state = 'menu';
    this.screens = new Screens(this);
    this.match = null; this.ctrl = [null, null]; this.script = {}; this.timeScale = 1; this.maxSteps = 4;
    this.devices.onKey((code) => this.onKey(code));
    window.addEventListener('pointerdown', () => this.audio.init(), { once: true });
    this.view.loadArena('coliseu');
    this.last = performance.now(); this.acc = 0; this.frames = 0;
    document.getElementById('loading').classList.add('hidden');
    requestAnimationFrame((t) => this.loop(t));
  }
  loadSettings() { try { return JSON.parse(localStorage.getItem('sanguinarium.settings') || '{}'); } catch (e) { return {}; } }
  saveSettings() { try { localStorage.setItem('sanguinarium.settings', JSON.stringify(this.settings)); } catch (e) {} }
  touchEnabled() { return this.settings.touchMode === 'on' || (this.settings.touchMode === 'auto' && isTouch); }
  applyAudio() {
    const s = this.settings;
    Object.assign(this.audio.vol, { master: +s.vol_master, music: +s.vol_music, sfx: +s.vol_sfx, voice: +s.vol_voice });
    this.audio.applyVolumes();
  }
  setOption(k, v) {
    this.settings[k] = v; this.saveSettings();
    if (k.startsWith('vol_')) this.applyAudio();
    if (k === 'bloodLevel') this.bloodOpts.intensity = +v;
    if (k === 'bloodPersist') this.bloodOpts.persist = v === '1';
    if (k === 'reduceShake') this.view.cam.reduceShake = v === '1';
    if (k === 'reduceFlash') this.hud.reduceFlash = v === '1';
    if (k === 'touchMode') document.body.classList.toggle('touch', this.touchEnabled());
    if (k === 'touchAlpha') this.touch.setAlpha(v === '1');
    if (k === 'quality') setTimeout(() => location.reload(), 200);
  }

  onKey(code) {
    this.audio.init();
    if (this.state === 'fight') {
      if (code === 'Escape') this.togglePause();
      else if (this.match && this.match.phase === 'matchEnd' && this.match.pf > 60 && ['Enter', 'KeyJ'].includes(code)) this.showResults();
      return;
    }
    this.screens.key(code);
  }

  startMatch(cfg) {
    this.cfg = cfg;
    const training = cfg.mode === 'training';
    this.devices.clearQueue();
    this.match = new Match({ p1: cfg.p1, p2: cfg.p2, arena: cfg.arena, training });
    this.ctrl = [cfg.cpu1 ? new CpuController(0, cfg.difficulty ?? 2, 77) : null, cfg.mode === 'cpu' || cfg.cpu2 ? new CpuController(1, cfg.difficulty ?? 1, Date.now() & 0xffff) : null];
    this.devices.twoPlayers = cfg.mode === 'versus';
    this.view.loadArena(cfg.arena);
    this.view.setFighters([cfg.p1, cfg.p2]);
    this.hud.setup(this.match); this.hud.show(true); this.hud.clearAnnounce();
    this.touch.show(this.touchEnabled());
    this.screens.show(null);
    this.state = 'fight'; this.resultShown = false; this.lastPhase = null; this.annFlags = {};
    this.acc = 0;
    this.audio.init(); this.audio.startMusic(cfg.arena);
  }
  previewArena(id) { this.view.loadArena(id); }
  togglePause() {
    if (this.state === 'fight') { this.state = 'paused'; this.screens.show('pause'); this.touch.show(false); }
    else if (this.state === 'paused') this.pauseAction('resume');
  }
  pauseAction(act) {
    if (act === 'resume') { this.state = 'fight'; this.devices.clearQueue(); this.screens.show(null); this.touch.show(this.touchEnabled()); }
    else if (act === 'restart') this.startMatch(this.cfg);
    else if (act === 'moves') { this.screens.prevForMoves = 'pause'; this.screens.show('moves'); this.screens.prevForMoves = 'pause'; this.screens.showMoves(this.cfg.p1); }
    else if (act === 'quit') this.toMenu();
  }
  resultAction(act) {
    if (act === 'rematch') this.startMatch(this.cfg);
    else if (act === 'reselect') { this.toMenu(); this.screens.openSelect(); }
    else this.toMenu();
  }
  toMenu() {
    this.state = 'menu'; this.match = null; this.hud.show(false); this.touch.show(false);
    this.screens.show('main'); this.audio.startMusic('menu');
  }
  showResults() {
    if (this.resultShown) return;
    this.resultShown = true; this.state = 'results'; this.touch.show(false);
    this.screens.results(this.match);
  }

  // anúncios conforme a fase da partida
  announcements(m) {
    const F = m.fighters;
    const key = m.phase + ':' + m.round;
    if (this.lastPhase !== key) {
      this.lastPhase = key;
      if (m.phase === 'intro') { this.hud.announce(`ROUND ${m.round}`, m.round === 1 ? `${F[0].ch.name} × ${F[1].ch.name}` : '', 60); this.audio.announce(`Round ${m.round}`); }
      if (m.phase === 'ko') {
        const to = m.timer <= 0;
        this.hud.announce(to ? 'TEMPO!' : 'NOCAUTE', '', 90, !to); this.audio.announce(to ? 'Tempo!' : 'Nocaute!');
      }
      if (m.phase === 'roundEnd') { const w = m.koLoser >= 0 ? F[1 - m.koLoser] : null; this.hud.announce(w ? `${w.ch.name.toUpperCase()} VENCE` : 'EMPATE', 'o round', 100); }
      if (m.phase === 'finish') { this.hud.announce('FINALIZE-O!', 'Sentença de Sangue disponível', 120, true); this.audio.announce('Finalize-o!'); }
      if (m.phase === 'fatality') this.hud.clearAnnounce();
      if (m.phase === 'matchEnd') {
        const r = m.result;
        if (r.fatality) { this.hud.announce('SENTENÇA DE SANGUE', r.fatalityName, 240, true); this.audio.announce('Sentença de sangue'); }
        else if (r.winner >= 0) { this.hud.announce(`${F[r.winner].ch.name.toUpperCase()} VENCE`, '', 200); this.audio.announce(`${F[r.winner].ch.name} vence`); }
        else this.hud.announce('EMPATE', '', 200);
      }
    }
    if (m.phase === 'intro' && m.pf >= 62 && !this.annFlags['lute' + m.round]) { this.annFlags['lute' + m.round] = true; this.hud.announce('LUTE!', '', 50); this.audio.announce('Lute!'); }
  }

  readInputs(m) {
    const bits = [0, 0];
    this.devices.beginStep();
    for (let i = 0; i < 2; i++) {
      if (this.script[i]) bits[i] = this.script[i](m.frame, m) | 0;
      else if (this.ctrl[i]) bits[i] = this.ctrl[i].next(m);
      else if (i === 0 || this.cfg.mode === 'versus') bits[i] = this.devices.read(i);
    }
    return bits;
  }

  loop(now) {
    requestAnimationFrame((t) => this.loop(t));
    try {
      const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now; this.frames++;
      if (this.state === 'fight' && this.match) {
        const m = this.match;
        let speed = this.timeScale;
        if (m.phase === 'ko' && m.pf < 70) speed *= 0.35; // câmera lenta no nocaute
        this.acc += dt * speed;
        let steps = 0;
        while (this.acc >= SIM_DT && steps < this.maxSteps * Math.max(1, this.timeScale)) {
          m.step(this.readInputs(m));
          this.acc -= SIM_DT; steps++;
          this.announcements(m);
        }
        if (steps >= this.maxSteps * Math.max(1, this.timeScale)) this.acc = 0;
        this.hud.update(m, steps);
        this.hud.el.classList.toggle('cine', m.phase === 'fatality' || (m.phase === 'matchEnd' && !!m.result.fatality));
        this.view.update(m, dt, m.drainEvents());
        if (m.phase === 'matchEnd' && m.pf > (m.result.fatality ? 240 : 200)) this.showResults();
      } else if (this.state === 'paused' && this.match) {
        this.view.update(this.match, 0.0001, []);
      } else if (this.state === 'results' && this.match) {
        this.view.update(this.match, dt, []);
      } else {
        const sc = this.screens;
        const ids = sc.cur === 'select' || sc.cur === 'arena' ? sc.sel.map((i) => Object.keys(CHARACTERS)[i]) : ['varkhan', 'lilith'];
        const poses = sc.cur === 'select' || sc.cur === 'arena' ? sc.ready.map((r, i) => (r ? (ids[i] === 'varkhan' ? 'winVarkhan' : 'winLilith') : 'stance')) : ['stance', 'stance'];
        this.view.showroom(ids, dt, poses);
      }
    } catch (e) {
      this.errors.push(String(e && e.stack || e));
      console.error(e);
    }
  }
}

const app = new App();
// API de depuração/testes automatizados (sem efeito no jogo normal)
window.SANG = {
  app,
  get match() { return app.match; },
  start: (cfg) => app.startMatch({ p1: 'varkhan', p2: 'lilith', arena: 'coliseu', mode: 'cpu', difficulty: 1, ...cfg }),
  state: () => {
    const m = app.match;
    return {
      app: app.state, screen: app.screens.cur, errors: app.errors.slice(),
      match: m && { phase: m.phase, pf: m.pf, round: m.round, timer: m.timer, frame: m.frame, result: m.result,
        fighters: m.fighters.map((f) => ({ char: f.charId, hp: f.hp, wins: f.wins, meter: f.meter, state: f.state, x: +f.x.toFixed(2), combo: f.stats.maxCombo, hits: f.stats.hits })) },
      hudText: app.hud.lastText.slice(-12), audio: app.audio.log.slice(-20), decals: app.view.blood.decals.active,
    };
  },
  debug: {
    setHp: (i, hp) => { app.match.fighters[i].hp = hp; },
    setWins: (i, n) => { app.match.fighters[i].wins = n; },
    setMeter: (i, v) => { app.match.fighters[i].meter = v; },
    setFury: (i, v) => { app.match.fighters[i].fury = v; },
  },
};
window.addEventListener('error', (e) => app.errors.push(String(e.message)));
window.addEventListener('unhandledrejection', (e) => app.errors.push(String(e.reason)));
