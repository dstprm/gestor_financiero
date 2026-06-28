import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { prisma } from '@/lib/db'
import { createTrialData } from '@/lib/subscription'

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) return new Response('Not configured', { status: 200 })

  const h = await headers()
  const svixId = h.get('svix-id') ?? ''
  const svixTs = h.get('svix-timestamp') ?? ''
  const svixSig = h.get('svix-signature') ?? ''
  const body = await req.text()

  let event: any
  try {
    event = new Webhook(secret).verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTs,
      'svix-signature': svixSig,
    })
  } catch {
    return new Response('Bad signature', { status: 400 })
  }

  const existing = await prisma.webhookEvent.findUnique({ where: { eventId: svixId } }).catch(() => null)
  if (existing) return new Response('Already processed', { status: 200 })
  await prisma.webhookEvent.create({ data: { eventId: svixId, source: 'clerk', eventType: event.type } }).catch(() => null)

  try {
    if (event.type === 'user.created') {
      const { id: clerkId, email_addresses, first_name, last_name, image_url } = event.data
      const email = email_addresses?.[0]?.email_address ?? ''
      const name = [first_name, last_name].filter(Boolean).join(' ') || email
      const user = await prisma.user.upsert({
        where: { clerkId },
        update: { email, name, avatarUrl: image_url },
        create: { clerkId, email, name, avatarUrl: image_url },
      })
      const org = await prisma.organization.create({
        data: {
          name: `${name}'s Org`,
          slug: `org-${user.id.slice(-8)}`,
          ownerId: user.id,
          members: { create: { userId: user.id, role: 'OWNER' } },
        },
      })
      await prisma.subscription.create({ data: createTrialData(org.id) })
    } else if (event.type === 'user.updated') {
      const { id: clerkId, email_addresses, first_name, last_name, image_url } = event.data
      const email = email_addresses?.[0]?.email_address ?? ''
      const name = [first_name, last_name].filter(Boolean).join(' ') || email
      await prisma.user.updateMany({ where: { clerkId }, data: { email, name, avatarUrl: image_url } })
    } else if (event.type === 'user.deleted') {
      await prisma.user.deleteMany({ where: { clerkId: event.data.id } })
    }
  } catch (err) {
    console.error('Clerk webhook error', err)
    return new Response('Error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
