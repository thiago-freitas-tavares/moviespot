import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import MovieGrid, { MovieGridSkeleton } from '../components/movies/MovieGrid.jsx'
import MovieRow from '../components/movies/MovieRow.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import { AlertIcon, ArrowLeftIcon, ClockIcon, InfoIcon, SearchIcon, XIcon } from '../components/ui/icons.jsx'
import { buttonClass, fieldClass, labelClass } from '../components/ui/styles.js'
import { useAsync } from '../hooks/useAsync.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { usePreferences } from '../hooks/usePreferences.js'
import {
  SEARCH_WINDOW_RESULTS,
  discoverMovies,
  getGenres,
  getMovieList,
  getTrending,
  searchMovies,
} from '../services/tmdb.js'
import { pluralize } from '../utils/format.js'

const MIN_QUERY_LENGTH = 2
const MAX_RECENT = 6

// `only`: a ordenação só existe com texto ("text") ou só sem texto ("filters"),
// porque a busca do TMDB não informa bilheteria e "relevância" só faz sentido com texto.
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevância', only: 'text' },
  { value: 'popularity.desc', label: 'Mais populares' },
  { value: 'vote_average.desc', label: 'Mais bem avaliados' },
  { value: 'primary_release_date.desc', label: 'Lançamentos mais recentes' },
  { value: 'revenue.desc', label: 'Maior bilheteria', only: 'filters' },
  { value: 'title.asc', label: 'Título (A–Z)' },
]

const LAST_YEAR = new Date().getFullYear() + 1
const YEARS = Array.from({ length: LAST_YEAR - 1920 + 1 }, (_, i) => String(LAST_YEAR - i))

/** Copia os parâmetros da URL aplicando as mudanças; valor vazio remove o parâmetro. */
function withParams(current, changes) {
  const next = new URLSearchParams(current)
  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value)
    else next.delete(key)
  }
  return next
}

/**
 * Página inicial: busca e filtros no topo e, abaixo, as listas de filmes. Com busca ou
 * filtro, os resultados aparecem no lugar das listas (Nielsen #8: um único lugar para
 * encontrar filmes, em vez de duas páginas). Todo o estado (texto, gênero, ano, ordem,
 * página) fica na URL: dá para voltar, recarregar ou compartilhar o link (Nielsen #6).
 */
