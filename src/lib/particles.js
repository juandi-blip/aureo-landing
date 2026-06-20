/* ============================================================
   particles.js · CAMPO DE GUIONES DE COLOR (firma del hero)
   Inspirado en el "liftoff field" de Antigravity: cientos de
   guiones cortos en la paleta plasma de AUREO, distribuidos con
   más densidad hacia los bordes (deja respirar el titular) y con
   un parpadeo + deriva muy sutil. Respeta prefers-reduced-motion.
   init() encuentra #hero-particles, devuelve limpieza.
   ============================================================ */
const COLORS = ['#5b8cff', '#5b8cff', '#6f4fff', '#3a6df0', '#8aa6ff', '#00b8e6'];

export function initParticles() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ac = new AbortController();
  const { signal } = ac;
  let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let dashes = [];
  let raf = 0;

  function build() {
    const r = canvas.parentElement.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // densidad proporcional al área; más guiones en pantallas grandes
    const count = Math.round(Math.min(260, Math.max(90, (w * h) / 6200)));
    const cx = w * 0.5, cy = h * 0.46;
    const maxR = Math.hypot(w, h) * 0.5;
    dashes = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      // hueco central: menos densidad cerca del titular
      const d = Math.hypot(x - cx, y - cy) / maxR;     // 0 centro · 1 borde
      if (d < 0.28 && Math.random() > d * 2.4) { i--; continue; }
      dashes.push({
        x, y,
        angle: Math.random() * Math.PI,
        len: 7 + Math.random() * 9,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        alpha: 0.25 + Math.min(0.6, d) * 0.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.1,
        drift: 0.2 + Math.random() * 0.4,
      });
    }
  }

  function paint(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    for (const p of dashes) {
      const tw = reduce ? 1 : 0.6 + 0.4 * Math.sin(p.phase + t * 0.001 * p.speed);
      const dy = reduce ? 0 : Math.sin(p.phase + t * 0.0006 * p.speed) * p.drift;
      ctx.globalAlpha = p.alpha * tw;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.4;
      ctx.save();
      ctx.translate(p.x, p.y + dy);
      ctx.rotate(p.angle);
      ctx.beginPath();
      ctx.moveTo(-p.len / 2, 0);
      ctx.lineTo(p.len / 2, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  build();
  if (reduce) {
    paint(0);
  } else {
    const loop = (t) => { paint(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { dpr = Math.min(window.devicePixelRatio || 1, 2); build(); if (reduce) paint(0); }, 160);
  }, { signal });

  return () => {
    ac.abort();
    clearTimeout(rt);
    if (raf) cancelAnimationFrame(raf);
  };
}
