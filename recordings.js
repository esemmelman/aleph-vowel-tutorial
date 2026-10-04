'use strict';
(() => {
  const config = window.hebrewSupabase;
  const $ = id => document.getElementById(id);
  let session = null, recorder = null, stream = null, draft = null, draftSound = null, previewUrl = null, timer = null, busy = false;
  let saved = {};
  window.recordedSounds = {};
  const status = message => { $('record-status').textContent = message; };
  async function request(path, options = {}, authenticated = false) {
    if (!config?.url || !config?.key) throw new Error('Supabase is not configured yet.');
    if (authenticated && (!session || Date.now() >= session.expires_at)) throw new Error('Please sign in again; your session expired. Your preview is still available.');
    const response = await fetch(config.url + path, {...options, headers: {
      apikey: config.key, ...(authenticated ? {Authorization: `Bearer ${session.access_token}`} : {}), ...options.headers
    }});
    const body = await response.text();
    let data; try { data = body ? JSON.parse(body) : null; } catch { data = null; }
    if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || data?.error || `Request failed (${response.status}).`);
    return data;
  }
  function controls() {
    const recording = recorder?.state === 'recording';
    $('record-start').disabled = !session || busy || recording;
    $('record-stop').disabled = !recording;
    $('record-save').disabled = !session || !draft || busy || recording;
    $('record-sound').disabled = busy || recording;
    $('record-next').disabled = busy || recording;
    $('record-logout').disabled = busy || recording;
  }
  function clearDraft() {
    draft = null; draftSound = null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null; $('record-preview').removeAttribute('src'); $('record-preview').hidden = true;
  }
  function selectSound() {
    clearDraft();
    const entry = uniqueSounds.find(sound => sound.id === $('record-sound').value);
    $('record-examples').textContent = `Used for: ${entry.examples.join('; ')}.`;
    if (saved[entry.id]) {
      $('record-preview').src = window.recordedSounds[entry.id]; $('record-preview').hidden = false;
    }
    controls();
  }
  function progress() {
    for (const option of $('record-sound').options) {
      const entry = uniqueSounds.find(sound => sound.id === option.value);
      option.textContent = entry.glyph;
      option.setAttribute('aria-label', `${entry.label}${saved[entry.id] ? ', recorded' : ', not recorded'}`);
    }
    $('record-progress').textContent = `${uniqueSounds.filter(sound => saved[sound.id]).length} of ${uniqueSounds.length} unique sounds saved.`;
  }
  async function load() {
    const rows = await request('/rest/v1/hebrew_recordings?select=sound_id,storage_path');
    saved = Object.fromEntries(rows.map(row => [row.sound_id, row.storage_path]));
    window.recordedSounds = Object.fromEntries(rows.map(row => [row.sound_id, `${config.url}/storage/v1/object/public/hebrew-sounds/${row.storage_path}`]));
    progress();
  }
  for (const sound of uniqueSounds) {
    const option = document.createElement('option'); option.value = sound.id; $('record-sound').append(option);
  }
  progress(); selectSound();
  $('record-sound').addEventListener('change', selectSound);
  $('record-next').addEventListener('click', () => {
    const options = uniqueSounds;
    const start = options.findIndex(sound => sound.id === $('record-sound').value);
    for (let offset = 1; offset <= options.length; offset++) {
      const candidate = options[(start + offset) % options.length];
      if (!saved[candidate.id]) { $('record-sound').value = candidate.id; selectSound(); return; }
    }
    status('All unique sounds are recorded. Select a sound to review or replace it.');
  });
  $('record-login').addEventListener('submit', async event => {
    event.preventDefault(); busy = true; controls(); status('Signing in…');
    try {
      const data = await request('/auth/v1/token?grant_type=password', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:$('record-email').value, password:$('record-password').value})});
      session = {...data, expires_at: Date.now() + data.expires_in * 1000};
      const permission = await request('/rest/v1/hebrew_recorders?select=user_id', {}, true);
      if (!permission.length) { session = null; throw new Error('This account is not authorized to record sounds. Ask the project owner to add it to hebrew_recorders.'); }
      $('record-login').hidden = true; $('record-logout').hidden = false; status('Signed in. Choose a sound and record it.');
    } catch (error) { status(error.message); }
    finally { $('record-password').value = ''; busy = false; controls(); }
  });
  $('record-logout').addEventListener('click', async () => {
    try { await request('/auth/v1/logout', {method:'POST'}, true); } catch { /* Local session is always cleared. */ }
    session = null; clearDraft(); $('record-login').hidden = false; $('record-logout').hidden = true; controls(); status('Signed out.');
  });
  function releaseMic() { clearTimeout(timer); stream?.getTracks().forEach(track => track.stop()); stream = null; }
  $('record-start').addEventListener('click', async () => {
    busy = true; controls(); stopSound(); $('record-preview').pause();
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Recording needs HTTPS (or localhost) and a browser with microphone recording support.');
      stream = await navigator.mediaDevices.getUserMedia({audio:true});
      clearDraft(); draftSound = $('record-sound').value;
      const mimeType = ['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
      recorder = new MediaRecorder(stream, mimeType ? {mimeType} : {});
      const chunks = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        releaseMic(); draft = new Blob(chunks, {type:recorder.mimeType});
        previewUrl = URL.createObjectURL(draft); $('record-preview').src = previewUrl; $('record-preview').hidden = false;
        status('Listen to the preview, then save or record again.'); controls();
      };
      recorder.onerror = () => { releaseMic(); clearDraft(); status('Recording failed. Please try again.'); controls(); };
      recorder.start(); timer = setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 10000);
      status('Recording… say the sound, then press Stop. Maximum 10 seconds.');
    } catch (error) { releaseMic(); status(error.message); }
    finally { busy = false; controls(); }
  });
  $('record-stop').addEventListener('click', () => { if (recorder?.state === 'recording') recorder.stop(); });
  $('record-save').addEventListener('click', async () => {
    busy = true; controls(); status('Saving recording…');
    let path, committed = false;
    try {
      if (!draft?.size || draft.size > 6291456) throw new Error('Recording must be nonempty and smaller than 6 MB.');
      const type = draft.type.split(';')[0];
      const extension = {'audio/webm':'webm','audio/mp4':'mp4','audio/ogg':'ogg','audio/wav':'wav','audio/mpeg':'mp3'}[type];
      if (!extension) throw new Error('This browser produced an unsupported audio format. Try Chrome, Firefox, or Safari.');
      path = `${draftSound}/${crypto.randomUUID()}.${extension}`;
      await request(`/storage/v1/object/hebrew-sounds/${path}`, {method:'POST', headers:{'Content-Type':type}, body:draft}, true);
      const previous = saved[draftSound];
      await request('/rest/v1/hebrew_recordings?on_conflict=sound_id', {method:'POST', headers:{'Content-Type':'application/json', Prefer:'resolution=merge-duplicates'}, body:JSON.stringify({sound_id:draftSound, storage_path:path, updated_by:session.user.id, updated_at:new Date().toISOString()})}, true);
      committed = true;
      // Publish immediately, even if a subsequent refresh or cleanup fails.
      saved[draftSound] = path; window.recordedSounds[draftSound] = `${config.url}/storage/v1/object/public/hebrew-sounds/${path}`;
      progress(); selectSound(); status('Saved. This sound is now used in practice.');
      if (previous) { try { await request('/storage/v1/object/hebrew-sounds', {method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prefixes:[previous]})}, true); } catch { /* Old clip cleanup can be retried by the owner. */ } }
    } catch (error) {
      if (path && !committed) { try { await request('/storage/v1/object/hebrew-sounds', {method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prefixes:[path]})}, true); } catch {} }
      status(`Could not save: ${error.message} Your preview is kept for retry.`);
    } finally { busy = false; controls(); }
  });
  window.addEventListener('pagehide', releaseMic);
  load().then(() => { selectSound(); status('Sign in with your authorized Supabase account to record.'); }).catch(error => status(`Recordings unavailable: ${error.message} Original practice audio still works.`));
})();
