import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

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

    const invite = await prisma.invite.findUnique({ where: { id } })
    if (!invite) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    // Only admins/owners of the org can cancel invites
    const requester = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!requester) return NextResponse.json({ error: 'user_not_found' }, { status: 404 })

    const membership = await prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId: requester.id, organizationId: invite.organizationId } },
    })
    if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'OWNER')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    await prisma.invite.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/invites/[id] error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
