'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { useOrgStore } from '@/store/orgStore'
import { SyncIndicator } from '@/components/chart/SyncIndicator'

const ENV_ORG_ID = process.env.NEXT_PUBLIC_ORG_ID

export default function AppPage() {
  const { loadFromDB, loadFromLocalStorage } = useOrgStore()
  const [dataReady, setDataReady] = useState(false)
  const [orgName, setOrgName] = useState<string | null>(null)

  // useSearchParams keeps urlOrgId reactive: if the component stays mounted
  // but the user switches orgs (/app?orgId=A → /app?orgId=B), the effect
  // re-runs with the new id rather than showing stale data.
  const searchParams = useSearchParams()
  const urlOrgId = searchParams.get('orgId')
  // Use || not ?? so that an empty-string NEXT_PUBLIC_ORG_ID doesn't shadow urlOrgId
  const fixedOrgId = ENV_ORG_ID || urlOrgId

  useEffect(() => {
    // Reset loading state each time the target org changes
    setDataReady(false)
    setOrgName(null)

    if (fixedOrgId) {
      loadFromDB(fixedOrgId).then(() => {
        setDataReady(true)
      })
      // Fetch org name for display in the top bar
      if (!ENV_ORG_ID) {
        fetch(`/api/org?organizationId=${encodeURIComponent(fixedOrgId)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data: { name?: string } | null) => {
            if (data?.name) setOrgName(data.name)
          })
          .catch(() => {})
      }
      // Fetch current user's role for this org
      fetch(`/api/org/my-role?orgId=${encodeURIComponent(fixedOrgId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { role?: string } | null) => {
          useOrgStore.getState().setCurrentUserRole(data?.role ?? null)
        })
        .catch(() => {})
      return
    }

    // No orgId in URL — ask the API which org this user belongs to
    fetch('/api/org/mine')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { organizationId: string; orgName?: string; currentUserRole?: string } | null) => {
        if (data?.organizationId) {
          if (data.orgName) setOrgName(data.orgName)
          useOrgStore.getState().setCurrentUserRole(data.currentUserRole ?? null)
          return loadFromDB(data.organizationId)
        } else {
          // No org found (404 or no membership) — show empty/local state
          loadFromLocalStorage()
        }
      })
      .then(() => setDataReady(true))
      .catch(() => { setDataReady(true) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedOrgId])

  return (
    <div className="relative w-full h-full">
      <AppShell dataReady={dataReady} orgName={orgName} />
      <SyncIndicator />
    </div>
  )
}
