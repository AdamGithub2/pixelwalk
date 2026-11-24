globalThis.GameAudio = class GameAudio {
  constructor() {
    this.music = new Audio('./45.5 clean (Cover).mp3');
    this.steps = new Audio('./steps.wav');
    this.jumpSound = new Audio('./jump.wav');
    this.music.loop = true;
    this.steps.loop = true;
    this.jumpSound.loop = false;
    this.music.volume = 0.28;
    this.steps.volume = 0.5;
    this.jumpSound.volume = 0.6;
    this.tracks = [this.music, this.steps, this.jumpSound];
    this.tracks.forEach(track => { track.preload = 'auto'; });
    this.unlocked = false;
    this.muted = false;
    this.active = !document.hidden;
    this.walking = false;

    // Capture runs before the same gesture reaches the jump/touch controls.
    const unlock = () => {
      if (this.unlocked) return;
      this.unlocked = true;
      this.resume();
    };
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    window.addEventListener('blur', () => this.suspend());
    window.addEventListener('focus', () => { this.active = !document.hidden; this.resume(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.suspend();
      else { this.active = true; this.resume(); }
    });
  }

  play(track) {
    if (this.unlocked && this.active && !this.muted) {
      // A browser may deny playback until a user gesture; keep input responsive.
      const result = track.play();
      if (result) result.catch(() => {});
    }
  }

  stopSteps() {
    this.steps.pause();
    this.steps.currentTime = 0;
  }

  setWalking(walking, running = false) {
    this.steps.playbackRate = running ? 1.35 : 1;
    if (walking === this.walking) return;
    this.walking = walking;
    if (walking) this.play(this.steps);
    else this.stopSteps();
  }

  jump() {
    this.setWalking(false);
    this.jumpSound.currentTime = 0;
    this.play(this.jumpSound);
  }

  suspend() {
    this.active = false;
    this.tracks.forEach(track => track.pause());
    this.stopSteps();
    this.walking = false;
  }

  resume() {
    this.play(this.music);
    if (this.walking) this.play(this.steps);
  }

  toggleMuted() {
    this.muted = !this.muted;
    if (this.muted) this.tracks.forEach(track => track.pause());
    else this.resume();
    return this.muted;
  }
};
