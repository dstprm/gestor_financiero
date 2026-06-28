# ClaudeKit — The Claude Code SaaS Starter

A production-ready Next.js 16 SaaS starter optimized for building with Claude Code. Ships with auth, billing, org management, dark mode, and a clean AppShell — everything wired up so you can focus on your product.

## What's Included

| Feature | Technology |
|---------|-----------|
| Authentication | Clerk (sign up, sign in, webhooks, user sync) |
| Billing | Paddle (checkout overlay, customer portal, trial enforcement, webhooks) |
| Multi-tenant orgs | Create/join orgs, email invites, roles (Owner/Admin/Editor/Viewer) |
| Settings | Profile page, billing tab, my organizations tab |
| Org management | Members list, invite by email, change roles, leave/delete org |
| Dark mode | Tailwind v4 dark mode, no flash on load |
| Database | Prisma ORM + Supabase (PostgreSQL) |
| Email | Transactional email via Resend (console fallback in dev) |
| Legal | Privacy policy + Terms of Service placeholder pages |
| Middleware | Auth guard + subscription gate on all `/app/*` routes |
| Dev ergonomics | .claudeignore, CLAUDE.md context file, clean file structure |

## Prerequisites

- **Node.js** 18+
- **Clerk** account — [clerk.com](https://clerk.com)
- **Paddle** account (Billing) — [paddle.com](https://paddle.com)
- **Supabase** project — [supabase.com](https://supabase.com)
- **Vercel** account for deployment — [vercel.com](https://vercel.com)
- **Resend** account for email (optional) — [resend.com](https://resend.com)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/yourusername/claudekit.git
cd claudekit
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in each value in `.env.local`. See the table below or `CLAUDE.md` for descriptions of each variable.

### 3. Set up Clerk

1. Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy your **Publishable Key** and **Secret Key** into `.env.local`
3. In Clerk dashboard → **Webhooks** → create a webhook pointing to `http://localhost:3000/api/webhooks/clerk` (use [ngrok](https://ngrok.com) for local testing)
4. Select events: `user.created`, `user.updated`, `user.deleted`
5. Copy the **Signing Secret** into `CLERK_WEBHOOK_SECRET`

### 4. Set up Supabase

1. Create a new Supabase project
2. Go to **Settings → Database → Connection string**
3. Copy the **Connection pooling** URL into `DATABASE_URL`
4. Copy the **Direct connection** URL into `DIRECT_URL`

### 5. Push the database schema

```bash
npx prisma db push
```

### 6. Set up Paddle

1. Create a Paddle account and enable Sandbox mode for testing
2. Go to **Developer Tools → Authentication** → copy Client Token and API Key
3. Go to **Catalog → Products** → create a product and a price
4. Copy the **Price ID** into `NEXT_PUBLIC_PADDLE_PRICE_ID`
5. Go to **Notifications → Webhooks** → add webhook URL: `http://localhost:3000/api/webhooks/paddle`
6. Copy the **Signing Secret** into `PADDLE_WEBHOOK_SECRET`

### 7. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
vercel --prod
```

Or push to GitHub and connect the repo in the Vercel dashboard.

**After deploy, update:**
- Clerk → Webhooks → change URL to `https://yourapp.com/api/webhooks/clerk`
- Paddle → Webhooks → change URL to `https://yourapp.com/api/webhooks/paddle`
- Clerk → Allowed origins → add your production URL
- Set `NEXT_PUBLIC_APP_URL` to your production URL in Vercel env vars

## Customizing for Your App

1. **Add your data model** — edit `prisma/schema.prisma`, run `npx prisma db push`
2. **Build your pages** — add routes under `src/app/app/`
3. **Add sidebar nav** — edit the `<nav>` in `src/components/AppShell.tsx`
4. **Update the landing page** — `src/app/page.tsx`
5. **Set your price** — configure `NEXT_PUBLIC_PADDLE_PRICE_ID` and update copy in `/upgrade` and the landing page
6. **Set your trial length** — `src/lib/subscription.ts` → `createTrialData()`
7. **Configure email** — set `RESEND_API_KEY` and `EMAIL_FROM`, update templates in `src/lib/email.ts`
8. **Update legal pages** — fill in `src/app/privacy/page.tsx` and `src/app/terms/page.tsx`

## Project Structure

See `CLAUDE.md` for the full file map and architecture documentation.

## Environment Variables Reference

| Variable | Required | Where to find it |
|----------|----------|-----------------|
| `DATABASE_URL` | Yes | Supabase → Settings → Database → Connection Pooling URL |
| `DIRECT_URL` | Yes | Supabase → Settings → Database → Direct connection URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk → API Keys |
| `CLERK_SECRET_KEY` | Yes | Clerk → API Keys |
| `CLERK_WEBHOOK_SECRET` | Yes | Clerk → Webhooks → Signing Secret |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Yes | Paddle → Developer Tools → Authentication |
| `PADDLE_API_KEY` | Yes | Paddle → Developer Tools → Authentication |
| `PADDLE_WEBHOOK_SECRET` | Yes | Paddle → Notifications → Signing Secret |
| `NEXT_PUBLIC_PADDLE_PRICE_ID` | Yes | Paddle → Catalog → Prices |
| `PADDLE_ENVIRONMENT` | Yes | `"sandbox"` for testing, `"production"` for live |
| `NEXT_PUBLIC_APP_URL` | Yes | Your app's public URL |
| `NEXT_PUBLIC_APP_NAME` | No | Display name used in emails (default: `ClaudeKit`) |
| `NEXT_PUBLIC_ORG_ID` | No | Pin a fixed org ID for single-tenant / demo mode |
| `CRON_SECRET` | No | Random secret for Vercel Cron job auth |
| `RESEND_API_KEY` | No | resend.com → API Keys |
| `EMAIL_FROM` | No | Your verified sender address |

## License

MIT
