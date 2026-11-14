import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { FavoritesContext } from './contexts.js'
import { useAsync } from '../hooks/useAsync.js'
import { useToast } from '../hooks/useToast.js'
import { deleteAllFavorites, deleteFavorite, getFavorites, saveFavorites } from '../services/favorites.js'
import { pluralize } from '../utils/format.js'

// Guarda só o necessário para exibir o card sem depender da API do TMDB.
function toFavorite(movie) {
  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path ?? null,
    release_date: movie.release_date ?? '',
    vote_average: movie.vote_average ?? 0,
    vote_count: movie.vote_count ?? 0,
    addedAt: Date.now(),
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return state.some((m) => m.id === action.movie.id) ? state : [action.movie, ...state]
    case 'remove':
      return state.filter((m) => m.id !== action.id)
    case 'replace':
      return action.favorites
    default:
      return state
  }
}

/** Favoritos guardados no banco SQLite, pela API em server/index.js. */
export default function FavoritesProvider({ children }) {
  const [favorites, dispatch] = useReducer(reducer, [])
  const initial = useAsync((signal) => getFavorites({ signal }), [])
  const { showToast } = useToast()

  useEffect(() => {
    if (initial.data) dispatch({ type: 'replace', favorites: initial.data })
  }, [initial.data])

  // A lista pode ter mudado em outra aba ou outro navegador: atualiza ao voltar para esta aba.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      getFavorites()
        .then((list) => dispatch({ type: 'replace', favorites: list }))
        .catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  /*
    Atualização otimista: a tela muda na hora e o banco é gravado em seguida.
    Se o servidor falhar, a mudança é desfeita e o usuário é avisado (Nielsen #1 e #9).
  */
  const persist = useCallback(
    (request, rollback) => {
      request().catch(() => {
        rollback()
        showToast({ message: 'Não foi possível salvar no servidor de favoritos. Tente novamente.' })
      })
    },
    [showToast],
  )

  const add = useCallback(
    (favorite) => {
      dispatch({ type: 'add', movie: favorite })
      persist(() => saveFavorites(favorite), () => dispatch({ type: 'remove', id: favorite.id }))
    },
    [persist],
  )

  const remove = useCallback(
    (favorite) => {
      dispatch({ type: 'remove', id: favorite.id })
      persist(() => deleteFavorite(favorite.id), () => dispatch({ type: 'add', movie: favorite }))
    },
    [persist],
  )

  const isFavorite = useCallback((id) => favorites.some((m) => m.id === id), [favorites])

  /** Alterna o filme na lista. Retorna `true` se ele foi adicionado. */
  const toggleFavorite = useCallback(
    (movie) => {
      const existing = favorites.find((m) => m.id === movie.id)

      // Nielsen #3 — toda ação pode ser desfeita pela própria notificação.
      if (existing) {
        remove(existing)
        showToast({
          message: `“${movie.title}” foi removido dos favoritos.`,
          action: { label: 'Desfazer', onClick: () => add(existing) },
        })
        return false
      }

      const favorite = toFavorite(movie)
      add(favorite)
      showToast({
        message: `“${movie.title}” foi adicionado aos favoritos.`,
        tone: 'success',
        action: { label: 'Desfazer', onClick: () => remove(favorite) },
      })
      return true
    },
    [favorites, add, remove, showToast],
  )

  const clearFavorites = useCallback(() => {
    const snapshot = favorites
    const restore = () => {
      dispatch({ type: 'replace', favorites: snapshot })
      persist(() => saveFavorites(snapshot), () => dispatch({ type: 'replace', favorites: [] }))
    }

    dispatch({ type: 'replace', favorites: [] })
    persist(deleteAllFavorites, () => dispatch({ type: 'replace', favorites: snapshot }))
    showToast({
      message: `${pluralize(snapshot.length, 'filme removido', 'filmes removidos')} dos favoritos.`,
      action: { label: 'Desfazer', onClick: restore },
    })
  }, [favorites, persist, showToast])

  const value = useMemo(
    () => ({
      favorites,
      status: initial.status,
      error: initial.error,
      retry: initial.retry,
      isFavorite,
      toggleFavorite,
      clearFavorites,
    }),
    [favorites, initial.status, initial.error, initial.retry, isFavorite, toggleFavorite, clearFavorites],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
