// DADOS de golpes (sem lógica). Caixas [x0, y0, x1, y1] relativas ao lutador virado para a direita.
// Quadros: f0..f1 inclusivos de atividade. Vantagem (bloqueio/acerto) é calculada em moveFrameData().

function hit(f0, f1, box, dmg, level, o = {}) {
  return { f0, f1, box, dmg, level, hs: 16, bs: 11, push: 0.07, ...o };
}
function mv(id, name, frames, hits, o = {}) {
  return { id, name, frames, hits, kind: 'normal', cancel: [], ...o };
}

const STD_CANCEL = ['special', 'super'];

// ---------------- VARKHAN, O CARRASCO ----------------
const varkhanMoves = {
  lp: mv('lp', 'Golpe de Cabo', 17, [hit(5, 7, [0.25, 1.25, 1.2, 1.65], 37, 'high', { hs: 15, bs: 11 })],
    { cancel: ['lp2', 'hk', ...STD_CANCEL], anim: 'jab' }),
  lp2: mv('lp2', 'Golpe de Cabo (2)', 20, [hit(6, 8, [0.25, 1.2, 1.2, 1.65], 35, 'high', { hs: 16, bs: 11 })],
    { cancel: ['hp', ...STD_CANCEL], anim: 'jab2', chainOnly: true }),
  hp: mv('hp', 'Machadada', 33, [hit(11, 14, [0.3, 0.8, 1.8, 1.8], 80, 'mid', { hs: 22, bs: 16, push: 0.11, heavy: true, slash: true })],
    { cancel: STD_CANCEL, anim: 'axeSwing' }),
  lk: mv('lk', 'Chute de Bota', 23, [hit(8, 10, [0.25, 0.4, 1.25, 0.95], 40, 'mid', { hs: 16, bs: 11 })],
    { cancel: ['hp', ...STD_CANCEL], anim: 'kickMid' }),
  hk: mv('hk', 'Pisão do Carrasco', 37, [hit(13, 16, [0.25, 1.0, 1.45, 1.75], 80, 'high', { hs: 22, bs: 15, push: 0.12, heavy: true })],
    { cancel: STD_CANCEL, anim: 'kickHigh' }),
  clp: mv('clp', 'Soco Agachado', 17, [hit(5, 7, [0.25, 0.55, 1.05, 1.0], 25, 'mid', { hs: 14, bs: 10 })],
    { crouch: true, cancel: ['clp', 'chp', ...STD_CANCEL], anim: 'cjab' }),
  chp: mv('chp', 'Gancho Ascendente', 35, [hit(9, 12, [0.1, 0.8, 1.05, 2.3], 90, 'mid', { launch: 0.23, kd: true, hs: 30, bs: 14, heavy: true, push: 0.03 })],
    { crouch: true, cancel: ['special'], anim: 'uppercut' }),
  clk: mv('clk', 'Chute Baixo', 20, [hit(6, 8, [0.25, 0, 1.25, 0.35], 30, 'low', { hs: 14, bs: 10 })],
    { crouch: true, cancel: ['clk', 'special'], anim: 'clow' }),
  chk: mv('chk', 'Rasteira', 36, [hit(10, 13, [0.25, 0, 1.6, 0.35], 65, 'low', { kd: true, launch: 0.07, hs: 30, bs: 13, heavy: true })],
    { crouch: true, anim: 'sweep' }),
  jlp: mv('jlp', 'Soco Aéreo', 40, [hit(4, 16, [0.05, 0.6, 0.9, 1.25], 30, 'overhead', { hs: 16, bs: 10 })], { air: true, anim: 'jpunch' }),
  jhp: mv('jhp', 'Machado Descendente', 40, [hit(7, 16, [0.05, 0.1, 1.15, 1.3], 65, 'overhead', { hs: 20, bs: 13, heavy: true, slash: true })], { air: true, anim: 'jaxe' }),
  jlk: mv('jlk', 'Joelhada Aérea', 40, [hit(4, 16, [0.05, 0.3, 0.85, 0.95], 35, 'overhead', { hs: 16, bs: 10 })], { air: true, anim: 'jknee' }),
  jhk: mv('jhk', 'Chute Voador', 40, [hit(7, 15, [0.15, 0.35, 1.2, 1.0], 70, 'overhead', { hs: 20, bs: 13, heavy: true })], { air: true, anim: 'jkick' }),
  grab_whiff: mv('grab_whiff', 'Agarrão (errou)', 28, [], { anim: 'grab' }),
  // ---- especiais
  machado: mv('machado', 'Machado do Abismo', 36, [], { kind: 'special', anim: 'throwAxe',
    spawn: [{ f: 14, proj: 'axe' }] }),
  corrente: mv('corrente', 'Corrente da Morte', 42, [hit(12, 18, [0.4, 1.0, 3.6, 1.55], 40, 'mid', { effect: 'pull', hs: 34, bs: 14, push: 0, chain: true })],
    { kind: 'special', anim: 'chainCast' }),
  julgamento: mv('julgamento', 'Julgamento', 48, [hit(20, 24, [0.3, 0, 1.85, 2.1], 120, 'overhead', { kd: true, launch: 0.05, hs: 30, bs: 18, push: 0.12, heavy: true, slash: true, hitstop: 12 })],
    { kind: 'special', anim: 'overhead' }),
  tormenta: mv('tormenta', 'Tormenta de Aço', 52, [
    hit(12, 14, [-0.6, 0.7, 1.45, 1.7], 30, 'mid', { hs: 18, bs: 10, push: 0.02, slash: true }),
    hit(20, 22, [-0.6, 0.7, 1.45, 1.7], 30, 'mid', { hs: 18, bs: 10, push: 0.02, slash: true }),
    hit(28, 30, [-0.6, 0.7, 1.45, 1.7], 30, 'mid', { hs: 18, bs: 10, push: 0.02, slash: true }),
    hit(36, 38, [-0.6, 0.7, 1.55, 1.7], 40, 'mid', { hs: 24, bs: 12, push: 0.12, kd: true, launch: 0.1, slash: true }),
  ], { kind: 'special', anim: 'spin', vel: [{ f0: 8, f1: 40, vx: 0.05 }] }),
  prisao: mv('prisao', 'Prisão Infernal', 44, [], { kind: 'special', anim: 'chainCast', spawn: [{ f: 15, proj: 'prison' }] }),
  passo: mv('passo', 'Passo Fantasma', 42, [hit(17, 20, [0.2, 0.8, 1.35, 1.75], 70, 'mid', { hs: 22, bs: 14, push: 0.1, heavy: true, slash: true })],
    { kind: 'special', anim: 'dashSlash', vel: [{ f0: 6, f1: 16, vx: 0.3 }], invuln: [4, 14] }),
  ruptura: mv('ruptura', 'Ruptura do Solo', 46, [], { kind: 'special', anim: 'groundSlam', spawn: [{ f: 18, proj: 'wave' }] }),
  ira: mv('ira', 'Ira do Carrasco', 62, [
    hit(14, 16, [0.25, 0.7, 1.5, 1.8], 45, 'mid', { hs: 20, bs: 12, push: 0.02, heavy: true, slash: true }),
    hit(27, 29, [0.25, 0.7, 1.5, 1.8], 45, 'mid', { hs: 20, bs: 12, push: 0.02, heavy: true, slash: true }),
    hit(41, 44, [0.25, 0, 1.6, 2.0], 70, 'mid', { hs: 30, bs: 16, push: 0.14, kd: true, launch: 0.08, heavy: true, slash: true, hitstop: 12 }),
  ], { kind: 'special', anim: 'rage', vel: [{ f0: 10, f1: 40, vx: 0.025 }] }),
  // ---- supergolpe
  execucao: mv('execucao', 'Execução Carmesim', 52, [hit(10, 16, [0.2, 0.5, 1.7, 1.9], 0, 'mid', { effect: 'cinematic', bs: 12, push: 0.1 })],
    { kind: 'super', anim: 'superStart', vel: [{ f0: 4, f1: 12, vx: 0.18 }], invuln: [0, 10],
      seq: { dur: 130, hits: [{ f: 28, dmg: 70 }, { f: 52, dmg: 70 }, { f: 76, dmg: 80 }, { f: 108, dmg: 110 }] } }),
  // 2º supergolpe (GDD §8): correntes espectrais prendem o réu diante do tribunal
  tribunal: mv('tribunal', 'Tribunal dos Condenados', 56, [hit(13, 19, [0.3, 0.6, 3.0, 1.7], 0, 'mid', { effect: 'cinematic', bs: 14, push: 0.08, chain: true })],
    { kind: 'super', anim: 'chainCast', invuln: [0, 12],
      seq: { dur: 170, hits: [{ f: 40, dmg: 50 }, { f: 62, dmg: 50 }, { f: 84, dmg: 50 }, { f: 140, dmg: 170 }] } }),
};
varkhanMoves.lp.chainName = 'Sentença Tripla';

const varkhanProj = {
  axe: { vx: 0.17, y: 1.25, box: [-0.35, -0.3, 0.35, 0.3], life: 70, clash: true, fx: 'axe',
    hit: hit(0, 0, null, 80, 'mid', { hs: 22, bs: 14, push: 0.1, slash: true }), ex: { vx: 0.24, dmg: 115 } },
  prison: { vx: 0.13, y: 1.1, box: [-0.4, -0.4, 0.4, 0.4], life: 60, clash: true, fx: 'chains',
    hit: hit(0, 0, null, 20, 'mid', { effect: 'freeze', freeze: 70, hs: 20, bs: 12, push: 0 }), ex: { freeze: 105, dmg: 40 } },
  wave: { vx: 0.14, y: 0.15, box: [-0.45, -0.15, 0.45, 0.35], life: 60, clash: false, fx: 'wave', ground: true,
    hit: hit(0, 0, null, 70, 'low', { kd: true, launch: 0.12, hs: 30, bs: 14, push: 0.06, heavy: true }), ex: { vx: 0.19, dmg: 100 } },
};

