---
name: study-split-md
description: "Separar um arquivo Markdown de estudo em duas partes: matéria explicativa e questões. Use quando: o usuário tiver um .md gerado por study-pdf-to-md e precisar organizar os conteúdos antes de formatar ou estudar."
---

# Skill: study-split-md

## Objetivo

Analisar um arquivo Markdown (`.md`) gerado pelo `study-pdf-to-md` e separá-lo em dois arquivos distintos:

- `<nome>_materia.md` — conteúdo explicativo, teoria, definições e exemplos.
- `<nome>_questoes.md` — questões de prova, exercícios e gabaritos.

Esta skill é executada **pelo agente via análise de texto** (sem script Python).

## Panorama (quando usar)

1. Após a execução da skill `study-pdf-to-md`, quando o `.md` mistura teoria e questões.
2. Quando o material contém seções distintas de "conteúdo" e "exercícios".
3. Quando o usuário deseja estudar apenas a matéria ou apenas as questões.

## Regras Obrigatórias

1. **Confirmar o caminho do `.md`** com o usuário antes de processar.
2. Nunca sobrescrever arquivos `_materia.md` ou `_questoes.md` existentes sem confirmação explícita.
3. Caso o arquivo **não contenha questões**, criar apenas `_materia.md` e informar ao usuário.
4. Caso o arquivo **contenha apenas questões**, criar apenas `_questoes.md` e informar ao usuário.
5. Sempre apresentar ao usuário a contagem de questões encontradas antes de salvar.

## Critérios de Identificação de Questões

O agente deve classificar um bloco de texto como **questão** quando identificar um ou mais dos seguintes padrões:

- Numeração seguida de enunciado: `1.`, `01.`, `Questão 1`, `Q1`, `Q 01`
- Enunciados com alternativas: `A)`, `B)`, `C)`, `D)`, `E)` ou `a)`, `b)`, `c)`, `d)`, `e)`
- Marcadores explícitos: `(CESPE`, `(FGV`, `(FCC`, `(VUNESP`, `(ESAF`, `(IBFC`, `(QUADRIX`, etc.
- Blocos de gabarito: `Gabarito:`, `Resposta:`, `Alternativa correta:`, tabelas de gabarito
- Comandos de prova: _"Julgue o item"_, _"Assinale a alternativa"_, _"Segundo o texto"_

Tudo que **não** se enquadra nesses padrões é classificado como **matéria**.

## Processo de Execução

1. Confirmar com o usuário o caminho do arquivo `.md`.
2. Ler o conteúdo completo do arquivo.
3. Percorrer o texto identificando os blocos de questões pelos critérios acima.
4. Separar o conteúdo em dois grupos: matéria e questões.
5. Apresentar ao usuário um resumo antes de salvar:
   - Quantidade de questões encontradas
   - Primeiras 3 linhas de cada bloco (para validação rápida)
6. Aguardar aprovação do usuário para salvar os arquivos.
7. Salvar `<nome>_materia.md` e `<nome>_questoes.md` na mesma pasta do arquivo original.
8. Informar os caminhos dos arquivos gerados.
9. Sugerir: _"Próximo passo: invoke `study-formatar-topicos` para organizar a matéria em tópicos no Google Docs."_

## Pontos de Decisão

1. **Separação ambígua** (não é claro se um bloco é questão ou teoria): apresentar o trecho ao usuário e perguntar em qual categoria ele deve ficar.
2. **PDF com gabarito ao final, sem questões no corpo**: registrar na seção de questões apenas o gabarito e informar ao usuário.
3. **Material 100% teoria** (sem questões): criar apenas `_materia.md` e informar: _"Nenhuma questão identificada. Arquivo completo salvo como `_materia.md`."_
4. **Material 100% questões** (sem teoria): criar apenas `_questoes.md` e informar ao usuário.

## Saída Esperada

- `<nome>_materia.md` — conteúdo explicativo pronto para a skill `study-formatar-topicos`.
- `<nome>_questoes.md` — questões separadas (se houver).
- Resumo apresentado ao usuário: número de questões, caminhos dos arquivos gerados.
- Próximo passo sugerido: `study-formatar-topicos`.
