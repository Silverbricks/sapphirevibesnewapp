# Deploying Sapphire Vibes

The flow is: **your machine → GitHub → Hostinger VPS**.

```
 Local dev  ──git push──▶  GitHub repo  ──git pull──▶  Hostinger VPS (Node + PostgreSQL + nginx)
```

You write code locally, push it to GitHub, and the VPS pulls it and runs it. GitHub is the
middle-man — Hostinger never connects to your laptop directly.

---

## 1. GitHub (already linked ✅)

The repository is already connected:

```bash
git remote -v
# origin  https://github.com/Silverbricks/sapphirevibesnewapp.git
```

Daily workflow:

```bash
git add -A
git commit -m "your message"
git push            # publishes to GitHub
```

To work on it from another computer: `git clone https://github.com/Silverbricks/sapphirevibesnewapp.git`

---

## 2. Hostinger VPS — one-time setup

You chose a **VPS** (full Linux server). These steps assume Ubuntu 22.04/24.04. Run them once.

### 2.1 Connect to the VPS

From Hostinger panel → VPS → note the **IP address** and root password, then:

```bash
ssh root@YOUR_VPS_IP
```

### 2.2 Install Node.js 20 + tools

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git nginx
npm install -g pm2
```

### 2.3 Install PostgreSQL + create the database

```bash
apt-get install -y postgresql
sudo -u postgres psql <<'SQL'
CREATE DATABASE sapphire;
CREATE USER sapphire WITH ENCRYPTED PASSWORD 'CHOOSE_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE sapphire TO sapphire;
\c sapphire
GRANT ALL ON SCHEMA public TO sapphire;
SQL
```

Your **connection string** is now:

```
postgresql://sapphire:CHOOSE_A_STRONG_PASSWORD@localhost:5432/sapphire
```

> When the app runs **on the VPS**, it talks to Postgres over `localhost` — you do **not** need to
> expose port 5432 to the internet. Keep it closed for security.

### 2.4 Get the code from GitHub onto the VPS

```bash
cd /var/www
git clone https://github.com/Silverbricks/sapphirevibesnewapp.git sapphire
cd sapphire
npm install
```

### 2.5 Configure environment

```bash
cp .env.example .env
nano .env
```

Set:

```
DATABASE_URL="postgresql://sapphire:CHOOSE_A_STRONG_PASSWORD@localhost:5432/sapphire"
AUTH_SECRET="<run: npx auth secret>"
NEXTAUTH_URL="https://yourdomain.com"
AUTH_GOOGLE_ID="..."        # from Google Cloud Console (optional)
AUTH_GOOGLE_SECRET="..."
```

### 2.6 Migrate, seed, build, run

```bash
npx prisma migrate deploy      # creates all tables
npx prisma db seed             # loads demo catalogue/orders/etc (run once)
npm run build
pm2 start "npm run start" --name sapphire
pm2 save
pm2 startup                    # makes it survive reboots
```

The app is now running on `http://localhost:3000` on the VPS.

### 2.7 Put nginx in front (domain + HTTPS)

```bash
nano /etc/nginx/sites-available/sapphire
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/sapphire /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
# free HTTPS:
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Point your domain's **A record** at `YOUR_VPS_IP` in Hostinger's DNS panel.

---

## 3. Redeploying after changes

Every time you push new code to GitHub, update the VPS:

```bash
ssh root@YOUR_VPS_IP
cd /var/www/sapphire
git pull
npm install
npx prisma migrate deploy      # only if the schema changed
npm run build
pm2 restart sapphire
```

(You can wrap this in a `deploy.sh` script or a GitHub Action later for one-command deploys.)

---

## 4. Letting the developer connect during local development

For me to seed/verify against your VPS database **from this machine**, port 5432 would have to be
reachable. Two safe options:

- **SSH tunnel (recommended, nothing exposed):**
  `ssh -L 5432:localhost:5432 root@YOUR_VPS_IP` then set local `DATABASE_URL` to
  `postgresql://sapphire:PASSWORD@localhost:5432/sapphire`.
- **Temporary remote access:** in `postgresql.conf` set `listen_addresses = '*'`, add a
  `pg_hba.conf` rule for your IP only (`host all all YOUR_IP/32 scram-sha-256`),
  `ufw allow from YOUR_IP to any port 5432`, `systemctl restart postgresql`. Lock it back down afterwards.

> Easiest of all: develop against a **local** database (Docker or local Postgres) and use the VPS
> Postgres only for production. The app is identical either way — only `DATABASE_URL` changes.