export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { shortcutsEnabled } = usePreferences()

  const query = (searchParams.get('q') ?? '').trim()
  const hasQuery = query.length >= MIN_QUERY_LENGTH
  const genre = searchParams.get('genero') ?? ''
  const year = YEARS.includes(searchParams.get('ano')) ? searchParams.get('ano') : ''
  const page = Number(searchParams.get('pagina')) || 1

  const isSortAvailable = (option) => option.only !== (hasQuery ? 'filters' : 'text')
  const chosenSort = SORT_OPTIONS.find((o) => o.value === searchParams.get('ordem') && isSortAvailable(o))
  const sort = chosenSort?.value ?? (hasQuery ? 'relevance' : 'popularity.desc')

  const hasActiveFilters = Boolean(genre || year || chosenSort)
  // Sem busca nem filtro, a página mostra as listas; com qualquer um deles, os resultados.
  const showResults = hasQuery || hasActiveFilters

  const [input, setInput] = useState(query)
  const [showLengthError, setShowLengthError] = useState(false)
  const [recent, setRecent] = useLocalStorage('moviespot:buscas-recentes', [])
  const debouncedInput = useDebounce(input.trim(), 500)
  // Último texto que o próprio campo enviou para a URL (para distinguir de voltar/avançar).
  const syncedQuery = useRef(query)

  const inputRef = useRef(null)
  const genreSelectRef = useRef(null)
  const resultsHeadingRef = useRef(null)
  const hintId = useId()
  const genreErrorId = useId()

  const genres = useAsync((signal) => getGenres({ signal }), [])
  const results = useAsync(
    (signal) => {
      if (!showResults) return Promise.resolve(null)
      return hasQuery
        ? searchMovies({ query, genre, year, sort, page }, { signal })
        : discoverMovies({ genre, year, sort, page }, { signal })
    },
    [showResults, hasQuery ? query : '', genre, year, sort, page],
  )

  const genreName = genres.data?.find((g) => String(g.id) === genre)?.name
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort).label

  useDocumentTitle(hasQuery ? `Busca: ${query}` : 'Início')

  // Chegou pelo atalho "/" ou por um link "Buscar um filme": o foco vai direto para o campo.
  // O pedido é apagado do histórico em seguida; senão um F5 focaria a busca de novo e o
  // primeiro Tab pularia o link "Pular para o conteúdo".
  useEffect(() => {
    if (!location.state?.focusSearch) return
    inputRef.current?.focus()
    navigate({ search: location.search }, { replace: true })
  }, [location.state, location.search, navigate])

  // URL → campo: mantém o campo coerente ao usar voltar/avançar ou abrir um link compartilhado.
  useEffect(() => {
    if (query === syncedQuery.current) return
    syncedQuery.current = query
    setInput(query)
  }, [query])

  // Campo → URL: busca enquanto digita, com debounce para não disparar uma requisição por tecla.
  useEffect(() => {
    const next = debouncedInput.length >= MIN_QUERY_LENGTH ? debouncedInput : ''
    if (next === syncedQuery.current) return
    syncedQuery.current = next
    setSearchParams((prev) => withParams(prev, { q: next, pagina: null }), { replace: true })
    // Reage só ao texto digitado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput])

  // Nielsen #6 — buscas recentes evitam que o usuário precise lembrar e redigitar termos.
  const saveRecent = (term) => {
    setRecent((list) =>
      [term, ...list.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT),
    )
  }

  const runSearch = (term) => {
    setInput(term)
    syncedQuery.current = term
    setSearchParams((prev) => withParams(prev, { q: term, pagina: null }))
    saveRecent(term)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const term = input.trim()
    // WCAG 3.3.1 — o erro é identificado em texto e associado ao campo.
    if (term.length < MIN_QUERY_LENGTH) {
      setShowLengthError(true)
      inputRef.current?.focus()
      return
    }
    runSearch(term)
  }

  // Esvazia o campo, aplica `changes` na URL e devolve o foco ao campo.
  const clearInput = (changes) => {
    setInput('')
    setShowLengthError(false)
    syncedQuery.current = ''
    setSearchParams((prev) => withParams(prev, changes), { replace: true })
    inputRef.current?.focus()
  }

  const handleClear = () => clearInput({ q: null, pagina: null })

  // Nielsen #3 — saída clara: limpa busca e filtros de uma vez e volta às listas.
  const showLists = () => clearInput({ q: null, genero: null, ano: null, ordem: null, pagina: null })

  // Trocar um filtro atualiza os resultados sem mudar de página nem mover o foco (WCAG 3.2.2).
  const updateFilter = (key, value) => {
    setSearchParams((prev) => withParams(prev, { [key]: value, pagina: null }), { replace: true })
  }

  const clearFilters = () => {
    setSearchParams((prev) => withParams(prev, { genero: null, ano: null, ordem: null, pagina: null }), {
      replace: true,
    })
    genreSelectRef.current?.focus()
  }

  // Ao trocar de página, o foco vai para o título dos resultados, e não fica perdido no rodapé.
  const goToPage = (nextPage) => {
    setSearchParams((prev) => withParams(prev, { pagina: String(nextPage) }))
    resultsHeadingRef.current?.focus({ preventScroll: true })
    resultsHeadingRef.current?.scrollIntoView()
  }

  const data = results.data
  const totalPages = data?.total_pages ?? 0
  const activeSummary = [genreName, year, sortLabel].filter(Boolean).join(' · ')
  const showLimitNote = hasQuery && data?.limited && (genre || sort !== 'relevance')

  let statusMessage = ''
  if (results.status === 'loading') statusMessage = hasQuery ? 'Buscando…' : 'Atualizando resultados…'
  if (results.status === 'success' && data) {
    statusMessage = pluralize(data.total_results, 'filme encontrado', 'filmes encontrados')
    if (hasQuery) statusMessage += ` para “${query}”`
    statusMessage += ` · ${activeSummary}`
    if (totalPages > 1) statusMessage += ` · página ${page} de ${totalPages}`
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Descubra seu próximo filme</h1>
        <p className="max-w-2xl text-muted">
          Busque pelo título, filtre por gênero e ano, ou navegue pelas listas abaixo.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
        {/* Sem botão "Buscar": os resultados aparecem enquanto o usuário digita. Enter continua
            funcionando (envio implícito do formulário) e salva o termo nas buscas recentes. */}
        <form role="search" onSubmit={handleSubmit} noValidate>
          <label htmlFor="campo-busca" className="mb-2 block font-semibold">
            Buscar por título
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <input
              ref={inputRef}
              id="campo-busca"
              type="search"
              value={input}
              onChange={(event) => {
                setInput(event.target.value)
                if (showLengthError) setShowLengthError(false)
              }}
              autoComplete="off"
              enterKeyHint="search"
              placeholder="Ex.: Cidade de Deus"
              aria-describedby={hintId}
              aria-invalid={showLengthError || undefined}
              aria-keyshortcuts={shortcutsEnabled ? '/' : undefined}
              className={`${fieldClass} min-h-12 pl-10 pr-12 text-lg ${showLengthError ? 'border-danger' : ''}`}
            />
            {input && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Limpar busca"
                className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-surface hover:text-fg"
              >
                <XIcon />
              </button>
            )}
          </div>
          <p
            id={hintId}
            className={`mt-2 flex items-center gap-1.5 text-sm ${showLengthError ? 'font-semibold text-danger' : 'text-muted'}`}
          >
            {showLengthError && <AlertIcon className="size-4 shrink-0" />}
            {showLengthError
              ? `Digite pelo menos ${MIN_QUERY_LENGTH} caracteres para buscar.`
              : `Os resultados aparecem enquanto você digita (mínimo de ${MIN_QUERY_LENGTH} caracteres).`}
          </p>
        </form>

        {!input && recent.length > 0 && (
          <section aria-labelledby="recentes-titulo" className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 id="recentes-titulo" className="text-sm font-semibold text-muted">
              Buscas recentes:
            </h2>
            <ul className="flex flex-wrap items-center gap-2">
              {recent.map((term) => (
                <li key={term} className="flex items-center rounded-full border border-border-strong">
                  <button
                    type="button"
                    onClick={() => runSearch(term)}
                    className="flex min-h-9 items-center gap-1.5 rounded-l-full pl-3 pr-1 text-sm hover:bg-surface-2"
                  >
                    <ClockIcon className="size-4 text-muted" />
                    {term}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecent((list) => list.filter((t) => t !== term))}
                    aria-label={`Remover “${term}” do histórico`}
                    className="grid size-9 place-items-center rounded-r-full text-muted hover:bg-surface-2 hover:text-fg"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => setRecent([])}
                  className="min-h-9 px-2 text-sm text-muted underline underline-offset-4 hover:text-fg"
                >
                  Limpar histórico
                </button>
              </li>
            </ul>
          </section>
        )}

        {/* A linha divisória agrupa os filtros visualmente; a legenda continua para leitores de tela. */}
        <fieldset className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2 sm:items-end md:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <legend className="sr-only">Filtros</legend>

          <div>
            <label htmlFor="filtro-genero" className={labelClass}>
              Gênero
            </label>
            <select
              ref={genreSelectRef}
              id="filtro-genero"
              value={genre}
              onChange={(event) => updateFilter('genero', event.target.value)}
              disabled={genres.status === 'loading'}
              aria-describedby={genres.status === 'error' ? genreErrorId : undefined}
              className={fieldClass}
            >
              <option value="">{genres.status === 'loading' ? 'Carregando gêneros…' : 'Todos os gêneros'}</option>
              {genres.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {genres.status === 'error' && (
              <p id={genreErrorId} className="mt-1.5 text-sm text-danger">
                Não foi possível carregar os gêneros.{' '}
                <button type="button" onClick={genres.retry} className="font-semibold underline underline-offset-4">
                  Tentar novamente
                </button>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="filtro-ano" className={labelClass}>
              Ano de lançamento
            </label>
            <select
              id="filtro-ano"
              value={year}
              onChange={(event) => updateFilter('ano', event.target.value)}
              className={fieldClass}
            >
              <option value="">Qualquer ano</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtro-ordem" className={labelClass}>
              Ordenar por
            </label>
            <select
              id="filtro-ordem"
              value={sort}
              onChange={(event) => updateFilter('ordem', event.target.value)}
              className={fieldClass}
            >
              {SORT_OPTIONS.filter((o) => o.only !== 'text' || hasQuery).map((option) => (
                <option key={option.value} value={option.value} disabled={!isSortAvailable(option)}>
                  {option.label}
                  {!isSortAvailable(option) && ' (indisponível na busca por texto)'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={buttonClass('ghost', 'md', 'justify-self-end md:col-span-3 lg:col-span-1')}
          >
            <XIcon className="size-4" />
            Limpar filtros
          </button>
        </fieldset>
      </div>

      {showResults ? (
        <section aria-labelledby="resultados-titulo" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div>
              <h2
                id="resultados-titulo"
                ref={resultsHeadingRef}
                tabIndex={-1}
                className="scroll-mt-24 text-xl font-bold sm:text-2xl"
              >
                {hasQuery ? `Resultados para “${query}”` : 'Resultados'}
              </h2>
              {/* WCAG 4.1.3 — quantidade de resultados anunciada sem tirar o foco do campo. */}
              <p role="status" className="text-muted">
                {statusMessage}
              </p>
            </div>
            <button type="button" onClick={showLists} className={buttonClass('secondary', 'sm')}>
              <ArrowLeftIcon className="size-4" />
              Voltar para as listas
            </button>
          </div>

          {/* Nielsen #1 — deixa claro quando a combinação texto + filtros analisou só parte dos resultados. */}
          {showLimitNote && (
            <p className="flex items-start gap-2 text-sm text-muted">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-accent-text" />
              Gênero e ordenação foram aplicados aos {SEARCH_WINDOW_RESULTS} resultados mais relevantes para “{query}”.
              Se não encontrar o filme, deixe o texto da busca mais específico.
            </p>
          )}

          {results.status === 'loading' && <MovieGridSkeleton label={hasQuery ? 'Buscando filmes…' : undefined} />}

          {results.status === 'error' && <ErrorMessage error={results.error} onRetry={results.retry} />}

          {results.status === 'success' && data && data.results.length === 0 && data.total_results > 0 && (
            <EmptyState
              title="Esta página de resultados não existe"
              actions={
                <button type="button" onClick={() => goToPage(1)} className={buttonClass('primary')}>
                  Ir para a página 1
                </button>
              }
            >
              Há {totalPages} {totalPages === 1 ? 'página' : 'páginas'} de resultados para esta busca.
            </EmptyState>
          )}

          {results.status === 'success' && data && data.total_results === 0 && (
            <EmptyState
              icon={SearchIcon}
              title={hasQuery ? `Nenhum filme encontrado para “${query}”` : 'Nenhum filme corresponde a esses filtros'}
              actions={
                <>
                  {hasActiveFilters && (
                    <button type="button" onClick={clearFilters} className={buttonClass('primary')}>
                      Limpar filtros
                    </button>
                  )}
                  {hasQuery && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className={buttonClass(hasActiveFilters ? 'secondary' : 'primary')}
                    >
                      Limpar busca
                    </button>
                  )}
                </>
              }
            >
              {hasQuery ? (
                <ul className="list-inside list-disc text-left">
                  {(genre || year) && <li>Remova o filtro de gênero ou de ano.</li>}
                  <li>Confira a ortografia das palavras.</li>
                  <li>Tente o título original (em inglês, por exemplo).</li>
                  <li>Use menos palavras, como só uma parte do título.</li>
                </ul>
              ) : (
                'Tente outro ano ou gênero, ou remova algum filtro.'
              )}
            </EmptyState>
          )}

          {results.status === 'success' && data && data.results.length > 0 && (
            <>
              <MovieGrid
                movies={data.results}
                label={hasQuery ? `Resultados para “${query}”` : `Filmes: ${activeSummary}`}
                onNavigate={hasQuery ? () => saveRecent(query) : undefined}
              />
              <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
            </>
          )}
        </section>
      ) : (
        <MovieLists />
      )}
    </div>
  )
}

const rowProps = (request) => ({
  movies: request.data?.results,
  status: request.status,
  error: request.error,
  onRetry: request.retry,
})

/** Listas exibidas enquanto não há busca nem filtro. Cada uma carrega (e falha) de forma independente. */
function MovieLists() {
  const trending = useAsync((signal) => getTrending({ signal }), [])
  const nowPlaying = useAsync((signal) => getMovieList('now_playing', { signal }), [])
  const popular = useAsync((signal) => getMovieList('popular', { signal }), [])
  const topRated = useAsync((signal) => getMovieList('top_rated', { signal }), [])
  const upcoming = useAsync((signal) => getMovieList('upcoming', { signal }), [])

  const lists = [
    ['Em alta hoje', trending],
    ['Nos cinemas', nowPlaying],
    ['Populares', popular],
    ['Mais bem avaliados', topRated],
    ['Em breve', upcoming],
  ]

  return (
    <div className="space-y-12">
      {lists.map(([title, request], index) => (
        <MovieRow key={title} title={title} hasPrevious={index > 0} {...rowProps(request)} />
      ))}
    </div>
  )
}
