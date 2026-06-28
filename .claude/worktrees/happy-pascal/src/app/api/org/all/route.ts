import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json([
      { id: 'demo', name: 'Demo Organization', memberCount: 1, updatedAt: new Date().toISOString(), role: 'OWNER' },
    ])
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { prisma } = await import('@/lib/db')

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json([])

    const memberships = await prisma.orgMembership.findMany({
      where: { userId: user.id },
      include: {
        organization: {
          include: { _count: { select: { members: true } } },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    return NextResponse.json(
      memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        memberCount: m.organization._count.members,
        updatedAt: m.organization.updatedAt,
        role: m.role,
      }))
    )
  } catch (err) {
    console.error('GET /api/org/all error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
