"""Generate Sheva practice syllables with the same Hila voice as other vowels."""
import asyncio
from pathlib import Path

import edge_tts

VOICE = 'he-IL-HilaNeural'
# Explicit syllables keep the practice vowel audible instead of letting Hebrew
# TTS drop an isolated sheva. Keep this order aligned with app.js.
SYLLABLES = ['uh', 'buh', 'vuh', 'guh', 'duh', 'huh', 'vuh', 'zuh', 'khuh',
             'tuh', 'yuh', 'kuh', 'khuh', 'luh', 'muh', 'nuh', 'suh', 'uh',
             'puh', 'fuh', 'tsuh', 'kuh', 'ruh', 'shuh', 'suh', 'tuh', 'suh']

async def generate():
    folder = Path(__file__).resolve().parent / 'audio'
    folder.mkdir(exist_ok=True)
    semaphore = asyncio.Semaphore(6)

    async def save(i, syllable):
        path = folder / f'{i}-8-hila.mp3'
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
