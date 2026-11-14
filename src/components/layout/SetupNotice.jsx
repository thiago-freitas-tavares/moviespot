import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { AlertIcon } from '../ui/icons.jsx'
import { textLinkClass } from '../ui/styles.js'

const codeClass = 'rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm'

/** Exibido quando o .env não tem credencial: explica o problema e o passo a passo da solução. */
export default function SetupNotice() {
  useDocumentTitle('Configuração necessária')

  return (
    <section aria-labelledby="setup-titulo" className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 sm:p-10">
      <AlertIcon className="mb-4 size-10 text-accent-text" />
      <h1 id="setup-titulo" className="text-2xl font-bold sm:text-3xl">
        Configure o acesso ao TMDB
      </h1>
      <p className="mt-3 text-muted">
        Para carregar os filmes, o MovieSpot precisa de uma credencial gratuita da API do TMDB. Isso leva cerca de 2 minutos:
      </p>
      <ol className="mt-6 list-decimal space-y-3 pl-6 marker:font-bold marker:text-accent-text">
        <li>
          Crie uma conta em{' '}
          <a href="https://www.themoviedb.org/signup" className={textLinkClass}>
            themoviedb.org
          </a>{' '}
          e acesse <strong>Configurações → API</strong>.
        </li>
        <li>
          Copie o <strong>Token de leitura da API</strong> (começa com <code className={codeClass}>eyJ</code>).
        </li>
        <li>
          Na raiz do projeto, copie o arquivo <code className={codeClass}>.env.example</code> para{' '}
          <code className={codeClass}>.env</code> e cole o token em <code className={codeClass}>VITE_TMDB_TOKEN</code>.
        </li>
        <li>
          Reinicie o servidor com <code className={codeClass}>npm run dev</code>.
        </li>
      </ol>
    </section>
  )
}
