# Implementation Plan: Study Foundation

**Branch**: `002-study-foundation` | **Date**: 2026-04-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-study-foundation/spec.md`

## Summary

A spec `002-study-foundation` cria a **infraestrutura transversal** que todas as demais
features do Study Concurso Agent precisam para funcionar. Em termos práticos, é como
construir os alicerces de uma casa antes de erguer as paredes: sem ela, cada feature
teria que resolver, por conta própria, como salvar progresso, registrar eventos e
validar dados — repetindo código e criando inconsistências.

O que esta spec entrega: (1) memória persistente em `study-memory.json` com versionamento,
retomada de pipeline e migração automática de schema; (2) logging estruturado em
`/logs/execution_log.json` com 5 níveis e rotação automática em 10.000 entradas; (3) modo
debug (`--debug`) que exibe decisões do agente em tempo real; (4) confirmação obrigatória
antes de ações destrutivas; (5) contratos de dados que todos os arquivos em `/data/` devem
respeitar; e (6) criação automática dos diretórios do workspace na primeira execução.

A implementação aplica 4 padrões de design explícitos (Princípio IX da constituição):
**Singleton**, **Observer** (simplificado), **Template Method** e **Schema Migration**.
Cada padrão está explicado na seção [Padrões de Design](#padrões-de-design-aplicados-princípio-ix)
abaixo — aprenda os nomes, pois você os encontrará em todo projeto Python profissional.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: `json`, `hashlib`, `pathlib`, `datetime`, `uuid` (todos stdlib — sem `pip install`)
**Storage**: `study-memory.json` (raiz do workspace); `/logs/execution_log.json`; `/data/*.json`
**Testing**: Manual por User Story conforme spec — ver [quickstart.md](quickstart.md)
**Target Platform**: Windows, Python 3.11+, executado como skill pelo agente Claude
**Project Type**: CLI skill library (módulos importados por outros scripts do projeto)
**Performance Goals**: Operações de leitura/escrita de memória < 100ms; append de log < 10ms
**Constraints**: `study-memory.json` < 10MB; sem dependências externas ao Python stdlib
**Scale/Scope**: Single user, single pipeline ativo por vez; histórico de múltiplas sessões

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Princípio | Status | Evidência / Ação |
|---|-----------|--------|-----------------|
| I | Interação em PT-BR | PASS | FR-014 garante toda comunicação ao usuário em PT-BR; código e variáveis podem ser em inglês |
| II | Confirmação Antes de Ações | PASS | FR-011 obriga confirmação antes de sobrescrever arquivos, substituir memória, publicar externamente |
| III | Pipeline Sequencial | PASS | Esta spec é exatamente o que viabiliza o Princípio III: `study-memory.json` persiste fase atual e fases concluídas |
| IV | Dados Estruturados | PASS | FR-013 define contrato com campos `meta` e `data` para todos os JSONs em `/data/`; `study-memory.json` é fonte canônica do estado |
| V | RAG com Validação | PASS | Nenhuma busca web nesta spec; lê apenas dados locais do filesystem |
| VI | Separação de Responsabilidades | PASS | 5 arquivos com responsabilidade única: `memory_manager.py`, `logger.py`, `state_machine.py`, `data_contracts.py`, `confirmation.py` |
| VII | Observabilidade | PASS | Esta spec implementa a observabilidade exigida: logging estruturado com 5 níveis e modo debug |
| VIII | Evolução Compatível | PASS | FR-005 garante migração automática de schema; campo `version` em `study-memory.json` e em todo `/data/*.json` |
| IX | Desenvolvimento Orientado ao Aprendizado | PASS | Padrões nomeados e explicados neste plan; cada fase tem responsabilidade única; jargões definidos na primeira ocorrência |

**Resultado: GATE PASS** — sem violações. Esta spec é a fundação de todos os outros princípios: sem ela, II, III, IV e VII não podem ser cumpridos por nenhuma feature.

## Padrões de Design Aplicados (Princípio IX)

> Esta seção existe para que você entenda o *porquê* de cada decisão arquitetural.
> Jargão técnico é explicado na primeira ocorrência — não salte esta seção.

---

### Padrão 1 — Singleton (Instância Única)

**O que é**: Um padrão que garante que um componente existe em **uma única cópia** durante
toda a execução do programa. A analogia mais simples: é como o gerente de um time — existe
um único gerente, e todo mundo fala com ele, não com cópias dele.

**Por que usamos aqui**: O arquivo `study-memory.json` representa o estado completo do
pipeline. Se dois módulos lessem e escrevessem no arquivo de forma independente, poderíamos
ter condição de corrida (um sobrescreve o que o outro acabou de salvar). Com o Singleton,
há **um único ponto de leitura** na inicialização e **um único ponto de escrita** ao
persistir progresso. O arquivo é lido uma vez, mantido em memória como dicionário Python
durante a execução, e escrito atomicamente no final de cada fase.

**Arquivo**: `memory_manager.py`

---

### Padrão 2 — Observer Simplificado (Observador)

**O que é**: Um padrão onde componentes "notificam" um observador sobre eventos sem
depender diretamente dele. A analogia: é como um jornal e seus assinantes — o repórter
escreve a notícia (o evento acontece), e o jornal distribui a todos os assinantes (o
observador registra). O repórter não sabe quem são os assinantes.

**Por que usamos aqui**: O Logger deve ser chamado em toda fase do pipeline — `memory_manager`,
`state_machine`, `data_contracts`, todos registram eventos. Se cada módulo importasse e
chamasse o logger diretamente (acoplamento forte), trocar o logger quebraria todos eles.
Com o Observer simplificado, cada componente chama `log(level, event, data)` sem saber
*como* o log é armazenado — poderia ser arquivo, banco de dados ou console. A implementação
real (arquivo JSON + rotação) fica isolada em `logger.py`.

**Arquivo**: `logger.py`

---

### Padrão 3 — Template Method (Método Template)

**O que é**: Um padrão que define o **esqueleto de uma operação em um lugar só**, deixando
os detalhes para implementações específicas. É como uma receita de bolo: a sequência
(misturar ingredientes → assar → decorar) é sempre a mesma; o que muda são os ingredientes
e a decoração de cada bolo.

**Por que usamos aqui**: Toda fase do pipeline segue a mesma sequência: (1) verificar
estado atual na memória, (2) executar a operação, (3) persistir progresso, (4) registrar
log. Em vez de repetir essa sequência em cada feature (003, 004, 005...), a `state_machine.py`
define esse esqueleto uma única vez. Cada feature chama o Template Method passando apenas
o que muda (a lógica específica da fase). Isso garante que nenhuma feature "esqueça" de
salvar progresso ou registrar log.

**Arquivo**: `state_machine.py`

---

### Padrão 4 — Schema Migration (Migração de Schema)

**O que é**: Uma estratégia para **atualizar a estrutura de dados persistidos sem perder
dados existentes**. O nome "schema" (esquema) vem de banco de dados — é a definição de
quais campos um registro tem. "Migration" é o processo de levar dados do formato antigo
para o novo.

**Por que usamos aqui**: O `study-memory.json` vai evoluir conforme o projeto cresce —
novos campos serão adicionados, campos existentes podem ser reorganizados. Sem migração,
um arquivo salvo com a versão 1.0 falharia ao ser lido pela versão 2.0. Com o Schema
Migration Pattern, o `memory_manager.py` lê o campo `version` do arquivo, compara com a
versão atual do código, e aplica transformações sequenciais (1.0 → 1.1 → 2.0) antes de
usar os dados. O usuário nunca perde progresso por causa de uma atualização.

**Implementado em**: `memory_manager.py` (função `migrar_schema`)

## Project Structure

### Documentation (esta feature)

```text
specs/002-study-foundation/
├── plan.md              # Este arquivo
├── spec.md              # Especificação de requisitos
├── research.md          # Decisões de design + schemas JSON detalhados
├── data-model.md        # Entidades: SessaoProcessamento, PreferenciasUsuario, EntradaLog, ContratosDados
├── quickstart.md        # Como testar cada User Story manualmente
├── contracts/
│   └── data_contracts.md  # Contratos JSON completos + interface pública de cada módulo
└── tasks.md             # Gerado por /speckit.tasks (próximo passo)
```

### Source Code (skill reutilizável)

```text
.github/skills/study-foundation/
├── memory_manager.py      # Singleton: lê/escreve study-memory.json              [NOVO]
├── logger.py              # Observer simplificado: log estruturado em /logs/     [NOVO]
├── state_machine.py       # Template Method: gerencia fases do pipeline           [NOVO]
├── data_contracts.py      # Define e valida contratos JSON de /data/              [NOVO]
└── confirmation.py        # Confirmação de ações destrutivas antes de executar   [NOVO]

study-memory.json          # Runtime — criado na raiz do workspace na 1ª execução
logs/
└── execution_log.json     # Runtime — criado automaticamente
data/                      # Runtime — criado automaticamente com subdiretórios
input/
└── editais/               # Runtime — criado automaticamente
Histórico Anotações/
├── Resumo/                # Runtime — criado automaticamente
└── Questões/              # Runtime — criado automaticamente
```

**Structure Decision**: CLI skill library. Cada arquivo em `.github/skills/study-foundation/`
tem responsabilidade única (Princípio VI). Os arquivos de runtime (`study-memory.json`,
`/logs/`, `/data/`) são criados automaticamente na primeira execução por `memory_manager.py`
e `logger.py`, nunca precisam ser criados manualmente pelo usuário.

## Complexity Tracking

> Sem violações constitucionais a justificar — tabela não aplicável.

## Fases de Implementação (Visão Geral)

> O detalhamento em tasks individuais é feito pelo `/speckit.tasks`. Esta seção mostra
> as fases e o padrão aplicado em cada uma — para que você entenda a sequência lógica
> antes de ver as tasks.

### Fase 1 — Contratos de Dados + Estrutura de Diretórios (Fundação da Fundação)

**Padrão aplicado**: Sem padrão de design específico — é configuração pura. O conceito
relevante aqui é **"fail fast"**: o sistema verifica e cria o ambiente necessário *antes*
de tentar qualquer operação, em vez de falhar no meio de uma fase com erro de diretório
não encontrado.

Cria `data_contracts.py` com as funções que definem e validam a estrutura padrão de todo
JSON em `/data/` (campos `meta` + `data`), e a função `criar_diretorios_workspace()` que
cria automaticamente todos os diretórios necessários (`/data/`, `/logs/`, `/input/editais/`,
etc.) quando não existirem.

- `data_contracts.py` — define schema `meta` obrigatório; valida contratos; cria diretórios
- Diretórios criados: `/data/`, `/logs/`, `/input/editais/`, `/Histórico Anotações/Resumo/`, `/Histórico Anotações/Questões/`

**Checkpoint desta fase**: `python data_contracts.py` cria todos os diretórios e valida
um JSON de exemplo sem erros.

---

### Fase 2 — Memory Manager (Singleton + Schema Migration)

**Padrão aplicado**: Singleton + Schema Migration Pattern

Implementa `memory_manager.py` — o componente mais crítico da spec. Gerencia o ciclo de
vida completo de `study-memory.json`: criação com valores padrão, leitura única na
inicialização, detecção de progresso anterior por hash SHA-256 do PDF, migração automática
de versões antigas, e escrita atômica após cada fase.

- `memory_manager.py` — funções: `inicializar()`, `carregar()`, `salvar()`, `detectar_progresso(pdf_hash)`, `migrar_schema(dados_antigos)`, `registrar_fase_concluida(fase)`

**Checkpoint desta fase**: Executar pipeline até fase 2, interromper, reinvocar com o
mesmo PDF — o sistema detecta progresso e oferece retomada da fase 3.

---

### Fase 3 — Logger (Observer Simplificado)

**Padrão aplicado**: Observer Simplificado

Implementa `logger.py` — o sistema de observabilidade do projeto. Registra eventos
estruturados em `/logs/execution_log.json` com os 5 níveis (DEBUG, INFO, DECISION,
WARNING, ERROR), rotaciona o arquivo ao atingir 10.000 entradas, e controla o que é
exibido ao usuário com base no modo debug ativo ou não.

- `logger.py` — funções: `log(level, event, data)`, `rotacionar_se_necessario()`, `exibir_para_usuario(entry)`

**Checkpoint desta fase**: Executar qualquer fase e verificar que `/logs/execution_log.json`
contém entrada com todos os campos obrigatórios (id, timestamp, phase, level, event).

---

### Fase 4 — Pipeline State Machine + Confirmação

**Padrão aplicado**: Template Method

Implementa `state_machine.py` (esqueleto do pipeline — verificar estado → executar →
persistir → log) e `confirmation.py` (confirmação de ações destrutivas antes de executar).
Esta fase integra os três módulos anteriores em um fluxo coeso.

- `state_machine.py` — função principal: `executar_fase(numero_fase, funcao_fase, descricao)`
- `confirmation.py` — funções: `confirmar_sobrescrita(caminho)`, `confirmar_acao(mensagem)`, `confirmar_reprocessamento(artefato)`

**Checkpoint desta fase**: Tentar sobrescrever `/data/topicos.json` existente — o sistema
pede confirmação antes de prosseguir. Executar uma fase completa via `state_machine.py`
e verificar que o progresso é salvo e o log registrado automaticamente.
