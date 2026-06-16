"""
logger.py — Sistema de logging estruturado com 5 níveis e rotação automática.

Responsabilidade única: registrar eventos em /logs/execution_log.json sem que
os módulos chamadores precisem saber como o log é armazenado.

Padrão aplicado: Observer Simplificado — qualquer módulo chama log() e o logger
decide como persistir. Mudar a implementação (arquivo → banco → console) não
afeta nenhum chamador.

Conceitos de programação presentes neste arquivo:
- uuid.uuid4(): Gera identificador único universal (128 bits aleatórios)
- json.load/dump: Serialização de estruturas Python para JSON e vice-versa
- Append em arquivo: Adicionamos entradas ao final do array sem reescrever tudo
- Rotação de log: Quando o arquivo fica grande, renomeia e começa um novo
- Variáveis de módulo como configuração: _log_dir e _debug_mode como estado global
"""

import json
import uuid
import os
from pathlib import Path
from datetime import datetime


# ─── Constantes: Níveis de log ────────────────────────────────────────────────
# Os 5 níveis em ordem crescente de severidade.
# DEBUG < INFO < DECISION < WARNING < ERROR
#
# 💡 Conceito: Constantes em UPPER_CASE
#    Por convenção Python (PEP 8), variáveis que nunca mudam de valor são
#    escritas em MAIÚSCULAS_COM_UNDERSCORE. Isso sinaliza para outros devs
#    que esses valores são fixos — como "enum" em outras linguagens.

DEBUG = "DEBUG"
INFO = "INFO"
DECISION = "DECISION"
WARNING = "WARNING"
ERROR = "ERROR"

NIVEIS_VALIDOS = {DEBUG, INFO, DECISION, WARNING, ERROR}
LIMITE_ROTACAO = 10_000  # Máximo de entradas antes de rotacionar

NOME_LOG = "execution_log.json"

# ─── Estado do módulo ─────────────────────────────────────────────────────────
# Configurados por configurar() na inicialização do pipeline.

_log_dir: str | None = None
_debug_mode: bool = False


# ─── Configuração ─────────────────────────────────────────────────────────────

def configurar(log_dir: str, debug_mode: bool = False) -> None:
    """
    Define o diretório de logs e o modo debug.
    Deve ser chamada uma vez na inicialização, antes de qualquer log().

    💡 Conceito: Configuração explícita vs. mágica
       Prefira sempre que a configuração seja feita por uma chamada explícita
       (como esta função) em vez de ler variáveis de ambiente magicamente.
       Isso torna o fluxo do programa previsível e testável.
    """
    global _log_dir, _debug_mode
    _log_dir = log_dir
    _debug_mode = debug_mode

    # Garantir que o diretório de logs existe
    Path(log_dir).mkdir(parents=True, exist_ok=True)


# ─── Função principal de logging ──────────────────────────────────────────────

def log(
    level: str,
    event: str,
    phase: int = 0,
    input_data: dict | None = None,
    output_data: dict | None = None,
    decision: str | None = None,
    sources: list[str] | None = None,
) -> None:
    """
    Registra uma entrada estruturada no execution_log.json.
    Gera UUID4 e timestamp automaticamente.
    Rotaciona o arquivo se atingir 10.000 entradas.

    Parâmetros:
        level: Um de DEBUG, INFO, DECISION, WARNING, ERROR
        event: Identificador em snake_case (ex: "phase_start", "arquivo_salvo")
        phase: Número da fase do pipeline (0 a 6)
        input_data: Dados de entrada relevantes para o evento
        output_data: Dados de saída gerados pelo evento
        decision: Texto da decisão (obrigatório se level == DECISION)
        sources: Fontes consultadas (ex: ["edital", "ia", "filesystem"])

    💡 Conceito: Named parameters com valores padrão
       Em Python, parâmetros com valor padrão (= None) são opcionais.
       Isso permite chamar a função de forma simples:
         log(INFO, "phase_start")  → mínimo necessário
         log(DECISION, "classificacao", decision="Alta relevância")  → com extras

       Usar parâmetros nomeados (keyword arguments) torna o código legível:
       você sabe o que cada valor significa sem consultar a assinatura.
    """
    if _log_dir is None:
        raise RuntimeError(
            "Logger não configurado. Chame configurar(log_dir) antes de log()."
        )

    if level not in NIVEIS_VALIDOS:
        raise ValueError(
            f"Nível de log inválido: '{level}'. "
            f"Valores aceitos: {', '.join(sorted(NIVEIS_VALIDOS))}"
        )

    # Criar entrada de log com campos obrigatórios
    entrada = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "phase": phase,
        "level": level,
        "event": event,
        "input": input_data,
        "output": output_data,
        "decision": decision,
        "sources": sources if sources is not None else [],
    }

    # Persistir no arquivo
    _appendar_entrada(entrada)

    # Exibir para o usuário conforme regras de visibilidade
    exibir_para_usuario(entrada, _debug_mode)

    # Verificar necessidade de rotação
    rotacionar_se_necessario()


