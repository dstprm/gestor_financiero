'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/AppShell'

export default function AppPage() {
  const [orgName, setOrgName] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const urlOrgId = searchParams.get('orgId')

  useEffect(() => {
    // Fetch org name for the top bar
    const fetchOrg = async (orgId: string) => {
      try {
        const res = await fetch(`/api/org?organizationId=${encodeURIComponent(orgId)}`)
        if (res.ok) {
          const data = await res.json() as { name?: string }
          if (data.name) setOrgName(data.name)
        }
      } catch { /* ignore */ }
    }

    if (urlOrgId) {
      void fetchOrg(urlOrgId)
      return
    }

    // No orgId in URL — find the user's org
    fetch('/api/org/mine')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { organizationId?: string; orgName?: string } | null) => {
        if (data?.orgName) setOrgName(data.orgName)
      })
      .catch(() => {})
  }, [urlOrgId])

  return (
    <AppShell orgName={orgName}>
      {/* Dashboard placeholder — replace with your app content */}
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
            A
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-3">
            Your app goes here
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mb-6">
            This is the authenticated dashboard. Replace this placeholder with your product&apos;s main feature.
          </p>
          <div className="grid grid-cols-1 gap-3 text-left">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Next steps</p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
                <li>• Add your data model to <code className="text-blue-600 dark:text-blue-400">prisma/schema.prisma</code></li>
                <li>• Build your pages under <code className="text-blue-600 dark:text-blue-400">src/app/app/</code></li>
                <li>• Add nav items in <code className="text-blue-600 dark:text-blue-400">src/components/AppShell.tsx</code></li>
                <li>• Configure your Paddle price ID in <code className="text-blue-600 dark:text-blue-400">.env.local</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
