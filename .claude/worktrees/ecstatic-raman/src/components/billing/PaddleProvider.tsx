'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Paddle } from '@paddle/paddle-js'

const PaddleContext = createContext<Paddle | undefined>(undefined)

export function usePaddle() {
  return useContext(PaddleContext)
}

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddle, setPaddle] = useState<Paddle | undefined>()

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    if (!token) return
    import('@paddle/paddle-js').then(({ initializePaddle }) =>
      initializePaddle({ environment: 'sandbox', token }).then((p) => {
        if (p) setPaddle(p)
      })
    )
  }, [])

  return <PaddleContext.Provider value={paddle}>{children}</PaddleContext.Provider>
}
