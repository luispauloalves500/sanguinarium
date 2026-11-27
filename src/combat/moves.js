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
  lp: mv('lp', 'Golpe de Cabo', 19, [hit(6, 8, [0.25, 1.25, 1.15, 1.65], 35, 'high', { hs: 15, bs: 11 })],
    { cancel: ['lp2', 'hk', ...STD_CANCEL], anim: 'jab' }),
  lp2: mv('lp2', 'Golpe de Cabo (2)', 20, [hit(6, 8, [0.25, 1.2, 1.2, 1.65], 35, 'high', { hs: 16, bs: 11 })],
    { cancel: ['hp', ...STD_CANCEL], anim: 'jab2', chainOnly: true }),
  hp: mv('hp', 'Machadada', 34, [hit(12, 15, [0.3, 0.8, 1.75, 1.8], 75, 'mid', { hs: 22, bs: 16, push: 0.11, heavy: true, slash: true })],
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
    hit: hit(0, 0, null, 85, 'overhead', { hs: 24, bs: 14, push: 0.04, heavy: true }), ex: { dmg: 120 } },
  spikes: { vx: 0, y: 0, delay: 8, box: [-0.6, 0, 0.6, 1.3], life: 12, clash: false, fx: 'spikes', ground: true,
    hit: hit(0, 0, null, 75, 'low', { kd: true, launch: 0.15, hs: 30, bs: 14, push: 0.05, heavy: true }), ex: { dmg: 105, wide: 1.0 } },
  clone: { vx: 0.14, y: 0, box: [-0.35, 0.4, 0.45, 1.7], life: 46, clash: true, fx: 'clone',
    hit: hit(0, 0, null, 60, 'mid', { hs: 22, bs: 14, push: 0.1, slash: true }), ex: { dmg: 90, vx: 0.18 } },
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
    height: 1.95, walkF: 0.05, walkB: 0.042, jumpVX: 0.065,
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
    ai: { preferred: 2.4, zoning: 0.45, aggression: 0.55, specials: ['machado', 'corrente', 'ruptura', 'passo', 'julgamento', 'tormenta', 'ira', 'prisao'] },
  },
  lilith: {
    id: 'lilith', name: 'Lilith', title: 'a Bruxa Carmesim',
    bio: 'Feiticeira de controle de espaço: lanças, teletransporte, clones e regeneração limitada.',
    height: 1.8, walkF: 0.056, walkB: 0.05, jumpVX: 0.072,
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
};

// golpes genéricos compartilhados (transformação)
for (const ch of Object.values(CHARACTERS)) {
  ch.moves.empurra_estatua = { id: 'empurra_estatua', name: 'Estátua do Carrasco', frames: 26, hits: [], kind: 'interact', cancel: [], anim: 'grab' };
  ch.moves.fury_on = { id: 'fury_on', name: ch.transform, frames: 40, hits: [], kind: 'transform', cancel: [], anim: 'roar', invuln: [0, 40] };
}
// duração e distância canônica das finalizações (timeline cinematográfica)
const FAT_META = {
  execucao_real: { dur: 300, dist: 1.15 },
  machado_condenacao: { dur: 300, dist: 3.4 },
  explosao_carmesim: { dur: 290, dist: 2.2 },
  ritual_proibido: { dur: 330, dist: 1.6 },
  correntes_suplicio: { dur: 320, dist: 2.6 },
  ruptura_infernal: { dur: 300, dist: 1.5 },
  beijo_morte: { dur: 310, dist: 0.85 },
  chuva_final: { dur: 320, dist: 3.4 },
};
for (const ch of Object.values(CHARACTERS)) for (const f of ch.fatalities) Object.assign(f, FAT_META[f.id]);
