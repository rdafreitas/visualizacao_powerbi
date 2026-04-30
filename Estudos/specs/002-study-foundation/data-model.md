# Data Model: Study Foundation

**Feature**: `002-study-foundation` | **Date**: 2026-04-30

> **Por que um data model?** Antes de escrever código, precisamos saber com quais
> "objetos" (dados) o sistema vai trabalhar e como eles se relacionam. Pense nisto
> como o "vocabulário" do sistema — os substantivos com os quais as funções (os verbos)
> trabalham. Um data model bem definido evita que diferentes partes do código usem
> nomes diferentes para a mesma coisa.

---

## Entidades

### SessaoProcessamento

Representa **uma execução do pipeline** — o que está sendo processado agora, em qual fase,
e o que já foi concluído. É o objeto central de `study-memory.json → current_session`.

| Campo | Tipo Python | Descrição | Obrigatório |
|-------|-------------|-----------|-------------|
| `pdf_hash` | `str` | Hash SHA-256 do PDF: `"sha256:<64 hex chars>"` | Sim |
| `pdf_filename` | `str` | Nome do arquivo PDF (apenas para exibição ao usuário) | Sim |
| `current_phase` | `int` | Número da fase atual (0 a 6) | Sim |
| `completed_phases` | `list[int]` | Fases concluídas com sucesso, ex: `[0, 1, 2]` | Sim |
| `started_at` | `str` | ISO 8601 — quando a sessão foi iniciada | Sim |
| `last_checkpoint` | `str` | ISO 8601 — quando o último progresso foi salvo | Sim |
| `artifacts` | `dict[str, str | None]` | Caminhos dos artefatos gerados por fase | Sim |

**Campos de `artifacts`** (os arquivos gerados por cada fase do pipeline):

| Chave | Fase que gera | Exemplo de valor |
|-------|--------------|-----------------|
| `edital_md` | Fase 1 | `"data/editais_md/edital_2026.md"` |
| `topicos_json` | Fase 2 | `"data/topicos.json"` |
| `relevancia_json` | Fase 3 | `"data/relevancia_topicos.json"` |
| `gdoc_url` | Fase 5 | `"https://docs.google.com/document/d/..."` |
| `anki_result_json` | Fase 6 | `"data/anki_result_dir-const_20260430.json"` |

**Regras de validação**:
- `pdf_hash` deve iniciar com `"sha256:"` e ter exatamente 71 caracteres no total
- `current_phase` deve estar em `completed_phases` OU ser o próximo após o último concluído
- `artifacts` pode ter valores `null` para fases ainda não executadas

---

### PreferenciasUsuario

Representa **as configurações persistidas do usuário**. Salvo em `study-memory.json →
preferences`. Diferente da `SessaoProcessamento`, as preferências persistem entre sessões
— mudar de PDF não reseta as preferências.

| Campo | Tipo Python | Descrição | Valor padrão |
|-------|-------------|-----------|-------------|
| `banca_padrao` | `str` | Banca organizadora padrão (ex: `"CESPE"`) | `""` (vazio — perguntar ao usuário) |
| `deck_anki_padrao` | `str` | Nome do deck Anki usado na última exportação | `""` |
| `debug_mode` | `bool` | `True` se `--debug` foi ativado na última execução | `False` |
| `output_dir` | `str` | Diretório de saída para artefatos | `"data"` |
| `rag_level` | `str` | Nível de detalhe do RAG: `"basico"` / `"avancado"` | `"basico"` |

**Quando persistir**: Sempre que o usuário alterar uma preferência (ex: digitar `--debug`,
escolher um deck Anki, selecionar uma banca). A função `salvar()` do `memory_manager.py`
escreve o objeto inteiro de volta ao arquivo.

---

### EntradaLog

Representa **um evento registrado no sistema de logging**. É o objeto que aparece como
item no array de `execution_log.json`. Cada fase gera múltiplas entradas de log.

| Campo | Tipo Python | Descrição | Obrigatório |
|-------|-------------|-----------|-------------|
| `id` | `str` | UUID4: `"550e8400-e29b-41d4-a716-446655440000"` | Sim |
| `timestamp` | `str` | ISO 8601 com microssegundos: `"2026-04-30T10:15:32.456789"` | Sim |
| `phase` | `int` | Número da fase que gerou este log (0 a 6) | Sim |
| `level` | `str` | Um de: `"DEBUG"`, `"INFO"`, `"DECISION"`, `"WARNING"`, `"ERROR"` | Sim |
| `event` | `str` | Identificador do evento em snake_case: `"phase_start"`, `"arquivo_salvo"` | Sim |
| `input` | `dict | None` | Resumo das entradas relevantes para o evento | Não |
| `output` | `dict | None` | Resumo das saídas geradas pelo evento | Não |
| `decision` | `str | None` | Texto explicando a decisão tomada (exclusivo de `"DECISION"`) | Não |
| `sources` | `list[str]` | Fontes consultadas: `["edital", "ia"]`, `["filesystem"]` | Sim (pode ser `[]`) |

**Eventos padronizados** (convenção de nomes para o campo `event`):

