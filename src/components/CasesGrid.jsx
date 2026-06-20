import { useState } from 'react'

// Casos liderados por MÉTRICA. Antes era cases.js (vanilla + innerHTML);
// ahora es un componente React idiomático con filtro por estado.
// Contenido = placeholders realistas (reemplazar por datos reales).
const CASES = [
  { metric: '−68', u: '%', label: 'tiempo de cierre de caja', name: '[ Ferretería · 14 sucursales ]', kind: 'saas', tag: 'SaaS interno' },
  { metric: '4.2', u: '×', label: 'velocidad de onboarding', name: '[ Fintech · B2B ]', kind: 'saas', tag: 'Plataforma SaaS' },
  { metric: '+31', u: '%', label: 'margen por mejor inventario', name: '[ Retail · multi-marca ]', kind: 'ia', tag: 'IA predictiva' },
  { metric: '−90', u: '%', label: 'tiempo de soporte manual', name: '[ Logística · last-mile ]', kind: 'ia', tag: 'Copiloto IA' },
  { metric: '0', u: '', label: 'caídas en 18 meses', name: '[ Healthtech · clínicas ]', kind: 'arq', tag: 'Re-arquitectura' },
  { metric: '12', u: '×', label: 'tráfico absorbido sin re-build', name: '[ Marketplace · escala ]', kind: 'arq', tag: 'Event-driven' },
]

const FILTERS = [
  { f: 'all', label: 'todos' },
  { f: 'saas', label: 'saas' },
  { f: 'ia', label: 'ia' },
  { f: 'arq', label: 'arquitectura' },
]

export default function CasesGrid({ heading }) {
  const [filter, setFilter] = useState('all')
  const shown = CASES.filter((c) => filter === 'all' || c.kind === filter)

  return (
    <>
      <div className="cases-head reveal">
        <h2>{heading}</h2>
        <div className="case-filters" role="tablist" aria-label="Filtrar casos">
          {FILTERS.map((x) => (
            <button
              key={x.f}
              className={'filter' + (filter === x.f ? ' on' : '')}
              onClick={() => setFilter(x.f)}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <div className="cases-grid">
        {shown.map((c, i) => (
          <article className="case-card reveal in" data-delay={i % 3} key={c.name + c.label}>
            <div className="metric">{c.metric}<span className="u">{c.u}</span></div>
            <div className="metric-l">{c.label}</div>
            <div className="case-name">
              <span className="chip" style={{ marginBottom: 10 }}>{c.tag}</span>
              <b>{c.name}</b>
              <span>caso de estudio</span>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
