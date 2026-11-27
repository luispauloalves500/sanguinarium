# CHECKPOINTS — SANGUINARIUM v0.1.0 (primeira versão jogável, GDD §23)

Regra do GDD (§21): nada é marcado "Concluído" sem implementação real, testes de regressão **e validação nas
plataformas-alvo**. Esta build foi validada apenas em Chromium headless (SwiftShader, sem GPU) e com testes da
simulação em Node; por isso o status máximo usado aqui é **Implementado (validado em headless)**.

Legenda: ✅ Implementado (validado em headless) · 🟡 Parcial · ⬜ Pendente

| CP | Item | Status | Evidência / testes | Pendências e próxima ação |
|---|---|---|---|---|
| CP01 | Engine e movimentação | ✅ | Simulação determinística a 60 Hz separada da renderização; teste de determinismo; limites da arena e separação máxima; câmera dinâmica | Validar em GPU real |
| CP02 | Dois personagens 3D com rig | 🟡 **PLACEHOLDER** | Varkhan e Lilith montados com primitivas Three.js, hierarquia de ossos procedural, biblioteca de poses (andar, pular, agachar, golpes, reações, tontura, vitória) | Substituir por modelos GLB com rig e animações reais; algumas poses (ajoelhar/estocada) ainda estranhas |
| CP03 | Colisões e dano | ✅ | hitbox/hurtbox/pushbox por quadro; testes: "acerta só nos quadros ativos", alcance, pushbox sem atravessar | — |
| CP04 | Básicos, defesa e combos | ✅ | Socos/chutes leves e fortes (em pé, agachado, aéreo), bloqueio alto/baixo, bloqueio perfeito (5 quadros), agarrão com escape (10 quadros), esquiva, cancelamentos só após contato, escala de dano (mín. 35%), limite de malabarismo 5; testes: combo triplo com escala, cancelamentos acíclicos, limite de juggle | Meta do GDD de 24 golpes básicos / 12 combos por personagem não atingida (hoje ~13 básicos + combos nomeados por personagem) |
| CP05 | Especiais e projéteis | ✅ | 8 especiais por personagem + versões potencializadas (1 barra), especial simplificado (botão ESP); testes: detecção de comandos, EX, choque de projéteis, prisão/puxão, teleporte, limite de regeneração, contra-ataque do Véu | — |
| CP06 | Sangue e ferimentos | ✅ | Partículas instanciadas com pool, poças persistentes no chão, respingos, 3 níveis de dano visual nos modelos, opções de sangue (desligado/normal/extremo) e persistência; QA: >20 manchas após partida real | Medir memória em sessões longas em dispositivos reais |
| CP07 | Fatalidades | ✅ (2 por personagem) | Execução Real, Machado da Condenação, Explosão Carmesim, Ritual Proibido — câmera cinematográfica, validação de comando e distância, janela de 330 quadros, volta à tela de resultado; testes: as 4 fatalidades, recusa fora de alcance, janela expirada; QA: as 4 executadas por teclado real | Fatalidades 3–4 e finalizações instantâneas do GDD adiadas; desmembramento com malhas separadas de verdade (hoje partes do placeholder se desprendem) |
| CP08 | Supergolpes e transformações | 🟡 | 1 supergolpe cinematográfico por personagem (Execução Carmesim; Eclipse Sangrento*), Fúria/transformação 10 s com +20% dano, quebra de combo (2 barras); testes: super, duração da fúria e restauração de estado, breaker | 2º supergolpe por personagem (ex.: "Tribunal dos Condenados") adiado |
| CP09 | IA e dificuldades | ✅ | 5 níveis (Fácil, Normal, Difícil, Pesadelo, Infernal) com reação, bloqueio, combos e anti-aéreo diferentes; IA só lê estado observável; teste: 20 partidas CPU×CPU completas; QA: CPU×CPU nas 2 arenas terminando com fatalidade | Ajuste fino de balanceamento |
| CP10 | Arenas interativas | 🟡 | Coliseu Carmesim (público, poços de lava, lua de sangue) e Catedral Profana (vitrais, altar, velas, estátuas) — ambientação completa | **Adiado:** objetos interativos, transições entre áreas, fatalidades de arena |
| CP11 | Menu, HUD e opções | ✅ | Título, menu, seleção de lutador e arena, opções (volumes, sangue, qualidade, tremor/flash, toque), lista de golpes com dados de quadro, pausa, resultado/revanche, HUD (vida, barra de super 3 níveis, fúria, cronômetro, rounds, combo); texto em pt-BR; QA percorre tudo pelo teclado | Remapeamento de controles (teclado/gamepad) e layout de toque ajustável adiados |
| CP12 | 16 lutadores | ⬜ | — | Fora do escopo da 1ª versão |
| CP13 | Quatro chefes | ⬜ | — | Fora do escopo |
| CP14 | Campanha | ⬜ | — | Fora do escopo |
| CP15 | Arcade, torres, sobrevivência | ⬜ | Existem 1P vs CPU, 2P local e Treinamento | Modos adiados |
| CP16 | Krypta e progressão | ⬜ | Só as opções são salvas (localStorage) | Save/progressão adiados |
| CP17 | Multiplayer P2P | ⬜ | Simulação determinística por entradas, base para rollback | Online adiado |
| CP18 | Otimização mobile | 🟡 | Controles de toque (direcional + 8 botões, multitoque, ESP simplificado), qualidade "baixa" automática no toque; QA em viewport 844×390 com toque | **Desempenho não medido em aparelho real** |
| CP19 | Balanceamento e testes | 🟡 | 32 testes automatizados (`npm test`) + QA de navegador (`tools/qa.mjs`) | Balanceamento com jogadores reais |
| CP20 | Publicação 1.0 | ⬜ | Build estática documentada (zip) | Não publicada (por decisão) |

\* Nomes propostos (não estão no GDD): supergolpe de Lilith "Eclipse Sangrento" e transformação "Rainha do Sangue".

## Placeholders desta versão
- **Personagens**: modelos procedurais de primitivas (sem GLB/rig importado), conforme regra do GDD.
- **Áudio**: todo procedural (Web Audio) — golpes, sangue, música ambiente; locutor usa a voz pt-BR do navegador (speechSynthesis), se existir.
- **Texturas**: geradas em canvas.

## Escopo adiado (registrado, não cortado em silêncio)
2º supergolpe por personagem; fatalidades 3–4 e finalizações instantâneas; arenas interativas/transições (CP10);
online P2P; história, arcade, torres e outros modos; Krypta/progressão/save; remapeamento de controles; layout de
toque ajustável; meta completa de 24 golpes básicos e 12 combos por personagem; malhas separadas para
desmembramento; medição de desempenho em celulares reais.

## Problemas conhecidos
- Algumas poses procedurais ficam estranhas (pernas ao ajoelhar e na estocada); lanças do Ritual Proibido grossas; a cabeça decepada é pouco visível.
- Em ambiente sem GPU (SwiftShader) o jogo roda a ~10–30 qps; a fila de entradas evita perder comandos, mas o desempenho real só foi medido assim.
- O locutor depende de vozes pt-BR instaladas no sistema.

## Como reproduzir os testes
```bash
npm install            # só para os testes de navegador (playwright-core)
npm test               # 32 testes da simulação
python3 -m http.server 8090 &   # em outro terminal
node tools/qa.mjs   # QA headless, prints em /workspace/sanguinarium-shots
```
