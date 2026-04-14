# Feature Specification: Study Anki Export

**Feature Branch**: `007-study-anki-export`
**Created**: 2026-04-13
**Status**: Draft
**Role**: Feature (Output)
**Epic**: [001-study-agent-epic](../001-study-agent-epic/spec.md)
**Dependencies**:
- [002-study-foundation](../002-study-foundation/spec.md) (memória, logging, contratos, confirmação) — **obrigatório**
- [004-study-summary-generation](../004-study-summary-generation/spec.md) (topicos.json) — **obrigatório**
- [005-study-relevance-engine](../005-study-relevance-engine/spec.md) (relevancia_topicos.json) — **obrigatório**

---

## Escopo

Integração com Anki Desktop via AnkiConnect para exportação de flashcards a partir de tópicos do resumo. Cobre: listagem de decks, recomendação de deck, exportação em batch com tags de matéria e relevância, e fallback quando AnkiConnect não estiver disponível.

## Rationale

Canal de output complementar — converte tópicos em flashcards para repetição espaçada, que é a técnica de memorização mais eficaz para concursos. Isolado em spec própria porque tem infraestrutura distinta (AnkiConnect) e pode ser usado independentemente do Google Docs.

---

## User Scenarios & Testing

### User Story 1 — Listagem e Recomendação de Deck (Priority: P1)

O sistema lista os decks existentes no Anki Desktop e recomenda (ou cria) o deck mais adequado para a matéria sendo processada.

**Why this priority**: O deck correto precisa ser determinado antes de exportar flashcards.

**Independent Test**: Com Anki Desktop aberto e AnkiConnect ativo, invocar listagem e verificar que os decks são retornados com contagem de cards.

**Acceptance Scenarios**:

1. **Given** Anki Desktop aberto e AnkiConnect na porta 8765, **When** a listagem é invocada, **Then** o sistema exibe lista de decks com nome e total de cards em cada.
2. **Given** decks listados e matéria identificada (ex: "Direito Constitucional"), **When** o sistema recomenda deck, **Then** busca deck existente que corresponda à matéria (match parcial no nome) e sugere ao usuário.
3. **Given** nenhum deck corresponde à matéria, **When** a recomendação é feita, **Then** o sistema sugere criar novo deck com nome no formato `Concurso::<Matéria>` e pede confirmação do usuário.
4. **Given** o usuário escolhe um deck diferente do recomendado, **When** a seleção é confirmada, **Then** o sistema utiliza o deck escolhido para exportação.

---

### User Story 2 — Exportação Batch de Flashcards (Priority: P2)

O sistema transforma tópicos classificados em flashcards e os envia para o Anki em batch, com tags de matéria e relevância.

**Why this priority**: Core value desta spec — produz os flashcards para estudo por repetição espaçada.

**Independent Test**: Com deck selecionado e `/data/topicos.json` + `/data/relevancia_topicos.json` existentes, invocar exportação e verificar que flashcards são criados no Anki com tags corretas.

**Acceptance Scenarios**:

1. **Given** tópicos em `/data/topicos.json` com classificação em `/data/relevancia_topicos.json` e deck selecionado, **When** a exportação é invocada, **Then** o sistema gera flashcards no formato: frente = L0 (pergunta/conceito), verso = L1+L2 (resposta direta), e envia para o Anki via AnkiConnect.
2. **Given** flashcards gerados, **When** enviados ao Anki, **Then** cada card recebe tags: `materia::<nome>` e `relevancia::<alta|media|baixa>` (ex: `materia::direito-constitucional`, `relevancia::alta`).
3. **Given** batch de flashcards prontos, **When** a exportação inicia, **Then** o sistema exibe contagem total e distribuição por relevância antes de pedir confirmação.
4. **Given** exportação confirmada, **When** o envio é concluído, **Then** o sistema exibe: total enviados, total com sucesso, total com erro (se houver).
5. **Given** flashcard duplicado (já existe no deck com mesmo front), **When** o envio é tentado, **Then** o sistema detecta a duplicata e pula, registrando no log.

---

### User Story 3 — Fallback sem AnkiConnect (Priority: P3)

Quando AnkiConnect não está disponível (Anki fechado, plugin desinstalado), o sistema salva flashcards em formato importável e informa ao usuário.

**Why this priority**: Garante que o trabalho não é perdido mesmo sem Anki ativo — o usuário pode importar depois.

**Independent Test**: Com porta 8765 indisponível, invocar exportação e verificar que um arquivo de fallback é salvo.

**Acceptance Scenarios**:

