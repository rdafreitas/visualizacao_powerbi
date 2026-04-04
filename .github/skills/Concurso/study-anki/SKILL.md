---
name: study-anki
description: "Criar flashcards no Anki a partir de tópicos do resumo de estudo. Use quando: o usuário quiser enviar um tópico ou bloco de tópicos do _topicos.txt para o Anki Desktop via AnkiConnect."
---

# Skill: study-anki

## Objetivo

Criar flashcards no **Anki Desktop** a partir de tópicos do arquivo `_topicos.txt`, usando a API **AnkiConnect** (plugin para Anki Desktop). Script Python embutido: `send_to_anki.py` (na pasta desta skill).

### Estrutura do Flashcard

Cada tópico L1 com seus subtópicos vira um único cartão:

| Face | Conteúdo |
|------|---------|
| **Frente** | Linha L1 do tópico (ex.: `A definição de estatística é:`) |
| **Verso** | Linhas L2+ do tópico formatadas com indentação (explicação + detalhamentos) |

**Exemplo:**

> **Frente:** `A definição de estatística é:`
>
> **Verso:**
> ```
> • é uma ciência que coleta, organiza e analisa dados numéricos
>   • dividida em dois ramos: descritiva e inferencial
> • estatística descritiva: resume dados por tabelas e gráficos
> • estatística inferencial: faz previsões com base em amostras
> ```

## Panorama (quando usar)

1. Após `study-formatar-topicos` e `study-relevancia`, para criar cartões dos tópicos 🔥.
2. Quando o usuário quiser enviar um tópico específico do Google Doc para o Anki.
3. Em qualquer etapa do estudo em que o usuário diga "quero criar um cartão no Anki".

## Pré-requisitos

- **Anki Desktop** instalado e **aberto** durante a execução.
- **Plugin AnkiConnect** instalado no Anki: código `2055492159` em _Ferramentas → Complementos → Obter complementos_.
- Nenhuma biblioteca Python adicional é necessária (`urllib` é nativo).

## Regras Obrigatórias

1. **O Anki Desktop deve estar aberto** antes de executar o script. Verificar conectividade antes de criar cartões.
2. Confirmar com o usuário:
   - Qual tópico (ou bloco de tópicos) será enviado.
   - Nome do deck de destino (padrão: `Concursos`).
   - Tag opcional (ex.: `direito-constitucional`, `cespe`).
3. Apresentar a frente e o verso do cartão ao usuário antes de criar.
4. Nunca criar duplicatas: o script usa `allowDuplicate: false` do AnkiConnect.
5. Informar o `noteId` do cartão criado ao final.

## Processo de Execução

1. Confirmar com o usuário:
   - Bloco de tópico a enviar (L1 + seus L2/L3).
   - Deck de destino (padrão: `Concursos`).
   - Tag (opcional, ex.: `portugues-cespe`).
2. Montar o conteúdo do cartão:
   - **Frente**: texto da linha L1 (sem o `:`).
   - **Verso**: linhas L2+ concatenadas com quebras de linha, preservando a indentação com espaços.
3. Apresentar frente e verso ao usuário e aguardar confirmação.
4. Executar o script `send_to_anki.py`:

   ```bash
   python ".github/skills/study-anki/send_to_anki.py" "<frente>" "<verso>" "<deck>" "<tag>"
   ```

   Exemplo:
   ```bash
   python ".github/skills/study-anki/send_to_anki.py" "A definição de estatística é" "• é uma ciência que coleta dados\n  • dividida em descritiva e inferencial" "Concursos" "estatistica"
   ```

5. Informar o `noteId` do cartão criado.
6. Perguntar ao usuário se deseja criar mais cartões.

## Pontos de Decisão

1. **Anki não está aberto**: informar ao usuário para abrir o Anki Desktop e tentar novamente.
2. **AnkiConnect não instalado**: orientar o usuário a instalar o plugin (código `2055492159`) em _Ferramentas → Complementos → Obter complementos_.
3. **Cartão duplicado**: informar ao usuário que o cartão já existe e perguntar se deseja forçar a criação.
4. **Deck não existe**: o script cria o deck automaticamente; informar ao usuário.
5. **Verso muito longo**: truncar em 2000 caracteres e avisar o usuário, sugerindo dividir o tópico em cartões menores.

## Saída Esperada

- Cartão criado no Anki Desktop no deck especificado.
- `noteId` do cartão informado ao usuário.
- Confirmação: _"✅ Cartão criado no deck '<deck>' (noteId: <id>). Abra o Anki para revisar."_