// ---------------- LILITH, A BRUXA CARMESIM ----------------
const lilithMoves = {
  lp: mv('lp', 'Tapa Arcano', 15, [hit(4, 6, [0.25, 1.2, 1.0, 1.6], 28, 'high', { hs: 14, bs: 10 })],
    { cancel: ['hp', 'lk', ...STD_CANCEL], anim: 'jab' }),
  hp: mv('hp', 'Garra Sombria', 25, [hit(8, 10, [0.25, 0.95, 1.25, 1.65], 55, 'mid', { hs: 18, bs: 13, push: 0.09, slash: true })],
    { cancel: ['hk', ...STD_CANCEL], anim: 'claw' }),
  lk: mv('lk', 'Chute Serpente', 19, [hit(6, 8, [0.25, 0.4, 1.2, 0.95], 35, 'mid', { hs: 15, bs: 10 })],
    { cancel: ['lk2', 'hp', ...STD_CANCEL], anim: 'kickMid' }),
  lk2: mv('lk2', 'Chute Serpente (2)', 20, [hit(6, 8, [0.25, 0.9, 1.25, 1.55], 35, 'high', { hs: 16, bs: 10 })],
    { cancel: ['hp', ...STD_CANCEL], anim: 'kickHigh', chainOnly: true }),
  hk: mv('hk', 'Chute Carmesim', 31, [hit(10, 13, [0.25, 0.9, 1.45, 1.7], 65, 'high', { hs: 20, bs: 14, push: 0.11, heavy: true })],
    { cancel: STD_CANCEL, anim: 'kickHigh' }),
  clp: mv('clp', 'Soco Agachado', 15, [hit(4, 6, [0.25, 0.55, 1.0, 1.0], 22, 'mid', { hs: 13, bs: 9 })],
    { crouch: true, cancel: ['clp', 'chp', ...STD_CANCEL], anim: 'cjab' }),
  chp: mv('chp', 'Ascensão Sangrenta', 32, [hit(8, 11, [0.1, 0.8, 1.0, 2.3], 80, 'mid', { launch: 0.23, kd: true, hs: 30, bs: 13, heavy: true, push: 0.03 })],
    { crouch: true, cancel: ['special'], anim: 'uppercut' }),
  clk: mv('clk', 'Chute Baixo', 18, [hit(5, 7, [0.25, 0, 1.2, 0.35], 26, 'low', { hs: 13, bs: 9 })],
    { crouch: true, cancel: ['clk', 'special'], anim: 'clow' }),
  chk: mv('chk', 'Rasteira', 33, [hit(9, 12, [0.25, 0, 1.5, 0.35], 60, 'low', { kd: true, launch: 0.07, hs: 30, bs: 12, heavy: true })],
    { crouch: true, anim: 'sweep' }),
  jlp: mv('jlp', 'Toque Aéreo', 40, [hit(3, 16, [0.05, 0.6, 0.85, 1.25], 26, 'overhead', { hs: 15, bs: 9 })], { air: true, anim: 'jpunch' }),
  jhp: mv('jhp', 'Garra Aérea', 40, [hit(6, 16, [0.05, 0.2, 1.05, 1.25], 55, 'overhead', { hs: 19, bs: 12, slash: true })], { air: true, anim: 'jaxe' }),
  jlk: mv('jlk', 'Joelhada Aérea', 40, [hit(3, 16, [0.05, 0.3, 0.85, 0.95], 32, 'overhead', { hs: 15, bs: 9 })], { air: true, anim: 'jknee' }),
  jhk: mv('jhk', 'Chute Voador', 40, [hit(6, 15, [0.15, 0.35, 1.15, 1.0], 62, 'overhead', { hs: 19, bs: 12, heavy: true })], { air: true, anim: 'jkick' }),
  grab_whiff: mv('grab_whiff', 'Agarrão (errou)', 26, [], { anim: 'grab' }),
  // ---- especiais
  lanca: mv('lanca', 'Lança Carmesim', 32, [], { kind: 'special', anim: 'cast', spawn: [{ f: 12, proj: 'spear' }] }),
  chuva: mv('chuva', 'Chuva de Lanças', 44, [], { kind: 'special', anim: 'castUp', spawn: [{ f: 10, proj: 'rain', atTarget: true }] }),
  espinhos: mv('espinhos', 'Espinhos de Sangue', 42, [], { kind: 'special', anim: 'castLow', spawn: [{ f: 12, proj: 'spikes', at: 2.3 }] }),
  teleporte: mv('teleporte', 'Teletransporte', 40, [], { kind: 'special', anim: 'vanish', invuln: [3, 26], script: 'teleport', hideFrames: [6, 24] }),
  clone: mv('clone', 'Clone Sangrento', 38, [], { kind: 'special', anim: 'cast', spawn: [{ f: 13, proj: 'clone' }] }),
  garra: mv('garra', 'Garra Carmesim', 40, [hit(11, 16, [0.2, 0.7, 1.3, 1.7], 70, 'mid', { kd: true, launch: 0.09, hs: 26, bs: 14, push: 0.1, heavy: true, slash: true })],
    { kind: 'special', anim: 'lunge', vel: [{ f0: 5, f1: 14, vx: 0.22 }] }),
  regen: mv('regen', 'Regeneração', 62, [], { kind: 'special', anim: 'regen', script: 'heal', heal: { f0: 12, f1: 52, total: 80, exTotal: 140 } }),
  veu: mv('veu', 'Véu Escarlate', 42, [], { kind: 'special', anim: 'parry', counterStance: [4, 26] }),
  veu_contra: mv('veu_contra', 'Véu Escarlate (contra)', 30, [hit(5, 9, [0.0, 0.5, 1.4, 1.9], 90, 'unblockable', { kd: true, launch: 0.12, hs: 30, push: 0.1, heavy: true, slash: true, hitstop: 12 })],
    { kind: 'special', anim: 'claw', internal: true }),
  teleporte_ex: mv('teleporte_ex', 'Teletransporte (pot.)', 30, [hit(3, 10, [0.0, 0.3, 1.1, 1.6], 70, 'overhead', { hs: 22, bs: 14, push: 0.1, heavy: true })],
    { kind: 'special', anim: 'jkick', internal: true }),
  // ---- supergolpe
  eclipse: mv('eclipse', 'Eclipse Sangrento', 50, [hit(8, 14, [0.2, 0.5, 2.0, 2.0], 0, 'mid', { effect: 'cinematic', bs: 12, push: 0.1 })],
    { kind: 'super', anim: 'superStart', invuln: [0, 8],
      seq: { dur: 130, hits: [{ f: 30, dmg: 60 }, { f: 50, dmg: 60 }, { f: 70, dmg: 60 }, { f: 110, dmg: 140 }] } }),
  // 2º supergolpe (nome proposto): círculo ritual no chão — golpe BAIXO, precisa de defesa agachada
  saba: mv('saba', 'Sabá Sangrento', 50, [hit(14, 20, [0.4, 0, 2.6, 0.5], 0, 'low', { effect: 'cinematic', bs: 14, push: 0.06 })],
    { kind: 'super', anim: 'castLow', invuln: [0, 12],
      seq: { dur: 160, hits: [{ f: 34, dmg: 45 }, { f: 52, dmg: 45 }, { f: 70, dmg: 45 }, { f: 88, dmg: 45 }, { f: 132, dmg: 150 }] } }),
};
lilithMoves.lp.chainName = 'Dança Carmesim';

const lilithProj = {
  spear: { vx: 0.21, y: 1.3, box: [-0.45, -0.15, 0.45, 0.15], life: 60, clash: true, fx: 'spear',
    hit: hit(0, 0, null, 65, 'mid', { hs: 20, bs: 12, push: 0.08 }), ex: { vx: 0.26, dmg: 95 } },
  rain: { vx: 0, y: 4.2, vy: -0.16, delay: 14, box: [-0.35, -0.5, 0.35, 0.5], life: 40, clash: false, fx: 'rain',
    hit: hit(0, 0, null, 85, 'overhead', { hs: 24, bs: 14, push: 0.04, heavy: true }), ex: { dmg: 120 }, exSpread: true },
  spikes: { vx: 0, y: 0, delay: 8, box: [-0.6, 0, 0.6, 1.3], life: 12, clash: false, fx: 'spikes', ground: true,
    hit: hit(0, 0, null, 75, 'low', { kd: true, launch: 0.15, hs: 30, bs: 14, push: 0.05, heavy: true }), ex: { dmg: 105, wide: 1.0 } },
  clone: { vx: 0.14, y: 0, box: [-0.35, 0.4, 0.45, 1.7], life: 46, clash: true, fx: 'clone',
    hit: hit(0, 0, null, 60, 'mid', { hs: 22, bs: 14, push: 0.1, slash: true }), ex: { dmg: 90, vx: 0.18 } },
};

