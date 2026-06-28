import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { logAudit } from '@/lib/audit'

async function getMemberRole(clerkUserId: string, organizationId: string): Promise<string | null> {
  const { prisma } = await import('@/lib/db')
  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId }, select: { id: true } })
  if (!user) return null
  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  })
  return membership?.role ?? null
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }

  try {
    const { prisma } = await import('@/lib/db')
    const { id } = await params
    const body = await req.json()
    const { name, title, department, email, managerId, positionX, positionY } = body

    const before = await prisma.employee.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const role = await getMemberRole(userId, before.organizationId)
    if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(title !== undefined && { title }),
        ...(department !== undefined && { department }),
        ...(email !== undefined && { email }),
        ...(managerId !== undefined && { managerId }),
        ...(positionX !== undefined && { positionX }),
        ...(positionY !== undefined && { positionY }),
      },
    })

    if (before) {
      const fields = ['name', 'title', 'department', 'email', 'managerId'] as const
      const changes: Record<string, { from: unknown; to: unknown }> = {}
      for (const f of fields) {
        if (body[f] !== undefined && before[f] !== employee[f]) {
          changes[f] = { from: before[f], to: employee[f] }
        }
      }
      void logAudit({
        organizationId: employee.organizationId,
        userId,
        action: 'employee.updated',
        entityType: 'employee',
        entityId: employee.id,
        entityName: employee.name,
        changes: Object.keys(changes).length > 0 ? changes : undefined,
      })
    }

    return NextResponse.json(employee)
  } catch (err) {
    console.error('PUT /api/employees/[id] error', err)
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }

  try {
    const { prisma } = await import('@/lib/db')
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const hard = searchParams.get('hard') === 'true'

    const employee = await prisma.employee.findUnique({ where: { id }, select: { name: true, organizationId: true } })
    if (!employee) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const role = await getMemberRole(userId, employee.organizationId)
    if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (hard) {
      await prisma.employee.delete({ where: { id } })
    } else {
      await prisma.employee.update({ where: { id }, data: { status: 'INACTIVE' } })
    }

    if (employee) {
      void logAudit({
        organizationId: employee.organizationId,
        userId,
        action: 'employee.deleted',
        entityType: 'employee',
        entityId: id,
        entityName: employee.name,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/employees/[id] error', err)
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }
}
