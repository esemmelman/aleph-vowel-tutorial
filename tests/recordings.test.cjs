const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync('app.js', 'utf8');
function catalog() {
  const context = vm.createContext({});
  vm.runInContext(app.slice(0, app.indexOf('const allVowels')), context);
  vm.runInContext(fs.readFileSync('sound-catalog.js','utf8'), context);
  return context;
}
test('all 372 glyphs map to 174 sounds including special practice items', () => {
  const ctx = catalog();
  assert.equal(vm.runInContext('uniqueSounds.length',ctx),174);
  assert.equal(vm.runInContext('Object.keys(soundByGlyph).length',ctx),372);
  for (const [a,b] of [[0,1],[0,9],[5,10],[4,7],[6,11],[6,12]])
    assert.equal(vm.runInContext(`soundId(1,${a}) === soundId(1,${b})`,ctx),true);
  for (const [a,b] of [[0,17],[2,6],[9,25],[11,21],[16,24],[25,26]])
    assert.equal(vm.runInContext(`soundId(${a},8) === soundId(${b},8)`,ctx),true);
  for (let v = 0; v < 13; v++) assert.notEqual(vm.runInContext('soundId(12,' + v + ')',ctx),vm.runInContext('soundId(8,' + v + ')',ctx));
  assert.equal(vm.runInContext('new Set(vowels.map((_, v) => soundId(12,v))).size',ctx),7);
  assert.notEqual(vm.runInContext('soundId(1,5)',ctx),vm.runInContext('soundId(1,8)',ctx));
  assert.equal(vm.runInContext('new Set(consonants.map((_, c) => soundId(c,5))).size',ctx),27);
  for (let c = 0; c < 27; c++) {
    assert.notEqual(vm.runInContext(`soundId(${c},5)`,ctx),vm.runInContext(`soundId(${c},3)`,ctx));
    assert.equal(vm.runInContext(`soundId(${c},10)`,ctx),vm.runInContext(`soundId(${c},5)`,ctx));
    assert.equal(vm.runInContext(`uniqueSounds.find(s => s.id === soundId(${c},5)).examples.length`,ctx),2);
  }
});
test('record preview, upload, metadata publication and shared playback', async () => {
  const ctx = catalog(), elements = {}, requests = [];
  function element(id) {
    return elements[id] ||= {value:'', options:[], listeners:{}, hidden:false,
      addEventListener(type, fn) {this.listeners[type]=fn;}, append(option) {this.options.push(option); if(!this.value)this.value=option.value;},
      removeAttribute() {}, pause() {}};
  }
  let tracksStopped = 0;
  class Recorder {
    static isTypeSupported(type) {return type.startsWith('audio/webm');}
    constructor() {this.state='inactive';this.mimeType='audio/webm;codecs=opus';}
    start() {this.state='recording';}
    stop() {this.state='inactive';this.ondataavailable({data:new Blob(['test audio'])});this.onstop();}
  }
  Object.assign(ctx, {window:{hebrewSupabase:{url:'https://example.supabase.co',key:'public'},isSecureContext:true,MediaRecorder:Recorder,addEventListener(){}},
    document:{getElementById:element,createElement:()=>({setAttribute(){}})}, navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){tracksStopped++;}}]})}},
    MediaRecorder:Recorder,Blob,URL:{createObjectURL:()=> 'blob:preview',revokeObjectURL(){}},crypto:{randomUUID:()=> '1234-abcd'},
    setTimeout:()=>1,clearTimeout(){},stopSound(){},fetch:async(url,options)=> {
      requests.push({url,options});
      const data = url.includes('/token?') ? {access_token:'token',expires_in:3600,user:{id:'owner'}} : url.includes('hebrew_recorders?') ? [{user_id:'owner'}] : url.includes('hebrew_recordings?select') ? [] : null;
      return {ok:true,text:async()=>JSON.stringify(data)};
    }});
  vm.runInContext(fs.readFileSync('recordings.js','utf8'),ctx);
  await new Promise(resolve=>setImmediate(resolve));
  element('record-email').value='owner@example.com';element('record-password').value='password';
  await element('record-login').listeners.submit({preventDefault(){}});
  assert.equal(element('record-start').disabled,false);
  await element('record-start').listeners.click();
  assert.equal(element('record-stop').disabled,false);
  element('record-stop').listeners.click();
  assert.equal(tracksStopped,1);
  assert.equal(element('record-save').disabled,false);
  await element('record-save').listeners.click();
  const upload = requests.find(r=>r.url.includes('/storage/v1/object/hebrew-sounds/'));
  assert.equal(upload.options.headers['Content-Type'],'audio/webm');
  const metadata = requests.find(r=>r.url.includes('on_conflict'));
  assert.equal(JSON.parse(metadata.options.body).sound_id,'vowel-ah');
  assert.match(ctx.window.recordedSounds['vowel-ah'],/vowel-ah\/1234-abcd.webm$/);
  assert.match(element('record-progress').textContent,/1 of 174/);
});
test('special entries have one Alef Patach Yod and four distinct combinations per final letter', () => {
  const ctx = catalog();
  assert.equal(vm.runInContext('specialEntries[0].items.length',ctx),1);
  assert.equal(vm.runInContext("soundByGlyph['אַי']",ctx),'alef-patach-yod');
  assert.equal(vm.runInContext('specialEntries.length',ctx),6);
  assert.equal(vm.runInContext('new Set(specialEntries.flatMap(e => e.items.map(i => i.id))).size',ctx),21);
  for (let n = 1; n <= 5; n++) {
    assert.equal(vm.runInContext(`specialEntries[${n}].items.length`,ctx),4);
    assert.equal(vm.runInContext(`specialEntries[${n}].items.every(i => i.glyph.endsWith(specialEntries[${n}].glyph) && soundByGlyph[i.glyph] === i.id && uniqueSounds.some(s => s.id === i.id))`,ctx),true);
  }
});
test('picker renders special tiles, plays their recordings, and returns to ordinary practice', () => {
  const elements = {}, played = [];
  function node() {
    return {children: [], listeners: {}, classList: {add(){},remove(){}},
      append(...items){this.children.push(...items);}, replaceChildren(...items){this.children = items;},
      setAttribute(){}, addEventListener(type, fn){this.listeners[type] = fn;}, querySelector(){return node();}};
  }
  const get = id => elements[id] ||= node();
  const lines = [node(),node(),node()], headings = [node(),node(),node()];
  const ctx = vm.createContext({
    document: {baseURI:'https://example.com/',querySelector:get,createElement:node,createTextNode:text=>({textContent:text}),
      querySelectorAll:selector=> selector === '.line' ? lines : selector === '.line-heading h3' ? headings : []},
    localStorage:{getItem(){return null;},setItem(){}}, window:{recordedSounds:{}}, URL,
    Audio:class {constructor(url){played.push(url);} play(){return Promise.resolve();} pause(){}}, practiceAudio:{}
  });
  vm.runInContext(app,ctx);
  vm.runInContext(fs.readFileSync('sound-catalog.js','utf8'),ctx);
  assert.equal(get('#consonant').children.length,33);
  for (let index = 27; index < 33; index++) {
    get('#consonant').listeners.change({target:{value:String(index)}});
    assert.equal(get('#row-0').children.length,index === 27 ? 1 : 4);
    assert.equal(lines[0].hidden,false);
    assert.equal(lines[1].hidden,true);
    assert.equal(lines[2].hidden,true);
    const glyph = get('#row-0').children[0].children[0].textContent;
    const id = vm.runInContext(`soundByGlyph[${JSON.stringify(glyph)}]`,ctx);
    ctx.window.recordedSounds[id] = `https://example.com/${id}.webm`;
    get('#row-0').children[0].listeners.click();
    assert.equal(played.at(-1),ctx.window.recordedSounds[id]);
    get('#shuffle').listeners.click();
    assert.equal(get('#row-0').children.length,index === 27 ? 1 : 4);
  }
  get('#consonant').listeners.change({target:{value:'1'}});
  assert.equal(get('#row-0').children.length,8);
  assert.equal(lines.every(line => !line.hidden),true);
  assert.equal(get('#count').disabled,false);
});
