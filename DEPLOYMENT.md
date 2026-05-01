# Deployment Guide — United Group Inc. Website

**Stack:** Node.js (Express) · NeDB (file-backed) · Multer uploads · Tailwind via CDN · Claude API for chat.

This app is a single Node process that serves both the marketing site and the admin dashboard, plus a small JSON API. It's deployable to anything that runs Node 18+.

---

## 1. Pre-deploy checklist

- [ ] All values in `.env.production` filled in (copy to `.env` on host)
- [ ] `ADMIN_PASSWORD` changed from default
- [ ] `SESSION_SECRET` regenerated (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] `ANTHROPIC_API_KEY` set (or chat will return an error and fall back to "use the form")
- [ ] SMTP credentials valid (test with a real lead submission before launch)
- [ ] Real domain DNS pointed at the host (A record or CNAME per host's instructions)
- [ ] TLS in front of the app (managed by host, or via your own cert — see §4)

---

## 2. Hosting options (pick one)

### A. Render — easiest for Node + persistent disk
1. Push this repo to GitHub.
2. Render → New → Web Service → connect repo.
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add a **Persistent Disk** (1 GB is plenty) mounted at `/opt/render/project/src/db` — this is where NeDB writes. Mount another at `.../uploads` for photo uploads, or use object storage (S3/R2) and update `server.js` accordingly.
6. Environment → paste contents of `.env.production`.
7. Render auto-provisions HTTPS — leave `USE_HTTPS=false`.

### B. Railway / Fly.io / DigitalOcean App Platform
Same pattern as Render. Make sure you attach a persistent volume for `db/` and `uploads/`. TLS is handled at the edge.

### C. Vercel — **not recommended** for this app
Vercel is serverless; NeDB and the uploads/ directory will not persist across invocations. If you want Vercel, swap NeDB for a managed DB (Postgres/Supabase/Turso) and uploads for S3/R2.

### D. Bare VPS (DigitalOcean Droplet, Linode, EC2)
1. SSH in. Install Node 18+ and `pm2`:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm i -g pm2
   ```
2. Clone the repo, `cd` in, `npm install`, copy `.env.production` to `.env`.
3. Start: `pm2 start server.js --name united-group`
4. Save & enable auto-start: `pm2 save && pm2 startup`
5. Put **nginx** or **Caddy** in front for TLS — see §4.

### E. Heroku
Works, but Heroku's filesystem is ephemeral. Move uploads to S3 and use Heroku Postgres + a NeDB→Postgres migration before relying on it.

---

## 3. Database

NeDB stores data as append-only JSON files in `db/`:
- `leads.db` — contact form submissions
- `bookings.db` — inspection bookings
- `photos.db` — uploaded damage photo metadata
- `chat.db` — chat conversation history

**Backup:** snapshot the `db/` directory daily. A simple cron will do:
```bash
0 3 * * *  tar -czf /backups/ugr-$(date +\%F).tar.gz /path/to/app/db /path/to/app/uploads
```

**Migration to a real DB later:** the schemas are intentionally flat. Reading every record is just `JSON.parse` per line; mapping to Postgres is a one-time script when traffic justifies it.

---

## 4. SSL / HTTPS

### Option 1 — managed host (recommended)
Render / Railway / Fly / DO App Platform / Heroku all terminate TLS at their edge and forward plain HTTP to your app. Leave `USE_HTTPS=false`. Done.

### Option 2 — Caddy in front (bare VPS)
Caddy auto-provisions Let's Encrypt certs. Caddyfile:
```
unitedgroupinc.com, www.unitedgroupinc.com {
    reverse_proxy localhost:3000
    encode gzip
}
```
Then `sudo systemctl reload caddy`.

### Option 3 — nginx + certbot (bare VPS)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
# configure /etc/nginx/sites-available/ugr to proxy_pass to localhost:3000
sudo certbot --nginx -d unitedgroupinc.com -d www.unitedgroupinc.com
```
Auto-renewal is on by default.

### Option 4 — Node terminates TLS itself
Only useful if you can't run a reverse proxy. Generate a real cert (Let's Encrypt's `certbot certonly --standalone` works once you stop the app on :80), then:
```
USE_HTTPS=true
SSL_CERT_PATH=/etc/letsencrypt/live/unitedgroupinc.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/unitedgroupinc.com/privkey.pem
```

### Local HTTPS testing
```bash
node scripts/gen-cert.js          # writes certs/cert.pem and certs/key.pem
USE_HTTPS=true npm start          # macOS/Linux
$env:USE_HTTPS='true'; npm start  # PowerShell
```
Open `https://localhost:3000` — browsers will warn about the self-signed cert, that's expected.

---

## 5. Environment variables (summary)

| Var | Required | Notes |
|---|---|---|
| `PORT` | yes | Port to bind. Most hosts inject this automatically. |
| `NODE_ENV` | yes | Set to `production`. |
| `USE_HTTPS` | no | `true` only if Node itself terminates TLS. |
| `SSL_CERT_PATH` / `SSL_KEY_PATH` | if USE_HTTPS | Absolute paths preferred. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | yes | Change defaults before deploy. |
| `SESSION_SECRET` | yes | 64-char random hex. |
| `ANTHROPIC_API_KEY` | for chat | Otherwise chat returns a fallback. |
| `SMTP_*` | for email notifications | Gmail app password works for MVP. |
| `LEAD_NOTIFY_EMAIL` | yes if email is on | Where new-lead alerts go. |
| `MAX_UPLOAD_SIZE_MB` | no | Default 20. |

---

## 6. Smoke test after deploy

1. `https://your-domain/` loads the landing page, logo + GAF badge visible.
2. Click 📞 — phone link opens dialer (mobile).
3. Submit `/form.html` with a test name+email — confirm the lead lands in admin.
4. `/booking.html` — pick a slot, confirm DB row + (if SMTP set) email arrives.
5. `/photos.html` — upload an image, confirm it shows in admin.
6. Open chat widget — verify it replies (Claude key working).
7. Check `https://your-domain/admin.html` — sign in, see leads.
8. Mobile: load homepage on a phone, verify hamburger menu, gallery, map.

---

## 7. Domain & DNS

1. Buy domain (`unitedgroupinc.com` ideal — confirm availability).
2. Point DNS:
   - **Managed host:** A or CNAME per host's instructions (Render gives `*.onrender.com`).
   - **VPS:** A record → server's public IP for `@` and `www`.
3. Wait 5–60 min for propagation. `dig unitedgroupinc.com` to confirm.
4. Issue/renew TLS cert (auto on managed hosts; certbot/Caddy on VPS).

---

## 8. Monitoring

Cheap & cheerful:
- **Uptime:** UptimeRobot (free) — ping `/` every 5 min, alert on down.
- **Logs:** `pm2 logs united-group` on VPS; managed hosts have web log viewers.
- **Errors:** add Sentry later if traffic justifies it.
- **Backups:** see §3.

---

## 9. Launch sequence

1. Deploy to staging URL → smoke test → fix anything broken.
2. Switch DNS to production host.
3. Verify TLS (`https://`) and `www → apex` redirect.
4. Submit GMB profile (Google Business) with the same NAP (Name/Address/Phone) as the footer.
5. Add Google Analytics or Plausible if you want traffic stats.
6. Tell sales: leads pipeline is live.

---

**Questions or breakage?** Logs first (`pm2 logs` or host log viewer), then `.env` second, then DNS/TLS last. Most "site is broken" reports trace back to a missing env var.
