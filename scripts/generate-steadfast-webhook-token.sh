#!/usr/bin/env bash
set -euo pipefail

# Generates a strong webhook bearer token for Steadfast -> Supabase callback auth.
# Usage:
#   bash scripts/generate-steadfast-webhook-token.sh

token="sf_webhook_$(openssl rand -hex 24)"
echo "$token"
