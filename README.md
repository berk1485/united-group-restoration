# United Group Restoration — Website

Production-ready storm damage restoration website. Professional baseline for stakeholder demo.

## Quick Start

```bash
cd united-group-restoration
npm install
cp .env.example .env
# Edit .env with your values (ANTHROPIC_API_KEY at minimum for chat)
npm start
# → http://localhost:3000
```

## Pages

| URL | Page | Purpose |
|-----|------|---------|
| `/` | Landing Page | Hero, services, CTA, trust signals |
| `/form.html` | Lead Capture | Contact form → stores lead + email notification |
| `/photos.html` | Photo Upload | Drag-drop damage photos, linked to lead |
| `/chat.html` | AI Support | Claude-powered chat (full page) |
| `/booking.html` | Inspection Booking | Calendar picker + time slots |
| `/admin.html` | Admin Dashboard | View/filter/export leads and bookings |

## API Endpoints

### Leads
- `POST /api/leads` — Submit new lead
- `GET /api/leads` — List leads (filter: `?status=new&search=smith`)
- `GET /api/leads/:id` — Lead detail with photos and bookings
- `PATCH /api/leads/:id/status` — Update status + notes
- `GET /api/leads/export/csv` — Download all leads as CSV

### Photos
- `POST /api/leads/:leadId/photos` — Upload photos for a lead
- `POST /api/photos/temp` — Upload without lead ID
- `GET /api/uploads/:leadId/:filename` — Serve uploaded photo

### Bookings
- `POST /api/bookings` — Create booking
- `GET /api/bookings` — List all bookings
- `GET /api/bookings/availability?date=YYYY-MM-DD` — Available time slots

### Chat
- `POST /api/chat` — Send message, get Claude AI response

### Admin
- `GET /api/stats` — Dashboard stats

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `ANTHROPIC_API_KEY` | Yes* | For AI chat support |
| `SMTP_HOST` | No | Email notifications |
| `SMTP_USER` | No | Email username |
| `SMTP_PASS` | No | Email password |
| `LEAD_NOTIFY_EMAIL` | No | Admin notification email |

*Chat works without Claude API key but gives a fallback message.

## Customization Checklist

Before going live, fill in:

- [ ] Company phone number (search `TODO_PHONE` in HTML files)
- [ ] Service area description
- [ ] Inspector availability (update `allSlots` in `booking.html` or add DB rules)
- [ ] Company logo (`/public/logo.png`)
- [ ] Email templates (in `server.js` `sendEmail` calls)
- [ ] Admin email + password in `.env`
- [ ] SMTP credentials for email delivery
- [ ] Company address / contact info in footer

## Architecture

```
Express.js backend (server.js)
  ├── SQLite database (db/leads.db)
  │   ├── leads table
  │   ├── photos table  
  │   ├── bookings table
  │   └── chat_history table
  ├── Static files (public/)
  └── Uploads (uploads/)
```

## Deploy to Vercel

Add a `vercel.json`:

```json
{
  "version": 2,
  "builds": [{"src": "server.js", "use": "@vercel/node"}],
  "routes": [{"src": "/(.*)", "dest": "server.js"}]
}
```

Note: Vercel serverless has no persistent filesystem. For production, switch to:
- Database: PostgreSQL (Vercel Postgres / Supabase / PlanetScale)
- File storage: AWS S3 / Cloudflare R2 / Uploadthing

## Self-Hosted (Recommended for now)

```bash
# Install PM2 for process management
npm install -g pm2
pm2 start server.js --name ugr-website
pm2 save
pm2 startup

# With nginx reverse proxy on port 80/443:
# proxy_pass http://localhost:3000;
```

## What's NOT Included (Add Before Launch)

- [ ] Authentication for admin dashboard (currently open — add basic auth or session)
- [ ] Real company branding (logo, colors, fonts)
- [ ] Pricing information
- [ ] Service area map
- [ ] Real inspector calendar/availability rules
- [ ] Twilio SMS integration (wired up in .env, just needs activation)
- [ ] SSL certificate (use Let's Encrypt with nginx)

## Tech Stack

- **Frontend**: HTML5 + Tailwind CSS CDN (no build step needed)
- **Backend**: Node.js 18+ + Express.js
- **Database**: SQLite via better-sqlite3
- **AI**: Anthropic Claude (claude-haiku-4-5 for cost efficiency)
- **Email**: Nodemailer (works with Gmail, SendGrid, etc.)
- **Storage**: Local filesystem (uploads/ directory)