// ---------------- KAZURO, O SAMURAI AMALDIÇOADO (v0.3) ----------------
// Espadachim veloz: golpes rápidos, alcance de katana, contra-ataque, investidas e duplicatas espectrais.
const kazuroMoves = {
  lp: mv('lp', 'Golpe de Tsuka', 14, [hit(4, 6, [0.25, 1.2, 1.05, 1.6], 23, 'high', { hs: 14, bs: 10 })],
    { cancel: ['lp2', 'hp', 'lk', ...STD_CANCEL], anim: 'jab' }),
  lp2: mv('lp2', 'Golpe de Tsuka (2)', 16, [hit(4, 6, [0.25, 1.15, 1.1, 1.6], 23, 'high', { hs: 15, bs: 10 })],
    { cancel: ['hp', ...STD_CANCEL], anim: 'jab2', chainOnly: true }),
  hp: mv('hp', 'Corte Diagonal', 30, [hit(9, 11, [0.3, 0.7, 1.5, 1.9], 50, 'mid', { hs: 19, bs: 13, push: 0.1, slash: true })],
    { cancel: ['hk', ...STD_CANCEL], anim: 'katana' }),
  lk: mv('lk', 'Chute Rápido', 17, [hit(5, 7, [0.25, 0.4, 1.2, 0.95], 30, 'mid', { hs: 14, bs: 10 })],
    { cancel: ['lk2', 'hp', ...STD_CANCEL], anim: 'kickMid' }),
  lk2: mv('lk2', 'Chute Rápido (2)', 18, [hit(5, 7, [0.25, 0.9, 1.25, 1.55], 30, 'high', { hs: 15, bs: 10 })],
    { cancel: ['hp', ...STD_CANCEL], anim: 'kickHigh', chainOnly: true }),
  hk: mv('hk', 'Chute Giratório', 30, [hit(10, 13, [0.25, 0.9, 1.45, 1.7], 58, 'high', { hs: 20, bs: 14, push: 0.11, heavy: true })],
    { cancel: STD_CANCEL, anim: 'kickHigh' }),
  clp: mv('clp', 'Estocada Baixa', 15, [hit(4, 6, [0.25, 0.5, 1.25, 0.95], 22, 'mid', { hs: 13, bs: 9 })],
    { crouch: true, cancel: ['clp', 'chp', ...STD_CANCEL], anim: 'cjab' }),
  chp: mv('chp', 'Corte Lunar', 31, [hit(7, 10, [0.1, 0.8, 1.3, 2.35], 70, 'mid', { launch: 0.23, kd: true, hs: 30, bs: 13, heavy: true, push: 0.03, slash: true })],
    { crouch: true, cancel: ['special'], anim: 'slashUp' }),
  clk: mv('clk', 'Corte de Tornozelo', 18, [hit(5, 7, [0.25, 0, 1.45, 0.35], 26, 'low', { hs: 13, bs: 9, slash: true })],
    { crouch: true, cancel: ['clk', 'special'], anim: 'clow' }),
  chk: mv('chk', 'Rasteira', 32, [hit(9, 12, [0.25, 0, 1.55, 0.35], 58, 'low', { kd: true, launch: 0.07, hs: 30, bs: 12, heavy: true })],
    { crouch: true, anim: 'sweep' }),
  jlp: mv('jlp', 'Cotovelada Aérea', 40, [hit(3, 16, [0.05, 0.6, 0.85, 1.25], 26, 'overhead', { hs: 15, bs: 9 })], { air: true, anim: 'jpunch' }),
  jhp: mv('jhp', 'Corte do Falcão', 40, [hit(5, 15, [0.05, 0.0, 1.35, 1.35], 60, 'overhead', { hs: 19, bs: 12, slash: true, heavy: true })], { air: true, anim: 'jaxe' }),
  jlk: mv('jlk', 'Joelhada Aérea', 40, [hit(3, 16, [0.05, 0.3, 0.85, 0.95], 30, 'overhead', { hs: 15, bs: 9 })], { air: true, anim: 'jknee' }),
  jhk: mv('jhk', 'Chute Voador', 40, [hit(6, 15, [0.15, 0.35, 1.15, 1.0], 60, 'overhead', { hs: 19, bs: 12, heavy: true })], { air: true, anim: 'jkick' }),
  grab_whiff: mv('grab_whiff', 'Agarrão (errou)', 24, [], { anim: 'grab' }),
  // ---- especiais
  corte_espectral: mv('corte_espectral', 'Corte Espectral', 30, [], { kind: 'special', anim: 'katana', spawn: [{ f: 10, proj: 'slash' }] }),
  investida: mv('investida', 'Investida Relâmpago', 38, [hit(9, 15, [0.1, 0.6, 1.4, 1.75], 66, 'mid', { hs: 22, bs: 12, push: 0.12, heavy: true, slash: true })],
    { kind: 'special', anim: 'dashSlash', vel: [{ f0: 5, f1: 15, vx: 0.34 }], invuln: [6, 8] }),
  iaijutsu: mv('iaijutsu', 'Iaijutsu do Vazio', 44, [hit(14, 16, [0.3, 0.6, 2.3, 1.8], 84, 'mid', { kd: true, launch: 0.06, hs: 30, bs: 18, push: 0.12, heavy: true, slash: true, hitstop: 12 })],
    { kind: 'special', anim: 'iai' }),
  reflexo: mv('reflexo', 'Lâmina Reflexa', 40, [], { kind: 'special', anim: 'guard', counterStance: [3, 24], counterMove: 'reflexo_contra' }),
  reflexo_contra: mv('reflexo_contra', 'Lâmina Reflexa (contra)', 30, [hit(4, 8, [0.0, 0.5, 1.6, 1.9], 95, 'unblockable', { kd: true, launch: 0.12, hs: 30, push: 0.1, heavy: true, slash: true, hitstop: 12 })],
    { kind: 'special', anim: 'iai', internal: true }),
  mil_laminas: mv('mil_laminas', 'Dança das Mil Lâminas', 56, [
    hit(10, 11, [0.2, 0.7, 1.45, 1.8], 22, 'mid', { hs: 16, bs: 9, push: 0.015, slash: true }),
    hit(16, 17, [0.2, 0.7, 1.45, 1.8], 22, 'mid', { hs: 16, bs: 9, push: 0.015, slash: true }),
    hit(22, 23, [0.2, 0.4, 1.45, 1.8], 22, 'mid', { hs: 16, bs: 9, push: 0.015, slash: true }),
    hit(28, 29, [0.2, 0.7, 1.45, 1.8], 22, 'mid', { hs: 16, bs: 9, push: 0.015, slash: true }),
    hit(36, 38, [0.2, 0.5, 1.55, 1.9], 34, 'mid', { hs: 28, bs: 13, push: 0.13, kd: true, launch: 0.1, slash: true, heavy: true }),
  ], { kind: 'special', anim: 'flurry', multi: true, vel: [{ f0: 8, f1: 34, vx: 0.03 }] }),
  duplicata: mv('duplicata', 'Duplicata Sombria', 36, [], { kind: 'special', anim: 'katana', spawn: [{ f: 11, proj: 'clone' }] }),
  lamina_ascendente: mv('lamina_ascendente', 'Lâmina Ascendente', 46, [hit(5, 10, [0.0, 0.6, 1.15, 2.5], 74, 'mid', { launch: 0.26, kd: true, hs: 30, bs: 18, heavy: true, push: 0.02, slash: true })],
    { kind: 'special', anim: 'slashUp', invuln: [1, 7] }),
  passo_sombras: mv('passo_sombras', 'Passo das Sombras', 34, [], { kind: 'special', anim: 'vanish', invuln: [3, 22], script: 'teleport', hideFrames: [5, 18], exMove: 'passo_sombras_ex' }),
  passo_sombras_ex: mv('passo_sombras_ex', 'Passo das Sombras (pot.)', 28, [hit(3, 9, [0.0, 0.5, 1.4, 1.8], 70, 'mid', { hs: 22, bs: 14, push: 0.1, heavy: true, slash: true })],
    { kind: 'special', anim: 'iai', internal: true }),
  // ---- supergolpes
  tempestade: mv('tempestade', 'Tempestade de Lâminas', 46, [hit(7, 13, [0.2, 0.4, 1.9, 2.0], 0, 'mid', { effect: 'cinematic', bs: 12, push: 0.1 })],
    { kind: 'super', anim: 'dashSlash', vel: [{ f0: 3, f1: 11, vx: 0.22 }], invuln: [0, 9],
      seq: { dur: 140, hits: [{ f: 24, dmg: 40 }, { f: 36, dmg: 40 }, { f: 48, dmg: 40 }, { f: 60, dmg: 40 }, { f: 72, dmg: 40 }, { f: 118, dmg: 130 }] } }),
  despertar: mv('despertar', 'Despertar do Oni', 54, [hit(14, 20, [0.3, 0.5, 2.8, 2.2], 0, 'mid', { effect: 'cinematic', bs: 14, push: 0.08 })],
    { kind: 'super', anim: 'iai', invuln: [0, 12],
      seq: { dur: 165, hits: [{ f: 46, dmg: 60 }, { f: 70, dmg: 60 }, { f: 94, dmg: 60 }, { f: 140, dmg: 150 }] } }),
};
kazuroMoves.lp.chainName = 'Lâminas Gêmeas';

const kazuroProj = {
  slash: { vx: 0.24, y: 1.1, box: [-0.3, -0.45, 0.3, 0.45], life: 40, clash: true, fx: 'slash',
    hit: hit(0, 0, null, 55, 'mid', { hs: 20, bs: 12, push: 0.08, slash: true }), ex: { vx: 0.3, dmg: 85 } },
  clone: { vx: 0.2, y: 0, box: [-0.35, 0.4, 0.5, 1.7], life: 36, clash: true, fx: 'clone',
    hit: hit(0, 0, null, 58, 'mid', { hs: 22, bs: 14, push: 0.1, slash: true }), ex: { dmg: 85, vx: 0.25 } },
};

