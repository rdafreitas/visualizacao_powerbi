---
description: Gera uma checklist personalizada para a feature atual com base nos requisitos do usuário.
---

## Propósito da Checklist: "Testes Unitários para Requisitos"

**CONCEITO CENTRAL**: Checklists são **TESTES UNITÁRIOS PARA ESCRITA DE REQUISITOS** — elas validam a qualidade, clareza e completude dos requisitos em um determinado domínio.

**NÃO são para verificação/teste:**

- ❌ NÃO "Verificar se o botão clica corretamente"
- ❌ NÃO "Testar se o tratamento de erros funciona"
- ❌ NÃO "Confirmar se a API retorna 200"
- ❌ NÃO verificar se o código/implementação corresponde à spec

**SÃO para validação da qualidade dos requisitos:**

- ✅ "Os requisitos de hierarquia visual estão definidos para todos os tipos de card?" (completude)
- ✅ "'Exibição proeminente' está quantificada com tamanho/posicionamento específicos?" (clareza)
- ✅ "Os requisitos de estado hover são consistentes em todos os elementos interativos?" (consistência)
- ✅ "Os requisitos de acessibilidade estão definidos para navegação por teclado?" (cobertura)
- ✅ "A spec define o que acontece quando a imagem do logo falha ao carregar?" (casos de borda)

**Metáfora**: Se sua spec é código escrito em português, a checklist é seu conjunto de testes unitários. Você está testando se os requisitos estão bem escritos, completos, sem ambiguidade e prontos para implementação — NÃO se a implementação funciona.

## Entrada do Usuário

```text
$ARGUMENTS
```

Você **DEVE** considerar a entrada do usuário antes de prosseguir (se não estiver vazia).

## Passos de Execução

1. **Setup**: Execute `.specify/scripts/bash/check-prerequisites.sh --json` a partir da raiz do repositório e analise o JSON para obter FEATURE_DIR e a lista AVAILABLE_DOCS.
   - Todos os caminhos de arquivo devem ser absolutos.
   - Para aspas simples em argumentos como "I'm Groot", use sintaxe de escape: ex. 'I'\''m Groot' (ou aspas duplas se possível: "I'm Groot").

2. **Esclarecer intenção (dinâmico)**: Derive até TRÊS perguntas de esclarecimento contextuais iniciais (sem catálogo pré-definido). Elas DEVEM:
   - Ser geradas a partir da formulação do usuário + sinais extraídos da spec/plan/tasks
   - Perguntar apenas sobre informações que mudam materialmente o conteúdo da checklist
   - Ser ignoradas individualmente se já estiverem inequívocas nos `$ARGUMENTS`
   - Preferir precisão em vez de abrangência

   Algoritmo de geração:
   1. Extrair sinais: palavras-chave de domínio da feature (ex.: auth, latência, UX, API), indicadores de risco ("crítico", "deve", "conformidade"), dicas de partes interessadas ("QA", "revisão", "equipe de segurança") e entregáveis explícitos ("a11y", "rollback", "contratos").
   2. Agrupar sinais em áreas de foco candidatas (máx. 4) classificadas por relevância.
   3. Identificar o provável público e momento (autor, revisor, QA, lançamento) se não explícito.
   4. Detectar dimensões ausentes: amplitude de escopo, profundidade/rigor, ênfase de risco, limites de exclusão, critérios de aceitação mensuráveis.
   5. Formular perguntas escolhidas destes arquétipos:
      - Refinamento de escopo (ex.: "Deve incluir pontos de integração com X e Y ou ficar limitado à correção do módulo local?")
      - Priorização de risco (ex.: "Quais dessas áreas de risco potenciais devem receber verificações de gate obrigatórias?")
      - Calibração de profundidade (ex.: "É uma lista de sanidade pré-commit leve ou um gate formal de lançamento?")
      - Enquadramento do público (ex.: "Será usada apenas pelo autor ou por pares durante a revisão do PR?")
      - Exclusão de limite (ex.: "Devemos excluir explicitamente itens de ajuste de performance nesta rodada?")
      - Lacuna de classe de cenário (ex.: "Nenhum fluxo de recuperação detectado — os caminhos de rollback/falha parcial estão no escopo?")

   Regras de formatação de perguntas:
   - Se apresentar opções, gere uma tabela compacta com colunas: Opção | Candidato | Por que É Importante
   - Limite a no máximo A–E opções; omita tabela se uma resposta de forma livre for mais clara
   - Nunca peça ao usuário para repetir o que já disse
   - Evite categorias especulativas (sem alucinações). Se incerto, pergunte explicitamente: "Confirme se X está no escopo."

   Padrões quando a interação é impossível:
   - Profundidade: Padrão
   - Público: Revisor (PR) se relacionado a código; Autor caso contrário
   - Foco: Os 2 principais clusters de relevância

   Gere as perguntas (rotule Q1/Q2/Q3). Após as respostas: se ≥2 classes de cenário (Alternativo / Exceção / Recuperação / domínio Não-Funcional) permanecerem pouco claras, você PODE fazer até DOIS acompanhamentos adicionais (Q4/Q5) com uma justificativa de uma linha cada (ex.: "Risco de caminho de recuperação não resolvido"). Não ultrapasse cinco perguntas no total. Ignore o escalonamento se o usuário recusar mais.

