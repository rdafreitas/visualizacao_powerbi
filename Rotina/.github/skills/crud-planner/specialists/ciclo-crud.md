# Specialist: ciclo-crud

Gerencia a criação e atualização de entradas na aba **CICLO TRIMESTRAL**.

## Estrutura da Aba CICLO TRIMESTRAL

| Coluna | Campo | Exemplo |
|---|---|---|
| A | ID Atividade | `M01-A02-T03` |
| B | Categoria | `Marketing` |
| C | Meta | `[Marketing] M01 · Crescer presença digital` |
| D | Ação | `A02 · Engajar comunidade` |
| E | Tarefa / "O que foi feito" | `Responder comentários da semana` |
| F | Status Habitica | `✔` / `✘` / *(vazio)* |
| G | Tempo Toggl (min) | `45` |
| H | Data de Verificação | `17/06/2026` |
| I | Bloco | `Bloco 3 - Junho` |

## Adicionar Tarefa ao Ciclo

### 1. Selecionar tarefa

Listar tarefas com status `Aberta` que ainda não estão no ciclo atual:

```
Qual tarefa deseja adicionar ao ciclo atual?
  M01 · Crescer presença digital:
    [ ] T03 · Responder comentários
    [ ] T04 · Fazer live de Q&A
  M02 · Desenvolver habilidade X:
    [ ] T08 · Estudar módulo 3
```

Permitir seleção múltipla.

### 2. Verificar duplicata no ciclo

```python
ids_no_ciclo = [row[0] for row in ciclo_rows]
ja_inseridas = [t for t in tarefas_selecionadas if t['id_atividade'] in ids_no_ciclo]
```

Se houver duplicata, informar quais já estão no ciclo e excluir da inserção.

### 3. Montar ID de Atividade

```python
id_atividade = f"{meta_id}-{acao_id}-{tarefa_id}"
# Exemplo: M01-A02-T03
```

### 4. Gravar entradas

```python
bloco_ativo = obter_bloco_ativo()  # busca da aba BLOCOS

for tarefa in tarefas_novas:
    nova_linha = [
        tarefa['id_atividade'],
        tarefa['categoria'],
        tarefa['meta_titulo_completo'],
        tarefa['acao_nome'],
        tarefa['texto'],
        '',     # Status Habitica (vazio)
        '',     # Tempo Toggl (vazio)
        '',     # Data de Verificação (vazio)
        bloco_ativo['nome']
    ]
    # append na aba CICLO TRIMESTRAL

```

### 5. Confirmar

```
✔ Adicionadas ao ciclo "Bloco 3 - Junho":
  · M01-A02-T03 · Responder comentários
  · M01-A02-T04 · Fazer live de Q&A
  · M02-A01-T08 · Estudar módulo 3
```

## Remover / Mover Tarefa do Ciclo

- **Remover:** Marcar linha como `Removida` na coluna F (não deletar linha para manter histórico).
- **Mover para outro bloco:** Atualizar coluna I (Bloco) com o nome do novo bloco.

## Atualizar "O que foi feito"

Permitir ao usuário editar o campo da coluna E para uma entrada existente do ciclo:

```python
service.spreadsheets().values().update(
    spreadsheetId=os.environ['GOOGLE_SHEET_ID'],
    range=f"'CICLO TRIMESTRAL'!E{linha_num}",
    valueInputOption='USER_ENTERED',
    body={'values': [[novo_texto]]}
).execute()
```

## Regras de Negócio

- O ID de Atividade (`M01-A02-T03`) é único por ciclo. Uma mesma tarefa pode aparecer em blocos diferentes.
- Não é possível adicionar ao ciclo uma tarefa cujas Meta ou Ação pai estejam com status `Pausada` ou `Concluída`.
