# Specialist: meta-crud

Gerencia a criação e edição de **Metas** na aba `METAS` da planilha.

## Estrutura da Aba METAS

| Coluna | Campo | Exemplo |
|---|---|---|
| A | ID | `M01` |
| B | Categoria | `Marketing` |
| C | Nome da Meta | `Crescer presença digital` |
| D | Título completo | `[Marketing] M01 · Crescer presença digital` |
| E | Descrição | `Aumentar seguidores e engajamento...` |
| F | Data de Início | `01/04/2026` |
| G | Data de Fim | `30/06/2026` |
| H | Status | `Ativa` / `Concluída` / `Pausada` |

## Criar Nova Meta

### 1. Coletar informações do usuário

Perguntar sequencialmente (ou aceitar em linguagem natural):

```
Nome da meta: _______________
Categoria   : _______________
Descrição   : _______________
Data de fim : ___/___/______
```

### 2. Detectar duplicatas

```python
metas_existentes = [row[2] for row in rows]  # coluna C
duplicatas = detectar_duplicata(nome_novo, metas_existentes)
```

Se encontrar, exibir aviso e aguardar confirmação (ver `crud-planner/SKILL.md`).

### 3. Gerar ID automático

```python
ids_existentes = [row[0] for row in rows if row]
ultimo_num = max([int(i[1:]) for i in ids_existentes if i.startswith('M')], default=0)
novo_id = f"M{str(ultimo_num + 1).zfill(2)}"
```

### 4. Montar título completo

```python
titulo = f"[{categoria}] {novo_id} · {nome}"
```

### 5. Gravar na planilha

```python
nova_linha = [novo_id, categoria, nome, titulo, descricao, data_inicio, data_fim, 'Ativa']
service.spreadsheets().values().append(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range="'METAS'!A:H",
    valueInputOption='USER_ENTERED',
    insertDataOption='INSERT_ROWS',
    body={'values': [nova_linha]}
).execute()
```

### 6. Confirmar

```
✔ Meta criada com sucesso!
  ID      : M04
  Título  : [Marketing] M04 · Nome da meta
  Status  : Ativa
```

## Editar Meta Existente

### 1. Localizar por ID ou nome

Apresentar lista de metas ativas para seleção, ou aceitar ID direto.

### 2. Exibir valores atuais e solicitar novos

Mostrar campo a campo o valor atual e permitir alterar ou manter com Enter.

### 3. Atualizar linha na planilha

```python
# Encontrar número da linha pelo ID
linha_num = next(i+2 for i, row in enumerate(rows) if row[0] == meta_id)

service.spreadsheets().values().update(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range=f"'METAS'!A{linha_num}:H{linha_num}",
    valueInputOption='USER_ENTERED',
    body={'values': [linha_atualizada]}
).execute()
```

## Regras de Negócio

- Não é possível excluir uma meta que possui Ações associadas. Oferecer "Pausar" como alternativa.
- Alterar o nome de uma meta não propaga automaticamente para o título completo das Ações filhas — exibir aviso.
- Status `Concluída` pode ser definido manualmente ou automaticamente quando todas as Ações forem concluídas.
