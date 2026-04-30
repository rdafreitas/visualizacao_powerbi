# Tarefas: Study Google Docs Publishing

**Entrada**: Documentos de design em `/specs/006-study-gdoc-publishing/`
**Pré-requisitos**: plan.md, spec.md, data-model.md, contracts/
**Dependências obrigatórias**: 002-study-foundation, 004-study-summary-generation, 005-study-relevance-engine.

**Organização**: Tarefas agrupadas por história de usuário para implementação e teste independentes.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[US?]**: História de usuário a que a tarefa pertence

---

## Fase 1: Setup (Infraestrutura da Skill)

**Objetivo**: Criar estrutura de arquivos e verificar dependências Python antes de qualquer implementação.

- [ ] T001 Criar diretório `.github/skills/study-gdoc/` e arquivo `.github/skills/study-gdoc/__init__.py` vazio
- [ ] T002 Verificar e documentar em `specs/006-study-gdoc-publishing/quickstart.md` o comando de instalação das dependências: `pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib`

**Checkpoint**: Estrutura criada e dependências identificadas — implementação pode começar.

---

## Fase 2: Fundação — Autenticação Google e Versionamento Local

**Objetivo**: Criar `google_auth.py` (autenticação OAuth) e `version_manager.py` (salvamento Markdown local). Ambos são pré-requisitos bloqueantes: sem autenticação, nenhuma publicação funciona; sem `version_manager.py`, nenhuma publicação pode ocorrer (Constitution IV exige Markdown antes de publicar).

**⚠️ CRÍTICO**: A ordem de operações é imutável por Constitution IV: (1) salvar Markdown local, (2) publicar no Google Docs. Se o passo 1 falhar, o passo 2 não acontece.

- [ ] T003 [P] Implementar `get_service(api, version)` em `.github/skills/study-gdoc/google_auth.py` — encapsula fluxo OAuth completo: lê `credentials.json`, verifica/renova `token.json`, abre browser no primeiro uso (Padrão Facade — interface simples: retorna serviço Google pronto) (FR-001, plan.md Fase 1)
- [ ] T004 [P] Implementar `gerar_nome_arquivo(tipo, materia, data, hora)` em `.github/skills/study-gdoc/version_manager.py` — gera nome no formato `<tipo>_<materia>_<YYYY-MM-DD>[_HH-MM].md`; usa sufixo `_HH-MM` quando arquivo do mesmo dia já existe (Padrão Naming Convention Versioning) (FR-011)
- [ ] T005 [P] Implementar `gerar_frontmatter(materia, banca, data, tipo, gdoc_url)` em `.github/skills/study-gdoc/version_manager.py` — retorna string YAML frontmatter com campos: materia, banca, data, tipo, gdoc_url (FR-005)
- [ ] T006 Implementar `salvar_versao(conteudo_markdown, tipo, materia, workspace_dir, banca, gdoc_url)` em `.github/skills/study-gdoc/version_manager.py` — determina caminho em `/Histórico Anotações/Resumo/` ou `/Histórico Anotações/Questões/` conforme `tipo`; gera nome com `gerar_nome_arquivo`; escreve arquivo com frontmatter + conteúdo (FR-004, FR-005)

**Checkpoint**: Fundação completa — Facade de autenticação (`get_service()`) e Naming Convention Versioning (`salvar_versao()`) prontos. US3 (versionamento) pode ser testado independentemente sem autenticação Google.

---

## Fase 3: História de Usuário 1 — Publicação do Resumo em Google Docs (Prioridade: P1) 🎯 MVP

**Objetivo**: Resumo hierárquico (outline L0–L3) é publicado em Google Docs preservando numeração, marcadores (❖/➤/■) e cores por relevância (🔥 vermelho, ⚠️ amarelo, 📝 cinza).

**Teste Independente**: Com `_topicos.txt` e `relevancia_topicos.json` existentes, invocar publicação e verificar Google Doc criado com hierarquia visual e cores corretas por relevância.

