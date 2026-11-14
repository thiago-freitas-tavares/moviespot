import { useEffect, useId, useRef } from 'react'
import { XIcon } from './icons.jsx'
import { iconButtonClass } from './styles.js'

const SIZES = {
  md: 'max-w-lg',
  xl: 'max-w-4xl',
}

/**
 * Diálogo modal baseado no <dialog> nativo:
 * - showModal() deixa o restante da página inerte e mantém o foco dentro do diálogo (WCAG 2.1.2);
 * - Esc fecha (WCAG 2.1.1);
 * - ao fechar, o foco volta para quem abriu o diálogo (WCAG 2.4.3), ou para
 *   `fallbackFocusRef` / conteúdo principal se aquele elemento não existir mais.
 */
export default function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  initialFocusRef,
  fallbackFocusRef,
  children,
}) {
  const dialogRef = useRef(null)
  const openerRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      openerRef.current = document.activeElement
      dialog.showModal()
      initialFocusRef?.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, initialFocusRef])

  // Disparado tanto pelo Esc quanto por dialog.close().
  const handleClose = () => {
    onClose()
    const target = [openerRef.current, fallbackFocusRef?.current].find((el) => el?.isConnected)
    ;(target ?? document.getElementById('conteudo'))?.focus()
  }

  // Clique fora da caixa (no backdrop) também fecha: atalho de mouse
  // equivalente ao Esc e ao botão "Fechar", que continuam disponíveis.
  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) dialogRef.current.close()
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={handleClose}
      onClick={handleBackdropClick}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${SIZES[size]} rounded-2xl border border-border bg-surface p-0 text-fg shadow-2xl`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="pt-2 text-xl font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar"
            className={`${iconButtonClass} -mr-2 -mt-1`}
          >
            <XIcon />
          </button>
        </div>
        {description && (
          <p id={descriptionId} className="mt-2 text-muted">
            {description}
          </p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  )
}
