import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import JoinClient from './_join-client'

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Invalid invite link</h2>
          <p className="text-sm text-slate-400">This link is missing a token. Please use the link from your invitation email.</p>
        </div>
      </div>
    )
  }

  const { userId } = await auth()
  if (!userId) {
    redirect(`/sign-in?redirect_url=/join?token=${encodeURIComponent(token)}`)
  }

  return <JoinClient token={token} />
}
