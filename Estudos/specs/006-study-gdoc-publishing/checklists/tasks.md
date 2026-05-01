# Checklist de Tasks: Study Google Docs Publishing

**Objetivo**: Validar se as tasks de `006-study-gdoc-publishing` estão claras, completas e prontas para implementação — cada item testa a qualidade do que foi escrito nas tasks, não se o código funciona.
**Criado em**: 2026-04-30
**Feature**: [spec.md](../spec.md) | [tasks.md](../tasks.md)

## Completude das Tasks

- [ ] CHK001 A Fase 2 (Fundação) cobre as DUAS componentes pré-requisito: autenticação Google (T003, Facade) E versionamento local (T004–T006, Naming Convention) — ambas bloqueantes para US1? [Completude, Spec §FR-004, plan.md §Constitution IV]
- [ ] CHK002 US1 tem task para o tratamento de falha de API (T011) — quando Google Docs falha, o sistema informa que versão local foi salva e permite retry posterior? [Completude, Spec §FR-008]
- [ ] CHK003 US3 tem task para atualizar o campo `gdoc_url` no frontmatter Markdown após publicação bem-sucedida (T015) — o link do doc publicado é registrado no arquivo local? [Completude, Spec §FR-005, US3 cenário 4]
- [ ] CHK004 US4 tem task para `gerar_diff()` (T016) especificando o uso de `difflib` (stdlib) como implementação? [Completude, Spec §FR-010]

## Clareza e Responsabilidade Única

- [ ] CHK005 T010 (`publicar_resumo`) tem responsabilidade única de orquestração Template Method — delega formatação para `gdoc_formatter.py`, autenticação para `google_auth.py` e versionamento para `version_manager.py` sem reimplementar? [Clareza, Princípio VI]
- [ ] CHK006 A ordem dos 7 passos do Template Method em T010 está explicitamente definida na descrição: passo 2 (salvar Markdown LOCAL) obrigatoriamente antes do passo 5 (chamar API Google)? [Clareza, plan.md §Constitution IV]
- [ ] CHK007 T012 (`formatar_questoes_para_requests`) está separada de T007 (`formatar_resumo_para_requests`) — as duas formatações têm tasks distintas que variam apenas a lógica de montagem dos batch requests? [Clareza, plan.md §Template Method]

## Caminhos de Arquivo

- [ ] CHK008 Todas as tasks de US1–US4 especificam o caminho exato em `.github/skills/study-gdoc/*.py`? [Caminhos]
- [ ] CHK009 As tasks de versionamento (T006, T010, T013) referenciam os caminhos corretos de destino: `/Histórico Anotações/Resumo/` para resumos e `/Histórico Anotações/Questões/` para questões? [Caminhos, Spec §FR-004]

## Checkpoints e Padrões de Design (Princípio IX)

- [ ] CHK010 O checkpoint da Fase 2 nomeia DOIS padrões distintos: "Padrão Facade" (autenticação OAuth encapsulada) E "Naming Convention Versioning" (versionamento por nome de arquivo)? [Princípio IX]
- [ ] CHK011 O checkpoint da Fase 3 nomeia "Padrão Adapter + Template Method" — Adapter = `gdoc_connector.py` traduz para JSON da API; Template Method = esqueleto de 7 passos reutilizável? [Princípio IX]
- [ ] CHK012 O checkpoint da Fase 4 confirma que o Padrão Template Method é reutilizado — apenas `_formatar_questoes` varia em relação a `_formatar_resumo`, o esqueleto permanece igual? [Princípio IX]

## Cobertura de Histórias de Usuário e Casos de Borda

- [ ] CHK013 O edge case crítico de `credentials.json` ausente tem task explícita de tratamento (T019) com instrução PT-BR ao usuário sobre como obter e configurar as credenciais OAuth? [Caso de Borda, Spec §Assumptions]
- [ ] CHK014 Constitution IV (Markdown ANTES de publicar) é verificável pela task T010 — a ordem dos 7 passos impossibilita que o passo 5 (API) ocorra antes do passo 2 (local)? [Mensurabilidade, Spec §SC-002]
- [ ] CHK015 SC-004 (0% de publicações sem confirmação) é verificável pela task T010 — o passo de confirmação (passo 3) é obrigatório no esqueleto Template Method e não pode ser pulado? [Mensurabilidade, Spec §SC-004]

## Paralelismo e Dependências

- [ ] CHK016 T003, T004 e T005 (Fundação) são paralelas — autenticação (`google_auth.py`) e funções de versionamento (`version_manager.py`) são arquivos e responsabilidades completamente independentes? [Paralelismo]
- [ ] CHK017 T007 e T008 (US1) são paralelas — `gdoc_formatter.py` (formatação) e `gdoc_connector.py` (Adapter) são arquivos distintos sem dependência mútua para desenvolvimento? [Paralelismo]
- [ ] CHK018 A dependência US1 → Fundação está explícita: `publicar_resumo()` precisa de `get_service()` (T003) E `salvar_versao()` (T006) prontos para funcionar? [Dependências]

## Notas

- Marque os itens como concluídos: `- [x]`
- Esta checklist valida os REQUISITOS das tasks — não testa se o código implementado funciona
- Execute antes de iniciar a Fase 1 e revise novamente antes de iniciar cada US
- **Atenção especial**: CHK014 (Constitution IV) é a regra mais crítica desta spec — qualquer task que inverta a ordem salvar-local → publicar-remoto é uma violação arquitetural sem exceção
