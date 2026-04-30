# Implementation Plan: Study Summary Generation

**Branch**: `004-study-summary-generation` | **Data**: 2026-04-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-study-summary-generation/spec.md`

## Summary

Pipeline principal de transformação de materiais de estudo: converte PDF para Markdown via
MarkItDown, separa matéria explicativa e questões, gera resumo hierárquico no formato outline
L0–L3 com auxílio do agente Claude, alinha com referência editorial do usuário, e persiste
os artefatos estruturados em `topicos.json`, `questoes.json` e `_topicos.txt`.

Estes artefatos são o contrato de dados central do projeto — todas as specs downstream
(005 relevância, 006 publicação Google Docs, 007 exportação Anki) os consomem como fonte
primária. Um usuário que executa apenas esta spec já obtém valor imediato: resumo estruturado
dos seus materiais de estudo.

A implementação aplica 4 padrões de design explícitos (Princípio IX da constituição):
**Pipeline**, **Strategy**, **Builder** e **Repository**.
Cada padrão está explicado na seção [Padrões de Design](#padrões-de-design-aplicados-princípio-ix)
abaixo — aprenda os nomes, pois você os encontrará em todo projeto Python.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: `markitdown` (pip install markitdown); `re`, `json`, `pathlib`,
`hashlib`, `datetime` (todos stdlib — sem pip adicional); Claude API (via agente) para
geração do outline L0–L3
**Storage**: JSON em `/data/` — escrita: `topicos.json`, `questoes.json`;
escrita de texto: `_topicos.txt` (outline formatado para leitura humana)
**Testing**: Manual com material de estudo real (PDF de concurso); testes independentes
por User Story
**Target Platform**: Windows, Python 3.11+, executado como skill pelo agente Claude
**Project Type**: CLI skill com invocação do agente Claude para geração de outline
**Performance Goals**: Pipeline completo (PDF → outline + JSON) concluído em menos de 5
minutos para materiais de 10 a 200 páginas
**Constraints**: Linhas L2 no outline DEVEM respeitar limite de 15 palavras; conteúdo
excedente DEVE ser delegado para L3; sem dependências além de `markitdown`
**Scale/Scope**: Usuário único, um PDF por sessão, materiais de 10–200 páginas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Princípio | Status | Evidência / Ação |
|---|-----------|--------|-----------------|
| I | Interação em PT-BR | ✅ PASS | Todas as mensagens ao usuário em PT-BR (FR-001 a FR-012) |
| II | Confirmação Antes de Ações | ✅ PASS | Confirmar reconversão de PDF já existente (US1, cenário 3); confirmar ambiguidade matéria/questão (edge case) |
| III | Pipeline Sequencial | ✅ PASS | Feature é núcleo do pipeline — depende de 002 (Foundation); alimenta 005, 006, 007 |
| IV | Dados Estruturados | ✅ PASS | Gera `topicos.json` e `questoes.json` como fonte da verdade; inclui `meta.source_hash` para detectar inconsistência |
| V | RAG com Validação | ✅ PASS | Claude gera outline a partir do Markdown local — sem web search; texto de entrada validado antes de envio |
| VI | Separação de Responsabilidades | ✅ PASS | 5 arquivos com responsabilidade única: `pdf_converter.py`, `content_splitter.py`, `outline_builder.py`, `topic_repository.py`, `summary_service.py` |
| VII | Observabilidade | ✅ PASS | Logs via Foundation (spec 002) em `/logs/execution_log.json`; cada etapa do pipeline registra início, fim e status |
| VIII | Evolução Compatível | ✅ PASS | `topicos.json` inclui campo `version`; sem breaking change nos contratos consumidos por specs 005/006/007 |
| IX | Desenvolvimento Orientado ao Aprendizado | ✅ PASS | 4 padrões de design nomeados e explicados neste plan; tasks terão responsabilidade única; decisões documentadas com o *porquê* |

**Resultado: GATE PASS** — sem violações. Observação em IV resolvida: `meta.source_hash`
detecta substituição de PDF sem aviso ao usuário.

## Padrões de Design Aplicados (Princípio IX)

> Esta seção existe para que você entenda o *porquê* de cada decisão.
> Aprenda o nome de cada padrão — você os encontrará em todo projeto Python.

### Padrão 1 — Pipeline (Tubulação)

**O que é**: Um padrão onde os dados fluem sequencialmente por etapas encadeadas, e a saída
de uma etapa é a entrada da próxima. O nome vem dos "pipes" do terminal Unix: você encadeia
comandos com `|` e os dados fluem de um para o outro. Em Python, cada etapa é uma função
ou classe com responsabilidade única.

**Por que usamos aqui**: O processamento de um material de estudo é naturalmente sequencial
— PDF deve ser convertido antes de ser dividido, a matéria deve ser separada antes de virar
outline, o outline deve existir antes de ser persistido. O Pipeline torna essa ordem explícita
e garante que cada etapa só receba dados já validados pela etapa anterior.

**Fluxo desta feature**:
```
PDF → [pdf_converter] → Markdown → [content_splitter] → {matéria, questões}
    → [outline_builder] → Outline L0–L3 → [topic_repository] → topicos.json + _topicos.txt
