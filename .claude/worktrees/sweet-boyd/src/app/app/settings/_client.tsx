'use client'

import { useEffect, useState, useCallback } from 'react'
import { useOrganization, useUser } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { Clock, Loader2, Link2, Trash2, Copy, Check, Plus, X, ArrowLeft, Pencil, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type SubStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused' | 'unconfigured'

const SUB_STATUS_LABELS: Record<SubStatus, string> = {
  trialing: 'Free Trial',
  active: 'Active',
  past_due: 'Past Due',
  cancelled: 'Cancelled',
  paused: 'Paused',
  unconfigured: 'No subscription',
}

const SUB_STATUS_COLORS: Record<SubStatus, string> = {
  trialing: 'bg-blue-950/40 text-blue-300 border-blue-700/50',
  active: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50',
  past_due: 'bg-orange-950/40 text-orange-300 border-orange-700/50',
  cancelled: 'bg-red-950/40 text-red-300 border-red-700/50',
  paused: 'bg-yellow-950/40 text-yellow-300 border-yellow-700/50',
  unconfigured: 'bg-slate-800 text-slate-400 border-slate-600',
}

type Tab = 'organization' | 'profile' | 'members' | 'activity' | 'sharing' | 'danger'

interface AuditLog {
  id: string
  userId: string
  userDisplayName: string
  action: string
  entityType: string
  entityId: string | null
  entityName: string | null
  changes: Record<string, { from: unknown; to: unknown }> | null
  createdAt: string
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

function describeAction(log: AuditLog): string {
  const who = log.userDisplayName
  const what = log.entityName ?? log.entityId ?? ''
  switch (log.action) {
    case 'employee.created':
      return `${who} added ${what}`
    case 'employee.updated':
      return `${who} updated ${what}`
    case 'employee.deleted':
      return `${who} removed ${what}`
    case 'member.invited':
      return `${who} invited ${what}`
    case 'member.joined':
      return `${what} joined the org`
    case 'employee.bulk_imported': {
      const count =
        log.changes && 'count' in log.changes
          ? (log.changes as unknown as { count: number }).count
          : '?'
      return `${who} imported ${count} employees`
    }
    default:
      return `${who} — ${log.action}`
  }
}

function ActivityTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)

  const fetchLogs = useCallback(async (cursor?: string) => {
    const url = cursor ? `/api/audit?before=${encodeURIComponent(cursor)}` : '/api/audit'
    const res = await fetch(url)
    if (!res.ok) throw new Error('fetch failed')
    return res.json() as Promise<{ logs: AuditLog[]; nextCursor: string | null }>
  }, [])

  useEffect(() => {
    fetchLogs()
      .then(({ logs: l, nextCursor: c }) => {
        setLogs(l)
        setNextCursor(c)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [fetchLogs])

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const { logs: more, nextCursor: c } = await fetchLogs(nextCursor)
      setLogs((prev) => [...prev, ...more])
      setNextCursor(c)
    } catch {
      // ignore
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-slate-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-10 text-center text-slate-500 text-sm">
        Failed to load activity. Make sure the database is configured.
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="py-10 text-center">
        <Clock size={28} className="mx-auto mb-3 text-slate-700" />
        <p className="text-slate-500 text-sm">No activity yet</p>
      </div>
    )
  }

  return (
    <div>
      <ul className="space-y-px">
        {logs.map((log) => (
          <li
            key={log.id}
            className="flex items-start gap-3 py-3 border-b border-slate-800 last:border-0"
          >
            <div className="mt-0.5 w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-xs font-medium text-slate-400">
              {log.userDisplayName[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200">{describeAction(log)}</p>
            </div>
            <span className="text-xs text-slate-600 shrink-0 pt-0.5">{formatRelative(log.createdAt)}</span>
          </li>
        ))}
      </ul>

      {nextCursor && (
        <div className="pt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

interface ShareLink {
  id: string
  token: string
  label: string | null
  enabled: boolean
  createdAt: string
  expiresAt: string | null
}

const BASE_URL = 'https://simplyorg.vercel.app'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      title="Copy link"
      className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  )
}

function SharingTab() {
  const [links, setLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newExpiry, setNewExpiry] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchLinks = useCallback(async () => {
    const res = await fetch('/api/org/share-links')
    if (!res.ok) throw new Error('fetch failed')
    const data = await res.json() as { links: ShareLink[] }
    return data.links
  }, [])

  useEffect(() => {
    fetchLinks()
      .then(setLinks)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [fetchLinks])

  async function createLink() {
    setCreating(true)
    try {
      const res = await fetch('/api/org/share-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newLabel.trim() || null,
          expiresAt: newExpiry || null,
        }),
      })
      if (!res.ok) throw new Error('create failed')
      const link = await res.json() as ShareLink
      setLinks((prev) => [link, ...prev])
      setShowDialog(false)
      setNewLabel('')
      setNewExpiry('')
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  async function deleteLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id))
    await fetch(`/api/org/share-links?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  async function toggleLink(id: string, enabled: boolean) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, enabled } : l)))
    await fetch(`/api/org/share-links?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-slate-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-10 text-center text-slate-500 text-sm">
        Failed to load share links. Make sure the database is configured.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Anyone with a share link can view your org chart without signing in.
        </p>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors"
        >
          <Plus size={14} />
          New share link
        </button>
      </div>

      {/* Create dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-96 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">New share link</h3>
              <button onClick={() => setShowDialog(false)} className="text-slate-500 hover:text-slate-300">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Label (optional)</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Board presentation"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Expiry date (optional)</label>
                <input
                  type="date"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createLink}
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link list */}
      {links.length === 0 ? (
        <div className="py-10 text-center">
          <Link2 size={28} className="mx-auto mb-3 text-slate-700" />
          <p className="text-slate-500 text-sm">No share links yet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {links.map((link) => {
            const url = `${BASE_URL}/share/${link.token}`
            const expired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false
            return (
              <li
                key={link.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {link.label ?? 'Untitled link'}
                    </span>
                    {expired && (
                      <span className="text-xs px-1.5 py-0.5 bg-red-950/40 text-red-400 rounded">
                        Expired
                      </span>
                    )}
                    {!link.enabled && !expired && (
                      <span className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-600 font-mono truncate max-w-[260px]">
                      {url}
                    </span>
                    <CopyButton text={url} />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Created {new Date(link.createdAt).toLocaleDateString()}
                    {link.expiresAt && ` · Expires ${new Date(link.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleLink(link.id, !link.enabled)}
                    className={cn(
                      'relative w-9 h-5 rounded-full transition-colors focus:outline-none',
                      link.enabled ? 'bg-blue-600' : 'bg-slate-700'
                    )}
                    title={link.enabled ? 'Disable' : 'Enable'}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                        link.enabled ? 'translate-x-4' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'organization', label: 'Organization' },
  { id: 'profile', label: 'Profile' },
  { id: 'members', label: 'Members' },
  { id: 'activity', label: 'Activity' },
  { id: 'sharing', label: 'Sharing' },
  { id: 'danger', label: 'Danger Zone' },
]

export default function SettingsPage() {
  const { organization: clerkOrg } = useOrganization()
  const { user } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()

  const rawTab = searchParams.get('tab') as Tab | null
  const activeTab: Tab = TABS.some((t) => t.id === rawTab) ? (rawTab as Tab) : 'organization'

  // Fetch the Prisma org ID and name
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string | null>(null)

  useEffect(() => {
    // Try URL param first (set when navigating from /app?orgId=...)
    const urlOrgId = new URLSearchParams(window.location.search).get('orgId')
    if (urlOrgId) {
      setOrgId(urlOrgId)
      fetch(`/api/org?organizationId=${encodeURIComponent(urlOrgId)}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d: { name?: string } | null) => { if (d?.name) setOrgName(d.name) })
        .catch(() => {})
      return
    }
    fetch('/api/org/mine')
      .then((r) => r.ok ? r.json() : null)
      .then((d: { organizationId?: string; orgName?: string } | null) => {
        if (d?.organizationId) setOrgId(d.organizationId)
        if (d?.orgName) setOrgName(d.orgName)
      })
      .catch(() => {})
  }, [])

  const displayName = orgName ?? clerkOrg?.name ?? null

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Org name editing
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)

  function startEditName() {
    setNameInput(displayName ?? '')
    setEditingName(true)
  }

  async function saveName() {
    if (!orgId || !nameInput.trim()) return
    setSavingName(true)
    try {
      const res = await fetch(`/api/org/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      if (!res.ok) throw new Error('save failed')
      const data = await res.json() as { name: string }
      setOrgName(data.name)
      setEditingName(false)
      showToast('Organization renamed')
    } catch {
      // ignore
    } finally {
      setSavingName(false)
    }
  }

  // Subscription info (for profile tab)
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null)
  const [daysLeftInTrial, setDaysLeftInTrial] = useState<number | null>(null)

  useEffect(() => {
    if (!orgId) return
    fetch(`/api/subscription?organizationId=${encodeURIComponent(orgId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: { status?: SubStatus; daysLeftInTrial?: number | null } | null) => {
        if (d?.status) setSubStatus(d.status)
        if (d?.daysLeftInTrial !== undefined) setDaysLeftInTrial(d.daysLeftInTrial ?? null)
      })
      .catch(() => {})
  }, [orgId])

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false)
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  function startEditProfile() {
    const current = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    setDisplayNameInput(current)
    setEditingProfile(true)
  }

  async function saveProfile() {
    if (!user || !displayNameInput.trim()) return
    setSavingProfile(true)
    try {
      const parts = displayNameInput.trim().split(/\s+/)
      const firstName = parts[0] ?? ''
      const lastName = parts.slice(1).join(' ')
      await user.update({ firstName, lastName })
      setEditingProfile(false)
      showToast('Profile updated')
    } catch {
      // ignore
    } finally {
      setSavingProfile(false)
    }
  }

  // Danger zone - delete org
  const [confirmDeleteText, setConfirmDeleteText] = useState('')
  const [deletingOrg, setDeletingOrg] = useState(false)

  async function deleteOrg() {
    if (!orgId || confirmDeleteText !== displayName) return
    setDeletingOrg(true)
    try {
      const res = await fetch(`/api/org/${orgId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      router.replace('/?deleted=1')
    } catch {
      setDeletingOrg(false)
    }
  }

  function setTab(tab: Tab) {
    router.replace(`/app/settings?tab=${tab}`)
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-900/90 border border-green-700 text-green-200 text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Back nav */}
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Org Chart
        </Link>

        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-100">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            {displayName ?? 'Your organization'}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-8 overflow-x-auto border-b border-slate-800 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'organization' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Organization name</h2>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void saveName()
                      if (e.key === 'Escape') setEditingName(false)
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => void saveName()}
                    disabled={savingName || !nameInput.trim()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {savingName ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="px-3 py-1.5 border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <p className="text-slate-300 text-sm">{displayName ?? '—'}</p>
                  <button
                    onClick={startEditName}
                    className="p-1 rounded text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Rename"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-1">Email</h2>
              <p className="text-slate-400 text-sm">
                {user?.primaryEmailAddress?.emailAddress ?? '—'}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Display name</h2>
              {editingProfile ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void saveProfile()
                      if (e.key === 'Escape') setEditingProfile(false)
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => void saveProfile()}
                    disabled={savingProfile || !displayNameInput.trim()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {savingProfile ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="px-3 py-1.5 border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <p className="text-slate-300 text-sm">
                    {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—'}
                  </p>
                  <button
                    onClick={startEditProfile}
                    className="p-1 rounded text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit display name"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-300">Subscription</h2>
                <CreditCard size={14} className="text-slate-500" />
              </div>
              {subStatus ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', SUB_STATUS_COLORS[subStatus])}>
                      {SUB_STATUS_LABELS[subStatus]}
                    </span>
                    {subStatus === 'trialing' && daysLeftInTrial !== null && (
                      <span className="text-xs text-slate-500">
                        {daysLeftInTrial === 0 ? 'Expires today' : `${daysLeftInTrial} day${daysLeftInTrial === 1 ? '' : 's'} left`}
                      </span>
                    )}
                  </div>
                  <a
                    href="/billing"
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Manage billing →
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">—</span>
                  <a href="/billing" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    Manage billing →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
            <p className="text-slate-400 text-sm">
              Manage members on the{' '}
              <a href="/app/members" className="text-blue-400 hover:underline">
                Members page
              </a>
              .
            </p>
          </div>
        )}

        {activeTab === 'activity' && <ActivityTab />}

        {activeTab === 'sharing' && <SharingTab />}

        {activeTab === 'danger' && (
          <div className="space-y-4">
            <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-red-400 mb-1">Delete organization</h2>
              <p className="text-slate-400 text-sm mb-4">
                This will permanently delete{' '}
                <span className="font-medium text-slate-300">{displayName ?? 'this organization'}</span>
                , all employees, and all data. This cannot be undone.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Type <span className="font-mono text-slate-400">{displayName}</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmDeleteText}
                    onChange={(e) => setConfirmDeleteText(e.target.value)}
                    placeholder={displayName ?? ''}
                    className="w-full px-3 py-2 bg-slate-900 border border-red-900/50 rounded-lg text-slate-200 text-sm placeholder-slate-700 focus:outline-none focus:border-red-500"
                  />
                </div>
                <button
                  onClick={() => void deleteOrg()}
                  disabled={deletingOrg || confirmDeleteText !== displayName || !orgId}
                  className="px-4 py-2 rounded-lg border border-red-600 text-red-400 hover:bg-red-950/40 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deletingOrg ? 'Deleting…' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
