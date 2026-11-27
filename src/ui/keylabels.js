// Rótulos de teclas gerados a partir do mapeamento atual (lista de golpes, controles e dicas do HUD).
// v0.4: mapas separados para o Jogador 1 e o Jogador 2.
import { KEYMAP_P1, KEYMAP_P2, keyName } from '../input/devices.js';

const first = (m) => { const o = {}; for (const [code, a] of Object.entries(m)) if (!o[a]) o[a] = code; return o; };
const DEFAULT = [first(KEYMAP_P1), first(KEYMAP_P2)];
let current = [{ ...DEFAULT[0] }, { ...DEFAULT[1] }];
export function setKeyBindings(b1, b2) { current = [{ ...DEFAULT[0], ...(b1 || {}) }, { ...DEFAULT[1], ...(b2 || current[1] || {}) }]; }
export function keyFor(action, player = 0) { return keyName(current[player ? 1 : 0][action]); }
// letras padrão usadas nos textos de comandos -> ação
const LETTER = { J: 'lp', K: 'hp', U: 'lk', I: 'hk', L: 'block', O: 'grab', P: 'special' };
// troca J/K/U/I/L/O/P isolados (ex.: "→ ← → + K (perto)", "J, J, K", "U + I") pelas teclas atuais do P1
export function relabel(text) {
  return String(text).replace(/(^|[\s,+(])([JKUILOP])(?=$|[\s,+)])/g, (m, pre, l) => pre + keyFor(LETTER[l]));
}
