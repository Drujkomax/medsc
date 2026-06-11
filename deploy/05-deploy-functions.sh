#!/usr/bin/env bash
# ============================================================================
# 05 - Install Edge Functions into the SELF-HOSTED stack (RUN ON THE SERVER)
# ----------------------------------------------------------------------------
# Self-hosted edge runtime serves functions from supabase-project/volumes/functions.
# This copies each function's source there and restarts the runtime.
#
# Usage:
#   SRC=/path/to/repo/supabase/functions \
#   PROJECT=/path/to/supabase-project \
#   ./05-deploy-functions.sh
# ============================================================================
set -euo pipefail

SRC="${SRC:?Set SRC = repo's supabase/functions dir}"
PROJECT="${PROJECT:?Set PROJECT = your supabase-project dir}"

DEST="$PROJECT/volumes/functions"
mkdir -p "$DEST"

echo "==> Copying functions"
for dir in "$SRC"/*/; do
  name="$(basename "$dir")"
  echo "   -> $name"
  mkdir -p "$DEST/$name"
  cp -f "$dir"index.ts "$DEST/$name/index.ts"
  [ -f "$dir"deno.json ] && cp -f "$dir"deno.json "$DEST/$name/deno.json" || true
done

echo
echo "==> Set function secrets in $PROJECT/.env (functions service reads these):"
cat <<'EOF'
   TELEGRAM_BOT_TOKEN=...        # @BotFather (used by process-notifications)
   BOT_BACKEND_JWT=...           # used by lead-create, link-telegram, user-role,
                                 #          client-stock-update, enqueue-notification
   # SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are provided
   # to functions by the stack; confirm with: sh run.sh printenv functions
EOF
echo
echo "NOTE: these functions have verify_jwt=false in config.toml:"
echo "      link-telegram, user-role, lead-create, client-stock-update,"
echo "      enqueue-notification, process-notifications."
echo "      In self-hosted, JWT verification is handled by the edge runtime /"
echo "      Kong - confirm those endpoints accept the bot's requests."
echo
cd "$PROJECT"
echo "==> Restarting functions runtime"
sh run.sh recreate functions || docker compose up -d --force-recreate --no-deps functions
echo "==> Done. Test:  curl https://<your-domain>/functions/v1/user-role"
