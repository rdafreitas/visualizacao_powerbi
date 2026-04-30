# Implementation Plan: Study Edital Processing

**Branch**: `003-study-edital-processing` | **Date**: 2026-04-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-study-edital-processing/spec.md`

## Summary

Pipeline completo de ingestão e parsing de editais de concursos públicos: detecta PDFs em
`/input/editais/`, converte cada um para Markdown via MarkItDown (biblioteca externa), extrai
campos estruturados (cargo, banca, matérias, conteúdo programático, pesos) usando heurísticas
tolerantes a variações de formato, e persiste os dados em `/data/edital_parsed.json` — contrato
compartilhado com as specs subsequentes (005, 006, 007).

A implementação aplica 4 padrões de design explícitos (Princípio IX da constituição):
**Facade**, **Strategy**, **Chain of Responsibility** e **Validação de Invariantes**.
Cada padrão está explicado na seção [Padrões de Design](#padrões-de-design-aplicados-princípio-ix)
abaixo — aprenda os nomes, pois você os encontrará em todo projeto Python.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: `markitdown` (externa — `pip install markitdown`); `re`, `json`,
`pathlib`, `hashlib` (todas stdlib — sem instalação adicional)
**Storage**: `/input/editais/` (input — PDFs do usuário); `/data/editais_md/` (output
intermediário — Markdowns convertidos); `/data/edital_parsed.json` (output final — dados
estruturados, contrato desta spec)
**Testing**: Manual com PDF de edital real colocado em `/input/editais/`
**Target Platform**: Windows, Python 3.11+, executado como skill pelo agente
**Project Type**: CLI skill (script reutilizável invocado pelo agente)
**Performance Goals**: Conversão + parsing de um edital concluídos em menos de 2 minutos de
interação ativa do usuário
**Constraints**: O PDF deve ter texto extraível (não pode ser documento escaneado/imagem).
MarkItDown não consegue extrair texto de PDFs puramente imagéticos.
**Scale/Scope**: Single user, 1 a 5 editais por sessão

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Princípio | Status | Evidência / Ação |
|---|-----------|--------|-----------------|
| I | Interação em PT-BR | PASS | Todas as mensagens ao usuário em PT-BR (FR-001 a FR-010) |
| II | Confirmação Antes de Ações | PASS | Confirmação antes de reconverter PDF existente (US1-AS2) e antes de salvar com dados parciais (US2-AS2) |
| III | Pipeline Sequencial | PASS | Esta feature é fase 3 do pipeline; depende de 002 (Foundation) para memória e logging |
| IV | Dados Estruturados | PASS | Output é `edital_parsed.json` com estrutura canônica `meta` + `data`; contrato documentado em `contracts/` |
| V | RAG com Validação | PASS | Sem web search; lê apenas PDFs locais fornecidos pelo usuário |
| VI | Separação de Responsabilidades | PASS | 5 arquivos com responsabilidade única cada (ver Estrutura abaixo) |
| VII | Observabilidade | PASS | Logs via Foundation (spec 002) em `/logs/execution_log.json`; FR-009 exige registro de campos extraídos/falhos |
| VIII | Evolução Compatível | PASS | Lê campo `version` do JSON de saída; campos não encontrados marcados como `null` (não omitidos) — consumidores não quebram |
| IX | Desenvolvimento Orientado ao Aprendizado | PASS | 4 padrões nomeados e explicados neste plan; tasks terão responsabilidade única |

**Resultado: GATE PASS** — sem violações. Observação em VIII: campos ausentes usam `null`
explícito (FR-008) para que consumidores possam distinguir "campo não encontrado" de
"campo não tentado".

## Padrões de Design Aplicados (Princípio IX)

> Esta seção existe para que você entenda o *porquê* de cada decisão.
> Aprenda o nome de cada padrão — você os encontrará em todo projeto Python.

### Padrão 1 — Facade (Fachada)

**O que é**: Uma camada fina que esconde a complexidade de uma biblioteca externa atrás de
uma interface simples. "Fachada" como em arquitetura: o que você vê da rua (interface limpa)
esconde toda a estrutura interna do prédio (complexidade da biblioteca).

**Por que usamos aqui**: O MarkItDown é uma biblioteca externa com sua própria API. Em vez
de espalhar chamadas ao MarkItDown por todo o código, um único arquivo (`pdf_converter.py`)
centraliza essa interação. Se amanhã o MarkItDown mudar de API ou quisermos trocar por outra
biblioteca, só `pdf_converter.py` precisa ser atualizado — o restante do código chama
`converter_pdf(caminho)` e não sabe que o MarkItDown existe.

**Arquivo**: `pdf_converter.py`

---

### Padrão 2 — Strategy (Estratégia)

**O que é**: Define uma família de algoritmos intercambiáveis. O código principal não sabe
qual algoritmo está sendo executado — apenas chama "executar estratégia". Pense em GPS:
você pede "rota mais rápida" ou "rota com menos pedágio" sem saber como cada algoritmo
funciona internamente.

**Por que usamos aqui**: Editais brasileiros variam muito em formato. Alguns listam matérias
em tabelas, outros em bullet lists, outros em parágrafos corridos. Em vez de um `if/elif`
gigante, cada formato vira uma estratégia independente: `EstrategiaTabela`,
`EstrategiaBulletList`, `EstrategiaParagrafo`. O código principal apenas itera as estratégias
disponíveis — adicionar um novo formato é criar um novo arquivo, sem tocar no código existente.

**Arquivo**: `extraction_strategies.py`

---

### Padrão 3 — Chain of Responsibility (Cadeia de Responsabilidade)

**O que é**: Uma sequência de "handlers" (tratadores) onde cada um tenta resolver o
problema. Se o primeiro falhar, passa para o próximo. Se o segundo falhar, passa para o
terceiro. Como uma fila de suporte: atendente junior tenta → se não resolver, escala para
sênior → se não resolver, escala para especialista.

**Por que usamos aqui**: A extração de matérias é tentada em sequência crescente de
complexidade: (1) tenta extrair de tabelas Markdown — mais preciso; (2) se falhar, tenta
bullet lists — mais comum; (3) se falhar, tenta parágrafos corridos — mais tolerante.
O resultado da primeira estratégia que funcionar é retornado. Isso permite que o edital
seja processado mesmo com formato irregular, sem que o código precise saber de antemão
qual formato vai encontrar.

**Arquivo**: `edital_extractor.py` (orquestra a cadeia); `extraction_strategies.py`
(cada estratégia individual)

---

### Padrão 4 — Validação de Invariantes

**O que é**: "Invariante" é uma condição que DEVE ser verdadeira para que os dados sejam
válidos. Verificar invariantes antes de salvar garante que nunca persistiremos dados
corrompidos — é como uma checagem de qualidade na linha de montagem antes do produto sair
da fábrica.

**Por que usamos aqui**: FR-006 exige que pelo menos `banca` E pelo menos uma `materia`
sejam extraídas antes de salvar. Se essa condição não for satisfeita, o JSON não é salvo
e o usuário é informado. Isso protege os consumidores desta spec (005, 006, 007) de
receberem dados inválidos e falharem silenciosamente.

**Implementado em**: `edital_service.py` (validação antes de chamar o Repository)

## Project Structure

### Documentação (esta feature)

```text
specs/003-study-edital-processing/
├── plan.md              # Este arquivo
├── spec.md              # Especificação original da feature
├── research.md          # Pesquisa: MarkItDown + heurísticas + decisões (Phase 0)
├── data-model.md        # Entidades: Edital, MateriaEdital, fluxo de dados (Phase 1)
├── quickstart.md        # Como testar cada User Story manualmente (Phase 1)
├── contracts/
│   └── edital_parsed_contract.md   # Contrato: schema do JSON de saída (Phase 1)
└── tasks.md             # Gerado por /speckit.tasks (próximo passo)
```

### Código-Fonte (skill reutilizável)

```text
.github/skills/study-edital/
├── pdf_converter.py        # Facade — converte PDF em Markdown via MarkItDown     [NOVO]
├── extraction_strategies.py # Strategy — estratégias individuais de parsing        [NOVO]
├── edital_extractor.py     # Chain of Responsibility — orquestra tentativas        [NOVO]
├── edital_repository.py    # Repository — salva/lê edital_parsed.json             [NOVO]
└── edital_service.py       # Service — orquestra conversão + extração + validação  [NOVO]

