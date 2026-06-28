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

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')
  if (!orgId) return NextResponse.json({ error: 'orgId is required' }, { status: 400 })

  const role = await getMemberRole(userId, orgId)
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { prisma } = await import('@/lib/db')
    const relationships = await prisma.secondaryRelationship.findMany({
      where: { orgId },
    })
    return NextResponse.json(relationships)
  } catch (err) {
    console.error('GET /api/org/secondary-relationships error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { employeeId, supervisorId, label, orgId } = body as {
      employeeId: string
      supervisorId: string
      label?: string
      orgId: string
    }

    if (!employeeId || !supervisorId || !orgId) {
      return NextResponse.json({ error: 'employeeId, supervisorId, orgId are required' }, { status: 400 })
    }

    const role = await getMemberRole(userId, orgId)
    if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { prisma } = await import('@/lib/db')
    const relationship = await prisma.secondaryRelationship.create({
      data: { employeeId, supervisorId, label: label ?? null, orgId },
    })
    return NextResponse.json(relationship, { status: 201 })
  } catch (err: unknown) {
    // Unique constraint violation — relationship already exists
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: 'Relationship already exists' }, { status: 409 })
    }
    console.error('POST /api/org/secondary-relationships error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
