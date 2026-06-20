import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import Wordmark from './Wordmark.jsx'

// Orden = jerarquía del sitio (igual que el layout.js original).
const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/servicios', label: 'Servicios' },
  { to: '/metodo', label: 'Método' },
  { to: '/casos', label: 'Casos' },
  { to: '/contacto', label: 'Contacto' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  // barra "stuck" al hacer scroll (antes en main.js)
  useEffect(() => {
    const nav = document.getElementById('nav')
    const onScroll = () => nav.classList.toggle('stuck', window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // bloquea/desbloquea el body cuando el menú móvil está abierto + cierre con Escape
  useEffect(() => {
    document.body.classList.toggle('nav-open', open)
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="nav" id="nav">
      <div className="wrap">
        <Wordmark />
        <nav className="nav-links" aria-label="Principal">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="nav-cta">
          <NavLink to="/contacto" className="btn btn-primary">
            Agenda una llamada <span className="arrow">→</span>
          </NavLink>
          <button
            className={'nav-toggle' + (open ? ' on' : '')}
            id="nav-toggle"
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="nav-mobile"
            onClick={() => setOpen((v) => !v)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <nav className="nav-mobile" id="nav-mobile" aria-label="Móvil" hidden={!open}>
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}>{l.label}</NavLink>
        ))}
        <NavLink className="m-cta" to="/contacto" onClick={() => setOpen(false)}>Agenda una llamada →</NavLink>
      </nav>
    </header>
  )
}
