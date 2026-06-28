'use client'

import { useEffect, useState } from 'react'
import { Users, UserPlus, Trash2, X, ChevronDown, Mail, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type MemberRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'

interface Member {
  id: string
  role: MemberRole
  joinedAt: string
  user: { id: string; name: string | null; email: string; avatarUrl: string | null }
}

interface Invite {
  id: string
  email: string
  role: string
  createdAt: string
  expiresAt: string
}

const ROLE_COLORS: Record<MemberRole, string> = {
  OWNER: 'bg-purple-600/20 text-purple-300 border-purple-600/40',
  ADMIN: 'bg-blue-600/20 text-blue-300 border-blue-600/40',
  EDITOR: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40',
  VIEWER: 'bg-slate-700 text-slate-400 border-slate-600',
}

const ROLES: MemberRole[] = ['ADMIN', 'EDITOR', 'VIEWER']

export default function MembersPage() {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [dbUnavailable, setDbUnavailable] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>('VIEWER')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null)
  const [cancelingInviteId, setCancelingInviteId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [confirmCancelInviteId, setConfirmCancelInviteId] = useState<string | null>(null)
  const [inviteSentTo, setInviteSentTo] = useState<string | null>(null)

  const isAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

  async function loadData() {
    try {
      const [orgRes, membersRes] = await Promise.all([
        fetch('/api/org/mine'),
        fetch('/api/members'),
      ])
      if (orgRes.status === 503 || membersRes.status === 503) {
        setDbUnavailable(true)
        return
      }
      if (orgRes.ok) {
        const orgData = await orgRes.json()
        setCurrentUserRole(orgData.currentUserRole ?? null)
      }
      if (membersRes.ok) {
        const data = await membersRes.json()
        setMembers(data.members ?? [])
        setInvites(data.invites ?? [])
      }
    } catch {
      setDbUnavailable(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return
    setInviting(true)
    setInviteError('')
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data.message ?? data.error ?? 'Invite failed')
        return
      }
      const sentEmail = inviteEmail
      setInviteEmail('')
      setInviteSentTo(sentEmail)
      const membersRes = await fetch('/api/members')
      if (membersRes.ok) {
        const fresh = await membersRes.json()
        setMembers(fresh.members ?? [])
        setInvites(fresh.invites ?? [])
      }
      setTimeout(() => {
        setShowInvite(false)
        setInviteSentTo(null)
      }, 2000)
    } catch {
      setInviteError('Something went wrong')
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleChange(member: Member, newRole: MemberRole) {
    if (member.role === 'OWNER' || newRole === member.role) return
    setChangingRoleId(member.id)
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        const updated = await res.json()
        setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)))
      } else {
        toast.error('Failed to update role. Please try again.')
      }
    } catch {
      toast.error('Failed to update role. Please try again.')
    } finally {
      setChangingRoleId(null)
    }
  }

  async function handleRemove(member: Member) {
    if (member.role === 'OWNER') return
    setRemovingId(member.id)
    try {
      const res = await fetch(`/api/members/${member.id}`, { method: 'DELETE' })
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== member.id))
      } else {
        toast.error('Failed to remove member. Please try again.')
      }
    } catch {
      toast.error('Failed to remove member. Please try again.')
    } finally {
      setRemovingId(null)
      setConfirmRemoveId(null)
    }
  }

  async function handleCancelInvite(invite: Invite) {
    setCancelingInviteId(invite.id)
    try {
      await fetch(`/api/invites/${invite.id}`, { method: 'DELETE' })
      setInvites((prev) => prev.filter((i) => i.id !== invite.id))
    } finally {
      setCancelingInviteId(null)
      setConfirmCancelInviteId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back nav */}
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Org Chart
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Members</h1>
              <p className="text-sm text-slate-500">Manage who has access to your organization</p>
            </div>
          </div>
          {!dbUnavailable && isAdmin && (
            <button
              onClick={() => { setShowInvite(true); setInviteSentTo(null); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <UserPlus size={14} />
              Invite
            </button>
          )}
        </div>

        {/* DB not configured */}
        {dbUnavailable && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm">Member management requires database setup.</p>
            <p className="text-slate-500 text-xs mt-1">Configure <code className="bg-slate-700 px-1 rounded">DATABASE_URL</code> to enable this feature.</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Member list */}
        {!loading && !dbUnavailable && members.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
            {members.map((member, idx) => (
              <div
                key={member.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  idx !== members.length - 1 && 'border-b border-slate-800'
                )}
              >
                {member.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.user.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-medium shrink-0">
                    {(member.user.name ?? member.user.email)[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {member.user.name ?? member.user.email}
                  </p>
                  {member.user.name && (
                    <p className="text-xs text-slate-500 truncate">{member.user.email}</p>
                  )}
                </div>
                {isAdmin && member.role !== 'OWNER' ? (
                  <div className="relative">
                    <select
                      value={member.role}
                      disabled={changingRoleId === member.id}
                      onChange={(e) => handleRoleChange(member, e.target.value as MemberRole)}
                      className={cn(
                        'appearance-none text-xs px-2 py-0.5 rounded border font-medium pr-5 cursor-pointer bg-transparent transition-opacity',
                        ROLE_COLORS[member.role],
                        changingRoleId === member.id && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="bg-slate-900 text-slate-200">{r}</option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                  </div>
                ) : (
                  <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', ROLE_COLORS[member.role])}>
                    {member.role}
                  </span>
                )}
                {isAdmin && member.role !== 'OWNER' && (
                  confirmRemoveId === member.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-slate-400 hidden sm:inline">Remove?</span>
                      <button
                        onClick={() => setConfirmRemoveId(null)}
                        className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 rounded border border-slate-700 hover:border-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRemove(member)}
                        disabled={removingId === member.id}
                        className="px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded border border-red-600/40 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemoveId(member.id)}
                      disabled={removingId === member.id}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-40"
                      title="Remove member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !dbUnavailable && members.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center mb-6">
            <p className="text-slate-400 text-sm">No members yet.</p>
          </div>
        )}

        {/* Pending invites */}
        {!loading && !dbUnavailable && invites.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-1.5">
              <Clock size={13} />
              Pending Invites
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {invites.map((invite, idx) => (
                <div
                  key={invite.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    idx !== invites.length - 1 && 'border-b border-slate-800'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center shrink-0">
                    <Mail size={13} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{invite.email}</p>
                    <p className="text-xs text-slate-500">
                      Sent {new Date(invite.createdAt).toLocaleDateString()} · Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded border bg-slate-700 text-slate-400 border-slate-600 font-medium">
                    {invite.role}
                  </span>
                  {isAdmin && (
                    confirmCancelInviteId === invite.id ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setConfirmCancelInviteId(null)}
                          className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 rounded border border-slate-700 hover:border-slate-500"
                        >
                          Keep
                        </button>
                        <button
                          onClick={() => handleCancelInvite(invite)}
                          disabled={cancelingInviteId === invite.id}
                          className="px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded border border-red-600/40 disabled:opacity-40"
                        >
                          Cancel invite
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancelInviteId(invite.id)}
                        disabled={cancelingInviteId === invite.id}
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-40"
                        title="Cancel invite"
                      >
                        <X size={14} />
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowInvite(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-slate-100">Invite a member</h2>
                <button onClick={() => { setShowInvite(false); setInviteSentTo(null); }} className="text-slate-500 hover:text-slate-300 p-1">
                  <X size={16} />
                </button>
              </div>
              {inviteSentTo ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-400 text-xl">✓</span>
                  </div>
                  <p className="text-sm text-slate-200">Invite sent to <span className="font-medium">{inviteSentTo}</span></p>
                  <p className="text-xs text-slate-500">Closing in a moment…</p>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
                    <div className="relative">
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                        className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 pr-8"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  {inviteError && (
                    <p className="text-xs text-red-400">{inviteError}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowInvite(false)}
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 text-sm hover:border-slate-500 hover:text-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {inviting ? 'Sending…' : 'Send invite'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
