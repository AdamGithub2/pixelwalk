/* The detailed indoor actor is independent of the street character sprites. */
globalThis.InteriorHero = class InteriorHero {
  constructor() {
    this.image = new Image();
    this.image.src = globalThis.INTERIOR_HERO_ASSETS.src;
    this.scene = null;
    this.time = 0;
    this.walkPhase = 0;
    this.moveSpeed = 0.095;
    // Fraction of the room width travelled over one full four-frame walk cycle.
    this.strideLength = 0.16;
    this.x = 0.10;
    this.targetX = 0.16;
    this.walking = false;
  }

  enter(scene) {
    if (this.scene === scene) return;
    this.scene = scene;
    this.time = 0;
    this.walkPhase = 0;
    this.x = 0.10;
    this.targetX = 0.16;
    this.walking = true;
  }

  walkTo(x) {
    if (!this.walking) this.walkPhase = 0;
    this.targetX = Math.max(0.10, Math.min(0.23, x));
    this.walking = Math.abs(this.targetX - this.x) > 0.001;
  }

  update(dt) {
    this.time += dt;
    const distance = this.targetX - this.x;
    if (!this.walking) return;
    const step = Math.min(Math.abs(distance), Math.max(0, dt) * this.moveSpeed);
    this.x += Math.sign(distance) * step;
    const frames = globalThis.INTERIOR_HERO_ASSETS.walk.length;
    this.walkPhase = (this.walkPhase + step / this.strideLength * frames) % frames;
    if (Math.abs(this.targetX - this.x) < 0.001) {
      this.x = this.targetX;
      this.walking = false;
      this.time = 0;
    }
  }

  draw(ctx, width, height, drawWidth, drawHeight) {
    if (!this.image.complete || !this.image.naturalWidth) return false;
    const asset = globalThis.INTERIOR_HERO_ASSETS;
    const frames = asset[this.walking ? 'walk' : 'idle'];
    const breath = this.time % 3.5;
    const index = this.walking ? Math.floor(this.walkPhase) % frames.length
      : breath < 1 ? 0 : breath < 2 ? 1 : breath < 3.38 ? 2 : 3;
    const frame = frames[index];
    const [sx, sy, sw, sh] = frame;
    const scale = drawHeight * 0.60 / asset.referenceHeight;
    const actorWidth = Math.round(sw * scale);
    const actorHeight = Math.round(sh * scale);
    const center = Math.round((width - drawWidth) / 2 + drawWidth * this.x);
    const feet = Math.round((height - drawHeight) / 2 + drawHeight * 0.92);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(12, 15, 14, 0.28)';
    ctx.fillRect(center - Math.round(actorWidth * 0.23), feet, Math.round(actorWidth * 0.46), Math.max(2, Math.round(drawHeight / 160)));
    // Every generated frame faces right and shares the same planted foot line.
    ctx.drawImage(this.image, sx, sy, sw, sh, center - Math.round(actorWidth / 2), feet - actorHeight, actorWidth, actorHeight);
    ctx.restore();
    return true;
  }
};
