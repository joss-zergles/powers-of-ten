#!/usr/bin/env node
/* Automated check of the question generator and answer checker.
   Run: node tools/check.js   (exits non-zero on any failure)
   Every generated answer is re-derived here independently with plain JS numbers and an own prefix table,
   then fed back through the answer checker in several typed formats. */
'use strict';
require('../js/num.js');
require('../js/gen.js');
const { num, gen } = globalThis.PT;

let fails = 0, checks = 0; const kinds = {};
function ok(cond, msg) { checks++; if (!cond) { fails++; const k = msg.replace(/"[^"]*"/g, "…").replace(/[0-9.]+/g, "#"); kinds[k] = (kinds[k] || 0) + 1; if (kinds[k] <= 2) console.error("FAIL:", msg); } }
const strip = (h) => String(h).replace(/<[^>]+>/g, '').replace(/−/g, '-').replace(/\s+/g, ' ').trim();
const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b), 1e-300);
const toNum = (d) => Number(num.plain(d, { group: false }).replace('−', '-'));

// Independent prefix table (not imported from gen.js)
const P = { G: 9, M: 6, k: 3, c: -2, m: -3, 'µ': -6, n: -9 };
const NAMES = { G: 'giga', M: 'mega', k: 'kilo', c: 'centi', m: 'milli', 'µ': 'micro', n: 'nano' };
function unitPow(sym) { const base = ['m', 'g', 's', 'W'].find((b) => sym.endsWith(b) && P[sym.slice(0, -b.length)] !== undefined || sym === b); return sym === base ? 0 : P[sym.slice(0, -base.length)]; }

/* ---------- parser unit tests ---------- */
const parseCases = [
  ['3500', 3500, 'plain'], ['3,500', 3500, 'plain'], ['2,500,000', 2.5e6, 'plain'], ['3.5×10^3', 3500, 'sci'], ['3.5x10^3', 3500, 'sci'],
  ['3.5 X 10 ^ 3', 3500, 'sci'], ['3.5*10^3', 3500, 'sci'], ['3.5e3', 3500, 'sci'], ['3.5E-3', 0.0035, 'sci'], ['3.5 × 10³', 3500, 'sci'],
  ['10^-3', 0.001, 'power'], ['10⁻³', 0.001, 'power'], ['10^(-3)', 0.001, 'power'], ['10−3', null], ['1×10^-3', 0.001, 'sci'], ['−0.5', -0.5, 'plain'],
  ['.5', 0.5, 'plain'], ['5.', 5, 'plain'], ['3,5', null], ['0,001', null], ['', null], ['abc', null], ['6.5 × 10⁻⁴', 0.00065, 'sci'],
  ['2.5×10^−6', 2.5e-6, 'sci'], ['0.0000025', 2.5e-6, 'plain'], ['10**3', 1000, 'power'], ['2^3', null],
];
for (const [s, v, form] of parseCases) {
  const p = num.parseAnswer(s);
  if (v === null) ok(!p.ok, `parse "${s}" should be rejected, got ${p.ok && num.plain(p.value)}`);
  else ok(p.ok && close(toNum(p.value), v) && p.form === form, `parse "${s}" → ${v} (${form}); got ${p.ok ? num.plain(p.value) + ' ' + p.form : p.msg}`);
}
const unitCases = [['3500 µm', 'µm'], ['3500um', 'µm'], ['3500 μm', 'µm'], ['2.5e-6 m', 'm'], ['40mm', 'mm'], ['7 kg', 'kg']];
for (const [s, u] of unitCases) { const p = num.parseAnswer(s); ok(p.ok && p.unit === u, `unit in "${s}" → ${u}; got ${p.ok ? p.unit : p.msg}`); }
ok(!num.parseAnswer('5 parsecs').ok, 'unknown unit rejected');
// exactness: no floating error
ok(num.eq(num.parseAnswer('0.1e1').value, num.dec(1)), '0.1e1 == 1 exactly');
ok(num.eq(num.shift(num.fromString('0.07'), 3), num.dec(70)), '0.07 × 10^3 = 70 exactly');

