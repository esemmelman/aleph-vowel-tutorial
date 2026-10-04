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
  {name: 'Sheva', mark: '\u05b0', sound: 'uh', example: 'a short sound, as in about'},
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
const specialEntries = [
  {name: 'Alef Patach Yod', glyph: 'אַי', items: [{glyph: 'אַי', id: 'alef-patach-yod', label: 'Alef + Patach + Yod'}]},
  ...[['Final Chaf','ךְ'],['Final Mem','ם'],['Final Nun','ן'],['Final Fe','ף'],['Final Tsadi','ץ']].map(([name, glyph], i) => ({
    name, glyph, items: [['בַ','Bet + Patach'],['מִ','Mem + Chirik'],['לֶ','Lamed + Segol'],['שׁוֹ','Shin + Holam']].map(([start, label], j) => ({
      glyph: start + glyph, id: `final-${['chaf','mem','nun','fe','tsadi'][i]}-${['bah','mee','leh','shoh'][j]}`, label: `${label} + ${name}${i === 0 ? ' + Sheva (two dots)' : ''}`
    }))
  }))
];
// Keep the previous sample recordings available for review and replacement.
const recordingOnlyItems = specialEntries[1].items.splice(2, 2,
  {glyph: 'ךְ', id: 'final-chaf-sheva', label: 'Final Chaf + Sheva (two dots)'},
  {glyph: 'ךָ', id: 'final-chaf-kamatz', label: 'Final Chaf + Kamatz'}
);
recordingOnlyItems.push(...specialEntries[1].items.splice(2, 2,
  {glyph: 'לְךָ', id: 'final-chaf-lecha', label: 'Lecha (to you) — Final Chaf + Kamatz'},
  {glyph: 'שֶׁלְּךָ', id: 'final-chaf-shelcha', label: 'Shelcha (yours) — Final Chaf + Kamatz'}
));
const pickerEntries = [...consonants, ...specialEntries];
const allVowels = vowels.map((_, i) => i);
const alefGroups = [[0, 1, 2], [3, 4], allVowels.filter(i => i >= 5)];
const alefHeadings = ['Patach · Kamatz · Chirik', 'Tzairai · Kubutz', 'Remaining vowel signs'];
const compoundVowels = [9, 10, 11];
const key = 'hebrew-practice-v5';
let state = {count: 8, hints: false, consonant: 0, rows: []};
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && (saved.consonant === 33 || saved.consonant === 34)) saved.consonant = 28;
  if (saved && [6,8,12,18].includes(saved.count) && typeof saved.hints === 'boolean' &&
      Number.isInteger(saved.consonant) && pickerEntries[saved.consonant] &&
      Array.isArray(saved.rows) && saved.rows.length === 3 && saved.rows.every(row =>
        Array.isArray(row) && row.length === saved.count && row.every(v => allVowels.includes(v)))) {
    state = saved;
  }
} catch { /* Storage may be unavailable; practice still works. */ }
function randomRow(group, count = state.count) {
  const compound = group.filter(i => compoundVowels.includes(i));
  if (compound.length) {
    const simple = group.filter(i => !compoundVowels.includes(i));
    const compoundCount = Math.round(count * compound.length / group.length / 2);
    const row = [...deal(compound, compoundCount), ...deal(simple, count - compoundCount)];
    return shuffled(row);
  }
  return deal(group, count);
}
function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function deal(group, count) {
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
let soundEnabled = true;
try { soundEnabled = localStorage.getItem('hebrew-sound') !== 'off'; } catch {}
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
  const source = window.recordedSounds?.[soundByGlyph[text]] || practiceAudio[text];
  if (!source) {
    document.querySelector('#feedback').textContent = 'No recording is available yet. Record and save this sound in Record unique sounds below.';
    return;
  }
  const clip = new Audio(new URL(source, document.baseURI).href);
  clip.volume = 1;
  activeAudio = clip;
  clip.play().catch(error => {
    if (activeAudio !== clip || error.name === 'AbortError') return;
    document.querySelector('#feedback').textContent += ` Audio could not play (${error.name}). Try Test sound and check the browser tab’s sound setting.`;
  });
}
function render() {
  const special = specialEntries[state.consonant - consonants.length];
  document.querySelector('#count').disabled = !!special;
  document.querySelectorAll('.line').forEach((line, i) => { line.hidden = !!special && i > 0; });
  if (special) {
    const heading = document.querySelector('.line-heading h3');
    heading.replaceChildren(heading.querySelector('span'), document.createTextNode(' ' + special.name));
    const container = document.querySelector('#row-0');
    container.replaceChildren();
    container.classList.add('special-letters');
    special.items.forEach(item => {
      const button = document.createElement('button'); button.className = 'letter';
      button.setAttribute('aria-label', item.label);
      const glyph = document.createElement('span'); glyph.className = 'glyph'; glyph.textContent = item.glyph;
      button.append(glyph);
      if (state.hints) { const hint = document.createElement('span'); hint.className = 'hint'; hint.dir = 'ltr'; hint.textContent = item.label; button.append(hint); }
      button.addEventListener('click', () => {
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        button.classList.add('selected');
        document.querySelector('#feedback').textContent = item.label;
        playSound(item.glyph);
      });
      container.append(button);
    });
    save(); return;
  }
  document.querySelector('#row-0').classList.remove('special-letters');
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
  // Reduce paired marks to half their previous share, rounded to whole tiles.
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
pickerEntries.forEach((letter, i) => {
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
soundCheckbox.checked = soundEnabled;
soundCheckbox.addEventListener('change', e => {
  soundEnabled = e.target.checked;
  try { localStorage.setItem('hebrew-sound', soundEnabled ? 'on' : 'off'); } catch {}
  if (!soundEnabled) stopSound();
  else document.querySelector('#feedback').textContent = 'Sound is on. Select a practice letter to hear it.';
});
document.querySelector('#test-sound').addEventListener('click', () => {
  soundEnabled = true;
  soundCheckbox.checked = true;
  try { localStorage.setItem('hebrew-sound', 'on'); } catch {}
  document.querySelector('#feedback').textContent = 'Playing “ah.”';
  playSound(consonants[0].glyph + vowels[0].mark);
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
