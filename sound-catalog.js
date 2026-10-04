'use strict';
// Israeli pronunciation, preserving this tutorial's distinct short-uh Sheva.
const consonantSounds = ['vowel','b','v','g','d','h','v','z','kh','t','y','k','kh','l','m','n','s','vowel','p','f','ts','k','r','sh','s','t','t'];
const vowelSounds = ['ah','ah','ee','eh','oo','eh','oh','oo','uh','ah','eh','oh','oh'];
function soundId(consonant, vowel) {
  if (vowel === 5 || vowel === 10) return `segol-${consonants[consonant].name.toLowerCase()}`;
  return `${consonantSounds[consonant]}-${vowelSounds[vowel]}`;
}
const uniqueSounds = [];
const soundByGlyph = {};
consonants.forEach((letter, c) => vowels.forEach((vowel, v) => {
  const id = soundId(c, v);
  soundByGlyph[letter.glyph + vowel.mark] = id;
  let entry = uniqueSounds.find(sound => sound.id === id);
  if (!entry) {
    entry = {id, label: `${consonantSounds[c] === 'vowel' ? '' : consonantSounds[c]}${vowelSounds[v]}`, examples: [], glyph: letter.glyph + vowel.mark};
    uniqueSounds.push(entry);
  }
  entry.examples.push(`${letter.name} + ${vowel.name}`);
}));
