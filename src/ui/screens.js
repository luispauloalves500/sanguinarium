// Telas de menu (DOM): principal, seleção de lutador/arena, opções, lista de golpes, pausa e resultados.
import { CHARACTERS, ARENAS, moveFrameData } from '../combat/moves.js';
import { DIFFICULTIES } from '../ai/cpu.js';
import { ACTIONS, ACTION_LABEL, keyName } from '../input/devices.js';
import { buildLadder } from '../modes/arcade.js';
const $ = (id) => document.getElementById(id);
const IDS = Object.keys(CHARACTERS);
const BTN_LABEL = { lp: 'J', hp: 'K', lk: 'U', hk: 'I' };
const NORMAL_LABEL = { lp: 'J', lp2: 'J (após J)', lk2: 'U (após U)', hp: 'K', lk: 'U', hk: 'I', clp: '↓ + J', chp: '↓ + K', clk: '↓ + U', chk: '↓ + I', jlp: 'no ar + J', jhp: 'no ar + K', jlk: 'no ar + U', jhk: 'no ar + I' };
const LEVEL = { high: 'Alto', mid: 'Médio', low: 'Baixo', overhead: 'Por cima', unblockable: 'Imbloqueável' };

export class Screens {
  constructor(app) {
    this.app = app; this.cur = 'title'; this.prev = 'main'; this.focus = 0;
    this.sel = [0, 1]; this.ready = [false, false]; this.arenaSel = 0; this.diff = app.settings.difficulty;
    this.buildArenaList(); this.buildOptions();
    document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => this.back(b.dataset.back)));
    $('mainMenu').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) this.mainAction(b.dataset.act); });
    $('pauseMenu').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) app.pauseAction(b.dataset.act); });
    $('endMenu').addEventListener('click', () => app.toMenu());
    $('keymapReset').addEventListener('click', () => { app.devices.setBindings(null); app.setOption('keymap1', ''); this.buildKeymap(); });
    $('resultMenu').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) app.resultAction(b.dataset.act); });
    $('scr-title').addEventListener('click', () => this.titleGo()); // click (não pointerdown) para o toque não atravessar para o menu
    document.querySelectorAll('#scr-moves .tabs button').forEach((b) => b.addEventListener('click', () => this.showMoves(b.dataset.ch)));
    $('diffPrev').addEventListener('click', () => this.setDiff(-1)); $('diffNext').addEventListener('click', () => this.setDiff(1));
    $('pauseBtn').addEventListener('click', () => app.togglePause());
    this.setDiff(0);
  }
  show(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
    if (name) $('scr-' + name).classList.remove('hidden');
    if (name && name !== 'moves') this.prevForMoves = name;
    this.cur = name; this.focus = 0; this.refreshFocus();
    this.app.audio.play('ui', { alt: true });
  }
  titleGo() { if (this.cur !== 'title') return; this.app.audio.init(); this.app.audio.startMusic('menu'); this.show('main'); }
  back(where) {
    if (where === 'prev') where = this.prevForMoves === 'moves' ? 'main' : this.prevForMoves || 'main';
    if (where === 'pause') { this.show('pause'); return; }
    this.show(where);
  }
  menuButtons() {
    const s = $('scr-' + this.cur);
    return s ? [...s.querySelectorAll('nav.menu button')] : [];
  }
  refreshFocus() { const bs = this.menuButtons(); bs.forEach((b, i) => b.classList.toggle('sel', i === this.focus)); }
  // navegação por teclado
  key(code) {
    const app = this.app;
    if (this.cur === 'title') { if (['Enter', 'KeyJ', 'Space', 'NumpadEnter'].includes(code)) this.titleGo(); return; }
    if (this.cur === 'select') return this.selectKey(code);
    if (this.cur === 'arena') return this.arenaKey(code);
    const bs = this.menuButtons();
    if (['KeyW', 'ArrowUp'].includes(code)) { this.focus = (this.focus + bs.length - 1) % Math.max(1, bs.length); this.refreshFocus(); app.audio.play('ui'); }
    else if (['KeyS', 'ArrowDown'].includes(code)) { this.focus = (this.focus + 1) % Math.max(1, bs.length); this.refreshFocus(); app.audio.play('ui'); }
    else if (['Enter', 'KeyJ', 'NumpadEnter'].includes(code)) { if (bs[this.focus]) bs[this.focus].click(); }
    else if (code === 'Escape' || code === 'KeyK') {
      if (this.cur === 'pause') app.pauseAction('resume');
      else if (this.cur === 'moves') this.back('prev');
      else if (['options', 'credits'].includes(this.cur)) this.back('main');
    }
  }
  mainAction(act) {
    const app = this.app;
    app.audio.play('confirm');
    if (act === 'cpu' || act === 'versus' || act === 'training' || act === 'arcade') { app.mode = act; this.openSelect(); }
    else if (act === 'moves') { this.show('moves'); this.showMoves('varkhan'); }
    else if (act === 'options') this.show('options');
    else if (act === 'credits') this.show('credits');
  }
  // ---------------- seleção de lutadores
  openSelect() {
    this.ready = [false, this.app.mode !== 'versus' ? false : false];
    this.show('select');
    $('diffRow').classList.toggle('hidden', this.app.mode !== 'cpu' && this.app.mode !== 'arcade');
    this.renderPicks();
  }
  renderPicks() {
    const mode = this.app.mode;
    for (let p = 0; p < 2; p++) {
      const el = $('pick' + (p + 1));
      if (mode === 'arcade' && p === 1) {
        const lad = buildLadder(IDS[this.sel[0]], this.diff);
        el.innerHTML = `<h4>ESCADA ARCADE</h4><ol class="ladder">${lad.map((s, i) => `<li><b>Luta ${i + 1}</b> · ${s.title} · ${ARENAS[s.arena].name} · ${DIFFICULTIES[s.difficulty]}</li>`).join('')}</ol><div class="bio">Vença as 3 lutas para ver o final de ${CHARACTERS[IDS[this.sel[0]]].name}. Perder permite continuar a mesma luta.</div>`;
        el.classList.remove('ready');
        continue;
      }
      const label = p === 0 ? 'JOGADOR 1' : mode === 'versus' ? 'JOGADOR 2' : mode === 'training' ? 'BONECO DE TREINO' : 'CPU';
      const ch = CHARACTERS[IDS[this.sel[p]]];
      el.innerHTML = `<h4>${label}${this.ready[p] ? ' — PRONTO' : ''}</h4><div class="cards">${IDS.map((id, i) => `<div class="card ${i === this.sel[p] ? 'sel' : ''}" data-p="${p}" data-i="${i}"><div class="emb">${CHARACTERS[id].name[0]}</div><div class="nm">${CHARACTERS[id].name.toUpperCase()}</div><div class="tt">${CHARACTERS[id].title}</div></div>`).join('')}</div><div class="bio">${ch.bio}</div><button class="ok" data-p="${p}">${this.ready[p] ? 'Cancelar' : 'Confirmar'}</button>`;
      el.classList.toggle('ready', this.ready[p]);
    }
    document.querySelectorAll('.card').forEach((c) => c.addEventListener('click', () => { const p = +c.dataset.p; if (this.canPick(p)) { this.sel[p] = +c.dataset.i; this.ready[p] = false; this.app.audio.play('ui'); this.renderPicks(); } }));
    document.querySelectorAll('.pick .ok').forEach((b) => b.addEventListener('click', () => this.confirmPick(+b.dataset.p)));
  }
  canPick(p) { return p === 0 || this.app.mode === 'versus' || this.ready[0]; }
  confirmPick(p) {
    if (this.app.mode === 'arcade') {
      if (p !== 0) return;
      this.ready[0] = true; this.app.audio.play('confirm'); this.renderPicks();
      setTimeout(() => this.app.startArcade(IDS[this.sel[0]], this.diff), 250);
      return;
    }
    if (!this.canPick(p)) return;
    this.ready[p] = !this.ready[p];
    this.app.audio.play(this.ready[p] ? 'confirm' : 'ui');
    this.renderPicks();
    if (this.ready[0] && this.ready[1]) setTimeout(() => { this.show('arena'); this.renderArenas(); }, 250);
  }
  selectKey(code) {
    const m = { KeyA: [0, -1], KeyD: [0, 1], ArrowLeft: [this.app.mode === 'versus' ? 1 : this.ready[0] ? 1 : 0, -1], ArrowRight: [this.app.mode === 'versus' ? 1 : this.ready[0] ? 1 : 0, 1] };
    if (m[code]) {
      let [p, d] = m[code];
      if (p === 0 && this.ready[0] && this.app.mode !== 'versus') p = 1;
      if (this.ready[p]) return;
      this.sel[p] = (this.sel[p] + d + IDS.length) % IDS.length; this.app.audio.play('ui'); this.renderPicks();
    } else if (code === 'KeyJ' || (code === 'Enter' && this.app.mode !== 'versus')) {
      this.confirmPick(this.ready[0] && this.app.mode !== 'versus' ? 1 : 0);
    } else if (['Numpad1', 'Insert', 'Enter', 'NumpadEnter'].includes(code)) this.confirmPick(1);
    else if (code === 'Escape') this.back('main');
  }
  setDiff(d) { this.diff = Math.max(0, Math.min(4, this.diff + d)); $('diffName').textContent = DIFFICULTIES[this.diff]; this.app.settings.difficulty = this.diff; this.app.saveSettings(); if (this.cur === 'select' && this.app.mode === 'arcade') this.renderPicks(); }
  // ---------------- arenas
  buildArenaList() {
    const sw = { coliseu: 'linear-gradient(#3a0505, #8a2a10 60%, #4a2a1e)', catedral: 'linear-gradient(#0a0618, #3a2a5a 50%, #1d1a20)' };
    $('arenaList').innerHTML = Object.values(ARENAS).map((a, i) => `<div class="arena" data-i="${i}"><div class="sw" style="background:${sw[a.id]}"></div><h4>${a.name.toUpperCase()}</h4><p>${a.desc}</p></div>`).join('');
    $('arenaList').querySelectorAll('.arena').forEach((el) => el.addEventListener('click', () => { const i = +el.dataset.i; if (i === this.arenaSel) this.goFight(); else { this.arenaSel = i; this.renderArenas(); } }));
  }
  renderArenas() { $('arenaList').querySelectorAll('.arena').forEach((el, i) => el.classList.toggle('sel', i === this.arenaSel)); this.app.previewArena(Object.keys(ARENAS)[this.arenaSel]); }
  arenaKey(code) {
    const n = Object.keys(ARENAS).length;
    if (['KeyA', 'ArrowLeft', 'KeyW', 'ArrowUp'].includes(code)) { this.arenaSel = (this.arenaSel + n - 1) % n; this.renderArenas(); this.app.audio.play('ui'); }
    else if (['KeyD', 'ArrowRight', 'KeyS', 'ArrowDown'].includes(code)) { this.arenaSel = (this.arenaSel + 1) % n; this.renderArenas(); this.app.audio.play('ui'); }
    else if (['KeyJ', 'Enter', 'Numpad1', 'NumpadEnter'].includes(code)) this.goFight();
    else if (code === 'Escape') { this.openSelect(); }
  }
  goFight() {
    this.app.audio.play('confirm');
    this.app.startMatch({ p1: IDS[this.sel[0]], p2: IDS[this.sel[1]], arena: Object.keys(ARENAS)[this.arenaSel], mode: this.app.mode, difficulty: this.diff });
  }
  // ---------------- opções
  buildOptions() {
    const s = this.app.settings;
    const opts = [
      ['Volume geral', 'range', 'vol_master'], ['Música', 'range', 'vol_music'], ['Efeitos', 'range', 'vol_sfx'], ['Voz do locutor', 'range', 'vol_voice'],
      ['Intensidade do sangue', 'select', 'bloodLevel', [['0', 'Desligado'], ['0.5', 'Baixa'], ['1', 'Normal'], ['2', 'Extrema']]],
      ['Persistência do sangue entre rounds', 'select', 'bloodPersist', [['1', 'Sim'], ['0', 'Não']]],
      ['Perigos e transições de arena', 'select', 'hazards', [['1', 'Ativados'], ['0', 'Desativados (competitivo)']]],
      ['Qualidade gráfica (recarrega)', 'select', 'quality', [['auto', 'Automática (ajusta a resolução)'], ['baixa', 'Baixa'], ['media', 'Média'], ['alta', 'Alta']]],
      ['Mostrar qps', 'select', 'showFps', [['0', 'Não'], ['1', 'Sim']]],
      ['Redução de tremor da câmera', 'select', 'reduceShake', [['0', 'Não'], ['1', 'Sim']]],
      ['Redução de flashes', 'select', 'reduceFlash', [['0', 'Não'], ['1', 'Sim']]],
      ['Controles de toque', 'select', 'touchMode', [['auto', 'Automático'], ['on', 'Sempre'], ['off', 'Nunca']]],
      ['Transparência dos botões de toque', 'select', 'touchAlpha', [['0', 'Normal'], ['1', 'Alta']]],
    ];
    $('optList').innerHTML = opts.map(([label, type, key, choices]) => {
      const v = s[key];
      if (type === 'range') return `<label>${label}</label><input type="range" min="0" max="1" step="0.05" value="${v}" data-k="${key}">`;
      return `<label>${label}</label><select data-k="${key}">${choices.map(([val, t]) => `<option value="${val}" ${String(v) === val ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
    }).join('');
    $('optList').querySelectorAll('[data-k]').forEach((el) => el.addEventListener('input', () => this.app.setOption(el.dataset.k, el.value)));
    this.buildKeymap();
  }
  // remapeamento das teclas do P1: clique e pressione a nova tecla (Esc cancela; tecla repetida troca com a outra ação)
  buildKeymap() {
    const dev = this.app.devices, b = dev.getBindings();
    $('keymapList').innerHTML = ACTIONS.map((a) => `<label>${ACTION_LABEL[a]}</label><button data-a="${a}">${keyName(b[a])}</button>`).join('');
    $('keymapList').querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => {
      btn.textContent = 'Pressione uma tecla… (Esc cancela)'; btn.classList.add('wait');
      dev.capture = (code) => {
        if (code !== 'Escape') { const nb = dev.rebind(btn.dataset.a, code); this.app.setOption('keymap1', JSON.stringify(nb)); }
        this.buildKeymap();
      };
    }));
  }
  ending(charId, end, continues) {
    const ch = CHARACTERS[charId];
    $('endTitle').textContent = `FINAL DE ${ch.name.toUpperCase()} — ${end.title}`;
    $('endText').innerHTML = end.text.map((t) => `<p>${t}</p>`).join('') + `<p class="sig">Escada Arcade concluída${continues ? ` · ${continues} continuaç${continues > 1 ? 'ões' : 'ão'}` : ' sem continuar'}</p>`;
    this.show('ending');
    this.app.audio.startMusic('menu');
  }
  // ---------------- lista de golpes
  showMoves(id) {
    document.querySelectorAll('#scr-moves .tabs button').forEach((b) => b.classList.toggle('on', b.dataset.ch === id));
    const el = $('moveList');
    if (id === 'controls') { el.innerHTML = controlsHtml(); return; }
    const ch = CHARACTERS[id];
    const rowN = (mid) => { const m = ch.moves[mid]; const fd = moveFrameData(m); const h = m.hits[0]; return `<tr><td>${m.name}</td><td>${NORMAL_LABEL[mid] || ''}</td><td>${h ? h.dmg : '-'}</td><td>${h ? LEVEL[h.level] : '-'}</td><td>${fd.startup ?? '-'}</td><td>${m.air ? '-' : fd.advBlock ?? '-'}</td></tr>`; };
    const normals = ['lp', 'hp', 'lk', 'hk', 'clp', 'chp', 'clk', 'chk', 'jlp', 'jhp', 'jlk', 'jhk'];
    const specials = ch.specials.map((s) => { const m = ch.moves[s.move]; const t = m.spawn ? ch.projectiles[m.spawn[0].proj] : null; const dmg = t ? t.hit.dmg : m.hits.reduce((a, h) => a + h.dmg, 0) || '-'; return `<tr><td>${m.name}</td><td>${s.cmd.label}${s.simple ? ` <small>(ESP${{ n: '', f: ' + →', b: ' + ←', d: ' + ↓' }[s.simple]})</small>` : ''}</td><td>${dmg}</td></tr>`; }).join('');
    el.innerHTML = `<h5>${ch.name.toUpperCase()}, ${ch.title.toUpperCase()}</h5>
      <table><tr><th>Golpe básico</th><th>Comando</th><th>Dano</th><th>Nível</th><th>Início</th><th>Vant. bloqueio</th></tr>${normals.map(rowN).join('')}
      <tr><td>${ch.throwName} (agarrão)</td><td>O (perto)</td><td>${ch.throwDmg}</td><td>Agarrão</td><td>-</td><td>-</td></tr></table>
      <h5>ESPECIAIS (J+K durante o especial = Potencializado, 1 barra)</h5><table><tr><th>Especial</th><th>Comando</th><th>Dano</th></tr>${specials}</table>
      <h5>SUPERGOLPES (2 barras)</h5><table><tr><th>Supergolpe</th><th>Comando</th><th>Dano</th><th>Nível</th></tr>${[[ch.superMove, 'U + I (ou ESP + ↑)'], [ch.superMove2, '↓ + U + I (ou ESP + ↗)']].filter(([id]) => id).map(([id, cmd]) => { const m = ch.moves[id]; return `<tr><td>${m.name}</td><td>${cmd}</td><td>${m.seq.hits.reduce((a, h) => a + h.dmg, 0)}</td><td>${LEVEL[m.hits[0].level]}</td></tr>`; }).join('')}</table>
      <h5>TRANSFORMAÇÃO (Fúria cheia)</h5><table><tr><td>${ch.transform}</td><td>L + O</td><td>+20% de dano por 10 s</td></tr></table>
      <h5>COMBOS</h5><table>${ch.combos.map((c) => `<tr><td>${c.name}</td><td>${c.input}</td></tr>`).join('')}</table>
      <h5>SENTENÇAS DE SANGUE (após "FINALIZE-O!")</h5><table>${ch.fatalities.map((f) => `<tr><td>${f.name}${f.proposal ? ' <small>(proposta v0.2)</small>' : ''}</td><td>${f.label}</td><td>Toque: ESP${{ n: '', d: ' + ↓', f: ' + →', b: ' + ←' }[f.simple] || ''}</td></tr>`).join('')}</table>
      <h5>ARENAS INTERATIVAS (desativáveis em Opções)</h5><table>
      <tr><td>Corrente do Muro (Coliseu/Fosso)</td><td>↑ + O de costas para a borda</td><td>salta por cima do oponente</td></tr>
      <tr><td>Estátua do Carrasco (Catedral/Cripta)</td><td>↑ + O de costas para a borda</td><td>tomba sobre o oponente (90, alto; 1 por lado/round)</td></tr>
      <tr><td>Poço de Lava / Braseiro Profano</td><td>derrube o oponente na borda</td><td>+50 de dano</td></tr>
      <tr><td>Transição (Portão do Fosso / Queda na Cripta)</td><td>golpe pesado que derruba colado à borda</td><td>+70 de dano e muda de cenário (1 vez por luta)</td></tr></table>`;
  }
  results(match, arcade) {
    const r = match.result;
    let btns = [['rematch', 'Revanche'], ['reselect', 'Escolher lutadores'], ['quit', 'Menu principal']];
    if (arcade) {
      const last = arcade.stage >= arcade.ladder.length - 1;
      btns = r.winner === 0 ? [last ? ['ending', 'Ver o final'] : ['next', `Próxima luta (${arcade.stage + 2}/${arcade.ladder.length})`], ['quit', 'Desistir (menu)']]
        : [['retry', 'Continuar (tentar de novo)'], ['quit', 'Menu principal']];
    }
    $('resultMenu').innerHTML = btns.map(([a, t]) => `<button data-act="${a}">${t}</button>`).join('');
    const w = r.winner >= 0 ? match.fighters[r.winner] : null;
    $('resTitle').textContent = w ? `${w.ch.name.toUpperCase()} VENCE` : 'EMPATE';
    $('resSub').textContent = r.fatality ? `SENTENÇA DE SANGUE: ${r.fatalityName}` : w ? 'Misericórdia… ou fraqueza?' : '';
    $('resStats').innerHTML = match.fighters.map((f) => `<b>${f.ch.name}</b>: ${f.stats.hits} acertos · maior combo ${f.stats.maxCombo} · dano ${Math.round(f.stats.dmg / 10)}% · bloqueios ${f.stats.blocks}`).join('<br>');
    this.show('results');
  }
}

