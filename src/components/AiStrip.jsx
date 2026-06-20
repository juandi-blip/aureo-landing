import { useEffect } from 'react'
import { initAiStrip } from '../lib/aiStrip.js'

// Tira de IA en vivo del hero. El markup conserva los mismos IDs que
// el módulo vanilla busca por getElementById/querySelectorAll.
export default function AiStrip() {
  useEffect(() => initAiStrip(), [])

  return (
    <div className="ai-strip reveal" data-delay="2" id="ai-strip">
      <div className="ai-head">
        <span className="dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>kaivex.engine</span>
        <span className="tag" id="ai-state">● listo</span>
      </div>
      <form className="ai-input-row" id="ai-form">
        <span className="prompt" aria-hidden="true">›</span>
        <input className="ai-input" id="ai-input" type="text" autoComplete="off"
          placeholder="describe tu producto… p. ej. 'CRM para clínicas dentales'"
          aria-label="Describe tu idea de producto" />
        <button className="ai-run" type="submit">generar ↵</button>
      </form>
      <div className="ai-body">
        <div className="ai-tabs" role="tablist" aria-label="Salida del motor">
          <button className="ai-tab on" data-tab="features" role="tab">features</button>
          <button className="ai-tab" data-tab="schema" role="tab">esquema SQL</button>
          <button className="ai-tab" data-tab="component" role="tab">componente</button>
        </div>
        <div className="ai-stream" id="ai-stream" aria-live="polite"></div>
      </div>
    </div>
  )
}
