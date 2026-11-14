import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { textLinkClass } from '../components/ui/styles.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { usePreferences } from '../hooks/usePreferences.js'

const SECTIONS = [
  { id: 'como-usar', title: 'Como usar' },
  { id: 'atalhos', title: 'Atalhos de teclado' },
  { id: 'preferencias', title: 'Preferências' },
  { id: 'acessibilidade', title: 'Acessibilidade' },
  { id: 'perguntas', title: 'Perguntas frequentes' },
]

const SHORTCUTS = [
  ['/', 'Ir para a busca (pode ser desativado abaixo)'],
  ['Tab / Shift + Tab', 'Avançar / voltar entre links, botões e campos'],
  ['Enter', 'Abrir o link ou acionar o botão em foco'],
  ['Espaço', 'Acionar o botão em foco ou marcar uma opção; com um filme em foco, adicionar ou remover dos favoritos'],
  ['Esc', 'Fechar o trailer, uma confirmação ou o menu no celular'],
  ['Setas ↑ ↓', 'Escolher uma opção em listas de seleção (filtros)'],
]

const FAQ = [
  [
    'Onde meus favoritos ficam salvos?',
    'Em um banco de dados no servidor do MovieSpot. Por isso a lista continua lá mesmo se você limpar os dados do navegador e aparece em qualquer navegador que acesse o mesmo servidor. Como não há cadastro, todos que usam o mesmo servidor compartilham a mesma lista.',
  ],
  [
    'Por que aparece um aviso de “100 resultados mais relevantes”?',
    'A busca por texto do TMDB não filtra por gênero nem muda a ordem. Quando você combina texto com esses filtros, o MovieSpot analisa os 100 resultados mais relevantes e aplica gênero e ordenação sobre eles. Se o filme não aparecer, deixe o texto mais específico. Pelo mesmo motivo, “Maior bilheteria” não está disponível junto com texto.',
  ],
  [
    'Por que alguns filmes estão sem sinopse?',
    'Os textos vêm da comunidade do TMDB. Quando ninguém traduziu a sinopse para o português ainda, mostramos um aviso no lugar.',
  ],
  [
    'Por que o trailer está em inglês?',
    'Damos preferência a trailers em português. Quando não existe um, exibimos o trailer original, com legendas ativadas se o YouTube oferecer.',
  ],
  [
    'De onde vêm os dados?',
    'Títulos, notas, imagens e elenco vêm da API pública do The Movie Database (TMDB). As notas são a média dos votos dos usuários do TMDB, de 0 a 10.',
  ],
]

const kbdClass = 'rounded border border-border-strong bg-surface-2 px-2 py-0.5 font-mono text-sm'
const headingClass = 'scroll-mt-24 text-2xl font-bold'

