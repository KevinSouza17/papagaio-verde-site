-- Papagaio Verde | executar no SQL Editor do Supabase
create extension if not exists pgcrypto;
create table if not exists public.orders(
 id uuid primary key default gen_random_uuid(),
 order_number text not null unique default ('PV-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
 customer_name text not null check(char_length(customer_name) between 2 and 100),
 contact_phone text not null check(char_length(contact_phone) between 8 and 30),
 customer_email text,service text not null check(char_length(service) between 2 and 120),
 description text not null check(char_length(description) between 2 and 2000),
 status text not null default 'received' check(status in('received','reviewing','awaiting_approval','in_production','ready','delivered','cancelled')),
 total_amount numeric(10,2),due_date date,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.order_status_history(
 id bigint generated always as identity primary key,order_id uuid not null references public.orders(id) on delete cascade,
 old_status text,new_status text,note text check(note is null or char_length(note)<=500),
 changed_by uuid references auth.users(id),created_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create or replace function public.set_order_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end;$$;
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_order_updated_at();
create or replace function public.log_order_status_change() returns trigger language plpgsql security definer set search_path=public as $$
begin if tg_op='INSERT' then insert into public.order_status_history(order_id,new_status,changed_by) values(new.id,new.status,auth.uid());
elsif old.status is distinct from new.status then insert into public.order_status_history(order_id,old_status,new_status,changed_by) values(new.id,old.status,new.status,auth.uid());end if;return new;end;$$;
drop trigger if exists orders_status_history on public.orders;
create trigger orders_status_history after insert or update of status on public.orders for each row execute function public.log_order_status_change();
alter table public.orders enable row level security;alter table public.order_status_history enable row level security;
drop policy if exists "public can create order requests" on public.orders;
create policy "public can create order requests" on public.orders for insert to anon,authenticated with check(status='received' and total_amount is null and due_date is null and char_length(customer_name) between 2 and 100 and char_length(contact_phone) between 8 and 30 and char_length(description) between 2 and 2000);
drop policy if exists "staff can read orders" on public.orders;
create policy "staff can read orders" on public.orders for select to authenticated using(auth.uid() is not null);
drop policy if exists "staff can update orders" on public.orders;
create policy "staff can update orders" on public.orders for update to authenticated using(auth.uid() is not null) with check(auth.uid() is not null);
drop policy if exists "staff can read status history" on public.order_status_history;
create policy "staff can read status history" on public.order_status_history for select to authenticated using(auth.uid() is not null);
drop policy if exists "staff can add internal notes" on public.order_status_history;
create policy "staff can add internal notes" on public.order_status_history for insert to authenticated with check(auth.uid() is not null and changed_by is null);
