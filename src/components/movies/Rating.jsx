import { StarIcon } from '../ui/icons.jsx'
import { formatRating } from '../../utils/format.js'

/**
 * Nota sempre exibida como número (não só pela cor/estrela — WCAG 1.4.1).
 * Leitores de tela ouvem "Nota 7,5 de 10" em vez de "7,5" solto.
 */
export default function Rating({ value, count }) {
  if (!count) {
    return <span className="text-sm text-muted">Sem avaliações</span>
  }

  const formatted = formatRating(value)
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-fg">
      <StarIcon className="size-4 text-star" />
      <span aria-hidden="true">{formatted}</span>
      <span className="sr-only">Nota {formatted} de 10</span>
    </span>
  )
}