- [ ] T007 [P] Implementar `formatar_resumo_para_requests(topicos_txt, relevancia_dict) -> list` em `.github/skills/study-gdoc/gdoc_formatter.py` — converte outline L0–L3 em lista de batch requests Google Docs com: numeração de títulos, marcadores por nível, indentação progressiva e cores (🔥 = vermelho RGB, ⚠️ = amarelo RGB, 📝 = cinza RGB) (FR-001, FR-003)
- [ ] T008 [P] Implementar `criar_documento(service, titulo) -> str` em `.github/skills/study-gdoc/gdoc_connector.py` — cria novo Google Doc com título; retorna URL do documento (Padrão Adapter — traduz chamada de alto nível para JSON `batchUpdate` da Google Docs API) (FR-001)
- [ ] T009 Implementar `aplicar_formatacao(service, doc_id, requests_list)` em `.github/skills/study-gdoc/gdoc_connector.py` — envia batch requests de formatação ao documento; trata erros de API com mensagem PT-BR (Padrão Adapter) (FR-001, FR-003)
- [ ] T010 Implementar `publicar_resumo(workspace_dir, materia, banca, debug_mode)` em `.github/skills/study-gdoc/gdoc_service.py` — esqueleto Template Method para publicação do resumo: (1) gerar conteúdo em memória, (2) `salvar_versao` Markdown LOCAL, (3) solicitar confirmação via Foundation, (4) `get_service`, (5) `criar_documento` + `aplicar_formatacao`, (6) atualizar `gdoc_url` no frontmatter Markdown local, (7) registrar URL na memória e no log (Padrão Template Method) (FR-001, FR-002, FR-004, FR-006, FR-007)
- [ ] T011 Implementar tratamento de falha de API em `publicar_resumo()` — quando Google Docs API falha, informa ao usuário "Versão local salva com sucesso em [caminho]. Publicação pode ser tentada novamente." sem marcar fase como falha permanente (FR-008)

**Checkpoint**: Padrão Adapter + Template Method completo — `gdoc_connector.py` é o único arquivo que fala com a Google Docs API; `gdoc_service.py` define o esqueleto de 7 passos que será reutilizado por US2. Publicação do resumo funcional end-to-end.

---

## Fase 4: História de Usuário 2 — Publicação de Questões em Google Docs (Prioridade: P2)

**Objetivo**: Questões classificadas são publicadas em Google Doc separado, organizadas em seções 🔥/⚠️/📝 com alternativas indentadas e gabarito ao final de cada bloco.

**Teste Independente**: Com `questoes.json` e `relevancia_questoes.json` existentes, invocar publicação e verificar Google Doc separado criado com seções por relevância.

- [ ] T012 Implementar `formatar_questoes_para_requests(questoes, relevancia_dict) -> list` em `.github/skills/study-gdoc/gdoc_formatter.py` — gera batch requests para: seções por relevância (🔥/⚠️/📝), enunciado com ícone, alternativas indentadas, gabarito ao final do bloco (FR-002, FR-003)
- [ ] T013 Implementar `publicar_questoes(workspace_dir, materia, banca, debug_mode)` em `.github/skills/study-gdoc/gdoc_service.py` — reutiliza esqueleto Template Method da Fase 3; substitui apenas `_formatar_resumo` por `_formatar_questoes`; exibe contagem de questões por nível antes da confirmação (FR-002, FR-006)

**Checkpoint**: Padrão Template Method reutilizado — `publicar_questoes()` compartilha os 7 passos do esqueleto com `publicar_resumo()`; apenas a etapa de formatação varia.

---

## Fase 5: História de Usuário 3 — Versionamento Local Markdown (Prioridade: P3)

**Objetivo**: Verificar que o salvamento Markdown local (Constitution IV) funciona corretamente de forma independente — antes de qualquer chamada à Google Docs API.

**Teste Independente**: Invocar publicação e verificar que arquivo Markdown é salvo em `/Histórico Anotações/` ANTES da chamada ao Google Docs API; verificar frontmatter correto; verificar sufixo `_HH-MM` na segunda publicação do mesmo dia.

- [ ] T014 Implementar `listar_versoes(tipo, workspace_dir) -> list` em `.github/skills/study-gdoc/version_manager.py` — lista arquivos em `/Histórico Anotações/Resumo/` ou `/Questões/` conforme `tipo`; retorna lista com: nome do arquivo, data, matéria e gdoc_url do frontmatter (FR-009)
- [ ] T015 Adicionar atualização do campo `gdoc_url` no frontmatter Markdown após publicação bem-sucedida em `publicar_resumo()` e `publicar_questoes()` em `.github/skills/study-gdoc/gdoc_service.py` — reescreve apenas a linha `gdoc_url:` no arquivo já salvo (FR-005, US3 cenário 4)

**Checkpoint**: Versionamento local completo e verificável de forma independente — salvamento Markdown-first funciona mesmo quando Google Docs API está indisponível (SC-002, SC-003).

