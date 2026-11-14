import { useState } from 'react'
import { imageUrl, posterSrcSet } from '../../services/tmdb.js'
import { FilmIcon } from '../ui/icons.jsx'

/**
 * Pôster com imagem responsiva (srcset) e fallback quando o TMDB não tem imagem
 * ou ela falha ao carregar.
 *
 * `alt` vazio = imagem decorativa (o título já aparece ao lado, ex.: nos cards).
 */
export default function Poster({ path, alt = '', size = 'w342', sizes, priority = false, className = '' }) {
  const [failedPath, setFailedPath] = useState(null)

  if (!path || failedPath === path) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        className={`flex aspect-2/3 w-full items-center justify-center bg-surface-2 text-muted ${className}`}
      >
        <FilmIcon className="size-10" />
      </div>
    )
  }

  return (
    <img
      src={imageUrl(path, size)}
      srcSet={posterSrcSet(path)}
      sizes={sizes}
      alt={alt}
      width={342}
      height={513}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailedPath(path)}
      className={`aspect-2/3 w-full bg-surface-2 object-cover ${className}`}
    />
  )
}
