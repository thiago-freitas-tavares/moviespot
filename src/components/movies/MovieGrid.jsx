import MovieCard from './MovieCard.jsx'

// 2, 3, 4 e 6 colunas dividem as 24 posições de uma página de resultados sem sobrar espaço vazio.
const GRID_CLASS = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'

/**
 * @param {(movie, index: number, added: boolean) => void} [onFavoriteToggle]
 */
export default function MovieGrid({ movies, label, headingLevel, onNavigate, onFavoriteToggle }) {
  return (
    <ul className={GRID_CLASS} aria-label={label}>
      {movies.map((movie, index) => (
        <li key={movie.id}>
          <MovieCard
            movie={movie}
            headingLevel={headingLevel}
            onNavigate={onNavigate}
            onFavoriteToggle={onFavoriteToggle && ((added) => onFavoriteToggle(movie, index, added))}
          />
        </li>
      ))}
    </ul>
  )
}

/** Esqueleto com o mesmo formato do grid: o layout não "pula" quando os dados chegam. */
export function MovieGridSkeleton({ label = 'Carregando filmes…' }) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      <div className={GRID_CLASS} aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function MovieCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="aspect-2/3 bg-surface-2 motion-safe:animate-pulse" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
    </div>
  )
}
