#!/usr/bin/env bash
# ============================================================================
# 01 - Server preparation (RUN ON THE NEW VPS as root, Ubuntu/Debian)
# ----------------------------------------------------------------------------
# Installs Docker + Compose, adds swap, configures firewall (22/80/443 only).
# Re-run safe (idempotent-ish).
# ============================================================================
set -euo pipefail

# Run fully non-interactive (Ubuntu 24.04 needrestart can otherwise hang on prompts)
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

echo "==> Updating system"
apt-get update -y
apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" upgrade

echo "==> Installing prerequisites (git, curl, ufw, jq, openssl)"
apt-get install -y git curl ufw jq openssl ca-certificates

echo "==> Installing Docker Engine + Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
docker --version
docker compose version

echo "==> Adding 4 GB swap (helps the 12 GB box under spikes)"
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # Lower swappiness so swap is only used under real pressure
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

echo "==> Configuring firewall: allow SSH(22), HTTP(80), HTTPS(443) only"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

echo
echo "==> DONE. Notes:"
echo "    - SSH login settings left untouched (as requested)."
echo "    - Postgres (5432) is NOT opened -> kept internal."
echo "    - Reboot if a new kernel was installed: 'reboot'."
