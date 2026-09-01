-- ============================================================
-- Category Sidebar Order Migration
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/itcrzohckqrfhfxgtemx/sql/new
-- ============================================================

-- 1. Add sidebar_order column (for admin drag-and-drop reordering)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS sidebar_order INTEGER DEFAULT 999;

-- 2. Initialize sidebar_order for existing categories (alphabetical order)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name ASC) AS rn
  FROM public.categories
  WHERE parent_id IS NULL
)
UPDATE public.categories c
SET sidebar_order = r.rn
FROM ranked r
WHERE c.id = r.id;

-- 3. Index for fast ordering
CREATE INDEX IF NOT EXISTS categories_sidebar_order_idx
  ON public.categories(sidebar_order);

-- Done! Now the admin can drag-and-drop to reorder categories.
