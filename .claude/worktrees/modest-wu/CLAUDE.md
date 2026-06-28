@AGENTS.md

# SimplyOrg — Codebase Context

## Tech Stack

- **Next.js 16.2.1** App Router, TypeScript, Tailwind CSS v4
- **React 19.2.4**
- **Zustand 5** with `immer` + `persist` middleware (`src/store/orgStore.ts`)
- **React Flow** (`@xyflow/react`) for the org chart canvas
- **Clerk** (`@clerk/nextjs` v7) for auth — dev mode warnings are expected
- **Paddle** (`@paddle/paddle-js`, `@paddle/paddle-node-sdk`) for billing
- **Prisma 5.14** ORM + **Supabase** (PostgreSQL) — `DATABASE_URL` + `DIRECT_URL`
- **Vercel** deployment
- **Radix UI** primitives, **Lucide React** icons, **Sonner** toasts
- **pptxgenjs** + **xlsx** + **html-to-image** for exports

## Deploy Command — CRITICAL RULE

**ALWAYS deploy from the main repo, NEVER from a worktree.**

```bash
# Step 1: Commit your changes on the current branch
git add -A && git commit -m "your message"

# Step 2: Switch to main and merge
git checkout main
git merge <your-branch>
git push origin main

# Step 3: Deploy from the MAIN REPO ROOT only
cd /home/diego/Desktop/simplyorg
vercel --prod --yes
```

**If you deploy from a worktree directory, it creates a preview URL like `tender-neumann.vercel.app` or `charming-yalow.vercel.app` — NOT the real production site. The user will see no changes. Always confirm the deploy aliased to `simplyorg.vercel.app`.**

## Key Files Map

### App Shell & Routing
| File | Description |
|------|-------------|
| `src/app/app/layout.tsx` | Server layout: auth guard (redirects to `/sign-in`), TrialBanner, `h-dvh flex flex-col overflow-hidden` root |
| `src/app/app/_client.tsx` | Client entry point: reads `?orgId` from URL, calls `/api/org/mine` or `loadFromDB()`, sets `dataReady` |
| `src/app/app/page.tsx` | Thin server page that renders `_client.tsx` |
| `src/app/app/orgs/page.tsx` | Org switcher / list page |
| `src/app/app/members/page.tsx` | Team members management |
| `src/app/app/settings/page.tsx` | Org settings (activity tab etc.) |
| `src/proxy.ts` | Clerk middleware: protects `/app/*`, enforces subscription/trial gate, redirects expired trials to `/upgrade` |

### Core Components
| File | Description |
|------|-------------|
| `src/components/AppShell.tsx` | Main UI shell: rehydrates Zustand, mounts TopBar + LeftSidebar + OrgChart + RightPanel + MobileBottomBar, handles global keyboard shortcuts |
| `src/components/topbar/TopBar.tsx` | Header (`z-[60]`): scenario switcher, undo/redo, save/autosave, search, filters, layout toggle, export, display options |
| `src/components/topbar/MobileBottomBar.tsx` | Mobile action bar (`z-30`) |
| `src/components/panels/LeftSidebar.tsx` | Left panel: scenarios / data issues / CSV upload tabs |
| `src/components/panels/RightPanel.tsx` | Right panel (`z-50`): tabs for Add Employee / Node Editor / Analytics / Diff |
| `src/components/panels/NodeEditor.tsx` | Edit form for a selected org chart node |
| `src/components/panels/AnalyticsSidebar.tsx` | Headcount, span of control, dept breakdown analytics |
| `src/components/panels/DiffPanel.tsx` | Side-by-side scenario comparison |
| `src/components/chart/OrgChart.tsx` | React Flow canvas; exports `chartExportRef`, `pptxExportRef`, `spotlightRef` |
| `src/components/SpotlightSearch.tsx` | Full-screen search overlay (`z-[100]`) |
| `src/components/billing/TrialBanner.tsx` | Trial countdown banner rendered in layout |
| `src/components/onboarding/WelcomeModal.tsx` | First-run modal for empty charts |