// ---------------- BRAKKOR, O DEVORADOR (v0.3) ----------------
// Demônio gigante: lento, alcance e dano altos, agarrões de comando, superarmadura em investidas, fogo e terremotos.
const brakkorMoves = {
  lp: mv('lp', 'Tapa de Garra', 19, [hit(6, 8, [0.25, 1.4, 1.35, 1.95], 40, 'high', { hs: 16, bs: 11, push: 0.09 })],
    { cancel: ['hp', ...STD_CANCEL], anim: 'jab' }),
  hp: mv('hp', 'Punho de Pedra', 35, [hit(12, 15, [0.3, 1.0, 1.85, 2.1], 82, 'mid', { hs: 23, bs: 16, push: 0.13, heavy: true })],
    { cancel: STD_CANCEL, anim: 'smash' }),
  lk: mv('lk', 'Pisada', 25, [hit(9, 11, [0.25, 0.3, 1.3, 1.0], 45, 'mid', { hs: 17, bs: 11, push: 0.09 })],
    { cancel: ['hp', ...STD_CANCEL], anim: 'kickMid' }),
  hk: mv('hk', 'Chute do Colosso', 40, [hit(14, 17, [0.25, 0.9, 1.6, 1.9], 92, 'high', { hs: 24, bs: 15, push: 0.14, heavy: true })],
    { cancel: STD_CANCEL, anim: 'kickHigh' }),
  clp: mv('clp', 'Soco Baixo', 19, [hit(6, 8, [0.25, 0.55, 1.2, 1.1], 30, 'mid', { hs: 15, bs: 10 })],
    { crouch: true, cancel: ['clp', 'chp', ...STD_CANCEL], anim: 'cjab' }),
  chp: mv('chp', 'Chifrada', 38, [hit(10, 13, [0.1, 0.9, 1.15, 2.6], 98, 'mid', { launch: 0.22, kd: true, hs: 30, bs: 15, heavy: true, push: 0.03 })],
    { crouch: true, cancel: ['special'], anim: 'uppercut' }),
  clk: mv('clk', 'Chute Baixo', 22, [hit(7, 9, [0.25, 0, 1.35, 0.4], 34, 'low', { hs: 14, bs: 10 })],
    { crouch: true, cancel: ['clk', 'special'], anim: 'clow' }),
  chk: mv('chk', 'Rasteira de Cauda', 38, [hit(11, 14, [0.25, 0, 1.75, 0.4], 72, 'low', { kd: true, launch: 0.07, hs: 30, bs: 13, heavy: true })],
    { crouch: true, anim: 'sweep' }),
  jlp: mv('jlp', 'Soco Aéreo', 40, [hit(5, 16, [0.05, 0.6, 1.0, 1.4], 34, 'overhead', { hs: 16, bs: 10 })], { air: true, anim: 'jpunch' }),
  jhp: mv('jhp', 'Martelo Duplo', 40, [hit(8, 16, [0.05, 0.1, 1.25, 1.4], 75, 'overhead', { hs: 21, bs: 14, heavy: true })], { air: true, anim: 'jaxe' }),
  jlk: mv('jlk', 'Joelhada Aérea', 40, [hit(5, 16, [0.05, 0.3, 0.95, 1.05], 38, 'overhead', { hs: 16, bs: 10 })], { air: true, anim: 'jknee' }),
  jhk: mv('jhk', 'Queda Esmagadora', 40, [hit(8, 15, [0.15, 0.2, 1.25, 1.0], 78, 'overhead', { hs: 21, bs: 14, heavy: true })], { air: true, anim: 'jkick' }),
  grab_whiff: mv('grab_whiff', 'Agarrão (errou)', 32, [], { anim: 'grab' }),
  // ---- especiais
  bola_fogo: mv('bola_fogo', 'Bola de Fogo Infernal', 42, [], { kind: 'special', anim: 'cast', spawn: [{ f: 17, proj: 'fireball' }] }),
  investida_touro: mv('investida_touro', 'Investida do Touro', 48, [hit(10, 26, [0.2, 0.4, 1.4, 2.2], 76, 'mid', { kd: true, launch: 0.09, hs: 28, bs: 16, push: 0.16, heavy: true })],
    { kind: 'special', anim: 'charge', vel: [{ f0: 7, f1: 26, vx: 0.2 }], armor: [4, 24] }),
  esmagamento: mv('esmagamento', 'Esmagamento', 40, [], { kind: 'special', anim: 'grab', cmdGrab: { f0: 7, f1: 9, range: 1.45, dmg: 125, slam: true } }),
  sopro: mv('sopro', 'Sopro Infernal', 52, [
    hit(14, 16, [0.3, 1.1, 2.0, 2.0], 22, 'mid', { hs: 18, bs: 10, push: 0.02 }),
    hit(20, 22, [0.3, 1.0, 2.0, 2.0], 22, 'mid', { hs: 18, bs: 10, push: 0.02 }),
    hit(26, 28, [0.3, 0.9, 2.0, 2.0], 22, 'mid', { hs: 18, bs: 10, push: 0.02 }),
    hit(32, 35, [0.3, 0.8, 2.1, 2.0], 34, 'mid', { hs: 26, bs: 12, push: 0.12, kd: true, launch: 0.08, heavy: true }),
  ], { kind: 'special', anim: 'breath', multi: true }),
  punho_magma: mv('punho_magma', 'Punho de Magma', 46, [hit(17, 20, [0.3, 0.7, 1.9, 2.1], 98, 'mid', { kd: true, launch: 0.07, hs: 30, bs: 17, push: 0.14, heavy: true, hitstop: 12 })],
    { kind: 'special', anim: 'smash', armor: [3, 16] }),
  salto: mv('salto', 'Salto Esmagador', 56, [hit(34, 38, [-0.6, 0, 1.8, 1.4], 95, 'overhead', { kd: true, launch: 0.08, hs: 30, bs: 18, push: 0.12, heavy: true, hitstop: 12 })],
    { kind: 'special', anim: 'leap', leap: { f0: 8, f1: 34, h: 1.6 }, vel: [{ f0: 8, f1: 32, vx: 0.11 }], invuln: [10, 30] }),
  terremoto: mv('terremoto', 'Terremoto', 50, [], { kind: 'special', anim: 'groundSlam', spawn: [{ f: 20, proj: 'quake', at: 1.8 }] }),
  devorar: mv('devorar', 'Devorar', 46, [], { kind: 'special', anim: 'grab', cmdGrab: { f0: 8, f1: 11, range: 1.3, dmg: 95, heal: 60 } }),
  // ---- supergolpes
  apocalipse: mv('apocalipse', 'Apocalipse Ígneo', 54, [hit(12, 18, [0.2, 0.4, 2.2, 2.4], 0, 'mid', { effect: 'cinematic', bs: 14, push: 0.1 })],
    { kind: 'super', anim: 'roar', invuln: [0, 10],
      seq: { dur: 150, hits: [{ f: 36, dmg: 60 }, { f: 60, dmg: 60 }, { f: 84, dmg: 70 }, { f: 126, dmg: 150 }] } }),
  banquete: mv('banquete', 'Banquete do Devorador', 44, [hit(8, 12, [0.2, 0.2, 1.5, 2.2], 0, 'unblockable', { effect: 'cinematic', bs: 12, push: 0.05 })],
    { kind: 'super', anim: 'grab', invuln: [0, 6],
      seq: { dur: 170, hits: [{ f: 50, dmg: 80, heal: 40 }, { f: 80, dmg: 80, heal: 40 }, { f: 140, dmg: 190 }] } }),
};
brakkorMoves.lp.chainName = 'Esmaga-Crânios';

const brakkorProj = {
  fireball: { vx: 0.12, y: 1.3, box: [-0.5, -0.5, 0.5, 0.5], life: 80, clash: true, fx: 'fireball',
    hit: hit(0, 0, null, 75, 'mid', { hs: 22, bs: 14, push: 0.1, heavy: true }), ex: { vx: 0.16, dmg: 110 } },
  quake: { vx: 0, y: 0, delay: 4, box: [-1.8, 0, 1.8, 0.35], life: 10, clash: false, fx: 'quake', ground: true,
    hit: hit(0, 0, null, 80, 'low', { kd: true, launch: 0.14, hs: 30, bs: 14, push: 0.05, heavy: true }), ex: { dmg: 110, wide: 1.6 } },
};