3. **Entender a solicitação do usuário**: Combine `$ARGUMENTS` + respostas de esclarecimento:
   - Derive o tema da checklist (ex.: segurança, revisão, deploy, ux)
   - Consolide itens obrigatórios explícitos mencionados pelo usuário
   - Mapeie seleções de foco para a estrutura de categorias
   - Infira qualquer contexto ausente da spec/plan/tasks (NÃO alucine)

4. **Carregar contexto da feature**: Leia do FEATURE_DIR:
   - spec.md: Requisitos e escopo da feature
   - plan.md (se existir): Detalhes técnicos, dependências
   - tasks.md (se existir): Tarefas de implementação

   **Estratégia de Carregamento de Contexto**:
   - Carregue apenas as partes necessárias relevantes às áreas de foco ativas (evite despejar o arquivo completo)
   - Prefira resumir seções longas em bullets concisos de cenário/requisito
   - Use divulgação progressiva: adicione recuperação complementar somente se lacunas forem detectadas
   - Se os documentos-fonte forem grandes, gere itens de resumo intermediários em vez de incorporar texto bruto

5. **Gerar checklist** — Crie "Testes Unitários para Requisitos":
   - Crie o diretório `FEATURE_DIR/checklists/` se não existir
   - Gere um nome de arquivo único para a checklist:
     - Use um nome curto e descritivo baseado no domínio (ex.: `ux.md`, `api.md`, `seguranca.md`)
     - Formato: `[dominio].md`
   - Comportamento de tratamento de arquivo:
     - Se o arquivo NÃO existir: crie um novo arquivo e numere os itens a partir de CHK001
     - Se o arquivo existir: adicione novos itens ao arquivo existente, continuando a partir do último ID CHK (ex.: se o último item for CHK015, inicie novos itens em CHK016)
   - Nunca exclua ou substitua o conteúdo de checklist existente — sempre preserve e adicione

   **PRINCÍPIO CENTRAL — Teste os Requisitos, não a Implementação**:
   Cada item da checklist DEVE avaliar os PRÓPRIOS REQUISITOS quanto a:
   - **Completude**: Todos os requisitos necessários estão presentes?
   - **Clareza**: Os requisitos são inequívocos e específicos?
   - **Consistência**: Os requisitos se alinham entre si?
   - **Mensurabilidade**: Os requisitos podem ser objetivamente verificados?
   - **Cobertura**: Todos os cenários/casos de borda são tratados?

   **Estrutura de Categorias** — Agrupe itens por dimensões de qualidade dos requisitos:
   - **Completude dos Requisitos** (Todos os requisitos necessários estão documentados?)
   - **Clareza dos Requisitos** (Os requisitos são específicos e inequívocos?)
   - **Consistência dos Requisitos** (Os requisitos se alinham sem conflitos?)
   - **Qualidade dos Critérios de Aceitação** (Os critérios de sucesso são mensuráveis?)
   - **Cobertura de Cenários** (Todos os fluxos/casos são tratados?)
   - **Cobertura de Casos de Borda** (As condições limite estão definidas?)
   - **Requisitos Não Funcionais** (Performance, Segurança, Acessibilidade, etc. — estão especificados?)
   - **Dependências e Premissas** (Estão documentadas e validadas?)
   - **Ambiguidades e Conflitos** (O que precisa de esclarecimento?)

   **COMO ESCREVER ITENS DE CHECKLIST — "Testes Unitários para Requisitos"**:

   ❌ **ERRADO** (Testando a implementação):
   - "Verificar se a página inicial exibe 3 cards de episódio"
   - "Testar se os estados hover funcionam no desktop"
   - "Confirmar se o clique no logo navega para a home"

   ✅ **CORRETO** (Testando a qualidade dos requisitos):
   - "O número exato e layout dos episódios em destaque estão especificados?" [Completude]
   - "'Exibição proeminente' está quantificada com tamanho/posicionamento específicos?" [Clareza]
   - "Os requisitos de estado hover são consistentes em todos os elementos interativos?" [Consistência]
   - "Os requisitos de navegação por teclado estão definidos para toda a UI interativa?" [Cobertura]
   - "O comportamento de fallback está especificado quando a imagem do logo falha ao carregar?" [Casos de Borda]
   - "Os estados de carregamento estão definidos para dados de episódio assíncronos?" [Completude]
   - "A spec define a hierarquia visual para elementos de UI concorrentes?" [Clareza]

   **ESTRUTURA DO ITEM**:
   Cada item deve seguir este padrão:
   - Formato de pergunta sobre a qualidade do requisito
   - Foco no que está ESCRITO (ou não escrito) na spec/plan
   - Inclua a dimensão de qualidade entre colchetes [Completude/Clareza/Consistência/etc.]
   - Referencie a seção da spec `[Spec §X.Y]` ao verificar requisitos existentes
   - Use o marcador `[Lacuna]` ao verificar requisitos ausentes

   **EXEMPLOS POR DIMENSÃO DE QUALIDADE**:

   Completude:
   - "Os requisitos de tratamento de erros estão definidos para todos os modos de falha da API? [Lacuna]"
   - "Os requisitos de acessibilidade estão especificados para todos os elementos interativos? [Completude]"
   - "Os requisitos de breakpoint mobile estão definidos para layouts responsivos? [Lacuna]"

   Clareza:
   - "'Carregamento rápido' está quantificado com limites de tempo específicos? [Clareza, Spec §NFR-2]"
   - "Os critérios de seleção de 'episódios relacionados' estão explicitamente definidos? [Clareza, Spec §RF-5]"
   - "'Proeminente' está definido com propriedades visuais mensuráveis? [Ambiguidade, Spec §RF-4]"

   Consistência:
   - "Os requisitos de navegação estão alinhados em todas as páginas? [Consistência, Spec §RF-10]"
   - "Os requisitos do componente card são consistentes entre as páginas de lista e detalhe? [Consistência]"

   Cobertura:
   - "Os requisitos estão definidos para cenários de estado vazio (sem episódios)? [Cobertura, Caso de Borda]"
   - "Os cenários de interação simultânea do usuário são tratados? [Cobertura, Lacuna]"
   - "Os requisitos estão especificados para falhas parciais de carregamento de dados? [Cobertura, Fluxo de Exceção]"

   Mensurabilidade:
   - "Os requisitos de hierarquia visual são mensuráveis/testáveis? [Critério de Aceitação, Spec §RF-1]"
   - "'Peso visual equilibrado' pode ser objetivamente verificado? [Mensurabilidade, Spec §RF-2]"

   **Classificação e Cobertura de Cenários** (Foco na Qualidade dos Requisitos):
   - Verifique se existem requisitos para: cenários Primários, Alternativos, Excepcionais/Erro, Recuperação, Não Funcionais
   - Para cada classe de cenário, pergunte: "Os requisitos de [tipo de cenário] são completos, claros e consistentes?"
   - Se a classe de cenário estiver ausente: "Os requisitos de [tipo de cenário] foram intencionalmente excluídos ou estão faltando? [Lacuna]"
   - Inclua resiliência/rollback quando ocorrer mutação de estado: "Os requisitos de rollback estão definidos para falhas de migração? [Lacuna]"

   **Requisitos de Rastreabilidade**:
   - MÍNIMO: ≥80% dos itens DEVEM incluir pelo menos uma referência de rastreabilidade
   - Cada item deve referenciar: seção da spec `[Spec §X.Y]`, ou usar marcadores: `[Lacuna]`, `[Ambiguidade]`, `[Conflito]`, `[Premissa]`
   - Se não houver sistema de ID: "Um esquema de ID de requisito e critério de aceitação está estabelecido? [Rastreabilidade]"

   **Identificar e Resolver Problemas** (Problemas de Qualidade dos Requisitos):
   Faça perguntas sobre os próprios requisitos:
   - Ambiguidades: "O termo 'rápido' está quantificado com métricas específicas? [Ambiguidade, Spec §NFR-1]"
   - Conflitos: "Os requisitos de navegação conflitam entre §RF-10 e §RF-10a? [Conflito]"
   - Premissas: "A premissa de 'API de podcast sempre disponível' está validada? [Premissa]"
   - Dependências: "Os requisitos de API externa de podcast estão documentados? [Dependência, Lacuna]"
   - Definições ausentes: "'Hierarquia visual' está definida com critérios mensuráveis? [Lacuna]"

   **Consolidação de Conteúdo**:
   - Limite suave: Se itens candidatos brutos > 40, priorize por risco/impacto
   - Mescle quase-duplicatas que verificam o mesmo aspecto do requisito
   - Se > 5 casos de borda de baixo impacto, crie um item: "Os casos de borda X, Y, Z são tratados nos requisitos? [Cobertura]"

   **🚫 ABSOLUTAMENTE PROIBIDO** — Estes tornam a checklist um teste de implementação, não de requisitos:
   - ❌ Qualquer item começando com "Verificar", "Testar", "Confirmar", "Checar" + comportamento de implementação
   - ❌ Referências à execução de código, ações do usuário, comportamento do sistema
   - ❌ "Exibe corretamente", "funciona corretamente", "opera como esperado"
   - ❌ "Clicar", "navegar", "renderizar", "carregar", "executar"
   - ❌ Casos de teste, planos de teste, procedimentos de QA
   - ❌ Detalhes de implementação (frameworks, APIs, algoritmos)

   **✅ PADRÕES OBRIGATÓRIOS** — Estes testam a qualidade dos requisitos:
   - ✅ "Os [tipo de requisito] estão definidos/especificados/documentados para [cenário]?"
   - ✅ "[Termo vago] está quantificado/esclarecido com critérios específicos?"
   - ✅ "Os requisitos são consistentes entre [seção A] e [seção B]?"
   - ✅ "[Requisito] pode ser objetivamente medido/verificado?"
   - ✅ "Os [casos de borda/cenários] são tratados nos requisitos?"
   - ✅ "A spec define [aspecto ausente]?"