export default function HelpPage() {
  useDocumentTitle('Ajuda')
  const location = useLocation()
  const { theme, setTheme, shortcutsEnabled, setShortcutsEnabled } = usePreferences()

  // Ao chegar por um link com âncora (ex.: rodapé → #atalhos), rola até a seção e leva o foco ao título.
  useEffect(() => {
    if (!location.hash) return
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)))
    target?.scrollIntoView()
    target?.focus({ preventScroll: true })
  }, [location.hash])

  return (
    <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
      <nav aria-label="Nesta página" className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">Nesta página</p>
        <ul className="space-y-1">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="flex min-h-10 items-center rounded-lg px-3 hover:bg-surface-2">
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="max-w-3xl space-y-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold sm:text-4xl">Ajuda</h1>
          <p className="text-muted">Tudo o que você precisa para aproveitar o MovieSpot.</p>
        </div>

        <section aria-labelledby="como-usar" className="space-y-4">
          <h2 id="como-usar" tabIndex={-1} className={headingClass}>
            Como usar
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="font-semibold">
                <Link to="/" className={`${textLinkClass} inline-flex min-h-6 items-center`}>Início</Link>
              </dt>
              <dd className="text-muted">
                Sem busca, mostra filmes em alta, em cartaz, populares, mais bem avaliados e próximas estreias. Digite
                pelo menos 2 letras do título e/ou combine gênero, ano e ordenação: os resultados aparecem no lugar das
                listas, e “Voltar para as listas” desfaz tudo de uma vez. O endereço da página guarda a busca e os
                filtros, então dá para compartilhar o link. Suas buscas recentes ficam salvas para repetir com um clique.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">
                <Link to="/favoritos" className={`${textLinkClass} inline-flex min-h-6 items-center`}>Favoritos</Link>
              </dt>
              <dd className="text-muted">Use o ícone de coração para salvar ou remover um filme. Pelo teclado, aperte Espaço com o filme em foco. Toda remoção pode ser desfeita pela notificação.</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="atalhos" className="space-y-4">
          <h2 id="atalhos" tabIndex={-1} className={headingClass}>
            Atalhos de teclado
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left">
              <caption className="sr-only">Teclas e suas ações</caption>
              <thead className="bg-surface-2">
                <tr>
                  <th scope="col" className="px-4 py-3">Tecla</th>
                  <th scope="col" className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SHORTCUTS.map(([keys, action]) => (
                  <tr key={keys}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <kbd className={kbdClass}>{keys}</kbd>
                    </td>
                    <td className="px-4 py-3 text-muted">{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="preferencias" className="space-y-6">
          <h2 id="preferencias" tabIndex={-1} className={headingClass}>
            Preferências
          </h2>

          <fieldset>
            <legend className="mb-3 font-semibold">Tema de cores</legend>
            <div className="flex flex-wrap gap-3">
              {[
                ['dark', 'Escuro'],
                ['light', 'Claro'],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border-strong px-4 has-checked:border-accent-text has-checked:bg-surface-2"
                >
                  <input
                    type="radio"
                    name="tema"
                    value={value}
                    checked={theme === value}
                    onChange={() => setTheme(value)}
                    className="size-4 accent-focus"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* WCAG 2.1.4 — atalhos de uma única tecla precisam poder ser desligados. */}
          <div className="flex items-start gap-3">
            <input
              id="atalho-busca"
              type="checkbox"
              role="switch"
              checked={shortcutsEnabled}
              onChange={(event) => setShortcutsEnabled(event.target.checked)}
              aria-describedby="atalho-descricao"
              className="size-6 shrink-0 cursor-pointer accent-focus"
            />
            <div>
              <label htmlFor="atalho-busca" className="cursor-pointer font-semibold">
                Atalho de tecla única “/” para buscar
              </label>
              <p id="atalho-descricao" className="text-sm text-muted">
                Desative se você usa software de ditado por voz ou se o atalho atrapalhar sua navegação.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="acessibilidade" className="space-y-4">
          <h2 id="acessibilidade" tabIndex={-1} className={headingClass}>
            Acessibilidade
          </h2>
          <p className="text-muted">
            O MovieSpot busca seguir as Diretrizes de Acessibilidade para Conteúdo Web (WCAG 2.2), nível AA. Entre os
            recursos disponíveis:
          </p>
          <ul className="list-disc space-y-2 pl-6 marker:text-accent-text">
            <li>Todas as funções podem ser usadas apenas com o teclado, com indicador de foco bem visível.</li>
            <li>
              Ao abrir ou recarregar uma página, o primeiro Tab mostra o link “Pular para o conteúdo principal”, que
              leva direto ao conteúdo sem passar pelo menu. Ao trocar de página pelos links do site, o foco já vai
              direto para o conteúdo.
            </li>
            <li>
              No Início, cada lista de filmes começa com os botões “Lista anterior” e “Pular lista”, que aparecem ao
              chegar neles pelo Tab e levam à lista anterior ou à seguinte sem passar por todos os filmes.
            </li>
            <li>Contraste de cores verificado nos temas claro e escuro.</li>
            <li>
              Botões que só têm ícone, como o coração de favoritar e o de trocar o tema, têm um nome lido pelo leitor
              de tela (ex.: “Adicionar ‘Duna’ aos favoritos”). O pôster na página de cada filme tem descrição.
            </li>
            <li>
              O leitor de tela lê sozinho o que muda na página, sem tirar você do lugar: carregamentos, a quantidade
              de resultados da busca e as notificações (como ao favoritar).
            </li>
            <li>
              Se a redução de animações estiver ativada no seu sistema (no Windows: Configurações → Acessibilidade →
              Efeitos visuais → Efeitos de animação), o MovieSpot também desliga as dele.
            </li>
            <li>Layout se adapta a telas pequenas e a zoom de até 400% sem rolagem horizontal.</li>
            <li>Trailers abrem só quando você pede, com legendas ativadas quando disponíveis.</li>
          </ul>
        </section>

        <section aria-labelledby="perguntas" className="space-y-4">
          <h2 id="perguntas" tabIndex={-1} className={headingClass}>
            Perguntas frequentes
          </h2>
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {FAQ.map(([question, answer]) => (
              <details key={question} className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 font-semibold hover:bg-surface-2">
                  {question}
                  <span aria-hidden="true" className="text-xl text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="px-4 pb-4 text-muted">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
