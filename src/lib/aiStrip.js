/* ============================================================
   aiStrip.js · Tira de IA en vivo (pieza B)
   Streaming pre-grabado (100% front). El visitante escribe una idea;
   el "motor" transmite features + esquema SQL + componente carácter a
   carácter. init() devuelve limpieza (listeners + intervalo).
   ============================================================ */
export function initAiStrip() {
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  const streamEl = document.getElementById('ai-stream');
  const stateEl = document.getElementById('ai-state');
  const tabs = Array.from(document.querySelectorAll('.ai-tab'));
  if (!form || !streamEl) return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ac = new AbortController();
  const { signal } = ac;

  function slug(s) {
    const stop = ['para', 'de', 'un', 'una', 'el', 'la', 'los', 'las', 'app', 'sistema', 'plataforma', 'con'];
    const word = (s.toLowerCase().match(/[a-záéíóúñ]+/gi) || [])
      .filter((w) => w.length > 2 && !stop.includes(w))[0] || 'producto';
    return word.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  }

  function build(idea) {
    const name = idea.trim() || 'CRM para clínicas dentales';
    const ent = slug(name);
    const Ent = ent.charAt(0).toUpperCase() + ent.slice(1);
    return {
      features:
`// analizando: "${name}"
[k]MVP — alcance recomendado[/k]

 1. Auth multi-tenant (org + roles)
 2. Panel de ${ent}s con búsqueda y filtros
 3. CRUD de registros + historial de cambios
 4. Vista de detalle con timeline de eventos
 5. Métricas en vivo (altas, activos, churn)
 6. Notificaciones + recordatorios programados
 7. Exportación CSV / PDF y API pública

[c]// fase 2 — apalancamiento IA[/c]
 8. Predicción de ${ent}s en riesgo (score)
 9. Resúmenes automáticos por registro
10. Asistente de búsqueda en lenguaje natural`,
      schema:
`[c]-- esquema base · PostgreSQL[/c]
[k]CREATE TABLE[/k] orgs (
  id          uuid [k]PRIMARY KEY[/k] [k]DEFAULT[/k] gen_random_uuid(),
  nombre      text [k]NOT NULL[/k],
  plan        text [k]DEFAULT[/k] 'free',
  creado_en   timestamptz [k]DEFAULT[/k] now()
);

[k]CREATE TABLE[/k] ${ent}s (
  id          uuid [k]PRIMARY KEY[/k] [k]DEFAULT[/k] gen_random_uuid(),
  org_id      uuid [k]REFERENCES[/k] orgs(id),
  nombre      text [k]NOT NULL[/k],
  estado      text [k]DEFAULT[/k] 'activo',
  score_ia    numeric(4,3),  [c]-- riesgo 0..1[/c]
  metadata    jsonb [k]DEFAULT[/k] '{}',
  creado_en   timestamptz [k]DEFAULT[/k] now()
);

[k]CREATE INDEX[/k] idx_${ent}_org [k]ON[/k] ${ent}s(org_id, estado);`,
      component:
`[c]// ${Ent}Card.tsx — componente generado[/c]
[k]export function[/k] [s]${Ent}Card[/s]({ item }: { item: ${Ent} }) {
  [k]const[/k] risk = item.scoreIa ?? 0;
  [k]return[/k] (
    <article className="card">
      <header>
        <h3>{item.nombre}</h3>
        <[s]Badge[/s] tone={risk > 0.6 ? "warn" : "ok"}>
          {([s]risk[/s] * 100).toFixed(0)}% riesgo
        </[s]Badge[/s]>
      </header>
      <[s]Sparkline[/s] data={item.serie} />
    </article>
  );
}`,
    };
  }

  let payload = build('');
  let typing = null;

  function colorize(txt) {
    return txt
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\[k\]([\s\S]*?)\[\/k\]/g, '<span class="k">$1</span>')
      .replace(/\[c\]([\s\S]*?)\[\/c\]/g, '<span class="c">$1</span>')
      .replace(/\[s\]([\s\S]*?)\[\/s\]/g, '<span class="s">$1</span>');
  }
  function plain(txt) { return txt.replace(/\[\/?[kcs]\]/g, ''); }
  function stop() { if (typing) { clearInterval(typing); typing = null; } }

  function streamTab(tab) {
    stop();
    const full = payload[tab];
    const flat = plain(full);
    if (reduce) { streamEl.innerHTML = colorize(full); stateEl.textContent = '● listo'; return; }
    let i = 0;
    stateEl.innerHTML = '<span style="color:var(--signal)">●</span> generando';
    streamEl.innerHTML = '';
    const speed = 6;
    typing = setInterval(() => {
      i += speed;
      streamEl.innerHTML = colorizePartial(full, i) + '<span class="caret"></span>';
      streamEl.scrollTop = streamEl.scrollHeight;
      if (i >= flat.length) { stop(); streamEl.innerHTML = colorize(full); stateEl.textContent = '● listo'; }
    }, 16);
  }

  function colorizePartial(full, n) {
    let out = '', count = 0, i = 0;
    const open = [];
    while (i < full.length && count < n) {
      const m = full.slice(i).match(/^\[(\/?)([kcs])\]/);
      if (m) {
        const close = m[1] === '/';
        const cls = m[2];
        if (close) { out += '</span>'; open.pop(); }
        else { out += `<span class="${cls}">`; open.push(cls); }
        i += m[0].length;
        continue;
      }
      let ch = full[i];
      if (ch === '&') ch = '&amp;'; else if (ch === '<') ch = '&lt;'; else if (ch === '>') ch = '&gt;';
      out += ch; i++; count++;
    }
    for (let k = open.length - 1; k >= 0; k--) out += '</span>';
    return out;
  }

  function setTab(tab) {
    tabs.forEach((t) => t.classList.toggle('on', t.dataset.tab === tab));
    streamTab(tab);
  }

  tabs.forEach((t) => t.addEventListener('click', () => setTab(t.dataset.tab), { signal }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    payload = build(input.value);
    setTab('features');
  }, { signal });

  setTab('features');

  return () => { ac.abort(); stop(); };
}
