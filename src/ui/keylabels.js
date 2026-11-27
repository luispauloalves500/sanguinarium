// v0.3: rótulos de teclas gerados a partir do mapeamento atual do P1 (lista de golpes, controles e dicas do HUD).
import { KEYMAP_P1, keyName } from '../input/devices.js';

const DEFAULT = {}; for (const [code, a] of Object.entries(KEYMAP_P1)) if (!DEFAULT[a]) DEFAULT[a] = code;
let current = { ...DEFAULT };
export function setKeyBindings(b) { current = { ...DEFAULT, ...(b || {}) }; }
export function keyFor(action) { return keyName(current[action]); }
// letras padrão usadas nos textos de comandos -> ação
const LETTER = { J: 'lp', K: 'hp', U: 'lk', I: 'hk', L: 'block', O: 'grab', P: 'special' };
// troca J/K/U/I/L/O/P isolados (ex.: "→ ← → + K (perto)", "J, J, K", "U + I") pelas teclas atuais
export function relabel(text) {
  return String(text).replace(/(^|[\s,+(])([JKUILOP])(?=$|[\s,+)])/g, (m, pre, l) => pre + keyFor(LETTER[l]));
}
