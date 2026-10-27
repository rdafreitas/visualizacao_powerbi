# Andorin Estúdio

Projeto [Next.js](https://nextjs.org) criado com [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), estilizado com Tailwind CSS v4.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Diagnóstico de erros de login

O formulário distingue recusas de autenticação (credenciais inválidas ou e-mail
não confirmado) de falhas técnicas. Nas falhas técnicas, o console do navegador
registra `[Login] Falha técnica` e a etapa: `cliente`, `autenticacao`, `perfil`,
`credencial`, `redirecionamento` ou `logout`.

Os registros incluem somente metadados permitidos: tipo de erro, código conhecido,
status HTTP e indicação de resposta inesperada. Não incluem objetos brutos,
mensagens originais, senhas, e-mails, tokens, cookies ou chaves. Uma resposta
inesperada na etapa `credencial` indica falha na chamada da Server Action, mas
não comprova, por si só, problema de configuração ou redirecionamento.

O formulário libera o carregamento após falhas e informa quando o encerramento
da sessão também falha, sem substituir o erro original.

### Fluxo de acesso e sessão

- [Proxy](src/proxy.ts): substitui a convenção depreciada de Middleware no Next.js
  16, usando o runtime Node.js padrão. O redirecionamento automático do login para
  a home ocorre somente em GET/HEAD. O POST na página de login pode executar a
  Server Action; isso não libera POSTs anônimos nas rotas protegidas.
- [Verificação de acesso](src/(auth)/actions/usuarios.ts): `verificarAcessoAtivo()`
  não recebe mais um ID do navegador. Valida a sessão com `getUser()` e consulta
  a credencial do próprio usuário com o cliente comum, respeitando o RLS.
  Retorna `ActionResult` com status `ativo`, `suspenso`, `ausente` ou `sem_sessao`.
  Falhas técnicas retornam `ok: false`, nunca uma suspensão fictícia.
- O formulário só navega após receber `ativo`. Nos demais estados, informa a
  causa e encerra a sessão, sem consultar credenciais depois do logout.
- [Atualização de sessão](src/lib/supabase/proxy.ts): preserva cookies entre
  chamadas de `setAll`, incluindo exclusões e opções. Cookies renovados e os
  cabeçalhos de controle de cache do SDK também acompanham os redirecionamentos.
- [Cliente administrativo](src/lib/supabase/admin.ts): usa `createClient` de
  `@supabase/supabase-js`, com proteção `server-only`, sem cookies ou persistência
  de sessão. Cadastro e redefinição continuam exigindo proprietário nas actions.
  Esse cliente não participa da verificação de acesso no login.

No terminal do servidor, `[Acesso] Falha técnica` identifica a etapa `sessao` ou
`credencial`, com código de banco/PostgREST e status HTTP filtrados, quando
disponíveis. Nenhum objeto de erro bruto é registrado.

Uma consulta sem linha visível retorna `ausente`: RLS também pode ocultar uma
linha sem retornar erro. O código não pode distinguir esse caso de uma linha
inexistente. Permanece necessária a policy de leitura da própria credencial.

Os [tipos do banco](src/types/database.ts) incluem os metadados `Relationships`
exigidos pelo SDK para não inferir as consultas como `never`, incluindo a relação
1:1 já documentada entre credencial e perfil. Os tipos continuam manuais e não
substituem a validação do schema real; nenhuma migração SQL foi feita.

Execute os testes locais com:

```bash
npm run test:login
```

Os testes usam o runner nativo do Node.js e o TypeScript instalado para executar
o formulário, as actions e o Proxy com Supabase e configuração simulados. Utilizam
`NextRequest`, `NextResponse` e o utilitário de teste de matcher do Next.js instalado.
Cobrem estados de acesso, falhas técnicas, identidade no servidor, cookies,
redirecionamentos, permissões e isolamento administrativo. Não acessam arquivos
de ambiente nem fazem conexão com o Supabase.

Para validar manualmente no seu ambiente:

1. Com usuário ativo, confirme que o POST do login não é substituído pelo
   redirecionamento automático do Proxy e que a área correta é aberta.
2. Com usuário suspenso, confirme a mensagem de suspensão, sem navegação interna.
3. Com credencial ausente ou sessão expirada, confirme a mensagem correspondente.
4. Verifique que falhas técnicas não são apresentadas como suspensão e que o
   botão é liberado para nova tentativa.
5. Teste uma sessão próxima da renovação: cookies e cabeçalhos de não cache devem
   acompanhar a resposta, inclusive em redirecionamentos. Atualizar a página
   seguinte não deve exigir novo login.
6. Como proprietário, cadastre outro usuário e confirme que sua própria sessão
   permanece a mesma. Sem essa permissão, a operação deve continuar recusada.

Os testes simulados não substituem essas verificações reais. As mudanças mantêm
a verificação de `ativo` no fluxo de login; não implementam revogação contínua de
sessões já abertas ao alterar o status de acesso.

## Identidade da marca

A identidade visual fica em dois arquivos:

| Arquivo | Responsabilidade |
|---|---|
| [src/app/layout.tsx](src/app/layout.tsx) | Carrega as fontes (`next/font`), define metadados, `themeColor` e o `<body>` padrão. |
| [src/app/globals.css](src/app/globals.css) | Define paleta (`@theme`), combinações de marca (`@utility`) e reset de estilos. |

Para alterar uma cor, fonte ou combinação, edite apenas `globals.css`. Todos os componentes se atualizam.

### Fontes

| Fonte | Classe Tailwind | Uso |
|---|---|---|
| Montserrat Alternates (400 a 800) | `font-montserrat` | Fonte principal: textos, títulos, botões. É o padrão do `<body>`. |
| Shadows Into Light Two (400) | `font-shadows` | Fonte manuscrita para destaques e frases de efeito. |

As fontes são carregadas em `layout.tsx` com `next/font/google` e expostas pelas variáveis CSS `--font-montserrat` e `--font-shadows`. O `display: 'swap'` mostra uma fonte provisória enquanto a oficial carrega.

### Paleta de cores

Definidas no bloco `@theme` de `globals.css`. Cada cor gera classes como `bg-*`, `text-*` e `border-*`.

| Nome | Hex | Classes de exemplo |
|---|---|---|
| `bordo` | `#7A1D2C` | `bg-bordo`, `text-bordo` |
| `orange` | `#F27406` | `bg-orange`, `text-orange` |
| `blue-light` | `#BAD0D9` | `bg-blue-light`, `text-blue-light` |
| `green-light` | `#BFD6A1` | `bg-green-light`, `text-green-light` |
| `off-white` | `#F4E7CE` | `bg-off-white`, `text-off-white` |
| `chumbo` | `#211D1C` | `bg-chumbo`, `text-chumbo` |

Padrão do site (`<body>` em `layout.tsx`): fundo `off-white`, texto `chumbo`, fonte `montserrat`.

### Combinações de marca (utilities)

Cada utility aplica fundo e cor de texto juntos, garantindo a combinação aprovada pela marca. Funcionam com variantes do Tailwind (`hover:`, `md:` etc.).

| Utility | Fundo | Texto | Contraste* |
|---|---|---|---|
| `brand-bordo` | bordo | blue-light | 6,4:1 |
| `brand-orange` | orange | green-light | 1,8:1 |
| `brand-blue-light` | blue-light | orange | 1,8:1 |
| `brand-green-light` | green-light | bordo | 6,5:1 |
| `brand-off-white` | off-white | orange | 2,4:1 |
| `brand-chumbo` | chumbo | blue-light | 10,5:1 |

Exemplo:

```tsx
<section className="brand-bordo p-8">
  <h2 className="font-shadows text-3xl">Divirta-se com saúde e arte circense</h2>
</section>
```

\* Razão de contraste (WCAG): o mínimo recomendado é 4,5:1 para texto normal e 3:1 para texto grande. As combinações abaixo de 3:1 (`brand-orange`, `brand-blue-light`, `brand-off-white`) devem ser usadas apenas em elementos decorativos ou títulos grandes, e não em texto corrido.

### Como adicionar uma nova combinação

Em `globals.css`, crie uma nova utility:

```css
@utility brand-nome {
  background-color: var(--color-fundo);
  color: var(--color-texto);
}
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
