import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

/**
 * GET /api/org/my-role?orgId=xxx
 * Returns the current user's role in the given org.
 */
export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ role: 'OWNER' })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')
  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
  }

  try {
    const { prisma } = await import('@/lib/db')

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 })

    const membership = await prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    })
    if (!membership) {
      return NextResponse.json({ error: 'not_a_member' }, { status: 403 })
    }

    return NextResponse.json({ role: membership.role })
  } catch (err) {
    console.error('GET /api/org/my-role error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
