import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  const { id } = await params
  const body = await req.json() as { name?: string }
  const name = body.name?.trim()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  try {
    const { prisma } = await import('@/lib/db')

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

    const membership = await prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: id } },
    })
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const org = await prisma.organization.update({
      where: { id },
      data: { name },
    })

    return NextResponse.json({ id: org.id, name: org.name })
  } catch (err) {
    console.error('PATCH /api/org/[id] error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  const { id } = await params

  try {
    const { prisma } = await import('@/lib/db')

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

    const membership = await prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: id } },
    })
    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden - OWNER only' }, { status: 403 })
    }

    // Delete in dependency order since not all relations have onDelete: Cascade
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { organizationId: id } }),
      prisma.employee.deleteMany({ where: { organizationId: id } }),
      prisma.orgMembership.deleteMany({ where: { organizationId: id } }),
      prisma.subscription.deleteMany({ where: { organizationId: id } }),
      prisma.organization.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/org/[id] error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
