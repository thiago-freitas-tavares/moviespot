import { FilmIcon } from './icons.jsx'

/** Estado vazio que explica o motivo e oferece o próximo passo (Nielsen #9 e #10). */
export default function EmptyState({ icon: Icon = FilmIcon, title, children, actions }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border-strong px-6 py-12 text-center">
      <Icon className="mb-4 size-12 text-muted" />
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="mt-2 max-w-prose text-muted">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  )
}
