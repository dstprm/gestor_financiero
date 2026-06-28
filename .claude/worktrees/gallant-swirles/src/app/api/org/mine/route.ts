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
    const memberships = await prisma.orgMembership.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: 'desc' },
      include: { organization: true },
    })

    if (memberships.length === 0) {
      return NextResponse.json({ error: 'no_org' }, { status: 404 })
    }

    const primary = memberships[0]

    return NextResponse.json({
      organizationId: primary.organizationId,
      orgName: primary.organization.name,
      currentUserRole: primary.role,
      membershipId: primary.id,
      orgs: memberships.map((m) => ({
        id: m.organizationId,
        name: m.organization.name,
        role: m.role,
        membershipId: m.id,
      })),
    })
  } catch (err) {
    console.error('GET /api/org/mine error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
