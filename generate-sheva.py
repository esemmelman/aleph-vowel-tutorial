"""Build Sheva clips from Hila recordings, without asking TTS to read letters.

The learner confirmed Bet's Sheva recording. Its vowel is reused unchanged
for every other syllable; consonant onsets come from existing Hila recordings.
Requires numpy and imageio-ffmpeg. No speech service is called.
"""
import hashlib
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np

FOLDER = Path(__file__).resolve().parent / 'audio'
SAMPLE_RATE = 24000
# Source letter, source vowel, onset start/end in seconds. Boundaries were
# inspected in spectrograms. Include stop releases but exclude source vowels.
# Vet/Vav, Kaf/Qof, Tet/Taf and Samekh/Sin/Saf share their consonant onset.
ONSETS = {2: (2, 2, 0.275, 0.525),
 3: (3, 2, 0.275, 0.445),
 4: (4, 2, 0.275, 0.467),
 5: (5, 2, 0.265, 0.49),
 6: (2, 2, 0.275, 0.525),
 7: (7, 2, 0.28, 0.535),
 8: (8, 2, 0.27, 0.525),
 9: (9, 2, 0.29, 0.375),
 10: (10, 0, 0.275, 0.475),
 11: (11, 2, 0.27, 0.48),
 12: (12, 2, 0.27, 0.525),
 13: (13, 2, 0.275, 0.505),
 14: (14, 2, 0.295, 0.505),
 15: (15, 2, 0.29, 0.51),
 16: (16, 2, 0.27, 0.565),
 18: (18, 2, 0.29, 0.375),
 19: (19, 2, 0.265, 0.545),
 20: (20, 2, 0.27, 0.5),
 21: (11, 2, 0.27, 0.48),
 22: (22, 2, 0.28, 0.445),
 23: (23, 2, 0.27, 0.535),
 24: (16, 2, 0.27, 0.565),
 25: (9, 2, 0.29, 0.375),
 26: (16, 2, 0.27, 0.565)}
# Timings refer to these exact bundled recordings. Regenerating a source
# requires checking the boundaries again, not silently reusing old timings.
SOURCE_HASHES = {'1-8-hebrew.mp3': '97a38051873feb3bf2610608f826f4d652fdc5ee55dd0d4f22276c610a98d662',
 '10-0.mp3': '02b07d913a125613d9f8b3eedcb077365cc12b70d8193c4d22057a8c65a8b00a',
 '11-2.mp3': 'aeb243f7ce1c691df5d5e6f93b7d2afa9f090d77ccead0e5240cf80391e863c1',
 '12-2.mp3': 'ce93b1fe6246e7b9b54946e5585e20204c5348c580749f599ae0fe7f7b726c67',
 '13-2.mp3': 'f037589ae3b6f1d89ee93088bbc98cac378be85eed4e03ec0cd149ea2507c01e',
 '14-2.mp3': '798262d05a49932d2205b5d012052c73c74152bc9797bc8c5d9073e8e95a1fa7',
 '15-2.mp3': '20aad0c01ce2a79d7b4c656114692af6c397f8d0d4799766991eb0a8dd8e4391',
 '16-2.mp3': '9bcc5b89a1056065b5cb612f46d594d43d4db4ac611706b1adc0b8ecf9d01caf',
 '18-2.mp3': '254f6cb18759d6bd7fa25d25f03832fc6d4ac1d4ec69be86f7567f2352023904',
 '19-2.mp3': '208db5b897e70ab9e5d1d0f9da30bd33a245df38fe8da0241118368824a113b9',
 '2-2.mp3': 'c047fc469fa41124cf8011550f5962fcbe3dc7686bf20ea3cdbb620b2162a086',
 '20-2.mp3': '3c005f1a9e7bedb93dad576ab778e1bcbb5a910374ed9981da200f1205fb9cad',
 '22-2.mp3': 'f393b336e3eec5fa4496a1d049b463ad1a129677907959a22a3b79027b4ffd0c',
 '23-2.mp3': 'f8cf88358377044d89e11022261f618e8ac75f271fefc26656ce06aeec60d539',
 '3-2.mp3': '761c99d935532dd2e30edd3d19f3375585a0a75f34a691e9477ea2089caa1379',
 '4-2.mp3': 'b7454d7872cef566bf610f9a83e75f8f691453a2ed673048bd339ff0395a6553',
 '5-2.mp3': '2d7ed2712f55a89794ad7ed59b656ee8ca6b8129f077701677bbcf3e0c883b75',
 '7-2.mp3': 'e72071e4a955c6582bc5924c534be3acaf2f3e5bf7dd81e8c28fc03a057985ab',
 '8-2.mp3': 'af26db4fa4c1f4d0c88950e7d669896891bcf6f696a43e839bfe0dbc414fc35c',
 '9-2.mp3': '998be346772e82274cd6f097ce9e3ff1f706e0226780596cf9a713f878d15d64'}


def decode(name):
    result = subprocess.run(
        [imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(FOLDER / name),
         '-f', 'f32le', '-ar', str(SAMPLE_RATE), '-ac', '1', 'pipe:1'],
        capture_output=True, check=True)
    return np.frombuffer(result.stdout, dtype='<f4').copy()


def section(samples, start, end):
    return samples[round(start * SAMPLE_RATE):round(end * SAMPLE_RATE)].copy()


def generate():
    for name, expected in SOURCE_HASHES.items():
        actual = hashlib.sha256((FOLDER / name).read_bytes()).hexdigest()
        if actual != expected:
            raise RuntimeError(f'{name} changed; review its phoneme boundaries first.')

    # Bet's consonant release is around 0.46 s; start beyond that transition.
    vowel = section(decode('1-8-hebrew.mp3'), 0.495, 0.820)
    overlap = round(0.012 * SAMPLE_RATE)
    fade = np.linspace(0, 1, overlap, dtype=np.float32)
    for i in range(27):
        if i == 1:
            continue  # Preserve the learner-approved Bet recording byte for byte.
        if i in {0, 17}:
            result = vowel.copy()  # Alef/Ayin: vowel alone, with no Bet onset.
            result[:overlap] *= fade
        else:
            source_i, source_j, start, end = ONSETS[i]
            onset = section(decode(f'{source_i}-{source_j}.mp3'), start, end)
            onset[:overlap] *= fade
            # A short crossfade avoids a click without adding another syllable.
            joint = onset[-overlap:] * (1 - fade) + vowel[:overlap] * fade
            result = np.concatenate((onset[:-overlap], joint, vowel[overlap:]))
        result[-overlap:] *= fade[::-1]
        result = np.concatenate((np.zeros(round(.05 * SAMPLE_RATE)), result,
                                 np.zeros(round(.15 * SAMPLE_RATE)))).astype('<f4')
        if not np.isfinite(result).all() or not .1 < np.max(np.abs(result)) < 1:
            raise RuntimeError(f'Invalid audio samples for letter {i}')
        subprocess.run(
            [imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-y', '-f', 'f32le',
             '-ar', str(SAMPLE_RATE), '-ac', '1', '-i', 'pipe:0',
             '-codec:a', 'libmp3lame', '-b:a', '96k',
             str(FOLDER / f'{i}-8-syllable.mp3')],
            input=result.tobytes(), capture_output=True, check=True)
    print('Built 26 Hila Sheva syllables; preserved the accepted Bet recording.')


if __name__ == '__main__':
    generate()
