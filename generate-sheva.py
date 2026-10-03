"""Generate Sheva syllables from phonemes, never from spelled-out labels.

Requires espeakng-loader and imageio-ffmpeg. Playback uses only the saved MP3s.
"""
import ctypes as ct
import subprocess
from pathlib import Path

import espeakng_loader
import imageio_ffmpeg

# eSpeak phonemes: @ = schwa (uh), x = Hebrew chet/chaf, S = shin.
# Keep this order aligned with the consonant picker in app.js.
PHONEMES = ['@', 'b@', 'v@', 'g@', 'd@', 'h@', 'v@', 'z@', 'x@',
            't@', 'j@', 'k@', 'x@', 'l@', 'm@', 'n@', 's@', '@',
            'p@', 'f@', 'ts@', 'k@', 'r@', 'S@', 's@', 't@', 's@']


class EventId(ct.Union):
    _fields_ = [('number', ct.c_int), ('name', ct.c_void_p), ('string', ct.c_char * 8)]


class Event(ct.Structure):
    _fields_ = [('type', ct.c_int), ('identifier', ct.c_uint),
                ('position', ct.c_int), ('length', ct.c_int),
                ('audio_position', ct.c_int), ('sample', ct.c_int),
                ('user_data', ct.c_void_p), ('id', EventId)]


def generate():
    lib = ct.CDLL(str(espeakng_loader.get_library_path()))
    lib.espeak_Initialize.argtypes = [ct.c_int, ct.c_int, ct.c_char_p, ct.c_int]
    lib.espeak_SetVoiceByName.argtypes = [ct.c_char_p]
    lib.espeak_Synth.argtypes = [ct.c_void_p, ct.c_size_t, ct.c_uint,
                               ct.c_int, ct.c_uint, ct.c_uint,
                               ct.POINTER(ct.c_uint), ct.c_void_p]
    # Synchronous retrieval: audio stays in memory; nothing plays during generation.
    sample_rate = lib.espeak_Initialize(
        2, 0, str(Path(espeakng_loader.get_data_path()).parent).encode(), 1)
    if sample_rate <= 0 or lib.espeak_SetVoiceByName(b'en-us'):
        raise RuntimeError('Could not initialize phoneme synthesis')
    lib.espeak_SetParameter(1, 135, 0)
    chunks = []
    emitted = []
    callback_type = ct.CFUNCTYPE(ct.c_int, ct.POINTER(ct.c_short), ct.c_int, ct.c_void_p)

    @callback_type
    def receive(samples, count, events):
        if samples and count:
            chunks.append(ct.string_at(samples, count * 2))
        cursor = ct.cast(events, ct.POINTER(Event))
        index = 0
        while cursor and cursor[index].type:
            if cursor[index].type == 7:
                emitted.append(bytes(cursor[index].id.string).decode())
            index += 1
        return 0

    lib.espeak_SetSynthCallback.argtypes = [callback_type]
    lib.espeak_SetSynthCallback(receive)
    folder = Path(__file__).resolve().parent / 'audio'
    folder.mkdir(exist_ok=True)
    try:
        for i, phones in enumerate(PHONEMES):
            path = folder / f'{i}-8-phonemes.mp3'
            chunks.clear()
            emitted.clear()
            spoken = f'[[{phones}]]'.encode()
            # UTF-8 + PHONEMES enables direct [[...]] pronunciation input.
            if lib.espeak_Synth(spoken, len(spoken) + 1, 0, 1, 0, 0x101, None, None):
                raise RuntimeError(f'Could not synthesize {phones}')
            pcm = b''.join(chunks)
            if not pcm:
                raise RuntimeError(f'No audio generated for {phones}')
            actual = [phone.lstrip("',") for phone in emitted if not phone.startswith('_')]
            if actual != list(phones):
                raise RuntimeError(f'Unexpected speech sounds for {phones}: {actual}')
            subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-y',
                            '-f', 's16le', '-ar', str(sample_rate), '-ac', '1',
                            '-i', 'pipe:0', '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.15',
                            '-codec:a', 'libmp3lame', '-b:a', '64k', str(path)],
                           input=pcm, check=True)
    finally:
        lib.espeak_Terminate()
    print(f'Generated {len(PHONEMES)} explicit Sheva syllables.')


if __name__ == '__main__':
    generate()
