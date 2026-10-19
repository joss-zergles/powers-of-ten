/* Random question generators. Every question is built fresh — there's no fixed bank.
   A question: { id, prompt, sub?, input:'text'|'mc', options?, answerIndex?, answer?, form, unit, explain, meta } */
(function (root) {
  'use strict';
  const PT = root.PT;
  const { dec, ONE, fromString, shift, mul, cmp, decimals, intDigits, plain, sci, minus, pow, sfHTML } = PT.num;

  const R = { rand: Math.random };
  const ri = (a, b) => a + Math.floor(R.rand() * (b - a + 1));
  const pick = (a) => a[Math.floor(R.rand() * a.length)];
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R.rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const s_ = (n) => (Math.abs(n) === 1 ? '' : 's');
  const tensTimes = (n) => (n <= 6 ? Array(n).fill('10').join(' × ') : '10 × 10 × … × 10');
  const tensDiv = (n) => '1 ÷ ' + (n <= 6 ? Array(n).fill('10').join(' ÷ ') : '10 ÷ 10 ÷ … ÷ 10');
  const p10 = (n) => dec(1, n);

  /* ---------- prefixes and units ---------- */
  const PREFIX = {
    G: { name: 'giga', p: 9 }, M: { name: 'mega', p: 6 }, k: { name: 'kilo', p: 3 }, '': { name: '', p: 0 },
    c: { name: 'centi', p: -2 }, m: { name: 'milli', p: -3 }, 'µ': { name: 'micro', p: -6 }, n: { name: 'nano', p: -9 },
  };
  const PREFIX_SYMS = ['G', 'M', 'k', 'c', 'm', 'µ', 'n'];
  const QUANT = {
    m: { word: 'metre', prefixes: ['k', '', 'c', 'm', 'µ', 'n'] },
    g: { word: 'gram', prefixes: ['k', '', 'm', 'µ'] },
    s: { word: 'second', prefixes: ['', 'm', 'µ', 'n'] },
    W: { word: 'watt', prefixes: ['G', 'M', 'k', ''] },
  };
  const U = (prefix, base) => ({ sym: prefix + base, prefix, base, p: PREFIX[prefix].p, name: PREFIX[prefix].name + QUANT[base].word + 's' });
  const pickBase = () => { const r = R.rand(); return r < 0.6 ? 'm' : r < 0.75 ? 'g' : r < 0.87 ? 'W' : 's'; };
  function unitPairs(base, test) {
    const out = [];
    QUANT[base].prefixes.forEach((a) => QUANT[base].prefixes.forEach((b) => {
      if (a !== b && test(PREFIX[a].p - PREFIX[b].p)) out.push([U(a, base), U(b, base)]);
    }));
    return out;
  }

  /* ---------- nice random values ---------- */
  function niceSig() {
    const r = R.rand(); let x;
    if (r < 0.4) return ri(1, 9);
    if (r < 0.8) { do x = ri(11, 99); while (x % 10 === 0); return x; }
    do x = ri(101, 999); while (x % 10 === 0); return x;
  }
  function until(make, ok) {
    for (let i = 0; i < 500; i++) { const r = make(); if (ok(r)) return r; }
    throw new Error('generator could not find a value');
  }
  const mantissa = () => sci(dec(niceSig())).mant; // 1 ≤ m < 10

  /* ---------- explanation helpers ---------- */
  const ptMark = (str) => (str.includes('.') ? str.replace('.', '<span class="pt">.</span>') : str + '<span class="pt ghost">.</span>');
  function hops(d, k) {
    const steps = [d];
    for (let i = 0; i < Math.abs(k); i++) steps.push(shift(steps[i], Math.sign(k)));
    const arrow = k > 0 ? '×10' : '÷10';
    return '<div class="hops">' + steps.map((s, i) => (i ? `<span class="hop-arrow">${arrow}</span>` : '') +
      `<span class="hop-num${i === steps.length - 1 ? ' last' : ''}">${ptMark(plain(s, { group: false }))}</span>`).join('') + '</div>';
  }
  const places = (k) => `${Math.abs(k)} place${s_(k)} to the ${k > 0 ? 'right' : 'left'}`;
  function numberLine(from, to) {
    const lo = Math.min(from, to), hi = Math.max(from, to);
    let h = '<div class="nline">';
    for (let i = lo; i <= hi; i++) h += (i > lo ? '<span class="nl-step">→</span>' : '') + `<span class="nl-tick${i === lo || i === hi ? ' on' : ''}">${minus(i)}</span>`;
    return h + '</div>';
  }
  function anyHTML(d) {
    const s = sci(d);
    return (s.exp >= 7 || s.exp <= -5) ? `${plain(d)} <span class="muted">(= ${sfHTML(d)})</span>` : plain(d);
  }
  function answerHTML(q) {
    if (q.input === 'mc') return q.options[q.answerIndex];
    const v = q.form === 'plain' ? plain(q.answer) : q.form === 'power' ? pow(sci(q.answer).exp) : q.form === 'sf' ? sfHTML(q.answer) : anyHTML(q.answer);
    return v + (q.unit ? ' ' + q.unit : '');
  }
  const unitPow = (u) => (u.p === 0 ? `1 ${u.sym} is the base unit (${pow(0)} ${u.base})` : `1 ${u.sym} = ${pow(u.p)} ${u.base}`);

  const text = (o) => Object.assign({ input: 'text', form: 'any', unit: null }, o);
  function mc(o, right, wrongs) {
    const uniq = [...new Set(wrongs.filter((w) => w !== right))].slice(0, 3);
    const options = o.keepOrder ? [right].concat(uniq) : shuffle([right].concat(uniq));
    return Object.assign({ input: 'mc', options, answerIndex: options.indexOf(right) }, o);
  }

  /* ---------- level 1: what is a power? ---------- */
  // Small bases only, with answers he can work out by hand.
  const SMALL = [[2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [3, 2], [3, 3], [3, 4], [4, 2], [4, 3], [5, 2], [5, 3], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [10, 3], [3, 1], [7, 1]];
  const ipow = (b, n) => b ** n;
  const chainTimes = (b, n) => Array(n).fill(b).join(' × ');
  function chainWorking(b, n) {
    if (n === 1) return `<p>The power is 1, so there’s just <b>one</b> ${b}: ${pow(1, b)} = <b>${b}</b>.</p>`;
    let h = `<p>${pow(n, b)} means <b>${n} ${b}s multiplied together</b>: ${chainTimes(b, n)}</p><div class="chain">`;
    let v = b;
    h += `<span class="chain-num">${b}</span>`;
    for (let i = 2; i <= n; i++) { v *= b; h += `<span class="hop-arrow">×${b}</span><span class="chain-num${i === n ? ' last' : ''}">${v}</span>`; }
    return h + '</div>';
  }
  const SLIPS = (b, n) => `<p class="muted">Common slips: it’s not ${b} × ${n} = ${b * n}, and not ${b} + ${n} = ${b + n}.</p>`;
  const G = {};

  G.pw_parts = () => {
    const [b, n] = pick(SMALL.filter(([b, n]) => b !== n && n > 1));
    const askPower = R.rand() < 0.6;
    const right = String(askPower ? n : b);
    return mc({
      prompt: `In ${pow(n, b)}, which number is the <b>${askPower ? 'power' : 'base'}</b>?`,
      explain: `<p>In ${pow(n, b)} the big number <b>${b}</b> is the <b>base</b> — the number being multiplied.</p><p>The small raised number <b>${n}</b> is the <b>power</b> — how many ${b}s you multiply together.</p>`,
      meta: { b, n, askPower },
    }, right, [String(askPower ? b : n), String(ipow(b, n)), String(b * n), String(b + n)]);
  };
  G.pw_expand = () => {
    const [b, n] = pick(SMALL.filter(([b, n]) => b !== n && n > 1 && b < 10));
    const right = chainTimes(b, n);
    return mc({
      prompt: `What does ${pow(n, b)} mean?`,
      explain: `<p>The power (${n}) says how many times the base (${b}) appears in a multiplication:</p><p class="big">${pow(n, b)} = ${right} = ${ipow(b, n)}</p>`,
      meta: { b, n },
    }, right, [`${b} × ${n}`, chainTimes(n, b), Array(n).fill(b).join(' + ')]);
  };
  G.pw_write = () => {
    const [b, n] = pick(SMALL.filter(([b, n]) => b !== n && n > 1 && b < 10));
    const right = pow(n, b);
    return mc({
      prompt: `Write <span class="big">${chainTimes(b, n)}</span> as a power.`,
      explain: `<p>Count the ${b}s: there are <b>${n}</b>. So the base is ${b} and the power is ${n}: <b>${right}</b>.</p>`,
      meta: { b, n },
    }, right, [pow(b, n), `${b} × ${n}`, String(b * n), pow(n + 1, b)]);
  };
  G.pw_eval = () => {
    const [b, n] = pick(SMALL);
    const v = ipow(b, n);
    return text({ prompt: `Work out ${pow(n, b)}.`, answer: dec(v), form: 'plain',
      explain: chainWorking(b, n) + `<p>So ${pow(n, b)} = <b>${v}</b>.</p>` + (n > 1 ? SLIPS(b, n) : ''), meta: { b, n } });
  };
  G.pw_mc = () => {
    const [b, n] = pick(SMALL.filter(([b, n]) => n > 1 && !(b === 2 && n === 2)));
    const v = ipow(b, n);
    const right = String(v);
    return mc({ prompt: `What is ${pow(n, b)}?`, explain: chainWorking(b, n) + SLIPS(b, n), meta: { b, n } },
      right, [String(b * n), String(b) + String(n), String(b + n), String(n ** b), String(ipow(b, n - 1)), String(ipow(b, n + 1))]);
  };

  /* ---------- level 2: powers of ten ---------- */
  G.p2n = () => {
    const n = pick([1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9]);
    const a = p10(n);
    return text({ prompt: `Write ${pow(n)} as an ordinary number.`, answer: a, form: 'plain', meta: { n },
      explain: n === 1 ? `<p>${pow(1)} is just one 10: <b>10</b>.</p>` :
        `<p>${pow(n)} means <b>${n} tens</b> multiplied together:</p><p class="big">${tensTimes(n)} = ${plain(a)}</p><p>That’s a 1 followed by <b>${n} zeros</b>.</p>` });
  };
  G.n2p = () => {
    const n = pick([1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 9]);
    const a = p10(n);
    return text({ prompt: `Write ${plain(a)} as a power of ten.`, answer: a, form: 'power', meta: { n },
      explain: `<p>Count the zeros after the 1: <b>${n}</b>.</p><p>Each zero is one more × 10, so ${plain(a)} = ${tensTimes(n)} = <b>${pow(n)}</b>.</p>` });
  };
  G.pmc = () => {
    const n = ri(2, 6);
    const right = plain(p10(n));
    return mc({ prompt: `What is ${pow(n)}?`, meta: { n },
      explain: `<p>${pow(n)} means ${n} tens multiplied: ${tensTimes(n)} = <b>${right}</b>.</p><p>It’s <b>not</b> 10 × ${n} = ${10 * n}. The power says how many 10s to multiply together.</p>` },
    right, [String(10 * n), '10' + n, plain(p10(n - 1)), plain(p10(n + 1))]);
  };
  G.times = () => {
    const d = pick([1, 2, 2, 3, 3, 3, 4, 5, 6]);
    const b = ri(1, 9 - d), a = b + d;
    return text({ prompt: `How many times bigger is ${pow(a)} than ${pow(b)}?`, answer: p10(d), meta: { a, b },
      explain: `<p>Each step up the powers is another × 10.</p>${numberLine(b, a)}<p>From ${pow(b)} up to ${pow(a)} is <b>${d} step${s_(d)}</b>, so it is ${pow(d)} = <b>${plain(p10(d))}</b> times bigger.</p><p class="muted">Check: ${plain(p10(a))} ÷ ${plain(p10(b))} = ${plain(p10(d))}</p>` });
  };

  /* ---------- level 3: zero and negative powers ---------- */
  G.np2n = () => {
    const n = R.rand() < 0.12 ? 0 : -pick([1, 1, 2, 2, 3, 3, 4, 5, 6]);
    const a = p10(n), k = -n;
    return text({ prompt: n === 0 ? `Write ${pow(0)} as an ordinary number.` : `Write ${pow(n)} as a decimal.`, answer: a, form: 'plain', meta: { n },
      explain: n === 0 ? `<p>Going down the powers each step is ÷ 10: ${pow(2)} = 100, ${pow(1)} = 10, so ${pow(0)} = 10 ÷ 10 = <b>1</b>.</p>` :
        `<p>A negative power means <b>divide by 10</b>, ${k} time${s_(k)}:</p><p class="big">${pow(n)} = ${tensDiv(k)} = <b>${plain(a)}</b></p>${hops(ONE, n)}<p>The decimal point hops ${places(n)}, so the 1 lands in place number ${k} after the point.</p>` });
  };
  G.n2np = () => {
    const r = R.rand();
    const n = r < 0.1 ? 0 : r < 0.2 ? ri(1, 4) : -pick([1, 2, 2, 3, 3, 4, 4, 5, 6, 7]);
    const a = p10(n), k = -n;
    let explain;
    if (n === 0) explain = `<p>1 has no tens multiplied or divided, so 1 = <b>${pow(0)}</b>.</p>`;
    else if (n > 0) explain = `<p>Count the zeros after the 1: <b>${n}</b>, so ${plain(a)} = <b>${pow(n)}</b>.</p>`;
    else explain = `<p>Count how many places after the decimal point the 1 is: <b>${k}</b>.</p>${hops(ONE, n)}<p>That’s 1 divided by 10 ${k === 1 ? 'once' : k + ' times'}, so ${plain(a)} = <b>${pow(n)}</b>.</p><p class="muted">Count places, not zeros: ${plain(a)} has only ${k - 1} zero${s_(k - 1)} after the point.</p>`;
    return text({ prompt: `Write ${plain(a)} as a power of ten.`, answer: a, form: 'power', meta: { n }, explain });
  };
  G.frac = () => {
    const k = pick([1, 2, 3, 3, 4, 5, 6]);
    const den = plain(p10(k));
    const shown = R.rand() < 0.5 ? `1 ÷ ${den}` : `<span class="frac"><span>1</span><span>${den}</span></span>`;
    return text({ prompt: `Write ${shown} as a power of ten.`, answer: p10(-k), form: 'power', meta: { n: -k },
      explain: `<p>${den} = ${pow(k)}, so 1 ÷ ${den} means dividing 1 by 10, ${k === 1 ? 'once' : k + ' times'}.</p><p>Dividing by 10 ${k === 1 ? 'once' : k + ' times'} is a power of <b>−${k}</b>: 1 ÷ ${den} = ${plain(p10(-k))} = <b>${pow(-k)}</b>.</p>` });
  };
  G.times2 = () => {
    const { a, b, d } = until(() => { const d = pick([1, 2, 3, 3, 3, 3, 4, 5, 6, 6, 9]); const b = ri(-9, 3 - d); return { a: b + d, b, d }; }, (x) => x.b < 0);
    const bigger = R.rand() < 0.6;
    return text({ prompt: bigger ? `How many times bigger is ${pow(a)} than ${pow(b)}?` : `How many times smaller is ${pow(b)} than ${pow(a)}?`,
      answer: p10(d), meta: { a, b },
      explain: `<p>Count the steps from ${minus(b)} up to ${minus(a)}:</p>${numberLine(b, a)}<p>That’s <b>${d} step${s_(d)}</b>, and each step is × 10. So ${pow(a)} is ${pow(d)} = <b>${plain(p10(d))}</b> times bigger than ${pow(b)}.</p>` });
  };

  /* ---------- level 4: moving the decimal point ---------- */
  G.mul = () => {
    const { v, k } = until(() => ({ v: dec(niceSig(), ri(-3, 1)), k: pick([1, 1, 2, 2, 3, 3, 4, 5, 6]) }),
      ({ v, k }) => decimals(v) <= 3 && intDigits(v) <= 3 && intDigits(shift(v, k)) <= 8);
    const a = shift(v, k);
    const asPow = R.rand() < 0.5;
    return text({ prompt: `Work out <span class="big">${plain(v)} × ${asPow ? pow(k) : plain(p10(k))}</span>`, answer: a, form: 'plain', meta: { v: plain(v, { group: false }), k },
      explain: `<p>Multiplying by ${asPow ? pow(k) : `${plain(p10(k))} (that’s ${pow(k)})`}: the decimal point hops <b>${places(k)}</b> and the number gets bigger. Fill gaps with zeros.</p>${hops(v, k)}<p>Answer: <b>${plain(a)}</b></p>` });
  };
  G.div = () => {
    const { v, k } = until(() => ({ v: dec(niceSig(), ri(-1, 3)), k: pick([1, 1, 2, 2, 3, 3, 4]) }),
      ({ v, k }) => decimals(v) <= 2 && intDigits(v) <= 5 && decimals(shift(v, -k)) <= 7);
    const a = shift(v, -k);
    const style = pick(['num', 'pow', 'neg']);
    const expr = style === 'num' ? `${plain(v)} ÷ ${plain(p10(k))}` : style === 'pow' ? `${plain(v)} ÷ ${pow(k)}` : `${plain(v)} × ${pow(-k)}`;
    const why = style === 'neg' ? `Multiplying by ${pow(-k)} is the same as dividing by ${pow(k)}` : `Dividing by ${style === 'num' ? `${plain(p10(k))} (that’s ${pow(k)})` : pow(k)}`;
    return text({ prompt: `Work out <span class="big">${expr}</span>`, answer: a, form: 'plain', meta: { v: plain(v, { group: false }), k: -k },
      explain: `<p>${why}: the decimal point hops <b>${places(-k)}</b> and the number gets smaller.</p>${hops(v, -k)}<p>Answer: <b>${plain(a)}</b></p>` });
  };

  /* ---------- level 5: standard form ---------- */
  G.sf2n = () => {
    const { m, n } = until(() => ({ m: mantissa(), n: pick([-6, -5, -4, -3, -3, -2, -1, 1, 2, 3, 3, 4, 5, 6, 7, 8]) }), ({ m, n }) => decimals(shift(m, n)) <= 9);
    const a = shift(m, n);
    return text({ prompt: `Write ${plain(m)} × ${pow(n)} as an ordinary number.`, answer: a, form: 'plain', meta: { m: plain(m), n },
      explain: `<p>The power is <b>${minus(n)}</b>, so the decimal point hops <b>${places(n)}</b> — ${n > 0 ? 'a big number' : 'a small number'}.</p>${hops(m, n)}<p>Answer: <b>${plain(a)}</b></p>` });
  };
  G.n2sf = () => {
    const { m, n } = until(() => ({ m: mantissa(), n: pick([-7, -6, -5, -4, -3, -3, -2, -1, 1, 2, 3, 3, 4, 5, 6, 7, 8]) }), ({ m, n }) => decimals(shift(m, n)) <= 9);
    const a = shift(m, n);
    return text({ prompt: `Write ${plain(a)} in standard form.`, answer: a, form: 'sf', meta: { m: plain(m), n },
      explain: `<p>Hop the decimal point until there is <b>one non-zero digit</b> in front of it: that gives <b>${plain(m)}</b>.</p>${hops(a, -n)}<p>It hopped <b>${places(-n)}</b>. ${n > 0
        ? `That made the number ${plain(p10(n))} times smaller, so multiply by ${pow(n)} to make it the same again.`
        : `That made the number bigger, so the power is negative: × ${pow(n)} shrinks it back.`}</p><p class="big">${plain(a)} = <b>${plain(m)} × ${pow(n)}</b></p>` });
  };
  G.sfmc = () => {
    const { m, n } = until(() => ({ m: mantissa(), n: pick([-5, -4, -3, -2, 2, 3, 4, 5, 6]) }), ({ m }) => cmp(m, ONE) > 0);
    const right = `${plain(m)} × ${pow(n)}`;
    const w1 = `${plain(shift(m, 1))} × ${pow(n - 1)}`, w2 = `${plain(shift(m, -1))} × ${pow(n + 1)}`, w3 = `${plain(m)} × ${plain(p10(n))}`;
    return mc({ prompt: 'Which one is written in <b>standard form</b>?', meta: { m: plain(m), n },
      explain: `<p>Standard form is <b>a × 10ⁿ</b>: a is at least 1 and less than 10, and the 10 has a power.</p><ul class="ticks"><li>✅ ${right}</li><li>❌ ${w1} — ${plain(shift(m, 1))} is 10 or more</li><li>❌ ${w2} — ${plain(shift(m, -1))} is less than 1</li><li>❌ ${w3} — no power of ten</li></ul><p class="muted">All four are the same number; only one is in standard form.</p>` },
    right, [w1, w2, w3]);
  };

  /* ---------- level 6: prefixes ---------- */
  const OPPOSITE = { G: 'n', n: 'G', M: 'µ', 'µ': 'M', k: 'm', m: 'k', c: 'k' };
  function otherPrefixes(s) { return [OPPOSITE[s]].concat(shuffle(PREFIX_SYMS.filter((x) => x !== s && x !== OPPOSITE[s]))); }
  const prefixFact = (s) => `<p><b>${PREFIX[s].name}</b> (symbol <b>${s}</b>) means × ${pow(PREFIX[s].p)} = × ${plain(p10(PREFIX[s].p))}.</p>`;
  G.pfpow = () => {
    const s = pick(PREFIX_SYMS), P = PREFIX[s];
    const others = otherPrefixes(s);
    if (R.rand() < 0.5) {
      return mc({ prompt: `What does the prefix <b>${P.name}</b> (${s}) mean?`, explain: prefixFact(s), meta: { s, kind: 'pow' } },
        `× ${pow(P.p)}`, others.map((x) => `× ${pow(PREFIX[x].p)}`));
    }
    return mc({ prompt: `Which prefix means × ${pow(P.p)}?`, explain: prefixFact(s), meta: { s, kind: 'name' } },
      `${P.name} (${s})`, others.map((x) => `${PREFIX[x].name} (${x})`));
  };
  G.pfsym = () => {
    if (R.rand() < 0.5) {
      const s = pick(PREFIX_SYMS);
      const wrong = otherPrefixes(s); if (s === 'm') wrong.unshift('M'); if (s === 'M') wrong.unshift('m');
      return mc({ prompt: `What is the symbol for <b>${PREFIX[s].name}</b>?`, explain: prefixFact(s) + (s === 'm' || s === 'M' ? '<p>Careful: small m = milli, capital M = mega.</p>' : ''), meta: { s, kind: 'sym' } },
        `<span class="sym">${s}</span>`, wrong.map((x) => `<span class="sym">${x}</span>`));
    }
    const u = pick([U('m', 'm'), U('µ', 'm'), U('n', 'm'), U('k', 'm'), U('c', 'm'), U('m', 'g'), U('k', 'g'), U('m', 's'), U('µ', 's'), U('M', 'W'), U('G', 'W'), U('k', 'W')]);
    const wrong = otherPrefixes(u.prefix).map((x) => PREFIX[x].name);
    if (u.prefix === 'm') wrong.unshift('metre');
    return mc({ prompt: `In the unit <b>${u.sym}</b>, what does the <b>${u.prefix}</b> at the front stand for?`, meta: { s: u.prefix, kind: 'unitname' },
      explain: `<p>In <b>${u.sym}</b>, the ${u.prefix} is the prefix <b>${PREFIX[u.prefix].name}</b> (× ${pow(u.p)}) and <b>${u.base}</b> is the unit (${QUANT[u.base].word}s). So ${u.sym} means ${u.name}.</p>` },
    PREFIX[u.prefix].name, wrong);
  };
  G.unit2base = () => {
    const u = pick([U('k', 'm'), U('c', 'm'), U('m', 'm'), U('µ', 'm'), U('n', 'm'), U('k', 'm'), U('m', 'm'), U('µ', 'm'), U('k', 'g'), U('m', 'g'), U('M', 'W'), U('G', 'W'), U('m', 's'), U('µ', 's')]);
    return text({ prompt: `1 ${u.sym} = how many ${u.base}?`, sub: `1 ${u.name.slice(0, -1)} in ${QUANT[u.base].word}s. A number or a power of ten is fine.`,
      answer: p10(u.p), unit: u.base, meta: { v: '1', from: u.sym, to: u.base },
      explain: `<p><b>${PREFIX[u.prefix].name}</b> means × ${pow(u.p)}, so 1 ${u.sym} = ${pow(u.p)} ${u.base} = <b>${plain(p10(u.p))} ${u.base}</b>.</p>` });
  };

  /* ---------- levels 7–9: conversions ---------- */
  function convExplain(v, from, to, a, sf) {
    const d = from.p - to.p;
    return `<p>${unitPow(from)}.<br>${unitPow(to)}.</p>` + numberLine(from.p, to.p) +
      `<p>The gap between the powers is <b>${Math.abs(d)}</b>, so the decimal point hops ${Math.abs(d)} place${s_(d)}.</p>` +
      (d > 0 ? `<p>${to.sym} is the <b>smaller</b> unit, so you need <b>more</b> of them: the number gets bigger. Hop <b>right</b>.</p>`
        : `<p>${to.sym} is the <b>bigger</b> unit, so you need <b>fewer</b> of them: the number gets smaller. Hop <b>left</b>.</p>`) +
      hops(v, d) + `<p class="big">${plain(v)} ${from.sym} = <b>${sf ? sfHTML(a) : anyHTML(a)} ${to.sym}</b></p>`;
  }
  function convQ(from, to, v, sf, prompt) {
    const a = shift(v, from.p - to.p);
    return text({ prompt: prompt || `Convert <b>${plain(v)} ${from.sym}</b> to ${to.sym}.` + (sf ? ' Give your answer in <b>standard form</b>.' : ''),
      sub: `${from.name} → ${to.name}`, answer: a, unit: to.sym, form: sf ? 'sf' : 'any',
      meta: { v: plain(v, { group: false }), from: from.sym, to: to.sym, shift: from.p - to.p }, explain: convExplain(v, from, to, a, sf) });
  }
  const convValue = (maxDp) => until(() => dec(niceSig(), ri(-4, 3)), (v) => decimals(v) <= maxDp && intDigits(v) <= 5);
  G.howmany = () => {
    const [from, to] = pick(unitPairs(pickBase(), (d) => d > 0 && d <= 9));
    const d = from.p - to.p;
    return text({ prompt: `How many <b>${to.sym}</b> are there in 1 <b>${from.sym}</b>?`, sub: `${to.name} in one ${from.name.slice(0, -1)}`,
      answer: p10(d), meta: { v: '1', from: from.sym, to: to.sym, shift: d },
      explain: `<p>${unitPow(from)}.<br>${unitPow(to)}.</p>${numberLine(to.p, from.p)}<p>From ${minus(to.p)} up to ${minus(from.p)} is <b>${d} step${s_(d)}</b> of × 10, so 1 ${from.sym} = ${pow(d)} = <b>${plain(p10(d))} ${to.sym}</b>.</p>` });
  };
  G.conv1 = () => {
    const [from, to] = pick(unitPairs(pickBase(), (d) => Math.abs(d) <= 3));
    const v = until(() => convValue(3), (v) => { const a = shift(v, from.p - to.p); return decimals(a) <= 6 && intDigits(a) <= 7; });
    return convQ(from, to, v, false);
  };
  G.conv2 = () => {
    const [from, to] = pick(unitPairs(pickBase(), (d) => Math.abs(d) >= 4 && Math.abs(d) <= 9));
    const v = until(() => convValue(3), (v) => { const a = shift(v, from.p - to.p); return decimals(a) <= 10 && intDigits(a) <= 10; });
    return convQ(from, to, v, false);
  };
  G.convsf = () => {
    const [from, to] = pick(unitPairs(pickBase(), (d) => Math.abs(d) >= 3 && Math.abs(d) <= 9));
    const v = until(() => convValue(3), (v) => { const a = shift(v, from.p - to.p); return Math.abs(sci(a).exp) >= 2 && decimals(a) <= 12 && intDigits(a) <= 12; });
    return convQ(from, to, v, true);
  };
  // Typical sizes, rounded, as quoted in GCSE textbooks.
  const BIO = [
    ['A red blood cell is about', ['6', '7', '7.5', '8'], 'µm', 'across', ['mm', 'nm', 'm']],
    ['A bacterium is', ['0.5', '1', '2', '2.5', '3', '5'], 'µm', 'long', ['nm', 'mm', 'm']],
    ['A virus is', ['20', '30', '50', '80', '100', '120', '150', '200', '300'], 'nm', 'across', ['µm', 'mm', 'm']],
    ['A cheek cell is about', ['20', '25', '30', '40', '50', '60'], 'µm', 'across', ['mm', 'nm', 'm']],
    ['A plant cell is', ['0.05', '0.08', '0.1', '0.12', '0.15'], 'mm', 'long', ['µm', 'nm', 'm']],
    ['A nucleus is about', ['5', '6', '8', '10'], 'µm', 'across', ['mm', 'nm', 'm']],
    ['A mitochondrion is', ['0.75', '1', '1.5', '2', '3'], 'µm', 'long', ['nm', 'mm', 'm']],
    ['A ribosome is about', ['20', '25', '30'], 'nm', 'across', ['µm', 'mm', 'm']],
    ['A chloroplast is', ['4', '5', '6', '8'], 'µm', 'long', ['mm', 'nm', 'm']],
    ['A human egg cell is about', ['0.1', '0.12', '0.13'], 'mm', 'across', ['µm', 'nm', 'm']],
    ['A cell membrane is about', ['7', '8', '10'], 'nm', 'thick', ['µm', 'mm', 'm']],
    ['A sperm cell is about', ['50', '55', '60'], 'µm', 'long', ['mm', 'nm', 'm']],
    ['A pollen grain is', ['20', '25', '40', '50'], 'µm', 'across', ['mm', 'nm', 'm']],
    ['A root hair is', ['0.5', '0.8', '1', '1.5'], 'mm', 'long', ['µm', 'm', 'nm']],
  ];
  const unitOf = (sym) => U(sym.slice(0, -1), 'm');
  G.bio = () => {
    const [lead, vals, u, dim, targets] = pick(BIO);
    const r = R.rand();
    const toSym = r < 0.5 ? targets[0] : r < 0.75 ? targets[1] : targets[2];
    const from = unitOf(u), to = unitOf(toSym), v = fromString(pick(vals));
    const sf = toSym === 'm';
    return convQ(from, to, v, sf, `${lead} <b>${plain(v)} ${u}</b> ${dim}. What is this in ${sf ? '<b>metres</b>? Give your answer in standard form.' : `<b>${toSym}</b>?`}`);
  };
  G.compare = () => {
    const base = R.rand() < 0.75 ? 'm' : pickBase();
    const [from, to] = pick(unitPairs(base, (d) => [1, 2, 3, 6].includes(Math.abs(d))));
    const d = from.p - to.p;
    const { x, y, f } = until(() => {
      const x = dec(niceSig(), ri(-2, 1));
      const f = pick(['1', '1', '2', '0.5', '10', '0.1', '1.2', '0.8', '3']);
      return { x, f, y: mul(shift(x, d), fromString(f)) };
    }, ({ x, y }) => decimals(x) <= 3 && intDigits(x) <= 4 && decimals(y) <= 4 && intDigits(y) <= 6);
    const exact = shift(x, d);
    const c = cmp(y, exact); // y vs x, both in `to` units
    const A = `${plain(x)} ${from.sym}`, B = `${plain(y)} ${to.sym}`;
    const same = 'They are the same';
    const first = R.rand() < 0.5;
    const options = first ? [A, B, same] : [B, A, same];
    const right = c === 0 ? same : c > 0 ? B : A;
    return { input: 'mc', options, answerIndex: options.indexOf(right), prompt: 'Which is bigger?', meta: { x: plain(x, { group: false }), from: from.sym, y: plain(y, { group: false }), to: to.sym },
      explain: `<p>Put them in the <b>same unit</b> first. ${unitPow(from)} and ${unitPow(to)}, so hop the point ${places(d)}:</p>${hops(x, d)}<p>${A} = <b>${plain(exact)} ${to.sym}</b>.</p><p>Now compare ${plain(exact)} ${to.sym} with ${plain(y)} ${to.sym}: ${c === 0 ? '<b>they are the same</b>.' : `<b>${right}</b> is bigger.`}</p>` };
  };

  /* ---------- levels ---------- */
  const LEVELS = [
    { n: 1, title: 'What is a power?', emoji: '🔢', types: ['pw_parts', 'pw_expand', 'pw_write', 'pw_eval', 'pw_mc'] },
    { n: 2, title: 'Powers of ten', emoji: '🔟', types: ['p2n', 'n2p', 'pmc', 'times'] },
    { n: 3, title: 'Zero & negative powers', emoji: '➗', types: ['np2n', 'n2np', 'frac', 'times2'] },
    { n: 4, title: 'Hopping the decimal point', emoji: '🦘', types: ['mul', 'div'] },
    { n: 5, title: 'Standard form', emoji: '🧮', types: ['sf2n', 'n2sf', 'sfmc'] },
    { n: 6, title: 'Prefix names', emoji: '🏷️', types: ['pfpow', 'pfsym', 'unit2base'] },
    { n: 7, title: 'Converting units', emoji: '🔁', types: ['howmany', 'conv1'] },
    { n: 8, title: 'Big jumps', emoji: '🚀', types: ['conv2', 'convsf'] },
    { n: 9, title: 'Exam mix', emoji: '🔬', types: ['bio', 'compare'] },
  ];
  const LABELS = {
    pw_parts: 'Base and power', pw_expand: 'What a power means', pw_write: 'Write it as a power', pw_eval: 'Work out a power', pw_mc: 'Spot the right value',
    p2n: '10ⁿ → number', n2p: 'Number → 10ⁿ', pmc: 'Spot 10ⁿ', times: 'How many times bigger?',
    np2n: '10⁻ⁿ → decimal', n2np: 'Decimal → 10⁻ⁿ', frac: '1 ÷ 1000 → 10ⁿ', times2: 'Times bigger (negatives)',
    mul: '× by powers of ten', div: '÷ by powers of ten',
    sf2n: 'Standard form → number', n2sf: 'Number → standard form', sfmc: 'Spot standard form',
    pfpow: 'Prefix ↔ power', pfsym: 'Prefix symbols', unit2base: '1 mm = ? m',
    howmany: 'How many µm in a mm?', conv1: 'Small conversions',
    conv2: 'Big conversions', convsf: 'Convert to standard form',
    bio: 'Cell sizes', compare: 'Which is bigger?',
  };

  function make(id) {
    const q = G[id]();
    q.id = id;
    q.answerHTML = answerHTML(q);
    return q;
  }

  PT.gen = { R, make, LEVELS, LABELS, PREFIX, PREFIX_SYMS, QUANT, U, hops, numberLine, places, ptMark, types: Object.keys(G) };
})(typeof window !== 'undefined' ? window : globalThis);
