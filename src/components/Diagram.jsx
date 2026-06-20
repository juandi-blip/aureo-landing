import { useEffect } from 'react'
import { initDiagram } from '../lib/diagram.js'

// Diagrama de arquitectura interactivo (pieza firma). El módulo vanilla
// dibuja sobre #arch-canvas y expone window.__archDemo para el estimador.
export default function Diagram() {
  useEffect(() => initDiagram(), [])

  return (
    <section className="section diagram" id="diagrama">
      <div className="wrap">
        <div className="sec-tag reveal"><span>S-03</span> <b>arquitectura · interactiva</b></div>
        <div className="diagram-head reveal">
          <h2>Cablea el sistema. Mira viajar los datos.</h2>
          <p>Arrastra los nodos y conéctalos. Las conexiones válidas hacen <span className="mono signal">snap</span> y empiezan a transmitir paquetes — con latencia y costo actualizándose en vivo. Esto es lo que vendemos, hecho tocable.</p>
        </div>

        <div className="canvas-shell reveal" data-delay="1">
          <canvas className="diagram-canvas" id="arch-canvas" aria-label="Diagrama de arquitectura interactivo"></canvas>

          <div className="diagram-hud" id="arch-hud">
            <span className="hud-pill"><span className="lbl">latencia p95</span> <b id="hud-lat">—</b></span>
            <span className="hud-pill"><span className="lbl">costo / 1M req</span> <b id="hud-cost">—</b></span>
            <span className="hud-pill"><span className="lbl">conexiones</span> <b id="hud-edges">0</b></span>
            <span className="hud-pill"><span className="lbl">throughput</span> <b id="hud-thru">0 rps</b></span>
          </div>

          <div className="diagram-toolbar">
            <button className="tool-btn" id="tool-auto">⟲ auto-cablear</button>
            <button className="tool-btn" id="tool-reset">↺ reiniciar</button>
            <button className="tool-btn" id="tool-fallback">▤ ver tabla</button>
            <span className="tool-hint" id="tool-hint">arrastra un nodo para empezar · <span className="demo-on" id="demo-flag">auto-demo en 4s</span></span>
          </div>

          <div className="diagram-fallback" id="arch-fallback" role="region" aria-label="Arquitectura — versión tabla">
            <table>
              <thead><tr><th>nodo</th><th>rol</th><th>latencia</th><th>conecta con</th></tr></thead>
              <tbody id="fallback-rows"></tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
