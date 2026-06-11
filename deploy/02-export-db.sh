#!/usr/bin/env bash
# ============================================================================
# 02 - Export database from Supabase CLOUD (RUN ON YOUR MAC, Docker required)
# ----------------------------------------------------------------------------
# Produces roles.sql, schema.sql, data.sql using the Supabase CLI, which runs
# pg_dump inside the matching Postgres image and applies Supabase-specific
# filtering (excludes internal schemas, strips reserved roles).
# DO NOT use raw pg_dump here - it includes Supabase internals and breaks restore.
#
# Get CLOUD_DB_URL from: Dashboard -> Connect -> Session pooler / Direct connection
# (looks like: postgresql://postgres.smvbhwaupvbxqxqxzzjx:[PASSWORD]@aws-0-...:5432/postgres)
#
# Usage:
#   export CLOUD_DB_URL='postgresql://postgres.smvbhwaupvbxqxqxzzjx:PASSWORD@HOST:5432/postgres'
#   ./deploy/02-export-db.sh
# ============================================================================
set -euo pipefail

: "${CLOUD_DB_URL:?Set CLOUD_DB_URL env var (cloud connection string from dashboard)}"

OUT_DIR="$(dirname "$0")/dump"
mkdir -p "$OUT_DIR"

# Use npx so no global install is needed (Docker must be running).
SUPA="npx --yes supabase"

echo "==> 1/3 Dumping roles"
$SUPA db dump --db-url "$CLOUD_DB_URL" -f "$OUT_DIR/roles.sql" --role-only

echo "==> 2/3 Dumping schema (tables, RLS, functions, triggers)"
$SUPA db dump --db-url "$CLOUD_DB_URL" -f "$OUT_DIR/schema.sql"

echo "==> 3/3 Dumping data (COPY format, all rows incl. auth.users)"
$SUPA db dump --db-url "$CLOUD_DB_URL" -f "$OUT_DIR/data.sql" --use-copy --data-only

echo
echo "==> Export complete. Files in: $OUT_DIR"
ls -lh "$OUT_DIR"
echo
echo "NOTE: data.sql contains real customer data + auth.users password hashes."
echo "      Treat it as a secret. Transfer to the server over scp, then delete locally."
