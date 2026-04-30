# Diretrizes de Desenvolvimento — Estudos

Gerado automaticamente a partir de todos os planos de feature. Última atualização: 2026-04-30

## Tecnologias Ativas

- Python 3.11+ + `urllib`, `json`, `pathlib`, `datetime` (todos stdlib — sem `pip install`) (007-study-anki-export)

## Estrutura do Projeto

```text
src/
tests/
```

## Comandos

cd src [APENAS COMANDOS PARA AS TECNOLOGIAS ATIVAS][APENAS COMANDOS PARA AS TECNOLOGIAS ATIVAS] pytest [APENAS COMANDOS PARA AS TECNOLOGIAS ATIVAS][APENAS COMANDOS PARA AS TECNOLOGIAS ATIVAS] ruff check .

## Estilo de Código

Python 3.11+: Siga as convenções padrão

## Mudanças Recentes

- 007-study-anki-export: Adicionado Python 3.11+ + `urllib`, `json`, `pathlib`, `datetime` (todos stdlib — sem `pip install`)

<!-- ADIÇÕES MANUAIS - INÍCIO -->

## Idioma

Toda comunicação com o usuário e toda documentação devem estar em **português do Brasil (PT-BR)**.

Isso inclui: mensagens ao usuário, comentários em código, docstrings, textos de templates, instruções de agentes, nomes de seções e qualquer conteúdo legível por humanos.

**Exceções — mantenha em inglês:**
- Comandos de terminal e scripts (`pip install`, `pytest`, `git commit`, etc.)
- Caminhos de arquivo e nomes de diretório
- Nomes de variáveis, funções, classes e módulos Python
- Chaves de dicionários JSON/YAML e nomes de campos de schema
- Flags e opções de CLI (`--json`, `--debug`, `--require-tasks`, etc.)
- IDs funcionais de rastreamento (`T001`, `CHK001`, `RF-001`, `[P]`, `[US1]`, etc.)
- Nomes de bibliotecas, frameworks e ferramentas (`urllib`, `pathlib`, `pytest`, etc.)
- Qualquer string interpretada diretamente por ferramentas ou sistemas externos

<!-- ADIÇÕES MANUAIS - FIM -->
