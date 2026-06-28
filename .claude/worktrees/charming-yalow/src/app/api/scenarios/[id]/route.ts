import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'

async function getScenarioWithRole(
  clerkUserId: string,
  scenarioId: string
): Promise<{ role: string; organizationId: string } | null> {
  const { prisma } = await import('@/lib/db')
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    select: { organizationId: true },
  })
  if (!scenario) return null

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId }, select: { id: true } })
  if (!user) return null

  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: scenario.organizationId } },
  })
  if (!membership) return null

  return { role: membership.role, organizationId: scenario.organizationId }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const access = await getScenarioWithRole(userId, id)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (access.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const { name, description, employees } = body as {
      name?: string
      description?: string
      employees?: unknown
    }

    const { prisma } = await import('@/lib/db')
    const scenario = await prisma.scenario.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(employees !== undefined && { employees: employees as Prisma.InputJsonValue }),
      },
    })
    return NextResponse.json(scenario)
  } catch (err) {
    console.error('PATCH /api/scenarios/[id] error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const access = await getScenarioWithRole(userId, id)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (access.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { prisma } = await import('@/lib/db')
    await prisma.scenario.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('DELETE /api/scenarios/[id] error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
