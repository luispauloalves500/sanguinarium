// Modo Arcade: escada de 3 lutas contra a CPU e texto de final por personagem (pt-BR).
import { CHARACTERS } from '../combat/moves.js';

export function buildLadder(charId, difficulty = 1) {
  const ids = Object.keys(CHARACTERS);
  const rival = ids.find((id) => id !== charId) || charId;
  const d = (k) => Math.max(0, Math.min(4, difficulty + k));
  return [
    { p2: rival, arena: 'coliseu', difficulty: d(0), title: `${CHARACTERS[rival].name} — o primeiro pacto` },
    { p2: charId, arena: 'catedral', difficulty: d(1), title: 'Reflexo Sombrio' },
    { p2: rival, arena: charId === 'varkhan' ? 'catedral' : 'coliseu', difficulty: d(2), title: `${CHARACTERS[rival].name} — o pacto final` },
  ];
}

export const ENDINGS = {
  varkhan: {
    title: 'O CARRASCO ETERNO',
    text: [
      'Com o último pacto rompido, Varkhan ergue o machado sobre o trono vazio do Abismo. Os condenados que ele executou em vida sussurram seu nome — não como juiz, mas como carrasco.',
      'Ele recusa a coroa. Senta-se aos pés do trono, limpa a lâmina com o próprio manto e espera o próximo pecador. A sentença nunca termina.',
    ],
  },
  lilith: {
    title: 'A RAINHA DO SABÁ',
    text: [
      'O sangue do último rival escorre pelo altar profano e Lilith bebe o pacto inteiro. As correntes que a prendiam ao Abismo viram pó entre seus dedos.',
      'Sob uma lua vermelha, ela sobe à superfície. Atrás dela, mil bruxas despertam em seus túmulos. O mundo dos vivos acaba de ganhar uma rainha.',
    ],
  },
};
