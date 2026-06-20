import { useEffect } from 'react'
import { initBlueprint } from '../lib/blueprint.js'

// Fondo firma + halo del cursor. Monta el canvas y arranca el módulo
// vanilla una sola vez (vive durante toda la sesión, fuera del router).
export default function BlueprintBackground() {
  useEffect(() => {
    const cleanup = initBlueprint()
    return cleanup
  }, [])

  return (
    <>
      <div className="blueprint-bg" aria-hidden="true">
        <canvas id="bp-canvas"></canvas>
      </div>
      <div className="cursor-halo" id="cursor-halo" aria-hidden="true"></div>
    </>
  )
}
