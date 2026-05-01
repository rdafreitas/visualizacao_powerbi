# Quickstart: Study Flashcard Web

**Feature**: `008-study-flashcard-web` | **Date**: 2026-04-30

---

## Pré-requisitos

- Node.js 18+ instalado (`node --version`)
- `topicos.json` gerado pela spec 004 em `/data/topicos.json`
- Terminal aberto na raiz do repositório

---

## Instalação

```bash
# 1. Navegar para o diretório da skill
cd .github/skills/study-flashcard-web

# 2. Instalar Express.js (única dependência)
npm install

# 3. Voltar para raiz (server.js referencia /data/ relativo à raiz)
cd ../../..
```

---

## Iniciar o servidor

```bash
node .github/skills/study-flashcard-web/server.js
```

Saída esperada:
```
[Flashcard Web] Servidor iniciado em http://localhost:3000
[Flashcard Web] Dados carregados: 42 tópicos em 3 matérias
```

---

## Testar User Story 1 — Seleção de Matéria

1. Abra o navegador em `http://localhost:3000`
2. Verifique que a lista de matérias aparece com contagem de cards pendentes
3. **Critério de sucesso**: Cada matéria exibe nome + número de cards pendentes para hoje

---

## Testar User Story 2 — Revisão de Flashcard

1. Clique em uma matéria com cards pendentes
2. Leia a frente do card
3. Clique em **"Revelar"**
4. Verifique que o verso é exibido junto com os 4 botões
5. Clique em **"Bom"**
6. **Critério de sucesso**: O próximo card aparece; verifique que `/data/flashcard_progress_<materia>.json` foi atualizado e `/data/flashcard_events.json` tem o novo evento

Verificação manual dos arquivos:
```bash
# Verificar progresso
cat data/flashcard_progress_direito-constitucional.json

# Verificar evento registrado
cat data/flashcard_events.json
```

---

## Testar User Story 3 — Feedback de Resumo

1. Durante revisão de um card, clique em **"Ver resumo"**
2. Clique em **"Com erros"** e adicione uma observação
3. Clique em **"Confirmar feedback"**
4. **Critério de sucesso**: `/data/summary_feedback.json` contém o novo registro com XP concedido

```bash
cat data/summary_feedback.json
```

---

## Testar User Story 4 — Dashboard

1. Acesse `http://localhost:3000/dashboard`
2. **Critério de sucesso**: Exibe cards revisados hoje, streak e XP total corretamente

---

## Testar Endpoint de Character (integração com spec 009)

```bash
curl http://localhost:3000/api/character
```

**Se spec 009 não estiver implementada**, espera-se:
```json
{
  "nome": "Candidato",
  "nivel": 1,
  "xp_total": 0,
  "xp_para_proximo_nivel": 100,
  "conquistas": [],
  "_aviso": "Gamificação não inicializada. Execute a spec 009 para ativar."
}
```

---

## Critérios de Sucesso (todos os SCs da spec)

| SC | Verificação |
|----|-------------|
| SC-001 | Após revisar card, `flashcard_progress_<mat>.json` atualizado |
| SC-002 | Após revisar card, `flashcard_events.json` tem novo evento |
| SC-003 | Após feedback, `summary_feedback.json` tem novo registro |
| SC-004 | Servidor iniciou em < 5s; clique em "Revelar" responde em < 200ms |
| SC-005 | Dashboard mostra contagem correta de revisões de hoje |

---

## Parar o servidor

`Ctrl+C` no terminal onde o servidor está rodando.
