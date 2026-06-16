"""
data_contracts.py — Contratos de dados e criação de diretórios do workspace.

Responsabilidade única: garantir que o ambiente está pronto antes de qualquer operação
e que todos os JSONs em /data/ seguem o formato padrão { "meta": {...}, "data": ... }.

Padrão aplicado: Fail Fast — verificar o ambiente ANTES de operar, nunca no meio de
uma execução. Se algo está errado, falha imediatamente com mensagem clara em PT-BR.

Conceitos de programação presentes neste arquivo:
- pathlib.Path: API moderna do Python para manipular caminhos de arquivo (substitui os.path)
- datetime.isoformat(): converte datetime para string padrão ISO 8601
- Type hints (str, dict, list): anotações que documentam o que a função espera/retorna
- Raise ValueError: lançar exceção com mensagem descritiva quando input é inválido
"""

from pathlib import Path
from datetime import datetime


# ─── Diretórios obrigatórios do workspace (FR-015) ────────────────────────────
# Esses são os diretórios que o sistema precisa para funcionar.
# A lista fica aqui (e não espalhada pelo código) para facilitar manutenção.
DIRETORIOS_WORKSPACE = [
    "data",
    "data/editais_md",
    "logs",
    "input/editais",
    "Histórico Anotações/Resumo",
    "Histórico Anotações/Questões",
]

# ─── Campos obrigatórios do envelope "meta" (FR-013) ──────────────────────────
# Todo JSON em /data/ DEVE ter esses campos em "meta".
# Se faltar algum, validar_contrato() lança ValueError.
CAMPOS_META_OBRIGATORIOS = [
    "materia",
    "banca",
    "created_at",
    "updated_at",
    "source_file",
    "source_hash",
    "version",
]


def criar_diretorios_workspace(workspace_dir: str) -> list[str]:
    """
    Cria todos os diretórios do workspace que não existirem.

    Retorna lista dos diretórios criados (vazia se todos já existiam).

    💡 Conceito: pathlib.Path.mkdir(parents=True, exist_ok=True)
       - parents=True: cria diretórios intermediários se necessário
       - exist_ok=True: não lança exceção se o diretório já existir
       Isso é mais seguro que verificar "if not exists" antes de criar,
       pois evita condição de corrida (race condition) entre a verificação
       e a criação.
    """
    base = Path(workspace_dir)
    criados = []

    for subdir in DIRETORIOS_WORKSPACE:
        caminho = base / subdir
        if not caminho.exists():
            caminho.mkdir(parents=True, exist_ok=True)
            criados.append(str(caminho))

    return criados


def criar_meta(
    materia: str,
    banca: str,
    source_file: str,
    source_hash: str,
    version: str = "1.0",
) -> dict:
    """
    Cria o dicionário 'meta' obrigatório com timestamps automáticos.

    Retorna dict com todos os campos de ContratosDados.meta.

    💡 Conceito: datetime.now().isoformat()
       Gera string no formato "2026-04-30T10:15:32.456789" — padrão universal
       para representar datas em JSON. Evita ambiguidade de formatos regionais
       (30/04 vs 04/30). Sempre use ISO 8601 em dados estruturados.
    """
    agora = datetime.now().isoformat()
    return {
        "materia": materia,
        "banca": banca,
        "created_at": agora,
        "updated_at": agora,
        "source_file": source_file,
        "source_hash": source_hash,
        "version": version,
    }


def validar_contrato(dados: dict) -> None:
    """
    Valida que 'dados' tem a estrutura { "meta": {...}, "data": ... }.
    Valida que todos os campos obrigatórios de 'meta' estão presentes.

    Lança ValueError com mensagem descritiva em PT-BR se inválido.

    💡 Conceito: Validação na fronteira do sistema
       Sempre valide dados na ENTRADA (quando chegam ao seu módulo), não no meio
       do processamento. Isso centraliza as regras e facilita depuração.
       Se os dados passaram por validar_contrato(), todo o restante do código
       pode assumir que a estrutura está correta — sem checar novamente.
    """
    if not isinstance(dados, dict):
        raise ValueError(
            "Contrato inválido: esperado um dicionário (dict), "
            f"recebido {type(dados).__name__}."
        )

    if "meta" not in dados:
        raise ValueError(
            "Contrato inválido: campo 'meta' ausente. "
            "Todo arquivo em /data/ deve ter a estrutura {'meta': {...}, 'data': ...}."
        )

    if "data" not in dados:
        raise ValueError(
            "Contrato inválido: campo 'data' ausente. "
            "Todo arquivo em /data/ deve ter a estrutura {'meta': {...}, 'data': ...}."
        )

    meta = dados["meta"]
    if not isinstance(meta, dict):
        raise ValueError(
            "Contrato inválido: campo 'meta' deve ser um dicionário, "
            f"recebido {type(meta).__name__}."
        )

    # Verificar cada campo obrigatório
    campos_ausentes = [
        campo for campo in CAMPOS_META_OBRIGATORIOS if campo not in meta
    ]

    if campos_ausentes:
        raise ValueError(
            "Contrato inválido: campos obrigatórios ausentes em 'meta': "
            f"{', '.join(campos_ausentes)}. "
            "Consulte data_contracts.md para a lista completa de campos."
        )


def atualizar_timestamp(dados: dict) -> dict:
    """
    Atualiza dados["meta"]["updated_at"] para o timestamp atual.
    Retorna o dicionário modificado (in-place + retorno para encadeamento).

    💡 Conceito: Mutação in-place com retorno
       A função modifica o dicionário original (in-place) E retorna o mesmo objeto.
       Isso permite dois estilos de uso:
         dados = atualizar_timestamp(dados)   # encadeamento explícito
         atualizar_timestamp(dados)            # mutação silenciosa
       O primeiro estilo é preferível por ser mais legível.
    """
    dados["meta"]["updated_at"] = datetime.now().isoformat()
    return dados
