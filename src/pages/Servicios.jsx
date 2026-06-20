import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { chars, charVPage, fadeUp, fadeIn, slideLeft, scaleIn, stagger } from '../lib/motion.jsx'
import BuildSaas from '../components/BuildSaas.jsx'
import TechLogos from '../components/TechLogos.jsx'

const vp = { once: true, margin: '-60px' }

export default function Servicios() {
  usePageMeta(
    'Servicios — Kaivex AI · Desarrollo, IA, SaaS y arquitectura',
    'Cuatro servicios traducidos a resultados de negocio: desarrollo a medida, desarrollo con IA, construcción de SaaS y arquitectura de software.'
  )

  return (
    <>
      <header className="page-head">
        <div className="wrap">
          <motion.span className="ph-eyebrow" variants={slideLeft} initial="hidden" whileInView="visible" viewport={vp}>
            Servicios
          </motion.span>

          <motion.h1 initial="hidden" whileInView="visible" viewport={vp}>
            <span className="hero-title-line">Construimos</span>
            <span className="hero-ghost-line">el software del futuro.</span>
          </motion.h1>

          <motion.p className="ph-sub" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            Cada oferta traducida a un trabajo de negocio, con qué incluye, el stack que usamos y
            lo que recibes al final — sin letra pequeña ni dependencias que rentas.
          </motion.p>
          <motion.div className="ph-actions" variants={stagger(0.1, 0.1)} initial="hidden" whileInView="visible" viewport={vp}>
            <motion.div variants={fadeUp}>
              <Link to="/contacto" className="btn btn-primary">Agenda una llamada <span className="arrow">→</span></Link>
            </motion.div>
            <motion.div variants={fadeUp}>
              <a href="#stack" className="btn btn-ghost">Ver stack tecnológico</a>
            </motion.div>
          </motion.div>
        </div>
      </header>

      <section className="section">
        <div className="wrap">
          <div className="svc-list">

            {[
              {
                id: 'M-01 · desarrollo a medida',
                h: <>Sistemas que <span className="res">posees.</span></>,
                lead: 'Software construido alrededor de tu operación real, no al revés. Código limpio, documentado y tuyo desde el día uno.',
                chips: ['TypeScript', 'Go', 'event-driven'],
                inc: ['Levantamiento técnico y mapa de tu operación', 'Diseño de dominio y modelo de datos', 'Desarrollo iterativo con releases continuos', 'Pruebas automatizadas + observabilidad'],
                ent: [<><b>Código fuente</b> y repositorio tuyos</>, 'Documentación de arquitectura (ADR)', 'CI/CD y entornos reproducibles', 'Handoff o acompañamiento a elección'],
                para: 'Negocios cuya operación ya no cabe en hojas de cálculo ni herramientas genéricas y necesitan un sistema a su medida que sea un activo, no un gasto recurrente.',
              },
              {
                id: 'M-02 · desarrollo con IA',
                h: <>IA integrada en <span className="res">cada fase.</span></>,
                lead: 'No usamos IA como etiqueta: la integramos en el producto y en el propio proceso de desarrollo. Conocimiento sólido + última tecnología para avances excepcionales.',
                chips: ['RAG', 'agentes', 'fine-tune', 'evals'],
                inc: ['Copilotos y automatización de flujos internos', 'Búsqueda semántica y RAG sobre tus datos', 'Agentes con herramientas y guardarraíles', 'Evaluaciones (evals) y monitoreo de calidad'],
                ent: ['Pipeline de datos e ingestión', 'Prompts, herramientas y políticas versionadas', 'Suite de evals reproducible', 'Control de costo y latencia por endpoint'],
                para: 'Equipos que quieren IA que aporte valor real y medible — no una demo vistosa que se rompe en producción.',
              },
              {
                id: 'M-03 · construcción de SaaS',
                h: <>Demos para validar, <span className="res">producto para escalar.</span></>,
                lead: 'Validamos con demos funcionales desde la semana uno. Lo que llega a producción es original, multi-tenant y construido para crecer.',
                chips: ['multi-tenant', 'billing', 'SLA'],
                inc: ['Auth, organizaciones y roles (multi-tenant)', 'Billing, planes y medición de uso', 'Panel de administración y métricas', 'Observabilidad, alertas y SLOs'],
                ent: ['Demo funcional en semana 1', 'Producto en producción por fases', 'Integraciones (pagos, correo, webhooks)', 'SLA opcional y plan de operación'],
                para: 'Fundadores y empresas que quieren lanzar un SaaS validado rápido y con cimientos para escalar sin re-escribir todo a los seis meses.',
              },
              {
                id: 'M-04 · arquitectura de software',
                h: <>Cimientos que <span className="res">no colapsan al escalar.</span></>,
                lead: 'Diseño de sistemas que absorbe crecimiento y cambio. La decisión más barata es la que tomas bien al inicio.',
                chips: ['diseño de sistemas', 'escalabilidad', 'event-driven'],
                inc: ['Auditoría de arquitectura y cuellos de botella', 'Diseño de límites, eventos y contratos', 'Estrategia de datos y consistencia', 'Plan de migración por fases, sin big-bang'],
                ent: ['Diagrama de arquitectura objetivo', 'Registro de decisiones (ADR)', 'Roadmap técnico priorizado', 'Guía de implementación para tu equipo'],
                para: 'Productos en producción que empiezan a sentir el dolor del crecimiento: latencia, costos, incidentes o velocidad de equipo en caída.',
              },
              {
                id: 'M-05 · modelado científico',
                h: <>Resolvemos lo que otros <span className="res">no pueden.</span></>,
                lead: 'Modelos físico-matemáticos y simulación numérica para problemas complejos. Conocimiento científico real más ingeniería de software que entrega.',
                chips: ['EDOs/EDPs', 'optimización', 'ML científico', 'simuladores'],
                inc: ['Simulación numérica (EDOs/EDPs): mecánica, ondas, calor, fluidos', 'Optimización y modelos matemáticos aplicados a decisiones e ingeniería', 'Ajuste de modelos a datos reales (estadística / ML científico)', 'Visualizadores y simuladores interactivos'],
                ent: [<><b>Modelo validado</b> contra datos o teoría</>, 'Simulador o visualizador interactivo', 'Documentación del método y los supuestos', 'Código fuente reproducible y tuyo'],
                para: 'Investigadores, ingenieros y negocios con problemas que no se resuelven con software genérico: requieren un modelo matemático correcto y bien implementado.',
              },
              {
                id: 'M-06 · sprint de descubrimiento',
                h: <>Claridad técnica <span className="res">antes de comprometerte.</span></>,
                lead: 'Una semana de análisis profundo: mapeamos el problema, diseñamos la arquitectura candidata, identificamos los riesgos reales y entregamos un plan accionable. Sin compromiso de proyecto mayor.',
                chips: ['análisis técnico', 'arquitectura', 'plan de fases', 'gestión de riesgo'],
                inc: ['Análisis del problema de negocio y el sistema actual', 'Diseño de arquitectura candidata con variantes', 'Identificación y priorización de riesgos técnicos', 'Plan de fases con estimaciones y dependencias'],
                ent: ['Documento de arquitectura candidata', 'Registro de riesgos y mitigaciones', 'Roadmap técnico de fases', 'Presentación ejecutiva + técnica'],
                para: 'Empresas que quieren validar la viabilidad técnica antes de invertir, equipos que buscan una segunda opinión independiente o proyectos que necesitan claridad antes de elegir proveedor.',
              },
            ].map(({ id, h, lead, chips, inc, ent, para }) => (
              <motion.article
                key={id}
                className="svc-item"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={vp}
              >
                <div className="svc-head">
                  <span className="mod-id">{id}</span>
                  <h2>{h}</h2>
                  <p className="svc-lead">{lead}</p>
                  <div className="mod-foot">{chips.map((c) => <span key={c} className="chip">{c}</span>)}</div>
                </div>
                <motion.div
                  className="svc-detail"
                  variants={stagger(0.08, 0.15)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={vp}
                >
                  <div className="svc-cols">
                    <motion.div className="detail-block" variants={fadeUp}>
                      <span className="db-label">Qué incluye</span>
                      <ul className="tick-list">{inc.map((t, i) => <li key={i}>{t}</li>)}</ul>
                    </motion.div>
                    <motion.div className="detail-block" variants={fadeUp}>
                      <span className="db-label">Entregables</span>
                      <ul className="tick-list">{ent.map((t, i) => <li key={i}>{t}</li>)}</ul>
                    </motion.div>
                  </div>
                  <motion.div className="detail-block" variants={fadeUp}>
                    <span className="db-label">Para quién</span>
                    <p className="svc-lead" style={{ maxWidth: '60ch' }}>{para}</p>
                  </motion.div>
                </motion.div>
              </motion.article>
            ))}

          </div>
        </div>
      </section>

      <BuildSaas />

      <section className="section" id="stack">
        <div className="wrap">
          <motion.div className="sec-tag" variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp}>
            <span>S-S</span> <b>stack tecnológico</b>
          </motion.div>
          <motion.div className="services-head" style={{ maxWidth: '36ch' }} variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <h2>Herramientas elegidas por encaje, no por moda.</h2>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <TechLogos />
          </motion.div>
          <motion.div
            className="stack-grid"
            variants={stagger(0.07)}
            initial="hidden"
            whileInView="visible"
            viewport={vp}
          >
            {[
              { label: 'Lenguajes', chips: ['TypeScript', 'Go', 'Python', 'SQL'] },
              { label: 'Frontend', chips: ['React', 'Next.js', 'Tailwind', 'Canvas/WebGL'] },
              { label: 'Backend', chips: ['Node', 'Go services', 'gRPC/REST', 'event-driven'] },
              { label: 'Datos', chips: ['PostgreSQL', 'Redis', 'pgvector', 'colas/streams'] },
              { label: 'IA', chips: ['LLMs', 'RAG', 'agentes', 'evals'] },
              { label: 'Infraestructura', chips: ['Docker', 'CI/CD', 'IaC', 'observabilidad'] },
              { label: 'Cómputo científico', chips: ['NumPy/SciPy', 'simulación', 'optimización', 'visualización'] },
              { label: 'Testing & QA', chips: ['Playwright', 'Vitest', 'pytest', 'evals'] },
              { label: 'Cloud & Deploy', chips: ['Vercel', 'AWS', 'Fly.io', 'GitHub Actions'] },
            ].map(({ label, chips }) => (
              <motion.div key={label} className="stack-col" variants={scaleIn}>
                <span className="db-label">{label}</span>
                <div className="chips">{chips.map((c) => <span key={c} className="chip">{c}</span>)}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section cta-final">
        <div className="wrap">
          <motion.div className="sec-tag" style={{ justifyContent: 'center' }} variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp}>
            empezar
          </motion.div>
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            ¿Cuál de estos <em>resuelve</em> tu problema?
          </motion.h2>
          <motion.p className="sub" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            Una llamada de ingeniería para escoger el camino correcto — o escópealo tú primero en 4 preguntas.
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
