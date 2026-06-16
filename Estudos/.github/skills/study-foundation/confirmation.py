"""
confirmation.py — Confirmação de ações destrutivas antes de executar.

Responsabilidade única: solicitar confirmação explícita do usuário antes de
sobrescrever arquivos, publicar externamente ou reprocessar artefatos.

Princípio de design: Constitution II — "O agente DEVE solicitar confirmação
antes de qualquer ação destrutiva". Nenhum arquivo existente é sobrescrito
silenciosamente; nenhuma publicação externa ocorre sem consentimento.

Conceitos de programação presentes neste arquivo:
- input(): Leitura de entrada do usuário via console/chat
- Funções com retorno booleano: Simplificam lógica do chamador (if/else direto)
- Strings f"": Formatação de strings com variáveis embutidas (f-strings)
- Early return: Retornar imediatamente quando a condição principal não se aplica
"""

from pathlib import Path


def confirmar_sobrescrita(caminho: str) -> bool:
    """
    Se o arquivo em 'caminho' existir: exibe mensagem PT-BR e aguarda S/n.
    Se o arquivo não existir: retorna True sem interação (nada a confirmar).

    Retorna True se o usuário confirmar OU se o arquivo não existir.
    Retorna False se o usuário recusar.

    💡 Conceito: Guard clause (cláusula de guarda)
       A primeira verificação ("arquivo não existe → retorna True") é uma
       guard clause. Ela elimina o caso trivial logo no início, evitando
       que o resto da função fique dentro de um "if arquivo_existe:".
       Resultado: código mais plano e legível (menos indentação).
    """
    arquivo = Path(caminho)

    if not arquivo.exists():
        return True

    print(f"\n⚠️  Arquivo já existe: {caminho}")
    print(f"   Tamanho: {arquivo.stat().st_size} bytes")
    resposta = input("   Deseja sobrescrever? (s/n): ").strip().lower()

    return resposta == "s"


def confirmar_acao(mensagem: str, detalhe: str | None = None) -> bool:
    """
    Exibe 'mensagem' ao usuário e aguarda confirmação S/n.
    Se 'detalhe' fornecido, exibe antes da pergunta de confirmação.

    Retorna True se confirmado, False se recusado.

    💡 Conceito: Parâmetro opcional (detalhe: str | None = None)
       O operador | (pipe) em type hints (Python 3.10+) significa "OU".
       str | None = "pode ser string OU None". O valor padrão None indica
       que o chamador não é obrigado a fornecer esse argumento.
       Isso torna a função flexível: pode ser chamada com ou sem detalhe.
    """
    print(f"\n❓ {mensagem}")

    if detalhe:
        print(f"   Detalhe: {detalhe}")

    resposta = input("   Confirmar? (s/n): ").strip().lower()

    return resposta == "s"


def confirmar_reprocessamento(
    artefato: str,
    pdf_hash_atual: str,
    meta_hash_existente: str,
) -> str:
    """
    Quando artefato em /data/ já existe com mesmo hash (PDF não mudou):
    Oferece 3 opções ao usuário em PT-BR.

    Retorna: "reutilizar", "reprocessar" ou "cancelar"

    💡 Conceito: Retorno de string como "enum pobre"
       Em linguagens com enum (Java, TypeScript), usaríamos um tipo enumerado.
       Em Python, podemos usar strings + documentação clara. A desvantagem é
       que o compilador não verifica erros de digitação. A vantagem é simplicidade.
       Para projetos maiores, use enum.Enum do stdlib.
    """
    print(f"\n🔄 Artefato já existe: {artefato}")

    if pdf_hash_atual == meta_hash_existente:
        print("   O PDF de origem não mudou (hash idêntico).")
    else:
        print("   ⚠️  O PDF de origem MUDOU desde a última geração.")

    print("\n   Opções:")
    print("   [1] Reutilizar o artefato existente (mais rápido)")
    print("   [2] Reprocessar do zero (gera novo artefato)")
    print("   [3] Cancelar operação")

    while True:
        resposta = input("   Escolha (1/2/3): ").strip()

        if resposta == "1":
            return "reutilizar"
        elif resposta == "2":
            return "reprocessar"
        elif resposta == "3":
            return "cancelar"
        else:
            print("   Opção inválida. Digite 1, 2 ou 3.")
