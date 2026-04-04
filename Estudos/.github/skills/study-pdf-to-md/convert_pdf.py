"""
Converte um arquivo PDF para Markdown usando a biblioteca MarkItDown (Microsoft).

Uso:
    python convert_pdf.py <caminho_pdf> [pasta_saida]

Exemplos:
    python convert_pdf.py "C:/Concurso/materia.pdf"
    python convert_pdf.py "C:/Concurso/materia.pdf" "C:/Concurso/markdowns"

Pré-requisito:
    pip install markitdown
"""

import sys
import os


def convert(pdf_path: str, output_dir: str = None) -> str:
    try:
        from markitdown import MarkItDown
    except ImportError:
        sys.exit(
            "ERRO: biblioteca 'markitdown' não está instalada.\n"
            "Execute: pip install markitdown"
        )

    pdf_path = os.path.abspath(pdf_path)
    if not os.path.isfile(pdf_path):
        sys.exit(f"ERRO: arquivo não encontrado: {pdf_path}")

    if output_dir is None:
        output_dir = os.path.dirname(pdf_path)

    os.makedirs(output_dir, exist_ok=True)

    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    md_path = os.path.join(output_dir, f"{base_name}.md")

    if os.path.exists(md_path):
        resp = input(f"Arquivo '{md_path}' já existe. Sobrescrever? (s/N): ").strip().lower()
        if resp != "s":
            sys.exit("Operação cancelada pelo usuário.")

    print(f"Convertendo '{pdf_path}'...")
    md = MarkItDown()
    result = md.convert(pdf_path)

    with open(md_path, "w", encoding="utf-8") as f:
        f.write(result.text_content)

    print(f"✅ Conversão concluída: {md_path}")
    return md_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Uso: python convert_pdf.py <caminho_pdf> [pasta_saida]")

    convert(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
