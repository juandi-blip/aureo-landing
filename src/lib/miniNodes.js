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
    // Canvas de fondo completo (svc-card__canvas): usa dimensiones del padre
    const isFullBleed = cv.classList.contains('svc-card__canvas');
    const parent = cv.parentElement;
    const w = isFullBleed && parent ? parent.offsetWidth || 360 : 84;
    const h = isFullBleed && parent ? parent.offsetHeight || 260 : 84;
    const size = isFullBleed ? Math.min(w, h) : 84; // lógica de dibujo usa coordenadas cuadradas
    cv.width = w * dpr;
    cv.height = h * dpr;
    if (!isFullBleed) {
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Escalar puntos de referencia al área real si es full-bleed
    const scale = isFullBleed ? Math.min(w, h) / 84 : 1;
    const pts = [
      { x: 16 * scale, y: 20 * scale },
      { x: 66 * scale, y: 14 * scale },
      { x: 44 * scale, y: 66 * scale },
    ];
    const edges = [[0, 1], [1, 2], [0, 2]];
    const variant = cv.dataset.mini || 'default';
    miniCtxs.push({ ctx, size, w, h, pts, edges, t: Math.random(), variant, isFullBleed, scale });
  });

  function drawSci(m) {
    const { ctx, w, h, scale } = m;
    ctx.clearRect(0, 0, w, h);
    const s = scale || 1;
    const cy = h / 2;
    const x0 = 8 * s, x1 = 76 * s, midY = cy;
    // Ejes sutiles
    ctx.strokeStyle = 'rgba(91,140,255,0.25)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x0, midY); ctx.lineTo(x1, midY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, 8 * s); ctx.lineTo(x0, h - 8 * s); ctx.stroke();
    // Curva seno amortiguada
    ctx.strokeStyle = '#5b8cff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let px = x0; px <= x1; px++) {
      const norm = (px - x0) / (x1 - x0);
      const amp = 22 * s * Math.exp(-3 * norm);
      const py = midY - amp * Math.sin(6 * norm * Math.PI + m.t * 4);
      if (px === x0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Punto viajero sobre la curva
    const norm = m.t % 1;
    const px = x0 + norm * (x1 - x0);
    const amp = 22 * s * Math.exp(-3 * norm);
    const py = midY - amp * Math.sin(6 * norm * Math.PI + m.t * 4);
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
    const { ctx, w, h, pts, edges } = m;
    ctx.clearRect(0, 0, w, h);
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
