# CHECKPOINTS — SANGUINARIUM v0.4.0

Regra do GDD (§21): nada é marcado "Concluído" sem implementação real, testes de regressão **e validação nas
plataformas-alvo**. Esta build foi validada em Chromium headless (SwiftShader, sem GPU), no site publicado
(GitHub Pages, também em headless) e com testes da simulação em Node; por isso o status máximo usado aqui é
**Implementado (validado em headless)**. Nenhum item está "Concluído".

Legenda: ✅ Implementado (validado em headless) · 🟡 Parcial · ⬜ Pendente

| CP | Item | Status | Evidência / testes | Pendências e próxima ação |
|---|---|---|---|---|
| CP01 | Engine e movimentação | ✅ | Simulação determinística a 60 Hz separada da renderização; testes de determinismo (inclusive com arenas interativas e transição); limites da arena e separação máxima; câmera dinâmica | Validar em GPU real |
| CP02 | Seis personagens 3D com rig | 🟡 **PLACEHOLDER** | **v0.4:** Nymera (traje justo com placas de cristal no peito, ombreiras de estilhaços, braçadeiras e perneiras de gelo translúcido, duas adagas de gelo, saia em painéis, capa de geada com molas e pingentes, cabelo branco longo com molas, coroa de espinhos de gelo, cristais orbitando e aura de geada na transformação) e Pestilus (sobretudo longo em painéis + cauda, avental de couro com correias, cinto de frascos que brilham, capelete e gola alta, mochila alquímica com tanques, máscara de bico com anéis de latão e lentes que brilham, chapéu de aba larga, bisturi e seringa, moscas orbitando e névoa tóxica na transformação); 2 paletas cada. **v0.3:** Kazuro (couraça laqueada em placas amarradas, hakama em painéis que seguem as coxas, haori rasgado e ombreiras com molas, coque, máscara oni rachada com chifres e olhos espectrais, katana com tsuba e bainha, chamas azuis na lâmina e espíritos orbitando na transformação) e Brakkor (gigante de 2,35 m, corcunda com espinhos dorsais, fissuras de lava, chifres em espiral, mandíbula articulada com garganta incandescente, grilhões partidos com correntes, garras, cauda segmentada com molas, cascos; chamas nos ombros na transformação); 2 paletas cada. v0.2: Varkhan (placa peitoral com caveira, correntes, ombreiras com espetos, capa rasgada com molas, machado em crescente com chamas na Fúria) e Lilith (corpete dourado, saia em painéis presos à pelve que seguem as coxas, mangas de sino, garras, cabelo com molas, orbes de sangue). IK de perna com pés plantados e tornozelos planos; molas secundárias. Conferido com `tools/poseshot.mjs` (agachar, ajoelhar, estocada) | Substituir por modelos GLB com rig e animações reais; mistura de animação ainda é interpolação de poses (sem curvas/keyframes autorais) |
| CP03 | Colisões e dano | ✅ | hitbox/hurtbox/pushbox por quadro; testes de quadros ativos, alcance, pushbox | — |
| CP04 | Básicos, defesa e combos | ✅ | v0.3: Kazuro e Brakkor com o mesmo conjunto de básicos (em pé, agachado, aéreo) e combos próprios; Leves/fortes (em pé, agachado, aéreo), bloqueio alto/baixo, bloqueio perfeito, agarrão com escape, esquiva, cancelamentos, escala de dano, limite de malabarismo | Meta do GDD de 24 básicos / 12 combos por personagem não atingida |
| CP05 | Especiais e projéteis | ✅ | **v0.4, mecânicas novas genéricas:** veneno (dano a cada 15 quadros, nunca abaixo de 1 PV), nuvens persistentes que acertam em intervalos, bomba em arco que vira nuvem no chão, armadilha no chão (1 por vez, imbloqueável) e congelamento em bloco de gelo; Nymera e Pestilus com 8 especiais cada + versões EX (lança EX congela, espinhos/armadilha/nuvens EX mais largas, seringa/nuvem EX com mais veneno, corvos EX em três pontos). Testes: 7 novos. 8 especiais por personagem (48) + potencializados, especial simplificado (ESP). **v0.3, mecânicas novas genéricas:** agarrão de comando (imbloqueável, sem escape, só no chão), superarmadura (absorve 1 golpe com 80% do dano), terremoto (onda baixa no chão: pular escapa), corte projétil, salto esmagador por cima, contra-ataque e versão EX definidos por golpe (`counterMove`/`exMove`). Testes: 8 novos | — |
| CP06 | Sangue e ferimentos | ✅ | Partículas com pool, poças persistentes, 3 níveis de dano visual, opções de sangue; v0.2: coto com brilho e rastro na decapitação | Medir memória em sessões longas em aparelhos reais |
| CP07 | Fatalidades | ✅ (4 por personagem, 24 no total) | **v0.4:** Nymera — Estilhaços Humanos (GDD §9.1: congela e despedaça), Frio Absoluto (GDD), Coração de Gelo*, Prisão Cristalina*; Pestilus — Decomposição (GDD), Último Experimento (GDD), Enxame Faminto*, Dissecação*; testes: as 8 por comando completo e por ESP + direção; QA: as 8 por teclado real. **v0.3:** Kazuro — Mil Cortes (GDD §9.1: cortes espectrais, guarda a espada, fragmentação), Último Suspiro (GDD), Corte Fantasma*, Possessão Oni*; Brakkor — Devorador de Almas (GDD), Fornalha Infernal (GDD), Esmagamento Sísmico*, Rasgo Duplo*; todas com câmera cinematográfica; testes: as 8 por comando completo e por ESP + direção; QA: as 8 por teclado real. v0.1: Execução Real, Machado da Condenação, Explosão Carmesim, Ritual Proibido. **v0.2:** Correntes do Suplício*, Ruptura Infernal*, Beijo da Morte*, Chuva de Lanças Final*; ESP + direção escolhe a Sentença no toque. Testes: as 8 por comando e distância, ESP + direção; QA: as 8 por teclado real | Finalizações instantâneas e fatalidades de arena (ambientais) adiadas; desmembramento ainda usa partes do placeholder |
| CP08 | Supergolpes e transformações | ✅ | **v0.4:** Nymera — Inverno Eterno*, Túmulo de Gelo*, transformação Coroa Glacial*; Pestilus — Pandemia*, Praga Negra*, transformação Peste Encarnada*; testes de cinemática/dano/controle; QA: os 4 por teclado. **v0.3:** Kazuro — Tempestade de Lâminas*, Despertar do Oni*, transformação Oni Desperto*; Brakkor — Apocalipse Ígneo*, Banquete do Devorador* (agarrão imbloqueável que cura), transformação Devorador Ancestral*; testes de dano/cinemática/controle; QA: os 4 por teclado. Supergolpe 1 (Execução Carmesim; Eclipse Sangrento*) e **supergolpe 2** (Tribunal dos Condenados — nome do GDD; Sabá Sangrento* — golpe baixo) com cinemáticas; ↓+U+I ou ESP+↗; Fúria 10 s (+20% dano, chamas no machado de Varkhan = "Carrasco do Inferno"); quebra de combo. Testes: 2º super custa 2 barras e devolve o controle; Sabá é baixo (bloqueio agachado segura); QA: os 2 novos supers por teclado | — |
| CP09 | IA e dificuldades | ✅ | **v0.4:** perfis de Nymera (zona com lança/espinhos/armadilha, clone como contra-ataque, garra antiaérea) e Pestilus (bombas/nuvens/ratos de longe, explosão antiaérea); CPU usa o Espírito Ancestral e a Corrente da Forja; **rebalanceamento com 6 lutadores: todos entre 45% e 55% nas dificuldades 2–4** (tabela abaixo); teste exige 25–75% nos 36 confrontos. **v0.3:** perfis por personagem (especiais de perto/longe, contra-ataque e antiaéreo de Kazuro, agarrões de comando de Brakkor contra quem defende). Balanceamento CPU×CPU (`node tools/balance.mjs 30 2`, 360 partidas por dificuldade): ver tabela abaixo; teste exige 25–75% para todos nos 16 confrontos. 5 níveis; v0.2: CPU usa o 2º supergolpe e os elementos da arena quando encurralada; teste: 20 partidas CPU×CPU completas | Ajuste fino de balanceamento |
| CP10 | Arenas interativas | ✅ | **v0.4:** **Templo dos Samurais Mortos** (GDD) — Espírito Ancestral (`↑+O` de costas para o altar: um samurai fantasma atravessa a arena, 1 por lado/round), Estátua do Guardião (derrubar o oponente na borda quebra a estátua: dano extra, 1 por lado), transição Escadaria Ancestral → Cemitério dos Ronins; **Forja Infernal** (GDD) — Corrente da Forja (`↑+O`: balança e chuta o oponente, bloqueável, cai à frente dele), Boca da Fornalha (lava na borda), transição Queda no Cadinho → Coração da Forja. Selecionáveis na escolha de arena e no Arcade; testes: 5 novos; QA: capturas dos elementos e transições + CPU×CPU completas nas duas. **Correção:** a Estátua do Carrasco agora tomba num plano atrás dos lutadores (não atravessa mais quem a derrubou). **v0.3 (correção):** a Estátua do Carrasco agora colide: a simulação usa a mesma curva de queda do render, acerta no instante em que a estátua chega à cabeça do oponente e o empurra para fora da área onde ela repousa (derrubado ou defendendo); teste + QA. **v0.2:** Corrente do Muro (salto por cima do oponente, Coliseu/Fosso), Estátua do Carrasco (tomba: 90 de dano, golpe alto, 1 por lado/round, Catedral/Cripta), Poço de Lava / Braseiro Profano (+50 em derrubada na borda, com recarga), **transições** Portão do Fosso (→ Fosso do Coliseu) e Queda na Cripta (→ Cripta Profana) com +70 de dano, escurecimento e câmera; opção para desligar (competitivo). Regras na simulação (`src/combat/arena.js`), não na renderização. Testes: 6 novos (transição única, lava, desligado, salto, estátua alto/bloqueável, determinismo); QA: estátua, salto, as 2 transições e a opção desligada por teclado real | Fatalidades de arena (ambientais) adiadas; mais transições por arena |
| CP11 | Menu, HUD e opções | ✅ | **v0.4:** **remapeamento do Jogador 2 (teclado) e do gamepad (J1 e J2)** em Opções (abas Teclado J1/J2, Gamepad J1/J2; troca automática entre ações; tecla do outro jogador recusada; salvo em localStorage; controles na lista de golpes mostram os mapas atuais); **correção: a dica do HUD do J2 usa a tecla remapeada** (antes Num6 fixo); seleção com 6 cartões em 3 colunas; lista de golpes com 6 abas. **v0.3:** seleção com 4 cartões (grade 4/2 colunas), abas da lista de golpes geradas para os 4 lutadores, **lista de golpes, combos, Sentenças, controles e dica do HUD mostram as teclas remapeadas** (correção v0.2; QA confere). Menus, seleção, opções, lista de golpes (agora com supergolpe 2, as 4 Sentenças com atalho de toque e as arenas), pausa, resultados, HUD; v0.2: dica "↑ + O · elemento" no HUD, nome do cenário após transição, **remapeamento de teclas do Jogador 1** (troca automática de teclas repetidas, salvo em localStorage), qualidade Automática e "Mostrar qps" | Direções do gamepad não são remapeáveis (analógico/direcional fixos); layout de toque ajustável |
| CP12 | 16 lutadores | 🟡 6/16 | v0.4: **Nymera**, **Pestilus**; v0.3: Kazuro, Brakkor; Varkhan, Lilith | 10 lutadores restantes |
| CP13 | Quatro chefes | ⬜ | — | Fora do escopo |
| CP14 | Campanha | ⬜ | — | Fora do escopo |
| CP15 | Arcade, torres, sobrevivência | 🟡 | **v0.4:** escada de 6 lutas (os 5 outros lutadores nas 4 arenas + Reflexo Sombrio), finais de Nymera e Pestilus*. **v0.3:** escada de 4 lutas (os 3 outros lutadores + Reflexo Sombrio espelhado), finais de Kazuro e Brakkor*. v0.2: Modo Arcade com dificuldade crescente, continuar após derrota e final em texto por personagem*; QA percorre o fluxo pelo menu até o final | Torres, sobrevivência; finais com cinemática/ilustração |
| CP16 | Krypta e progressão | ⬜ | Só opções e teclas são salvas | Save/progressão adiados |
| CP17 | Multiplayer P2P | ⬜ | Simulação determinística por entradas (base para rollback) | Online adiado |
| CP18 | Otimização mobile | 🟡 | Controles de toque; v0.2: qualidade Automática (preset baixo no toque + resolução dinâmica 50–100% + corte de sombras em último caso), luz de clarão persistente, olhos de estátua como sprites, pré-compilação de shaders. Medição headless: ~120–145 chamadas de desenho e 43–65 mil triângulos por quadro em luta | **Desempenho (60 qps estáveis) não medido em GPU nem em aparelho real** — o ambiente de testes não tem GPU |
| CP19 | Balanceamento e testes | 🟡 | v0.4: 73 testes automatizados; v0.3: 58 testes automatizados; v0.2: 45 testes automatizados (`npm test`) + QA de navegador (`tools/qa.mjs`) + verificação do site publicado (`tools/live.mjs`) | Balanceamento com jogadores reais |
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

