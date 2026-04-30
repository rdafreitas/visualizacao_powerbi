---
description: Cria ou atualiza a especificação de feature a partir de uma descrição de feature em linguagem natural.
handoffs: 
  - label: Criar Plano Técnico
    agent: speckit.plan
    prompt: Crie um plano para a spec. Estou construindo com...
  - label: Esclarecer Requisitos da Spec
    agent: speckit.clarify
    prompt: Esclarecer requisitos da especificação
    send: true
---

## Entrada do Usuário

```text
$ARGUMENTS
```

Você **DEVE** considerar a entrada do usuário antes de prosseguir (se não estiver vazia).

## Verificações Pré-Execução

**Verificar hooks de extensão (antes da especificação)**:
- Verifique se `.specify/extensions.yml` existe na raiz do projeto.
- Se existir, leia-o e procure entradas sob a chave `hooks.before_specify`
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

O texto que o usuário digitou após `/speckit.specify` na mensagem de acionamento **é** a descrição da feature. Assuma que você sempre a tem disponível nesta conversa mesmo que `$ARGUMENTS` apareça literalmente abaixo. Não peça ao usuário para repeti-la a menos que ele tenha fornecido um comando vazio.

Dado essa descrição de feature, faça o seguinte:

1. **Gere um nome curto e conciso** (2-4 palavras) para a branch:
   - Analise a descrição da feature e extraia as palavras-chave mais significativas
   - Crie um nome de 2-4 palavras que capture a essência da feature
   - Use o formato ação-substantivo quando possível (ex.: "add-user-auth", "fix-payment-bug")
   - Preserve termos técnicos e acrônimos (OAuth2, API, JWT, etc.)
   - Mantenha conciso, mas descritivo o suficiente para entender a feature rapidamente
   - Exemplos:
     - "Quero adicionar autenticação de usuário" → "user-auth"
     - "Implementar integração OAuth2 para a API" → "oauth2-api-integration"
     - "Criar um dashboard para analytics" → "analytics-dashboard"
     - "Corrigir bug de timeout no processamento de pagamento" → "fix-payment-timeout"

2. **Crie a branch da feature** executando o script com `--short-name` (e `--json`). No modo sequencial, NÃO passe `--number` — o script detecta automaticamente o próximo número disponível. No modo timestamp, o script gera um prefixo `AAAAMMDD-HHMMSS` automaticamente:

   **Modo de numeração de branch**: Antes de executar o script, verifique se `.specify/init-options.json` existe e leia o valor de `branch_numbering`.
   - Se `"timestamp"`, adicione `--timestamp` (Bash) ou `-Timestamp` (PowerShell) à invocação do script
   - Se `"sequential"` ou ausente, não adicione nenhuma flag extra (comportamento padrão)

   - Exemplo Bash: `.specify/scripts/bash/create-new-feature.sh "$ARGUMENTS" --json --short-name "user-auth" "Adicionar autenticação de usuário"`
   - Bash (timestamp): `.specify/scripts/bash/create-new-feature.sh "$ARGUMENTS" --json --timestamp --short-name "user-auth" "Adicionar autenticação de usuário"`
   - Exemplo PowerShell: `.specify/scripts/bash/create-new-feature.sh "$ARGUMENTS" -Json -ShortName "user-auth" "Adicionar autenticação de usuário"`
   - PowerShell (timestamp): `.specify/scripts/bash/create-new-feature.sh "$ARGUMENTS" -Json -Timestamp -ShortName "user-auth" "Adicionar autenticação de usuário"`

   **IMPORTANTE**:
   - NÃO passe `--number` — o script determina o próximo número correto automaticamente
   - Sempre inclua a flag JSON (`--json` para Bash, `-Json` para PowerShell) para que a saída possa ser analisada de forma confiável
   - Você deve executar este script apenas uma vez por feature
   - O JSON é fornecido no terminal como saída — sempre consulte-o para obter o conteúdo real que está procurando
   - A saída JSON conterá os caminhos BRANCH_NAME e SPEC_FILE
   - Para aspas simples em argumentos como "I'm Groot", use sintaxe de escape: ex. 'I'\''m Groot' (ou aspas duplas se possível: "I'm Groot")

3. Carregue `.specify/templates/spec-template.md` para entender as seções obrigatórias.

4. Siga este fluxo de execução:

    1. Analise a descrição do usuário da Entrada
       Se vazia: ERRO "Nenhuma descrição de feature fornecida"
    2. Extraia conceitos-chave da descrição
       Identifique: atores, ações, dados, restrições
    3. Para aspectos pouco claros:
       - Faça suposições informadas com base no contexto e nos padrões do setor
       - Marque com [NECESSITA ESCLARECIMENTO: pergunta específica] apenas se:
         - A escolha impactar significativamente o escopo da feature ou a experiência do usuário
         - Múltiplas interpretações razoáveis existirem com implicações diferentes
         - Nenhum padrão razoável existir
       - **LIMITE: Máximo de 3 marcadores [NECESSITA ESCLARECIMENTO] no total**
       - Priorize esclarecimentos por impacto: escopo > segurança/privacidade > experiência do usuário > detalhes técnicos
    4. Preencher a seção de Cenários de Usuário e Testes
       Se nenhum fluxo de usuário for claro: ERRO "Não é possível determinar os cenários de usuário"
    5. Gerar Requisitos Funcionais
       Cada requisito deve ser testável
       Use padrões razoáveis para detalhes não especificados (documente premissas na seção Premissas)
    6. Definir Critérios de Sucesso
       Crie resultados mensuráveis e independentes de tecnologia
       Inclua métricas quantitativas (tempo, performance, volume) e medidas qualitativas (satisfação do usuário, conclusão de tarefas)
       Cada critério deve ser verificável sem detalhes de implementação
    7. Identificar Entidades-Chave (se houver dados envolvidos)
    8. Retornar: SUCESSO (spec pronta para planejamento)

