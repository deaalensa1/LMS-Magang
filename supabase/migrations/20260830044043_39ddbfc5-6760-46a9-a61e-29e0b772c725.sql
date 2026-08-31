ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS drive_url text NOT NULL DEFAULT '';
ALTER TABLE public.modules ALTER COLUMN youtube_url SET DEFAULT '';