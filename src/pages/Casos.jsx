import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { chars, charVPage, fadeUp, fadeIn, slideLeft, scaleIn, stagger } from '../lib/motion.jsx'
import CasesGrid from '../components/CasesGrid.jsx'
import SciSim from '../components/SciSim.jsx'

const vp = { once: true, margin: '-60px' }

const CASES = [
  {
    tag: 'SaaS interno · Retail',
    h: 'Una ferretería que pasó de hojas de cálculo a operar 14 sucursales sobre un solo sistema.',
    ctx: 'Inventario fragmentado, sin visibilidad entre sucursales ni control de margen real. La operación dependía de personas, no de un sistema.',
    metrics: [
      { v: '−68%', l: 'tiempo de cierre de caja' },
      { v: '14×', l: 'sucursales en un sistema' },
      { v: '+31%', l: 'margen por mejor inventario' },
      { v: '0', l: 'caídas en 18 meses' },
    ],
    story: [
      { k: 'Problema', t: 'Inventario en hojas, márgenes a ciegas y cierres de caja manuales por sucursal.' },
      { k: 'Decisión', t: 'Arquitectura event-driven con una sola fuente de verdad e IA para predecir reposición.' },
      { k: 'Arquitectura', t: 'Postgres como núcleo, cola de eventos por sucursal, modelo de predicción de demanda.' },
      { k: 'Resultado', t: 'SaaS interno en producción; el negocio opera sobre él a diario, sin sobresaltos.' },
    ],
  },
  {
    tag: 'IA · Logística last-mile',
    h: 'Un copiloto de soporte que eliminó el 90% del trabajo manual de atención.',
    ctx: 'El equipo de soporte respondía a mano consultas repetitivas sobre estado de envíos, saturando a las personas y degradando los tiempos de respuesta.',
    metrics: [
      { v: '−90%', l: 'tiempo de soporte manual' },
      { v: '4.2×', l: 'consultas resueltas / hora' },
      { v: '<2s', l: 'latencia media de respuesta' },
      { v: '24/7', l: 'cobertura sin guardias' },
    ],
    story: [
      { k: 'Problema', t: 'Volumen alto de consultas repetitivas resueltas manualmente, sin escalar.' },
      { k: 'Decisión', t: 'Copiloto con RAG sobre datos de envíos + agente con herramientas y guardarraíles.' },
      { k: 'Arquitectura', t: 'Ingesta a pgvector, recuperación semántica, herramientas de consulta y evals continuos.' },
      { k: 'Resultado', t: 'El equipo humano atiende solo lo complejo; el resto se resuelve solo, medido y monitoreado.' },
    ],
  },
  {
    tag: 'Arquitectura · Marketplace',
    h: 'Un marketplace que absorbió 12× de tráfico sin re-escribir el producto.',
    ctx: 'El crecimiento empezaba a romper el monolito: latencia en horas pico, despliegues riesgosos y un equipo cada vez más lento.',
    metrics: [
      { v: '12×', l: 'tráfico absorbido sin re-build' },
      { v: '−74%', l: 'latencia p95 en picos' },
      { v: '0', l: 'big-bang rewrites' },
      { v: '3×', l: 'velocidad de despliegue' },
    ],
    story: [
      { k: 'Problema', t: 'Monolito tensionado por el crecimiento: latencia, despliegues frágiles, equipo lento.' },
      { k: 'Decisión', t: 'Migración por fases a event-driven, extrayendo límites claros sin detener el negocio.' },
      { k: 'Arquitectura', t: 'Eventos como columna vertebral, caché estratégica y servicios desacoplados por dominio.' },
      { k: 'Resultado', t: 'El sistema escala con el tráfico y el equipo recupera velocidad de entrega.' },
    ],
  },
  {
    tag: 'Modelado científico · Ingeniería',
    h: 'Un simulador de vibraciones que reemplazó semanas de prueba y error físico.',
    ctx: 'El equipo ajustaba amortiguadores a mano, fabricando prototipos para cada configuración. Caro, lento y sin garantía de óptimo.',
    metrics: [
      { v: '−85%', l: 'prototipos físicos' },
      { v: '40×', l: 'configuraciones probadas / día' },
      { v: '1e-3', l: 'error vs. solución analítica' },
      { v: '100%', l: 'modelo validado y reproducible' },
    ],
    story: [
      { k: 'Problema', t: 'Ajuste de amortiguamiento por prueba física: caro, lento, sin garantía de óptimo.' },
      { k: 'Decisión', t: 'Modelar el sistema como un oscilador amortiguado e integrarlo numéricamente (RK4).' },
      { k: 'Arquitectura', t: 'Integrador RK4 validado contra la solución analítica; simulador interactivo en el navegador.' },
      { k: 'Resultado', t: 'El equipo explora el espacio de parámetros en segundos; solo fabrica el diseño ganador.' },
    ],
    sim: true,
  },
]

