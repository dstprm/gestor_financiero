import { NextResponse } from 'next/server'

/**
 * Mercado Pago does not have a hosted customer billing portal.
 * To let users manage their subscription, redirect them to your own
 * billing settings page where they can cancel or change their plan.
 *
 * If you use MP Preapprovals (recurring subscriptions), you can cancel
 * them via the Preapproval API: PATCH /preapproval/:id { status: 'cancelled' }
 */
export async function GET() {
  return NextResponse.json({ error: 'not_supported' }, { status: 404 })
}
