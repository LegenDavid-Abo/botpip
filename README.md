# BotPip — AI Support Platform for Prop Trading Firms

White-label AI support bot platform. Prop trading firms upload their rules, connect Discord/Telegram/WhatsApp/Slack/Intercom/Zendesk/website, and an AI bot answers trader questions instantly — grounded only in their own documents.

Three roles: **Super Admin** (you, platform owner), **Firm Owner** (your customers), **Playground** (testing sandbox for firms before going live).

---

## 1. What's inside

```
botpip/
├── backend/           Node/Express API + bots + cron jobs
│   ├── server.js      Main API (all REST routes)
│   ├── db/schema.sql   Full Postgres schema — run this in Supabase
│   ├── services/       Claude AI, RAG, email, Stripe, broadcaster, health, auth
│   ├── routes/          Webhook handlers (WhatsApp, Intercom, Zendesk, Slack, widget)
│   ├── bots/            discord.bot.js, telegram.bot.js (standalone processes)
│   └── jobs/cron.js     Scheduled jobs (trial expiry, health checks, reports)
└── frontend/           React + Vite dashboard (firm, admin, playground)
```

## 2. Accounts & API keys you need

Open the **APIs needed** page inside the Super Admin dashboard once it's running — it lists every key with sign-up links and cost estimates. At minimum, to go live, you need:

| Service | Required for | Get it at |
|---|---|---|
| Anthropic | AI bot brain | console.anthropic.com |
| Supabase | Database (Postgres + pgvector) | supabase.com |
| OpenAI | Document embeddings (RAG search) | platform.openai.com |
| Stripe | Billing & subscriptions | dashboard.stripe.com |
| Resend | Transactional email | resend.com |
| Discord | Bot platform | discord.com/developers |

Optional (connect later, per-firm): Twilio (WhatsApp), Telegram BotFather, Intercom, Zendesk, Slack.

## 3. Database setup (Supabase)

1. Create a project at supabase.com.
2. Go to SQL Editor → paste the entire contents of `backend/db/schema.sql` → Run.
   This creates every table, the `match_chunks` vector search function, default plans, and platform settings in one go.
3. Copy your **Project URL** and **service_role key** (Settings → API) — you'll need both for `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

## 4. Backend setup

```bash
cd backend
cp .env.example .env
# Fill in every value in .env — see the table above for where to get each key
npm install
npm start              # starts the API on PORT (default 3001)
```

Run these as **separate, always-on processes** (e.g. separate Railway services, or `pm2`):

```bash
npm run discord        # Discord bot — node bots/discord.bot.js
npm run telegram       # Telegram bot — node bots/telegram.bot.js
npm run cron           # Scheduled jobs — node jobs/cron.js
```

All four (API, Discord bot, Telegram bot, cron) read from the same `.env` and the same Supabase database.

### Backend → Railway

1. Push this repo to GitHub.
2. In Railway: New Project → Deploy from GitHub → select the repo, set root directory to `backend`.
3. Add all variables from `.env.example` in Railway's Variables tab.
4. Set the start command per service: `npm start` (API), `npm run discord`, `npm run telegram`, `npm run cron` — as 4 separate Railway services pointing at the same repo/root, OR use Railway's cron feature for the cron job specifically.
5. Note your Railway-issued backend URL — you'll need it for the frontend's `VITE_API_URL`.

## 5. Frontend setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL to your backend URL (http://localhost:3001 for local dev, or your Railway URL)
npm install
npm run dev             # local dev server
npm run build            # production build → outputs to dist/
```

### Frontend → Vercel

1. In Vercel: New Project → import the same GitHub repo → set root directory to `frontend`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Add environment variable `VITE_API_URL` = your Railway backend URL.
4. Deploy.

## 6. First-time login

- **Super Admin**: go to `/admin/login` on your deployed frontend. Use the `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` you set in the backend `.env`.
- **Firms**: they sign up themselves at `/signup`, or you can add them directly from **Super Admin → All firms → Add firm**.

From the Super Admin dashboard you can, at any time:
- Upgrade or downgrade any firm's plan (Starter / Pro / Enterprise / Trial)
- Pause, reactivate, or delete any firm
- Extend a firm's trial by 7/14/30 days
- Message any individual firm or broadcast to all firms
- Edit pricing and plan features live
- Create discount coupons
- View platform-wide revenue, forecasts, and API cost estimates

## 7. GitHub Actions auto-deploy (optional)

`.github/workflows/deploy.yml` is already set up to deploy on every push to `main`. Add these secrets in your GitHub repo settings:

- `RAILWAY_TOKEN`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## 8. Widget embed (for firms' own websites)

Once a firm connects the "Website widget" integration, they get a single script tag to paste into their site:

```html
<script src="https://YOUR_BACKEND_URL/widget.js" data-id="THEIR_FIRM_ID"></script>
```

This is served directly by the backend (`GET /widget.js`) — no separate deploy needed.

## 9. Notes on AI behavior

The bot is intentionally restrictive — it only answers from documents the firm has uploaded, asks "Evaluation or Master?" before quoting lot sizes, threads every reply to the originating message, and escalates to a human when confidence falls below the firm's configured threshold. All of this is tunable per-firm from their dashboard (AI Behaviour, Response Flow, Style & Emoji pages).
