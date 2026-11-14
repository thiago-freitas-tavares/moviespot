// Classes compartilhadas para manter botões e campos idênticos em todo o app
// (Nielsen #4 — consistência e padrões). Alturas mínimas de 36–48px atendem
// ao tamanho de alvo da WCAG 2.5.8 (mín. 24×24px).

const BUTTON_VARIANTS = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
  secondary: 'border border-border-strong bg-surface-2 text-fg hover:bg-border',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'bg-danger text-danger-fg hover:opacity-90',
}

const BUTTON_SIZES = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4',
  lg: 'min-h-12 px-6 text-lg',
}

export function buttonClass(variant = 'primary', size = 'md', extra = '') {
  return [
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-60',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    extra,
  ].join(' ')
}

export const iconButtonClass =
  'inline-grid size-11 shrink-0 place-items-center rounded-lg text-fg transition-colors hover:bg-surface-2'

export const fieldClass =
  'block min-h-11 w-full rounded-lg border border-border-strong bg-surface-2 px-3 text-fg placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60'

export const labelClass = 'mb-1.5 block text-sm font-semibold'

export const textLinkClass =
  'font-medium text-accent-text underline decoration-1 underline-offset-4 hover:decoration-2'
