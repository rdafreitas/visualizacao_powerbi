# Research: Study Relevance Engine

**Feature**: `005-study-relevance-engine` | **Date**: 2026-04-30

---

## 1. Schemas de Saida: relevancia_topicos.json e relevancia_questoes.json

> **Por que definir o schema antes de codificar?** Porque outros sistemas (spec 006 —
> publicacao no Google Docs, spec 007 — exportacao Anki) vao consumir estes arquivos.
> Se o schema mudar depois, esses sistemas quebram. Definir antes e um contrato firmado.

### 1.1 Schema de relevancia_topicos.json

```json
{
  "meta": {
    "materia": "string — nome da materia (ex: 'Direito Constitucional')",
    "total_topicos": "int — total de topicos classificados",
    "estrategia_usada": "string — 'com_edital' ou 'sem_edital'",
    "nivel_rag": "int — sempre 1 na v1",
    "created_at": "string ISO 8601 — ex: '2026-04-30T14:00:00'",
    "version": "string — '1.0'"
  },
  "resumo": {
    "alta": "int — quantidade de topicos classificados como alta",
    "media": "int — quantidade de topicos classificados como media",
    "baixa": "int — quantidade de topicos classificados como baixa",
    "fontes_consultadas": ["string — lista de fontes usadas, ex: ['edital', 'ia']"]
  },
  "data": [
    {
      "id": "string — ID do topico de origem em topicos.json",
      "texto": "string — texto do topico (nivel L1)",
      "classificacao": "string — 'alta', 'media' ou 'baixa'",
      "emoji": "string — '🔥', '⚠️' ou '📝'",
      "justificativa": "string — 1 a 2 frases explicando a decisao",
      "fontes": ["string — valores possiveis: 'edital', 'ia'"],
      "nivel_confianca": "string — 'alta', 'media' ou 'baixa'"
    }
  ]
}
```

### 1.2 Exemplo Completo: relevancia_topicos.json

```json
{
  "meta": {
    "materia": "Direito Constitucional",
    "total_topicos": 3,
    "estrategia_usada": "com_edital",
    "nivel_rag": 1,
    "created_at": "2026-04-30T14:00:00",
    "version": "1.0"
  },
  "resumo": {
    "alta": 1,
    "media": 1,
    "baixa": 1,
    "fontes_consultadas": ["edital", "ia"]
  },
  "data": [
    {
      "id": "t001",
      "texto": "Principios fundamentais da Republica Federativa do Brasil",
      "classificacao": "alta",
      "emoji": "🔥",
      "justificativa": "Consta explicitamente no conteudo programatico do edital como tema obrigatorio. E tema recorrente em provas CESPE com frequencia media de 3 questoes por prova.",
      "fontes": ["edital", "ia"],
      "nivel_confianca": "alta"
    },
    {
      "id": "t002",
      "texto": "Direitos e garantias fundamentais — visao geral",
      "classificacao": "media",
      "emoji": "⚠️",
      "justificativa": "Relacionado a tema do edital (Titulo II da CF/88), mas o edital nao especifica o subtopico. Relevante como contexto para os topicos explicitamente listados.",
      "fontes": ["edital", "ia"],
      "nivel_confianca": "media"
    },
    {
      "id": "t003",
      "texto": "Historia da Constituicao de 1824",
      "classificacao": "baixa",
      "emoji": "📝",
      "justificativa": "Nao consta no conteudo programatico do edital. Informacao historica tangencial sem relacao direta com os temas cobrados na prova.",
      "fontes": ["edital"],
      "nivel_confianca": "alta"
    }
  ]
}
```

### 1.3 Schema de relevancia_questoes.json

Identico ao `relevancia_topicos.json`. Os campos `id` e `texto` referenciam questoes
em vez de topicos, mas o formato e o mesmo — isso facilita o consumo pelos sistemas
downstream (specs 006 e 007) com o mesmo codigo de leitura.

---

## 2. Criterios de Classificacao: quando algo e Alta, Media ou Baixa

> **Por que documentar os criterios?** Porque o modelo de IA pode classificar de formas
> diferentes em execucoes distintas. Com criterios claros, o prompt para o modelo e
> preciso e o resultado e consistente.

### Com edital disponivel (EstrategiaComEdital)

| Nivel | Criterio principal | Criterio complementar | Confianca resultante |
|-------|-------------------|-----------------------|---------------------|
| 🔥 Alta | Topico consta explicitamente no conteudo programatico | Tema historicamente recorrente em provas da banca | Alta |
| ⚠️ Media | Topico relacionado a tema do edital, mas nao listado explicitamente | Subtopico ou contexto necessario para entender temas do edital | Media |
| 📝 Baixa | Topico sem relacao com o conteudo programatico do edital | Informacao historica, tangencial ou de cultura geral | Alta (certeza de que e baixa) |

**Regra de desempate**: Quando o topico poderia ser Alta ou Media, verificar se o texto
exato (ou sinonimo direto) aparece na lista de topicos do edital. Se sim → Alta. Se
apenas o tema geral aparece → Media.

