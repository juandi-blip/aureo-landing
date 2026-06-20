/* ============================================================
   blueprint.js · retícula de plano viva (fondo firma)
   Dibuja la grilla una vez por resize; el cursor produce parallax
   (transform GPU) + halo radial. Respeta prefers-reduced-motion.
   init() devuelve limpieza (listeners + rAF + timeouts).
   ============================================================ */
export function initBlueprint() {
  const canvas = document.getElementById('bp-canvas');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ac = new AbortController();
  const { signal } = ac;
  let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  const GRID = 34;

  function draw() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const pad = GRID * 2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.beginPath();
    for (let x = -pad; x <= w + pad; x += GRID) { ctx.moveTo(x + 0.5, -pad); ctx.lineTo(x + 0.5, h + pad); }
    for (let y = -pad; y <= h + pad; y += GRID) { ctx.moveTo(-pad, y + 0.5); ctx.lineTo(w + pad, y + 0.5); }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let x = -pad; x <= w + pad; x += GRID) {
      for (let y = -pad; y <= h + pad; y += GRID) {
        ctx.fillRect(x, y, 1.4, 1.4);
      }
    }

    ctx.strokeStyle = 'rgba(91,140,255,0.10)';
    ctx.beginPath();
    const cx = Math.round(w * 0.5 / GRID) * GRID;
    ctx.moveTo(cx + 0.5, 0); ctx.lineTo(cx + 0.5, h);
    ctx.stroke();
  }

  draw();
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { dpr = Math.min(window.devicePixelRatio || 1, 2); draw(); }, 150);
  }, { signal });

  if (reduce) return () => { ac.abort(); clearTimeout(rt); };

  const bg = document.querySelector('.blueprint-bg');
  const halo = document.getElementById('cursor-halo');
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, haloX = 0, haloY = 0;

  function loop() {
    tx += (cx - tx) * 0.08;
    ty += (cy - ty) * 0.08;
    bg.style.transform = `translate(${tx}px, ${ty}px)`;
    halo.style.left = haloX + 'px';
    halo.style.top = haloY + 'px';
    raf = 0;
    if (Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1) raf = requestAnimationFrame(loop);
  }
  window.addEventListener('pointermove', (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5);
    const ny = (e.clientY / window.innerHeight - 0.5);
    cx = -nx * 16; cy = -ny * 16;
    haloX = e.clientX; haloY = e.clientY;
    halo.style.opacity = '1';
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true, signal });
  window.addEventListener('pointerleave', () => { halo.style.opacity = '0'; }, { signal });

  return () => {
    ac.abort();
    clearTimeout(rt);
    if (raf) cancelAnimationFrame(raf);
  };
}
