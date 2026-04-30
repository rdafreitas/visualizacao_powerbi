---
description: Cria ou atualiza a constituição do projeto a partir de entradas de princípios fornecidas ou interativas, garantindo que todos os templates dependentes permaneçam sincronizados.
handoffs: 
  - label: Criar Especificação
    agent: speckit.specify
    prompt: Implemente a especificação de feature com base na constituição atualizada. Quero construir...
---

## Entrada do Usuário

```text
$ARGUMENTS
```

Você **DEVE** considerar a entrada do usuário antes de prosseguir (se não estiver vazia).

## Descrição Geral

Você está atualizando a constituição do projeto em `.specify/memory/constitution.md`. Este arquivo é um TEMPLATE contendo tokens de espaço reservado entre colchetes (ex.: `[NOME_DO_PROJETO]`, `[NOME_PRINCÍPIO_1]`). Sua tarefa é (a) coletar/derivar valores concretos, (b) preencher o template com precisão e (c) propagar quaisquer emendas pelos artefatos dependentes.

**Nota**: Se `.specify/memory/constitution.md` não existir ainda, ele deveria ter sido inicializado a partir de `.specify/templates/constitution-template.md` durante a configuração do projeto. Se estiver ausente, copie o template primeiro.

Siga este fluxo de execução:

1. Carregue a constituição existente em `.specify/memory/constitution.md`.
   - Identifique cada token de espaço reservado na forma `[IDENTIFICADOR_EM_MAIÚSCULAS]`.
   **IMPORTANTE**: O usuário pode exigir menos ou mais princípios do que os usados no template. Se um número for especificado, respeite-o — siga o template geral. Você atualizará o documento adequadamente.

2. Colete/derive valores para os espaços reservados:
   - Se a entrada do usuário (conversa) fornecer um valor, use-o.
   - Caso contrário, infira do contexto existente do repositório (README, docs, versões anteriores da constituição se incorporadas).
   - Para datas de governança: `DATA_RATIFICAÇÃO` é a data de adoção original (se desconhecida, pergunte ou marque como TODO), `DATA_ÚLTIMA_EMENDA` é hoje se alterações forem feitas, caso contrário mantenha a anterior.
   - `VERSÃO_CONSTITUIÇÃO` deve incrementar de acordo com as regras de versionamento semântico:
     - MAJOR: Remoções ou redefinições incompatíveis de governança/princípio.
     - MINOR: Novo princípio/seção adicionado ou orientação materialmente expandida.
     - PATCH: Esclarecimentos, formulação, correções de digitação, refinamentos não semânticos.
   - Se o tipo de incremento de versão for ambíguo, proponha o raciocínio antes de finalizar.

3. Rascunhe o conteúdo atualizado da constituição:
   - Substitua cada espaço reservado por texto concreto (sem tokens entre colchetes remanescentes, exceto slots de template intencionalmente retidos que o projeto escolheu não definir ainda — justifique explicitamente qualquer token deixado).
   - Preserve a hierarquia de cabeçalhos e os comentários podem ser removidos após a substituição, a menos que ainda adicionem orientação de esclarecimento.
   - Garanta que cada seção de Princípio tenha: linha de nome sucinto, parágrafo (ou lista de bullets) capturando regras inegociáveis, justificativa explícita se não óbvia.
   - Garanta que a seção de Governança liste o procedimento de emenda, política de versionamento e expectativas de revisão de conformidade.

4. Lista de verificação de propagação de consistência (converta a lista de verificação anterior em validações ativas):
   - Leia `.specify/templates/plan-template.md` e garanta que qualquer "Verificação da Constituição" ou regras se alinhe com os princípios atualizados.
   - Leia `.specify/templates/spec-template.md` para alinhamento de escopo/requisitos — atualize se a constituição adicionar/remover seções obrigatórias ou restrições.
   - Leia `.specify/templates/tasks-template.md` e garanta que a categorização de tarefas reflita tipos de tarefa novos ou removidos orientados por princípios (ex.: observabilidade, versionamento, disciplina de testes).
   - Leia cada arquivo de comando em `.specify/templates/commands/*.md` (incluindo este) para verificar se não há referências desatualizadas (nomes específicos de agente como CLAUDE apenas) quando orientação genérica é necessária.
   - Leia quaisquer documentos de orientação em tempo de execução (ex.: `README.md`, `docs/quickstart.md`, ou arquivos de orientação específicos de agente, se presentes). Atualize referências a princípios alterados.

5. Produza um Relatório de Impacto de Sincronização (adicione como comentário HTML no topo do arquivo da constituição após a atualização):
   - Mudança de versão: antiga → nova
   - Lista de princípios modificados (título antigo → título novo se renomeado)
   - Seções adicionadas
   - Seções removidas
   - Templates que requerem atualização (✅ atualizado / ⚠ pendente) com caminhos de arquivo
   - TODOs de acompanhamento se houver espaços reservados intencionalmente adiados.

6. Validação antes da saída final:
   - Nenhum token de colchete inexplicado remanescente.
   - A linha de versão corresponde ao relatório.
   - Datas no formato ISO AAAA-MM-DD.
   - Os princípios são declarativos, testáveis e livres de linguagem vaga ("deveria" → substitua por DEVE/DEVERIA com justificativa onde apropriado).

7. Escreva a constituição concluída de volta em `.specify/memory/constitution.md` (substituição).

8. Gere um resumo final para o usuário com:
   - Nova versão e justificativa do incremento.
   - Quaisquer arquivos sinalizados para acompanhamento manual.
   - Mensagem de commit sugerida (ex.: `docs: emendar constituição para vX.Y.Z (adição de princípios + atualização de governança)`).

Requisitos de Formatação e Estilo:

- Use cabeçalhos Markdown exatamente como no template (não rebaixe/promova níveis).
- Quebre linhas longas de justificativa para manter a legibilidade (<100 chars idealmente), mas não force quebras estranhas.
- Mantenha uma linha em branco entre seções.
- Evite espaços em branco no final.

Se o usuário fornecer atualizações parciais (ex.: apenas uma revisão de princípio), ainda execute as etapas de validação e decisão de versão.

Se informações críticas estiverem ausentes (ex.: data de ratificação verdadeiramente desconhecida), insira `TODO(<NOME_DO_CAMPO>): explicação` e inclua no Relatório de Impacto de Sincronização sob itens adiados.

Não crie um novo template; sempre opere no arquivo `.specify/memory/constitution.md` existente.
