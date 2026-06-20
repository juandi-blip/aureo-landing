import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Actualiza <title> y metadatos por ruta (SPA no recarga el head).
// Mantiene en sync description, og:* y twitter:* para que cada ruta
// comparta bien en redes y buscadores.
function setMeta(selector, attr, value, content) {
  let tag = document.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, value)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export function usePageMeta(title, description) {
  const { pathname } = useLocation()

  useEffect(() => {
    if (title) {
      document.title = title
      setMeta('meta[property="og:title"]', 'property', 'og:title', title)
      setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    }
    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description)
      setMeta('meta[property="og:description"]', 'property', 'og:description', description)
      setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    }
    // Actualizar og:url dinámicamente según ruta actual
    const currentUrl = `https://kaivexai.com${pathname}`
    setMeta('meta[property="og:url"]', 'property', 'og:url', currentUrl)
  }, [title, description, pathname])
}
