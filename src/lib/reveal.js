/* ============================================================
   reveal.js · reveal-on-scroll (extraído de main.js)
   Escanea los `.reveal` presentes y les añade `.in` al entrar en
   viewport. Robusto: IntersectionObserver como mejora + chequeo
   por scroll como garantía. Devuelve una función de limpieza para
   que React lo re-ejecute en cada cambio de ruta sin fugas.
   ============================================================ */
export function initReveal() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revs = Array.from(document.querySelectorAll('.reveal'));
  if (!revs.length) return () => {};

  if (reduce) {
    revs.forEach((r) => r.classList.add('in'));
    return () => {};
  }

  const ac = new AbortController();
  const { signal } = ac;
  let io = null;
  const timers = [];

  const pending = revs.slice();
  const check = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    for (let i = pending.length - 1; i >= 0; i--) {
      const r = pending[i].getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > -40) {
        pending[i].classList.add('in');
        pending.splice(i, 1);
      }
    }
  };

  try {
    io = new IntersectionObserver(
      (ents) => {
        ents.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    );
    revs.forEach((r) => io.observe(r));
  } catch (e) {}

  check();
  window.addEventListener('scroll', check, { passive: true, signal });
  window.addEventListener('resize', check, { signal });
  window.addEventListener('load', check, { signal });
  timers.push(setTimeout(check, 250), setTimeout(check, 900));

  return () => {
    ac.abort();
    if (io) io.disconnect();
    timers.forEach(clearTimeout);
  };
}
