import MercadoPagoConfig, { Preference, Payment, PreApproval } from 'mercadopago'

export const MP_CONFIG = {
  accessToken: process.env.MP_ACCESS_TOKEN ?? '',
  publicKey: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? '',
  // 'sandbox' uses test credentials; 'production' uses real money
  mode: (process.env.MP_MODE ?? 'sandbox') as 'sandbox' | 'production',
}

export const PRICING = {
  title: 'ClaudeKit MP — Monthly Plan',
  price: 29,         // amount in the currency below
  currency: 'USD',   // change to 'ARS', 'BRL', 'CLP', etc. for local currency
  trialDays: 14,
}

export const isMPConfigured = !!MP_CONFIG.accessToken

/** Returns an authenticated MercadoPagoConfig instance */
export function getMPClient() {
  return new MercadoPagoConfig({ accessToken: MP_CONFIG.accessToken })
}

/**
 * Create a one-time payment Preference.
 * The user is redirected to init_point; after payment MP fires a webhook.
 *
 * @param organizationId  Used as external_reference so the webhook can find the org
 * @param userEmail       Pre-fills the buyer email on the MP checkout page
 * @param successUrl      Where MP redirects after a successful payment
 * @param failureUrl      Where MP redirects after a failed payment
 */
export async function createPreference(opts: {
  organizationId: string
  userEmail: string
  successUrl: string
  failureUrl: string
  pendingUrl: string
}) {
  const client = getMPClient()
  const preference = new Preference(client)

  const result = await preference.create({
    body: {
      items: [
        {
          id: 'plan-monthly',
          title: PRICING.title,
          quantity: 1,
          unit_price: PRICING.price,
          currency_id: PRICING.currency,
        },
      ],
      payer: { email: opts.userEmail },
      external_reference: opts.organizationId,
      back_urls: {
        success: opts.successUrl,
        failure: opts.failureUrl,
        pending: opts.pendingUrl,
      },
      auto_return: 'approved',
      // Webhook notifications are configured in the MP dashboard or via
      // notification_url below (overrides dashboard setting for this preference)
      // notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    },
  })

  return {
    preferenceId: result.id!,
    initPoint: result.init_point!,
    sandboxInitPoint: result.sandbox_init_point!,
  }
}

/**
 * Fetch a payment by ID to verify its status server-side.
 * Always verify on the server — never trust the query params MP appends to back_urls.
 */
export async function getPayment(paymentId: string | number) {
  const client = getMPClient()
  const payment = new Payment(client)
  return payment.get({ id: Number(paymentId) })
}

/**
 * Create a recurring preapproval (subscription).
 * Use this when you want automatic monthly charges instead of one-time preferences.
 * Requires the payer to complete the flow at preapproval_url.
 */
export async function createPreapproval(opts: {
  organizationId: string
  userEmail: string
  backUrl: string
}) {
  const client = getMPClient()
  const preapproval = new PreApproval(client)

  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

  const result = await preapproval.create({
    body: {
      reason: PRICING.title,
      payer_email: opts.userEmail,
      external_reference: opts.organizationId,
      back_url: opts.backUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: PRICING.price,
        currency_id: PRICING.currency,
        start_date: now.toISOString(),
        end_date: new Date(now.getFullYear() + 10, now.getMonth(), now.getDate()).toISOString(),
      },
      // Free trial: charge starts after trialDays
      free_trial: {
        frequency: PRICING.trialDays,
        frequency_type: 'days',
      },
    } as any,
  })

  return {
    preapprovalId: result.id!,
    preapprovalUrl: (result as any).init_point as string,
    status: result.status,
  }
}
