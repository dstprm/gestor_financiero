import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const CHANGEABLE_ROLES: string[] = ['ADMIN', 'EDITOR', 'VIEWER']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  try {
    const { role } = await req.json()
    if (!role || !CHANGEABLE_ROLES.includes(role)) {
      return NextResponse.json({ error: 'invalid_role' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/db')
    const { id } = await params

    // Check requester is admin via DB
    const requester = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!requester) return NextResponse.json({ error: 'user_not_found' }, { status: 404 })

    const target = await prisma.orgMembership.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (target.role === 'OWNER') {
      return NextResponse.json({ error: 'cannot_change_owner_role' }, { status: 403 })
    }

    const requesterMembership = await prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId: requester.id, organizationId: target.organizationId } },
    })
    if (!requesterMembership || (requesterMembership.role !== 'ADMIN' && requesterMembership.role !== 'OWNER')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const updated = await prisma.orgMembership.update({
      where: { id },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/members/[id] error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/db')
    const { id } = await params

    const membership = await prisma.orgMembership.findUnique({ where: { id } })
    if (!membership) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (membership.role === 'OWNER') {
      return NextResponse.json({ error: 'cannot_remove_owner' }, { status: 403 })
    }

    // Check requester is admin or removing themselves
    const requester = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!requester) return NextResponse.json({ error: 'user_not_found' }, { status: 404 })

    const isSelf = membership.userId === requester.id
    if (!isSelf) {
      const requesterMembership = await prisma.orgMembership.findUnique({
        where: { userId_organizationId: { userId: requester.id, organizationId: membership.organizationId } },
      })
      if (!requesterMembership || (requesterMembership.role !== 'ADMIN' && requesterMembership.role !== 'OWNER')) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }
    }

    await prisma.orgMembership.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/members/[id] error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
