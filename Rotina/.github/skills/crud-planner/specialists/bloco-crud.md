# Specialist: bloco-crud

Gerencia a criação e edição de **Blocos de Atividades** na aba `BLOCOS` da planilha.

## Estrutura da Aba BLOCOS

| Coluna | Campo | Exemplo |
|---|---|---|
| A | ID | `B03` |
| B | Nome | `Bloco 3 - Junho` |
| C | Data de Início | `01/06/2026` |
| D | Data de Fim | `30/06/2026` |
| E | Status | `Ativo` / `Concluído` / `Planejado` |

Apenas um bloco pode ter status `Ativo` por vez.

## Criar Novo Bloco

### 1. Coletar informações

```
Nome do bloco  : _______________  (ex.: Bloco 4 - Julho)
Data de início : ___/___/______
Data de fim    : ___/___/______
```

### 2. Detectar duplicatas

```python
blocos_existentes = [row[1] for row in rows]
duplicatas = detectar_duplicata(nome_novo, blocos_existentes)
```

### 3. Verificar conflito de datas

```python
for bloco in rows:
    if bloco[4] in ('Ativo', 'Planejado'):
        if not (data_fim < bloco[2] or data_inicio > bloco[3]):
            exibir_aviso_conflito(bloco)
```

Se houver sobreposição de datas com bloco existente, exibir aviso e aguardar confirmação.

### 4. Gerar ID automático

```python
ids_existentes = [row[0] for row in rows if row]
ultimo_num = max([int(i[1:]) for i in ids_existentes if i.startswith('B')], default=0)
novo_id = f"B{str(ultimo_num + 1).zfill(2)}"
```

### 5. Gravar na planilha

```python
nova_linha = [novo_id, nome, data_inicio, data_fim, 'Planejado']
service.spreadsheets().values().append(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range="'BLOCOS'!A:E",
    valueInputOption='USER_ENTERED',
    insertDataOption='INSERT_ROWS',
    body={'values': [nova_linha]}
).execute()
```

### 6. Confirmar

```
✔ Bloco criado com sucesso!
  ID     : B04
  Nome   : Bloco 4 - Julho
  Período: 01/07/2026 → 31/07/2026
  Status : Planejado
```

## Editar Bloco Existente

### 1. Listar blocos disponíveis

```
Qual bloco deseja editar?
  [1] B01 · Bloco 1 - Abril       (Concluído)
  [2] B02 · Bloco 2 - Maio        (Concluído)
  [3] B03 · Bloco 3 - Junho       (Ativo)
  [4] B04 · Bloco 4 - Julho       (Planejado)
```

### 2. Exibir valores atuais e solicitar novos

Mostrar campo a campo o valor atual e permitir alterar ou manter com Enter.

### 3. Atualizar linha na planilha

```python
linha_num = next(i+2 for i, row in enumerate(rows) if row[0] == bloco_id)

service.spreadsheets().values().update(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range=f"'BLOCOS'!A{linha_num}:E{linha_num}",
    valueInputOption='USER_ENTERED',
    body={'values': [linha_atualizada]}
).execute()
```

## Ativar Bloco

Ao marcar um bloco como `Ativo`, verificar se há outro bloco ativo e oferecer transição:

```
⚠️  O bloco "B03 · Bloco 3 - Junho" está atualmente Ativo.
  Deseja:
  [1] Concluir B03 e ativar B04
  [2] Ativar B04 sem alterar B03
  [c] Cancelar
```

## Regras de Negócio

- Não é possível excluir um bloco que possua entradas na aba `CICLO TRIMESTRAL`. Oferecer "Concluir" como alternativa.
- Blocos com status `Concluído` não podem ser editados; apenas visualizados.
- A data de início deve ser anterior à data de fim.
