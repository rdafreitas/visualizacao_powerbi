# Quickstart: Study Relevance Engine

**Feature**: `005-study-relevance-engine` | **Date**: 2026-04-30

> Este guia mostra como testar cada User Story manualmente, passo a passo.
> Siga a ordem — cada User Story depende de dados gerados pela anterior.

---

## Pre-requisitos (verificar antes de comecar)

- [ ] Python 3.11+ instalado (`python --version` no terminal)
- [ ] Spec 002 implementada: `study-memory.json` existe na raiz e `/logs/` existe
- [ ] Spec 004 implementada: `/data/topicos.json` e `/data/questoes.json` existem com pelo menos 1 item cada

**Verificar estrutura de dados minima**:
```bash
python -c "import json; d=json.load(open('data/topicos.json')); print(len(d['data']), 'topicos encontrados')"
```
Deve retornar algo como `42 topicos encontrados`.

**Verificar que a skill existe**:
```bash
python -c "import sys; sys.path.insert(0, '.github/skills/study-relevance'); import relevance_classifier; print('OK')"
```
Deve retornar `OK` sem erros.

---

## User Story 1 — Classificar Topicos com Edital Presente

**Objetivo**: Verificar que a classificacao usa o edital como referencia primaria
e gera `relevancia_topicos.json` com todos os campos obrigatorios.

**Pre-requisito adicional**: `/data/edital_parsed.json` presente (spec 003).

```bash
python .github/skills/study-relevance/relevance_service.py --classificar-topicos
```

**Saida esperada no chat**:
```
Lendo topicos.json... 42 topicos encontrados.
Lendo edital_parsed.json... Edital disponivel — usando EstrategiaComEdital.

Classificando 42 topicos...

Resumo da classificacao:
  🔥 Alta relevancia:  15 topicos
  ⚠️ Media relevancia: 20 topicos
  📝 Baixa relevancia:  7 topicos

Estrategia usada: com_edital | Fontes: edital, ia | Nivel RAG: 1

Resultado salvo em: /data/relevancia_topicos.json
```

**Cenarios para verificar**:
- [ ] `relevancia_topicos.json` foi criado em `/data/`
- [ ] Todos os topicos de `topicos.json` aparecem em `relevancia_topicos.json`
- [ ] Cada entrada tem `classificacao`, `justificativa`, `fontes` e `nivel_confianca`
- [ ] `meta.estrategia_usada` e `"com_edital"` no arquivo de saida
- [ ] Topicos que constam explicitamente no edital estao marcados como `"alta"`

**Verificar manualmente**:
```bash
python -c "
import json
r = json.load(open('data/relevancia_topicos.json', encoding='utf-8'))
print('Total:', r['meta']['total_topicos'])
print('Alta:', r['resumo']['alta'])
print('Media:', r['resumo']['media'])
print('Baixa:', r['resumo']['baixa'])
print('Estrategia:', r['meta']['estrategia_usada'])
# Mostrar primeiro item
print('Primeiro item:', json.dumps(r['data'][0], ensure_ascii=False, indent=2))
"
```

---

## User Story 1 (variante) — Classificar Topicos SEM Edital

**Objetivo**: Verificar que o sistema funciona mesmo sem `edital_parsed.json`,
usando apenas inferencia do modelo, e informa claramente ao usuario.

**Preparacao**: Renomeie ou remova temporariamente `edital_parsed.json` se existir.

```bash
python .github/skills/study-relevance/relevance_service.py --classificar-topicos
```

**Saida esperada no chat** (diferenca marcada com *):
```
Lendo topicos.json... 42 topicos encontrados.
* edital_parsed.json nao encontrado — usando EstrategiaSemEdital.
* Classificacao baseada apenas em conhecimento geral — sem edital como referencia.
* Fidelidade estimada: media. Recomendo fornecer o edital para classificacao mais precisa.

Classificando 42 topicos...

Resumo da classificacao:
  🔥 Alta relevancia:  12 topicos
  ⚠️ Media relevancia: 18 topicos
  📝 Baixa relevancia: 12 topicos

Estrategia usada: sem_edital | Fontes: ia | Nivel RAG: 1

Resultado salvo em: /data/relevancia_topicos.json
```

**Cenarios para verificar**:
- [ ] Aviso sobre ausencia do edital foi exibido
- [ ] `meta.estrategia_usada` e `"sem_edital"` no arquivo de saida
- [ ] `fontes` em cada item contem apenas `["ia"]` (sem "edital")
- [ ] `nivel_confianca` tende a ser `"media"` ou `"baixa"` (sem evidencia direta do edital)

---

## User Story 2 — Classificar Questoes

**Objetivo**: Verificar que `questoes.json` e classificado com o mesmo criterio
e que o formato de saida e identico ao de `relevancia_topicos.json`.

