#!/usr/bin/env bash
# ============================================================================
# 04 - Copy Storage objects CLOUD -> SELF-HOSTED via rclone (S3-to-S3)
# ----------------------------------------------------------------------------
# IMPORTANT: Do NOT copy files directly into volumes/storage. Self-hosted
# Storage uses a different internal layout + needs metadata rows. Use the S3
# protocol on both sides so Storage records the objects correctly.
#
# Prereqs:
#   - Self-hosted S3 protocol endpoint ENABLED (see Supabase "Configure S3 Storage")
#   - Buckets already exist on self-hosted (they do, if DB was restored)
#   - rclone installed:  curl https://rclone.org/install.sh | sudo bash
#
# Cloud S3 creds: Dashboard -> Storage -> S3 Configuration -> Access keys
# Self-hosted S3 creds: REGION, S3_PROTOCOL_ACCESS_KEY_ID, S3_PROTOCOL_ACCESS_KEY_SECRET
#                       from supabase-project/.env
#
# Fill the values below, then run:  ./04-copy-storage.sh
# ============================================================================
set -euo pipefail

# ---- CLOUD (source) ----
CLOUD_S3_KEY_ID="REPLACE_ME"
CLOUD_S3_KEY_SECRET="REPLACE_ME"
CLOUD_S3_ENDPOINT="https://smvbhwaupvbxqxqxzzjx.supabase.co/storage/v1/s3"
CLOUD_S3_REGION="REPLACE_ME"          # e.g. eu-central-1 (your project's region)

# ---- SELF-HOSTED (destination) ----
SELF_S3_KEY_ID="REPLACE_ME"
SELF_S3_KEY_SECRET="REPLACE_ME"
SELF_S3_ENDPOINT="http://localhost:8000/storage/v1/s3"
SELF_S3_REGION="local"

CONF="$(mktemp)"
cat > "$CONF" <<EOF
[platform]
type = s3
provider = Other
access_key_id = ${CLOUD_S3_KEY_ID}
secret_access_key = ${CLOUD_S3_KEY_SECRET}
endpoint = ${CLOUD_S3_ENDPOINT}
region = ${CLOUD_S3_REGION}

[selfhosted]
type = s3
provider = Other
access_key_id = ${SELF_S3_KEY_ID}
secret_access_key = ${SELF_S3_KEY_SECRET}
endpoint = ${SELF_S3_ENDPOINT}
region = ${SELF_S3_REGION}
EOF

echo "==> Verifying both remotes"
rclone --config "$CONF" lsd platform:
rclone --config "$CONF" lsd selfhosted:

echo "==> Copying all buckets"
for bucket in $(rclone --config "$CONF" lsf platform: | tr -d '/'); do
  echo "   -> $bucket"
  rclone --config "$CONF" copy "platform:$bucket" "selfhosted:$bucket" \
    --transfers 4 --checkers 8 --progress
done

echo "==> Sizes (compare source vs dest)"
for bucket in product-images deal-documents; do
  echo "   [$bucket]"
  rclone --config "$CONF" size "platform:$bucket"   || true
  rclone --config "$CONF" size "selfhosted:$bucket" || true
done

rm -f "$CONF"
echo "==> Storage copy complete."