5. Escreva a especificação no SPEC_FILE usando a estrutura do template, substituindo os espaços reservados por detalhes concretos derivados da descrição da feature (argumentos), preservando a ordem das seções e os cabeçalhos.

6. **Validação da Qualidade da Especificação**: Após escrever a spec inicial, valide-a com os critérios de qualidade:

   a. **Criar Checklist de Qualidade da Spec**: Gere um arquivo de checklist em `FEATURE_DIR/checklists/requirements.md` usando a estrutura do template de checklist com estes itens de validação:

      ```markdown
      # Checklist de Qualidade da Especificação: [NOME DA FEATURE]
      
      **Objetivo**: Validar a completude e qualidade da especificação antes de prosseguir para o planejamento
      **Criado em**: [DATA]
      **Feature**: [Link para spec.md]
      
      ## Qualidade do Conteúdo
      
      - [ ] Sem detalhes de implementação (linguagens, frameworks, APIs)
      - [ ] Focado no valor para o usuário e nas necessidades do negócio
      - [ ] Escrito para partes interessadas não técnicas
      - [ ] Todas as seções obrigatórias concluídas
      
      ## Completude dos Requisitos
      
      - [ ] Sem marcadores [NECESSITA ESCLARECIMENTO] remanescentes
      - [ ] Os requisitos são testáveis e inequívocos
      - [ ] Os critérios de sucesso são mensuráveis
      - [ ] Os critérios de sucesso são independentes de tecnologia (sem detalhes de implementação)
      - [ ] Todos os cenários de aceitação estão definidos
      - [ ] Os casos de borda estão identificados
      - [ ] O escopo está claramente delimitado
      - [ ] Dependências e premissas identificadas
      
      ## Prontidão da Feature
      
      - [ ] Todos os requisitos funcionais têm critérios de aceitação claros
      - [ ] Os cenários de usuário cobrem os fluxos principais
      - [ ] A feature atende aos resultados mensuráveis definidos nos Critérios de Sucesso
      - [ ] Nenhum detalhe de implementação vaza para a especificação
      
      ## Notas
      
      - Itens marcados como incompletos requerem atualizações na spec antes do `/speckit.clarify` ou `/speckit.plan`
      ```

   b. **Executar Verificação de Validação**: Revise a spec em relação a cada item da checklist:
      - Para cada item, determine se passa ou falha
      - Documente os problemas específicos encontrados (cite seções relevantes da spec)

   c. **Tratar Resultados da Validação**:

      - **Se todos os itens passarem**: Marque a checklist como completa e prossiga para o passo 7

      - **Se itens falharem (excluindo [NECESSITA ESCLARECIMENTO])**:
        1. Liste os itens com falha e os problemas específicos
        2. Atualize a spec para resolver cada problema
        3. Execute novamente a validação até que todos os itens passem (máx. 3 iterações)
        4. Se ainda falhar após 3 iterações, documente os problemas remanescentes nas notas da checklist e avise o usuário

      - **Se marcadores [NECESSITA ESCLARECIMENTO] permanecerem**:
        1. Extraia todos os marcadores [NECESSITA ESCLARECIMENTO: ...] da spec
        2. **VERIFICAÇÃO DE LIMITE**: Se mais de 3 marcadores existirem, mantenha apenas os 3 mais críticos (por impacto de escopo/segurança/UX) e faça suposições informadas para o restante
        3. Para cada esclarecimento necessário (máx. 3), apresente opções ao usuário neste formato:

           ```markdown
           ## Pergunta [N]: [Tópico]
           
           **Contexto**: [Cite a seção relevante da spec]
           
           **O que precisamos saber**: [Pergunta específica do marcador NECESSITA ESCLARECIMENTO]
           
           **Respostas Sugeridas**:
           
           | Opção | Resposta | Implicações |
           |-------|---------|-------------|
           | A     | [Primeira resposta sugerida] | [O que isso significa para a feature] |
           | B     | [Segunda resposta sugerida] | [O que isso significa para a feature] |
           | C     | [Terceira resposta sugerida] | [O que isso significa para a feature] |
           | Outra | Forneça sua própria resposta | [Explique como fornecer entrada personalizada] |
           
           **Sua escolha**: _[Aguardar resposta do usuário]_
           ```

        4. **CRÍTICO — Formatação de Tabelas**: Garanta que as tabelas markdown estejam formatadas corretamente:
           - Use espaçamento consistente com pipes alinhados
           - Cada célula deve ter espaços ao redor do conteúdo: `| Conteúdo |` não `|Conteúdo|`
           - O separador do cabeçalho deve ter pelo menos 3 traços: `|---------|`
           - Verifique se a tabela é renderizada corretamente na visualização markdown
        5. Numere as perguntas sequencialmente (P1, P2, P3 — máx. 3 no total)
        6. Apresente todas as perguntas juntas antes de aguardar as respostas
        7. Aguarde o usuário responder com suas escolhas para todas as perguntas (ex.: "P1: A, P2: Outra - [detalhes], P3: B")
        8. Atualize a spec substituindo cada marcador [NECESSITA ESCLARECIMENTO] pela resposta selecionada ou fornecida pelo usuário
        9. Execute novamente a validação após todos os esclarecimentos serem resolvidos

   d. **Atualizar Checklist**: Após cada iteração de validação, atualize o arquivo de checklist com o status atual de aprovação/reprovação