6. **Referência de Estrutura**: Gere a checklist seguindo o template canônico em `.specify/templates/checklist-template.md` para título, seção de meta, cabeçalhos de categoria e formatação de ID. Se o template não estiver disponível, use: título H1, linhas de meta objetivo/criação, seções de categoria `##` contendo linhas `- [ ] CHK### <item de requisito>` com IDs globalmente incrementais começando em CHK001.

7. **Relatório**: Gere o caminho completo para o arquivo de checklist, a contagem de itens e resuma se a execução criou um novo arquivo ou adicionou a um existente. Resuma:
   - Áreas de foco selecionadas
   - Nível de profundidade
   - Ator/momento
   - Quaisquer itens obrigatórios explicitamente especificados pelo usuário incorporados

**Importante**: Cada invocação do comando `/speckit.checklist` usa um nome de arquivo curto e descritivo e ou cria um novo arquivo ou adiciona a um existente. Isso permite:

- Múltiplas checklists de diferentes tipos (ex.: `ux.md`, `teste.md`, `seguranca.md`)
- Nomes de arquivo simples e memoráveis que indicam o propósito da checklist
- Fácil identificação e navegação na pasta `checklists/`

Para evitar desordem, use tipos descritivos e limpe checklists obsoletas quando terminar.

## Exemplos de Tipos de Checklist e Itens de Amostra

