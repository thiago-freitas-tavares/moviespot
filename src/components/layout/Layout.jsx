import { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import SetupNotice from './SetupNotice.jsx'
import SkipLink from '../ui/SkipLink.jsx'
import OfflineBanner from '../ui/OfflineBanner.jsx'
import PageLoader from '../ui/PageLoader.jsx'
import ErrorBoundary from '../ErrorBoundary.jsx'
import { usePreferences } from '../../hooks/usePreferences.js'
import { hasCredentials } from '../../services/tmdb.js'

const PAGES_WITHOUT_API = ['/ajuda']

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { shortcutsEnabled } = usePreferences()
  const mainRef = useRef(null)
  const previousPathname = useRef(location.pathname)
  const [announcement, setAnnouncement] = useState('')

  /*
    Em uma SPA o navegador não "recarrega" a página ao trocar de rota, então:
    - o foco vai para o <main> (senão ficaria no link clicado, que pode nem existir mais) — WCAG 2.4.3;
    - o título da nova página é anunciado para leitores de tela — WCAG 4.1.3.
    Links com âncora (#secao) ficam a cargo da página de destino.
  */
  useEffect(() => {
    // No carregamento inicial o foco fica no topo, para o "Pular para o conteúdo" ser o 1º Tab.
    if (previousPathname.current === location.pathname) return
    previousPathname.current = location.pathname

    if (!location.hash) {
      window.scrollTo(0, 0)
      if (!location.state?.focusSearch) mainRef.current?.focus({ preventScroll: true })
    }
    const timer = setTimeout(() => setAnnouncement(document.title), 500)
    return () => clearTimeout(timer)
    // Só reage à troca de página; mudanças de query (?q=, ?pagina=) são tratadas por cada página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  /*
    Nielsen #7 — atalho "/" leva à busca. Por ser uma tecla única, pode ser
    desativado na página de Ajuda (WCAG 2.1.4) e é ignorado dentro de campos de texto.
  */
  useEffect(() => {
    if (!shortcutsEnabled) return
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')) return
      if (document.querySelector('dialog[open]')) return

      event.preventDefault()
      const searchInput = document.getElementById('campo-busca')
      if (searchInput) searchInput.focus()
      else navigate('/', { state: { focusSearch: true } })
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [shortcutsEnabled, navigate])

  const needsSetup = !hasCredentials && !PAGES_WITHOUT_API.includes(location.pathname)

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <OfflineBanner />
      <Header />
      <main
        id="conteudo"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
      >
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<PageLoader />}>{needsSetup ? <SetupNotice /> : <Outlet />}</Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
