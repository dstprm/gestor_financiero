import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

/**
 * Smart post-login redirect based on the user's org count:
 *  - 0 orgs → /app/orgs  (create first org)
 *  - 1 org  → /app?orgId=<id>  (go straight in)
 *  - 2+ orgs → /app/orgs  (let user pick)
 */
export default async function PostLoginRedirect() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  if (!process.env.DATABASE_URL) {
    redirect('/app')
  }

  try {
    const { prisma } = await import('@/lib/db')
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      redirect('/app/orgs')
    }

    const memberships = await prisma.orgMembership.findMany({
      where: { userId: user.id },
      select: { organizationId: true },
      orderBy: { joinedAt: 'desc' },
    })

    if (memberships.length === 1) {
      redirect(`/app?orgId=${memberships[0].organizationId}`)
    } else {
      redirect('/app/orgs')
    }
  } catch {
    redirect('/app/orgs')
  }
}
