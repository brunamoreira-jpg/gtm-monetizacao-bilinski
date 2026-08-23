# GTM Monetização Bilinski&Co.

Plataforma de portfólio e Journey Builder construída em HTML + JavaScript e estilizada com Tailwind CSS v4.

## Tailwind + Vite

A estrutura segue a instalação oficial do Tailwind com Vite:

1. `npm install`
2. `npm run dev`
3. `npm run build`

O plugin está configurado em `vite.config.js` com `@tailwindcss/vite` e o CSS parte de `@import "tailwindcss";` em `src/style.css`.

## Arquivos

- `index.html`: estrutura da aplicação
- `src/main.js`: interações e regras do portfólio
- `src/style.css`: Tailwind + design system
- `src/products.json`: 25 produtos
- `src/journeys.json`: rotas do Journey Builder
- `src/assets/`: imagens e marca
- `dist/index.html`: versão standalone, autocontida e pronta para abrir no navegador

## Experiência

- Portfólio integrado com recorrentes, pontuais e P08 Black Friday
- Filtros por tipo e território
- Busca contextual
- Drawer de produto
- Journey Builder com resultado instantâneo no desktop
- Bottom Sheet de rota no mobile
- Níveis Básico, Médio e Avançado alterando preços e projeções
- Diagnóstico rápido
- Layout responsivo e motion reduzido quando o sistema solicita
