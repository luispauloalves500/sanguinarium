     1|# SANGUINARIUM — Pacto de Sangue
     2|
     3|## Game Design Document — Versão 1.0
     4|
     5|**Status:** planejamento inicial | **Gênero:** luta 2.5D | **Público pretendido:** adulto (18+)
     6|
     7|Jogo de luta inspirado em Mortal Kombat, com universo original, fantasia sombria, combates brutais, sangue, poderes sobrenaturais, destruição de cenários e finalizações cinematográficas. Cada lutador tem identidade, história, estilo de combate e finalizações próprias.
     8|
     9|## 1. Informações gerais
    10|
    11|| Característica | Definição |
    12||---|---|
    13|| Nome | Sanguinarium: Pacto de Sangue |
    14|| Gênero | Luta 2.5D |
    15|| Gráficos | Personagens e cenários 3D |
    16|| Temática | Terror, fantasia sombria e artes marciais |
    17|| Classificação pretendida | 18 anos |
    18|| Lutadores iniciais | 16 |
    19|| Chefes | 4 |
    20|| Arenas | 12 |
    21|| Campanha | 16 capítulos |
    22|| Multiplayer | Local e online P2P |
    23|| Plataformas | PC, navegador e celular |
    24|| Tecnologia sugerida | Three.js + GameForge |
    25|
    26|## 2. Direção artística
    27|
    28|- Atmosfera adulta, pesada e cinematográfica; fantasia gótica, horror sobrenatural e tecnologia corrompida.
    29|- Personagens com armaduras, cicatrizes, roupas danificáveis e expressões faciais.
    30|- Sangue acumulado no chão, manchas nos personagens e ferimentos progressivos.
    31|- Iluminação dinâmica, chuva, fogo, fumaça, neblina e partículas.
    32|- Câmeras cinematográficas durante supergolpes e finalizações.
    33|- Objetos parcialmente destrutíveis e cenários com profundidade visual.
    34|- Paleta predominante: preto, vermelho carmesim, aço e dourado envelhecido; cores de poderes distinguem os lutadores.
    35|- Identidade original: não reutilizar personagens, músicas, logotipos ou recursos proprietários de Mortal Kombat.
    36|
    37|## 3. História principal
    38|
    39|A cada mil anos, o Abismo Carmesim se conecta ao mundo dos humanos. Seu imperador, Malakar, organiza o Pacto de Sangue, reunindo guerreiros de diferentes dimensões. O vencedor recebe o direito de realizar um desejo. Entretanto, cada guerreiro derrotado alimenta uma entidade ancestral aprisionada no centro do Abismo.
    40|
    41|Alguns participantes buscam vingança; outros desejam ressuscitar familiares, conquistar poder ou impedir a extinção da humanidade. O verdadeiro objetivo do torneio é despertar Vhol'Kaar, o Deus da Carnificina. A campanha revela progressivamente o ritual e oferece finais diferentes conforme o personagem escolhido.
    42|
    43|## 4. Elenco inicial
    44|
    45|| Lutador | Identidade e estilo | Poderes |
    46||---|---|---|
    47|| Varkhan, o Carrasco | Morto-vivo com machado; controle de média distância | Correntes, ondas de impacto, ataques giratórios, força sobrenatural |
    48|| Lilith, a Bruxa Carmesim | Feiticeira; controle de espaço | Lanças carmesins, teletransporte, clones, regeneração limitada |
    49|| Kazuro, o Samurai Amaldiçoado | Espadachim veloz possuído por entidade demoníaca | Cortes espectrais, contra-ataques, investidas, duplicatas |
    50|| Brakkor, o Devorador | Demônio gigante; agarrões | Fogo infernal, arremessos, terremotos, investidas |
    51|| Nymera, a Rainha Glacial | Assassina; armadilhas e controle | Congelamento, espinhos, armadilhas, clones congelados |
    52|| Pestilus, o Médico da Peste | Alquimista corrompido; dano por área | Veneno, bombas tóxicas, criaturas, nuvens corrosivas |
    53|| RX-99, a Máquina de Extermínio | Experimento militar consciente | Mísseis, laser, punhos hidráulicos, sobrecarga elétrica |
    54|| Fenrakk, a Besta Lunar | Licantropo rápido e agressivo | Garras, mordidas, saltos, transformação lunar |
    55|| Azrael, o Anjo Caído | Guerreiro celestial exilado | Asas cortantes, raios celestiais, ataques aéreos |
    56|| Seraphis, a Imperatriz das Serpentes | Rainha ancestral ressuscitada | Serpentes, areia, veneno, maldições |
    57|| Dullahan, o Cavaleiro Sem Cabeça | Entidade espiritual | Chamas negras, espada espectral, cavalaria fantasma |
    58|| Magnus, o Quebra-Ossos | Humano especialista em combate corporal | Socos, contra-ataques, agarrões, fúria |
    59|| Umbra, a Sombra Viva | Assassina que atravessa sombras | Invisibilidade temporária, clones, portais, lâminas sombrias |
    60|| Ghorum, o Colosso Vulcânico | Gigante de rochas e magma | Armadura rochosa, lava, terremotos, explosões |
    61|| Mordrek, o Pirata dos Mortos | Capitão amaldiçoado | Correntes, pistola espectral, fantasmas, canhões |
    62|| Draven, o Último Vampiro | Imortal que se fortalece durante o combate | Morcegos, absorção de vida, ataques sobrenaturais |
    63|
    64|## 5. Sistema de combate
    65|
    66|### 5.1 Conteúdo por lutador (meta)
    67|
    68|- 24 golpes básicos; 12 combos exclusivos; 8 golpes especiais; 8 versões potencializadas dos especiais.
    69|- 2 supergolpes cinematográficos; 4 fatalidades; 3 finalizações instantâneas; 1 transformação exclusiva.
    70|
    71|### 5.2 Mecânicas
    72|
    73|- Combos terrestres e aéreos, ataques baixos, médios e altos.
    74|- Bloqueio, defesa perfeita, contra-ataque, esquiva e quebra de combos.
    75|- Cancelamento de animações somente em janelas autorizadas; ataques carregados e agarrões direcionais.
    76|- Projéteis com colisão entre si; golpes de recuperação; ataques junto às paredes.
    77|- Transições entre setores de arena, quando permitido pelo modo.
    78|- Hitboxes de ataque, hurtboxes de vulnerabilidade e pushboxes de separação corporal independentes.
    79|- Dados de golpes parametrizados: preparação, atividade, recuperação, dano, alcance, vantagem de frames, custo, reação, cancelamentos e efeitos.
    80|- Redução progressiva do dano de combos, limites de relançamento aéreo e proteção contra sequências infinitas.
    81|
    82|## 6. Sangue e ferimentos
    83|
    84|| Vida restante | Aparência |
    85||---|---|
    86|| 100% | Intacto |
    87|| 75% | Cortes, manchas e arranhões |
    88|| 50% | Roupas rasgadas, hematomas, armaduras danificadas |
    89|| 25% | Sangramento intenso e ferimentos visíveis |
    90|| 0% | Derrotado; possibilidade de finalização no último round |
    91|
    92|Efeitos de desmembramento estilizado nas finalizações, manchas persistentes, marcas de queimaduras e efeitos próprios de gelo, eletricidade, veneno e magia. Usar partículas reutilizáveis, decals e malhas alternativas; evitar simulação de fluidos custosa. Configurar intensidade de sangue, partículas e persistência nas opções. Os efeitos visuais não alteram hitboxes nem o equilíbrio competitivo.
    93|
    94|## 7. Energia, poderes e transformações
    95|
    96|- **Vida:** determina a derrota no round.
    97|- **Energia especial:** três segmentos; permite especiais potencializados, quebra de combos e supergolpes.
    98|- **Fúria Carmesim:** medidor separado que aumenta no combate; ao completar, permite ativar uma transformação temporária exclusiva.
    99|- Transformações alteram aparência e habilidades sem garantir vitória automática. Devem ter duração, recuperação e contrajogo definidos.
   100|- Custos e valores finais serão balanceados em testes.
   101|
   102|## 8. Exemplo de golpes especiais — Varkhan
   103|
   104|| Golpe | Efeito |
   105||---|---|
   106|| Machado do Abismo | Projétil cortante |
   107|| Corrente da Morte | Puxa o adversário |
   108|| Julgamento | Ataque pesado vertical |
   109|| Tormenta de Aço | Ataque giratório |
   110|| Prisão Infernal | Imobilização temporária |
   111|| Passo Fantasma | Investida sobrenatural |
   112|| Ruptura do Solo | Ataque sísmico |
   113|| Ira do Carrasco | Sequência de golpes pesados |
   114|
   115|**Supergolpes:** Tribunal dos Condenados; Execução Carmesim.
   116|
   117|**Transformação:** Carrasco do Inferno, com machado flamejante, novos efeitos e ataques potencializados.
   118|
   119|Os demais personagens seguem a mesma estrutura de conteúdo, com movimentos, propriedades e animações próprias. As listas completas e os dados de frames serão definidos nas fichas individuais antes da implementação de cada lutador.
   120|
   121|## 9. Fatalidades — Sentenças de Sangue
   122|
   123|Ao vencer o último round, o jogador terá uma janela de tempo para executar uma finalização opcional. Meta de quatro fatalidades por personagem, totalizando 64. A tabela apresenta as duas primeiras propostas por personagem; as demais serão desenvolvidas nas respectivas fichas.
   124|
   125|| Personagem | Fatalidade 1 | Fatalidade 2 |
   126||---|---|---|
   127|| Varkhan | Execução Real | Machado da Condenação |
   128|| Lilith | Explosão Carmesim | Ritual Proibido |
   129|| Kazuro | Mil Cortes | Último Suspiro |
   130|| Brakkor | Devorador de Almas | Fornalha Infernal |
   131|| Nymera | Estilhaços Humanos | Frio Absoluto |
   132|| Pestilus | Decomposição | Último Experimento |
   133|| RX-99 | Desmontagem Total | Incineração |
   134|| Fenrakk | Banquete Lunar | Fúria Selvagem |
   135|| Azrael | Julgamento Divino | Asas da Morte |
   136|| Seraphis | Ninho Mortal | Maldição da Areia |
   137|| Dullahan | Colecionador de Cabeças | Cavalgada Final |
   138|| Magnus | Fragmentação | Punho do Carrasco |
   139|| Umbra | Abismo Eterno | Sombras Famintas |
   140|| Ghorum | Erupção Mortal | Esmagamento Vulcânico |
   141|| Mordrek | Tesouro dos Mortos | Canhão Espectral |
   142|| Draven | Banquete Carmesim | Noite Eterna |
   143|
   144|### 9.1 Exemplos cinematográficos
   145|
   146|- **Estilhaços Humanos:** Nymera congela o adversário e o transforma em fragmentos de gelo com uma onda glacial.
   147|- **Explosão Carmesim:** Lilith desencadeia uma explosão de magia carmesim.
   148|- **Mil Cortes:** Kazuro desfere ataques espectrais velozes, guarda a espada e encerra a sequência com efeito de fragmentação.
   149|- **Incineração:** RX-99 ativa o núcleo de energia e dispara um raio devastador.
   150|
   151|### 9.2 Categorias adicionais
   152|
   153|| Tipo | Funcionamento |
   154||---|---|
   155|| Carnificina | Finalização instantânea mediante condição de combate |
   156|| Execução ambiental | Utiliza elementos da arena |
   157|| Humilhação | Finalização cômica e provocativa |
   158|| Metamorfose | Finalização utilizando a forma transformada |
   159|| Sacrifício | Finalização sobrenatural secreta |
   160|| Sentença Suprema | Fatalidade rara desbloqueável |
   161|
   162|### 9.3 Implementação
   163|
   164|Sequências em timelines com pontos de sincronização entre os dois personagens, câmera, áudio, VFX, eventos de visibilidade e pose final. Validar distância, orientação, estado da partida e comando. Se nenhum comando válido for realizado, encerrar a partida normalmente. Oferecer opção para reduzir efeitos visuais e flashes.
   165|
   166|## 10. Arenas
   167|
   168|| Arena | Identidade e interação |
   169||---|---|
   170|| Coliseu Carmesim | Arquibancadas demoníacas, poços de lava |
   171|| Manicômio Abandonado | Equipamentos amaldiçoados e portas destrutíveis |
   172|| Catedral Profana | Estátuas, vitrais, altares ritualísticos |
   173|| Navio dos Condenados | Tempestades, canhões, criaturas marítimas |
   174|| Templo dos Samurais Mortos | Estátuas destrutíveis, espíritos ancestrais |
   175|| Laboratório RX | Máquinas e câmaras experimentais |
   176|| Cemitério Congelado | Nevasca, túmulos, gelo |
   177|| Forja Infernal | Lava, correntes, fornalhas |
   178|| Tumba das Serpentes | Ruínas, areia, estátuas de serpentes |
   179|| Floresta da Lua Sangrenta | Névoa, árvores retorcidas, lua vermelha |
   180|| Castelo dos Imortais | Salões góticos e trono ancestral |
   181|| Trono do Abismo | Arena ritualística e manifestações dimensionais |
   182|
   183|Todas terão elementos interativos. Pelo menos seis terão transições de cenário e fatalidades ambientais. Perigos ambientais podem ser desativados no competitivo. A área jogável deve permanecer claramente legível e não ser obstruída pela decoração.
   184|
   185|## 11. Chefes
   186|
   187|| Chefe | Fases | Características |
   188||---|---:|---|
   189|| Kragoth, General do Abismo | 2 | Quatro braços, ataques simultâneos |
   190|| Necroth, Senhor das Almas | 3 (proposta) | Invoca guerreiros e versões espectrais de poderes |
   191|| Malakar, Imperador Carmesim | 3 | Teletransporte, poderes dimensionais, absorção |
   192|| Vhol'Kaar, Deus da Carnificina | 4 | Chefe secreto, transformação e alterações na arena |
   193|
   194|Cada fase possui padrões de ataque, sinais de antecipação e janelas de punição. Total planejado: 12 fases. Chefes não precisam seguir as mesmas regras de balanceamento dos lutadores competitivos e não serão habilitados no ranqueado sem versão balanceada.
   195|
   196|## 12. Campanha principal
   197|
   198|| Capítulo | Nome | Objetivo narrativo |
   199||---|---|---|
   200|| 01 | O Convite Amaldiçoado | Apresentar o protagonista e o torneio |
   201|| 02 | O Primeiro Sangue | Primeiros desafios e rivalidades |
   202|| 03 | A Maldição do Samurai | Revelar a entidade de Kazuro |
   203|| 04 | A Floresta das Bestas | Confrontar Fenrakk |
   204|| 05 | O Experimento RX | Descobrir o laboratório |
   205|| 06 | A Rainha do Gelo | Enfrentar Nymera |
   206|| 07 | A Catedral Profana | Investigar o ritual |
   207|| 08 | O Médico da Peste | Confrontar Pestilus |
   208|| 09 | A Tripulação dos Mortos | Atravessar o domínio de Mordrek |
   209|| 10 | A Guerra dos Demônios | Aumentar as consequências do torneio |
   210|| 11 | O General do Abismo | Derrotar Kragoth |
   211|| 12 | O Exército das Almas | Confrontar Necroth |
   212|| 13 | A Queda dos Imortais | Resolver rivalidades sobrenaturais |
   213|| 14 | O Despertar Carmesim | Descobrir o verdadeiro objetivo de Malakar |
   214|| 15 | O Imperador | Derrotar Malakar |
   215|| 16 | O Deus da Carnificina | Desfecho secreto e consequências finais |
   216|
   217|Cutscenes com modelos 3D, diálogos antes das lutas, escolhas narrativas, checkpoints entre combates e finais alternativos. O capítulo secreto pode ser condicionado às decisões do jogador. Permitir repetir capítulos concluídos e pular cutscenes.
   218|
   219|## 13. Modos de jogo
   220|
   221|| Modo | Descrição |
   222||---|---|
   223|| História | Campanha cinematográfica |
   224|| Arcade | Sequência de adversários e final individual |
   225|| Versus | Dois jogadores locais |
   226|| Online | Combates P2P |
   227|| Sobrevivência | Adversários consecutivos |
   228|| Torres do Abismo | Desafios com modificadores |
   229|| Treinamento | Testes de golpes e combos |
   230|| Escola de Combate | Tutoriais interativos |
   231|| Torneio | Chaves de 8 ou 16 lutadores |
   232|| Duplas | Combate com troca de personagens |
   233|| Chefes | Enfrentamento dos quatro chefes |
   234|| Carnificina | Modo casual com efeitos intensificados |
   235|| Galeria | Personagens e finalizações desbloqueados |
   236|| Krypta | Exploração e desbloqueáveis |
   237|
   238|## 14. HUD de combate
   239|
   240|- Parte superior: nomes, retratos, barras de vida, rounds vencidos, cronômetro central.
   241|- Parte inferior: três segmentos de energia especial para cada jogador e medidor de Fúria Carmesim.
   242|- Área lateral: contador de golpes, percentual de dano e efeitos temporários.
   243|- Avisos de início/fim do round, contra-ataque, defesa perfeita e janela de finalização.
   244|- Interface responsiva, legível em celulares e sem obstruir os lutadores.
   245|
   246|## 15. Controles
   247|
   248|| Tecla PC (padrão) | Ação |
   249||---|---|
   250|| WASD | Movimentação |
   251|| J | Soco rápido |
   252|| K | Soco forte |
   253|| U | Chute rápido |
   254|| I | Chute forte |
   255|| L | Bloqueio |
   256|| O | Agarrão |
   257|| Espaço | Esquiva |
   258|| J + K | Especial potencializado (com comando válido) |
   259|| U + I | Supergolpe |
   260|| Esc | Pausa |
   261|
   262|Mobile: direcional virtual, quatro botões de ataque, defesa, agarrão e especial. Posição, tamanho, transparência e sensibilidade ajustáveis. Suporte a multitoque e gamepads, remapeamento de controles e comandos simplificados opcionais. Comandos direcionais se invertem ao trocar de lado.
   263|
   264|## 16. Inteligência artificial
   265|
   266|| Dificuldade | Comportamento |
   267||---|---|
   268|| Fácil | Ataques simples, reações lentas |
   269|| Normal | Combos e defesas moderadas |
   270|| Difícil | Contra-ataques e combos avançados |
   271|| Pesadelo | Pressão e adaptação |
   272|| Infernal | Domínio das mecânicas |
   273|
   274|Cada lutador possui perfil de IA próprio, com prioridades de distância, defesa, pressão e uso de energia. Evitar leitura direta dos comandos do jogador ou vantagens injustas; utilizar estados observáveis, tempo de reação e margem de erro.
   275|
   276|## 17. Menu principal e opções
   277|
   278|Continuar História, Nova Campanha, Arcade, Multiplayer, Torres do Abismo, Treinamento, Krypta, demais modos, Opções e Créditos.
   279|
   280|- Áudio: volume geral, música, efeitos e voz.
   281|- Gráficos: resolução, sombras, texturas, efeitos, partículas, sangue e limite de FPS.
   282|- Controles: remapeamento, gamepad, layout mobile.
   283|- Acessibilidade: legendas, redução de tremor, flashes e violência visual.
   284|- Idioma, dificuldade, câmera e desempenho.
   285|- Menu de pausa com continuar, reiniciar, lista de golpes, opções e sair.
   286|
   287|## 18. Progressão e desbloqueáveis
   288|
   289|Fragmentos de Alma são obtidos por vitórias e desafios. Permitem desbloquear roupas, armas cosméticas, provocações, poses de vitória, fatalidades secretas, arenas alternativas, personagens ocultos e ilustrações.
   290|
   291|A Krypta será um ambiente 3D explorável com baús, passagens secretas, quebra-cabeças e recompensas. Nenhuma melhoria permanente concede vantagem injusta no competitivo. O progresso deve ser salvo e recuperado após fechar o navegador.
   292|
   293|## 19. Multiplayer P2P
   294|
   295|WebRTC com sinalização e suporte a TURN quando necessário. Arquitetura de rollback netcode, sincronização por frames, previsão de comandos, snapshots da simulação e verificação de divergências. Salas privadas, códigos de convite, revanche e tratamento de desconexões.
   296|
   297|A simulação de combate deve ser determinística e independente da renderização. Evitar aleatoriedade não sincronizada. Reexecutar frames sem duplicar efeitos de áudio e partículas. GitHub Pages pode hospedar o cliente estático, mas sinalização e TURN precisam de infraestrutura separada. Ranqueamento confiável e mitigação de trapaças exigem serviços adicionais; P2P sozinho não é suficiente.
   298|
   299|## 20. Desenvolvimento técnico
   300|
   301|Tecnologia proposta: Three.js e GameForge, com personagens GLB animados e arquitetura modular. Verificar os recursos efetivamente disponíveis no GameForge antes de escolher módulos para reaproveitamento.
   302|
   303|```text
   304|Sanguinarium/
   305|├── index.html
   306|├── assets/
   307|│   ├── characters/
   308|│   ├── animations/
   309|│   ├── arenas/
   310|│   ├── textures/
   311|│   ├── fatalities/
   312|│   ├── sounds/
   313|│   └── music/
   314|├── src/
   315|│   ├── core/
   316|│   ├── combat/
   317|│   ├── hitboxes/
   318|│   ├── characters/
   319|│   ├── animation/
   320|│   ├── blood/
   321|│   ├── fatalities/
   322|│   ├── physics/
   323|│   ├── ai/
   324|│   ├── multiplayer/
   325|│   ├── campaign/
   326|│   ├── camera/
   327|│   ├── audio/
   328|│   ├── save/
   329|│   └── ui/
   330|├── tests/
   331|├── GDD.md
   332|└── CHECKPOINTS.md
   333|```
   334|
   335|| Sistema | Implementação proposta |
   336||---|---|
   337|| Combate | Simulação fixa de 60 Hz, renderização independente |
   338|| Colisões | Hitboxes, hurtboxes, pushboxes |
   339|| Personagens | GLB com rig completo e animações |
   340|| Animações | Máquina de estados, transições, eventos por frame |
   341|| Fatalidades | Timelines sincronizadas de animação e câmera |
   342|| Sangue | Pools de partículas e decals |
   343|| Texturas | WebP e KTX2 conforme compatibilidade |
   344|| Desempenho | LOD, instancing, qualidade adaptativa |
   345|| Carregamento | Assets sob demanda, cache e descarte de recursos |
   346|| Save | IndexedDB versionado, migrações e recuperação de falhas |
   347|| Publicação | GitHub Pages para o cliente |
   348|
   349|### 20.1 Metas de desempenho
   350|
   351|| Plataforma | Objetivo |
   352||---|---|
   353|| PC intermediário | 60 FPS |
   354|| Celular intermediário | 30–60 FPS |
   355|| Celular potente | 60 FPS |
   356|| Modelos dos lutadores | 2–8 MB por personagem como meta |
   357|| Carregamento | Apenas os lutadores e a arena selecionados |
   358|
   359|Reduzir sombras, partículas, resolução e pós-processamento no mobile sem alterar a simulação. Medir tempos de frame, memória, tamanho de assets e carregamento em aparelhos reais. Não tratar metas como resultados comprovados.
   360|
   361|## 21. Checkpoints de desenvolvimento
   362|
   363|| ID | Entrega | Critério de aceite |
   364||---|---|---|
   365|| CP01 | Fundação da engine e movimentação | Loop fixo, câmera, limites e controles funcionando |
   366|| CP02 | Dois personagens 3D com rig | Varkhan e Lilith com animações de locomoção, luta e reação |
   367|| CP03 | Colisões e dano | Sem atravessamento, golpes acertam somente nas janelas válidas |
   368|| CP04 | Golpes básicos, defesa e combos | Combos reproduzíveis, sem loops infinitos conhecidos |
   369|| CP05 | Especiais e projéteis | Comandos, custos e colisões testados |
   370|| CP06 | Sangue e ferimentos | Efeitos graduais e configurações sem vazamento de recursos |
   371|| CP07 | Fatalidades | Animação sincronizada, validação do comando e retorno ao menu |
   372|| CP08 | Supergolpes e transformações | Medidores, duração e estados restaurados corretamente |
   373|| CP09 | IA e dificuldades | Cinco níveis e comportamento diferenciado |
   374|| CP10 | Arenas interativas | Interações, colisões e transições sem travamentos |
   375|| CP11 | Menu, HUD e opções | Todas as opções acessíveis no PC e celular |
   376|| CP12 | Expansão para 16 lutadores | Fichas, animações, golpes e finalizações validados |
   377|| CP13 | Quatro chefes | Fases e padrões com janelas de reação |
   378|| CP14 | Campanha | 16 capítulos, cutscenes, checkpoints e finais |
   379|| CP15 | Arcade, torres e sobrevivência | Fluxo de início, derrota, vitória e recompensa completo |
   380|| CP16 | Krypta e progressão | Recompensas persistentes e save restaurável |
   381|| CP17 | Multiplayer P2P | Testes de rollback, latência, divergência e desconexão |
   382|| CP18 | Otimização mobile | Controles e desempenho medidos em dispositivos reais |
   383|| CP19 | Balanceamento e testes | Regressões, partidas completas e ajustes de equilíbrio |
   384|| CP20 | Publicação 1.0 | Build estável e documentado, publicado após validação |
   385|
   386|Todos os checkpoints começam pendentes. Só marcar concluído mediante implementação real, testes de regressão e validação nas plataformas-alvo. Registrar evidências, problemas conhecidos e próxima ação.
   387|
   388|## 22. Escopo final planejado
   389|
   390|| Conteúdo | Meta |
   391||---|---:|
   392|| Lutadores | 16 |
   393|| Chefes | 4 |
   394|| Arenas | 12 |
   395|| Golpes básicos | 384 |
   396|| Golpes especiais | 128 |
   397|| Especiais potencializados | 128 |
   398|| Combos | 192 |
   399|| Fatalidades | 64 |
   400|| Carnificinas | 48 |
   401|| Supergolpes | 32 |
   402|| Transformações | 16 |
   403|| Capítulos | 16 |
   404|| Modos | 14 |
   405|| Fases de chefes | 12 |
   406|
   407|## 23. Diferenciais e estratégia de produção
   408|
   409|Identidade própria baseada em transformações exclusivas, ferimentos progressivos, quatro fatalidades por lutador, chefes com múltiplas fases, arenas interativas, campanha de terror sobrenatural, Krypta e compatibilidade com navegadores e celulares.
   410|
   411|**Primeira versão jogável:** Varkhan e Lilith, Coliseu Carmesim e Catedral Profana, com combate completo, controles desktop/mobile, sangue, menu, HUD, IA inicial e finalizações. Consolidar a qualidade de animações, colisões, impacto e resposta dos comandos antes de ampliar o elenco.
   412|
   413|### Diretrizes para implementação com IA / GameForge
   414|
   415|1. Ler este GDD e inspecionar a estrutura e as capacidades existentes da engine.
   416|2. Criar CHECKPOINTS.md com status, testes e pendências; implementar um checkpoint de cada vez.
   417|3. Não substituir personagens finais por formas geométricas sem registrar que são placeholders; não reduzir escopo já aprovado silenciosamente.
   418|4. Separar dados de golpes, simulação, renderização, áudio, animação e interface.
   419|5. Validar cada alteração com partida real e testes automatizados quando possível; não declarar sucesso sem evidência.
   420|6. Preservar sistemas existentes, revisar regressões e publicar apenas quando autorizado e validado.
   421|
   422|---
   423|
   424|**Nota de escopo:** Este arquivo registra o planejamento do jogo, não uma implementação. Os números são metas; as fichas completas de golpes, comandos e finalizações ainda precisam ser detalhadas. As imagens conceituais e os mockups da apresentação em chat não estão incorporados ao Markdown.
   425|