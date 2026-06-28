# ClaudeKit

The production-ready Next.js SaaS starter built for Claude Code.

ClaudeKit gives you a complete, deployable SaaS foundation — auth, billing, multi-tenant org management, transactional email, and a polished app shell — all wired together and tested. It ships with a `CLAUDE.md` context file that makes Claude Code immediately productive in your codebase, so you can skip the boilerplate and go straight to building your product.

## What's Included

**Authentication** is handled end-to-end by Clerk. Sign-up, sign-in, password reset, and OAuth are all managed on Clerk's hosted pages — you get them for free. A webhook listener at `/api/webhooks/clerk` syncs every user into your Postgres database on creation, update, and deletion, giving you a local `User` record you can join against your own data models.

**Billing** is built on Paddle, including sandbox support for development. The checkout flow opens Paddle's overlay UI without redirecting away from your app. After payment, Paddle fires a webhook to `/api/webhooks/paddle` which creates or updates the org's `Subscription` row. The middleware gate reads that row on every request to `/app/*` and redirects expired users to the upgrade page automatically. A customer portal link lets users manage their subscription without any custom UI.

**Multi-tenant org management** ships fully built. Users can create organizations, invite team members by email, assign roles (Owner, Admin, Editor, Viewer), accept invites via a token link, and manage membership — all through a ready-to-use UI. The invite system sends HTML email via Resend and falls back to console logging in development so you can test without a real email account.

**Trial management** is wired into the subscription gate. New orgs get a 5-day trial (configurable in `src/lib/subscription.ts`). A `TrialBanner` server component displays a countdown at the top of the app shell. A Vercel Cron job at `/api/cron` checks for expiring trials and sends reminder emails.

**Settings** are split into three tabs on a single page: profile (name, avatar via Clerk), billing (subscription status, upgrade CTA, customer portal link), and organizations (list all orgs the user belongs to, create new ones).

**App shell** is a responsive layout with a top bar and left sidebar, ready to populate with your own navigation. Dark mode works out of the box — Tailwind v4 `dark:` variants throughout, a system/light/dark toggle in the top bar, and a `ThemeProvider` that persists the preference to `localStorage` with no flash on load.

**Claude Code optimized** — `CLAUDE.md` at the root documents the entire architecture, data model, file conventions, and how to extend the app. When Claude Code reads it before making changes, it understands the project well enough to add new features, API routes, and pages correctly on the first attempt.

## Tech Stack

| Technology | Purpose | Notes |
|-----------|---------|-------|
| Next.js 16.2 (App Router) | Framework | Server Components by default |
| React 19 | UI runtime | |
| TypeScript | Type safety | Strict mode |
| Tailwind CSS v4 | Styling | `@import "tailwindcss"` syntax |
| Clerk v7 | Authentication | Required |
| Paddle | Billing / subscriptions | Required; sandbox for dev |
| Prisma 5.14 | ORM | |
| Supabase | PostgreSQL host | Free tier works fine |
| Radix UI | Accessible UI primitives | Headless |
| Lucide React | Icons | |
| Sonner | Toast notifications | |
| Resend | Transactional email | Optional; console fallback in dev |
| Vercel | Deployment | Free tier works fine |

## Prerequisites

Create these accounts before you start. All have free tiers suitable for development.

