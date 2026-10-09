(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  $('#yr').textContent = new Date().getFullYear();

  const words = ['thinks', 'codes', 'plans', 'writes', 'researches', 'builds'];
  let wi = 0; const rot = $('#rot');
  setInterval(() => { rot.classList.add('out'); setTimeout(() => { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.classList.remove('out'); }, 300); }, 2200);

  const FALLBACK = [
    { id: 'apex-5', name: 'Apex 5', tagline: 'For your toughest challenges', badge: 'Flagship', intelligence: 5, speed: 2 },
    { id: 'c1-4.5', name: 'C1 4.5', tagline: 'For complex work and everyday tasks', badge: 'Pro', intelligence: 4, speed: 3 },
    { id: 'spark-3', name: 'Spark 3', tagline: 'Most efficient for simpler tasks', badge: 'Default', intelligence: 3, speed: 4 },
    { id: 'c-lite-2', name: 'C Lite 2', tagline: 'Fastest for quick answers', badge: 'Fast', intelligence: 2, speed: 5 },
    { id: 'apex-5-think', name: 'Apex 5 Think', tagline: 'Deep step-by-step reasoning', badge: 'Reasoning', intelligence: 5, speed: 1, more: true },
    { id: 'c1-coder', name: 'C1 Coder', tagline: 'Tuned for code generation and debugging', badge: 'Code', intelligence: 4, speed: 3, more: true },
    { id: 'spark-2.5', name: 'Spark 2.5', tagline: 'Previous generation', badge: 'Legacy', intelligence: 3, speed: 4, more: true },
    { id: 'c-lite-1', name: 'C Lite 1', tagline: 'Previous generation', badge: 'Legacy', intelligence: 1, speed: 5, more: true }
  ];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function renderModels(list) {
    $('#models-grid').innerHTML = list.map((m) => `
      <div class="model${m.badge === 'Legacy' ? ' legacy' : ''}">
        ${m.badge ? `<span class="badge">${esc(m.badge)}</span>` : ''}
        <h3>${esc(m.name)}</h3><p>${esc(m.tagline || '')}</p>
        <div class="bar"><span>Intelligence</span><i style="--w:${(m.intelligence || 3) * 20}%"></i></div>
        <div class="bar"><span>Speed</span><i style="--w:${(m.speed || 3) * 20}%"></i></div>
        <div class="bar"><span>Model id</span><code>${esc(m.id)}</code></div>
      </div>`).join('');
  }
  renderModels(FALLBACK);
  fetch('/api/models').then((r) => r.json()).then((d) => { if (d && d.models && d.models.length) renderModels(d.models); }).catch(() => {});

  const EFF = [
    { n: 'Low', tok: '~700', time: '1–3 s', how: 'Direct answer' },
    { n: 'Medium', tok: '~1.6k', time: '2–6 s', how: 'Brief reasoning' },
    { n: 'High', tok: '~3k', time: '4–12 s', how: 'Step-by-step' },
    { n: 'Max', tok: '~6k', time: '8–25 s', how: 'Deep, self-checked' }
  ];
  const eff = $('#effort'), out = $('#effort-out');
  function showEffort() { const e = EFF[eff.value]; out.innerHTML = `<div><b>${e.n}</b><span>effort</span></div><div><b>${e.tok}</b><span>answer budget (tokens)</span></div><div><b>${e.time}</b><span>typical time · ${e.how}</span></div>`; }
  eff.addEventListener('input', showEffort); showEffort();

  const base = location.origin.startsWith('http') ? location.origin : 'https://cinouai.onrender.com';
  const SNIP = {
    curl: `curl ${base}/v1/chat/completions \\\n  -H "Authorization: Bearer $CINOUAI_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "spark-3",\n    "effort": "medium",\n    "messages": [{"role": "user", "content": "Hello Cinou!"}]\n  }'`,
    js: `import OpenAI from "openai";\n\nconst cinou = new OpenAI({\n  apiKey: process.env.CINOUAI_API_KEY,\n  baseURL: "${base}/v1",\n});\n\nconst r = await cinou.chat.completions.create({\n  model: "apex-5",\n  messages: [{ role: "user", content: "Plan a 3-day trip to Tokyo" }],\n});\nconsole.log(r.choices[0].message.content);`,
    py: `from openai import OpenAI\nimport os\n\ncinou = OpenAI(api_key=os.environ["CINOUAI_API_KEY"], base_url="${base}/v1")\n\nr = cinou.chat.completions.create(\n    model="c1-coder",\n    messages=[{"role": "user", "content": "Write a Python quicksort"}],\n)\nprint(r.choices[0].message.content)`
  };
  let tab = 'curl';
  const code = $('#code');
  function showTab() { code.textContent = SNIP[tab]; document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab)); }
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; showTab(); }));
  showTab();
  $('#copy').addEventListener('click', () => { navigator.clipboard?.writeText(SNIP[tab]).then(() => { $('#copy').textContent = 'Copied'; setTimeout(() => ($('#copy').textContent = 'Copy'), 1200); }); });

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  document.querySelectorAll('[data-count]').forEach((el) => {
    const n = +el.dataset.count; let i = 0;
    const t = setInterval(() => { el.textContent = ++i; if (i >= n) clearInterval(t); }, 120);
  });

  const cv = $('#bg'), ctx = cv.getContext('2d');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let W, H, pts;
  function size() { W = cv.width = innerWidth; H = cv.height = innerHeight; pts = Array.from({ length: Math.min(70, W / 18) }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 })); }
  size(); addEventListener('resize', size);
  (function loop() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 130) { ctx.strokeStyle = `rgba(217,119,87,${0.18 * (1 - d / 130)})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(123,108,255,.5)'; for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 7); ctx.fill(); }
    requestAnimationFrame(loop);
  })();
})();
