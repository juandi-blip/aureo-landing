import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { chars, charVPage, fadeUp, fadeIn, slideLeft, scaleIn, stagger } from '../lib/motion.jsx'
import ContactForm from '../components/ContactForm.jsx'

const vp = { once: true, margin: '-60px' }

export default function Contacto() {
  usePageMeta(
    'Contacto — Kaivex AI · Agenda una conversación de ingeniería',
    'Sobre Kaivex AI y cómo trabajar con nosotros. Una llamada, una conversación de ingeniería, un plan.'
  )

  return (
    <>
      <header className="page-head">
        <div className="wrap">
          <motion.span className="ph-eyebrow" variants={slideLeft} initial="hidden" whileInView="visible" viewport={vp}>
            Contacto
          </motion.span>

          <motion.h1 initial="hidden" whileInView="visible" viewport={vp}>
            <span className="hero-title-line">Hablemos</span>
            <span className="hero-ghost-line">de tu próximo producto.</span>
          </motion.h1>

          <motion.p className="ph-sub" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            Sin precios públicos ni formularios disfrazados. Cuéntanos qué quieres construir y te respondemos
            con honestidad técnica — incluso si la respuesta es "esto no lo necesitas todavía".
          </motion.p>
        </div>
      </header>

      {/* K-01 · SOBRE EL ESTUDIO */}
      <section className="section">
        <div className="wrap">
          <motion.div className="sec-tag" variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp}>
            <span>K-01</span> <b>sobre el estudio</b>
          </motion.div>
          <div className="about-grid">
            <motion.div className="about-copy" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
              <h2>Un estudio senior-led de software con IA.</h2>
              <p>Kaivex AI nace de una idea simple: la mayoría de los negocios no necesitan más software genérico, necesitan el sistema correcto, bien construido y que sea suyo.</p>
              <p>Trabajamos de forma directa, sin capas intermedias. Quien diseña tu arquitectura es quien la construye. Validamos rápido con demos para reducir riesgo y escalamos a medida con cimientos que aguantan el crecimiento.</p>
              <p>La IA es parte de cómo trabajamos en cada fase — no una etiqueta de marketing, sino una herramienta para entregar software de calidad excepcional más rápido.</p>
            </motion.div>
            <motion.div
              className="about-stats"
              variants={stagger(0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
            >
              {[
                { b: '9', u: '', l: 'años enviando producción' },
                { b: '40', u: '+', l: 'sistemas en operación' },
                { b: '100', u: '%', l: 'senior-led' },
                { b: '<24', u: 'h', l: 'tiempo de respuesta' },
              ].map(({ b, u, l }) => (
                <motion.div key={l} className="cell" variants={scaleIn}>
                  <b>{b}{u && <span className="u">{u}</span>}</b>
                  <span>{l}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* K-02 · FORMULARIO */}
      <section className="section" id="agenda" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <motion.div className="sec-tag" variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp}>
            <span>K-02</span> <b>cuéntanos tu proyecto</b>
          </motion.div>
          <motion.div className="contact-grid" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp}>
            <ContactForm />

            <motion.aside
              className="contact-aside"
              variants={stagger(0.1, 0.15)}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
            >
              {[
                {
                  l: 'Email directo',
                  b: <a href="mailto:hola@kaivex.ai">hola@kaivex.ai</a>,
                  p: 'Si prefieres escribir tú mismo, va directo a un humano.',
                },
                {
                  l: 'Qué pasa después',
                  p: 'Leemos tu mensaje, te escribimos para agendar una llamada de 30 min y salimos de ahí con un siguiente paso claro — no con un PDF de ventas.',
                },
                {
                  l: '¿Aún explorando?',
                  p: 'Escopea tu proyecto en 4 preguntas y obtén un rango y una arquitectura sugerida.',
                  b: <Link to="/#estimador">Ir al estimador →</Link>,
                },
                {
                  l: 'Disponibilidad',
                  b: 'Q3 · cupos limitados',
                  p: 'Tomamos pocos proyectos a la vez para mantener el nivel senior-led.',
                },
              ].map(({ l, b, p }, i) => (
                <motion.div key={i} className="aside-item" variants={fadeUp}>
                  <span className="ai-l">{l}</span>
                  {b && <b>{b}</b>}
                  {p && <p>{p}</p>}
                </motion.div>
              ))}
            </motion.aside>
          </motion.div>
        </div>
      </section>
    </>
  )
}
