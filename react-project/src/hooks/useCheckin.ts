'use client'
import { useState, useCallback } from 'react'

export function useCheckin() {
  const [state, setState] = useState<Record<string, boolean>>({})

  const toggle = useCallback((aulaId: string, index: number, valorOriginal: boolean) => {
    const key  = `${aulaId}_${index}`
    const next = !(key in state ? state[key] : valorOriginal)
    setState((prev) => ({ ...prev, [key]: next }))
    return next
  }, [state])

  const isPresente = useCallback(
    (aulaId: string, index: number, valorOriginal: boolean) => {
      const key = `${aulaId}_${index}`
      return key in state ? state[key] : valorOriginal
    },
    [state]
  )

  const reset = useCallback(() => setState({}), [])

  return { toggle, isPresente, reset }
}
