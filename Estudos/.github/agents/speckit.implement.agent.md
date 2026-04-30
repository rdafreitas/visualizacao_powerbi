---
description: Executa o plano de implementação processando e executando todas as tarefas definidas no tasks.md
---

## Entrada do Usuário

```text
$ARGUMENTS
```

Você **DEVE** considerar a entrada do usuário antes de prosseguir (se não estiver vazia).

## Verificações Pré-Execução

**Verificar hooks de extensão (antes da implementação)**:
- Verifique se `.specify/extensions.yml` existe na raiz do projeto.
- Se existir, leia-o e procure entradas sob a chave `hooks.before_implement`
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

1. Execute `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` a partir da raiz do repositório e analise FEATURE_DIR e a lista AVAILABLE_DOCS. Todos os caminhos devem ser absolutos. Para aspas simples em argumentos como "I'm Groot", use sintaxe de escape: ex. 'I'\''m Groot' (ou aspas duplas se possível: "I'm Groot").

2. **Verificar status das checklists** (se FEATURE_DIR/checklists/ existir):
   - Verifique todos os arquivos de checklist no diretório checklists/
   - Para cada checklist, conte:
     - Total de itens: Todas as linhas correspondendo a `- [ ]` ou `- [X]` ou `- [x]`
     - Itens concluídos: Linhas correspondendo a `- [X]` ou `- [x]`
     - Itens incompletos: Linhas correspondendo a `- [ ]`
   - Crie uma tabela de status:

     ```text
     | Checklist    | Total | Concluídos | Incompletos | Status  |
     |--------------|-------|------------|-------------|---------|
     | ux.md        | 12    | 12         | 0           | ✓ PASS  |
     | teste.md     | 8     | 5          | 3           | ✗ FAIL  |
     | seguranca.md | 6     | 6          | 0           | ✓ PASS  |
     ```

   - Calcule o status geral:
     - **PASS**: Todas as checklists têm 0 itens incompletos
     - **FAIL**: Uma ou mais checklists têm itens incompletos

   - **Se alguma checklist estiver incompleta**:
     - Exiba a tabela com a contagem de itens incompletos
     - **PARE** e pergunte: "Algumas checklists estão incompletas. Deseja prosseguir com a implementação mesmo assim? (sim/não)"
     - Aguarde a resposta do usuário antes de continuar
     - Se o usuário disser "não" ou "aguardar" ou "parar", interrompa a execução
     - Se o usuário disser "sim" ou "prosseguir" ou "continuar", vá para o passo 3

   - **Se todas as checklists estiverem completas**:
     - Exiba a tabela mostrando todas as checklists aprovadas
     - Prossiga automaticamente para o passo 3

3. Carregue e analise o contexto de implementação:
   - **OBRIGATÓRIO**: Leia o tasks.md para a lista completa de tarefas e plano de execução
   - **OBRIGATÓRIO**: Leia o plan.md para stack tecnológica, arquitetura e estrutura de arquivos
   - **SE EXISTIR**: Leia o data-model.md para entidades e relacionamentos
   - **SE EXISTIR**: Leia os contracts/ para especificações de API e requisitos de teste
   - **SE EXISTIR**: Leia o research.md para decisões técnicas e restrições
   - **SE EXISTIR**: Leia o quickstart.md para cenários de integração

