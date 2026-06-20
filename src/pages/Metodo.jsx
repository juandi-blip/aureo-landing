import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { chars, charVPage, fadeUp, fadeIn, slideLeft, scaleIn, stagger } from '../lib/motion.jsx'

const vp = { once: true, margin: '-60px' }

export default function Metodo() {
  usePageMeta(
    'Método — Kaivex AI · Cómo pensamos y construimos',
    'Nuestra filosofía de ingeniería: principios no negociables, cómo integramos IA en cada fase del desarrollo y un proceso por fases sin sorpresas.'
  )

  return (
    <>
      <header className="page-head">
        <div className="wrap">
          <motion.span className="ph-eyebrow" variants={slideLeft} initial="hidden" whileInView="visible" viewport={vp}>
            Método
          </motion.span>

          <motion.h1 initial="hidden" whileInView="visible" viewport={vp}>
            <span className="hero-title-line">Método sin</span>
            <span className="hero-ghost-line">fricción.</span>
          </motion.h1>

          <motion.p className="ph-sub" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            Nuestra filosofía no es un eslogan: es lo que decide cómo invertimos cada hora.
            Cuatro principios no negociables, IA integrada en cada fase y un proceso donde sabes qué pasa cada semana.
          </motion.p>
          <motion.div className="ph-actions" variants={stagger(0.1, 0.1)} initial="hidden" whileInView="visible" viewport={vp}>
            <motion.div variants={fadeUp}>
              <Link to="/contacto" className="btn btn-primary">Agenda una llamada <span className="arrow">→</span></Link>
            </motion.div>
            <motion.div variants={fadeUp}>
              <a href="#proceso" className="btn btn-ghost">Ver el proceso</a>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* P-01 · PRINCIPIOS */}
      <section className="section method">
        <div className="wrap">
          <motion.div className="sec-tag" variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp}>
            <span>P-01</span> <b>principios no negociables</b>
          </motion.div>
          <motion.div className="method-head" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <h2>Nuestra filosofía. Cuatro decisiones que tomamos siempre igual.</h2>
            <span className="chip"><span className="dot"></span> 04 principios</span>
          </motion.div>

          <div className="method-list" id="method-list">
            {[
              { no: '01', h: 'Desarrollo de software con IA.', p: 'Conocimientos sólidos + la última tecnología de IA. No usamos IA como etiqueta: la integramos en cada fase del desarrollo para construir software de calidad excepcional.', g: '→ ai-first' },
              { no: '02', h: 'Sé dueño de tus sistemas.', p: 'Construimos activos que posees, no dependencias que rentas. El código, los datos y la arquitectura se quedan contigo.', g: '→ own' },
              { no: '03', h: 'Demos rápidas, escalado a medida.', p: 'Validamos con demos y módulos estándar para avanzar rápido. Pero lo que llega a producción es original, pensado para tu negocio y construido para escalar.', g: '→ validate' },
              { no: '04', h: 'Arquitectura antes que features.', p: 'Los cimientos primero. Un sistema bien diseñado absorbe el cambio; uno apresurado colapsa al escalar.', g: '→ foundations' },
            ].map(({ no, h, p, g }, idx) => (
              <motion.article
                key={no}
                className="method-item"
                variants={slideLeft}
                initial="hidden"
                whileInView="visible"
                viewport={vp}
                transition={{ delay: idx * 0.1 }}
              >
                <motion.div
                  className="no"
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={vp}
                  transition={{ duration: 0.4, delay: idx * 0.1 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  {no}
                </motion.div>
                <div className="lead">
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
                <div className="glyph-cell mono">{g}</div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* P-02 · IA INTEGRADA */}
      <section className="section">
        <div className="wrap">
          <motion.div className="sec-tag" variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp}>
            <span>P-02</span> <b>ia integrada · no decorativa</b>
          </motion.div>
          <motion.div className="services-head" style={{ maxWidth: '40ch' }} variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <h2>Dónde la IA compone — y dónde decidimos no usarla.</h2>
          </motion.div>
          <motion.div
            className="stack-grid"
            variants={stagger(0.07)}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            {[
              { label: '01 · Descubrimiento', items: ['Síntesis de documentación y procesos', 'Exploración rápida de escenarios técnicos'] },
              { label: '02 · Diseño', items: ['Prototipado de modelos de datos y APIs', 'Generación de variantes de arquitectura'] },
              { label: '03 · Construcción', items: ['Copilotos para acelerar implementación', 'Tests y revisión asistida — con criterio humano'] },
              { label: '04 · Producto', items: ['RAG, agentes y automatización en el sistema', 'Evals que vigilan calidad en producción'] },
              { label: '05 · Operación', items: ['Detección de anomalías y triage', 'Resúmenes de incidentes y métricas'] },
              { label: '— · Modelado', items: ['Formulación físico-matemática del problema', 'Validación numérica contra datos o teoría'] },
              { label: '— · Dónde NO', items: ['Decisiones de arquitectura críticas', 'Cualquier punto donde el riesgo > la velocidad'] },
              { label: '— · QA & Revisión', items: ['Generación de casos de prueba asistida por contexto', 'Detección de patrones problemáticos en PRs'] },
              { label: '— · Documentación', items: ['Resúmenes técnicos automáticos de decisiones clave', 'Generación de docs de arquitectura desde el código'] },
            ].map(({ label, items }) => (
              <motion.div key={label} className="stack-col" variants={scaleIn}>
                <span className="db-label">{label}</span>
                <ul className="tick-list">{items.map((t) => <li key={t}>{t}</li>)}</ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* P-03 · PROCESO */}
      <section className="section process" id="proceso">
        <div className="wrap">
          <motion.div className="sec-tag" variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp}>
            <span>P-03</span> <b>proceso · de-risk visible</b>
          </motion.div>
          <motion.div className="services-head" style={{ maxWidth: '34ch' }} variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <h2>Sin sorpresas. Sabes qué pasa cada semana.</h2>
          </motion.div>
          <div className="editorial-steps">
            {[
              { no: '01', wk: 'Semana 1', h: 'Descubrimiento', p: 'Entendemos la operación y los riesgos reales antes de prometer nada.', items: ['mapa de sistemas', 'decisiones de arquitectura', 'plan por fases'] },
              { no: '02', wk: 'Semana 2–4', h: 'Cimientos', p: 'Arquitectura, entornos y el primer corte funcional en producción.', items: ['esquema de datos', 'CI/CD + observabilidad', 'checkpoint semanal'] },
              { no: '03', wk: 'Semana 4–N', h: 'Construcción', p: 'Iteración en producción con demos vivas, no slides.', items: ['releases continuos', 'métricas a la vista', 'IA donde compone'] },
              { no: '04', wk: 'Continuo', h: 'Operación', p: 'El sistema es tuyo; te acompañamos a escalarlo o lo entregamos llave en mano.', items: ['handoff documentado', 'SLA opcional', 'roadmap evolutivo'] },
            ].map(({ no, wk, h, p, items }) => (
              <div key={no} className="editorial-step reveal">
                <div className="editorial-step__header">
                  <span className="editorial-step__num">{no}</span>
                  <div className="editorial-step__line" />
                </div>
                <h3 className="editorial-step__title">
                  {h}
                  <span className="editorial-step__sub"> · {wk}</span>
                </h3>
                <div className="editorial-step__body">
                  <p>{p}</p>
                  <ul className="tick-list" style={{ marginTop: 'var(--s-4)' }}>
                    {items.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* P-04 · VALORES */}
      <section className="section">
        <div className="wrap">
          <motion.div className="sec-tag" variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp}>
            <span>P-04</span> <b>valores de ingeniería</b>
          </motion.div>
          <div className="about-grid">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
              <h2 style={{ fontSize: 'clamp(26px,3.4vw,42px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.08, maxWidth: '16ch' }}>
                Lo que defendemos cuando nadie mira.
              </h2>
            </motion.div>
            <motion.ul
              className="tick-list"
              style={{ gap: 16 }}
              variants={stagger(0.1, 0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
            >
              {[
                <><b>Claridad sobre cleverness.</b> Código que el próximo ingeniero entiende en minutos.</>,
                <><b>Decisiones documentadas.</b> Cada elección importante deja un ADR, no folklore.</>,
                <><b>Producción desde temprano.</b> El software real se prueba enviándolo, no en slides.</>,
                <><b>Costo y latencia como features.</b> Lo que no se mide, no se mejora.</>,
                <><b>Tu autonomía es el objetivo.</b> Construimos para que no dependas de nosotros para siempre.</>,
              ].map((item, i) => (
                <motion.li key={i} variants={fadeUp}>{item}</motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </section>

      <section className="section cta-final">
        <div className="wrap">
          <motion.div className="sec-tag" style={{ justifyContent: 'center' }} variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp}>empezar</motion.div>
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            Hablemos de tu <em>arquitectura</em>, no de tu presupuesto.
          </motion.h2>
          <motion.p className="sub" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            Una conversación de ingeniería primero. El plan y el rango vienen después.
          </motion.p>
          <motion.div className="acts" variants={stagger(0.1, 0.15)} initial="hidden" whileInView="visible" viewport={vp}>
            <motion.div variants={fadeUp}><Link to="/contacto" className="btn btn-primary">Agenda una llamada <span className="arrow">→</span></Link></motion.div>
            <motion.div variants={fadeUp}><Link to="/servicios" className="btn btn-ghost">Ver cómo trabajamos</Link></motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