### State & Logic
| File | Description |
|------|-------------|
| `src/store/orgStore.ts` | Single Zustand store: all org state, scenarios, UI, filters, DB sync actions |
| `src/store/selectors.ts` | Stable individual selectors (e.g. `selectEmployees`) — always use these, never object selectors |
| `src/lib/chartLayout.ts` | Builds React Flow nodes/edges from flat employee array (`buildFlowGraph`) |
| `src/lib/dataQuality.ts` | Runs data quality checks; populates `dataIssues` in store |
| `src/lib/exporter.ts` | CSV / Excel export utilities |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/utils.ts` | `cn()`, `generateId()`, and misc helpers |
| `src/lib/sampleData.ts` | `SAMPLE_EMPLOYEES` for onboarding |
| `src/types/index.ts` | All shared types: `Employee`, `EmployeeStatus`, `ScenarioSnapshot`, `DisplaySettings`, etc. |

### API Routes
| Route | Description |
|-------|-------------|
| `GET /api/org/mine` | Returns the user's org memberships; never auto-creates orgs |
| `GET /api/org/my-role` | Returns current user's role for a given `?orgId` |
| `GET /api/org` | Fetch org by `?organizationId` (name, settings) |
| `GET/POST /api/employees` | List / create employees for an org |
| `PATCH/DELETE /api/employees/[id]` | Update / delete a single employee |
| `GET/POST /api/scenarios` | List / create scenarios |
| `PATCH/DELETE /api/scenarios/[id]` | Update / delete a scenario |
| `POST /api/org/import` | Bulk import employees from CSV/Excel mapping |
| `GET/POST /api/members` | List / invite team members |
| `POST /api/checkout` | Paddle checkout session |
| `POST /api/webhooks/clerk` | Clerk user sync webhook |
| `POST /api/webhooks/paddle` | Paddle billing webhook |
| `GET /api/share/[token]` | Public share link viewer |
| `GET /api/audit` | Audit log entries |

### Data Model (Prisma)
```
User           — clerkId (unique), email, name, avatarUrl
Organization   — name, slug, ownerId, paddleCustomerId, settings (Json)
OrgMembership  — userId + organizationId, role: OWNER|ADMIN|EDITOR|VIEWER
Employee       — organizationId, name, title, department, email, managerId, status, positionX/Y, metadata (Json)
SecondaryRelationship — employeeId + supervisorId (dotted-line reporting)
Scenario       — organizationId, name, description, employees (Json snapshot)
Subscription   — organizationId, paddleSubId, status: TRIALING|ACTIVE|PAST_DUE|CANCELLED|PAUSED, trialEndsAt
ShareLink      — organizationId, token, enabled, expiresAt
Invite         — email, organizationId, role, token, expiresAt, acceptedAt
AuditLog       — organizationId, userId, action, entityType, changes (Json)
WebhookEvent   — eventId (idempotency), source, eventType
```

## Component Tree

```
src/app/app/layout.tsx  (Server — h-dvh flex flex-col overflow-hidden)
  TrialBanner           (Server — fetches subscription)
  src/app/app/page.tsx  (Server)
    _client.tsx         (Client — org loading logic)
      AppShell          (Client)
        SpotlightSearch   z-[100]
        TopBar            z-[60]  (dropdowns at z-50 inside TopBar context)
        <div flex-1 overflow-hidden>
          Mobile backdrop   z-40
          LeftSidebar       z-50 (mobile), relative (desktop)
          <main flex-1>
            OrgChart        (React Flow nodes z-10)
          RightPanel        z-50
        MobileBottomBar     z-30
        WelcomeModal / AddPersonModal (conditional)
      SyncIndicator