/* ---------- independent expected values per question type ---------- */
function expected(q) {
  const m = q.meta;
  switch (q.id) {
    case 'pw_eval': return m.b ** m.n;
    case 'p2n': case 'n2p': case 'np2n': case 'n2np': case 'frac': return Math.pow(10, m.n);
    case 'times': case 'times2': return Math.pow(10, m.a - m.b);
    case 'mul': case 'div': return Number(m.v) * Math.pow(10, m.k);
    case 'sf2n': case 'n2sf': return Number(m.m) * Math.pow(10, m.n);
    case 'unit2base': case 'howmany': case 'conv1': case 'conv2': case 'convsf': case 'bio':
      return Number(m.v) * Math.pow(10, unitPow(m.from) - unitPow(m.to));
  }
  return undefined;
}
function expectedOption(q) {
  const m = q.meta;
  switch (q.id) {
    case 'pw_parts': return String(m.askPower ? m.n : m.b);
    case 'pw_expand': return Array(m.n).fill(m.b).join(' × ');
    case 'pw_write': return `${m.b}${m.n}`;               // tags stripped: base then power
    case 'pw_mc': return String(m.b ** m.n);
    case 'pmc': return String(Math.pow(10, m.n));
    case 'pfpow': return m.kind === 'pow' ? `× 10${String(P[m.s]).replace('-', '-')}` : `${NAMES[m.s]} (${m.s})`;
    case 'pfsym': return m.kind === 'sym' ? m.s : NAMES[m.s];
    case 'sfmc': return `${m.m} × 10${m.n}`;
    case 'compare': {
      const a = Number(m.x) * Math.pow(10, unitPow(m.from)), b = Number(m.y) * Math.pow(10, unitPow(m.to));
      return close(a, b) ? 'They are the same' : a > b ? `${m.x} ${m.from}` : `${m.y} ${m.to}`;
    }
  }
  return undefined;
}
const noComma = (s) => s.replace(/,/g, '');