| Evento | Nível padrão | Quando ocorre |
|--------|-------------|---------------|
| `"pipeline_start"` | INFO | Início do pipeline completo |
| `"phase_start"` | INFO | Início de uma fase específica |
| `"phase_end"` | INFO | Conclusão bem-sucedida de uma fase |
| `"fase_retomada"` | INFO | Retomada de fase após interrupção |
| `"arquivo_salvo"` | INFO | Artefato JSON persistido em `/data/` |
| `"classificacao_topico"` | DECISION | Classificação de relevância de um tópico |
| `"schema_migrado"` | INFO | Migração automática de schema executada |
| `"confirmacao_solicitada"` | INFO | Sistema aguardou confirmação do usuário |
| `"arquivo_corrompido"` | WARNING | Arquivo JSON inválido detectado |
| `"diretorio_criado"` | DEBUG | Diretório criado automaticamente |
| `"log_rotacionado"` | INFO | Log atingiu 10k entradas e foi rotacionado |

---

### ContratosDados

Representa **o envelope obrigatório** de todo arquivo em `/data/`. Não é uma entidade de
negócio — é uma estrutura de metadados que "envolve" o conteúdo de cada arquivo,
garantindo rastreabilidade e versionamento.

| Campo | Tipo Python | Descrição | Obrigatório |
|-------|-------------|-----------|-------------|
| `meta` | `dict` | Metadados obrigatórios — ver tabela abaixo | Sim |
| `data` | `list | dict` | Conteúdo específico do arquivo (varia por feature) | Sim |

**Campos obrigatórios de `meta`**:

| Campo | Tipo Python | Descrição |
|-------|-------------|-----------|
| `materia` | `str` | Nome da matéria (ex: `"Direito Constitucional"`) |
| `banca` | `str` | Nome da banca (ex: `"CESPE"`) |
| `created_at` | `str` | ISO 8601 — timestamp de criação |
| `updated_at` | `str` | ISO 8601 — timestamp da última atualização |
| `source_file` | `str` | Nome do PDF de origem |
| `source_hash` | `str` | Hash SHA-256 do PDF: `"sha256:<64 hex chars>"` |
| `version` | `str` | Versão do schema: `"1.0"` |

**Regra**: A função `validar_contrato(dados)` em `data_contracts.py` deve rejeitar (lançar
exceção) qualquer arquivo que não tenha todos os campos de `meta` acima. Campos extras em
`meta` são permitidos (tolerância para extensões futuras).

---

## Diagrama de Relacionamentos

> **Como ler este diagrama**: Cada caixa é uma entidade. As setas mostram qual entidade
> "contém" ou "referencia" outra. O número ao lado da seta indica cardinalidade
> (1 = um, N = muitos, 0..1 = zero ou um).

```
study-memory.json
┌──────────────────────────────────────────────────────────┐
│  memory_root                                             │
│  ├── version: str                                        │
│  ├── created_at: str                                     │
│  ├── updated_at: str                                     │
│  │                                                       │
│  ├── current_session ────────────► SessaoProcessamento  │
│  │        (0..1)                   ├── pdf_hash          │
│  │                                 ├── current_phase     │
│  │                                 ├── completed_phases  │
│  │                                 └── artifacts ──┐     │
│  │                                                 │     │
│  ├── preferences ────────────────► PreferenciasUsuario   │
│  │        (1)                      ├── banca_padrao      │
│  │                                 ├── debug_mode        │
│  │                                 └── deck_anki_padrao  │
│  │                                                       │
│  └── history ────────────────────► [SessaoProcessamento] │
│           (0..N, append-only)       (versão resumida)    │
└──────────────────────────────────────────────────────────┘

artifacts (dentro de SessaoProcessamento)
         │
         ├──► data/editais_md/*.md      (Fase 1)
         ├──► data/topicos.json         (Fase 2) ─── tem ContratosDados
         ├──► data/relevancia_topicos.json (Fase 3) ─ tem ContratosDados
         ├──► (url Google Docs)         (Fase 5)
         └──► data/anki_result_*.json   (Fase 6) ─── tem ContratosDados


execution_log.json
┌─────────────────────────────────────────────────────────┐
│  [ EntradaLog, EntradaLog, EntradaLog, ... ]            │
│   (array — máximo 10.000 itens antes da rotação)       │
│                                                         │
│  EntradaLog                                             │
│  ├── id: UUID4                                          │
│  ├── timestamp: str (ISO 8601)                          │
│  ├── phase: int ─────────────────► referencia a fase   │
│  │                                 em current_session   │
│  ├── level: str (5 níveis)                              │
│  ├── event: str                                         │
│  ├── input: dict | null                                 │
│  ├── output: dict | null                                │
│  ├── decision: str | null                               │
│  └── sources: list[str]                                 │
└─────────────────────────────────────────────────────────┘


ContratosDados (envelope de todo /data/*.json)
┌────────────────────────────────────────────────┐
│  { "meta": {...}, "data": {...} }              │
│                                                │
│  meta                                          │
│  ├── materia: str                              │
│  ├── banca: str                                │
│  ├── created_at: str                           │
│  ├── updated_at: str                           │
│  ├── source_file: str ──────────────► mesmo   │
│  └── source_hash: str ──────────────► hash em │
│                                       SessaoProcessamento.pdf_hash
│  data                                          │
│  └── (varia por feature — lista ou dict)       │
└────────────────────────────────────────────────┘
```

**Relacionamento chave**: `SessaoProcessamento.pdf_hash` e `ContratosDados.meta.source_hash`
devem ser iguais para todos os arquivos gerados na mesma sessão. Esta igualdade é o
mecanismo que permite ao sistema detectar se um arquivo em `/data/` foi gerado a partir
do mesmo PDF da sessão atual (FR-012).
