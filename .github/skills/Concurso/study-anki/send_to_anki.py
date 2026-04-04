"""
Cria um flashcard no Anki Desktop via AnkiConnect (API REST em localhost:8765).

O Anki Desktop deve estar aberto com o plugin AnkiConnect instalado.
Código do plugin: 2055492159 (Ferramentas → Complementos → Obter complementos)

Uso:
    python send_to_anki.py <frente> <verso> [deck] [tag]

Exemplos:
    python send_to_anki.py "O que é estatística?" "Ciência que coleta e analisa dados" "Concursos"
    python send_to_anki.py "O que é estatística?" "Ciência que coleta e analisa dados" "Concursos" "estatistica"

Nota: use \\n no verso para inserir quebras de linha.
"""

import sys
import json
import urllib.request
import urllib.error

ANKICONNECT_URL = "http://127.0.0.1:8765"
VERSO_MAX_CHARS = 2000


def ankiconnect(action: str, **params):
    payload = json.dumps({"action": action, "version": 6, "params": params}).encode("utf-8")
    req = urllib.request.Request(
        ANKICONNECT_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.load(resp)
    except urllib.error.URLError:
        sys.exit(
            "ERRO: Não foi possível conectar ao AnkiConnect.\n"
            "Verifique se:\n"
            "  1. O Anki Desktop está aberto.\n"
            "  2. O plugin AnkiConnect está instalado (código: 2055492159).\n"
            "  3. Nenhum firewall está bloqueando localhost:8765."
        )

    if data.get("error"):
        sys.exit(f"ERRO AnkiConnect: {data['error']}")

    return data.get("result")


def criar_cartao(frente: str, verso: str, deck: str = "Concursos", tag: str = "") -> int:
    # Substituir \n literal por quebra de linha real
    verso = verso.replace("\\n", "\n")

    # Truncar o verso se muito longo
    if len(verso) > VERSO_MAX_CHARS:
        verso = verso[:VERSO_MAX_CHARS] + "\n\n[... conteúdo truncado]"
        print(f"Aviso: o verso foi truncado para {VERSO_MAX_CHARS} caracteres.")

    # Criar o deck se não existir
    ankiconnect("createDeck", deck=deck)

    tags = [t.strip() for t in tag.split(",") if t.strip()] if tag else []

    note_id = ankiconnect(
        "addNote",
        note={
            "deckName": deck,
            "modelName": "Basic",
            "fields": {
                "Front": frente,
                "Back": verso,
            },
            "options": {
                "allowDuplicate": False,
                "duplicateScope": "deck",
            },
            "tags": tags,
        },
    )

    if note_id is None:
        print("Aviso: cartão não criado — possível duplicata no deck.")
        return -1

    print(f"✅ Cartão criado no deck '{deck}' (noteId: {note_id})")
    return note_id


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit("Uso: python send_to_anki.py <frente> <verso> [deck] [tag]")

    frente_arg = sys.argv[1]
    verso_arg = sys.argv[2]
    deck_arg = sys.argv[3] if len(sys.argv) > 3 else "Concursos"
    tag_arg = sys.argv[4] if len(sys.argv) > 4 else ""

    criar_cartao(frente_arg, verso_arg, deck_arg, tag_arg)
