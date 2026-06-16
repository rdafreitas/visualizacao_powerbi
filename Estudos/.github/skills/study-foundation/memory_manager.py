"""
memory_manager.py — Gerenciamento de memória persistente do pipeline.

Responsabilidade única: ler, escrever e migrar o arquivo study-memory.json,
detectar progresso anterior pelo hash SHA-256 do PDF, e oferecer retomada.

Padrões aplicados:
- Singleton: Leitura única do arquivo na inicialização; um único ponto de escrita
- Schema Migration: Atualização automática de versões antigas sem perda de dados
- Escrita Atômica: .tmp + rename para evitar corrupção em caso de crash

Conceitos de programação presentes neste arquivo:
- hashlib.sha256: Função de hash criptográfica — gera "impressão digital" de 64 chars
- pathlib.Path: API moderna para manipulação de caminhos (melhor que os.path)
- json.dump/load: Serialização de dicionários Python para/de JSON
- os.replace: Rename atômico — substitui o arquivo de destino em uma operação
- Módulo como estado (variável global _memoria): Singleton simplificado sem classe
"""

import json
import hashlib
import os
from pathlib import Path
from datetime import datetime

from data_contracts import criar_diretorios_workspace


# ─── Constantes ───────────────────────────────────────────────────────────────

VERSAO_ATUAL = "1.0"
NOME_ARQUIVO = "study-memory.json"

# ─── Estado do módulo (Singleton simplificado) ────────────────────────────────
# Em Python, variáveis no nível do módulo são compartilhadas por todos que
# importam este módulo. Isso funciona como um Singleton sem precisar de classe.
# _memoria guarda o dicionário em memória; _workspace_dir guarda o caminho.

_memoria: dict | None = None
_workspace_dir: str | None = None


# ─── Estrutura padrão do study-memory.json ────────────────────────────────────

def _criar_estrutura_padrao() -> dict:
    """
    Retorna a estrutura inicial de study-memory.json.

    💡 Conceito: Funções prefixadas com _ (underscore) são "privadas"
       por convenção em Python. Significa que são para uso interno do módulo —
       outros módulos não devem chamá-las diretamente. O Python não impede
       tecnicamente (diferente de Java/C#), mas a convenção é respeitada.
    """
    agora = datetime.now().isoformat()
    return {
        "version": VERSAO_ATUAL,
        "created_at": agora,
        "updated_at": agora,
        "current_session": None,
        "preferences": {
            "banca_padrao": "",
            "deck_anki_padrao": "",
            "debug_mode": False,
            "output_dir": "data",
            "rag_level": "basico",
        },
        "history": [],
    }


# ─── Funções públicas ─────────────────────────────────────────────────────────

def inicializar(workspace_dir: str) -> dict:
    """
    Cria study-memory.json com valores padrão se não existir.
    Também cria todos os diretórios do workspace (delega para data_contracts).
    Retorna o dicionário carregado (estado inicial ou existente após migração).

    💡 Conceito prático: Inicialização idempotente
       "Idempotente" = chamar N vezes produz o mesmo resultado que chamar 1 vez.
       Se o arquivo já existir, apenas carrega. Se não, cria com valores padrão.
       Isso torna o programa seguro para ser executado múltiplas vezes sem efeito
       colateral — padrão muito usado em scripts de deploy e configuração.
    """
    global _memoria, _workspace_dir
    _workspace_dir = workspace_dir

    # Criar diretórios do workspace (idempotente — não falha se já existirem)
    criar_diretorios_workspace(workspace_dir)

    caminho = Path(workspace_dir) / NOME_ARQUIVO

    if caminho.exists():
        # Arquivo existe — tentar carregar e migrar se necessário
        try:
            _memoria = carregar(workspace_dir)
        except ValueError:
            # Arquivo corrompido — fazer backup e recriar
            # 💡 Conceito: Resiliência a falhas
            #    Em vez de crashar quando o arquivo está corrompido, fazemos
            #    backup (para análise posterior) e recriamos com valores padrão.
            #    O usuário perde o progresso, mas não fica bloqueado.
            _fazer_backup_corrompido(caminho)
            _memoria = _criar_estrutura_padrao()
            salvar(workspace_dir, _memoria)
    else:
        # Primeira execução — criar com valores padrão
        _memoria = _criar_estrutura_padrao()
        salvar(workspace_dir, _memoria)

    return _memoria


