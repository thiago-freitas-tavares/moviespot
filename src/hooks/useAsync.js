import { useCallback, useEffect, useState } from 'react'

/**
 * Executa `asyncFn(signal)` sempre que `deps` mudar e expõe o ciclo
 * loading → success | error, além de `retry()` para nova tentativa.
 *
 * A requisição anterior é cancelada (AbortController) quando as dependências
 * mudam ou o componente desmonta, evitando condições de corrida — por exemplo,
 * a resposta de uma busca antiga sobrescrever a de uma busca mais nova.
 */
export function useAsync(asyncFn, deps) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading', data: null, error: null })

    asyncFn(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data, error: null })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ status: 'error', data: null, error })
      })

    return () => controller.abort()
    // `asyncFn` é recriada a cada render; as dependências reais vêm em `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return { ...state, retry }
}
