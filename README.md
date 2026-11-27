# SANGUINARIUM — Pacto de Sangue (v0.2.0)

Jogo de luta 2.5D de fantasia sombria (18+) feito com **Three.js** (incluído em `vendor/`, funciona offline).
Conteúdo: **Varkhan, o Carrasco** e **Lilith, a Bruxa Carmesim**; arenas **Coliseu Carmesim** e **Catedral Profana**,
cada uma com elementos interativos e uma transição para um segundo cenário (**Fosso do Coliseu** / **Cripta Profana**);
Modo Arcade (escada de 3 lutas com final por personagem), 1 jogador vs CPU (5 dificuldades), 2 jogadores locais,
treinamento, controles de toque e gamepad, remapeamento de teclas, sangue com poças persistentes, ferimentos
progressivos, **8 Sentenças de Sangue** (4 por personagem) e **2 supergolpes por personagem**.

**Jogue no navegador:** https://luispauloalves500.github.io/sanguinarium/

> Os lutadores continuam sendo **placeholders** montados com primitivas 3D (ver `CHECKPOINTS.md`).

## Novidades da v0.2.0
- **Correções:** pernas ao ajoelhar/agachar/estocada (IK de duas articulações com pés plantados e planos), lanças do
  Ritual Proibido finas com ponta farpada, cabeça decepada legível (coto, brilho, rastro de sangue e câmera que a segue).
- **Desempenho:** qualidade **Automática** (padrão) com resolução dinâmica (baixa quando cai de ~52 qps; desliga sombras
  só em último caso), preset baixo automático no celular, luz de clarão reutilizada (sem recompilar shaders no meio
  da luta), pré-compilação de shaders, opção “Mostrar qps”.
- **Visual:** Varkhan com placa peitoral com caveira, correntes penduradas, ombreiras com espetos, capa rasgada com
  física de mola e machado maior em crescente (chamas na Fúria); Lilith com corpete dourado, saia em painéis que seguem
  as pernas, mangas de sino, garras, cabelo com mola e orbes de sangue orbitando. Animações com molas secundárias.
- **Conteúdo:** Sentenças 3 e 4 por personagem; 2º supergolpe por personagem (Tribunal dos Condenados; Sabá Sangrento);
  arenas interativas e transições; Modo Arcade; remapeamento de teclas do Jogador 1.

## Como rodar

O jogo é uma pasta estática. Abra um servidor na pasta (módulos ES não funcionam via `file://`):

```bash
python3 -m http.server 8080      # depois abra http://localhost:8080
# ou
npx serve .
```

No celular, use o link do GitHub Pages acima ou o endereço da rede local (`http://IP-do-PC:8080`), em paisagem.

## Controles (padrão; o Jogador 1 pode remapear em Opções)

| Ação | Jogador 1 | Jogador 2 | Toque |
|---|---|---|---|
| Movimento | W A S D (setas no modo 1P) | Setas | Direcional virtual |
| Soco rápido / forte | J / K | Num1 / Num2 (Insert / Home) | SR / SF |
| Chute rápido / forte | U / I | Num4 / Num5 (Delete / End) | CR / CF |
| Bloqueio (segurar; agachado bloqueia baixos) | L | Num3 (PageDown) | DEF |
| Agarrão (e escapar de agarrão) | O | Num6 (PageUp) | AGR |
| Esquiva | Espaço | Num0 (Shift direito) | ESQ |
| Especial simplificado (+ direção) | P | Num+ (Enter) | ESP |
| Especial potencializado (1 barra) | comando + J+K | | |
| Supergolpe 1 (2 barras) | U + I | | ESP + ↑ |
| **Supergolpe 2 (2 barras)** | **↓ + U + I** | | **ESP + ↗** |
| **Elemento da arena** | **↑ + O** perto da borda, de costas para ela | | ↑ + AGR |
| Transformação (Fúria cheia) | L + O | | |
| Quebra de combo (2 barras) | Espaço + L durante o combo sofrido | | |
| Pausa | Esc | | botão II |

