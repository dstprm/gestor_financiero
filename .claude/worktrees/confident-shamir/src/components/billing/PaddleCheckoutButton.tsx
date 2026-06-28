'use client'
import { useState } from 'react'
import { isPaddleConfigured } from '@/lib/paddle'
import { usePaddle } from './PaddleProvider'
import { toast } from 'sonner'

interface Props {
  organizationId: string
  userEmail: string
  seatCount?: number
}

export function PaddleCheckoutButton({ organizationId, userEmail, seatCount = 1 }: Props) {
  const [loading, setLoading] = useState(false)
  const paddle = usePaddle()

  if (!isPaddleConfigured) {
    return <p className="text-center text-sm text-gray-400 py-4">Payment processing not yet configured.</p>
  }

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, email: userEmail, quantity: seatCount }),
      })
      if (!res.ok) {
        toast.error('Checkout failed. Please try again.')
        return
      }
      const { transactionId, checkoutUrl } = await res.json()
      if (paddle && transactionId) {
        paddle.Checkout.open({
          transactionId,
          settings: { successUrl: `${window.location.origin}/app` },
        })
      } else if (checkoutUrl) {
        // Append success_url so Paddle hosted checkout redirects back after payment
        const url = new URL(checkoutUrl)
        url.searchParams.set('success_url', `${window.location.origin}/app`)
        window.location.href = url.toString()
      } else {
        toast.error('Checkout failed. Please try again.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
    >
      {loading ? 'Redirecting to checkout…' : 'Add payment method'}
    </button>
  )
}
