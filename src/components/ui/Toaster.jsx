import { useEffect, useState } from 'react'
import { CheckIcon, InfoIcon, XIcon } from './icons.jsx'

const DURATION_MS = 6000

/**
 * Notificações visuais. O anúncio para leitores de tela é feito por uma região
 * aria-live separada no ToastProvider, para não ler os botões junto com a mensagem.
 */
export default function Toaster({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <section aria-label="Notificações">
      <ol className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </ol>
    </section>
  )
}

function ToastItem({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false)

  // WCAG 2.2.1 — o tempo para quando o mouse ou o foco estão sobre a notificação.
  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => onDismiss(toast.id), DURATION_MS)
    return () => clearTimeout(timer)
  }, [paused, toast.id, onDismiss])

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
  }

  // A notificação some ao ser fechada; o foco vai para o conteúdo principal em vez de se perder.
  const close = () => {
    onDismiss(toast.id)
    document.getElementById('conteudo')?.focus({ preventScroll: true })
  }

  const Icon = toast.tone === 'success' ? CheckIcon : InfoIcon

  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={handleBlur}
      className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-border-strong bg-surface-2 py-2 pl-4 pr-2 shadow-xl"
    >
      <Icon className={`size-5 shrink-0 ${toast.tone === 'success' ? 'text-success' : 'text-accent-text'}`} />
      <p className="flex-1 py-1 text-sm">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action.onClick()
            close()
          }}
          className="min-h-9 rounded-md px-3 text-sm font-semibold text-accent-text underline underline-offset-4 hover:bg-surface"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={close}
        aria-label="Fechar notificação"
        className="grid size-9 shrink-0 place-items-center rounded-md text-muted hover:bg-surface hover:text-fg"
      >
        <XIcon className="size-4" />
      </button>
    </li>
  )
}
