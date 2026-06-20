/* ============================================================
   estimator.js · "Escopea tu proyecto"
   4 preguntas → rango + plan por fases + arquitectura sugerida que se
   DIBUJA en el diagrama vivo vía window.__archDemo (mismo Home).
   init() devuelve limpieza (listener delegado).
   ============================================================ */
export function initEstimator() {
  const panel = document.getElementById('est-panel');
  if (!panel) return () => {};
  const rangeEl = document.getElementById('est-range');
  const phasesEl = document.getElementById('est-phases');
  const archText = document.getElementById('est-arch-text');
  const ac = new AbortController();
  const { signal } = ac;
  const answers = { tipo: null, etapa: null, ia: null, plazo: null };

  const BASE = { saas: [60, 120], interno: [35, 70], ia: [50, 95], rearq: [45, 90] };
  const ETAPA = { idea: 1.1, mvp: 1.0, prod: 0.95 };
  const IA_ADD = { core: 25, apoyo: 12, no: 0 };
  const PLAZO = { urg: 1.25, norm: 1.0, flex: 0.9 };

  panel.addEventListener('click', (e) => {
    const opt = e.target.closest('.opt'); if (!opt) return;
    const q = opt.closest('.est-q').dataset.q;
    const group = opt.closest('.est-q');
    group.querySelectorAll('.opt').forEach((o) => o.classList.remove('on'));
    opt.classList.add('on');
    answers[q] = opt.dataset.v;
    compute();
  }, { signal });

  function round5(n) { return Math.round(n / 5) * 5; }

  function compute() {
    if (!answers.tipo) return;
    let [lo, hi] = BASE[answers.tipo];
    const em = ETAPA[answers.etapa] || 1;
    const pm = PLAZO[answers.plazo] || 1;
    const add = IA_ADD[answers.ia] || 0;
    lo = round5(lo * em * pm + add * 0.6);
    hi = round5(hi * em * pm + add);
    rangeEl.innerHTML = `$${lo}k <span class="u">–</span> $${hi}k`;

    const phases = [];
    phases.push(['F1', 'Descubrimiento + arquitectura', answers.plazo === 'urg' ? '1 sem' : '1–2 sem']);
    if (answers.etapa === 'idea') phases.push(['F2', 'Cimientos + primer corte', '3–5 sem']);
    else phases.push(['F2', 'Construcción del core', '4–8 sem']);
    if (answers.ia && answers.ia !== 'no') phases.push(['F3', answers.ia === 'core' ? 'Capa de IA (core)' : 'IA de apoyo + tuning', '2–4 sem']);
    phases.push(['F' + (phases.length + 1), 'Deploy + operación', 'continuo']);
    phasesEl.innerHTML = phases.map(([n, w, t]) =>
      `<div class="est-phase"><span class="pn">${n}</span><span class="pw">${w}</span><span>${t}</span></div>`).join('');

    const edges = [['client', 'api'], ['api', 'db']];
    if (answers.tipo === 'saas' || answers.tipo === 'interno') edges.push(['api', 'cache']);
    if (answers.tipo === 'saas' || answers.tipo === 'rearq') edges.push(['api', 'queue']);
    if (answers.ia && answers.ia !== 'no') { edges.push(['api', 'queue'], ['queue', 'model'], ['model', 'db']); }
    const seen = new Set();
    const ded = edges.filter(([a, b]) => { const k = a < b ? a + b : b + a; if (seen.has(k)) return false; seen.add(k); return true; });

    if (answers.tipo && answers.ia && window.__archDemo) {
      window.__archDemo.wire(ded);
      archText.innerHTML = 'arquitectura sugerida dibujada en el diagrama vivo <a href="#diagrama" style="color:var(--signal)">↑ ver</a>';
    }
  }

  return () => { ac.abort(); };
}
