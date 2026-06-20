import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { initEstimator } from '../lib/estimator.js'

// "Escopea tu proyecto": 4 preguntas → rango + fases + arquitectura
// que se dibuja en <Diagram/> vía window.__archDemo (misma página).
export default function Estimator() {
  useEffect(() => initEstimator(), [])

  return (
    <section className="section estimator" id="estimador">
      <div className="wrap">
        <div className="sec-tag reveal"><span>S-05</span> <b>escopea tu proyecto</b></div>
        <div className="services-head reveal" style={{ maxWidth: '40ch' }}>
          <h2>Cuatro preguntas. Un rango real, una arquitectura sugerida y un plan por fases.</h2>
        </div>
        <div className="estimator-grid reveal" data-delay="1">
          <div className="est-panel" id="est-panel">
            <div className="est-q" data-q="tipo">
              <label><em>01</em> ¿Qué construyes?</label>
              <div className="opts">
                <button className="opt" data-v="saas">SaaS nuevo</button>
                <button className="opt" data-v="interno">Sistema interno</button>
                <button className="opt" data-v="ia">Producto con IA</button>
                <button className="opt" data-v="rearq">Re-arquitectura</button>
              </div>
            </div>
            <div className="est-q" data-q="etapa">
              <label><em>02</em> ¿En qué etapa estás?</label>
              <div className="opts">
                <button className="opt" data-v="idea">Idea</button>
                <button className="opt" data-v="mvp">MVP / prototipo</button>
                <button className="opt" data-v="prod">En producción</button>
              </div>
            </div>
            <div className="est-q" data-q="ia">
              <label><em>03</em> ¿Necesitas IA?</label>
              <div className="opts">
                <button className="opt" data-v="core">Sí, es el core</button>
                <button className="opt" data-v="apoyo">Sí, de apoyo</button>
                <button className="opt" data-v="no">No por ahora</button>
              </div>
            </div>
            <div className="est-q" data-q="plazo">
              <label><em>04</em> ¿Plazo?</label>
              <div className="opts">
                <button className="opt" data-v="urg">&lt; 8 semanas</button>
                <button className="opt" data-v="norm">1–3 meses</button>
                <button className="opt" data-v="flex">Flexible</button>
              </div>
            </div>
          </div>
          <div className="est-out">
            <span className="out-eyebrow">estimación preliminar</span>
            <div className="est-range" id="est-range"><span className="pend">responde para calcular →</span></div>
            <div className="est-phases" id="est-phases"></div>
            <div className="est-note">
              <div className="est-arch-hint"><span className="dot"></span> <span id="est-arch-text">la arquitectura sugerida se dibuja en el diagrama vivo ↑</span></div>
              <div className="hero-actions" style={{ marginTop: 20 }}>
                <Link to="/contacto" className="btn btn-primary" id="est-cta">Recibir PDF + agenda <span className="arrow">→</span></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
