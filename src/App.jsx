import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import BlueprintBackground from './components/BlueprintBackground.jsx'
import { initReveal } from './lib/reveal.js'

const pageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, y: -6, transition: { duration: 0.15 } },
}

export default function App() {
  const location = useLocation()

  useEffect(() => {
    const cleanup = initReveal()

    if (location.hash) {
      const el = document.querySelector(location.hash)
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      }
    } else {
      window.scrollTo(0, 0)
    }

    return cleanup
  }, [location.pathname, location.hash])

  return (
    <>
      <BlueprintBackground />
      <Nav />
      <main className="site" id="top">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.key}
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ width: '100%' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </>
  )
}
