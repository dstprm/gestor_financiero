import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Users, ChevronRight, GitBranch, Plus } from 'lucide-react'

interface OrgEntry {
  id: string
  name: string
  memberCount: number
  updatedAt: Date
  role: string
}

async function getUserOrgs(clerkUserId: string): Promise<OrgEntry[]> {
  if (!process.env.DATABASE_URL) {
    return [{ id: 'demo', name: 'Demo Organization', memberCount: 1, updatedAt: new Date(), role: 'OWNER' }]
  }
  const { prisma } = await import('@/lib/db')
  const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } })
  if (!user) return []

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: user.id },
    include: {
      organization: {
        include: { _count: { select: { members: true } } },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    memberCount: m.organization._count.members,
    updatedAt: m.organization.updatedAt,
    role: m.role,
  }))
}

async function createOrg(formData: FormData) {
  'use server'
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  if (!process.env.DATABASE_URL) redirect('/app/orgs')

  const name = ((formData.get('name') as string) ?? '').trim() || 'New Organization'

  const { prisma } = await import('@/lib/db')
  const { createTrialData } = await import('@/lib/subscription')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/sign-in')

  const org = await prisma.organization.create({
    data: {
      name,
      slug: `org-${Date.now().toString(36)}`,
      ownerId: user.id,
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  })
  await prisma.subscription.create({ data: createTrialData(org.id) })

  redirect(`/app?orgId=${org.id}`)
}

function formatUpdatedAt(date: Date): string {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

export default async function OrgsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const orgs = await getUserOrgs(userId)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <GitBranch size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Your Organizations</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Select an organization to open its chart</p>
          </div>
        </div>

        {/* Org cards */}
        {orgs.length > 0 ? (
          <div className="space-y-3">
            {orgs.map((org) => (
              <Link
                key={org.id}
                href={`/app?orgId=${org.id}`}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{org.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Users size={11} />
                    <span>{org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}</span>
                    <span className="text-gray-300 dark:text-slate-600">·</span>
                    <span>{roleLabel(org.role)}</span>
                    <span className="text-gray-300 dark:text-slate-600">·</span>
                    <span>Updated {formatUpdatedAt(org.updatedAt)}</span>
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-gray-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors shrink-0"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No organizations found</p>
          </div>
        )}

        {/* Create new org */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">New organization</p>
          <form action={createOrg} className="flex gap-2">
            <input
              name="name"
              type="text"
              placeholder="Organization name"
              required
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
            >
              <Plus size={15} />
              Create
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
