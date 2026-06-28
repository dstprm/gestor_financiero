'use client'

import dynamic from 'next/dynamic'

const OrgPage = dynamic(() => import('./_client'), { ssr: false })

export default function Page() {
  return <OrgPage />
}
