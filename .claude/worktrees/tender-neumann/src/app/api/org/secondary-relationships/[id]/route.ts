import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const { prisma } = await import('@/lib/db')
    const rel = await prisma.secondaryRelationship.findUnique({ where: { id } })
    if (!rel) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const role = await getMemberRole(userId, rel.orgId)
    if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.secondaryRelationship.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/org/secondary-relationships/[id] error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
