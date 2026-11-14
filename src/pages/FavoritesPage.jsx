import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import MovieGrid, { MovieGridSkeleton } from '../components/movies/MovieGrid.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import { HeartIcon, TrashIcon } from '../components/ui/icons.jsx'
import { buttonClass, fieldClass, labelClass } from '../components/ui/styles.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useFavorites } from '../hooks/useFavorites.js'
import { pluralize } from '../utils/format.js'

const SORTS = {
  recentes: {
    label: 'Adicionados recentemente',
    compare: (a, b) => b.addedAt - a.addedAt,
  },
  titulo: {
    label: 'Título (A–Z)',
    compare: (a, b) => a.title.localeCompare(b.title, 'pt-BR'),
  },
  nota: {
    label: 'Melhor avaliados',
    compare: (a, b) => b.vote_average - a.vote_average,
  },
  lancamento: {
    label: 'Lançamento mais recente',
    compare: (a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''),
  },
}

export default function FavoritesPage() {
  useDocumentTitle('Meus favoritos')
  const { favorites, status, error, retry, clearFavorites } = useFavorites()
  const [searchParams, setSearchParams] = useSearchParams()
  const sort = SORTS[searchParams.get('ordem')] ? searchParams.get('ordem') : 'recentes'
  const [confirmOpen, setConfirmOpen] = useState(false)

  const headingRef = useRef(null)
  const listRef = useRef(null)
  const pendingFocusIndex = useRef(null)

  const sorted = useMemo(() => [...favorites].sort(SORTS[sort].compare), [favorites, sort])

  /*
    WCAG 2.4.3 — ao remover um card, o elemento focado desaparece junto. Para o usuário de
    teclado não "cair" no topo da página, o foco vai para o próximo card (ou o anterior,
    se era o último), ou para o título se a lista esvaziou.
  */
  useEffect(() => {
    if (pendingFocusIndex.current === null) return
    const cards = listRef.current?.querySelectorAll('[data-card-link]') ?? []
    const index = Math.min(pendingFocusIndex.current, cards.length - 1)
    pendingFocusIndex.current = null
    if (index >= 0) cards[index].focus()
    else headingRef.current?.focus()
  }, [favorites])

  const handleFavoriteToggle = (_movie, index, added) => {
    if (!added) pendingFocusIndex.current = index
  }

  const handleConfirmClear = () => {
    clearFavorites()
    setConfirmOpen(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-extrabold sm:text-4xl">
            Meus favoritos
          </h1>
          <p className="text-muted">
            {status === 'loading'
              ? 'Carregando sua lista…'
              : status === 'error'
                ? 'Não foi possível carregar sua lista.'
                : favorites.length > 0
                  ? `${pluralize(favorites.length, 'filme salvo', 'filmes salvos')}.`
                  : 'Os filmes que você salvar aparecem aqui.'}
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="ordem-favoritos" className={labelClass}>
                Ordenar por
              </label>
              <select
                id="ordem-favoritos"
                value={sort}
                onChange={(event) => setSearchParams({ ordem: event.target.value }, { replace: true })}
                className={fieldClass}
              >
                {Object.entries(SORTS).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => setConfirmOpen(true)} aria-haspopup="dialog" className={buttonClass('secondary')}>
              <TrashIcon className="size-4" />
              Limpar lista
            </button>
          </div>
        )}
      </div>

      {status === 'loading' ? (
        <MovieGridSkeleton label="Carregando favoritos…" />
      ) : status === 'error' ? (
        <ErrorMessage error={error} onRetry={retry} />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={HeartIcon}
          title="Sua lista de favoritos está vazia"
          actions={
            <>
              <Link to="/" className={buttonClass('primary')}>
                Ver filmes em alta
              </Link>
              <Link to="/" state={{ focusSearch: true }} className={buttonClass('secondary')}>
                Buscar um filme
              </Link>
            </>
          }
        >
          Toque no ícone de coração em qualquer filme para salvá-lo aqui.
        </EmptyState>
      ) : (
        <div ref={listRef}>
          <MovieGrid
            movies={sorted}
            label="Filmes favoritos"
            headingLevel={2}
            onFavoriteToggle={handleFavoriteToggle}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Limpar todos os favoritos?"
        description={`${pluralize(favorites.length, 'filme será removido', 'filmes serão removidos')} da sua lista. Você ainda poderá desfazer pela notificação logo em seguida.`}
        confirmLabel="Remover todos"
        onConfirm={handleConfirmClear}
        onCancel={() => setConfirmOpen(false)}
        fallbackFocusRef={headingRef}
      />
    </div>
  )
}
