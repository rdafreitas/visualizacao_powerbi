# Contrato: topicos.json

**Feature**: `004-study-summary-generation` | **Data**: 2026-04-30

> **O que é um contrato de dados?** É um documento que descreve exatamente o formato
> de um arquivo de dados — quais campos existem, quais são obrigatórios, quais são os
> tipos aceitos e quais regras de negócio se aplicam. Com este contrato, as specs que
> consomem `topicos.json` (005, 006, 007) podem ser implementadas sem depender da
> existência do arquivo real.

**Caminho**: `/data/topicos.json`
**Encoding**: UTF-8
**Produzido por**: `topic_repository.py` (spec 004)
**Consumido por**: spec 005 (relevância), spec 006 (publicação Google Docs), spec 007 (Anki)

---

## Schema Completo

```json
{
  "meta": {
    "materia":     "<string — nome da matéria>",
    "banca":       "<string | null — banca do concurso>",
    "created_at":  "<string — ISO 8601, ex: '2026-04-30T10:00:00'>",
    "updated_at":  "<string — ISO 8601 — atualizado a cada regeneração>",
    "source_file": "<string — nome do arquivo PDF de origem>",
    "source_hash": "<string — 'sha256:' + 64 caracteres hex>",
    "version":     "<string — '1.0'>"
  },
  "data": [
    {
      "id":       "<string>",
      "level":    "<integer: 0 | 1 | 2 | 3>",
      "text":     "<string>",
      "children": "<array de nós — mesmo schema recursivo>"
    }
  ]
}
```

---

## Campos Obrigatórios vs Opcionais

### Objeto `meta`

