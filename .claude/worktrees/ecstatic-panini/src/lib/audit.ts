interface AuditParams {
  organizationId: string
  userId: string
  action: string
  entityType: string
  entityId?: string
  entityName?: string
  changes?: Record<string, { from: unknown; to: unknown }>
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const { prisma } = await import('@/lib/db')
    const user = await prisma.user.findFirst({
      where: { clerkId: params.userId },
      select: { name: true, email: true },
    })
    const userDisplayName = user?.name ?? user?.email ?? params.userId
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        userDisplayName,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        entityName: params.entityName ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changes: (params.changes as any) ?? undefined,
      },
    })
  } catch {
    // swallow silently — audit must never break the main flow
  }
}
