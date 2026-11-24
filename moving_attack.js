/* Keep the footstep cycle independent of the punch animation. */
globalThis.MovingAttackAnimation = class MovingAttackAnimation {
  constructor() {
    this.phase = 0;
    this.canvas = null;
  }

  update(engine, dt, moved) {
    const p = engine.player;
    if (!p.isGrounded || !p.isPlaying || !moved) return;
    const running = Boolean(engine.keys.ShiftLeft || engine.keys.ShiftRight);
    const gait = running ? 'run' : 'walk';
    const frames = engine.character.animations[gait];
    if (!frames?.length) return;
    const fps = running ? 13 : 9;
    this.phase = (this.phase + dt * fps) % frames.length;
    if (p.currentAnim === gait) {
      p.frameIndex = Math.floor(this.phase);
      p.frameTimer = (this.phase % 1) / fps;
    }
  }

  frame(engine, attackFrame) {
    const p = engine.player;
    if (p.currentAnim !== 'attack' || !p.isGrounded || !p.isPlaying || Math.abs(p.vx) < 0.1) return attackFrame;
    const character = engine.character;
    const gait = engine.keys.ShiftLeft || engine.keys.ShiftRight ? 'run' : 'walk';
    const legs = character.animations[gait]?.[Math.floor(this.phase)];
    if (!legs || !attackFrame) return attackFrame;
    this.canvas ??= document.createElement('canvas');
    if (this.canvas.width !== character.width || this.canvas.height !== character.height) {
      this.canvas.width = character.width;
      this.canvas.height = character.height;
    }
    const ctx = this.canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // The HD hero's waist is at row 34; the procedural skins have shorter legs.
    const waist = character.width === 48 && character.currentSkin === 'urban_hero'
      ? 34 : (character.footOffsetY ?? character.height - 2) - 8;
    ctx.save();
    // Backpedalling reverses only the legs, keeping the punch facing its target.
    if (Math.sign(p.vx) !== p.facing) {
      ctx.translate(character.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(legs, 0, waist, character.width, character.height - waist,
      0, waist, character.width, character.height - waist);
    ctx.restore();
    ctx.drawImage(attackFrame, 0, 0, character.width, waist, 0, 0, character.width, waist);
    return this.canvas;
  }
};
