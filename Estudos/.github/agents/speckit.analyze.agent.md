---
description: Realiza uma análise de consistência e qualidade entre artefatos (spec.md, plan.md e tasks.md) após a geração de tarefas, sem modificar nenhum arquivo.
---

## Entrada do Usuário

```text
$ARGUMENTS
```

Você **DEVE** considerar a entrada do usuário antes de prosseguir (se não estiver vazia).

## Objetivo

Identificar inconsistências, duplicações, ambiguidades e itens subespecificados nos três artefatos principais (`spec.md`, `plan.md`, `tasks.md`) antes da implementação. Este comando DEVE ser executado somente após o `/speckit.tasks` ter produzido com sucesso um `tasks.md` completo.

## Restrições de Operação

**ESTRITAMENTE SOMENTE LEITURA**: **Não** modifique nenhum arquivo. Gere um relatório de análise estruturado. Ofereça um plano de remediação opcional (o usuário deve aprovar explicitamente antes que qualquer comando de edição seja invocado manualmente).

**Autoridade da Constituição**: A constituição do projeto (`.specify/memory/constitution.md`) é **inegociável** neste escopo de análise. Conflitos com a constituição são automaticamente CRÍTICOS e exigem ajuste na spec, plan ou tasks — não diluição, reinterpretação ou ignoração silenciosa do princípio. Se um princípio em si precisar ser alterado, isso deve ocorrer em uma atualização separada e explícita da constituição, fora do `/speckit.analyze`.

## Passos de Execução

### 1. Inicializar Contexto de Análise

Execute `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` uma vez a partir da raiz do repositório e analise o JSON para obter FEATURE_DIR e AVAILABLE_DOCS. Derive os caminhos absolutos:

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md

Interrompa com mensagem de erro se algum arquivo obrigatório estiver ausente (instrua o usuário a executar o comando de pré-requisito ausente).
Para aspas simples em argumentos como "I'm Groot", use sintaxe de escape: ex. 'I'\''m Groot' (ou use aspas duplas se possível: "I'm Groot").

### 2. Carregar Artefatos (Divulgação Progressiva)

Carregue apenas o contexto mínimo necessário de cada artefato:

**Do spec.md:**

- Visão geral/Contexto
- Requisitos Funcionais
- Critérios de Sucesso (resultados mensuráveis — ex.: performance, segurança, disponibilidade, sucesso do usuário, impacto no negócio)
- Histórias de Usuário
- Casos de Borda (se presentes)

**Do plan.md:**

- Escolhas de arquitetura/stack
- Referências ao Modelo de Dados
- Fases
- Restrições técnicas

**Do tasks.md:**

- IDs de tarefa
- Descrições
- Agrupamento de fases
- Marcadores de paralelismo [P]
- Caminhos de arquivos referenciados

**Da constituição:**

- Carregar `.specify/memory/constitution.md` para validação de princípios

### 3. Construir Modelos Semânticos

Crie representações internas (não inclua artefatos brutos na saída):

