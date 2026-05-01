# Contrato: Módulo de Gamificação

**Feature**: `009-study-gamification` | **Date**: 2026-04-30

> Este contrato define a interface do módulo `gamification_service.js` que é importado pela spec 008 (`routes/character.js`). Não é uma API HTTP — é uma interface de módulo Node.js.

---

## Interface do Módulo `gamification_service.js`

```javascript
// Importação pela spec 008
const gamification = require('../../study-gamification/gamification_service');
```

### `getCharacter(workspaceDir) → object`

Retorna o estado atual do personagem, processando quaisquer eventos novos.

**Input**: `workspaceDir` — caminho absoluto para a raiz do workspace (onde está `/data/`)

**Output**:
```javascript
{
  nome: "Candidato",
  nivel: 3,
  xp_total: 250,
  xp_para_proximo_nivel: 50,
  conquistas: [
    { id: "modo_basico", nome: "Modo Revisão Básico", desbloqueada_em: "2026-04-30T08:00:00" }
  ]
}
```

**Comportamento**:
1. Lê `character_state.json` (cria personagem padrão se não existir)
2. Lê `flashcard_events.json` e `summary_feedback.json`
3. Processa eventos não listados em `eventos_processados[]`
4. Atualiza nível, XP, conquistas
5. Persiste `character_state.json` atualizado
6. Gera notificações se nível subiu
7. Retorna estado sem o campo interno `eventos_processados` (limpo para o frontend)

**Idempotência**: Chamar múltiplas vezes sem novos eventos retorna sempre o mesmo resultado.

---

### `processAllEvents(workspaceDir) → summary`

Reprocessa todos os eventos do zero. Útil para debug e para reconstruir o personagem.

**Input**: `workspaceDir`

**Output**:
```javascript
{
  eventos_processados: 47,
  xp_total: 250,
  nivel: 3,
  conquistas_desbloqueadas: ["modo_basico", "modo_quiz"]
}
```

**Comportamento**: Reseta `character_state.json` e reprocessa todos os eventos.

---

## Contrato de Feature Flags (para spec 008)

As conquistas desbloqueadas servem como feature flags para spec 008. O frontend verifica `GET /api/character` e habilita/desabilita modos conforme as conquistas.

| `conquista.id` | Funcionalidade habilitada na spec 008 |
|---------------|---------------------------------------|
| `modo_basico` | Revisão básica (sempre ativo) |
| `modo_quiz` | Botão "Modo Quiz" visível no menu |
| `desafio_cronometrado` | Opção "Desafio Cronometrado" no menu |
| `modo_maratona` | Opção "Modo Maratona" no menu |
| `revisao_relevancia` | Filtro "Apenas 🔥 Alta relevância" na seleção |
| `desafio_banca` | Agrupamento por banca na seleção de matéria |

---

## Contrato de Notificações (lido pela spec 008)

A spec 008 verifica `/data/gamification_notifications.json` ao carregar o dashboard e exibe notificações com `exibida: false`. Após exibir, marca `exibida: true`.

```javascript
// spec 008 — routes/dashboard.js
const notifs = lerJson(path.join(workspaceDir, 'data/gamification_notifications.json'), { notificacoes: [] });
const pendentes = notifs.notificacoes.filter(n => !n.exibida);
// exibir pendentes, depois marcar exibida: true
```
