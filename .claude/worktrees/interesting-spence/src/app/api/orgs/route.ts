import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Returns all orgs the current user belongs to (id + name only),
 * for use in the top-bar org switcher.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  if (!process.env.DATABASE_URL) {
    return NextResponse.json([{ id: 'demo', name: 'Demo Organization' }])
  }

  try {
    const { prisma } = await import('@/lib/db')

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json([])

    const memberships = await prisma.orgMembership.findMany({
      where: { userId: user.id },
      include: { organization: { select: { id: true, name: true } } },
      orderBy: { joinedAt: 'desc' },
    })

    return NextResponse.json(
      memberships.map((m) => ({ id: m.organization.id, name: m.organization.name }))
    )
  } catch (err) {
    console.error('GET /api/orgs error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
