-- Mercadinho da Turma — schema + checkout atômico direto no Supabase.
-- Rode este arquivo inteiro no SQL Editor do painel do Supabase (Project → SQL Editor).
--
-- O banco estava vazio (o Prisma nunca chegou a rodar `db push` neste projeto),
-- então este script cria as tabelas do zero — mesmo formato de
-- prisma/schema.prisma, mas com id em uuid nativo em vez de texto.

-- 1) Tabelas
create table if not exists "Product" (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  emoji       text not null default '📦',
  "priceCents" integer not null,
  stock       integer not null default 0,
  active      boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index if not exists product_active_idx on "Product" (active);

create table if not exists "Sale" (
  id           uuid primary key default gen_random_uuid(),
  "totalCents"  integer not null,
  "paidCents"   integer not null,
  "changeCents" integer not null,
  "createdAt"   timestamptz not null default now()
);
create index if not exists sale_created_at_idx on "Sale" ("createdAt");

create table if not exists "SaleItem" (
  id               uuid primary key default gen_random_uuid(),
  "saleId"          uuid not null references "Sale" (id) on delete cascade,
  "productId"       uuid references "Product" (id) on delete set null,
  "nameSnapshot"    text not null,
  "emojiSnapshot"   text not null,
  "unitPriceCents"  integer not null,
  quantity         integer not null,
  "lineTotalCents"  integer not null
);
create index if not exists sale_item_sale_id_idx on "SaleItem" ("saleId");

-- updatedAt automático em "Product" (equivalente ao @updatedAt do Prisma)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" := now();
  return new;
end;
$$;

drop trigger if exists product_set_updated_at on "Product";
create trigger product_set_updated_at
  before update on "Product"
  for each row execute function public.set_updated_at();

-- 2) Row Level Security
alter table "Product" enable row level security;
alter table "Sale" enable row level security;
alter table "SaleItem" enable row level security;

-- Políticas abertas para a chave anon (o app não tem login, igual hoje).
drop policy if exists "produtos_select_anon" on "Product";
create policy "produtos_select_anon" on "Product"
  for select to anon using (true);

drop policy if exists "produtos_insert_anon" on "Product";
create policy "produtos_insert_anon" on "Product"
  for insert to anon with check (true);

drop policy if exists "produtos_update_anon" on "Product";
create policy "produtos_update_anon" on "Product"
  for update to anon using (true) with check (true);

drop policy if exists "vendas_select_anon" on "Sale";
create policy "vendas_select_anon" on "Sale"
  for select to anon using (true);

drop policy if exists "itens_venda_select_anon" on "SaleItem";
create policy "itens_venda_select_anon" on "SaleItem"
  for select to anon using (true);

-- Sem política de insert/update em "Sale"/"SaleItem" para anon: o checkout só
-- acontece através da função finalizar_venda abaixo (SECURITY DEFINER), nunca
-- por escrita direta na tabela.

-- 3) Função de checkout atômica.
-- Equivalente ao VendasService.finalizar do NestJS: calcula o total no servidor,
-- valida estoque, debita e grava a venda numa única transação. Qualquer
-- `raise exception` desfaz tudo (nada fica gravado pela metade).
create or replace function public.finalizar_venda(itens jsonb, paid_cents integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item_in    jsonb;
  produto    "Product"%rowtype;
  qtd        integer;
  linhas     jsonb := '[]'::jsonb;
  total_cents integer := 0;
  venda_id   uuid;
  resultado  jsonb;
  faltam     numeric;
begin
  if itens is null or jsonb_array_length(itens) = 0 then
    raise exception 'O carrinho está vazio.';
  end if;

  for item_in in select * from jsonb_array_elements(itens)
  loop
    qtd := (item_in->>'quantity')::integer;
    if qtd is null or qtd <= 0 then
      continue;
    end if;

    select p.* into produto
    from "Product" p
    where p.id = (item_in->>'productId')::uuid and p.active = true
    for update;

    if not found then
      raise exception 'Um dos produtos não está mais na prateleira.';
    end if;

    if produto.stock < qtd then
      raise exception 'Só restam % de % na prateleira.', produto.stock, produto.name;
    end if;

    linhas := linhas || jsonb_build_array(jsonb_build_object(
      'productId', produto.id,
      'nameSnapshot', produto.name,
      'emojiSnapshot', produto.emoji,
      'unitPriceCents', produto."priceCents",
      'quantity', qtd,
      'lineTotalCents', produto."priceCents" * qtd
    ));
    total_cents := total_cents + (produto."priceCents" * qtd);

    update "Product" set stock = stock - qtd where id = produto.id;
  end loop;

  if jsonb_array_length(linhas) = 0 then
    raise exception 'O carrinho está vazio.';
  end if;

  if paid_cents < total_cents then
    faltam := (total_cents - paid_cents) / 100.0;
    raise exception 'Faltam R$ % para fechar a compra.', to_char(faltam, 'FM999999990.00');
  end if;

  venda_id := gen_random_uuid();

  insert into "Sale" (id, "totalCents", "paidCents", "changeCents", "createdAt")
  values (venda_id, total_cents, paid_cents, paid_cents - total_cents, now());

  insert into "SaleItem"
    (id, "saleId", "productId", "nameSnapshot", "emojiSnapshot", "unitPriceCents", "quantity", "lineTotalCents")
  select
    gen_random_uuid(),
    venda_id,
    (l->>'productId')::uuid,
    l->>'nameSnapshot',
    l->>'emojiSnapshot',
    (l->>'unitPriceCents')::integer,
    (l->>'quantity')::integer,
    (l->>'lineTotalCents')::integer
  from jsonb_array_elements(linhas) as l;

  select jsonb_build_object(
    'id', s.id,
    'totalCents', s."totalCents",
    'paidCents', s."paidCents",
    'changeCents', s."changeCents",
    'createdAt', s."createdAt",
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', si.id,
        'nameSnapshot', si."nameSnapshot",
        'emojiSnapshot', si."emojiSnapshot",
        'unitPriceCents', si."unitPriceCents",
        'quantity', si.quantity,
        'lineTotalCents', si."lineTotalCents"
      ))
      from "SaleItem" si where si."saleId" = s.id
    ), '[]'::jsonb)
  )
  into resultado
  from "Sale" s
  where s.id = venda_id;

  return resultado;
end;
$$;

grant execute on function public.finalizar_venda(jsonb, integer) to anon, authenticated;

-- 4) Produtos de exemplo (equivalente ao prisma/seed.ts) — opcional, comente
-- este bloco se preferir começar com a prateleira vazia.
insert into "Product" (name, emoji, "priceCents", stock) values
  ('MAÇÃ', '🍎', 150, 12),
  ('BANANA', '🍌', 100, 15),
  ('SUCO DE CAIXINHA', '🧃', 300, 10),
  ('BOLACHA', '🍪', 350, 8),
  ('PÃO', '🍞', 100, 20),
  ('LEITE', '🥛', 450, 6),
  ('PIPOCA', '🍿', 250, 10),
  ('QUEIJO', '🧀', 400, 7),
  ('ÁGUA', '💧', 200, 18),
  ('LÁPIS', '✏️', 175, 25),
  ('CADERNO', '📒', 800, 5),
  ('URSINHO', '🧸', 1200, 4);
