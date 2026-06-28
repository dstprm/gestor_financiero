import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import { PaddleCheckoutButton } from '@/components/billing/PaddleCheckoutButton'
import { getOrgSubscriptionStatus } from '@/lib/subscription'

export default async function UpgradePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let orgId = ''
  let orgName = ''
  let userEmail = ''

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import('@/lib/db')
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          email: true,
          organizations: {
            orderBy: { joinedAt: 'desc' },
            take: 1,
            select: {
              organization: { select: { id: true, name: true } },
            },
          },
        },
      })
      if (user) {
        userEmail = user.email
        const membership = user.organizations[0]
        if (membership) {
          orgId = membership.organization.id
          orgName = membership.organization.name
          // If access is still valid, send them back to the app
          const { isAccessAllowed } = await getOrgSubscriptionStatus(orgId)
          if (isAccessAllowed) redirect('/app')
        }
      }
    } catch {
      // ignore — show upgrade page anyway
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-800/50 flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-xl font-bold text-slate-100 mb-1">
            Your trial has ended
          </h1>
          {orgName && (
            <p className="text-sm text-slate-400 mb-6">
              {orgName}
            </p>
          )}
          {!orgName && (
            <p className="text-sm text-slate-400 mb-6">
              Your free trial period has expired.
            </p>
          )}

          {/* Pricing */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-100">$50</span>
              <span className="text-slate-400 text-sm">/month</span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Full access to SimplyOrg — unlimited employees, org charts, and team members.
            </p>
          </div>

          {/* CTA */}
          {orgId && userEmail ? (
            <PaddleCheckoutButton
              organizationId={orgId}
              userEmail={userEmail}
            />
          ) : (
            <p className="text-center text-sm text-slate-500 py-3">
              Unable to load billing details. Please refresh.
            </p>
          )}

          {/* Sign out */}
          <div className="mt-4 text-center">
            <SignOutButton redirectUrl="/sign-in">
              <button className="text-sm text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  )
}
