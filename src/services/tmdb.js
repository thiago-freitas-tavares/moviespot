/**
 * Cliente da API do TMDB (The Movie Database) — https://developer.themoviedb.org/docs
 *
 * Centraliza autenticação, idioma, cache em memória e a conversão de falhas HTTP/rede
 * em erros com mensagens compreensíveis para o usuário (Nielsen #9).
 */

const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'
const LANGUAGE = 'pt-BR'
const REGION = 'BR'
const CACHE_TTL_MS = 5 * 60 * 1000

/** A API do TMDB não retorna páginas acima de 500. */
const MAX_API_PAGES = 500
/** O TMDB sempre devolve 20 filmes por página. */
const API_PAGE_SIZE = 20
/** Filmes por página de resultados no app: 24 preenche linhas inteiras de 2, 3, 4 ou 6 colunas. */
const RESULTS_PER_PAGE = 24

const TOKEN = import.meta.env.VITE_TMDB_TOKEN?.trim()
const API_KEY = import.meta.env.VITE_TMDB_API_KEY?.trim()

export const hasCredentials = Boolean(TOKEN || API_KEY)

class TmdbError extends Error {
  /**
   * @param {'config'|'auth'|'network'|'not-found'|'rate-limit'|'server'|'unknown'} kind
   * @param {string} message
   * @param {number} [status]
   */
  constructor(kind, message, status) {
    super(message)
    this.name = 'TmdbError'
    this.kind = kind
    this.status = status
  }
}

function errorFromStatus(status) {
  switch (status) {
    case 401:
      return new TmdbError('auth', 'A credencial de acesso ao TMDB é inválida ou expirou.', status)
    case 404:
      return new TmdbError('not-found', 'O conteúdo solicitado não foi encontrado.', status)
    case 429:
      return new TmdbError('rate-limit', 'Foram feitas muitas requisições em pouco tempo.', status)
    default:
      if (status >= 500) {
        return new TmdbError('server', 'O serviço do TMDB está instável no momento.', status)
      }
      return new TmdbError('unknown', `A requisição falhou (código ${status}).`, status)
  }
}

const cache = new Map()

