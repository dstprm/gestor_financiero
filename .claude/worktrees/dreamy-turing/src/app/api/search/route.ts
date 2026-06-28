import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const { userId, orgId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json([])

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const { prisma } = await import('@/lib/db')

    // Resolve organizationId: prefer Clerk orgId, fall back to owner lookup
    let organizationId: string | undefined = orgId ?? undefined
    if (!organizationId) {
      const user = await prisma.user.findUnique({ where: { clerkId: userId } })
      if (!user) return NextResponse.json([])
      const org = await prisma.organization.findFirst({ where: { ownerId: user.id } })
      if (!org) return NextResponse.json([])
      organizationId = org.id
    }

    const employees = await prisma.employee.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { department: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        title: true,
        department: true,
        managerId: true,
        manager: { select: { name: true } },
      },
      take: 10,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(
      employees.map((e) => ({
        id: e.id,
        name: e.name,
        title: e.title ?? '',
        department: e.department ?? '',
        managerId: e.managerId,
        managerName: e.manager?.name ?? null,
      }))
    )
  } catch (err) {
    console.error('GET /api/search error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
