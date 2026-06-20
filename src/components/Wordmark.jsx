import { Link } from 'react-router-dom'

// Logotipo reutilizable (nav + footer). Enlaza siempre al inicio.
export default function Wordmark() {
  return (
    <Link className="wordmark" to="/" aria-label="Kaivex AI — inicio">
      <span className="glyph" aria-hidden="true"></span>
      <span className="text"><b>Kaivex</b><span>&nbsp;AI</span></span>
    </Link>
  )
}
