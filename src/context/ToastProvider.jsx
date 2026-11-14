import { useCallback, useMemo, useState } from 'react'
import { ToastContext } from './contexts.js'
import Toaster from '../components/ui/Toaster.jsx'

const MAX_TOASTS = 3
let nextId = 0

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [announcement, setAnnouncement] = useState('')

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id))
  }, [])

  /**
   * @param {{ message: string, tone?: 'info'|'success', action?: { label: string, onClick: () => void } }} toast
   */
  const showToast = useCallback(({ message, tone = 'info', action }) => {
    const id = ++nextId
    setToasts((list) => [...list.slice(-(MAX_TOASTS - 1)), { id, message, tone, action }])
    // Alterna um espaço invisível no fim para que leitores de tela anunciem
    // de novo mesmo quando a mensagem é idêntica à anterior.
    setAnnouncement(message + (id % 2 ? ' ' : ''))
    return id
  }, [])

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismissToast} />
      {/* WCAG 4.1.3 — mensagens de status anunciadas sem mover o foco. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </ToastContext.Provider>
  )
}
