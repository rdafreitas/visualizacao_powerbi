# Quickstart: Study Google Docs Publishing

**Feature**: `006-study-gdoc-publishing` | **Date**: 2026-04-30

> Este guia mostra como testar cada User Story manualmente, passo a passo.
> **Comece pelo US3** (versionamento local) — ele não precisa de autenticação Google
> e garante que a parte mais importante (salvar local) funciona antes de tocar na API.

---

## Pré-requisitos Gerais (verificar antes de começar)

- [ ] Python 3.11+ instalado (`python --version`)
- [ ] Spec 002 implementada: `study-memory.json` existe na raiz e `/logs/` existe
- [ ] Spec 004 implementada: `/data/topicos.json`, `/data/questoes.json` e `/data/_topicos.txt` existem
- [ ] Spec 005 implementada: `/data/relevancia_topicos.json` e `/data/relevancia_questoes.json` existem
- [ ] Diretório `/Histórico Anotações/` existe (ou será criado automaticamente)

**Instalar dependências Google** (apenas para US1 e US2 — não necessário para US3):
```bash
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
```

---

## Passo 0 — Configurar `credentials.json` (necessário para US1 e US2)

> **O que é `credentials.json`?** É o arquivo que prova para o Google que sua aplicação
> tem permissão para usar a Google Docs API. Você cria uma vez no Google Cloud Console
> e nunca mais precisa criar novamente (a menos que revogue).

### Passo a passo simplificado

1. **Acesse o Google Cloud Console**: https://console.cloud.google.com
   - Faça login com a conta Google de teste que você usará

2. **Crie um projeto** (ou use um existente):
   - Clique em "Select a project" → "New Project"
   - Nome sugerido: `study-concurso-agent`
   - Clique em "Create"

3. **Ative a Google Docs API**:
   - Menu lateral → "APIs & Services" → "Library"
   - Pesquise "Google Docs API" → clique no resultado → clique em "Enable"

4. **Configure a tela de consentimento OAuth**:
   - Menu lateral → "APIs & Services" → "OAuth consent screen"
   - Selecione "External" → clique em "Create"
   - Preencha apenas os campos obrigatórios:
     - App name: `Study Concurso Agent`
     - User support email: seu e-mail
     - Developer contact: seu e-mail
   - Clique em "Save and Continue" em todas as etapas
   - Na etapa "Test users": clique em "Add users" e adicione seu e-mail de teste

5. **Crie as credenciais OAuth**:
   - Menu lateral → "APIs & Services" → "Credentials"
   - Clique em "+ Create Credentials" → "OAuth client ID"
   - Application type: **Desktop app**
   - Name: `study-agent-desktop`
   - Clique em "Create"

6. **Baixe o arquivo**:
   - Na tela de confirmação, clique em "Download JSON"
   - Renomeie o arquivo para `credentials.json`
   - **Mova para a raiz do projeto** (mesmo diretório de `study-memory.json`)

7. **Verificar**:
   ```bash
   ls credentials.json
   # Deve existir: credentials.json
   ```

> **Dica**: `token.json` será criado automaticamente na primeira execução. Você não
> precisa criá-lo manualmente.

---

## User Story 3 — Versionamento Local Markdown (COMEÇAR AQUI)

**Objetivo**: Verificar que o `version_manager.py` salva e lista versões corretamente.
**Por que primeiro**: Não precisa de autenticação Google. Se isso falhar, nada mais funciona.

### Teste 1: Salvar versão de resumo

```bash
python .github/skills/study-gdoc/version_manager.py \
  --salvar \
  --tipo resumo \
  --materia "Direito Constitucional" \
  --banca "CESPE"
```

**Saída esperada**:
```
Salvando versão local...
✅ Arquivo salvo: /Histórico Anotações/Resumo/resumo_direito-constitucional_2026-04-30.md
   Matéria: Direito Constitucional
   Tipo: resumo
   Nota: gdoc_url será atualizado após publicação no Google Docs.
```

**Verificar manualmente**:
- [ ] Arquivo existe em `/Histórico Anotações/Resumo/`
- [ ] Abrindo o arquivo, frontmatter tem `materia`, `banca`, `data`, `tipo`
- [ ] Campo `gdoc_url` está como `null`
- [ ] Conteúdo Markdown abaixo do `---` tem o outline formatado

