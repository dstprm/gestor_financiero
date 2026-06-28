import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { MemberRole } from '@prisma/client'
import { sendInviteAcceptedEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/db')

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { organization: { include: { owner: true } } },
    })

    if (!invite) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 404 })
    }
    if (invite.acceptedAt) {
      return NextResponse.json({ error: 'already_accepted' }, { status: 400 })
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'expired' }, { status: 400 })
    }

    // Get current user's email from Clerk to verify it matches the invite
    const clerkUser = await currentUser()
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? ''

    if (userEmail.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'email_mismatch', message: 'This invite was sent to a different email address.' },
        { status: 403 }
      )
    }

    // Get or create the DB user record
    const name =
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || userEmail
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, email: userEmail, name, avatarUrl: clerkUser?.imageUrl ?? null },
      update: { email: userEmail, name, avatarUrl: clerkUser?.imageUrl ?? null },
    })

    // Check not already a member
    const existing = await prisma.orgMembership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: invite.organizationId } },
    })

    if (!existing) {
      const roleValue = (invite.role.toUpperCase() as keyof typeof MemberRole) in MemberRole
        ? (invite.role.toUpperCase() as MemberRole)
        : MemberRole.VIEWER

      await prisma.orgMembership.create({
        data: { userId: user.id, organizationId: invite.organizationId, role: roleValue },
      })
    }

    await prisma.invite.update({
      where: { token },
      data: { acceptedAt: new Date() },
    })

    sendInviteAcceptedEmail(invite.organization.owner.email, name, userEmail, invite.organization.name).catch(
      (err) => console.error('Failed to send invite accepted email', err)
    )

    return NextResponse.json({
      orgId: invite.organizationId,
      orgName: invite.organization.name,
    })
  } catch (err) {
    console.error('POST /api/invites/accept error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
