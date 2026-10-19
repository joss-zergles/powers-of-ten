/* Lessons (one per level) and the interactive widgets they use.
   Rule: never use a word before it has been explained. */
(function (root) {
  'use strict';
  const PT = root.PT;
  const { dec, ONE, fromString, shift, plain, sci, minus, pow } = PT.num;
  const { hops, ptMark } = PT.gen;
  const W = (name, o) => `<div class="widget" data-w="${name}" data-o='${JSON.stringify(o || {})}'></div>`;
  const sup = (n, b) => pow(n, b);

  const LESSONS = [
    /* 1 — What is a power? */
    [
      { title: 'Shortcuts you already know', html: `
        <p>Adding the same number again and again is slow to write:</p>
        <p class="big">3 + 3 + 3 + 3</p>
        <p>So we use a shortcut: <b>4 × 3</b> (“four threes”). <b>Multiplying</b> is a shortcut for adding the same number lots of times.</p>
        <p>A <b>power</b> is the next shortcut up: it’s a shortcut for <b>multiplying</b> the same number lots of times.</p>` },
      { title: 'How a power is written', html: `
        <p>Instead of writing</p><p class="big">3 × 3 × 3 × 3</p><p>we write</p>
        <div class="anatomy"><div class="an-expr"><span class="an-base">3</span><span class="an-pow">4</span></div>
          <div class="an-labels"><span><b>base</b> = the number being multiplied</span><span><b>power</b> = how many of them you multiply together</span></div></div>
        <p>Say it as “3 to the power 4”. It means four 3s multiplied: 3 × 3 × 3 × 3 = <b>81</b>.</p>` },
      { title: 'Build a power yourself', html: `
        <p>Pick a base, then press <b>× one more</b>. Each press puts one more copy of the base into the multiplication, so the power goes up by 1.</p>${W('chain')}` },
      { title: 'Squared and cubed: you can see them', html: `
        <p>A power of <b>2</b> makes a square: 4<sup>2</sup> = 4 × 4 is a 4-by-4 square of dots. That’s why it’s called “4 <b>squared</b>”.</p>
        <p>A power of <b>3</b> stacks squares into a cube: 4<sup>3</sup> = 4 × 4 × 4 is 4 layers of that square. “4 <b>cubed</b>”.</p>${W('squares')}` },
      { title: 'The big slip: power is not times', html: `
        <div class="versus">
          <div class="vs-card bad"><div class="vs-head">2 × 5</div><p>five 2s <b>added</b></p><p class="big">2 + 2 + 2 + 2 + 2 = 10</p></div>
          <div class="vs-card good"><div class="vs-head">2<sup>5</sup></div><p>five 2s <b>multiplied</b></p><p class="big">2 × 2 × 2 × 2 × 2 = 32</p></div>
        </div>
        <p>2<sup>5</sup> is <b>not</b> 10, and it’s <b>not</b> 25 either (that’s just sticking the digits together). Always write the multiplication out if you’re not sure.</p>` },
      { title: 'Powers grow fast', html: `
        <p>Each step up the power multiplies by the base <b>one more time</b>:</p>
        <table class="grow"><tr><th>power</th><th>working</th><th>value</th></tr>
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<tr><td>2<sup>${n}</sup></td><td>${n === 1 ? '2' : `2<sup>${n - 1}</sup> × 2`}</td><td><b>${2 ** n}</b></td></tr>`).join('')}</table>
        <p>Notice: a power of <b>1</b> is just the number itself — 2<sup>1</sup> = 2, 7<sup>1</sup> = 7 (only one of them).</p>` },
      { title: 'Where this is going', html: `
        <p>Science measures things from the size of a virus to the distance to the Sun. The numbers have loads of zeros.</p>
        <p>Powers with a base of <b>10</b> are the tool for that, because multiplying by 10 is so easy. That’s the next level.</p>
        <p>First, practise powers with small bases until they feel obvious. Five right in a row on each skill unlocks the next level.</p>` },
    ],
    /* 2 — Powers of ten */
    [
      { title: 'Base 10', html: `
        <p>Now the base is always <b>10</b>:</p>
        <p class="big">10<sup>2</sup> = 10 × 10 = 100<br>10<sup>3</sup> = 10 × 10 × 10 = 1000<br>10<sup>4</sup> = 10 × 10 × 10 × 10 = 10000</p>
        <p>These are called <b>powers of ten</b>.</p>` },
      { title: 'Count the zeros', html: `
        <p>Every × 10 adds one zero on the end. So the power is the <b>number of zeros</b> after the 1:</p>
        <p class="big">10<sup>6</sup> = 1<u>000000</u> (six zeros)</p>
        <p>Try it — press + and − and watch:</p>${W('stepper', { min: 1, max: 9, start: 3 })}` },
      { title: 'Watch out! 10³ is NOT 30', html: `
        <div class="versus">
          <div class="vs-card bad"><div class="vs-head">10 × 3</div><p class="big">= 30</p></div>
          <div class="vs-card good"><div class="vs-head">10<sup>3</sup></div><p class="big">10 × 10 × 10 = 1000</p></div>
        </div>
        <p>Same slip as before: the power says <b>how many 10s to multiply</b>, not what to multiply 10 by.</p>` },
      { title: 'One step up = 10 times bigger', html: `
        <div class="ladder-static">${[6, 5, 4, 3, 2, 1].map((n) => `<div><span>10<sup>${n}</sup></span><span>${plain(dec(1, n))}</span></div>${n > 1 ? '<div class="ls-arrow">↑ × 10</div>' : ''}`).join('')}</div>
        <p>To compare two powers of ten, <b>count the steps</b>. 10<sup>5</sup> is 3 steps above 10<sup>2</sup>, so it’s 10 × 10 × 10 = <b>1000 times bigger</b>.</p>
        <p class="muted">Check: 100000 ÷ 100 = 1000 ✔ — this “count the steps” trick is the secret behind everything later.</p>` },
    ],
    /* 3 — Zero and negative powers */
    [
      { title: 'Going down the ladder', html: `
        <p>Each step <b>up</b> is × 10, so each step <b>down</b> is ÷ 10:</p>
        <p class="big">10<sup>3</sup> = 1000<br>10<sup>2</sup> = 100<br>10<sup>1</sup> = 10<br>10<sup>0</sup> = 1</p>
        <p>So <b>10<sup>0</sup> = 1</b>. No tens multiplied at all — you just have 1.</p>` },
      { title: 'Keep going below zero', html: `
        <p>Keep dividing by 10 and the power goes <b>negative</b>:</p>
        <p class="big">10<sup>−1</sup> = 1 ÷ 10 = 0.1<br>10<sup>−2</sup> = 1 ÷ 10 ÷ 10 = 0.01<br>10<sup>−3</sup> = 1 ÷ 10 ÷ 10 ÷ 10 = 0.001</p>
        <p>A negative power means <b>divide by 10 that many times</b>. It does <b>not</b> make a negative number — 10<sup>−3</sup> is a tiny bit more than zero.</p>` },
      { title: 'Try the whole ladder', html: `<p>Go up and down. Positive powers multiply, negative powers divide.</p>${W('stepper', { min: -9, max: 9, start: 0 })}` },
      { title: 'Counting trick for decimals', html: `
        <p>In 10<sup>−3</sup> = 0.001, the 1 sits in the <b>3rd place after the decimal point</b>.</p>
        <p class="big">0.1 = 10<sup>−1</sup> &nbsp;(1st place)<br>0.01 = 10<sup>−2</sup> &nbsp;(2nd place)<br>0.000001 = 10<sup>−6</sup> &nbsp;(6th place)</p>
        <p>Careful: 0.001 has only <b>two</b> zeros after the point. Count the <b>places</b> up to the 1, not the zeros.</p>` },
      { title: 'Comparing tiny powers', html: `
        <p>Which is bigger, 10<sup>−3</sup> or 10<sup>−6</sup>? And how many times bigger?</p>${PT.gen.numberLine(-6, -3)}
        <p>−3 is <b>3 steps above</b> −6. Each step is × 10, so 10<sup>−3</sup> is 10 × 10 × 10 = <b>1000 times bigger</b> than 10<sup>−6</sup>.</p>
        <p class="muted">0.001 vs 0.000001 — the first one really is 1000 times bigger.</p>` },
    ],
    /* 4 — Hopping the decimal point */
    [
      { title: 'Place value', html: `
        <p>Each column in a number is worth <b>10 times</b> the column to its right. So the columns are just powers of ten!</p>
        <div class="pv-static">${[3, 2, 1, 0, -1, -2, -3].map((c) => `<div><b>${plain(dec(1, c))}</b><span>10<sup>${minus(c)}</sup></span></div>${c === 0 ? '<div class="pv-dot">.</div>' : ''}`).join('')}</div>
        <p>The <b>decimal point</b> sits between the ones column (10<sup>0</sup>) and the tenths column (10<sup>−1</sup>).</p>` },
      { title: 'Multiply by 10: digits slide', html: `<p>Press × 10 and ÷ 10. Every digit slides one column; the point stays still. Empty columns fill with 0.</p>${W('placevalue', { value: '3.5' })}` },
      { title: 'Or: the point hops', html: `
        <p>Digits sliding left is exactly the same as the point hopping right. Hopping is quicker to think about:</p>
        <ul><li><b>× 10<sup>n</sup></b>: the point hops <b>n places right</b> — the number gets bigger.</li>
        <li><b>÷ 10<sup>n</sup></b>, which is the same as <b>× 10<sup>−n</sup></b>: the point hops <b>n places left</b> — smaller.</li>
        <li>Fill any empty places with <b>zeros</b>.</li></ul>
        <p>A whole number has an invisible point at the end: 46 is 46.</p>` },
      { title: 'Try it: 3.5 × 1000', html: `<p>1000 = 10<sup>3</sup>, so hop 3 places right. Tap <b>Hop</b> for each one.</p>${W('hopper', { value: '3.5', k: 3 })}` },
      { title: 'Try it: 46 ÷ 100', html: `<p>100 = 10<sup>2</sup>, so hop 2 places left.</p>${W('hopper', { value: '46', k: -2 })}` },
    ],
    /* 5 — Standard form */
    [
      { title: 'Why standard form?', html: `
        <p>Lots of zeros are easy to miscount: 0.0000001 or 300000000.</p>
        <p><b>Standard form</b> writes any number as</p><p class="big">a × 10<sup>n</sup></p>
        <ul><li><b>a</b> is at least 1 and less than 10 — exactly one non-zero digit before the point (like 3.5, 7, or 1.25).</li>
        <li><b>n</b> is a whole number: the power of ten.</li></ul>
        <p class="big">300000000 = 3 × 10<sup>8</sup> &nbsp;&nbsp; 0.0000001 = 1 × 10<sup>−7</sup></p>` },
      { title: 'Turning a number into standard form', html: `
        <ol><li>Hop the point until there’s <b>one non-zero digit</b> in front of it. That’s <b>a</b>.</li>
        <li>Count the hops. That’s the size of <b>n</b>.</li>
        <li>Big number (10 or more)? n is <b>positive</b>. Small number (less than 1)? n is <b>negative</b>.</li></ol>
        <p class="big">52000 → 5.2 (4 hops left) → 5.2 × 10<sup>4</sup></p>
        <p class="muted">Why positive? Turning 52000 into 5.2 made it 10<sup>4</sup> times smaller, so you multiply by 10<sup>4</sup> to make it the same again.</p>` },
      { title: 'Try some', html: `<p>Pick a number and hop it into standard form.</p>${W('sfbuilder', { values: ['52000', '0.00065', '3800000', '0.047', '709'] })}` },
      { title: 'Back to an ordinary number', html: `
        <p>Just undo it: the power tells you how far to hop. Positive → right. Negative → left.</p>
        <p>6.5 × 10<sup>−4</sup>: power −4, so hop <b>4 places left</b>:</p>${W('hopper', { value: '6.5', k: -4 })}` },
      { title: 'Spot the fakes', html: `
        <ul class="ticks"><li>✅ 4.5 × 10<sup>3</sup></li><li>❌ 45 × 10<sup>2</sup> — 45 is 10 or more</li><li>❌ 0.45 × 10<sup>4</sup> — 0.45 is less than 1</li></ul>
        <p>All three equal 4500. Only the first is in standard form.</p>
        <p class="muted">Typing it: 4.5×10^3, or 4.5e3. There’s a <b>×10ⁿ</b> button under the answer box.</p>` },
    ],
    /* 6 — Prefixes */
    [
      { title: 'Units and prefixes', html: `
        <p>A <b>unit</b> is what you measure in: metres (m) for length, grams (g) for mass, seconds (s) for time, watts (W) for power.</p>
        <p>A <b>prefix</b> is a bit stuck on the front of a unit that means “times a power of ten”:</p>
        <p class="big"><b>kilo</b>metre (km) = 10<sup>3</sup> m = 1000 m</p>
        <p>The plain unit with no prefix (m, g, s, W) is called the <b>base unit</b>.</p>` },
      { title: 'The prefixes you need', html: `
        <table class="ptable"><tr><th>prefix</th><th>symbol</th><th>means</th><th>example</th></tr>
        ${[['giga', 'G', 9, '1 GW = 10<sup>9</sup> W'], ['mega', 'M', 6, '1 MW = 10<sup>6</sup> W'], ['kilo', 'k', 3, '1 km = 1000 m'], ['—', '—', 0, 'base unit: m, g, s, W'], ['centi', 'c', -2, '1 cm = 0.01 m'], ['milli', 'm', -3, '1 mm = 0.001 m'], ['micro', 'µ', -6, '1 µm = 0.000001 m'], ['nano', 'n', -9, '1 nm = 10<sup>−9</sup> m']]
          .map(([n, s, p, ex]) => `<tr${p === 0 ? ' class="base"' : ''}><td>${n}</td><td class="sym">${s}</td><td>× 10<sup>${minus(p)}</sup></td><td>${ex}</td></tr>`).join('')}</table>
        <p class="muted">µ is the Greek letter “mu”. When typing you can use a u instead: um = µm.</p>` },
      { title: 'Zoom in and out', html: `<p>Each tap zooms by exactly × 10. The bar’s length is shown with the best prefix.</p>${W('zoom')}` },
      { title: 'Jumps of three', html: `
        <p>Most prefixes are <b>3 powers apart</b> (× 1000 each):</p>
        <p class="big">giga 9 → mega 6 → kilo 3 → base 0 → milli −3 → micro −6 → nano −9</p>
        <p><b>centi</b> (−2) is the odd one out. You’ll mostly see it in cm.</p>
        <p>Memory trick, top to bottom: <b>G</b>reat <b>M</b>ighty <b>K</b>ings <b>B</b>ring <b>C</b>ake, <b>M</b>ilk, <b>M</b>uffins &amp; <b>N</b>achos.</p>` },
      { title: 'Capital letters matter', html: `
        <p><b>M</b> (capital) = mega = 10<sup>6</sup>.<br><b>m</b> (small) = milli = 10<sup>−3</sup>.</p>
        <p>And a lone m after a number is <b>metres</b>. So in <b>mm</b>, the first m is milli and the second is metres: millimetres.</p>` },
    ],
    /* 7 — Converting units */
    [
      { title: 'Same length, different number', html: `
        <p>1 mm and 1000 µm are exactly the same length. µm is a smaller unit, so you need <b>more</b> of them.</p>
        <p class="big">1 mm = 1000 µm</p>
        <p><b>To a smaller unit → the number gets bigger.<br>To a bigger unit → the number gets smaller.</b></p>` },
      { title: 'The three-step method', html: `
        <ol><li>Write the power for each prefix. mm = 10<sup>−3</sup> m, µm = 10<sup>−6</sup> m.</li>
        <li>Count the gap between the powers: −3 to −6 is <b>3</b>. That’s how many places the point hops.</li>
        <li>Pick the direction. Smaller unit → bigger number → hop <b>right</b>. Bigger unit → hop <b>left</b>.</li></ol>
        <p class="big">3.5 mm → 3 hops right → 3500 µm</p>` },
      { title: 'Try the converter', html: `${W('converter', { value: '3.5', from: 'mm', to: 'µm' })}` },
      { title: 'More examples', html: `
        <p><b>2500 nm → µm</b>: gap 3; µm is bigger, so hop left → <b>2.5 µm</b></p>
        <p><b>0.04 m → mm</b>: gap 3; mm is smaller, so hop right → <b>40 mm</b></p>
        <p><b>6 cm → mm</b>: gap 1 (−2 to −3); hop right → <b>60 mm</b></p>
        <p class="muted">Sense check every time: did the number get bigger when the unit got smaller?</p>` },
    ],
    /* 8 — Big jumps */
    [
      { title: 'Long hops', html: `<p>nm → m is a gap of <b>9</b> (−9 up to 0). The unit gets bigger, so hop 9 places left:</p>${W('hopper', { value: '2500', k: -9 })}` },
      { title: 'A shortcut: add the powers', html: `
        <p>When you multiply powers of ten, <b>add the powers</b>:</p><p class="big">10<sup>3</sup> × 10<sup>−9</sup> = 10<sup>−6</sup> &nbsp;(3 + −9 = −6)</p>
        <p>Why? 10<sup>3</sup> is three × 10s and 10<sup>−9</sup> is nine ÷ 10s. Three of the ÷ 10s cancel the × 10s, leaving six ÷ 10s.</p>
        <p class="big">2500 nm = 2.5 × 10<sup>3</sup> × 10<sup>−9</sup> m = <b>2.5 × 10<sup>−6</sup> m</b></p>` },
      { title: 'Try big jumps', html: `${W('converter', { value: '0.4', from: 'km', to: 'µm' })}` },
      { title: 'Answers in standard form', html: `
        <p>Big jumps give lots of zeros, so questions often say “give your answer in standard form”.</p>
        <p>Convert first, then hop into standard form: 0.0000025 m = <b>2.5 × 10<sup>−6</sup> m</b>.</p>
        <p class="muted">Type it as 2.5×10^-6 or 2.5e-6.</p>` },
    ],
    /* 9 — Exam mix */
    [
      { title: 'Sizes in biology', html: `
        <p>Roughly how big things are (biggest first):</p>
        <table class="ptable"><tr><th>thing</th><th>about</th></tr>
        ${[['Human egg cell', '0.1 mm = 100 µm'], ['Plant cell', '10–100 µm'], ['Cheek (animal) cell', '20–60 µm'], ['Red blood cell', '7–8 µm'], ['Nucleus', '5–10 µm'], ['Chloroplast', '4–8 µm'], ['Bacterium', '1–5 µm'], ['Mitochondrion', '1–2 µm'], ['Virus', '20–300 nm'], ['Ribosome', '20–30 nm'], ['Cell membrane (thickness)', '7–10 nm']]
          .map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>
        <p class="muted">Use these to sense-check: a cell is never 7000 m wide!</p>` },
      { title: 'Exam tips', html: `
        <ul><li>Underline the unit they want the answer in.</li><li>Write the powers down: mm = 10<sup>−3</sup>, µm = 10<sup>−6</sup>.</li>
        <li>Count the gap, pick the direction, hop.</li><li>Standard form? Check a is at least 1 and less than 10.</li>
        <li>Sense check: smaller unit → bigger number.</li></ul>` },
      { title: 'Which is bigger?', html: `
        <p>To compare 0.5 mm and 600 µm, put them in the <b>same unit</b> first:</p>
        <p class="big">0.5 mm = 500 µm</p><p>500 µm vs 600 µm → <b>600 µm is bigger</b>.</p>` },
    ],
  ];

  /* ---------- widgets ---------- */
  const widgets = {};
  const btn = (label, cls, attrs) => `<button type="button" class="btn ${cls || ''}" ${attrs || ''}>${label}</button>`;

  widgets.chain = (el) => {
    let base = 2, n = 1;
    el.innerHTML = `<div class="seg">${[2, 3, 5, 10].map((b) => `<button type="button" data-b="${b}">base ${b}</button>`).join('')}</div>
      <div class="chain-out"></div><div class="row center gap">${btn('− one less', 'ghost', 'data-d="-1"')}${btn('× one more', '', 'data-d="1"')}</div>`;
    const out = el.querySelector('.chain-out');
    const max = () => (base === 2 ? 10 : base === 10 ? 6 : 6);
    function draw() {
      el.querySelectorAll('[data-b]').forEach((b) => b.classList.toggle('on', +b.dataset.b === base));
      let v = 1, steps = '';
      for (let i = 1; i <= n; i++) { v *= base; steps += i === 1 ? `<span class="chain-num">${base}</span>` : `<span class="hop-arrow">×${base}</span><span class="chain-num${i === n ? ' last' : ''}">${v}</span>`; }
      out.innerHTML = `<div class="chain-pow">${pow(n, base)}</div>
        <p class="big">${Array(n).fill(base).join(' × ')}</p>
        <p class="muted">${n} ${n === 1 ? 'copy' : 'copies'} of ${base} multiplied together</p>
        <div class="chain">${steps}</div><p class="big">${pow(n, base)} = <b>${v.toLocaleString('en-GB')}</b></p>`;
      el.querySelector('[data-d="-1"]').disabled = n <= 1;
      el.querySelector('[data-d="1"]').disabled = n >= max();
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.b) { base = +b.dataset.b; n = Math.min(n, max()); }
      if (b.dataset.d) n = Math.max(1, Math.min(max(), n + +b.dataset.d));
      draw();
    });
    draw();
  };

  widgets.squares = (el) => {
    let base = 3, cube = false;
    el.innerHTML = `<div class="seg">${[2, 3, 4, 5].map((b) => `<button type="button" data-b="${b}">${b}</button>`).join('')}</div>
      <div class="seg"><button type="button" data-c="0">squared (power 2)</button><button type="button" data-c="1">cubed (power 3)</button></div><div class="sq-out"></div>`;
    const out = el.querySelector('.sq-out');
    function grid(label) {
      let h = `<div class="sq-layer"><div class="sq-grid" style="grid-template-columns:repeat(${base},auto)">`;
      for (let i = 0; i < base * base; i++) h += '<span></span>';
      return h + `</div>${label ? `<small>${label}</small>` : ''}</div>`;
    }
    function draw() {
      el.querySelectorAll('[data-b]').forEach((b) => b.classList.toggle('on', +b.dataset.b === base));
      el.querySelectorAll('[data-c]').forEach((b) => b.classList.toggle('on', !!+b.dataset.c === cube));
      const n = cube ? 3 : 2, v = base ** n;
      const layers = cube ? Array.from({ length: base }, (_, i) => grid(`layer ${i + 1}`)).join('') : grid('');
      out.innerHTML = `<div class="sq-layers">${layers}</div>
        <p class="big">${pow(n, base)} = ${Array(n).fill(base).join(' × ')} = <b>${v}</b> dots</p>
        <p class="muted">${cube ? `${base} layers, each a ${base} × ${base} square of ${base * base} dots.` : `${base} rows of ${base}.`} Count them if you like!</p>`;
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.b) base = +b.dataset.b;
      if (b.dataset.c) cube = !!+b.dataset.c;
      draw();
    });
    draw();
  };

  widgets.stepper = (el, o) => {
    let n = o.start == null ? o.min : o.start;
    el.innerHTML = `<div class="stepper">${btn('−', 'round', 'data-d="-1" aria-label="power down"')}<div class="stepper-out"></div>${btn('+', 'round', 'data-d="1" aria-label="power up"')}</div><div class="stepper-detail"></div>`;
    const out = el.querySelector('.stepper-out'), det = el.querySelector('.stepper-detail');
    function draw() {
      const v = dec(1, n);
      out.innerHTML = `<span class="huge">${pow(n)}</span>`;
      const how = n > 0 ? Array(n).fill('10').join(' × ') : n === 0 ? 'no tens at all' : '1 ÷ ' + Array(-n).fill('10').join(' ÷ ');
      const note = n > 0 ? `1 followed by <b>${n}</b> zero${n === 1 ? '' : 's'}` : n === 0 ? 'just 1' : `the 1 is in place <b>${-n}</b> after the point`;
      det.innerHTML = `<p>= ${how}</p><p class="big">= <b>${plain(v)}</b>${n < 0 ? ` <span class="muted">= 1/${plain(dec(1, -n))}</span>` : ''}</p><p class="muted">${note}</p>`;
      el.querySelector('[data-d="-1"]').disabled = n <= o.min;
      el.querySelector('[data-d="1"]').disabled = n >= o.max;
    }
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-d]'); if (b) { n += +b.dataset.d; draw(); } });
    draw();
  };

  widgets.placevalue = (el, o) => {
    const HI = 4, LO = -4, COLS = HI - LO + 1;
    const start = fromString(o.value);
    const digits = start.m.toString();
    let k = 0;
    const colPct = 100 / COLS;
    const left = (col) => `${(HI - col) * colPct}%`;
    el.innerHTML = `<div class="pv"><div class="pv-head">${Array.from({ length: COLS }, (_, i) => `<span>10<sup>${minus(HI - i)}</sup></span>`).join('')}</div>
      <div class="pv-row"><div class="pv-zeros"></div>${[...digits].map((d, i) => `<span class="pv-digit" data-i="${i}" style="width:${colPct}%">${d}</span>`).join('')}<span class="pv-point" style="left:${(HI + 1) * colPct}%">.</span></div></div>
      <p class="pv-read big"></p><div class="row center gap">${btn('÷ 10', 'ghost', 'data-d="-1"')}${btn('× 10', '', 'data-d="1"')}</div>`;
    const els = el.querySelectorAll('.pv-digit'), zeros = el.querySelector('.pv-zeros'), read = el.querySelector('.pv-read');
    function draw() {
      const e = start.e + k; // column of the last digit
      const top = e + digits.length - 1;
      els.forEach((d, i) => { d.style.left = left(top - i); });
      const zc = [];
      for (let c = 0; c < e; c++) zc.push(c);           // trailing zeros up to the ones column
      for (let c = top + 1; c <= 0; c++) zc.push(c);    // leading 0 and zeros after the point
      zeros.innerHTML = zc.map((c) => `<span class="pv-digit zero" style="left:${left(c)};width:${colPct}%">0</span>`).join('');
      read.innerHTML = `${plain(start)} × ${pow(k)} = <b>${plain(shift(start, k))}</b>`;
      el.querySelector('[data-d="-1"]').disabled = e - 1 < LO;
      el.querySelector('[data-d="1"]').disabled = top + 1 > HI;
    }
    el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-d]'); if (b) { k += +b.dataset.d; draw(); } });
    draw();
  };

  // Step-by-step decimal point hopping, at his own pace.
  function hopper(el, value, k, onDone) {
    const v = fromString(value);
    let i = 0;
    el.innerHTML = `<div class="hopper"><div class="hop-big"></div><div class="hop-trail"></div><p class="hop-count muted"></p>
      <div class="row center gap">${btn('Start again', 'ghost small', 'data-r')}${btn(`Hop ${k > 0 ? '→' : '←'}`, '', 'data-h')}</div></div>`;
    const big = el.querySelector('.hop-big'), trail = el.querySelector('.hop-trail'), count = el.querySelector('.hop-count');
    function draw() {
      const cur = shift(v, Math.sign(k) * i);
      big.innerHTML = ptMark(plain(cur, { group: false }));
      trail.innerHTML = i ? hops(v, Math.sign(k) * i) : '';
      const n = Math.abs(k);
      count.innerHTML = i < n ? `Hops: ${i} of ${n} (${k > 0 ? 'right — × 10 each' : 'left — ÷ 10 each'})` : `<b>Done!</b> ${n} hop${n === 1 ? '' : 's'} ${k > 0 ? 'right' : 'left'}: ${plain(v)} → <b>${plain(cur)}</b>`;
      el.querySelector('[data-h]').disabled = i >= n;
      if (i >= n && onDone) onDone(cur);
    }
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-h]')) { i++; draw(); }
      if (e.target.closest('[data-r]')) { i = 0; draw(); }
    });
    draw();
  }
  widgets.hopper = (el, o) => hopper(el, o.value, o.k);

  widgets.sfbuilder = (el, o) => {
    el.innerHTML = `<div class="seg wrap">${o.values.map((v) => `<button type="button" data-v="${v}">${plain(fromString(v))}</button>`).join('')}</div><div class="sf-hop"></div><div class="sf-result"></div>`;
    const hopEl = el.querySelector('.sf-hop'), res = el.querySelector('.sf-result');
    function choose(v) {
      el.querySelectorAll('[data-v]').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
      const d = fromString(v), s = sci(d);
      res.innerHTML = '';
      hopper(hopEl, v, -s.exp, () => {
        res.innerHTML = s.exp === 0 ? `<p>Already one digit in front — power 0.</p>` :
          `<p>${Math.abs(s.exp)} hop${Math.abs(s.exp) === 1 ? '' : 's'} <b>${s.exp > 0 ? 'left' : 'right'}</b> → the number was ${s.exp > 0 ? 'big' : 'small'}, so the power is <b>${minus(s.exp)}</b>.</p><p class="big">${plain(d)} = <b>${plain(s.mant)} × ${pow(s.exp)}</b></p>`;
      });
    }
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) choose(b.dataset.v); });
    choose(o.values[0]);
  };

  // Zoom: the bar is always 10 equal parts; zooming in blows the first part up to fill the bar.
  const ZOOM_THINGS = {
    3: 'about 10 football pitches end to end', 2: 'a football pitch (about 100 m)', 1: 'a bus (about 10 m)', 0: 'a big stride (about 1 m)',
    '-1': 'the width of your hand (about 10 cm)', '-2': 'a fingernail’s width (about 1 cm)', '-3': 'a pinhead (about 1–2 mm)',
    '-4': 'a human egg cell (about 100 µm) or the thickness of a hair (50–100 µm)', '-5': 'a red blood cell (about 8 µm) or an animal cell (10–30 µm)',
    '-6': 'a bacterium (about 1–2 µm)', '-7': 'a virus (many are about 100 nm)', '-8': 'a ribosome (about 25 nm) or a cell membrane’s thickness (about 8 nm)',
    '-9': 'the width of a DNA molecule (about 2 nm)',
  };
  const EXACT = { 3: 'exactly 1 kilometre', 0: 'exactly 1 metre — the base unit', '-2': 'exactly 1 centimetre', '-3': 'exactly 1 millimetre', '-6': 'exactly 1 micrometre', '-9': 'exactly 1 nanometre' };
  function lenLabel(z) {
    const pf = [['k', 3], ['', 0], ['c', -2], ['m', -3], ['µ', -6], ['n', -9]].find(([, p]) => p <= z) || ['n', -9];
    return `${plain(dec(1, z - pf[1]))} ${pf[0]}m`;
  }
  widgets.zoom = (el) => {
    let z = 0;
    el.innerHTML = `<div class="zoom"><p class="zoom-label"></p><div class="zoom-win"><div class="zoom-bar">${Array.from({ length: 10 }, (_, i) => `<span${i === 0 ? ' class="first"' : ''}></span>`).join('')}</div></div>
      <p class="zoom-sub muted"></p><p class="zoom-thing"></p><p class="zoom-exact"></p>
      <div class="row center gap">${btn('− Zoom out', 'ghost', 'data-z="1"')}${btn('Zoom in +', '', 'data-z="-1"')}</div></div>`;
    const bar = el.querySelector('.zoom-bar');
    let busy = false;
    function draw() {
      el.querySelector('.zoom-label').innerHTML = `Whole bar = <b>${lenLabel(z)}</b> = ${pow(z)} m`;
      el.querySelector('.zoom-sub').innerHTML = `Each of the 10 sections = ${lenLabel(z - 1)}. The highlighted one is what you zoom into.`;
      el.querySelector('.zoom-thing').innerHTML = `About this size: ${ZOOM_THINGS[z]}`;
      el.querySelector('.zoom-exact').innerHTML = EXACT[z] ? `✨ ${EXACT[z]}` : '';
      el.querySelector('[data-z="1"]').disabled = z >= 3;
      el.querySelector('[data-z="-1"]').disabled = z <= -9;
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-z]'); if (!b || busy) return;
      const dz = +b.dataset.z;
      busy = true;
      if (dz < 0) { // zoom in: grow the first tenth to fill, then redraw
        bar.style.transition = 'transform .6s ease-in'; bar.style.transform = 'scaleX(10)';
        setTimeout(() => { bar.style.transition = 'none'; bar.style.transform = ''; z += dz; draw(); busy = false; }, 620);
      } else { // zoom out: old bar becomes the first tenth of the new one
        z += dz; draw();
        bar.style.transition = 'none'; bar.style.transform = 'scaleX(10)';
        requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = 'transform .6s ease-out'; bar.style.transform = ''; }));
        setTimeout(() => { busy = false; }, 620);
      }
    });
    draw();
  };

  widgets.converter = (el, o) => {
    const UNITS = [['km', 3], ['m', 0], ['cm', -2], ['mm', -3], ['µm', -6], ['nm', -9]];
    const P = Object.fromEntries(UNITS);
    const opts = (sel) => UNITS.map(([u]) => `<option${u === sel ? ' selected' : ''}>${u}</option>`).join('');
    el.innerHTML = `<div class="conv-form"><input class="conv-v" inputmode="decimal" value="${o.value}" aria-label="value">
      <select class="conv-from" aria-label="from unit">${opts(o.from)}</select><span>→</span><select class="conv-to" aria-label="to unit">${opts(o.to)}</select></div>
      <div class="conv-body"><div class="ladder"></div><div class="conv-steps"></div></div>`;
    const $ = (s) => el.querySelector(s);
    let step = 0;
    function ladder(from, to) {
      const lo = Math.min(P[from], P[to]), hi = Math.max(P[from], P[to]);
      let h = '';
      for (let p = 3; p >= -9; p--) {
        const u = UNITS.find(([, q]) => q === p);
        const cls = (p === P[from] ? ' from' : '') + (p === P[to] ? ' to' : '') + (p > lo && p < hi ? ' mid' : '');
        h += `<div class="lad-row${cls}"><span>${pow(p)}</span><b>${u ? u[0] : ''}</b></div>`;
      }
      return h;
    }
    function draw() {
      const from = $('.conv-from').value, to = $('.conv-to').value;
      const v = fromString(($('.conv-v').value || '').trim());
      $('.ladder').innerHTML = ladder(from, to);
      const S = $('.conv-steps');
      if (!v) { S.innerHTML = '<p>Type a number (like 3.5) in the box.</p>'; return; }
      if (from === to) { S.innerHTML = '<p>Pick two different units.</p>'; return; }
      const d = P[from] - P[to], n = Math.abs(d);
      const lines = [
        `<p><b>1.</b> 1 ${from} = ${pow(P[from])} m, 1 ${to} = ${pow(P[to])} m.</p>`,
        `<p><b>2.</b> Gap between ${minus(P[from])} and ${minus(P[to])} = <b>${n}</b>, so ${n} hop${n === 1 ? '' : 's'}.</p>`,
        `<p><b>3.</b> ${to} is the ${d > 0 ? '<b>smaller</b> unit → number gets bigger → hop <b>right</b>' : '<b>bigger</b> unit → number gets smaller → hop <b>left</b>'}.</p>`,
      ];
      S.innerHTML = lines.slice(0, step).join('') + (step < 3 ? btn(step ? 'Next step' : 'Show me how', 'small', 'data-next') : '<div class="conv-hop"></div>');
      if (step >= 3) hopper(S.querySelector('.conv-hop'), plain(v, { group: false }), d, (r) => {
        if (!S.querySelector('.conv-ans')) S.insertAdjacentHTML('beforeend', `<p class="big conv-ans">${plain(v)} ${from} = <b>${plain(r)} ${to}</b></p>`);
      });
    }
    el.addEventListener('input', () => { step = 0; draw(); });
    el.addEventListener('change', () => { step = 0; draw(); });
    el.addEventListener('click', (e) => { if (e.target.closest('[data-next]')) { step++; draw(); } });
    draw();
  };

  function mountWidgets(root) {
    root.querySelectorAll('.widget[data-w]').forEach((el) => widgets[el.dataset.w](el, JSON.parse(el.dataset.o || '{}')));
  }

  PT.lessons = { LESSONS, mountWidgets };
})(window);
