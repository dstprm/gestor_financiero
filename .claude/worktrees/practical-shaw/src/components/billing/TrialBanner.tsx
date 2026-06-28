import { getOrgSubscriptionStatus } from '@/lib/subscription'
import Link from 'next/link'

export default async function TrialBanner({ organizationId }: { organizationId: string }) {
  if (!organizationId) return null

  const { status, daysLeftInTrial } = await getOrgSubscriptionStatus(organizationId)

  if (status === 'unconfigured' || status === 'active') return null

  if (status === 'trialing' && daysLeftInTrial !== null && daysLeftInTrial > 0) {
    return (
      <div className="w-full bg-yellow-400 text-yellow-900 text-sm px-4 py-2 flex items-center justify-between">
        <span>
          <strong>{daysLeftInTrial} day{daysLeftInTrial !== 1 ? 's' : ''} left</strong> in your free trial.
        </span>
        <Link href="/billing" className="ml-4 font-semibold underline underline-offset-2 hover:opacity-80">
          Upgrade now →
        </Link>
      </div>
    )
  }

  if (status === 'cancelled' || status === 'past_due' || (status === 'trialing' && daysLeftInTrial === 0)) {
    return (
      <div className="w-full bg-red-600 text-white text-sm px-4 py-2 flex items-center justify-between">
        <span>Your trial has ended. Upgrade to continue using SimplyOrg.</span>
        <Link href="/billing" className="ml-4 font-semibold underline underline-offset-2 hover:opacity-80">
          Upgrade now →
        </Link>
      </div>
    )
  }

  return null
}