**Propostas da v0.4 (não constam no GDD; o GDD só dá nomes/títulos, o estilo de combate, as Sentenças "Estilhaços
Humanos", "Frio Absoluto", "Decomposição" e "Último Experimento" e as arenas "Templo dos Samurais Mortos" e "Forja
Infernal" com seus elementos):**
- Nymera — especiais: Lança de Gelo, Deslize Glacial, Espinhos Glaciais, Armadilha de Gelo, Clone Congelado, Garra do
  Inverno, Nevasca, Passo Glacial; supergolpes Inverno Eterno e Túmulo de Gelo; transformação Coroa Glacial; Sentenças
  Coração de Gelo e Prisão Cristalina; agarrão Abraço Glacial; básicos (Corte de Adaga, Estocada Gélida, Chute
  Cristalino, Chute da Nevasca, Adaga Baixa, Pico de Gelo, Rasteira Gélida, Adaga Aérea, Queda Glacial etc.); combos
  Adagas Gêmeas, Cristal Duplo, Estocada e Nevasca, Adagas e Lança, Pico e Garra; final "O Inverno sem Fim".
- Pestilus — especiais: Bomba Tóxica, Bisturi Corrompido, Nuvem Corrosiva, Enxame de Ratos, Seringa Venenosa, Corvos
  da Peste, Explosão Miasmática, Frasco Ácido; supergolpes Pandemia e Praga Negra; transformação Peste Encarnada;
  Sentenças Enxame Faminto e Dissecação; agarrão Injeção Letal; básicos (Golpe de Bengala, Bisturi Largo, Chute Torto,
  Pontapé da Praga, Agulhada, Bico da Peste, Rasteira de Bengala, Bisturi Descendente etc.); combos Receita Dupla,
  Chute e Bisturi, Agulha e Bico, Receita e Seringa, Bengala e Frasco; final "A Cura Definitiva".
- Arenas: Espírito Ancestral, Estátua do Guardião, Escadaria Ancestral, Cemitério dos Ronins (Templo); Corrente da
  Forja, Boca da Fornalha, Queda no Cadinho, Coração da Forja (Forja).
- Arcade: títulos "o pacto de gelo" e "o pacto profano"; escada de 6 lutas.
- Visual: aparência de Nymera e Pestilus (o GDD não descreve).

### Balanceamento CPU × CPU (v0.4, `tools/balance.mjs`, todos os confrontos não espelhados)
**Antes** (início da v0.4, 4 lutadores, 60 partidas por confronto):

| Dificuldade | Varkhan | Lilith | Kazuro | Brakkor |
|---|---|---|---|---|
| 2 | 46,7% | 51,9% | 52,8% | 48,6% |
| 3 | 43,6% | 54,4% | 56,4% | 45,6% |
| 4 | 43,3% | 49,7% | 58,9% | 48,1% |

Com Nymera e Pestilus recém-entrados (100 partidas por confronto, antes do rebalanceamento): dif. 2 — N 56%, P 63%,
K 42%, B 41%; dif. 3 — N 62%, P 63%, B 38%; dif. 4 — N 68%, P 59%, B 37%.

**Depois** (6 lutadores, 150 partidas por confronto = 750 partidas por lutador e dificuldade):

| Dificuldade | Varkhan | Lilith | Kazuro | Brakkor | Nymera | Pestilus |
|---|---|---|---|---|---|---|
| 2 | 50,1% | 54,0% | 48,0% | 48,2% | 46,3% | 53,5% |
| 3 | 53,5% | 53,1% | 45,3% | 46,4% | 50,3% | 51,5% |
| 4 | 49,7% | 54,1% | 49,0% | 45,9% | 55,1% | 46,1% |

Ajustes: Kazuro — soco forte 54→50 e mais lento, invencibilidade da investida menor, andar mais lento, Iaijutsu
85→80→84; Varkhan — soco rápido mais rápido (início 6) e soco forte 80 com alcance maior, andar mais rápido; Brakkor —
alcance do Esmagamento, andar 0,041→0,045, tapa e punho mais rápidos; Lilith — recuo mais lento; Nymera — dano de
lança/espinhos/deslize/pico/agarrão reduzido, soco rápido e forte 1 quadro mais lentos, clone com janela menor e mais
recuperação, congelamentos mais curtos; Pestilus — veneno 4→3 por pulso e durações ~30% menores, nuvem com intervalo
maior, bomba 45→42. Ruído estatístico ~±2,5 pontos; Nymera na dif. 4 fica no limite (55,1%). Ainda é balanceamento
entre CPUs; falta teste com jogadores reais.

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

### QA de navegador v0.4
`tools/qa.mjs` completo (Chromium headless): **91/93** verificações. As 2 falhas e os erros de console vieram de (1) a
expectativa antiga de 4 lutas na escada do Arcade (corrigida para 6) e (2) um bug real: a bomba do Pestilus virava nuvem
reaproveitando o mesmo id de projétil e o render quebrava (`opacity` de undefined). Corrigido (novo id + recriação do
visual quando o tipo muda) e revalidado num subconjunto: bomba→nuvem por teclado, CPU×CPU Pestilus×Nymera no Templo
completa, 0 erros de console. O QA completo não foi rodado de novo após a correção (~22 min).

## Placeholders desta versão
- **Personagens**: modelos procedurais de primitivas Three.js (sem GLB/rig importado), mais detalhados na v0.2.
- **Arenas**: geometria procedural; estátuas, correntes, braseiros, Fosso e Cripta também são placeholders.
- **Áudio**: todo procedural (Web Audio); locutor usa a voz pt-BR do navegador (speechSynthesis), se existir.
- **Texturas**: geradas em canvas.
- **Finais do Arcade**: só texto.
- **v0.4 — Nymera e Pestilus**: modelos procedurais (primitivas) com as mesmas limitações; ratos, corvos, nuvens e
  gelo das cinemáticas também são primitivas; Templo, Cemitério, Forja e Coração da Forja são geometria procedural.
- **v0.3 — Kazuro e Brakkor**: modelos procedurais (primitivas) com as mesmas limitações de Varkhan/Lilith; poses novas
  (katana, iaijutsu, guarda, sopro, investida, salto, comer, guardar a espada, vitória) também são placeholders.

## Escopo adiado (registrado, não cortado em silêncio)
Finalizações instantâneas e fatalidades de arena; online P2P; história, torres e sobrevivência; Krypta/progressão;
layout de toque ajustável; remapeamento das direções do gamepad; capítulos da campanha (03, 06, 08); meta completa de 24 básicos e 12 combos por
personagem; malhas separadas para desmembramento; medição de desempenho em GPU/celulares reais; modelos GLB.

## Problemas conhecidos
- Desempenho só medido em SwiftShader (sem GPU, ~10–30 qps); a meta de 60 qps estáveis não pôde ser comprovada aqui.
- As poses continuam procedurais (interpolação de poses). **v0.3:** a cambalhota da Corrente do Muro acelera/desacelera,
  encolhe no meio e estende para aterrissar; quedas deitam conforme a velocidade e têm quique de impacto — melhor, mas
  ainda não é animação autoral.
- **v0.3 — corrigido:** estátua atravessando o oponente; lista de golpes/dicas com teclas padrão após remapear.
- **v0.4 — corrigido:** a estátua deitada passava por cima de quem a derrubou (agora tomba atrás dos lutadores);
  dica do HUD do J2 com tecla fixa (Num6); cabeça do Brakkor saindo do quadro em planos fechados de cinemáticas
  (a câmera cinemática recua e mira mais alto quando há lutador alto; o QA confere a posição da cabeça na tela).
- Fantasmas, clones e fragmentação usam cópias do modelo placeholder.
- O veneno não mata (para em 1 PV): por design, quem fecha o round é sempre um golpe.
- O gamepad só foi testado com um gamepad simulado no navegador (sem controle físico neste ambiente).
- O locutor depende de vozes pt-BR instaladas no sistema.

## Como reproduzir os testes
```bash
npm install                      # playwright-core (testes de navegador)
npx playwright-core install chromium
npm test                         # 73 testes da simulação
node tools/balance.mjs 150 2     # taxa de vitória CPU×CPU nos 30 confrontos
python3 -m http.server 8090 --bind 127.0.0.1 &
node tools/qa.mjs                # QA headless, prints em /workspace/sanguinarium-shots
node tools/live.mjs              # site publicado (GitHub Pages)
```
