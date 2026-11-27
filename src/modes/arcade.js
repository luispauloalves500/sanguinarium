// Modo Arcade: escada de 4 lutas contra a CPU (3 rivais + Reflexo Sombrio) e texto de final por personagem (pt-BR).
import { CHARACTERS } from '../combat/moves.js';

export function buildLadder(charId, difficulty = 1) {
  // v0.3: enfrenta os outros 3 lutadores (ordem fixa por personagem) e fecha com o Reflexo Sombrio (espelho)
  const ids = Object.keys(CHARACTERS);
  const start = ids.indexOf(charId);
  const rivals = [1, 2, 3].map((k) => ids[(start + k) % ids.length]).filter((id) => id !== charId);
  const arenas = ['coliseu', 'catedral'];
  const d = (k) => Math.max(0, Math.min(4, difficulty + k));
  const titles = ['o primeiro pacto', 'o pacto quebrado', 'o pacto final'];
  const ladder = rivals.map((r, i) => ({ p2: r, arena: arenas[(start + i) % 2], difficulty: d(i === 2 ? 1 : 0), title: `${CHARACTERS[r].name} — ${titles[i]}` }));
  ladder.push({ p2: charId, arena: arenas[(start + 3) % 2], difficulty: d(2), title: 'Reflexo Sombrio' });
  return ladder;
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
  kazuro: {
    title: 'A LÂMINA LIBERTA',
    text: [
      'O último pacto se parte sob o fio da katana, e a entidade que habitava Kazuro grita pela primeira vez — não de fome, mas de medo. Pela primeira vez em séculos, é o samurai quem empunha o demônio.',
      'Ele crava a lâmina no chão do Abismo e prende o Oni dentro do aço. Ninguém mais será possuído. Kazuro caminha de volta à superfície como guardião de uma espada que nunca mais poderá embainhar.',
    ],
  },
  brakkor: {
    title: 'A FOME SEM FIM',
    text: [
      'Brakkor devora o último pacto e, com ele, a alma de quem o selou. As muralhas do Abismo tremem: cada passo do gigante abre uma fenda de fogo até a superfície.',
      'Os demônios menores se ajoelham, mas a fome não passa. Ele olha para cima, para o mundo dos vivos, e sorri com a mandíbula em brasa. O banquete está apenas começando.',
    ],
  },
};
