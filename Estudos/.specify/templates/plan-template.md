# Plano de Implementação: [FEATURE]

**Branch**: `[###-nome-da-feature]` | **Data**: [DATA] | **Spec**: [link]
**Entrada**: Especificação da feature em `/specs/[###-nome-da-feature]/spec.md`

**Nota**: Este template é preenchido pelo comando `/speckit.plan`. Consulte `.specify/templates/plan-template.md` para o fluxo de execução.

## Resumo

[Extrair da spec: requisito principal + abordagem técnica da pesquisa]

## Contexto Técnico

<!--
  AÇÃO NECESSÁRIA: Substitua o conteúdo desta seção pelos detalhes técnicos
  do projeto. A estrutura aqui serve como orientação para o processo iterativo.
-->

**Linguagem/Versão**: [ex.: Python 3.11, Swift 5.9, Rust 1.75 ou NECESSITA ESCLARECIMENTO]  
**Dependências Principais**: [ex.: FastAPI, UIKit, LLVM ou NECESSITA ESCLARECIMENTO]  
**Armazenamento**: [se aplicável, ex.: PostgreSQL, CoreData, arquivos ou N/A]  
**Testes**: [ex.: pytest, XCTest, cargo test ou NECESSITA ESCLARECIMENTO]  
**Plataforma-Alvo**: [ex.: servidor Linux, iOS 15+, WASM ou NECESSITA ESCLARECIMENTO]
**Tipo de Projeto**: [ex.: biblioteca/cli/web-service/aplicativo-mobile/compilador/app-desktop ou NECESSITA ESCLARECIMENTO]  
**Metas de Performance**: [específico ao domínio, ex.: 1000 req/s, 10k linhas/s, 60 fps ou NECESSITA ESCLARECIMENTO]  
**Restrições**: [específico ao domínio, ex.: <200ms p95, <100MB memória, funciona offline ou NECESSITA ESCLARECIMENTO]  
**Escala/Abrangência**: [específico ao domínio, ex.: 10k usuários, 1M LOC, 50 telas ou NECESSITA ESCLARECIMENTO]

## Verificação da Constituição

*GATE: Deve ser aprovada antes da pesquisa da Fase 0. Reavalie após o design da Fase 1.*

[Gates determinados com base no arquivo da constituição]

## Estrutura do Projeto

### Documentação (esta feature)

```text
specs/[###-feature]/
├── plan.md              # Este arquivo (saída do comando /speckit.plan)
├── research.md          # Saída da Fase 0 (comando /speckit.plan)
├── data-model.md        # Saída da Fase 1 (comando /speckit.plan)
├── quickstart.md        # Saída da Fase 1 (comando /speckit.plan)
├── contracts/           # Saída da Fase 1 (comando /speckit.plan)
└── tasks.md             # Saída da Fase 2 (comando /speckit.tasks — NÃO criado pelo /speckit.plan)
```

### Código-Fonte (raiz do repositório)
<!--
  AÇÃO NECESSÁRIA: Substitua a árvore de exemplo abaixo pela estrutura concreta
  desta feature. Remova opções não usadas e expanda a escolhida com
  caminhos reais (ex.: apps/admin, packages/alguma-coisa). O plano entregue
  não deve conter rótulos de "Opção".
-->

```text
# [REMOVER SE NÃO USADO] Opção 1: Projeto único (PADRÃO)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVER SE NÃO USADO] Opção 2: Aplicação web (quando "frontend" + "backend" detectados)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVER SE NÃO USADO] Opção 3: Mobile + API (quando "iOS/Android" detectado)
api/
└── [igual ao backend acima]

ios/ ou android/
└── [estrutura específica da plataforma: módulos de feature, fluxos de UI, testes de plataforma]
```

**Decisão de Estrutura**: [Documente a estrutura selecionada e referencie os diretórios reais capturados acima]

## Rastreamento de Complexidade

> **Preencha SOMENTE se a Verificação da Constituição tiver violações que precisam ser justificadas**

| Violação | Por que Necessário | Alternativa Mais Simples Rejeitada Porque |
|----------|-------------------|------------------------------------------|
| [ex.: 4º projeto] | [necessidade atual] | [por que 3 projetos são insuficientes] |
| [ex.: padrão Repository] | [problema específico] | [por que acesso direto ao BD é insuficiente] |
