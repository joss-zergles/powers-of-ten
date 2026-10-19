(function () {
  'use strict';
  const PT = window.PT;
  const { LEVELS, LABELS } = PT.gen;
  const app = document.getElementById('app');
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- progress (localStorage) ---------- */
  const KEY = 'powersOfTen.v1';
  const MASTER = 80; // a skill counts as mastered at 80 — about five right in a row from scratch
  const blank = () => ({ types: {}, xp: 0, streak: 0, best: 0, answered: 0, correct: 0, reached: 1, unlockAll: false, champion: false });
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.types) return Object.assign(blank(), s); } catch (e) { /* private mode etc. */ }
    return blank();
  }
  let S = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
  const stat = (id) => S.types[id] || (S.types[id] = { m: 0, n: 0, c: 0, last: 0 });
  const mastery = (id) => (S.types[id] ? S.types[id].m : 0);
  const levelPct = (L) => Math.round(L.types.reduce((a, id) => a + Math.min(mastery(id), MASTER), 0) / (L.types.length * MASTER) * 100);
  const levelDone = (L) => L.types.every((id) => mastery(id) >= MASTER);
  const unlocked = (n) => S.unlockAll || n <= S.reached;

  function record(id, ok) {
    const t = stat(id);
    t.n++; t.last = Date.now();
    if (ok) { t.c++; t.m = Math.round(t.m + (100 - t.m) * 0.3); } else t.m = Math.round(t.m * 0.5);
    S.answered++;
    if (ok) { S.correct++; S.streak++; S.best = Math.max(S.best, S.streak); S.xp += 10 + Math.min(S.streak, 10); } else S.streak = 0;
    let event = null;
    while (S.reached < LEVELS.length && levelDone(LEVELS[S.reached - 1])) { S.reached++; event = { type: 'level', level: LEVELS[S.reached - 1] }; }
    if (!S.champion && S.reached === LEVELS.length && levelDone(LEVELS[LEVELS.length - 1])) { S.champion = true; event = { type: 'champion' }; }
    save();
    return event;
  }

  /* ---------- header ---------- */
  function header() {
    document.getElementById('chips').innerHTML = `<span class="chip" title="Experience points">⭐ ${S.xp}</span><span class="chip${S.streak >= 5 ? ' hot' : ''}" title="Correct in a row">🔥 ${S.streak}</span>`;
  }

  /* ---------- routing ---------- */
  let cleanup = null;
  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    const h = location.hash.replace(/^#\/?/, '').split('/');
    header();
    if (h[0] === 'learn' && LEVELS[h[1] - 1]) learn(+h[1], +(h[2] || 1));
    else if (h[0] === 'practice' && (h[1] === 'mix' || LEVELS[h[1] - 1])) practice(h[1] === 'mix' ? 'mix' : +h[1]);
    else if (h[0] === 'table') table();
    else home();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------- home ---------- */
  function home() {
    const acc = S.answered ? Math.round(S.correct / S.answered * 100) + '%' : '—';
    const next = LEVELS.find((L) => unlocked(L.n) && !levelDone(L)) || LEVELS[0];
    app.innerHTML = `
      <section class="hero">
        <h1>Power Up <span class="zap">⚡</span></h1>
        <p>Get powers nailed, then nano, micro, milli and the rest become easy. Learn each level, then practise until it unlocks the next.</p>
        <div class="row gap wrap">
          <a class="btn" href="#/${S.answered || next.n > 1 ? 'practice' : 'learn'}/${next.n}">${S.answered ? 'Carry on' : 'Start'}: Level ${next.n} →</a>
          ${S.reached > 1 || S.unlockAll ? '<a class="btn ghost" href="#/practice/mix">🎲 Mixed practice</a>' : ''}
        </div>
        <div class="stats"><div><b>${S.xp}</b><span>XP</span></div><div><b>${S.best}</b><span>best streak</span></div><div><b>${S.answered}</b><span>answered</span></div><div><b>${acc}</b><span>accuracy</span></div></div>
        ${S.champion ? '<p class="champ">🏆 Every level mastered — you’re a Powers of Ten champion. Keep it sharp with mixed practice!</p>' : ''}
      </section>
      <section class="levels">${LEVELS.map((L) => {
        const open = unlocked(L.n), pct = levelPct(L), done = levelDone(L);
        return `<article class="level${open ? '' : ' locked'}${done ? ' done' : ''}">
          <div class="lv-top"><span class="lv-emoji">${open ? L.emoji : '🔒'}</span><div><small>Level ${L.n}</small><h2>${L.title}</h2></div>${done ? '<span class="badge">✔ mastered</span>' : ''}</div>
          <div class="bar"><span style="width:${pct}%"></span></div>
          <div class="row gap"><a class="btn small ghost" href="#/learn/${L.n}">📖 Learn</a>
          ${open ? `<a class="btn small" href="#/practice/${L.n}">✏️ Practise</a>` : `<span class="muted small">Master level ${L.n - 1} to unlock</span>`}</div>
        </article>`;
      }).join('')}</section>
      <p class="center"><a href="#/table">📋 Prefix cheat sheet</a></p>`;
  }

  /* ---------- learn ---------- */
  function learn(n, i) {
    const slides = PT.lessons.LESSONS[n - 1];
    i = Math.max(1, Math.min(i, slides.length));
    const s = slides[i - 1], L = LEVELS[n - 1], last = i === slides.length;
    app.innerHTML = `
      <div class="crumbs"><a href="#/">← Levels</a><span>Level ${n}: ${L.title}</span></div>
      <article class="card slide">
        <div class="dots">${slides.map((_, j) => `<a href="#/learn/${n}/${j + 1}" class="${j + 1 === i ? 'on' : ''}" aria-label="slide ${j + 1}"></a>`).join('')}</div>
        <h2>${s.title}</h2><div class="slide-body">${s.html}</div>
      </article>
      <div class="row between gap">
        ${i > 1 ? `<a class="btn ghost" href="#/learn/${n}/${i - 1}">← Back</a>` : '<span></span>'}
        ${last ? (unlocked(n) ? `<a class="btn" href="#/practice/${n}">Practise level ${n} →</a>` : `<a class="btn" href="#/">Back to levels</a>`) : `<a class="btn" href="#/learn/${n}/${i + 1}">Next →</a>`}
      </div>`;
    PT.lessons.mountWidgets(app);
  }

  /* ---------- practice ---------- */
  const PRAISE = ['Nailed it! 🎯', 'Spot on! ✨', 'Boom! 💥', 'Yes! 🙌', 'Too easy 😎', 'Correct! ⚡', 'Lovely work 👌', 'Sorted ✅'];
  const STREAK = { 5: '5 in a row! 🔥', 10: '10 in a row — on fire! 🔥🔥', 20: '20 in a row?! Legend 🏆', 30: '30 in a row. Unstoppable 🚀' };
  const MISS = ['Not quite — here’s how 👇', 'Close one. Have a look at the method 👇', 'No worries, this is how it works 👇'];

  function practice(lv) {
    if (lv !== 'mix' && !unlocked(lv)) { location.hash = '#/'; return; }
    const L = lv === 'mix' ? null : LEVELS[lv - 1];
    let q = null, answered = false, count = 0, lastId = null;
    const retry = []; // skills he just got wrong come back soon, with fresh numbers

    function pool() {
      if (!L) return LEVELS.filter((x) => unlocked(x.n)).flatMap((x) => x.types);
      const earlier = LEVELS.slice(0, L.n - 1).flatMap((x) => x.types);
      return earlier.length && Math.random() < 0.2 ? earlier : L.types;
    }
    function nextType() {
      const due = retry.findIndex((r) => r.due <= count);
      if (due >= 0) return retry.splice(due, 1)[0].id;
      const ids = pool();
      const now = Date.now();
      const w = ids.map((id) => {
        const t = S.types[id];
        const days = t && t.last ? (now - t.last) / 864e5 : 0;
        return (100 - mastery(id) + 15 + Math.min(40, days * 8)) * (id === lastId && ids.length > 1 ? 0.25 : 1);
      });
      let r = Math.random() * w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < ids.length; i++) { r -= w[i]; if (r <= 0) return ids[i]; }
      return ids[ids.length - 1];
    }

    app.innerHTML = `
      <div class="crumbs"><a href="#/">← Levels</a><span>${L ? `Level ${L.n}: ${L.title}` : '🎲 Mixed practice'}</span>${L ? `<a href="#/learn/${L.n}">📖 Lesson</a>` : ''}</div>
      ${L ? '<div class="lvbar"><div class="bar"><span></span></div><small></small></div>' : ''}
      <article class="card qcard" aria-live="polite">
        <div class="q-skill muted small"></div>
        <div class="q-prompt"></div><div class="q-sub muted small"></div>
        <form class="q-form" autocomplete="off"></form>
        <div class="q-feedback"></div>
      </article>
      ${L ? '<details class="skills"><summary>Skills in this level</summary><div class="skill-list"></div></details>' : ''}`;
    const $ = (s) => app.querySelector(s);

    function drawProgress() {
      header();
      if (!L) return;
      const pct = levelPct(L);
      $('.lvbar .bar span').style.width = pct + '%';
      $('.lvbar small').textContent = levelDone(L) ? 'Level mastered ✔ — keep going or try the next one' : `Level progress ${pct}% · get each skill to 5 right in a row`;
      $('.skill-list').innerHTML = L.types.map((id) => `<div class="skill"><span>${LABELS[id]}</span><div class="bar small"><span style="width:${Math.min(100, mastery(id) / MASTER * 100)}%"></span></div></div>`).join('');
    }

    function ask() {
      const id = nextType();
      lastId = id; count++;
      q = PT.gen.make(id);
      PT.current = q; // handy for testing in the console
      answered = false;
      $('.q-skill').textContent = LABELS[id];
      $('.q-prompt').innerHTML = q.prompt;
      $('.q-sub').innerHTML = q.sub || '';
      $('.q-feedback').innerHTML = '';
      const f = $('.q-form');
      if (q.input === 'mc') {
        f.innerHTML = `<div class="mc">${q.options.map((o, i) => `<button type="button" class="mc-opt" data-i="${i}">${o}</button>`).join('')}</div>
          <div class="row gap"><button type="button" class="btn ghost small" data-idk>I don’t know</button></div>`;
      } else {
        f.innerHTML = `<div class="answer-row"><input class="answer" type="text" inputmode="text" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="Your answer" aria-label="Your answer">${q.unit ? `<span class="unit">${q.unit}</span>` : ''}</div>
          ${q.form === 'plain' ? '' : `<div class="keys">${q.form === 'power' ? '<button type="button" data-k="10^">10^</button>' : '<button type="button" data-k="×10^">×10ⁿ</button>'}<button type="button" data-k="^">^</button><button type="button" data-k="-">−</button><button type="button" data-k=".">.</button><button type="button" data-k="⌫" aria-label="delete">⌫</button></div>`}
          <div class="row gap"><button type="submit" class="btn">Check</button><button type="button" class="btn ghost small" data-idk>I don’t know</button></div>`;
        const input = f.querySelector('.answer');
        if (!matchMedia('(pointer: coarse)').matches) input.focus();
      }
      drawProgress();
    }

    function showResult(res, raw) {
      answered = true;
      const ok = res.status === 'correct';
      const event = record(q.id, ok);
      if (!ok) retry.push({ id: q.id, due: count + 2 });
      const fb = $('.q-feedback');
      let h;
      if (ok) {
        h = `<div class="fb good"><b>${STREAK[S.streak] || pick(PRAISE)}</b> <span class="muted">+${10 + Math.min(S.streak, 10)} XP</span>
          <details><summary>See the method</summary>${q.explain}</details></div>`;
      } else {
        const you = raw == null ? '' : q.input === 'mc' ? `<p>You picked: ${q.options[raw]}</p>` : `<p>You wrote: <code>${esc(raw)}</code></p>`;
        h = `<div class="fb bad"><b>${raw == null ? 'Here’s how it works 👇' : pick(MISS)}</b>
          <p class="big">Answer: <b>${q.answerHTML}</b></p>${you}${res.msg ? `<p class="hint">${res.msg}</p>` : diagnose(res)}
          <div class="method">${q.explain}</div></div>`;
      }
      fb.innerHTML = h + `<div class="row gap"><button type="button" class="btn" data-next>${ok ? 'Next →' : 'Got it — next →'}</button></div>`;
      app.querySelectorAll('.q-form input, .q-form button').forEach((b) => { b.disabled = true; });
      if (q.input === 'mc') {
        app.querySelectorAll('.mc-opt').forEach((b) => {
          if (+b.dataset.i === q.answerIndex) b.classList.add('right');
          else if (+b.dataset.i === raw) b.classList.add('wrong');
        });
      }
      drawProgress();
      const nb = fb.querySelector('[data-next]');
      nb.focus({ preventScroll: true });
      if (!ok) fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (event) celebrate(event);
    }

    // Spot "right digits, point in the wrong place" and "hopped the wrong way".
    function diagnose(res) {
      const p = res.parsed;
      if (!p || !q.answer) return '';
      const a = q.answer, v = p.value;
      if (v.m !== a.m || v.neg !== a.neg) return '';
      const off = v.e - a.e;
      if (q.meta && q.meta.shift && off === -2 * q.meta.shift) return '<p class="hint">Your digits are right, but you hopped the point the <b>wrong way</b>.</p>';
      return `<p class="hint">Your digits are right, but the point is <b>${Math.abs(off)} place${Math.abs(off) === 1 ? '' : 's'}</b> out — your answer is ${PT.num.plain(PT.num.dec(1, Math.abs(off)))} times too ${off > 0 ? 'big' : 'small'}.</p>`;
    }

    function onSubmit(e) {
      e.preventDefault();
      if (answered) { ask(); return; }
      const input = $('.answer');
      if (!input) return;
      const res = PT.num.check(q, input.value);
      if (res.status === 'unreadable') {
        let w = $('.q-warn');
        if (!w) { w = document.createElement('p'); w.className = 'q-warn'; $('.q-form .answer-row').after(w); }
        w.innerHTML = res.msg; input.focus();
        return;
      }
      showResult(res, input.value);
    }
    function onClick(e) {
      const t = e.target.closest('button'); if (!t || t.disabled) return;
      if (t.dataset.next !== undefined) { ask(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (t.dataset.idk !== undefined) { showResult({ status: 'wrong' }, null); return; }
      if (t.classList.contains('mc-opt')) { showResult(PT.num.check(q, +t.dataset.i), +t.dataset.i); return; }
      if (t.dataset.k) {
        const input = $('.answer'); const k = t.dataset.k;
        const s = input.selectionStart == null ? input.value.length : input.selectionStart, en = input.selectionEnd == null ? s : input.selectionEnd;
        if (k === '⌫') {
          const from = s === en ? Math.max(0, s - 1) : s;
          input.value = input.value.slice(0, from) + input.value.slice(en); input.setSelectionRange(from, from);
        } else { input.value = input.value.slice(0, s) + k + input.value.slice(en); input.setSelectionRange(s + k.length, s + k.length); }
        const w = $('.q-warn'); if (w) w.remove();
      }
    }
    function onKey(e) { if (e.key === 'Enter' && answered && !e.target.closest('input, button, a, summary, select')) { e.preventDefault(); ask(); } }
    const form = $('.q-form');
    form.addEventListener('submit', onSubmit);
    app.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    cleanup = () => { app.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
    ask();
  }

  /* ---------- celebrations ---------- */
  function celebrate(ev) {
    confetti();
    const d = document.getElementById('celebrate');
    const body = d.querySelector('.cel-body');
    if (ev.type === 'champion') {
      body.innerHTML = `<div class="cel-emoji">🏆</div><h2>Champion!</h2><p>Every level mastered. You can now convert between nano, micro, milli, kilo and the rest like a pro.</p><div class="row center gap"><a class="btn" href="#/practice/mix">🎲 Mixed practice</a></div>`;
    } else {
      const L = ev.level;
      body.innerHTML = `<div class="cel-emoji">${L.emoji}</div><h2>Level ${L.n} unlocked!</h2><p><b>${L.title}</b> is open. Have a look at the lesson first — it’s short.</p>
        <div class="row center gap"><a class="btn" href="#/learn/${L.n}">📖 Learn it</a><button class="btn ghost" value="stay">Keep practising</button></div>`;
    }
    body.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => d.close()));
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function confetti() {
    const c = document.createElement('canvas');
    c.className = 'confetti'; document.body.appendChild(c);
    const ctx = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight;
    const cols = ['#ffd23f', '#4cc9f0', '#3ddc97', '#ff6b9d', '#b388ff'];
    const bits = Array.from({ length: 140 }, () => ({ x: W / 2, y: H / 3, vx: (Math.random() - 0.5) * 14, vy: Math.random() * -14 - 3, s: 4 + Math.random() * 6, c: pick(cols), r: Math.random() * 6 }));
    let t = 0;
    (function frame() {
      ctx.clearRect(0, 0, W, H);
      bits.forEach((b) => { b.x += b.vx; b.y += b.vy; b.vy += 0.35; b.vx *= 0.99; b.r += 0.1; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); ctx.restore(); });
      if (++t < 150) requestAnimationFrame(frame); else c.remove();
    })();
  }

  /* ---------- cheat sheet ---------- */
  function table() {
    const { PREFIX, PREFIX_SYMS } = PT.gen;
    const { pow, plain, dec, minus } = PT.num;
    const rows = ['G', 'M', 'k', '', 'c', 'm', 'µ', 'n'];
    app.innerHTML = `<div class="crumbs"><a href="#/">← Levels</a><span>Prefix cheat sheet</span></div>
      <article class="card"><h2>Prefixes</h2>
      <table class="ptable"><tr><th>prefix</th><th>symbol</th><th>power</th><th>as a number</th></tr>
      ${rows.map((s) => { const P = PREFIX[s]; return `<tr${s === '' ? ' class="base"' : ''}><td>${P.name || 'base unit'}</td><td class="sym">${s || '—'}</td><td>× ${pow(P.p)}</td><td>× ${plain(dec(1, P.p))}</td></tr>`; }).join('')}</table>
      <h2>Converting</h2><ol><li>Write each prefix as a power of ten.</li><li>The gap between the powers = how many places the point hops.</li>
      <li>To a <b>smaller</b> unit → number gets <b>bigger</b> → hop <b>right</b>.<br>To a <b>bigger</b> unit → number gets <b>smaller</b> → hop <b>left</b>.</li></ol>
      <p class="big">3.5 mm → µm: −3 to −6 = 3 hops right → 3500 µm</p>
      <h2>Standard form</h2><p><b>a × 10<sup>n</sup></b> with a at least 1 and less than 10. Big numbers: n positive. Small numbers: n negative.</p></article>`;
    void PREFIX_SYMS; void minus;
  }

  /* ---------- settings ---------- */
  const dlg = document.getElementById('settings');
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('unlockAll').checked = S.unlockAll;
    pwRow.hidden = true; pwMsg.textContent = '';
    dlg.showModal();
  });
  // Unlocking every level needs the grown-up password. Only its SHA-256 hash is stored here, so it isn't
  // readable in the page source (a determined person could still edit their own localStorage).
  const PW_HASH = 'a9beb2298a0b236052816bb749148285f7a80a7ade8d8b80fcb663d8507526b4';
  const pwRow = document.getElementById('pwRow'), pwInput = document.getElementById('pw'), pwMsg = document.getElementById('pwMsg');
  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  document.getElementById('unlockAll').addEventListener('change', (e) => {
    if (e.target.checked) {
      e.target.checked = false;
      pwRow.hidden = false; pwMsg.textContent = 'Enter the password to unlock every level.'; pwInput.value = ''; pwInput.focus();
      return;
    }
    S.unlockAll = false; save(); route();
    pwRow.hidden = true; pwMsg.textContent = 'Levels are locked again.';
  });
  async function tryPassword() {
    if (await sha256(pwInput.value.trim().toLowerCase()) !== PW_HASH) { pwMsg.textContent = '❌ Wrong password.'; pwInput.select(); return; }
    S.unlockAll = true; save(); route();
    document.getElementById('unlockAll').checked = true;
    pwRow.hidden = true; pwInput.value = ''; pwMsg.textContent = '🔓 Every level is unlocked.';
  }
  document.getElementById('pwGo').addEventListener('click', tryPassword);
  pwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); tryPassword(); } });
  document.getElementById('resetAll').addEventListener('click', () => {
    if (confirm('Wipe all progress on this device and start again from level 1?')) {
      S = blank(); save(); dlg.close(); location.hash = '#/'; route();
    }
  });

  route();
})();