// ---------------- NYMERA, A RAINHA GLACIAL (v0.4) ----------------
// Assassina de controle: congelamento, espinhos, armadilhas e clones congelados (GDD §4). Nomes de golpes: propostas.
const ICE = { ice: true };
const nymeraMoves = {
  lp: mv('lp', 'Corte de Adaga', 15, [hit(5, 7, [0.25, 1.15, 1.0, 1.55], 24, 'high', { hs: 14, bs: 10, slash: true })],
    { cancel: ['lp2', 'hp', 'lk', ...STD_CANCEL], anim: 'jab' }),
  lp2: mv('lp2', 'Corte de Adaga (2)', 16, [hit(4, 6, [0.25, 1.1, 1.05, 1.55], 24, 'high', { hs: 15, bs: 10, slash: true })],
    { cancel: ['hp', ...STD_CANCEL], anim: 'jab2', chainOnly: true }),
  hp: mv('hp', 'Estocada Gélida', 28, [hit(9, 11, [0.25, 0.9, 1.35, 1.6], 52, 'mid', { hs: 18, bs: 13, push: 0.09, slash: true })],
    { cancel: ['hk', ...STD_CANCEL], anim: 'lunge' }),
  lk: mv('lk', 'Chute Cristalino', 18, [hit(5, 7, [0.25, 0.4, 1.2, 0.95], 32, 'mid', { hs: 15, bs: 10 })],
    { cancel: ['lk2', 'hp', ...STD_CANCEL], anim: 'kickMid' }),
  lk2: mv('lk2', 'Chute Cristalino (2)', 19, [hit(5, 7, [0.25, 0.9, 1.25, 1.55], 32, 'high', { hs: 16, bs: 10 })],
    { cancel: ['hp', ...STD_CANCEL], anim: 'kickHigh', chainOnly: true }),
  hk: mv('hk', 'Chute da Nevasca', 31, [hit(10, 13, [0.25, 0.9, 1.45, 1.7], 62, 'high', { hs: 20, bs: 14, push: 0.11, heavy: true })],
    { cancel: STD_CANCEL, anim: 'kickHigh' }),
  clp: mv('clp', 'Adaga Baixa', 15, [hit(4, 6, [0.25, 0.5, 1.05, 0.95], 22, 'mid', { hs: 13, bs: 9, slash: true })],
    { crouch: true, cancel: ['clp', 'chp', ...STD_CANCEL], anim: 'cjab' }),
  chp: mv('chp', 'Pico de Gelo', 32, [hit(8, 11, [0.1, 0.8, 1.05, 2.3], 66, 'mid', { launch: 0.23, kd: true, hs: 30, bs: 13, heavy: true, push: 0.03 })],
    { crouch: true, cancel: ['special'], anim: 'uppercut' }),
  clk: mv('clk', 'Rasteira Gélida', 18, [hit(5, 7, [0.25, 0, 1.25, 0.35], 26, 'low', { hs: 13, bs: 9 })],
    { crouch: true, cancel: ['clk', 'special'], anim: 'clow' }),
  chk: mv('chk', 'Rasteira', 33, [hit(9, 12, [0.25, 0, 1.55, 0.35], 60, 'low', { kd: true, launch: 0.07, hs: 30, bs: 12, heavy: true })],
    { crouch: true, anim: 'sweep' }),
  jlp: mv('jlp', 'Adaga Aérea', 40, [hit(3, 16, [0.05, 0.6, 0.85, 1.25], 26, 'overhead', { hs: 15, bs: 9, slash: true })], { air: true, anim: 'jpunch' }),
  jhp: mv('jhp', 'Queda Glacial', 40, [hit(6, 16, [0.05, 0.1, 1.1, 1.3], 58, 'overhead', { hs: 19, bs: 12, slash: true, heavy: true })], { air: true, anim: 'jaxe' }),
  jlk: mv('jlk', 'Joelhada Aérea', 40, [hit(3, 16, [0.05, 0.3, 0.85, 0.95], 30, 'overhead', { hs: 15, bs: 9 })], { air: true, anim: 'jknee' }),
  jhk: mv('jhk', 'Chute Voador', 40, [hit(6, 15, [0.15, 0.35, 1.15, 1.0], 60, 'overhead', { hs: 19, bs: 12, heavy: true })], { air: true, anim: 'jkick' }),
  grab_whiff: mv('grab_whiff', 'Agarrão (errou)', 25, [], { anim: 'grab' }),
  // ---- especiais
  lanca_gelo: mv('lanca_gelo', 'Lança de Gelo', 32, [], { kind: 'special', anim: 'cast', spawn: [{ f: 12, proj: 'icelance' }] }),
  deslize: mv('deslize', 'Deslize Glacial', 40, [hit(8, 20, [0.1, 0, 1.3, 0.5], 54, 'low', { kd: true, launch: 0.08, hs: 28, bs: 14, push: 0.12, heavy: true })],
    { kind: 'special', anim: 'slide', vel: [{ f0: 5, f1: 20, vx: 0.2 }] }),
  espinhos_gelo: mv('espinhos_gelo', 'Espinhos Glaciais', 44, [], { kind: 'special', anim: 'castLow', spawn: [{ f: 12, proj: 'icespikes', atTarget: true }] }),
  armadilha: mv('armadilha', 'Armadilha de Gelo', 34, [], { kind: 'special', anim: 'castLow', spawn: [{ f: 12, proj: 'trap', at: 1.6 }] }),
  clone_gelo: mv('clone_gelo', 'Clone Congelado', 46, [], { kind: 'special', anim: 'parry', counterStance: [4, 15], counterMove: 'clone_gelo_contra' }),
  clone_gelo_contra: mv('clone_gelo_contra', 'Clone Congelado (contra)', 32, [hit(4, 8, [0.0, 0.5, 1.5, 1.9], 42, 'unblockable', { effect: 'freeze', freeze: 34, ...ICE, hs: 30, push: 0.02, slash: true, hitstop: 10 })],
    { kind: 'special', anim: 'lunge', internal: true }),
  garra_inverno: mv('garra_inverno', 'Garra do Inverno', 44, [hit(5, 10, [0.0, 0.5, 1.2, 2.6], 64, 'mid', { launch: 0.25, kd: true, hs: 30, bs: 18, heavy: true, push: 0.02 })],
    { kind: 'special', anim: 'castUp', invuln: [1, 7] }),
  nevasca: mv('nevasca', 'Nevasca', 54, [
    hit(12, 14, [-0.9, 0.3, 1.5, 2.0], 20, 'mid', { hs: 16, bs: 9, push: 0.01 }),
    hit(20, 22, [-0.9, 0.3, 1.5, 2.0], 20, 'mid', { hs: 16, bs: 9, push: 0.01 }),
    hit(28, 30, [-0.9, 0.3, 1.5, 2.0], 20, 'mid', { hs: 16, bs: 9, push: 0.01 }),
    hit(36, 38, [-0.9, 0.3, 1.6, 2.0], 34, 'mid', { effect: 'freeze', freeze: 28, ...ICE, hs: 24, bs: 12, push: 0.1 }),
  ], { kind: 'special', anim: 'spin', multi: true }),
  passo_glacial: mv('passo_glacial', 'Passo Glacial', 36, [], { kind: 'special', anim: 'vanish', invuln: [3, 22], script: 'teleport', hideFrames: [5, 18], exMove: 'passo_glacial_ex' }),
  passo_glacial_ex: mv('passo_glacial_ex', 'Passo Glacial (pot.)', 30, [hit(3, 9, [0.0, 0.5, 1.3, 1.8], 66, 'mid', { effect: 'freeze', freeze: 55, ...ICE, hs: 22, bs: 14, push: 0.05, slash: true })],
    { kind: 'special', anim: 'lunge', internal: true }),
  // ---- supergolpes
  inverno_eterno: mv('inverno_eterno', 'Inverno Eterno', 50, [hit(9, 15, [0.2, 0.4, 2.1, 2.0], 0, 'mid', { effect: 'cinematic', bs: 12, push: 0.1 })],
    { kind: 'super', anim: 'cast', invuln: [0, 9],
      seq: { dur: 150, hits: [{ f: 30, dmg: 50 }, { f: 48, dmg: 50 }, { f: 66, dmg: 50 }, { f: 84, dmg: 50 }, { f: 126, dmg: 130 }] } }),
  tumulo_gelo: mv('tumulo_gelo', 'Túmulo de Gelo', 54, [hit(15, 21, [0.3, 0.3, 3.3, 1.9], 0, 'mid', { effect: 'cinematic', bs: 14, push: 0.06 })],
    { kind: 'super', anim: 'castLow', invuln: [0, 12],
      seq: { dur: 165, hits: [{ f: 44, dmg: 70 }, { f: 80, dmg: 70 }, { f: 140, dmg: 190 }] } }),
};
nymeraMoves.lp.chainName = 'Adagas Gêmeas';

const nymeraProj = {
  icelance: { vx: 0.22, y: 1.25, box: [-0.45, -0.15, 0.45, 0.15], life: 60, clash: true, fx: 'icelance',
    hit: hit(0, 0, null, 50, 'mid', { hs: 20, bs: 12, push: 0.08 }), ex: { vx: 0.27, dmg: 70, effect: 'freeze', freeze: 60, ice: true } },
  icespikes: { vx: 0, y: 0, delay: 16, box: [-0.55, 0, 0.55, 1.5], life: 12, clash: false, fx: 'icespikes', ground: true,
    hit: hit(0, 0, null, 62, 'mid', { kd: true, launch: 0.16, hs: 30, bs: 14, push: 0.04, heavy: true }), ex: { dmg: 100, wide: 1.0 } },
  trap: { vx: 0, y: 0, delay: 24, box: [-0.4, 0, 0.4, 0.25], life: 260, clash: false, fx: 'trap', ground: true, maxActive: 1,
    hit: hit(0, 0, null, 35, 'unblockable', { effect: 'freeze', freeze: 36, ice: true, hs: 20, push: 0 }), ex: { dmg: 50, freeze: 80, wide: 0.6 } },
};

// ---------------- PESTILUS, O MÉDICO DA PESTE (v0.4) ----------------
// Alquimista corrompido de dano por área: veneno, bombas tóxicas, criaturas e nuvens corrosivas (GDD §4). Nomes: propostas.
const PSN = (n) => ({ poison: n });
const pestilusMoves = {
  lp: mv('lp', 'Golpe de Bengala', 16, [hit(5, 7, [0.25, 1.15, 1.1, 1.6], 28, 'high', { hs: 14, bs: 10 })],
    { cancel: ['lp2', 'hp', ...STD_CANCEL], anim: 'jab' }),
  lp2: mv('lp2', 'Golpe de Bengala (2)', 18, [hit(5, 7, [0.25, 1.1, 1.15, 1.6], 28, 'high', { hs: 15, bs: 10 })],
    { cancel: ['hp', ...STD_CANCEL], anim: 'jab2', chainOnly: true }),
  hp: mv('hp', 'Bisturi Largo', 30, [hit(10, 12, [0.3, 0.8, 1.5, 1.7], 60, 'mid', { hs: 19, bs: 13, push: 0.1, slash: true })],
    { cancel: STD_CANCEL, anim: 'claw' }),
  lk: mv('lk', 'Chute Torto', 20, [hit(6, 8, [0.25, 0.4, 1.2, 0.95], 34, 'mid', { hs: 15, bs: 10 })],
    { cancel: ['hp', ...STD_CANCEL], anim: 'kickMid' }),
  hk: mv('hk', 'Pontapé da Praga', 33, [hit(11, 14, [0.25, 0.9, 1.45, 1.7], 62, 'high', { hs: 21, bs: 14, push: 0.12, heavy: true })],
    { cancel: STD_CANCEL, anim: 'kickHigh' }),
  clp: mv('clp', 'Agulhada', 16, [hit(5, 7, [0.25, 0.5, 1.1, 0.95], 22, 'mid', { hs: 13, bs: 9, ...PSN(60) })],
    { crouch: true, cancel: ['clp', 'chp', ...STD_CANCEL], anim: 'cjab' }),
  chp: mv('chp', 'Bico da Peste', 34, [hit(9, 12, [0.1, 0.8, 1.05, 2.3], 78, 'mid', { launch: 0.22, kd: true, hs: 30, bs: 14, heavy: true, push: 0.03 })],
    { crouch: true, cancel: ['special'], anim: 'uppercut' }),
  clk: mv('clk', 'Chute Baixo', 20, [hit(6, 8, [0.25, 0, 1.25, 0.35], 28, 'low', { hs: 14, bs: 10 })],
    { crouch: true, cancel: ['clk', 'special'], anim: 'clow' }),
  chk: mv('chk', 'Rasteira de Bengala', 35, [hit(10, 13, [0.25, 0, 1.65, 0.35], 62, 'low', { kd: true, launch: 0.07, hs: 30, bs: 13, heavy: true })],
    { crouch: true, anim: 'sweep' }),
  jlp: mv('jlp', 'Soco Aéreo', 40, [hit(4, 16, [0.05, 0.6, 0.9, 1.25], 28, 'overhead', { hs: 15, bs: 10 })], { air: true, anim: 'jpunch' }),
  jhp: mv('jhp', 'Bisturi Descendente', 40, [hit(7, 16, [0.05, 0.1, 1.1, 1.3], 60, 'overhead', { hs: 20, bs: 13, heavy: true, slash: true })], { air: true, anim: 'jaxe' }),
  jlk: mv('jlk', 'Joelhada Aérea', 40, [hit(4, 16, [0.05, 0.3, 0.85, 0.95], 32, 'overhead', { hs: 16, bs: 10 })], { air: true, anim: 'jknee' }),
  jhk: mv('jhk', 'Chute Voador', 40, [hit(7, 15, [0.15, 0.35, 1.15, 1.0], 64, 'overhead', { hs: 20, bs: 13, heavy: true })], { air: true, anim: 'jkick' }),
  grab_whiff: mv('grab_whiff', 'Agarrão (errou)', 28, [], { anim: 'grab' }),
  // ---- especiais
  bomba_toxica: mv('bomba_toxica', 'Bomba Tóxica', 40, [], { kind: 'special', anim: 'throwAxe', spawn: [{ f: 15, proj: 'bomb' }] }),
  bisturi: mv('bisturi', 'Bisturi Corrompido', 40, [hit(10, 15, [0.2, 0.7, 1.4, 1.6], 54, 'mid', { hs: 22, bs: 13, push: 0.1, slash: true, ...PSN(110) })],
    { kind: 'special', anim: 'lunge', vel: [{ f0: 5, f1: 14, vx: 0.24 }] }),
  nuvem: mv('nuvem', 'Nuvem Corrosiva', 46, [], { kind: 'special', anim: 'cast', spawn: [{ f: 16, proj: 'cloud', at: 2.0 }] }),
  ratos: mv('ratos', 'Enxame de Ratos', 42, [], { kind: 'special', anim: 'castLow', spawn: [{ f: 14, proj: 'rats' }] }),
  seringa: mv('seringa', 'Seringa Venenosa', 30, [], { kind: 'special', anim: 'jab', spawn: [{ f: 9, proj: 'syringe' }] }),
  corvos: mv('corvos', 'Corvos da Peste', 46, [], { kind: 'special', anim: 'castUp', spawn: [{ f: 12, proj: 'crows', atTarget: true }] }),
  miasma: mv('miasma', 'Explosão Miasmática', 50, [hit(11, 15, [-1.2, 0, 1.5, 2.2], 62, 'mid', { kd: true, launch: 0.1, hs: 28, bs: 12, push: 0.14, heavy: true, ...PSN(60) })],
    { kind: 'special', anim: 'roar', invuln: [1, 9] }),
  frasco: mv('frasco', 'Frasco Ácido', 44, [
    hit(10, 12, [0.2, 0.6, 1.4, 1.7], 30, 'mid', { hs: 18, bs: 10, push: 0.02, ...PSN(90) }),
    hit(20, 23, [0.2, 0.4, 1.5, 1.8], 40, 'mid', { hs: 26, bs: 12, push: 0.13, kd: true, launch: 0.08, heavy: true }),
  ], { kind: 'special', anim: 'claw', multi: true }),
  // ---- supergolpes
  pandemia: mv('pandemia', 'Pandemia', 52, [hit(10, 16, [0.2, 0.3, 2.3, 2.2], 0, 'mid', { effect: 'cinematic', bs: 12, push: 0.1 })],
    { kind: 'super', anim: 'throwAxe', invuln: [0, 10],
      seq: { dur: 160, hits: [{ f: 34, dmg: 45 }, { f: 52, dmg: 45 }, { f: 70, dmg: 45 }, { f: 88, dmg: 45 }, { f: 134, dmg: 150 }] } }),
  praga_negra: mv('praga_negra', 'Praga Negra', 54, [hit(14, 20, [0.3, 0, 3.1, 1.4], 0, 'mid', { effect: 'cinematic', bs: 14, push: 0.06 })],
    { kind: 'super', anim: 'castLow', invuln: [0, 12],
      seq: { dur: 170, hits: [{ f: 40, dmg: 55 }, { f: 64, dmg: 55 }, { f: 88, dmg: 55 }, { f: 142, dmg: 170 }] } }),
};
pestilusMoves.lp.chainName = 'Receita Dupla';