### Teste 2: Listar versões existentes

Depois de salvar 2+ versões (execute o comando acima mais uma vez em dia diferente,
ou com sufixo de hora diferente):

```bash
python .github/skills/study-gdoc/version_manager.py \
  --listar \
  --tipo resumo \
  --materia "Direito Constitucional"
```

**Saída esperada**:
```
Versões de resumo — Direito Constitucional:

  1. 2026-04-30  resumo_direito-constitucional_2026-04-30.md
     Google Doc: (ainda não publicado)

  2. 2026-04-29  resumo_direito-constitucional_2026-04-29.md
     Google Doc: https://docs.google.com/document/d/ABC123/edit
```

**Cenários para verificar**:
- [ ] Versões listadas em ordem cronológica reversa (mais recente primeiro)
- [ ] URL exibida quando `gdoc_url` está preenchido no frontmatter
- [ ] "(ainda não publicado)" quando `gdoc_url` é null

### Teste 3: Colisão no mesmo dia

Execute o salvar duas vezes no mesmo dia:

```bash
# Primeira execução (cria sem sufixo de hora)
python .github/skills/study-gdoc/version_manager.py --salvar --tipo resumo --materia "Português" --banca "CESPE"

# Segunda execução no mesmo dia (deve usar sufixo _HH-MM)
python .github/skills/study-gdoc/version_manager.py --salvar --tipo resumo --materia "Português" --banca "CESPE"
```

**Saída esperada na segunda execução**:
```
Arquivo do dia já existe. Usando sufixo temporal.
✅ Arquivo salvo: /Histórico Anotações/Resumo/resumo_portugues_2026-04-30_10-45.md
```

---

## User Story 4 — Diff entre Versões

**Pré-requisito**: Pelo menos 2 versões existentes para a mesma matéria.

```bash
python .github/skills/study-gdoc/version_manager.py \
  --diff \
  --tipo resumo \
  --materia "Direito Constitucional" \
  --versao-a "resumo_direito-constitucional_2026-04-29.md" \
  --versao-b "resumo_direito-constitucional_2026-04-30.md"
```

**Saída esperada**:
```
Comparando versões:
  Antes:  resumo_direito-constitucional_2026-04-29.md (2026-04-29)
  Depois: resumo_direito-constitucional_2026-04-30.md (2026-04-30)

Adicionados: 3 tópicos
  + 🔥 1.3 Princípio da Proporcionalidade
  + ⚠️ 2.4 Habeas Corpus
  + 📝 5.1 Emendas Constitucionais

Removidos: 1 tópico
  - 📝 4.2 Disposições Transitórias

Alterados: 1 linha
  → "❖ 1.1 Princípio da Legalidade" → "❖ 1.1 Princípio da Legalidade (Art. 5º, II)"
```

---

## User Story 1 — Publicar Resumo no Google Docs

**Pré-requisito**: `credentials.json` configurado (ver Passo 0 acima).

```bash
python .github/skills/study-gdoc/gdoc_service.py --publicar-resumo
```

**Fluxo completo esperado**:
```
Lendo topicos.json... 35 tópicos encontrados.
Lendo relevancia_topicos.json... 35 classificações encontradas.

Resumo a publicar:
  Matéria: Direito Constitucional
  Banca:   CESPE
  Tópicos: 35 (🔥 12 alta | ⚠️ 15 média | 📝 8 baixa)

Confirmar publicação no Google Docs? [S/n]: S

[1/4] Salvando versão Markdown local...
✅ Salvo: /Histórico Anotações/Resumo/resumo_direito-constitucional_2026-04-30.md

[2/4] Autenticando com Google...
✅ Autenticado (token.json válido)

[3/4] Criando Google Doc e aplicando formatação...
✅ Documento criado: "Resumo — Direito Constitucional (CESPE) 2026-04-30"

[4/4] Registrando URL na memória...
✅ URL registrada em study-memory.json

Publicação concluída!
Google Doc: https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
```

**Primeira execução (sem `token.json`)**: Um browser abrirá para você autorizar o acesso.
Autorize com a conta Google de teste configurada no Passo 0. Após autorizar, a execução
continua automaticamente.

### Verificar que o Google Doc foi criado corretamente

