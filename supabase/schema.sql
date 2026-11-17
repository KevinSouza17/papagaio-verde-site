-- Papagaio Verde | Supabase PostgreSQL
-- Execute no SQL Editor. O acesso da aplicação ocorre somente pela API Node.js
-- usando DATABASE_URL secreta no servidor. Não há acesso direto pelo navegador.
-- Este script é idempotente e preserva os registros existentes.

create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(100) not null,
  email varchar(160) not null unique,
  phone varchar(30) not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  active boolean not null default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('PV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_name varchar(100) not null check (char_length(customer_name) between 2 and 100),
  contact_phone varchar(30) not null check (char_length(contact_phone) between 8 and 30),
  customer_email varchar(160),
  service varchar(120) not null,
  description varchar(2000) not null,
  status varchar(32) not null default 'received'
    check (status in ('received','reviewing','awaiting_approval','in_production','ready','delivered','cancelled')),
  total_amount numeric(10,2),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_user_id uuid references public.customers(id) on delete set null
);

alter table public.orders
  add column if not exists customer_user_id uuid references public.customers(id) on delete set null;

create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status varchar(32),
  new_status varchar(32) not null,
  note varchar(500),
  changed_by text,
  created_at timestamptz not null default now()
);

-- Compatibilidade com o schema antigo do Supabase, onde changed_by era uuid.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='order_status_history'
      and column_name='changed_by' and data_type='uuid'
  ) then
    alter table public.order_status_history
      alter column changed_by type text using changed_by::text;
  end if;
end $$;

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_customer_user_id_created_at_idx
  on public.orders (customer_user_id, created_at desc);

create or replace function public.pv_set_order_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.pv_log_order_status_change()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history(order_id, new_status)
    values (new.id, new.status);
  elsif old.status is distinct from new.status then
    insert into public.order_status_history(order_id, old_status, new_status)
    values (new.id, old.status, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists pv_orders_updated_at on public.orders;
drop trigger if exists orders_updated_at on public.orders;
create trigger pv_orders_updated_at
before update on public.orders
for each row execute function public.pv_set_order_updated_at();

drop trigger if exists pv_orders_status_history on public.orders;
drop trigger if exists orders_status_history on public.orders;
create trigger pv_orders_status_history
after insert or update of status on public.orders
for each row execute function public.pv_log_order_status_change();

-- Defesa em profundidade: nenhuma política antiga deve liberar tabelas ao browser.
-- A API usa a connection string privada do servidor, nunca a chave anon no cliente.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname='public'
      and tablename in ('customers','orders','order_status_history')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;

-- Sem policies para anon/authenticated: acesso direto pelo navegador fica negado.
-- O backend com a credencial PostgreSQL privada realiza as operações após autenticar.