- **Clerk** — [clerk.com](https://clerk.com) — handles all auth
- **Paddle** — [paddle.com](https://paddle.com) — billing; use Sandbox for dev
- **Supabase** — [supabase.com](https://supabase.com) — hosted Postgres
- **Vercel** — [vercel.com](https://vercel.com) — deployment
- **Resend** — [resend.com](https://resend.com) — transactional email (optional)

You also need **Node.js 18+** installed locally.

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/claudekit.git
cd claudekit
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local`. The full reference:

| Variable | Required | What it is | Where to find it |
|----------|----------|------------|-----------------|
| `DATABASE_URL` | Yes | Prisma connection pooling URL | Supabase → Settings → Database → Connection string → Connection pooling |
| `DIRECT_URL` | Yes | Prisma direct connection URL | Supabase → Settings → Database → Connection string → Direct connection |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk public key | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key | Clerk dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Yes | Webhook signing secret | Clerk dashboard → Webhooks → your endpoint → Signing Secret |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Sign-in page path | Default: `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Sign-up page path | Default: `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | Post-login redirect | Default: `/auth/redirect` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | Post-signup redirect | Default: `/auth/redirect` |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Yes | Paddle client-side token | Paddle → Developer Tools → Authentication |
| `PADDLE_API_KEY` | Yes | Paddle server-side API key | Paddle → Developer Tools → Authentication |
| `PADDLE_WEBHOOK_SECRET` | Yes | Webhook signing secret | Paddle → Notifications → Webhooks → your endpoint |
| `NEXT_PUBLIC_PADDLE_PRICE_ID` | Yes | Price ID for your subscription | Paddle → Catalog → Prices |
| `NEXT_PUBLIC_PADDLE_SANDBOX` | Yes | Enable Paddle sandbox mode | Set to `"true"` for dev; remove for production |
| `NEXT_PUBLIC_APP_URL` | Yes | Full URL of your app | `http://localhost:3000` locally; your domain in production |
| `NEXT_PUBLIC_APP_NAME` | No | App display name used in emails | Default: `ClaudeKit` |
| `NEXT_PUBLIC_ORG_ID` | No | Pin a fixed org (single-tenant mode) | Leave empty for multi-tenant |
| `RESEND_API_KEY` | No | Resend API key for email | resend.com → API Keys |
| `EMAIL_FROM` | No | Verified sender address | Must match a domain verified in Resend |

### 3. Set up the database

```bash
npx prisma db push
```

This creates all tables in your Supabase Postgres database: `User`, `Organization`, `OrgMembership`, `Invite`, `Subscription`, and `WebhookEvent`. No migration files are generated — `db push` is the right tool during active development. When you're ready for production, switch to `npx prisma migrate dev` to track migration history.

### 4. Configure Clerk

1. Create an application in the [Clerk dashboard](https://dashboard.clerk.com)
2. Copy the **Publishable Key** and **Secret Key** into `.env.local`
3. Go to **Webhooks** → **Add Endpoint**
4. For local development, use [ngrok](https://ngrok.com) to expose your local server:
   ```bash
   ngrok http 3000
   ```
   Set the webhook URL to `https://<your-ngrok-id>.ngrok.io/api/webhooks/clerk`
5. Select these events: `user.created`, `user.updated`, `user.deleted`
6. Copy the **Signing Secret** into `CLERK_WEBHOOK_SECRET`
7. Under **Paths**, confirm the redirect URLs match your `.env.local` values

### 5. Configure Paddle

1. Log into [Paddle](https://paddle.com) and switch to **Sandbox mode** (toggle in the bottom-left)
2. Go to **Developer Tools → Authentication** → copy the **Client Token** into `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` and the **API Key** into `PADDLE_API_KEY`
3. Go to **Catalog → Products** → create a product (e.g. "Pro Plan")
4. Under that product, create a **Price** (monthly or annual)
5. Copy the **Price ID** (starts with `pri_`) into `NEXT_PUBLIC_PADDLE_PRICE_ID`
6. Go to **Notifications → Webhooks** → **New Webhook**
7. Set the URL to your ngrok URL: `https://<your-ngrok-id>.ngrok.io/api/webhooks/paddle`
8. Copy the **Signing Secret** into `PADDLE_WEBHOOK_SECRET`
9. Make sure `NEXT_PUBLIC_PADDLE_SANDBOX="true"` is set in `.env.local` for sandbox mode

### 6. Configure Resend (optional)

Email works out of the box in development without Resend — emails are logged to the console instead of sent. To actually deliver email:

1. Create an account at [resend.com](https://resend.com)
2. Go to **API Keys** → create a key → copy it into `RESEND_API_KEY`
3. Go to **Domains** → add and verify your sending domain
4. Set `EMAIL_FROM` to a verified address: `"Your App <noreply@yourdomain.com>"`

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the landing page. Sign up to create an account — the Clerk webhook will fire and create your `User` row in the database, and `auth/redirect` will route you into the app.

## Project Structure

```
src/
├── proxy.ts                          # Auth middleware: protects /app/*, enforces subscription gate
├── app/
│   ├── layout.tsx                    # Root layout: ClerkProvider, PaddleProvider, ThemeProvider
│   ├── globals.css                   # Tailwind v4 import + CSS custom properties
│   ├── page.tsx                      # Public landing page — update with your copy
│   ├── app/                          # Everything inside requires auth
│   │   ├── layout.tsx                # Auth guard + TrialBanner
│   │   ├── page.tsx                  # Dashboard (server component entry)
│   │   ├── _client.tsx               # Dashboard client: fetches org, renders AppShell
│   │   ├── org/                      # Org management: members, invites, roles
│   │   ├── orgs/                     # Multi-org picker (shown when user has no default org)
│   │   └── settings/                 # Settings: profile, billing, my organizations
│   ├── api/
│   │   ├── webhooks/clerk/route.ts   # Syncs Clerk users to Postgres
│   │   ├── webhooks/paddle/route.ts  # Handles Paddle billing events
│   │   ├── billing/portal/           # Returns Paddle customer portal URL
│   │   ├── checkout/                 # Creates Paddle transaction, returns ID for overlay
│   │   ├── subscription/             # Returns subscription status for an org
│   │   ├── org/                      # Org CRUD, membership, role management
│   │   ├── orgs/                     # Lists all orgs for the current user
│   │   ├── members/                  # Lists members, sends invites
│   │   ├── invites/                  # Accepts invites by token
│   │   └── cron/                     # Trial expiry check (Vercel Cron, runs daily)
│   ├── auth/redirect/                # Smart post-login redirect (picks org or shows org picker)
│   ├── join/                         # Invite acceptance flow
│   ├── sign-in/ + sign-up/           # Clerk hosted auth pages
│   ├── upgrade/                      # Trial-expired gate page
│   ├── privacy/ + terms/             # Legal placeholder pages
│   └── error.tsx + not-found.tsx
├── components/
│   ├── AppShell.tsx                  # Main app layout: TopBar + sidebar slot + content area
│   ├── ThemeProvider.tsx             # Dark mode context
│   ├── ThemeToggle.tsx               # System/light/dark toggle
│   ├── CookieBanner.tsx              # GDPR cookie notice
│   ├── topbar/TopBar.tsx             # App header: logo, org name, theme toggle, settings link
│   ├── billing/
│   │   ├── PaddleProvider.tsx        # Initializes Paddle.js on the client
│   │   ├── PaddleCheckoutButton.tsx  # Opens Paddle overlay checkout
│   │   └── TrialBanner.tsx           # Trial countdown (server component)
│   └── panels/LeftSidebar.tsx        # Sidebar shell — add your nav links here
└── lib/
    ├── db.ts                         # Prisma client singleton
    ├── paddle.ts                     # Paddle SDK singleton
    ├── subscription.ts               # getOrgSubscriptionStatus(), createTrialData()
    ├── email.ts                      # sendEmail() via Resend, console fallback in dev
    ├── supabase.ts                   # Supabase client (direct storage access if needed)
    └── utils.ts                      # cn(), generateId(), misc helpers

prisma/
└── schema.prisma                     # Full data model — edit this to add your own models
```

## Building Your App

This is where ClaudeKit earns its name. The `CLAUDE.md` file at the project root documents the entire architecture in a format Claude Code reads before making any change. In practice, this means you can say "add a Projects feature with a Kanban board" and get a working implementation — correct file locations, auth patterns, API structure, and Prisma schema extension — without having to re-explain the codebase every session.

**Adding a new page:**

Pages under `/app/app/` are automatically protected by auth and the subscription gate. Create a server component for data fetching and a co-located `_client.tsx` for interactivity:

```
src/app/app/projects/page.tsx       # Server component — fetch data here
src/app/app/projects/_client.tsx    # Client component — add 'use client', hooks, events
```

**Adding a new API route:**

All API routes follow the same pattern — get the Clerk user ID, look up your data, return a response:

```ts
// src/app/api/projects/route.ts
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { organization: { members: { some: { user: { clerkId: userId } } } } },
  })
  return Response.json(projects)
}
```

**Extending the data model:**

Add your models to `prisma/schema.prisma`, then push them to the database:

```bash
npx prisma db push
```

For production, use `npx prisma migrate dev` instead to generate a migration file with a history you can audit and roll back.

**How the auth middleware works:**

`src/proxy.ts` runs on every request. It protects all routes matching `/app(.*)` by calling `auth.protect()`, which redirects unauthenticated users to `/sign-in`. After that, it reads the user's org subscription from the database and redirects to `/upgrade` if the trial has expired or the subscription is cancelled. Routes in `isSubscriptionExempt` skip the billing check — this includes `/upgrade` itself, all webhooks, the checkout endpoint, and auth callbacks. If the database check throws, the middleware fails open (lets the request through) to avoid locking users out during DB outages.

**Adding nav items to the sidebar:**

Edit `src/components/panels/LeftSidebar.tsx`. The sidebar slot is already wired into `AppShell.tsx` — just add your links there.

**Changing the trial length:**

Edit the `createTrialData()` function in `src/lib/subscription.ts`. The default is 5 days:

```ts
trialEndsAt: new Date(now.getTime() + 14 * 86400000), // 14 days
```

**Single-tenant mode:**

Set `NEXT_PUBLIC_ORG_ID` to a fixed org ID to bypass the org picker and lock the app to a single organization. Useful for internal tools or simple B2C products.

## Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import in Vercel

Go to [vercel.com/new](https://vercel.com/new), import your repository, and follow the prompts. Vercel will detect Next.js automatically.

### 3. Add environment variables

In the Vercel dashboard → your project → **Settings → Environment Variables**, add all variables from `.env.local`. For production, change these values:

| Variable | Production value |
|----------|-----------------|
| `NEXT_PUBLIC_APP_URL` | `https://yourapp.com` |
| `NEXT_PUBLIC_PADDLE_SANDBOX` | Remove this variable entirely (or set to `false`) |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Your live Paddle client token |
| `PADDLE_API_KEY` | Your live Paddle API key |
| `PADDLE_WEBHOOK_SECRET` | Your live Paddle webhook secret |
| `NEXT_PUBLIC_PADDLE_PRICE_ID` | Your live Paddle price ID |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your production Clerk publishable key |
| `CLERK_SECRET_KEY` | Your production Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Your production Clerk webhook secret |

### 4. Set up Clerk for production

1. In the Clerk dashboard, create a **Production** instance (separate from your dev instance)
2. Copy the production API keys into Vercel env vars
3. Under **Domains**, add your Vercel deployment URL to allowed origins
4. Under **Webhooks**, update the endpoint URL to `https://yourapp.com/api/webhooks/clerk`

### 5. Switch Paddle to production

1. In Paddle, switch out of Sandbox mode
2. Copy live credentials into Vercel env vars
3. Under **Notifications → Webhooks**, update the endpoint URL to `https://yourapp.com/api/webhooks/paddle`

### 6. Deploy

```bash
vercel --prod
```

Or push to `main` — Vercel deploys automatically if you've connected the GitHub repo.

## Going to Production Checklist

- [ ] Clerk production instance created with production API keys set in Vercel
- [ ] Clerk webhook URL updated to production domain, signing secret updated
- [ ] Clerk allowed origins includes your production URL
- [ ] Paddle sandbox mode disabled (`NEXT_PUBLIC_PADDLE_SANDBOX` removed or set to `false`)
- [ ] Paddle live credentials set in Vercel env vars
- [ ] Paddle webhook URL updated to production domain, signing secret updated
- [ ] `DATABASE_URL` and `DIRECT_URL` point to your production Supabase project
- [ ] `NEXT_PUBLIC_APP_URL` set to your real domain (no trailing slash)
- [ ] `RESEND_API_KEY` and `EMAIL_FROM` configured with a verified sending domain
- [ ] `NEXT_PUBLIC_PADDLE_PRICE_ID` is a live price ID, not a sandbox one
- [ ] Legal pages (`/privacy`, `/terms`) filled in with real content
- [ ] End-to-end flow tested: sign up → trial countdown displays → trial expires → upgrade page shown → checkout completes → app access restored → customer portal opens

## License

MIT. Free to use for any project, commercial or otherwise.
