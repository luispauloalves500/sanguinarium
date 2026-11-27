// Modo Arcade: escada de 6 lutas contra a CPU (os 5 rivais + Reflexo Sombrio) e texto de final por personagem (pt-BR).
import { CHARACTERS } from '../combat/moves.js';

export function buildLadder(charId, difficulty = 1) {
  // v0.4: enfrenta os outros 5 lutadores (ordem fixa por personagem) e fecha com o Reflexo Sombrio (espelho)
  const ids = Object.keys(CHARACTERS);
  const start = ids.indexOf(charId);
  const rivals = ids.map((_, k) => ids[(start + k + 1) % ids.length]).filter((id) => id !== charId);
  const arenas = ['coliseu', 'catedral', 'templo', 'forja'];
  const d = (k) => Math.max(0, Math.min(4, difficulty + k));
  const titles = ['o primeiro pacto', 'o pacto de gelo', 'o pacto quebrado', 'o pacto profano', 'o pacto final'];
  const ramp = [0, 0, 1, 1, 1];
  const ladder = rivals.map((r, i) => ({ p2: r, arena: arenas[(start + i) % arenas.length], difficulty: d(ramp[i] ?? 1), title: `${CHARACTERS[r].name} — ${titles[i] || 'o pacto final'}` }));
  ladder.push({ p2: charId, arena: arenas[(start + rivals.length) % arenas.length], difficulty: d(2), title: 'Reflexo Sombrio' });
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
  nymera: {
    title: 'O INVERNO SEM FIM',
    text: [
      'O último pacto congela nas mãos de Nymera e se parte como vidro. O fogo do Abismo, que ardia desde o princípio, se apaga num sopro — e pela primeira vez neva no inferno.',
      'Ela não queria um trono: queria silêncio. Sobre os rios de lava agora sólidos, a Rainha Glacial ergue um palácio de gelo negro e sela as portas. Nada mais queimará enquanto ela reinar.',
    ],
  },
  pestilus: {
    title: 'A CURA DEFINITIVA',
    text: [
      'Pestilus disseca o último pacto sobre a mesa de pedra e anota cada veia, cada selo, cada grito. No fundo do frasco, encontra o que procurava há séculos: a fórmula da praga perfeita.',
      'Os corvos levam a notícia à superfície antes dele. Quando o médico finalmente sobe, as cidades já tossem. "Não é uma doença", ele murmura por trás do bico. "É o tratamento."',
    ],
  },
};
