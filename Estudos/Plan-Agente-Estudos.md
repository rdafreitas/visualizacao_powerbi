# Plan: Agente de Estudos — Refatoração Completa (v3)

## TL;DR

Refatorar o agente `study-concurso` mantendo TODA a estrutura existente (Grupos 0–F, skills, scripts, agentes, fases), adicionando: (a) camada de dados intermediária em JSON como fonte da verdade, (b) logging estruturado + modo debug, (c) memória aprimorada com versionamento, (d) versionamento local dos Google Docs, (e) conversão automática de editais, (f) isolamento do subagente, (g) RAG com evolução controlada, (h) desacoplamento dados↔apresentação. Nenhuma funcionalidade removida — apenas refinamento, robustez e rastreabilidade.

---

## Análise do Estado Atual

### O que já existe e funciona:
- **5 skills** (`study-pdf-to-md`, `study-split-md`, `study-formatar-topicos`, `study-relevancia`, `study-anki`)
- **3 scripts Python** (`convert_pdf.py`, `create_gdoc.py`, `send_to_anki.py`)
- **1 agente orquestrador** (`study-concurso.agent.md`)
- **Framework Speckit** instalado (9 agents + 9 prompts para SDD)

### Lacunas identificadas (v2) + novas lacunas (v3):

| # | Lacuna | Impacto | Versão |
|---|--------|---------|--------|
| 1 | Questões não vão para Google Docs | Fluxo incompleto | v2 |
| 2 | Tags 🔥/⚠️/📝 não entram nos Docs | Docs sem classificação | v2 |
| 3 | Relevância só analisa matéria, não questões | Questões sem priorização | v2 |
| 4 | Sem processamento de edital | RAG incompleto | v2 |
| 5 | Sem web search | Probabilidade imprecisa | v2 |
| 6 | Anki não lista decks | Usuário sem opções | v2 |
| 7 | Sem memória persistente | Sessões isoladas | v2 |
| 8 | Sem subagentes | Sem especialização | v2 |
| 9 | **Sem camada de dados intermediária** — skills acoplam transformação com publicação | Impossível reprocessar parcialmente | **v3** |
| 10 | **Sem logging** — decisões do agente não são rastreáveis | Debug e auditoria impossíveis | **v3** |
| 11 | **Sem versionamento local dos Docs** — se Google Docs cai, perde-se tudo | Sem histórico nem rollback | **v3** |
| 12 | **Subagente acoplado a IO** — faz análise E publicação | Difícil testar e isolar | **v3** |
| 13 | **Sem conversão automática de editais** — precisa invocar manualmente | Etapa manual desnecessária | **v3** |

---

## Estrutura de Diretórios do Projeto (v3)

```
Estudos/
├── .github/
│   ├── copilot-instructions.md                    ← NOVO (Step 0A)
│   ├── agents/
│   │   ├── study-concurso.agent.md                ← MODIFICAR (Step 9)
│   │   ├── study-analise.agent.md                 ← NOVO (Step 3)
│   │   └── speckit.*.agent.md                     (existentes, sem alteração)
│   ├── prompts/
│   │   ├── study-concurso.prompt.md               ← NOVO (Step 0D)
│   │   ├── study-analise.prompt.md                ← NOVO (Step 0D)
│   │   └── speckit.*.prompt.md                    (existentes, sem alteração)
│   └── skills/
│       ├── study-pdf-to-md/                       (existente, sem alteração)
│       ├── study-split-md/                        (existente, sem alteração)
│       ├── study-formatar-topicos/                ← MODIFICAR (Steps 6, 6B)
│       ├── study-relevancia/                      ← MODIFICAR (Step 4)
│       ├── study-anki/                            ← MODIFICAR (Steps 7, 8)
│       ├── study-memory/                          ← NOVO (Step 1)
│       ├── study-edital/                          ← NOVO (Step 2)
│       ├── study-questoes-gdoc/                   ← NOVO (Step 5)
│       ├── study-logging/                         ← NOVO (Step 1B)
│       └── study-versionamento/                   ← NOVO (Step 6C)
├── .specify/
│   └── memory/
│       └── constitution.md                        ← MODIFICAR (Step 0B)
├── data/                                          ← NOVO (Step 1A)
│   ├── edital_parsed.json
│   ├── topicos.json
│   ├── questoes.json
│   ├── relevancia_topicos.json
│   └── relevancia_questoes.json
├── logs/                                          ← NOVO (Step 1B)
│   └── execution_log.json
├── input/                                         ← NOVO (Step 2B)
│   └── editais/
├── Histórico Anotações/                           ← NOVO (Step 6C)
│   ├── Resumo/
│   └── Questões/
└── study-memory.json                              ← NOVO (Step 1)
```

---

## Novo Fluxo Proposto (v3)

