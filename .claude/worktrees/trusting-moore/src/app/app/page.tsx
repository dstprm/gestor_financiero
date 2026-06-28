'use client'

import dynamic from 'next/dynamic'

const AppPage = dynamic(() => import('./_client'), { ssr: false })

export default function Page() {
  return <AppPage />
}
