/* ============================================================
   diagram.js · DIAGRAMA DE ARQUITECTURA VIVO (pieza firma A)
   Arrastra nodos (mover) · arrastra desde el puerto (cablear).
   Conexión válida → snap + paquetes viajando + telemetría viva.
   Auto-demo a los 4s sin interacción · fallback tabla accesible.
   init() devuelve limpieza; expone window.__archDemo para el estimador.
   ============================================================ */
export function initDiagram() {
  const canvas = document.getElementById('arch-canvas');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shell = canvas.parentElement;
  const ac = new AbortController();
  const { signal } = ac;

  const NODES = [
    { id: 'client', label: 'Client', sub: 'web · móvil', fx: 0.10, fy: 0.26, lat: 4 },
    { id: 'api', label: 'API Gateway', sub: 'edge · auth', fx: 0.36, fy: 0.50, lat: 12 },
    { id: 'cache', label: 'Cache', sub: 'redis', fx: 0.62, fy: 0.20, lat: 2 },
    { id: 'queue', label: 'Cola', sub: 'eventos', fx: 0.62, fy: 0.78, lat: 8 },
    { id: 'db', label: 'DB', sub: 'postgres', fx: 0.88, fy: 0.42, lat: 16 },
    { id: 'model', label: 'Modelo IA', sub: 'inferencia', fx: 0.88, fy: 0.82, lat: 40 },
  ];
  const LINKS = { client: ['api'], api: ['cache', 'queue', 'db'], queue: ['model'], model: ['db'], cache: ['db'] };
  const byId = {}; NODES.forEach((n) => (byId[n.id] = n));
  const costPer = { client: 0, api: 0.18, cache: 0.04, queue: 0.06, db: 0.22, model: 0.95 };

  const NW = 132, NH = 58, PORT = 7;
  let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
  let edges = [];
  let packets = [];
  let drag = null;
  let wire = null;
  let hoverPort = null, hoverNode = null;
  let flash = null;
  let interacted = false, autoTimer = null;
  let raf = null, autoIv = null, io = null;

  function layout() {
    const r = shell.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.ceil(W * dpr); canvas.height = Math.ceil(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    NODES.forEach((n) => { n.x = clamp(n.fx * W, NW / 2 + 8, W - NW / 2 - 8); n.y = clamp(n.fy * H, NH / 2 + 8, H - NH / 2 - 8); });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function portOf(n) { return { x: n.x + NW / 2, y: n.y }; }
  function inNode(n, x, y) { return Math.abs(x - n.x) <= NW / 2 && Math.abs(y - n.y) <= NH / 2; }
  function nodeAt(x, y) { return NODES.find((n) => inNode(n, x, y)); }
  function nearPort(n, x, y) { const p = portOf(n); return Math.hypot(x - p.x, y - p.y) <= PORT + 7; }

  function validDir(a, b) {
    if (LINKS[a] && LINKS[a].includes(b)) return [a, b];
    if (LINKS[b] && LINKS[b].includes(a)) return [b, a];
    return null;
  }
  function hasEdge(a, b) { return edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a)); }

  function addEdge(a, b) {
    const dir = validDir(a, b);
    if (!dir || hasEdge(a, b)) { flash = { a, b, t: 1 }; return false; }
    edges.push({ a: dir[0], b: dir[1] });
    for (let k = 0; k < 2; k++) packets.push({ edge: edges.length - 1, t: Math.random(), speed: 0.006 + Math.random() * 0.004 });
    updateHUD();
    return true;
  }

  function connectedSet() {
    const s = new Set();
    edges.forEach((e) => { s.add(e.a); s.add(e.b); });
    return s;
  }
  function updateHUD() {
    const s = connectedSet();
    let lat = 0;
    (function dfs(id, acc, seen) {
      lat = Math.max(lat, acc);
      (LINKS[id] || []).forEach((nx) => { if (hasEdge(id, nx) && !seen.has(nx)) dfs(nx, acc + byId[nx].lat, new Set(seen).add(nx)); });
    })('client', s.has('client') ? byId.client.lat : 0, new Set(['client']));
    let cost = 0; s.forEach((id) => (cost += costPer[id]));
    const thru = edges.length ? Math.round(1800 + edges.length * 1450) : 0;
    setTxt('hud-lat', s.size ? lat + ' ms' : '—');
    setTxt('hud-cost', s.size ? '$' + cost.toFixed(2) : '—');
    setTxt('hud-edges', String(edges.length));
    setTxt('hud-thru', thru ? thru.toLocaleString('es') + ' rps' : '0 rps');
  }
  function setTxt(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawEdge(a, b, active) {
    const A = byId[a], B = byId[b];
    const x1 = A.x + NW / 2, y1 = A.y, x2 = B.x - NW / 2, y2 = B.y;
    const mx = (x1 + x2) / 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2);
    ctx.strokeStyle = active ? 'rgba(91,140,255,0.6)' : 'rgba(255,255,255,0.16)';
    ctx.lineWidth = active ? 1.6 : 1.2;
    ctx.stroke();
  }
  function edgePoint(e, t) {
    const A = byId[e.a], B = byId[e.b];
    const x1 = A.x + NW / 2, y1 = A.y, x2 = B.x - NW / 2, y2 = B.y, mx = (x1 + x2) / 2;
    const u = 1 - t;
    const x = u * u * u * x1 + 3 * u * u * t * mx + 3 * u * t * t * mx + t * t * t * x2;
    const y = u * u * u * y1 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y2;
    return { x, y };
  }

  function drawNode(n) {
    const x = n.x - NW / 2, y = n.y - NH / 2;
    const on = connectedSet().has(n.id);
    const hot = hoverNode === n || (wire && wire.from === n.id);
    roundRect(x, y, NW, NH, 10);
    ctx.fillStyle = on ? '#181b24' : 'rgba(24,27,36,0.78)';
    ctx.shadowColor = on ? 'rgba(91,140,255,0.30)' : 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = on ? 16 : 8; ctx.shadowOffsetY = 3;
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = hot ? '#5b8cff' : (on ? 'rgba(91,140,255,0.45)' : 'rgba(255,255,255,0.14)');
    ctx.stroke();
    ctx.fillStyle = on ? '#5b8cff' : 'rgba(255,255,255,0.18)';
    roundRect(x, y, 3, NH, 2); ctx.fill();
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#e8eaf0';
    ctx.font = '700 14px "Outfit", sans-serif';
    ctx.fillText(n.label, x + 14, y + 25);
    ctx.fillStyle = '#6b7488';
    ctx.font = '500 10.5px "JetBrains Mono", monospace';
    ctx.fillText(n.sub, x + 14, y + 41);
    ctx.fillStyle = on ? '#5b8cff' : '#3a4150';
    ctx.textAlign = 'right';
    ctx.fillText(n.lat + 'ms', x + NW - 12, y + 41);
    ctx.textAlign = 'left';
    const p = portOf(n);
    const showPort = LINKS[n.id] && LINKS[n.id].length;
    if (showPort) {
      ctx.beginPath(); ctx.arc(p.x, p.y, PORT, 0, Math.PI * 2);
      const ph = hoverPort === n;
      ctx.fillStyle = ph ? '#5b8cff' : '#181b24';
      ctx.fill();
      ctx.lineWidth = 1.4; ctx.strokeStyle = '#5b8cff'; ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = ph ? '#e8eaf0' : '#5b8cff'; ctx.fill();
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    edges.forEach((e) => drawEdge(e.a, e.b, true));
    if (wire) {
      const A = byId[wire.from], p = portOf(A);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(wire.x, wire.y);
      ctx.strokeStyle = 'rgba(91,140,255,0.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
    }
    if (flash) {
      const A = byId[flash.a], B = byId[flash.b];
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
      ctx.strokeStyle = `rgba(225,29,72,${flash.t * 0.85})`; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      flash.t -= 0.03; if (flash.t <= 0) flash = null;
    }
    if (!reduce) packets.forEach((pk) => {
      const e = edges[pk.edge]; if (!e) return;
      pk.t += pk.speed; if (pk.t > 1) pk.t -= 1;
      const pt = edgePoint(e, pk.t);
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = '#5b8cff'; ctx.shadowColor = 'rgba(91,140,255,0.8)'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
    });
    NODES.forEach(drawNode);
  }

  function loop() { render(); raf = requestAnimationFrame(loop); }

  function pos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = pos(e);
    const portNode = NODES.find((n) => LINKS[n.id] && nearPort(n, x, y));
    if (portNode) { wire = { from: portNode.id, x, y }; markInteracted(); return; }
    const n = nodeAt(x, y);
    if (n) { drag = { node: n, dx: x - n.x, dy: y - n.y }; canvas.classList.add('dragging'); markInteracted(); }
  }, { signal });
  canvas.addEventListener('pointermove', (e) => {
    const { x, y } = pos(e);
    if (drag) {
      drag.node.x = clamp(x - drag.dx, NW / 2 + 6, W - NW / 2 - 6);
      drag.node.y = clamp(y - drag.dy, NH / 2 + 6, H - NH / 2 - 6);
      drag.node.fx = drag.node.x / W; drag.node.fy = drag.node.y / H;
      return;
    }
    if (wire) { wire.x = x; wire.y = y; return; }
    hoverPort = NODES.find((n) => LINKS[n.id] && nearPort(n, x, y)) || null;
    hoverNode = hoverPort ? null : nodeAt(x, y);
    canvas.style.cursor = hoverPort ? 'crosshair' : (hoverNode ? 'grab' : 'default');
  }, { signal });
  function endPointer(e) {
    if (wire) {
      const { x, y } = pos(e);
      const target = nodeAt(x, y);
      if (target && target.id !== wire.from) addEdge(wire.from, target.id);
      wire = null;
    }
    drag = null; canvas.classList.remove('dragging');
  }
  canvas.addEventListener('pointerup', endPointer, { signal });
  canvas.addEventListener('pointercancel', endPointer, { signal });

  function markInteracted() {
    if (!interacted) {
      interacted = true;
      clearTimeout(autoTimer);
      stopAuto();
      const f = document.getElementById('demo-flag'); if (f) f.textContent = '';
      const h = document.getElementById('tool-hint'); if (h) h.innerHTML = 'arrastra para mover · desde el punto cian para cablear';
    }
  }
  function startAuto() {
    if (interacted) return;
    const autoQueue = [['client', 'api'], ['api', 'cache'], ['api', 'queue'], ['queue', 'model'], ['api', 'db'], ['model', 'db']];
    let i = 0;
    autoIv = setInterval(() => {
      if (interacted || i >= autoQueue.length) { stopAuto(); return; }
      const [a, b] = autoQueue[i++]; addEdge(a, b);
    }, 620);
  }
  function stopAuto() { if (autoIv) { clearInterval(autoIv); autoIv = null; } }

  const elAuto = document.getElementById('tool-auto');
  const elReset = document.getElementById('tool-reset');
  if (elAuto) elAuto.addEventListener('click', () => {
    markInteracted(); edges = []; packets = []; updateHUD();
    let i = 0; const q = [['client', 'api'], ['api', 'cache'], ['api', 'queue'], ['queue', 'model'], ['api', 'db'], ['model', 'db']];
    const iv = setInterval(() => { if (i >= q.length) { clearInterval(iv); return; } const [a, b] = q[i++]; addEdge(a, b); }, 200);
  }, { signal });
  if (elReset) elReset.addEventListener('click', () => {
    markInteracted(); edges = []; packets = []; updateHUD();
  }, { signal });
  const fb = document.getElementById('arch-fallback');
  const fbBtn = document.getElementById('tool-fallback');
  if (fbBtn) fbBtn.addEventListener('click', () => {
    const show = !fb.classList.contains('show');
    fb.classList.toggle('show', show);
    fbBtn.innerHTML = show ? '▤ ver lienzo' : '▤ ver tabla';
  }, { signal });

  (function fillFallback() {
    const tb = document.getElementById('fallback-rows'); if (!tb) return;
    tb.innerHTML = '';
    NODES.forEach((n) => {
      const to = (LINKS[n.id] || []).map((id) => byId[id].label).join(', ') || '—';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="color:var(--bone)">${n.label}</td><td>${n.sub}</td><td>${n.lat} ms</td><td style="color:var(--signal-soft)">${to}</td>`;
      tb.appendChild(tr);
    });
  })();

  layout();
  window.addEventListener('resize', () => { dpr = Math.min(devicePixelRatio || 1, 2); layout(); }, { signal });
  updateHUD();

  if (reduce) {
    [['client', 'api'], ['api', 'cache'], ['api', 'queue'], ['queue', 'model'], ['api', 'db'], ['model', 'db']].forEach(([a, b]) => addEdge(a, b));
    render();
  } else {
    loop();
    autoTimer = setTimeout(startAuto, 4000);
    try {
      io = new IntersectionObserver((ents) => {
        ents.forEach((en) => {
          if (en.isIntersecting) { if (!raf) loop(); }
          else if (raf) { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0.25 });
      io.observe(shell);
    } catch (e) {}
  }

  // puente para el estimador (mismo página: index/Home)
  window.__archDemo = {
    wire(list) { markInteracted(); edges = []; packets = []; updateHUD(); list.forEach(([a, b]) => addEdge(a, b)); },
  };

  return () => {
    ac.abort();
    clearTimeout(autoTimer);
    stopAuto();
    if (raf) cancelAnimationFrame(raf);
    if (io) io.disconnect();
    if (window.__archDemo) delete window.__archDemo;
  };
}
