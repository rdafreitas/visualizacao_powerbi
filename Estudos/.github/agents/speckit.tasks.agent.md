---
description: Gera um tasks.md ordenado por dependências e acionável para a feature, com base nos artefatos de design disponíveis.
handoffs: 
  - label: Analisar Consistência
    agent: speckit.analyze
    prompt: Execute uma análise de consistência do projeto
    send: true
  - label: Implementar Projeto
    agent: speckit.implement
    prompt: Inicie a implementação em fases
    send: true
---

## Entrada do Usuário

```text
$ARGUMENTS
```

Você **DEVE** considerar a entrada do usuário antes de prosseguir (se não estiver vazia).

## Verificações Pré-Execução

**Verificar hooks de extensão (antes da geração de tarefas)**:
- Verifique se `.specify/extensions.yml` existe na raiz do projeto.
- Se existir, leia-o e procure entradas sob a chave `hooks.before_tasks`
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

1. **Setup**: Execute `.specify/scripts/bash/check-prerequisites.sh --json` a partir da raiz do repositório e analise FEATURE_DIR e a lista AVAILABLE_DOCS. Todos os caminhos devem ser absolutos. Para aspas simples em argumentos como "I'm Groot", use sintaxe de escape: ex. 'I'\''m Groot' (ou aspas duplas se possível: "I'm Groot").

2. **Carregar documentos de design**: Leia do FEATURE_DIR:
   - **Obrigatório**: plan.md (stack tecnológica, bibliotecas, estrutura), spec.md (histórias de usuário com prioridades)
   - **Opcional**: data-model.md (entidades), contracts/ (contratos de interface), research.md (decisões), quickstart.md (cenários de teste)
   - Nota: Nem todos os projetos têm todos os documentos. Gere tarefas com base no que estiver disponível.

3. **Executar fluxo de geração de tarefas**:
   - Carregue o plan.md e extraia o stack tecnológica, bibliotecas, estrutura do projeto
   - Carregue o spec.md e extraia histórias de usuário com suas prioridades (P1, P2, P3, etc.)
   - Se data-model.md existir: Extraia entidades e mapeie para histórias de usuário
   - Se contracts/ existir: Mapeie contratos de interface para histórias de usuário
   - Se research.md existir: Extraia decisões para tarefas de setup
   - Gere tarefas organizadas por história de usuário (veja as Regras de Geração de Tarefas abaixo)
   - Gere o grafo de dependências mostrando a ordem de conclusão das histórias de usuário
   - Crie exemplos de execução paralela por história de usuário
   - Valide a completude das tarefas (cada história de usuário tem todas as tarefas necessárias, testável de forma independente)

4. **Gerar tasks.md**: Use `.specify/templates/tasks-template.md` como estrutura, preencha com:
   - Nome correto da feature do plan.md
   - Fase 1: Tarefas de setup (inicialização do projeto)
   - Fase 2: Tarefas de fundação (pré-requisitos bloqueantes para todas as histórias de usuário)
   - Fase 3+: Uma fase por história de usuário (em ordem de prioridade do spec.md)
   - Cada fase inclui: objetivo da história, critérios de teste independente, testes (se solicitado), tarefas de implementação
   - Fase Final: Polimento e aspectos transversais
   - Todas as tarefas devem seguir o formato estrito de checklist (veja as Regras de Geração de Tarefas abaixo)
   - Caminhos de arquivo claros para cada tarefa
   - Seção de dependências mostrando a ordem de conclusão das histórias
   - Exemplos de execução paralela por história
   - Seção de estratégia de implementação (MVP primeiro, entrega incremental)

5. **Relatório**: Gere o caminho para o tasks.md gerado e o resumo:
   - Contagem total de tarefas
   - Contagem de tarefas por história de usuário
   - Oportunidades de paralelismo identificadas
   - Critérios de teste independente para cada história
   - Escopo sugerido para o MVP (tipicamente apenas a História de Usuário 1)
   - Validação de formato: Confirme que TODAS as tarefas seguem o formato de checklist (checkbox, ID, rótulos, caminhos de arquivo)

6. **Verificar hooks de extensão**: Após o tasks.md ser gerado, verifique se `.specify/extensions.yml` existe na raiz do projeto.
   - Se existir, leia-o e procure entradas sob a chave `hooks.after_tasks`
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

