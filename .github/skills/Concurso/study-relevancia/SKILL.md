---
name: study-relevancia
description: "Analisar a matéria e marcar o que cai muito, pouco ou raramente em provas de concurso. Use quando: o usuário informar a matéria e/ou a banca organizadora e quiser saber em quais tópicos focar durante o estudo."
---

# Skill: study-relevancia

## Objetivo

Analisar o arquivo `_materia.md` (ou `_topicos.txt`) e classificar cada tópico por frequência de cobrança em provas de concurso, combinando dois critérios:

1. **Análise textual** — identifica tópicos com mais ênfase no próprio material (repetições, destaques, volume de conteúdo).
2. **Contexto de banca/matéria** — usa o conhecimento sobre padrões de cobrança da banca informada para ajustar as classificações.

Esta skill é executada **pelo agente via análise de texto** (sem script Python).

### Classificação de Relevância

| Ícone | Classificação | Critério |
|-------|--------------|---------|
| 🔥 | **Alta frequência** | Cai em praticamente todas as provas da banca ou é conceito basilar da matéria |
| ⚠️ | **Média frequência** | Aparece periodicamente; vale revisar antes da prova |
| 📝 | **Baixa frequência** | Raro ou muito específico; estudar apenas se sobrar tempo |

## Panorama (quando usar)

1. Após executar `study-formatar-topicos`, usando o `_topicos.txt` gerado.
2. Quando o usuário quiser priorizar o estudo e identificar o que estudar primeiro.
3. Antes de criar flashcards no Anki, para focar nos tópicos de alta frequência.

## Regras Obrigatórias

1. **Confirmar o caminho do arquivo** (`_materia.md` ou `_topicos.txt`) antes de processar.
2. Perguntar ao usuário: **Qual a matéria?** e **Qual a banca?** (ambos opcionais, mas melhoram a análise).
3. Nunca inventar padrões de cobrança que não sejam razoavelmente conhecidos. Quando em dúvida, classificar como ⚠️ Média.
4. Apresentar a classificação ao usuário antes de salvar o arquivo de saída.
5. Nunca sobrescrever `_relevancia.md` existente sem confirmação.

## Processo de Execução

1. Confirmar com o usuário:
   - Caminho do arquivo de entrada (`_materia.md` ou `_topicos.txt`).
   - Matéria (ex.: `Direito Constitucional`, `Estatística`, `Língua Portuguesa`).
   - Banca (ex.: `CESPE/CEBRASPE`, `FGV`, `FCC`, `VUNESP`, `IBFC`). Informar que é opcional.
2. Ler o conteúdo do arquivo.
3. Para cada tópico/seção identificada, classificar com 🔥 / ⚠️ / 📝 com base em:
   - Frequência estimada na banca informada (se fornecida).
   - Padrão textual: tópicos com mais subtópicos e detalhamentos tendem a ser mais cobrados.
   - Conceitos fundamentais e definições básicas → sempre 🔥.
4. Apresentar a classificação completa ao usuário e aguardar aprovação ou ajustes.
5. Salvar o resultado em `<nome>_relevancia.md` com o seguinte formato:

   ```markdown
   # Análise de Relevância — <Matéria>
   Banca: <Banca> | Data: <data>

   ## 🔥 Alta Frequência
   - Tópico A
   - Tópico B

   ## ⚠️ Média Frequência
   - Tópico C

   ## 📝 Baixa Frequência
   - Tópico D
   ```

6. Opcionalmente, inserir os ícones 🔥 / ⚠️ / 📝 nas linhas L1 do `_topicos.txt` (se o usuário solicitar).
7. Informar os caminhos dos arquivos gerados.
8. Sugerir: _"Próximo passo: invoke `study-anki` para criar flashcards dos tópicos 🔥 no Anki."_

## Pontos de Decisão

1. **Banca não informada**: realizar apenas análise textual; classificar como 🔥 conceitos fundamentais e definições; indicar ao usuário que a análise seria mais precisa com a banca.
2. **Matéria não informada**: solicitar ao usuário para melhorar a análise; se recusar, prosseguir com análise textual pura.
3. **Material muito extenso (> 200 tópicos)**: processar em blocos e apresentar ao usuário progressivamente.
4. **Tópico ambíguo**: classificar como ⚠️ e informar o usuário da incerteza.
5. **Usuário discordar de classificações**: aceitar as correções do usuário e atualizar o arquivo.

## Saída Esperada

- Arquivo `<nome>_relevancia.md` com tópicos classificados por frequência.
- (Opcional) `_topicos.txt` atualizado com ícones nas linhas L1.
- Resumo apresentado ao usuário: quantidade de tópicos em cada categoria.
- Próximo passo sugerido: `study-anki`.
