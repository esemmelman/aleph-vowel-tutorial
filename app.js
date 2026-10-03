'use strict';
const vowels = [
  {name: 'Patach', mark: '\u05b7', sound: 'ah', example: 'as in father'},
  {name: 'Kamatz', mark: '\u05b8', sound: 'ah', example: 'as in father'},
  {name: 'Chirik (Cheereek)', mark: '\u05b4', sound: 'ee', example: 'as in see'},
  {name: 'Tzairai (Tsere)', mark: '\u05b5', sound: 'ay / eh', example: 'varies by tradition'},
  {name: 'Kubutz', mark: '\u05bb', sound: 'oo', example: 'as in moon'},
];
const groups = [[0, 1, 2], [3, 4], [0, 1, 2, 3, 4]];
const key = 'aleph-practice-v1';
let state = {count: 12, hints: false, rows: []};
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && [6,12,18].includes(saved.count) && typeof saved.hints === 'boolean' &&
      Array.isArray(saved.rows) && [2, groups.length].includes(saved.rows.length) && saved.rows.every((row,i) =>
        Array.isArray(row) && row.length === saved.count && row.every(v => groups[i].includes(v)))) state = saved;
} catch { /* Storage may be unavailable; practice still works. */ }
function randomRow(group) {
  const row = Array.from({length: state.count}, (_,i) => group[i % group.length]);
  for (let i = row.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [row[i],row[j]] = [row[j],row[i]];
  }
  return row;
}
function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch {
  document.querySelector('#feedback').textContent = 'Browser storage is unavailable. You can still practice here.';
} }
function render() {
  state.rows.forEach((row,i) => {
    const container = document.querySelector(`#row-${i}`);
    container.replaceChildren();
    row.forEach(index => {
      const v = vowels[index];
      const button = document.createElement('button');
      button.className = 'letter';
      button.setAttribute('aria-label', `Aleph with ${v.name}. Select to reveal the sound.`);
      const glyph = document.createElement('span');
      glyph.className = 'glyph'; glyph.textContent = '\u05d0' + v.mark;
      button.append(glyph);
      if (state.hints) {
        const hint = document.createElement('span'); hint.className = 'hint';
        hint.dir = 'ltr'; hint.lang = 'en'; hint.textContent = v.name; button.append(hint);
      }
      button.addEventListener('click', () => {
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        button.classList.add('selected');
        document.querySelector('#feedback').textContent = `${v.name}: “${v.sound}” — ${v.example}.`;
      });
      container.append(button);
    });
  });
  save();
}
function shuffle(line) {
  if (line === undefined) state.rows = groups.map(randomRow);
  else state.rows[line] = randomRow(groups[line]);
  document.querySelector('#feedback').textContent = 'Fresh practice ready. Start at the right of each line.';
  render();
}
document.querySelector('#count').value = state.count;
document.querySelector('#hints').checked = state.hints;
document.querySelector('#count').addEventListener('change', e => {state.count = Number(e.target.value); shuffle();});
document.querySelector('#hints').addEventListener('change', e => {state.hints = e.target.checked; render();});
document.querySelector('#shuffle').addEventListener('click', () => shuffle());
document.querySelectorAll('[data-shuffle]').forEach(el => el.addEventListener('click', () => shuffle(Number(el.dataset.shuffle))));
vowels.forEach(v => {
  const card = document.createElement('div'); card.className = 'vowel';
  const glyph = document.createElement('span'); glyph.className = 'glyph'; glyph.lang = 'he'; glyph.textContent = '\u05d0' + v.mark;
  const name = document.createElement('strong'); name.textContent = v.name;
  const sound = document.createElement('p'); sound.textContent = `“${v.sound}” · ${v.example}`;
  card.append(glyph,name,sound); document.querySelector('#vowel-guide').append(card);
});
if (!state.rows.length) state.rows = groups.map(randomRow);
while (state.rows.length < groups.length) state.rows.push(randomRow(groups[state.rows.length]));
render();
