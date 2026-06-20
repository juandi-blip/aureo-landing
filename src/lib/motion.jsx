/* ============================================================
   motion.jsx · primitivos de animación reutilizables
   Todos los variants y el helper chars() viven aquí para que
   los cambios de timing sean consistentes en todo el sitio.
   ============================================================ */
import { motion } from 'framer-motion'

export const ease = [0.22, 1, 0.36, 1]

// ---- Variantes de caracteres (custom = índice → delay individual) ----
export const charVHero = {
  hidden: { opacity: 0, y: 18 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.32, delay: 0.3 + i * 0.024, ease },
  }),
}

export const charVPage = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.28, delay: i * 0.016, ease },
  }),
}

// ---- Variantes de bloques ----
export const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
}

export const slideLeft = {
  hidden: { opacity: 0, x: -22 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease } },
}

// ---- Contenedor stagger ----
export function stagger(delay = 0.09, delayChildren = 0) {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: delay, delayChildren } },
  }
}

// ---- Helper: chars → array de motion.span con delay por índice ----
// variant debe aceptar `custom` (índice).
// offset: índice de partida para continuar la cuenta entre segmentos.
// Cada palabra se envuelve en un contenedor `nowrap` para que el quiebre
// de línea ocurra SOLO en los espacios — nunca a mitad de palabra (las
// letras son inline-block y, sin esto, romperían en cualquier punto).
export function chars(str, variant, offset = 0) {
  const out = []
  let idx = offset
  str.split(/(\s+)/).forEach((token, ti) => {
    if (token === '') return
    if (/^\s+$/.test(token)) {
      out.push(
        <motion.span key={`s${idx}`} custom={idx} variants={variant} style={{ display: 'inline-block', whiteSpace: 'pre' }}> </motion.span>
      )
      idx++
      return
    }
    const letters = [...token].map((c) => {
      const span = <motion.span key={`c${idx}`} custom={idx} variants={variant} style={{ display: 'inline-block' }}>{c}</motion.span>
      idx++
      return span
    })
    out.push(
      <span key={`w${ti}-${offset}`} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>{letters}</span>
    )
  })
  return out
}