input/editais/              # Input do usuário — PDFs de editais (não deletar após processar)
data/editais_md/            # Output intermediário — Markdowns convertidos
data/edital_parsed.json     # Output final — dados estruturados (contrato desta spec)

logs/
└── execution_log.json      # Logs estruturados (spec 002 Foundation)
```

**Structure Decision**: Single project — CLI skill. Cada arquivo tem responsabilidade única
(Princípio VI). O `edital_service.py` é o ponto de entrada desta feature; os demais arquivos
são bibliotecas internas chamadas por ele. A separação Facade / Strategy / Chain /
Repository / Service reflete os 4 padrões de design desta feature.

## Complexity Tracking

> Sem violações constitucionais a justificar — tabela não aplicável.

## Fases de Implementação (Visão Geral)

> O detalhamento em tasks individuais é feito pelo `/speckit.tasks`. Esta seção mostra
> as fases e o padrão aplicado em cada uma — para que você entenda a sequência lógica
> antes de ver as tasks.

### Fase 1 — Facade PDF para Markdown (Fundação desta feature)

**Padrão aplicado**: Facade

Cria `pdf_converter.py` — a fachada que isola o MarkItDown do restante do código.
Sem esta fase, não há Markdown para extrair; todas as outras fases dependem desta.

Responsabilidades desta fase:
- Instalar MarkItDown (`pip install markitdown`) e verificar que funciona
- Implementar `converter_pdf(caminho_pdf) -> str` (retorna texto Markdown)
- Implementar `detectar_pdfs(diretorio) -> list[Path]` (lista PDFs em `/input/editais/`)
- Tratar erros: PDF protegido por senha, PDF sem texto extraível, arquivo não encontrado
- Salvar Markdown convertido em `/data/editais_md/<nome_arquivo>.md`
- Detectar se Markdown já existe e perguntar ao usuário se deseja reconverter (US1-AS2)

**Checkpoint desta fase**: Com um PDF de edital em `/input/editais/`, executar
`pdf_converter.py` diretamente e verificar que `/data/editais_md/<nome>.md` é gerado com
conteúdo legível.

---

### Fase 2 — Extração Estruturada (Chain of Responsibility + Strategy)

**Padrões aplicados**: Chain of Responsibility + Strategy

Cria `extraction_strategies.py` (as estratégias individuais) e `edital_extractor.py`
(a cadeia que as orquestra). Esta fase transforma Markdown bruto em dados estruturados.

Responsabilidades desta fase:
- Implementar `EstrategiaTabela`: extrai matérias de tabelas Markdown (`| Matéria | Peso |`)
- Implementar `EstrategiaBulletList`: extrai matérias de listas com marcadores (`- Direito`)
- Implementar `EstrategiaParagrafo`: extrai matérias de parágrafos por keywords conhecidas
- Implementar heurísticas de detecção de seções: keywords como "Conteúdo Programático",
  "Conhecimentos Específicos", "Disciplinas", "Provas", "Quadro de Vagas"
- Implementar `EditalExtractor.extrair(markdown) -> dict` que tenta cada estratégia em
  sequência e retorna o melhor resultado
- Suportar múltiplos cargos: detectar e apresentar lista ao usuário (US2-AS3)
- Marcar campos não extraídos como `null` (FR-008)

**Checkpoint desta fase**: Com um arquivo `.md` em `/data/editais_md/`, executar
`edital_extractor.py` diretamente e verificar que o dicionário retornado contém pelo menos
`banca` e uma `materia`.

---

### Fase 3 — Repository e Service (Integração e Validação)

**Padrões aplicados**: Repository + Validação de Invariantes

Cria `edital_repository.py` (persiste e lê JSON) e `edital_service.py` (orquestra tudo
e valida antes de salvar). Esta fase une as fases anteriores em um fluxo completo.

Responsabilidades desta fase:
- Implementar `EditalRepository.salvar(edital_dict)` — salva em `/data/edital_parsed.json`
  com estrutura `meta` + `data` (contrato da spec 002)
- Implementar `EditalRepository.carregar() -> dict | None` — lê o JSON existente
- Implementar `edital_service.processar_edital(caminho_pdf)` — fluxo completo:
  converter → extrair → validar invariante → salvar → logar
- Validação de invariante: banca E pelo menos uma matéria devem estar presentes
- Registrar no log: quais campos foram extraídos, quais falharam, qual estratégia foi usada
- Interface de consulta: `edital_service.obter_materias() -> list[dict]` para spec 005

**Checkpoint desta fase**: Fluxo end-to-end — colocar PDF em `/input/editais/`, executar
`edital_service.py` e verificar que `/data/edital_parsed.json` é gerado com estrutura
correta e que `/logs/execution_log.json` contém a entrada de log desta execução.
