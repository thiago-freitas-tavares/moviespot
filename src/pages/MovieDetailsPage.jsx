import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import CertificationBadge from '../components/movies/CertificationBadge.jsx'
import FavoriteButton from '../components/movies/FavoriteButton.jsx'
import MovieRow from '../components/movies/MovieRow.jsx'
import Poster from '../components/movies/Poster.jsx'
import Rating from '../components/movies/Rating.jsx'
import TrailerDialog from '../components/movies/TrailerDialog.jsx'
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import { ArrowLeftIcon, PlayIcon, UserIcon } from '../components/ui/icons.jsx'
import { buttonClass } from '../components/ui/styles.js'
import { useAsync } from '../hooks/useAsync.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getBrazilianCertification, getMovieDetails, imageUrl, pickTrailer } from '../services/tmdb.js'
import {
  formatCurrency,
  formatDate,
  formatLanguage,
  formatMovieStatus,
  formatNumber,
  formatRuntime,
  formatYear,
} from '../utils/format.js'

export default function MovieDetailsPage() {
  const { id } = useParams()
  // A key reinicia o estado (ex.: diálogo do trailer) ao navegar de um filme para outro.
  return <MovieDetails key={id} id={id} />
}

function MovieDetails({ id }) {
  const navigate = useNavigate()
  const location = useLocation()
  const movie = useAsync((signal) => getMovieDetails(id, { signal }), [id])

  const title = movie.data?.title
  useDocumentTitle(
    movie.status === 'success' ? title : movie.status === 'error' ? 'Filme indisponível' : 'Carregando filme',
  )

  // Nielsen #3 — "Voltar" retorna para onde o usuário estava (busca, filtros, página…);
  // se ele chegou por um link direto, vai para o início.
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/'))

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Breadcrumbs
          items={[
            { label: 'Início', to: '/' },
            { label: title ?? 'Carregando…' },
          ]}
        />
        <button type="button" onClick={goBack} className={buttonClass('ghost', 'sm')}>
          <ArrowLeftIcon className="size-4" />
          Voltar
        </button>
      </div>

      {movie.status === 'loading' && <DetailsSkeleton />}

      {movie.status === 'error' && (
        <>
          <h1 className="text-3xl font-extrabold">Não foi possível exibir este filme</h1>
          <ErrorMessage error={movie.error} onRetry={movie.retry}>
            <Link to="/" state={{ focusSearch: true }} className={buttonClass('secondary', 'sm')}>
              Buscar outro filme
            </Link>
          </ErrorMessage>
        </>
      )}

      {movie.status === 'success' && <MovieContent movie={movie.data} />}
    </div>
  )
}

