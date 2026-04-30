# Quickstart: Study Anki Export

**Feature**: `007-study-anki-export` | **Date**: 2026-04-30

> Este guia mostra como testar cada User Story manualmente, passo a passo.
> Siga a ordem — cada User Story depende da anterior.

---

## Pré-requisitos (verificar antes de começar)

- [ ] Anki Desktop instalado e aberto
- [ ] Plugin AnkiConnect instalado (Ferramentas → Complementos → código `2055492159`)
- [ ] Python 3.11+ instalado (`python --version`)
- [ ] Spec 002 implementada: `study-memory.json` existe na raiz e `/logs/` existe
- [ ] Spec 004 implementada: `/data/topicos.json` existe com pelo menos 1 tópico
- [ ] Spec 005 implementada (opcional): `/data/relevancia_topicos.json` existe

**Verificar que AnkiConnect responde** (execute no terminal):
```bash
python -c "import urllib.request, json; r=urllib.request.urlopen('http://127.0.0.1:8765', data=json.dumps({'action':'deckNames','version':6,'params':{}}).encode()); print(json.load(r))"
```
Deve retornar algo como `{'result': ['Default', ...], 'error': None}`.

---

## User Story 1 — Listagem e Recomendação de Deck

**Objetivo**: Verificar que o sistema lista decks e recomenda o mais adequado para a matéria.

```bash
# Executar do diretório raiz do projeto
python .github/skills/study-anki/anki_export.py --list-decks --materia "Direito Constitucional"
```

**Saída esperada**:
```
Decks disponíveis no Anki:
  1. Default (3 cards)
  2. Concurso::Direito Constitucional (87 cards)  ← recomendado
  3. Concurso::Português (42 cards)

Recomendação: "Concurso::Direito Constitucional" (correspondência com a matéria)
Deseja usar este deck? [S/n]:
```

**Cenários para verificar**:
- [ ] Com deck existente que corresponde à matéria → recomendado automaticamente
- [ ] Sem deck correspondente → sugestão de criar `"Concurso::Direito Constitucional"`
- [ ] Usuário digita "n" → sistema pergunta qual deck escolher da lista

---

## User Story 2 — Exportação Batch de Flashcards

**Objetivo**: Verificar exportação completa com confirmação, envio e relatório final.

**Pré-requisito**: `/data/topicos.json` e `/data/relevancia_topicos.json` existentes.

```bash
python .github/skills/study-anki/anki_export.py --exportar
```

**Saída esperada (fluxo completo)**:
```
Lendo topicos.json... 42 tópicos encontrados.
Lendo relevancia_topicos.json... 42 classificações encontradas.

Flashcards a exportar: 42
  🔥 Alta relevância:  15 cards
  ⚠️ Média relevância: 20 cards
  📝 Baixa relevância:  7 cards

Deck selecionado: "Concurso::Direito Constitucional"

Confirmar exportação de 42 cards para "Concurso::Direito Constitucional"? [S/n]: S

Enviando...
✅ Enviados com sucesso: 39
⏭️  Duplicatas puladas:   3
❌ Erros:                 0

Resultado salvo em: /data/anki_result_direito-constitucional_20260430.json
```

**Cenários para verificar**:
- [ ] Contagem e distribuição por relevância aparecem antes da confirmação
- [ ] Cards duplicados são pulados (não causam erro)
- [ ] Arquivo `anki_result_*.json` criado com cards e seus status
- [ ] Log em `/logs/execution_log.json` contém entrada desta execução

---

## User Story 3 — Fallback sem AnkiConnect

**Objetivo**: Verificar que o sistema salva arquivo quando Anki está fechado.

**Preparação**: Feche o Anki Desktop (ou pare o AnkiConnect no menu Ferramentas).

```bash
python .github/skills/study-anki/anki_export.py --exportar
```

**Saída esperada**:
```
⚠️ AnkiConnect não responde em localhost:8765.
   Possíveis causas: Anki Desktop fechado ou plugin AnkiConnect não instalado.

Deseja salvar os flashcards em arquivo para importar depois? [S/n]: S

✅ Arquivo salvo: /data/anki_export_direito-constitucional_20260430.txt
   42 cards no formato Anki File > Import (tab-separated, UTF-8)

Para importar: abra o Anki → Arquivo → Importar → selecione o arquivo acima.
```

**Cenários para verificar**:
- [ ] Arquivo `.txt` criado com formato correto (abrir e verificar tabs entre colunas)
- [ ] Ao reabrir Anki e executar novamente → sistema oferece enviar cards pendentes do arquivo

---

## Verificação Cruzada (após todos os testes)

```bash
# Verificar log de execução
python -c "import json; [print(e['event'], e['level']) for e in json.load(open('logs/execution_log.json'))[-10:]]"
```

Deve mostrar as últimas 10 entradas de log das execuções acima.

```bash
# Verificar resultado estruturado
python -c "import json; r=json.load(open('data/anki_result_direito-constitucional_20260430.json')); print(r['data']['total'], 'total,', r['data']['enviados'], 'enviados')"
```