```

**Arquivo orquestrador**: `summary_service.py`

---

### Padrão 2 — Strategy (Estratégia)

**O que é**: Um padrão onde você define uma "família" de algoritmos intercambiáveis e o
código principal não sabe qual está ativa. O nome vem de estratégias militares: você pode
trocar a estratégia sem mudar o general. Em Python, diferentes estratégias são classes ou
funções que seguem a mesma assinatura (recebem os mesmos parâmetros e retornam o mesmo tipo).

**Por que usamos aqui**: Detectar se um bloco de texto é "matéria" ou "questão" não tem
uma única solução universal. Diferentes materiais de concurso usam padrões diferentes:
alguns têm a palavra "Questão", outros têm numeração `01.`, outros têm alternativas
`A)`, `B)`. Em vez de um único `if/elif` gigante, cada heurística é uma estratégia
separada. O `content_splitter.py` tenta as estratégias em sequência e usa a primeira que
detectar padrão com confiança suficiente.

**Estratégias implementadas**:
- `EstrategiaEnunciado`: detecta padrões de enunciado ("Questão", "Q.", "01.")
- `EstrategiaAlternativas`: detecta alternativas (linhas começando com "A)", "B)", etc.)
- `EstrategiaGabarito`: detecta seções de gabarito ("Gabarito", "Resposta:")
- `EstrategiaDefault`: trata como matéria se nenhuma outra estratégia confirmar

**Arquivo**: `content_splitter.py`

---

### Padrão 3 — Builder (Construtor)

**O que é**: Um padrão para construir objetos complexos passo a passo. O nome é literal:
um "construtor" que monta a estrutura peça por peça antes de entregar o produto final.
É útil quando o objeto tem muitas partes e a ordem de montagem importa. Em Python, o
Builder tipicamente tem métodos como `adicionar_nivel0()`, `adicionar_nivel1()` e um
método `construir()` que retorna o resultado final.

**Por que usamos aqui**: O outline hierárquico L0–L3 é uma estrutura complexa — cada nó
tem `id`, `level`, `text` e uma lista de `children` que podem ter seus próprios `children`.
Construir isso diretamente a partir do texto bruto do Claude seria uma mistura confusa de
parsing e montagem. O Builder separa as duas responsabilidades: o `outline_builder.py`
recebe os nós um a um (já classificados por nível) e monta a árvore hierárquica correta,
incluindo a geração automática de IDs (`t001`, `t001.1`, `t001.1.1`).

**Arquivo**: `outline_builder.py`

---

### Padrão 4 — Repository (Repositório)

**O que é**: Um objeto que sabe ler e escrever dados de um lugar específico (arquivo, banco
de dados, API) e expõe uma interface limpa para o restante do código. O restante do código
não sabe nem precisa saber de onde os dados vêm ou para onde vão.

**Por que usamos aqui**: A lógica de negócio (como gerar um outline) não deve precisar
saber que os dados serão salvos em arquivos JSON em `/data/`. O `topic_repository.py` lê e
escreve `topicos.json`, `questoes.json` e `_topicos.txt`. Se no futuro mudarmos para um
banco de dados SQLite ou uma API, só o Repository muda — o restante do código continua
idêntico.

**Arquivo**: `topic_repository.py`

## Project Structure

### Documentation (esta feature)

```text
specs/004-study-summary-generation/
├── plan.md              # Este arquivo
├── spec.md              # Especificação original da feature
├── research.md          # Pesquisa: schemas, decisões, heurísticas (Phase 0)
├── data-model.md        # Entidades: Topico, Questao, Outline (Phase 1)
├── quickstart.md        # Como testar cada User Story manualmente (Phase 1)
├── contracts/
│   ├── topicos_json_contract.md   # Contrato completo de topicos.json
│   └── questoes_json_contract.md  # Contrato completo de questoes.json
└── tasks.md             # Gerado por /speckit.tasks (próximo passo)
```

### Source Code (skill reutilizável)

```text
.github/skills/study-summary/
├── pdf_converter.py      # Facade — converte PDF para Markdown via MarkItDown    [NOVO]
├── content_splitter.py   # Strategy — separa matéria explicativa de questões     [NOVO]
├── outline_builder.py    # Builder — monta hierarquia L0-L3 a partir do outline  [NOVO]
├── topic_repository.py   # Repository — salva/lê topicos.json e questoes.json    [NOVO]
└── summary_service.py    # Pipeline — orquestra todo o fluxo (ponto de entrada)  [NOVO]