7. Relate a conclusão com o nome da branch, o caminho do arquivo de spec, os resultados da checklist e a prontidão para a próxima fase (`/speckit.clarify` ou `/speckit.plan`).

8. **Verificar hooks de extensão**: Após relatar a conclusão, verifique se `.specify/extensions.yml` existe na raiz do projeto.
   - Se existir, leia-o e procure entradas sob a chave `hooks.after_specify`
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

**NOTA:** O script cria e faz checkout da nova branch e inicializa o arquivo de spec antes de escrever.

## Diretrizes Rápidas

- Foque no **O QUÊ** os usuários precisam e no **POR QUÊ**.
- Evite o COMO implementar (sem stack tecnológica, APIs, estrutura de código).
- Escrito para partes interessadas do negócio, não para desenvolvedores.
- NÃO crie checklists embutidas na spec. Isso será um comando separado.

### Requisitos das Seções

- **Seções obrigatórias**: Devem ser concluídas para cada feature
- **Seções opcionais**: Inclua apenas quando relevante para a feature
- Quando uma seção não se aplicar, remova-a completamente (não deixe como "N/A")

### Para Geração por IA

Ao criar esta spec a partir de um prompt do usuário:

1. **Faça suposições informadas**: Use contexto, padrões do setor e padrões comuns para preencher lacunas
2. **Documente premissas**: Registre padrões razoáveis na seção Premissas
3. **Limite esclarecimentos**: Máximo de 3 marcadores [NECESSITA ESCLARECIMENTO] — use apenas para decisões críticas que:
   - Impactem significativamente o escopo da feature ou a experiência do usuário
   - Tenham múltiplas interpretações razoáveis com implicações diferentes
   - Não tenham nenhum padrão razoável
4. **Priorize esclarecimentos**: escopo > segurança/privacidade > experiência do usuário > detalhes técnicos
5. **Pense como um testador**: Todo requisito vago deve reprovar o item de checklist "testável e inequívoco"
6. **Áreas comuns que precisam de esclarecimento** (apenas se nenhum padrão razoável existir):
   - Escopo e limites da feature (incluir/excluir casos de uso específicos)
   - Tipos de usuário e permissões (se múltiplas interpretações conflitantes forem possíveis)
   - Requisitos de segurança/conformidade (quando legalmente/financeiramente significativo)

**Exemplos de padrões razoáveis** (não pergunte sobre estes):

- Retenção de dados: Práticas padrão do setor para o domínio
- Metas de performance: Expectativas padrão de app web/mobile, a menos que especificado
- Tratamento de erros: Mensagens amigáveis ao usuário com fallbacks apropriados
- Método de autenticação: Sessão padrão ou OAuth2 para apps web
- Padrões de integração: Use padrões apropriados ao projeto (REST/GraphQL para serviços web, chamadas de função para bibliotecas, args CLI para ferramentas, etc.)

### Diretrizes para Critérios de Sucesso

Os critérios de sucesso devem ser:

1. **Mensuráveis**: Inclua métricas específicas (tempo, percentagem, contagem, taxa)
2. **Independentes de tecnologia**: Sem menção de frameworks, linguagens, bancos de dados ou ferramentas
3. **Focados no usuário**: Descreva resultados da perspectiva do usuário/negócio, não internos do sistema
4. **Verificáveis**: Podem ser testados/validados sem conhecer detalhes de implementação

**Bons exemplos**:

- "Usuários podem concluir o checkout em menos de 3 minutos"
- "O sistema suporta 10.000 usuários simultâneos"
- "95% das buscas retornam resultados em menos de 1 segundo"
- "A taxa de conclusão de tarefas melhora em 40%"

**Maus exemplos** (focados em implementação):

- "Tempo de resposta da API abaixo de 200ms" (muito técnico, use "Usuários veem resultados instantaneamente")
- "Banco de dados suporta 1000 TPS" (detalhe de implementação, use métrica focada no usuário)
- "Componentes React renderizam eficientemente" (específico de framework)
- "Taxa de cache hit do Redis acima de 80%" (específico de tecnologia)
