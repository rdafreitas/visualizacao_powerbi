# Contrato: Interface Publica do relevance_classifier.py

**Feature**: `005-study-relevance-engine` | **Date**: 2026-04-30

> **O que e uma interface publica?** E o conjunto de funcoes que um arquivo expoe
> para ser chamado por outros arquivos. Tudo que nao esta nesta lista e "detalhe
> interno" — nao deve ser chamado diretamente de fora do arquivo.
>
> **Por que documentar antes de implementar?** Porque o `relevance_service.py` vai
> chamar estas funcoes. Se a interface estiver definida aqui, o Service pode ser
> escrito em paralelo, e os dois arquivos se encaixam no final sem surpresas.

**Arquivo**: `.github/skills/study-relevance/relevance_classifier.py`
**Padrao de design**: Pure Function (ver `plan.md` secao Padroes de Design)
**Dependencia**: recebe uma `Estrategia` de `classification_strategies.py`

---

## Funcoes Publicas

### `classificar_topicos`

```python
def classificar_topicos(
    topicos: list[dict],
    estrategia: EstrategiaBase
) -> list[dict]:
```

**O que faz**: Recebe uma lista de topicos (lida do `topicos.json`) e uma estrategia
de classificacao. Aplica a estrategia a cada topico e retorna uma lista de
`ClassificacaoTopico` como dicionarios Python.

**Parametros**:
- `topicos`: Lista de dicionarios no formato de `topicos.json data[]`. Cada item
  deve ter pelo menos os campos `id` e `text` (ou `texto`).
- `estrategia`: Instancia de `EstrategiaComEdital` ou `EstrategiaSemEdital`
  (ambas herdam de `EstrategiaBase`).

**Retorno**: Lista de dicionarios, cada um com os campos:
```python
{
    "id": str,
    "texto": str,
    "classificacao": str,   # "alta" | "media" | "baixa"
    "emoji": str,            # "🔥" | "⚠️" | "📝"
    "justificativa": str,
    "fontes": list[str],    # subconjunto de ["edital", "ia"]
    "nivel_confianca": str  # "alta" | "media" | "baixa"
}
```

**Garantias (Pure Function)**:
- Nao lê arquivos do disco
- Nao escreve arquivos do disco
- Nao chama APIs externas diretamente
- Dado o mesmo `topicos` e a mesma `estrategia`, retorna sempre o mesmo resultado
- Nao modifica a lista `topicos` recebida (sem efeito colateral no input)

**Exemplo de uso**:
```python
from classification_strategies import EstrategiaComEdital, EstrategiaSemEdital
from relevance_classifier import classificar_topicos

# Com edital
topicos = [{"id": "t001", "texto": "Principio da legalidade"}]
edital = {"conteudo_programatico": ["Principios constitucionais", "Direitos fundamentais"]}
estrategia = EstrategiaComEdital(edital=edital)
resultado = classificar_topicos(topicos, estrategia)
# resultado[0]["classificacao"] -> "alta" | "media" | "baixa"

# Sem edital — mesma funcao, estrategia diferente
estrategia_sem = EstrategiaSemEdital()
resultado2 = classificar_topicos(topicos, estrategia_sem)
```

---

### `classificar_questoes`

```python
def classificar_questoes(
    questoes: list[dict],
    estrategia: EstrategiaBase
) -> list[dict]:
```

**O que faz**: Identico a `classificar_topicos`, mas opera sobre questoes.

**Parametros**:
- `questoes`: Lista de dicionarios no formato de `questoes.json data[]`. Cada item
  deve ter pelo menos os campos `id` e `texto` (enunciado).
- `estrategia`: Mesma instancia usada para topicos (reuso da sessao de classificacao).

**Retorno**: Lista de dicionarios com o mesmo schema de `classificar_topicos`.

**Regra especial**: Quando o enunciado da questao menciona multiplos temas, a funcao
usa apenas o **tema principal** para classificacao (o verbo central da pergunta, nao
os temas de contexto). Esta regra e implementada pela propria funcao, nao pela estrategia.

**Garantias**: Identicas as de `classificar_topicos` (Pure Function).

---

### `gerar_resumo`

```python
def gerar_resumo(
    classificacoes: list[dict],
    estrategia: EstrategiaBase
) -> dict:
```

**O que faz**: Recebe a lista completa de classificacoes (topicos + questoes juntos
ou separados) e retorna o `ResumoClassificacao` como dicionario.

**Parametros**:
- `classificacoes`: Lista de dicionarios retornados por `classificar_topicos` ou
  `classificar_questoes`.
- `estrategia`: Usada para popular `estrategia_usada` no resumo.

**Retorno**:
```python
{
    "alta": int,
    "media": int,
    "baixa": int,
    "total": int,
    "fontes_consultadas": list[str],  # lista unica de todas as fontes
    "nivel_rag": int,                 # sempre 1 na v1
    "estrategia_usada": str,          # "com_edital" | "sem_edital"
    "alerta": str | None              # mensagem se confianca geral e baixa
}
```

**Garantias**: Pure Function — nao tem efeitos colaterais.

---

## Funcoes Privadas (nao chamar diretamente)

As funcoes abaixo sao detalhes de implementacao. O prefixo `_` e a convencao Python
para "uso interno — nao chamar diretamente de fora deste arquivo".

```python
def _aplicar_estrategia(item: dict, estrategia: EstrategiaBase) -> dict:
    """Aplica a estrategia a um unico item e retorna o resultado com todos os campos."""

def _determinar_emoji(classificacao: str) -> str:
    """Converte 'alta'/'media'/'baixa' para emoji. Regra fixa — sem intervencao do modelo."""

def _validar_resultado(resultado: dict) -> None:
    """Verifica que o resultado tem todos os campos obrigatorios e valores validos.
    Lanca ValueError se invalido."""
```

---

## Interface das Estrategias (classification_strategies.py)

> Esta secao descreve o "contrato" que as estrategias devem seguir para funcionar
> com o classificador. E tecnicamente chamado de "interface" ou "classe base".

```python
class EstrategiaBase:
    """Classe base para todas as estrategias de classificacao."""

    def classificar(self, texto: str) -> dict:
        """
        Recebe o texto de um topico ou questao e retorna:
        {
            "classificacao": str,    # "alta" | "media" | "baixa"
            "justificativa": str,    # 1-2 frases em PT-BR
            "fontes": list[str],     # ex: ["edital", "ia"]
            "nivel_confianca": str   # "alta" | "media" | "baixa"
        }
        Subclasses DEVEM implementar este metodo.
        """
        raise NotImplementedError

    @property
    def nome(self) -> str:
        """Retorna 'com_edital' ou 'sem_edital' para uso no meta do JSON de saida."""
        raise NotImplementedError


class EstrategiaComEdital(EstrategiaBase):
    """Estrategia que usa edital_parsed.json como referencia primaria."""

    def __init__(self, edital: dict):
        """edital: conteudo de edital_parsed.json ja lido pelo Repository."""
        ...


class EstrategiaSemEdital(EstrategiaBase):
    """Estrategia que usa apenas inferencia do modelo (sem edital disponivel)."""
    ...
```

**Principio de substituicao**: Qualquer lugar que aceita `EstrategiaBase` aceita
`EstrategiaComEdital` ou `EstrategiaSemEdital` sem modificacao — isso e o Padrao
Strategy funcionando corretamente.
