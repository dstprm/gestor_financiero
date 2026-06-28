export const PADDLE_CONFIG = {
  clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? '',
  environment: (process.env.PADDLE_ENVIRONMENT ?? 'sandbox') as 'sandbox' | 'production',
  priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID ?? '',
}

export const isPaddleConfigured = !!PADDLE_CONFIG.clientToken && !!PADDLE_CONFIG.priceId