export default function Casos() {
  usePageMeta(
    'Casos — Kaivex AI · Resultados, no captions',
    'Casos de estudio liderados por métrica: problema, decisión técnica, arquitectura y resultado. Software a medida, IA y re-arquitectura en producción.'
  )

  return (
    <>
      <header className="page-head">
        <div className="wrap">
          <motion.span className="ph-eyebrow" variants={slideLeft} initial="hidden" whileInView="visible" viewport={vp}>
            Casos
          </motion.span>

          <motion.h1 initial="hidden" whileInView="visible" viewport={vp}>
            {chars('Resultados, ', charVPage, 0)}
            <em>{chars('no captions.', charVPage, 12)}</em>
          </motion.h1>

          <motion.p className="ph-sub" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            Cada proyecto se mide por lo que cambió en el negocio. Aquí los datos van primero;
            la historia técnica detrás, después. Filtra por tipo de trabajo.
          </motion.p>
          <motion.div className="ph-actions" variants={stagger(0.1, 0.1)} initial="hidden" whileInView="visible" viewport={vp}>
            <motion.div variants={fadeUp}>
              <Link to="/contacto" className="btn btn-primary">Cuéntanos tu caso <span className="arrow">→</span></Link>
            </motion.div>
            <motion.div variants={fadeUp}>
              <a href="#estudios" className="btn btn-ghost">Ver casos detallados</a>
            </motion.div>
          </motion.div>
        </div>
      </header>

      <section className="section cases">
        <div className="wrap">
          <CasesGrid heading="Liderados por métrica." />
        </div>
      </section>

      <section className="section" id="estudios" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <motion.div className="sec-tag" variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp}>
            <span>C-01</span> <b>casos de estudio</b>
          </motion.div>

          {CASES.map(({ tag, h, ctx, metrics, story, sim }) => (
            <motion.article
              key={tag}
              className="case-study"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
            >
              <div className="cs-head">
                <span className="chip"><span className="dot"></span> {tag}</span>
                <h3>{h}</h3>
                <p className="cs-context">{ctx}</p>
              </div>
              <div className="cs-body">
                <motion.div
                  className="proof-metrics"
                  variants={stagger(0.08)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={vp}
                >
                  {metrics.map(({ v, l }) => (
                    <motion.div key={l} className="cell" variants={scaleIn}>
                      <b>{v.replace(/(%|×|s)$/, (m) => `<span class="u">${m}</span>`)
                        .split(/<span|<\/span>/)
                        .reduce((acc, part, i) => {
                          if (i % 2 === 0) acc.push(part.replace(/class="u">.*/, ''))
                          return acc
                        }, [v])
                        [0]
                      }</b>
                      <span>{l}</span>
                    </motion.div>
                  ))}
                </motion.div>
                <motion.div
                  className="proof-story"
                  variants={stagger(0.09, 0.1)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={vp}
                >
                  {story.map(({ k, t }) => (
                    <motion.div key={k} className="ln" variants={fadeUp}>
                      <em>{k}</em><span>{t}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              {sim && (
                <motion.div className="cs-sim" variants={fadeUp}>
                  <SciSim />
                </motion.div>
              )}
            </motion.article>
          ))}
        </div>
      </section>

      <section className="section cta-final">
        <div className="wrap">
          <motion.div className="sec-tag" style={{ justifyContent: 'center' }} variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp}>tu caso</motion.div>
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            El próximo resultado medible puede ser <em>el tuyo.</em>
          </motion.h2>
          <motion.p className="sub" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            Cuéntanos el problema; te decimos con honestidad si podemos moverlo y cómo.
          </motion.p>
          <motion.div className="acts" variants={stagger(0.1, 0.15)} initial="hidden" whileInView="visible" viewport={vp}>
            <motion.div variants={fadeUp}><Link to="/contacto" className="btn btn-primary">Agenda una llamada <span className="arrow">→</span></Link></motion.div>
            <motion.div variants={fadeUp}><Link to="/#estimador" className="btn btn-ghost">Escopea tu proyecto</Link></motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
