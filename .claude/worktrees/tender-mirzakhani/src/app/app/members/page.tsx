'use client'

import dynamic from 'next/dynamic'

const MembersPage = dynamic(() => import('./_client'), { ssr: false })

export default function Page() {
  return <MembersPage />
}
