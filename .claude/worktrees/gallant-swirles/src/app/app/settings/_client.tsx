'use client'

import { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, ExternalLink, LogOut } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Tab = 'organization' | 'profile'

interface OrgEntry {
  id: string
  name: string
  role: string
  membershipId: string
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'organization', label: 'My Organizations' },
  { id: 'profile', label: 'Profile' },
]

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-600/20 dark:text-purple-300 dark:border-purple-600/40',
  ADMIN: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-600/40',
  EDITOR: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-600/20 dark:text-emerald-300 dark:border-emerald-600/40',
  VIEWER: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600',
}

export default function SettingsPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const searchParams = useSearchParams()
  const router = useRouter()

  const rawTab = searchParams.get('tab') as Tab | null
  const activeTab: Tab = TABS.some((t) => t.id === rawTab) ? (rawTab as Tab) : 'profile'

  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgs, setOrgs] = useState<OrgEntry[]>([])

  useEffect(() => {
    const urlOrgId = new URLSearchParams(window.location.search).get('orgId')
    if (urlOrgId) setOrgId(urlOrgId)
    fetch('/api/org/mine')
      .then((r) => r.ok ? r.json() : null)
      .then((d: { organizationId?: string; orgs?: OrgEntry[] } | null) => {
        if (!urlOrgId && d?.organizationId) setOrgId(d.organizationId)
        if (d?.orgs) setOrgs(d.orgs)
      })
      .catch(() => {})
  }, [])

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Leave org
  const [confirmLeaveOrgId, setConfirmLeaveOrgId] = useState<string | null>(null)
  const [leavingOrgId, setLeavingOrgId] = useState<string | null>(null)

  async function handleLeaveOrg(membershipId: string, orgEntryId: string) {
    setLeavingOrgId(orgEntryId)
    try {
      const res = await fetch(`/api/members/${membershipId}`, { method: 'DELETE' })
      if (res.ok) {
        setOrgs((prev) => prev.filter((o) => o.id !== orgEntryId))
        setConfirmLeaveOrgId(null)
        showToast('Left organization')
        if (orgEntryId === orgId) {
          const remaining = orgs.filter((o) => o.id !== orgEntryId)
          if (remaining.length > 0) {
            router.replace(`/app?orgId=${remaining[0].id}`)
          } else {
            router.replace('/app/orgs')
          }
        }
      } else {
        showToast('Failed to leave organization')
      }
    } catch {
      showToast('Something went wrong')
    } finally {
      setLeavingOrgId(null)
    }
  }

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

  function setTab(tab: Tab) {
    router.replace(`/app/settings?tab=${tab}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10 px-4">
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
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-300 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Org Chart
        </Link>

        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Profile</h1>
          <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">
            {user?.primaryEmailAddress?.emailAddress ?? 'Your account'}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-8 overflow-x-auto border-b border-gray-200 dark:border-slate-800 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* My Organizations tab */}
        {activeTab === 'organization' && (
          <div className="space-y-4">
            {orgs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 text-center">
                <p className="text-gray-400 dark:text-slate-500 text-sm">No organizations found.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {orgs.map((org) => {
                  const isOwner = org.role === 'OWNER'
                  const isPrimary = org.id === orgId
                  return (
                    <li
                      key={org.id}
                      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                            {org.name}
                          </p>
                          {isPrimary && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700/50 rounded font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', ROLE_COLORS[org.role] ?? ROLE_COLORS.VIEWER)}>
                          {org.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isPrimary && (
                          <Link
                            href="/app/org"
                            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                          >
                            Org settings
                            <ExternalLink size={11} />
                          </Link>
                        )}
                        <Link
                          href={`/app?orgId=${org.id}`}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          Open
                        </Link>
                        {!isOwner && (
                          confirmLeaveOrgId === org.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setConfirmLeaveOrgId(null)}
                                className="px-2 py-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-700 rounded"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => void handleLeaveOrg(org.membershipId, org.id)}
                                disabled={leavingOrgId === org.id}
                                className="px-2 py-1 text-xs bg-red-50 dark:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-600/40 rounded disabled:opacity-40 flex items-center gap-1"
                              >
                                <LogOut size={11} />
                                {leavingOrgId === org.id ? 'Leaving…' : 'Leave'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmLeaveOrgId(org.id)}
                              className="p-1.5 text-gray-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded transition-colors"
                              title="Leave organization"
                            >
                              <LogOut size={14} />
                            </button>
                          )
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Email</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm">
                {user?.primaryEmailAddress?.emailAddress ?? '—'}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Display name</h2>
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
                    className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-slate-200 text-sm focus:outline-none focus:border-blue-500"
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
                    className="px-3 py-1.5 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—'}
                  </p>
                  <button
                    onClick={startEditProfile}
                    className="p-1 rounded text-gray-400 dark:text-slate-600 hover:text-gray-700 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit display name"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Account</h2>
              <button
                onClick={() => void signOut({ redirectUrl: '/' })}
                className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
