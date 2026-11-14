// Nielsen #2 — usa as cores oficiais da Classificação Indicativa brasileira (ClassInd),
// que o público já reconhece. A idade também aparece em texto, então a cor não é a única pista.
const STYLES = {
  L: 'bg-emerald-700 text-white',
  10: 'bg-sky-700 text-white',
  12: 'bg-yellow-400 text-black',
  14: 'bg-orange-500 text-black',
  16: 'bg-red-700 text-white',
  18: 'bg-black text-white ring-1 ring-white/60',
}

export default function CertificationBadge({ value }) {
  const label = value === 'L' ? 'Livre para todos os públicos' : `Não recomendado para menores de ${value} anos`

  return (
    <span
      className={`inline-grid min-w-8 place-items-center rounded-md px-1.5 py-0.5 text-sm font-bold ${STYLES[value] ?? 'border border-border-strong'}`}
    >
      <span aria-hidden="true">{value}</span>
      <span className="sr-only">Classificação indicativa: {label}</span>
    </span>
  )
}
