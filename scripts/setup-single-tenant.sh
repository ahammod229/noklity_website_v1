#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> Installing dependencies"
npm install

if [[ ! -f ".env.local" ]]; then
  echo "==> Creating .env.local from .env.example"
  cp .env.example .env.local
else
  echo "==> .env.local already exists (skipped copy)"
fi

echo ""
echo "Next steps:"
echo "1) Fill .env.local with your Supabase credentials and tenant overrides."
echo "2) Run supabase/schema.sql in Supabase SQL editor."
echo "3) Run npm run dev"
