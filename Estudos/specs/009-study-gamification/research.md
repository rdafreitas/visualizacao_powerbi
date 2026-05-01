# Research: Study Gamification

**Feature**: `009-study-gamification` | **Date**: 2026-04-30

---

## 1. Processamento Idempotente de Eventos com JSON

### Decisão
Manter um campo `eventos_processados: []` em `character_state.json` com os IDs dos eventos já processados. Antes de calcular XP de um evento, verificar se o ID já está na lista.

### Justificativa
A idempotência garante que rodar o processador de eventos múltiplas vezes não duplica XP. É o mecanismo mais simples para single-user sem banco de dados.

### Implementação

```javascript
function processarEventos(eventos, character) {
  let xpGanho = 0;
  for (const evento of eventos) {
    if (character.eventos_processados.includes(evento.id)) continue; // já processado
    xpGanho += calcularXP(evento);
    character.eventos_processados.push(evento.id);
  }
  character.xp_total += xpGanho;
  return character;
}
```

**Por que lista de IDs em vez de "processar apenas eventos após timestamp X"**: Timestamp pode ter colisões ou ser editado manualmente. ID é mais robusto.

### Alternativas consideradas
- **Event cursor (processar apenas eventos após índice N)**: Mais simples, mas não é idempotente se eventos forem inseridos fora de ordem.
- **Hash do estado**: Complexo demais para single-user.

---

## 2. Integração entre Specs 008 e 009

### Decisão
Spec 009 é um **módulo Node.js** importado pela spec 008. O endpoint `GET /api/character` em `routes/character.js` (spec 008) importa e chama `gamification_service.js` (spec 009).

```
spec-008/routes/character.js
  → require('../../study-gamification/gamification_service')
    → lê character_state.json
    → processa eventos novos de flashcard_events.json + summary_feedback.json
    → retorna estado atualizado
```

### Justificativa
- Evita CORS: frontend faz um único fetch para `http://localhost:3000/api/character` — sem porta separada
- Não exige que o usuário inicie dois servidores
- Spec 009 pode ser desenvolvida e testada independentemente (importada como módulo JS puro)
- Alinhado com Constitution VI: spec 009 contém apenas regras de gamificação; spec 008 contém apenas rotas HTTP

### Como spec 009 permanece independente
Spec 009 pode ser executada como script standalone:
```bash
node .github/skills/study-gamification/process_events.js
```
Isso recalcula o personagem sem precisar da spec 008 rodando. Útil para debug.

### Alternativas consideradas
- **Servidor separado porta 3001**: Exige dois terminais, CORS, mais complexidade de setup.
- **Import direto no server.js da 008**: Acoplamento excessivo — viola Constitution VI.

---

## 3. Fórmula de Nível e Marcos de Desbloqueio

### Decisão
Usar tabela de marcos declarativa (array de objetos) em vez de lógica condicional hard-coded.

```javascript
const MARCOS = [
  { nivel: 1,  id: 'modo_basico',      nome: 'Modo Revisão Básico'     },
  { nivel: 3,  id: 'modo_quiz',        nome: 'Modo Quiz'               },
  { nivel: 5,  id: 'desafio_cronometrado', nome: 'Desafio Cronometrado' },
  { nivel: 8,  id: 'modo_maratona',    nome: 'Modo Maratona'           },
  { nivel: 10, id: 'revisao_relevancia', nome: 'Revisão por Relevância'},
  { nivel: 15, id: 'desafio_banca',    nome: 'Desafio de Banca'        },
];

function verificarDesbloqueios(character) {
  for (const marco of MARCOS) {
    const jaDesbloqueado = character.conquistas.some(c => c.id === marco.id);
    if (!jaDesbloqueado && character.nivel >= marco.nivel) {
      character.conquistas.push({
        id: marco.id,
        nome: marco.nome,
        desbloqueada_em: new Date().toISOString()
      });
    }
  }
  return character;
}
```

### Justificativa
Array declarativo é mais legível (Princípio IX) e extensível — adicionar novo marco é adicionar uma linha, não uma condição `if`. Fácil de entender para quem está aprendendo.

---

## 4. Persistência e Re-execução do Zero

### Decisão
O processador de eventos deve ser capaz de recriar `character_state.json` do zero a partir de `flashcard_events.json` + `summary_feedback.json`. Isso garante SC-003 da spec 009.

```javascript
// Para recriar do zero: deletar character_state.json e rodar:
node .github/skills/study-gamification/process_events.js
```

**Como garantir**: O campo `eventos_processados` em `character_state.json` garante idempotência. Ao rodar do zero (sem `character_state.json`), o processador lê todos os eventos e calcula o estado final correto.

---

## Desconhecidos Resolvidos

| Item | Status | Resolução |
|------|--------|-----------|
| Idempotência de eventos | ✅ | Lista `eventos_processados[]` em `character_state.json` |
| Integração com spec 008 | ✅ | Módulo Node.js importado por `routes/character.js` |
| Tabela de marcos extensível | ✅ | Array declarativo `MARCOS` — fácil de modificar |
| Re-execução do zero | ✅ | Processar todos os eventos sem `character_state.json` = estado correto |
