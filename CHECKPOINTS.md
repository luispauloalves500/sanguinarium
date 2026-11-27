# CHECKPOINTS — SANGUINARIUM v0.2.0

Regra do GDD (§21): nada é marcado "Concluído" sem implementação real, testes de regressão **e validação nas
plataformas-alvo**. Esta build foi validada em Chromium headless (SwiftShader, sem GPU), no site publicado
(GitHub Pages, também em headless) e com testes da simulação em Node; por isso o status máximo usado aqui é
**Implementado (validado em headless)**. Nenhum item está "Concluído".

Legenda: ✅ Implementado (validado em headless) · 🟡 Parcial · ⬜ Pendente

| CP | Item | Status | Evidência / testes | Pendências e próxima ação |
|---|---|---|---|---|
| CP01 | Engine e movimentação | ✅ | Simulação determinística a 60 Hz separada da renderização; testes de determinismo (inclusive com arenas interativas e transição); limites da arena e separação máxima; câmera dinâmica | Validar em GPU real |
| CP02 | Dois personagens 3D com rig | 🟡 **PLACEHOLDER** | v0.2: Varkhan (placa peitoral com caveira, correntes, ombreiras com espetos, capa rasgada com molas, machado em crescente com chamas na Fúria) e Lilith (corpete dourado, saia em painéis presos à pelve que seguem as coxas, mangas de sino, garras, cabelo com molas, orbes de sangue). IK de perna com pés plantados e tornozelos planos; molas secundárias. Conferido com `tools/poseshot.mjs` (agachar, ajoelhar, estocada) | Substituir por modelos GLB com rig e animações reais; mistura de animação ainda é interpolação de poses (sem curvas/keyframes autorais) |
| CP03 | Colisões e dano | ✅ | hitbox/hurtbox/pushbox por quadro; testes de quadros ativos, alcance, pushbox | — |
| CP04 | Básicos, defesa e combos | ✅ | Leves/fortes (em pé, agachado, aéreo), bloqueio alto/baixo, bloqueio perfeito, agarrão com escape, esquiva, cancelamentos, escala de dano, limite de malabarismo | Meta do GDD de 24 básicos / 12 combos por personagem não atingida |
| CP05 | Especiais e projéteis | ✅ | 8 especiais por personagem + potencializados, especial simplificado (ESP) | — |
| CP06 | Sangue e ferimentos | ✅ | Partículas com pool, poças persistentes, 3 níveis de dano visual, opções de sangue; v0.2: coto com brilho e rastro na decapitação | Medir memória em sessões longas em aparelhos reais |
| CP07 | Fatalidades | ✅ (4 por personagem) | v0.1: Execução Real, Machado da Condenação, Explosão Carmesim, Ritual Proibido. **v0.2:** Correntes do Suplício*, Ruptura Infernal*, Beijo da Morte*, Chuva de Lanças Final*; ESP + direção escolhe a Sentença no toque. Testes: as 8 por comando e distância, ESP + direção; QA: as 8 por teclado real | Finalizações instantâneas e fatalidades de arena (ambientais) adiadas; desmembramento ainda usa partes do placeholder |
| CP08 | Supergolpes e transformações | ✅ | Supergolpe 1 (Execução Carmesim; Eclipse Sangrento*) e **supergolpe 2** (Tribunal dos Condenados — nome do GDD; Sabá Sangrento* — golpe baixo) com cinemáticas; ↓+U+I ou ESP+↗; Fúria 10 s (+20% dano, chamas no machado de Varkhan = "Carrasco do Inferno"); quebra de combo. Testes: 2º super custa 2 barras e devolve o controle; Sabá é baixo (bloqueio agachado segura); QA: os 2 novos supers por teclado | — |
| CP09 | IA e dificuldades | ✅ | 5 níveis; v0.2: CPU usa o 2º supergolpe e os elementos da arena quando encurralada; teste: 20 partidas CPU×CPU completas | Ajuste fino de balanceamento |
| CP10 | Arenas interativas | ✅ | **v0.2:** Corrente do Muro (salto por cima do oponente, Coliseu/Fosso), Estátua do Carrasco (tomba: 90 de dano, golpe alto, 1 por lado/round, Catedral/Cripta), Poço de Lava / Braseiro Profano (+50 em derrubada na borda, com recarga), **transições** Portão do Fosso (→ Fosso do Coliseu) e Queda na Cripta (→ Cripta Profana) com +70 de dano, escurecimento e câmera; opção para desligar (competitivo). Regras na simulação (`src/combat/arena.js`), não na renderização. Testes: 6 novos (transição única, lava, desligado, salto, estátua alto/bloqueável, determinismo); QA: estátua, salto, as 2 transições e a opção desligada por teclado real | Fatalidades de arena (ambientais) adiadas; mais transições por arena |
| CP11 | Menu, HUD e opções | ✅ | Menus, seleção, opções, lista de golpes (agora com supergolpe 2, as 4 Sentenças com atalho de toque e as arenas), pausa, resultados, HUD; v0.2: dica "↑ + O · elemento" no HUD, nome do cenário após transição, **remapeamento de teclas do Jogador 1** (troca automática de teclas repetidas, salvo em localStorage), qualidade Automática e "Mostrar qps" | Remapeamento do Jogador 2 e do gamepad; layout de toque ajustável; a lista de golpes mostra as teclas padrão, não as remapeadas |
| CP12 | 16 lutadores | ⬜ | — | Fora do escopo |
| CP13 | Quatro chefes | ⬜ | — | Fora do escopo |
| CP14 | Campanha | ⬜ | — | Fora do escopo |
| CP15 | Arcade, torres, sobrevivência | 🟡 | **v0.2: Modo Arcade** — escada de 3 lutas (rival, Reflexo Sombrio espelhado, rival final) com dificuldade crescente, continuar após derrota e final em texto por personagem*; QA percorre o fluxo pelo menu até o final | Torres, sobrevivência; finais com cinemática/ilustração |
| CP16 | Krypta e progressão | ⬜ | Só opções e teclas são salvas | Save/progressão adiados |
| CP17 | Multiplayer P2P | ⬜ | Simulação determinística por entradas (base para rollback) | Online adiado |
| CP18 | Otimização mobile | 🟡 | Controles de toque; v0.2: qualidade Automática (preset baixo no toque + resolução dinâmica 50–100% + corte de sombras em último caso), luz de clarão persistente, olhos de estátua como sprites, pré-compilação de shaders. Medição headless: ~120–145 chamadas de desenho e 43–65 mil triângulos por quadro em luta | **Desempenho (60 qps estáveis) não medido em GPU nem em aparelho real** — o ambiente de testes não tem GPU |
| CP19 | Balanceamento e testes | 🟡 | 45 testes automatizados (`npm test`) + QA de navegador (`tools/qa.mjs`) + verificação do site publicado (`tools/live.mjs`) | Balanceamento com jogadores reais |
| CP20 | Publicação | 🟡 | Repositório público + **GitHub Pages ativo** (https://luispauloalves500.github.io/sanguinarium/) + zip estático | Validação em aparelhos reais antes da 1.0 |

\* **Propostas desta build (não constam no GDD):** supergolpe de Lilith "Eclipse Sangrento" e "Sabá Sangrento";
transformação "Rainha do Sangue"; Sentenças 3 e 4 (Correntes do Suplício, Ruptura Infernal, Beijo da Morte, Chuva de
Lanças Final); nomes e textos de final do Arcade; nomes dos elementos de arena e dos cenários de transição.
Todas podem ser renomeadas/substituídas pelo autor do GDD.

## Placeholders desta versão
- **Personagens**: modelos procedurais de primitivas Three.js (sem GLB/rig importado), mais detalhados na v0.2.
- **Arenas**: geometria procedural; estátuas, correntes, braseiros, Fosso e Cripta também são placeholders.
- **Áudio**: todo procedural (Web Audio); locutor usa a voz pt-BR do navegador (speechSynthesis), se existir.
- **Texturas**: geradas em canvas.
- **Finais do Arcade**: só texto.

## Escopo adiado (registrado, não cortado em silêncio)
Finalizações instantâneas e fatalidades de arena; online P2P; história, torres e sobrevivência; Krypta/progressão;
remapeamento do Jogador 2/gamepad e layout de toque ajustável; meta completa de 24 básicos e 12 combos por
personagem; malhas separadas para desmembramento; medição de desempenho em GPU/celulares reais; modelos GLB.

## Problemas conhecidos
- Desempenho só medido em SwiftShader (sem GPU, ~10–30 qps); a meta de 60 qps estáveis não pôde ser comprovada aqui.
- As poses continuam procedurais: transições entre golpes são interpolação simples e alguns quadros extremos
  (cambalhota da Corrente do Muro, quedas) ainda parecem rígidos.
- A estátua do Carrasco atravessa o oponente enquanto tomba (o dano é aplicado, mas não há colisão física).
- A lista de golpes e as dicas mostram as teclas padrão mesmo depois de remapear.
- O locutor depende de vozes pt-BR instaladas no sistema.

## Como reproduzir os testes
```bash
npm install                      # playwright-core (testes de navegador)
npx playwright-core install chromium
npm test                         # 45 testes da simulação
python3 -m http.server 8090 --bind 127.0.0.1 &
node tools/qa.mjs                # QA headless, prints em /workspace/sanguinarium-shots
node tools/live.mjs              # site publicado (GitHub Pages)
```