```bash
python .github/skills/study-relevance/relevance_service.py --classificar-questoes
```

**Saida esperada**:
```
Lendo questoes.json... 30 questoes encontradas.
Edital disponivel — usando EstrategiaComEdital.

Classificando 30 questoes...

Resumo da classificacao:
  🔥 Alta relevancia:  12 questoes
  ⚠️ Media relevancia: 14 questoes
  📝 Baixa relevancia:  4 questoes

Resultado salvo em: /data/relevancia_questoes.json
```

**Cenarios para verificar**:
- [ ] `relevancia_questoes.json` foi criado em `/data/`
- [ ] O schema e identico ao de `relevancia_topicos.json`
- [ ] Questoes com enunciados sobre temas do edital estao marcadas como `"alta"`
- [ ] `meta.total_topicos` bate com o numero de questoes em `questoes.json`

---

## User Story 3 — Resumo Estatistico

**Objetivo**: Verificar que o resumo exibido no chat e consistente com o conteudo
do arquivo de saida.

O resumo e automaticamente exibido apos cada classificacao (US1 e US2). Para gerar
so o resumo (sem reclassificar):

```bash
python .github/skills/study-relevance/relevance_service.py --resumo
```

**Saida esperada**:
```
=== Resumo de Classificacao ===

Topicos:
  🔥 Alta:  15  (33%)
  ⚠️ Media: 20  (44%)
  📝 Baixa:  7  (16%)
  Total: 42

Questoes:
  🔥 Alta:  12  (40%)
  ⚠️ Media: 14  (47%)
  📝 Baixa:  4  (13%)
  Total: 30

Fontes consultadas: edital, ia
Estrategia: com_edital | Nivel RAG: 1
```

**Cenarios para verificar**:
- [ ] Alta + Media + Baixa == Total (sem itens perdidos)
- [ ] Fontes listadas correspondem ao que esta em cada item do array `data[]`
- [ ] Estrategia exibida bate com `meta.estrategia_usada` no arquivo

---

## Verificacao Cruzada: Compatibilidade com Specs 006 e 007

Estas verificacoes confirmam que os outputs desta spec estao prontos para consumo
pelas specs downstream.

### Verificar que spec 007 (Anki) consegue ler o arquivo

A spec 007 usa `relevancia_topicos.json` para adicionar tags de relevancia aos
flashcards. O seguinte trecho simula o que `anki_repository.py` fara:

```bash
python -c "
import json

# Simula o que a spec 007 faz ao ler relevancia_topicos.json
r = json.load(open('data/relevancia_topicos.json', encoding='utf-8'))

# Verifica versao do schema
assert r['meta']['version'] == '1.0', 'Versao do schema incorreta'

# Constroi indice de relevancia (id -> classificacao)
indice = {item['id']: item['classificacao'] for item in r['data']}
print(f'{len(indice)} topicos indexados para uso no Anki')

# Verifica que nenhum ID esta duplicado
assert len(indice) == len(r['data']), 'IDs duplicados encontrados!'
print('Schema valido — pronto para spec 007.')
"
```

Deve retornar: `42 topicos indexados para uso no Anki` + `Schema valido — pronto para spec 007.`

### Verificar que spec 006 (Google Docs) consegue ordenar por relevancia

A spec 006 agrupa topicos por nivel de relevancia antes de publicar no documento.
O seguinte trecho simula essa ordenacao:

```bash
python -c "
import json

r = json.load(open('data/relevancia_topicos.json', encoding='utf-8'))
ordem = {'alta': 0, 'media': 1, 'baixa': 2}

# Simula ordenacao que spec 006 aplicara
ordenados = sorted(r['data'], key=lambda x: ordem[x['classificacao']])

print('=== Topicos ordenados por relevancia ===')
for item in ordenados[:5]:  # primeiros 5
    print(f\"{item['emoji']} [{item['classificacao'].upper()}] {item['texto'][:60]}\")
print(f'... e mais {len(ordenados) - 5} topicos')
print('Ordenacao funcionando — pronto para spec 006.')
"
```

### Verificar log de execucao

```bash
python -c "
import json
log = json.load(open('logs/execution_log.json', encoding='utf-8'))
entradas_005 = [e for e in log if '005' in str(e.get('feature', '')) or 'relevancia' in str(e.get('event', '')).lower()]
print(f'{len(entradas_005)} entradas de log da spec 005')
if entradas_005:
    print('Ultima entrada:', json.dumps(entradas_005[-1], ensure_ascii=False, indent=2))
"
```

Deve mostrar pelo menos uma entrada de log com nivel `DECISION` e campos
`justificativa` e `fontes` preenchidos (Constitution VII — Observabilidade).
