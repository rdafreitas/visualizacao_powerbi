"""
Cria um Google Doc a partir de um arquivo de tópicos formatados.

Formato esperado do arquivo de entrada (_topicos.txt):
    Tema principal do parágrafo:
    \t• Explicação principal
    \t\t• Detalhe 1
    \t\t• Detalhe 2
    \t• Segunda explicação
    \t\t• Detalhe da segunda explicação

Regras de nível (definidas pelo número de tabs no início da linha):
    0 tabs → L1: tema/cabeçalho (HEADING_2 no Google Docs, negrito)
    1 tab  → L2: explicação principal (normal, indent 18pt)
    2 tabs → L3: detalhe           (normal, indent 36pt)
    3 tabs → L4: detalhe adicional (normal, indent 54pt)

Uso:
    python create_gdoc.py <topicos.txt> <titulo_do_doc> <credentials.json>

Exemplo:
    python create_gdoc.py "C:/Concurso/materia_topicos.txt" "Direito Constitucional - Resumo" "C:/Concurso/credentials.json"

Pré-requisitos:
    pip install google-auth-oauthlib google-api-python-client
"""

import sys
import os

SCOPES = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive.file",
]
INDENT_PER_LEVEL_PT = 18  # 18pt por nível de indentação


def autenticar(credentials_path: str):
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request

    credentials_path = os.path.abspath(credentials_path)
    if not os.path.isfile(credentials_path):
        sys.exit(f"ERRO: credentials.json não encontrado em: {credentials_path}")

    token_path = os.path.join(os.path.dirname(credentials_path), "token.json")
    creds = None

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_path, "w", encoding="utf-8") as f:
            f.write(creds.to_json())

    return creds


def parse_topicos(path: str) -> list:
    """
    Lê o arquivo de tópicos e retorna lista de (level: int, text: str).
    level é determinado pelo número de tabs no início da linha.
    """
    result = []
    path = os.path.abspath(path)
    if not os.path.isfile(path):
        sys.exit(f"ERRO: arquivo de tópicos não encontrado: {path}")

    with open(path, encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.rstrip("\n\r")
            if not line.strip():
                result.append((0, ""))
                continue
            stripped = line.lstrip("\t")
            level = len(line) - len(stripped)
            text = stripped.lstrip("•").strip()
            result.append((level, text))
    return result


def criar_gdoc(topicos_path: str, titulo: str, credentials_path: str) -> str:
    try:
        from googleapiclient.discovery import build
    except ImportError:
        sys.exit(
            "ERRO: dependências não instaladas.\n"
            "Execute: pip install google-auth-oauthlib google-api-python-client"
        )

    creds = autenticar(credentials_path)
    docs = build("docs", "v1", credentials=creds)

    doc = docs.documents().create(body={"title": titulo}).execute()
    doc_id = doc["documentId"]
    url = f"https://docs.google.com/document/d/{doc_id}/edit"
    print(f"Documento criado: {url}")

    topicos = parse_topicos(topicos_path)

    # Fase 1: construir o texto completo e mapear posições de cada parágrafo
    full_text = ""
    para_map = []  # (start_in_fulltext, end_in_fulltext, level, has_text)

    for level, text in topicos:
        if not text:
            seg = "\n"
            para_map.append((len(full_text), len(full_text) + len(seg), level, False))
        else:
            if level == 0:
                seg = text + "\n"
            else:
                seg = "• " + text + "\n"
            para_map.append((len(full_text), len(full_text) + len(seg), level, True))
        full_text += seg

    # Fase 2: montar requests (inserção + formatação)
    # O índice 1 corresponde ao início do body em um documento novo do Google Docs.
    DOC_OFFSET = 1
    requests = [
        {
            "insertText": {
                "location": {"index": DOC_OFFSET},
                "text": full_text,
            }
        }
    ]

    for start, end, level, has_text in para_map:
        if not has_text:
            continue
        abs_start = DOC_OFFSET + start
        abs_end = DOC_OFFSET + end  # inclui o \n para aplicar estilo ao parágrafo inteiro

        if level == 0:
            requests.append(
                {
                    "updateParagraphStyle": {
                        "range": {"startIndex": abs_start, "endIndex": abs_end},
                        "paragraphStyle": {
                            "namedStyleType": "HEADING_2",
                            "spaceAbove": {"magnitude": 12, "unit": "PT"},
                            "spaceBelow": {"magnitude": 4, "unit": "PT"},
                        },
                        "fields": "namedStyleType,spaceAbove,spaceBelow",
                    }
                }
            )
        else:
            indent_pt = level * INDENT_PER_LEVEL_PT
            # indentFirstLine fica 9pt antes do indentStart para criar efeito hanging
            first_line_pt = max(0, indent_pt - 9)
            requests.append(
                {
                    "updateParagraphStyle": {
                        "range": {"startIndex": abs_start, "endIndex": abs_end},
                        "paragraphStyle": {
                            "namedStyleType": "NORMAL_TEXT",
                            "indentStart": {"magnitude": indent_pt, "unit": "PT"},
                            "indentFirstLine": {"magnitude": first_line_pt, "unit": "PT"},
                            "spaceAbove": {"magnitude": 2, "unit": "PT"},
                        },
                        "fields": "namedStyleType,indentStart,indentFirstLine,spaceAbove",
                    }
                }
            )

    # Fase 3: enviar em lotes de 50 (limite seguro da API)
    BATCH_SIZE = 50
    total = len(requests)
    for i in range(0, total, BATCH_SIZE):
        batch = requests[i : i + BATCH_SIZE]
        docs.documents().batchUpdate(
            documentId=doc_id,
            body={"requests": batch},
        ).execute()
        print(f"  Formatando... {min(i + BATCH_SIZE, total)}/{total} requisições enviadas.")

    print(f"\n✅ Google Doc criado com sucesso!")
    print(f"   Título : {titulo}")
    print(f"   URL    : {url}")
    return url


if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(
            "Uso: python create_gdoc.py <topicos.txt> <titulo_do_doc> <credentials.json>"
        )
    criar_gdoc(sys.argv[1], sys.argv[2], sys.argv[3])
