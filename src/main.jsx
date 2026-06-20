import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// Estilos: el orden importa (base → sections → extras → pages).
import './styles/base.css'
import './styles/sections.css'
import './styles/extras.css'
import './styles/pages.css'
import './styles/fusion-tokens.css'

import App from './App.jsx'
import Home from './pages/Home.jsx'
import Servicios from './pages/Servicios.jsx'
import Metodo from './pages/Metodo.jsx'
import Casos from './pages/Casos.jsx'
import Contacto from './pages/Contacto.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'servicios', element: <Servicios /> },
      { path: 'metodo', element: <Metodo /> },
      { path: 'casos', element: <Casos /> },
      { path: 'contacto', element: <Contacto /> },
    ],
  },
])

// Nota: sin <React.StrictMode> a propósito — sus efectos dobles en dev
// re-inicializarían los módulos canvas/scroll (rAF y listeners duplicados).
ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
)
