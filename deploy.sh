#!/usr/bin/env bash
# One-click deploy script for OJ-Tracker on Ubuntu/CentOS.
# Run this ON the target server (root):
#   curl -sL https://raw.githubusercontent.com/aaaaa11111dr/games/master/deploy.sh | bash
# Or pull the repo first and run ./deploy.sh

set -e

APP_DIR="/root/oj-tracker"
REPO="https://github.com/aaaaa11111dr/games.git"
BRANCH="master"

echo "==> OJ-Tracker deploy script"
echo "    app dir : $APP_DIR"
echo "    repo    : $REPO ($BRANCH)"

# ---- 1. Install prerequisites ----
if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node.js 20.x ..."
  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  elif command -v yum >/dev/null 2>&1 || command -v dnf >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs || dnf install -y nodejs
  else
    echo "ERROR: not Debian nor RHEL-based. Install Node.js manually."; exit 1
  fi
fi

echo "==> Node $(node -v)  npm $(npm -v)"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing pm2 ..."
  npm install -g pm2
fi

# ---- 2. Clone / update ----
if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> Cloning repo ..."
  rm -rf "$APP_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$APP_DIR"
else
  echo "==> Pulling latest ..."
  cd "$APP_DIR"
  git fetch --depth 1 origin "$BRANCH"
  git reset --hard FETCH_HEAD
fi

cd "$APP_DIR"

# ---- 3. Install + build ----
echo "==> npm install ..."
npm install --omit=dev --no-audit --no-fund

mkdir -p logs data/users

echo "==> Building frontend (base=/ for standalone server) ..."
# Temporarily set base to '/' for standalone server (not /games/)
sed -i "s|base: '/games/'|base: '/'|" vite.config.ts || true
npm run build

# ---- 4. pm2 ----
echo "==> pm2 start/restart ..."
pm2 delete oj-tracker 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# ---- 5. Open firewall ----
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
fi
if command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-service=http 2>/dev/null || true
  firewall-cmd --permanent --add-service=https 2>/dev/null || true
  firewall-cmd --reload 2>/dev/null || true
fi

echo ""
echo "==> DONE =="
echo "    App      : http://$(curl -s ifconfig.me 2>/dev/null || echo '<your-ip>')/"
echo "    API      : http://$(curl -s ifconfig.me 2>/dev/null || echo '<your-ip>')/api/health"
echo "    pm2 logs : pm2 logs oj-tracker"
echo "    data dir : $APP_DIR/data/users"
echo ""
pm2 status
