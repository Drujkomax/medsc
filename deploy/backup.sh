#!/usr/bin/env bash
# ============================================================================
# Daily database backup (RUN ON THE SERVER via cron)
# ----------------------------------------------------------------------------
# Dumps the self-hosted Postgres and (optionally) syncs off-site.
# A backup that lives only on the same server is NOT a backup.
#
# Install cron (daily 03:00):
#   chmod +x /opt/backups/backup.sh
#   (crontab -l 2>/dev/null; echo '0 3 * * * /opt/backups/backup.sh >> /var/log/pg-backup.log 2>&1') | crontab -
# ============================================================================
set -euo pipefail

BACKUP_DIR="/opt/backups"
DB_CONTAINER="supabase-db"
RETENTION_DAYS=14
TS="$(date +%F_%H%M)"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Dumping database"
docker exec -t "$DB_CONTAINER" pg_dumpall -U postgres | gzip > "$BACKUP_DIR/db_$TS.sql.gz"

echo "[$(date)] Pruning local backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -name 'db_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

# ---- OFF-SITE COPY (strongly recommended) -- uncomment + configure one: ----
# rclone copy "$BACKUP_DIR/db_$TS.sql.gz" remote:msc-backups/   # any S3/B2/Drive
# aws s3 cp "$BACKUP_DIR/db_$TS.sql.gz" s3://my-bucket/msc-backups/

echo "[$(date)] Backup done: db_$TS.sql.gz"
