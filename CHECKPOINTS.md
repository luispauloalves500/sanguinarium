# CHECKPOINTS — SANGUINARIUM v0.3.0

Regra do GDD (§21): nada é marcado "Concluído" sem implementação real, testes de regressão **e validação nas
plataformas-alvo**. Esta build foi validada em Chromium headless (SwiftShader, sem GPU), no site publicado
(GitHub Pages, também em headless) e com testes da simulação em Node; por isso o status máximo usado aqui é
**Implementado (validado em headless)**. Nenhum item está "Concluído".

Legenda: ✅ Implementado (validado em headless) · 🟡 Parcial · ⬜ Pendente

| CP | Item | Status | Evidência / testes | Pendências e próxima ação |
|---|---|---|---|---|
| CP01 | Engine e movimentação | ✅ | Simulação determinística a 60 Hz separada da renderização; testes de determinismo (inclusive com arenas interativas e transição); limites da arena e separação máxima; câmera dinâmica | Validar em GPU real |
| CP02 | Quatro personagens 3D com rig | 🟡 **PLACEHOLDER** | **v0.3:** Kazuro (couraça laqueada em placas amarradas, hakama em painéis que seguem as coxas, haori rasgado e ombreiras com molas, coque, máscara oni rachada com chifres e olhos espectrais, katana com tsuba e bainha, chamas azuis na lâmina e espíritos orbitando na transformação) e Brakkor (gigante de 2,35 m, corcunda com espinhos dorsais, fissuras de lava, chifres em espiral, mandíbula articulada com garganta incandescente, grilhões partidos com correntes, garras, cauda segmentada com molas, cascos; chamas nos ombros na transformação); 2 paletas cada. v0.2: Varkhan (placa peitoral com caveira, correntes, ombreiras com espetos, capa rasgada com molas, machado em crescente com chamas na Fúria) e Lilith (corpete dourado, saia em painéis presos à pelve que seguem as coxas, mangas de sino, garras, cabelo com molas, orbes de sangue). IK de perna com pés plantados e tornozelos planos; molas secundárias. Conferido com `tools/poseshot.mjs` (agachar, ajoelhar, estocada) | Substituir por modelos GLB com rig e animações reais; mistura de animação ainda é interpolação de poses (sem curvas/keyframes autorais) |
| CP03 | Colisões e dano | ✅ | hitbox/hurtbox/pushbox por quadro; testes de quadros ativos, alcance, pushbox | — |
| CP04 | Básicos, defesa e combos | ✅ | v0.3: Kazuro e Brakkor com o mesmo conjunto de básicos (em pé, agachado, aéreo) e combos próprios; Leves/fortes (em pé, agachado, aéreo), bloqueio alto/baixo, bloqueio perfeito, agarrão com escape, esquiva, cancelamentos, escala de dano, limite de malabarismo | Meta do GDD de 24 básicos / 12 combos por personagem não atingida |
| CP05 | Especiais e projéteis | ✅ | 8 especiais por personagem (32) + potencializados, especial simplificado (ESP). **v0.3, mecânicas novas genéricas:** agarrão de comando (imbloqueável, sem escape, só no chão), superarmadura (absorve 1 golpe com 80% do dano), terremoto (onda baixa no chão: pular escapa), corte projétil, salto esmagador por cima, contra-ataque e versão EX definidos por golpe (`counterMove`/`exMove`). Testes: 8 novos | — |
| CP06 | Sangue e ferimentos | ✅ | Partículas com pool, poças persistentes, 3 níveis de dano visual, opções de sangue; v0.2: coto com brilho e rastro na decapitação | Medir memória em sessões longas em aparelhos reais |
| CP07 | Fatalidades | ✅ (4 por personagem, 16 no total) | **v0.3:** Kazuro — Mil Cortes (GDD §9.1: cortes espectrais, guarda a espada, fragmentação), Último Suspiro (GDD), Corte Fantasma*, Possessão Oni*; Brakkor — Devorador de Almas (GDD), Fornalha Infernal (GDD), Esmagamento Sísmico*, Rasgo Duplo*; todas com câmera cinematográfica; testes: as 8 por comando completo e por ESP + direção; QA: as 8 por teclado real. v0.1: Execução Real, Machado da Condenação, Explosão Carmesim, Ritual Proibido. **v0.2:** Correntes do Suplício*, Ruptura Infernal*, Beijo da Morte*, Chuva de Lanças Final*; ESP + direção escolhe a Sentença no toque. Testes: as 8 por comando e distância, ESP + direção; QA: as 8 por teclado real | Finalizações instantâneas e fatalidades de arena (ambientais) adiadas; desmembramento ainda usa partes do placeholder |
| CP08 | Supergolpes e transformações | ✅ | **v0.3:** Kazuro — Tempestade de Lâminas*, Despertar do Oni*, transformação Oni Desperto*; Brakkor — Apocalipse Ígneo*, Banquete do Devorador* (agarrão imbloqueável que cura), transformação Devorador Ancestral*; testes de dano/cinemática/controle; QA: os 4 por teclado. Supergolpe 1 (Execução Carmesim; Eclipse Sangrento*) e **supergolpe 2** (Tribunal dos Condenados — nome do GDD; Sabá Sangrento* — golpe baixo) com cinemáticas; ↓+U+I ou ESP+↗; Fúria 10 s (+20% dano, chamas no machado de Varkhan = "Carrasco do Inferno"); quebra de combo. Testes: 2º super custa 2 barras e devolve o controle; Sabá é baixo (bloqueio agachado segura); QA: os 2 novos supers por teclado | — |
| CP09 | IA e dificuldades | ✅ | **v0.3:** perfis por personagem (especiais de perto/longe, contra-ataque e antiaéreo de Kazuro, agarrões de comando de Brakkor contra quem defende). Balanceamento CPU×CPU (`node tools/balance.mjs 30 2`, 360 partidas por dificuldade): ver tabela abaixo; teste exige 25–75% para todos nos 16 confrontos. 5 níveis; v0.2: CPU usa o 2º supergolpe e os elementos da arena quando encurralada; teste: 20 partidas CPU×CPU completas | Ajuste fino de balanceamento |
| CP10 | Arenas interativas | ✅ | **v0.3 (correção):** a Estátua do Carrasco agora colide: a simulação usa a mesma curva de queda do render, acerta no instante em que a estátua chega à cabeça do oponente e o empurra para fora da área onde ela repousa (derrubado ou defendendo); teste + QA. **v0.2:** Corrente do Muro (salto por cima do oponente, Coliseu/Fosso), Estátua do Carrasco (tomba: 90 de dano, golpe alto, 1 por lado/round, Catedral/Cripta), Poço de Lava / Braseiro Profano (+50 em derrubada na borda, com recarga), **transições** Portão do Fosso (→ Fosso do Coliseu) e Queda na Cripta (→ Cripta Profana) com +70 de dano, escurecimento e câmera; opção para desligar (competitivo). Regras na simulação (`src/combat/arena.js`), não na renderização. Testes: 6 novos (transição única, lava, desligado, salto, estátua alto/bloqueável, determinismo); QA: estátua, salto, as 2 transições e a opção desligada por teclado real | Fatalidades de arena (ambientais) adiadas; mais transições por arena |
| CP11 | Menu, HUD e opções | ✅ | **v0.3:** seleção com 4 cartões (grade 4/2 colunas), abas da lista de golpes geradas para os 4 lutadores, **lista de golpes, combos, Sentenças, controles e dica do HUD mostram as teclas remapeadas** (correção v0.2; QA confere). Menus, seleção, opções, lista de golpes (agora com supergolpe 2, as 4 Sentenças com atalho de toque e as arenas), pausa, resultados, HUD; v0.2: dica "↑ + O · elemento" no HUD, nome do cenário após transição, **remapeamento de teclas do Jogador 1** (troca automática de teclas repetidas, salvo em localStorage), qualidade Automática e "Mostrar qps" | Remapeamento do Jogador 2 e do gamepad (adiado de novo na v0.3); layout de toque ajustável |
| CP12 | 16 lutadores | 🟡 4/16 | v0.3: Varkhan, Lilith, **Kazuro**, **Brakkor** | 12 lutadores restantes |
| CP13 | Quatro chefes | ⬜ | — | Fora do escopo |
| CP14 | Campanha | ⬜ | — | Fora do escopo |
| CP15 | Arcade, torres, sobrevivência | 🟡 | **v0.3:** escada de 4 lutas (os 3 outros lutadores + Reflexo Sombrio espelhado), finais de Kazuro e Brakkor*. v0.2: Modo Arcade com dificuldade crescente, continuar após derrota e final em texto por personagem*; QA percorre o fluxo pelo menu até o final | Torres, sobrevivência; finais com cinemática/ilustração |
| CP16 | Krypta e progressão | ⬜ | Só opções e teclas são salvas | Save/progressão adiados |
| CP17 | Multiplayer P2P | ⬜ | Simulação determinística por entradas (base para rollback) | Online adiado |
| CP18 | Otimização mobile | 🟡 | Controles de toque; v0.2: qualidade Automática (preset baixo no toque + resolução dinâmica 50–100% + corte de sombras em último caso), luz de clarão persistente, olhos de estátua como sprites, pré-compilação de shaders. Medição headless: ~120–145 chamadas de desenho e 43–65 mil triângulos por quadro em luta | **Desempenho (60 qps estáveis) não medido em GPU nem em aparelho real** — o ambiente de testes não tem GPU |
| CP19 | Balanceamento e testes | 🟡 | v0.3: 58 testes automatizados; v0.2: 45 testes automatizados (`npm test`) + QA de navegador (`tools/qa.mjs`) + verificação do site publicado (`tools/live.mjs`) | Balanceamento com jogadores reais |
| CP20 | Publicação | 🟡 | Repositório público + **GitHub Pages ativo** (https://luispauloalves500.github.io/sanguinarium/) + zip estático | Validação em aparelhos reais antes da 1.0 |

\* **Propostas desta build (não constam no GDD):** supergolpe de Lilith "Eclipse Sangrento" e "Sabá Sangrento";
transformação "Rainha do Sangue"; Sentenças 3 e 4 (Correntes do Suplício, Ruptura Infernal, Beijo da Morte, Chuva de
Lanças Final); nomes e textos de final do Arcade; nomes dos elementos de arena e dos cenários de transição.
Todas podem ser renomeadas/substituídas pelo autor do GDD.

**Propostas da v0.3 (não constam no GDD; o GDD só dá os nomes/títulos, o estilo e as Sentenças "Mil Cortes",
"Último Suspiro", "Devorador de Almas" e "Fornalha Infernal"):**
- Kazuro — especiais: Corte Espectral, Investida Relâmpago, Iaijutsu do Vazio, Lâmina Reflexa, Dança das Mil Lâminas,
  Duplicata Sombria, Lâmina Ascendente, Passo das Sombras; supergolpes Tempestade de Lâminas e Despertar do Oni;
  transformação Oni Desperto; Sentenças Corte Fantasma e Possessão Oni; agarrão Lâmina na Garganta; básicos (Golpe de
  Tsuka, Corte Diagonal, Chute Giratório, Estocada Baixa, Corte Lunar, Corte de Tornozelo, Corte do Falcão etc.);
  combos Lâminas Gêmeas, Vento Cortante, Corte e Giro, Lâminas e Espectro, Lua e Ascensão; final "A Lâmina Liberta".
- Brakkor — especiais: Bola de Fogo Infernal, Investida do Touro, Esmagamento, Sopro Infernal, Punho de Magma,
  Salto Esmagador, Terremoto, Devorar; supergolpes Apocalipse Ígneo e Banquete do Devorador; transformação Devorador
  Ancestral; Sentenças Esmagamento Sísmico e Rasgo Duplo; agarrão Arremesso do Abismo; básicos (Tapa de Garra, Punho de
  Pedra, Pisada, Chute do Colosso, Chifrada, Rasteira de Cauda, Martelo Duplo, Queda Esmagadora etc.); combos
  Esmaga-Crânios, Pisada e Punho, Punho e Fogo, Chifrada e Esmagamento; final "A Fome sem Fim".
- Arcade: títulos "o pacto quebrado" e a escada de 4 lutas.
- Visual: máscara oni, katana, haori/hakama de Kazuro; chifres, lava, cauda e mandíbula de Brakkor (o GDD não descreve a aparência).

### Balanceamento CPU × CPU (v0.3, `tools/balance.mjs`, 12 confrontos não espelhados × 30/20 partidas)
| Dificuldade | Varkhan | Lilith | Kazuro | Brakkor |
|---|---|---|---|---|
| 2 | 41% | 60% | 54% | 44% |
| 3 | 45% | 55% | 49% | 51% |
| 4 | 35% | 47% | 63% | 56% |

Ajustes feitos para chegar aqui: dano/alcance de Kazuro reduzidos, agarrão de comando de Brakkor 150→125, hurtbox de
Brakkor 20% mais larga (alvo maior), superarmadura absorve com 80% do dano, perfil de IA de Varkhan com especiais de perto.
Varkhan segue o mais fraco na dificuldade 4 (35%) e Kazuro o mais forte (63%) — dentro da faixa aceita, mas é o
primeiro ajuste a fazer. Ainda é balanceamento entre CPUs; falta teste com jogadores reais.

## Placeholders desta versão
- **Personagens**: modelos procedurais de primitivas Three.js (sem GLB/rig importado), mais detalhados na v0.2.
- **Arenas**: geometria procedural; estátuas, correntes, braseiros, Fosso e Cripta também são placeholders.
- **Áudio**: todo procedural (Web Audio); locutor usa a voz pt-BR do navegador (speechSynthesis), se existir.
- **Texturas**: geradas em canvas.
- **Finais do Arcade**: só texto.
- **v0.3 — Kazuro e Brakkor**: modelos procedurais (primitivas) com as mesmas limitações de Varkhan/Lilith; poses novas
  (katana, iaijutsu, guarda, sopro, investida, salto, comer, guardar a espada, vitória) também são placeholders.

## Escopo adiado (registrado, não cortado em silêncio)
Finalizações instantâneas e fatalidades de arena; online P2P; história, torres e sobrevivência; Krypta/progressão;
remapeamento do Jogador 2/gamepad (opcional da v0.3, não feito) e layout de toque ajustável; arenas do GDD
"Templo dos Samurais Mortos" e "Forja Infernal" (temáticas dos novos lutadores) e capítulo 03 da campanha; meta completa de 24 básicos e 12 combos por
personagem; malhas separadas para desmembramento; medição de desempenho em GPU/celulares reais; modelos GLB.

## Problemas conhecidos
- Desempenho só medido em SwiftShader (sem GPU, ~10–30 qps); a meta de 60 qps estáveis não pôde ser comprovada aqui.
- As poses continuam procedurais (interpolação de poses). **v0.3:** a cambalhota da Corrente do Muro acelera/desacelera,
  encolhe no meio e estende para aterrissar; quedas deitam conforme a velocidade e têm quique de impacto — melhor, mas
  ainda não é animação autoral.
- **v0.3 — corrigido:** estátua atravessando o oponente; lista de golpes/dicas com teclas padrão após remapear.
- A estátua deitada ainda passa visualmente por cima de quem a derrubou (só o oponente é empurrado).
- Kazuro/Brakkor: fantasmas e fragmentação usam cópias do modelo placeholder; a dica do HUD do Jogador 2 mostra a
  tecla fixa (Num6), pois o P2 não é remapeável.
- Brakkor (2,35 m) cortava a cabeça no enquadramento da luta: a v0.3 afasta/eleva a câmera quando há lutador alto
  (verificado por captura). Em alguns planos fechados de cinemáticas a cabeça dele ainda pode sair do quadro.
- Seleção com 4 cartões: em telas estreitas (≤ 900 px) os cartões passam para 2 colunas.
- O locutor depende de vozes pt-BR instaladas no sistema.

## Como reproduzir os testes
```bash
npm install                      # playwright-core (testes de navegador)
npx playwright-core install chromium
npm test                         # 58 testes da simulação
node tools/balance.mjs 30 2      # taxa de vitória CPU×CPU nos 12 confrontos
python3 -m http.server 8090 --bind 127.0.0.1 &
node tools/qa.mjs                # QA headless, prints em /workspace/sanguinarium-shots
node tools/live.mjs              # site publicado (GitHub Pages)
```
