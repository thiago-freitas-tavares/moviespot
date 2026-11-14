/** WCAG 2.4.1 — permite pular o cabeçalho e ir direto ao conteúdo. Fica visível ao receber foco. */
export default function SkipLink() {
  const handleClick = (event) => {
    event.preventDefault()
    const target = document.getElementById('conteudo')
    target?.focus()
    target?.scrollIntoView()
  }

  return (
    <a
      href="#conteudo"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-3 focus:font-semibold focus:text-accent-fg"
    >
      Pular para o conteúdo principal
    </a>
  )
}
