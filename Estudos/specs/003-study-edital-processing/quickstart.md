# Quickstart: Study Edital Processing

**Feature**: `003-study-edital-processing` | **Date**: 2026-04-30

> Este guia mostra como testar cada User Story manualmente, passo a passo.
> Siga a ordem — cada User Story depende da anterior estar funcionando.

---

## Pré-requisitos (verificar antes de começar)

- [ ] Python 3.11+ instalado (`python --version` no terminal)
- [ ] MarkItDown instalado (`pip install markitdown`)
- [ ] Spec 002 implementada: `/logs/` existe e logging funciona
- [ ] Diretório `/input/editais/` existe (criar manualmente se necessário)
- [ ] Diretório `/data/editais_md/` existe (criar manualmente se necessário)

**Verificar que MarkItDown está instalado** (execute no terminal):
```bash
python -c "from markitdown import MarkItDown; print('MarkItDown OK')"
```
Deve imprimir `MarkItDown OK`. Se der erro, execute `pip install markitdown`.

**Criar os diretórios necessários** (se não existirem):
```bash
python -c "from pathlib import Path; [Path(p).mkdir(parents=True, exist_ok=True) for p in ['input/editais', 'data/editais_md', 'data', 'logs']]"
```

---

## Como criar um PDF de teste para desenvolvimento

Se você ainda não tem um edital real, pode criar um PDF de teste simples para verificar
que o pipeline funciona antes de testar com um edital real.

### Opção 1 — Usando Microsoft Word (mais fácil no Windows)

1. Abra o Word e crie um documento com o conteúdo abaixo
2. Salve como PDF: Arquivo → Salvar Como → PDF

**Conteúdo do documento de teste** (copie e cole no Word):

```
EDITAL DE CONCURSO PÚBLICO N.º 001/2026

Banca Organizadora: CESPE/CEBRASPE

Cargo: Analista Judiciário — Área Judiciária

Conteúdo Programático

Direito Constitucional
- Princípios fundamentais da República Federativa do Brasil
- Direitos e garantias fundamentais
- Organização do Estado
- Organização dos Poderes

Direito Administrativo
- Administração pública: princípios constitucionais
- Ato administrativo
- Serviços públicos
- Responsabilidade civil do Estado

Língua Portuguesa
- Compreensão e interpretação de textos
- Ortografia oficial
- Concordância verbal e nominal
```

3. Salve o PDF como `edital_teste.pdf` em `/input/editais/`

### Opção 2 — Via Python (sem Word)

```python
# Instalar fpdf2: pip install fpdf2
from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font("Helvetica", size=12)

linhas = [
    "EDITAL DE CONCURSO PUBLICO N.o 001/2026",
    "",
    "Banca Organizadora: CESPE/CEBRASPE",
    "Cargo: Analista Judiciario - Area Judiciaria",
    "",
    "Conteudo Programatico",
    "",
    "Direito Constitucional",
    "- Principios fundamentais da Republica Federativa do Brasil",
    "- Direitos e garantias fundamentais",
    "",
    "Direito Administrativo",
    "- Administracao publica: principios constitucionais",
    "- Ato administrativo",
    "",
    "Lingua Portuguesa",
    "- Compreensao e interpretacao de textos",
    "- Ortografia oficial",
]

for linha in linhas:
    pdf.cell(0, 10, linha, ln=True)

pdf.output("input/editais/edital_teste.pdf")
print("PDF criado: input/editais/edital_teste.pdf")
```

> **Nota**: PDF criado via fpdf2 sem acentos para evitar problemas de encoding na criação.
> Um edital real terá acentos — isso é esperado e MarkItDown lida corretamente.

---

## User Story 1 — Conversão Automática de Edital (PDF para Markdown)

**Objetivo**: Verificar que o sistema detecta o PDF e gera o Markdown correspondente.

```bash
# Executar do diretório raiz do projeto
python .github/skills/study-edital/pdf_converter.py
```

**Saída esperada**:
```
PDFs encontrados em /input/editais/:
  1. edital_teste.pdf

Processando: edital_teste.pdf...
Convertendo PDF para Markdown... OK
Markdown salvo em: data/editais_md/edital_teste.md
```

**Verificar o Markdown gerado**:
```bash
python -c "from pathlib import Path; print(Path('data/editais_md/edital_teste.md').read_text(encoding='utf-8')[:500])"
```
Deve mostrar os primeiros 500 caracteres do Markdown — verifique que o texto do edital
está legível e estruturado (listas com `-`, títulos reconhecíveis).

**Cenários para verificar**:
- [ ] PDF em `/input/editais/` gera `.md` em `/data/editais_md/` com mesmo nome base
- [ ] Executar novamente com o mesmo PDF → sistema pergunta se deseja reconverter ou reutilizar
- [ ] PDF protegido por senha → sistema informa motivo da falha sem travar
- [ ] Múltiplos PDFs → sistema lista todos e pergunta quais processar

---

## User Story 2 — Extração Estruturada de Dados do Edital

**Objetivo**: Verificar que o sistema analisa o Markdown e extrai banca, cargo e matérias.

**Pré-requisito**: US1 concluída — `data/editais_md/edital_teste.md` existe.

```bash
python .github/skills/study-edital/edital_service.py --processar data/editais_md/edital_teste.md
```