```
Fase 0 — Setup + Edital + Carregar Memória
  ↓
Fase 1 — PDF → Markdown
  ↓
Fase 2 — Split matéria/questões → persistir JSON intermediário
  ↓
Fase 3 — Matéria → Tópicos → persistir JSON intermediário
  ↓
Fase 4 — Relevância: tópicos + questões (via subagente RAG) → persistir JSON
  ↓
Fase 5 — Tópicos + tags → Google Docs matéria + versionamento local
  ↓
Fase 6 — Questões + tags → Google Docs questões + versionamento local
  ↓
Fase 7 — Anki: listar decks, recomendar, criar cards com tags
  ↓
  [Cada fase: log entrada/saída → salvar progresso na memória]
```

### Princípio Arquitetural v3: Dados → Estruturação → Classificação → Persistência → Publicação

| Camada | Formato | Papel |
|--------|---------|-------|
| **Dados (fonte da verdade)** | `/data/*.json` | Toda transformação salva aqui primeiro |
| **Markdown (versionamento humano)** | `/Histórico Anotações/*.md` | Cópia legível com metadados e tags |
| **Google Docs (apresentação)** | URL remota | Output visual — nunca é a fonte primária |
| **Anki (estudo ativo)** | AnkiConnect | Output de flashcards — consome dados do JSON |

---

## Steps

### **Grupo 0 — Configuração de Projeto e Instruções (primeiro de todos)**

**Step 0A: Criar `.github/copilot-instructions.md`**
- Criar arquivo de instruções globais do Copilot para o workspace
- Conteúdo:
  - **Idioma**: Toda interação em PT-BR (português brasileiro). Código, nomes de variáveis e commits podem ser em inglês, mas comunicação com o usuário SEMPRE em PT-BR.
  - **Contexto do projeto**: Agente de automação de estudos para concursos públicos brasileiros. Pipeline: PDF → Markdown → JSON → Relevância → Google Docs → Anki.
  - **Convenções de código Python**: UTF-8, type hints, docstrings em PT-BR, tratamento de erros com mensagens amigáveis, logging estruturado em toda operação
  - **Skills disponíveis**: Listar as 10 skills study-* e quando cada uma deve ser invocada
  - **Variáveis de ambiente/paths**: Orientar o agente a confirmar caminhos com o usuário, nunca assumir
  - **Regras de segurança**: Nunca sobrescrever arquivos sem confirmação, nunca expor credentials.json, token.json
  - **Regra de memória**: Sempre carregar `study-memory.json` no início e salvar ao final de cada fase
  - **Regra de dados**: JSON em `/data/` é a fonte da verdade; Google Docs e Anki são outputs que consomem esses JSONs
  - **Regra de logging**: Toda fase deve logar entrada, saída e decisões em `/logs/execution_log.json`
  - **Modo debug**: Quando `--debug` é passado, exibir decisões intermediárias, fontes RAG usadas e dados antes de publicar

**Step 0B: Preencher `.specify/memory/constitution.md`**
- Substituir TODOS os tokens placeholder `[ALL_CAPS]` com valores reais:
  - `[PROJECT_NAME]` → `Study Concurso Agent`
  - `[PRINCIPLE_1_NAME]` → `Interação em PT-BR` — toda comunicação com o usuário em português
  - `[PRINCIPLE_2_NAME]` → `Confirmação antes de ação destrutiva` — nunca sobrescrever, deletar ou publicar sem confirmação explícita
  - `[PRINCIPLE_3_NAME]` → `Pipeline sequencial com memória` — cada fase salva progresso; o agente pode retomar de onde parou
  - `[PRINCIPLE_4_NAME]` → `RAG com validação` — resultados de web search passam por validação antes de uso; evolução controlada (sem web search na v1)
  - `[PRINCIPLE_5_NAME]` → `Dados como fonte da verdade` — JSON em `/data/` é canônico; Markdown é versionamento humano; Google Docs é apresentação
  - `[SECTION_2_NAME]` → `Restrições Adicionais` — dependências (MarkItDown, Google APIs, AnkiConnect), compatibilidade Windows, logging obrigatório
  - `[SECTION_3_NAME]` → `Fluxo de Desenvolvimento` — usar Speckit workflow (Specify → Clarify → Plan → Tasks → Implement)
  - `[GOVERNANCE_RULES]` → Alterações em skills existentes requerem manter backward compatibility; novas skills seguem template padrão; qualquer alteração no formato JSON em `/data/` incrementa version no `study-memory.json`
  - `[CONSTITUTION_VERSION]` → `1.0.0`
  - `[RATIFICATION_DATE]` → `2026-04-08`
  - `[LAST_AMENDED_DATE]` → `2026-04-08`

**Step 0C: Confirmar `.specify/init-options.json`**
- Já está correto (`"ai": "copilot"`, `"integration": "copilot"`). Sem alteração.

