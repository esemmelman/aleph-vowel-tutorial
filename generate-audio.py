import asyncio, json, re
from pathlib import Path
import edge_tts
source=Path('app.js').read_text(encoding='utf-8')
letters=re.findall(r"\['[^']+', '([^']+)'\]",source)
marks=[ '\u05b7','\u05b8','\u05b4','\u05b5','\u05bb','\u05b6','\u05d5\u05b9','\u05d5\u05bc','\u05b0','\u05b2','\u05b1','\u05b3','\u05b9']
# Signs with the same isolated practice pronunciation share a clip.
groups=[0,0,2,3,4,3,6,4,8,0,3,6,6]
folder=Path('audio'); folder.mkdir(exist_ok=True)
manifest={}
semaphore=asyncio.Semaphore(6)
def clip_path(i,j):
    suffix = ("-hila" if i in {0, 17} else "-hebrew") if j == 8 else ""
    return folder/f'{i}-{j}{suffix}.mp3'
async def generate(i,j,text):
    path=clip_path(i,j)
    if path.exists() and path.stat().st_size>0: return
    async with semaphore:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(text,'he-IL-HilaNeural',rate='-20%').save(str(path))
                return
            except Exception:
                if attempt==3: raise
                await asyncio.sleep(2*(attempt+1))
async def main():
    import runpy
    sheva = runpy.run_path(str(Path(__file__).with_name('generate-sheva.py')))
    await sheva['generate']()
    jobs=[]
    for i,letter in enumerate(letters):
        for j in sorted(set(groups) - {8}):
            jobs.append(generate(i,j,letter+marks[j]))
        for j,group in enumerate(groups):
            manifest[letter+marks[j]]=clip_path(i,group).as_posix()
    await asyncio.gather(*jobs)
    Path('audio-map.js').write_text('const practiceAudio = '+json.dumps(manifest,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    print(f'Generated {len(jobs)} clips for {len(manifest)} tiles.')
asyncio.run(main())
