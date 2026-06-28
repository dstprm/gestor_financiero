import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.PADDLE_API_KEY
  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID
  if (!apiKey || !priceId) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  try {
    const { organizationId, email, quantity = 1 } = await req.json()
    const { Paddle, Environment } = await import('@paddle/paddle-node-sdk')
    const paddle = new Paddle(apiKey, {
      environment: process.env.PADDLE_ENVIRONMENT === 'production' ? Environment.production : Environment.sandbox,
    })
    const tx = await (paddle.transactions as any).create({
      items: [{ priceId, quantity }],
      customData: { organizationId },
      customerEmail: email,
    })
    return NextResponse.json({ checkoutUrl: tx.checkout?.url ?? null, transactionId: tx.id })
  } catch (err) {
    console.error('Checkout error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