**Step 0D: Criar prompts de invocação**
- Criar `.github/prompts/study-concurso.prompt.md` com frontmatter: `agent: study-concurso`
- Criar `.github/prompts/study-analise.prompt.md` com frontmatter: `agent: study-analise`
- Isso permite invocar os agentes via `/study-concurso` e `/study-analise` no chat

---

### **Grupo A — Infraestrutura (bloqueante para os demais)**

**Step 1: Sistema de Memória Persistente (APRIMORADO v3)**
- Criar arquivo `study-memory.json` na raiz do workspace
- Criar nova skill `.github/skills/study-memory/SKILL.md` com regras de leitura/escrita
- Criar script `.github/skills/study-memory/memory_store.py` com funções:
  - `load()` — lê o JSON, valida versão
  - `save_progress(pdf_path, fase_atual, variaveis)` — salva progresso da sessão atual com timestamp
  - `save_preference(key, value)` — salva preferência do usuário
  - `save_relevancia_history(materia, banca, classificacoes)` — salva histórico de classificações
  - `get_preferences()` — retorna preferências salvas
  - `get_history(materia, banca)` — retorna classificações anteriores
  - `get_last_run()` — retorna estado da última execução (para retomada)
  - `migrate(old_version, new_version)` — migra estrutura entre versões do JSON
- Estrutura do JSON (v3 aprimorada):
  ```json
  {
    "version": "1.0",
    "preferences": {
      "banca_default": "",
      "deck_default": "Concursos",
      "credentials_json": "",
      "output_dir": "",
      "debug_mode": false
    },
    "progress": {
      "<pdf_hash>": {
        "pdf_path": "...",
        "fase_atual": 3,
        "fase_concluidas": [0, 1, 2],
        "vars": { "md_path": "...", "materia_md": "..." },
        "started_at": "2026-04-08T10:00:00",
        "updated_at": "2026-04-08T10:30:00"
      }
    },
    "history": [
      {
        "materia": "Direito Constitucional",
        "banca": "CESPE",
        "classificacoes": { "topico_1": "🔥", "topico_2": "⚠️" },
        "fontes_usadas": ["edital", "ia"],
        "timestamp": "2026-04-08T10:30:00"
      }
    ],
    "last_run": {
      "pdf_path": "...",
      "fase": 4,
      "status": "completed",
      "timestamp": "2026-04-08T10:30:00"
    }
  }
  ```
- Regras:
  - `progress` usa hash do PDF como chave (permite múltiplos PDFs em paralelo)
  - `history` é append-only (nunca sobrescreve)
  - `version` é incrementada quando a estrutura do JSON muda
  - `migrate()` é chamado automaticamente pelo `load()` se a versão for antiga

**Step 1A: Camada de Dados Intermediária (NOVO v3)**
- Criar pasta `/data/` na raiz do workspace
- Criar nova skill `.github/skills/study-data/SKILL.md` com regras de leitura/escrita dos JSONs intermediários
- Criar script `.github/skills/study-data/data_store.py` com funções:
  - `save_topicos(topicos_list, materia, banca)` — salva `/data/topicos.json`
  - `save_questoes(questoes_list, materia, banca)` — salva `/data/questoes.json`
  - `save_relevancia_topicos(classificacoes)` — salva `/data/relevancia_topicos.json`
  - `save_relevancia_questoes(classificacoes)` — salva `/data/relevancia_questoes.json`
  - `save_edital(parsed_data)` — salva `/data/edital_parsed.json`
  - `load_<tipo>()` — carrega cada JSON
  - `validate_<tipo>(data)` — valida esquema de cada JSON antes de salvar
- Formato padrão de cada JSON:
  ```json
  {
    "meta": {
      "materia": "Direito Constitucional",
      "banca": "CESPE",
      "created_at": "2026-04-08T10:00:00",
      "updated_at": "2026-04-08T10:30:00",
      "source_file": "materia.md",
      "version": "1.0"
    },
    "data": [ ... ]
  }
  ```
- Regra obrigatória: `/data/*.json` é a FONTE DA VERDADE. Google Docs, Anki e Markdown em `/Histórico Anotações/` são **derivados** que consomem esses JSONs.
- Regra de reprocessamento: se `/data/topicos.json` já existe e está atualizado, a Fase 3 pode ser pulada — o agente pergunta ao usuário se deseja reprocessar ou reusar

**Step 1B: Logging Estruturado (NOVO v3)**
- Criar pasta `/logs/` na raiz do workspace
- Criar nova skill `.github/skills/study-logging/SKILL.md` com regras de logging
- Criar script `.github/skills/study-logging/logger.py` com funções:
  - `log_phase_start(phase, inputs)` — registra início de fase
  - `log_phase_end(phase, outputs, status)` — registra fim de fase
  - `log_decision(phase, context, decision, reasoning, sources)` — registra decisão do agente
  - `log_error(phase, error, traceback)` — registra erro
  - `get_logs(phase=None, level=None)` — consulta logs
