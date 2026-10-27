# FrameForge — Architecture

> **Status of this document.** This is a planning + reference document produced after a full
> review of the existing codebase. It describes the application **as it exists today** and proposes
> the **backend architecture** to be built on top of it. Every item is tagged:
>
> - 🟢 **EXISTING** — already implemented in the scaffold and working.
> - 🟡 **PROPOSED** — recommended design for the backend, pending your approval before implementation.
> - 🔴 **NOT YET** — required by the project plan but not implemented and not in the first backend phase.
>
> Nothing in the "PROPOSED" sections has been built yet. Technology choices are in
> [§5](#5-recommended-technology-stack); confirmed decisions are in [§19](#19-decisions-confirmed-2026-10-27).
>
> **Revision 2026-10-27:** video provider changed from Cloudflare Stream to **Mux**; database host set
> to **Neon**; the whole plan is now **cost-minimised for an MVP/test product** — see
> [§22](#22-cost-minimised-mvp-plan).
>
> **Revision 2 (2026-10-27):** scope reduced to a **lean MVP** — mostly free videos, a "Support me"
> donation option, and **courses** (ordered lessons, some free, some paid) monetised later. See
> [MVP scope at a glance](#mvp-scope-at-a-glance) first; it overrides anything broader below.

---

## MVP scope at a glance

**What FrameForge must do first**

- **Admin:** upload videos, assign a **category**, and either group them into **courses** (ordered
  lessons, one video per lesson) or publish them as **standalone videos** with no course. Mark each
  video **Free** or **Paid**; set a price on paid courses and paid standalone videos.
- **Viewers:** browse and watch free videos. In a course, e.g. _lesson 1 free, lessons 2–3 paid_ — the
  free lesson plays for everyone; paid lessons show a locked state with a "Buy course" button.
- **Business model:** at launch almost everything is free, with a **"Support me" donation** option.
  Paid courses are switched on once there is traffic. Payments are therefore a later phase, not the core.

**Launch extras (Phase 4a)** — small features that grow the audience and prepare for monetisation:

1. **Newsletter / email sign-up** — footer and post-video form; the list is the launch channel for paid
   courses. Uses the existing `NewsletterSubscriber` model.
2. **In-context donation prompts** — a "Enjoyed this? Support me" card when a free video ends, in
   addition to the site-wide "Support me" button.
3. **Draft / published status + scheduled publishing** — upload ahead, release on a date.
4. **Lesson notes** — a rich-text/markdown area under each video (timestamps, links, steps).
5. **View counts per video** — from Mux Data, shown in admin, to see which content is worth monetising.
6. **Video SEO** — titles/descriptions, `VideoObject` structured data, videos and courses in the sitemap.
7. **"Payments enabled" switch** in admin settings — while off, prices and buy buttons are hidden and
   paid items show "Coming soon — notify me" (which feeds the newsletter). Turning pricing on needs no
   code release.

**The one access rule**

```
canWatch(user, video) =
     video.accessMode == FREE
  || user owns the video          (Purchase.videoId)
  || user owns the video's course (Purchase.courseId)
  (and the purchase is not revoked)
```

**Phases** (detail in [§20](#20-phased-implementation-plan))

| Phase             | Goal                 | Contents                                                                                                                                                                             |
| ----------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **4a — Launch**   | Publish free content | Admin login, upload (Mux), categories, courses + lesson order, standalone videos, free/paid flag, free playback, "Support me" link, optional customer sign-up, **launch extras 1–7** |
| **4b — Monetise** | Sell courses         | Customer accounts, "Buy course" → Stripe Checkout (no cart), webhook grants access, signed playback for paid lessons, "My library"                                                   |
| **4c — Grow**     | As traffic justifies | Coupons, bundles, reviews, rentals, device limits, VAT/Stripe Tax, invoices, email, extra staff roles, downloads                                                                     |

**Deliberately deferred** (kept in the schema/UI where it already exists, but not built or shown):
cart, rentals, concurrent-device limit, coupons, bundles, banners, email templates, reviews, reports,
downloads/R2, invoices, VAT, refunds workflow (use the Stripe dashboard), and the three middle staff roles.

---

## Table of contents

1. [Project overview & objectives](#1-project-overview--objectives)
2. [What exists today (honest status)](#2-what-exists-today-honest-status)
3. [Existing frontend architecture](#3-existing-frontend-architecture)
4. [Page-by-page functionality & user flows](#4-page-by-page-functionality--user-flows)
5. [Recommended technology stack](#5-recommended-technology-stack)
6. [Database choice: SQL vs NoSQL](#6-database-choice-sql-vs-nosql)
7. [Video storage & streaming choice](#7-video-storage--streaming-choice)
8. [Frontend vs backend responsibilities](#8-frontend-vs-backend-responsibilities)
9. [Database schema](#9-database-schema)
10. [Authentication & authorization](#10-authentication--authorization)
11. [API & server-action design](#11-api--server-action-design)
12. [Video upload, storage, processing & retrieval](#12-video-upload-storage-processing--retrieval)
13. [File & folder structure](#13-file--folder-structure)
14. [Security considerations & validation](#14-security-considerations--validation)
15. [Error handling & logging](#15-error-handling--logging)
16. [Environment variables & configuration](#16-environment-variables--configuration)
17. [Integration map (frontend ↔ backend ↔ db ↔ storage)](#17-integration-map)
18. [Deployment architecture](#18-deployment-architecture)
19. [Decisions (confirmed)](#19-decisions-confirmed-2026-10-27)
20. [Phased implementation plan](#20-phased-implementation-plan)
21. [Scalability & future improvements](#21-scalability--future-improvements)
22. [Cost-minimised MVP plan](#22-cost-minimised-mvp-plan)

---

## 1. Project overview & objectives

FrameForge is a **digital video storefront with a full role-based admin panel**. Customers browse a
catalogue of premium videos (VFX / compositing / filmmaking), watch free previews, then **buy, rent,
or download** the full asset and watch it in a secure in-browser player. Staff manage the catalogue,
pricing, orders, refunds, access grants and site content through an admin area.

Derived from `Video_Purchase_Website_Project_Plan.pdf` (14 Oct 2026), the core objectives are:

- **Sell digital video** three ways: **stream-only**, **downloadable**, and **time-boxed rental**.
- **Protect content**: signed, short-lived playback URLs; no shareable permanent links; a
  concurrent-device limit to deter account sharing.
- **Full commerce**: cart, Stripe checkout (cards, Apple/Google Pay), VAT on digital goods, coupons,
  orders, refunds, PDF invoices, the EU digital-goods cancellation waiver.
- **Full admin**: catalogue CRUD, large-file video upload with progress, manual access grants,
  refund-driven access revocation, customer/review/banner/email/coupon management, reports, activity log.
- **5 roles** with distinct permissions (Super Admin → Customer).

> **MVP note:** the objectives above are the long-term plan. The MVP narrows them to free videos,
> courses with free and paid lessons, donations, and later single-item course purchases — see
> [MVP scope at a glance](#mvp-scope-at-a-glance).

The repository today is a **production-grade scaffold**: design system, UI library, domain model,
Prisma schema, RBAC, provider abstractions, and a built-out home page. **The backend is deliberately
stubbed** — this document plans filling those stubs with real functionality.

---

## 2. What exists today (honest status)

The scaffold is unusually complete on the frontend and _architecturally_ complete on the backend —
the seams for real implementation are already cut. The backend is **mocked/stubbed**, not missing.

| Area                                                            | Status      | Notes                                                            |
| --------------------------------------------------------------- | ----------- | ---------------------------------------------------------------- |
| Design system, UI library (~60 components)                      | 🟢 EXISTING | Radix + CVA, light/dark, `/dev/ui` gallery                       |
| Home page                                                       | 🟢 EXISTING | Full build matching the reference design                         |
| All routes & layouts (shop / account / auth / watch / admin)    | 🟢 EXISTING | Render with **mock data**                                        |
| Prisma schema (20 models)                                       | 🟢 EXISTING | Schema only — **no migrations, no DB connection yet**            |
| RBAC permission map + guards                                    | 🟢 EXISTING | `lib/rbac.ts`, pure & tested                                     |
| `VideoProvider` interface + **mock** provider                   | 🟢 EXISTING | Real providers throw "not implemented"                           |
| Entitlement **decision** helpers (`canWatch`, `canDownload`, …) | 🟢 EXISTING | Pure functions, tested                                           |
| Server-action framework (`defineAction`)                        | 🟢 EXISTING | zod validation + typed result                                    |
| Env validation (`lib/env.ts`)                                   | 🟢 EXISTING | **Insecure placeholder defaults** for local/mock run             |
| Auth config (NextAuth v5, Credentials)                          | 🟡 Stub     | `authorize()` returns `null`; JWT strategy wired                 |
| `getCurrentUser()`                                              | 🟡 Stub     | Returns a **mock user**, not the real session                    |
| Middleware route protection                                     | 🟡 Stub     | Logic written, gated off by `AUTH_ENFORCED = false`              |
| Register / login / change-password forms                        | 🟡 Stub     | Validate client-side, then `toast("not wired")`                  |
| Upload endpoint (`/api/upload`)                                 | 🟡 Stub     | Returns mock upload URL, **no auth check**                       |
| Stripe client + checkout + webhook                              | 🟡 Stub     | `createCheckoutSession` throws; webhook verifies sig then no-ops |
| Entitlement **persistence** (`grantAccess`/`revokeAccess`)      | 🟡 Stub     | Return fake ids; no DB writes                                    |
| All page data                                                   | 🟡 Mock     | Served from `src/mocks/*`, not the database                      |
| Password reset email flow                                       | 🔴 NOT YET  | Form exists; no token/email backend                              |
| PDF invoices                                                    | 🔴 NOT YET  | Field `invoiceNumber` on `Order`; no generation                  |
| Transactional email (Resend)                                    | 🔴 NOT YET  | Env vars reserved                                                |

**Implication for the backend work:** the first phase is primarily _wiring_, not greenfield design —
replace mocks/stubs with real Prisma + provider + Stripe calls behind interfaces that already exist.

---

## 3. Existing frontend architecture

🟢 EXISTING unless noted.

- **Framework:** Next.js 16 (App Router, React Server Components by default, Turbopack). React 19.
- **Styling:** Tailwind CSS v4 (CSS-first `@theme`, OKLCH tokens), dark-default cinematic theme,
  orange accent. Fonts: Orbitron (display) + Rajdhani (body) via `next/font`.
- **UI:** Radix primitives + `class-variance-authority`, shadcn-style local components in
  `components/ui/`, `lucide-react` icons, `sonner` toasts.
- **Forms:** `react-hook-form` + `zod` v4 + `@hookform/resolvers`.
- **Client state:** `zustand` — cart (`stores/cart-store.ts`, `persist`ed to `localStorage` key
  `ramforge-cart`) and UI (`stores/ui-store.ts`). URL state via `nuqs` (`hooks/use-shop-filters.ts`).
- **Server data fetching:** `@tanstack/react-query` provider is mounted (`components/providers.tsx`)
  for client-side data; Server Components currently read from `src/mocks/*`.
- **Tables:** `@tanstack/react-table` v8 (`components/ui/data-table.tsx`).
- **Animation:** `motion` (Framer Motion) with presets in `lib/motion.ts`.
- **Route groups** (each has its own layout):
  - `(shop)` — storefront (navbar + footer + cookie banner).
  - `(account)` — storefront navbar + account sidebar.
  - `(auth)` — centered branded auth card.
  - `(watch)` — minimal dark player shell.
  - `admin/` — collapsible sidebar + topbar + breadcrumbs, nav filtered by permission.
- **SEO:** `lib/seo.ts` `buildMetadata()`, `sitemap.ts`, `robots.ts`, OG/Twitter image routes.
- **Security headers + starter CSP:** `next.config.ts` (allows `js.stripe.com`, image CDNs).

**Key architectural seam:** UI/domain types in `src/types/index.ts` are intentionally decoupled from
the generated Prisma client, so components depend on view models, not DB rows. The backend will map
Prisma rows → these view models in a `server/` data layer.

---

## 4. Page-by-page functionality & user flows

Legend: **B** = built with real UI (on mock data), **P** = `PlaceholderPage`.

### Storefront `(shop)`

| Route                         | State       | Purpose                                                                                | Backend it will need                                                                          |
| ----------------------------- | ----------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/`                           | B           | Home: hero carousel, promo, categories rail, featured/latest/blog                      | Published videos, banners, categories, featured flags                                         |
| `/shop`                       | B           | All videos + `FilterBar` (category, price, length, sort)                               | Paginated video query w/ filters & sort                                                       |
| `/categories`                 | B           | Category tree / accordion rail                                                         | Categories + counts                                                                           |
| `/video/[slug]`               | B           | Details: preview player, metadata, reviews, buy box, related                           | Video by slug, reviews, related, **preview playback URL**                                     |
| `/courses`, `/courses/[slug]` | 🟡 NEW (4a) | Course listing; course page with ordered lessons, free/locked state, "Buy course" (4b) | Courses + lessons + viewer's ownership                                                        |
| `/bundles`, `/bundles/[slug]` | B/P         | Bundle listing & detail                                                                | 🔴 Deferred (4c) — hide from nav                                                              |
| `/cart`                       | B           | Cart (zustand, seeded w/ mock)                                                         | 🔴 Deferred — purchases are single-item ("Buy course" goes straight to Stripe); hide from nav |
| `/checkout`                   | P           | Stripe payment + **waiver checkbox**                                                   | 4b: replaced by Stripe-hosted Checkout; the waiver consent is captured on the buy step        |
| `/order-confirmation`         | P           | Post-purchase thank-you + watch links                                                  | Order lookup by session id                                                                    |
| `/about`, `/faq`, `/contact`  | B           | Marketing / support; contact form                                                      | Contact → email/ticket; **newsletter subscribe (4a)**                                         |
| `/blog`, `/blog/[slug]`       | B/P         | Blog                                                                                   | Posts (not modelled yet)                                                                      |
| `/legal/[slug]`               | P           | Privacy / Cookies / Terms / Refund                                                     | Static content                                                                                |

### Account `(account)` — customer, auth-gated

| Route                 | State | Backend it will need                                                                     |
| --------------------- | ----- | ---------------------------------------------------------------------------------------- |
| `/account`            | B     | Dashboard summary (orders, library counts)                                               |
| `/account/library`    | B     | **Owned/rented videos** → `Purchase` rows for the user, with watch/download/expiry state |
| `/account/orders`     | B     | Order history + **invoice download**                                                     |
| `/account/favourites` | B     | `Favourite` rows                                                                         |
| `/account/profile`    | B     | Update name/email                                                                        |
| `/account/security`   | B     | **Change password**                                                                      |

### Auth `(auth)`

| Route              | State | Backend                                    |
| ------------------ | ----- | ------------------------------------------ |
| `/login`           | B     | `signIn("credentials")` — **Phase 4**      |
| `/register`        | B     | Create account server action — **Phase 4** |
| `/forgot-password` | B     | Reset token + email — 🔴 later             |

### Watch `(watch)`

| Route           | State | Backend                                                               |
| --------------- | ----- | --------------------------------------------------------------------- |
| `/watch/[slug]` | B     | **Entitlement check → signed playback URL → heartbeat** (concurrency) |

### Admin `admin/` — staff, permission-gated

Dashboard + 18 sections (videos, uploads, categories, bundles, orders, refunds, coupons, banners,
emails, customers, reviews, users, access, reports, activity, settings…). Most are `B` on mock data
or `P`. **MVP admin is four sections: videos (incl. upload, notes, schedule, view counts), courses, categories,
settings (incl. the "payments enabled" switch and newsletter subscriber export).** The rest
stay hidden until Phase 4c and are sequenced in [§20](#20-phased-implementation-plan).

**Representative user flows**

1. **Register → verify → login:** user submits register form → server validates + hashes password →
   creates `User(role=CUSTOMER)` → (optional email verify) → `signIn` issues JWT session.
2. **Watch free (4a):** browse → open a free video or the free first lesson of a course → plays
   immediately (no login required unless we choose to gate free content for email sign-ups).
3. **Support me (4a):** "Support me" button → external donation page (Ko-fi / Buy Me a Coffee) or a
   Stripe Payment Link with "customer chooses what to pay". No order, cart or webhook in our app.
4. **Buy a course (4b):** locked lesson → "Buy course" → waiver consent → Stripe Checkout (single item)
   → webhook marks `Order PAID` + `grantAccess()` writes a course `Purchase` → all lessons unlock →
   paid lessons play via short-lived signed URLs.
5. **Admin upload (4a):** admin → request Mux direct-upload URL → browser uploads straight to Mux
   (progress bar) → set title, category, course + position, Free/Paid → publish when Mux reports ready.
6. **Refund (4b, manual):** refund in the Stripe dashboard → `charge.refunded` webhook → `Order` → `REFUNDED` →
   `revokeAccess()` sets `revokedAt` on the `Purchase` and ends active `WatchSession`s.

---

## 5. Recommended technology stack

> 🟡 PROPOSED. Most of this is already chosen by the scaffold; this section makes the choices
> explicit and adds the few missing pieces (hashing, storage, email, rate-limiting).

| Concern                              | Recommendation                                                                                                        | Rationale                                                                                                                                                                                                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend runtime**                  | **Next.js 16 integrated backend** — Route Handlers + Server Actions (no separate server)                              | The frontend is Next.js; its server layer runs the backend in the same deploy. Avoids a second service, shared types end-to-end, one auth context. A standalone API (Nest/Express) only pays off with multiple first-class clients (e.g. native mobile) — not in scope. **Revisit if a mobile app is planned.** |
| **ORM**                              | **Prisma 6** (already in repo)                                                                                        | Type-safe, migrations, Postgres-native. Schema already written.                                                                                                                                                                                                                                                 |
| **Database**                         | **PostgreSQL**                                                                                                        | See [§6](#6-database-choice-sql-vs-nosql).                                                                                                                                                                                                                                                                      |
| **Auth**                             | **Auth.js / NextAuth v5**, Credentials + **JWT sessions** (already wired)                                             | Mature App Router + middleware support. JWT strategy is required for Credentials.                                                                                                                                                                                                                               |
| **Password hashing**                 | **`@node-rs/argon2`** (argon2id), or `bcryptjs` as a simpler fallback                                                 | Argon2id is the current OWASP-recommended KDF. Runs in the Node route handler (not edge middleware).                                                                                                                                                                                                            |
| **Donations (4a)**                   | **Ko-fi / Buy Me a Coffee link**, or a **Stripe Payment Link** ("customer chooses what to pay")                       | Zero code, zero monthly cost. No orders or webhooks in our app.                                                                                                                                                                                                                                                 |
| **Payments (4b)**                    | **Stripe** (SDK already in repo) — single-item Checkout Sessions + webhook                                            | Cards, Apple Pay, Google Pay. No monthly fee — per-transaction only. No cart. **Stripe Tax (paid add-on) deferred.**                                                                                                                                                                                            |
| **Video hosting/streaming**          | ✅ **Mux** for paid lessons; free videos on Mux or YouTube (⏸ pending) — see [§7](#7-video-storage--streaming-choice) | Free plan for build/test (no card), signed playback, auto HLS, Mux Player, thumbnails, direct uploads, built-in analytics.                                                                                                                                                                                      |
| **Downloadable files & misc assets** | **Cloudflare R2** — 🔴 **deferred** (downloads not in MVP)                                                            | Zero egress when downloads arrive. MVP uses Mux-generated thumbnails, so no file store is needed yet.                                                                                                                                                                                                           |
| **Transactional email**              | **Resend** (env vars already reserved)                                                                                | Purchase confirmation + "Watch now", password reset. 🔴 later phase.                                                                                                                                                                                                                                            |
| **PDF invoices**                     | **`@react-pdf/renderer`** or a hosted invoice (Stripe Invoicing)                                                      | 🔴 later phase.                                                                                                                                                                                                                                                                                                 |
| **Rate limiting**                    | **Upstash Redis** free tier (`@upstash/ratelimit`), or a simple Postgres-backed limiter                               | Protect auth + upload endpoints from brute force/abuse. 🟡 recommended add — must stay $0 for MVP.                                                                                                                                                                                                              |
| **Validation**                       | **zod v4** (already in repo)                                                                                          | Shared schemas between client forms and server.                                                                                                                                                                                                                                                                 |
| **Hosting**                          | **Vercel** (`vercel.json` present) + ✅ **Neon** Postgres                                                             | Hobby (free) for build/test; see the commercial-use caveat in [§18](#18-deployment-architecture).                                                                                                                                                                                                               |

---

## 6. Database choice: SQL vs NoSQL

**Recommendation: PostgreSQL (relational / SQL).** This is the correct choice for this domain, and
the scaffold already commits to it. Reasoning below, as requested.

### Why the data is relational

This is a **commerce** domain with strong, interconnected relationships and hard consistency needs:

- **Users ↔ Orders ↔ OrderItems ↔ Purchases(entitlements) ↔ Videos** form a tightly joined graph.
- **Financial integrity**: an order's items, totals, coupon redemption, and the entitlements it
  grants must be written **atomically** (a transaction). Partial writes = customers charged without
  access, or access without payment.
- **Uniqueness & referential constraints**: unique email, unique `(userId, videoId, type)`
  entitlement, unique `(videoId, userId)` review, foreign keys with cascade rules — these are
  first-class in SQL and enforced by the database, not application code.
- **Ad-hoc reporting**: admin reports ("who bought and watched each video", revenue, refunds) are
  natural SQL aggregations/joins.
- **Money as integer minor units** with exact arithmetic — no floating point.

### Comparison

| Factor                              | PostgreSQL (SQL) ✅                        | MongoDB / DocumentDB (NoSQL)                      |
| ----------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| Relationships / joins               | Native, enforced FKs                       | Manual refs or denormalization; app-enforced      |
| Multi-table transactions            | ACID, mature                               | Supported but more limited/costly; easy to misuse |
| Data integrity (unique, FK, checks) | Enforced in-DB                             | Mostly app-level                                  |
| Financial/commerce consistency      | Excellent                                  | Risky without careful design                      |
| Reporting / analytics               | SQL joins & aggregates                     | Aggregation pipeline, less ergonomic for joins    |
| Flexible/unstructured blobs         | `Json`/`Jsonb` columns cover this          | Core strength                                     |
| Horizontal write-scale (massive)    | Vertical + read replicas; sharding is work | Easier to shard                                   |
| Prisma support                      | First-class                                | Supported, fewer relational guarantees            |
| Fit for **this** project            | **Strong**                                 | Poor fit for the commerce core                    |

**Where NoSQL could still help (and how we cover it in Postgres):** truly schema-less blobs
(settings, email-template bodies, activity metadata) are already handled with **`Json` columns**
(`Setting.value`, `ActivityLog.metadata`). Full-text search can start with Postgres `tsvector`/`ILIKE`
and graduate to a dedicated search service later if needed. We get document-store flexibility where we
want it without giving up relational guarantees where they matter.

**Conclusion:** the commerce + access-control + reporting core is unambiguously relational. PostgreSQL
with Prisma is the right, lowest-risk choice. No NoSQL store is needed for the first phases.

---

## 7. Video storage & streaming choice

> Videos are **never** stored in the application database — only **metadata and opaque asset
> references** (`previewAssetId`, `fullAssetId`, `thumbnailUrl`, `fileSizeBytes`). This separation is
> already baked into the schema and the `VideoProvider` interface (`lib/video/types.ts`).

### Requirements (from the plan)

Large files (10 GB+), resumable upload with progress, **transcoding** to adaptive streaming (HLS) for
HD/4K, **signed expiring URLs** (anti-sharing), free **preview** clips, optional **downloads** with
limits, thumbnails, and (future) a **concurrent-device limit**.

### Options compared

| Option                                 | Transcoding                 | Signed URLs            | Player          | Resumable upload               | Pricing model                                                                                                                                                                                                 | Verdict                                                                                               |
| -------------------------------------- | --------------------------- | ---------------------- | --------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Mux** ✅ **CHOSEN**                  | ✅ auto HLS (encoding free) | ✅ signed JWT playback | ✅ (Mux Player) | ✅ direct uploads              | **Free plan:** 10 stored videos + 100K delivery min/month. Paid: storage from ~$0.0024/min/month at 720p (1080p ×1.25, 4K ×4), delivery ~$0.0008/min after free minutes; Launch plan $20/mo incl. $100 credit | **Chosen.** Free start, best DX & analytics. Cheaper than Cloudflare at ≤1080p; dearer at 4K.         |
| **Cloudflare Stream**                  | ✅ auto HLS/DASH            | ✅ signed tokens       | ✅ built-in     | ✅ tus + direct creator upload | $5 / 1,000 min **stored** (prepaid, any resolution) + $1 / 1,000 min **delivered**; no free tier                                                                                                              | **Fallback** — cheaper if the catalogue becomes mostly 4K.                                            |
| **Bunny Stream**                       | ✅                          | ✅ token auth          | ✅              | ✅                             | Cheapest (storage + cheap CDN), optional DRM                                                                                                                                                                  | **Budget option.** Less polished API/analytics.                                                       |
| **Self-host: R2/S3 + ffmpeg + hls.js** | ❌ build it                 | ✅ (presigned)         | ❌ build it     | ✅ (multipart/tus)             | Cheapest storage (R2 = $0 egress)                                                                                                                                                                             | **Most control, most work** (transcoding pipeline, HLS packaging, DRM, player). Not worth it for MVP. |

### Where free videos are hosted (⏸ decision pending)

Because most content will be **free**, free videos — not paid ones — will use most of Mux's free plan
(10 stored videos, 100K delivery minutes/month).

| Option                                                                | Cost                                               | Pros                                                                               | Cons                                                                      |
| --------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **A. YouTube embeds for free videos, Mux for paid** _(recommended)_   | $0 at any traffic                                  | Unlimited free hosting; YouTube discovery brings the traffic needed before pricing | YouTube branding/recommendations in the player; less control; two players |
| **B. Everything on Mux** (free videos use a _public_ playback policy) | $0 until ~10 videos / 100K min, then pay-as-you-go | One consistent player and analytics; full control                                  | Costs grow with free traffic and library size                             |

The schema supports both (`Video.source` = `MUX` or `YOUTUBE`, see §9), so this can be decided — or
changed per video — without code changes elsewhere.

### Decision: Mux (confirmed 2026-10-27)

- **Streaming (full assets + previews): Mux.** Free plan for development and testing; signed playback
  policy satisfies "secure links that expire"; built-in transcoding, thumbnails, player and analytics
  remove the biggest chunk of custom work. Mux **direct uploads** fit the existing
  `createUpload → { uploadUrl, assetId }` contract.
- **Cost rules for Mux (MVP):**
  - **One Mux asset per video.** Serve the free preview as a time-limited section of the full asset
    instead of uploading a separate preview asset — this doubles the effective free-plan capacity
    (10 videos instead of 5). _To verify before build:_ that Mux clipping can be combined with signed
    playback so the preview token cannot play the whole asset. Fallback: a separate low-res preview asset.
  - **Cap uploads at 1080p** (`max_resolution_tier: 1080p`) — 4K storage costs ~4× the 720p rate.
  - Use the **basic** video quality tier where acceptable (lowest encoding/storage cost).
  - ⚠️ Confirm on Mux's pricing page that the **signed playback policy is available on the free plan**
    — it is the core anti-sharing control.
- **Downloads + original files: Cloudflare R2** — 🔴 deferred with downloads. When added, presigned
  short-TTL GET URLs; enforce `downloadLimit`/`downloadCount` in our DB before issuing each URL.
- **Fallback: Cloudflare Stream** if the catalogue moves mostly to 4K (flat per-minute storage wins there).

All providers slot behind the **existing `VideoProvider` interface** — no app/player changes to switch.
We implement `src/lib/video/mux.ts` and set `VIDEO_PROVIDER=mux`; local dev keeps `VIDEO_PROVIDER=mock`
until Mux credentials are supplied.

> **Free-plan limit to plan around:** 10 stored videos. Enough to build and test end to end; expect to
> move to pay-as-you-go or the $20/mo Launch plan before public launch. Prices checked October 2026 —
> re-check mux.com/pricing before committing.

---

## 8. Frontend vs backend responsibilities

| Concern                     | Frontend                      | Backend                                                 |
| --------------------------- | ----------------------------- | ------------------------------------------------------- |
| Rendering, routing, layouts | ✅ RSC + client components    | —                                                       |
| **Input validation**        | UX convenience (zod in forms) | ✅ **Authoritative** (zod in every action/route)        |
| Auth session                | Read session (hooks/RSC)      | ✅ Issue/verify JWT, hash passwords, enforce            |
| Authorization (RBAC)        | Hide UI (`<Can>`)             | ✅ **Enforce** (`requirePermission`)                    |
| Cart                        | ✅ Hold lines (zustand)       | ✅ **Re-price** at checkout (never trust client prices) |
| Pricing / totals / tax      | Display                       | ✅ Compute from DB at checkout                          |
| Payments                    | Redirect to Stripe            | ✅ Create session, verify webhook, grant access         |
| Entitlement decisions       | Reflect state                 | ✅ Decide + persist (`Purchase`)                        |
| Playback URL                | Request & play                | ✅ Check entitlement → **mint signed URL**              |
| Video bytes                 | Upload directly to provider   | ✅ Issue upload URL, persist metadata                   |
| File storage                | —                             | ✅ Mux (R2 later for downloads) — never the app DB      |

**Golden rule:** the client is never trusted for price, ownership, role, or access. All of those are
recomputed/enforced server-side.

---

## 9. Database schema

🟢 EXISTING (`prisma/schema.prisma`, PostgreSQL, 20 models). Money is always **integer minor units**.
No migrations have been generated yet (schema-only). **Proposed change:** generate the initial
migration and connect a real database.

### Entities & relationships (summary)

**Auth & users**

- `User` (id, email _unique_, `passwordHash`, `role`, name, image, emailVerified, timestamps) —
  hub entity. Relations: accounts, sessions, orders, purchases, favourites, reviews, watchSessions,
  activityLogs, grantedPurchases.
- `Account`, `Session`, `VerificationToken` — Auth.js adapter models (OAuth accounts, DB sessions,
  email/reset tokens). _Credentials uses JWT, but these remain for password-reset tokens & future OAuth._
- `Role` enum: `SUPER_ADMIN | STORE_MANAGER | CONTENT_UPLOADER | SUPPORT_STAFF | CUSTOMER`.

**Catalogue**

- `Category` — self-referential tree (`parentId` → `children`), slug _unique_.
- `Video` — title, slug _unique_, description, `tags String[]`, `categoryId`, `thumbnailUrl`,
  `previewAssetId`, `fullAssetId`, `durationSec`, `quality`, `fileSizeBytes BigInt`, `price`,
  `salePrice`, `accessMode` (`FREE|PAID|MEMBERS`), `allowDownload`, `rentalDays`, `status`
  (`DRAFT|PUBLISHED|ARCHIVED`), `viewCount`, timestamps. Indexed on `categoryId`, `status`.
- `Bundle` + `BundleVideo` (join, `position`) — packs of videos at a combined price.

**Commerce**

- `Order` (userId, status `PENDING|PAID|FAILED|REFUNDED|PARTIALLY_REFUNDED`, subtotal/taxTotal/total,
  currency, couponId, `stripePaymentIntentId`, `stripeCheckoutId`, **`waiverConsent` + `waiverConsentAt`**,
  invoiceNumber, timestamps).
- `OrderItem` (order, video? / bundle?, `type EntitlementType`, `unitPrice` snapshot, quantity, rentalDays).
- `Purchase` = **granted entitlement** (userId, videoId, orderId?, `type`, `expiresAt`, `downloadCount`,
  `downloadLimit`, `revokedAt`, `grantedById?`). **Unique `(userId, videoId, type)`.** This is the core
  of access control — both paid purchases and manual staff grants write here.
- `WatchSession` (userId, videoId, deviceLabel, `ipHash`, `lastHeartbeat`, `endedAt`) — enforces the
  concurrent-device limit.
- `Favourite` (userId+videoId composite PK), `Review` (rating, body, `approved`, unique per user+video).

**Marketing & ops**

- `Coupon` (code _unique_, `PERCENT|FIXED`, amount, active, redemption limits, window).
- `Banner`, `EmailTemplate` (key _unique_), `ActivityLog` (audit: action/entity/metadata `Json`),
  `Setting` (key→`Json`), `NewsletterSubscriber`.

### Proposed schema additions (🟡)

Small, additive — do **not** break existing code:

1. **`ProcessedWebhookEvent`** `{ id (Stripe event id) @id, type, createdAt }` — **idempotency** so a
   retried Stripe webhook can't double-grant access. _(Alternatively reuse `ActivityLog`.)_
2. **`PasswordResetToken`** — or reuse `VerificationToken` (identifier=email, hashed token, expiry) for
   forgot-password. _(Phase for password reset; not in first backend phase.)_
3. **`Video.uploadStatus`** enum `{ PENDING, PROCESSING, READY, ERRORED }` (optional) — track provider
   transcoding state so the admin knows when an asset is playable. Could also live in `Setting`/metadata;
   a dedicated column is cleaner.
4. Consider `Review.rating` **check constraint** (1–5) via Prisma `@db` or a DB-level check.
5. **Preview window fields** (MVP cost saving): `Video.previewStartSec` / `previewEndSec` (Int, optional)
   so previews come from the full asset. `previewAssetId` stays in the schema, `null` for MVP.

### MVP content model additions (🟡 Phase 4a)

6. **`Course`** `{ id, title, slug @unique, description, categoryId?, thumbnailUrl?, price, salePrice?,
status (DRAFT|PUBLISHED|ARCHIVED), timestamps }`.
7. **`Video.courseId?` + `Video.position`** — a video belongs to at most one course, ordered by
   `position` (`@@unique([courseId, position])`). Standalone videos have no course. Each video keeps its
   existing `accessMode` (`FREE|PAID`), so "lesson 1 free, lessons 2–3 paid" is just per-video flags.
8. **`Purchase.courseId?`** — a purchase grants either a single video or a whole course
   (`videoId` becomes optional; a check constraint requires exactly one of `videoId` / `courseId`).
   `OrderItem` gains `courseId?` the same way. Buying a course is **one** `Purchase` row, so lessons
   added to the course later are unlocked automatically.
9. **`Video.source`** enum `{ MUX, YOUTUBE }` + `Video.youtubeId?` — supports the free-video hosting
   option in §7.
10. **Roles:** keep the 5-value `Role` enum, but the MVP only assigns `SUPER_ADMIN` and `CUSTOMER`.
    `Bundle`/`BundleVideo` stay in the schema, unused until 4c.

### Launch-extras additions (🟡 Phase 4a)

11. **`Video.publishAt?` / `Course.publishAt?`** — scheduled publishing. An item is visible when
    `status = PUBLISHED` **and** (`publishAt` is null or `publishAt <= now`), evaluated at query time —
    no scheduler or cron job needed.
12. **`Video.notes?`** (markdown text) — lesson notes shown under the player; rendered safely
    (sanitised markdown, no raw HTML).
13. **`Video.viewCount`** (exists) — refreshed from Mux Data views rather than one DB write per play,
    keeping database load and Neon compute low.
14. **`NewsletterSubscriber`** (exists) — add `source?` (footer, post-video, coming-soon) and
    `unsubscribedAt?`; consent captured at sign-up; CSV export from admin settings.
15. **`Setting` key `payments.enabled`** (boolean, default `false`) — read on the server; hides prices and
    buy buttons and blocks `buyCourse` while off.

> ⚠️ **`BigInt` note:** `Video.fileSizeBytes` is `BigInt`. Convert to `Number`/`string` before JSON
> serialization in API responses (`JSON.stringify` cannot serialize `BigInt`). Handle centrally in the
> data-mapping layer.

---

## 10. Authentication & authorization

### Authentication (🟡 to implement; config 🟢 exists)

- **Strategy:** NextAuth v5 **Credentials** provider, **JWT** sessions (`lib/auth.ts`). JWT is mandatory
  for Credentials; the `jwt`/`session` callbacks already propagate `uid` + `role`.
- **Registration** (🟡 Phase 4):
  1. Validate `{ name, email, password }` server-side with zod (email format; **password policy**:
     min 8, recommend complexity).
  2. **Duplicate check** on `email` (unique) — return a 409-style field error.
  3. **Hash** password with argon2id (never store plaintext).
  4. Create `User(role=CUSTOMER)`; write an `ActivityLog`.
  5. Return a typed `ActionResult`; do **not** leak whether the email existed on login errors.
- **Login** (🟡 Phase 4): implement `authorize()` → `db.user.findUnique({ email })` → `argon2.verify` →
  return `{ id, role, name, email }` or `null`. Frontend calls `signIn("credentials", …)` and handles
  the result (replace the toast stub in `login-form.tsx`).
- **Logout:** `signOut()`; JWT is stateless, so "invalidation" = clearing the cookie. (For hard
  revocation, add a token version/`sessionVersion` on `User` checked in the `jwt` callback — optional.)
- **Password change** (🟡): verify current password, re-hash, update (`account/security`).
- **Password reset** (🔴 later): hashed token in `VerificationToken` + Resend email.
- **Email verification** (🔴 optional): `User.emailVerified` already exists.

### Authorization (🟢 exists, 🟡 to enforce)

- **RBAC** is a single code-defined map in `lib/rbac.ts` (`PERMISSIONS`, `ROLE_PERMISSIONS`) — fine-grained
  permissions are code, roles are on `User`.
- **MVP:** two roles in use — `SUPER_ADMIN` (everything) and `CUSTOMER`. The other three roles remain in
  the map for 4c, so adding staff later is a data change, not a code change.
- **Enforcement points:**
  - **Middleware** (`middleware.ts`) — gate `/admin` (staff) and `/account` (logged-in). Logic is written;
    flip `AUTH_ENFORCED = true` once login works.
  - **UI** — `<Can user permission>` hides controls.
  - **Server** — `requirePermission(user, "…")` at the top of every protected action/route handler
    (the authoritative check).
- **`getCurrentUser()`** (`server/current-user.ts`) — 🟡 replace the mock body with
  `const s = await auth(); return s?.user ?? null;`.

---

## 11. API & server-action design

**Convention:** **Server Actions** for form-driven mutations invoked from React (register, profile,
reviews, cart→order, admin CRUD) via the existing `defineAction(schema, handler)` wrapper; **Route
Handlers** for external callers / streaming / webhooks (NextAuth, Stripe webhook, upload URL, playback
URL, downloads). All return consistent shapes and proper HTTP status codes.

**Standard result shape** (already defined): `ActionResult<T> = { ok:true, data } | { ok:false, error, fieldErrors? }`.

### First-phase surface (🟡 Phase 4a)

| Kind   | Name / Route                                                         | Method   | Auth                                   | Purpose                                                      |
| ------ | -------------------------------------------------------------------- | -------- | -------------------------------------- | ------------------------------------------------------------ |
| Action | `registerUser`                                                       | —        | public                                 | Create customer account (validate, dedupe, hash, store)      |
| Auth   | `/api/auth/[...nextauth]`                                            | GET/POST | public                                 | 🟢 exists — login/logout/session via NextAuth                |
| Action | `signIn("credentials")`                                              | —        | public                                 | Login (wired in `login-form.tsx`)                            |
| Action | `changePassword`                                                     | —        | user                                   | Verify current + set new (`account/security`)                |
| Action | `updateProfile`                                                      | —        | user                                   | Update name/email (`account/profile`)                        |
| Route  | `POST /api/upload`                                                   | POST     | `videos:upload`                        | 🟡 **add auth** + return provider direct-upload URL          |
| Action | `createVideoDraft` / `attachAsset` / `publishVideo`                  | —        | `videos:*`                             | Persist `Video` + asset ids, category, Free/Paid             |
| Action | `createCourse` / `updateCourse` / `reorderLessons` / `publishCourse` | —        | `videos:*`                             | Course CRUD + lesson order                                   |
| Action | `createCategory` / `updateCategory`                                  | —        | `categories:*`                         | Category CRUD                                                |
| Route  | `POST /api/webhooks/mux`                                             | POST     | Mux signature                          | Asset ready/errored → `uploadStatus`                         |
| Route  | `GET /api/videos/[id]/playback`                                      | GET      | public if `FREE`; `canWatch` if `PAID` | Free → public playback id (or YouTube id); paid → signed URL |

### Later phases (🔴 / 🟡)

**4b:** `buyCourse` (single-item Stripe Checkout Session + `PENDING` order), Stripe webhook
grant/revoke with idempotency, "My library". **4c:** admin CRUD for bundles/coupons/banners/emails, reviews moderation, manual access grant/revoke, reports,
newsletter, contact. All follow the same action/route conventions.

**HTTP status conventions:** 200 ok, 201 created, 400 validation, 401 unauthenticated, 403 forbidden,
404 not found, 409 conflict (duplicate), 422 semantic, 429 rate-limited, 500 server. Actions map these
into `ActionResult` for the UI; route handlers return them directly.

### Example request/response (register)

```
POST (server action registerUser)
{ "name": "Jane Doe", "email": "jane@x.com", "password": "••••••••" }

→ { "ok": true, "data": { "id": "clx…", "email": "jane@x.com" } }
→ { "ok": false, "error": "Please fix the highlighted fields.",
    "fieldErrors": { "email": ["That email is already registered."] } }
```

---

## 12. Video upload, storage, processing & retrieval

> Designed so streaming, thumbnails, previews, downloads, and rentals can be added incrementally —
> all behind `VideoProvider`.

### Upload (admin, 🟡 Phase 4 for the plumbing)

1. Staff opens `/admin/uploads` (today: `UploadDemo` simulates progress).
2. Client requests an upload target: `POST /api/upload` `{ filename, sizeBytes, contentType }` →
   **server checks `videos:upload`**, validates **type** (`video/*`) and **size** (≤ configured max,
   e.g. 10 GB), then `provider.createUpload()` → Mux direct upload → `{ uploadUrl, assetId }`
   (signed playback policy, 1080p max resolution).
3. Browser uploads bytes **directly to Mux** (resumable chunked upload → real progress bar). Large files
   never pass through our server → avoids function size/time limits and keeps hosting costs at zero.
4. On completion, a server action persists the `Video` (or updates a draft) with `fullAssetId` /
   preview window / `thumbnailUrl` / `durationSec` / `fileSizeBytes`. A **Mux webhook**
   (`video.asset.ready`) sets `uploadStatus = READY` once transcoding finishes — no polling job needed.

### Storage

- Streaming assets: **Mux**, one asset per video (preview served from a time window of it). DB stores
  only `fullAssetId` (+ preview window).
- Thumbnails: **Mux thumbnail URLs** (free, generated from the asset) — no separate image store for MVP.
- Downloadable originals: **R2** — 🔴 deferred with downloads.
- **Nothing** binary in Postgres.

### Retrieval / playback (🟡)

1. A course or video page asks for playback of a video.
2. **Free video (4a):** no login or entitlement check. Mux videos use a **public** playback policy
   (cacheable, no token minting); YouTube videos embed by `youtubeId`.
3. **Paid video (4b):** the server resolves the user and runs `canWatch()` — free, or owns the video,
   or owns its course, and not revoked (see [MVP scope](#mvp-scope-at-a-glance)). If allowed →
   `provider.getPlaybackUrl(fullAssetId, { ttl, viewerId })` → **short-lived signed JWT** for Mux Player.
   If not → locked state with "Buy course".
4. **Previews:** a free first lesson _is_ the course preview, so per-video preview windows are optional.
5. **Concurrent-device limit + heartbeats (🔴 4c):** when added, heartbeat every ≥60 s and treat a session
   as active only if its `lastHeartbeat` is recent — no cleanup job. **Rental expiry (🔴 4c)** is checked at
   request time.

### Downloads (🔴 deferred from MVP)

Only when `video.allowDownload` and the `Purchase.type = DOWNLOAD`. `canDownload()` checks
`downloadLimit`/`downloadCount`; on success mint a signed R2 URL and increment the counter atomically.

### Refund → revoke (🔴 later)

Stripe `charge.refunded` (or admin action) → `revokeAccess()` sets `Purchase.revokedAt` and ends active
`WatchSession`s; next playback request is denied.

---

## 13. File & folder structure

🟢 EXISTING (see `README.md` for the full tree). Where backend code will land (🟡):

```
src/
  app/api/
    auth/[...nextauth]/route.ts   🟢 NextAuth handlers
    upload/route.ts               🟡 add auth + real provider call
    webhooks/stripe/route.ts      🟡 implement grant/revoke (later)
    videos/[id]/playback/route.ts 🟡 NEW — signed playback URL
    videos/[id]/download/route.ts 🔴 later — signed download URL (deferred)
    webhooks/mux/route.ts         🟡 NEW — asset ready/errored → uploadStatus
  lib/
    auth.ts                       🟡 implement authorize()
    video/mux.ts                  🟡 NEW — Mux VideoProvider impl
    stripe/server.ts              🟡 implement createCheckoutSession (later)
  server/
    db.ts                         🟢 Prisma singleton
    current-user.ts               🟡 swap mock → auth()
    services/
      entitlements.ts             🟡 implement grant/revoke persistence
      auth.ts                     🟡 NEW — register/changePassword (or in features/auth)
      videos.ts, orders.ts, …     🟡 NEW — data-access + domain services
    mappers/                      🟡 NEW — Prisma row → src/types view model (handle BigInt)
  features/<domain>/
    actions.ts                    🟡 NEW — server actions (defineAction)
    schemas.ts                    🟡 NEW — zod schemas (shared with forms)
prisma/
  schema.prisma                   🟢 + 🟡 small additive models
  migrations/                     🟡 NEW — generated migrations
```

Principle: **routes/handlers thin → services hold business logic → Prisma for data access → mappers for
view models.** Keep server-only code under `server/` and `lib/*` guarded with `import "server-only"`.

---

## 14. Security considerations & validation

🟡 to implement; several controls 🟢 already present.

- **Server-side validation everywhere** (zod) — client validation is UX only.
- **Password hashing** argon2id; never log or return hashes.
- **Authorization enforced server-side** (`requirePermission`) on every protected action/route, in
  addition to middleware + UI gating. Enable middleware (`AUTH_ENFORCED = true`).
- **Never trust client prices/roles/ownership** — recompute at checkout and on every access check.
- **Signed, short-TTL media URLs**; bind to viewer where supported; never expose permanent asset URLs.
- **Stripe webhook**: verify signature (🟢 done) + **idempotency** (new `ProcessedWebhookEvent`).
- **Mux webhook**: verify the Mux signature header before trusting any asset status change.
- **Rate limiting** (🟡) on `register`, `login`, `forgot-password`, `/api/upload`, playback minting.
- **CORS**: same-origin app → no cross-origin API needed; if a separate client is added later, allowlist
  the exact origin. Keep CSP tight (🟢 starter in `next.config.ts`; add the Mux streaming, image and
  upload domains).
- **Security headers** 🟢 (HSTS, nosniff, frame-deny, referrer, permissions-policy).
- **Secrets** only in env (🟢 validated), never in source; remove insecure **placeholder defaults** for
  production (make vars hard-required).
- **PII / GDPR**: hash IPs (`WatchSession.ipHash` already), store the **cancellation-waiver** consent +
  timestamp (🟢 fields), cookie banner (🟢), support data export/delete (🔴 later).
- **Audit** sensitive actions to `ActivityLog`.
- **Input size limits** on uploads (type + size) before issuing an upload URL.

---

## 15. Error handling & logging

- **Server actions:** `defineAction` already converts thrown errors + zod failures into a typed
  `ActionResult` — never leak stack traces to the client; map `ForbiddenError` → 403-style message.
- **Route handlers:** try/catch → JSON `{ error }` + correct status; log the real error server-side.
- **UI:** `error.tsx` / `global-error.tsx` / `not-found.tsx` boundaries 🟢; `sonner` toasts for action
  results; `loading.tsx` skeletons 🟢.
- **Logging:** structured server logs (Prisma `warn|error` 🟢); route application events to `ActivityLog`.
  Add an external error tracker (e.g. Sentry) in a later phase (🔴).
- **Webhooks:** always 200 on acknowledged events (even unhandled) so Stripe stops retrying; 400 only on
  signature/parse failure.

---

## 16. Environment variables & configuration

🟢 Validated by `lib/env.ts`; documented in `.env.example`. Current vars:

`NODE_ENV`, `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL?`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `EMAIL_FROM?`, `RESEND_API_KEY?`,
`VIDEO_PROVIDER` (`mock|mux|cloudflare|bunny`), `VIDEO_SIGNING_KEY?`.

**Additions (🟡) for the chosen providers:**

- Mux: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_SIGNING_KEY_ID`, `MUX_SIGNING_KEY` (base64 private key),
  `MUX_WEBHOOK_SECRET`; set `VIDEO_PROVIDER=mux` (keep `mock` locally until keys exist).
- Neon: `DATABASE_URL` = **pooled** connection string (runtime); `DIRECT_URL` = direct connection
  (Prisma migrations).
- Rate limiting (optional): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- 🔴 Later, with downloads: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`.

**Production hardening (🟡):** remove the insecure `.default(...)` fallbacks in `env.ts` so missing
secrets fail the build instead of silently using placeholders. `.env.example` will be updated with every
new var (names only, no secrets).

---

## 17. Integration map

```
 Browser (React 19 / Next 16)
   │  forms (RHF+zod)         player / download
   │  Server Actions ─────────────┐        │ signed URL
   ▼                              ▼        ▼
 Next.js server layer (Route Handlers + Server Actions)
   │ requirePermission / defineAction / getCurrentUser(auth())
   ├── Prisma ───────────────► Neon PostgreSQL (pooled)  (users, catalogue, orders, purchases, …)
   ├── VideoProvider ────────► Mux   (upload URL, signed playback, thumbnails) ◄── webhook ── /api/webhooks/mux
   ├── Stripe SDK ───────────► Stripe             (Checkout) ◄── webhook ── /api/webhooks/stripe
   ├── R2 client ────────────► Cloudflare R2      (downloadable files)     [later]
   └── Resend ───────────────► Email              (confirmations, reset)  [later]
```

- **Frontend ↔ backend:** same Next.js app; Server Actions + Route Handlers; shared zod schemas & types.
- **Backend ↔ DB:** Prisma singleton (`server/db.ts`); all writes that span tables use transactions.
- **Backend ↔ storage:** only opaque asset ids/URLs cross the boundary; bytes go browser↔provider directly.
- **Backend ↔ Stripe:** server creates sessions; Stripe calls back via verified webhook to grant access.

---

## 18. Deployment architecture

🟡 PROPOSED (consistent with `vercel.json` 🟢).

- **App:** Vercel (Next.js framework preset). Preview deploys per branch; production on main. Add a
  **staging** environment (per the plan) with its own DB branch + Stripe test mode.
  - ⚠️ **Cost caveat:** Vercel's free **Hobby** plan is intended for non-commercial use. It is fine while
    building and testing with Stripe **test mode**; before taking real payments, check Vercel's current
    terms and plan for **Vercel Pro (~$20/mo)** or a cheaper host that permits commercial use.
- **Database:** ✅ **Neon** serverless Postgres. Free plan for dev/staging (1 GB storage per project,
  compute scales to zero when idle); move to the usage-based **Launch** plan (no monthly minimum) before
  going live. Use Neon's **pooled** URL at runtime (PgBouncer) — no paid Prisma Accelerate. Use Neon
  **branches** for staging/preview databases instead of extra instances.
- **Migrations:** `prisma migrate deploy` in the build/release step (the build already runs
  `prisma generate`).
- **Video:** Mux (provider-managed, global CDN). R2 added later with downloads.
- **Secrets:** Vercel env vars per environment (never in repo).
- **Backups:** managed DB automated backups; periodic export. Provider retains media.
- **Observability:** Vercel's built-in logs + Mux Data (included) + Stripe dashboard; Sentry free tier later.
- **CI:** existing `lint`, `typecheck`, `test`, `build`, `e2e` (Playwright) gate deploys.

---

## 19. Decisions (confirmed 2026-10-27)

1. **Video hosting provider → ✅ Mux** _(changed from Cloudflare Stream on 2026-10-27)_. Free plan
   while building/testing; one asset per video, 1080p cap. R2 only when downloads arrive. Code stays
   behind `VideoProvider`; local dev runs on the **mock** provider until Mux credentials are supplied.
2. **MVP consumption model → ✅ Online streaming only** _(revised)_. Free videos open to all; paid
   lessons via signed URLs from 4b. **Rentals, device limits and downloads deferred** to 4c (fields stay
   in the schema).
3. **Backend shape → ✅ Integrated Next.js backend** (Route Handlers + Server Actions). Confirmed.
4. **Database host → ✅ Neon.** Develop against **local PostgreSQL**
   (`postgresql://…@localhost:5432/ramforge`); Neon free plan for shared dev/staging; Neon Launch
   (usage-based) at go-live. Switching is a `DATABASE_URL` change only.
5. **Email + invoices → later phase** (Resend for transactional email; PDF invoices post-MVP).
6. **Password policy → min 8 characters** for MVP (matches existing forms); can harden later.
7. **Cost principle → ✅ $0/month while building and testing.** Free tiers everywhere; paid upgrades
   only when a real limit is hit or real payments start. Rules in [§22](#22-cost-minimised-mvp-plan).
8. **Scope → ✅ Lean MVP** — see [MVP scope at a glance](#mvp-scope-at-a-glance).
9. **Content model → ✅ Courses** with ordered lessons; each video Free or Paid; course-level purchases.
10. **Donations → ✅ external link or Stripe Payment Link** at launch; no in-app donation backend.
11. **Payments → ✅ single-item "Buy course" via Stripe Checkout in 4b**; no cart.
12. **Roles → ✅ Admin + Customer only** for MVP.
13. **Free-video hosting → ⏸ pending:** YouTube embeds (recommended) vs Mux public playback — see §7.
14. **Standalone videos → ✅** supported alongside courses; free/paid is set per video.
15. **Launch extras → ✅** newsletter, donation prompts, scheduled publishing, lesson notes, view counts,
    video SEO and a "payments enabled" switch are part of Phase 4a.

---

## 20. Phased implementation plan

Aligned with the project plan's phases and the brief's "first backend features" (A register, B login/
auth, C video upload).

**Phase 4a — Launch: publish free content (first deliverable)**

- Connect PostgreSQL (local first, then Neon free); initial Prisma migration incl. the course model
  (§9 items 6–10); seed an admin user and sample categories.
- Admin auth: implement `authorize()` + wire `login-form` + `getCurrentUser()` → `auth()`; flip
  `AUTH_ENFORCED`; `requirePermission` in every admin action.
- Customer `registerUser` + `changePassword`/`updateProfile` — optional in 4a (useful if free content is
  gated for email sign-ups); required in 4b.
- Mux `VideoProvider` (mock until keys exist), `/api/upload` with auth + validation, Mux webhook,
  admin upload with real progress.
- Admin: videos, courses (lesson order), categories, Free/Paid flag, prices (stored; not yet sellable).
- Storefront on real data: home, shop, categories, video page, **course page** with free/locked lessons.
- "Support me" button → donation link, plus an in-context prompt when a free video ends.
- **Launch extras:** newsletter sign-up (footer, post-video, "notify me" on paid items) with admin CSV
  export; draft/published + scheduled publishing; lesson notes; view counts from Mux Data in admin;
  video SEO (metadata, `VideoObject` structured data, sitemap entries for videos and courses);
  `payments.enabled` setting gating all pricing UI.
- Hide deferred UI (cart, bundles, rentals, extra admin sections).
- Tests: login, admin authz, upload authz, `canWatch` (free / owns video / owns course / revoked),
  scheduled visibility, payments switch on/off, newsletter sign-up validation.

**Phase 4b — Monetise: sell courses (when traffic justifies it)**

- Flip `payments.enabled`; email the newsletter list about the first paid course.
- Customer accounts required for purchase; "Buy course" (or a paid standalone video) → single-item
  Stripe Checkout with waiver consent.
- Stripe webhook → `Order PAID` + course `Purchase`, with idempotency (`ProcessedWebhookEvent`); refunds
  via Stripe dashboard → webhook revokes.
- Signed playback for paid lessons; "My library" and order history on real data.
- Move to Neon Launch + a commercial-use hosting plan; rate limiting on auth endpoints.

**Phase 4c — Grow (as needed)**

- Coupons, bundles, reviews, rentals, concurrent-device limit, downloads + R2, VAT via Stripe Tax,
  invoices, transactional email (Resend), password reset, extra staff roles, reports, activity log UI,
  Sentry.

---

## 21. Scalability & future improvements

The architecture is intentionally built so each concern scales independently; nothing here is required
for MVP but each is a known, low-friction next step.

### Scales well already (by design)

- **Stateless app tier.** JWT sessions mean the Next.js server holds no session state — it scales
  horizontally on Vercel/serverless with no sticky sessions.
- **Media offloaded to a CDN.** Bytes never touch the app server; uploads go browser→provider and
  playback is served from Mux's CDN. The app only mints short-lived signed URLs, so streaming
  load is independent of app capacity.
- **Money as integer minor units** and DB-enforced constraints keep correctness invariant under load.
- **Provider-agnostic seams** (`VideoProvider`, the `server/` data layer, `defineAction`) let us swap
  implementations without touching callers.

### Database scaling path

- **Connection pooling** (Neon pooled URL / PgBouncer) is used from day one; Prisma Accelerate only if
  ever needed.
- **Read replicas** for heavy read paths (catalogue, reports); route reads via Prisma replica config.
- **Indexes** already exist on hot columns (`status`, `categoryId`, `userId`); add composite/partial
  indexes as query patterns emerge. Keep `EXPLAIN`-driven tuning in the loop.
- **Archival/partitioning** for high-volume append tables (`ActivityLog`, `WatchSession`) once they grow.

### Performance

- **Caching**: Next.js route/data caching for the public catalogue; a Redis/Upstash layer for hot
  reads (home, category counts) and for rate limiting.
- **Search**: start with Postgres `tsvector`/trigram; graduate to a dedicated engine (Typesense/Meili/
  Algolia) if search volume or relevance needs demand it.
- **Image/thumbnail optimization** via `next/image` (already configured) + provider thumbnails.

### Reliability & operations

- **Webhook idempotency** (`ProcessedWebhookEvent`) and retry-safe grant/revoke.
- **Background jobs** (queue) for email, invoice generation and similar work once volume justifies it.
  The MVP deliberately needs none: rental expiry and stale sessions are evaluated at request time, and
  transcoding status arrives by Mux webhook.
- **Observability**: Sentry (errors), structured logs, uptime checks, Stripe/Mux dashboards.
- **Backups & staging**: automated DB backups + a staging environment with Stripe test mode (per plan).

### Product/feature roadmap (schema already anticipates most)

- Downloads with per-purchase limits (schema + `canDownload` ready; endpoint deferred from MVP).
- DRM for higher-value content (Mux offers it as a paid add-on).
- Memberships/subscriptions (`AccessMode.MEMBERS` already modelled).
- Coupons, bundles, gift purchases, affiliate/referral tracking.
- PDF invoices, EU VAT via Stripe Tax (paid add-on, deferred from MVP), multi-currency.
- OAuth sign-in (Google/Apple) — `Account` adapter model already present.
- Admin analytics/reporting dashboards over the existing relational data.
- Native mobile client — _this_ is the trigger to extract a standalone API; until then the integrated
  backend is the right call.

### Security hardening (post-MVP)

- Remove insecure env placeholder defaults (fail-closed in prod), add breached-password checks, 2FA,
  session/token revocation (`sessionVersion`), per-IP/user rate limits, CSP tightening per provider,
  GDPR data export/delete.

---

## 22. Cost-minimised MVP plan

FrameForge is an **MVP / test product**, so cost is a first-class architectural constraint: **$0/month
while building and testing**, and only small, deliberate upgrades at launch.

### Service choices and expected cost

| Piece                    | MVP choice                                                     | Cost while building/testing | At small launch                                                   |
| ------------------------ | -------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| Hosting                  | Vercel Hobby                                                   | $0                          | ~$20/mo (Vercel Pro) or a cheaper host that allows commercial use |
| Database                 | Neon Free (pooled URL; branches for staging)                   | $0                          | Neon Launch — usage-based, no minimum                             |
| Video (paid lessons)     | Mux Free (10 stored videos, 100K delivery min/mo)              | $0                          | Pay-as-you-go or Launch $20/mo                                    |
| Video (free content)     | YouTube embeds (recommended, ⏸ pending) or Mux public playback | $0                          | $0 on YouTube; Mux usage otherwise                                |
| Thumbnails               | Mux-generated thumbnail URLs                                   | $0                          | $0                                                                |
| File storage / downloads | Not used (downloads deferred)                                  | $0                          | R2 when downloads ship                                            |
| Donations                | Ko-fi / Buy Me a Coffee link or Stripe Payment Link            | $0                          | Platform/transaction fees only                                    |
| Payments (4b)            | Stripe single-item Checkout, no Stripe Tax                     | $0                          | Per-transaction fees only                                         |
| Email                    | Deferred; Resend free tier when added                          | $0                          | Free tier                                                         |
| Rate limiting            | Upstash free tier or Postgres-backed limiter                   | $0                          | $0                                                                |
| Error tracking           | Deferred; Sentry free tier later                               | $0                          | $0                                                                |
| Domain                   | —                                                              | —                           | Domain registration fee                                           |

**Expected total:** **$0/month** during development and testing; roughly **$20–40/month** plus Stripe
fees and a domain at a small launch.

### Design rules that keep the bill low

1. **One Mux asset per video** — previews are a time window of the full asset (§7, §12).
2. **1080p upload cap** — avoids the 4K storage multiplier.
3. **No background jobs or queues** — rental expiry and stale watch sessions are evaluated at request
   time; Mux webhooks report transcoding status.
4. **Heartbeats ≥60 s** — keeps Neon compute able to scale to zero and within free compute hours.
5. **Cache the public catalogue** (Next.js route/data caching) so most page views never hit the database.
6. **Pooled Neon URL instead of paid Prisma Accelerate.**
7. **Defer paid add-ons** — Stripe Tax, Mux DRM, custom Mux domains, Sentry paid tiers.
8. **Neon branches, not extra databases**, for staging and preview environments.
9. **Free content off Mux** (if option A in §7 is chosen) — free traffic then costs nothing at any scale.
10. **Build less:** no cart, rentals, device limits or extra admin sections until 4c.
11. **No jobs for launch extras:** scheduled publishing is a query-time date check; view counts come from
    Mux Data; newsletter export is an on-demand CSV — no email service is needed until 4c.

### Upgrade triggers (when to start paying)

- **More than 10 videos on Mux** → Mux pay-as-you-go or Launch.
- **Taking real payments** → Vercel Pro (or a commercial-use host) + Neon Launch for backups and no
  free-plan suspension limits.
- **Real EU/UK sales volume** → enable Stripe Tax.

> Prices and free-plan limits were checked in October 2026 and change often — re-check each provider's
> pricing page before committing.

---

_End of ARCHITECTURE.md. Revised 2026-10-27: Mux + Neon confirmed, cost-minimised MVP plan added
(§22), scope reduced to a lean MVP with courses and donations, and Phase 4a launch extras added
(MVP scope at a glance, §9, §19, §20). **No source code has been written or changed.** Implementation of Phase 4a (§20) will begin only
on your explicit go-ahead._
