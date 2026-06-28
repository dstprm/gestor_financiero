'use client'

import dynamic from 'next/dynamic'

const BillingPage = dynamic(() => import('./_client'), { ssr: false })

export default function Page() {
  return <BillingPage />
}