- Formato do log (`/logs/execution_log.json`):
  ```json
  {
    "entries": [
      {
        "id": "uuid",
        "timestamp": "2026-04-08T10:00:00",
        "phase": "relevancia",
        "level": "INFO",
        "event": "phase_start",
        "input": { "materia": "Direito Constitucional", "banca": "CESPE" },
        "output": null,
        "decision": null,
        "sources": null
      },
      {
        "id": "uuid",
        "timestamp": "2026-04-08T10:05:00",
        "phase": "relevancia",
        "level": "DECISION",
        "event": "classificacao",
        "input": { "topico": "Princípios Fundamentais" },
        "output": { "classificacao": "🔥" },
        "decision": "Alta frequência — conceito basilar cobrado em 95% das provas CESPE",
        "sources": ["edital", "ia"]
      }
    ]
  }
  ```
- Níveis de log: `DEBUG`, `INFO`, `DECISION`, `WARNING`, `ERROR`
- Modo debug (`--debug`): mostra logs de nível `DEBUG` e `DECISION` em tempo real no chat
- Modo normal: logs são salvos silenciosamente, apenas `WARNING` e `ERROR` são exibidos ao usuário
- Rotação: ao atingir 10.000 entradas, rotacionar para `execution_log_<timestamp>.json`

**Step 1C: Modo Debug no Orquestrador (NOVO v3)**
- Implementar flag `--debug` no `study-concurso.agent.md`
- Comportamento quando ativo:
  - Sem alterar funcionalidade: pipeline roda identicamente
  - Exibir decisões intermediárias do subagente RAG (qual fonte usou, por que classificou assim)
  - Mostrar JSONs intermediários (`/data/`) antes de publicar
  - Mostrar preview dos Google Docs (primeiras 15 linhas) antes de enviar
  - Mostrar cards do Anki (frente/verso) antes de criar
  - Exibir resumo de fontes RAG usadas por tópico
- Flag é salva em `study-memory.json` → `preferences.debug_mode`
- Pode ser ativado/desativado a qualquer momento: `@study-concurso --debug` ou `@study-concurso --no-debug`

**Step 2: Skill de Processamento de Edital (APRIMORADO v3)**
- Criar `.github/skills/study-edital/SKILL.md`
- Objetivo: receber PDF do edital, converter com `study-pdf-to-md`, e extrair estruturadamente:
  - Nome do cargo
  - Banca organizadora
  - Lista de matérias e conteúdo programático
  - Número de questões por matéria (se disponível)
  - Peso de cada matéria (se disponível)
- **Robustez no parsing (v3)**:
  - Tolerar variações de estrutura entre editais (tabelas, listas, parágrafos corridos)
  - Usar heurísticas para identificar seções: buscar por padrões como "Conteúdo Programático", "Conhecimentos Específicos", "Disciplinas", "Provas"
  - Separar claramente cargo / banca / matérias / conteúdo programático em campos distintos
  - Validar saída antes de salvar: verificar que pelo menos `banca` e 1 `matéria` foram extraídos
  - Se extração falhar parcialmente: salvar o que conseguiu + marcar campos não extraídos como `null` + informar ao usuário
  - Suportar múltiplos cargos no mesmo edital: perguntar ao usuário qual cargo processar
- Saída: `/data/edital_parsed.json` (fonte da verdade) + `_edital.md` (markdown para contexto RAG)
- **Log**: registrar quais campos foram extraídos e quais falharam

**Step 2B: Conversão Automática de Editais (NOVO v3)**
- Criar pasta `/input/editais/` na raiz do workspace
- Comportamento: quando o agente é invocado na Fase 0, verificar se há PDFs em `/input/editais/` que ainda não foram processados
  - Converter automaticamente para Markdown usando `study-pdf-to-md`
  - Salvar em `/data/editais_md/<nome_arquivo>.md`
  - Registrar no log e na memória quais editais já foram processados
- Reutilizar lógica de `convert_pdf.py`
- Regra: não deletar PDFs originais de `/input/editais/` após processamento
- Regra: se o `.md` já existe em `/data/editais_md/`, perguntar ao usuário se deseja reconverter

---

### **Grupo B — RAG e Subagente de Análise (depende de A)**

**Step 3: Subagente de Análise RAG (APRIMORADO v3)**
- Criar `.github/agents/study-analise.agent.md`
- **Isolamento (v3)**: o subagente NÃO executa IO (não lê/escreve arquivos, não publica em Docs, não cria cards no Anki)
  - Recebe dados como INPUT via parâmetros/contexto
  - Retorna classificação como OUTPUT estruturado
  - Toda IO é responsabilidade do ORQUESTRADOR (`study-concurso`)
