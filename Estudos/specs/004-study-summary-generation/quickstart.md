# Quickstart: Study Summary Generation

**Feature**: `004-study-summary-generation` | **Data**: 2026-04-30

> Este guia mostra como testar cada User Story manualmente, passo a passo.
> Siga a ordem — cada User Story depende da saída da anterior.

---

## Pré-requisitos (verificar antes de começar)

- [ ] Python 3.11+ instalado (`python --version`)
- [ ] MarkItDown instalado (`pip install markitdown`)
- [ ] Spec 002 implementada: `study-memory.json` existe na raiz e `/logs/` existe
- [ ] Um PDF de material de estudo disponível (com texto extraível — não escaneado)
- [ ] Agente Claude disponível no ambiente (para geração do outline)

**Verificar que MarkItDown funciona** (execute no terminal a partir da raiz do projeto):
```bash
python -c "from markitdown import MarkItDown; print('MarkItDown OK')"
```

**Verificar estrutura de diretórios**:
```bash
python -c "
from pathlib import Path
for d in ['data', 'logs']:
    status = 'OK' if Path(d).exists() else 'AUSENTE — execute spec 002 primeiro'
    print(f'{d}/: {status}')
"
```

---

## User Story 1 — Converter PDF para Markdown

**Objetivo**: Verificar que o sistema converte um PDF de material de estudo para Markdown
preservando títulos, parágrafos e listas.

**Por que MarkItDown?**: É uma biblioteca da Microsoft que extrai texto de PDFs (e outros
formatos) em Markdown. É mais confiável que PyPDF2 para materiais com formatação complexa.

```bash
# Coloque o PDF na raiz do projeto e execute:
python .github/skills/study-summary/summary_service.py --etapa converter \
       --arquivo "material_df.pdf"
```

**Saída esperada**:
```
[2026-04-30 10:00:00] Iniciando conversão: material_df.pdf
[2026-04-30 10:00:02] Markdown gerado: 4.832 palavras, 312 linhas
[2026-04-30 10:00:02] Hash SHA-256: sha256:3a7f1c9b...
[2026-04-30 10:00:02] Arquivo temporário: .cache/material_df.md
Conversão concluída com sucesso.
```

**Cenários para verificar**:
- [ ] PDF com texto extraível → Markdown gerado com estrutura preservada (abrir `.cache/material_df.md`)
- [ ] Repetir a conversão → sistema pergunta: "Markdown já existe. Reconverter? [S/n]"
- [ ] PDF protegido ou corrompido → mensagem clara de erro, sem crash

**Verificar output manualmente**:
```bash
# Contar palavras no Markdown gerado (Windows PowerShell)
python -c "
from pathlib import Path
md = Path('.cache/material_df.md').read_text(encoding='utf-8')
linhas = md.splitlines()
palavras = len(md.split())
print(f'{len(linhas)} linhas, {palavras} palavras')
print('Primeiras 10 linhas:')
print('\n'.join(linhas[:10]))
"
```

---

## User Story 2 — Separar Matéria e Questões

**Objetivo**: Verificar que o sistema identifica e separa matéria explicativa de questões,
gerando `topicos.json` (provisório, sem outline) e `questoes.json`.

**Por que separar antes de gerar o outline?** O outline é gerado apenas da matéria —
questões têm formato próprio (enunciado + alternativas) que não se transforma em L0/L1/L2/L3.

```bash
python .github/skills/study-summary/summary_service.py --etapa separar \
       --arquivo "material_df.pdf"
```

**Saída esperada**:
```
[2026-04-30 10:02:00] Iniciando separação de conteúdo...
[2026-04-30 10:02:01] Estratégia ativa: EstrategiaEnunciado (padrão "Questão 01" detectado)
[2026-04-30 10:02:02] Matéria: 3.210 palavras (67%)
[2026-04-30 10:02:02] Questões detectadas: 24
[2026-04-30 10:02:02] Blocos ambíguos tratados como matéria: 2
[2026-04-30 10:02:02] Arquivos gerados: data/topicos.json (provisório), data/questoes.json
Separação concluída com sucesso.
```

