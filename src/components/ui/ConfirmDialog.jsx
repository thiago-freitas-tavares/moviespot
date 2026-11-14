import { useRef } from 'react'
import Dialog from './Dialog.jsx'
import { buttonClass } from './styles.js'

/**
 * Nielsen #5 — prevenção de erros: ações destrutivas pedem confirmação.
 * O foco inicial fica em "Cancelar" (a opção segura), então um Enter acidental não apaga nada.
 */
export default function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel, fallbackFocusRef }) {
  const cancelRef = useRef(null)

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      initialFocusRef={cancelRef}
      fallbackFocusRef={fallbackFocusRef}
    >
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button ref={cancelRef} type="button" onClick={onCancel} className={buttonClass('secondary')}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} className={buttonClass('danger')}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
