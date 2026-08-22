'use client'
import { useState, useCallback } from 'react'

export function useToast() {
  const [message, setMessage] = useState('')
  const [show,    setShow]    = useState(false)

  const showToast = useCallback((msg: string) => {
    setMessage(msg)
    setShow(true)
  }, [])

  const hideToast = useCallback(() => setShow(false), [])

  return { message, show, showToast, hideToast }
}