async function request(path, params = {}, { signal } = {}) {
  if (!hasCredentials) {
    throw new TmdbError('config', 'Nenhuma credencial do TMDB foi configurada no arquivo .env.')
  }

  const url = new URL(BASE_URL + path)
  url.searchParams.set('language', LANGUAGE)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  const cacheKey = url.toString()
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
    return cached.data
  }

  if (!TOKEN) url.searchParams.set('api_key', API_KEY)

  let response
  try {
    response = await fetch(url, {
      signal,
      headers: {
        accept: 'application/json',
        ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
      },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new TmdbError(
      'network',
      navigator.onLine
        ? 'Não foi possível se comunicar com o servidor do TMDB.'
        : 'Você está sem conexão com a internet.',
    )
  }

  if (!response.ok) throw errorFromStatus(response.status)

  const data = await response.json()
  cache.set(cacheKey, { data, time: Date.now() })
  return data
}

const clampPage = (page) => Math.min(Math.max(1, Number(page) || 1), MAX_API_PAGES)

const uniqueById = (movies) => [...new Map(movies.map((m) => [m.id, m])).values()]

/** Listas paginadas: remove filmes repetidos (a API às vezes repete um título entre páginas). */
async function listRequest(path, params, options) {
  const data = await request(path, params, options)
  return { ...data, results: uniqueById(data.results ?? []) }
}

/**
 * Monta a página `page` do app (RESULTS_PER_PAGE filmes) a partir das páginas de 20 do TMDB:
 * busca as duas páginas da API que cobrem esse trecho e recorta. Assim só a última
 * página de resultados pode ter a última linha do grid incompleta.
 *
 * @param {(apiPage: number) => Promise<object>} fetchApiPage busca uma página da API
 */
async function paginate(fetchApiPage, page) {
  const current = Math.max(1, Number(page) || 1)
  const start = (current - 1) * RESULTS_PER_PAGE
  const firstApiPage = Math.floor(start / API_PAGE_SIZE) + 1
  const lastApiPage = Math.floor((start + RESULTS_PER_PAGE - 1) / API_PAGE_SIZE) + 1

  const [first, second] = await Promise.all([
    fetchApiPage(Math.min(firstApiPage, MAX_API_PAGES)),
    lastApiPage > firstApiPage && lastApiPage <= MAX_API_PAGES ? fetchApiPage(lastApiPage) : null,
  ])

  const available = Math.min(first.total_results, MAX_API_PAGES * API_PAGE_SIZE)
  const offset = start - (firstApiPage - 1) * API_PAGE_SIZE
  const movies = firstApiPage > MAX_API_PAGES ? [] : [...first.results, ...(second?.results ?? [])]

  return {
    page: current,
    total_pages: Math.ceil(available / RESULTS_PER_PAGE),
    total_results: first.total_results,
    results: uniqueById(movies.slice(offset, offset + RESULTS_PER_PAGE)),
  }
}

/* ---------- Endpoints ---------- */

export function getTrending(options) {
  return listRequest('/trending/movie/day', {}, options)
}

/** @param {'popular'|'top_rated'|'upcoming'|'now_playing'} list */
export function getMovieList(list, options) {
  return listRequest(`/movie/${list}`, { region: REGION }, options)
}

/** Com filtros, a busca por texto considera no máximo estas páginas da API. */
const SEARCH_WINDOW_PAGES = 5
export const SEARCH_WINDOW_RESULTS = SEARCH_WINDOW_PAGES * API_PAGE_SIZE
const MIN_VOTES_FOR_RATING_SORT = 50

const SEARCH_SORTERS = {
  'popularity.desc': (a, b) => b.popularity - a.popularity,
  // Filmes com poucos votos vão para o fim, senão uma nota 10 com 1 voto lideraria.
  'vote_average.desc': (a, b) =>
    (b.vote_count >= MIN_VOTES_FOR_RATING_SORT) - (a.vote_count >= MIN_VOTES_FOR_RATING_SORT) ||
    b.vote_average - a.vote_average,
  'primary_release_date.desc': (a, b) => (b.release_date ?? '').localeCompare(a.release_date ?? ''),
  'title.asc': (a, b) => a.title.localeCompare(b.title, 'pt-BR'),
}

function searchPage(query, year, page, options) {
  return request(
    '/search/movie',
    { query, primary_release_year: year, page: clampPage(page), include_adult: false },
    options,
  )
}

/**
 * Busca por texto combinada com filtros.
 *
 * O endpoint de busca do TMDB só aceita texto e ano. Sem gênero e na ordem de relevância,
 * seguimos a ordem da própria API. Com gênero ou outra ordenação, buscamos os resultados
 * mais relevantes (até SEARCH_WINDOW_PAGES páginas) e filtramos/ordenamos aqui.
 * `limited: true` indica que havia mais resultados do que os analisados.
 *
 * @param {{ query: string, genre?: string, year?: string, sort?: string, page?: number }} filters
 */
export async function searchMovies({ query, genre, year, sort = 'relevance', page = 1 }, options) {
  if (!genre && !SEARCH_SORTERS[sort]) {
    const data = await paginate((apiPage) => searchPage(query, year, apiPage, options), page)
    return { ...data, limited: false }
  }

  const first = await searchPage(query, year, 1, options)
  const lastPage = Math.min(first.total_pages, SEARCH_WINDOW_PAGES)
  const others = await Promise.all(
    Array.from({ length: Math.max(0, lastPage - 1) }, (_, i) => searchPage(query, year, i + 2, options)),
  )

  let movies = uniqueById([first, ...others].flatMap((data) => data.results))
  if (genre) movies = movies.filter((m) => m.genre_ids?.includes(Number(genre)))
  if (SEARCH_SORTERS[sort]) movies.sort(SEARCH_SORTERS[sort])

  const current = clampPage(page)
  return {
    page: current,
    total_pages: Math.ceil(movies.length / RESULTS_PER_PAGE),
    total_results: movies.length,
    results: movies.slice((current - 1) * RESULTS_PER_PAGE, current * RESULTS_PER_PAGE),
    limited: first.total_pages > SEARCH_WINDOW_PAGES,
  }
}

export function discoverMovies({ genre, sort = 'popularity.desc', year, page = 1 } = {}, options) {
  const params = {
    sort_by: sort,
    with_genres: genre,
    primary_release_year: year,
    include_adult: false,
    include_video: false,
  }

  // Evita que filmes com 1 ou 2 votos dominem a ordenação por nota.
  if (sort.startsWith('vote_average')) params['vote_count.gte'] = 300
  // Evita títulos ainda sem data definida (cadastrados para daqui a anos).
  if (sort.startsWith('primary_release_date')) {
    params['primary_release_date.lte'] = new Date().toISOString().slice(0, 10)
    params['vote_count.gte'] = 10
  }

  return paginate((apiPage) => request('/discover/movie', { ...params, page: apiPage }, options), page)
}

export function getMovieDetails(id, options) {
  return request(
    `/movie/${id}`,
    {
      append_to_response: 'credits,videos,recommendations,similar,release_dates',
      include_video_language: 'pt,en,null',
    },
    options,
  )
}

export async function getGenres(options) {
  const data = await request('/genre/movie/list', {}, options)
  return data.genres
}

/* ---------- Imagens ---------- */

/**
 * @param {string|null} path caminho retornado pela API (ex.: "/abc.jpg")
 * @param {string} size  w92 | w154 | w185 | w342 | w500 | w780 | w1280 | original
 */
export function imageUrl(path, size = 'w342') {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : null
}

export function posterSrcSet(path) {
  if (!path) return undefined
  return ['w185', 'w342', 'w500']
    .map((size) => `${imageUrl(path, size)} ${size.slice(1)}w`)
    .join(', ')
}

/* ---------- Helpers de dados ---------- */

/** Classificação indicativa brasileira (ex.: "14"), quando disponível. */
export function getBrazilianCertification(movie) {
  const br = movie.release_dates?.results?.find((r) => r.iso_3166_1 === 'BR')
  return br?.release_dates?.find((d) => d.certification)?.certification ?? null
}

/** Prefere trailer oficial em português, depois em inglês, depois qualquer vídeo do YouTube. */
export function pickTrailer(movie) {
  const videos = (movie.videos?.results ?? []).filter((v) => v.site === 'YouTube')
  const score = (v) =>
    (v.type === 'Trailer' ? 4 : v.type === 'Teaser' ? 2 : 0) +
    (v.iso_639_1 === 'pt' ? 2 : 0) +
    (v.official ? 1 : 0)
  return [...videos].sort((a, b) => score(b) - score(a))[0] ?? null
}
