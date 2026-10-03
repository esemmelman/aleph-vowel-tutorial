# Hebrew vowel practice

A static, mobile-friendly tutorial with a far-left letter list from Alef through Taf.

- The letter list displays Hebrew glyphs, including dotted and undotted variants and Shin/Sin. Gimel and Dalet appear without dagesh. The center practice letters use a larger responsive font.
- Select a letter to generate three randomized lines with eight letters per line.
- Alef uses the original groups: Patach/Kamatz/Chirik on line 1, Tzairai/Kubutz on line 2, and the remaining vowel signs on line 3. Other letters use all 13 vowel signs. The three compound vowels (Hataf Patach, Hataf Segol, Hataf Kamatz) appear half as often as before, rounded to whole tiles.
- Shuffle all lines or a single line; adjust the letter count or show vowel names.
- Sound starts on; “Include sound” saves your preference. Select a practice tile to hear bundled Hebrew audio, or use “Test sound” to enable sound and play “ah.” No installed speech voice is required. Sheva (two vertical dots underneath) is taught as “uh,” with explicit consonant-plus-“uh” clips. Other clips use modern Israeli pronunciation; reduced vowels share their full-vowel sound.
- The shuffle and settings controls stay visible while scrolling.
- Read from right to left and select a practice tile to reveal its vowel sound.
- The selected letter, rows, and settings save automatically in browser local storage.

Open `index.html` locally or use the GitHub Pages site. No installation or build is needed.

## Publishing changes

Run `./publish.ps1` in PowerShell to commit website changes and push them to GitHub. Each push to `main` automatically deploys the site through GitHub Actions. Browser practice settings stay on the learner's device and are not uploaded to GitHub.

Vowel reference: https://soundsofnikud.com/index_en.html

## Practice audio

Bundled MP3 clips all use the Microsoft Hebrew Hila voice. Sheva uses explicit practice syllables to keep the short vowel audible. `generate-audio.py` regenerates the Sheva clips, missing Hebrew clips, and `audio-map.js` using Python and `edge-tts`. `generate-sheva.py` regenerates only the Sheva clips with the same Hila voice. Playback itself requires no external speech service.