**Cenários para verificar**:
- [ ] Material misto → `data/topicos.json` com matéria e `data/questoes.json` com questões
- [ ] Material sem questões → `data/questoes.json` não é criado; mensagem informativa
- [ ] Material apenas com questões → `data/topicos.json` não é criado; mensagem informativa

**Verificar `questoes.json`** (verificação rápida de conformidade):
```bash
python -c "
import json
from pathlib import Path
q = json.loads(Path('data/questoes.json').read_text(encoding='utf-8'))
total = len(q['data'])
tipos = {}
for item in q['data']:
    tipos[item['tipo']] = tipos.get(item['tipo'], 0) + 1
print(f'Total de questões: {total}')
for tipo, count in tipos.items():
    print(f'  {tipo}: {count}')
print(f'Primeira questão: {q[\"data\"][0][\"enunciado\"][:80]}...')
"
```

---

## User Story 3 — Gerar Outline Hierárquico L0–L3

**Objetivo**: Verificar que o sistema gera `_topicos.txt` com hierarquia L0–L3, marcadores
corretos (❖/➤/■) e indentação progressiva, e que `topicos.json` é atualizado com a
estrutura completa de árvore.

**Por que o Claude gera o outline?** Veja `research.md` seção 3. Resumo: formular
questionamentos afirmativos (L0) e classificar granularidade (L1 vs L2 vs L3) requer
compreensão semântica que regex ou NLP local não fornecem com qualidade suficiente.

```bash
python .github/skills/study-summary/summary_service.py --etapa outline \
       --arquivo "material_df.pdf"
```

**Saída esperada**:
```
[2026-04-30 10:05:00] Lendo matéria de data/topicos.json...
[2026-04-30 10:05:01] Enviando para agente Claude (3.210 palavras)...
[2026-04-30 10:06:30] Outline recebido: 42 nós L0, 89 nós L1, 134 nós L2, 28 nós L3
[2026-04-30 10:06:30] Construindo árvore hierárquica...
[2026-04-30 10:06:30] Validando limite L2 (≤15 palavras)... OK — 134/134 conformes
[2026-04-30 10:06:31] Arquivos gerados: _topicos.txt, data/topicos.json (atualizado)
Outline gerado com sucesso.
```

**Cenários para verificar**:
- [ ] `_topicos.txt` aberto em editor — verificar hierarquia visual com indentação
- [ ] Nenhuma linha L2 (com `➤`) tem mais de 15 palavras
- [ ] Marcadores corretos: L0 sem marcador, L1 com ❖, L2 com ➤, L3 com ■
- [ ] Parágrafos extensos → conteúdo excedente corretamente delegado para L3

**Verificar limite L2 automaticamente**:
```bash
python -c "
from pathlib import Path
linhas = Path('_topicos.txt').read_text(encoding='utf-8').splitlines()
violacoes = []
for i, linha in enumerate(linhas, 1):
    stripped = linha.strip()
    if stripped.startswith('➤'):
        texto = stripped.replace('➤', '').strip()
        palavras = len(texto.split())
        if palavras > 15:
            violacoes.append(f'Linha {i}: {palavras} palavras — {texto[:60]}...')
if violacoes:
    print(f'{len(violacoes)} violações encontradas:')
    for v in violacoes:
        print(f'  {v}')
else:
    print('Todas as linhas L2 conformes (≤15 palavras).')
"
```

