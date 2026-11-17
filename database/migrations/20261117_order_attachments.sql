-- Optional photo attachments for customer orders.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS attachment_key text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS attachment_name varchar(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS attachment_content_type varchar(100);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS attachment_size integer;
