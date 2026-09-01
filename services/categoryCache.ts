/**
 * categoryCache.ts
 * Single in-memory cache for categories so Header, CategorySidebar,
 * and CategoryGrid don't each fire separate Supabase queries.
 * TTL: 5 minutes (refreshed on admin updates).
 */
import { supabase } from '../lib/supabase';

export interface CachedCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  logo_url: string | null;
  parent_id: string | null;
  is_active: boolean;
  show_in_header: boolean;
  header_sort_order: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cache: CachedCategory[] | null = null;
let cacheTimestamp = 0;
let fetchPromise: Promise<CachedCategory[]> | null = null;

async function fetchFromDB(): Promise<CachedCategory[]> {
  const { data } = await supabase
    .from('categories')
    .select('id,name,slug,icon,logo_url,parent_id,is_active,show_in_header,header_sort_order')
    .eq('is_active', true)
    .order('name', { ascending: true });
  return (data as unknown as CachedCategory[]) || [];
}

export async function getCategories(forceRefresh = false): Promise<CachedCategory[]> {
  const now = Date.now();
  if (!forceRefresh && cache && now - cacheTimestamp < CACHE_TTL_MS) {
    return cache;
  }

  // Deduplicate in-flight requests
  if (!fetchPromise) {
    fetchPromise = fetchFromDB()
      .then(result => {
        cache = result;
        cacheTimestamp = Date.now();
        fetchPromise = null;
        return result;
      })
      .catch(err => {
        fetchPromise = null;
        console.error('categoryCache: fetch failed', err);
        return cache || [];
      });
  }

  return fetchPromise;
}

export function invalidateCategoryCache() {
  cache = null;
  cacheTimestamp = 0;
  fetchPromise = null;
}

// Parent categories only
export function getMainCategories(all: CachedCategory[]) {
  return all.filter(c => !c.parent_id);
}

// Subcategories of a given parent
export function getSubcategories(all: CachedCategory[], parentId: string) {
  return all.filter(c => c.parent_id === parentId);
}

// Categories to show in header nav (sorted by header_sort_order)
export function getHeaderNavCategories(all: CachedCategory[]) {
  const headerCats = all
    .filter(c => !c.parent_id && c.show_in_header)
    .sort((a, b) => (a.header_sort_order ?? 999) - (b.header_sort_order ?? 999));

  // Fallback: first 7 parent cats if none are marked show_in_header
  if (headerCats.length === 0) {
    return all.filter(c => !c.parent_id).slice(0, 7);
  }
  return headerCats;
}
