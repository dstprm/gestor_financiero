'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'simplyorg-cookie-consent'

export function CookieBanner() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (pathname?.startsWith('/try')) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [pathname])

  function handle(choice: 'accepted' | 'declined') {
    localStorage.setItem(STORAGE_KEY, choice)
    setVisible(false)
  }

  if (pathname?.startsWith('/try') || !visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shadow-2xl">
      <p className="text-sm text-gray-600 dark:text-slate-300 flex-1">
        We use cookies to improve your experience.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => handle('declined')}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 rounded-md transition-colors"
        >
          Decline
        </button>
        <button
          onClick={() => handle('accepted')}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  )
}
