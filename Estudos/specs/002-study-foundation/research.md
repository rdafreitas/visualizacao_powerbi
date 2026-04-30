# Research: Study Foundation

**Feature**: `002-study-foundation` | **Date**: 2026-04-30

---

## 1. Estrutura do `study-memory.json`

> **O que é o `study-memory.json`?** É o "caderno de progresso" do sistema. Toda vez que
> uma fase do pipeline é concluída, este arquivo é atualizado. Se o sistema for interrompido
> (queda de energia, usuário fechou a janela), na próxima execução o agente lê este arquivo
> e sabe exatamente de onde retomar, sem reprocessar o que já foi feito.

### Schema completo

```json
{
  "version": "1.0",
  "created_at": "2026-04-30T10:00:00",
  "updated_at": "2026-04-30T10:45:00",
  "current_session": {
    "pdf_hash": "sha256:3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c",
    "pdf_filename": "edital_concurso_df_2026.pdf",
    "current_phase": 3,
    "completed_phases": [0, 1, 2],
    "started_at": "2026-04-30T10:00:00",
    "last_checkpoint": "2026-04-30T10:45:00",
    "artifacts": {
      "edital_md": "data/editais_md/edital_concurso_df_2026.md",
      "topicos_json": "data/topicos.json",
      "relevancia_json": null,
      "gdoc_url": null,
      "anki_result_json": null
    }
  },
  "preferences": {
    "banca_padrao": "CESPE",
    "deck_anki_padrao": "Concurso::Direito Constitucional",
    "debug_mode": false,
    "output_dir": "data",
    "rag_level": "basico"
  },
  "history": [
    {
      "pdf_hash": "sha256:abc123...",
      "pdf_filename": "edital_antigo_2025.pdf",
      "processed_at": "2025-12-01T14:00:00",
      "completed_phases": [0, 1, 2, 3, 4, 5, 6],
      "status": "completo"
    }
  ]
}
```

### Descrição de cada campo

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `version` | `str` | Versão do schema — usada para migração automática |
| `created_at` | `str` (ISO 8601) | Timestamp de criação do arquivo |
| `updated_at` | `str` (ISO 8601) | Timestamp da última atualização |
| `current_session.pdf_hash` | `str` | Hash SHA-256 do PDF atual — identifica unicamente o material |
| `current_session.current_phase` | `int` | Fase em andamento (0 a 6) |
| `current_session.completed_phases` | `list[int]` | Fases concluídas com sucesso |
| `current_session.artifacts` | `dict` | Caminhos dos artefatos gerados por cada fase |
| `preferences` | `dict` | Configurações persistidas do usuário |
| `history` | `list` | Append-only — registros de sessões anteriores (PDFs já processados) |

---

## 2. Estrutura do `execution_log.json`

> **O que é o log de execução?** É o "diário" do sistema. Enquanto `study-memory.json`
> registra *o que foi feito*, o log registra *como foi feito* — cada decisão, cada erro,
> cada entrada e saída de dados. É indispensável para diagnosticar problemas e auditar
> o comportamento do agente.

### Schema de uma entrada de log

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-30T10:15:32.456789",
  "phase": 2,
  "level": "INFO",
  "event": "phase_end",
  "input": {
    "pdf_hash": "sha256:3b4c5d...",
    "fase_descricao": "Geração de tópicos"
  },
  "output": {
    "topicos_gerados": 42,
    "arquivo_salvo": "data/topicos.json"
  },
  "decision": null,
  "sources": []
}
```

### Estrutura completa do arquivo (array de entradas)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-04-30T10:00:00.000000",
    "phase": 0,
    "level": "INFO",
    "event": "phase_start",
    "input": { "pdf_filename": "edital_concurso_df_2026.pdf" },
    "output": null,
    "decision": null,
    "sources": []
  },
  {
    "id": "660f9511-f30c-52e5-b827-557766551111",
    "timestamp": "2026-04-30T10:15:32.456789",
    "phase": 2,
    "level": "DECISION",
    "event": "classificacao_topico",
    "input": { "topico": "Princípio da legalidade", "contexto": "Art. 5º CF/88" },
    "output": { "classificacao": "alta", "justificativa": "Recorrente em provas CESPE" },
    "decision": "Classificado como alta relevância por presença explícita no edital (pg. 3) e frequência histórica em provas CESPE.",
    "sources": ["edital", "ia"]
  },
  {
    "id": "770a0622-a41d-63f6-c938-668877662222",
    "timestamp": "2026-04-30T10:16:00.000000",
    "phase": 2,
    "level": "ERROR",
    "event": "arquivo_corrompido",
    "input": { "arquivo": "data/topicos.json" },
    "output": null,
    "decision": "Backup criado em data/topicos.json.bak; novo arquivo iniciado.",
    "sources": []
  }
]
```

### Os 5 níveis de log e quando usar cada um