### Sem edital (EstrategiaSemEdital)

| Nivel | Criterio | Confianca resultante |
|-------|----------|---------------------|
| 🔥 Alta | Tema classicamente cobrado em concursos da area + banca com historico de cobranca | Media (sem confirmacao do edital especifico) |
| ⚠️ Media | Tema cobrado em concursos similares, mas com frequencia variavel | Baixa |
| 📝 Baixa | Tema raro em provas de concurso ou muito especifico | Media (certeza relativa de que e menos cobrado) |

**Aviso obrigatorio**: Quando a estrategia sem edital e usada, o sistema DEVE informar
ao usuario: "Classificacao baseada apenas em conhecimento geral — sem edital como
referencia. Fidelidade estimada: media. Recomendo fornecer o edital para classificacao
mais precisa."

---

## 3. Por que Pure Function para o Classificador

> Esta e a decisao de design mais importante desta spec. Entender o motivo ajuda a
> tomar decisoes similares em outros projetos.

**A questao central**: A funcao `classificar_topicos()` poderia ler o arquivo `topicos.json`
diretamente. Por que nao fazer isso?

**Resposta em 3 pontos**:

### 3.1 Testabilidade

Com Pure Function:
```python
# Testar e simples — so passar dados e verificar o retorno
topicos = [{"id": "t001", "texto": "Principio da legalidade"}]
resultado = classificar_topicos(topicos, estrategia=EstrategiaSemEdital())
assert resultado[0]["classificacao"] in ["alta", "media", "baixa"]
```

Sem Pure Function (se a funcao lesse o arquivo diretamente):
```python
# Testar exige criar um arquivo no disco, no caminho certo, com dados de teste
# Se o arquivo nao existir no ambiente de teste -> erro inesperado
# O teste passou a depender do "estado do mundo" (sistema de arquivos)
```

### 3.2 Previsibilidade

Uma Pure Function nao tem "surpresas": dado o mesmo input, o output e sempre o mesmo.
Voce pode ler o codigo e entender completamente o que ele faz — sem precisar rastrear
o que esta escrito em arquivos externos ou o que foi chamado antes.

### 3.3 Composicao

Com Pure Function, e facil trocar a estrategia:
```python
# Com edital
resultado = classificar_topicos(topicos, estrategia=EstrategiaComEdital(edital))

# Sem edital — mesma funcao, estrategia diferente
resultado = classificar_topicos(topicos, estrategia=EstrategiaSemEdital())
```

O classificador nao precisa saber qual estrategia esta ativa — ele apenas a executa.
Isso e o Padrao Strategy funcionando em conjunto com a Pure Function.

---

## 4. Como o Nivel de Confianca e Determinado

O `nivel_confianca` nao e a classificacao em si (Alta/Media/Baixa) — e o grau de
certeza do sistema sobre a classificacao que fez.

| Situacao | nivel_confianca | Razao |
|----------|----------------|-------|
| Edital disponivel + topico encontrado explicitamente | `"alta"` | Evidencia direta e objetiva |
| Edital disponivel + topico inferido por contexto | `"media"` | Evidencia indireta — interpretacao necessaria |
| Edital disponivel + topico ausente no edital | `"alta"` | Certeza de que e baixa relevancia |
| Sem edital + topico classicamente cobrado | `"media"` | Conhecimento geral, sem confirmacao especifica |
| Sem edital + topico com frequencia variavel | `"baixa"` | Alta incerteza — inferencia fraca |
| Edital de materia diferente do topico | `"baixa"` | Divergencia detectada — classificar com cautela |

**Regra**: O `nivel_confianca` DEVE ser propagado ao usuario nos logs e no resumo
estatistico (Constitution VII). Quando `nivel_confianca` e "baixa" em mais de 50%
dos topicos → o sistema alerta o usuario sobre a qualidade da classificacao.

---

## 5. Por que a Constitution V proibe web search na v1

O Principio V da Constituicao exige **RAG com Validacao** — fontes controladas e
verificaveis. Web search na v1 seria problematico por 3 razoes:

1. **Fontes nao verificaveis**: Resultados de busca podem ser de qualquer site, sem
   garantia de precisao sobre o edital especifico do concurso. Um site pode ter
   informacoes desatualizadas ou incorretas sobre o que cai na prova.

2. **Reproducibilidade**: Com web search, a classificacao pode mudar de uma semana
   para outra dependendo dos resultados de busca — violando o principio de que o mesmo
   input deve gerar o mesmo output (Pure Function a nivel de sistema).

3. **Complexidade prematura**: O nivel RAG 1 (dados locais) ja e suficiente para o
   valor principal da feature. Web search seria nivel RAG 2+ — escopo de versao futura
   quando a v1 estiver validada com usuarios reais.

**Consequencia pratica**: O campo `nivel_rag` em `meta` sempre vale `1` na v1.
Quando RAG 2 for implementado, esse campo muda para `2` e sistemas downstream podem
adaptar seu comportamento — sem breaking change.
