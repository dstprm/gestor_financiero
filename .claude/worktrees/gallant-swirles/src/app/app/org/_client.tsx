'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Pencil,
  Users,
  UserPlus,
  Trash2,
  X,
  ChevronDown,
  Mail,
  Clock,
  LogOut,
  CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type MemberRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'

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
  OWNER: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-600/20 dark:text-purple-300 dark:border-purple-600/40',
  ADMIN: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-600/40',
  EDITOR: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-600/20 dark:text-emerald-300 dark:border-emerald-600/40',
  VIEWER: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600',
}

const CHANGEABLE_ROLES: MemberRole[] = ['ADMIN', 'EDITOR', 'VIEWER']

export default function OrgManagePage() {
  const router = useRouter()

  // Org info
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<MemberRole | null>(null)
  const [currentMembershipId, setCurrentMembershipId] = useState<string | null>(null)

  // Members
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [dbUnavailable, setDbUnavailable] = useState(false)

  // Org name editing
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Invite
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>('VIEWER')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSentTo, setInviteSentTo] = useState<string | null>(null)

  // Member actions
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null)
  const [cancelingInviteId, setCancelingInviteId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [confirmCancelInviteId, setConfirmCancelInviteId] = useState<string | null>(null)

  // Subscription
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null)
  const [daysLeftInTrial, setDaysLeftInTrial] = useState<number | null>(null)

  // Danger zone
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [confirmDeleteText, setConfirmDeleteText] = useState('')
  const [deletingOrg, setDeletingOrg] = useState(false)

  const isAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'
  const isOwner = currentUserRole === 'OWNER'

  async function loadData() {
    try {
      const [mineRes, membersRes] = await Promise.all([
        fetch('/api/org/mine'),
        fetch('/api/members'),
      ])
      if (mineRes.status === 503 || membersRes.status === 503) {
        setDbUnavailable(true)
        return
      }
      let resolvedOrgId: string | undefined
      if (mineRes.ok) {
        const d = await mineRes.json() as {
          organizationId?: string
          orgName?: string
          currentUserRole?: MemberRole
          membershipId?: string
        }
        if (d.organizationId) { setOrgId(d.organizationId); resolvedOrgId = d.organizationId }
        if (d.orgName) setOrgName(d.orgName)
        if (d.currentUserRole) setCurrentUserRole(d.currentUserRole)
        if (d.membershipId) setCurrentMembershipId(d.membershipId)
      }
      if (membersRes.ok) {
        const d = await membersRes.json() as { members?: Member[]; invites?: Invite[] }
        setMembers(d.members ?? [])
        setInvites(d.invites ?? [])
      }
      // Fetch subscription (best-effort)
      if (resolvedOrgId) {
        fetch(`/api/subscription?organizationId=${encodeURIComponent(resolvedOrgId)}`)
          .then((r) => r.ok ? r.json() : null)
          .then((d: { status?: SubStatus; daysLeftInTrial?: number | null } | null) => {
            if (d?.status) setSubStatus(d.status)
            if (d?.daysLeftInTrial !== undefined) setDaysLeftInTrial(d.daysLeftInTrial ?? null)
          })
          .catch(() => {})
      }
    } catch {
      setDbUnavailable(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  // ---- Org name ----
  function startEditName() {
    setNameInput(orgName ?? '')
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
      toast.success('Organization renamed')
    } catch {
      toast.error('Failed to rename organization')
    } finally {
      setSavingName(false)
    }
  }

  // ---- Invite ----
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
      const data = await res.json() as { message?: string; error?: string }
      if (!res.ok) {
        setInviteError(data.message ?? data.error ?? 'Invite failed')
        return
      }
      const sentEmail = inviteEmail
      setInviteEmail('')
      setInviteSentTo(sentEmail)
      const fresh = await fetch('/api/members')
      if (fresh.ok) {
        const d = await fresh.json() as { members?: Member[]; invites?: Invite[] }
        setMembers(d.members ?? [])
        setInvites(d.invites ?? [])
      }
      setTimeout(() => { setShowInvite(false); setInviteSentTo(null) }, 2000)
    } catch {
      setInviteError('Something went wrong')
    } finally {
      setInviting(false)
    }
  }

  // ---- Role change ----
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
        const updated = await res.json() as Member
        setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)))
      } else {
        toast.error('Failed to update role')
      }
    } catch {
      toast.error('Failed to update role')
    } finally {
      setChangingRoleId(null)
    }
  }

  // ---- Remove member ----
  async function handleRemove(member: Member) {
    if (member.role === 'OWNER') return
    setRemovingId(member.id)
    try {
      const res = await fetch(`/api/members/${member.id}`, { method: 'DELETE' })
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== member.id))
      } else {
        toast.error('Failed to remove member')
      }
    } catch {
      toast.error('Failed to remove member')
    } finally {
      setRemovingId(null)
      setConfirmRemoveId(null)
    }
  }

  // ---- Cancel invite ----
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

  // ---- Leave org ----
  async function handleLeave() {
    if (!currentMembershipId) return
    setLeaving(true)
    try {
      const res = await fetch(`/api/members/${currentMembershipId}`, { method: 'DELETE' })
      if (res.ok) {
        router.replace('/app/orgs')
      } else {
        toast.error('Failed to leave organization')
        setLeaving(false)
      }
    } catch {
      toast.error('Something went wrong')
      setLeaving(false)
    }
  }

  // ---- Delete org ----
  async function handleDeleteOrg() {
    if (!orgId || confirmDeleteText !== orgName) return
    setDeletingOrg(true)
    try {
      const res = await fetch(`/api/org/${orgId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      router.replace('/?deleted=1')
    } catch {
      toast.error('Failed to delete organization')
      setDeletingOrg(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back nav */}
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Org Chart
        </Link>

        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 dark:bg-blue-600/20 rounded-lg flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              {orgName ?? 'Organization'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-500">Manage your organization</p>
          </div>
        </div>

        {/* DB not configured */}
        {dbUnavailable && (
          <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-8 text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Organization management requires database setup.</p>
            <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">
              Configure <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">DATABASE_URL</code> to enable this feature.
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !dbUnavailable && (
          <>
            {/* ── Org name ── */}
            <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Organization name
              </h2>
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
                    className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-slate-200 text-sm focus:outline-none focus:border-blue-500"
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
                    className="px-3 py-1.5 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <p className="text-gray-800 dark:text-slate-200 text-sm font-medium">{orgName ?? '—'}</p>
                  {isAdmin && (
                    <button
                      onClick={startEditName}
                      className="p-1 rounded text-gray-400 dark:text-slate-600 hover:text-gray-700 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Rename"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* ── Billing ── */}
            <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={15} className="text-gray-500 dark:text-slate-400" />
                  <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    Billing
                  </h2>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {subStatus ? (
                    <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', SUB_STATUS_COLORS[subStatus])}>
                      {SUB_STATUS_LABELS[subStatus]}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
                  )}
                  {subStatus === 'trialing' && daysLeftInTrial !== null && (
                    <span className="text-xs text-gray-400 dark:text-slate-500">
                      {daysLeftInTrial === 0 ? 'Expires today' : `${daysLeftInTrial} day${daysLeftInTrial === 1 ? '' : 's'} left`}
                    </span>
                  )}
                </div>
                <a
                  href="/billing"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                >
                  Manage billing →
                </a>
              </div>
            </section>

            {/* ── Members ── */}
            <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-gray-500 dark:text-slate-400" />
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                    Members
                    {members.length > 0 && (
                      <span className="ml-2 text-xs text-gray-400 dark:text-slate-500 font-normal">{members.length}</span>
                    )}
                  </h2>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => { setShowInvite(true); setInviteSentTo(null) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <UserPlus size={13} />
                    Invite
                  </button>
                )}
              </div>

              {members.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 dark:text-slate-500 text-sm">No members yet.</div>
              ) : (
                members.map((member, idx) => (
                  <div
                    key={member.id}
                    className={cn(
                      'flex items-center gap-3 px-5 py-3',
                      idx !== members.length - 1 && 'border-b border-gray-100 dark:border-slate-800'
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
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 text-xs font-medium shrink-0">
                        {(member.user.name ?? member.user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
                        {member.user.name ?? member.user.email}
                      </p>
                      {member.user.name && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{member.user.email}</p>
                      )}
                    </div>
                    {/* Role badge / selector */}
                    {isAdmin && member.role !== 'OWNER' ? (
                      <div className="relative">
                        <select
                          value={member.role}
                          disabled={changingRoleId === member.id}
                          onChange={(e) => void handleRoleChange(member, e.target.value as MemberRole)}
                          className={cn(
                            'appearance-none text-xs px-2 py-0.5 rounded border font-medium pr-5 cursor-pointer bg-transparent transition-opacity',
                            ROLE_COLORS[member.role],
                            changingRoleId === member.id && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {CHANGEABLE_ROLES.map((r) => (
                            <option key={r} value={r} className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200">{r}</option>
                          ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    ) : (
                      <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', ROLE_COLORS[member.role])}>
                        {member.role}
                      </span>
                    )}
                    {/* Remove button (admins only, not for owner) */}
                    {isAdmin && member.role !== 'OWNER' && (
                      confirmRemoveId === member.id ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-gray-500 dark:text-slate-400 hidden sm:inline">Remove?</span>
                          <button
                            onClick={() => setConfirmRemoveId(null)}
                            className="px-2 py-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 rounded border border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => void handleRemove(member)}
                            disabled={removingId === member.id}
                            className="px-2 py-1 text-xs bg-red-50 dark:bg-red-600/20 hover:bg-red-100 dark:hover:bg-red-600/30 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-600/40 disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemoveId(member.id)}
                          disabled={removingId === member.id}
                          className="p-1.5 text-gray-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded transition-colors disabled:opacity-40 shrink-0"
                          title="Remove member"
                        >
                          <Trash2 size={14} />
                        </button>
                      )
                    )}
                  </div>
                ))
              )}
            </section>

            {/* ── Pending invites ── */}
            {invites.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock size={12} />
                  Pending Invites
                </h2>
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {invites.map((invite, idx) => (
                    <div
                      key={invite.id}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3',
                        idx !== invites.length - 1 && 'border-b border-gray-100 dark:border-slate-800'
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700/50 flex items-center justify-center shrink-0">
                        <Mail size={13} className="text-gray-400 dark:text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-slate-300 truncate">{invite.email}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          Sent {new Date(invite.createdAt).toLocaleDateString()} · Expires {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded border bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-600 font-medium">
                        {invite.role}
                      </span>
                      {isAdmin && (
                        confirmCancelInviteId === invite.id ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setConfirmCancelInviteId(null)}
                              className="px-2 py-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 rounded border border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500"
                            >
                              Keep
                            </button>
                            <button
                              onClick={() => void handleCancelInvite(invite)}
                              disabled={cancelingInviteId === invite.id}
                              className="px-2 py-1 text-xs bg-red-50 dark:bg-red-600/20 hover:bg-red-100 dark:hover:bg-red-600/30 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-600/40 disabled:opacity-40"
                            >
                              Cancel invite
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmCancelInviteId(invite.id)}
                            disabled={cancelingInviteId === invite.id}
                            className="p-1.5 text-gray-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded transition-colors disabled:opacity-40 shrink-0"
                            title="Cancel invite"
                          >
                            <X size={14} />
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Danger zone ── */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Danger Zone
              </h2>

              {/* Leave org — non-owners only */}
              {!isOwner && currentMembershipId && (
                <div className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Leave organization</h3>
                  <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                    You will lose access to{' '}
                    <span className="font-medium text-gray-800 dark:text-slate-300">{orgName ?? 'this organization'}</span>
                    . An admin can re-invite you later.
                  </p>
                  {confirmLeave ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-slate-400 flex-1">Are you sure?</span>
                      <button
                        onClick={() => setConfirmLeave(false)}
                        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => void handleLeave()}
                        disabled={leaving}
                        className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-600/20 hover:bg-red-100 dark:hover:bg-red-600/30 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-600/40 disabled:opacity-40 flex items-center gap-1.5 transition-colors"
                      >
                        <LogOut size={13} />
                        {leaving ? 'Leaving…' : 'Leave org'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmLeave(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 dark:border-red-600/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                      <LogOut size={13} />
                      Leave organization
                    </button>
                  )}
                </div>
              )}

              {/* Delete org — owner only */}
              {isOwner && (
                <div className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Delete organization</h3>
                  <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                    This will permanently delete{' '}
                    <span className="font-medium text-gray-800 dark:text-slate-300">{orgName ?? 'this organization'}</span>
                    , all employees, and all data. This cannot be undone.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-slate-500 mb-1">
                        Type <span className="font-mono text-gray-700 dark:text-slate-400">{orgName}</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={confirmDeleteText}
                        onChange={(e) => setConfirmDeleteText(e.target.value)}
                        placeholder={orgName ?? ''}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-lg text-gray-800 dark:text-slate-200 text-sm placeholder-gray-300 dark:placeholder-slate-700 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <button
                      onClick={() => void handleDeleteOrg()}
                      disabled={deletingOrg || confirmDeleteText !== orgName || !orgId}
                      className="px-4 py-2 rounded-lg border border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deletingOrg ? 'Deleting…' : 'Permanently Delete'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* ── Invite modal ── */}
      {showInvite && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowInvite(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Invite a member</h2>
                <button
                  onClick={() => { setShowInvite(false); setInviteSentTo(null) }}
                  className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 p-1"
                >
                  <X size={16} />
                </button>
              </div>
              {inviteSentTo ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-600 dark:text-emerald-400 text-xl">✓</span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-slate-200">
                    Invite sent to <span className="font-medium">{inviteSentTo}</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Closing in a moment…</p>
                </div>
              ) : (
                <form onSubmit={(e) => void handleInvite(e)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Email address</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Role</label>
                    <div className="relative">
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                        className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 pr-8"
                      >
                        {CHANGEABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  {inviteError && (
                    <p className="text-xs text-red-500 dark:text-red-400">{inviteError}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowInvite(false)}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 text-sm hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
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