data/                     # Runtime — criado pela spec 002 (Foundation)
├── topicos.json          # Tópicos estruturados L0-L3 (contrato canônico)
├── questoes.json         # Questões com alternativas e gabarito
└── _topicos.txt          # Outline formatado para leitura humana

logs/
└── execution_log.json    # Logs estruturados (spec 002 Foundation)
```

**Structure Decision**: Single project — CLI skill. O `summary_service.py` é o ponto de
entrada invocado pelo agente; os demais arquivos são bibliotecas internas chamadas por ele.
O `pdf_converter.py` é novo (não reutiliza código da spec 003) pois a spec 003 processa
editais e esta processa material de estudo — finalidades distintas, mas ambas usam MarkItDown.

## Complexity Tracking

> Sem violações constitucionais a justificar — tabela não aplicável.

## Fases de Implementação (Visão Geral)

> O detalhamento em tasks individuais é feito pelo `/speckit.tasks`. Esta seção mostra
> as fases e o padrão aplicado em cada uma — para que você entenda a sequência lógica
> antes de ver as tasks.

### Fase 1 — Converter PDF para Markdown (Facade + MarkItDown)

**Padrão aplicado**: Facade (fachada — interface simplificada sobre MarkItDown)

Implementa `pdf_converter.py`, que expõe uma função `converter_pdf(caminho_pdf) -> str`
simples. Internamente usa MarkItDown, verifica se o PDF tem texto extraível, detecta PDF
já convertido (via hash SHA-256) e registra log da operação.

**Por que Facade?**: MarkItDown tem sua própria interface. O Facade envolve essa interface
em algo simples e específico para esta feature — o restante do pipeline não precisa saber
que MarkItDown existe.

**Checkpoint desta fase**: Dado um PDF com texto extraível, `pdf_converter.py` gera o
Markdown correspondente e registra log de sucesso.

---

### Fase 2 — Separar Matéria e Questões (Strategy)

**Padrão aplicado**: Strategy (estratégia intercambiável de detecção)

Implementa `content_splitter.py` com múltiplas estratégias heurísticas de detecção.
O splitter recebe o Markdown e retorna dois blocos de texto: matéria explicativa e questões.
Persiste via `topic_repository.py` em `topicos.json` (provisório, sem outline ainda)
e `questoes.json`.

**Por que Strategy?**: Diferentes materiais de concurso têm padrões diferentes de
organização. Um único `if/elif` gigante seria frágil e difícil de expandir. Com Strategy,
adicionar suporte a um novo padrão significa criar uma nova estratégia sem alterar o código
existente.

**Checkpoint desta fase**: Dado Markdown misto, o splitter separa corretamente matéria e
questões e persiste em `/data/topicos.json` e `/data/questoes.json`.

---

### Fase 3 — Gerar Outline Hierárquico L0–L3 (Builder + Claude)

**Padrão aplicado**: Builder (montagem incremental da hierarquia)

Implementa `outline_builder.py`. O agente Claude recebe o texto da matéria e gera o
outline com marcadores L0/L1(❖)/L2(➤)/L3(■) respeitando o limite de 15 palavras no L2.
O Builder recebe essa saída linha a linha, classifica cada linha por nível, gera IDs
hierárquicos (`t001`, `t001.1`, `t001.1.1`) e monta a estrutura de árvore em memória.
O resultado é então serializado para `_topicos.txt` e atualiza `topicos.json`.

**Por que Builder?**: A montagem da árvore hierárquica (com `children` aninhados e IDs
derivados da posição) é complexa demais para fazer de uma só vez. O Builder separa a
classificação de linhas (o que cada linha é) da montagem da árvore (como encaixar os nós).

**Por que Claude?**: Explicado em detalhe no `research.md`. Resumo: regex/NLP local não
consegue entender o *sentido* do conteúdo para formular um questionamento afirmativo (L0)
nem decidir o que vai para L1 vs L2 baseado em granularidade semântica.

**Checkpoint desta fase**: Dado `topicos.json` com matéria, o builder gera `_topicos.txt`
com hierarquia L0–L3, marcadores corretos e IDs sequenciais, e atualiza `topicos.json`
com a estrutura completa.

---

### Fase 4 — Repository e Alinhamento Editorial (Repository)

**Padrão aplicado**: Repository (isolamento de persistência) + alinhamento com referência

Implementa `topic_repository.py` com todas as operações de leitura/escrita. Adiciona
suporte ao alinhamento editorial (US4): quando referência Google Docs está disponível,
o outline gerado é calibrado em granularidade (profundidade e número de subtópicos por
tema) antes da persistência final.

**Checkpoint desta fase**: Pipeline completo funcional — PDF de entrada produz
`topicos.json`, `questoes.json` e `_topicos.txt` corretos, com log de execução registrado.
