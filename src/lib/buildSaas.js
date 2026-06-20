/* ============================================================
   buildSaas.js · SECUENCIA BUILD-A-SAAS (pieza C)
   Un mock fijado (sticky) que se transforma con el scroll:
   wireframe → UI estilizada → datos vivos → deploy → shipped.
   init() devuelve limpieza (listeners + rAF).
   ============================================================ */
export function initBuildSaas() {
  const track = document.getElementById('build-track');
  const mockBody = document.getElementById('mock-body');
  const deploy = document.getElementById('deploy-bar');
  const toast = document.getElementById('build-toast');
  const url = document.getElementById('mock-url');
  const steps = Array.from(document.querySelectorAll('.build-step'));
  if (!track || !mockBody) return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ac = new AbortController();
  const { signal } = ac;

  track.style.minHeight = '220vh';

  const STAGES = [
    { url: 'localhost:3000', html: wireframe() },
    { url: 'app.tuproducto.dev', html: styled(false) },
    { url: 'app.tuproducto.com', html: styled(true) },
    { url: 'app.tuproducto.com', html: styled(true) },
  ];

  function bars(n, cls) { let s = ''; for (let i = 0; i < n; i++) s += `<div class="${cls}"></div>`; return s; }

  function wireframe() {
    return `<div class="mk-wire">
      <div class="mk-side">${bars(5, 'mk-ln')}</div>
      <div class="mk-main">
        <div class="mk-row">${bars(3, 'mk-card')}</div>
        <div class="mk-chart"></div>
        <div class="mk-row2">${bars(4, 'mk-ln wide')}</div>
      </div>
    </div>`;
  }
  function styled(data) {
    const v = data ? '' : ' nodata';
    const kpi = (label, val) => `<div class="mk-kpi${v}"><span class="mk-kpi-l">${label}</span><b>${data ? val : '—'}</b></div>`;
    const rows = data ? `
      <div class="mk-trow"><span class="mk-dot ok"></span>Acme Corp<span class="mk-tval">+12.4%</span><span class="mk-tag live">activo</span></div>
      <div class="mk-trow"><span class="mk-dot"></span>Nordic SaaS<span class="mk-tval">+8.1%</span><span class="mk-tag">trial</span></div>
      <div class="mk-trow"><span class="mk-dot warn"></span>Globex<span class="mk-tval">−2.0%</span><span class="mk-tag risk">riesgo</span></div>`
      : `<div class="mk-trow empty"></div><div class="mk-trow empty"></div><div class="mk-trow empty"></div>`;
    return `<div class="mk-app${v}">
      <div class="mk-side styled">
        <div class="mk-brand"></div>${bars(5, 'mk-nav')}
      </div>
      <div class="mk-main">
        <div class="mk-kpis">${kpi('MRR', '$48.2k')}${kpi('Usuarios', '3,910')}${kpi('Churn', '1.8%')}</div>
        <div class="mk-chart styled">${data ? '<div class="mk-spark"></div>' : ''}</div>
        <div class="mk-table">${rows}</div>
      </div>
    </div>`;
  }

  let cur = -1;
  function setStage(i) {
    if (i === cur) return; cur = i;
    mockBody.innerHTML = STAGES[i].html;
    url.textContent = STAGES[i].url;
    steps.forEach((s) => s.classList.toggle('on', +s.dataset.step === i));
  }

  function onScroll() {
    const r = track.getBoundingClientRect();
    const total = track.offsetHeight - window.innerHeight;
    const p = clamp((-r.top) / total, 0, 1);
    let stage = 0;
    if (p >= 0.78) stage = 3; else if (p >= 0.52) stage = 2; else if (p >= 0.26) stage = 1;
    setStage(stage);
    if (stage === 3) {
      const dp = clamp((p - 0.78) / 0.17, 0, 1);
      deploy.style.width = (dp * 100) + '%';
      toast.classList.toggle('show', dp > 0.92);
    } else { deploy.style.width = '0%'; toast.classList.remove('show'); }
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  if (reduce) {
    setStage(2); deploy.style.width = '100%'; toast.classList.add('show');
    return () => { ac.abort(); };
  }

  setStage(0);
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); }
  }, { passive: true, signal });
  window.addEventListener('resize', onScroll, { signal });
  onScroll();

  return () => { ac.abort(); };
}
