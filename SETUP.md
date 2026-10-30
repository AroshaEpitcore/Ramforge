# FrameForge — Setup & Deployment Guide

Everything you need to run FrameForge locally and take it live **as cheaply as possible**.

- **Stack:** Next.js 16 (App Router) · React 19 · Prisma 6 + PostgreSQL · Auth.js (NextAuth v5) ·
  Stripe · Mux (+ YouTube for free videos) · Resend (email) · Tailwind v4.
- **Golden rule on cost:** you can build, test and demo the **entire app for $0/month**. You only
  start paying when you take real payments or outgrow the free tiers.

> New to the project? Read this top-to-bottom once. The two fast paths:
> **[Run it locally](#2-run-it-locally)** · **[Deploy it live](#6-deploy-to-vercel-step-by-step)**.

---

## Table of contents

1. [What you need (accounts & tools)](#1-what-you-need)
2. [Run it locally](#2-run-it-locally)
3. [Environment variables — full reference](#3-environment-variables--full-reference)
4. [Where to host what (+ cheapest options)](#4-where-to-host-what)
5. [Cost summary](#5-cost-summary)
6. [Deploy to Vercel — step by step](#6-deploy-to-vercel-step-by-step)
7. [Wire the services](#7-wire-the-services) — [Neon DB](#71-database--neon-postgres) · [Stripe](#72-payments--stripe) · [Mux](#73-paid-video-streaming--mux) · [Resend](#74-email--resend) · [R2](#75-downloads--cloudflare-r2-optional)
8. [First admin login](#8-first-admin-login)
9. [Go-live checklist](#9-go-live-checklist)
10. [Useful commands](#10-useful-commands)
11. [Troubleshooting](#11-troubleshooting)
12. [Things people forget](#12-things-people-forget)

---

## 1. What you need

**Tools (local machine)**

| Tool       | Version            | Notes                                                                 |
| ---------- | ------------------ | --------------------------------------------------------------------- |
| Node.js    | 20+ (tested on 24) | https://nodejs.org                                                    |
| pnpm       | 11+                | `corepack enable` then `corepack use pnpm@latest`, or `npm i -g pnpm` |
| PostgreSQL | 14+                | Local DB for development (or use a free Neon DB instead)              |
| Git        | any                | to clone / push                                                       |

**Accounts (free to start — create only when you need each)**

| Account    | For                        | When                        |
| ---------- | -------------------------- | --------------------------- |
| GitHub     | code hosting + auto-deploy | now                         |
| Vercel     | app hosting                | to go live                  |
| Neon       | cloud PostgreSQL           | to go live                  |
| Stripe     | payments                   | to sell                     |
| Mux        | paid-video streaming       | to sell paid videos         |
| Resend     | transactional email        | for real emails             |
| Cloudflare | R2 storage (downloads)     | only if you offer downloads |

**You do NOT need** Mux/Stripe/Resend to run locally — free videos use YouTube, and email/payments
degrade gracefully (email logs to the console; buy buttons stay hidden until you enable payments).

---

## 2. Run it locally

```bash
# 1. install dependencies (also generates the Prisma client)
pnpm install

# 2. create your env file
cp .env.example .env
#    then edit .env — for local dev you only need DATABASE_URL, DIRECT_URL and AUTH_SECRET.
#    generate a secret with:  npx auth secret   (or: openssl rand -base64 33)

# 3. create the database + apply the schema  (creates the DB if it doesn't exist)
pnpm db:migrate:dev

# 4. seed starter data (admin user, sample category/course/videos)
pnpm db:seed

# 5. start the dev server
pnpm dev
```

Open **http://localhost:3000**. Sign in at `/login` with the seeded admin:

```
admin@frameforge.test   /   ChangeMe!2026
```

> **No local Postgres?** Skip installing it — create a free **Neon** database (see
> [§7.1](#71-database--neon-postgres)), put its connection strings in `.env`, and run steps 3–5.

---

## 3. Environment variables — full reference

All variables are validated by `src/lib/env.ts`. Copy `.env.example` → `.env`. `.env` is **git-ignored**
— never commit secrets. Set `SKIP_ENV_VALIDATION=1` to bypass validation in CI/Docker.

| Variable                                 | Required?      | What it is                                                                                                        |
| ---------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                               | auto           | `development` / `production`                                                                                      |
| `NEXT_PUBLIC_APP_URL`                    | **yes**        | Public base URL (`http://localhost:3000` locally; your domain in prod)                                            |
| `DATABASE_URL`                           | **yes**        | Postgres connection (use Neon's **pooled** URL in production)                                                     |
| `DIRECT_URL`                             | **yes**        | Direct (unpooled) connection used by `prisma migrate`. Local: same as `DATABASE_URL`. Neon: the **direct** string |
| `AUTH_SECRET`                            | **yes**        | Long random string for signing sessions. `npx auth secret`                                                        |
| `AUTH_URL`                               | no             | Only behind a proxy / custom domain where auto-detect fails                                                       |
| `VIDEO_PROVIDER`                         | **yes**        | `mock` (local) · `mux` (paid video). Free videos use YouTube regardless                                           |
| `STRIPE_SECRET_KEY`                      | for payments   | Stripe secret key (`sk_test_…` / `sk_live_…`)                                                                     |
| `STRIPE_WEBHOOK_SECRET`                  | for payments   | Signing secret for `/api/webhooks/stripe` (`whsec_…`)                                                             |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`     | for payments   | Stripe publishable key (`pk_test_…` / `pk_live_…`)                                                                |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`      | for paid video | Mux API access token                                                                                              |
| `MUX_SIGNING_KEY_ID` / `MUX_SIGNING_KEY` | for paid video | Signed-playback key (`MUX_SIGNING_KEY` = base64 private key)                                                      |
| `MUX_WEBHOOK_SECRET`                     | for paid video | Verifies `/api/webhooks/mux`                                                                                      |
| `EMAIL_FROM`                             | no             | From address for emails (e.g. `no-reply@yourdomain.com`)                                                          |
| `RESEND_API_KEY`                         | for real email | Resend API key. **If unset, emails are logged to the console instead of sent** (fine for dev)                     |
| `VIDEO_SIGNING_KEY`                      | no             | Reserved (generic provider signing)                                                                               |

> **Production hardening:** the required vars currently fall back to insecure _placeholder defaults_
> so the app builds without secrets. Before real launch, set every one to a real value (and consider
> removing the `.default(...)` fallbacks in `src/lib/env.ts` so a missing secret fails the build).

---

## 4. Where to host what

The app is **one deployable Next.js app** (frontend + backend together). You don't run a separate API.
Recommended, cheapest-first setup:

| Piece                    | Recommended (cheapest)                                                        | Alternative                                                     |
| ------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **App (web)**            | **Vercel** — made for Next.js, free Hobby tier                                | Netlify, Render, Railway, a VPS with `pnpm build && pnpm start` |
| **Database**             | **Neon** — serverless Postgres, scales to zero, free tier, branch-per-preview | Supabase, Vercel Postgres, Railway Postgres                     |
| **Free videos**          | **YouTube** (unlisted/public embeds) — $0 at any scale                        | Mux public playback                                             |
| **Paid videos**          | **Mux** — free tier to start, signed playback                                 | Cloudflare Stream, Bunny Stream                                 |
| **Payments**             | **Stripe** — no monthly fee, per-transaction only                             | —                                                               |
| **Email**                | **Resend** — free tier (3k/mo)                                                | Postmark, SendGrid, SES                                         |
| **Downloads (optional)** | **Cloudflare R2** — 10 GB free, **$0 egress**                                 | Backblaze B2, AWS S3                                            |
| **Domain**               | Cloudflare Registrar / Namecheap                                              | any registrar                                                   |

**Why this split?** Media never touches the app server (uploads go browser→Mux, playback streams from
Mux's CDN), so the web app stays tiny and cheap. The database holds only text/metadata.

---

## 5. Cost summary

> Prices checked ~2026 and **change often** — confirm on each provider's pricing page.

| Service                   | While building/testing | Small launch                                |
| ------------------------- | ---------------------- | ------------------------------------------- |
| Vercel                    | **$0** (Hobby)         | ~$20/mo (Pro — required for commercial use) |
| Neon (Postgres)           | **$0** (Free)          | usage-based (~$0–19/mo)                     |
| Mux (paid video)          | **$0** (free tier)     | pay-as-you-go (encode + delivery)           |
| YouTube (free video)      | **$0**                 | **$0**                                      |
| Stripe                    | **$0**                 | ~2.9% + fixed fee **per sale** (no monthly) |
| Resend (email)            | **$0** (free tier)     | $0–20/mo                                    |
| Cloudflare R2 (downloads) | **$0** (10 GB)         | pay-as-you-go, $0 egress                    |
| Domain                    | —                      | ~$10–15 / year                              |

**Bottom line:** **$0/month** to build and demo. At a small launch expect roughly **$20–40/month +
Stripe fees + a domain**, scaling with usage.

**Keep the bill low:** cap Mux uploads at 1080p, serve free content from YouTube, let Neon scale to
zero, cache the public catalogue, and only turn on paid add-ons (Stripe Tax, Mux DRM) when you need them.

---

## 6. Deploy to Vercel — step by step

1. **Push to GitHub** (already done if you're reading this in the repo).
2. **Import the repo** at https://vercel.com/new → pick the repo → Framework preset **Next.js** (auto).
   - If the app lives in a subfolder, set **Root Directory** to `Ramforge`.
3. **Add Environment Variables** (Settings → Environment Variables) — at minimum:
   - `DATABASE_URL`, `DIRECT_URL` → your **Neon** strings ([§7.1](#71-database--neon-postgres))
   - `AUTH_SECRET` → `npx auth secret`
   - `NEXT_PUBLIC_APP_URL` → your Vercel URL (e.g. `https://your-app.vercel.app`)
   - Add Stripe / Mux / Resend vars when you enable those ([§7](#7-wire-the-services)).
4. **Deploy.** The build runs `pnpm build` (`prisma generate && next build`).
5. **Apply the database schema** (the build does _not_ migrate for you). From your machine, with
   `DATABASE_URL`/`DIRECT_URL` pointed at Neon:
   ```bash
   pnpm db:migrate     # prisma migrate deploy
   pnpm db:seed        # optional: seed an admin + samples
   ```
   _(Alternatively add `prisma migrate deploy` to the Vercel build command.)_
6. **Done.** Every push to `main` auto-deploys; branches get preview URLs.

> ⚠️ **Hobby plan is non-commercial.** It's fine for testing (Stripe test mode). Before charging real
> money, move to **Vercel Pro** (or a host that permits commercial use).

---

## 7. Wire the services

Only set up what you need. Free content + accounts work with just the database.

### 7.1 Database — Neon (Postgres)

1. Create a project at https://neon.tech (free).
2. Copy **two** connection strings from the dashboard:
   - **Pooled** (has `-pooler` in the host) → `DATABASE_URL`
   - **Direct** (no pooler) → `DIRECT_URL`
3. Put both in Vercel env vars (and `.env` locally if you want to use Neon in dev).
4. Run `pnpm db:migrate && pnpm db:seed` against it.

> Use Neon **branches** to give each Vercel preview its own database.

### 7.2 Payments — Stripe

1. Create a Stripe account (start in **Test mode**).
2. Dashboard → Developers → API keys:
   - `STRIPE_SECRET_KEY` (`sk_test_…`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_…`)
3. **Webhook:** Developers → Webhooks → Add endpoint →
   `https://YOUR_DOMAIN/api/webhooks/stripe` → listen to **`checkout.session.completed`** and
   **`charge.refunded`** → copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. **Local testing:** install the Stripe CLI and run
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (it prints a `whsec_…` for `.env`).
5. In the app, turn the **Payments** switch **on** at `/admin/settings`.
6. Go live: swap to live keys (`sk_live_…`, `pk_live_…`) and a live webhook secret.

### 7.3 Paid video streaming — Mux

Free videos use **YouTube** (just paste the video id in the admin — no Mux needed). Paid lessons stream
from Mux:

1. Create a Mux account (free tier).
2. Settings → **API Access Tokens** → create one with Mux Video read/write →
   `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`.
3. Settings → **Signing Keys** → create one → `MUX_SIGNING_KEY_ID` and `MUX_SIGNING_KEY`
   (the base64 private key).
4. Settings → **Webhooks** → add `https://YOUR_DOMAIN/api/webhooks/mux` → `MUX_WEBHOOK_SECRET`.
5. Set `VIDEO_PROVIDER=mux`.
6. Upload paid videos on `/admin/uploads`; when Mux finishes processing, the webhook marks them READY.

> Cost tips: cap uploads at 1080p, one Mux asset per video, confirm **signed playback** is available on
> your plan (it's the anti-sharing control).

### 7.4 Email — Resend

Without a key, emails (purchase confirmation, password reset) are **logged to the server console** —
great for dev. For real delivery:

1. Create a Resend account (free: ~3,000/mo).
2. Add + **verify your sending domain** (SPF/DKIM DNS records) — required for inbox delivery.
3. `RESEND_API_KEY` = your key; `EMAIL_FROM` = an address on the verified domain.

### 7.5 Downloads — Cloudflare R2 (optional)

Downloads are **off by default** and only shown for videos marked "allow download" that the user owns.
The download endpoint is provider-based; a real signed-download implementation (Cloudflare R2 presigned
URLs, or Mux static renditions) must be wired before downloads work in production. R2 is recommended
(10 GB free, **$0 egress**). Until then, the Download button returns a clear "not available" message.

---

## 8. First admin login

- Seeded admin: **`admin@frameforge.test` / `ChangeMe!2026`** (from `pnpm db:seed`).
- **Change the password immediately** (Account → Security) — or create your own admin and delete the
  sample.
- Promote other users to staff roles at **`/admin/users`** (Super Admin only).

---

## 9. Go-live checklist

- [ ] Real `AUTH_SECRET`, `DATABASE_URL`/`DIRECT_URL` (Neon), `NEXT_PUBLIC_APP_URL` set in Vercel
- [ ] Database migrated (`pnpm db:migrate`) and an admin account created
- [ ] Admin password changed; sample data removed/replaced
- [ ] Stripe **live** keys + live webhook; `/admin/settings` → Payments **on**
- [ ] Mux keys set + `VIDEO_PROVIDER=mux` (if selling paid video)
- [ ] Resend key + **verified sending domain**
- [ ] Custom domain added in Vercel; `NEXT_PUBLIC_APP_URL` updated to it
- [ ] Vercel plan allows commercial use (Pro)
- [ ] VAT/tax rate set in `/admin/settings` (or enable Stripe Tax for location-based)
- [ ] Legal pages filled in (Privacy, Cookies, Terms, Refund policy)
- [ ] Remove insecure env default fallbacks in `src/lib/env.ts`
- [ ] (Recommended) error tracking (Sentry), rate limiting (Upstash), DB backups, a staging environment

---

## 10. Useful commands

```bash
pnpm dev              # start the dev server
pnpm build            # production build (prisma generate && next build)
pnpm start            # serve the production build
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm test             # vitest (unit/integration)
pnpm e2e              # Playwright smoke test

pnpm db:migrate:dev   # create/apply a migration locally (creates the DB if missing)
pnpm db:migrate       # prisma migrate deploy (production)
pnpm db:seed          # seed admin + sample data
pnpm db:generate      # regenerate the Prisma client
```

---

## 11. Troubleshooting

| Symptom                                                                         | Fix                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Authentication failed against database server`                                 | Wrong DB password/URL. Fix `DATABASE_URL`/`DIRECT_URL`. The `ramforge` DB must exist — `pnpm db:migrate:dev` creates it.                                                                                                  |
| `Environment variable not found: DATABASE_URL` during **build**                 | A page tried to query the DB at build time. DB-backed pages must be dynamic (`export const dynamic = "force-dynamic"` — already set on storefront/admin/account). Don't call the DB from a static page/layout without it. |
| `EPERM … query_engine-windows.dll` on install/commit (Windows)                  | The dev server locks the Prisma engine. Stop `next dev` before `pnpm install` / committing / `prisma generate`.                                                                                                           |
| `ERR_PNPM_IGNORED_BUILDS: esbuild`                                              | Approve the build in `pnpm-workspace.yaml` (`esbuild: true`) or run `pnpm approve-builds`.                                                                                                                                |
| Commit rejected: `subject must not be sentence-case` / `scope must be one of …` | Commit messages are Conventional Commits. Use lowercase subject + an allowed scope, e.g. `feat(ui): …`.                                                                                                                   |
| Emails don't arrive                                                             | No `RESEND_API_KEY` → they're logged to the console (by design). Set the key + verify your domain.                                                                                                                        |
| Buy buttons don't show                                                          | Payments are off. Turn on the switch in `/admin/settings` and set Stripe keys.                                                                                                                                            |
| Paid video won't play in Chrome                                                 | Needs real Mux (HLS) — set `VIDEO_PROVIDER=mux` + Mux keys. The player already supports HLS via hls.js.                                                                                                                   |
| Stripe webhook not granting access                                              | Check the webhook URL/secret and that it's forwarding `checkout.session.completed`. Locally use `stripe listen`.                                                                                                          |

---

## 12. Things people forget

- **Back up the database** — enable Neon backups / periodic exports.
- **A staging environment** — a second Vercel project + Neon branch, with Stripe **test** mode.
- **Email domain verification** (SPF/DKIM) — without it, Resend mail lands in spam.
- **Custom email + app domain** — update `NEXT_PUBLIC_APP_URL` and `EMAIL_FROM` after adding the domain.
- **Security headers / CSP** — a starter CSP is in `next.config.ts`; add any new vendor domains you use.
- **Rate limiting** — add Upstash on `register`/`login`/`forgot-password`/`upload` before public launch.
- **Analytics & monitoring** — Vercel Analytics + Sentry (free tiers).
- **GDPR/consent** — cookie banner ships; add data export/delete if you serve EU users.
- **Rotate the seeded admin password** and remove sample content before launch.
- **Don't commit `.env`** — it's git-ignored; keep real secrets only in Vercel env vars.

---

_See `README.md` for the component/folder tour and `ARCHITECTURE.md` for the full system design._
