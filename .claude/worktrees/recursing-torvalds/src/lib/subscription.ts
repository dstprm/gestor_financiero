import { prisma } from './db'

export type SubStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused' | 'unconfigured'

export async function getOrgSubscriptionStatus(organizationId: string): Promise<{
  status: SubStatus
  daysLeftInTrial: number | null
  isAccessAllowed: boolean
}> {
  if (!process.env.DATABASE_URL || !prisma) {
    return { status: 'unconfigured', daysLeftInTrial: null, isAccessAllowed: true }
  }
  try {
    const sub = await prisma.subscription.findUnique({ where: { organizationId } })
    if (!sub) return { status: 'unconfigured', daysLeftInTrial: null, isAccessAllowed: true }
    const now = new Date()
    if (sub.status === 'TRIALING') {
      const daysLeft = sub.trialEndsAt
        ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / 86400000))
        : null
      return { status: 'trialing', daysLeftInTrial: daysLeft, isAccessAllowed: daysLeft === null || daysLeft > 0 }
    }
    if (sub.status === 'ACTIVE') return { status: 'active', daysLeftInTrial: null, isAccessAllowed: true }
    if (sub.status === 'PAST_DUE') return { status: 'past_due', daysLeftInTrial: null, isAccessAllowed: true }
    return { status: sub.status.toLowerCase() as SubStatus, daysLeftInTrial: null, isAccessAllowed: false }
  } catch {
    return { status: 'unconfigured', daysLeftInTrial: null, isAccessAllowed: true }
  }
}

export function createTrialData(organizationId: string) {
  const now = new Date()
  return {
    organizationId,
    status: 'TRIALING' as const,
    trialStartedAt: now,
    trialEndsAt: new Date(now.getTime() + 5 * 86400000),
  }
}
