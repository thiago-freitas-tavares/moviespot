import { ChevronLeftIcon, ChevronRightIcon } from './icons.jsx'
import { buttonClass } from './styles.js'

/** Primeira, última e vizinhas da atual, com reticências entre os saltos. */
function getPageItems(current, total) {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)

  const items = []
  pages.forEach((page, i) => {
    if (i > 0 && page - pages[i - 1] > 1) items.push(`gap-${page}`)
    items.push(page)
  })
  return items
}

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Páginas de resultados" className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={buttonClass('secondary', 'md')}
          >
            <ChevronLeftIcon />
            Anterior
          </button>
        </li>

        {getPageItems(page, totalPages).map((item) =>
          typeof item === 'string' ? (
            <li key={item} aria-hidden="true" className="hidden px-1 text-muted sm:block">
              …
            </li>
          ) : (
            <li key={item} className="hidden sm:block">
              <button
                type="button"
                onClick={() => item !== page && onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Página ${item}`}
                className={
                  item === page
                    ? buttonClass('primary', 'md', 'min-w-11')
                    : buttonClass('ghost', 'md', 'min-w-11')
                }
              >
                {item}
              </button>
            </li>
          ),
        )}

        <li className="px-2 text-sm text-muted sm:hidden">
          Página {page} de {totalPages}
        </li>

        <li>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={buttonClass('secondary', 'md')}
          >
            Próxima
            <ChevronRightIcon />
          </button>
        </li>
      </ul>
    </nav>
  )
}
