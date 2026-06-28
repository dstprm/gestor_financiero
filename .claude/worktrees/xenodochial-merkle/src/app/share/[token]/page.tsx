import { notFound } from 'next/navigation'
import SharePageClient from './_client'

interface ShareEmployee {
  id: string
  name: string
  title: string | null
  department: string | null
  managerId: string | null
  avatarUrl: string | null
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  if (!process.env.DATABASE_URL) {
    notFound()
  }

  let orgName: string
  let employees: ShareEmployee[]

  try {
    const { token } = await params
    const { prisma } = await import('@/lib/db')

    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        organization: {
          include: {
            employees: {
              where: { status: { not: 'INACTIVE' } },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!link || !link.enabled) notFound()
    if (link.expiresAt && link.expiresAt < new Date()) notFound()

    orgName = link.organization.name
    employees = link.organization.employees.map((e) => ({
      id: e.id,
      name: e.name,
      title: e.title,
      department: e.department,
      managerId: e.managerId,
      avatarUrl: null,
    }))
  } catch {
    notFound()
  }

  return <SharePageClient orgName={orgName!} employees={employees!} />
}
