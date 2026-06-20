import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { initMiniNodes } from '../lib/miniNodes.js'
import { initWoven } from '../lib/woven.js'
import { fadeUp, fadeIn, scaleIn, stagger } from '../lib/motion.jsx'
import AiStrip from '../components/AiStrip.jsx'
import Diagram from '../components/Diagram.jsx'
import Estimator from '../components/Estimator.jsx'
import CasesGrid from '../components/CasesGrid.jsx'

const vp = { once: true, margin: '-60px' }

export default function Home() {
  usePageMeta(
    'Kaivex AI — Desarrollo de software con IA para tu negocio',
    'Kaivex AI es un estudio de desarrollo de software con IA. Validamos rápido con demos y construimos a medida arquitectura robusta que escala.'
  )
  useEffect(() => initMiniNodes(), [])
  useEffect(() => initWoven(), [])

  return (
    <>
      {/* Hero fusionado 2 columnas */}
      <section className="hero-fusion">
        {/* Columna izquierda — texto */}
        <div className="hero-fusion__left">
          <p className="hero-eyebrow animate-fade-up stagger-1">
            Estudio de desarrollo de software con IA
          </p>

          <div className="animate-fade-up stagger-2">
            <h1 className="hero-title-line">Software que</h1>
            <span className="hero-ghost-line">piensa solo.</span>
          </div>

          <p className="animate-fade-up stagger-3" style={{ color: 'var(--bone-dim)', maxWidth: '42ch', lineHeight: '1.7' }}>
            Construimos productos digitales con agentes de IA — desde el prototipo hasta producción.
            Rápido, preciso, sin fricción.
          </p>

          <div className="animate-fade-up stagger-4" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="#estimador" className="btn btn-primary">Estimar mi proyecto</a>
            <Link to="/casos" className="btn btn-ghost">Ver casos reales</Link>
          </div>

          {/* Stats strip */}
          <div className="hero-fusion__stats animate-fade-up stagger-5">
            <div>
              <div className="hero-stat__value">3×</div>
              <div className="hero-stat__label">más rápido con IA</div>
            </div>
            <div>
              <div className="hero-stat__value">+40</div>
              <div className="hero-stat__label">proyectos entregados</div>
            </div>
            <div>
              <div className="hero-stat__value">100%</div>
              <div className="hero-stat__label">en producción</div>
            </div>
          </div>
        </div>

        {/* Columna derecha — canvas + terminal */}
        <div className="hero-fusion__right animate-fade-up stagger-2">
          <div className="hero-fusion__canvas-wrap">
            <canvas
              className="hero-woven-canvas"
              id="woven-canvas"
              aria-hidden="true"
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>
          <AiStrip />
        </div>
      </section>

      {/* 2 · PRUEBA ESTRELLA */}
      <section className="section proof" id="prueba">
        <div className="wrap">
          <motion.div className="sec-tag" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <span>S-02</span> <b>prueba estrella</b>
          </motion.div>
          <div className="proof-grid">
            <motion.div className="proof-left" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
              <blockquote className="proof-quote">
                "Empezamos con una demo funcional en la primera semana. Validamos la idea
                y Kaivex AI la convirtió en <span className="mk">el sistema que hoy corre solo la
                operación de 14 sucursales</span>. Velocidad para probar, solidez para operar."
              </blockquote>
              <div className="proof-by">
                <span className="ph" aria-hidden="true"></span>
                <span className="who">
                  <b>Alejandro Valenzuela</b>
                  <span className="mono">Director de Operaciones · Ferretería El Engranaje</span>
                </span>
              </div>
            </motion.div>
            <motion.div
              className="proof-right"
              variants={stagger(0.08, 0.15)}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
            >
              <div className="proof-metrics">
                {['−68%', '14×', '+31%', '0'].map((v, i) => (
                  <motion.div key={i} className="cell" variants={scaleIn}>
                    <b dangerouslySetInnerHTML={{ __html: v.replace(/(%|×)/, '<span class="u">$1</span>') }} />
                    <span>{['tiempo de cierre de caja', 'sucursales en un solo sistema', 'margen por mejor inventario', 'caídas en 18 meses'][i]}</span>
                  </motion.div>
                ))}
              </div>
              <div className="proof-story">
                {['Problema', 'Decisión', 'Resultado'].map((k, i) => (
                  <motion.div key={k} className="ln" variants={fadeUp}>
                    <em>{k}</em>
                    <span>{[
                      'Inventario fragmentado en hojas; sin visibilidad entre sucursales ni control de margen real.',
                      'Arquitectura event-driven: una sola fuente de verdad, IA para predecir reposición por sucursal.',
                      'SaaS interno en producción; el negocio opera sobre él a diario.',
                    ][i]}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div variants={fadeUp}>
                <Link to="/casos" className="sec-more">Ver todos los casos <span className="arrow">→</span></Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3 · DIAGRAMA */}
      <Diagram />

      {/* 4 · SERVICIOS (teaser) */}
      <section className="section services" id="servicios">
        <div className="wrap">
          <motion.div className="sec-split" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <div className="services-head" style={{ marginBottom: 0 }}>
              <div className="sec-tag" style={{ marginBottom: 'var(--s-4)' }}><span>S-04</span> <b>servicios como resultados</b></div>
              <h2>Servicios traducidos a trabajos de negocio, no a líneas de un brochure.</h2>
            </div>
            <Link to="/servicios" className="sec-more">Ver servicios a fondo <span className="arrow">→</span></Link>
          </motion.div>
          <motion.div
            className="services-grid"
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            {[
              { id: 'M-01 · desarrollo a medida', h: 'Sistemas que <span class="res">posees.</span>', p: 'Software construido alrededor de tu operación real, no al revés. Código limpio, documentado y tuyo.', chips: ['TypeScript', 'Go', 'event-driven'], mini: 'dev' },
              { id: 'M-02 · desarrollo con IA', h: 'IA integrada en <span class="res">cada fase.</span>', p: 'IA como motor del desarrollo: predicción, automatización, copilotos internos. Conocimiento sólido + última tecnología.', chips: ['RAG', 'agentes', 'fine-tune'], mini: 'ai' },
              { id: 'M-03 · construcción de SaaS', h: 'Demos para validar, <span class="res">producto para escalar.</span>', p: 'Validamos con demos funcionales desde la semana uno. Después: auth, billing, observabilidad y un producto a medida.', chips: ['multi-tenant', 'billing', 'SLA'], mini: 'saas' },
              { id: 'M-04 · arquitectura de software', h: 'Cimientos que <span class="res">no colapsan al escalar.</span>', p: 'Diseño de sistemas que absorbe crecimiento y cambio. La decisión más barata es la que tomas bien al inicio.', chips: ['diseño de sistemas', 'escalabilidad'], mini: 'arch' },
              { id: 'M-05 · modelado científico', h: 'Resolvemos lo que otros <span class="res">no pueden.</span>', p: 'Modelos físico-matemáticos y simulación numérica: EDOs/EDPs, optimización y ML científico. Conocimiento real, no buzzwords.', chips: ['EDOs/EDPs', 'optimización', 'simuladores'], mini: 'sci' },
              { id: 'M-06 · sprint de descubrimiento', h: 'Claridad técnica <span class="res">antes de comprometerte.</span>', p: 'Una semana de análisis: arquitectura candidata, riesgos identificados y plan de fases accionable. Sin proyecto previo requerido.', chips: ['análisis', 'arquitectura', 'plan'], mini: 'arch' },
            ].map(({ id, h, p, chips, mini }) => (
              <motion.article key={id} className="module" variants={fadeUp}>
                <canvas className="mini-node" data-mini={mini} aria-hidden="true"></canvas>
                <span className="mod-id">{id}</span>
                <h3 dangerouslySetInnerHTML={{ __html: h }} />
                <p>{p}</p>
                <div className="mod-foot">{chips.map((c) => <span key={c} className="chip">{c}</span>)}</div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4b · CIENCIA COMO ARMA SECRETA */}
      <section className="section" id="ciencia">
        <div className="wrap">
          <motion.div className="sec-tag" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <span>S-05</span> <b>el diferenciador</b>
          </motion.div>
          <motion.div className="services-head" style={{ maxWidth: '24ch' }} variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <h2>No solo construimos software. Resolvemos problemas que requieren matemáticas.</h2>
          </motion.div>
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} style={{ maxWidth: '60ch' }}>
            Modelamos fenómenos físicos, optimizamos decisiones y ajustamos modelos a datos reales.
            Conocimiento científico de verdad — física, matemáticas, simulación numérica — puesto al servicio
            de campos de investigación y de negocios con problemas que el software genérico no resuelve.
          </motion.p>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <Link to="/servicios" className="sec-more">Ver modelado científico <span className="arrow">→</span></Link>
          </motion.div>
        </div>
      </section>

      {/* 5 · ESTIMADOR */}
      <Estimator />

      {/* 6 · CASOS (teaser) */}
      <section className="section cases" id="casos">
        <div className="wrap">
          <motion.div className="sec-tag" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <span>S-06</span> <b>casos · liderados por métrica</b>
          </motion.div>
          <CasesGrid heading="Resultados, no captions." />
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <Link to="/casos" className="sec-more">Ver casos de estudio detallados <span className="arrow">→</span></Link>
          </motion.div>
        </div>
      </section>

      {/* 7 · CTA FINAL */}
      <section className="section cta-final" id="contacto">
        <div className="wrap">
          <motion.div className="sec-tag" style={{ justifyContent: 'center' }} variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp}>contacto</motion.div>
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            ¿Cómo se ve el <em>éxito</em> para tu proyecto?
          </motion.h2>
          <motion.p className="sub" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ delay: 0.1 }}>
            Sin precios públicos ni formularios disfrazados. Una llamada, una conversación de ingeniería, un plan.
          </motion.p>
          <motion.div className="acts" variants={stagger(0.1, 0.2)} initial="hidden" whileInView="visible" viewport={vp}>
            <motion.div variants={fadeUp}><Link to="/contacto" className="btn btn-primary">Agenda una llamada <span className="arrow">→</span></Link></motion.div>
            <motion.div variants={fadeUp}><a href="#estimador" className="btn btn-ghost">Escopea tu proyecto primero</a></motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
