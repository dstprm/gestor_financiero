export const PADDLE_CONFIG = {
  // Set these in .env.local when ready
  clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? '',
  environment: (process.env.PADDLE_ENVIRONMENT ?? 'sandbox') as 'sandbox' | 'production',
  priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID ?? '',
}

export const PRICING = {
  pricePerSeat: 100, // USD per seat per month
  trialDays: 5,
  currency: 'USD',
}

export const isPaddleConfigured = !!PADDLE_CONFIG.clientToken && !!PADDLE_CONFIG.priceId
