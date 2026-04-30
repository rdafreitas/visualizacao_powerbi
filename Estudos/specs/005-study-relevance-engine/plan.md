# Implementation Plan: Study Relevance Engine

**Branch**: `005-study-relevance-engine` | **Date**: 2026-04-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-study-relevance-engine/spec.md`

## Summary

Motor de classificação de relevância para tópicos e questões de concurso. Recebe
`topicos.json` e `questoes.json` (produzidos pela spec 004) e retorna
`relevancia_topicos.json` e `relevancia_questoes.json` com classificação
🔥 (alta) / ⚠️ (média) / 📝 (baixa), justificativa em linguagem natural e fontes
rastreáveis para cada item.

Quando disponível, usa `edital_parsed.json` (spec 003) como referência primária;
caso contrário, opera com inferência do modelo (fonte "ia"). Em ambos os casos,
o motor opera como **análise pura** — recebe dados, retorna dados, sem IO próprio.

A implementação aplica 4 padrões de design explícitos (Princípio IX da constituição):
**Pure Function**, **Strategy**, **Repository** e **Chain of Evidence**.
Cada padrão está explicado na seção [Padrões de Design](#padrões-de-design-aplicados-princípio-ix)
abaixo — aprenda os nomes, pois você os encontrará em todo projeto Python.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: `json`, `pathlib`, `datetime` (stdlib — sem `pip install`); Claude API (via agente) para inferência de classificação
**Storage**: Inputs em `/data/` (`topicos.json`, `questoes.json`, `edital_parsed.json` opcional); outputs em `/data/` (`relevancia_topicos.json`, `relevancia_questoes.json`)
**Testing**: Manual — com `topicos.json` real; testes independentes por User Story
**Target Platform**: Windows, Python 3.11+, executado como skill pelo agente
**Project Type**: Pure analysis skill (sem IO próprio — orquestrador é responsável pelo IO)
**Performance Goals**: Classificação de 100 tópicos em menos de 2 minutos
**Constraints**: Sem web search na v1 (Constitution V); inferência do modelo é fonte terciária; nível RAG 1
**Scale/Scope**: Single user, 10–500 tópicos por sessão

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Princípio | Status | Evidência / Ação |
|---|-----------|--------|-----------------|
| I | Interação em PT-BR | ✅ PASS | Todas as mensagens ao usuário em PT-BR; justificativas de classificação em PT-BR |
| II | Confirmação Antes de Ações | ✅ PASS | Quando reclassificação sobrescreve arquivo existente, confirmação obrigatória (US1 — Acceptance Scenario 4) |
| III | Pipeline Sequencial | ✅ PASS | Depende de 002 (Foundation) e 004 (topicos.json, questoes.json); 003 é opcional e enriquece a classificação |
| IV | Dados Estruturados | ✅ PASS | Outputs `relevancia_topicos.json` e `relevancia_questoes.json` são JSON estruturado com schema definido em `data-model.md` |
| V | RAG com Validação | ✅ PASS | v1 opera sem web search (nível RAG 1); fontes explicitamente declaradas em cada classificação; evolução futura é escopo de v2+ |
| VI | Separação de Responsabilidades | ✅ PASS | 4 arquivos com responsabilidade única: Repository (IO), Strategy (qual critério), Classifier (lógica pura), Service (orquestração) |
| VII | Observabilidade | ✅ PASS | Cada decisão de classificação registrada no log via Foundation (spec 002) com nível DECISION, justificativa e fontes |
| VIII | Evolução Compatível | ✅ PASS | Lê campo `version` dos JSONs de entrada; campo `fontes` suporta valores futuros sem breaking change |
| IX | Desenvolvimento Orientado ao Aprendizado | ✅ PASS | 4 padrões nomeados e explicados neste plan; tasks terão responsabilidade única; código prioriza legibilidade |

**Resultado: GATE PASS** — sem violações.

## Padrões de Design Aplicados (Princípio IX)

> Esta seção existe para que você entenda o *porquê* de cada decisão.
> Aprenda o nome de cada padrão — você os encontrará em todo projeto Python.

### Padrão 1 — Pure Function (Função Pura)

**O que é**: Uma função que, dado o mesmo input, sempre retorna o mesmo output —
e que não tem "efeitos colaterais" (não lê arquivos, não salva nada, não chama APIs,
não muda nenhuma variável fora de si mesma). Ela apenas recebe dados e retorna dados.

> **Analogia para iniciantes**: Pense em uma calculadora. Você aperta `2 + 3`, ela
> sempre responde `5`. Ela não muda o estado do mundo ao redor — não salva em nenhum
> lugar, não liga para a internet. Isso é uma função pura. Já uma função que salva um
> arquivo ou que retorna valores diferentes dependendo do horário *não* é pura.

**Por que usamos aqui**: A lógica de classificação em `relevance_classifier.py` recebe
uma lista de tópicos + contexto (edital ou nenhum) e retorna uma lista de classificações.
Não lê arquivos, não chama APIs diretamente. Isso traz dois benefícios concretos:

1. **Testabilidade**: Você pode testar a função passando dados diretamente e verificando
   o retorno — sem precisar de arquivos no disco.
2. **Previsibilidade**: Fica fácil de entender e depurar, porque a função não tem
   "estado escondido" que influencia o resultado.

**Arquivo**: `relevance_classifier.py`

---

### Padrão 2 — Strategy (Estratégia)

**O que é**: Um padrão que permite escolher *como* realizar uma tarefa em tempo de
execução, sem mudar quem faz a tarefa. Você tem duas ou mais estratégias intercambiáveis
que cumprem o mesmo "contrato" (mesma interface), e o código que as usa não precisa
saber qual está ativa.

> **Analogia para iniciantes**: Pense em um GPS. Você pode escolher "rota mais rápida"
> ou "rota mais econômica". O motorista (seu código) só precisa saber "siga as instruções
> do GPS" — não importa qual estratégia está ativa internamente.

**Por que usamos aqui**: Existem duas estratégias de classificação:
- **ComEdital**: usa `edital_parsed.json` como referência — cruzamento explícito entre
  tópico e conteúdo programático.
- **SemEdital**: usa apenas inferência do modelo — classifica com base em conhecimento
  geral sobre concursos.

O `relevance_classifier.py` (Função Pura) não sabe qual estratégia está ativa. Ele
recebe uma estratégia como parâmetro e a executa. Se o edital aparecer no futuro, só
a estratégia muda — o classificador continua igual.

**Arquivo**: `classification_strategies.py`

---

### Padrão 3 — Repository (Repositório)

**O que é**: Um objeto que sabe ler e escrever dados de um lugar específico (arquivo,
banco de dados, API) e expõe uma interface limpa ao restante do código. O restante do
código não sabe de onde os dados vêm — só pede e recebe.

> **Analogia para iniciantes**: Pense em uma biblioteca. Você pede "me dá o livro X"
> ao bibliotecário (Repository) — você não precisa saber se o livro está na prateleira
> A, B ou no depósito. O bibliotecário sabe onde tudo está.

**Por que usamos aqui**: A lógica de classificação não deve saber que os dados estão
em arquivos JSON. O `relevance_repository.py` lê `topicos.json`, `questoes.json` e
`edital_parsed.json` e entrega os dados como listas Python. Também escreve os resultados.
Se no futuro os dados vierem de um banco de dados, só o Repository muda.

**Arquivo**: `relevance_repository.py`

---

### Padrão 4 — Chain of Evidence (Cadeia de Evidências)

**O que é**: Cada decisão registra de onde veio a informação que embasou a decisão —
as "provas" usadas. Não é um padrão do Gang of Four (livro clássico de padrões), mas
é uma prática essencial em sistemas que precisam ser auditáveis.

> **Analogia para iniciantes**: Pense em um juiz que explica cada sentença: "Condeno
> com base no artigo X da lei Y, com a prova Z". O leitor pode verificar se a decisão
> faz sentido e rastrear como ela foi tomada. Uma classificação sem fontes é uma decisão
> sem justificativa — impossível de auditar ou corrigir.

**Por que usamos aqui**: Cada classificação registra `fontes` (ex: `["edital", "ia"]`)
e `nivel_confianca` ("alta"/"media"/"baixa"). Isso cumpre o Princípio VII (Observabilidade)
e permite ao usuário entender *por que* um tópico foi classificado como 🔥 e *com base
em quê*. Quando a classificação está errada, o usuário sabe onde investigar.

**Implementado em**: `relevance_classifier.py` (popula os campos) e `relevance_repository.py`
(persiste no JSON de saída)

## Project Structure

### Documentation (esta feature)

```text
specs/005-study-relevance-engine/
├── plan.md              # Este arquivo
├── spec.md              # Especificação original da feature
├── research.md          # Pesquisa: schemas, critérios, decisões de design
├── data-model.md        # Entidades: ClassificacaoTopico, ClassificacaoQuestao, ResumoClassificacao
├── quickstart.md        # Como testar cada User Story manualmente
├── contracts/
│   ├── relevancia_topicos_contract.md   # Schema completo com exemplos
│   └── classifier_interface.md          # Interface pública do relevance_classifier.py
└── tasks.md             # Gerado por /speckit.tasks (próximo passo)
```

### Source Code (skill reutilizável)

```text
.github/skills/study-relevance/
├── relevance_classifier.py      # Pure Function — lógica de classificação pura   [NOVO]
├── classification_strategies.py # Strategy — com edital vs sem edital             [NOVO]
├── relevance_repository.py      # Repository — lê inputs, escreve outputs         [NOVO]
└── relevance_service.py         # Orquestrador — usa repository + classifier      [NOVO]