**Saída esperada**:
```
Analisando: data/editais_md/edital_teste.md
Estratégia: tentando tabela... não encontrada.
Estratégia: tentando bullet list... OK (3 matérias encontradas)

Dados extraídos:
  Banca:  CESPE/CEBRASPE
  Cargo:  Analista Judiciário — Área Judiciária
  Matérias extraídas (3):
    1. Direito Constitucional (2 tópicos)
    2. Direito Administrativo (2 tópicos)
    3. Língua Portuguesa (2 tópicos)
  Pesos: não encontrados (null)

Validação: OK (banca + 3 matérias extraídas)
Salvo em: data/edital_parsed.json
```

**Verificar o JSON gerado**:
```bash
python -c "import json; d=json.load(open('data/edital_parsed.json', encoding='utf-8')); print(json.dumps(d, indent=2, ensure_ascii=False))"
```
Deve exibir o JSON formatado com `meta` e `data` no nível raiz.

**Verificar campos específicos**:
```bash
python -c "import json; d=json.load(open('data/edital_parsed.json', encoding='utf-8')); print('Banca:', d['data']['banca']); print('Matérias:', len(d['data']['materias']))"
```
Deve imprimir a banca e o número de matérias extraídas.

**Cenários para verificar**:
- [ ] Edital com formato de tabela Markdown → estratégia "tabela" é usada
- [ ] Edital com listas → estratégia "bullet" é usada
- [ ] Edital sem banca nem matéria → sistema informa falha, não salva JSON
- [ ] Edital com múltiplos cargos → sistema lista cargos e pergunta qual processar
- [ ] Campos ausentes (pesos) → aparecem como `null` no JSON, não são omitidos

---

## User Story 3 — Consulta de Dados do Edital

**Objetivo**: Verificar que outras specs conseguem consultar o edital processado.

**Pré-requisito**: US2 concluída — `data/edital_parsed.json` existe e é válido.

```bash
# Simular o que as specs 005/006/007 fazem ao consultar o edital
python -c "
import sys
sys.path.insert(0, '.github/skills/study-edital')
from edital_service import obter_materias, edital_existe

print('Edital existe?', edital_existe())
materias = obter_materias()
print(f'Total de matérias: {len(materias)}')
for m in materias:
    print(f'  - {m[\"nome\"]} ({len(m[\"topicos\"])} tópicos)')
"
```

**Saída esperada**:
```
Edital existe? True
Total de matérias: 3
  - Direito Constitucional (2 tópicos)
  - Direito Administrativo (2 tópicos)
  - Língua Portuguesa (2 tópicos)
```

**Testar ausência do arquivo** (comportamento defensivo):
```bash
python -c "
import sys, os
# Temporariamente renomear o arquivo
os.rename('data/edital_parsed.json', 'data/edital_parsed.json.bak')

sys.path.insert(0, '.github/skills/study-edital')
from edital_service import obter_materias, edital_existe
print('Edital existe?', edital_existe())   # deve ser False
materias = obter_materias()
print('Matérias:', materias)               # deve ser []

# Restaurar
os.rename('data/edital_parsed.json.bak', 'data/edital_parsed.json')
print('Arquivo restaurado.')
"
```

**Saída esperada** (sem o arquivo):
```
Edital existe? False
Matérias: []
Arquivo restaurado.
```

**Cenários para verificar**:
- [ ] `edital_existe()` retorna `True` com JSON válido, `False` sem o arquivo
- [ ] `obter_materias()` retorna lista com todas as matérias quando JSON existe
- [ ] `obter_materias()` retorna lista vazia `[]` quando JSON não existe (sem erro)
- [ ] Log em `/logs/execution_log.json` contém entradas das operações acima

---

## Verificação Cruzada (após todos os testes)

```bash
# Verificar log de execução (últimas 5 entradas)
python -c "
import json
with open('logs/execution_log.json', encoding='utf-8') as f:
    logs = json.load(f)
for entrada in logs[-5:]:
    print(entrada.get('event', '?'), '|', entrada.get('level', '?'))
"
```

```bash
# Verificar estrutura completa do JSON gerado
python -c "
import json
with open('data/edital_parsed.json', encoding='utf-8') as f:
    d = json.load(f)

# Verificar campos obrigatórios
assert 'meta' in d, 'ERRO: campo meta ausente'
assert 'data' in d, 'ERRO: campo data ausente'
assert d['data']['banca'], 'ERRO: banca vazia'
assert len(d['data']['materias']) >= 1, 'ERRO: sem matérias'

print('Estrutura do JSON: OK')
print(f'  Banca: {d[\"data\"][\"banca\"]}')
print(f'  Matérias: {len(d[\"data\"][\"materias\"])}')
print(f'  Estratégia usada: {d[\"meta\"][\"extracao\"][\"estrategia_usada\"]}')
print(f'  Versão do schema: {d[\"meta\"][\"version\"]}')
"
```

---

## Solução de Problemas Comuns

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| `ModuleNotFoundError: markitdown` | MarkItDown não instalado | `pip install markitdown` |
| Markdown gerado está vazio | PDF é escaneado (imagem) | Use um PDF com texto extraível |
| Nenhuma matéria extraída | Formato do edital não reconhecido pelas 3 estratégias | Abra o `.md` e verifique qual seção contém as matérias; reporte para adicionar keyword |
| `FileNotFoundError: input/editais/` | Diretório não existe | Crie com `mkdir -p input/editais` |
| JSON não salvo após extração | Validação de invariante falhou (sem banca ou matéria) | Verifique mensagem de erro; pode ser necessário editar o `.md` manualmente |
