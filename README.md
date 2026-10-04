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

## Special practice entries

The letter list also includes Alef + Patach + Yod (one tile) and the five final letters (four combinations each). Each final letter appears once in the list. Final Chaf shows two letter-and-vowel samples plus Final Chaf with Sheva (two dots) and Final Chaf with Kamatz on the same line. The 21 displayed special combinations and two retained earlier Chaf samples have separate recording slots, bringing the total to 176. Record and save them in Record unique sounds to enable their audio.

## Practice audio

## Recording your own sounds

Open **Record unique sounds** on the site and sign in with your authorized Supabase email and password. Choose a pronunciation, press **Record**, say the complete letter-and-vowel sound, and press **Stop**. Listen to the preview and **Save recording**. **Next missing sound** advances through unfinished recordings. Takes stop automatically after 10 seconds. Microphone recording requires HTTPS or localhost.

The 351 ordinary letter/mark combinations use 153 recording slots: 126 pronunciation recordings (including a separate set for Chaf) plus 27 separate Segol recordings, one for each letter variant. Hataf Segol (five dots) uses that letter's Segol (three-dot triangle) recording. Tsere remains independent. This follows modern Israeli pronunciation with the tutorial's short “uh” Sheva; Saf shares Taf's “t” except when recording Segol. Each sound's list shows every combination that will use it. Re-recording replaces the shared sound. Until a recording is saved, practice uses bundled audio.

Recordings live in the `hebrew-sounds` public Storage bucket and `public.hebrew_recordings` in the bnaimitzvah Supabase project. Only accounts listed in `public.hebrew_recorders` may upload or replace sounds. The owner account is authorized. Sessions stay in memory; sign in again after refreshing. The browser configuration contains only a publishable key. The schema and RLS policies are checked into `supabase/migrations`.

To authorize another existing Supabase Auth account, run in the project's SQL editor:

```sql
insert into public.hebrew_recorders (user_id)
select id from auth.users where email = 'recorder@example.com'
on conflict do nothing;
```

Verify catalog and recording flows with `node --test tests/recordings.test.cjs`.

Bundled MP3 clips all use the Microsoft Hebrew Hila voice. Sheva audio is assembled from Hila recordings rather than synthesized from isolated letters or English spellings. The accepted Bet-with-Sheva recording stays unchanged; its vowel supplies Alef/Ayin and the vowel portion of the other Sheva syllables. Consonant onsets are extracted from the existing Hila vowel recordings, with short crossfades. `generate-sheva.py` builds these clips offline using `numpy` and `imageio-ffmpeg`; source hashes protect the reviewed onset boundaries. `generate-audio.py` also generates missing ordinary Hebrew clips using `edge-tts` and rebuilds `audio-map.js`. Playback itself requires no external speech service.
