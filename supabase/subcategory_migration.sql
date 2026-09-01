-- ============================================================
-- Subcategory Support Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add parent_id to categories (for subcategory tree)
ALTER TABLE public.categories 
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- 2. Add sort_order for display ordering
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 3. Index for fast parent lookups
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON public.categories(sort_order);

-- 4. Add subcategory column to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 5. Index for subcategory filtering
CREATE INDEX IF NOT EXISTS products_subcategory_idx ON public.products(subcategory);

-- Done! No data migration needed — existing products will have subcategory = NULL which is fine.
