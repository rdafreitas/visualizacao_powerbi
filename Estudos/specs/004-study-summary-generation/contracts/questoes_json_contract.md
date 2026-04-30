# Contrato: questoes.json

**Feature**: `004-study-summary-generation` | **Data**: 2026-04-30

> **O que é este arquivo?** `questoes.json` armazena todas as questões extraídas do
> material de estudo — enunciado, alternativas e gabarito. Ele é o par de `topicos.json`:
> enquanto `topicos.json` guarda a matéria estruturada, `questoes.json` guarda os
> exercícios. Specs futuras usam este arquivo para geração de simulados e exportação Anki.

**Caminho**: `/data/questoes.json`
**Encoding**: UTF-8
**Produzido por**: `topic_repository.py` (spec 004), alimentado pelo `content_splitter.py`
**Consumido por**: spec 006 (publicação Google Docs — seção de exercícios), spec 007
(exportação Anki de questões), futuras specs de simulado

---

## Schema Completo

```json
{
  "meta": {
    "materia":     "<string — nome da matéria>",
    "banca":       "<string | null>",
    "created_at":  "<string — ISO 8601>",
    "source_file": "<string — nome do PDF de origem>",
    "source_hash": "<string — 'sha256:' + 64 chars hex>",
    "version":     "<string — '1.0'>"
  },
  "data": [
    {
      "id":           "<string — ex: 'q001'>",
      "enunciado":    "<string — texto completo da questão>",
      "alternativas": "<object | null>",
      "gabarito":     "<string | null>",
      "tipo":         "<'multipla_escolha' | 'certo_errado' | 'dissertativa'>"
    }
  ]
}
```

### Estrutura do objeto `alternativas`

Presente apenas quando `tipo = "multipla_escolha"`. As chaves são as letras disponíveis
no material (nem toda questão tem 5 alternativas):

```json
{
  "A": "<texto da alternativa A>",
  "B": "<texto da alternativa B>",
  "C": "<texto da alternativa C>",
  "D": "<texto da alternativa D>",
  "E": "<texto da alternativa E — opcional>"
}
```

---

## Campos Obrigatórios vs Opcionais

### Objeto `meta`

| Campo | Obrigatório | Tipo | Observação |
|-------|-------------|------|------------|
| `materia` | ✅ Sim | `string` | Deve ser idêntico ao `meta.materia` de `topicos.json` |
| `banca` | Não | `string \| null` | `null` quando não identificada |
| `created_at` | ✅ Sim | `string` ISO 8601 | Definido na criação, nunca alterado |
| `source_file` | ✅ Sim | `string` | Nome do PDF |
| `source_hash` | ✅ Sim | `string` | Deve ser idêntico ao hash em `topicos.json` — mesma origem |
| `version` | ✅ Sim | `string` | Valor atual: `"1.0"` |

> **Atenção**: `questoes.json` não tem campo `updated_at` — as questões são extraídas
> uma única vez por PDF. Se o PDF for reprocessado, o arquivo é recriado do zero.

### Objeto de questão em `data[]`

| Campo | Obrigatório | Tipo | Observação |
|-------|-------------|------|------------|
| `id` | ✅ Sim | `string` | Formato: `"q001"`, `"q002"`, sequencial |
| `enunciado` | ✅ Sim | `string` | Texto completo — nunca truncado |
| `alternativas` | Depende | `object \| null` | Obrigatório se `tipo = "multipla_escolha"` |
| `gabarito` | Não | `string \| null` | `null` quando não presente no material |
| `tipo` | ✅ Sim | `string` | Enum: `"multipla_escolha"`, `"certo_errado"`, `"dissertativa"` |

---

## Regras de Negócio

1. **Consistência de hash**: `questoes.json meta.source_hash` DEVE ser igual a
   `topicos.json meta.source_hash`. Se divergirem, as specs downstream sabem que os
   arquivos são de PDFs diferentes e devem alertar o usuário.

2. **IDs sequenciais e estáveis**: IDs começam em `"q001"` e são incrementados. Não são
   reaproveitados entre processamentos do mesmo PDF.

3. **Campo `tipo` obrigatório**: Determina qual processamento downstream se aplica.
   - `"multipla_escolha"` → `alternativas` não pode ser `null`
   - `"certo_errado"` → `alternativas` é `null`; `gabarito` é `"Certo"` ou `"Errado"`
   - `"dissertativa"` → `alternativas` é `null`; `gabarito` é `null`

