-- Papagaio Verde - baseline PostgreSQL
-- Estrutura conferida no banco Neon em 2026-11-17.
-- PostgreSQL 15+. Este arquivo cria estrutura, não copia dados.
-- Para migração com dados, siga database/README.md.

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(100) NOT NULL,
  email varchar(160) NOT NULL UNIQUE,
  phone varchar(30) NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('PV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_name varchar(100) NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 100),
  contact_phone varchar(30) NOT NULL CHECK (char_length(contact_phone) BETWEEN 8 AND 30),
  customer_email varchar(160),
  service varchar(120) NOT NULL,
  description varchar(2000) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','reviewing','awaiting_approval','in_production','ready','delivered','cancelled')),
  total_amount numeric(10,2),
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  customer_user_id uuid REFERENCES public.customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status varchar(32),
  new_status varchar(32) NOT NULL,
  note varchar(500),
  changed_by varchar(255),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_customer_user_id_created_at_idx
  ON public.orders (customer_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.pv_set_order_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.pv_log_order_status_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history(order_id, new_status)
    VALUES (NEW.id, NEW.status);
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history(order_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pv_orders_updated_at ON public.orders;
CREATE TRIGGER pv_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.pv_set_order_updated_at();

DROP TRIGGER IF EXISTS pv_orders_status_history ON public.orders;
CREATE TRIGGER pv_orders_status_history
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.pv_log_order_status_change();
