<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 (template) → 1.0.0
  Modified principles: N/A (initial ratification)
  Added sections:
    - 8 Core Principles (I–VIII)
    - Restrições Adicionais (dependencies, file structure, logging)
    - Fluxo de Desenvolvimento (Speckit SDD workflow)
    - Governance (amendment rules, precedence, enforcement)
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no update needed
      (generic "Constitution Check" section — auto-resolves)
    - .specify/templates/spec-template.md ✅ no update needed
      (no constitution-specific references)
    - .specify/templates/tasks-template.md ✅ no update needed
      (no constitution-specific references)
  Follow-up TODOs: none
-->

# Study Concurso Agent Constitution

## Core Principles

### I. Interação em PT-BR

Toda comunicação com o usuário DEVE ocorrer em português brasileiro,
salvo solicitação explícita em contrário.

Isso inclui:

- Prompts e mensagens interativas
- Mensagens de erro orientadas ao usuário
- Logs exibidos ao usuário
- Documentação gerada automaticamente

Código, nomes de variáveis e commits podem ser em inglês.

### II. Confirmação Antes de Ações Destrutivas ou Externas

Nenhuma ação irreversível, destrutiva ou que produza efeitos fora do
workspace pode ocorrer sem confirmação explícita do usuário.

Inclui:

- Sobrescrever arquivos existentes
- Deletar artefatos
- Publicar ou atualizar Google Docs
- Enviar cards ao Anki
- Substituir memória persistida

### III. Pipeline Sequencial com Persistência de Estado

Todo pipeline DEVE ser executado em fases explícitas, com persistência
de progresso ao final de cada fase.

Regras:

- Cada fase DEVE ser retomável independentemente
- O sistema DEVE suportar recovery após interrupções
- O estado atual DEVE ser salvo em memória persistente
  (`study-memory.json`)

### IV. Dados Estruturados como Fonte da Verdade

Toda informação processada pelo sistema DEVE possuir representação
estruturada persistida.

Hierarquia oficial:

1. JSON em `/data/` = fonte canônica
2. Markdown em `/Histórico Anotações/` = versionamento e validação
   humana
3. Google Docs = apresentação e consumo

Nenhuma lógica de negócio DEVE depender exclusivamente de Markdown
ou Google Docs.

### V. RAG com Validação e Evolução Controlada

Toda informação obtida externamente ao edital DEVE passar por
validação antes de influenciar decisões.

Regras:

- Edital é fonte primária
- Web search é complementar (desabilitado na v1)
- Inferência do modelo é terciária
- Features de web search DEVEM possuir fallback quando indisponíveis
- Versões iniciais DEVEM operar sem dependência obrigatória de
  web search

### VI. Separação de Responsabilidades

Cada componente DEVE possuir responsabilidade única e claramente
definida.

Regras:

- Skills executam operações específicas e reutilizáveis
- Agentes orquestram fluxo e decisão
- Subagentes especializam análise complexa
- Scripts Python implementam infraestrutura e tooling
- Componentes NÃO DEVEM acumular responsabilidades de IO, análise
  e apresentação simultaneamente

### VII. Observabilidade Obrigatória

Todo fluxo relevante DEVE ser auditável.

Regras:

- Cada fase DEVE gerar logs estruturados em `/logs/`
- Decisões críticas do agente DEVEM ser rastreáveis
- Modo debug (`--debug`) DEVE ser suportado
- Falhas DEVEM registrar contexto suficiente para troubleshooting

### VIII. Evolução Compatível e Versionada

Mudanças estruturais DEVEM preservar compatibilidade ou versionar
explicitamente contratos quebrados.

Regras:

- Skills existentes DEVEM manter backward compatibility sempre que
  possível
- Alterações breaking em JSON exigem incremento de versão
- Mudanças de schema DEVEM incluir migração e documentação
- Memory store DEVE manter campo de versionamento

## Restrições Adicionais

### Dependências Técnicas Obrigatórias

O projeto DEVE manter compatibilidade com:

- Python 3.11+
- Windows como ambiente primário
- MarkItDown para conversão PDF → Markdown
- Google Docs API / Drive API
- AnkiConnect

### Estrutura de Arquivos Padronizada

O projeto DEVE manter organização consistente:

```plaintext
/data/                 # Fonte da verdade estruturada
/logs/                 # Logs estruturados
/input/editais/        # PDFs de entrada
/data/editais_md/      # Editais convertidos
/Histórico Anotações/  # Versionamento humano
.github/skills/        # Skills reutilizáveis
.github/agents/        # Agentes e subagentes
```

### Logging Obrigatório

Toda execução relevante DEVE registrar:

- Timestamp
- Step executado
- Inputs principais
- Outputs resumidos
- Decisões do agente
- Erros e exceções

## Fluxo de Desenvolvimento

Todo desenvolvimento do projeto DEVE seguir workflow
Specification-Driven Development via Speckit:

1. Specify
2. Clarify
3. Plan
4. Tasks
5. Implement

Nenhuma implementação significativa DEVE ocorrer sem specification
prévia.

## Governance

### Regras de Alteração

- Toda nova skill DEVE seguir template padrão do projeto
- Toda nova integração externa DEVE definir fallback strategy
- Toda mudança estrutural DEVE atualizar documentação correspondente
- Toda mudança breaking exige revisão da constitution se afetar
  princípios fundamentais
- Novas skills DEVEM seguir template padrão
- Qualquer alteração no formato JSON em `/data/` DEVE incrementar
  version no `study-memory.json`
- Skills existentes DEVEM manter backward compatibility

### Precedência

Em caso de conflito:

1. Constitution
2. Approved Specs
3. Implementation Plans
4. Tasks
5. Código existente

### Enforcement

Specs, Plans e Tasks que violem esta constitution DEVEM ser
considerados inválidos até adequação.

**Version**: 1.0.0 | **Ratified**: 2026-04-08 | **Last Amended**: 2026-04-08
