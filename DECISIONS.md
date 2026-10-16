# Decisions & assumptions

Choices made while scaffolding (where the brief left them open). Grouped by area.

## Project & structure

- **App lives in `Ramforge/`** (the empty subfolder), per your choice. The PDF and reference image
  stay at the repo root, separate from the app. The npm package name is lowercase `ramforge`
  (npm forbids capitals); the display brand is centralised in `config/site.ts`.
- **Brand name = "Ramforge"** (your repo). The `Image (6).png` ("FrameForge") was treated as the
  **visual/layout reference**, not the literal brand — dark cinematic theme, orange accent, left
  category rail, hero carousel, promo card, Featured/Latest/Blog columns. Change the brand in one
  place: `config/site.ts`.

## Design system

- **Palette:** orange accent on a near-black cinematic dark surface (OKLCH tokens), to match the
  reference. Light mode is fully supported; **dark is the default theme**.
- **Fonts:** two **squared** families — **Orbitron** (headings/display) + **Rajdhani** (body/UI),
  loaded via `next/font`. Geist Mono for code. Defined in `app/layout.tsx` + `globals.css`.
  Important: Tailwind v4 `@theme inline` tokens are inlined into utilities and are **not** emitted
  as `:root` CSS variables, so headings/body reference the `next/font` variables
  (`var(--font-orbitron)`, `var(--font-rajdhani)`) directly rather than `var(--font-display)`.
- **Design depth:** "polished & branded" — a coherent token system, real home page, motion, and a
  full `/dev/ui` gallery.

## Libraries (latest stable, verified before install)

- **Auth.js / NextAuth v5** over Better Auth (mature App Router + middleware support).
- **`@tanstack/react-table` pinned to v8**, not the newly-released v9. v9 is a ground-up rewrite
  (atom/store API, partial `legacy` export) that's heavy for a scaffold; v8's API is stable and
  universally documented.
- **Prisma pinned to v6**, not v7. v7 removed `url` from the datasource and requires
  `prisma.config.ts` + driver adapters — more moving parts than a "schema-only" scaffold needs. v6
  keeps the conventional `url = env(...)` schema. Client is generated to `src/generated/prisma`.
- Other versions resolve to their current latest (this environment is dated Oct 2026, so some are
  higher than you may expect: `lucide-react@1`, `motion@14`, `zod@4`, `next@16`, `tailwindcss@4`).
  Note: lucide v1 dropped brand icons (Twitter/GitHub/YouTube) — generic icons are used instead.

## Auth & access

- **Current user is mocked** (`server/current-user.ts` returns a demo customer; the admin layout
  previews as `SUPER_ADMIN`) so every layout renders a realistic signed-in experience without a DB
  or real session. Replace the body with `auth()` to go live.
- **Middleware enforcement is gated off** (`AUTH_ENFORCED = false`) so `/admin` and `/account` stay
  viewable in the scaffold. The real redirect/role logic is written and ready — flip the flag once
  `authorize` verifies real users.
- **RBAC** is a single code-defined permissions map (`lib/rbac.ts`) mapped to the 5 roles; the
  `Role` enum lives on `User` in the Prisma schema. Fine-grained permissions are intentionally code,
  not DB rows.
- `middleware.ts` is kept (not renamed to Next 16's `proxy.ts`) because NextAuth v5 officially
  targets the middleware convention; Next prints a non-fatal deprecation warning.

## Domain

- **Buy options** modelled as `EntitlementType` = `STREAM | DOWNLOAD | RENTAL`; each video carries
  `purchaseOptions`. The player shell is provider-agnostic so all three work without rework.
- **Money** stored as integer minor units; VAT handled with simple flat-rate helpers (swap for
  Stripe Tax / location-based rates in production).
- **Cancellation waiver** is stored on the `Order` (`waiverConsent` + `waiverConsentAt`), surfaced
  at checkout.
- Video `tags` stored as a Postgres `String[]` (simpler than a Tag table for the scaffold).

## Pages

- Per the brief, most feature pages are **consistent placeholders** (`PlaceholderPage`). The
  exceptions, built out to showcase the system and per your request:
  - **Home** (`/`) — full build matching the reference.
  - Lightly functional: `/shop` (FilterBar + grid), `/categories`, `/bundles`, `/faq`, `/contact`,
    `/cart`, `/video/[slug]` (player + buy box + reviews), account pages, auth forms, admin
    dashboard/orders/uploads/users/settings.
- **Layout container width:** full-width (`mx-auto px-4 py-6 sm:px-6 lg:px-8`), no `max-w-7xl` cap,
  per your preference. Narrow reading pages (FAQ, legal, blog) keep a readable `max-w` column.
- **Category rail** is a smooth single-open **accordion** (per request); childless categories are
  plain links.

## Tooling

- ESLint: two React-Compiler rules (`set-state-in-effect`, `static-components`) downgraded to
  warnings — they over-fire on idiomatic SSR mount-guards, external-store (Embla) subscriptions, and
  dynamic icon lookups.
- A local `.env` with placeholder values is committed-ignored so `pnpm build` passes without real
  secrets; `.env.example` documents everything.
- Security headers + a starter CSP and image `remotePatterns` are set in `next.config.ts`.
