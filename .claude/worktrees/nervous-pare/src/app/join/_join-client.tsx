'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function JoinClient({ token }: { token: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function accept() {
      try {
        const res = await fetch('/api/invites/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (cancelled) return

        if (res.ok) {
          router.replace('/app')
        } else {
          const data = await res.json()
          if (data.error === 'email_mismatch') {
            setError(
              'This invitation was sent to a different email address. Please sign in with the correct account.'
            )
          } else if (data.error === 'expired') {
            setError('This invitation link has expired. Please ask for a new invite.')
          } else if (data.error === 'already_accepted') {
            // Already a member, just redirect
            router.replace('/app')
          } else {
            setError(data.message ?? 'Something went wrong. Please try again.')
          }
        }
      } catch {
        if (!cancelled) setError('Something went wrong. Please try again.')
      }
    }

    accept()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Unable to join</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <a
            href="/sign-in"
            className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Sign in with a different account
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Joining organization…</p>
      </div>
    </div>
  )
}