| Nível | Quando usar | Exibido ao usuário? |
|-------|-------------|---------------------|
| `DEBUG` | Detalhes internos: valores intermediários, listas processadas | Somente com `--debug` |
| `INFO` | Eventos normais do pipeline: início/fim de fase, arquivo salvo | Somente com `--debug` |
| `DECISION` | Decisões do agente: classificações, escolhas entre alternativas | Somente com `--debug` |
| `WARNING` | Situações inesperadas mas recuperáveis: arquivo não encontrado, campo opcional ausente | Sempre |
| `ERROR` | Falhas que interrompem o fluxo: arquivo corrompido, permissão negada | Sempre |

---

## 3. Decisões de Design

### Por que `hashlib.sha256` para identificar PDFs?

> **O que é um hash SHA-256?** É uma "impressão digital" de um arquivo — uma sequência de
> 64 caracteres hexadecimais que é única para cada conteúdo de arquivo. Dois arquivos com
> conteúdo diferente nunca terão o mesmo hash (na prática).

**Decisão**: Identificar cada PDF pelo hash SHA-256 do seu conteúdo, não pelo nome do arquivo.

**Razão**: O usuário pode renomear o arquivo sem mudar o conteúdo (ex: `edital_v1.pdf` →
`edital_final.pdf`). Se identificarmos pelo nome, o sistema não encontraria o progresso
anterior e reprocessaria tudo. Com SHA-256, o conteúdo é o identificador — o nome é
irrelevante.

**Alternativa descartada**: Usar `(nome_do_arquivo, tamanho_em_bytes)` como identificador
— descartada porque renomear o arquivo ou editar 1 byte já quebraria a identificação.

---

### Por que rotação em 10.000 entradas e não por tamanho de arquivo?

**Decisão**: Rotacionar `execution_log.json` quando atingir 10.000 entradas.

**Razão**: Uma entrada de log tem tamanho variável (depende do tamanho dos campos `input`
e `output`). Se rotacionarmos por tamanho (ex: "quando passar de 5MB"), o número de
entradas no arquivo seria imprevisível. Com 10.000 entradas como limite, o comportamento
é determinístico: sempre sabemos que o arquivo ativo tem no máximo 10.000 entradas, o que
torna a consulta simples (carregar o array JSON inteiro em memória nunca estoura).

**Alternativa descartada**: Rotação por tamanho de arquivo — descartada por imprevisibilidade
do número de entradas consultáveis.

---

### Por que `uuid` para IDs de entrada de log?

> **O que é UUID?** "Universally Unique Identifier" — um identificador de 128 bits gerado
> aleatoriamente, representado como string hexadecimal com hífens. A probabilidade de dois
> UUIDs colidirem é astronomicamente baixa (1 em 2^122).

**Decisão**: Cada entrada de log recebe um `id` gerado por `uuid.uuid4()`.

**Razão**: IDs sequenciais (1, 2, 3...) dependem de conhecer o estado atual do log para
gerar o próximo. Com rotação (múltiplos arquivos de log), manter sequência entre arquivos
seria complexo. O UUID4 é gerado sem depender de estado anterior — `uuid.uuid4()` nunca
precisa saber qual foi o último ID gerado.

**Alternativa descartada**: IDs sequenciais por arquivo — descartada por quebrar ao
cruzar arquivos rotacionados; IDs baseados em timestamp — descartada por colisão em logs
gerados no mesmo milissegundo.

---

## 4. Contrato de Dados Padrão para `/data/*.json`

> **O que é um "contrato de dados"?** É um acordo sobre a estrutura que um arquivo JSON
> DEVE ter. Como um contrato legal, define o que é obrigatório, o que é opcional e o que
> não é permitido. Qualquer código que leia ou escreva um arquivo em `/data/` precisa
> honrar este contrato.

**Regra**: Todo arquivo em `/data/` (exceto logs e `study-memory.json`) DEVE ter:

```json
{
  "meta": {
    "materia": "Direito Constitucional",
    "banca": "CESPE",
    "created_at": "2026-04-30T10:00:00",
    "updated_at": "2026-04-30T10:45:00",
    "source_file": "edital_concurso_df_2026.pdf",
    "source_hash": "sha256:3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c",
    "version": "1.0"
  },
  "data": "...conteúdo específico de cada arquivo..."
}
```

### Campos obrigatórios do `meta`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `materia` | `str` | Sim | Nome da matéria (ex: "Direito Constitucional") |
| `banca` | `str` | Sim | Nome da banca (ex: "CESPE", "FGV") |
| `created_at` | `str` (ISO 8601) | Sim | Timestamp de criação do arquivo |
| `updated_at` | `str` (ISO 8601) | Sim | Timestamp da última atualização |
| `source_file` | `str` | Sim | Nome do PDF de origem |
| `source_hash` | `str` | Sim | Hash SHA-256 do PDF — usado para detectar reprocessamento |
| `version` | `str` | Sim | Versão do schema do arquivo (ex: "1.0") |

**Por que o campo `source_hash` no `meta`?** Permite que o sistema detecte, para qualquer
arquivo em `/data/`, se ele foi gerado a partir do mesmo PDF da sessão atual. Se os hashes
coincidirem, o sistema pode oferecer reutilizar o arquivo existente em vez de reprocessar
(FR-012).
