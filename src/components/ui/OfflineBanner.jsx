import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { WifiOffIcon } from './icons.jsx'

/** Nielsen #1 — avisa imediatamente quando a conexão cai, antes que as requisições falhem. */
export default function OfflineBanner() {
  const online = useOnlineStatus()

  return (
    <div role="status">
      {!online && (
        <div className="flex items-center justify-center gap-2 bg-danger px-4 py-2 text-center text-sm font-semibold text-danger-fg">
          <WifiOffIcon className="size-4 shrink-0" />
          Você está sem internet. Novos dados não serão carregados até a conexão voltar.
        </div>
      )}
    </div>
  )
}
