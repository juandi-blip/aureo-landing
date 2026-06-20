/* ============================================================
   KAIVEX AI — WOVEN (hero signature)
   woven.js · campo de partículas Three.js sobre un torus-knot
   ------------------------------------------------------------
   Firma del hero en el tema dark premium: ~18k partículas
   muestreadas sobre un TorusKnot, teñidas en el rango azul–
   violeta de la marca (NO arcoíris). Rotación lenta + repulsión
   suave con el cursor (las partículas se apartan y vuelven a su
   sitio con damping). 100% front-end, sin API.

   Contrato del proyecto: initWoven() encuentra su canvas por id,
   hace bail si no existe, respeta prefers-reduced-motion y
   devuelve una función de limpieza (AbortController +
   cancelAnimationFrame + dispose) para que React lo desmonte sin
   fugas de listeners ni de memoria GPU.
   ============================================================ */
import * as THREE from 'three'

export function initWoven() {
  const canvas = document.getElementById('woven-canvas')
  if (!canvas) return () => {}

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  camera.position.z = 5

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(dpr)

  function size() {
    const w = canvas.clientWidth || canvas.offsetWidth || window.innerWidth
    const h = canvas.clientHeight || canvas.offsetHeight || window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }
  size()

  // --- partículas sobre el torus-knot ---
  const PARTICLES = 18000
  const knot = new THREE.TorusKnotGeometry(1.5, 0.5, 200, 32)
  const knotPos = knot.attributes.position
  const knotCount = knotPos.count

  const positions = new Float32Array(PARTICLES * 3)
  const original = new Float32Array(PARTICLES * 3)
  const colors = new Float32Array(PARTICLES * 3)
  const velocities = new Float32Array(PARTICLES * 3)

  const color = new THREE.Color()
  for (let i = 0; i < PARTICLES; i++) {
    const v = i % knotCount
    const x = knotPos.getX(v)
    const y = knotPos.getY(v)
    const z = knotPos.getZ(v)
    const k = i * 3
    positions[k] = original[k] = x
    positions[k + 1] = original[k + 1] = y
    positions[k + 2] = original[k + 2] = z
    // hue acotado al rango azul–violeta de marca (0.60–0.75)
    color.setHSL(0.6 + Math.random() * 0.15, 0.8, 0.55)
    colors[k] = color.r
    colors[k + 1] = color.g
    colors[k + 2] = color.b
  }
  knot.dispose()

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.02,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const points = new THREE.Points(geometry, material)
  scene.add(points)

  // --- reduced-motion: un frame estático y fuera ---
  if (reduce) {
    renderer.render(scene, camera)
    return () => {
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }

  // --- interacción + animación ---
  const controller = new AbortController()
  const { signal } = controller
  const mouse = new THREE.Vector2(-10, -10)
  const clock = new THREE.Clock()

  window.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect()
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1
    mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1
  }, { signal })

  window.addEventListener('resize', size, { signal })

  const mouseWorld = new THREE.Vector3()
  const cur = new THREE.Vector3()
  const dir = new THREE.Vector3()
  let raf = 0

  function frame() {
    raf = requestAnimationFrame(frame)
    const t = clock.getElapsedTime()
    mouseWorld.set(mouse.x * 3, mouse.y * 3, 0)

    const pos = geometry.attributes.position.array
    for (let i = 0; i < PARTICLES; i++) {
      const k = i * 3
      cur.set(pos[k], pos[k + 1], pos[k + 2])
      const dist = cur.distanceTo(mouseWorld)
      if (dist < 1.5) {
        const force = (1.5 - dist) * 0.01
        dir.subVectors(cur, mouseWorld).normalize().multiplyScalar(force)
        velocities[k] += dir.x
        velocities[k + 1] += dir.y
        velocities[k + 2] += dir.z
      }
      // retorno suave al origen
      velocities[k] += (original[k] - pos[k]) * 0.001
      velocities[k + 1] += (original[k + 1] - pos[k + 1]) * 0.001
      velocities[k + 2] += (original[k + 2] - pos[k + 2]) * 0.001
      // damping
      velocities[k] *= 0.95
      velocities[k + 1] *= 0.95
      velocities[k + 2] *= 0.95

      pos[k] += velocities[k]
      pos[k + 1] += velocities[k + 1]
      pos[k + 2] += velocities[k + 2]
    }
    geometry.attributes.position.needsUpdate = true
    points.rotation.y = t * 0.05
    renderer.render(scene, camera)
  }
  frame()

  return () => {
    controller.abort()
    cancelAnimationFrame(raf)
    geometry.dispose()
    material.dispose()
    renderer.dispose()
  }
}
