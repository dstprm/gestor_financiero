'use client'

import { useEffect } from 'react'
import { useOrgStore } from '@/store/orgStore'

export function SyncIndicator() {
  const syncStatus = useOrgStore((s) => s.syncStatus)
  const organizationId = useOrgStore((s) => s.organizationId)
  const lastSaveError = useOrgStore((s) => s.lastSaveError)

  useEffect(() => {
    if (syncStatus !== 'saved') return
    const t = setTimeout(() => {
      useOrgStore.setState({ syncStatus: 'idle' })
    }, 2000)
    return () => clearTimeout(t)
  }, [syncStatus])

  if (!organizationId) return null
  if (syncStatus === 'idle') return null

  return (
    <div className="absolute bottom-4 right-4 z-50 pointer-events-none flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] bg-white/90 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700 backdrop-blur-sm select-none max-w-xs">
      {syncStatus === 'saving' && (
        <>
          <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-300 dark:border-slate-400 border-t-transparent animate-spin shrink-0" />
          <span className="text-gray-600 dark:text-slate-400">Saving…</span>
        </>
      )}
      {syncStatus === 'saved' && (
        <>
          <span className="text-emerald-400 shrink-0">✓</span>
          <span className="text-emerald-400">Saved</span>
        </>
      )}
      {syncStatus === 'error' && (
        <>
          <span className="text-red-400 shrink-0">⚠</span>
          <span className="text-red-400 truncate">
            Save failed{lastSaveError ? `: ${lastSaveError}` : ''}
          </span>
        </>
      )}
    </div>
  )
}
