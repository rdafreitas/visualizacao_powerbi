# Configuração Segura de Credenciais — gsheet-rotina

## Camadas de segurança implementadas

```
Camada 1 · .gitignore         → impede que .env e JSONs entrem no staging
Camada 2 · Variáveis de ambiente do Windows → credenciais fora de arquivos
Camada 3 · JSON fora do projeto → service account em pasta protegida
Camada 4 · Pre-commit hook    → última defesa antes do commit
Camada 5 · Princípio do menor privilégio → escopo mínimo por serviço
```

---

## Método recomendado: Variáveis de Ambiente do Windows (sem arquivo .env)

A forma mais segura em Windows é definir as variáveis diretamente no perfil do usuário, sem nenhum arquivo no projeto. Abra o PowerShell e execute:

```powershell
# Habitica
[System.Environment]::SetEnvironmentVariable("HABITICA_USER_ID",    "seu-user-id",    "User")
[System.Environment]::SetEnvironmentVariable("HABITICA_API_TOKEN",   "seu-api-token",  "User")

# Toggl Track
[System.Environment]::SetEnvironmentVariable("TOGGL_API_TOKEN",      "seu-api-token",  "User")

# Google Sheets
[System.Environment]::SetEnvironmentVariable("GOOGLE_SHEET_ID",      "id-da-planilha", "User")
[System.Environment]::SetEnvironmentVariable("GOOGLE_SERVICE_ACCOUNT_JSON",
    "C:\Users\seu-usuario\.credentials\gsheet-rotina-sa.json", "User")
```

> `"User"` = persiste para o seu usuário do Windows, sem aparecer em nenhum arquivo versionável.
> Reinicie o terminal após definir para que as variáveis sejam carregadas.

Para verificar se foram definidas corretamente:

```powershell
[System.Environment]::GetEnvironmentVariable("HABITICA_USER_ID", "User")
```

---

## Alternativa: arquivo .env (uso local apenas)

Se preferir um arquivo `.env` na raiz da pasta `Rotina/`:

```bash
# Copiar o template (executar dentro da pasta Rotina/)
copy .env.example .env

# Editar com os valores reais
notepad .env
```

**O arquivo `.env` já está no `.gitignore` desta pasta.** Mesmo assim, nunca o adicione manualmente ao git.

---

## Service Account do Google (JSON)

### Onde salvar

Salve o arquivo JSON **fora da pasta do projeto**, em:

```
C:\Users\renan.dalexandro\.credentials\gsheet-rotina-sa.json
```

Para criar a pasta:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.credentials"
```

### Princípio do menor privilégio — Google

A service account deve ter somente as permissões mínimas necessárias:

| Permissão | Nível | Motivo |
|---|---|---|
| Google Sheets API | Leitura + Escrita | Ler e atualizar a planilha |
| Google Drive API | **Não necessário** | Não precisa listar ou mover arquivos |

Na planilha, compartilhe somente com o e-mail da service account (ex.: `gsheet-rotina@projeto.iam.gserviceaccount.com`) com papel **Editor** — não de Proprietário.

---

## Princípio do menor privilégio — Habitica

O token de API do Habitica tem acesso completo à conta. Medidas para minimizar risco:

- Nunca compartilhe o token.
- Rotacione o token em: Habitica → Configurações → API → **Reset API Token** se suspeitar de vazamento.
- O campo `x-client` nas requisições identifica o app — use sempre `gsheet-rotina`.

---

## Princípio do menor privilégio — Toggl Track

O token de API do Toggl dá acesso de leitura e escrita ao workspace padrão.

- Rotacione em: track.toggl.com → Perfil → **Reset API Token**.
- O token não tem escopos granulares — mantenha-o em segredo.

---

## Verificar se há segredos no histórico git

Execute antes de qualquer push:

```bash
# Busca por padrões comuns de tokens no histórico
git log --all --oneline --format="%H %s" | head -20

# Busca por conteúdo sensível nos arquivos rastreados
git grep -n "HABITICA_API_TOKEN\|TOGGL_API_TOKEN\|service_account" $(git rev-list --all)
```

Se encontrar credenciais no histórico, use `git filter-repo` para removê-las antes de qualquer push.

---

## O que NUNCA fazer

| Ação proibida | Risco |
|---|---|
| Commitar `.env` | Exposição permanente no histórico git |
| Commitar o JSON da service account | Acesso irrestrito à planilha |
| Hardcodar tokens no código | Difícil de revogar e rastrear |
| Usar a conta pessoal do Google como service account | Sem como revogar seletivamente |
| Compartilhar a planilha com a service account como Proprietário | Excesso de permissão |
