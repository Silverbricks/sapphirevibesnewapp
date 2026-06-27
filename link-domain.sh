#!/usr/bin/env bash
# Point an already-deployed Sapphire Vibes at a domain + enable HTTPS.
# Run AFTER the domain's A records point at this VPS and have propagated.
#   curl -fsSL https://raw.githubusercontent.com/Silverbricks/sapphirevibesnewapp/main/link-domain.sh | DOMAIN=yourdomain.com EMAIL=you@email.com bash
set -euo pipefail

: "${DOMAIN:?Set DOMAIN=yourdomain.com}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
APP_DIR=/var/www/sapphire

echo "==> Verifying DNS for ${DOMAIN}"
RESOLVED="$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1 || true)"
SERVER_IP="$(curl -s ifconfig.me || true)"
if [ -n "$RESOLVED" ] && [ "$RESOLVED" != "$SERVER_IP" ]; then
  echo "   WARNING: ${DOMAIN} resolves to ${RESOLVED}, not this server (${SERVER_IP})."
  echo "   If DNS hasn't propagated yet, wait and re-run. Continuing anyway in 5s..."
  sleep 5
fi

echo "==> Opening firewall for HTTP/HTTPS"
ufw allow 80/tcp  >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true

echo "==> Setting nginx server_name to ${DOMAIN}"
sed -i "s/server_name .*/server_name ${DOMAIN} www.${DOMAIN};/" /etc/nginx/sites-available/sapphire
nginx -t && systemctl reload nginx

echo "==> Requesting Let's Encrypt certificate"
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

echo "==> Updating app URL"
cd "$APP_DIR"
if grep -q '^NEXTAUTH_URL=' .env; then
  sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=\"https://${DOMAIN}\"|" .env
else
  echo "NEXTAUTH_URL=\"https://${DOMAIN}\"" >> .env
fi
pm2 restart sapphire

echo ""
echo "============================================================"
echo "  Domain linked:  https://${DOMAIN}"
echo "  (auto-renews via certbot; HTTP redirects to HTTPS)"
echo "============================================================"