1. **Given** AnkiConnect não responde na porta 8765, **When** a exportação é tentada, **Then** o sistema informa "AnkiConnect indisponível — Anki Desktop pode estar fechado" e oferece fallback.
2. **Given** fallback ativado, **When** os flashcards são salvos, **Then** o sistema gera `/data/anki_export_<materia>_<data>.txt` em formato de importação do Anki (tab-separated: frente, verso, tags).
3. **Given** arquivo de fallback salvo, **When** o usuário abre o Anki posteriormente, **Then** pode importar o arquivo via File > Import e obter os mesmos cards com tags.
4. **Given** AnkiConnect volta a ficar disponível e fallback existe, **When** o usuário reinvoca exportação, **Then** o sistema oferece enviar os cards pendentes do arquivo de fallback.

---

### Edge Cases

- O que acontece quando `/data/topicos.json` tem tópicos mas `/data/relevancia_topicos.json` não existe? O sistema deve exportar flashcards sem tags de relevância e informar que classificação não foi executada.
- O que acontece quando o Anki Desktop está aberto mas AnkiConnect não está instalado? O sistema deve detectar o erro de conexão e informar que o plugin precisa ser instalado.
- O que acontece quando o deck recomendado tem milhares de cards (deck de outra matéria)? O sistema deve alertar sobre o risco de poluição e sugerir deck mais específico.
- O que acontece quando o tópico L0 é muito longo para ser frente do flashcard? O sistema deve truncar com "..." e colocar versão completa no verso.

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE verificar conectividade com AnkiConnect (porta 8765 por padrão) antes de iniciar operações.
- **FR-002**: O sistema DEVE listar decks disponíveis no Anki Desktop, exibindo nome e contagem de cards.
- **FR-003**: O sistema DEVE recomendar deck baseado em correspondência parcial entre o nome do deck e a matéria sendo processada.
- **FR-004**: Quando nenhum deck corresponde, o sistema DEVE sugerir criação de novo deck no formato `Concurso::<Matéria>`, com confirmação do usuário.
- **FR-005**: O sistema DEVE gerar flashcards a partir de `/data/topicos.json`: frente = L0 (conceito/pergunta), verso = L1+L2 (resposta compacta).
- **FR-006**: O sistema DEVE aplicar tags a cada flashcard: `materia::<nome>` e `relevancia::<alta|media|baixa>` (usando dados de `/data/relevancia_topicos.json`).
- **FR-007**: O sistema DEVE enviar flashcards em batch via AnkiConnect, com contagem e confirmação prévia.
- **FR-008**: O sistema DEVE detectar flashcards duplicados (mesmo front no mesmo deck) e pular, registrando no log.
- **FR-009**: Quando AnkiConnect não estiver disponível, o sistema DEVE salvar flashcards em `/data/anki_export_<materia>_<data>.txt` no formato tab-separated (frente, verso, tags) importável pelo Anki.
- **FR-010**: O sistema DEVE informar ao usuário o resultado da exportação: total enviados, sucesso, erros, duplicatas.
- **FR-011**: O sistema DEVE solicitar confirmação do usuário antes de enviar batch ao Anki ou criar novo deck.

### Key Entities

- **Flashcard**: Unidade de estudo. Atributos: frente (L0), verso (L1+L2), tags (lista), deck, status (enviado/duplicado/erro/pendente).
- **Deck**: Baralho no Anki. Atributos: nome, contagem de cards, correspondência com matéria.
- **Arquivo de Fallback**: Exportação offline. Atributos: caminho, formato (tab-separated), matéria, data, status (pendente/importado).

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% dos flashcards exportados possuem tags de matéria. Tags de relevância estão presentes quando classificação foi executada.
- **SC-002**: 0% de duplicatas são enviadas ao Anki (todas detectadas e puladas).
- **SC-003**: Quando AnkiConnect está indisponível, 100% dos casos geram arquivo de fallback importável.
- **SC-004**: 0% de operações destrutivas (criação de deck, envio batch) ocorrem sem confirmação do usuário.

## Assumptions

- O usuário possui Anki Desktop instalado e AnkiConnect (add-on 2055492159) configurado.
- AnkiConnect opera na porta 8765 (padrão).
- O modelo de card padrão ("Basic") é suficiente para frente/verso; modelos customizados não são escopo v1.
- Os flashcards são gerados a partir dos tópicos (matéria). Flashcards a partir de questões não são escopo v1.
- Formato tab-separated é suportado pelo Anki File > Import sem plugins adicionais.
