@context #file:mcp.json (talktofigma)
Atue como um Engenheiro de Software Sênior e Especialista em Design Ops. Inicie o projeto de uma biblioteca de componentes no Figma seguindo o framework **Spec-Driven Development (SDD)**.

### OBJETIVO
Implementar a biblioteca "Monte seu painel" via Figma MCP, dividida em 5 seções: "01. Layout", "02. Acessórios", "03. Cards", "04. Gráficos" e "05. Tabelas".

### FASE 1: ESPECIFICAÇÃO (Plan Mode)
1. Utilize o **Git Speckit** para criar a `constitution.md` e `spec.md` do projeto.
2. Defina as regras de **Autolayout** obrigatório e responsividade (expansão para direita/baixo).
3. Especifique as variantes de layout (16:9, 1920x1280) e temas (Dark/Light).
4. Detalhe os 6 tipos de Cards e a hierarquia de fontes para Acessórios (Painel > Sub-título > Visual, etc.).

### FASE 2: ESTRUTURA DE SKILLS
Crie uma estrutura de pastas `/skills` contendo arquivos `.prompt` ou `.md` especializados para:
- `figma_layout_engine.md`: Regras para frames e grids.
- `figma_component_factory.md`: Instruções para Cards e Gráficos (Coluna, Linha, Barras, Pizza, Rosca, Área).
- `figma_style_system.md`: Variáveis de cores e tipografia.

### FASE 3: EXECUÇÃO AGÊNTICA
- Proponha um plano para invocar **subagentes** que criarão as seções de forma isolada via `#run-subagent`.
- O subagente de "Gráficos" deve organizar a section "04. Gráficos" com subpastas por tipo:

#### Sobre os componentes:
- Os componentes serão divididos em: "01. Layout", "02. Acessórios", "03. Cards", "04. Gráficos", "05. Tabelas". Cada classificação será uma section dentro da section principal chamada "Monte seu painel".
- Os componentes de layout terão:  vários tamanhos (16:9, 1920x1280 e outros), vários modelos de layout (dark ou claro ou outras cores) e com filtro na lateral ou filtro no topo da pagina.
- Os componentes de acessórios terão os títulos, formas, filtros e abas de navegação. Os títulos poderão ser, em ordem da maior para a menor fonte: painel (maior fonte), sub-título de painel, Título de Visual, Sub-título de Visual, Rótulo e Rótulo em Destaque. As formas serão traços, bolas entre outras formas. O filtro e abas de navegação são auto-explicativo.
- Os componentes de card deverá ter os seguintes componentes dentro dele: título, subtítulo, legendas e gráficos. O card será responsável pelo tipo de fundo e contorno dos visuais.
- Os cards terão 6 tipos: card pequeno vazio(sem nada dentro, só contorno e fundo), card pequeno (para KPI), card pequeno com mini-gráfico, card normal vazio (sem nada dentro, só contorno e fundo), card normal com 1 gráfico, card normal com 2 gráficos.
- Os componentes de gráficos estarão numa mesma section "04. Gráficos" , porém separados por tipos. Por exemplo, "04. Gráficos/Coluna" e "04. Gráficos/Linha" onde estarão separados os tipos de coluna e linha. O mesmo ocorrerá para os demais tipos de gráfico como: barras, pizza, rosca e área. Cada tipo terá suas próprias características e variáveis.


### REQUISITOS TÉCNICOS
- Use saídas em **JSON** para comunicação entre subagentes e o MCP [18].
- Garanta que todos os componentes sejam criados como 'Main Components' no Figma.

Aguarde minha revisão da especificação inicial antes de gerar os componentes.