4. **Questão sem gabarito no material**: `gabarito` é `null` — nunca inventar. Se o
   material tiver gabarito em seção separada, o `content_splitter.py` associa pelo
   número sequencial da questão.

5. **Arquivo não criado quando não há questões**: Se o material não contiver questões
   detectáveis, `questoes.json` não é criado e o usuário é informado. Specs downstream
   devem verificar existência do arquivo antes de consumir.

---

## Exemplo Real Completo

```json
{
  "meta": {
    "materia": "Direito Constitucional",
    "banca": "CESPE",
    "created_at": "2026-04-30T10:00:00",
    "source_file": "material_df.pdf",
    "source_hash": "sha256:3a7f1c9b2d4e6f8a0b2c4d6e8f0a1b3c5d7e9f1a2b3c4d5e6f7a8b9c0d1e2f3a",
    "version": "1.0"
  },
  "data": [
    {
      "id": "q001",
      "enunciado": "Acerca dos direitos e garantias fundamentais previstos na Constituição Federal de 1988, julgue o item a seguir. O princípio da legalidade impõe que ninguém seja obrigado a fazer ou a deixar de fazer algo senão em virtude de lei.",
      "alternativas": null,
      "gabarito": "Certo",
      "tipo": "certo_errado"
    },
    {
      "id": "q002",
      "enunciado": "Com base no princípio da isonomia, assinale a alternativa correta.",
      "alternativas": {
        "A": "A igualdade formal e a igualdade material são conceitos idênticos.",
        "B": "O princípio da isonomia proíbe qualquer distinção entre as pessoas, inclusive as favoráveis.",
        "C": "A igualdade material permite tratar desigualmente os desiguais na medida de sua desigualdade.",
        "D": "O princípio da isonomia aplica-se exclusivamente nas relações entre particulares.",
        "E": "A Constituição de 1988 não prevê expressamente o princípio da igualdade."
      },
      "gabarito": "C",
      "tipo": "multipla_escolha"
    },
    {
      "id": "q003",
      "enunciado": "Explique a diferença entre igualdade formal e igualdade material, citando pelo menos um exemplo de cada conceito no contexto do direito constitucional brasileiro.",
      "alternativas": null,
      "gabarito": null,
      "tipo": "dissertativa"
    },
    {
      "id": "q004",
      "enunciado": "O princípio da isonomia, previsto no art. 5º, caput, da CF/88, proíbe toda e qualquer distinção entre os indivíduos, inclusive as distinções favoráveis a grupos historicamente marginalizados.",
      "alternativas": null,
      "gabarito": "Errado",
      "tipo": "certo_errado"
    }
  ]
}
```

---

## Verificação de Conformidade (script rápido)

```python
import json
from pathlib import Path

def verificar_questoes_json(caminho: str) -> list[str]:
    """Retorna lista de violações. Lista vazia = arquivo conforme."""
    erros = []
    dados = json.loads(Path(caminho).read_text(encoding="utf-8"))

    # Verificar meta obrigatórios
    for campo in ["materia", "created_at", "source_file", "source_hash", "version"]:
        if campo not in dados.get("meta", {}):
            erros.append(f"meta.{campo} ausente")

    tipos_validos = {"multipla_escolha", "certo_errado", "dissertativa"}

    for q in dados.get("data", []):
        qid = q.get("id", "?")
        if "tipo" not in q:
            erros.append(f"{qid}: campo 'tipo' ausente")
            continue
        if q["tipo"] not in tipos_validos:
            erros.append(f"{qid}: tipo inválido '{q['tipo']}'")
        if q["tipo"] == "multipla_escolha" and q.get("alternativas") is None:
            erros.append(f"{qid}: multipla_escolha sem alternativas")
        if q["tipo"] == "certo_errado" and q.get("gabarito") not in ["Certo", "Errado", None]:
            erros.append(f"{qid}: gabarito de certo_errado inválido '{q.get('gabarito')}'")
        if not q.get("enunciado"):
            erros.append(f"{qid}: enunciado vazio ou ausente")

    return erros
```

**Uso**:
```bash
python -c "
from specs.verificar import verificar_questoes_json
erros = verificar_questoes_json('data/questoes.json')
print('OK' if not erros else '\n'.join(erros))
"
```
