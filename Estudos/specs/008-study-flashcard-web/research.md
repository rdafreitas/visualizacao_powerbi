# Research: Study Flashcard Web

**Feature**: `008-study-flashcard-web` | **Date**: 2026-04-30

---

## 1. Algoritmo SM-2 em JavaScript

### Decisão
Implementar SM-2 (SuperMemo 2) diretamente em JavaScript puro — sem biblioteca externa.

### Justificativa
SM-2 é o algoritmo original do Anki, amplamente documentado, implementável em ~40 linhas. Não exige `npm install`, alinhado com a restrição da spec de manter dependências mínimas.

### Referência do algoritmo

O SM-2 mantém 3 campos por card:
- `intervalo` (dias até próxima revisão, padrão = 1)
- `fator_facilidade` (EF, padrão = 2.5, mínimo = 1.3)
- `repeticoes` (quantas vezes consecutivas o card foi lembrado)

**Mapeamento de botões → qualidade q (0–5)**:

| Botão | q | Interpretação |
|-------|---|---------------|
| Errei | 1 | Resposta completamente errada |
| Difícil | 3 | Lembrado com dificuldade — limiar mínimo de "lembrado" |
| Bom | 4 | Lembrado com hesitação aceitável |
| Fácil | 5 | Lembrado sem hesitação |

**Fórmula SM-2**:

```javascript
function calcularProximaRevisao(card, q) {
  if (q >= 3) {
    // Card lembrado: aumenta intervalo
    if (card.repeticoes === 0) card.intervalo = 1;
    else if (card.repeticoes === 1) card.intervalo = 6;
    else card.intervalo = Math.round(card.intervalo * card.fator_facilidade);

    card.fator_facilidade += 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    card.fator_facilidade = Math.max(1.3, card.fator_facilidade);
    card.repeticoes += 1;
  } else {
    // Card esquecido: reinicia
    card.repeticoes = 0;
    card.intervalo = 1;
    // fator_facilidade não muda no esquecimento
  }

  const hoje = new Date();
  hoje.setDate(hoje.getDate() + card.intervalo);
  card.proxima_revisao = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
  return card;
}
```

**Por que q=1 para "Errei" e não q=0**: q=0 e q=1 têm o mesmo efeito (reiniciar o card), mas "Errei" é uma falha parcial — o estudante viu o card mas não lembrou. Não usar q=2 porque "Errei" é abaixo do limiar de 3. q=1 é mais representativo que q=0.

### Alternativas consideradas
- **FSRS (Free Spaced Repetition Scheduler)**: Algoritmo mais moderno, mais preciso, mas requer biblioteca npm e é mais complexo de implementar do zero. Reservado para v2.
- **Intervalo fixo**: Muito simples, não adapta ao desempenho do estudante. Descartado.

---

## 2. Express.js — Servidor + API + Arquivos Estáticos

### Decisão
Single Express app que serve tanto os arquivos HTML estáticos (via `express.static`) quanto a API REST (prefixo `/api`). Uma única porta (3000).

### Justificativa
Evita problemas de CORS para a v1 (frontend e backend na mesma porta). Simples de entender. A separação clara de `/api` já prepara a migração para React (na v2, o React faz fetch para `/api` — zero mudança no backend).

### Padrão de estrutura de rotas

```javascript
// server.js — entry point
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));       // Serve HTML/CSS/JS

app.use('/api/cards', require('./routes/cards'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/character', require('./routes/character'));

app.listen(3000, () => console.log('Servidor iniciado em http://localhost:3000'));
```

**Por que `express.static` antes das rotas API**: As rotas de API são prefixadas com `/api`, então não conflitam com arquivos estáticos. Mas se `express.static` vem primeiro, ele resolve requisições de arquivos existentes mais rápido (evita passar pelo roteador).

### Boas práticas aplicadas
- Cada arquivo de rota exporta `express.Router()` — isolamento por recurso (Constitution VI)
- `express.json()` middleware global — parse automático de request body
- Caminhos de arquivos JSON sempre via `path.join(__dirname, '../../../data/', arquivo)` — portátil entre SO

### Alternativas consideradas
- **Fastify**: Mais rápido, mas adicionaria complexidade de aprendizado. Express é o padrão de entrada para Node.js.
- **Servidor HTTP nativo** (`http.createServer`): Muito verboso, sem benefícios pedagógicos.

---

## 3. Caminho de Migração HTML+JS → React

### Decisão
Projetar a v1 (HTML puro) de forma que a migração para React seja substituir apenas a pasta `public/` sem tocar no backend.

### Como garantir isso

**v1 (HTML + fetch)**:
```
frontend/public/review.html  → fetch('/api/cards?materia=xxx')
frontend/public/app.js       → fetch('/api/review', { method: 'POST', body: ... })
```

**v2 (React)**:
```
frontend/src/components/ReviewCard.jsx → fetch('/api/cards?materia=xxx')
frontend/src/components/ReviewCard.jsx → fetch('/api/review', { method: 'POST', body: ... })
```

A API não muda. O backend não muda. Só a pasta `public/` é substituída pela build do React.

**Regra de design para v1**: Toda lógica de negócio que poderia ir no HTML deve ir no `/api`. O HTML da v1 deve ser "burro" — só faz fetch e renderiza. Isso garante que o React apenas substitui o HTML, não refaz a lógica.

### Estrutura de pasta preparada para React

```
.github/skills/study-flashcard-web/
├── server.js           # Nunca muda entre v1 e v2
├── routes/             # Nunca muda entre v1 e v2
├── services/           # Nunca muda entre v1 e v2
├── repositories/       # Nunca muda entre v1 e v2
└── public/             # v1: HTML puro → v2: substituído pela build React
```

---

## 4. Persistência JSON no Windows (Constitution IV)

### Decisão
Usar `path.join()` para todos os caminhos. Ler/escrever com `fs.readFileSync` / `fs.writeFileSync` (sync, suficiente para single-user). Criar arquivo se não existir (`||` com valor padrão).

### Pattern de leitura defensiva

```javascript
function lerJson(caminho, valorPadrao = {}) {
  try {
    return JSON.parse(fs.readFileSync(caminho, 'utf8'));
  } catch {
    return valorPadrao; // Arquivo não existe ou JSON inválido → retorna padrão
  }
}
```

**Por que `readFileSync` em vez de `readFile` (async)**: Single-user, operações pequenas (JSON < 1MB). A simplicidade síncrona é mais legível e alinhada ao Princípio IX (legibilidade > otimização prematura).

---

## Desconhecidos Resolvidos

| Item | Status | Resolução |
|------|--------|-----------|
| Implementação SM-2 em JS | ✅ | Fórmula direta, ~40 linhas, zero dependências |
| Express.js static + API | ✅ | Single porta, `/api` prefix, `express.static` para frontend |
| Caminho migração React | ✅ | Backend imutável; substituir apenas `public/` na v2 |
| Persistência JSON Windows | ✅ | `path.join` + leitura defensiva com fallback |
