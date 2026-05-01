# Plano de Implementação: Study Gamification

**Branch**: `009-study-gamification` | **Data**: 2026-04-30 | **Spec**: [spec.md](spec.md)
**Entrada**: Especificação da feature em `/specs/009-study-gamification/spec.md`

## Resumo

Sistema de gamificação que consome eventos de revisão (`flashcard_events.json`) e feedback de resumos (`summary_feedback.json`) da spec 008 para calcular XP, atualizar o personagem e desbloquear marcos de jogabilidade. Implementado como módulo Node.js (`gamification_service.js`) integrado ao servidor Express.js da spec 008 via `routes/character.js`.

A implementação aplica 3 padrões de design explícitos (Princípio IX da constituição):
**Repository**, **Service Layer** e **Event Sourcing simplificado**. Cada padrão está explicado na seção [Padrões de Design](#padrões-de-design-aplicados-princípio-ix) abaixo.

## Contexto Técnico

**Linguagem/Versão**: Node.js 18+ (JavaScript ES2022)
**Dependências Principais**: Nenhuma — usa apenas stdlib (`fs`, `path`) + `express` já instalado pela spec 008
**Armazenamento**: JSON em `/data/` — leitura: `flashcard_events.json`, `summary_feedback.json`; escrita: `character_state.json`, `gamification_notifications.json`
**Testes**: Manual via `node process_events.js` + `curl /api/character` — cenários em `quickstart.md`
**Plataforma-Alvo**: Windows, Node.js 18+; módulo importado pelo servidor da spec 008
**Tipo de Projeto**: Módulo Node.js (não é um servidor independente — integra à spec 008)
**Metas de Performance**: `getCharacter()` responde em < 100ms (leitura + processamento de JSONs pequenos)
**Restrições**: Zero dependências novas; processamento síncrono suficiente para single-user
**Escala/Abrangência**: Single user, ~centenas de eventos por execução

## Verificação da Constituição

*GATE: Deve ser aprovada antes da pesquisa da Fase 0. Reavaliada após o design da Fase 1.*

| # | Princípio | Status | Evidência / Ação |
|---|-----------|--------|-----------------|
| I | Interação em PT-BR | ✅ PASS | Notificações e mensagens ao usuário em PT-BR |
| II | Confirmação Antes de Ações | ✅ PASS | Nenhuma ação destrutiva; `character_state.json` é atualizado, não sobrescrito com perda de dados |
| III | Pipeline Sequencial | ✅ PASS | Feature terminal — depende de 008; estado persiste entre execuções |
| IV | Dados Estruturados | ✅ PASS | `character_state.json` + `gamification_notifications.json` em `/data/` |
| V | RAG com Validação | ✅ PASS | Sem web search; lê apenas eventos locais |
| VI | Separação de Responsabilidades | ✅ PASS | `gamification_service.js` contém apenas regras de gamificação; routing HTTP fica na spec 008 |
| VII | Observabilidade | ✅ PASS | Logs de processamento via console; notificações em arquivo auditável |
| VIII | Evolução Compatível | ✅ PASS | `character_state.json` tem campo `version`; adição de novos marcos não quebra estado existente |
| IX | Desenvolvimento Orientado ao Aprendizado | ✅ PASS | Padrões nomeados neste plan; tabela de marcos declarativa (legível > compacta) |

**Resultado: GATE PASS** — sem violações constitucionais.

## Padrões de Design Aplicados (Princípio IX)

> Esta seção existe para que você entenda o *porquê* de cada decisão.

### Padrão 1 — Repository (Repositório)

**O que é**: Um objeto que sabe ler e escrever dados de um lugar específico e expõe uma interface limpa.

**Por que usamos aqui**: `character_repository.js` isola toda leitura/escrita de `character_state.json`. Se no futuro migrarmos para SQLite ou banco de dados, só o repository muda — `gamification_service.js` permanece intacto.

**Arquivo**: `repositories/character_repository.js`

---

### Padrão 2 — Service Layer (Camada de Serviço)

**O que é**: O arquivo que contém as regras de negócio, sem saber de onde os dados vêm ou como são persistidos.

**Por que usamos aqui**: "XP de um card bom de relevância alta = 30" é uma regra de negócio — fica em `xp_service.js`. "Nível = Math.floor(xp/100) + 1" é outra regra — fica em `level_service.js`. Esses arquivos não leem arquivos, não fazem HTTP; recebem dados e retornam dados.

**Arquivos**: `services/xp_service.js`, `services/level_service.js`

---

### Padrão 3 — Event Sourcing Simplificado

**O que é**: O estado do sistema é derivado de uma sequência de eventos imutáveis. Em vez de atualizar o estado direto, você processa eventos e o estado é calculado a partir deles.

**Por que usamos aqui**: `flashcard_events.json` e `summary_feedback.json` são logs imutáveis de ações do usuário. O estado do personagem (`character_state.json`) é calculado a partir desses logs. Se o personagem ficar corrompido, basta deletar `character_state.json` e reprocessar os eventos do zero — o estado correto é restaurado. Isso é muito mais robusto que atualizar o estado diretamente.

**Implementado em**: `gamification_service.js` (processador de eventos) + campo `eventos_processados[]` (idempotência)

## Estrutura do Projeto

### Documentação (esta feature)

```text
specs/009-study-gamification/
├── plan.md              # Este arquivo
├── research.md          # Idempotência, integração 008, tabela de marcos (Fase 0)
├── data-model.md        # Personagem, Conquista, Notificação (Fase 1)
├── quickstart.md        # Como testar cada User Story (Fase 1)
├── contracts/
│   └── gamification_module.md  # Interface do módulo JS + feature flags (Fase 1)
└── tasks.md             # Gerado por /speckit.tasks (próximo passo)
```

### Código-Fonte (módulo integrado à spec 008)

```text
.github/skills/study-gamification/
├── gamification_service.js   # Entry point do módulo — getCharacter(), processAllEvents()  [NOVO]
├── process_events.js         # Script standalone para debug/reprocessamento                [NOVO]
│
├── services/
│   ├── xp_service.js         # calcularXP(avaliacao, relevancia) → number                  [NOVO]
│   └── level_service.js      # calcularNivel(xp) → {nivel, xp_para_proximo}               [NOVO]
│                               verificarDesbloqueios(character) → character
│
└── repositories/
    └── character_repository.js # lerPersonagem(dir) / salvarPersonagem(dir, char)          [NOVO]
                                  lerEventos(dir) → {eventos[], feedbacks[]}
                                  appendNotificacao(dir, notif)

# Integração: spec 008 importa este módulo
.github/skills/study-flashcard-web/
└── routes/
    └── character.js  # require('../../study-gamification/gamification_service')            [ATUALIZADO]

data/                  # Runtime
├── character_state.json              # Estado do personagem (escrito pela spec 009)
└── gamification_notifications.json  # Notificações pendentes (escrito pela 009, lido pela 008)
```

**Decisão de Estrutura**: Módulo Node.js sem servidor próprio. A spec 009 não tem `server.js` — é importada pela spec 008. O script `process_events.js` permite uso standalone para debug. Isso segue Constitution VI: regras de gamificação ficam na spec 009, HTTP fica na spec 008.

## Rastreamento de Complexidade

> Sem violações constitucionais a justificar — tabela não aplicável.

## Fases de Implementação

> O detalhamento em tasks individuais é feito pelo `/speckit.tasks`. Esta seção mostra as fases e o padrão aplicado.

### Fase 1 — Repository e Estrutura Base

**Padrão aplicado**: Repository

Cria `character_repository.js` com todas as operações de leitura/escrita de JSON. Sem lógica de negócio — só isolamento de IO.

- `lerPersonagem(workspaceDir)` → personagem padrão se não existir
- `salvarPersonagem(workspaceDir, personagem)`
- `lerEventos(workspaceDir)` → `{ eventos: [], feedbacks: [] }`
- `appendNotificacao(workspaceDir, notificacao)`

**Checkpoint**: `require('./repositories/character_repository').lerPersonagem('../../../')` retorna personagem padrão no nível 1 com 0 XP.

---

### Fase 2 — XP Service e Level Service

**Padrão aplicado**: Service Layer (funções puras)

Implementa os dois serviços de cálculo — funções puras sem IO.

- `xp_service.js`: `calcularXP(avaliacao, relevancia)` com tabela de multiplicadores
- `level_service.js`: `calcularNivel(xpTotal)` → `{ nivel, xpParaProximo }`; `verificarDesbloqueios(personagem)` com array `MARCOS`

**Checkpoint**: `calcularXP("bom", "alta")` = 30; `calcularNivel(250)` = `{ nivel: 3, xpParaProximo: 50 }`; `verificarDesbloqueios({ nivel: 3, conquistas: [] })` retorna conquistas de níveis 1 e 3.

---

### Fase 3 — Gamification Service (processador de eventos)

**Padrão aplicado**: Event Sourcing Simplificado

Implementa `gamification_service.js` que orquestra: ler personagem → ler eventos → filtrar não-processados → calcular XP → atualizar nível → verificar marcos → gerar notificações → salvar.

- `getCharacter(workspaceDir)` → estado atualizado sem campo `eventos_processados`
- `processAllEvents(workspaceDir)` → reprocessamento do zero

**Checkpoint**: Com `flashcard_events.json` criado manualmente, `getCharacter()` retorna personagem com XP correto; segunda chamada sem novos eventos retorna mesmo XP (idempotência).

---

### Fase 4 — Script Standalone e Integração com Spec 008

**Padrão aplicado**: Separação de Responsabilidades

- `process_events.js`: script executável standalone (`node process_events.js`) — chama `processAllEvents()` e imprime resumo em PT-BR
- Atualizar `routes/character.js` da spec 008 para importar e chamar `gamification_service.getCharacter()`

**Checkpoint**: `node .github/skills/study-gamification/process_events.js` → imprime resumo. `curl http://localhost:3000/api/character` → retorna estado real do personagem.

---

### Fase 5 — Notificações e Polimento

- Implementar geração de notificação quando nível sobe: mensagem PT-BR combinando nível + conquista(s)
- `routes/dashboard.js` da spec 008: buscar notificações pendentes e marcar como exibidas
- Revisar todas as mensagens em PT-BR (Constitution I)
- Validar todos os SCs via quickstart.md

## Notas

- **Princípio VIII**: `character_state.json` tem campo `version` — mudanças futuras no schema devem incrementar a versão
- **Princípio IX**: `MARCOS` é um array declarativo em `level_service.js` — fácil de entender e de adicionar novos marcos; preferível a lógica `if/else` encadeada
- **Idempotência**: O campo `eventos_processados[]` é o mecanismo central de segurança — sem ele, XP duplicaria a cada chamada; não remover este campo sem substituto equivalente
- **Integração**: `routes/character.js` da spec 008 deve importar spec 009 com caminho relativo — se a estrutura de diretórios mudar, apenas este import precisa ser atualizado
