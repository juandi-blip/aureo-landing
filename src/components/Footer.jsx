import { Link } from 'react-router-dom'
import Wordmark from './Wordmark.jsx'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-col foot-brand">
            <Wordmark />
            <p>Estudio de desarrollo de software con IA. Demos rápidas para validar, arquitectura a medida para escalar. Sistemas que posees, construidos para durar.</p>
          </div>
          <div className="foot-col">
            <h5>Estudio</h5>
            <Link to="/metodo">Método</Link>
            <Link to="/servicios">Servicios</Link>
            <Link to="/casos">Casos</Link>
            <Link to="/metodo#proceso">Proceso</Link>
          </div>
          <div className="foot-col">
            <h5>Empezar</h5>
            <Link to="/#estimador">Escopea tu proyecto</Link>
            <Link to="/#diagrama">Diagrama vivo</Link>
            <Link to="/contacto">Agenda una llamada</Link>
          </div>
          <div className="foot-col">
            <h5>Contacto</h5>
            <a href="mailto:hola@kaivex.ai">hola@kaivex.ai</a>
            <a href="#" rel="noopener">LinkedIn</a>
            <a href="#" rel="noopener">GitHub</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span className="legal">© {year} Kaivex AI · [ Razón social ]</span>
          <span className="sys-status"><span className="led" aria-hidden="true"></span> system status: <b>operational</b> · uptime 99.98%</span>
        </div>
      </div>
    </footer>
  )
}
