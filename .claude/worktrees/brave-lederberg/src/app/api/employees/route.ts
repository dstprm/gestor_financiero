import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import type { EmployeeStatus } from '@prisma/client'
import { logAudit } from '@/lib/audit'

/**
 * Verifies org membership and returns the member's role.
 * Returns null if the user is not a member.
 */
async function getMemberRole(clerkUserId: string, organizationId: string): Promise<string | null> {
  const { prisma } = await import('@/lib/db')
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  })
  if (!user) return null
  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  })
  return membership?.role ?? null
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const organizationId = searchParams.get('organizationId')
  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
  }

  const role = await getMemberRole(userId, organizationId)
  if (!role) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { prisma } = await import('@/lib/db')
    const employees = await prisma.employee.findMany({
      where: {
        organizationId,
        status: { not: 'INACTIVE' },
      },
      orderBy: { createdAt: 'asc' },
      include: { secondaryManagers: true },
    })
    return NextResponse.json(employees)
  } catch (err) {
    console.error('GET /api/employees error', err)
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const { prisma } = await import('@/lib/db')
    const body = await req.json()
    const { organizationId, nodes } = body as {
      organizationId: string
      nodes: Array<{
        id: string; name: string; title?: string; department?: string;
        email?: string; managerId?: string | null; status?: string;
        positionX?: number | null; positionY?: number | null;
      }>
    }

    if (!organizationId || !Array.isArray(nodes)) {
      return NextResponse.json({ error: 'organizationId and nodes are required' }, { status: 400 })
    }

    const role = await getMemberRole(userId, organizationId)
    if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await Promise.all(
      nodes.map((node) =>
        prisma.employee.upsert({
          where: { id: node.id },
          create: {
            id: node.id,
            organizationId,
            name: node.name,
            title: node.title ?? null,
            department: node.department ?? null,
            email: node.email ?? null,
            managerId: node.managerId ?? null,
            status: (node.status?.toUpperCase() ?? 'ACTIVE') as EmployeeStatus,
            positionX: node.positionX ?? null,
            positionY: node.positionY ?? null,
          },
          update: {
            name: node.name,
            title: node.title ?? null,
            department: node.department ?? null,
            email: node.email ?? null,
            managerId: node.managerId ?? null,
            status: (node.status?.toUpperCase() ?? 'ACTIVE') as EmployeeStatus,
            positionX: node.positionX ?? null,
            positionY: node.positionY ?? null,
          },
        })
      )
    )

    // Soft-delete any employees in this org that are no longer in the submitted list
    const submittedIds = nodes.map((n) => n.id)
    await prisma.employee.updateMany({
      where: {
        organizationId,
        id: { notIn: submittedIds.length > 0 ? submittedIds : ['__none__'] },
        status: { not: 'INACTIVE' },
      },
      data: { status: 'INACTIVE' },
    })

    return NextResponse.json({ ok: true, count: nodes.length })
  } catch (err) {
    console.error('PATCH /api/employees error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const { prisma } = await import('@/lib/db')
    const body = await req.json()
    const { organizationId, name, title, department, email, managerId, positionX, positionY } = body

    if (!organizationId || !name) {
      return NextResponse.json({ error: 'organizationId and name are required' }, { status: 400 })
    }

    const role = await getMemberRole(userId, organizationId)
    if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const employee = await prisma.employee.create({
      data: { organizationId, name, title, department, email, managerId: managerId ?? null, positionX, positionY },
    })
    void logAudit({
      organizationId,
      userId,
      action: 'employee.created',
      entityType: 'employee',
      entityId: employee.id,
      entityName: employee.name,
    })
    return NextResponse.json(employee, { status: 201 })
  } catch (err) {
    console.error('POST /api/employees error', err)
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }
}
