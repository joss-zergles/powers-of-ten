/* Exact decimal arithmetic, formatting and answer checking.
   Runs in the browser and in Node (tools/check.js), so no DOM access here. */
(function (root) {
  'use strict';
  const PT = root.PT = root.PT || {};

  // A Dec is an exact decimal: (neg ? -1 : 1) × m × 10^e, m a BigInt ≥ 0 with no trailing zeros.
  function dec(m, e, neg) {
    m = BigInt(m); e = Number(e || 0); neg = !!neg;
    if (m < 0n) { m = -m; neg = !neg; }
    if (m === 0n) return { m: 0n, e: 0, neg: false };
    while (m % 10n === 0n) { m /= 10n; e++; }
    return { m, e, neg };
  }
  const ONE = dec(1), TEN = dec(10);

  function fromString(s) {
    const r = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(String(s));
    if (!r || (r[2] === '' && !r[3])) return null;
    const frac = r[3] || '';
    return dec(BigInt((r[2] || '0') + frac), -frac.length, r[1] === '-');
  }
  const shift = (d, k) => dec(d.m, d.e + k, d.neg);
  const mul = (a, b) => dec(a.m * b.m, a.e + b.e, a.neg !== b.neg);
  const eq = (a, b) => a.m === b.m && a.e === b.e && a.neg === b.neg;
  function cmp(a, b) {
    const e = Math.min(a.e, b.e);
    const av = (a.neg ? -1n : 1n) * a.m * 10n ** BigInt(a.e - e);
    const bv = (b.neg ? -1n : 1n) * b.m * 10n ** BigInt(b.e - e);
    return av < bv ? -1 : av > bv ? 1 : 0;
  }
  function parts(d) {
    const digits = d.m.toString();
    if (d.e >= 0) return { int: digits + '0'.repeat(d.e), frac: '' };
    const k = -d.e;
    if (digits.length > k) return { int: digits.slice(0, -k), frac: digits.slice(-k) };
    return { int: '0', frac: '0'.repeat(k - digits.length) + digits };
  }
  const decimals = (d) => Math.max(0, -d.e);
  const intDigits = (d) => { const p = parts(d).int; return p === '0' ? 0 : p.length; };
  const sigFigs = (d) => d.m.toString().length;

  // Plain decimal text. Integer parts of 5+ digits get comma separators (12,500) unless group:false.
  function plain(d, opt) {
    const p = parts(d);
    const int = (opt && opt.group === false) || p.int.length < 5 ? p.int : p.int.replace(/\B(?=(\d{3})+$)/g, ',');
    return (d.neg ? '−' : '') + int + (p.frac ? '.' + p.frac : '');
  }
  // d = mant × 10^exp with 1 ≤ mant < 10
  function sci(d) {
    const len = d.m.toString().length;
    return { mant: dec(d.m, -(len - 1), d.neg), exp: d.e + len - 1 };
  }
  const minus = (n) => (n < 0 ? '−' + (-n) : String(n));
  const pow = (n, base) => `${base == null ? 10 : base}<sup>${minus(n)}</sup>`;
  const sfHTML = (d) => { const s = sci(d); return `${plain(s.mant)} × ${pow(s.exp)}`; };

  /* ---------- reading what he typed ---------- */
  const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
  const UNITS = new Set(['km', 'm', 'cm', 'mm', 'µm', 'nm', 'kg', 'g', 'mg', 'µg', 's', 'ms', 'µs', 'ns', 'GW', 'MW', 'kW', 'W']);
  const NUM = '([+-]?(?:\\d+\\.?\\d*|\\.\\d+))';
  const RE_PLAIN = new RegExp('^' + NUM + '$');
  const RE_POW = new RegExp('^(?:' + NUM + 'x)?10\\^\\(?([+-]?\\d{1,3})\\)?$');
  const RE_E = new RegExp('^' + NUM + 'e([+-]?\\d{1,3})$', 'i');
  const HELP = 'I couldn’t read that. Try something like 3500, 0.025, 3.5×10^3 or 3.5e3.';

  // → { ok, value, form: 'plain'|'power'|'sci', mant, unit } or { ok:false, msg }
  function parseAnswer(raw) {
    let s = String(raw == null ? '' : raw).trim();
    if (!s) return { ok: false, msg: 'Type an answer first.' };
    s = s.replace(/[−‐-—]/g, '-')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => '^' + [...m].map((c) => SUP[c]).join(''))
      .replace(/\*\*/g, '^')
      .replace(/[×✕✖*·⋅X]/g, 'x');
    let unit = null;
    const um = /^(.*?[\d.)])\s*([a-zA-Zµμ]{1,3})$/.exec(s);
    if (um && !/^x/i.test(um[2])) {
      unit = um[2].replace('μ', 'µ');
      if (unit.length > 1 && unit[0] === 'u') unit = 'µ' + unit.slice(1);
      if (!UNITS.has(unit)) return { ok: false, msg: `I don’t recognise the unit “${um[2]}”. You can leave the unit off.` };
      s = um[1];
    }
    s = s.replace(/\s+/g, '');
    if (s.includes(',')) {
      if (/^[+-]?[1-9]\d{0,2}(,\d{3})+(?![\d,])/.test(s)) s = s.replace(/,/g, '');
      else return { ok: false, msg: 'Use a full stop for the decimal point (like 3.5), not a comma.' };
    }
    let r;
    if ((r = RE_PLAIN.exec(s))) return { ok: true, value: fromString(r[1]), form: 'plain', unit };
    if ((r = RE_POW.exec(s))) {
      const mant = r[1] ? fromString(r[1]) : ONE;
      return { ok: true, value: shift(mant, parseInt(r[2], 10)), form: r[1] ? 'sci' : 'power', mant, unit };
    }
    if ((r = RE_E.exec(s))) {
      const mant = fromString(r[1]);
      return { ok: true, value: shift(mant, parseInt(r[2], 10)), form: 'sci', mant, unit };
    }
    if (/^\d+\^\d+$/.test(s)) return { ok: false, msg: 'Work it out and type the number itself.' };
    return { ok: false, msg: HELP };
  }

  // status: 'correct' | 'wrong' | 'unreadable' (unreadable doesn't count — he can fix it and retry)
  function check(q, raw) {
    if (q.input === 'mc') return { status: raw === q.answerIndex ? 'correct' : 'wrong' };
    const p = parseAnswer(raw);
    if (!p.ok) return { status: 'unreadable', msg: p.msg };
    if (p.unit) {
      if (!q.unit) return { status: 'unreadable', msg: 'No unit needed for this one — just the number.' };
      if (p.unit !== q.unit) return { status: 'wrong', parsed: p, msg: `The answer should be in <b>${q.unit}</b>, but you wrote ${p.unit}.` };
    }
    if (!eq(p.value, q.answer)) return { status: 'wrong', parsed: p };
    if (q.form === 'plain' && p.form !== 'plain')
      return { status: 'wrong', parsed: p, msg: 'Right value, but this one wants an <b>ordinary number</b> — just digits, no “× 10”.' };
    if (q.form === 'power' && !(p.form === 'power' || (p.form === 'sci' && eq(p.mant, ONE))))
      return { status: 'wrong', parsed: p, msg: 'Right value, but write it as a <b>power of ten</b>, like 10^3 or 10^-3.' };
    if (q.form === 'sf') {
      if (p.form === 'plain') return { status: 'wrong', parsed: p, msg: 'Right value, but it needs to be in <b>standard form</b>: a × 10ⁿ.' };
      if (p.mant.neg || cmp(p.mant, ONE) < 0 || cmp(p.mant, TEN) >= 0)
        return { status: 'wrong', parsed: p, msg: 'Right value, but in standard form the first number must be <b>at least 1 and less than 10</b>.' };
    }
    return { status: 'correct', parsed: p };
  }

  PT.num = { dec, ONE, TEN, fromString, shift, mul, eq, cmp, parts, decimals, intDigits, sigFigs, plain, sci, minus, pow, sfHTML, parseAnswer, check, UNITS };
})(typeof window !== 'undefined' ? window : globalThis);
