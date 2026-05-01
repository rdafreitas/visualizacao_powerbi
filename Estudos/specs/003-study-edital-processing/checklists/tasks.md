# Checklist de Tasks: Study Edital Processing

**Objetivo**: Validar se as tasks de `003-study-edital-processing` estão claras, completas e prontas para implementação — cada item testa a qualidade do que foi escrito nas tasks, não se o código funciona.
**Criado em**: 2026-04-30
**Feature**: [spec.md](../spec.md) | [tasks.md](../tasks.md)

## Completude das Tasks

- [ ] CHK001 A Fase 2 (Fundação) tem task explícita para `verificar_prerequisitos()` (T002) que orienta o usuário a executar spec 002 primeiro quando os diretórios estão ausentes? [Completude, Spec §Dependencies]
- [ ] CHK002 US1 tem tasks separadas para a conversão Facade (T005/T006) E para a detecção de reprocessamento — as duas responsabilidades não estão agrupadas numa única task? [Completude, Spec §US1 cenário 3]
- [ ] CHK003 US2 tem tasks para as TRÊS estratégias de extração em tasks paralelas distintas: conteúdo programático (T007), banca/cargo (T008), distribuição de vagas (T009)? [Completude, Spec §FR-004]
- [ ] CHK004 US3 tem task para a função de orquestração `orquestrar_processamento_edital()` (T016) que integra todas as fases em sequência com log via Foundation? [Completude, Spec §FR-009, FR-010]

## Clareza e Responsabilidade Única

- [ ] CHK005 T005 (`converter_para_markdown`) tem responsabilidade única de conversão — a detecção de reprocessamento por hash está em T006 separada? [Clareza, Princípio VI]
- [ ] CHK006 Cada estratégia de extração (T007, T008, T009) cobre um único padrão de edital — não há estratégia acumulando múltiplos tipos de extração? [Clareza, Princípio IX]
- [ ] CHK007 T010 (`extrair` via Chain of Responsibility) está claramente definida como aplicar estratégias em sequência, sem saber quantas estratégias existem — extensível sem alterar T010? [Clareza, plan.md §Fase 2]

## Caminhos de Arquivo

- [ ] CHK008 Todas as tasks de US1–US3 especificam o caminho exato em `.github/skills/study-edital/*.py`? [Caminhos]
- [ ] CHK009 As tasks de persistência (T012, T013) referenciam explicitamente `/data/edital_parsed.json` como destino e o contrato de dados da spec 002 (meta + data)? [Caminhos, Spec §FR-006, FR-007]

## Checkpoints e Padrões de Design (Princípio IX)

- [ ] CHK010 O checkpoint da Fase 3 nomeia "Padrão Facade" e explicita que MarkItDown é encapsulado — o restante do código não sabe que MarkItDown existe? [Princípio IX]
- [ ] CHK011 O checkpoint da Fase 4 nomeia "Padrão Chain of Responsibility + Strategy" com a distinção entre os dois: Chain aplica em sequência; Strategy define como extrair? [Princípio IX]
- [ ] CHK012 O checkpoint da Fase 5 nomeia "Padrão Repository + Service Layer" com responsabilidades claramente distintas: Repository = IO; Service = orquestração? [Princípio IX]

## Cobertura de Histórias de Usuário e Casos de Borda

- [ ] CHK013 A natureza **opcional** desta spec (edital ausente = spec 005 usa inferência do modelo) está refletida na task de verificação de pré-requisitos, não impedindo o pipeline de funcionar sem ela? [Cobertura, Spec §Assumptions]
- [ ] CHK014 O edge case de PDF sem texto extraível (protegido, escaneado) tem task de tratamento explícita (T018) com mensagem PT-BR orientando o usuário? [Caso de Borda, Spec §US1 cenário 2]
- [ ] CHK015 T011 (validação de resultado mínimo de `extrair()`) especifica um critério mensurável: ao menos o conteúdo programático deve ter sido extraído? [Mensurabilidade, Spec §FR-005]

## Paralelismo e Dependências

- [ ] CHK016 T007, T008 e T009 (estratégias paralelas) operam cada uma em uma classe distinta do mesmo arquivo sem conflito de escrita simultânea? [Paralelismo]
- [ ] CHK017 A dependência US2 → US1 está explícita nas tasks: US2 precisa do Markdown gerado por US1 para poder extrair dados? [Dependências]
- [ ] CHK018 A dependência desta spec com a spec 002 está clara: Foundation deve estar implementada antes de T002 (`verificar_prerequisitos`) ser executada? [Dependências, Spec §Dependencies]

## Notas

- Marque os itens como concluídos: `- [x]`
- Esta checklist valida os REQUISITOS das tasks — não testa se o código implementado funciona
- Execute antes de iniciar a Fase 1 e revise novamente antes de iniciar cada US
