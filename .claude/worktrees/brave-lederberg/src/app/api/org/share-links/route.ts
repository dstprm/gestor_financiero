import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

async function getOrgId(userId: string): Promise<string | null> {
  const { prisma } = await import('@/lib/db')
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return null
  const org = await prisma.organization.findFirst({ where: { ownerId: user.id } })
  return org?.id ?? null
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ links: [] })

  try {
    const { prisma } = await import('@/lib/db')
    const organizationId = await getOrgId(userId)
    if (!organizationId) return NextResponse.json({ error: 'org_not_found' }, { status: 404 })

    const links = await prisma.shareLink.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ links })
  } catch (err) {
    console.error('GET /api/org/share-links error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  try {
    const { prisma } = await import('@/lib/db')
    const organizationId = await getOrgId(userId)
    if (!organizationId) return NextResponse.json({ error: 'org_not_found' }, { status: 404 })

    const body = await req.json()
    const link = await prisma.shareLink.create({
      data: {
        organizationId,
        label: body.label ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    })
    return NextResponse.json(link, { status: 201 })
  } catch (err) {
    console.error('POST /api/org/share-links error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const { prisma } = await import('@/lib/db')
    const organizationId = await getOrgId(userId)
    if (!organizationId) return NextResponse.json({ error: 'org_not_found' }, { status: 404 })

    await prisma.shareLink.deleteMany({ where: { id, organizationId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/org/share-links error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL)
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const { prisma } = await import('@/lib/db')
    const organizationId = await getOrgId(userId)
    if (!organizationId) return NextResponse.json({ error: 'org_not_found' }, { status: 404 })

    const body = await req.json()
    await prisma.shareLink.updateMany({
      where: { id, organizationId },
      data: { enabled: body.enabled },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/org/share-links error', err)
    return NextResponse.json({ error: 'database_error' }, { status: 503 })
  }
}