---

## Fase 6: História de Usuário 4 — Consulta de Versões Anteriores (Prioridade: P4)

**Objetivo**: Usuário pode listar versões anteriores e comparar duas versões com diff simplificado.

**Teste Independente**: Com 2+ versões em `/Histórico Anotações/Resumo/`, invocar listagem e verificar que todas as versões são retornadas com datas e URLs.

- [ ] T016 Implementar `gerar_diff(caminho_v1, caminho_v2) -> str` em `.github/skills/study-gdoc/version_manager.py` — usa `difflib.unified_diff` para comparar dois arquivos Markdown; retorna diff simplificado mostrando tópicos adicionados (+), removidos (-) e alterados (FR-010)
- [ ] T017 Implementar `exibir_versoes(tipo, workspace_dir)` em `.github/skills/study-gdoc/gdoc_service.py` — chama `listar_versoes()` e exibe resultado formatado em PT-BR com: índice, data, matéria e URL do Google Doc quando disponível (FR-009)

**Checkpoint**: Consulta de versões completa — usuário pode listar histórico e comparar versões sem autenticação Google.

---

## Fase Final: Polimento e Aspectos Transversais

**Objetivo**: Garantir conformidade com requisitos não-funcionais e casos extremos.

- [ ] T018 [P] Revisar todas as mensagens ao usuário em `.github/skills/study-gdoc/` — garantir 100% em PT-BR
- [ ] T019 [P] Adicionar tratamento de `credentials.json` ausente em `google_auth.py` — instrução clara ao usuário sobre onde obter e como configurar as credenciais OAuth (edge case crítico)
- [ ] T020 [P] Adicionar tratamento de token expirado em `google_auth.py` — renovar token automaticamente sem intervenção do usuário quando possível (FR-001)
- [ ] T021 Validar todos os cenários de teste de `specs/006-study-gdoc-publishing/quickstart.md` — executar com conta Google real e verificar SC-001 a SC-005

---

## Dependências e Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: Sem dependências
- **Fundação (Fase 2)**: Depende de Fase 1 — BLOQUEIA todas as histórias
- **US1 (Fase 3)**: Depende da Fundação (google_auth + version_manager base)
- **US2 (Fase 4)**: Depende de US1 — reutiliza Template Method do gdoc_service
- **US3 (Fase 5)**: Valida o que foi construído na Fundação + US1 + US2
- **US4 (Fase 6)**: Depende de US3 (listar_versoes) + qualquer publicação anterior
- **Polimento**: Depende de todas as histórias

### Dependências com Outras Specs

- **Entrada obrigatória**: 002 (memória, logging, confirmação); 004 (`topicos.json`, `questoes.json`, `_topicos.txt`); 005 (`relevancia_topicos.json`, `relevancia_questoes.json`)
- **Saída**: Google Docs publicados + arquivos Markdown em `/Histórico Anotações/`

### Oportunidades de Paralelismo

- T003, T004 e T005 (Fundação): autenticação e versionamento são arquivos completamente distintos
- T007 e T008 (US1): formatador e conector são arquivos distintos sem dependência mútua

---

## Estratégia de Implementação

### MVP Primeiro (US1 + Constitution IV obrigatória)

1. Completar Fase 1: Setup
2. Completar Fase 2: Fundação (google_auth + version_manager)
3. Completar Fase 3: US1 (Publicação do resumo)
4. **PARAR e VALIDAR**: Markdown salvo antes da publicação + Google Doc com cores corretas
5. Continuar US2 → US3 (validação) → US4

### Entrega Incremental

1. Setup + Fundação → Autenticação e versionamento local prontos
2. US3 independente (Markdown local) → salvamento local verificado SEM Google Auth
3. US1 (Resumo) → publicação principal funcional
4. US2 (Questões) → Google Doc de exercícios
5. US4 (Histórico) → rastreabilidade completa

---

## Notas

- Tarefas [P] = arquivos ou funções distintas, sem dependências entre si naquela fase
- **Constitution IV é lei absoluta**: `salvar_versao()` DEVE ser chamado ANTES de qualquer chamada à Google Docs API — inspecionar `publicar_resumo()` e `publicar_questoes()` para confirmar ordem
- **Princípio IX**: `gdoc_service.py` nomeia explicitamente o Padrão Template Method no checkpoint — os 7 passos são o "esqueleto" compartilhado; apenas a formatação varia entre resumo e questões
