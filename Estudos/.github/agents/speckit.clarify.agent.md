---
description: Identifica áreas subespecificadas na spec da feature atual fazendo até 5 perguntas de esclarecimento altamente direcionadas e registra as respostas de volta na spec.
handoffs: 
  - label: Criar Plano Técnico
    agent: speckit.plan
    prompt: Crie um plano para a spec. Estou construindo com...
---

## Entrada do Usuário

```text
$ARGUMENTS
```

Você **DEVE** considerar a entrada do usuário antes de prosseguir (se não estiver vazia).

## Descrição Geral

Objetivo: Detectar e reduzir ambiguidade ou pontos de decisão ausentes na especificação de feature ativa e registrar os esclarecimentos diretamente no arquivo da spec.

Nota: Este fluxo de esclarecimento deve ser executado (e concluído) ANTES de invocar o `/speckit.plan`. Se o usuário declarar explicitamente que está pulando o esclarecimento (ex.: spike exploratório), você pode prosseguir, mas deve avisar que o risco de retrabalho downstream aumenta.

Passos de execução:

1. Execute `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` a partir da raiz do repositório **uma vez** (modo combinado `--json --paths-only` / `-Json -PathsOnly`). Analise os campos mínimos do payload JSON:
   - `FEATURE_DIR`
   - `FEATURE_SPEC`
   - (Opcionalmente capture `IMPL_PLAN`, `TASKS` para fluxos encadeados futuros.)
   - Se a análise JSON falhar, interrompa e instrua o usuário a reexecutar o `/speckit.specify` ou verificar o ambiente da branch de feature.
   - Para aspas simples em argumentos como "I'm Groot", use sintaxe de escape: ex. 'I'\''m Groot' (ou aspas duplas se possível: "I'm Groot").

2. Carregue o arquivo de spec atual. Realize uma varredura estruturada de ambiguidade e cobertura usando esta taxonomia. Para cada categoria, marque o status: Claro / Parcial / Ausente. Produza um mapa de cobertura interno usado para priorização (não gere o mapa bruto a menos que nenhuma pergunta seja feita).

   Escopo e Comportamento Funcional:
   - Objetivos centrais do usuário e critérios de sucesso
   - Declarações explícitas de fora do escopo
   - Diferenciação de papéis de usuário / personas

   Domínio e Modelo de Dados:
   - Entidades, atributos, relacionamentos
   - Regras de identidade e unicidade
   - Transições de ciclo de vida/estado
   - Premissas de volume de dados / escala

   Fluxo de Interação e UX:
   - Jornadas críticas do usuário / sequências
   - Estados de erro/vazio/carregamento
   - Notas de acessibilidade ou localização

   Atributos de Qualidade Não Funcionais:
   - Performance (alvos de latência, throughput)
   - Escalabilidade (limites horizontal/vertical)
   - Confiabilidade e disponibilidade (uptime, expectativas de recuperação)
   - Observabilidade (sinais de logging, métricas, tracing)
   - Segurança e privacidade (autenticação/autorização, proteção de dados, premissas de ameaça)
   - Restrições de conformidade / regulatórias (se houver)

   Integrações e Dependências Externas:
   - Serviços/APIs externos e modos de falha
   - Formatos de importação/exportação de dados
   - Premissas de protocolo/versionamento

   Casos de Borda e Tratamento de Falhas:
   - Cenários negativos
   - Rate limiting / throttling
   - Resolução de conflitos (ex.: edições concorrentes)

   Restrições e Compromissos:
   - Restrições técnicas (linguagem, armazenamento, hospedagem)
   - Compromissos explícitos ou alternativas rejeitadas

   Terminologia e Consistência:
   - Termos do glossário canônico
   - Sinônimos evitados / termos obsoletos

   Sinais de Conclusão:
   - Testabilidade dos critérios de aceitação
   - Indicadores mensuráveis no estilo Definição de Pronto

   Misc / Espaços Reservados:
   - Marcadores TODO / decisões não resolvidas
   - Adjetivos ambíguos ("robusto", "intuitivo") sem quantificação

   Para cada categoria com status Parcial ou Ausente, adicione uma oportunidade de pergunta candidata, exceto se:
   - O esclarecimento não mudaria materialmente a estratégia de implementação ou validação
   - A informação é melhor adiada para a fase de planejamento (registre internamente)

