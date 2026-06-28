import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }

  const { prisma } = await import('@/lib/db')

  const now = new Date()

  const expired = await prisma.subscription.findMany({
    where: {
      status: 'TRIALING',
      trialEndsAt: { lt: now },
    },
    select: { id: true },
  })

  if (expired.length === 0) {
    return NextResponse.json({ expired: 0 })
  }

  const ids = expired.map((s) => s.id)

  await prisma.subscription.updateMany({
    where: { id: { in: ids } },
    data: { status: 'CANCELLED' },
  })

  console.log(`[expire-trials] Expired ${ids.length} trial(s)`)

  return NextResponse.json({ expired: ids.length })
}
