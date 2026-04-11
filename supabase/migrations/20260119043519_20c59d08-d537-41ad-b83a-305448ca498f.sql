-- Add a JSONB column for structured materials (existing materials column is text[])
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS materials_data JSONB;