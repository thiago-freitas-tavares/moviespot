import { Link } from 'react-router'
import { ChevronRightIcon } from './icons.jsx'

/** Nielsen #6 e WCAG 2.4.8 — mostra onde o usuário está dentro do site. */
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Trilha de navegação" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.label} className="flex items-center gap-1">
              {index > 0 && <ChevronRightIcon className="size-4" />}
              {isLast ? (
                <span aria-current="page" className="line-clamp-1 font-medium text-fg">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="inline-flex min-h-6 items-center underline underline-offset-4 hover:text-fg">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