const pestilusProj = {
  bomb: { vx: 0.075, vy: 0.17, grav: 0.0085, y: 1.6, box: [-0.25, -0.25, 0.25, 0.25], life: 90, clash: true, fx: 'bomb', burst: 'bombcloud',
    hit: hit(0, 0, null, 42, 'mid', { hs: 20, bs: 12, push: 0.06, poison: 100 }), ex: { vx: 0.09, dmg: 60 } },
  bombcloud: { vx: 0, y: 0, box: [-0.8, 0, 0.8, 1.9], life: 100, clash: false, fx: 'cloud', linger: true, tick: 30,
    hit: hit(0, 0, null, 10, 'mid', { hs: 12, bs: 6, push: 0.02, poison: 110 }), ex: { dmg: 14, poison: 240, wide: 0.8 } },
  cloud: { vx: 0, y: 0, delay: 6, box: [-0.85, 0, 0.85, 2.0], life: 150, clash: false, fx: 'cloud', linger: true, tick: 32,
    hit: hit(0, 0, null, 12, 'mid', { hs: 12, bs: 6, push: 0.02, poison: 130 }), ex: { dmg: 16, poison: 300, wide: 1.0 } },
  rats: { vx: 0.13, y: 0.0, box: [-0.5, 0, 0.5, 0.35], life: 70, clash: false, fx: 'rats', ground: true,
    hit: hit(0, 0, null, 58, 'low', { kd: true, launch: 0.1, hs: 30, bs: 14, push: 0.06, heavy: true, poison: 60 }), ex: { vx: 0.17, dmg: 85 } },
  syringe: { vx: 0.3, y: 1.3, box: [-0.25, -0.08, 0.25, 0.08], life: 40, clash: true, fx: 'syringe',
    hit: hit(0, 0, null, 30, 'mid', { hs: 18, bs: 10, push: 0.05, poison: 150 }), ex: { vx: 0.36, dmg: 45, poison: 360 } },
  crows: { vx: 0, y: 4.0, vy: -0.15, delay: 16, box: [-0.4, -0.5, 0.4, 0.5], life: 40, clash: false, fx: 'crows',
    hit: hit(0, 0, null, 62, 'overhead', { hs: 24, bs: 14, push: 0.04, heavy: true }), ex: { dmg: 90 }, exSpread: true },
};

const SPECIAL_CMDS = {
  qcfP: { motion: [2, 6], btn: 'P', label: '↓ → + Soco' },
  qcfK: { motion: [2, 6], btn: 'K', label: '↓ → + Chute' },
  qcbP: { motion: [2, 4], btn: 'P', label: '↓ ← + Soco' },
  qcbK: { motion: [2, 4], btn: 'K', label: '↓ ← + Chute' },
  bfP: { motion: [4, 6], btn: 'P', label: '← → + Soco' },
  bfK: { motion: [4, 6], btn: 'K', label: '← → + Chute' },
  ddP: { motion: [2, 2], btn: 'P', label: '↓ ↓ + Soco' },
  ddK: { motion: [2, 2], btn: 'K', label: '↓ ↓ + Chute' },
};

