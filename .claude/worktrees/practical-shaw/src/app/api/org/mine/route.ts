import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createTrialData } from '@/lib/subscription'

/**
 * Returns the DB organization ID for the currently authenticated Clerk user.
 * Lazily creates the User and Organization records if they haven't been synced yet
 * (e.g. if the Clerk webhook hasn't fired).
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

    // Get or lazily create the DB Organization record
    let org = await prisma.organization.findFirst({ where: { ownerId: user.id } })
    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: `${user.name ?? 'My'} Org`,
          slug: `org-${user.id.slice(-8)}-${Date.now()}`,
          ownerId: user.id,
          members: { create: { userId: user.id, role: 'OWNER' } },
        },
      })
      await prisma.subscription.create({ data: createTrialData(org.id) })
    }

    const userMembership = await prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    })

    return NextResponse.json({
      organizationId: org.id,
      orgName: org.name,
      currentUserRole: userMembership?.role ?? null,
    })
  } catch (err) {
    console.error('GET /api/org/mine error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
