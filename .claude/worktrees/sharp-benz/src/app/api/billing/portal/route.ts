import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const apiKey = process.env.PADDLE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }

  try {
    const { prisma } = await import('@/lib/db')
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
    }

    const org = await prisma.organization.findFirst({
      where: { ownerId: user.id },
      include: { subscription: true },
    })
    if (!org?.paddleCustomerId) {
      return NextResponse.json({ error: 'no_paddle_customer' }, { status: 404 })
    }

    const { Paddle, Environment } = await import('@paddle/paddle-node-sdk')
    const paddle = new Paddle(apiKey, {
      environment: process.env.PADDLE_ENVIRONMENT === 'production' ? Environment.production : Environment.sandbox,
    })

    const subscriptionIds = org.subscription?.paddleSubId ? [org.subscription.paddleSubId] : []
    const session = await (paddle.customerPortalSessions as any).create(org.paddleCustomerId, subscriptionIds)
    const url: string = session.urls.general.overview

    return NextResponse.json({ url })
  } catch (err) {
    console.error('Billing portal error', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