export const CHARACTERS = {
  varkhan: {
    id: 'varkhan', name: 'Varkhan', title: 'o Carrasco',
    bio: 'Morto-vivo com machado. Controle de média distância, força sobrenatural.',
    height: 1.95, walkF: 0.053, walkB: 0.044, jumpVX: 0.065,
    moves: varkhanMoves, projectiles: varkhanProj,
    specials: [
      { move: 'machado', cmd: SPECIAL_CMDS.qcfP, simple: 'n' },
      { move: 'passo', cmd: SPECIAL_CMDS.qcfK, simple: 'f' },
      { move: 'julgamento', cmd: SPECIAL_CMDS.qcbP },
      { move: 'tormenta', cmd: SPECIAL_CMDS.qcbK },
      { move: 'corrente', cmd: SPECIAL_CMDS.bfP, simple: 'b' },
      { move: 'prisao', cmd: SPECIAL_CMDS.bfK },
      { move: 'ruptura', cmd: SPECIAL_CMDS.ddP, simple: 'd' },
      { move: 'ira', cmd: SPECIAL_CMDS.ddK },
    ],
    superMove: 'execucao', superMove2: 'tribunal',
    winPose: 'winVarkhan', aura: 0xff6010, magicSfx: false, superRange: 2.6,
    throwName: 'Forca de Correntes', throwDmg: 110,
    transform: 'Carrasco do Inferno',
    combos: [
      { name: 'Sentença Tripla', seq: ['lp', 'lp2', 'hp'], input: 'J, J, K' },
      { name: 'Cabo e Pisão', seq: ['lp', 'hk'], input: 'J, I' },
      { name: 'Bota e Machado', seq: ['lk', 'hp'], input: 'U, K' },
      { name: 'Sentença do Abismo', seq: ['lp', 'lp2', 'hp', 'machado'], input: 'J, J, K, ↓ → + Soco' },
      { name: 'Corrente e Gancho', seq: ['corrente', 'chp'], input: '← → + Soco, ↓ + K' },
    ],
    fatalities: [
      { id: 'execucao_real', name: 'Execução Real', motion: [2, 6, 2], btn: 'hp', range: [0, 2.0], label: '↓ → ↓ + K (perto)', simple: 'n' },
      { id: 'machado_condenacao', name: 'Machado da Condenação', motion: [4, 6, 4], btn: 'hk', range: [2.6, 99], label: '← → ← + I (longe)', simple: 'd' },
      { id: 'correntes_suplicio', name: 'Correntes do Suplício', motion: [6, 4, 6], btn: 'lp', range: [1.4, 3.8], label: '→ ← → + J (média)', simple: 'f', proposal: true },
      { id: 'ruptura_infernal', name: 'Ruptura Infernal', motion: [2, 2, 2], btn: 'lk', range: [0, 2.3], label: '↓ ↓ ↓ + U (perto)', simple: 'b', proposal: true },
    ],
    ai: { preferred: 2.1, zoning: 0.45, aggression: 0.62, specials: ['machado', 'corrente', 'ruptura', 'passo', 'julgamento', 'tormenta', 'ira', 'prisao'], close: ['tormenta', 'julgamento', 'ira', 'tormenta', 'passo'] },
  },
  lilith: {
    id: 'lilith', name: 'Lilith', title: 'a Bruxa Carmesim',
    bio: 'Feiticeira de controle de espaço: lanças, teletransporte, clones e regeneração limitada.',
    height: 1.8, walkF: 0.055, walkB: 0.047, jumpVX: 0.072,
    moves: lilithMoves, projectiles: lilithProj,
    specials: [
      { move: 'lanca', cmd: SPECIAL_CMDS.qcfP, simple: 'n' },
      { move: 'espinhos', cmd: SPECIAL_CMDS.qcfK, simple: 'd' },
      { move: 'chuva', cmd: SPECIAL_CMDS.qcbP },
      { move: 'veu', cmd: SPECIAL_CMDS.qcbK },
      { move: 'garra', cmd: SPECIAL_CMDS.bfP, simple: 'f' },
      { move: 'clone', cmd: SPECIAL_CMDS.bfK },
      { move: 'regen', cmd: SPECIAL_CMDS.ddP },
      { move: 'teleporte', cmd: SPECIAL_CMDS.ddK, simple: 'b' },
    ],
    superMove: 'eclipse', superMove2: 'saba',
    winPose: 'winLilith', winLift: 0.35, aura: 0xff1030, magicSfx: true, superRange: 2.2,
    throwName: 'Beijo de Sangue', throwDmg: 100, throwHeal: 25,
    transform: 'Rainha do Sangue',
    combos: [
      { name: 'Dança Carmesim', seq: ['lp', 'hp', 'hk'], input: 'J, K, I' },
      { name: 'Serpente Dupla', seq: ['lk', 'lk2', 'hp'], input: 'U, U, K' },
      { name: 'Toque e Serpente', seq: ['lp', 'lk', 'lk2'], input: 'J, U, U' },
      { name: 'Dança da Lança', seq: ['lp', 'hp', 'hk', 'lanca'], input: 'J, K, I, ↓ → + Soco' },
      { name: 'Ascensão e Garra', seq: ['chp', 'garra'], input: '↓ + K, ← → + Soco' },
    ],
    fatalities: [
      { id: 'explosao_carmesim', name: 'Explosão Carmesim', motion: [2, 6, 6], btn: 'hp', range: [1.2, 4.5], label: '↓ → → + K (média)', simple: 'n' },
      { id: 'ritual_proibido', name: 'Ritual Proibido', motion: [4, 4, 2], btn: 'hk', range: [0, 2.4], label: '← ← ↓ + I (perto)', simple: 'd' },
      { id: 'beijo_morte', name: 'Beijo da Morte', motion: [6, 6, 2], btn: 'lp', range: [0, 2.0], label: '→ → ↓ + J (perto)', simple: 'f', proposal: true },
      { id: 'chuva_final', name: 'Chuva de Lanças Final', motion: [4, 2, 4], btn: 'lk', range: [2.4, 99], label: '← ↓ ← + U (longe)', simple: 'b', proposal: true },
    ],
    ai: { preferred: 3.4, zoning: 0.65, aggression: 0.45, specials: ['lanca', 'espinhos', 'chuva', 'garra', 'teleporte', 'clone', 'veu', 'regen'] },
  },
  kazuro: {
    id: 'kazuro', name: 'Kazuro', title: 'o Samurai Amaldiçoado', proposalNames: true,
    bio: 'Espadachim veloz possuído por uma entidade demoníaca. Cortes espectrais, contra-ataques, investidas e duplicatas.',
    height: 1.85, walkF: 0.057, walkB: 0.048, jumpVX: 0.072,
    moves: kazuroMoves, projectiles: kazuroProj,
    specials: [
      { move: 'corte_espectral', cmd: SPECIAL_CMDS.qcfP, simple: 'n' },
      { move: 'investida', cmd: SPECIAL_CMDS.qcfK, simple: 'f' },
      { move: 'iaijutsu', cmd: SPECIAL_CMDS.qcbP },
      { move: 'reflexo', cmd: SPECIAL_CMDS.qcbK, simple: 'b' },
      { move: 'mil_laminas', cmd: SPECIAL_CMDS.bfP },
      { move: 'duplicata', cmd: SPECIAL_CMDS.bfK },
      { move: 'lamina_ascendente', cmd: SPECIAL_CMDS.ddP, simple: 'd' },
      { move: 'passo_sombras', cmd: SPECIAL_CMDS.ddK },
    ],
    superMove: 'tempestade', superMove2: 'despertar',
    throwName: 'Lâmina na Garganta', throwDmg: 100,
    transform: 'Oni Desperto',
    winPose: 'winKazuro', aura: 0x6090ff, magicSfx: false, superRange: 2.3,
    combos: [
      { name: 'Lâminas Gêmeas', seq: ['lp', 'lp2', 'hp'], input: 'J, J, K' },
      { name: 'Vento Cortante', seq: ['lk', 'lk2', 'hp'], input: 'U, U, K' },
      { name: 'Corte e Giro', seq: ['hp', 'hk'], input: 'K, I' },
      { name: 'Lâminas e Espectro', seq: ['lp', 'lp2', 'hp', 'corte_espectral'], input: 'J, J, K, ↓ → + Soco' },
      { name: 'Lua e Ascensão', seq: ['chp', 'lamina_ascendente'], input: '↓ + K, ↓ ↓ + Soco' },
    ],
    fatalities: [
      { id: 'mil_cortes', name: 'Mil Cortes', motion: [6, 4, 6], btn: 'hp', range: [0, 2.2], label: '→ ← → + K (perto)', simple: 'n' },
      { id: 'ultimo_suspiro', name: 'Último Suspiro', motion: [4, 4, 6], btn: 'hk', range: [1.5, 4.0], label: '← ← → + I (média)', simple: 'd' },
      { id: 'corte_fantasma', name: 'Corte Fantasma', motion: [2, 4, 2], btn: 'lp', range: [0, 2.5], label: '↓ ← ↓ + J (perto)', simple: 'f', proposal: true },
      { id: 'possessao_oni', name: 'Possessão Oni', motion: [6, 2, 6], btn: 'lk', range: [2.5, 99], label: '→ ↓ → + U (longe)', simple: 'b', proposal: true },
    ],
    ai: { preferred: 2.0, zoning: 0.35, aggression: 0.7, specials: ['investida', 'corte_espectral', 'iaijutsu', 'mil_laminas', 'lamina_ascendente', 'duplicata', 'passo_sombras', 'reflexo'],
      close: ['mil_laminas', 'iaijutsu', 'lamina_ascendente', 'investida'], long: ['corte_espectral', 'investida', 'duplicata', 'passo_sombras', 'corte_espectral'], counter: 'reflexo', antiAir: 'lamina_ascendente' },
  },
  brakkor: {
    id: 'brakkor', name: 'Brakkor', title: 'o Devorador', proposalNames: true,
    bio: 'Demônio gigante e lento que esmaga com agarrões, fogo infernal, terremotos e investidas que não se detêm.',
    height: 2.35, width: 1.2, walkF: 0.045, walkB: 0.032, jumpVX: 0.055,
    moves: brakkorMoves, projectiles: brakkorProj,
    specials: [
      { move: 'bola_fogo', cmd: SPECIAL_CMDS.qcfP, simple: 'n' },
      { move: 'investida_touro', cmd: SPECIAL_CMDS.qcfK, simple: 'f' },
      { move: 'esmagamento', cmd: SPECIAL_CMDS.qcbP, simple: 'b' },
      { move: 'sopro', cmd: SPECIAL_CMDS.qcbK },
      { move: 'punho_magma', cmd: SPECIAL_CMDS.bfP },
      { move: 'salto', cmd: SPECIAL_CMDS.bfK },
      { move: 'terremoto', cmd: SPECIAL_CMDS.ddP, simple: 'd' },
      { move: 'devorar', cmd: SPECIAL_CMDS.ddK },
    ],
    superMove: 'apocalipse', superMove2: 'banquete',
    throwName: 'Arremesso do Abismo', throwDmg: 115,
    transform: 'Devorador Ancestral',
    winPose: 'winBrakkor', aura: 0xff5a10, magicSfx: false, superRange: 2.4,
    combos: [
      { name: 'Esmaga-Crânios', seq: ['lp', 'hp'], input: 'J, K' },
      { name: 'Pisada e Punho', seq: ['lk', 'hp'], input: 'U, K' },
      { name: 'Punho e Fogo', seq: ['lp', 'hp', 'bola_fogo'], input: 'J, K, ↓ → + Soco' },
      { name: 'Chifrada e Esmagamento', seq: ['clp', 'esmagamento'], input: '↓ + J, ↓ ← + Soco' },
    ],
    fatalities: [
      { id: 'devorador_almas', name: 'Devorador de Almas', motion: [2, 2, 6], btn: 'hp', range: [0, 1.9], label: '↓ ↓ → + K (perto)', simple: 'n' },
      { id: 'fornalha_infernal', name: 'Fornalha Infernal', motion: [4, 6, 2], btn: 'hk', range: [0, 3.0], label: '← → ↓ + I (perto/média)', simple: 'd' },
      { id: 'esmagamento_sismico', name: 'Esmagamento Sísmico', motion: [2, 6, 6], btn: 'lk', range: [1.2, 4.0], label: '↓ → → + U (média)', simple: 'f', proposal: true },
      { id: 'rasgo_duplo', name: 'Rasgo Duplo', motion: [6, 6, 4], btn: 'lp', range: [0, 1.6], label: '→ → ← + J (colado)', simple: 'b', proposal: true },
    ],
    ai: { preferred: 1.4, zoning: 0.3, aggression: 0.75, specials: ['esmagamento', 'investida_touro', 'bola_fogo', 'terremoto', 'punho_magma', 'sopro', 'salto', 'devorar'],
      close: ['punho_magma', 'sopro', 'terremoto', 'investida_touro'], long: ['bola_fogo', 'investida_touro', 'terremoto', 'salto', 'bola_fogo'], grabs: ['esmagamento', 'esmagamento', 'devorar'] },
  },
  nymera: {
    id: 'nymera', name: 'Nymera', title: 'a Rainha Glacial', proposalNames: true,
    bio: 'Assassina de gelo que controla o espaço: lanças e espinhos glaciais, armadilhas que congelam e clones de gelo que punem quem ataca.',
    height: 1.78, walkF: 0.055, walkB: 0.05, jumpVX: 0.074,
    moves: nymeraMoves, projectiles: nymeraProj,
    specials: [
      { move: 'lanca_gelo', cmd: SPECIAL_CMDS.qcfP, simple: 'n' },
      { move: 'deslize', cmd: SPECIAL_CMDS.qcfK, simple: 'f' },
      { move: 'espinhos_gelo', cmd: SPECIAL_CMDS.qcbP },
      { move: 'armadilha', cmd: SPECIAL_CMDS.qcbK, simple: 'd' },
      { move: 'clone_gelo', cmd: SPECIAL_CMDS.bfP, simple: 'b' },
      { move: 'garra_inverno', cmd: SPECIAL_CMDS.bfK },
      { move: 'nevasca', cmd: SPECIAL_CMDS.ddP },
      { move: 'passo_glacial', cmd: SPECIAL_CMDS.ddK },
    ],
    superMove: 'inverno_eterno', superMove2: 'tumulo_gelo',
    throwName: 'Abraço Glacial', throwDmg: 95,
    transform: 'Coroa Glacial',
    winPose: 'winNymera', aura: 0x80d8ff, magicSfx: true, superRange: 2.3, clonePose: 'parry_s',
    combos: [
      { name: 'Adagas Gêmeas', seq: ['lp', 'lp2', 'hp'], input: 'J, J, K' },
      { name: 'Cristal Duplo', seq: ['lk', 'lk2', 'hp'], input: 'U, U, K' },
      { name: 'Estocada e Nevasca', seq: ['hp', 'hk'], input: 'K, I' },
      { name: 'Adagas e Lança', seq: ['lp', 'lp2', 'hp', 'lanca_gelo'], input: 'J, J, K, ↓ → + Soco' },
      { name: 'Pico e Garra', seq: ['chp', 'garra_inverno'], input: '↓ + K, ← → + Chute' },
    ],
    fatalities: [
      { id: 'estilhacos_humanos', name: 'Estilhaços Humanos', motion: [2, 6, 2], btn: 'hp', range: [0, 2.6], label: '↓ → ↓ + K (perto)', simple: 'n' },
      { id: 'frio_absoluto', name: 'Frio Absoluto', motion: [4, 6, 6], btn: 'hk', range: [2.4, 99], label: '← → → + I (longe)', simple: 'd' },
      { id: 'coracao_gelo', name: 'Coração de Gelo', motion: [6, 6, 4], btn: 'lp', range: [0, 1.7], label: '→ → ← + J (colado)', simple: 'f', proposal: true },
      { id: 'prisao_cristalina', name: 'Prisão Cristalina', motion: [2, 2, 6], btn: 'lk', range: [1.2, 4.0], label: '↓ ↓ → + U (média)', simple: 'b', proposal: true },
    ],
    ai: { preferred: 2.8, zoning: 0.55, aggression: 0.55, specials: ['lanca_gelo', 'espinhos_gelo', 'armadilha', 'deslize', 'garra_inverno', 'nevasca', 'clone_gelo', 'passo_glacial'],
      close: ['nevasca', 'deslize', 'garra_inverno', 'clone_gelo'], long: ['lanca_gelo', 'espinhos_gelo', 'armadilha', 'lanca_gelo'], counter: 'clone_gelo', antiAir: 'garra_inverno' },
  },
  pestilus: {
    id: 'pestilus', name: 'Pestilus', title: 'o Médico da Peste', proposalNames: true,
    bio: 'Alquimista corrompido que domina a área: bombas tóxicas, nuvens corrosivas, veneno que consome aos poucos e enxames de ratos e corvos.',
    height: 1.9, walkF: 0.046, walkB: 0.042, jumpVX: 0.064,
    moves: pestilusMoves, projectiles: pestilusProj,
    specials: [
      { move: 'bomba_toxica', cmd: SPECIAL_CMDS.qcfP, simple: 'n' },
      { move: 'bisturi', cmd: SPECIAL_CMDS.qcfK, simple: 'f' },
      { move: 'nuvem', cmd: SPECIAL_CMDS.qcbP },
      { move: 'ratos', cmd: SPECIAL_CMDS.qcbK, simple: 'd' },
      { move: 'seringa', cmd: SPECIAL_CMDS.bfP },
      { move: 'corvos', cmd: SPECIAL_CMDS.bfK },
      { move: 'miasma', cmd: SPECIAL_CMDS.ddP, simple: 'b' },
      { move: 'frasco', cmd: SPECIAL_CMDS.ddK },
    ],
    superMove: 'pandemia', superMove2: 'praga_negra',
    throwName: 'Injeção Letal', throwDmg: 95,
    transform: 'Peste Encarnada',
    winPose: 'winPestilus', aura: 0x80ff40, magicSfx: true, superRange: 2.4,
    combos: [
      { name: 'Receita Dupla', seq: ['lp', 'lp2', 'hp'], input: 'J, J, K' },
      { name: 'Chute e Bisturi', seq: ['lk', 'hp'], input: 'U, K' },
      { name: 'Agulha e Bico', seq: ['clp', 'chp'], input: '↓ + J, ↓ + K' },
      { name: 'Receita e Seringa', seq: ['lp', 'lp2', 'hp', 'seringa'], input: 'J, J, K, ← → + Soco' },
      { name: 'Bengala e Frasco', seq: ['lp', 'hp', 'frasco'], input: 'J, K, ↓ ↓ + Chute' },
    ],
    fatalities: [
      { id: 'decomposicao', name: 'Decomposição', motion: [2, 4, 2], btn: 'hp', range: [0, 3.0], label: '↓ ← ↓ + K (perto/média)', simple: 'n' },
      { id: 'ultimo_experimento', name: 'Último Experimento', motion: [6, 4, 6], btn: 'hk', range: [0, 1.8], label: '→ ← → + I (colado)', simple: 'd' },
      { id: 'enxame_faminto', name: 'Enxame Faminto', motion: [4, 4, 6], btn: 'lp', range: [2.2, 99], label: '← ← → + J (longe)', simple: 'f', proposal: true },
      { id: 'dissecacao', name: 'Dissecação', motion: [2, 2, 4], btn: 'lk', range: [0, 2.0], label: '↓ ↓ ← + U (perto)', simple: 'b', proposal: true },
    ],
    ai: { preferred: 3.0, zoning: 0.6, aggression: 0.5, specials: ['bomba_toxica', 'nuvem', 'seringa', 'ratos', 'corvos', 'bisturi', 'frasco', 'miasma'],
      close: ['frasco', 'miasma', 'bisturi', 'nuvem'], long: ['seringa', 'bomba_toxica', 'ratos', 'corvos', 'nuvem'], antiAir: 'miasma' },
  },
};