def carregar(workspace_dir: str) -> dict:
    """
    Lê study-memory.json do disco uma única vez.
    Aplica migração de schema se a versão do arquivo for anterior à atual.

    Lança FileNotFoundError se o arquivo não existir.
    Lança ValueError se o arquivo estiver corrompido (JSON inválido).

    💡 Conceito: Tratamento de exceções em camadas
       Esta função distingue dois tipos de erro:
       - FileNotFoundError: o arquivo não existe (chamar inicializar() primeiro)
       - ValueError: o arquivo existe mas contém JSON inválido (corrompido)
       Cada erro tem uma mensagem clara que ajuda quem está depurando.
    """
    caminho = Path(workspace_dir) / NOME_ARQUIVO

    if not caminho.exists():
        raise FileNotFoundError(
            f"Arquivo de memória não encontrado: {caminho}. "
            "Execute inicializar() primeiro para criar o arquivo."
        )

    try:
        with open(caminho, "r", encoding="utf-8") as f:
            dados = json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Arquivo de memória corrompido ({caminho}): {e}. "
            "O arquivo não contém JSON válido."
        ) from e

    # Migrar schema se versão for anterior à atual
    versao_arquivo = dados.get("version", "0.0")
    if versao_arquivo != VERSAO_ATUAL:
        dados = migrar_schema(dados, versao_arquivo)

    return dados


def salvar(workspace_dir: str, memoria: dict) -> None:
    """
    Escreve o dicionário 'memoria' em study-memory.json com escrita atômica.
    Atualiza 'updated_at' automaticamente antes de salvar.

    💡 Conceito: Escrita Atômica (write-then-rename)
       Passo 1: Escrever em arquivo temporário (.tmp)
       Passo 2: Renomear .tmp para o arquivo final (os.replace)

       Por que isso é seguro? O os.replace() é uma operação atômica no SO —
       ou substitui o arquivo por completo, ou não faz nada (se falhar).
       Se o programa crashar durante o passo 1, o .tmp fica incompleto
       mas o arquivo original permanece intacto.

       Isso é o mesmo padrão usado por editores de texto (Notepad++, VS Code)
       e bancos de dados para evitar corrupção de dados.
    """
    memoria["updated_at"] = datetime.now().isoformat()

    caminho = Path(workspace_dir) / NOME_ARQUIVO
    caminho_tmp = caminho.with_suffix(".tmp")

    # Passo 1: Escrever em arquivo temporário
    with open(caminho_tmp, "w", encoding="utf-8") as f:
        json.dump(memoria, f, ensure_ascii=False, indent=2)

    # Passo 2: Rename atômico — substitui o arquivo original
    os.replace(str(caminho_tmp), str(caminho))


def calcular_hash_pdf(caminho_pdf: str) -> str:
    """
    Lê o arquivo PDF em chunks e calcula SHA-256.
    Retorna string no formato "sha256:<64 hex chars>".

    💡 Conceito: Leitura em chunks (blocos)
       Não carregamos o PDF inteiro na memória de uma vez — um PDF pode ter
       centenas de MB. Em vez disso, lemos em blocos de 8KB e alimentamos o
       algoritmo de hash incrementalmente. O resultado é idêntico, mas o uso
       de memória é constante (≈ 8KB) independente do tamanho do arquivo.

       Analogia: é como calcular a média de um rio medindo uma balde por vez,
       em vez de tentar colocar todo o rio numa piscina para medir.
    """
    sha256 = hashlib.sha256()
    caminho = Path(caminho_pdf)

    if not caminho.exists():
        raise FileNotFoundError(
            f"Arquivo PDF não encontrado: {caminho_pdf}"
        )

    with open(caminho, "rb") as f:
        while chunk := f.read(8192):  # 8KB por vez
            sha256.update(chunk)

    return f"sha256:{sha256.hexdigest()}"


def detectar_progresso(pdf_hash: str, memoria: dict) -> dict | None:
    """
    Busca sessão ativa cujo hash corresponda ao pdf_hash informado.
    Retorna a current_session se o hash coincidir, None caso contrário.

    💡 Conceito: Early return (retorno antecipado)
       Quando a condição principal não é atendida, retornamos imediatamente
       com None — sem else, sem nested if. Isso torna o código mais legível:
       primeiro eliminamos os casos triviais, depois lidamos com o caso principal.
    """
    sessao = memoria.get("current_session")

    if sessao is None:
        return None

    if sessao.get("pdf_hash") != pdf_hash:
        return None

    return sessao


