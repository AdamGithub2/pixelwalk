const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
  class FakeAudio extends EventTarget {
    constructor(src) { super(); this.src = src; this.paused = true; this.currentTime = 0; this.calls = 0; }
    play() {
      this.calls++;
      if (this.rejectNext) { this.rejectNext = false; return Promise.reject(new Error('NotAllowedError')); }
      this.paused = false;
      return Promise.resolve();
    }
    pause() { this.paused = true; }
  }
  const window = new EventTarget();
  const document = new EventTarget();
  document.hidden = false;
  const context = vm.createContext({ Audio: FakeAudio, window, document });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../game_audio.js'), 'utf8'), context);
  return { audio: new context.GameAudio(), window, document };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('a rejected music start is retried by the next user gesture', async () => {
  const { audio, window } = setup();
  audio.music.rejectNext = true;
  window.dispatchEvent(new Event('pointerdown'));
  await flush();
  assert.equal(audio.music.paused, true);
  window.dispatchEvent(new Event('keydown'));
  await flush();
  assert.equal(audio.music.paused, false);
  assert.equal(audio.music.calls, 2);
  window.dispatchEvent(new Event('pointerdown'));
  assert.equal(audio.music.calls, 2, 'playing music is not restarted on every input');
});

test('ready media, focus and visibility resume music while mute remains respected', async () => {
  const { audio, window, document } = setup();
  window.dispatchEvent(new Event('keydown'));
  await flush();
  audio.music.pause();
  audio.music.dispatchEvent(new Event('canplay'));
  await flush();
  assert.equal(audio.music.paused, false);
  document.hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(audio.music.paused, true);
  document.hidden = false;
  document.dispatchEvent(new Event('visibilitychange'));
  await flush();
  assert.equal(audio.music.paused, false);
  audio.toggleMuted();
  window.dispatchEvent(new Event('focus'));
  window.dispatchEvent(new Event('pointerdown'));
  await flush();
  assert.equal(audio.music.paused, true);
  audio.toggleMuted();
  await flush();
  assert.equal(audio.music.paused, false);
});

test('passerby audio uses the two local files, prevents overlap and restores music volume', async () => {
  const { audio, window } = setup();
  for (const voice of audio.voices) assert.ok(fs.existsSync(path.join(__dirname, '..', voice.src)));
  assert.equal(audio.voices.length, 2);
  assert.equal(audio.playPasserby(), false, 'no voice before interaction');
  window.dispatchEvent(new Event('pointerdown'));
  await flush();
  assert.equal(audio.playPasserby(), true);
  const voice = audio.currentVoice;
  assert.equal(audio.playPasserby(), false);
  assert.equal(audio.music.volume, 0.10);
  voice.onended();
  assert.equal(audio.currentVoice, null);
  assert.equal(audio.music.volume, 0.28);
  await flush();
  audio.playPasserby();
  audio.toggleMuted();
  assert.equal(audio.currentVoice, null);
  assert.ok(audio.voices.every(track => track.paused));
  assert.equal(audio.playPasserby(), false);
});

test('failed voice playback restores music and permits future lines', async () => {
  const { audio, window } = setup();
  window.dispatchEvent(new Event('pointerdown'));
  await flush();
  audio.voices.forEach(voice => { voice.rejectNext = true; });
  audio.playPasserby();
  await flush();
  assert.equal(audio.currentVoice, null);
  assert.equal(audio.music.volume, 0.28);
});
