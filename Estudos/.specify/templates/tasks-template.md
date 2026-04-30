---

description: "Template de lista de tarefas para implementação de feature"
---

# Tarefas: [NOME DA FEATURE]

**Entrada**: Documentos de design em `/specs/[###-nome-da-feature]/`
**Pré-requisitos**: plan.md (obrigatório), spec.md (obrigatório para histórias de usuário), research.md, data-model.md, contracts/

**Testes**: Os exemplos abaixo incluem tarefas de teste. Testes são OPCIONAIS — inclua apenas se explicitamente solicitado na especificação da feature.

**Organização**: As tarefas são agrupadas por história de usuário para permitir implementação e teste independentes de cada história.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[História]**: A qual história de usuário esta tarefa pertence (ex.: US1, US2, US3)
- Inclua os caminhos exatos dos arquivos nas descrições

## Convenções de Caminhos

- **Projeto único**: `src/`, `tests/` na raiz do repositório
- **Aplicação web**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` ou `android/src/`
- Os caminhos abaixo assumem projeto único — ajuste conforme a estrutura do plan.md

<!-- 
  ============================================================================
  IMPORTANTE: As tarefas abaixo são TAREFAS DE EXEMPLO apenas para ilustração.
  
  O comando /speckit.tasks DEVE substituí-las por tarefas reais com base em:
  - Histórias de usuário do spec.md (com suas prioridades P1, P2, P3...)
  - Requisitos da feature do plan.md
  - Entidades do data-model.md
  - Endpoints dos contracts/
  
  As tarefas DEVEM ser organizadas por história de usuário para que cada
  história possa ser:
  - Implementada de forma independente
  - Testada de forma independente
  - Entregue como incremento MVP
  
  NÃO mantenha essas tarefas de exemplo no arquivo tasks.md gerado.
  ============================================================================
-->

## Fase 1: Setup (Infraestrutura Compartilhada)

**Objetivo**: Inicialização do projeto e estrutura básica

- [ ] T001 Criar estrutura de projeto conforme o plano de implementação
- [ ] T002 Inicializar projeto [linguagem] com dependências [framework]
- [ ] T003 [P] Configurar ferramentas de linting e formatação

---

## Fase 2: Fundação (Pré-requisitos Bloqueantes)

**Objetivo**: Infraestrutura central que DEVE estar completa antes que QUALQUER história de usuário possa ser implementada

**⚠️ CRÍTICO**: Nenhuma história de usuário pode começar até que esta fase esteja completa

Exemplos de tarefas de fundação (ajuste conforme o projeto):

- [ ] T004 Configurar schema e framework de migrações de banco de dados
- [ ] T005 [P] Implementar framework de autenticação/autorização
- [ ] T006 [P] Configurar roteamento e estrutura de middleware da API
- [ ] T007 Criar modelos/entidades base que todas as histórias dependem
- [ ] T008 Configurar infraestrutura de tratamento de erros e logging
- [ ] T009 Configurar gerenciamento de configurações de ambiente

**Checkpoint**: Fundação pronta — a implementação das histórias de usuário pode começar em paralelo

---

## Fase 3: História de Usuário 1 - [Título] (Prioridade: P1) 🎯 MVP

**Objetivo**: [Breve descrição do que esta história entrega]

**Teste Independente**: [Como verificar que esta história funciona sozinha]

### Testes para História de Usuário 1 (OPCIONAL — apenas se solicitado) ⚠️

> **NOTA: Escreva estes testes PRIMEIRO, garanta que FALHEM antes da implementação**

- [ ] T010 [P] [US1] Teste de contrato para [endpoint] em tests/contract/test_[nome].py
- [ ] T011 [P] [US1] Teste de integração para [jornada do usuário] em tests/integration/test_[nome].py

### Implementação da História de Usuário 1

- [ ] T012 [P] [US1] Criar modelo [Entidade1] em src/models/[entidade1].py
- [ ] T013 [P] [US1] Criar modelo [Entidade2] em src/models/[entidade2].py
- [ ] T014 [US1] Implementar [Serviço] em src/services/[servico].py (depende de T012, T013)
- [ ] T015 [US1] Implementar [endpoint/feature] em src/[local]/[arquivo].py
- [ ] T016 [US1] Adicionar validação e tratamento de erros
- [ ] T017 [US1] Adicionar logging para operações da história de usuário 1

**Checkpoint**: Neste ponto, a História de Usuário 1 deve estar totalmente funcional e testável de forma independente

---

## Fase 4: História de Usuário 2 - [Título] (Prioridade: P2)

**Objetivo**: [Breve descrição do que esta história entrega]

**Teste Independente**: [Como verificar que esta história funciona sozinha]

### Testes para História de Usuário 2 (OPCIONAL — apenas se solicitado) ⚠️

- [ ] T018 [P] [US2] Teste de contrato para [endpoint] em tests/contract/test_[nome].py
- [ ] T019 [P] [US2] Teste de integração para [jornada do usuário] em tests/integration/test_[nome].py

### Implementação da História de Usuário 2

- [ ] T020 [P] [US2] Criar modelo [Entidade] em src/models/[entidade].py
- [ ] T021 [US2] Implementar [Serviço] em src/services/[servico].py
- [ ] T022 [US2] Implementar [endpoint/feature] em src/[local]/[arquivo].py
- [ ] T023 [US2] Integrar com componentes da História de Usuário 1 (se necessário)

**Checkpoint**: Neste ponto, as Histórias de Usuário 1 E 2 devem funcionar de forma independente

---

## Fase 5: História de Usuário 3 - [Título] (Prioridade: P3)

**Objetivo**: [Breve descrição do que esta história entrega]

**Teste Independente**: [Como verificar que esta história funciona sozinha]

### Testes para História de Usuário 3 (OPCIONAL — apenas se solicitado) ⚠️

- [ ] T024 [P] [US3] Teste de contrato para [endpoint] em tests/contract/test_[nome].py
- [ ] T025 [P] [US3] Teste de integração para [jornada do usuário] em tests/integration/test_[nome].py

### Implementação da História de Usuário 3

- [ ] T026 [P] [US3] Criar modelo [Entidade] em src/models/[entidade].py
- [ ] T027 [US3] Implementar [Serviço] em src/services/[servico].py
- [ ] T028 [US3] Implementar [endpoint/feature] em src/[local]/[arquivo].py

**Checkpoint**: Todas as histórias de usuário devem agora funcionar de forma independente

---

[Adicione mais fases de histórias de usuário conforme necessário, seguindo o mesmo padrão]

---

## Fase N: Polimento e Aspectos Transversais

**Objetivo**: Melhorias que afetam múltiplas histórias de usuário

- [ ] TXXX [P] Atualização de documentação em docs/
- [ ] TXXX Limpeza e refatoração de código
- [ ] TXXX Otimização de performance em todas as histórias
- [ ] TXXX [P] Testes unitários adicionais (se solicitado) em tests/unit/
- [ ] TXXX Endurecimento de segurança
- [ ] TXXX Executar validação do quickstart.md

---

## Dependências e Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: Sem dependências — pode começar imediatamente
- **Fundação (Fase 2)**: Depende da conclusão do Setup — BLOQUEIA todas as histórias
- **Histórias de Usuário (Fase 3+)**: Todas dependem da conclusão da Fundação
  - As histórias podem prosseguir em paralelo (se houver equipe disponível)
  - Ou sequencialmente em ordem de prioridade (P1 → P2 → P3)
- **Polimento (Fase Final)**: Depende da conclusão de todas as histórias desejadas

### Dependências entre Histórias de Usuário

- **História de Usuário 1 (P1)**: Pode começar após a Fundação — sem dependências de outras histórias
- **História de Usuário 2 (P2)**: Pode começar após a Fundação — pode integrar com US1, mas deve ser testável de forma independente
- **História de Usuário 3 (P3)**: Pode começar após a Fundação — pode integrar com US1/US2, mas deve ser testável de forma independente

### Dentro de Cada História de Usuário

- Testes (se incluídos) DEVEM ser escritos e FALHAR antes da implementação
- Modelos antes de serviços
- Serviços antes de endpoints
- Implementação central antes da integração
- História completa antes de passar para a próxima prioridade

### Oportunidades de Paralelismo

- Todas as tarefas marcadas [P] no Setup podem rodar em paralelo
- Todas as tarefas marcadas [P] na Fundação podem rodar em paralelo (dentro da Fase 2)
- Após a Fase de Fundação, todas as histórias podem começar em paralelo (se a capacidade da equipe permitir)
- Todos os testes de uma história marcados [P] podem rodar em paralelo
- Modelos dentro de uma história marcados [P] podem rodar em paralelo
- Histórias diferentes podem ser trabalhadas em paralelo por membros diferentes da equipe

---

## Exemplo de Paralelismo: História de Usuário 1

```bash
# Iniciar todos os testes da História de Usuário 1 juntos (se testes solicitados):
Task: "Teste de contrato para [endpoint] em tests/contract/test_[nome].py"
Task: "Teste de integração para [jornada do usuário] em tests/integration/test_[nome].py"

