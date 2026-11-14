import { useFavorites } from '../../hooks/useFavorites.js'
import { HeartIcon } from '../ui/icons.jsx'
import { buttonClass } from '../ui/styles.js'

/**
 * Estado favorito indicado por forma (coração cheio × vazado) e por texto/rótulo,
 * não apenas pela cor (WCAG 1.4.1). O resultado é confirmado por notificação (Nielsen #1).
 *
 * @param {'icon'|'full'} variant  "icon" para cards, "full" com texto visível.
 * @param {(added: boolean) => void} [onToggle]
 * @param {number} [tabIndex] -1 nos cards, onde o Espaço sobre o card faz o mesmo que este botão.
 */
export default function FavoriteButton({ movie, variant = 'icon', onToggle, ref, tabIndex }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const active = isFavorite(movie.id)

  const handleClick = () => {
    const added = toggleFavorite(movie)
    onToggle?.(added)
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={buttonClass('secondary', 'lg')}
      >
        <HeartIcon filled={active} className={`size-5 ${active ? 'text-danger' : ''}`} />
        {active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      </button>
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      tabIndex={tabIndex}
      aria-label={active ? `Remover “${movie.title}” dos favoritos` : `Adicionar “${movie.title}” aos favoritos`}
      className="grid size-11 place-items-center rounded-full bg-bg/85 text-fg shadow-md ring-1 ring-border-strong backdrop-blur transition-colors hover:bg-bg"
    >
      <HeartIcon filled={active} className={`size-5 ${active ? 'text-danger' : ''}`} />
    </button>
  )
}