**Qualidade dos Requisitos de UX:** `ux.md`

Itens de amostra (testando os requisitos, NÃO a implementação):

- "Os requisitos de hierarquia visual estão definidos com critérios mensuráveis? [Clareza, Spec §RF-1]"
- "O número e posicionamento dos elementos de UI estão explicitamente especificados? [Completude, Spec §RF-1]"
- "Os requisitos de estado de interação (hover, foco, ativo) estão consistentemente definidos? [Consistência]"
- "Os requisitos de acessibilidade estão especificados para todos os elementos interativos? [Cobertura, Lacuna]"
- "O comportamento de fallback está definido quando imagens falham ao carregar? [Caso de Borda, Lacuna]"
- "'Exibição proeminente' pode ser objetivamente medida? [Mensurabilidade, Spec §RF-4]"

**Qualidade dos Requisitos de API:** `api.md`

Itens de amostra:
- "Os formatos de resposta de erro estão especificados para todos os cenários de falha? [Completude]"
- "Os requisitos de rate limiting estão quantificados com limites específicos? [Clareza]"
- "Os requisitos de autenticação são consistentes em todos os endpoints? [Consistência]"
- "Os requisitos de retry/timeout estão definidos para dependências externas? [Cobertura, Lacuna]"
- "A estratégia de versionamento está documentada nos requisitos? [Lacuna]"