- Responsabilidades (apenas análise e decisão):
  - Receber como contexto: dados do edital (JSON) + matéria + banca + tópicos/questões (JSON)
  - Analisar padrões de cobrança com base nas fontes disponíveis
  - Retornar classificação 🔥/⚠️/📝 para cada tópico/questão + justificativa + fontes usadas
- **RAG com evolução controlada (v3)**:
  - **Nível 1 (v1 — padrão inicial)**: Edital + Conhecimento da IA. SEM web search.
  - **Nível 2 (evolução futura)**: Edital + Web search (`fetch_webpage` em QConcursos/TEC) + IA.
  - **Nível 3 (evolução futura)**: Edital + Web Search MCP (Tavily/Brave) + IA.
  - O nível ativo é configurável em `study-memory.json` → `preferences.rag_level` (padrão: 1)
  - Web search só é ativado quando `rag_level >= 2` E o usuário confirma
  - Validação obrigatória: qualquer dado de web search é apresentado ao usuário antes de ser incorporado na classificação
- Formato do output do subagente:
  ```json
  {
    "classificacoes": [
      {
        "id": "topico_001",
        "texto": "Princípios Fundamentais",
        "classificacao": "🔥",
        "justificativa": "Conceito basilar cobrado em todas as provas CESPE de Dir. Constitucional",
        "fontes": ["edital", "ia"],
        "confianca": "alta"
      }
    ],
    "resumo": { "alta": 5, "media": 8, "baixa": 3 },
    "fontes_consultadas": ["edital_parsed.json", "modelo_ia"],
    "rag_level_usado": 1
  }
  ```
- Tools: `read`, `search` (somente quando `rag_level >= 2`: `fetch`)
- Model: Claude Sonnet 4.6
- **Log**: registrar cada decisão de classificação com justificativa e fontes

**Step 4: Aprimorar `study-relevancia` SKILL.md (APRIMORADO v3)**
- Adicionar seção "Fontes de Dados" com prioridade:
  1. Edital (`/data/edital_parsed.json`) — se fornecido, é a fonte primária
  2. Web search — DESABILITADO na v1; habilitável via `rag_level >= 2`
  3. Conhecimento do modelo — complementar, sempre disponível
- Adicionar: análise de questões (não só matéria) — classificar cada questão do `/data/questoes.json`
- Saída expandida:
  - `/data/relevancia_topicos.json` (JSON — fonte da verdade)
  - `/data/relevancia_questoes.json` (JSON — fonte da verdade)
  - `_relevancia_topicos.md` e `_relevancia_questoes.md` (markdown legível — derivado)
- Regra: o subagente `study-analise` é invocado para realizar a análise; esta skill descreve o processo, formato e validação
- **Desacoplamento (v3)**: a skill NÃO depende de Google Docs ou Anki — apenas consome `/data/*.json` e gera `/data/relevancia_*.json`
- **Reprocessamento**: se `/data/relevancia_topicos.json` já existe, perguntar ao usuário se deseja reclassificar ou reusar

---

### **Grupo C — Questões no Google Docs (depende de B)**

**Step 5: Nova skill `study-questoes-gdoc` (APRIMORADO v3)**
- Criar `.github/skills/study-questoes-gdoc/SKILL.md`
- Criar script `.github/skills/study-questoes-gdoc/create_questoes_gdoc.py`
- **Desacoplamento (v3)**: a skill consome `/data/questoes.json` + `/data/relevancia_questoes.json` (nunca o `_questoes.md` diretamente)
- Formato no Google Doc:
  - Cada questão com o ícone 🔥/⚠️/📝 antes do enunciado
  - Agrupadas por relevância (alta → média → baixa) OU ordem original com tag
  - Alternativas formatadas com indentação
  - Gabarito no final do bloco
- Usa `create_gdoc.py` como base (reusar `autenticar()` e batch API logic)
- Saída: URL do Google Doc de questões (`gdoc_questoes_url`)
- **Versionamento local (v3)**: após publicar no Google Docs, salvar cópia em `/Histórico Anotações/Questões/questoes_<materia>_<timestamp>.md` (ver Step 6C)

---

### **Grupo D — Aprimorar Google Docs da Matéria (paralelo com C, depende de B)**

**Step 6: Incluir tags de relevância no Google Docs de matéria (APRIMORADO v3)**
- Modificar `study-formatar-topicos/SKILL.md`:
  - O `_topicos.txt` agora inclui ícones 🔥/⚠️/📝 nas linhas L1 (vindo da Fase 4)
  - O `create_gdoc.py` deve preservar esses ícones na formatação
- Modificar `create_gdoc.py`:
  - Detectar ícones 🔥/⚠️/📝 no início de linhas L1
  - Aplicar cor de fundo ou cor de texto diferenciada por nível de relevância (vermelho/amarelo/cinza)