**Verificar hierarquia de IDs em `topicos.json`**:
```bash
python -c "
import json
from pathlib import Path

def contar_nos(nos, nivel=0):
    contagem = {0: 0, 1: 0, 2: 0, 3: 0}
    for no in nos:
        contagem[no['level']] = contagem.get(no['level'], 0) + 1
        for k, v in contar_nos(no.get('children', []), nivel+1).items():
            contagem[k] = contagem.get(k, 0) + v
    return contagem

dados = json.loads(Path('data/topicos.json').read_text(encoding='utf-8'))
contagem = contar_nos(dados['data'])
total = sum(contagem.values())
print(f'Total de nós: {total}')
for nivel, count in sorted(contagem.items()):
    print(f'  L{nivel}: {count} nós')
print(f'Matéria: {dados[\"meta\"][\"materia\"]}')
"
```

---

## Verificação Cruzada — `topicos.json` pronto para specs 005, 006, 007

Esta verificação garante que o `topicos.json` gerado está no formato correto para ser
consumido pelas specs downstream antes de avançar.

```bash
python -c "
import json
from pathlib import Path

dados = json.loads(Path('data/topicos.json').read_text(encoding='utf-8'))
erros = []

# Campos meta obrigatórios (spec 005, 006, 007 leem esses campos)
for campo in ['materia', 'created_at', 'updated_at', 'source_file', 'source_hash', 'version']:
    if campo not in dados.get('meta', {}):
        erros.append(f'meta.{campo} ausente')

# Spec 005 — relevância lê: id, level, text
# Spec 007 — Anki lê: id, level=0 como frente, level=1+2 como verso
def verificar_no(no):
    for campo in ['id', 'level', 'text', 'children']:
        if campo not in no:
            erros.append(f'Nó {no.get(\"id\", \"?\")} sem campo \"{campo}\"')
    if no.get('level') == 2:
        palavras = len(no.get('text', '').replace('➤ ', '').split())
        if palavras > 15:
            erros.append(f'L2 {no[\"id\"]} tem {palavras} palavras (máx 15)')
    for filho in no.get('children', []):
        verificar_no(filho)

for topico in dados.get('data', []):
    verificar_no(topico)

if erros:
    print(f'{len(erros)} problema(s) encontrado(s):')
    for e in erros:
        print(f'  ✗ {e}')
else:
    print('topicos.json: conforme — pronto para specs 005, 006 e 007.')
    print(f'  Matéria: {dados[\"meta\"][\"materia\"]}')
    print(f'  Versão: {dados[\"meta\"][\"version\"]}')
    print(f'  Tópicos L0: {len(dados[\"data\"])}')
"
```

**Resultado esperado**:
```
topicos.json: conforme — pronto para specs 005, 006 e 007.
  Matéria: Direito Constitucional
  Versão: 1.0
  Tópicos L0: 42
```

---

## Pipeline Completo (todas as etapas de uma vez)

Quando as etapas individuais estiverem validadas, executar o pipeline completo:

```bash
python .github/skills/study-summary/summary_service.py \
       --arquivo "material_df.pdf" \
       --materia "Direito Constitucional" \
       --banca "CESPE"
```

**Saída esperada (resumida)**:
```
[10:00:00] Etapa 1/4 — Conversão PDF → Markdown... OK (4.832 palavras)
[10:00:02] Etapa 2/4 — Separação matéria/questões... OK (24 questões, 3.210 palavras matéria)
[10:06:30] Etapa 3/4 — Geração outline L0-L3 (Claude)... OK (293 nós)
[10:06:31] Etapa 4/4 — Persistência (topicos.json + questoes.json + _topicos.txt)... OK
Pipeline concluído em 6m 31s.
Artefatos gerados:
  data/topicos.json       (293 nós hierárquicos)
  data/questoes.json      (24 questões)
  _topicos.txt            (outline legível)
Log em: logs/execution_log.json
```

**Verificar log de execução**:
```bash
python -c "
import json
from pathlib import Path
entradas = json.loads(Path('logs/execution_log.json').read_text(encoding='utf-8'))
ultimas = entradas[-5:]
for e in ultimas:
    print(e.get('event', '?'), '|', e.get('level', '?'), '|', e.get('timestamp', '?'))
"
```