**Qualidade dos Requisitos de Performance:** `performance.md`

Itens de amostra:
- "Os requisitos de performance estão quantificados com métricas específicas? [Clareza]"
- "Os alvos de performance estão definidos para todas as jornadas críticas do usuário? [Cobertura]"
- "Os requisitos de performance sob diferentes condições de carga estão especificados? [Completude]"
- "Os requisitos de performance podem ser objetivamente medidos? [Mensurabilidade]"
- "Os requisitos de degradação para cenários de alta carga estão definidos? [Caso de Borda, Lacuna]"

**Qualidade dos Requisitos de Segurança:** `seguranca.md`

Itens de amostra:
- "Os requisitos de autenticação estão especificados para todos os recursos protegidos? [Cobertura]"
- "Os requisitos de proteção de dados estão definidos para informações sensíveis? [Completude]"
- "O modelo de ameaças está documentado e os requisitos estão alinhados a ele? [Rastreabilidade]"
- "Os requisitos de segurança são consistentes com as obrigações de conformidade? [Consistência]"
- "Os requisitos de resposta a falhas/violações de segurança estão definidos? [Lacuna, Fluxo de Exceção]"

## Contra-exemplos: O Que NÃO Fazer

**❌ ERRADO — Estes testam a implementação, não os requisitos:**

```markdown
- [ ] CHK001 - Verificar se a página inicial exibe 3 cards de episódio [Spec §RF-001]
- [ ] CHK002 - Testar se os estados hover funcionam corretamente no desktop [Spec §RF-003]
- [ ] CHK003 - Confirmar se o clique no logo navega para a home [Spec §RF-010]
- [ ] CHK004 - Checar se a seção de episódios relacionados mostra 3-5 itens [Spec §RF-005]
```

**✅ CORRETO — Estes testam a qualidade dos requisitos:**

```markdown
- [ ] CHK001 - O número e layout dos episódios em destaque estão explicitamente especificados? [Completude, Spec §RF-001]
- [ ] CHK002 - Os requisitos de estado hover estão consistentemente definidos para todos os elementos interativos? [Consistência, Spec §RF-003]
- [ ] CHK003 - Os requisitos de navegação estão claros para todos os elementos de marca clicáveis? [Clareza, Spec §RF-010]
- [ ] CHK004 - O critério de seleção para episódios relacionados está documentado? [Lacuna, Spec §RF-005]
- [ ] CHK005 - Os requisitos de estado de carregamento estão definidos para dados de episódio assíncronos? [Lacuna]
- [ ] CHK006 - Os requisitos de "hierarquia visual" podem ser objetivamente medidos? [Mensurabilidade, Spec §RF-001]
```

**Diferenças Chave:**

- Errado: Testa se o sistema funciona corretamente
- Correto: Testa se os requisitos estão escritos corretamente
- Errado: Verificação de comportamento
- Correto: Validação da qualidade dos requisitos
- Errado: "Ele faz X?"
- Correto: "X está claramente especificado?"
