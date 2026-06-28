import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import type { EmployeeStatus } from '@prisma/client'
import { logAudit } from '@/lib/audit'

async function getMemberRole(clerkUserId: string, organizationId: string): Promise<string | null> {
  const { prisma } = await import('@/lib/db')
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  })
  if (!user) return null
  const membership = await prisma.orgMembership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  })
  return membership?.role ?? null
}

interface ImportEmployee {
  name: string
  title?: string
  department?: string
  email?: string
  managerName?: string
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const body = await req.json()
  const { orgId, employees } = body as { orgId: string; employees: ImportEmployee[] }

  if (!orgId || !Array.isArray(employees)) {
    return NextResponse.json({ error: 'orgId and employees are required' }, { status: 400 })
  }

  const role = await getMemberRole(userId, orgId)
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { prisma } = await import('@/lib/db')

  // Build set of existing active employee names for duplicate detection
  const existing = await prisma.employee.findMany({
    where: { organizationId: orgId, status: { not: 'INACTIVE' } },
    select: { name: true },
  })
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()))

  let created = 0
  let skipped = 0

  // First pass: create employees (no manager links yet)
  for (const emp of employees) {
    const name = emp.name?.trim()
    if (!name) { skipped++; continue }
    if (existingNames.has(name.toLowerCase())) { skipped++; continue }

    try {
      await prisma.employee.create({
        data: {
          organizationId: orgId,
          name,
          title: emp.title || null,
          department: emp.department || null,
          email: emp.email || null,
          status: 'ACTIVE' as EmployeeStatus,
        },
      })
      existingNames.add(name.toLowerCase())
      created++
    } catch {
      skipped++
    }
  }

  // Second pass: resolve manager relationships by name
  const allEmployees = await prisma.employee.findMany({
    where: { organizationId: orgId, status: { not: 'INACTIVE' } },
    select: { id: true, name: true },
  })
  const nameToId = new Map(allEmployees.map((e) => [e.name.toLowerCase(), e.id]))

  const managerUpdates = employees
    .filter((emp) => emp.name?.trim() && emp.managerName?.trim())
    .map((emp) => {
      const employeeId = nameToId.get(emp.name.toLowerCase())
      const managerId = nameToId.get(emp.managerName!.toLowerCase())
      if (!employeeId || !managerId || employeeId === managerId) return null
      return { employeeId, managerId }
    })
    .filter((u): u is { employeeId: string; managerId: string } => u !== null)

  await Promise.all(
    managerUpdates.map(({ employeeId, managerId }) =>
      prisma.employee.update({ where: { id: employeeId }, data: { managerId } })
    )
  )

  void logAudit({
    organizationId: orgId,
    userId,
    action: 'employees.imported',
    entityType: 'employee',
    entityId: orgId,
    entityName: `Bulk import: ${created} created, ${skipped} skipped`,
    changes: { created: { from: 0, to: created }, skipped: { from: 0, to: skipped } },
  })

  return NextResponse.json({ created, skipped })
}
