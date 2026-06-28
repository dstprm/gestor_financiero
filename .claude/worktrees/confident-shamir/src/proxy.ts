import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/app(.*)'])

// Paths that are exempt from the subscription check even when authenticated
const isSubscriptionExempt = createRouteMatcher([
  '/upgrade',
  '/api/webhooks/(.*)',
  '/api/cron/(.*)',
  '/api/checkout',
  '/sign-in(.*)',
  '/sign-out(.*)',
  '/auth/(.*)',
  '/share/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return

  await auth.protect()

  // Skip subscription check for exempt paths
  if (isSubscriptionExempt(req)) return

  // Enforce subscription access
  if (!process.env.DATABASE_URL) return

  try {
    const { userId } = await auth()
    if (!userId) return

    const { prisma } = await import('@/lib/db')

    const membership = await prisma.orgMembership.findFirst({
      where: { user: { clerkId: userId } },
      orderBy: { joinedAt: 'desc' },
      select: {
        organization: {
          select: {
            subscription: {
              select: { status: true, trialEndsAt: true },
            },
          },
        },
      },
    })

    const sub = membership?.organization?.subscription
    if (!sub) return // no subscription record — allow through (unconfigured)

    let isAccessAllowed = true
    if (sub.status === 'TRIALING') {
      if (sub.trialEndsAt) {
        const daysLeft = Math.max(
          0,
          Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000)
        )
        isAccessAllowed = daysLeft > 0
      }
    } else if (sub.status !== 'ACTIVE' && sub.status !== 'PAST_DUE') {
      isAccessAllowed = false
    }

    if (!isAccessAllowed) {
      return NextResponse.redirect(new URL('/upgrade', req.url))
    }
  } catch {
    // Fail open — if DB check errors, let the request through
  }
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
