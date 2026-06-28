import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Returns the org ID for the currently authenticated Clerk user by looking up
 * their most recently joined membership. Returns 404 if no membership exists.
 * Does NOT auto-create orgs — that was the source of ghost-org / empty-state bugs.
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ organizationId: 'demo' })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/db')

    // Get or lazily create the DB User record
    let user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      const clerkUser = await currentUser()
      const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@unknown.com`
      const name =
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || email
      user = await prisma.user.upsert({
        where: { clerkId: userId },
        create: { clerkId: userId, email, name, avatarUrl: clerkUser?.imageUrl ?? null },
        update: { email, name, avatarUrl: clerkUser?.imageUrl ?? null },
      })
    }

    // Find the user's most recently joined org via membership.
    // Never auto-create an org here — ghost orgs caused by this were the
    // root cause of users seeing empty state after sign-in.
    const membership = await prisma.orgMembership.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: 'desc' },
      include: { organization: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'no_org' }, { status: 404 })
    }

    return NextResponse.json({
      organizationId: membership.organizationId,
      orgName: membership.organization.name,
      currentUserRole: membership.role,
    })
  } catch (err) {
    console.error('GET /api/org/mine error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
