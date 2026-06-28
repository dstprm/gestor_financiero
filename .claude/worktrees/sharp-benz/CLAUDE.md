# ClaudeKit — Codebase Context for Claude Code

ClaudeKit is a production-ready Next.js 16 SaaS starter. This file is the primary context document for Claude Code sessions. Read it before making changes.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"` syntax) |
| Auth | Clerk (`@clerk/nextjs` v7) |
| Billing | Paddle (`@paddle/paddle-js` + `@paddle/paddle-node-sdk`) |
| ORM | Prisma 5.14 |
| Database | Supabase (PostgreSQL) |
| UI | Radix UI primitives + Lucide icons + Sonner toasts |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page (public)
│   ├── layout.tsx                  # Root layout: ClerkProvider, PaddleProvider, ThemeProvider
│   ├── globals.css                 # Tailwind v4 import + CSS variables
│   ├── app/                        # Authenticated app shell
│   │   ├── layout.tsx              # Auth guard + TrialBanner
│   │   ├── page.tsx                # Dashboard entry (dynamic import of _client.tsx)
│   │   ├── _client.tsx             # Dashboard client: fetches org, renders AppShell
│   │   ├── org/                    # Org management (members, invites, roles)
│   │   ├── orgs/                   # Multi-org picker
│   │   └── settings/               # Profile + billing + my-orgs settings page
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── clerk/route.ts      # Clerk → DB user sync
│   │   │   └── paddle/route.ts     # Paddle billing events → Subscription table
│   │   ├── billing/portal/         # GET → Paddle customer portal URL
│   │   ├── checkout/               # POST → Paddle checkout session
│   │   ├── subscription/           # GET → subscription status for an org
│   │   ├── org/                    # Org CRUD + my-role + mine
│   │   ├── orgs/                   # List all user orgs
│   │   ├── members/                # List + invite members
│   │   ├── invites/                # Accept invite by token
│   │   └── cron/                   # Trial expiry checks (Vercel Cron)
│   ├── auth/redirect/              # Post-login smart redirect (picks org or shows picker)
│   ├── join/                       # Invite accept flow
│   ├── sign-in/ + sign-up/         # Clerk hosted pages
│   ├── upgrade/                    # Trial expired gate
│   ├── privacy/ + terms/           # Legal pages
│   └── error.tsx + not-found.tsx
├── components/
│   ├── AppShell.tsx                # Authenticated shell: TopBar + sidebar slot + main
│   ├── ThemeProvider.tsx           # Dark mode context
│   ├── ThemeToggle.tsx             # Dark/light/system toggle button
│   ├── CookieBanner.tsx            # GDPR cookie notice
│   ├── topbar/
│   │   └── TopBar.tsx              # App header: logo, org name, theme toggle, settings
│   ├── billing/
│   │   ├── PaddleProvider.tsx      # Initializes Paddle.js on the client
│   │   ├── PaddleCheckoutButton.tsx # Opens Paddle checkout overlay
│   │   └── TrialBanner.tsx         # Trial countdown banner (server component)
│   └── panels/
│       └── LeftSidebar.tsx         # Sidebar shell (add your nav here)
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── paddle.ts                   # Paddle SDK singleton + isPaddleConfigured flag
│   ├── subscription.ts             # getOrgSubscriptionStatus(), createTrialData()
│   ├── email.ts                    # sendEmail() via Resend (falls back to console.warn)
│   ├── supabase.ts                 # Supabase client (for direct storage if needed)
│   └── utils.ts                    # cn(), generateId(), misc helpers
└── proxy.ts                        # Clerk middleware: auth gate + subscription enforcement
```

## How Auth Works

1. User signs up/in via Clerk (hosted sign-in page at `/sign-in`)
2. Clerk fires a webhook to `/api/webhooks/clerk` on user creation/update/deletion
3. The webhook handler creates/updates a `User` row in Postgres (clerkId, email, name)
4. On first login, `auth/redirect` checks org memberships and sends the user to `/app` or `/app/orgs`
5. `src/proxy.ts` protects all `/app/*` routes. It:
   - Calls `auth.protect()` → redirects unauthenticated users to `/sign-in`
   - Checks the org's `Subscription` status → redirects expired trials to `/upgrade`

**Key:** Auth state lives in Clerk. The DB `User` row is a mirror for relational joins. Always use `clerkId` to look up users from middleware/server components.

## How Billing Works

1. User hits the upgrade flow or trial expires → `/upgrade` page
2. `PaddleCheckoutButton` calls `POST /api/checkout` → returns a Paddle transaction ID
3. Paddle.js opens the checkout overlay with that transaction ID
4. After payment, Paddle fires a webhook to `/api/webhooks/paddle`
5. The webhook handler creates/updates the `Subscription` row with `paddleSubId` and `status: ACTIVE`
6. The subscription gate in `proxy.ts` re-reads the DB on every `/app/*` request

**Configure:** Set `NEXT_PUBLIC_PADDLE_PRICE_ID` in your env to your Paddle price ID.

## Data Model

```
User           clerkId (unique), email, name, avatarUrl
Organization   name, slug, ownerId, paddleCustomerId, settings (Json)
OrgMembership  userId + organizationId, role: OWNER|ADMIN|EDITOR|VIEWER
Invite         email, organizationId, role, token (unique), expiresAt, acceptedAt
Subscription   organizationId (unique), paddleSubId, status, trialEndsAt, seatCount
WebhookEvent   eventId (idempotency key), source, eventType
```

Add your own models to `prisma/schema.prisma`, then run `npx prisma db push`.

## How to Add Features

### New page under the authenticated shell
```
src/app/app/your-feature/page.tsx     # Server component (data fetching)
src/app/app/your-feature/_client.tsx  # Client component (interactivity)
```

### New API route
```
src/app/api/your-resource/route.ts
```
Pattern:
```ts
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  // ...
}
```

### Add sidebar navigation
Edit `src/components/AppShell.tsx` — the `<nav>` section in `<aside>` is ready for your links.

### Add a nav item to TopBar
Edit `src/components/topbar/TopBar.tsx` — the center slot (`<div className="flex-1" />`) is the right place.

## Auth Middleware (`src/proxy.ts`)

- File is `proxy.ts` not `middleware.ts` — this is Next.js 16 convention
- Routes matching `/app(.*)` are protected
- Routes in `isSubscriptionExempt` skip the billing check (webhooks, cron, upgrade, sign-in)
- Fails open if DB check errors — avoids locking users out on DB hiccups

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Prisma connection pool URL (Supabase → Settings → Database → Connection Pooling) |
| `DIRECT_URL` | Yes | Prisma direct URL (Supabase → Settings → Database → Direct connection) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Yes | Clerk dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Yes | Clerk dashboard → Webhooks → Signing Secret |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Yes | Paddle → Developer Tools → Authentication |
| `PADDLE_API_KEY` | Yes | Paddle → Developer Tools → Authentication |
| `PADDLE_WEBHOOK_SECRET` | Yes | Paddle → Notifications → Webhook signing secret |
| `NEXT_PUBLIC_PADDLE_PRICE_ID` | Yes | Paddle → Catalog → Prices → your price ID |
| `NEXT_PUBLIC_APP_URL` | Yes | Full URL of your app (e.g. `https://yourapp.com`) |
| `NEXT_PUBLIC_APP_NAME` | No | App name for emails (default: ClaudeKit) |
| `RESEND_API_KEY` | No | Resend.com API key for transactional email |
| `EMAIL_FROM` | No | From address for emails (default: noreply@example.com) |
| `NEXT_PUBLIC_ORG_ID` | No | Pin a fixed org ID (single-tenant mode) |

## Dev Commands

```bash
npm run dev            # Dev server on :3000
npm run build          # prisma generate + next build
npx prisma studio      # DB GUI at localhost:5555
npx prisma db push     # Push schema changes to DB (no migration file)
npx prisma migrate dev # Create a migration file (use for production)
```

## Deploy (Vercel)

```bash
vercel --prod
```

Set all env vars in Vercel dashboard or via `vercel env add`. After deploy:
1. Add the Vercel URL to Clerk's allowed origins
2. Point Paddle webhooks to `https://yourapp.com/api/webhooks/paddle`
3. Point Clerk webhooks to `https://yourapp.com/api/webhooks/clerk`

## Key Conventions

- **Server components by default** — add `'use client'` only when you need hooks or event handlers
- **Auth in server components:** `import { auth } from '@clerk/nextjs/server'` → `const { userId } = await auth()`
- **DB access:** always import from `@/lib/db` — `const { prisma } = await import('@/lib/db')` in server components; never import in client components
- **API responses:** use `Response.json()` not `NextResponse.json()` (works in Next.js 16)
- **File naming:** `_client.tsx` suffix for client-only files co-located with server pages
- **Styles:** use Tailwind utility classes. Global CSS variables in `globals.css`. No CSS modules.
- **Dark mode:** all components use `dark:` variants. Theme is controlled by `ThemeProvider` + `localStorage('theme')`
- **Error handling in API routes:** return appropriate HTTP status codes; log errors but don't expose internals

## Adding Your Feature — Checklist

- [ ] Add model to `prisma/schema.prisma`, run `npx prisma db push`
- [ ] Create API route(s) under `src/app/api/`
- [ ] Create page(s) under `src/app/app/`
- [ ] Add nav link in `AppShell.tsx` sidebar
- [ ] Update landing page copy in `src/app/page.tsx`
- [ ] Update `NEXT_PUBLIC_PADDLE_PRICE_ID` to your price
- [ ] Update trial length in `src/lib/subscription.ts` → `createTrialData()`
