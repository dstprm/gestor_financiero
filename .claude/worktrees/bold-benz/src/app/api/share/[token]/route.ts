import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  try {
    const { token } = await params
    const { prisma } = await import('@/lib/db')

    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        organization: {
          include: {
            employees: {
              where: { status: { not: 'INACTIVE' } },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!link || !link.enabled) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json({
      orgName: link.organization.name,
      employees: link.organization.employees.map((e) => ({
        id: e.id,
        name: e.name,
        title: e.title,
        department: e.department,
        managerId: e.managerId,
        avatarUrl: null,
      })),
    })
  } catch (err) {
    console.error('GET /api/share/[token] error', err)
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
}