- **Desacoplamento (v3)**: a skill consome `/data/topicos.json` + `/data/relevancia_topicos.json` para montar o `_topicos.txt` com ícones, antes de publicar
- **Versionamento local (v3)**: após publicar, salvar cópia local (ver Step 6C)

**Step 6B: Aprimorar `study-formatar-topicos` para gerar JSON intermediário (NOVO v3)**
- Modificar o fluxo da skill para salvar PRIMEIRO em `/data/topicos.json`, DEPOIS gerar `_topicos.txt` a partir do JSON
- Formato do `/data/topicos.json`:
  ```json
  {
    "meta": { "materia": "...", "banca": "...", "created_at": "...", "source_file": "...", "version": "1.0" },
    "data": [
      { "id": "t001", "level": 1, "text": "A definição de estatística é:", "subtopics": [
        { "id": "t001.1", "level": 2, "text": "é uma ciência que coleta dados" },
        { "id": "t001.2", "level": 3, "text": "dividida em descritiva e inferencial" }
      ]}
    ]
  }
  ```
- Isso permite que a Fase 4 (relevância) classifique diretamente sobre o JSON, sem precisar re-parsear o TXT

**Step 6C: Versionamento Local dos Google Docs (NOVO v3)**
- Criar nova skill `.github/skills/study-versionamento/SKILL.md`
- Criar script `.github/skills/study-versionamento/version_docs.py` com funções:
  - `salvar_resumo(conteudo, materia, banca)` → salva em `/Histórico Anotações/Resumo/resumo_<materia>_<timestamp>.md`
  - `salvar_questoes(conteudo, materia, banca)` → salva em `/Histórico Anotações/Questões/questoes_<materia>_<timestamp>.md`
  - `listar_versoes(tipo, materia)` → lista versões anteriores
  - `comparar_versoes(v1_path, v2_path)` → diff simplificado entre duas versões
- Formato dos arquivos versionados:
  ```markdown
  ---
  materia: Direito Constitucional
  banca: CESPE
  data: 2026-04-08
  gdoc_url: https://docs.google.com/...
  tipo: resumo
  ---

  # Direito Constitucional — Resumo

  🔥 A definição de Constituição é:
    • norma jurídica suprema do Estado
    ...
  ```
- Regras:
  - SEMPRE salvar versão local ANTES de publicar no Google Docs (se Google falhar, a versão local existe)
  - Timestamp no formato `YYYY-MM-DD` (uma versão por dia; se houver múltiplas no mesmo dia, usar `YYYY-MM-DD_HH-MM`)
  - Nunca deletar versões anteriores sem confirmação
- **Benefícios**: rollback, validação manual, histórico de evolução, funciona offline

---

### **Grupo E — Aprimorar Anki (depende de B)**

**Step 7: Listar decks e recomendar no Anki (MANTIDO do v2)**
- Modificar `send_to_anki.py`:
  - Adicionar função `listar_decks()` que chama `deckNames` do AnkiConnect
  - Adicionar subcomando: `python send_to_anki.py --list-decks` → retorna JSON com decks existentes
- Modificar `study-anki/SKILL.md`:
  - Novo passo no processo: ANTES de criar cards:
    1. Listar todos os decks via `--list-decks`
    2. Apresentar lista ao usuário
    3. Recomendar deck com base no nome da matéria
    4. Usuário confirma ou escolhe outro deck
  - Tags de relevância: `alta`, `media`, `baixa` como tags Anki (além da tag de matéria)
- **Desacoplamento (v3)**: Anki consome `/data/topicos.json` + `/data/relevancia_topicos.json` (nunca lê Google Docs)

**Step 8: Enviar tópicos em lote para o Anki (MANTIDO do v2, APRIMORADO v3)**
- Adicionar modo batch: `python send_to_anki.py --batch <topicos_com_tags.json>`
- JSON de entrada: `[{"front": "...", "back": "...", "deck": "...", "tags": ["materia", "alta"]}]`
- **v3**: o JSON de entrada é gerado automaticamente a partir de `/data/topicos.json` + `/data/relevancia_topicos.json` pelo orquestrador (não precisa montar manualmente)
- **Log**: registrar cada card criado/falhado no log de execução

---

### **Grupo F — Orquestrador e Integração Final (depende de A-E)**

**Step 9: Refatorar `study-concurso.agent.md` (APRIMORADO v3)**
- Atualizar o fluxo de fases para o novo pipeline (0-7)
- Adicionar Fase 0 expandida:
  - Carregar memória (`memory_store.py load`)
  - Verificar `/input/editais/` para novos PDFs (Step 2B)
  - Perguntar se tem edital
  - Auto-preencher preferências da memória
  - Iniciar logging (`log_phase_start`)
  - Detectar se há progresso anterior para o mesmo PDF (retomada)
