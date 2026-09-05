#!/usr/bin/env bash
# One-click deploy script for OJ-Tracker
set -e

APP_DIR="/root/oj-tracker"
REPO="https://github.com/aaaaa11111dr/games.git"
BRANCH="master"

echo "==> OJ-Tracker deploy"
echo "    app:   $APP_DIR"
echo "    repo:  $REPO ($BRANCH)"

# ---- 1. Node.js ----
if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node.js 20.x ..."
  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs git
  elif command -v yum >/dev/null 2>&1 || command -v dnf >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs git || dnf install -y nodejs git
  fi
fi
echo "    Node $(node -v)  npm $(npm -v)"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing pm2"
  npm install -g pm2
fi

# ---- 2. Clone fresh (CD OUT first so we don't delete cwd) ----
echo "==> Syncing repo"
cd /
rm -rf "$APP_DIR"

# Retry clone up to 3 times (GitHub 443 timeout on some CN cloud hosts)
for i in 1 2 3; do
  echo "    clone attempt $i/3 ..."
  if git clone --depth 1 --branch "$BRANCH" "$REPO" "$APP_DIR" 2>&1; then
    break
  fi
  rm -rf "$APP_DIR"
  sleep 3
done

cd "$APP_DIR"
echo "    HEAD: $(git rev-parse --short HEAD) $(git log -1 --format=%s)"

# ---- 3. Build ----
echo "==> npm install ..."
npm install --no-audit --no-fund 2>&1 | tail -3

mkdir -p logs data/users

echo "==> Building frontend (base=/ for standalone server) ..."
sed -i "s|base: '/games/'|base: '/'|" vite.config.ts || true
npm run build 2>&1 | tail -10

# ---- 4. pm2 ----
echo "==> pm2"
pm2 delete oj-tracker 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# ---- 5. Firewall ----
(systemctl is-active firewalld >/dev/null 2>&1 && { firewall-cmd --permanent --add-service=http 2>/dev/null; firewall-cmd --permanent --add-service=https 2>/dev/null; firewall-cmd --reload 2>/dev/null; }) || true
(ufw allow 80/tcp 2>/dev/null; ufw allow 443/tcp 2>/dev/null) || true

PUBLIC_IP=$(curl -s --max-time 5 https://ifconfig.me 2>/dev/null || curl -s --max-time 5 http://icanhazip.com 2>/dev/null || echo '<your-ip>')
echo ""
echo "==> DONE =="
echo "    Site      : http://$PUBLIC_IP/"
echo "    API       : http://$PUBLIC_IP/api/health"
echo "    pm2 logs  : pm2 logs oj-tracker"
echo "    data dir  : $APP_DIR/data/users"
echo ""
pm2 status