// Desejos de seção 5.1 do GDD ainda não implementados ficam registrados em CHECKPOINTS.md.

export function getMove(charId, id) {
  const m = CHARACTERS[charId].moves[id];
  if (!m) throw new Error(`Golpe inexistente: ${charId}.${id}`);
  return m;
}

// Dados derivados de frames para a lista de golpes e testes.
export function moveFrameData(m) {
  if (!m.hits.length) return { startup: null, advBlock: null, advHit: null };
  const h0 = m.hits[0], hl = m.hits[m.hits.length - 1];
  const startup = h0.f0 + 1;
  const recoveryAfter = m.frames - 1 - hl.f0; // quadros restantes após o último acerto (1º quadro ativo)
  return { startup, advBlock: hl.bs - recoveryAfter, advHit: hl.kd ? 'KD' : hl.hs - recoveryAfter };
}

export const ARENAS = {
  coliseu: { id: 'coliseu', name: 'Coliseu Carmesim', desc: 'Arquibancadas demoníacas e poços de lava.' },
  catedral: { id: 'catedral', name: 'Catedral Profana', desc: 'Estátuas, vitrais e altares ritualísticos.' },
  templo: { id: 'templo', name: 'Templo dos Samurais Mortos', desc: 'Estátuas destrutíveis e espíritos ancestrais.' },
  forja: { id: 'forja', name: 'Forja Infernal', desc: 'Lava, correntes e fornalhas.' },
};

// golpes genéricos compartilhados (transformação)
for (const ch of Object.values(CHARACTERS)) {
  ch.moves.empurra_estatua = { id: 'empurra_estatua', name: 'Estátua do Carrasco', frames: 26, hits: [], kind: 'interact', cancel: [], anim: 'grab' };
  ch.moves.invoca_espirito = { id: 'invoca_espirito', name: 'Espírito Ancestral', frames: 30, hits: [], kind: 'interact', cancel: [], anim: 'cast' };
  ch.moves.fury_on = { id: 'fury_on', name: ch.transform, frames: 40, hits: [], kind: 'transform', cancel: [], anim: 'roar', invuln: [0, 40] };
}
// duração e distância canônica das finalizações (timeline cinematográfica)
export const FAT_META = {
  execucao_real: { dur: 300, dist: 1.15 },
  machado_condenacao: { dur: 300, dist: 3.4 },
  explosao_carmesim: { dur: 290, dist: 2.2 },
  ritual_proibido: { dur: 330, dist: 1.6 },
  correntes_suplicio: { dur: 320, dist: 2.6 },
  ruptura_infernal: { dur: 300, dist: 1.5 },
  beijo_morte: { dur: 310, dist: 0.85 },
  chuva_final: { dur: 320, dist: 3.4 },
  mil_cortes: { dur: 300, dist: 1.3 },
  ultimo_suspiro: { dur: 290, dist: 2.6 },
  corte_fantasma: { dur: 300, dist: 1.6 },
  possessao_oni: { dur: 320, dist: 3.2 },
  devorador_almas: { dur: 320, dist: 1.2 },
  fornalha_infernal: { dur: 320, dist: 1.4 },
  esmagamento_sismico: { dur: 300, dist: 1.8 },
  rasgo_duplo: { dur: 300, dist: 1.0 },
  estilhacos_humanos: { dur: 300, dist: 1.6 },
  frio_absoluto: { dur: 320, dist: 3.2 },
  coracao_gelo: { dur: 300, dist: 0.9 },
  prisao_cristalina: { dur: 310, dist: 2.4 },
  decomposicao: { dur: 330, dist: 1.8 },
  ultimo_experimento: { dur: 320, dist: 1.1 },
  enxame_faminto: { dur: 320, dist: 3.2 },
  dissecacao: { dur: 320, dist: 1.2 },
};
for (const ch of Object.values(CHARACTERS)) for (const f of ch.fatalities) Object.assign(f, FAT_META[f.id]);