export function controlsHtml() {
  return `<h5>TECLADO — JOGADOR 1</h5><table>
  <tr><td>Movimento</td><td>W A S D (setas também no modo 1 jogador)</td></tr>
  <tr><td>Soco rápido / forte</td><td>J / K</td></tr><tr><td>Chute rápido / forte</td><td>U / I</td></tr>
  <tr><td>Bloqueio</td><td>L (segure; agachado bloqueia baixos)</td></tr><tr><td>Agarrão</td><td>O</td></tr>
  <tr><td>Esquiva</td><td>Espaço</td></tr><tr><td>Especial simplificado</td><td>P (+ direção)</td></tr>
  <tr><td>Especial potencializado</td><td>Comando + J+K</td></tr><tr><td>Supergolpe 1 / 2</td><td>U + I / ↓ + U + I</td></tr>
  <tr><td>Elemento da arena</td><td>↑ + O perto da borda (de costas para ela)</td></tr>
  <tr><td>Transformação (Fúria cheia)</td><td>L + O</td></tr><tr><td>Quebra de combo (2 barras)</td><td>Espaço + L durante combo sofrido</td></tr>
  <tr><td>Escapar de agarrão</td><td>O logo após ser agarrado</td></tr><tr><td>Pausa</td><td>Esc</td></tr></table>
  <h5>TECLADO — JOGADOR 2</h5><table>
  <tr><td>Movimento</td><td>Setas</td></tr><tr><td>Soco rápido / forte</td><td>Num1 / Num2 (ou Insert / Home)</td></tr>
  <tr><td>Chute rápido / forte</td><td>Num4 / Num5 (ou Delete / End)</td></tr><tr><td>Bloqueio / Agarrão</td><td>Num3 / Num6 (ou PageDown / PageUp)</td></tr>
  <tr><td>Esquiva / Especial simplificado</td><td>Num0 / Num+ (ou Shift direito / Enter)</td></tr></table>
  <h5>CELULAR</h5><table><tr><td>Direcional virtual</td><td>lado esquerdo</td></tr><tr><td>SR SF CR CF</td><td>socos e chutes rápido/forte</td></tr><tr><td>DEF / AGR / ESQ</td><td>bloqueio, agarrão, esquiva</td></tr><tr><td>ESP</td><td>especial simplificado (neutro, →, ←, ↓; ↑ = supergolpe 1, ↗ = supergolpe 2). Na finalização: ESP, ESP+↓, ESP+→, ESP+← escolhem a Sentença</td></tr></table>
  <h5>GAMEPAD</h5><table><tr><td>X/Y</td><td>socos</td></tr><tr><td>A/B</td><td>chutes</td></tr><tr><td>RB/RT</td><td>bloqueio</td></tr><tr><td>LB</td><td>agarrão</td></tr><tr><td>LT</td><td>esquiva</td></tr><tr><td>L3/R3</td><td>especial simplificado</td></tr></table>`;
}