3. Gere (internamente) uma fila priorizada de perguntas de esclarecimento candidatas (máximo 5). NÃO as gere todas de uma vez. Aplique estas restrições:
    - Máximo de 5 perguntas no total durante toda a sessão.
    - Cada pergunta deve ser respondível com QUALQUER UM dos seguintes:
       - Uma seleção curta de múltipla escolha (2–5 opções distintas e mutuamente exclusivas), OU
       - Uma resposta de uma palavra / frase curta (restrinja explicitamente: "Responda em ≤5 palavras").
    - Inclua apenas perguntas cujas respostas impactem materialmente a arquitetura, modelagem de dados, decomposição de tarefas, design de testes, comportamento de UX, prontidão operacional ou validação de conformidade.
    - Garanta equilíbrio de cobertura de categorias: tente cobrir primeiro as categorias não resolvidas de maior impacto; evite fazer duas perguntas de baixo impacto quando uma área de alto impacto (ex.: postura de segurança) estiver não resolvida.
    - Exclua perguntas já respondidas, preferências estilísticas triviais ou detalhes de execução a nível de planejamento (a menos que bloqueiem a correção).
    - Prefira esclarecimentos que reduzam o risco de retrabalho downstream ou previnam testes de aceitação desalinhados.
    - Se mais de 5 categorias permanecerem não resolvidas, selecione as 5 principais pela heurística (Impacto × Incerteza).

4. Loop de questionamento sequencial (interativo):
    - Apresente EXATAMENTE UMA pergunta por vez.
    - Para perguntas de múltipla escolha:
       - **Analise todas as opções** e determine a **opção mais adequada** com base em:
          - Melhores práticas para o tipo de projeto
          - Padrões comuns em implementações similares
          - Redução de risco (segurança, performance, manutenibilidade)
          - Alinhamento com quaisquer objetivos ou restrições explícitas do projeto visíveis na spec
       - Apresente sua **opção recomendada de forma proeminente** no topo com raciocínio claro (1-2 frases explicando por que é a melhor escolha).
       - Formate como: `**Recomendação:** Opção [X] - <raciocínio>`
       - Em seguida, renderize todas as opções como tabela Markdown:

       | Opção | Descrição |
       |-------|-----------|
       | A | <Descrição da Opção A> |
       | B | <Descrição da Opção B> |
       | C | <Descrição da Opção C> (adicione D/E conforme necessário, até 5) |
       | Outra | Forneça uma resposta curta diferente (≤5 palavras) (Inclua apenas se alternativa de forma livre for apropriada) |

       - Após a tabela, adicione: `Você pode responder com a letra da opção (ex.: "A"), aceitar a recomendação dizendo "sim" ou "recomendado", ou fornecer sua própria resposta curta.`
    - Para estilo de resposta curta (sem opções discretas significativas):
       - Forneça sua **resposta sugerida** com base nas melhores práticas e no contexto.
       - Formate como: `**Sugestão:** <sua resposta proposta> - <breve raciocínio>`
       - Em seguida, gere: `Formato: Resposta curta (≤5 palavras). Você pode aceitar a sugestão dizendo "sim" ou "sugestão", ou fornecer sua própria resposta.`
    - Após o usuário responder:
       - Se o usuário responder "sim", "recomendado" ou "sugestão", use sua recomendação/sugestão previamente declarada como resposta.
       - Caso contrário, valide se a resposta mapeia para uma opção ou se encaixa na restrição de ≤5 palavras.
       - Se ambíguo, peça uma desambiguação rápida (a contagem ainda pertence à mesma pergunta; não avance).
       - Uma vez satisfatório, registre na memória de trabalho (ainda não escreva em disco) e passe para a próxima pergunta na fila.
    - Pare de fazer perguntas quando:
       - Todas as ambiguidades críticas forem resolvidas antecipadamente (os itens restantes na fila se tornam desnecessários), OU
       - O usuário sinalizar conclusão ("pronto", "ok", "sem mais"), OU
       - Você chegar a 5 perguntas feitas.
    - Nunca revele perguntas futuras da fila antecipadamente.
    - Se não houver perguntas válidas no início, relate imediatamente que não há ambiguidades críticas.

