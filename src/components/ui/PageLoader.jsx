/** Indicador de carregamento de página inteira (usado enquanto o código da rota é baixado). */
export default function PageLoader() {
  return (
    <div role="status" className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-muted">
      <span
        aria-hidden="true"
        className="size-10 rounded-full border-4 border-border border-t-accent motion-safe:animate-spin"
      />
      <span>Carregando página…</span>
    </div>
  )
}