| Campo | Obrigatório | Tipo | Observação |
|-------|-------------|------|------------|
| `materia` | ✅ Sim | `string` | Nunca vazio |
| `banca` | Não | `string \| null` | `null` quando não identificada |
| `created_at` | ✅ Sim | `string` ISO 8601 | Definido na criação, nunca alterado |
| `updated_at` | ✅ Sim | `string` ISO 8601 | Atualizado a cada regeneração do outline |
| `source_file` | ✅ Sim | `string` | Nome do PDF (sem o caminho completo) |
| `source_hash` | ✅ Sim | `string` | Formato: `"sha256:" + hash de 64 chars |
| `version` | ✅ Sim | `string` | Valor atual: `"1.0"` |

### Objeto de nó em `data[]`

| Campo | Obrigatório | Tipo | Observação |
|-------|-------------|------|------------|
| `id` | ✅ Sim | `string` | Formato: `"t001"`, `"t001.1"`, `"t001.1.2"` |
| `level` | ✅ Sim | `integer` | Valores válidos: 0, 1, 2, 3 |
| `text` | ✅ Sim | `string` | Nunca vazio |
| `children` | ✅ Sim | `array` | `[]` em nós folha — nunca `null` ou ausente |

---

## Regras de Negócio

1. **Hierarquia de IDs**: O ID de um filho DEVE começar com o ID do pai seguido de `.`
   e número sequencial. Exemplos:
   - Pai `"t002"` → filhos `"t002.1"`, `"t002.2"`, `"t002.3"`
   - Pai `"t002.1"` → filhos `"t002.1.1"`, `"t002.1.2"`

2. **Profundidade máxima**: Nós com `level=3` NUNCA possuem `children` com elementos.
   `"children": []` é válido; `"children": [{...}]` num nó L3 viola o contrato.

3. **Limite de 15 palavras no L2**: Nós com `level=2` DEVEM ter no campo `text` no
   máximo 15 palavras, excluindo o marcador `➤`. Violação deve ser corrigida pelo
   `outline_builder.py` durante a geração.

4. **Marcadores por nível**:
   - `level=0` → sem marcador
   - `level=1` → texto começa com `"❖ "`
   - `level=2` → texto começa com `"➤ "`
   - `level=3` → texto começa com `"■ "`

5. **Estabilidade de IDs**: Uma vez atribuído, o ID de um tópico NÃO deve ser alterado
   em regenerações subsequentes do outline. As specs 005 e 007 armazenam referências
   a IDs de `topicos.json`; alteração de IDs quebra essas referências.

6. **`updated_at` vs `created_at`**: `created_at` é definido uma única vez na criação
   do arquivo. `updated_at` é atualizado a cada escrita pelo `topic_repository.py`.

---

## Exemplo Real Completo

```json
{
  "meta": {
    "materia": "Direito Constitucional",
    "banca": "CESPE",
    "created_at": "2026-04-30T10:00:00",
    "updated_at": "2026-04-30T10:45:00",
    "source_file": "material_df.pdf",
    "source_hash": "sha256:3a7f1c9b2d4e6f8a0b2c4d6e8f0a1b3c5d7e9f1a2b3c4d5e6f7a8b9c0d1e2f3a",
    "version": "1.0"
  },
  "data": [
    {
      "id": "t001",
      "level": 0,
      "text": "O que é o princípio da legalidade?",
      "children": [
        {
          "id": "t001.1",
          "level": 1,
          "text": "❖ Ninguém é obrigado a fazer ou deixar de fazer algo senão em virtude de lei",
          "children": [
            {
              "id": "t001.1.1",
              "level": 2,
              "text": "➤ Base constitucional: Art. 5º, inciso II da CF/88",
              "children": []
            },
            {
              "id": "t001.1.2",
              "level": 2,
              "text": "➤ Administração só age quando lei expressamente autoriza",
              "children": [
                {
                  "id": "t001.1.2.1",
                  "level": 3,
                  "text": "■ Contrasta com o particular: pode tudo que a lei não proíbe",
                  "children": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "t002",
      "level": 0,
      "text": "O que é o princípio da isonomia?",
      "children": [
        {
          "id": "t002.1",
          "level": 1,
          "text": "❖ Todos são iguais perante a lei, sem distinção de qualquer natureza",
          "children": [
            {
              "id": "t002.1.1",
              "level": 2,
              "text": "➤ Igualdade formal: mesma lei para todos sem exceção",
              "children": []
            },
            {
              "id": "t002.1.2",
              "level": 2,
              "text": "➤ Igualdade material: tratar desiguais desigualmente",
              "children": [
                {
                  "id": "t002.1.2.1",
                  "level": 3,
                  "text": "■ Ações afirmativas são expressão da igualdade material",
                  "children": []
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Verificação de Conformidade (script rápido)

```python
import json
from pathlib import Path

def verificar_topicos_json(caminho: str) -> list[str]:
    """Retorna lista de violações encontradas. Lista vazia = arquivo conforme."""
    erros = []
    dados = json.loads(Path(caminho).read_text(encoding="utf-8"))

    # Verificar meta obrigatórios
    for campo in ["materia", "created_at", "updated_at", "source_file", "source_hash", "version"]:
        if campo not in dados.get("meta", {}):
            erros.append(f"meta.{campo} ausente")

    # Verificar nós recursivamente
    def verificar_no(no, caminho_no):
        for campo in ["id", "level", "text", "children"]:
            if campo not in no:
                erros.append(f"Campo '{campo}' ausente em {caminho_no}")
        if no.get("level") not in [0, 1, 2, 3]:
            erros.append(f"level inválido em {caminho_no}: {no.get('level')}")
        if no.get("level") == 2:
            palavras = len(no.get("text", "").replace("➤ ", "").split())
            if palavras > 15:
                erros.append(f"L2 com {palavras} palavras (máx 15) em {caminho_no}")
        if no.get("level") == 3 and no.get("children"):
            erros.append(f"L3 com children em {caminho_no}")
        for filho in no.get("children", []):
            verificar_no(filho, f"{caminho_no}.{filho.get('id', '?')}")

    for topico in dados.get("data", []):
        verificar_no(topico, topico.get("id", "?"))

    return erros
```

**Uso**:
```bash
python -c "
from specs.verificar import verificar_topicos_json
erros = verificar_topicos_json('data/topicos.json')
print('OK' if not erros else '\n'.join(erros))
"
```
