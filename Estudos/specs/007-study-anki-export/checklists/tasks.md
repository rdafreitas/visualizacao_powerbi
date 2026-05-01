# Checklist de Tasks: Study Anki Export

**Objetivo**: Validar se as tasks de `007-study-anki-export` estão claras, completas e prontas para implementação — cada item testa a qualidade do que foi escrito nas tasks, não se o código funciona.
**Criado em**: 2026-04-30
**Feature**: [spec.md](../spec.md) | [tasks.md](../tasks.md)

## Completude das Tasks

- [ ] CHK001 A Fase 2 (Fundação) cobre as DUAS componentes: Adapter AnkiConnect (T002–T005, comunicação HTTP) E Repository de dados (T006–T007, leitura de JSON locais) — ambos pré-requisitos para qualquer lógica de negócio? [Completude, plan.md §Fase 1]
- [ ] CHK002 US2 tem task para `detectar_duplicatas()` (T014) separada de `enviar_batch()` (T013) — detecção de entradas `null` no resultado e cálculo de estatísticas são responsabilidades distintas? [Completude, Spec §FR-008]
- [ ] CHK003 US2 tem task para persistir `anki_result_*.json` (T015) com o resultado estruturado da exportação — o Princípio IV (dados estruturados como fonte da verdade) está coberto além do `.txt` de fallback? [Completude, Spec §FR-010, plan.md §Constitution IV]
- [ ] CHK004 US3 tem task para detecção de arquivo de fallback pendente (T018) — quando AnkiConnect volta, o sistema oferece reenviar cards do `.txt` existente em `/data/`? [Completude, Spec §US3 cenário 4]

## Clareza e Responsabilidade Única

- [ ] CHK005 T015 (`exportar_flashcards`) tem responsabilidade única de orquestração — delega montagem para `flashcard_service.py`, envio para `anki_connector.py` e persistência para Foundation, sem reimplementar essas responsabilidades? [Clareza, Princípio VI]
- [ ] CHK006 T011 (`montar_flashcard`) especifica o critério mensurável de truncamento: frente = L0 truncado em 200 chars com "...", verso = versão completa + L1+L2? [Clareza, Spec §edge cases]
- [ ] CHK007 T002 (`verificar_conectividade`) especifica o timeout de 5s explicitamente na descrição da task — parâmetro técnico documentado? [Clareza, plan.md §Constraints]

## Caminhos de Arquivo

- [ ] CHK008 Todas as tasks de US1–US3 especificam o caminho exato em `.github/skills/study-anki/*.py`? [Caminhos]
- [ ] CHK009 A task de output de fallback (T016) referencia o caminho correto `/data/anki_export_<materia>_<YYYY-MM-DD>.txt` e especifica o formato tab-separated (`frente\tverso\ttags`)? [Caminhos, Spec §FR-009]

## Checkpoints e Padrões de Design (Princípio IX)

- [ ] CHK010 O checkpoint da Fase 2 nomeia "Padrão Adapter + Repository" — Adapter = traduz chamadas Python para JSON AnkiConnect; Repository = isola leitura de arquivos JSON locais? [Princípio IX]
- [ ] CHK011 O checkpoint da Fase 3 nomeia "Padrão Service Layer" e explicita que `deck_service.py` não faz HTTP nem lê arquivos — contém APENAS regras de negócio de seleção de deck? [Princípio IX]
- [ ] CHK012 O checkpoint da Fase 5 nomeia "Tratamento Defensivo de Erros" e descreve que verificar conectividade antes de agir (não esperar falha na API) é a essência do padrão? [Princípio IX]

## Cobertura de Histórias de Usuário e Casos de Borda

- [ ] CHK013 T001 explicita que `send_to_anki.py` existente NÃO deve ser alterado — a backward compatibility (Princípio VIII) está documentada como restrição explícita na task? [Caso de Borda, Spec §Assumptions, Princípio VIII]
- [ ] CHK014 SC-002 (0% de duplicatas enviadas) é verificável pela task T014 — a descrição especifica como identificar entradas `null` no resultado do `addNotes` do AnkiConnect? [Mensurabilidade, Spec §SC-002]
- [ ] CHK015 SC-003 (100% de fallbacks quando AnkiConnect indisponível) é verificável pela task T016 — o formato tab-separated e o caminho de destino estão especificados de forma que o arquivo seja importável pelo Anki sem configuração adicional? [Mensurabilidade, Spec §SC-003]

## Paralelismo e Dependências

- [ ] CHK016 T002, T003, T004 e T005 (funções do Adapter AnkiConnect) são independentes entre si e podem ser implementadas em paralelo? [Paralelismo]
- [ ] CHK017 T006 e T007 (Repository: `carregar_topicos` e `carregar_relevancia`) são funções independentes sem dependência mútua? [Paralelismo]
- [ ] CHK018 A dependência US2 → US1 está documentada nas tasks: `exportar_flashcards()` (T015) precisa do deck selecionado por `selecionar_deck()` (T010) como parâmetro de entrada? [Dependências]

## Notas

- Marque os itens como concluídos: `- [x]`
- Esta checklist valida os REQUISITOS das tasks — não testa se o código implementado funciona
- Execute antes de iniciar a Fase 1 e revise novamente antes de iniciar cada US
- **Atenção especial**: CHK013 (não alterar `send_to_anki.py`) é restrição arquitetural — verificar antes de qualquer edição em `.github/skills/study-anki/`
