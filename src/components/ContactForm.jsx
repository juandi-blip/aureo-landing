import { useState } from 'react'

// Para activar el envío real: reemplaza FORM_ACTION por tu endpoint de
// Formspree (https://formspree.io/f/TU_ID). Mientras contenga
// 'your-form-id' el formulario queda en modo demo (no envía a un endpoint falso).
const FORM_ACTION = 'https://formspree.io/f/your-form-id'

const TONE = {
  ok: 'var(--signal-soft)',
  err: 'var(--warn)',
  info: 'var(--bone-faint)',
}

export default function ContactForm() {
  const [status, setStatus] = useState({ msg: 'Respondemos en < 24h hábiles.', kind: 'info' })
  const [sending, setSending] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()

    if (FORM_ACTION.includes('your-form-id')) {
      setStatus({ msg: 'Formulario en modo demo — conecta tu Form ID de Formspree/Netlify para activarlo.', kind: 'err' })
      return
    }

    const data = new FormData(e.currentTarget)
    setStatus({ msg: 'Enviando…', kind: 'info' })
    setSending(true)
    try {
      const res = await fetch(FORM_ACTION, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      if (res.ok) {
        e.currentTarget.reset()
        setStatus({ msg: '✓ Recibido. Te escribimos en < 24h hábiles.', kind: 'ok' })
      } else {
        setStatus({ msg: 'No se pudo enviar. Escríbenos a hola@kaivex.ai', kind: 'err' })
      }
    } catch (err) {
      setStatus({ msg: 'Error de red. Escríbenos a hola@kaivex.ai', kind: 'err' })
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="contact-form" id="contact-form" onSubmit={onSubmit}>
      <div className="field-row">
        <div className="field">
          <label htmlFor="nombre">Nombre <span className="req">*</span></label>
          <input id="nombre" name="nombre" type="text" required autoComplete="name" placeholder="Tu nombre" />
        </div>
        <div className="field">
          <label htmlFor="email">Email <span className="req">*</span></label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="tu@empresa.com" />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="empresa">Empresa</label>
          <input id="empresa" name="empresa" type="text" autoComplete="organization" placeholder="Nombre de tu empresa" />
        </div>
        <div className="field">
          <label htmlFor="tipo">¿Qué necesitas?</label>
          <select id="tipo" name="tipo" defaultValue="">
            <option value="">Selecciona…</option>
            <option>Desarrollo a medida</option>
            <option>Producto con IA</option>
            <option>Construcción de SaaS</option>
            <option>Arquitectura / re-arquitectura</option>
            <option>Aún no lo sé</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="mensaje">Tu proyecto <span className="req">*</span></label>
        <textarea id="mensaje" name="mensaje" required placeholder="Cuéntanos qué quieres construir, en qué etapa estás y qué problema resuelve."></textarea>
      </div>
      {/* honeypot anti-spam (oculto) */}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
      <div className="form-foot">
        <button type="submit" className="btn btn-primary" disabled={sending}>
          Enviar y agendar <span className="arrow">→</span>
        </button>
        <span className="form-note" id="form-status" style={{ color: TONE[status.kind] }}>{status.msg}</span>
      </div>
    </form>
  )
}
