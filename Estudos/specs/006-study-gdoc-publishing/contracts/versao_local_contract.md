# Contrato: Versão Local Markdown — Schema do Frontmatter

**Feature**: `006-study-gdoc-publishing` | **Date**: 2026-04-30

> **O que é frontmatter?** É um bloco de metadados no início de um arquivo Markdown,
> delimitado por `---`. É como a "capa" do documento — contém informações sobre o arquivo
> sem fazer parte do conteúdo em si. Editores como VS Code exibem o frontmatter separado
> do conteúdo.

---

## Schema do Frontmatter

Todo arquivo salvo por `version_manager.py` em `/Histórico Anotações/` deve seguir
este schema. Campos obrigatórios são marcados com ✅.

```yaml
---
materia: "Direito Constitucional"        # ✅ Nome da matéria (original, não normalizado)
banca: "CESPE"                           # ✅ Nome da banca
data: "2026-04-30T10:28:00"             # ✅ ISO 8601 com hora — momento da criação do arquivo
tipo: "resumo"                           # ✅ "resumo" ou "questoes"
gdoc_url: null                           # Preenchido após publicação bem-sucedida no Google Docs
versao: "1"                              # ✅ Versão do schema (sempre "1" por enquanto)
---
```

### Regras de validação por campo

| Campo | Tipo | Valores aceitos | Obrigatório | Preenchido quando |
|-------|------|----------------|-------------|------------------|
| `materia` | string | Qualquer string não-vazia | ✅ | Ao criar o arquivo |
| `banca` | string | Qualquer string não-vazia | ✅ | Ao criar o arquivo |
| `data` | string | ISO 8601 com hora (`YYYY-MM-DDTHH:MM:SS`) | ✅ | Ao criar o arquivo |
| `tipo` | string | `"resumo"` ou `"questoes"` | ✅ | Ao criar o arquivo |
| `gdoc_url` | string ou null | URL válida ou `null` | Não | Após publicação no Google Docs |
| `versao` | string | `"1"` | ✅ | Ao criar o arquivo |

---

## Convenção de Nome de Arquivo

### Formato geral

```
<tipo>_<materia-normalizada>_<YYYY-MM-DD>[_<HH-MM>].md
```

### Normalização do nome da matéria

A matéria passa por normalização para ser usada no nome do arquivo:

| Entrada | Normalizado |
|---------|-------------|
| `"Direito Constitucional"` | `"direito-constitucional"` |
| `"Português"` | `"portugues"` |
| `"Matemática Financeira"` | `"matematica-financeira"` |
| `"Direito Administrativo"` | `"direito-administrativo"` |

**Algoritmo de normalização** (em `version_manager.py`):
```python
import unicodedata

def normalizar_materia(materia: str) -> str:
    # 1. Remover acentos (NFD + só ASCII)
    sem_acento = unicodedata.normalize("NFD", materia)
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    # 2. Lowercase
    lower = sem_acento.lower()
    # 3. Espaços → hífens
    hifenizado = lower.replace(" ", "-")
    # 4. Remover caracteres não alfanuméricos (exceto hífens)
    return "".join(c for c in hifenizado if c.isalnum() or c == "-")
```

### Exemplos de nomes de arquivo

| Situação | Nome do arquivo |
|----------|----------------|
| Resumo, Direito Constitucional, 30/04/2026 | `resumo_direito-constitucional_2026-04-30.md` |
| Questões, Direito Constitucional, 30/04/2026 | `questoes_direito-constitucional_2026-04-30.md` |
| Segunda versão no mesmo dia, 10:45 | `resumo_direito-constitucional_2026-04-30_10-45.md` |
| Terceira versão no mesmo dia, 14:30 | `resumo_direito-constitucional_2026-04-30_14-30.md` |

**Regra de colisão** (FR-011): Se já existe `resumo_<mat>_<YYYY-MM-DD>.md`, usa sufixo
`_HH-MM`. A verificação de colisão é feita por `version_manager.py` antes de salvar.

---

## Diretórios de Armazenamento

```
/Histórico Anotações/
├── Resumo/
│   ├── resumo_direito-constitucional_2026-04-30.md
│   ├── resumo_direito-constitucional_2026-04-29.md
│   └── resumo_portugues_2026-04-28.md
└── Questões/
    ├── questoes_direito-constitucional_2026-04-30.md
    └── questoes_portugues_2026-04-28.md
```

Os diretórios são criados automaticamente por `version_manager.py` se não existirem
(`pathlib.Path.mkdir(parents=True, exist_ok=True)`).

---

## Exemplo Completo de Arquivo

Arquivo: `/Histórico Anotações/Resumo/resumo_direito-constitucional_2026-04-30.md`

```markdown
---
materia: "Direito Constitucional"
banca: "CESPE"
data: "2026-04-30T10:28:00"
tipo: "resumo"
gdoc_url: "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit"
versao: "1"
---

# Direito Constitucional — Resumo
**Banca**: CESPE | **Data**: 2026-04-30

---

## 🔥 1. Dos Princípios Fundamentais

### ❖ 1.1 Princípio da Legalidade
➤ Art. 5º, II — ninguém obrigado a fazer ou deixar de fazer algo senão em virtude de lei
■ Aplica-se a todos: cidadãos e Administração Pública

### ❖ 1.2 Princípio da Igualdade
➤ Art. 5º, caput — todos iguais perante a lei

## ⚠️ 2. Dos Direitos e Deveres Individuais

### ❖ 2.1 Inviolabilidade da vida privada
➤ Art. 5º, X — são invioláveis a intimidade, a vida privada, a honra e a imagem

## 📝 3. Da Organização do Estado

### ❖ 3.1 Dos Municípios
➤ Art. 29 — Município reger-se-á por Lei Orgânica própria
```

**Observação**: O campo `gdoc_url` aparece como `null` antes da publicação e é
atualizado pelo `version_manager.py` após publicação bem-sucedida.

---

## Leitura do Frontmatter em Python

O `version_manager.py` usa split manual por `---` para evitar dependência de PyYAML:

```python
def ler_frontmatter(caminho: str) -> dict:
    """
    Lê o frontmatter YAML de um arquivo Markdown.
    Retorna dict com os campos, ou {} se não houver frontmatter.
    """
    import re
    conteudo = Path(caminho).read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---\n", conteudo, re.DOTALL)
    if not match:
        return {}
    # Parse manual: "chave: valor" por linha
    frontmatter = {}
    for linha in match.group(1).split("\n"):
        if ": " in linha:
            chave, _, valor = linha.partition(": ")
            frontmatter[chave.strip()] = valor.strip().strip('"')
    return frontmatter
```

**Alternativa**: Se PyYAML estiver disponível, `yaml.safe_load()` pode ser usado.
Optamos pelo parse manual para evitar dependência extra (Princípio de Simplicidade).