4. **Verificação de Configuração do Projeto**:
   - **OBRIGATÓRIO**: Crie/verifique arquivos de ignorar com base na configuração real do projeto:

   **Lógica de Detecção e Criação**:
   - Verifique se o seguinte comando é bem-sucedido para determinar se o repositório é um repo git (crie/verifique .gitignore se for):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

   - Verifique se Dockerfile* existe ou Docker está no plan.md → crie/verifique .dockerignore
   - Verifique se .eslintrc* existe → crie/verifique .eslintignore
   - Verifique se eslint.config.* existe → garanta que as entradas de `ignores` da config cubram os padrões necessários
   - Verifique se .prettierrc* existe → crie/verifique .prettierignore
   - Verifique se .npmrc ou package.json existe → crie/verifique .npmignore (se publicar)
   - Verifique se arquivos terraform (*.tf) existem → crie/verifique .terraformignore
   - Verifique se .helmignore é necessário (charts helm presentes) → crie/verifique .helmignore

   **Se o arquivo de ignorar já existir**: Verifique se contém padrões essenciais, adicione apenas os padrões críticos ausentes
   **Se o arquivo de ignorar estiver ausente**: Crie com conjunto completo de padrões para a tecnologia detectada

   **Padrões Comuns por Tecnologia** (do stack tecnológica do plan.md):
   - **Node.js/JavaScript/TypeScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
   - **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
   - **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
   - **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
   - **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
   - **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
   - **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
   - **Rust**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
   - **Kotlin**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
   - **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
   - **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `*.dll`, `autom4te.cache/`, `config.status`, `config.log`, `.idea/`, `*.log`, `.env*`
   - **Swift**: `.build/`, `DerivedData/`, `*.swiftpm/`, `Packages/`
   - **R**: `.Rproj.user/`, `.Rhistory`, `.RData`, `.Ruserdata`, `*.Rproj`, `packrat/`, `renv/`
   - **Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

   **Padrões por Ferramenta**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`
   - **Kubernetes/k8s**: `*.secret.yaml`, `secrets/`, `.kube/`, `kubeconfig*`, `*.key`, `*.crt`

5. Analise a estrutura do tasks.md e extraia:
   - **Fases de tarefas**: Setup, Testes, Core, Integração, Polimento
   - **Dependências de tarefas**: Regras de execução sequencial vs. paralela
   - **Detalhes de tarefas**: ID, descrição, caminhos de arquivo, marcadores de paralelismo [P]
   - **Fluxo de execução**: Ordem e requisitos de dependência

6. Execute a implementação seguindo o plano de tarefas:
   - **Execução fase a fase**: Conclua cada fase antes de passar para a próxima
   - **Respeite dependências**: Execute tarefas sequenciais em ordem, tarefas paralelas [P] podem rodar juntas  
   - **Siga a abordagem TDD**: Execute tarefas de teste antes das tarefas de implementação correspondentes
   - **Coordenação baseada em arquivo**: Tarefas que afetam os mesmos arquivos devem rodar sequencialmente
   - **Checkpoints de validação**: Verifique a conclusão de cada fase antes de prosseguir

7. Regras de execução da implementação:
   - **Setup primeiro**: Inicialize a estrutura do projeto, dependências, configuração
   - **Testes antes do código**: Se precisar escrever testes para contratos, entidades e cenários de integração
   - **Desenvolvimento central**: Implemente modelos, serviços, comandos CLI, endpoints
   - **Trabalho de integração**: Conexões de banco de dados, middleware, logging, serviços externos
   - **Polimento e validação**: Testes unitários, otimização de performance, documentação

8. Rastreamento de progresso e tratamento de erros:
   - Relate o progresso após cada tarefa concluída
   - Interrompa a execução se qualquer tarefa não paralela falhar
   - Para tarefas paralelas [P], continue com as tarefas bem-sucedidas, relate as que falharam
   - Forneça mensagens de erro claras com contexto para depuração
   - Sugira próximos passos se a implementação não puder prosseguir
   - **IMPORTANTE**: Para tarefas concluídas, certifique-se de marcar a tarefa como [X] no arquivo de tarefas.

9. Validação de conclusão:
   - Verifique se todas as tarefas obrigatórias estão concluídas
   - Verifique se as features implementadas correspondem à especificação original
   - Valide se os testes passam e a cobertura atende aos requisitos
   - Confirme se a implementação segue o plano técnico
   - Relate o status final com resumo do trabalho concluído

Nota: Este comando pressupõe que existe um detalhamento completo de tarefas no tasks.md. Se as tarefas estiverem incompletas ou ausentes, sugira executar o `/speckit.tasks` primeiro para regenerar a lista de tarefas.

10. **Verificar hooks de extensão**: Após a validação de conclusão, verifique se `.specify/extensions.yml` existe na raiz do projeto.
    - Se existir, leia-o e procure entradas sob a chave `hooks.after_implement`
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
