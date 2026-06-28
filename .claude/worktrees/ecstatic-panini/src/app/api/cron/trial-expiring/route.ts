import { NextRequest, NextResponse } from 'next/server'
import { sendTrialExpiringEmail } from '@/lib/email'

const DAYS_BEFORE = 3

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
  const windowEnd = new Date(now.getTime() + DAYS_BEFORE * 86400000)

  const expiring = await prisma.subscription.findMany({
    where: {
      status: 'TRIALING',
      trialEndsAt: { gte: now, lt: windowEnd },
      trialReminderSentAt: null,
    },
    include: { organization: { include: { owner: true } } },
  })

  const results = await Promise.allSettled(
    expiring.map(async (sub) => {
      const owner = sub.organization.owner
      const daysLeft = Math.ceil(
        (sub.trialEndsAt!.getTime() - now.getTime()) / 86400000
      )
      await sendTrialExpiringEmail(owner.email, owner.name ?? owner.email, daysLeft)
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { trialReminderSentAt: new Date() },
      })
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  if (failed > 0) {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(
          `Failed to send trial expiring email to ${expiring[i].organization.owner.email}:`,
          r.reason
        )
      }
    })
  }

  return NextResponse.json({ sent, failed, total: expiring.length })
}
