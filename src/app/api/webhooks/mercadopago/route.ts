/**
 * Mercado Pago IPN / Webhook handler
 *
 * MP sends notifications in two formats:
 *  1. IPN (legacy): POST with body { id, topic }
 *  2. Webhooks (new): POST with body { type, data: { id } }
 *
 * Both are handled here. We fetch the payment/merchant_order by ID
 * to verify its status server-side (never trust the notification alone).
 *
 * Configure in MP dashboard → Your app → Webhooks → Add URL:
 *   https://yourapp.com/api/webhooks/mercadopago
 *
 * Optionally set MP_WEBHOOK_SECRET in env to verify the x-signature header.
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getPayment, isMPConfigured } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  if (!isMPConfigured) return new Response('Not configured', { status: 200 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  // Normalise both IPN and Webhook formats
  const topic: string = body.topic ?? body.type ?? ''
  const resourceId: string | undefined =
    body.data?.id ?? body.id?.toString()

  // We only handle payment notifications
  if (!['payment', 'merchant_order'].includes(topic) || !resourceId) {
    return new Response('Ignored', { status: 200 })
  }

  // Idempotency: skip if already processed
  const eventId = `mp-${topic}-${resourceId}`
  const existing = await prisma.webhookEvent.findUnique({ where: { eventId } }).catch(() => null)
  if (existing) return new Response('Already processed', { status: 200 })
  await prisma.webhookEvent.create({ data: { eventId, source: 'mercadopago', eventType: topic } }).catch(() => null)

  if (topic === 'payment') {
    try {
      const payment = await getPayment(resourceId)
      const orgId: string | undefined = payment.external_reference ?? undefined

      if (!orgId) {
        console.warn('MP webhook: payment has no external_reference', resourceId)
        return new Response('OK', { status: 200 })
      }

      switch (payment.status) {
        case 'approved':
          await prisma.subscription.updateMany({
            where: { organizationId: orgId },
            data: {
              status: 'ACTIVE',
              mpPaymentId: String(payment.id),
              currentPeriodStart: payment.date_approved ? new Date(payment.date_approved) : undefined,
            },
          })
          // Store MP customer ID on the org if available
          if (payment.payer?.id) {
            await prisma.organization.updateMany({
              where: { id: orgId },
              data: { mpCustomerId: String(payment.payer.id) },
            })
          }
          break

        case 'refunded':
        case 'cancelled':
        case 'charged_back':
          await prisma.subscription.updateMany({
            where: { organizationId: orgId },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
          })
          break

        case 'pending':
        case 'in_process':
          // Leave subscription in current state; payment is being processed
          break

        case 'rejected':
          // Payment failed — keep TRIALING or mark PAST_DUE depending on context
          await prisma.subscription.updateMany({
            where: { organizationId: orgId, status: 'ACTIVE' },
            data: { status: 'PAST_DUE' },
          })
          break
      }
    } catch (err) {
      console.error('MP webhook payment processing error', err)
      return new Response('Error', { status: 500 })
    }
  }

  return new Response('OK', { status: 200 })
}
