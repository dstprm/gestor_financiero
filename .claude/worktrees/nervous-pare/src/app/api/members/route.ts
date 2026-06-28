import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/db')

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 })

    const membership = await prisma.orgMembership.findFirst({ where: { userId: user.id } })
    if (!membership) return NextResponse.json({ error: 'no_org' }, { status: 404 })

    const { organizationId } = membership

    const members = await prisma.orgMembership.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })

    const now = new Date()
    const invites = await prisma.invite.findMany({
      where: { organizationId, acceptedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ members, invites })
  } catch (err) {
    console.error('GET /api/members error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/db')

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 })

    const membership = await prisma.orgMembership.findFirst({ where: { userId: user.id } })
    if (!membership) return NextResponse.json({ error: 'no_org' }, { status: 404 })

    if (membership.role !== 'ADMIN' && membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const { email, role = 'VIEWER' } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const { organizationId } = membership
    const org = await prisma.organization.findUnique({ where: { id: organizationId } })
    if (!org) return NextResponse.json({ error: 'org_not_found' }, { status: 404 })

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const invite = await prisma.invite.create({
      data: { email, organizationId, role, invitedByUserId: user.id, expiresAt },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const inviteUrl = `${appUrl}/join?token=${invite.token}`

    const { inviteEmail, sendEmail } = await import('@/lib/email')
    await sendEmail({
      to: email,
      subject: `You've been invited to join ${org.name} on ClaudeKit`,
      html: inviteEmail(user.name ?? user.email, org.name, inviteUrl),
    }).catch((err) => console.warn('Email send failed (non-fatal):', err))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/members error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