1. **Abra a URL** exibida no terminal no browser
2. **Verifique a hierarquia visual**:
   - [ ] Tópicos L0 sem indentação, com numeração (1., 2., 3....)
   - [ ] Tópicos L1 com leve indentação e marcador ❖
   - [ ] Tópicos L2 com mais indentação e marcador ➤
3. **Verifique as cores**:
   - [ ] Tópicos com 🔥 aparecem em **vermelho** (alta relevância)
   - [ ] Tópicos com ⚠️ aparecem em **laranja/amarelo** (média relevância)
   - [ ] Tópicos com 📝 aparecem em **cinza** (baixa relevância)
4. **Verifique o Markdown local**:
   - [ ] Abrir o `.md` correspondente em `/Histórico Anotações/Resumo/`
   - [ ] Campo `gdoc_url` no frontmatter deve conter a URL do documento

**Cenários para verificar**:
- [ ] Google Doc cancelado (Ctrl+C durante publicação) → Markdown local já foi salvo
- [ ] Executar sem `credentials.json` → mensagem de erro clara em PT-BR
- [ ] Executar com `token.json` corrompido → mensagem instrui deletar o arquivo

---

## User Story 2 — Publicar Questões no Google Docs

**Pré-requisito**: `credentials.json` configurado; `/data/questoes.json` e
`/data/relevancia_questoes.json` existentes.

```bash
python .github/skills/study-gdoc/gdoc_service.py --publicar-questoes
```

**Saída esperada**:
```
Lendo questoes.json... 42 questões encontradas.
Lendo relevancia_questoes.json... 42 classificações encontradas.

Questões a publicar:
  Matéria: Direito Constitucional
  Banca:   CESPE
  Total:   42 questões (🔥 15 | ⚠️ 20 | 📝 7)

Confirmar publicação no Google Docs? [S/n]: S

[1/4] Salvando versão Markdown local...
✅ Salvo: /Histórico Anotações/Questões/questoes_direito-constitucional_2026-04-30.md

[2/4] Autenticando com Google...
✅ Autenticado

[3/4] Criando Google Doc de questões...
✅ Documento criado: "Questões — Direito Constitucional (CESPE) 2026-04-30"

[4/4] Registrando URL...
✅ URL registrada em study-memory.json

Google Doc: https://docs.google.com/document/d/XYZ789/edit
```

**Verificar no Google Doc**:
- [ ] Seções separadas por relevância: `🔥 Alta Relevância`, `⚠️ Média Relevância`, `📝 Baixa Relevância`
- [ ] Enunciado de cada questão com ícone de relevância antes
- [ ] Alternativas (A, B, C, D, E) com indentação
- [ ] Gabarito ao final de cada questão

---

## Verificação de Erros Comuns

### `credentials.json` não encontrado
```
❌ Arquivo credentials.json não encontrado.
   Para criar: siga o guia em specs/006-study-gdoc-publishing/quickstart.md (Passo 0)
```

### Token expirado / inválido
Se aparecer erro de autenticação após usar por um tempo:
```bash
# Deletar token.json e reautenticar
rm token.json
python .github/skills/study-gdoc/gdoc_service.py --publicar-resumo
# Browser abrirá novamente para reautorizar
```

### Google API indisponível (sem internet)
```
⚠️ Não foi possível conectar à Google Docs API.
   Causa provável: sem conexão com a internet.

   A versão Markdown local JÁ FOI SALVA com sucesso:
   /Histórico Anotações/Resumo/resumo_direito-constitucional_2026-04-30.md

   Para publicar quando a conexão for restabelecida, execute novamente o comando.
```

---

## Verificação Final (após todos os testes)

```bash
# Verificar que URLs foram registradas em study-memory.json
python -c "
import json
mem = json.load(open('study-memory.json'))
urls = mem.get('gdoc_urls', {})
print('GDoc URLs registradas:')
for tipo, materias in urls.items():
    for mat, info in materias.items():
        print(f'  [{tipo}] {mat}: {info[\"url\"]}')
"
```

```bash
# Listar todos os arquivos de histórico criados
python .github/skills/study-gdoc/version_manager.py --listar-todos
```

Deve exibir todos os arquivos Markdown criados durante os testes, com suas datas e URLs.
