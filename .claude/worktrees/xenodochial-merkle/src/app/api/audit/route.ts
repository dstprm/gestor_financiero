import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const { userId, orgId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }

  try {
    const { prisma } = await import('@/lib/db')
    const { searchParams } = new URL(req.url)
    const before = searchParams.get('before')

    let cursorCreatedAt: Date | null = null
    if (before) {
      const pivot = await prisma.auditLog.findUnique({
        where: { id: before },
        select: { createdAt: true },
      })
      cursorCreatedAt = pivot?.createdAt ?? null
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        ...(cursorCreatedAt
          ? { createdAt: { lt: cursorCreatedAt } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 51,
    })

    const hasMore = logs.length === 51
    const items = hasMore ? logs.slice(0, 50) : logs
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return NextResponse.json({ logs: items, nextCursor })
  } catch (err) {
    console.error('GET /api/audit error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
