# Implementation Plan: Study Google Docs Publishing

**Branch**: `006-study-gdoc-publishing` | **Date**: 2026-04-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-study-gdoc-publishing/spec.md`

## Summary

Integração com a Google Docs API para publicação de resumos hierárquicos (outline L0–L3)
e questões classificadas em documentos Google Docs com formatação visual por relevância
(🔥 vermelho, ⚠️ amarelo, 📝 cinza). Antes de qualquer publicação, o conteúdo é salvo
como Markdown local em `/Histórico Anotações/` — isso é uma regra sem exceção (Constitution IV).

Cobre: autenticação OAuth com `credentials.json`, criação e formatação de documentos via
batch requests, versionamento local por convenção de nome de arquivo, diff simplificado
entre versões, e registro da URL do documento na memória persistente.

A implementação aplica 4 padrões de design explícitos (Princípio IX da constituição):
**Facade**, **Adapter**, **Template Method** e **Naming Convention Versioning**.
Cada padrão está explicado na seção [Padrões de Design](#padrões-de-design-aplicados-princípio-ix)
abaixo — aprenda os nomes, pois você os encontrará em todo projeto Python.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**:
- `google-api-python-client` (pip) — cliente oficial Google APIs
- `google-auth-httplib2` (pip) — transporte HTTP compatível com google-auth
- `google-auth-oauthlib` (pip) — fluxo OAuth 2.0 para aplicações desktop
- `json`, `pathlib`, `difflib`, `datetime` (stdlib — sem pip install adicional)

**Storage**:
- Leitura: `/data/topicos.json`, `/data/questoes.json`, `/data/_topicos.txt`,
  `/data/relevancia_topicos.json`, `/data/relevancia_questoes.json`
- Escrita (Markdown local): `/Histórico Anotações/Resumo/resumo_<materia>_<YYYY-MM-DD>.md`
  e `/Histórico Anotações/Questões/questoes_<materia>_<YYYY-MM-DD>.md`
- Escrita (memória): campo `gdoc_urls` em `study-memory.json` (spec 002)

**Testing**: Manual com conta Google de teste; testes de User Story independentes
(US3 pode ser testado sem autenticação Google)

**Target Platform**: Windows, Python 3.11+, executado como skill pelo agente

**Project Type**: CLI skill com chamada a API externa

**Performance Goals**: Publicação completa (Markdown local + Google Docs) em menos de 3 minutos

**Constraints**:
- `credentials.json` deve existir na raiz do projeto antes de qualquer execução
- `token.json` é gerado automaticamente no primeiro uso (abre browser para autorização)
- Limite de batch requests: documentos de até 100 páginas de outline suportados

**Scale/Scope**: Single user, ~1–3 documentos por sessão, outlines de até 100 páginas

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Princípio | Status | Evidência / Ação |
|---|-----------|--------|-----------------|
| I | Interação em PT-BR | ✅ PASS | Todas as mensagens ao usuário em PT-BR (confirmações, erros, relatórios de publicação) |
| II | Confirmação Antes de Ações | ✅ PASS | FR-006 exige confirmação explícita antes de cada publicação no Google Docs — sem publicação automática |
| III | Pipeline Sequencial | ✅ PASS | Feature é fase de output; depende obrigatoriamente de 002, 004 e 005; retomada via Foundation |
| IV | Dados Estruturados / Markdown Local | ✅ PASS | **FR-004 é lei**: Markdown salvo ANTES da chamada à Google Docs API em 100% dos casos (SC-002) |
| V | RAG com Validação | ✅ PASS | Sem web search; lê apenas dados locais produzidos por specs 004 e 005 |
| VI | Separação de Responsabilidades | ✅ PASS | 5 arquivos, cada um com responsabilidade única: auth, adapter, formatter, versioning, orchestrator |
| VII | Observabilidade | ✅ PASS | URL do doc registrada no log (FR-007) e em `study-memory.json`; erros de API logados |
| VIII | Evolução Compatível | ✅ PASS | Lê campo `version` dos JSONs de input; não altera contratos de specs 004 e 005 |
| IX | Desenvolvimento Orientado ao Aprendizado | ✅ PASS | 4 padrões nomeados e explicados neste plan; tasks com responsabilidade única |

**Resultado: GATE PASS** — sem violações.

**Destaque Princípio II**: O sistema NUNCA publica no Google Docs sem confirmação explícita
do usuário. A confirmação exibe o que será publicado (título do doc, contagem de tópicos ou
questões) antes de qualquer chamada à API.

**Destaque Princípio IV**: A ordem de operações é imutável:
1. Gerar conteúdo em memória
2. Salvar Markdown local (`/Histórico Anotações/`)
3. (Somente após confirmação de escrita local) chamar Google Docs API

Se o passo 2 falhar, o passo 3 não acontece. Se o passo 3 falhar, o usuário é informado
de que a versão local foi salva e pode tentar novamente.

---

## Padrões de Design Aplicados (Princípio IX)

> Esta seção existe para que você entenda o *porquê* de cada decisão.
> Aprenda o nome de cada padrão — você os encontrará em todo projeto Python.

### Padrão 1 — Facade (Fachada)

**O que é**: Um padrão que esconde um sistema complexo atrás de uma interface simples.
"Fachada" é o nome do padrão porque, como a fachada de um prédio, você vê uma superfície
limpa — sem ver toda a complexidade interna.

**Por que usamos aqui**: A autenticação OAuth do Google é complexa: precisa ler
`credentials.json`, verificar se `token.json` existe, renovar o token se expirado, e
abrir o browser para o primeiro login. Em vez de espalhar esse código por todo o projeto,
`google_auth.py` esconde tudo isso e expõe apenas uma função: `get_service()`. O resto do
código chama `get_service()` e recebe o serviço pronto — sem saber como a autenticação
funciona internamente.

**Analogia**: Como ligar uma TV: você pressiona o botão e ela liga. Não sabe nada sobre
o circuito interno. O `google_auth.py` é o botão.

**Arquivo**: `google_auth.py`

---

### Padrão 2 — Adapter (Adaptador)

**O que é**: Uma camada fina que traduz chamadas do seu código para o formato específico
de uma API externa. Seu código chama `criar_documento("Resumo - Direito Constitucional")`,
o Adapter traduz isso para o JSON complexo de `batchUpdate` que a Google Docs API requer.

**Por que usamos aqui**: A Google Docs API tem verbosidade alta — um simples "colore este
texto de vermelho" vira um JSON com `updateTextStyle`, `range`, `color`, `red`, `green`,
`blue` e campos de índice de caracteres. Em vez de espalhar esse conhecimento por todo
o código, o Adapter (`gdoc_connector.py`) é o único arquivo que sabe como falar com a API.
Se a API mudar, só esse arquivo precisa ser atualizado.

**Diferença do Facade**: O Facade esconde complexidade de configuração/estado (autenticação).
O Adapter traduz operações de alto nível para o vocabulário de uma API externa.

**Arquivo**: `gdoc_connector.py`

---

### Padrão 3 — Template Method (Método Template)

**O que é**: Um padrão onde a estrutura (o "esqueleto") de um algoritmo é definida em um
lugar, e os detalhes que variam são implementados em partes específicas. "Template" no
sentido de "formulário com campos a preencher" — a estrutura é fixa, os valores variam.

**Por que usamos aqui**: Publicar o resumo e publicar as questões seguem exatamente o
mesmo esqueleto de 5 passos:
1. Gerar conteúdo (de `topicos.json` ou `questoes.json`)
2. Salvar Markdown local (sempre o mesmo código)
3. Obter serviço Google (sempre `get_service()`)
4. Criar e formatar o Google Doc (aqui os detalhes variam: outline vs questões)
5. Registrar URL na memória (sempre o mesmo código)

Em `gdoc_service.py`, os passos 2, 3 e 5 são idênticos para ambos os fluxos. Apenas
o passo 4 varia. O Template Method evita duplicação: o "esqueleto" é escrito uma vez,
e as partes que variam são separadas em funções específicas (`_formatar_resumo` e
`_formatar_questoes`).

**Arquivo**: `gdoc_service.py`

---

### Padrão 4 — Naming Convention Versioning (Versionamento por Convenção de Nome)

**O que é**: Uma forma simples de versionamento onde a versão está embutida no nome do
arquivo. Sem banco de dados, sem Git — o nome do arquivo carrega toda a informação
necessária para identificar e ordenar versões.

**Por que usamos aqui**: Precisamos de histórico de versões (Constitution IV + US4), mas
não queremos complexidade de banco de dados ou Git interno. A convenção
`resumo_<materia>_<YYYY-MM-DD>.md` resolve o problema: o nome já diz o que é, de qual
matéria, e quando foi gerado. Para ordenar versões, basta ordenar os nomes de arquivo
alfabeticamente (ISO 8601 ordena corretamente por data). Se houver duas versões no mesmo
dia, o sufixo `_HH-MM` diferencia (FR-011).

**Exemplo**: `resumo_direito-constitucional_2026-04-30.md` é mais informativo e mais
fácil de entender do que `v3_resumo.md` ou `resumo_backup_final_2.md`.

**Arquivos**: `/Histórico Anotações/Resumo/`, `/Histórico Anotações/Questões/`,
gerenciados por `version_manager.py`

---

## Project Structure

### Documentation (esta feature)

```text
specs/006-study-gdoc-publishing/
├── plan.md              # Este arquivo
├── spec.md              # Especificação original da feature
├── research.md          # Pesquisa: Google Docs API, OAuth, batch requests, difflib
├── data-model.md        # Entidades: GoogleDocResumo, VersaoLocal, fluxo de dados
├── quickstart.md        # Como testar cada User Story manualmente
├── contracts/
│   ├── gdoc_requests_contract.md    # Exemplos de batch requests com formatação
│   ├── versao_local_contract.md     # Schema do frontmatter Markdown
│   └── gdoc_connector_interface.md  # Interface pública do Adapter
└── tasks.md             # Gerado por /speckit.tasks (próximo passo)
```

### Source Code (skill reutilizável)

```text
.github/skills/study-gdoc/
├── google_auth.py       # Facade — autenticação OAuth Google (credentials → service) [NOVO]
├── gdoc_connector.py    # Adapter — operações de alto nível na Google Docs API       [NOVO]
├── gdoc_formatter.py    # Formata outline/questões para batch requests (cores, indent) [NOVO]
├── version_manager.py   # Naming Convention Versioning — salva/lista/diff Markdown   [NOVO]
└── gdoc_service.py      # Template Method — orquestra publicação (resumo e questões) [NOVO]