5. Integração após CADA resposta aceita (abordagem de atualização incremental):
    - Mantenha na memória a representação da spec (carregada uma vez no início) mais o conteúdo bruto do arquivo.
    - Para a primeira resposta integrada nesta sessão:
       - Garanta que exista uma seção `## Esclarecimentos` (crie-a logo após a seção contextual/visão geral de nível mais alto de acordo com o template de spec, se estiver ausente).
       - Sob ela, crie (se não estiver presente) um subcabeçalho `### Sessão AAAA-MM-DD` para hoje.
    - Adicione uma linha de bullet imediatamente após a aceitação: `- P: <pergunta> → R: <resposta final>`.
    - Em seguida, aplique imediatamente o esclarecimento à(s) seção(ões) mais apropriada(s):
       - Ambiguidade funcional → Atualize ou adicione um bullet em Requisitos Funcionais.
       - Interação do usuário / distinção de ator → Atualize Histórias de Usuário ou subseção de Atores (se presente) com papel, restrição ou cenário esclarecido.
       - Forma de dados / entidades → Atualize o Modelo de Dados (adicione campos, tipos, relacionamentos) preservando a ordenação; anote restrições adicionadas de forma sucinta.
       - Restrição não funcional → Adicione/modifique critérios mensuráveis em Critérios de Sucesso > Resultados Mensuráveis (converta adjetivo vago em métrica ou alvo explícito).
       - Caso de borda / fluxo negativo → Adicione um novo bullet em Casos de Borda / Tratamento de Erros (ou crie essa subseção se o template fornecer espaço reservado para ela).
       - Conflito de terminologia → Normalize o termo em toda a spec; mantenha o original apenas se necessário adicionando `(anteriormente referenciado como "X")` uma vez.
    - Se o esclarecimento invalidar uma declaração ambígua anterior, substitua essa declaração em vez de duplicar; não deixe texto contraditório obsoleto.
    - Salve o arquivo de spec APÓS cada integração para minimizar o risco de perda de contexto (substituição atômica).
    - Preserve a formatação: não reordene seções não relacionadas; mantenha a hierarquia de cabeçalhos intacta.
    - Mantenha cada esclarecimento inserido mínimo e testável (evite deriva narrativa).

6. Validação (realizada após CADA escrita e passagem final):
   - A sessão de esclarecimentos contém exatamente um bullet por resposta aceita (sem duplicatas).
   - Total de perguntas feitas (aceitas) ≤ 5.
   - As seções atualizadas não contêm espaços reservados vagos remanescentes que a nova resposta deveria resolver.
   - Nenhuma declaração anterior contraditória permanece (verifique escolhas alternativas agora inválidas removidas).
   - Estrutura Markdown válida; apenas novos cabeçalhos permitidos: `## Esclarecimentos`, `### Sessão AAAA-MM-DD`.
   - Consistência de terminologia: mesmo termo canônico usado em todas as seções atualizadas.

7. Escreva a spec atualizada de volta em `FEATURE_SPEC`.

8. Relate a conclusão (após o término do loop de questionamento ou encerramento antecipado):
   - Número de perguntas feitas e respondidas.
   - Caminho para a spec atualizada.
   - Seções tocadas (liste os nomes).
   - Tabela de resumo de cobertura listando cada categoria da taxonomia com Status: Resolvido (era Parcial/Ausente e foi tratado), Adiado (excede a cota de perguntas ou é mais adequado para planejamento), Claro (já suficiente), Pendente (ainda Parcial/Ausente mas de baixo impacto).
   - Se algum Pendente ou Adiado permanecer, recomende se deve prosseguir para o `/speckit.plan` ou executar o `/speckit.clarify` novamente mais tarde após o plano.
   - Próximo comando sugerido.

Regras de comportamento:

- Se nenhuma ambiguidade significativa for encontrada (ou todas as perguntas potenciais seriam de baixo impacto), responda: "Nenhuma ambiguidade crítica detectada que justifique esclarecimento formal." e sugira prosseguir.
- Se o arquivo de spec estiver ausente, instrua o usuário a executar o `/speckit.specify` primeiro (não crie uma nova spec aqui).
- Nunca ultrapasse 5 perguntas no total (novas tentativas de esclarecimento para uma única pergunta não contam como novas perguntas).
- Evite perguntas especulativas sobre stack tecnológica a menos que a ausência bloqueie a clareza funcional.
- Respeite os sinais de encerramento antecipado do usuário ("parar", "pronto", "prosseguir").
- Se nenhuma pergunta for feita por cobertura completa, gere um resumo compacto de cobertura (todas as categorias Claras) e sugira avançar.
- Se a cota for atingida com categorias de alto impacto ainda não resolvidas, marque-as explicitamente como Adiadas com justificativa.

Contexto para priorização: $ARGUMENTS
