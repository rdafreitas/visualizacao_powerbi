# Quickstart: Study Gamification

**Feature**: `009-study-gamification` | **Date**: 2026-04-30

---

## Pré-requisitos

- Spec 008 implementada (servidor Express.js rodando ou ao menos `flashcard_events.json` gerado)
- Node.js 18+ instalado
- Terminal aberto na raiz do repositório

---

## Testar processamento standalone (sem servidor)

O processador de eventos pode ser testado sem a spec 008:

```bash
# Simular eventos manualmente (para teste)
echo '{"eventos":[{"id":"evt_test_001","topico_id":"t001","materia":"direito-constitucional","avaliacao":"bom","relevancia":"alta","xp_concedido":30,"timestamp":"2026-04-30T10:00:00"}]}' > data/flashcard_events.json

# Rodar o processador
node .github/skills/study-gamification/process_events.js
```

**Saída esperada**:
```
[Gamificação] 1 evento(s) processado(s)
[Gamificação] XP total: 30 | Nível: 1
[Gamificação] Personagem salvo em data/character_state.json
```

Verificar:
```bash
cat data/character_state.json
```

---

## Testar User Story 1 — XP por revisão de flashcard

1. Com spec 008 rodando, revisar alguns cards pelo browser
2. Em outro terminal, rodar o processador:
```bash
node .github/skills/study-gamification/process_events.js
```
3. Verificar `character_state.json`:
- `xp_total` aumentou conforme a tabela de XP da spec
- `nivel` calculado corretamente: `Math.floor(xp_total / 100) + 1`

**Critério de sucesso SC-001**: XP calculado = soma de todos os eventos × multiplicadores de relevância.

---

## Testar User Story 2 — XP por feedback de resumo

1. Registrar feedback via browser (botão "Com erros")
2. Rodar o processador
3. Verificar que `xp_total` aumentou 15 XP (tipo "com_erros")

---

## Testar User Story 3 — Personagem via API

Com spec 008 rodando:
```bash
curl http://localhost:3000/api/character
```

**Resposta esperada** (com spec 009 integrada):
```json
{
  "nome": "Candidato",
  "nivel": 1,
  "xp_total": 30,
  "xp_para_proximo_nivel": 70,
  "conquistas": [
    { "id": "modo_basico", "nome": "Modo Revisão Básico", "desbloqueada_em": "..." }
  ]
}
```

---

## Testar User Story 4 — Desbloqueio de Marco

Para testar o desbloqueio sem esperar acumular XP real:
```bash
# Editar character_state.json para xp_total = 200 (nível 3)
node -e "
const fs = require('fs');
const state = JSON.parse(fs.readFileSync('data/character_state.json', 'utf8'));
state.personagem.xp_total = 200;
state.personagem.eventos_processados = [];
fs.writeFileSync('data/character_state.json', JSON.stringify(state, null, 2));
console.log('XP ajustado para 200');
"

# Rodar processador para recalcular
node .github/skills/study-gamification/process_events.js

# Verificar conquistas
cat data/character_state.json
```

**Critério de sucesso**: `conquistas` contém `modo_basico` (nível 1) e `modo_quiz` (nível 3).

---

## Testar idempotência (SC-001)

```bash
# Rodar o processador 3 vezes seguidas
node .github/skills/study-gamification/process_events.js
node .github/skills/study-gamification/process_events.js
node .github/skills/study-gamification/process_events.js

# XP não deve ter triplicado
cat data/character_state.json | grep xp_total
```

**Critério de sucesso**: `xp_total` igual após as 3 execuções.

---

## Critérios de Sucesso (todos os SCs da spec)

| SC | Verificação |
|----|-------------|
| SC-001 | XP correto após processamento; idempotência verificada |
| SC-002 | Todos os marcos do nível atual presentes em `conquistas` |
| SC-003 | Deletar `character_state.json`, rodar processador → mesmo estado |
| SC-004 | `curl /api/character` responde em < 100ms |
