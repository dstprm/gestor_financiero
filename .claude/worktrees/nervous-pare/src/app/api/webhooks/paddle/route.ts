import { headers } from 'next/headers'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret) return new Response('Not configured', { status: 200 })

  const body = await req.text()
  const sig = (await headers()).get('paddle-signature') ?? ''
  if (!sig) return new Response('Missing signature', { status: 400 })

  let event: any
  try {
    const { Paddle, Environment } = await import('@paddle/paddle-node-sdk')
    const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
      environment: process.env.PADDLE_ENVIRONMENT === 'production' ? Environment.production : Environment.sandbox,
    })
    event = await paddle.webhooks.unmarshal(body, secret, sig)
    if (!event) return new Response('Invalid signature', { status: 400 })
  } catch (err) {
    console.error('Paddle unmarshal error', err)
    return new Response('Error', { status: 400 })
  }

  const eventId: string = (event as any).eventId ?? sig.split(';')[0]
  const existing = await prisma.webhookEvent.findUnique({ where: { eventId } }).catch(() => null)
  if (existing) return new Response('Already processed', { status: 200 })
  await prisma.webhookEvent.create({ data: { eventId, source: 'paddle', eventType: event.eventType } }).catch(() => null)

  try {
    const d = (event as any).data
    const orgId: string | undefined = d?.customData?.organizationId
    switch (event.eventType) {
      case 'subscription.activated':
      case 'subscription.updated':
        if (orgId) {
          await prisma.subscription.updateMany({
            where: { organizationId: orgId },
            data: {
              paddleSubId: d.id,
              status: 'ACTIVE',
              seatCount: d.items?.[0]?.quantity ?? 1,
              currentPeriodStart: d.currentBillingPeriod?.startsAt ? new Date(d.currentBillingPeriod.startsAt) : undefined,
              currentPeriodEnd: d.currentBillingPeriod?.endsAt ? new Date(d.currentBillingPeriod.endsAt) : undefined,
            },
          })
          if (d.customerId) {
            await prisma.organization.updateMany({ where: { id: orgId }, data: { paddleCustomerId: d.customerId } })
          }
        }
        break
      case 'subscription.canceled':
        if (orgId) await prisma.subscription.updateMany({ where: { organizationId: orgId }, data: { status: 'CANCELLED', cancelledAt: new Date() } })
        break
      case 'subscription.past_due':
        if (orgId) await prisma.subscription.updateMany({ where: { organizationId: orgId }, data: { status: 'PAST_DUE' } })
        break
      case 'subscription.paused':
        if (orgId) await prisma.subscription.updateMany({ where: { organizationId: orgId }, data: { status: 'PAUSED' } })
        break
    }
  } catch (err) {
    console.error('Paddle webhook processing error', err)
    return new Response('Error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
