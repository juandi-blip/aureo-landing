import { useEffect } from 'react'
import { initBuildSaas } from '../lib/buildSaas.js'

// Secuencia "build-a-saas" dirigida por scroll. El mock interno lo
// inyecta el módulo vanilla; aquí montamos el contenedor sticky.
export default function BuildSaas() {
  useEffect(() => initBuildSaas(), [])

  return (
    <section className="build" id="build">
      <div className="build-track" id="build-track">
        <div className="build-sticky">
          <div className="wrap build-stage">
            <div className="sec-tag"><span>S-B</span> <b>el pipeline, en un solo gesto</b></div>
            <div className="build-grid">
              <div className="build-steps" id="build-steps">
                <div className="build-step on" data-step="0"><div className="st-no">01 · arquitectura</div><h4>Wireframe en blanco</h4><p>Definimos el esqueleto del sistema.</p></div>
                <div className="build-step" data-step="1"><div className="st-no">02 · desarrollo</div><h4>UI estilizada</h4><p>El producto toma forma y carácter.</p></div>
                <div className="build-step" data-step="2"><div className="st-no">03 · saas</div><h4>Poblado con datos vivos</h4><p>Multi-tenant, billing, datos reales.</p></div>
                <div className="build-step" data-step="3"><div className="st-no">04 · ia + deploy</div><h4>Shipped</h4><p>IA conectada y deploy a producción.</p></div>
              </div>
              <div className="mock" id="build-mock">
                <div className="mock-bar"><i></i><i></i><i></i><span className="url mono" id="mock-url">localhost:3000</span></div>
                <div className="mock-body" id="mock-body"></div>
                <div className="deploy-bar" id="deploy-bar"></div>
                <div className="toast" id="build-toast">✓ shipped to production</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