Histórico Anotações/
├── Resumo/              # Versões Markdown de resumos (criado automaticamente)
└── Questões/            # Versões Markdown de questões (criado automaticamente)

data/                    # Runtime — criado pela spec 002
├── topicos.json                    # Input (spec 004 — obrigatório)
├── questoes.json                   # Input (spec 004 — obrigatório para US2)
├── _topicos.txt                    # Input: outline em texto (spec 004)
├── relevancia_topicos.json         # Input (spec 005 — obrigatório)
└── relevancia_questoes.json        # Input (spec 005 — obrigatório para US2)

credentials.json         # Credenciais OAuth Google (usuário deve fornecer — ver quickstart.md)
token.json               # Token gerado no primeiro uso (criado automaticamente)
study-memory.json        # Memória persistente — campo gdoc_urls atualizado por esta feature
```

**Structure Decision**: Single project — CLI skill. Cinco arquivos com responsabilidade
única cada (Princípio VI). O `gdoc_service.py` é o ponto de entrada; os demais são
bibliotecas internas chamadas por ele. Nenhum arquivo de spec anterior é alterado
(compatibilidade — Princípio VIII).

---

## Complexity Tracking

> Sem violações constitucionais a justificar — tabela não aplicável.

---

## Fases de Implementação (Visão Geral)

> O detalhamento em tasks individuais é feito pelo `/speckit.tasks`. Esta seção mostra
> as fases e o padrão aplicado em cada uma — para que você entenda a sequência lógica
> antes de ver as tasks.

### Fase 1 — Autenticação Google (Facade)

**Padrão aplicado**: Facade

Cria `google_auth.py`, o único arquivo que sabe como autenticar com o Google. Encapsula
o fluxo OAuth completo: ler `credentials.json`, verificar se `token.json` existe, renovar
o token se expirado, abrir browser para o primeiro login.

**Por que esta fase é a primeira**: Sem autenticação, nenhuma chamada à API pode ser testada.
A Facade é a fundação — todos os outros arquivos dependem de `get_service()`.

**O que é entregue**: `google_auth.py` com a função `get_service(api: str, version: str)`.

**Checkpoint desta fase**: Executar `python -c "from google_auth import get_service; print(get_service('docs', 'v1'))"` sem erro de autenticação.

---

### Fase 2 — Versionamento Local Markdown (Naming Convention)

**Padrão aplicado**: Naming Convention Versioning

Cria `version_manager.py`, responsável por: gerar o nome do arquivo com a convenção
`<tipo>_<materia>_<YYYY-MM-DD>[_HH-MM].md`, salvar o arquivo com frontmatter, listar
versões existentes, e gerar diff simplificado entre duas versões via `difflib`.

**Por que esta fase é a segunda**: A US3 (versionamento local) pode e deve ser testada
sem nenhuma autenticação Google. Implementar e validar o versionamento antes de qualquer
chamada de API reduz risco — se a API falhar, temos certeza de que o salvamento local
funciona corretamente.

**O que é entregue**: `version_manager.py` com funções `salvar_versao()`, `listar_versoes()`,
`gerar_diff()`.

**Checkpoint desta fase**: Com `topicos.json` presente, executar
`python version_manager.py --salvar --tipo resumo --materia "Direito Constitucional"` e
verificar arquivo criado em `/Histórico Anotações/Resumo/` com frontmatter correto.

---

### Fase 3 — Formatação e Publicação do Resumo (Adapter + Template Method)

**Padrão aplicado**: Adapter (`gdoc_connector.py`) + Template Method (`gdoc_service.py`)

Cria `gdoc_formatter.py` (converte o outline L0–L3 em batch requests com cores e
indentação) e `gdoc_connector.py` (Adapter que executa os batch requests na API). Integra
tudo em `gdoc_service.py` com o esqueleto Template Method para publicação do resumo (US1).

**Por que esta fase depende das anteriores**: Precisa da Facade (Fase 1) para autenticar
e do versionamento local (Fase 2) para salvar antes de publicar (Constitution IV).

**O que é entregue**: US1 completo — publicação do resumo com hierarquia visual e cores
por relevância, Markdown salvo antes da publicação, URL registrada na memória.

**Checkpoint desta fase**: Com `topicos.json`, `_topicos.txt` e `relevancia_topicos.json`
presentes, executar publicação e verificar Google Doc criado com cores corretas (🔥 vermelho,
⚠️ amarelo, 📝 cinza) e indentação progressiva L0–L3.

---

### Fase 4 — Publicação de Questões e Diff entre Versões

**Padrão aplicado**: Template Method (reutiliza esqueleto da Fase 3, substitui formatador)

Implementa a publicação de questões (US2) reutilizando o mesmo esqueleto Template Method
da Fase 3 — só a função `_formatar_questoes` varia. Adiciona a listagem de versões (US4)
e o diff simplificado entre duas versões usando `difflib`.

**Por que esta fase é a última**: Reutiliza toda a infraestrutura das fases anteriores.
As questões seguem o mesmo fluxo do resumo; apenas a formatação muda.

**O que é entregue**: US2 (publicação de questões), US4 (listagem e diff de versões).

**Checkpoint desta fase**: Com `questoes.json` e `relevancia_questoes.json` presentes,
executar publicação de questões e verificar Google Doc separado criado com seções
🔥/⚠️/📝. Com 2+ versões em `/Histórico Anotações/Resumo/`, listar versões e exibir diff.