# Iniciar todos os modelos da História de Usuário 1 juntos:
Task: "Criar modelo [Entidade1] em src/models/[entidade1].py"
Task: "Criar modelo [Entidade2] em src/models/[entidade2].py"
```

---

## Estratégia de Implementação

### MVP Primeiro (Apenas História de Usuário 1)

1. Completar Fase 1: Setup
2. Completar Fase 2: Fundação (CRÍTICO — bloqueia todas as histórias)
3. Completar Fase 3: História de Usuário 1
4. **PARAR e VALIDAR**: Testar a História de Usuário 1 de forma independente
5. Fazer deploy/demo se pronto

### Entrega Incremental

1. Completar Setup + Fundação → Fundação pronta
2. Adicionar História de Usuário 1 → Testar independentemente → Deploy/Demo (MVP!)
3. Adicionar História de Usuário 2 → Testar independentemente → Deploy/Demo
4. Adicionar História de Usuário 3 → Testar independentemente → Deploy/Demo
5. Cada história agrega valor sem quebrar as anteriores

### Estratégia de Equipe em Paralelo

Com múltiplos desenvolvedores:

1. Equipe completa o Setup + Fundação juntos
2. Após a Fundação:
   - Desenvolvedor A: História de Usuário 1
   - Desenvolvedor B: História de Usuário 2
   - Desenvolvedor C: História de Usuário 3
3. As histórias são concluídas e integradas de forma independente

---

## Notas

- Tarefas [P] = arquivos diferentes, sem dependências
- O rótulo [História] mapeia a tarefa a uma história específica para rastreabilidade
- Cada história de usuário deve ser completável e testável de forma independente
- Verificar que os testes falham antes de implementar
- Fazer commit após cada tarefa ou grupo lógico
- Parar em qualquer checkpoint para validar a história de forma independente
- Evitar: tarefas vagas, conflitos no mesmo arquivo, dependências entre histórias que quebrem independência
- **Princípio IX**: Cada tarefa DEVE ter uma única responsabilidade concreta — divida tarefas amplas em menores.
  Cada linha de **Checkpoint** DEVE nomear o padrão de design aplicado naquela fase
  (ex.: "Checkpoint: Padrão Service Layer completo — chamadas AnkiConnect isoladas da lógica de negócio").
