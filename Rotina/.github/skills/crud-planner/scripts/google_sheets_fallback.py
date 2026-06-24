"""
Fallback de acesso ao Google Sheets via Python.

Usado quando o servidor MCP (mcp-google-sheets) não está disponível.
Utiliza as mesmas credenciais de Service Account configuradas para o MCP.

Credenciais esperadas:
  - SERVICE_ACCOUNT_PATH : caminho para o arquivo JSON do Service Account
                           (padrão: C:/Users/renan.dalexandro/.claude/gsheets-credentials.json)
  - GOOGLE_SHEET_ID      : ID da planilha (extraído da URL)

Dependências:
  pip install google-auth google-auth-httplib2 google-api-python-client
"""

import os
import json
import sys

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


# ──────────────────────────────────────────────
# Configuração
# ──────────────────────────────────────────────

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

DEFAULT_CREDENTIALS_PATH = r"C:\Users\renan.dalexandro\.claude\gsheets-credentials.json"


# ──────────────────────────────────────────────
# Permissão do usuário
# ──────────────────────────────────────────────

def solicitar_permissao() -> bool:
    """
    Exibe aviso de falha no MCP e pergunta ao usuário como prosseguir.
    Retorna True se o usuário optar pelo fallback Python, False se quiser
    tentar o MCP novamente.
    """
    print()
    print("╔══════════════════════════════════════════════════════╗")
    print("║         ACESSO VIA MCP NÃO DISPONÍVEL                ║")
    print("╠══════════════════════════════════════════════════════╣")
    print("║  O servidor MCP (mcp-google-sheets) não respondeu.   ║")
    print("║                                                      ║")
    print("║  Como deseja prosseguir?                             ║")
    print("║                                                      ║")
    print("║  [1] Usar acesso direto via Python (este script)     ║")
    print("║  [2] Tentar conectar pelo MCP novamente              ║")
    print("║  [c] Cancelar operação                               ║")
    print("╚══════════════════════════════════════════════════════╝")
    print()

    while True:
        escolha = input("  Escolha uma opção: ").strip().lower()

        if escolha == "1":
            print()
            print("  Prosseguindo com acesso direto via Python...")
            print()
            return True

        elif escolha == "2":
            print()
            print("  ↩  Retornando para nova tentativa via MCP.")
            print("     Verifique se o servidor está ativo e tente novamente.")
            print()
            return False

        elif escolha == "c":
            print()
            print("  Operação cancelada pelo usuário.")
            print()
            sys.exit(0)

        else:
            print("  Opção inválida. Digite 1, 2 ou c.")


# ──────────────────────────────────────────────
# Conexão
# ──────────────────────────────────────────────

def conectar() -> object:
    """
    Autentica com o Service Account e retorna o objeto de serviço da API.
    Prioriza a variável de ambiente SERVICE_ACCOUNT_PATH; se ausente,
    usa o caminho padrão das credenciais do MCP.
    """
    credentials_path = os.environ.get("SERVICE_ACCOUNT_PATH", DEFAULT_CREDENTIALS_PATH)

    if not os.path.exists(credentials_path):
        raise FileNotFoundError(
            f"Arquivo de credenciais não encontrado: {credentials_path}\n"
            "Verifique a variável SERVICE_ACCOUNT_PATH ou o caminho padrão."
        )

    credentials = service_account.Credentials.from_service_account_file(
        credentials_path,
        scopes=SCOPES
    )

    service = build("sheets", "v4", credentials=credentials)
    return service


# ──────────────────────────────────────────────
# Operações básicas
# ──────────────────────────────────────────────

def ler_aba(service, sheet_id: str, aba: str, intervalo: str = None) -> list[list]:
    """
    Lê todos os valores de uma aba (ou intervalo específico).

    Args:
        service   : objeto de serviço retornado por conectar()
        sheet_id  : ID da planilha (GOOGLE_SHEET_ID)
        aba       : nome da aba (ex.: 'METAS', 'CICLO TRIMESTRAL')
        intervalo : intervalo opcional (ex.: 'A2:H'). Se None, lê a aba inteira.

    Returns:
        Lista de listas com os valores das células.
    """
    range_str = f"'{aba}'!{intervalo}" if intervalo else f"'{aba}'"

    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=sheet_id, range=range_str)
        .execute()
    )

    return result.get("values", [])


def escrever_linha(service, sheet_id: str, aba: str, linha: list) -> dict:
    """
    Acrescenta uma nova linha ao final de uma aba.

    Args:
        service  : objeto de serviço retornado por conectar()
        sheet_id : ID da planilha
        aba      : nome da aba
        linha    : lista de valores a inserir

    Returns:
        Resposta da API com detalhes da inserção.
    """
    result = (
        service.spreadsheets()
        .values()
        .append(
            spreadsheetId=sheet_id,
            range=f"'{aba}'!A:A",
            valueInputOption="USER_ENTERED",
            insertDataOption="INSERT_ROWS",
            body={"values": [linha]},
        )
        .execute()
    )

    return result


def atualizar_celula(service, sheet_id: str, aba: str, celula: str, valor) -> dict:
    """
    Atualiza o valor de uma célula específica.

    Args:
        service  : objeto de serviço retornado por conectar()
        sheet_id : ID da planilha
        aba      : nome da aba
        celula   : referência da célula (ex.: 'A5', 'F12')
        valor    : novo valor a gravar

    Returns:
        Resposta da API.
    """
    result = (
        service.spreadsheets()
        .values()
        .update(
            spreadsheetId=sheet_id,
            range=f"'{aba}'!{celula}",
            valueInputOption="USER_ENTERED",
            body={"values": [[valor]]},
        )
        .execute()
    )

    return result


# ──────────────────────────────────────────────
# Exemplo de uso
# ──────────────────────────────────────────────

if __name__ == "__main__":
    prosseguir = solicitar_permissao()

    if not prosseguir:
        sys.exit(0)

    sheet_id = os.environ.get("GOOGLE_SHEET_ID")
    if not sheet_id:
        print("ERRO: variável GOOGLE_SHEET_ID não definida no ambiente.")
        sys.exit(1)

    try:
        service = conectar()
        print("  Conexão estabelecida com sucesso.")
        print()

        # Exemplo: leitura da aba METAS
        rows = ler_aba(service, sheet_id, "METAS", "A2:H")
        print(f"  Metas encontradas: {len(rows)}")
        for row in rows:
            print(f"    {row[0]} · {row[2]} ({row[7]})")

    except FileNotFoundError as e:
        print(f"ERRO de credenciais: {e}")
        sys.exit(1)

    except HttpError as e:
        print(f"ERRO na API do Google Sheets: {e}")
        sys.exit(1)
