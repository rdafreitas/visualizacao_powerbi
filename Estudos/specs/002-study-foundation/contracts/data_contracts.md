# Contratos: Study Foundation

**Feature**: `002-study-foundation` | **Date**: 2026-04-30

> **O que é um contrato?** É uma especificação formal de como um arquivo ou função deve
> se comportar. Um contrato de arquivo diz: "este JSON DEVE ter estes campos, com estes
> tipos". Um contrato de função diz: "esta função recebe X e retorna Y, e lança exceção Z
> se o input for inválido". Contratos permitem que diferentes partes do código se integrem
> sem que o autor de uma parte precise ler o código da outra.

---

## Contrato 1 — `study-memory.json`

**Localização**: raiz do workspace (ex: `C:/Users/.../Estudos/study-memory.json`)
**Criado por**: `memory_manager.py → inicializar()`
**Atualizado por**: `memory_manager.py → salvar()`
**Lido por**: `memory_manager.py → carregar()` — uma única vez na inicialização (Singleton)

### Schema completo com todos os campos obrigatórios

```json
{
  "version": "1.0",
  "created_at": "2026-04-30T10:00:00",
  "updated_at": "2026-04-30T10:45:00",
  "current_session": {
    "pdf_hash": "sha256:3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c",
    "pdf_filename": "edital_concurso_df_2026.pdf",
    "current_phase": 2,
    "completed_phases": [0, 1],
    "started_at": "2026-04-30T10:00:00",
    "last_checkpoint": "2026-04-30T10:30:00",
    "artifacts": {
      "edital_md": "data/editais_md/edital_concurso_df_2026.md",
      "topicos_json": null,
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

### Regras de validação

| Campo | Regra |
|-------|-------|
| `version` | Deve ser string no formato `"X.Y"` — ex: `"1.0"`, `"1.1"` |
| `current_session` | Pode ser `null` se nenhuma sessão ativa (arquivo recém-criado) |
| `pdf_hash` | Deve iniciar com `"sha256:"` seguido de exatamente 64 caracteres hexadecimais |
| `completed_phases` | Array de inteiros em ordem crescente; todos os valores devem ser <= `current_phase` |
| `history` | Append-only — nunca remover itens; máximo 100 entradas (itens mais antigos arquivados) |
| `preferences.debug_mode` | Boolean (`true` / `false`) — nunca string |

### Migração de versões (Schema Migration Pattern)

Quando `memory_manager.py` carrega um arquivo com `version` anterior à atual, aplica
migração sequencial:

| De → Para | Transformação |
|-----------|---------------|
| `1.0 → 1.1` | Adicionar campo `preferences.rag_level` com valor padrão `"basico"` |
| (futura) `1.1 → 2.0` | Documentada quando necessário |

**Regra**: Migrações são **aditivas** — apenas adicionam campos com valores padrão.
Nenhuma migração deve remover ou renomear campos existentes (compatibilidade retroativa).

---

## Contrato 2 — `execution_log.json`

**Localização**: `/logs/execution_log.json`
**Criado por**: `logger.py → log()` (primeira chamada cria o arquivo se não existir)
**Rotacionado por**: `logger.py → rotacionar_se_necessario()` (ao atingir 10.000 entradas)
**Nome do arquivo rotacionado**: `execution_log_<YYYYMMDD_HHMMSS>.json`

### Schema (array de EntradaLog)

```json
[
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
]
```

### Regras de validação por campo

| Campo | Tipo | Regra |
|-------|------|-------|
| `id` | `str` | UUID4 válido — gerado por `str(uuid.uuid4())` |
| `timestamp` | `str` | ISO 8601 com microssegundos — gerado por `datetime.now().isoformat()` |
| `phase` | `int` | Entre 0 e 6 inclusive |
| `level` | `str` | Exatamente um de: `"DEBUG"`, `"INFO"`, `"DECISION"`, `"WARNING"`, `"ERROR"` |
| `event` | `str` | snake_case; sem espaços; sem caracteres especiais |
| `input` | `dict \| null` | Qualquer dict serializável como JSON; `null` se não aplicável |
| `output` | `dict \| null` | Qualquer dict serializável como JSON; `null` se não aplicável |
| `decision` | `str \| null` | Texto livre em PT-BR; obrigatório quando `level == "DECISION"` |
| `sources` | `list[str]` | Valores permitidos: `"edital"`, `"ia"`, `"filesystem"`, `"usuario"` |

---

## Contrato 3 — Qualquer arquivo em `/data/*.json`

**Regra universal**: Todo arquivo em `/data/` gerado pelo pipeline DEVE ter a estrutura
`{ "meta": {...}, "data": {...} }`. Arquivos sem este envelope são considerados inválidos
e não são processados.

**Validado por**: `data_contracts.py → validar_contrato(dados)`

### Schema do envelope obrigatório

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
  "data": "...conteúdo específico — list ou dict, definido pela feature que gera o arquivo..."
}
```

### Campos extras permitidos em `meta`

Campos adicionais em `meta` são tolerados (não causam erro de validação). Exemplo: a spec
007 pode adicionar `"meta.deck_anki"` sem quebrar o validador desta spec.

---

## Interface Pública dos Módulos Python

> **O que é "interface pública"?** São as funções que outros módulos podem chamar. Em
> Python, convencionalmente funções com prefixo `_` (underscore) são privadas — uso
> interno. Funções sem underscore são públicas — o contrato que você pode depender.

---

### `memory_manager.py` — Interface pública

```python
def inicializar(workspace_dir: str) -> dict:
    """
    Cria study-memory.json com valores padrão se não existir.
    Retorna o dicionário carregado (estado inicial ou existente após migração).
    Cria também todos os diretórios do workspace se não existirem.
    """

def carregar() -> dict:
    """
    Lê study-memory.json do disco.
    Aplica migração de schema se a versão do arquivo for anterior à atual.
    Retorna dicionário com o estado completo.
    Lança: FileNotFoundError se o arquivo não existir (chamar inicializar() primeiro).
    Lança: ValueError se o arquivo estiver corrompido (JSON inválido).
    """

def salvar(estado: dict) -> None:
    """
    Escreve o dicionário 'estado' em study-memory.json.
    Atualiza o campo 'updated_at' automaticamente antes de salvar.
    Escrita é atômica: escreve em arquivo temporário e substitui (evita corrupção).
    """

def detectar_progresso(pdf_hash: str) -> dict | None:
    """
    Verifica se current_session.pdf_hash == pdf_hash.
    Retorna current_session se o hash coincidir, None caso contrário.
    Usado para detectar retomada de pipeline (FR-002).
    """

def registrar_fase_concluida(fase: int, artifacts: dict | None = None) -> None:
    """
    Adiciona 'fase' a completed_phases se não estiver lá.
    Atualiza last_checkpoint com timestamp atual.
    Mescla 'artifacts' com os existentes se fornecidos.
    Chama salvar() automaticamente.
    """

def calcular_hash_pdf(caminho_pdf: str) -> str:
    """
    Lê o arquivo PDF em chunks e calcula SHA-256.
    Retorna string no formato: "sha256:<64 hex chars>".
    """

def migrar_schema(dados: dict) -> dict:
    """
    Aplica migrações sequenciais de versão.
    Retorna dados migrados para a versão atual.
    Função interna chamada por carregar() — mas pública para testabilidade.
    """
```

---

### `logger.py` — Interface pública

```python
def configurar(log_dir: str, debug_mode: bool = False) -> None:
    """
    Define o diretório de logs e o modo debug.
    Deve ser chamada uma vez na inicialização, antes de qualquer log().
    """

def log(
    level: str,
    event: str,
    phase: int = 0,
    input_data: dict | None = None,
    output_data: dict | None = None,
    decision: str | None = None,
    sources: list[str] | None = None
) -> None:
    """
    Registra uma entrada no execution_log.json.
    Gera UUID4 e timestamp automaticamente.
    Exibe no chat se: level in ("WARNING", "ERROR") OU debug_mode == True.
    Rotaciona o arquivo se atingir 10.000 entradas.
    """

def rotacionar_se_necessario() -> bool:
    """
    Verifica o número de entradas no log atual.
    Se >= 10.000: renomeia execution_log.json para execution_log_<timestamp>.json
    e cria novo arquivo vazio.
    Retorna True se rotação ocorreu, False caso contrário.
    """
```

---

### `state_machine.py` — Interface pública

```python
def executar_fase(
    numero_fase: int,
    funcao_fase: callable,
    descricao: str,
    artifacts_esperados: list[str] | None = None
) -> dict:
    """
    Implementa o Template Method para execução de fases.
    Sequência garantida:
      1. Verifica se fase já foi concluída (consulta memory_manager)
      2. Registra log de início (phase_start)
      3. Executa funcao_fase() — pode lançar qualquer exceção
      4. Registra progresso (registrar_fase_concluida)
      5. Registra log de conclusão (phase_end)
    Retorna: resultado retornado por funcao_fase().
    Lança: re-lança qualquer exceção de funcao_fase() após registrar log ERROR.
    """

def verificar_retomada(pdf_hash: str) -> tuple[bool, int | None]:
    """
    Verifica se há sessão em andamento para o hash informado.
    Retorna: (True, proxima_fase) se retomada disponível, (False, None) caso contrário.
    """
```

---

### `data_contracts.py` — Interface pública

```python
def criar_meta(
    materia: str,
    banca: str,
    source_file: str,
    source_hash: str,
    version: str = "1.0"
) -> dict:
    """
    Cria o dicionário 'meta' obrigatório com timestamps automáticos.
    Retorna dict com todos os campos de ContratosDados.meta.
    """

def validar_contrato(dados: dict) -> None:
    """
    Valida que 'dados' tem a estrutura { "meta": {...}, "data": ... }.
    Valida que todos os campos obrigatórios de 'meta' estão presentes.
    Lança: ValueError com mensagem descritiva em PT-BR se inválido.
    """

def criar_diretorios_workspace(workspace_dir: str) -> list[str]:
    """
    Cria todos os diretórios do workspace que não existirem:
      - <workspace>/data/
      - <workspace>/data/editais_md/
      - <workspace>/logs/
      - <workspace>/input/editais/
      - <workspace>/Histórico Anotações/Resumo/
      - <workspace>/Histórico Anotações/Questões/
    Retorna lista dos diretórios criados (vazios se todos já existiam).
    Registra log DEBUG para cada diretório criado.
    """

def atualizar_timestamp(dados: dict) -> dict:
    """
    Atualiza dados["meta"]["updated_at"] para o timestamp atual.
    Retorna o dicionário modificado (in-place + retorno para encadeamento).
    """
```

---

### `confirmation.py` — Interface pública

```python
def confirmar_sobrescrita(caminho: str) -> bool:
    """
    Se o arquivo em 'caminho' existir: exibe mensagem em PT-BR e aguarda S/n.
    Se o arquivo não existir: retorna True sem interação (não há o que confirmar).
    Retorna: True se o usuário confirmar ou arquivo não existir; False se recusar.
    """

def confirmar_acao(mensagem: str, detalhe: str | None = None) -> bool:
    """
    Exibe 'mensagem' ao usuário e aguarda confirmação S/n.
    Se 'detalhe' fornecido, exibe antes da pergunta de confirmação.
    Usado para confirmações genéricas (publicar Google Docs, enviar ao Anki, etc.)
    Retorna: True se confirmado, False se recusado.
    """

def confirmar_reprocessamento(
    artefato: str,
    pdf_hash_atual: str,
    meta_hash_existente: str
) -> str:
    """
    Quando artefato em /data/ já existe para o mesmo PDF (hashes iguais):
    Pergunta ao usuário: "Reutilizar existente / Reprocessar / Cancelar"
    Retorna: "reutilizar", "reprocessar" ou "cancelar"
    """
```
