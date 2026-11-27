// HUD de combate (DOM): vida, rounds, cronômetro, energia, fúria, combos e avisos.
import { keyFor } from './keylabels.js';
import * as C from '../core/constants.js';
import { interactionFor } from '../combat/arena.js';
const $ = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    this.el = $('hud');
    this.ann = $('announce'); this.msgEl = $('msg'); this.flashEl = $('flash'); this.fadeEl = $('fade');
    this.hintEls = [$('hint1'), $('hint2')]; this.stageEl = $('stageName'); this.stageT = 0; this._hint = ['', ''];
    this.annTimer = 0; this.msgTimer = 0; this.comboT = [0, 0];
    this.reduceFlash = false;
    this.lastText = [];
  }
  show(on) { this.el.classList.toggle('hidden', !on); }
  setup(match) {
    match.fighters.forEach((f, i) => {
      $('name' + (i + 1)).textContent = f.ch.name.toUpperCase();
      $('por' + (i + 1)).innerHTML = '<span>' + f.ch.name[0] + '</span>';
    });
    for (let i = 1; i <= 2; i++) for (const s of $('seg' + i).children) if (!s.firstChild) s.appendChild(document.createElement('b'));
  }
  update(match, steps = 1) {
    const F = match.fighters;
    F.forEach((f, i) => {
      const n = i + 1, pct = Math.max(0, f.hp / C.MAX_HP);
      $('hp' + n).style.width = (pct * 100).toFixed(1) + '%';
      $('lag' + n).style.width = (pct * 100).toFixed(1) + '%';
      $('pct' + n).textContent = Math.ceil(pct * 100) + '%' + (f.furyActive ? ' · ' + f.ch.transform.toUpperCase() : '');
      const pips = $('pips' + n);
      const want = C.ROUNDS_TO_WIN;
      if (pips.children.length !== want) pips.innerHTML = '<i></i>'.repeat(want);
      [...pips.children].forEach((p, k) => p.classList.toggle('on', f.wins > k));
      [...$('seg' + n).children].forEach((s, k) => {
        const v = Math.max(0, Math.min(1, (f.meter - k * C.METER_BAR) / C.METER_BAR));
        s.firstChild.style.transform = `scaleX(${v})`;
        s.classList.toggle('full', v >= 1);
      });
      const fury = $('fury' + n);
      fury.style.width = (f.furyActive ? (f.furyActive / C.FURY_DURATION) * 100 : f.fury) + '%';
      fury.parentElement.classList.toggle('ready', f.fury >= C.FURY_MAX && !f.furyActive);
    });
    const t = $('timer');
    t.textContent = match.opts.training ? '∞' : String(match.timer);
    t.classList.toggle('low', match.timer <= 10 && !match.opts.training);
    for (let i = 0; i < 2; i++) {
      if (this.comboT[i] > 0 && (this.comboT[i] -= steps) <= 0) $('combo' + (i + 1)).classList.remove('on');
    }
    this.updateStage(match, steps);
    if (this.annTimer > 0 && (this.annTimer -= steps) <= 0) this.ann.classList.remove('on');
    if (this.msgTimer > 0 && (this.msgTimer -= steps) <= 0) this.msgEl.classList.remove('on');
  }
  announce(text, sub = '', frames = 90, blood = false) {
    this.ann.innerHTML = text + (sub ? '<small>' + sub + '</small>' : '');
    this.ann.classList.toggle('blood', blood);
    this.ann.classList.remove('on'); void this.ann.offsetWidth; this.ann.classList.add('on');
    this.annTimer = frames;
    this.lastText.push(text); if (this.lastText.length > 50) this.lastText.shift();
  }
  // dicas de elemento interativo, nome do cenário e escurecimento da transição
  updateStage(match, steps) {
    const st = match.stage;
    let fade = 0;
    if (match.phase === 'transition' && st && st.trans) {
      const f = st.trans.f;
      fade = f < 55 ? 0 : f < 85 ? (f - 55) / 30 : f < 95 ? 1 : Math.max(0, 1 - (f - 95) / 30);
    }
    if (this.fadeEl) this.fadeEl.style.opacity = fade.toFixed(3);
    match.fighters.forEach((f, i) => {
      const it = match.phase === 'fight' ? interactionFor(st, f) : null;
      const txt = it ? `↑ + ${i === 0 ? keyFor('grab') : 'Num6'} · ${it.name}` : '';
      if (txt !== this._hint[i]) { this._hint[i] = txt; if (this.hintEls[i]) { if (txt) this.hintEls[i].textContent = txt; this.hintEls[i].classList.toggle('on', !!txt); } }
    });
    if (this.stageT > 0 && (this.stageT -= steps) <= 0 && this.stageEl) this.stageEl.classList.remove('on');
  }
  showStageName(text, frames = 180) {
    if (!this.stageEl) return;
    this.stageEl.textContent = text; this.stageEl.classList.add('on'); this.stageT = frames;
  }
  clearAnnounce() { this.ann.classList.remove('on'); this.annTimer = 0; }
  message(text, size = 'small', frames = 50) {
    this.msgEl.textContent = text; this.msgEl.className = 'on ' + size; this.msgTimer = frames;
    this.lastText.push(text); if (this.lastText.length > 50) this.lastText.shift();
  }
  combo(att, n, dmg) {
    const el = $('combo' + (att + 1));
    el.innerHTML = `${n} GOLPES<small>${Math.round(dmg / 10)}% de dano</small>`;
    el.classList.add('on'); this.comboT[att] = 80;
  }
  flash(k = 0.7) {
    if (this.reduceFlash) k *= 0.25;
    this.flashEl.style.transition = 'none'; this.flashEl.style.opacity = String(k);
    requestAnimationFrame(() => { this.flashEl.style.transition = 'opacity .5s'; this.flashEl.style.opacity = '0'; });
  }
}
