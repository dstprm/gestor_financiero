'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { useOrgStore } from '@/store/orgStore'
import { SyncIndicator } from '@/components/chart/SyncIndicator'

const ENV_ORG_ID = process.env.NEXT_PUBLIC_ORG_ID

export default function AppPage() {
  const { loadFromDB, loadFromLocalStorage } = useOrgStore()
  const [dataReady, setDataReady] = useState(false)
  const [orgName, setOrgName] = useState<string | null>(null)

  useEffect(() => {
    // URL param takes precedence (e.g. /app?orgId=xxx from org list)
    const urlOrgId = new URLSearchParams(window.location.search).get('orgId')
    const fixedOrgId = ENV_ORG_ID ?? urlOrgId

    if (fixedOrgId) {
      loadFromDB(fixedOrgId).then(() => setDataReady(true))
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

    fetch('/api/org/mine')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { organizationId: string; orgName?: string; currentUserRole?: string } | null) => {
        if (data?.organizationId) {
          if (data.orgName) setOrgName(data.orgName)
          useOrgStore.getState().setCurrentUserRole(data.currentUserRole ?? null)
          return loadFromDB(data.organizationId)
        } else {
          loadFromLocalStorage()
        }
      })
      .then(() => setDataReady(true))
      .catch(() => { setDataReady(true) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative w-full h-full">
      <AppShell dataReady={dataReady} orgName={orgName} />
      <SyncIndicator />
    </div>
  )
}