data/                            # Runtime — criado pela spec 002
├── topicos.json                 # Input obrigatório (spec 004)
├── questoes.json                # Input obrigatório (spec 004)
├── edital_parsed.json           # Input opcional (spec 003 — enriquece classificação)
├── relevancia_topicos.json      # Output — classificação dos tópicos
└── relevancia_questoes.json     # Output — classificação das questões

logs/
└── execution_log.json           # Logs estruturados (spec 002 Foundation)
```

**Structure Decision**: Single project — pure analysis skill. Quatro arquivos com
responsabilidade única cada (Princípio VI). O `relevance_service.py` é o único arquivo
que conhece todos os outros — ele é o ponto de entrada desta skill, chamado pelo agente
orquestrador.

## Complexity Tracking

> Sem violações constitucionais a justificar — tabela não aplicável.

## Fases de Implementação (Visão Geral)

> O detalhamento em tasks individuais é feito pelo `/speckit.tasks`. Esta seção mostra
> as fases e o padrão aplicado em cada uma — para que você entenda a sequência lógica
> antes de ver as tasks.

### Fase 1 — Repository: Leitura e Escrita de Dados (Fundação desta feature)

**Padrão aplicado**: Repository

Cria o `relevance_repository.py`, que isola todo o IO desta skill do restante do código.
Sem esta fase, nenhuma lógica de classificação pode ser testada com dados reais.

Responsabilidades desta fase:
- Ler e validar `topicos.json` (verifica schema e versão)
- Ler e validar `questoes.json`
- Ler `edital_parsed.json` se existir (retorna `None` se ausente — sem erro)
- Escrever `relevancia_topicos.json` e `relevancia_questoes.json`
- Verificar se classificação anterior já existe (para US1 — Acceptance Scenario 4)

**Checkpoint desta fase**: Repository pronto — lê `topicos.json` e retorna lista Python
de tópicos. Escreve arquivo de saída com dados de teste. Lógica de classificação pode
começar.

---

### Fase 2 — Strategies + Classifier: Lógica de Classificação (Core da feature)

**Padrão aplicado**: Strategy + Pure Function

Implementa as duas estratégias de classificação e o classificador puro.

`classification_strategies.py`:
- `EstrategiaComEdital` — cruza tópico com conteúdo programático do edital; retorna
  sugestão de nível + justificativa + fontes `["edital", "ia"]`
- `EstrategiaSemEdital` — usa inferência do modelo; retorna sugestão + aviso de
  confiança reduzida + fontes `["ia"]`

`relevance_classifier.py` (Pure Function):
- `classificar_topicos(topicos, estrategia)` → lista de `ClassificacaoTopico`
- `classificar_questoes(questoes, estrategia)` → lista de `ClassificacaoQuestao`
- Aplica a estratégia recebida a cada item; popula `fontes`, `nivel_confianca`,
  `justificativa` (Chain of Evidence)

**Checkpoint desta fase**: Com lista de tópicos Python e `EstrategiaComEdital` instanciada,
`classificar_topicos()` retorna lista de classificações com todos os campos preenchidos.

---

### Fase 3 — Service + Resumo Estatístico (US3 e integração completa)

**Padrão aplicado**: Service Layer (orquestração)

Implementa `relevance_service.py`, que une todas as peças:
1. Chama Repository para ler os dados
2. Escolhe a estratégia correta (com ou sem edital)
3. Chama Classifier com a estratégia escolhida
4. Chama Repository para escrever os resultados
5. Gera e retorna o `ResumoClassificacao` (US3): `{alta: N, media: M, baixa: K}`,
   fontes consultadas e nível RAG utilizado
6. Registra cada decisão no log via Foundation (spec 002)

**Checkpoint desta fase**: Com `topicos.json` e `questoes.json` presentes, executar
a skill end-to-end gera `relevancia_topicos.json`, `relevancia_questoes.json` e
exibe o resumo estatístico no chat.
