'use client'

import { useCallback, useState } from 'react'

const STORAGE_KEY = 'ainsathi_incognito'

export function useIncognito() {
  const [isIncognito, setIsIncognito] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  const toggleIncognito = useCallback(() => {
    setIsIncognito(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  return { isIncognito, toggleIncognito }
}