- Adicionar delegação ao subagente `study-analise` na Fase 4:
  - Orquestrador lê `/data/topicos.json` + `/data/questoes.json` + `/data/edital_parsed.json`
  - Passa como contexto ao subagente (sem IO no subagente)
  - Recebe output estruturado do subagente
  - Salva em `/data/relevancia_topicos.json` e `/data/relevancia_questoes.json`
- Adicionar Fase 6 (questões → Google Docs + versionamento local)
- Atualizar Fase 7 (Anki com listagem de decks + batch + dados do JSON)
- Em CADA fase:
  - `log_phase_start()` + `log_phase_end()`
  - `save_progress()` na memória
  - Validar que `/data/*.json` foi salvo ANTES de publicar
- Suportar flag `--debug`:
  - Quando ativo: mostrar logs `DECISION` em tempo real, dados JSON antes de publicar, fontes RAG
  - Quando inativo: apenas `WARNING`/`ERROR` exibidos
- Suportar retomada:
  - Se `study-memory.json` tem progresso para o mesmo PDF, perguntar ao usuário: "Retomar da Fase X ou recomeçar?"

**Step 10: Documentação e Testes (APRIMORADO v3)**
- Criar um `README.md` na raiz com:
  - Visão geral do agente e arquitetura (diagrama de fases)
  - Pré-requisitos (Python, pip packages, Google credentials, Anki + AnkiConnect)
  - Estrutura de diretórios (`/data/`, `/logs/`, `/input/`, `/Histórico Anotações/`)
  - Como invocar cada fase (parcial e completa)
  - Modo debug (`--debug`)
  - Exemplos de uso
- Testes manuais:
  - Teste 1: Fluxo completo com PDF + edital → verificar TODOS os artefatos: `/data/*.json`, `/logs/execution_log.json`, `/Histórico Anotações/`, Google Docs URLs, Anki cards
  - Teste 2: Fluxo parcial (só Anki) → verificar listagem de decks e criação de cards a partir de `/data/topicos.json`
  - Teste 3: Memória → executar 2 sessões e verificar retomada + preferências preservadas
  - Teste 4: Reprocessamento → modificar `/data/topicos.json` manualmente → reexecutar Fase 5 → verificar que Google Docs reflete a mudança
  - Teste 5: Modo debug → executar com `--debug` → verificar que decisões RAG aparecem no chat
  - Teste 6: Logging → executar pipeline completo → verificar `/logs/execution_log.json` com todas as entradas
  - Teste 7: Versionamento → executar 2x para mesma matéria → verificar 2 arquivos em `/Histórico Anotações/`
  - Teste 8: Edital robusto → fornecer edital com formato incomum → verificar que campos parciais são extraídos e usuário é informado

---

## Relevant Files

### Arquivos a MODIFICAR (8):
- `.github/agents/study-concurso.agent.md` — novo fluxo 8 fases, memória, subagente, logging, debug, retomada
- `.github/skills/study-relevancia/SKILL.md` — RAG com evolução controlada, análise de questões, desacoplamento, consome JSON
- `.github/skills/study-formatar-topicos/SKILL.md` — gerar JSON intermediário, ícones no _topicos.txt, versionamento local
- `.github/skills/study-formatar-topicos/create_gdoc.py` — cores por relevância, consumir JSON + relevância
- `.github/skills/study-anki/SKILL.md` — listar decks, tags, consumir JSON, batch
- `.github/skills/study-anki/send_to_anki.py` — `listar_decks()`, `--list-decks`, `--batch`, logging
- `.specify/memory/constitution.md` — preencher tokens placeholder com valores reais
- `.github/copilot-instructions.md` — (se não existir: criar; se existir: atualizar com regras v3)

### Arquivos a CRIAR (16):
- `.github/copilot-instructions.md` — instruções globais (PT-BR, dados como verdade, logging, debug)
- `.github/prompts/study-concurso.prompt.md` — prompt invocação orquestrador
- `.github/prompts/study-analise.prompt.md` — prompt invocação subagente
- `.github/agents/study-analise.agent.md` — subagente RAG isolado (sem IO)
- `.github/skills/study-memory/SKILL.md` — skill de memória persistente
- `.github/skills/study-memory/memory_store.py` — script Python memória (JSON versionado)
- `.github/skills/study-data/SKILL.md` — skill de camada de dados intermediária
- `.github/skills/study-data/data_store.py` — script Python gestão de `/data/*.json`
- `.github/skills/study-logging/SKILL.md` — skill de logging estruturado
- `.github/skills/study-logging/logger.py` — script Python logging (`/logs/execution_log.json`)
- `.github/skills/study-edital/SKILL.md` — skill de processamento de edital (parsing robusto)
- `.github/skills/study-questoes-gdoc/SKILL.md` — skill de questões no Google Docs
- `.github/skills/study-questoes-gdoc/create_questoes_gdoc.py` — script Python Google Docs questões
- `.github/skills/study-versionamento/SKILL.md` — skill de versionamento local dos Docs
- `.github/skills/study-versionamento/version_docs.py` — script Python versionamento (`/Histórico Anotações/`)
- `README.md` — documentação completa do agente

