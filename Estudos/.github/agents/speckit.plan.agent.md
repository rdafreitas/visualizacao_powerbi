---
description: Executa o fluxo de planejamento de implementação usando o template de plano para gerar artefatos de design.
handoffs: 
  - label: Criar Tarefas
    agent: speckit.tasks
    prompt: Detalhe o plano em tarefas
    send: true
  - label: Criar Checklist
    agent: speckit.checklist
    prompt: Crie uma checklist para o seguinte domínio...
---

## Entrada do Usuário

```text
$ARGUMENTS
```

Você **DEVE** considerar a entrada do usuário antes de prosseguir (se não estiver vazia).

## Verificações Pré-Execução

**Verificar hooks de extensão (antes do planejamento)**:
- Verifique se `.specify/extensions.yml` existe na raiz do projeto.
- Se existir, leia-o e procure entradas sob a chave `hooks.before_plan`
- Se o YAML não puder ser analisado ou for inválido, ignore silenciosamente a verificação de hooks e continue normalmente
- Filtre hooks onde `enabled` é explicitamente `false`. Trate hooks sem campo `enabled` como habilitados por padrão.
- Para cada hook restante, **não** tente interpretar ou avaliar expressões `condition` do hook:
  - Se o hook não tiver campo `condition`, ou ele for nulo/vazio, trate o hook como executável
  - Se o hook definir uma `condition` não vazia, ignore o hook e deixe a avaliação da condição para a implementação do HookExecutor
- Para cada hook executável, gere o seguinte com base em seu flag `optional`:
  - **Hook opcional** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Hook obrigatório** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}

    Wait for the result of the hook command before proceeding to the Outline.
    ```
- Se nenhum hook estiver registrado ou `.specify/extensions.yml` não existir, ignore silenciosamente

## Descrição Geral

1. **Setup**: Execute `.specify/scripts/bash/setup-plan.sh --json` a partir da raiz do repositório e analise o JSON para FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. Para aspas simples em argumentos como "I'm Groot", use sintaxe de escape: ex. 'I'\''m Groot' (ou aspas duplas se possível: "I'm Groot").

2. **Carregar contexto**: Leia FEATURE_SPEC e `.specify/memory/constitution.md`. Carregue o template IMPL_PLAN (já copiado).

3. **Executar fluxo de planejamento**: Siga a estrutura no template IMPL_PLAN para:
   - Preencher o Contexto Técnico (marque desconhecidos como "NECESSITA ESCLARECIMENTO")
   - Preencher a seção de Verificação da Constituição a partir da constituição
   - Avaliar os gates (ERRO se violações não forem justificadas)
   - Fase 0: Gerar research.md (resolver todos os NECESSITA ESCLARECIMENTO)
   - Fase 1: Gerar data-model.md, contracts/, quickstart.md
   - Fase 1: Atualizar o contexto do agente executando o script do agente
   - Reavaliar a Verificação da Constituição após o design

4. **Parar e relatar**: O comando termina após o planejamento da Fase 2. Relate a branch, o caminho do IMPL_PLAN e os artefatos gerados.

5. **Verificar hooks de extensão**: Após o relatório, verifique se `.specify/extensions.yml` existe na raiz do projeto.
   - Se existir, leia-o e procure entradas sob a chave `hooks.after_plan`
   - Se o YAML não puder ser analisado ou for inválido, ignore silenciosamente a verificação de hooks e continue normalmente
   - Filtre hooks onde `enabled` é explicitamente `false`. Trate hooks sem campo `enabled` como habilitados por padrão.
   - Para cada hook restante, **não** tente interpretar ou avaliar expressões `condition` do hook:
     - Se o hook não tiver campo `condition`, ou ele for nulo/vazio, trate o hook como executável
     - Se o hook definir uma `condition` não vazia, ignore o hook e deixe a avaliação da condição para a implementação do HookExecutor
   - Para cada hook executável, gere o seguinte com base em seu flag `optional`:
     - **Hook opcional** (`optional: true`):
       ```
       ## Extension Hooks

       **Optional Hook**: {extension}
       Command: `/{command}`
       Description: {description}

       Prompt: {prompt}
       To execute: `/{command}`
       ```
     - **Hook obrigatório** (`optional: false`):
       ```
       ## Extension Hooks

       **Automatic Hook**: {extension}
       Executing: `/{command}`
       EXECUTE_COMMAND: {command}
       ```
   - Se nenhum hook estiver registrado ou `.specify/extensions.yml` não existir, ignore silenciosamente

## Fases

### Fase 0: Esboço e Pesquisa

1. **Extrair desconhecidos do Contexto Técnico** acima:
   - Para cada NECESSITA ESCLARECIMENTO → tarefa de pesquisa
   - Para cada dependência → tarefa de melhores práticas
   - Para cada integração → tarefa de padrões

2. **Gerar e despachar agentes de pesquisa**:

   ```text
   Para cada desconhecido no Contexto Técnico:
     Task: "Pesquisar {desconhecido} para {contexto da feature}"
   Para cada escolha de tecnologia:
     Task: "Encontrar melhores práticas para {tech} em {domínio}"
   ```

3. **Consolidar descobertas** em `research.md` usando o formato:
   - Decisão: [o que foi escolhido]
   - Justificativa: [por que foi escolhido]
   - Alternativas consideradas: [o que mais foi avaliado]

**Saída**: research.md com todos os NECESSITA ESCLARECIMENTO resolvidos

### Fase 1: Design e Contratos

**Pré-requisitos:** `research.md` completo

1. **Extrair entidades da spec da feature** → `data-model.md`:
   - Nome da entidade, campos, relacionamentos
   - Regras de validação dos requisitos
   - Transições de estado, se aplicável

2. **Definir contratos de interface** (se o projeto tiver interfaces externas) → `/contracts/`:
   - Identifique quais interfaces o projeto expõe para usuários ou outros sistemas
   - Documente o formato de contrato apropriado para o tipo de projeto
   - Exemplos: APIs públicas para bibliotecas, schemas de comandos para ferramentas CLI, endpoints para serviços web, gramáticas para parsers, contratos de UI para aplicativos
   - Ignore se o projeto for puramente interno (scripts de build, ferramentas pontuais, etc.)

3. **Atualização do contexto do agente**:
   - Execute `.specify/scripts/bash/update-agent-context.sh copilot`
   - Estes scripts detectam qual agente de IA está em uso
   - Atualize o arquivo de contexto específico do agente apropriado
   - Adicione apenas a nova tecnologia do plano atual
   - Preserve adições manuais entre os marcadores

**Saída**: data-model.md, /contracts/*, quickstart.md, arquivo específico do agente

## Regras Principais

- Use caminhos absolutos
- ERRO em falhas de gate ou esclarecimentos não resolvidos
