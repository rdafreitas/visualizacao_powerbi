# Specialist: acao-crud

Gerencia a criação e edição de **Ações** na aba `AÇÕES` da planilha.

## Estrutura da Aba AÇÕES

| Coluna | Campo | Exemplo |
|---|---|---|
| A | ID | `A07` |
| B | ID da Meta Pai | `M01` |
| C | Nome da Ação | `Publicar conteúdo semanal` |
| D | Descrição | `Criar e publicar 1 post por semana...` |
| E | Data de Início | `01/04/2026` |
| F | Data de Fim | `30/06/2026` |
| G | Status | `Ativa` / `Concluída` / `Pausada` |

## Criar Nova Ação

### 1. Selecionar Meta pai

Listar as metas com status `Ativa` para seleção:

```
A qual Meta esta Ação pertence?
  [1] M01 · Crescer presença digital
  [2] M02 · Desenvolver habilidade X
  [3] M03 · Projeto de conclusão
```

### 2. Coletar informações

```
Nome da ação : _______________
Descrição    : _______________
Data de fim  : ___/___/______
```

### 3. Detectar duplicatas

```python
acoes_da_meta = [row[2] for row in rows if row[1] == meta_id_pai]
duplicatas = detectar_duplicata(nome_novo, acoes_da_meta)
```

Duplicatas são verificadas **dentro da mesma Meta** (Ações de Metas diferentes podem ter nomes similares).

### 4. Gerar ID automático

```python
ids_existentes = [row[0] for row in rows if row]
ultimo_num = max([int(i[1:]) for i in ids_existentes if i.startswith('A')], default=0)
novo_id = f"A{str(ultimo_num + 1).zfill(2)}"
```

### 5. Gravar na planilha

```python
nova_linha = [novo_id, meta_id_pai, nome, descricao, data_inicio, data_fim, 'Ativa']
service.spreadsheets().values().append(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range="'AÇÕES'!A:G",
    valueInputOption='USER_ENTERED',
    insertDataOption='INSERT_ROWS',
    body={'values': [nova_linha]}
).execute()
```

### 6. Confirmar

```
✔ Ação criada com sucesso!
  ID      : A07
  Meta    : M01 · Crescer presença digital
  Nome    : Publicar conteúdo semanal
```

## Editar Ação Existente

Mesmo fluxo do `meta-crud`: localizar, exibir valores atuais, atualizar.

## Regras de Negócio

- Não é possível excluir uma Ação que possui Tarefas associadas. Oferecer "Pausar".
- A data de fim da Ação não pode ser posterior à data de fim da Meta pai — exibir aviso.
- Ao concluir todas as Tarefas de uma Ação, perguntar se deseja marcar a Ação como `Concluída`.
