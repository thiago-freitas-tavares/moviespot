import Dialog from '../ui/Dialog.jsx'
import { ExternalLinkIcon } from '../ui/icons.jsx'
import { textLinkClass } from '../ui/styles.js'

/**
 * O vídeo só começa depois de o usuário pedir (WCAG 1.4.2) e já abre com
 * legendas ativadas quando o YouTube as oferece (WCAG 1.2.2).
 * O iframe só existe enquanto o diálogo está aberto, então o áudio para ao fechar.
 */
export default function TrailerDialog({ open, onClose, video, movieTitle }) {
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    cc_load_policy: '1',
    cc_lang_pref: 'pt',
    hl: 'pt-BR',
  })

  return (
    <Dialog open={open} onClose={onClose} title={`Trailer de “${movieTitle}”`} size="xl">
      {open && (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.key}?${params}`}
            title={`Player de vídeo do YouTube: ${video.name}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="size-full"
          />
        </div>
      )}
      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
        <span>Use o botão “CC” do player para ligar ou desligar as legendas.</span>
        <a
          href={`https://www.youtube.com/watch?v=${video.key}`}
          target="_blank"
          rel="noreferrer"
          className={`${textLinkClass} inline-flex items-center gap-1`}
        >
          Abrir no YouTube
          <ExternalLinkIcon className="size-4" />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </p>
    </Dialog>
  )
}