Comandos de especiais (relativos ao lado do lutador): `↓→`, `↓←`, `←→`, `↓↓` + Soco/Chute. A lista completa
(dano, início, vantagem no bloqueio, supergolpes, combos, fatalidades e arenas) está no menu **Lista de Golpes**.

### Supergolpes
| Personagem | Supergolpe 1 (U + I) | Supergolpe 2 (↓ + U + I) |
|---|---|---|
| Varkhan | Execução Carmesim | **Tribunal dos Condenados** (médio, alcance longo; carrascos espectrais) |
| Lilith | Eclipse Sangrento | **Sabá Sangrento** (golpe **baixo**: defenda agachado; pentagrama e lanças) |

### Sentenças de Sangue (após “FINALIZE-O!” no último round)
| Personagem | Sentença | Comando | Distância | Toque |
|---|---|---|---|---|
| Varkhan | Execução Real | `↓ → ↓ + K` | perto | ESP |
| Varkhan | Machado da Condenação | `← → ← + I` | longe | ESP + ↓ |
| Varkhan | **Correntes do Suplício** | `→ ← → + J` | média | ESP + → |
| Varkhan | **Ruptura Infernal** | `↓ ↓ ↓ + U` | perto | ESP + ← |
| Lilith | Explosão Carmesim | `↓ → → + K` | média | ESP |
| Lilith | Ritual Proibido | `← ← ↓ + I` | perto | ESP + ↓ |
| Lilith | **Beijo da Morte** | `→ → ↓ + J` | perto | ESP + → |
| Lilith | **Chuva de Lanças Final** | `← ↓ ← + U` | longe | ESP + ← |

### Arenas interativas (desligáveis em Opções → “Perigos e transições de arena”)
- **Corrente do Muro** (Coliseu/Fosso): `↑ + O` de costas para a borda — salta por cima do oponente.
- **Estátua do Carrasco** (Catedral/Cripta): `↑ + O` de costas para a borda — a estátua tomba sobre o oponente
  (90 de dano, golpe alto: bloqueie em pé; uma por lado por round).
- **Poço de Lava / Braseiro Profano**: derrubar o oponente perto da borda causa +50 de dano.
- **Transição**: golpe pesado que derruba (ex.: rasteira `↓ + I`) colado à borda arremessa o oponente para o
  **Fosso do Coliseu** ou a **Cripta Profana** (+70 de dano, uma vez por luta). A luta continua no novo cenário.

### Modo Arcade
Escolha o lutador e enfrente 3 lutas (rival → Reflexo Sombrio → rival final, com dificuldade crescente). Derrota
permite continuar a mesma luta; vencer a última mostra o final do personagem.

## Desenvolvimento

```bash
npm test                 # testes automatizados da simulação (node --test)
node tools/qa.mjs        # QA no Chromium headless (precisa de servidor em http://127.0.0.1:8090)
node tools/live.mjs      # verifica o site publicado (GitHub Pages) sem erros de console
python3 tools/build.py   # gera /workspace/sanguinarium-build.zip
```

Ferramentas de inspeção visual: `tools/poseshot.mjs` (poses), `tools/cineshot.mjs` (cinemáticas),
`tools/arenashot.mjs` (elementos de arena).

Estrutura: `src/combat` (dados de golpes, entrada, simulação determinística 60 Hz, regras de arena em `arena.js`),
`src/hitboxes`, `src/ai`, `src/animation` (poses e máquina de estados), `src/characters` (modelos), `src/render`
(cena/arenas/VFX/desempenho), `src/blood`, `src/fatalities` (timelines), `src/camera`, `src/audio` (Web Audio
procedural), `src/input`, `src/ui`, `src/modes` (Arcade).

## Capturas

Veja `docs/screenshots/` e `docs/qa-report.json`.

![Sentença de Sangue: Correntes do Suplício](docs/screenshots/17-fatalidade-correntes_suplicio.png)
![Transição para o Fosso do Coliseu](docs/screenshots/25-arena-transicao-fosso.png)