- **Inventário de requisitos**: Para cada Requisito Funcional (RF-###) e Critério de Sucesso (CS-###), registre uma chave estável. Use o identificador RF-/CS- como chave primária quando presente, e opcionalmente derive um slug de frase imperativa para legibilidade (ex.: "Usuário pode enviar arquivo" → `usuario-pode-enviar-arquivo`). Inclua apenas itens de Critério de Sucesso que requerem trabalho de construção (ex.: infraestrutura de testes de carga, ferramentas de auditoria de segurança), e exclua métricas de resultado pós-lançamento e KPIs de negócio (ex.: "Reduzir tickets de suporte em 50%").
- **Inventário de histórias/ações de usuário**: Ações discretas do usuário com critérios de aceitação
- **Mapeamento de cobertura de tarefas**: Mapeie cada tarefa a um ou mais requisitos ou histórias (inferência por palavra-chave / padrões de referência explícita como IDs ou frases-chave)
- **Conjunto de regras da constituição**: Extraia nomes de princípios e declarações normativas DEVE/DEVERIA

### 4. Passagens de Detecção (Análise com Eficiência de Tokens)

Foque em descobertas de alto sinal. Limite a 50 descobertas no total; agregue o restante em resumo de overflow.

#### A. Detecção de Duplicatas

- Identifique requisitos quase duplicados
- Marque a formulação de menor qualidade para consolidação

#### B. Detecção de Ambiguidade

- Marque adjetivos vagos (rápido, escalável, seguro, intuitivo, robusto) sem critérios mensuráveis
- Marque espaços reservados não resolvidos (TODO, TKTK, ???, `<placeholder>`, etc.)

#### C. Subespecificação

- Requisitos com verbos mas sem objeto ou resultado mensurável
- Histórias de usuário sem alinhamento com critérios de aceitação
- Tarefas que referenciam arquivos ou componentes não definidos na spec/plan

#### D. Alinhamento com a Constituição

- Qualquer requisito ou elemento do plano que conflite com um princípio DEVE
- Seções obrigatórias ou gates de qualidade da constituição ausentes

#### E. Lacunas de Cobertura

- Requisitos sem tarefas associadas
- Tarefas sem requisito/história mapeada
- Critérios de Sucesso que requerem trabalho de construção (performance, segurança, disponibilidade) não refletidos nas tarefas

#### F. Inconsistências

- Deriva de terminologia (mesmo conceito com nomes diferentes entre os arquivos)
- Entidades de dados referenciadas no plan mas ausentes na spec (ou vice-versa)
- Contradições de ordenação de tarefas (ex.: tarefas de integração antes de tarefas de setup fundamentais sem nota de dependência)
- Requisitos conflitantes (ex.: um requer Next.js enquanto outro especifica Vue)

### 5. Atribuição de Severidade

Use esta heurística para priorizar descobertas:

- **CRITICAL**: Viola um DEVE da constituição, artefato de spec principal ausente, ou requisito sem cobertura que bloqueia a funcionalidade básica
- **HIGH**: Requisito duplicado ou conflitante, atributo de segurança/performance ambíguo, critério de aceitação não testável
- **MEDIUM**: Deriva de terminologia, cobertura de tarefa não funcional ausente, caso de borda subespecificado
- **LOW**: Melhorias de estilo/formulação, redundância menor que não afeta a ordem de execução

### 6. Produzir Relatório de Análise Compacto

Gere um relatório Markdown (sem escrita de arquivo) com a seguinte estrutura:

## Relatório de Análise da Especificação

| ID | Categoria | Severidade | Local(is) | Resumo | Recomendação |
|----|-----------|------------|-----------|--------|--------------|
| A1 | Duplicata | HIGH | spec.md:L120-134 | Dois requisitos similares... | Consolidar formulação; manter a versão mais clara |

(Adicione uma linha por descoberta; gere IDs estáveis prefixados pela inicial da categoria.)

**Tabela de Resumo de Cobertura:**

| Chave do Requisito | Tem Tarefa? | IDs das Tarefas | Notas |
|--------------------|-------------|-----------------|-------|

**Problemas de Alinhamento com a Constituição:** (se houver)

**Tarefas Não Mapeadas:** (se houver)

**Métricas:**

- Total de Requisitos
- Total de Tarefas
- % de Cobertura (requisitos com ≥1 tarefa)
- Contagem de Ambiguidades
- Contagem de Duplicatas
- Contagem de Problemas Críticos

### 7. Fornecer Próximas Ações

Ao final do relatório, gere um bloco conciso de Próximas Ações:

- Se houver problemas CRITICAL: recomende resolver antes do `/speckit.implement`
- Se houver apenas LOW/MEDIUM: o usuário pode prosseguir, mas forneça sugestões de melhoria
- Forneça sugestões explícitas de comandos: ex. "Execute /speckit.specify com refinamento", "Execute /speckit.plan para ajustar a arquitetura", "Edite manualmente o tasks.md para adicionar cobertura de 'performance-metrics'"

### 8. Oferecer Remediação

Pergunte ao usuário: "Gostaria que eu sugerisse edições concretas de remediação para os N principais problemas?" (NÃO as aplique automaticamente.)

## Princípios de Operação

### Eficiência de Contexto

- **Tokens mínimos de alto sinal**: Foque em descobertas acionáveis, não em documentação exaustiva
- **Divulgação progressiva**: Carregue artefatos incrementalmente; não despeje todo o conteúdo na análise
- **Saída eficiente em tokens**: Limite a tabela de descobertas a 50 linhas; resuma o overflow
- **Resultados determinísticos**: Reexecutar sem alterações deve produzir IDs e contagens consistentes

### Diretrizes de Análise

- **NUNCA modifique arquivos** (esta é uma análise somente leitura)
- **NUNCA invente seções ausentes** (se ausente, relate com precisão)
- **Priorize violações da constituição** (estas são sempre CRITICAL)
- **Use exemplos em vez de regras exaustivas** (cite instâncias específicas, não padrões genéricos)
- **Relate zero problemas com elegância** (emita relatório de sucesso com estatísticas de cobertura)

## Contexto

$ARGUMENTS