Contexto para geração de tarefas: $ARGUMENTS

O tasks.md deve ser imediatamente executável — cada tarefa deve ser específica o suficiente para que um LLM possa concluí-la sem contexto adicional.

## Regras de Geração de Tarefas

**CRÍTICO**: As tarefas DEVEM ser organizadas por história de usuário para permitir implementação e teste independentes.

**Testes são OPCIONAIS**: Gere tarefas de teste apenas se explicitamente solicitado na especificação da feature ou se o usuário solicitar a abordagem TDD.

### Formato de Checklist (OBRIGATÓRIO)

Cada tarefa DEVE seguir estritamente este formato:

```text
- [ ] [TaskID] [P?] [História?] Descrição com caminho de arquivo
```

**Componentes do Formato**:

1. **Checkbox**: SEMPRE comece com `- [ ]` (checkbox markdown)
2. **ID da Tarefa**: Número sequencial (T001, T002, T003...) na ordem de execução
3. **Marcador [P]**: Inclua SOMENTE se a tarefa for paralelizável (arquivos diferentes, sem dependências de tarefas incompletas)
4. **Rótulo [História]**: OBRIGATÓRIO para tarefas de fase de história de usuário apenas
   - Formato: [US1], [US2], [US3], etc. (mapeia para histórias de usuário do spec.md)
   - Fase de Setup: SEM rótulo de história
   - Fase de Fundação: SEM rótulo de história
   - Fases de Histórias de Usuário: DEVE ter rótulo de história
   - Fase de Polimento: SEM rótulo de história
5. **Descrição**: Ação clara com caminho exato do arquivo

**Exemplos**:

- ✅ CORRETO: `- [ ] T001 Criar estrutura de projeto conforme o plano de implementação`
- ✅ CORRETO: `- [ ] T005 [P] Implementar middleware de autenticação em src/middleware/auth.py`
- ✅ CORRETO: `- [ ] T012 [P] [US1] Criar modelo User em src/models/user.py`
- ✅ CORRETO: `- [ ] T014 [US1] Implementar UserService em src/services/user_service.py`
- ❌ ERRADO: `- [ ] Criar modelo User` (falta ID e rótulo de história)
- ❌ ERRADO: `T001 [US1] Criar modelo` (falta checkbox)
- ❌ ERRADO: `- [ ] [US1] Criar modelo User` (falta ID da tarefa)
- ❌ ERRADO: `- [ ] T001 [US1] Criar modelo` (falta caminho do arquivo)

### Organização das Tarefas

1. **Das Histórias de Usuário (spec.md)** — ORGANIZAÇÃO PRIMÁRIA:
   - Cada história de usuário (P1, P2, P3...) recebe sua própria fase
   - Mapeie todos os componentes relacionados à sua história:
     - Modelos necessários para aquela história
     - Serviços necessários para aquela história
     - Interfaces/UI necessárias para aquela história
     - Se testes solicitados: Testes específicos para aquela história
   - Marque dependências de história (a maioria das histórias deve ser independente)

2. **Dos Contratos**:
   - Mapeie cada contrato de interface → para a história de usuário que ele serve
   - Se testes solicitados: Cada contrato de interface → tarefa de teste de contrato [P] antes da implementação na fase daquela história

3. **Do Modelo de Dados**:
   - Mapeie cada entidade para a(s) história(s) de usuário que precisam dela
   - Se a entidade serve múltiplas histórias: Coloque na história mais antiga ou fase de Setup
   - Relacionamentos → tarefas da camada de serviço na fase de história apropriada

4. **Do Setup/Infraestrutura**:
   - Infraestrutura compartilhada → Fase de Setup (Fase 1)
   - Tarefas de fundação/bloqueantes → Fase de Fundação (Fase 2)
   - Setup específico da história → dentro da fase daquela história

### Estrutura de Fases

- **Fase 1**: Setup (inicialização do projeto)
- **Fase 2**: Fundação (pré-requisitos bloqueantes — DEVE ser concluída antes das histórias de usuário)
- **Fase 3+**: Histórias de Usuário em ordem de prioridade (P1, P2, P3...)
  - Dentro de cada história: Testes (se solicitado) → Modelos → Serviços → Endpoints → Integração
  - Cada fase deve ser um incremento completo e testável de forma independente
- **Fase Final**: Polimento e Aspectos Transversais
