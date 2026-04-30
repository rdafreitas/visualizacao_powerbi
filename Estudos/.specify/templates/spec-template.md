# Especificação de Feature: [NOME DA FEATURE]

**Branch da Feature**: `[###-nome-da-feature]`  
**Criado em**: [DATA]  
**Status**: Rascunho  
**Entrada**: Descrição do usuário: "$ARGUMENTS"

## Cenários de Usuário e Testes *(obrigatório)*

<!--
  IMPORTANTE: As histórias de usuário devem ser PRIORIZADAS como jornadas ordenadas por importância.
  Cada história de usuário/jornada deve ser TESTÁVEL DE FORMA INDEPENDENTE — ou seja, se você
  implementar apenas UMA delas, ainda terá um MVP (Produto Mínimo Viável) que entrega valor.
  
  Atribua prioridades (P1, P2, P3, etc.) a cada história, onde P1 é a mais crítica.
  Pense em cada história como uma fatia independente de funcionalidade que pode ser:
  - Desenvolvida de forma independente
  - Testada de forma independente
  - Entregue de forma independente
  - Demonstrada para usuários de forma independente
-->

### História de Usuário 1 - [Título Breve] (Prioridade: P1)

[Descreva esta jornada em linguagem simples]

**Por que esta prioridade**: [Explique o valor e o motivo desta prioridade]

**Teste Independente**: [Descreva como pode ser testada independentemente — ex.: "Pode ser totalmente testada por [ação específica] e entrega [valor específico]"]

**Cenários de Aceitação**:

1. **Dado** [estado inicial], **Quando** [ação], **Então** [resultado esperado]
2. **Dado** [estado inicial], **Quando** [ação], **Então** [resultado esperado]

---

### História de Usuário 2 - [Título Breve] (Prioridade: P2)

[Descreva esta jornada em linguagem simples]

**Por que esta prioridade**: [Explique o valor e o motivo desta prioridade]

**Teste Independente**: [Descreva como pode ser testada de forma independente]

**Cenários de Aceitação**:

1. **Dado** [estado inicial], **Quando** [ação], **Então** [resultado esperado]

---

### História de Usuário 3 - [Título Breve] (Prioridade: P3)

[Descreva esta jornada em linguagem simples]

**Por que esta prioridade**: [Explique o valor e o motivo desta prioridade]

**Teste Independente**: [Descreva como pode ser testada de forma independente]

**Cenários de Aceitação**:

1. **Dado** [estado inicial], **Quando** [ação], **Então** [resultado esperado]

---

[Adicione mais histórias de usuário conforme necessário, cada uma com prioridade atribuída]

### Casos de Borda

<!--
  AÇÃO NECESSÁRIA: O conteúdo desta seção representa exemplos.
  Preencha com os casos de borda adequados.
-->

- O que acontece quando [condição limite]?
- Como o sistema trata [cenário de erro]?

## Requisitos *(obrigatório)*

<!--
  AÇÃO NECESSÁRIA: O conteúdo desta seção representa exemplos.
  Preencha com os requisitos funcionais adequados.
-->

### Requisitos Funcionais

- **RF-001**: O sistema DEVE [capacidade específica, ex.: "permitir que usuários criem contas"]
- **RF-002**: O sistema DEVE [capacidade específica, ex.: "validar endereços de e-mail"]  
- **RF-003**: Os usuários DEVEM ser capazes de [interação chave, ex.: "redefinir sua senha"]
- **RF-004**: O sistema DEVE [requisito de dados, ex.: "persistir preferências do usuário"]
- **RF-005**: O sistema DEVE [comportamento, ex.: "registrar todos os eventos de segurança"]

*Exemplo de marcação de requisitos com esclarecimento pendente:*

- **RF-006**: O sistema DEVE autenticar usuários via [NECESSITA ESCLARECIMENTO: método de autenticação não especificado — e-mail/senha, SSO, OAuth?]
- **RF-007**: O sistema DEVE reter dados do usuário por [NECESSITA ESCLARECIMENTO: período de retenção não especificado]

### Entidades-Chave *(incluir se a feature envolve dados)*

- **[Entidade 1]**: [O que representa, atributos chave sem detalhes de implementação]
- **[Entidade 2]**: [O que representa, relacionamentos com outras entidades]

## Critérios de Sucesso *(obrigatório)*

<!--
  AÇÃO NECESSÁRIA: Defina critérios de sucesso mensuráveis.
  Devem ser independentes de tecnologia e mensuráveis.
-->

### Resultados Mensuráveis

- **CS-001**: [Métrica mensurável, ex.: "Usuários podem concluir a criação de conta em menos de 2 minutos"]
- **CS-002**: [Métrica mensurável, ex.: "O sistema suporta 1.000 usuários simultâneos sem degradação"]
- **CS-003**: [Métrica de satisfação, ex.: "90% dos usuários completam a tarefa principal na primeira tentativa"]
- **CS-004**: [Métrica de negócio, ex.: "Reduzir tickets de suporte relacionados a [X] em 50%"]

## Premissas

<!--
  AÇÃO NECESSÁRIA: O conteúdo desta seção representa exemplos.
  Preencha com as premissas adequadas com base em padrões razoáveis
  adotados quando a descrição da feature não especificou certos detalhes.
-->

- [Premissa sobre usuários-alvo, ex.: "Usuários têm conectividade estável à internet"]
- [Premissa sobre escopo, ex.: "Suporte móvel está fora do escopo da v1"]
- [Premissa sobre dados/ambiente, ex.: "O sistema de autenticação existente será reutilizado"]
- [Dependência de sistema/serviço existente, ex.: "Requer acesso à API de perfil de usuário existente"]
