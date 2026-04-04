---
name: study-formatar-topicos
description: "Transformar a matéria explicativa em tópicos hierárquicos e publicar no Google Docs. Use quando: o usuário tiver um _materia.md e quiser organizar o conteúdo no formato de técnica de tópicos para resumo de concurso."
---

# Skill: study-formatar-topicos

## Objetivo

Transformar o arquivo `_materia.md` no **formato de técnica de tópicos** e publicar o resultado em um **Google Doc** com hierarquia de indentação. Script Python embutido: `create_gdoc.py` (na pasta desta skill).

### Formato da Técnica de Tópicos

Cada parágrafo da matéria é transformado em uma hierarquia de tópicos com regras de indentação por **níveis de tabulação**:

| Nível | Tabs | Marcador | Papel |
|-------|------|----------|-------|
| L1 | 0 | nenhum | Tema principal do parágrafo — termina com `:` |
| L2 | 1 | `•` | Explicação principal ou ideia central |
| L3 | 2 | `•` | Detalhe ou complemento da explicação L2 |
| L4 | 3 | `•` | Detalhe adicional de L3 (usar raramente) |

**Exemplo de transformação:**

> Parágrafo original:
> _"A estatística é uma ciência que coleta, organiza e analisa dados numéricos. Ela é dividida em dois ramos: a estatística descritiva, que resume dados por meio de tabelas e gráficos, e a estatística inferencial, que faz previsões sobre uma população com base em amostras."_

Resultado no formato de tópicos:
```
A definição de estatística é:
	• é uma ciência que coleta, organiza e analisa dados numéricos
		• dividida em dois ramos principais
	• estatística descritiva
		• resume dados por meio de tabelas e gráficos
	• estatística inferencial
		• faz previsões sobre uma população com base em amostras
```

**Arquivo intermediário gerado pelo agente:** `<nome>_topicos.txt`

Cada linha obedece rigorosamente:
- L1: sem tab, sem `•`, termina com `:`  
- L2: 1 tab + `• ` + texto  
- L3: 2 tabs + `• ` + texto  
- L4: 3 tabs + `• ` + texto  
- Linha vazia entre blocos temáticos separados

## Panorama (quando usar)

1. Após executar `study-split-md`, quando o `_materia.md` estiver disponível.
2. Quando o usuário quiser criar um resumo estruturado no Google Docs.
3. Ao preparar material de revisão para o Anki (`study-anki`).

## Pré-requisitos

```bash
pip install google-auth-oauthlib google-api-python-client
```

**Credenciais Google (setup único):**

1. Acesse [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um projeto (ou use um existente).
3. Ative as APIs: **Google Docs API** e **Google Drive API**.
4. Em "Credenciais" → "Criar credenciais" → **ID do cliente OAuth 2.0** → Tipo: **App para computador**.
5. Baixe o arquivo `credentials.json`.
6. Salve em uma pasta local (ex.: `C:\Concurso\credentials.json`).
7. Na primeira execução do script, um navegador abrirá para autenticação. O arquivo `token.json` será gerado automaticamente na mesma pasta do `credentials.json`.

## Regras Obrigatórias

1. **Confirmar o caminho do `_materia.md`** antes de processar.
2. **Confirmar o caminho do `credentials.json`** antes de executar o script.
3. O agente deve gerar e salvar `<nome>_topicos.txt` **antes** de chamar o script.
4. Apresentar ao usuário as primeiras 10 linhas do `_topicos.txt` para revisão antes de publicar no Google Docs.
5. Nunca sobrescrever um `_topicos.txt` existente sem confirmação.
6. Informar a URL do Google Doc ao final.

## Processo de Execução

1. Confirmar com o usuário o caminho do `_materia.md` e do `credentials.json`.
2. Confirmar o título desejado para o Google Doc.
3. **Transformar o texto** em tópicos: o agente lê o `_materia.md`, identifica os parágrafos e os transforma no formato de tópicos, salvando o resultado em `<nome>_topicos.txt`.
4. Apresentar as 10 primeiras linhas do `_topicos.txt` ao usuário para validação.
5. Aguardar confirmação do usuário para publicar.
6. Executar o script `create_gdoc.py`:

   ```bash
   python ".github/skills/study-formatar-topicos/create_gdoc.py" "<topicos.txt>" "<Titulo do Doc>" "<credentials.json>"
   ```

   Exemplo:
   ```bash
   python ".github/skills/study-formatar-topicos/create_gdoc.py" "C:/Concurso/materia_topicos.txt" "Direito Constitucional - Resumo" "C:/Concurso/credentials.json"
   ```

7. Informar a URL do Google Doc criado.
8. Salvar a URL como variável `gdoc_url` para uso nas skills `study-relevancia` e `study-anki`.
9. Sugerir: _"Próximo passo: invoke `study-relevancia` para marcar o que mais cai na prova."_

## Pontos de Decisão

1. **`credentials.json` não encontrado ou inválido**: orientar o usuário a seguir o passo a passo de setup das credenciais Google.
2. **Token expirado**: o script tenta renovar automaticamente; se falhar, deletar `token.json` e executar novamente para reautenticar.
3. **Matéria muito extensa (> 500 parágrafos)**: advertir ao usuário que a criação pode demorar e aguardar confirmação.
4. **Parágrafo ambíguo** (difícil identificar L1): usar o primeiro período gramatical do parágrafo como L1.
5. **Erro de quota Google Docs API**: aguardar 60 segundos e tentar novamente; informar ao usuário.

## Saída Esperada

- Arquivo `<nome>_topicos.txt` salvo localmente (intermediário).
- Google Doc criado com título definido pelo usuário.
- URL do Google Doc informada ao usuário e salva como `gdoc_url`.
- Próximo passo sugerido: `study-relevancia`.
