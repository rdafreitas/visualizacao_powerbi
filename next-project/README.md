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