### Pastas a CRIAR (4):
- `/data/` — JSONs intermediários (fonte da verdade)
- `/logs/` — logs de execução
- `/input/editais/` — pasta monitorada para PDFs de editais
- `/Histórico Anotações/Resumo/` e `/Histórico Anotações/Questões/` — versões locais

### Arquivos de REFERÊNCIA (reusar padrões):
- `.github/skills/study-formatar-topicos/create_gdoc.py` — `autenticar()`, batch API → reusar em `create_questoes_gdoc.py`
- `.github/skills/study-anki/send_to_anki.py` — `ankiconnect()` → reusar para `listar_decks()`
- `.github/skills/study-pdf-to-md/convert_pdf.py` — `convert()` → reusar para converter edital PDF

---

## Verification (15 testes)

1. **copilot-instructions**: carregar workspace → chat responde em PT-BR automaticamente
2. **constitution.md**: nenhum token `[PLACEHOLDER]` restante
3. **Prompts**: `/study-concurso` e `/study-analise` aparecem como opções no chat
4. **Memória**: `python memory_store.py save_preference banca CESPE` → JSON persiste → `load` retorna
5. **Camada de dados**: após Fase 3, `/data/topicos.json` existe com formato válido e `meta` preenchido
6. **Edital robusto**: PDF com formato incomum → campos parciais extraídos → usuário informado dos faltantes
7. **RAG controlado**: na v1, verificar que web search NÃO é executado (nível 1). Classificação usa edital + IA.
8. **Google Docs matéria**: tópicos com ícones 🔥/⚠️/📝 coloridos + versão local em `/Histórico Anotações/Resumo/`
9. **Google Docs questões**: separado, com tags + versão local em `/Histórico Anotações/Questões/`
10. **Anki**: `--list-decks` retorna JSON → `--batch` cria 3 cards → tags de relevância presentes
11. **Logging**: `/logs/execution_log.json` com entradas de ALL fases + decisões RAG
12. **Debug**: `--debug` mostra decisões em tempo real sem alterar funcionalidade
13. **Retomada**: interromper na Fase 3 → reinvocar → agente pergunta se quer retomar da Fase 4
14. **Reprocessamento**: editar `/data/topicos.json` → reexecutar Fase 5 → Google Docs atualizado
15. **Versionamento**: executar 2x mesma matéria → 2 arquivos em `/Histórico Anotações/`

---

## Decisions (v3 — consolidadas)

- **Idioma**: `copilot-instructions.md` força PT-BR. `.specify` permanece em inglês (framework Speckit)
- **Dados como verdade**: `/data/*.json` é canônico. Markdown = versionamento humano. Google Docs = apresentação. Anki = estudo ativo. Nenhum output depende diretamente de outro output — todos consomem o JSON.
- **RAG evolução controlada**: v1 = Edital + IA (sem web search). v2 futura = + web search. v3 futura = + MCP. Nível configurável.
- **Subagente isolado**: `study-analise` NÃO faz IO. Recebe dados, retorna classificação. Orquestrador lida com arquivos.
- **Logging**: obrigatório em toda fase. JSON em `/logs/`. Debug mode = verbose no chat.
- **Versionamento local**: SEMPRE salvar antes de publicar Google Docs. Rollback manual possível.
- **Memória**: JSON local versionado. Hash do PDF como chave de progresso. Append-only para histórico.
- **Reprocessamento**: se JSON intermediário já existe, perguntar ao usuário antes de reprocessar.
- **Múltiplos editais**: pasta `/input/editais/` suporta N editais. Memória rastreia cada um separadamente.
- **Escopo excluído**: OCR de PDFs escaneados, banco de dados externo, app mobile, web search na v1.

---

## Further Considerations (atualizadas)

1. **Web Search MCP (v2 futura)**: Começar NO nível 1 (sem web). Quando estabilizar, implementar nível 2 com `fetch_webpage` em QConcursos/TEC. Depois avaliar nível 3 com MCP (Tavily/Brave).
2. **Anki Note Type customizado (futura)**: Começar com "Basic" + tags. Evoluir para tipo "Concurso" com campos (matéria, banca, relevância, fonte).
3. **Spec completa via Speckit**: Usar `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` para gerar spec formal antes de implementar.
4. **Múltiplos usuários (futura)**: Estrutura atual suporta 1 usuário. Para multi-user, considerar: subpasta por usuário em `/data/` e `/Histórico Anotações/`, ou migrar para SQLite.
5. **CI/CD local**: Considerar um script `validate_data.py` que valida todos os JSONs em `/data/` contra schemas esperados — útil após edições manuais.
