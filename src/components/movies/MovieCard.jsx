import { useId, useRef } from 'react'
import { Link } from 'react-router'
import Poster from './Poster.jsx'
import Rating from './Rating.jsx'
import FavoriteButton from './FavoriteButton.jsx'
import { useFavorites } from '../../hooks/useFavorites.js'
import { formatYear } from '../../utils/format.js'

const POSTER_SIZES = '(min-width: 1280px) 200px, (min-width: 1024px) 23vw, (min-width: 640px) 30vw, 45vw'

/**
 * O link do card e o botão de favorito são irmãos (e não um dentro do outro),
 * pois elementos interativos aninhados não são acessíveis por teclado/leitor de tela.
 */
export default function MovieCard({ movie, headingLevel = 3, onNavigate, onFavoriteToggle }) {
  const year = formatYear(movie.release_date)
  // O nível do título acompanha a página, sem pular níveis (WCAG 1.3.1).
  const Heading = `h${headingLevel}`
  const { isFavorite } = useFavorites()
  const saved = isFavorite(movie.id)
  const favoriteRef = useRef(null)
  const hintId = useId()

  /*
    Nielsen #7 — uma parada de Tab por filme: o coração sai da ordem do Tab e o Espaço
    sobre o card faz o mesmo que clicá-lo. O coração continua clicável com mouse, voz e
    leitor de tela, e a dica aparece no card ao receber o foco pelo teclado.
  */
  const handleKeyDown = (event) => {
    if (event.key !== ' ' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    event.preventDefault()
    favoriteRef.current?.click()
  }

  return (
    <article className="group relative h-full">
      <Link
        to={`/filme/${movie.id}`}
        onClick={onNavigate}
        onKeyDown={handleKeyDown}
        aria-describedby={hintId}
        data-card-link
        className="group/card flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-border-strong"
      >
        <div className="relative overflow-hidden">
          <Poster
            path={movie.poster_path}
            sizes={POSTER_SIZES}
            className="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-2 bottom-2 hidden rounded-md bg-bg/90 px-2 py-1 text-center text-xs font-semibold group-focus-visible/card:block"
          >
            Espaço: {saved ? 'remover' : 'favoritar'}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <Heading className="line-clamp-2 font-semibold leading-snug">{movie.title}</Heading>
          <p className="mt-auto flex items-center justify-between gap-2 text-sm text-muted">
            <span>
              {year ? (
                <>
                  <span className="sr-only">Lançamento: </span>
                  {year}
                </>
              ) : (
                'Sem data'
              )}
            </span>
            <Rating value={movie.vote_average} count={movie.vote_count} />
          </p>
        </div>
      </Link>
      <span id={hintId} hidden>
        {saved ? 'Nos seus favoritos. Espaço remove.' : 'Espaço adiciona aos favoritos.'}
      </span>
      <div className="absolute right-2 top-2">
        <FavoriteButton ref={favoriteRef} tabIndex={-1} movie={movie} onToggle={onFavoriteToggle} />
      </div>
    </article>
  )
}
