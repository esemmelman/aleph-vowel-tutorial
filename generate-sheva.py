"""Generate Sheva practice syllables with the same Hila voice as other vowels."""
import asyncio
import re
from pathlib import Path

import edge_tts

VOICE = 'he-IL-HilaNeural'
# Use native pointed Hebrew, never English approximations such as "buh" or
# "guh": Hila can interpret those as words or spell their letters aloud.
SOURCE = Path(__file__).with_name('app.js').read_text(encoding='utf-8')
LETTERS = re.findall(r"\['[^']+', '([^']+)'\]", SOURCE)
SYLLABLES = [letter + '\u05b0' for letter in LETTERS]
# Preserve the accepted isolated "uh" clips for Alef and Ayin.
ISOLATED_VOWELS = {0, 17}

async def generate():
    folder = Path(__file__).resolve().parent / 'audio'
    folder.mkdir(exist_ok=True)
    semaphore = asyncio.Semaphore(6)

    async def save(i, syllable):
        path = folder / (f'{i}-8-hila.mp3' if i in ISOLATED_VOWELS else f'{i}-8-hebrew.mp3')
        if i in ISOLATED_VOWELS and path.exists() and path.stat().st_size:
            return
        if i in ISOLATED_VOWELS:
            syllable = 'uh'
        async with semaphore:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(syllable, VOICE, rate='-20%').save(str(path))
                    if not path.stat().st_size:
                        raise RuntimeError(f'Empty audio for {syllable}')
                    return
                except Exception:
                    if attempt == 3:
                        raise
                    await asyncio.sleep(2 * (attempt + 1))

    await asyncio.gather(*(save(i, syllable) for i, syllable in enumerate(SYLLABLES)))
    print(f'Generated {len(SYLLABLES)} Hila Sheva syllables.')

if __name__ == '__main__':
    asyncio.run(generate())
