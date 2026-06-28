import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

async function getMemberRole(clerkUserId: string, organizationId: string): Promise<string | null> {
  const { prisma } = await import('@/lib/db')
  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId }, select: { id: true } })
  if (!user) return null
  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  })
  return membership?.role ?? null
}

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json([])

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const organizationId = new URL(req.url).searchParams.get('organizationId')
  if (!organizationId) return NextResponse.json({ error: 'organizationId required' }, { status: 400 })

  const role = await getMemberRole(userId, organizationId)
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { prisma } = await import('@/lib/db')
    const scenarios = await prisma.scenario.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(scenarios)
  } catch (err) {
    console.error('GET /api/scenarios error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { organizationId, name, description, employees } = body as {
      organizationId: string
      name: string
      description?: string
      employees: unknown
    }

    if (!organizationId || !name) {
      return NextResponse.json({ error: 'organizationId and name are required' }, { status: 400 })
    }

    const role = await getMemberRole(userId, organizationId)
    if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { prisma } = await import('@/lib/db')
    const scenario = await prisma.scenario.create({
      data: { organizationId, name, description: description ?? '', employees: employees ?? [] },
    })
    return NextResponse.json(scenario, { status: 201 })
  } catch (err) {
    console.error('POST /api/scenarios error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
