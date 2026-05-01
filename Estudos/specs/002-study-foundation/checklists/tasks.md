# Checklist de Tasks: Study Foundation

**Objetivo**: Validar se as tasks de `002-study-foundation` estão claras, completas e prontas para implementação — cada item testa a qualidade do que foi escrito nas tasks, não se o código funciona.
**Criado em**: 2026-04-30
**Feature**: [spec.md](../spec.md) | [tasks.md](../tasks.md)

## Completude das Tasks

- [ ] CHK001 As Fases 3–6 cobrem as quatro US da spec, com pelo menos uma task de implementação por US (US1=T005–T011, US2=T012–T014, US3=T015–T016, US4=T017–T021)? [Completude, Spec §US1-US4]
- [ ] CHK002 A Fase 2 tem tasks para as DUAS responsabilidades de `data_contracts.py`: criação de diretórios do workspace (FR-015) E validação de contratos JSON (FR-013)? [Completude, Spec §FR-013, FR-015]
- [ ] CHK003 Há task explícita para escrita atômica de `study-memory.json` (escrever em `.tmp` + rename) cobrindo o requisito de não corromper o arquivo em caso de falha? [Completude, Spec §FR-001]
- [ ] CHK004 A função `migrar_schema()` (T011) tem task própria separada das demais funções de `memory_manager.py` — migração é uma responsabilidade distinta de leitura e escrita? [Completude, Spec §FR-005]

## Clareza e Responsabilidade Única

- [ ] CHK005 Cada task descreve UMA ação concreta (implementar função X com comportamento Y) sem agrupar múltiplas funções distintas em uma única linha de checklist? [Clareza]
- [ ] CHK006 T020 (`executar_fase`) está limitada ao esqueleto Template Method de 4 passos — não acumula responsabilidades de IO, análise ou apresentação junto ao esqueleto? [Clareza, Spec §FR-001, Princípio VI]
- [ ] CHK007 T015 (exibição para usuário) está separada de T016 (persistência de `debug_mode`) — são responsabilidades distintas em tasks distintas? [Clareza, Spec §FR-009]

## Caminhos de Arquivo

- [ ] CHK008 Todas as tasks de implementação (T002–T021) especificam o caminho exato do arquivo alvo em `.github/skills/study-foundation/*.py`? [Caminhos]
- [ ] CHK009 As tasks de criação de diretórios de runtime (T002) referenciam todos os 5 caminhos exatos listados em FR-015: `/data/`, `/logs/`, `/input/editais/`, `/Histórico Anotações/Resumo/`, `/Histórico Anotações/Questões/`? [Caminhos, Spec §FR-015]

## Checkpoints e Padrões de Design (Princípio IX)

- [ ] CHK010 O checkpoint da Fase 3 nomeia explicitamente "Padrão Singleton + Schema Migration" — não apenas descreve o comportamento de retomada? [Princípio IX]
- [ ] CHK011 O checkpoint da Fase 4 nomeia "Padrão Observer Simplificado" e deixa explícito que o chamador não precisa saber como o log é armazenado? [Princípio IX]
- [ ] CHK012 O checkpoint da Fase 6 nomeia "Padrão Template Method" e descreve o esqueleto de 4 passos que será reutilizado pelas specs 003–007? [Princípio IX]

## Cobertura de Histórias de Usuário e Casos de Borda

- [ ] CHK013 US4 tem task de integração entre `confirmation.py` e `state_machine.py` (T021) — não apenas tasks para criar as funções isoladas? [Cobertura, Spec §FR-011]
- [ ] CHK014 O edge case de `study-memory.json` corrompido (fazer backup antes de recriar) está coberto como task explícita na Fase Final (T023)? [Caso de Borda, Spec §edge cases]
- [ ] CHK015 A task de validação do quickstart.md (T024) referencia os critérios SC-001 a SC-006 explicitamente, para que o executor saiba o que verificar? [Mensurabilidade, Spec §Success Criteria]

## Paralelismo e Dependências

- [ ] CHK016 As tasks marcadas [P] (T002/T003, T007/T008, T017/T018) operam em funções distintas sem risco de conflito de escrita simultânea no mesmo arquivo? [Paralelismo]
- [ ] CHK017 A sequência das fases respeita a dependência crítica: US4 (`state_machine.py`) só pode começar após US1 + US2 + US3 estarem estáveis? [Dependências]

## Requisitos Não-Funcionais

- [ ] CHK018 Os requisitos de performance do plan.md (<100ms para leitura/escrita de memória) estão cobertos nas tasks ou explicitamente marcados como fora do escopo desta versão? [Não-Funcional, plan.md §Technical Context]
- [ ] CHK019 FR-014 (comunicação 100% em PT-BR) tem task de revisão na Fase Final (T022) que cobre todos os módulos, não apenas `confirmation.py`? [Completude, Spec §FR-014]

## Notas

- Marque os itens como concluídos: `- [x]`
- Esta checklist valida os REQUISITOS das tasks — não testa se o código implementado funciona
- Execute antes de iniciar a Fase 1 e revise novamente antes de iniciar cada US