# ─── Rotação de log ───────────────────────────────────────────────────────────

def rotacionar_se_necessario() -> bool:
    """
    Verifica o número de entradas no log atual.
    Se >= 10.000: renomeia para execution_log_<YYYYMMDD_HHMMSS>.json
    e cria novo arquivo vazio.

    Retorna True se rotação ocorreu, False caso contrário.

    💡 Conceito: Rotação de log (Log Rotation)
       Logs crescem indefinidamente. Um arquivo com 1 milhão de entradas fica
       lento para abrir e pesquisar. A rotação resolve: quando atinge um limite,
       o arquivo é "arquivado" com timestamp no nome e um novo arquivo vazio começa.
       É o mesmo que o logrotate faz no Linux e o IIS no Windows.
    """
    caminho_log = Path(_log_dir) / NOME_LOG

    if not caminho_log.exists():
        return False

    try:
        with open(caminho_log, "r", encoding="utf-8") as f:
            entradas = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return False

    if len(entradas) < LIMITE_ROTACAO:
        return False

    # Rotacionar: renomear com timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nome_rotacionado = f"execution_log_{timestamp}.json"
    caminho_rotacionado = Path(_log_dir) / nome_rotacionado

    os.replace(str(caminho_log), str(caminho_rotacionado))

    # Criar novo arquivo vazio
    with open(caminho_log, "w", encoding="utf-8") as f:
        json.dump([], f)

    return True


# ─── Exibição para o usuário ──────────────────────────────────────────────────

def exibir_para_usuario(entry: dict, debug_mode: bool) -> None:
    """
    Controla o que é exibido ao usuário no chat/console.

    Modo normal: exibe apenas WARNING e ERROR.
    Modo debug: exibe também DEBUG e DECISION com contexto completo.

    💡 Conceito: Separação entre persistência e exibição
       O log() SEMPRE persiste no arquivo (todas as entradas).
       A exibição é filtrada com base no modo — isso permite que um
       desenvolvedor investigue problemas ativando --debug sem que o
       usuário normal seja bombardeado com informações técnicas.
    """
    level = entry.get("level", "")

    # Modo normal: apenas WARNING e ERROR são exibidos
    if not debug_mode and level not in (WARNING, ERROR):
        return

    # Formatar mensagem para exibição
    timestamp = entry.get("timestamp", "")[:19]  # Cortar microssegundos
    event = entry.get("event", "")
    phase = entry.get("phase", "?")

    prefixo = f"[{level}][Fase {phase}]"

    if level == ERROR:
        print(f"❌ {prefixo} {event}")
    elif level == WARNING:
        print(f"⚠️  {prefixo} {event}")
    elif level == DECISION and debug_mode:
        decisao = entry.get("decision", "")
        print(f"🔍 {prefixo} {event}: {decisao}")
    elif debug_mode:
        print(f"📋 {prefixo} {event}")


# ─── Funções internas ─────────────────────────────────────────────────────────

def _appendar_entrada(entrada: dict) -> None:
    """
    Adiciona uma entrada ao final do array no execution_log.json.

    💡 Conceito: Append em JSON array
       JSON não suporta "append" nativo como um banco de dados. Precisamos:
       1. Ler o array inteiro
       2. Adicionar o item ao final
       3. Reescrever o arquivo completo

       Para um arquivo com < 10.000 entradas (nosso limite de rotação),
       isso é aceitável em termos de performance. Para volumes maiores,
       usaríamos um banco de dados ou formato de log append-only (JSONL).
    """
    caminho_log = Path(_log_dir) / NOME_LOG

    # Carregar entradas existentes ou iniciar array vazio
    if caminho_log.exists():
        try:
            with open(caminho_log, "r", encoding="utf-8") as f:
                entradas = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            entradas = []
    else:
        entradas = []

    # Append da nova entrada
    entradas.append(entrada)

    # Reescrever o arquivo
    with open(caminho_log, "w", encoding="utf-8") as f:
        json.dump(entradas, f, ensure_ascii=False, indent=2)
