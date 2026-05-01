# Checklist de Tasks: Study Summary Generation

**Objetivo**: Validar se as tasks de `004-study-summary-generation` estão claras, completas e prontas para implementação — cada item testa a qualidade do que foi escrito nas tasks, não se o código funciona.
**Criado em**: 2026-04-30
**Feature**: [spec.md](../spec.md) | [tasks.md](../tasks.md)

## Completude das Tasks

- [ ] CHK001 As 4 fases de implementação do plan.md (Facade, Strategy, Builder, Repository+alinhamento) têm correspondência direta nas Fases 3–6 das tasks? [Completude, plan.md §Fases]
- [ ] CHK002 US2 tem tasks para as QUATRO estratégias de separação em tasks paralelas distintas: Enunciado (T008), Alternativas (T009), Gabarito (T010), Default (T011)? [Completude, Spec §FR-002]
- [ ] CHK003 US3 tem task específica para `validar_limite_l2()` (T016) — a regra de 15 palavras em L2 é verificável de forma independente antes de persistir o outline? [Completude, Spec §FR-007]
- [ ] CHK004 US4 tem task para `calibrar_granularidade()` (T023) que distingue o comportamento com referência (±20%) do comportamento sem referência (padrão default + aviso ao usuário)? [Completude, Spec §FR-008, FR-009]

## Clareza e Responsabilidade Única

- [ ] CHK005 T018 (`gerar_outline`) tem responsabilidade única de orquestração — chama Claude + valida L2 + delega montagem ao Builder, sem fazer persistência? [Clareza, Princípio VI]
- [ ] CHK006 T017 (`construir_arvore`) está separada de T014 (`classificar_linha_nivel`) — montar a árvore e classificar cada linha são duas responsabilidades distintas em tasks distintas? [Clareza, plan.md §Builder]
- [ ] CHK007 T003 (verificação de `markitdown` com instrução ao usuário) está claramente definida como pré-condição de setup, não como task de implementação de lógica? [Clareza]

## Caminhos de Arquivo

- [ ] CHK008 Todas as tasks de US1–US4 especificam o caminho exato em `.github/skills/study-summary/*.py`? [Caminhos]
- [ ] CHK009 As tasks de persistência (T019, T020, T021) referenciam os arquivos de destino corretos: `topicos.json`, `questoes.json` e `_topicos.txt`? [Caminhos, Spec §FR-003, FR-010]
- [ ] CHK010 T015 (`gerar_id_topico`) especifica os formatos exatos de ID: L0=`t001`, L1=`t001.1`, L2=`t001.1.1`, L3=`t001.1.1.1` — critério mensurável? [Caminhos/Clareza, Spec §FR-005, FR-011]

## Checkpoints e Padrões de Design (Princípio IX)

- [ ] CHK011 O checkpoint da Fase 3 nomeia "Padrão Facade" e explicita que MarkItDown está encapsulado — o restante do pipeline recebe string Markdown sem saber que MarkItDown existe? [Princípio IX]
- [ ] CHK012 O checkpoint da Fase 4 nomeia "Padrão Strategy" e explica que adicionar suporte a novo padrão de concurso = criar nova classe sem alterar `separar_conteudo()`? [Princípio IX]
- [ ] CHK013 O checkpoint da Fase 5 nomeia "Padrão Builder" e distingue as duas responsabilidades separadas em tasks: classificar linha (T014) vs. montar árvore (T017)? [Princípio IX]
- [ ] CHK014 O checkpoint da Fase 6 nomeia "Padrão Repository" e confirma que todo IO de arquivo está isolado em `topic_repository.py` — nenhum outro módulo escreve em `/data/`? [Princípio IX]

## Cobertura de Histórias de Usuário e Casos de Borda

- [ ] CHK015 O edge case de ambiguidade matéria/questão (conteúdo pode ser os dois) tem tratamento explícito nas tasks de US2 ou está coberto pela `EstrategiaDefault`? [Caso de Borda, Spec §edge cases]
- [ ] CHK016 A task de validação do quickstart.md (T026) referencia os critérios SC-001 a SC-005 — especialmente SC-004 (100% das linhas L2 com ≤15 palavras)? [Mensurabilidade, Spec §SC-004]
- [ ] CHK017 US4 (alinhamento editorial) está claramente marcada como incremento opcional — suas tasks não são pré-requisito bloqueante para US1–US3? [Dependências, Spec §US4]

## Paralelismo e Dependências

- [ ] CHK018 T008, T009, T010 e T011 (quatro estratégias paralelas em US2) operam em classes distintas sem dependência mútua? [Paralelismo]
- [ ] CHK019 T019, T020, T021 e T022 (funções de Repository em US4) são independentes entre si e podem ser desenvolvidas em paralelo? [Paralelismo]
- [ ] CHK020 A sequência US1 → US2 → US3 → US4 está explícita nas tasks: cada US depende da anterior para ter seus dados de entrada prontos? [Dependências]

## Notas

- Marque os itens como concluídos: `- [x]`
- Esta checklist valida os REQUISITOS das tasks — não testa se o código implementado funciona
- Execute antes de iniciar a Fase 1 e revise novamente antes de iniciar cada US
- **Atenção especial**: SC-004 (limite de 15 palavras em L2) é o critério de qualidade mais específico desta spec — verificar T016 antes de implementar US3
