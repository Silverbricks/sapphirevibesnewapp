#!/usr/bin/env bash
# Fresh one-shot deploy of Sapphire Vibes onto an Ubuntu Hostinger VPS.
# Run as root:
#   curl -fsSL https://raw.githubusercontent.com/Silverbricks/sapphirevibesnewapp/main/deploy-vps.sh | bash
set -euo pipefail

APP_DIR=/var/www/sapphire
REPO=https://github.com/Silverbricks/sapphirevibesnewapp.git
DB_NAME=sapphire
DB_USER=sapphire
DB_PASS="$(openssl rand -hex 16)"

echo "==> [0/8] Ensuring swap (prevents next build OOM on small VPS plans)"
if [ "$(swapon --show | wc -l)" -eq 0 ]; then
  if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile || true
fi

echo "==> [1/8] Installing system packages"
apt-get update -y
apt-get install -y curl git nginx postgresql openssl

NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  MAJ="$(node -v | sed 's/v//' | cut -d. -f1)"
  if [ "$MAJ" -ge 18 ]; then NEED_NODE=0; fi
fi
if [ "$NEED_NODE" = 1 ]; then
  echo "==> Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
command -v pm2 >/dev/null 2>&1 || npm install -g pm2

echo "==> [2/8] Stopping any running instance"
pm2 delete sapphire >/dev/null 2>&1 || true

echo "==> [3/8] (Re)creating PostgreSQL database '$DB_NAME'"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE ROLE $DB_USER LOGIN;"
fi
sudo -u postgres psql -c "ALTER ROLE $DB_USER WITH LOGIN ENCRYPTED PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "==> [4/8] Fetching code from GitHub"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch --all -q
  git -C "$APP_DIR" reset --hard origin/main
else
  rm -rf "$APP_DIR"
  mkdir -p /var/www
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

echo "==> [5/8] Installing dependencies"
npm install --no-audit --no-fund

echo "==> [6/8] Writing .env"
# Force IPv4 — a bare IPv6 host makes an invalid URL and crashes Auth.js.
PUBLIC_IP="$(curl -s -4 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
[ -z "$PUBLIC_IP" ] && PUBLIC_IP="localhost"
cat > .env <<ENV
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
AUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://${PUBLIC_IP}"
AUTH_URL="http://${PUBLIC_IP}"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
ENV

echo "==> [7/8] Migrate + seed + build"
npx prisma migrate deploy
npx prisma db seed
npm run build

echo "==> Starting app with PM2"
pm2 start npm --name sapphire -- start
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo "==> [8/8] Configuring nginx"
# Don't clobber an existing config (it may already hold a domain + HTTPS from link-domain.sh).
if [ ! -f /etc/nginx/sites-available/sapphire ]; then
  cat > /etc/nginx/sites-available/sapphire <<'NGINX'
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
  ln -sf /etc/nginx/sites-available/sapphire /etc/nginx/sites-enabled/sapphire
  rm -f /etc/nginx/sites-enabled/default
else
  echo "    Existing nginx config kept (domain/HTTPS preserved)."
fi
nginx -t && systemctl reload nginx
ufw allow 80/tcp >/dev/null 2>&1 || true

echo ""
echo "============================================================"
echo "  Sapphire Vibes is deployed."
echo "    URL:      http://${PUBLIC_IP}"
echo "    DB name:  ${DB_NAME}"
echo "    DB user:  ${DB_USER}"
echo "    DB pass:  ${DB_PASS}"
echo "  (.env saved at ${APP_DIR}/.env)"
echo "  Demo logins (once auth ships): password123"
echo "============================================================"
