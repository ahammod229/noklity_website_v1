-- Add mobile_image_url and settings to hero_banners
ALTER TABLE public.hero_banners ADD COLUMN IF NOT EXISTS mobile_image_url text;
ALTER TABLE public.hero_banners ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;