```

## Z-Index Hierarchy

| Level | Component |
|-------|-----------|
| `z-10` | React Flow nodes |
| `z-30` | MobileBottomBar |
| `z-40` | Backdrops / overlays (close-on-click glass panes) |
| `z-50` | Sidebars, RightPanel, dropdown menus |
| `z-[60]` | TopBar header (dropdowns inherit this stacking context) |
| `z-[80]` | OrgChart confirmation dialogs |
| `z-[100]` | SpotlightSearch, CookieBanner |

## Known Gotchas (read before touching these areas)

### 1. Zustand + Immer: never spread draft objects
```ts
// WRONG — creates revoked proxy children that crash on read
const copy = { ...s.displaySettings };

// CORRECT
Object.assign(s.displaySettings, patch);
```

### 2. Zustand selectors: always individual, never object selectors
```ts
// WRONG — causes infinite re-renders on every store update
const { a, b } = useOrgStore(s => ({ a: s.a, b: s.b }));

// CORRECT
const a = useOrgStore(s => s.a);
const b = useOrgStore(s => s.b);
// Or use pre-built selectors from src/store/selectors.ts
const employees = useOrgStore(selectEmployees);
```

### 3. Flex height chains — panels need this pattern
```tsx
// Scrollable content area:
<div className="flex-1 min-h-0 overflow-y-auto">...</div>
// Pinned footer buttons:
<div className="absolute bottom-0 left-0 right-0">...</div>
// Root must be h-dvh overflow-hidden (set in layout.tsx)
```

### 4. Org loading flow
`_client.tsx` `useEffect` reads `?orgId` via `useSearchParams()`. Uses `ENV_ORG_ID || urlOrgId` (not `??` — empty string env var must not shadow the URL param). Calls `loadFromDB(orgId)` when an org is found; falls back to `loadFromLocalStorage()` only when `/api/org/mine` returns no memberships. **Never auto-create orgs in `/api/org/mine`.**

### 5. Zustand persist version
`orgStore` uses `version: 2` with a `migrate()` function. **Do not bump the version** unless absolutely necessary — it clears all stored localStorage state for existing users.

### 6. Status enum mapping
The DB and client use different values:

| DB (`EmployeeStatus`) | Client (`EmployeeStatus` type) |
|----------------------|-------------------------------|
| `ACTIVE` | `'active'` |
| `INACTIVE` | `'on-leave'` |
| `CONTRACTOR` | `'contractor'` |
| `OPEN_ROLE` | `'vacant'` |

Conversion functions: `dbToClientStatus()` and `clientToDbStatus()` in `src/lib/utils.ts` (or nearby).

### 7. Auth middleware is `src/proxy.ts`, not `src/middleware.ts`
Next.js 16 uses `proxy.ts` instead of `middleware.ts`. It runs Clerk auth and the subscription gate. Paths exempt from the subscription check are listed in `isSubscriptionExempt`.

### 8. Scenarios are stored as JSON snapshots
Each `Scenario.employees` is a complete `Employee[]` JSON blob, not normalized rows. The store keeps all scenarios in `Record<string, ScenarioSnapshot>` in memory; the active scenario's employees are what the chart renders.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma connection pooling URL (Supabase) |
| `DIRECT_URL` | Prisma direct connection URL (Supabase, for migrations) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `CLERK_SECRET_KEY` | Clerk backend key |
| `CLERK_WEBHOOK_SECRET` | Svix webhook verification for `/api/webhooks/clerk` |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle frontend token |
| `PADDLE_API_KEY` | Paddle backend key |
| `PADDLE_WEBHOOK_SECRET` | Paddle webhook verification |
| `NEXT_PUBLIC_ORG_ID` | Optional: pin a fixed org (leave empty in most envs) |
| `NEXT_PUBLIC_APP_URL` | Base URL for share links etc. |

## Dev Commands

```bash
npm run dev        # Next.js dev server on :3000
npm run build      # prisma generate + next build
npx prisma studio  # DB GUI
npx prisma migrate dev --name <name>  # create migration
```
