import { useEffect, useRef, useState } from 'react'
import { simulate } from '../lib/sim.js'

/* ============================================================
   SciSim · simulador interactivo de un oscilador amortiguado.
   Dibuja la trayectoria x(t) en un canvas y deja ajustar el
   amortiguamiento (c) y la rigidez (k) con sliders. Estático:
   solo redibuja al cambiar parámetros (no anima frame a frame),
   así que cumple prefers-reduced-motion sin rAF.
   ============================================================ */
export default function SciSim() {
  const canvasRef = useRef(null)
  const [c, setC] = useState(0.3) // amortiguamiento
  const [k, setK] = useState(1) // rigidez

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width))
    const h = Math.max(1, Math.round(rect.height))
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // Muestreo de la trayectoria.
    const data = simulate({ m: 1, k, c, x0: 1, v0: 0, tMax: 20, h: 0.05 })
    if (!data.length) return

    const pad = 16
    const mid = h / 2
    const tMax = data[data.length - 1].t || 1
    // Escala vertical: x parte en 1 (amplitud inicial). Dejamos margen.
    const ampMax = data.reduce((mx, p) => Math.max(mx, Math.abs(p.x)), 0) || 1
    const yScale = (mid - pad) / ampMax
    const xScale = (w - pad * 2) / tMax
    const toX = (t) => pad + t * xScale
    const toY = (x) => mid - x * yScale

    // Ejes sutiles.
    ctx.strokeStyle = 'rgba(91,140,255,0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad, mid)
    ctx.lineTo(w - pad, mid)
    ctx.moveTo(pad, pad)
    ctx.lineTo(pad, h - pad)
    ctx.stroke()

    // Curva x(t) con glow suave.
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    data.forEach((p, i) => {
      const px = toX(p.t)
      const py = toY(p.x)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.shadowColor = 'rgba(91,140,255,0.7)'
    ctx.shadowBlur = 10
    ctx.strokeStyle = '#5b8cff'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.shadowBlur = 0
  }, [c, k])

  return (
    <div className="scisim">
      <div className="scisim-controls">
        <label>
          <span>Amortiguamiento (c) <b>{c.toFixed(2)}</b></span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={c}
            onChange={(e) => setC(Number(e.target.value))}
          />
        </label>
        <label>
          <span>Rigidez (k) <b>{k.toFixed(2)}</b></span>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.1"
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
          />
        </label>
      </div>
      <canvas ref={canvasRef} className="scisim-canvas" />
      <p className="scisim-caption">
        Posición de un oscilador amortiguado en el tiempo. Sube el amortiguamiento
        y la oscilación se apaga antes; sube la rigidez y vibra más rápido.
      </p>
    </div>
  )
}
