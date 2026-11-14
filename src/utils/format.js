// Formatação no padrão brasileiro (Nielsen #2 — correspondência com o mundo real).

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const numberFormatter = new Intl.NumberFormat('pt-BR')
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const languageNames = new Intl.DisplayNames(['pt-BR'], { type: 'language' })

export function formatYear(date) {
  return date ? date.slice(0, 4) : ''
}

export function formatDate(date) {
  if (!date) return 'Data não informada'
  return dateFormatter.format(new Date(`${date}T00:00:00Z`))
}

/** 136 → "2h 16min" */
export function formatRuntime(minutes) {
  if (!minutes) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest}min`
  return rest ? `${hours}h ${rest}min` : `${hours}h`
}

/** 7.456 → "7,5" */
export function formatRating(value) {
  return (value ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

export function formatNumber(value) {
  return numberFormatter.format(value ?? 0)
}

/** Valores de orçamento/bilheteria do TMDB são em dólar. */
export function formatCurrency(value) {
  return value ? currencyFormatter.format(value) : null
}

/** "en" → "Inglês" */
export function formatLanguage(code) {
  if (!code) return null
  try {
    const name = languageNames.of(code)
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return code
  }
}

/** pluralize(1, 'filme', 'filmes') → "1 filme" */
export function pluralize(count, singular, plural) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`
}

const MOVIE_STATUS = {
  Released: 'Lançado',
  'Post Production': 'Em pós-produção',
  'In Production': 'Em produção',
  Planned: 'Planejado',
  Rumored: 'Anunciado (rumor)',
  Canceled: 'Cancelado',
}

export function formatMovieStatus(status) {
  return MOVIE_STATUS[status] ?? status
}
