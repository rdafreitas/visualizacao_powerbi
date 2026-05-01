# Checklist de Tasks: Study Relevance Engine

**Objetivo**: Validar se as tasks de `005-study-relevance-engine` estão claras, completas e prontas para implementação — cada item testa a qualidade do que foi escrito nas tasks, não se o código funciona.
**Criado em**: 2026-04-30
**Feature**: [spec.md](../spec.md) | [tasks.md](../tasks.md)

## Completude das Tasks

- [ ] CHK001 A Fase 2 (Repository) tem tasks para TODAS as operações de IO: leitura de `topicos.json` (T002), `questoes.json` (T003), `edital_parsed.json` opcional (T004), verificação de classificação existente (T005), escrita de `relevancia_topicos.json` (T006) e `relevancia_questoes.json` (T007)? [Completude, Spec §FR-007, FR-009]
- [ ] CHK002 US1 tem task explícita para Chain of Evidence (T011) — os três campos obrigatórios `justificativa`, `fontes` e `nivel_confianca` têm validação que lança erro se ausentes? [Completude, Spec §FR-003]
- [ ] CHK003 US3 tem task para `escolher_estrategia()` (T015) separada da orquestração — a seleção entre `EstrategiaComEdital` e `EstrategiaSemEdital` tem task própria com critério explícito? [Completude, Spec §FR-004, FR-005]
- [ ] CHK004 A task T016 (`executar_classificacao`) cobre o cenário de classificação existente (US1 cenário 4): chama `verificar_classificacao_existente()` e pergunta "Reclassificar ou reutilizar?" antes de prosseguir? [Completude, Spec §US1 cenário 4]

## Clareza e Responsabilidade Única

- [ ] CHK005 T010 (`classificar_topicos`) está definida explicitamente como Pure Function — a descrição deixa claro que NÃO faz IO e NÃO chama APIs diretamente? [Clareza, Spec §FR-009, plan.md §Pure Function]
- [ ] CHK006 T008 (`EstrategiaComEdital`) e T009 (`EstrategiaSemEdital`) têm responsabilidades claramente distintas — ComEdital = cruzamento com edital; SemEdital = inferência do modelo com confiança reduzida? [Clareza, Spec §FR-004, FR-005]
- [ ] CHK007 T012 (`classificar_questoes`) define o critério de "tema principal" para questões com múltiplos temas — comportamento especificado de forma mensurável na descrição da task? [Clareza, Spec §US2 cenário 2]

## Caminhos de Arquivo

- [ ] CHK008 Todas as tasks de US1–US3 especificam o caminho exato em `.github/skills/study-relevance/*.py`? [Caminhos]
- [ ] CHK009 As tasks de persistência (T006, T007) referenciam `/data/relevancia_topicos.json` e `/data/relevancia_questoes.json` como destinos com o contrato de dados da spec 002? [Caminhos, Spec §FR-007]

## Checkpoints e Padrões de Design (Princípio IX)

- [ ] CHK010 O checkpoint da Fase 2 nomeia "Padrão Repository" e explicita que a lógica de classificação não conhece arquivos JSON — todo IO está isolado em `relevance_repository.py`? [Princípio IX]
- [ ] CHK011 O checkpoint da Fase 3 nomeia "Padrão Pure Function + Strategy" — Pure Function = sem IO nem efeitos colaterais; Strategy = duas estratégias intercambiáveis sem alterar o classificador? [Princípio IX]
- [ ] CHK012 O checkpoint da Fase 5 nomeia "Padrão Service Layer" e descreve que `relevance_service.py` é o único arquivo que conhece todos os outros — orquestra Repository + Strategies + Classifier? [Princípio IX]

## Cobertura de Histórias de Usuário e Casos de Borda

- [ ] CHK013 O edge case de `topicos.json` vazio tem task de tratamento explícita na Fase Final (T019) — o sistema informa "Não há tópicos para classificar" em PT-BR? [Caso de Borda, Spec §edge cases]
- [ ] CHK014 O edge case de classificação não-discriminativa (todos os tópicos com mesmo nível) tem task de alerta (T020) que sugere fornecer edital quando ausente? [Caso de Borda, Spec §edge cases]
- [ ] CHK015 SC-004 (motor sem IO direto) é verificável pela task T010 — a descrição explicita que `classificar_topicos()` NÃO lê arquivos nem escreve, operando apenas sobre parâmetros recebidos? [Mensurabilidade, Spec §SC-004]

## Paralelismo e Dependências

- [ ] CHK016 T002, T003, T004 e T005 (quatro operações de leitura no Repository) são funções independentes que podem ser implementadas em paralelo? [Paralelismo]
- [ ] CHK017 T008 e T009 (duas estratégias) são classes independentes que podem ser desenvolvidas em paralelo sem dependência mútua? [Paralelismo]
- [ ] CHK018 A dependência US2 → US1 está implícita mas documentada: T012 (`classificar_questoes`) reutiliza `relevance_classifier.py` criado em US1 — T010 deve estar implementada antes de T012? [Dependências]

## Notas

- Marque os itens como concluídos: `- [x]`
- Esta checklist valida os REQUISITOS das tasks — não testa se o código implementado funciona
- Execute antes de iniciar a Fase 1 e revise novamente antes de iniciar cada US
- **Atenção especial**: CHK005 (Pure Function sem IO) é o invariante mais importante desta spec — qualquer task que adicione IO ao `relevance_classifier.py` viola o Princípio VI e FR-009
