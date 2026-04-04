---
name: study-pdf-to-md
description: "Converter um arquivo PDF de estudo para Markdown usando a biblioteca MarkItDown da Microsoft. Use quando: o usuário fornecer um PDF de apostila, prova anterior ou material de concurso para iniciar o fluxo de processamento."
---

# Skill: study-pdf-to-md

## Objetivo

Converter um arquivo PDF (apostilas, provas, materiais de concurso) para Markdown (`.md`) utilizando a biblioteca **MarkItDown** da Microsoft. O arquivo `.md` gerado é o ponto de entrada para as demais skills do agente `study-concurso`.

Script Python embutido: `convert_pdf.py` (na pasta desta skill).

## Panorama (quando usar)

1. Quando o usuário fornecer um PDF para iniciar o fluxo de estudo.
2. Ao receber qualquer tipo de material em `.pdf` — apostila, gabarito comentado, prova anterior, edital.
3. Como **primeira etapa obrigatória** antes de qualquer outra skill `study-*`.

## Pré-requisitos

```bash
pip install markitdown
```

## Regras Obrigatórias

1. **Confirmar o caminho completo do PDF** com o usuário antes de executar o script. Nunca assumir o caminho automaticamente.
2. **Confirmar a pasta de saída** (padrão: mesma pasta do PDF).
3. Nunca sobrescrever um `.md` já existente sem confirmação explícita do usuário.
4. Informar o caminho completo do `.md` gerado ao final da execução.
5. Ao concluir, sugerir a próxima skill: `study-split-md`.

## Processo de Execução

1. Confirmar com o usuário o caminho completo do PDF (ex.: `C:\Concurso\materia.pdf`).
2. Confirmar pasta de saída (padrão: mesma pasta do PDF).
3. Executar o script `convert_pdf.py`:

   ```bash
   python ".github/skills/study-pdf-to-md/convert_pdf.py" "<caminho_pdf>" "<pasta_saida>"
   ```

   Exemplo:
   ```bash
   python ".github/skills/study-pdf-to-md/convert_pdf.py" "C:/Concurso/materia.pdf" "C:/Concurso/markdowns"
   ```

4. Aguardar a conclusão e verificar se o `.md` foi gerado.
5. Informar ao usuário o caminho do arquivo gerado.
6. Sugerir: _"Próximo passo: invoke `study-split-md` para separar matéria de questões."_

## Pontos de Decisão

1. **PDF protegido por senha**: informar ao usuário que não é possível processar e solicitar uma versão sem senha.
2. **PDF com apenas imagens (scan sem OCR)**: avisar que o resultado pode ser incompleto — MarkItDown não realiza OCR; orientar o usuário a usar um leitor OCR antes.
3. **Arquivo `.md` já existente na pasta de saída**: perguntar ao usuário se deseja sobrescrever ou renomear antes de executar.
4. **Erro de importação do MarkItDown**: orientar o usuário a executar `pip install markitdown` e tentar novamente.
5. **PDF muito grande (> 50 MB)**: advertir que a conversão pode ser lenta e aguardar confirmação para prosseguir.

## Saída Esperada

- Arquivo `<nome_do_pdf>.md` na pasta de saída confirmada.
- Mensagem de confirmação com o caminho completo do arquivo gerado.
- Próximo passo sugerido: `study-split-md`.
