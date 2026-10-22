# FrameForge

A production-grade **foundation** for a digital video storefront + admin panel — customers buy
and watch videos (stream / download / rent), with a full role-based admin. This repository is the
scaffold: tooling, design system, a complete reusable UI component library, layouts, domain types,
Prisma schema, RBAC, provider abstractions, and a polished storefront home page. Most feature pages
are intentionally placeholders to be built on top of this foundation.

Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and TypeScript (strict).

---

## Quick start

```bash
pnpm install            # installs deps and runs `prisma generate`
cp .env.example .env    # fill in values (placeholders work for local dev)
pnpm dev                # http://localhost:3000
```

Visit:

- `/` — storefront home (fully built, matches the design reference)
- `/shop`, `/categories`, `/bundles`, `/video/[slug]`, `/cart`, `/faq`, `/contact` — storefront
- `/account/*` — customer area (library, orders, favourites, profile, security)
- `/admin` — admin panel (dashboard, orders, uploads, users & roles, settings, …)
- `/login`, `/register`, `/forgot-password` — auth
- `/watch/[slug]` — distraction-free player
- `/dev/ui` — **component showcase** (dev only; every component + variant, light & dark)

## Scripts

| Script                           | Description                      |
| -------------------------------- | -------------------------------- |
| `pnpm dev`                       | Start the dev server (Turbopack) |
| `pnpm build`                     | Production build                 |
| `pnpm start`                     | Serve the production build       |
| `pnpm lint`                      | ESLint (flat config)             |
| `pnpm typecheck`                 | `tsc --noEmit`                   |
| `pnpm format` / `format:check`   | Prettier write / check           |
| `pnpm test` / `test:watch`       | Vitest (unit + component)        |
| `pnpm e2e`                       | Playwright smoke test            |
| `pnpm db:generate` / `db:format` | Prisma client / schema format    |

## Tech stack

- **Framework:** Next.js 16 (App Router, RSC by default, Turbopack, `cacheComponents`)
- **Styling:** Tailwind CSS v4 (CSS-first `@theme`, OKLCH design tokens), `tw-animate-css`
- **UI:** Radix primitives + CVA, shadcn-style local components, `lucide-react`, `sonner`
- **Fonts:** Orbitron (display/headings) + Rajdhani (body) — squared/geometric — via `next/font`.
  Applied by referencing the `next/font` CSS variables directly in `globals.css` (Tailwind v4
  `@theme inline` tokens are inlined into utilities and are **not** emitted as usable CSS variables).
- **Animation:** `motion` (Framer Motion) with shared presets in `lib/motion.ts`
- **Forms:** `react-hook-form` + `zod` (v4) + `@hookform/resolvers`
- **State:** `zustand` (cart, UI), `@tanstack/react-query` (client data), `nuqs` (URL state)
- **Tables:** `@tanstack/react-table` v8
- **DB:** Prisma 6 + PostgreSQL (schema only; client generated to `src/generated/prisma`)
- **Auth:** Auth.js / NextAuth v5 (see below)
- **Payments:** Stripe SDK (typed helpers + webhook stub)
- **Env:** `@t3-oss/env-nextjs` (validated at build/runtime)
- **Tooling:** ESLint flat + Prettier, Husky + lint-staged, commitlint, Vitest + Testing Library,
  Playwright

## Folder conventions

```
src/
  app/
    (shop)/      storefront layout (navbar + footer + cookie banner)   → home, shop, video, cart…
    (account)/   storefront navbar + account sidebar                   → /account/*
    (auth)/      centered, branded auth card                           → login, register…
    (watch)/     minimal dark player shell                             → /watch/[slug]
    admin/       collapsible sidebar + topbar + breadcrumbs            → /admin/*
    api/         route handlers (auth, stripe webhook, upload)
    dev/ui/      component showcase (dev only)
    sitemap.ts, robots.ts, not-found/error/loading/global-error
  components/
    ui/          primitives (Radix + CVA) — the component library
    layout/      navbars, sidebars, footer, topbar, page header, command palette
    shared/      domain components (video card, bundle card, player shell, …)
    motion/      animation wrappers (FadeIn, SlideIn, Stagger, PageTransition)
    home/        home-page sections (hero carousel, promo card, category rail…)
  features/      feature-scoped components/schemas (auth, cart, contact, videos, admin)
  lib/           utils, env, auth, rbac, stripe, video provider, seo, formatters, motion, action
  server/        server-only services + data access (db, current-user, entitlements)
  config/        site config, nav config (role-filtered), constants
  stores/        zustand stores (cart, ui)
  hooks/         shared hooks (use-shop-filters)
  types/         domain types + next-auth augmentation
  mocks/         mock data for components, showcase and placeholder pages
  generated/     Prisma client output (gitignored)
```

## How to…

### …add a UI component

Create `src/components/ui/<name>.tsx`. Use `cn()` for class merging and `cva` for variants; make it
accessible (keyboard, ARIA, `focus-visible` rings) and dark-mode ready using the design tokens
(`bg-primary`, `text-muted-foreground`, etc.). Add it to `/dev/ui` for visual verification.

### …add a page

Place a `page.tsx` under the appropriate route group so it inherits that layout. Export `metadata`
(or `generateMetadata`) via `buildMetadata()` from `lib/seo.ts`. Add a `loading.tsx` sibling for a
skeleton. For URL state (filters, search) use `nuqs` via `hooks/use-shop-filters.ts`.

### …add a permission

Add the `resource:action` string to `PERMISSIONS` in `lib/rbac.ts`, then grant it to the relevant
roles in `ROLE_PERMISSIONS`. Gate UI with `<Can user={user} permission="…">` and enforce on the
server with `requirePermission(user, "…")`. Admin nav items declare a `permission` in
`config/nav.ts` and are filtered automatically.

### …add a server action

Use `defineAction(schema, handler)` from `lib/action.ts` for zod validation and a typed
`{ ok, data } | { ok: false, error }` result. Call `requirePermission()` inside the handler.

## Environment variables

Validated by `src/lib/env.ts`. See `.env.example` for the full list. Key vars:
`DATABASE_URL`, `AUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `VIDEO_PROVIDER`.
Set `SKIP_ENV_VALIDATION=1` to bypass validation (e.g. in CI/Docker builds).

## Architecture notes

- **Auth.js (NextAuth v5)** was chosen over Better Auth for its mature App Router integration,
  large provider ecosystem, and first-class middleware wrapper. Config lives in `lib/auth.ts`;
  `authorize` is a stub to wire to Prisma. `middleware.ts` protects `/admin` and `/account`
  (enforcement is gated off in the scaffold so all layouts stay viewable).
- **Video provider is undecided.** `lib/video/` defines a `VideoProvider` interface
  (`createUpload`, `getPlaybackUrl`, `getDownloadUrl`, `getThumbnail`, `deleteAsset`) with a mock
  implementation. The player shell takes a resolved playback source and never imports a provider
  SDK — the architecture supports stream / download / rent without rework.
- **Entitlements.** `server/services/entitlements.ts` exposes `canWatch`, `canDownload`,
  `grantAccess`, `revokeAccess` and rental-expiry checks (decision helpers are real; persistence is
  stubbed for Prisma).
- **Money** is stored as integer **minor units** everywhere; format with `lib/formatters.ts`.
- **Current auth is mocked** (`server/current-user.ts` returns a demo user) so every layout renders
  a realistic signed-in experience without a database. Replace with `auth()` to go live.

## Status

`pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm build` and `pnpm test` all pass. See
`DECISIONS.md` for the full list of decisions and assumptions made while scaffolding.
