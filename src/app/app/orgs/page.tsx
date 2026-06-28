import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getOrgs() {
  if (!process.env.DATABASE_URL) return []
  try {
    const { userId } = await auth()
    if (!userId) return []
    const { prisma } = await import('@/lib/db')
    const memberships = await prisma.orgMembership.findMany({
      where: { user: { clerkId: userId } },
      orderBy: { joinedAt: 'desc' },
      select: {
        role: true,
        organization: { select: { id: true, name: true, slug: true } },
      },
    })
    return memberships.map((m) => ({ ...m.organization, role: m.role }))
  } catch {
    return []
  }
}

export default async function OrgsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const orgs = await getOrgs()

  if (orgs.length === 1) {
    redirect(`/app?orgId=${orgs[0].id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Select an organization</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">You belong to multiple organizations.</p>

        {orgs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8 text-center">
            <p className="text-gray-400 dark:text-slate-500 text-sm mb-4">No organizations found.</p>
            <Link href="/app" className="text-sm text-blue-600 hover:text-blue-500">
              Continue anyway →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {orgs.map((org) => (
              <li key={org.id}>
                <Link
                  href={`/app?orgId=${org.id}`}
                  className="flex items-center justify-between bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{org.name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{org.role}</p>
                  </div>
                  <span className="text-gray-400 dark:text-slate-500">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
