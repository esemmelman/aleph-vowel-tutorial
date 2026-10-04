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
test('all 351 glyphs map to 120 shared sounds with intended equivalences', () => {
  const ctx = catalog();
  assert.equal(vm.runInContext('uniqueSounds.length',ctx),120);
  assert.equal(vm.runInContext('Object.keys(soundByGlyph).length',ctx),351);
  for (const [a,b] of [[0,1],[0,9],[3,5],[5,10],[4,7],[6,11],[6,12]])
    assert.equal(vm.runInContext(`soundId(1,${a}) === soundId(1,${b})`,ctx),true);
  for (const [a,b] of [[0,17],[2,6],[8,12],[9,25],[11,21],[16,24],[25,26]])
    assert.equal(vm.runInContext(`soundId(${a},8) === soundId(${b},8)`,ctx),true);
  assert.notEqual(vm.runInContext('soundId(1,5)',ctx),vm.runInContext('soundId(1,8)',ctx));
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
  assert.match(element('record-progress').textContent,/1 of 120/);
});
