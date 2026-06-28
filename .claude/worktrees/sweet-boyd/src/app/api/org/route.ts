import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const organizationId = searchParams.get('organizationId')

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      id: 'demo',
      name: 'Demo Organization',
      slug: 'demo',
      subscriptionStatus: 'unconfigured',
    })
  }

  try {
    const { prisma } = await import('@/lib/db')
    const org = await prisma.organization.findUnique({
      where: { id: organizationId ?? '' },
      include: { subscription: true },
    })

    if (!org) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    return NextResponse.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      subscriptionStatus: org.subscription?.status ?? null,
    })
  } catch (err) {
    console.error('GET /api/org error', err)
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }
}
