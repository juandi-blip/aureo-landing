/* ============================================================
   sim.js · integrador numérico RK4 de un oscilador armónico amortiguado
   Modelo físico: m·x'' = -k·x - c·x'  (estado y = [x, v]).
   Módulo PURO: sin DOM, sin window, sin efectos secundarios.
   100% testeable en Node — toda la simulación se reduce a aritmética
   sobre el estado, así que sirve igual en el navegador que en tests.
   ============================================================ */

// Derivada del sistema: recibe estado [x, v] y params, retorna [dx, dv].
export function deriv([x, v], { m, k, c }) {
  return [v, (-k * x - c * v) / m]
}

// Un paso de Runge-Kutta de 4º orden.
// f(state) -> dstate (ya con los params capturados). h = tamaño del paso.
export function rk4Step(f, y, h) {
  const k1 = f(y)
  const k2 = f(y.map((yi, i) => yi + (h / 2) * k1[i]))
  const k3 = f(y.map((yi, i) => yi + (h / 2) * k2[i]))
  const k4 = f(y.map((yi, i) => yi + h * k3[i]))
  return y.map((yi, i) => yi + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]))
}

// Simula el sistema y retorna un array de { t, x, v }.
export function simulate({ m = 1, k = 1, c = 0, x0 = 1, v0 = 0, tMax = 20, h = 0.02 } = {}) {
  const f = (y) => deriv(y, { m, k, c })
  const out = []
  let y = [x0, v0]
  let t = 0
  const steps = Math.round(tMax / h)
  for (let i = 0; i <= steps; i++) {
    out.push({ t, x: y[0], v: y[1] })
    y = rk4Step(f, y, h)
    t += h
  }
  return out
}
