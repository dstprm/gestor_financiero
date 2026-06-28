'use client'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  organizationId: string
  userEmail: string
}

export function MercadoPagoCheckoutButton({ organizationId, userEmail }: Props) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, email: userEmail }),
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}))
        if (error === 'Not configured') {
          toast.error('Payment processing not yet configured.')
        } else {
          toast.error('Checkout failed. Please try again.')
        }
        return
      }

      const { checkoutUrl } = await res.json()
      if (checkoutUrl) {
        window.location.href = checkoutUrl
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
      className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
    >
      {loading ? (
        'Redirecting to Mercado Pago…'
      ) : (
        <>
          {/* MP brand colour strip */}
          <span className="text-yellow-300 font-bold">MP</span>
          Pay with Mercado Pago
        </>
      )}
    </button>
  )
}
