/* ============================================================
   miniNodes.js · mini-nodos animados en las tarjetas de servicio
   (extraído de main.js). Cada canvas `.mini-node` dibuja 3 nodos
   triangulados con un paquete viajando. Pausa fuera de pantalla.
   Devuelve limpieza (cancela rAF + observer).
   ============================================================ */
export function initMiniNodes() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const minis = document.querySelectorAll('.mini-node');
  if (!minis.length) return () => {};

  const dpr = Math.min(devicePixelRatio || 1, 2);
  const miniCtxs = [];
  minis.forEach((cv) => {
    const ctx = cv.getContext('2d');
    const size = 84;
    cv.width = size * dpr;
    cv.height = size * dpr;
    cv.style.width = size + 'px';
    cv.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pts = [{ x: 16, y: 20 }, { x: 66, y: 14 }, { x: 44, y: 66 }];
    const edges = [[0, 1], [1, 2], [0, 2]];
    const variant = cv.dataset.mini || 'default';
    miniCtxs.push({ ctx, size, pts, edges, t: Math.random(), variant });
  });

  function drawSci(m) {
    const { ctx, size } = m;
    ctx.clearRect(0, 0, size, size);
    // Ejes sutiles
    ctx.strokeStyle = 'rgba(91,140,255,0.25)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(8, 42); ctx.lineTo(76, 42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, 8); ctx.lineTo(8, 76); ctx.stroke();
    // Curva seno amortiguada
    ctx.strokeStyle = '#5b8cff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let px = 8; px <= 76; px++) {
      const norm = (px - 8) / 68;
      const amp = 22 * Math.exp(-3 * norm);
      const py = 42 - amp * Math.sin(6 * norm * Math.PI + m.t * 4);
      if (px === 8) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Punto viajero sobre la curva
    const norm = m.t % 1;
    const px = 8 + norm * 68;
    const amp = 22 * Math.exp(-3 * norm);
    const py = 42 - amp * Math.sin(6 * norm * Math.PI + m.t * 4);
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#5b8cff';
    ctx.shadowColor = 'rgba(91,140,255,0.7)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawMini(m) {
    if (m.variant === 'sci') { drawSci(m); return; }
    const { ctx, size, pts, edges } = m;
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(91,140,255,0.38)';
    ctx.lineWidth = 1;
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);
      ctx.stroke();
    });
    const e = edges[0], a = pts[e[0]], b = pts[e[1]];
    const x = a.x + (b.x - a.x) * m.t, y = a.y + (b.y - a.y) * m.t;
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = '#5b8cff';
    ctx.shadowColor = 'rgba(91,140,255,0.7)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.rect(p.x - 5, p.y - 5, 10, 10);
      ctx.fillStyle = '#181b24';
      ctx.fill();
      ctx.strokeStyle = '#5b8cff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = '#5b8cff';
      ctx.fill();
    });
  }

  let miniRaf = null, miniVisible = false, io = null;
  function miniLoop() {
    miniCtxs.forEach((m) => {
      m.t += 0.012;
      if (m.t > 1) m.t -= 1;
      drawMini(m);
    });
    miniRaf = miniVisible ? requestAnimationFrame(miniLoop) : null;
  }

  if (reduce) {
    miniCtxs.forEach(drawMini);
    return () => {};
  }

  miniVisible = true;
  miniLoop();
  try {
    const svc = document.querySelector('.services');
    io = new IntersectionObserver(
      (ents) => {
        ents.forEach((en) => {
          miniVisible = en.isIntersecting;
          if (miniVisible && !miniRaf) miniLoop();
        });
      },
      { threshold: 0.02 }
    );
    if (svc) io.observe(svc);
  } catch (e) {}

  return () => {
    miniVisible = false;
    if (miniRaf) cancelAnimationFrame(miniRaf);
    if (io) io.disconnect();
  };
}
