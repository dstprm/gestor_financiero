import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

async function getAuthorizedOrg(userId: string, organizationId: string) {
  const { prisma } = await import('@/lib/db')
  const membership = await prisma.orgMembership.findFirst({
    where: { organizationId, user: { clerkId: userId } },
    include: { organization: true },
  })
  return membership
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const organizationId = new URL(req.url).searchParams.get('organizationId')
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 })

  if (!process.env.DATABASE_URL) return NextResponse.json({ settings: {} })

  try {
    const { prisma } = await import('@/lib/db')
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    })
    if (!org) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json({ settings: org.settings ?? {} })
  } catch (err) {
    console.error('GET /api/org/settings error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const organizationId = new URL(req.url).searchParams.get('organizationId')
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 })

  if (!process.env.DATABASE_URL) return NextResponse.json({ settings: {} })

  try {
    const membership = await getAuthorizedOrg(userId, organizationId)
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!['OWNER', 'ADMIN', 'EDITOR'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const patch = await req.json() as Record<string, unknown>

    const { prisma } = await import('@/lib/db')
    const current = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    })
    const existing = (current?.settings && typeof current.settings === 'object' && !Array.isArray(current.settings))
      ? current.settings as Record<string, unknown>
      : {}
    const merged = { ...existing, ...patch }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { settings: merged as Parameters<typeof prisma.organization.update>[0]['data']['settings'] },
      select: { settings: true },
    })
    return NextResponse.json({ settings: updated.settings })
  } catch (err) {
    console.error('PATCH /api/org/settings error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
