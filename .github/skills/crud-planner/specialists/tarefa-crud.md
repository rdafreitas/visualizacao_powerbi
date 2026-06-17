# Specialist: tarefa-crud

Gerencia a criação e edição de **Tarefas** na aba `TAREFAS` da planilha.

## Estrutura da Aba TAREFAS

| Coluna | Campo | Exemplo |
|---|---|---|
| A | ID | `T12` |
| B | ID da Ação Pai | `A07` |
| C | ID da Meta (referência) | `M01` |
| D | Texto da Tarefa | `Escrever post sobre tema X` |
| E | "O que foi feito" | `Redigir texto + criar imagem` |
| F | Estimativa (min) | `60` |
| G | Status | `Aberta` / `Concluída` |

## Criar Nova Tarefa

### 1. Selecionar Ação pai

Listar as Ações ativas, agrupadas por Meta:

```
A qual Ação esta Tarefa pertence?
  M01 · Crescer presença digital:
    [1] A01 · Publicar conteúdo semanal
    [2] A02 · Engajar comunidade
  M02 · Desenvolver habilidade X:
    [3] A03 · Estudar material base
```

### 2. Coletar informações

```
Texto da tarefa        : _______________
O que será feito       : _______________  (opcional)
Estimativa de tempo(min): ___
```

### 3. Detectar duplicatas

```python
tarefas_da_acao = [row[3] for row in rows if row[1] == acao_id_pai]
duplicatas = detectar_duplicata(texto_novo, tarefas_da_acao)
```

### 4. Gerar ID automático

```python
ids_existentes = [row[0] for row in rows if row]
ultimo_num = max([int(i[1:]) for i in ids_existentes if i.startswith('T')], default=0)
novo_id = f"T{str(ultimo_num + 1).zfill(2)}"
```

### 5. Gravar na planilha

```python
meta_id_ref = acao_rows[acao_id_pai]['meta_id']  # lookup reverso
nova_linha  = [novo_id, acao_id_pai, meta_id_ref, texto, o_que_feito, estimativa, 'Aberta']
service.spreadsheets().values().append(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range="'TAREFAS'!A:G",
    valueInputOption='USER_ENTERED',
    insertDataOption='INSERT_ROWS',
    body={'values': [nova_linha]}
).execute()
```

### 6. Perguntar se deseja adicionar ao ciclo atual

```
Tarefa criada! Deseja adicioná-la ao ciclo trimestral atual?
  [s] Sim — adicionar ao ciclo agora
  [n] Não — adicionar depois
```

Se sim, acionar `ciclo-crud`.

## Regras de Negócio

- Tarefas concluídas não podem ser editadas; apenas visualizadas.
- Ao marcar como `Concluída`, atualizar automaticamente a coluna F da aba `CICLO TRIMESTRAL` com `✔` se a tarefa estiver no ciclo.
