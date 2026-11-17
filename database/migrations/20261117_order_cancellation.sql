-- Solicitação e aprovação de cancelamento de pedidos.
-- Execute uma vez no banco existente antes de publicar a funcionalidade.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_status varchar(16) NOT NULL DEFAULT 'none';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_requested_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reviewed_at timestamptz;
ALTER TABLE public.orders ADD CONSTRAINT orders_cancellation_status_check
  CHECK (cancellation_status IN ('none','pending','approved','rejected'));
CREATE INDEX IF NOT EXISTS orders_cancellation_status_idx ON public.orders (cancellation_status);
