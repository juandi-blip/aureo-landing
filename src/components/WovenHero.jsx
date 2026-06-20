import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { initWoven } from '../lib/woven.js'
import { chars, charVHero, fadeUp, stagger } from '../lib/motion.jsx'

/* Hero "Woven" — firma del sitio. Campo de partículas Three.js
   (src/lib/woven.js) de fondo + contenido por encima. El título
   aparece letra por letra; el resto entra escalonado. */
export default function WovenHero() {
  useEffect(() => initWoven(), [])

  return (
    <section className="hero hero-woven" id="hero">
      <canvas className="hero-woven-canvas" id="woven-canvas" aria-hidden="true"></canvas>
      <div className="wrap">
        <div className="hero-inner">

          <motion.div
            className="hero-status"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="live" aria-hidden="true"></span>
            <span className="mono">estudio de software con IA + ciencia · senior-led · disponible Q3</span>
          </motion.div>

          {/* H1 · letra por letra · lema */}
          <motion.h1 initial="hidden" animate="visible">
            {chars('Resolvemos lo complejo.', charVHero, 0)}
            <br className="brk" />
            <em>{chars('Con software y ciencia.', charVHero, 23)}</em>
          </motion.h1>

          <motion.p
            className="hero-sub"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.4 }}
          >
            Construimos software a medida e IA que tu negocio posee — y cuando el problema
            no cabe en software genérico, lo modelamos con física y matemáticas. Conocimiento
            científico real más ingeniería que entrega.
          </motion.p>

          <motion.div
            className="hero-actions"
            variants={stagger(0.1, 1.6)}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp}>
              <Link to="/contacto" className="btn btn-primary">Agenda una llamada <span className="arrow">→</span></Link>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Link to="/servicios" className="btn btn-ghost">Ver servicios</Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero-meta"
            variants={stagger(0.1, 1.85)}
            initial="hidden"
            animate="visible"
          >
            {[
              { b: '9', s: 'años enviando producción' },
              { b: '40+', s: 'sistemas en operación' },
              { b: '100%', s: 'senior-led' },
            ].map(({ b, s }) => (
              <motion.div key={s} className="m" variants={fadeUp}>
                <b>{b}</b><span>{s}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
