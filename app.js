'use strict';
const vowels = [
  {name: 'Patach', mark: '\u05b7', sound: 'ah', example: 'as in father'},
  {name: 'Kamatz', mark: '\u05b8', sound: 'ah', example: 'as in father'},
  {name: 'Chirik (Cheereek)', mark: '\u05b4', sound: 'ee', example: 'as in see'},
  {name: 'Tzairai (Tsere)', mark: '\u05b5', sound: 'ay / eh', example: 'varies by tradition'},
  {name: 'Kubutz', mark: '\u05bb', sound: 'oo', example: 'as in moon'},
  {name: 'Segol', mark: '\u05b6', sound: 'eh', example: 'as in bed'},
  {name: 'Holam Male', mark: '\u05d5\u05b9', sound: 'oh', example: 'as in go; written with a vav and a dot above it'},
  {name: 'Shuruk', mark: '\u05d5\u05bc', sound: 'oo', example: 'as in moon; written with a vav'},
  {name: 'Sheva', mark: '\u05b0', sound: 'short eh / silent', example: 'depends on the word and reading tradition'},
  {name: 'Hataf Patach', mark: '\u05b2', sound: 'short ah', example: 'a reduced vowel, as in father'},
  {name: 'Hataf Segol', mark: '\u05b1', sound: 'short eh', example: 'a reduced vowel, as in bed'},
  {name: 'Hataf Kamatz', mark: '\u05b3', sound: 'short oh', example: 'a reduced vowel, as in go'},
  {name: 'Holam Haser', mark: '\u05b9', sound: 'oh', example: 'as in go; a dot above the top left of the letter'},
];
const consonants = [
  ['Alef', 'א'], ['Bet', 'בּ'], ['Vet', 'ב'],
  ['Gimel', 'ג'],
  ['Dalet', 'ד'], ['He', 'ה'],
  ['Vav', 'ו'], ['Zayin', 'ז'], ['Chet', 'ח'], ['Tet', 'ט'],
  ['Yod', 'י'], ['Kaf', 'כּ'], ['Chaf', 'כ'], ['Lamed', 'ל'], ['Mem', 'מ'],
  ['Nun', 'נ'], ['Samekh', 'ס'], ['Ayin', 'ע'], ['Peh', 'פּ'], ['Fe', 'פ'],
  ['Tsadi', 'צ'], ['Qof', 'ק'], ['Resh', 'ר'], ['Shin', 'שׁ'], ['Sin', 'שׂ'],
  ['Taf', 'תּ'], ['Saf', 'ת'],
].map(([name, glyph]) => ({name, glyph}));
const allVowels = vowels.map((_, i) => i);
const alefGroups = [[0, 1, 2], [3, 4], allVowels.filter(i => i >= 5)];
const alefHeadings = ['Patach · Kamatz · Chirik', 'Tzairai · Kubutz', 'Remaining vowel signs'];
const key = 'hebrew-practice-v4';
let state = {count: 8, hints: false, consonant: 0, rows: []};
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && [6,8,12,18].includes(saved.count) && typeof saved.hints === 'boolean' &&
      Number.isInteger(saved.consonant) && consonants[saved.consonant] &&
      Array.isArray(saved.rows) && saved.rows.length === 3 && saved.rows.every(row =>
        Array.isArray(row) && row.length === saved.count && row.every(v => allVowels.includes(v)))) {
    state = saved;
  }
} catch { /* Storage may be unavailable; practice still works. */ }
function randomRow(group, count = state.count) {
  const shuffledGroup = [...group];
  for (let i = shuffledGroup.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledGroup[i], shuffledGroup[j]] = [shuffledGroup[j], shuffledGroup[i]];
  }
  const row = Array.from({length: count}, (_,i) => shuffledGroup[i % shuffledGroup.length]);
  for (let i = row.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [row[i],row[j]] = [row[j],row[i]];
  }
  return row;
}
function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch {
  document.querySelector('#feedback').textContent = 'Browser storage is unavailable. You can still practice here.';
} }
let soundEnabled = false;
let activeAudio = null;
function stopSound() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
}
function playSound(text) {
  if (!soundEnabled) return;
  stopSound();
  const clip = new Audio(practiceAudio[text]);
  activeAudio = clip;
  clip.play().catch(error => {
    if (activeAudio !== clip || error.name === 'AbortError') return;
    document.querySelector('#feedback').textContent += ' Audio could not play. Check your volume and try selecting the letter again.';
  });
}
function render() {
  document.querySelectorAll('.line-heading h3').forEach((heading, i) => {
    heading.replaceChildren(heading.querySelector('span'), document.createTextNode(
      ' ' + (state.consonant === 0 ? alefHeadings[i] : 'All vowel signs')));
  });
  state.rows.forEach((row,i) => {
    const container = document.querySelector(`#row-${i}`);
    container.replaceChildren();
    row.forEach(index => {
      const v = vowels[index];
      const button = document.createElement('button');
      button.className = 'letter';
      button.setAttribute('aria-label', `${consonants[state.consonant].name} with ${v.name}. Select to reveal the sound.`);
      const glyph = document.createElement('span');
      glyph.className = 'glyph'; glyph.textContent = consonants[state.consonant].glyph + v.mark;
      button.append(glyph);
      if (state.hints) {
        const hint = document.createElement('span'); hint.className = 'hint';
        hint.dir = 'ltr'; hint.lang = 'en'; hint.textContent = v.name; button.append(hint);
      }
      button.addEventListener('click', () => {
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        button.classList.add('selected');
        document.querySelector('#feedback').textContent = `${v.name}: “${v.sound}” — ${v.example}.`;
        playSound(glyph.textContent);
      });
      container.append(button);
    });
  });
  save();
}
function freshRows() {
  if (state.consonant === 0) return alefGroups.map(group => randomRow(group));
  // Deal a balanced shuffled pool across all three lines so every vowel appears.
  const dealt = randomRow(allVowels, state.count * 3);
  return [0, 1, 2].map(i => dealt.slice(i * state.count, (i + 1) * state.count));
}
function shuffle(line) {
  if (line === undefined) state.rows = freshRows();
  else state.rows[line] = randomRow(state.consonant === 0 ? alefGroups[line] : allVowels);
  document.querySelector('#feedback').textContent = 'Fresh practice ready. Start at the right of each line.';
  render();
}
const picker = document.querySelector('#consonant');
consonants.forEach((letter, i) => {
  const option = document.createElement('option');
  option.value = i;
  option.textContent = letter.glyph;
  option.setAttribute('aria-label', letter.name);
  picker.append(option);
});
picker.value = state.consonant;
picker.addEventListener('change', e => {
  state.consonant = Number(e.target.value);
  state.count = 8;
  document.querySelector('#count').value = 8;
  shuffle();
});
document.querySelector('#count').value = state.count;
document.querySelector('#hints').checked = state.hints;
const soundCheckbox = document.querySelector('#sound');
soundCheckbox.checked = false;
soundCheckbox.addEventListener('change', e => {
  soundEnabled = e.target.checked;
  if (!soundEnabled) stopSound();
  else document.querySelector('#feedback').textContent = 'Sound is on. Select a practice letter to hear it.';
});
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
if (!state.rows.length || (state.consonant === 0 && state.rows.some((row, i) =>
  row.some(v => !alefGroups[i].includes(v))))) state.rows = freshRows();
render();
