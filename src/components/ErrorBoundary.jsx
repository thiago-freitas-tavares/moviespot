import { Component } from 'react'
import { AlertIcon } from './ui/icons.jsx'
import { buttonClass } from './ui/styles.js'

/**
 * Captura erros de renderização (inclusive falha ao baixar o código de uma rota)
 * e mostra uma saída clara em vez de uma tela em branco (Nielsen #9).
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Erro não tratado na interface:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-danger/60 bg-danger/10 p-8 text-center">
        <AlertIcon className="mx-auto mb-4 size-12 text-danger" />
        <h1 className="text-2xl font-bold">Algo deu errado nesta página</h1>
        <p className="mt-3 text-muted">
          Um erro inesperado impediu a exibição do conteúdo. Seus favoritos continuam salvos. Tente novamente ou
          recarregue a página.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => this.setState({ error: null })} className={buttonClass('primary')}>
            Tentar novamente
          </button>
          <button type="button" onClick={() => window.location.reload()} className={buttonClass('secondary')}>
            Recarregar página
          </button>
        </div>
      </div>
    )
  }
}
