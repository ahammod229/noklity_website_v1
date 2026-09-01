-- ============================================================
-- Header Navigation Columns Migration
-- Run in Supabase SQL Editor AFTER subcategory_migration.sql
-- ============================================================

-- Add show_in_header flag (which categories appear in header nav)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS show_in_header BOOLEAN NOT NULL DEFAULT false;

-- Add header_sort_order for ordering header nav items
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS header_sort_order INTEGER NOT NULL DEFAULT 999;

-- Index for fast header nav queries
CREATE INDEX IF NOT EXISTS categories_show_in_header_idx ON public.categories(show_in_header);
CREATE INDEX IF NOT EXISTS categories_header_sort_order_idx ON public.categories(header_sort_order);
