import { AlertIcon } from './icons.jsx'
import { buttonClass } from './styles.js'

// Nielsen #9 — cada tipo de falha recebe um título em linguagem simples e uma
// orientação de como resolver, em vez de códigos técnicos.
const COPY = {
  network: {
    title: 'Sem conexão',
    hint: 'Verifique sua internet e tente novamente.',
  },
  'rate-limit': {
    title: 'Muitas requisições',
    hint: 'Aguarde alguns segundos e tente novamente.',
  },
  server: {
    title: 'Serviço temporariamente indisponível',
    hint: 'O problema não está no seu dispositivo. Tente novamente em instantes.',
  },
  auth: {
    title: 'Falha de autenticação',
    hint: 'Confira a credencial no arquivo .env e reinicie o servidor de desenvolvimento.',
  },
  config: {
    title: 'Configuração necessária',
    hint: 'Defina VITE_TMDB_TOKEN ou VITE_TMDB_API_KEY no arquivo .env.',
  },
  'not-found': {
    title: 'Conteúdo não encontrado',
    hint: 'O endereço pode estar incorreto ou o conteúdo foi removido do catálogo.',
  },
  favorites: {
    title: 'Favoritos indisponíveis',
    hint: 'Confira se o servidor está rodando (npm run dev inicia o site e o servidor) e tente novamente.',
  },
  unknown: {
    title: 'Algo deu errado',
    hint: 'Tente novamente. Se o problema continuar, volte mais tarde.',
  },
}

const RETRYABLE = new Set(['network', 'rate-limit', 'server', 'favorites', 'unknown'])

export default function ErrorMessage({ error, onRetry, children }) {
  // Erros do TMDB e do servidor de favoritos trazem `kind`; os demais são "unknown".
  const kind = COPY[error?.kind] ? error.kind : 'unknown'
  const copy = COPY[kind]
  const detail = error?.kind ? error.message : 'Ocorreu um erro inesperado.'

  return (
    <div role="alert" className="rounded-xl border border-danger/60 bg-danger/10 p-5">
      <div className="flex gap-3">
        <AlertIcon className="mt-0.5 size-6 shrink-0 text-danger" />
        <div className="space-y-2">
          <p className="font-semibold">{copy.title}</p>
          <p className="text-muted">
            {detail} {copy.hint}
          </p>
          {(onRetry && RETRYABLE.has(kind)) || children ? (
            <div className="flex flex-wrap gap-3 pt-2">
              {onRetry && RETRYABLE.has(kind) && (
                <button type="button" onClick={onRetry} className={buttonClass('primary', 'sm')}>
                  Tentar novamente
                </button>
              )}
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