function MovieContent({ movie }) {
  const [trailerOpen, setTrailerOpen] = useState(false)

  const trailer = pickTrailer(movie)
  const certification = getBrazilianCertification(movie)
  const year = formatYear(movie.release_date)
  const crew = movie.credits?.crew ?? []
  const directors = crew.filter((p) => p.job === 'Director').map((p) => p.name)
  const writers = [...new Set(crew.filter((p) => p.department === 'Writing').map((p) => p.name))].slice(0, 3)
  const cast = (movie.credits?.cast ?? []).slice(0, 12)
  const related = movie.recommendations?.results?.length
    ? movie.recommendations.results
    : (movie.similar?.results ?? [])

  const facts = [
    ['Direção', directors.join(', ')],
    ['Roteiro', writers.join(', ')],
    ['Idioma original', formatLanguage(movie.original_language)],
    ['Situação', formatMovieStatus(movie.status)],
    ['Orçamento', formatCurrency(movie.budget)],
    ['Bilheteria', formatCurrency(movie.revenue)],
  ].filter(([, value]) => value)

  return (
    <>
      <section className="relative isolate overflow-hidden rounded-2xl border border-border bg-surface">
        {movie.backdrop_path && (
          <img
            src={imageUrl(movie.backdrop_path, 'w1280')}
            alt=""
            className="absolute inset-0 -z-20 size-full object-cover opacity-40"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-bg via-bg/95 to-bg/80" />

        <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,16rem)_1fr]">
          <div className="mx-auto w-48 sm:w-60 md:w-full">
            <Poster
              path={movie.poster_path}
              alt={`Pôster do filme “${movie.title}”`}
              size="w500"
              sizes="(min-width: 768px) 256px, 240px"
              priority
              className="rounded-xl shadow-2xl"
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                {movie.title} {year && <span className="font-normal text-muted">({year})</span>}
              </h1>
              {movie.original_title !== movie.title && (
                <p className="text-muted">
                  Título original:{' '}
                  {/* WCAG 3.1.2 — informa o idioma do trecho para a pronúncia correta no leitor de tela. */}
                  <span lang={movie.original_language}>{movie.original_title}</span>
                </p>
              )}
              {movie.tagline && <p className="text-lg italic text-muted">“{movie.tagline}”</p>}
            </div>

            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Informações rápidas">
              {certification && (
                <li>
                  <CertificationBadge value={certification} />
                </li>
              )}
              <li>
                <span className="sr-only">Lançamento: </span>
                <time dateTime={movie.release_date}>{formatDate(movie.release_date)}</time>
              </li>
              {movie.runtime > 0 && (
                <li>
                  <span className="sr-only">Duração: </span>
                  {formatRuntime(movie.runtime)}
                </li>
              )}
              <li className="flex items-center gap-2">
                <Rating value={movie.vote_average} count={movie.vote_count} />
                {movie.vote_count > 0 && (
                  <span className="text-sm text-muted">({formatNumber(movie.vote_count)} votos)</span>
                )}
              </li>
            </ul>

            {movie.genres?.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Gêneros">
                {movie.genres.map((genre) => (
                  <li key={genre.id}>
                    <Link
                      to={`/?genero=${genre.id}`}
                      className="inline-flex min-h-9 items-center rounded-full border border-border-strong px-3 text-sm font-medium hover:bg-surface-2"
                    >
                      {genre.name}
                      <span className="sr-only"> — ver mais filmes deste gênero</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <h2 className="text-lg font-bold">Sinopse</h2>
              <p className="mt-2 max-w-prose leading-relaxed">
                {movie.overview || 'A sinopse deste filme ainda não está disponível em português.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {trailer ? (
                <button
                  type="button"
                  onClick={() => setTrailerOpen(true)}
                  aria-haspopup="dialog"
                  className={buttonClass('primary', 'lg')}
                >
                  <PlayIcon className="size-5" />
                  Assistir trailer
                </button>
              ) : (
                <p className="text-sm text-muted">Nenhum trailer disponível para este filme.</p>
              )}
              <FavoriteButton movie={movie} variant="full" />
            </div>

            {facts.length > 0 && (
              <dl className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-3">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sm text-muted">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      {cast.length > 0 && (
        <section aria-labelledby="elenco-titulo" className="space-y-4">
          <h2 id="elenco-titulo" className="text-xl font-bold sm:text-2xl">
            Elenco principal
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {cast.map((person) => (
              <li key={person.credit_id} className="overflow-hidden rounded-xl border border-border bg-surface">
                {person.profile_path ? (
                  <img
                    src={imageUrl(person.profile_path, 'w185')}
                    alt=""
                    width={185}
                    height={278}
                    loading="lazy"
                    className="aspect-2/3 w-full bg-surface-2 object-cover"
                  />
                ) : (
                  <div className="flex aspect-2/3 items-center justify-center bg-surface-2 text-muted">
                    <UserIcon className="size-10" />
                  </div>
                )}
                <div className="p-3">
                  <p className="font-semibold leading-snug">{person.name}</p>
                  {person.character && (
                    <p className="text-sm text-muted">
                      <span className="sr-only">como </span>
                      {person.character}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && <MovieRow title="Você também pode gostar" movies={related} status="success" />}

      {trailer && (
        <TrailerDialog
          open={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          video={trailer}
          movieTitle={movie.title}
        />
      )}
    </>
  )
}

function DetailsSkeleton() {
  const block = 'rounded bg-surface-2 motion-safe:animate-pulse'
  return (
    <div role="status" className="rounded-2xl border border-border bg-surface p-6 sm:p-10">
      <span className="sr-only">Carregando detalhes do filme…</span>
      <div aria-hidden="true" className="grid gap-8 md:grid-cols-[minmax(0,16rem)_1fr]">
        <div className={`mx-auto aspect-2/3 w-48 rounded-xl sm:w-60 md:w-full ${block}`} />
        <div className="space-y-5">
          <div className={`h-10 w-2/3 ${block}`} />
          <div className={`h-5 w-1/2 ${block}`} />
          <div className="flex gap-2">
            <div className={`h-9 w-20 rounded-full ${block}`} />
            <div className={`h-9 w-24 rounded-full ${block}`} />
          </div>
          <div className={`h-28 w-full ${block}`} />
          <div className="flex gap-3">
            <div className={`h-12 w-44 rounded-lg ${block}`} />
            <div className={`h-12 w-56 rounded-lg ${block}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