def registrar_fase_concluida(
    fase: int,
    pdf_hash: str,
    variaveis_intermediarias: dict | None,
    memoria: dict,
) -> dict:
    """
    Atualiza a sessão atual com a fase concluída e artefatos gerados.
    Cria uma nova sessão se não houver current_session ativa.

    💡 Conceito: Função pura vs. função com efeito colateral
       Esta função MODIFICA o dicionário passado (efeito colateral) em vez
       de criar uma cópia. Em Python, dicts são passados por referência —
       modificar 'memoria' aqui modifica o mesmo objeto no chamador.
       Isso é intencional: queremos que todos os módulos vejam o mesmo estado.
    """
    sessao = memoria.get("current_session")

    if sessao is None:
        # Criar nova sessão
        agora = datetime.now().isoformat()
        sessao = {
            "pdf_hash": pdf_hash,
            "pdf_filename": "",
            "current_phase": fase,
            "completed_phases": [],
            "started_at": agora,
            "last_checkpoint": agora,
            "artifacts": {
                "edital_md": None,
                "topicos_json": None,
                "relevancia_json": None,
                "gdoc_url": None,
                "anki_result_json": None,
            },
        }
        memoria["current_session"] = sessao

    # Registrar fase como concluída
    if fase not in sessao["completed_phases"]:
        sessao["completed_phases"].append(fase)
        sessao["completed_phases"].sort()

    sessao["current_phase"] = fase
    sessao["last_checkpoint"] = datetime.now().isoformat()

    # Mesclar artefatos se fornecidos
    if variaveis_intermediarias:
        for chave, valor in variaveis_intermediarias.items():
            if chave in sessao["artifacts"]:
                sessao["artifacts"][chave] = valor

    return memoria


def migrar_schema(dados: dict, versao_atual: str) -> dict:
    """
    Aplica transformações sequenciais versão por versão.
    Preserva todos os dados existentes — migrações são sempre ADITIVAS.

    💡 Conceito: Schema Migration (Migração de Schema)
       É o mesmo padrão usado por frameworks como Django, Rails e Alembic:
       cada versão define "o que precisa mudar" em relação à anterior.
       As migrações são aplicadas em sequência: 1.0 → 1.1 → 2.0.
       Nunca "pular" versões — cada passo pode depender do anterior.

       Regra de ouro: Migrações APENAS ADICIONAM campos com valores padrão.
       Nunca removem ou renomeiam — para manter compatibilidade retroativa.
    """
    # Mapa de migrações: "versao_origem" → função de transformação
    migracoes = {
        # Exemplo: quando criarmos versão 1.1, adicionaremos:
        # "1.0": _migrar_1_0_para_1_1,
    }

    versao = versao_atual

    # Aplicar migrações sequenciais até chegar na versão atual
    while versao in migracoes:
        dados = migracoes[versao](dados)
        versao = dados.get("version", VERSAO_ATUAL)

    # Garantir que a versão final está correta
    dados["version"] = VERSAO_ATUAL

    return dados


# ─── Funções internas de migração ─────────────────────────────────────────────
# (Serão adicionadas conforme o projeto evolui)

def _fazer_backup_corrompido(caminho: Path) -> None:
    """
    Renomeia o arquivo corrompido com sufixo .corrupted.<timestamp>
    para preservar o conteúdo para análise posterior.

    💡 Conceito: Nunca apagar dados do usuário silenciosamente
       Mesmo que o arquivo esteja quebrado, pode conter informação útil
       para diagnosticar o problema. Renomear em vez de deletar é mais seguro.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = caminho.with_suffix(f".corrupted.{timestamp}.json")
    os.replace(str(caminho), str(backup))
    print(
        f"⚠️  Arquivo de memória corrompido detectado.\n"
        f"   Backup salvo em: {backup.name}\n"
        f"   Um novo arquivo será criado com valores padrão."
    )

# def _migrar_1_0_para_1_1(dados: dict) -> dict:
#     """Adiciona campo preferences.rag_level se ausente."""
#     if "rag_level" not in dados.get("preferences", {}):
#         dados.setdefault("preferences", {})["rag_level"] = "basico"
#     dados["version"] = "1.1"
#     return dados
