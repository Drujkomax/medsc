#!/usr/bin/env bash
# ============================================================================
# 03 - Restore database into SELF-HOSTED Postgres (RUN ON THE SERVER)
# ----------------------------------------------------------------------------
# Restores roles.sql, schema.sql, data.sql into the self-hosted instance.
# Disables triggers during data load (session_replication_role=replica) to avoid
# double-encryption / side effects.
#
# SELF_HOSTED_DB_URL default (from supabase-project/.env POSTGRES_PASSWORD):
#   postgres://postgres.your-tenant-id:[POSTGRES_PASSWORD]@localhost:5432/postgres
#
# Usage (from the folder containing ./dump):
#   export SELF_HOSTED_DB_URL='postgres://postgres.your-tenant-id:PASSWORD@localhost:5432/postgres'
#   ./03-restore-db.sh
# ============================================================================
set -euo pipefail

: "${SELF_HOSTED_DB_URL:?Set SELF_HOSTED_DB_URL (self-hosted Supavisor connection string)}"

DUMP_DIR="${DUMP_DIR:-./dump}"
for f in roles.sql schema.sql data.sql; do
  [ -f "$DUMP_DIR/$f" ] || { echo "Missing $DUMP_DIR/$f"; exit 1; }
done

# --- Optional fixes for Postgres 17 (cloud) -> 15 (self-hosted) mismatches ---
# Uncomment if restore fails on transaction_timeout (a PG17-only setting):
#   sed -i 's/^SET transaction_timeout/-- &/' "$DUMP_DIR/data.sql"
# For COPY into tables/columns that don't exist on self-hosted (e.g.
# auth.oauth_clients), comment out that COPY block and its closing "\." line.

echo "==> Restoring (single transaction, triggers disabled during data load)"
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file "$DUMP_DIR/roles.sql" \
  --file "$DUMP_DIR/schema.sql" \
  --command 'SET session_replication_role = replica' \
  --file "$DUMP_DIR/data.sql" \
  --dbname "$SELF_HOSTED_DB_URL"

echo
echo "==> Restore done. Quick verification:"
psql "$SELF_HOSTED_DB_URL" -c '\dt public.*' || true
psql "$SELF_HOSTED_DB_URL" -c 'SELECT count(*) AS users FROM auth.users;' || true
psql "$SELF_HOSTED_DB_URL" -c 'SELECT id, name, public FROM storage.buckets ORDER BY name;' || true
