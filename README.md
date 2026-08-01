# Mercadinho da Turma

Minimercado pedagógico para sala de aula. As crianças operam o caixa, montam o
carrinho, entregam cédulas e moedas de brinquedo e **contam o troco com as
próprias mãos** antes de o sistema revelar a resposta.

Interface em caixa alta, botões grandes e ícones organizados por categoria
(alimento, brinquedo, roupa, cinema, escola) — pensada para os pequenos usarem
sozinhos no tablet.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js 14 (App Router) + React 18 |
| Backend | NestJS 10 |
| ORM | Prisma 5 |
| Banco | Supabase (PostgreSQL) |

É um **monorepo** com dois apps que rodam separados: a API (NestJS) na porta
3001 e o site (Next) na porta 3000.

```
mercadinho-da-turma/
├─ prisma/
│  ├─ schema.prisma        modelo compartilhado (Product, Sale, SaleItem)
│  └─ seed.ts              12 produtos de exemplo
├─ apps/
│  ├─ api/                 BACKEND — NestJS
│  │  └─ src/
│  │     ├─ main.ts              bootstrap, CORS, validação
│  │     ├─ prisma/              PrismaService + módulo global
│  │     ├─ produtos/            CRUD (controller, service, DTOs)
│  │     └─ vendas/              checkout com transação
│  └─ web/                 FRONTEND — Next.js
│     └─ src/
│        ├─ app/                 layout, página, globals.css
│        ├─ components/          Caixa, Produtos, Cupons, App, ui
│        └─ lib/                 cliente da API, tokens de design, tipos
└─ package.json            workspaces + scripts
```

---

## Requisitos

- Node.js 20 ou superior (confira com `node -v`)
- Uma conta no Supabase (gratuita)

---

## Passo a passo

### 1. Instalar

Na raiz do projeto, um único comando instala os dois apps (workspaces):

```bash
npm install
```

### 2. Criar o banco no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **Project Settings → Database → Connection string**
3. Copie as duas URLs (veja o aviso abaixo sobre por que são duas)

Crie o arquivo `apps/api/.env` a partir do exemplo:

```bash
cp apps/api/.env.example apps/api/.env
# edite e preencha DATABASE_URL e DIRECT_URL
```

> **A pegadinha nº 1 de Prisma + Supabase — são DUAS URLs, não uma.**
> `DATABASE_URL` aponta para o pooler na porta **6543** (com
> `?pgbouncer=true&connection_limit=1`) e é o que a aplicação usa em produção.
> `DIRECT_URL` aponta para a porta **5432** e é o que o `prisma migrate` /
> `prisma db push` usa. Se você usar só a 6543, as migrations falham com um
> erro obscuro de *prepared statement*.

### 3. Preparar as tabelas e os produtos de exemplo

Ainda na raiz:

```bash
npm run db:generate   # gera o Prisma Client
npm run db:push       # cria as tabelas no Supabase
npm run seed          # abastece a prateleira com 12 produtos
```

### 4. Configurar o endereço da API no front

```bash
cp apps/web/.env.example apps/web/.env.local
# o padrão já aponta para http://localhost:3001, então normalmente nada a mudar
```

### 5. Rodar

Abra **dois terminais**:

```bash
# terminal 1 — backend
npm run dev:api      # sobe a API em http://localhost:3001

# terminal 2 — frontend
npm run dev:web      # sobe o site em http://localhost:3000
```

Abra **http://localhost:3000** e o mercadinho está no ar.

---

## As três telas

- **Caixa** — grade de produtos com botões grandes, carrinho fixo na lateral e
  a Missão do Dia no topo. Ao pagar, a criança entrega o dinheiro em cédulas e
  moedas.
- **Produtos** — cadastro com nome, preço, estoque e um seletor de ícones
  dividido em cinco categorias.
- **Cupons** — total do dia, número de compras e o cupom de cada venda.

O coração pedagógico está no pagamento: a criança monta o troco com as próprias
mãos, e um erro devolve uma dica de direção ("passou um pouco", "ainda falta")
em vez da resposta pronta. Dá para pular essa etapa no botão "PULAR".

---

## Endpoints da API

| Método | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/produtos` | lista os produtos ativos |
| `POST` | `/produtos` | cadastra um produto |
| `PATCH` | `/produtos/:id` | edita um produto |
| `DELETE` | `/produtos/:id` | remove (marca como inativo) |
| `GET` | `/vendas` | últimas 50 vendas (os cupons) |
| `POST` | `/vendas` | finaliza uma compra (checkout) |

---

## Três decisões que valem entender

**1. Dinheiro em centavos, sempre.** Todo valor é `Int`. `350` é R$ 3,50.
Ponto flutuante em dinheiro gera o clássico `0.1 + 0.2 = 0.30000000000000004`,
inaceitável numa aula de matemática. A formatação só acontece na hora de
mostrar na tela.

**2. O total é calculado no servidor.** O `POST /vendas` ignora qualquer total
vindo do navegador: relê os preços do banco, soma, confere o estoque e só então
grava — tudo dentro de uma transação do Prisma. Se faltar estoque de um item,
nada é gravado.

**3. Os itens do cupom guardam cópias.** `nameSnapshot`, `emojiSnapshot` e
`unitPriceCents` ficam congelados no item da venda. Se a professora reprecificar
o suco amanhã, o cupom de hoje continua contando a verdade.

---

## Deploy

O front (Next) vai direto para a **Vercel**: importe o repositório, defina a
raiz do projeto como `apps/web` e configure `NEXT_PUBLIC_API_URL` apontando
para onde a API estiver publicada.

A API (NestJS) é um servidor Node de longa duração — publique em um serviço que
mantenha o processo vivo, como **Railway**, **Render** ou uma VM. Configure ali
as variáveis `DATABASE_URL`, `DIRECT_URL`, `PORT` e `WEB_ORIGIN` (a URL do
front na Vercel, para liberar o CORS).

> Se preferir um único deploy na Vercel, dá para migrar os controllers do Nest
> para Route Handlers do Next (`apps/web/src/app/api/...`) e dispensar o backend
> separado — a lógica de `produtos.service.ts` e `vendas.service.ts` é
> reaproveitável quase sem mudanças.

---

## Comandos

| Comando (na raiz) | O que faz |
| --- | --- |
| `npm run dev:api` | roda o backend em desenvolvimento |
| `npm run dev:web` | roda o frontend em desenvolvimento |
| `npm run build:api` | compila o backend |
| `npm run build:web` | compila o frontend |
| `npm run db:generate` | gera o Prisma Client |
| `npm run db:push` | cria/atualiza as tabelas |
| `npm run db:studio` | abre o Prisma Studio |
| `npm run seed` | reabastece a prateleira |

---

## Próximos passos possíveis

- Foto do produto tirada pela turma (Supabase Storage)
- Carteirinha por aluno, com saldo e extrato
- Validar a Missão do Dia e guardar quem cumpriu, para virar relatório
- Nível de dificuldade: preços inteiros → múltiplos de R$ 0,50 → centavos livres
