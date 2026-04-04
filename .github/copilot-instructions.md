# Convenções do Workspace — Power BI + Figma

## Estrutura PBIP

Relatórios Power BI são armazenados no formato PBIP (projeto), com a seguinte estrutura:

```
<Nome>.pbip
<Nome>.Report/
  definition.pbir
  definition/
    report.json
    version.json
    pages/
      pages.json
      <PageName>/
        page.json
        visuals/
          <visual_id>/
            visual.json
  StaticResources/
    RegisteredResources/    ← imagens registradas
    SharedResources/
      BaseThemes/
<Nome>.SemanticModel/
  definition.pbism
  definition/
    model.tmdl
    database.tmdl
    relationships.tmdl
    tables/
      <tabela>.tmdl
    cultures/
      pt-BR.tmdl
```

## Nomenclatura de Skills

- Todas as skills de Power BI seguem o padrão `pbi-*` e ficam em `.github/skills/pbi-*/SKILL.md`.

## Nomenclatura de Pastas de Visuais

- Padrão: `<tipo>_<seq>` (ex.: `linha_01`, `coluna_02`, `botao_01`).
- Somente `a-z`, `0-9` e `_` no nome. Sem espaços, acentos, hífens ou caracteres especiais.
- Sequencial reiniciado por página.

## Idioma

- Toda interação com o usuário e documentação deve ser em **PT-BR**.

## Backup

- Sempre criar backup `.bak` de arquivos existentes antes de modificá-los (ex.: `visual.json.bak`, `pages.json.bak`).

## Modelo Semântico

- Tabelas, medidas e relacionamentos ficam em `*.SemanticModel/definition/`.
- Arquivos `.tmdl` definem tabelas e medidas DAX.

## Servidores MCP

- **Figma MCP** — leitura de protótipos Figma (configurado em `.vscode/mcp.json`).
- **powerbi-modeling-mcp** — detecção de painéis abertos no Power BI Desktop.

## Skills Disponíveis

As skills PBI ficam em `.github/skills/` e cobrem: criação de página, layout, texto, forma, imagem, botão, filtro, abas de navegação, gráficos (linha, coluna, linha+coluna, pizza, rosca, tabela, matriz), carga de CSV, complementos de painel e renomeação de página.

## Agente de Estudos para Concurso

Skills e agente para fluxo de estudo ficam em `.github/skills/study-*/SKILL.md` e `.github/agents/study-concurso.agent.md`.

### Nomenclatura de Skills de Estudo

- Todas as skills de concurso seguem o padrão `study-*` e ficam em `.github/skills/study-*/SKILL.md`.
- Scripts Python ficam dentro da própria pasta da skill (ex.: `convert_pdf.py`, `create_gdoc.py`, `send_to_anki.py`).

### Estrutura de Pastas de Estudo (sugerida)

```
<Concurso>/
  pdfs/           ← PDFs originais
  markdowns/      ← arquivos .md gerados
  outputs/        ← _materia.md, _questoes.md, _topicos.txt, _relevancia.md
  credentials.json  ← credenciais Google OAuth2 (não versionar)
  token.json        ← token gerado automaticamente (não versionar)
```

### Técnica de Tópicos (formato `_topicos.txt`)

```
Tema principal do parágrafo:
	• Explicação principal (1 tab)
		• Detalhe da explicação (2 tabs)
			• Detalhe adicional (3 tabs, uso raro)
```

- L1 (0 tabs): tema/cabeçalho — sem `•`, termina com `:`
- L2+ (N tabs): `•` + texto com N tabs de indentação
- Linha vazia entre blocos temáticos distintos

### Integrações Externas

- **Google Docs API** — gera documentos com hierarquia de tópicos (`create_gdoc.py`). Requer `credentials.json` do Google Cloud Console.
- **AnkiConnect** — cria flashcards no Anki Desktop via API REST em `localhost:8765` (`send_to_anki.py`). Requer plugin AnkiConnect (código `2055492159`) instalado e Anki aberto.

### Skills de Estudo Disponíveis

| Skill | Script | Descrição |
|-------|--------|-----------|
| `study-pdf-to-md` | `convert_pdf.py` | Converte PDF → Markdown (MarkItDown) |
| `study-split-md` | — | Separa matéria explicativa de questões |
| `study-formatar-topicos` | `create_gdoc.py` | Formata em tópicos hierárquicos e publica no Google Docs |
| `study-relevancia` | — | Classifica tópicos por frequência em provas (🔥 / ⚠️ / 📝) |
| `study-anki` | `send_to_anki.py` | Cria flashcards no Anki via AnkiConnect |
