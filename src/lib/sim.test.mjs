/* ============================================================
   sim.test.mjs · tests del integrador RK4 (runner nativo de Node)
   Ejecutar: node --test src/lib/sim.test.mjs
   Valida el oscilador armónico amortiguado contra física conocida:
   solución analítica, conservación de energía y decaimiento.
   ============================================================ */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { simulate } from './sim.js'

test('reproduce la solución analítica x(t)=cos(t) sin amortiguar', () => {
  // m=1, k=1, c=0, x0=1, v0=0  ->  x(t) = cos(t)
  const out = simulate({ m: 1, k: 1, c: 0, x0: 1, v0: 0, tMax: Math.PI, h: 0.01 })
  const last = out[out.length - 1]
  assert.ok(
    Math.abs(last.x - Math.cos(Math.PI)) < 1e-3,
    `x(π) ≈ -1 esperado, obtenido ${last.x}`
  )
})

test('conserva la energía cuando no hay amortiguamiento (c=0)', () => {
  const m = 1
  const k = 1
  const out = simulate({ m, k, c: 0, x0: 1, v0: 0, tMax: 20, h: 0.01 })
  const energia = ({ x, v }) => 0.5 * m * v * v + 0.5 * k * x * x
  const e0 = energia(out[0])
  const eN = energia(out[out.length - 1])
  const relativo = Math.abs(eN - e0) / e0
  assert.ok(relativo < 1e-3, `diferencia relativa de energía ${relativo} debe ser < 1e-3`)
})

test('la amplitud decae cuando hay amortiguamiento (c>0)', () => {
  const out = simulate({ m: 1, k: 1, c: 0.5, x0: 1, v0: 0, tMax: 20, h: 0.01 })
  const mitad = Math.floor(out.length / 2)
  const ampMax = (arr) => arr.reduce((max, p) => Math.max(max, Math.abs(p.x)), 0)
  const primera = ampMax(out.slice(0, mitad))
  const segunda = ampMax(out.slice(mitad))
  assert.ok(
    primera > segunda,
    `amplitud primera mitad (${primera}) debe ser > segunda mitad (${segunda})`
  )
})