/* ---------- the main sweep ---------- */
const N = 2500;
const allTypes = gen.LEVELS.flatMap((l) => l.types);
ok(allTypes.length === gen.types.length && allTypes.every((t) => gen.types.includes(t)), 'every generator is in exactly one level');
for (const id of allTypes) {
  ok(gen.LABELS[id], `label for ${id}`);
  const seen = new Set();
  for (let i = 0; i < N; i++) {
    let q;
    try { q = gen.make(id); } catch (e) { ok(false, `${id} threw: ${e.message}`); continue; }
    const tag = `${id} "${strip(q.prompt)}"`;
    seen.add(strip(q.prompt));
    const all = q.prompt + (q.sub || '') + q.explain + q.answerHTML + (q.options || []).join('');
    ok(!/NaN|undefined|null|Infinity|\[object/.test(all), `${tag}: bad text`);
    if (q.input === 'mc') {
      ok(q.options.length >= 3 && new Set(q.options.map(strip)).size === q.options.length, `${tag}: options not unique/enough: ${q.options.map(strip)}`);
      const want = expectedOption(q);
      ok(want !== undefined, `${tag}: no oracle`);
      const got = noComma(strip(q.options[q.answerIndex])).replace(/\s/g, '');
      ok(got === noComma(want).replace(/\s/g, ''), `${tag}: correct option "${got}" expected "${want}"`);
      const others = q.options.filter((_, j) => j !== q.answerIndex).map((o) => noComma(strip(o)).replace(/\s/g, ''));
      ok(!others.includes(noComma(want).replace(/\s/g, '')), `${tag}: oracle answer also among wrong options`);
      ok(num.check(q, q.answerIndex).status === 'correct', `${tag}: checker rejects correct option`);
      ok(num.check(q, (q.answerIndex + 1) % q.options.length).status === 'wrong', `${tag}: checker accepts wrong option`);
      continue;
    }
    const want = expected(q);
    ok(want !== undefined, `${tag}: no oracle`);
    ok(close(toNum(q.answer), want), `${tag}: answer ${num.plain(q.answer)} expected ${want}`);
    ok(strip(q.explain).includes(noComma(strip(q.answerHTML.replace(/<span class="muted">.*<\/span>/, ''))).replace(/ (µ?[a-zA-Z]{1,2})$/, '').trim()) ||
       strip(q.explain).includes(strip(num.plain(q.answer))) || strip(q.explain).includes(strip(num.sfHTML(q.answer))) || strip(q.explain).includes(strip(num.pow(num.sci(q.answer).exp))),
      `${tag}: worked method doesn't show the answer`);
    // Feed correct answers back in several formats
    const a = q.answer, s = num.sci(a);
    const plainTxt = num.plain(a).replace('−', '-'), plainRaw = num.plain(a, { group: false }).replace('−', '-');
    const mant = num.plain(s.mant), e = s.exp;
    const sup = String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
    const formats = { plain: [plainTxt, plainRaw], sci: [`${mant}×10^${e}`, `${mant}e${e}`, `${mant} x 10${sup}`, `${mant} × 10^(${e})`] };
    if (q.form === 'plain') {
      formats.plain.forEach((t) => ok(num.check(q, t).status === 'correct', `${tag}: rejected correct "${t}"`));
      if (e !== 0 || mant !== '1') ok(num.check(q, formats.sci[0]).status === 'wrong', `${tag}: accepted non-ordinary "${formats.sci[0]}"`);
    } else if (q.form === 'power') {
      [`10^${e}`, `10${sup}`, `1×10^${e}`].forEach((t) => ok(num.check(q, t).status === 'correct', `${tag}: rejected correct "${t}"`));
      ok(num.check(q, plainRaw).status === 'wrong', `${tag}: accepted plain "${plainRaw}" for power-of-ten question`);
    } else if (q.form === 'sf') {
      formats.sci.forEach((t) => ok(num.check(q, t).status === 'correct', `${tag}: rejected correct "${t}"`));
      ok(num.check(q, plainRaw).status === 'wrong', `${tag}: accepted plain "${plainRaw}" for standard-form question`);
      const bad = `${num.plain(num.shift(s.mant, 1))}×10^${e - 1}`;
      ok(num.check(q, bad).status === 'wrong', `${tag}: accepted non-standard "${bad}"`);
    } else {
      formats.plain.concat(formats.sci).forEach((t) => ok(num.check(q, t).status === 'correct', `${tag}: rejected correct "${t}"`));
    }
    if (q.unit) {
      const withUnit = `${q.form === 'sf' ? formats.sci[0] : plainRaw} ${q.unit}`;
      ok(num.check(q, withUnit).status === 'correct', `${tag}: rejected with unit "${withUnit}"`);
      const wrongUnit = q.unit === 'm' ? 'mm' : 'm';
      ok(num.check(q, `${plainRaw} ${wrongUnit}`).status !== 'correct', `${tag}: accepted wrong unit`);
    }
    // Wrong answers: point in the wrong place
    ok(num.check(q, num.plain(num.shift(a, 1), { group: false }).replace('−', '-')).status === 'wrong', `${tag}: accepted answer ×10`);
    ok(num.check(q, num.plain(num.shift(a, -1), { group: false }).replace('−', '-')).status === 'wrong', `${tag}: accepted answer ÷10`);
    // Answers must be sensible to type
    ok(num.decimals(a) <= 12 && num.intDigits(a) <= 12, `${tag}: unwieldy answer ${plainRaw}`);
  }
  console.log(`${id.padEnd(10)} ${N} questions, ${seen.size} different prompts`);
}

console.log(`\n${checks} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
