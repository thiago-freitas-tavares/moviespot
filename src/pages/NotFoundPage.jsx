import { Link, useLocation } from 'react-router'
import { FilmIcon } from '../components/ui/icons.jsx'
import { buttonClass } from '../components/ui/styles.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFoundPage() {
  useDocumentTitle('Página não encontrada')
  const { pathname } = useLocation()

  return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <FilmIcon className="mx-auto mb-6 size-16 text-muted" />
      <p className="font-semibold text-accent-text">Erro 404</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Página não encontrada</h1>
      <p className="mt-4 text-muted">
        O endereço <code className="break-all rounded bg-surface-2 px-1.5 py-0.5">{pathname}</code> não existe ou foi
        removido. Confira se ele foi digitado corretamente ou siga por um dos caminhos abaixo.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClass('primary')}>
          Ir para o início
        </Link>
        <Link to="/" state={{ focusSearch: true }} className={buttonClass('secondary')}>
          Buscar um filme
        </Link>
      </div>
    </div>
  )
}
