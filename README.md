# Power Up — powers of ten

A revision site for GCSE: what a power is, powers of ten, standard form, the unit prefixes
(giga, mega, kilo, centi, milli, micro, nano) and converting between units.

Live: https://joss-zergles.github.io/powers-of-ten/

- Plain HTML/CSS/JS, no build step. Open `index.html` via any static server, e.g. `python3 -m http.server`.
- 9 levels, each with a short step-through lesson and endless randomly generated practice.
  A level unlocks when every skill in the one before reaches mastery (about five right in a row).
  Skills he gets wrong come back two questions later with new numbers.
- Progress lives in the browser (`localStorage`, key `powersOfTen.v1`). Reset is in ⚙️ settings.

## Files

- `js/num.js` — exact decimal arithmetic (BigInt, no floating-point errors), formatting, answer parsing and checking.
- `js/gen.js` — the question generators and the level list.
- `js/lessons.js` — lesson slides and interactive widgets.
- `js/app.js` — screens, practice loop, mastery and storage.
- `tools/check.js` — automated check: `node tools/check.js`. It generates 2,500 questions of every type, re-derives
  each answer independently, and checks that the answer checker accepts correct answers in several formats
  (3500, 3,500, 3.5×10^3, 3.5e3, 3.5 x 10³, with or without the unit) and rejects wrong ones.

When you change a CSS/JS file, bump its `?v=N` in `index.html` so browsers pick up the new version.
