import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isMPConfigured, createPreference } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isMPConfigured) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  try {
    const { organizationId, email } = await req.json()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const { preferenceId, initPoint, sandboxInitPoint } = await createPreference({
      organizationId,
      userEmail: email,
      successUrl: `${appUrl}/app?payment=success`,
      failureUrl: `${appUrl}/upgrade?payment=failed`,
      pendingUrl: `${appUrl}/app?payment=pending`,
    })

    const checkoutUrl =
      process.env.MP_MODE === 'production' ? initPoint : sandboxInitPoint

    return NextResponse.json({ preferenceId, checkoutUrl })
  } catch (err) {
    console.error('MP checkout error', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
