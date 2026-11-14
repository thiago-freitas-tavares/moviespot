import { useId, useRef } from 'react'
import MovieCard from './MovieCard.jsx'
import { MovieCardSkeleton } from './MovieGrid.jsx'
import ErrorMessage from '../ui/ErrorMessage.jsx'
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/icons.jsx'
import { iconButtonClass } from '../ui/styles.js'

const skipButtonClass =
  'sr-only focus:not-sr-only focus:rounded-lg focus:bg-accent focus:px-3 focus:py-1 focus:text-sm focus:font-semibold focus:text-accent-fg'

/**
 * Faixa horizontal de filmes. Pelo teclado, o Tab percorre os cards e o navegador
 * rola a faixa sozinho; os botões de seta são um atalho extra para mouse/toque, e
 * "Lista anterior"/"Pular lista" evitam percorrer a faixa inteira.
 *
 * @param {boolean} [hasPrevious] há outra faixa antes desta (mostra o "Lista anterior")
 */
export default function MovieRow({ title, movies = [], status, error, onRetry, hasPrevious = false }) {
  const headingId = useId()
  const sectionRef = useRef(null)
  const listRef = useRef(null)
  const hasMovies = status === 'success' && movies.length > 0

  /*
    Nielsen #7 — cada faixa tem ~20 paradas de Tab (uma por filme). O foco vai para o
    botão equivalente da faixa vizinha, então Enter seguidos passam faixa por faixa.
    Depois da última faixa, vai para o rodapé.
  */
  const skipToNext = () => {
    const next = sectionRef.current?.nextElementSibling
    const target = next?.matches('[data-movie-row]')
      ? (next.querySelector('[data-skip="next"]') ?? next.querySelector('h2'))
      : document.querySelector('footer a')
    target?.focus()
  }

  const backToPrevious = () => {
    const previous = sectionRef.current?.previousElementSibling
    if (!previous?.matches('[data-movie-row]')) return
    ;(previous.querySelector('[data-skip]') ?? previous.querySelector('h2'))?.focus()
  }

  const scroll = (direction) => {
    const list = listRef.current
    if (!list) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollBy({ left: direction * list.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <section ref={sectionRef} data-movie-row aria-labelledby={headingId} className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        {/* Os botões ficam invisíveis até receber o foco pelo Tab, como o "Pular para o conteúdo principal". */}
        <div className="flex items-center gap-3">
          <h2 id={headingId} tabIndex={-1} className="text-xl font-bold sm:text-2xl">
            {title}
          </h2>
          {hasMovies && hasPrevious && (
            <button type="button" data-skip="previous" onClick={backToPrevious} className={skipButtonClass}>
              Lista anterior<span className="sr-only"> a “{title}”</span>
            </button>
          )}
          {hasMovies && (
            <button type="button" data-skip="next" onClick={skipToNext} className={skipButtonClass}>
              Pular lista<span className="sr-only"> “{title}”</span>
            </button>
          )}
        </div>
        {hasMovies && movies.length > 4 && (
          <div className="hidden gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label={`Rolar “${title}” para a esquerda`}
              className={`${iconButtonClass} border border-border`}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label={`Rolar “${title}” para a direita`}
              className={`${iconButtonClass} border border-border`}
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>

      {status === 'loading' && (
        <div role="status">
          <span className="sr-only">Carregando “{title}”…</span>
          <div className="flex gap-4 overflow-hidden" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="w-36 shrink-0 sm:w-44">
                <MovieCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'error' && <ErrorMessage error={error} onRetry={onRetry} />}

      {status === 'success' &&
        (hasMovies ? (
          /*
            A área com rolagem corta o que passa da borda: o respiro interno (compensado pela
            margem negativa) e o scroll-padding mantêm inteiro o contorno de foco dos cards (WCAG 2.4.7).
          */
          <ul
            ref={listRef}
            className="scrollbar-thin -mx-1.5 -mt-1.5 flex snap-x scroll-px-1.5 gap-4 overflow-x-auto px-1.5 pt-1.5 pb-3 motion-safe:scroll-smooth"
          >
            {movies.map((movie) => (
              <li key={movie.id} className="w-36 shrink-0 snap-start sm:w-44">
                <MovieCard movie={movie} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Nenhum filme disponível nesta lista no momento.</p>
        ))}
    </section>
  )
}
