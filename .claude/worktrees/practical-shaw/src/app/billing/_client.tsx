'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { PRICING, isPaddleConfigured } from '@/lib/paddle'
import { PaddleCheckoutButton } from '@/components/billing/PaddleCheckoutButton'
import type { SubStatus } from '@/lib/subscription'

interface SubInfo {
  status: SubStatus
  daysLeftInTrial: number | null
  isAccessAllowed: boolean
}

const STATUS_LABELS: Record<SubStatus, string> = {
  trialing: 'Free Trial',
  active: 'Active',
  past_due: 'Past Due',
  cancelled: 'Cancelled',
  paused: 'Paused',
  unconfigured: 'No subscription',
}

const STATUS_COLORS: Record<SubStatus, string> = {
  trialing: 'bg-blue-600/20 text-blue-300 border-blue-600/40',
  active: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40',
  past_due: 'bg-orange-600/20 text-orange-300 border-orange-600/40',
  cancelled: 'bg-red-600/20 text-red-300 border-red-600/40',
  paused: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/40',
  unconfigured: 'bg-slate-700 text-slate-400 border-slate-600',
}

export default function BillingPage() {
  const { user } = useUser()
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? ''

  const [subInfo, setSubInfo] = useState<SubInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/org/mine')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setOrganizationId(data.organizationId ?? null)
        }
      })
      .catch(() => {})
  }, [])

  function fetchSubscription() {
    if (!organizationId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    fetch(`/api/subscription?organizationId=${encodeURIComponent(organizationId)}`)
      .then(async (res) => {
        if (res.ok) setSubInfo(await res.json())
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (organizationId !== null) fetchSubscription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  const status = subInfo?.status ?? 'unconfigured'
  const showUpgrade = status === 'trialing' || status === 'cancelled' || status === 'unconfigured'
  const showManage = status === 'active' || status === 'past_due' || status === 'paused'

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing</h1>
        <p className="text-gray-500 mb-8">Manage your SimplyOrg subscription.</p>

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-7 w-32 bg-gray-200 rounded" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-8 w-20 bg-gray-200 rounded ml-auto" />
                <div className="h-3 w-28 bg-gray-200 rounded ml-auto" />
              </div>
            </div>
            <div className="h-6 w-24 bg-gray-200 rounded-full" />
            <div className="border-t border-gray-100 pt-4">
              <div className="h-10 w-full bg-gray-200 rounded-xl" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
            <p className="text-gray-600 text-sm">Unable to load billing information. Please try again.</p>
            <button
              onClick={fetchSubscription}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
          {/* Plan header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Current plan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">Per Seat</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">${PRICING.pricePerSeat}</p>
              <p className="text-sm text-gray-500">per seat / month</p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-3">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              {status === 'trialing' && subInfo?.daysLeftInTrial !== null && (
                <span className="text-sm text-gray-500">
                  {subInfo!.daysLeftInTrial === 0
                    ? 'Trial expires today'
                    : `${subInfo!.daysLeftInTrial} day${subInfo!.daysLeftInTrial === 1 ? '' : 's'} left in trial`}
                </span>
              )}
            </div>

          {/* Trial info */}
          {(status === 'unconfigured' || status === 'trialing') && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
                <span>✓</span>
                <span>{PRICING.trialDays}-day free trial — no credit card required to start</span>
              </div>
            </div>
          )}

          {/* Manage subscription */}
          {showManage && (
            <div className="border-t border-gray-100 pt-4">
              {isPaddleConfigured ? (
                <button
                  onClick={async () => {
                    const res = await fetch('/api/billing/portal')
                    if (res.ok) {
                      const { url } = await res.json()
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }
                  }}
                  className="block w-full text-center px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Manage subscription →
                </button>
              ) : (
                <p className="text-sm text-gray-400 text-center">
                  Connect Paddle to manage your subscription.
                </p>
              )}
            </div>
          )}

          {/* Upgrade */}
          {showUpgrade && (
            <div className="border-t border-gray-100 pt-4">
              <PaddleCheckoutButton organizationId={organizationId ?? ''} userEmail={userEmail} />
            </div>
          )}

          {/* Invoice history */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Invoice history</p>
            <p className="text-sm text-gray-400">
              {isPaddleConfigured
                ? 'View invoices in the Paddle customer portal.'
                : 'Connect Paddle to view invoices.'}
            </p>
          </div>
        </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Payments by{' '}
          <a href="https://paddle.com" className="underline" target="_blank" rel="noopener noreferrer">
            Paddle
          </a>
          {' · '}
          <a href="/terms" className="underline">Terms</a>
          {' · '}
          <a href="/privacy" className="underline">Privacy</a>
        </p>
      </div>
    </div>
  )
}
