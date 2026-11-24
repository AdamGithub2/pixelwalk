/* Ambient street characters. The bat is a prop; pedestrians never attack. */
const PEDESTRIAN_TYPES = Object.freeze({
  tracksuit: { speed: 23, fleeSpeed: 92, cadence: 6, fleeCadence: 10 },
  elderly: { speed: 11, fleeSpeed: 30, cadence: 3, fleeCadence: 5 },
  mother: { speed: 18, fleeSpeed: 46, stride: 24, frames: 8 },
  blonde: { speed: 21, fleeSpeed: 64, cadence: 5, fleeCadence: 8 }
});

globalThis.Pedestrians = class Pedestrians {
  constructor(engine) {
    this.engine = engine;
    this.sprites = new Map();
    this.atlas = null;
    this.downAtlas = null;
    this.civilianAtlases = new Map();
    this.ready = Promise.resolve(false);
    if (typeof Image !== 'undefined' && globalThis.PEDESTRIAN_ASSETS) {
      const load = (source, onLoad) => new Promise(resolve => {
        const atlas = new Image();
        atlas.onload = () => { onLoad(atlas); resolve(true); };
        atlas.onerror = () => { console.error('Nie udało się wczytać grafiki przechodniów.'); resolve(false); };
        atlas.src = source;
      });
      this.ready = Promise.all([
        load(globalThis.PEDESTRIAN_ASSETS.sheet, atlas => { this.atlas = atlas; }),
        load(globalThis.PEDESTRIAN_ASSETS.downSheet, atlas => { this.downAtlas = atlas; }),
        ...Object.entries(globalThis.PRL_PEDESTRIAN_ASSETS || {}).map(([type, asset]) =>
          load(asset.sheet, atlas => { this.civilianAtlases.set(type, atlas); }))
      ]).then(results => results.every(Boolean));
    }
    this.reset();
  }

  reset() {
    this.people = [];
    this.spawnTimer = 2;
    this.swing = null;
    this.nextId = 1;
    this.initialSpawn = true;
    this.voiceCooldown = 0;
    // Rotate through all four identities, avoiding long runs of the same NPC.
    this.spawnTypes = ['tracksuit', 'elderly', 'mother', 'blonde'];
    this.spawnTypeIndex = 0;
  }

  spawn(x, facing = -1, hasBat = Math.random() < 0.5, type = 'tracksuit') {
    if (!Object.hasOwn(PEDESTRIAN_TYPES, type)) type = 'tracksuit';
    const person = {
      id: this.nextId++, x, facing, type, hasBat: type === 'tracksuit' && hasBat, state: 'walk', hits: 0,
      age: 0, phase: Math.random() * 4, stun: 0, flash: 0, alert: 0, downTime: 0, hasSpoken: false,
      confrontDelay: 0, confrontFacing: facing, speechText: '', speechTimer: 0
    };
    this.people.push(person);
    return person;
  }

  beginAttack() {
    if (this.engine.building.active) return;
    this.swing = { elapsed: 0, hit: new Set(), facing: this.engine.player.facing };
  }

  update(dt) {
    const e = this.engine;
    this.voiceCooldown = Math.max(0, this.voiceCooldown - dt);
    // Street life continues through entrances and interiors; only combat stops.
    if (e.building.active) this.swing = null;
    this.spawnTimer -= dt;
    this.people = this.people.filter(person =>
      person.downTime < 14 && Math.abs(person.x - e.cameraX - 160) < 850
    );
    if (this.spawnTimer <= 0) {
      if (this.people.filter(person => person.state !== 'down').length < 3 && this.people.length < 6) {
        // The first passerby is visible; subsequent arrivals walk in from the edge.
        const fromRight = this.initialSpawn || e.cameraX < 90 || Math.random() < 0.65;
        const x = this.initialSpawn ? e.cameraX + 270 :
          (fromRight ? e.cameraX + e.virtualWidth + 35 : e.cameraX - 35);
        const type = this.spawnTypes[this.spawnTypeIndex++ % this.spawnTypes.length];
        this.spawn(Math.max(35, x), fromRight ? -1 : 1, Math.random() < 0.5, type);
        this.initialSpawn = false;
      }
      this.spawnTimer = 7 + Math.random() * 5;
    }

    if (this.swing) {
      if (e.player.currentAnim !== 'attack' || !e.player.isPlaying) this.swing = null;
      else {
        this.swing.elapsed += dt;
        // A short contact window aligned with the forward part of the attack.
        if (this.swing.elapsed >= 0.10 && this.swing.elapsed <= 0.28 && e.player.isGrounded) {
          const center = e.player.x + e.character.width / 2;
          for (const person of this.people) {
            const distance = (person.x - center) * this.swing.facing;
            if (person.state !== 'down' && distance >= -6 && distance <= 42 && !this.swing.hit.has(person.id)) {
              this.swing.hit.add(person.id);
              this.hit(person);
            }
          }
        }
        if (this.swing.elapsed > 0.28) this.swing = null;
      }
    }

    for (const person of this.people) {
      person.age += dt;
      person.flash = Math.max(0, person.flash - dt);
      person.alert = Math.max(0, person.alert - dt);
      if (person.speechTimer > 0) person.speechTimer = Math.max(0, person.speechTimer - dt);
      if (person.state === 'down') { person.downTime += dt; continue; }
      if (person.stun > 0) { person.stun -= dt; continue; }
      const fleeing = person.state === 'flee';
      const confronting = person.state === 'confront';
      const profile = PEDESTRIAN_TYPES[person.type];
      const previousX = person.x;
      const playerCenter = e.player.x + e.character.width / 2;
      const distToPlayer = Math.abs(person.x - playerCenter);

      if (confronting) {
        person.facing = person.x <= playerCenter ? 1 : -1;
        const playerMovedAway = distToPlayer > 44 || (Math.abs(e.player.vx ?? 0) > 0.1 && distToPlayer > 36);
        if (playerMovedAway || e.building.active) {
          person.confrontDelay = (person.confrontDelay || 0) + dt;
          if (person.confrontDelay >= 1.2 || e.building.active) {
            person.state = 'walk';
            person.facing = person.confrontFacing || person.facing;
            person.confrontDelay = 0;
          }
        } else {
          person.confrontDelay = 0;
        }
      } else {
        person.x += person.facing * (fleeing ? profile.fleeSpeed : profile.speed) * dt;
        if (person.x < 35) { person.x = 35; person.facing = 1; }
        // A foot cycle follows travelled distance, including changes of speed.
        person.phase += profile.stride
          ? Math.abs(person.x - previousX) / profile.stride * profile.frames
          : dt * (fleeing ? profile.fleeCadence : profile.cadence);
      }

      if (person.type === 'tracksuit' && !e.building.active && e.player.isGrounded && !fleeing && !person.hasSpoken &&
          this.voiceCooldown === 0 && distToPlayer <= 36 &&
          e.audio?.playPasserby()) {
        person.hasSpoken = true;
        this.voiceCooldown = 6;
        person.state = 'confront';
        person.confrontFacing = person.facing;
        person.facing = person.x <= playerCenter ? 1 : -1;
        person.confrontDelay = 0;
        person.speechText = e.audio?.lastVoiceLine || 'Masz jakiś problem?';
        person.speechTimer = 3.0;
      }
    }
  }

  hit(person) {
    const e = this.engine;
    person.hits++;
    person.flash = 0.16;
    person.stun = 0.27;
    person.facing = person.x >= e.player.x + e.character.width / 2 ? 1 : -1;
    person.state = person.hits >= 3 ? 'down' : 'flee';
    person.alert = 1.2;
    person.downTime = 0;
    person.speechTimer = 0;
    person.speechText = '';
    person.x = Math.max(35, person.x + person.facing * 4);
  }

  sprite(person) {
    if (person.type !== 'tracksuit') return this.civilianSprite(person);
    if (!this.atlas) return null;
    const asset = globalThis.PEDESTRIAN_ASSETS;
    const down = person.state === 'down';
    const confronting = person.state === 'confront';
    const frame = (down || confronting) ? 0 : Math.floor(person.phase) % asset.frames;
    const falling = down ? Math.min(4, Math.floor(person.downTime / 0.075)) : -1;
    if (falling === 4 && !this.downAtlas) return null;
    const row = (person.hasBat ? 2 : 0) + (person.state === 'flee' ? 1 : 0);
    const key = `${row}:${frame}:${falling}`;
    if (this.sprites.has(key)) return this.sprites.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = 100; canvas.height = 76;
    const c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    if (falling === 4) {
      c.drawImage(this.downAtlas,
        (person.hasBat ? 1 : 0) * asset.downFrameWidth, 0, asset.downFrameWidth, asset.downFrameHeight,
        0, 0, asset.downFrameWidth, asset.downFrameHeight);
      this.sprites.set(key, canvas);
      return canvas;
    }
    c.translate(34, down ? 54 - falling * 2 : 54);
    if (down) c.rotate(falling / 4 * Math.PI / 2);
    c.drawImage(this.atlas,
      frame * asset.frameWidth, row * asset.frameHeight, asset.frameWidth, asset.frameHeight,
      -asset.frameWidth / 2, -51, asset.frameWidth, asset.frameHeight);
    this.sprites.set(key, canvas);
    return canvas;
  }

  civilianSprite(person) {
    const atlas = this.civilianAtlases.get(person.type);
    const asset = globalThis.PRL_PEDESTRIAN_ASSETS?.[person.type];
    if (!atlas || !asset) return null;
    const down = person.state === 'down';
    const falling = down ? Math.min(4, Math.floor(person.downTime / 0.075)) : -1;
    const frame = down ? 0 : Math.floor(person.phase) % asset.frames;
    const row = asset.rows === 1 ? 0 : (person.state === 'flee' ? 1 : 0);
    const key = `${person.type}:${row}:${frame}:${falling}`;
    if (this.sprites.has(key)) return this.sprites.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = 100; canvas.height = 76;
    const c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.translate(34, down && person.type !== 'mother' ? 54 - falling * 2 : 54);
    // The pram and its passenger stay upright when the mother stops after a hit.
    if (down && person.type !== 'mother') c.rotate(falling / 4 * Math.PI / 2);
    if (asset.pramStartX != null) {
      // Animate the mother's legs independently of the rigid pram. The pram
      // always uses the same pixels and anchor so it cannot wobble backwards.
      const upper = asset.pramStartX;
      const lower = asset.pramLowerStartX;
      const split = asset.pramSplitY;
      c.translate(-asset.anchorX, -asset.footY);
      c.save();
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(upper, 0); c.lineTo(upper, split);
      c.lineTo(lower, split); c.lineTo(lower, asset.frameHeight);
      c.lineTo(0, asset.frameHeight); c.closePath(); c.clip();
      c.drawImage(atlas,
        frame * asset.frameWidth, 0, asset.frameWidth, asset.frameHeight,
        0, 0, asset.frameWidth, asset.frameHeight);
      c.restore();
      c.beginPath();
      c.moveTo(upper, 0); c.lineTo(asset.frameWidth, 0);
      c.lineTo(asset.frameWidth, asset.frameHeight); c.lineTo(lower, asset.frameHeight);
      c.lineTo(lower, split); c.lineTo(upper, split); c.closePath(); c.clip();
      c.drawImage(atlas,
        asset.pramFrame * asset.frameWidth, 0, asset.frameWidth, asset.frameHeight,
        0, 0, asset.frameWidth, asset.frameHeight);
    } else {
      c.drawImage(atlas,
        frame * asset.frameWidth, row * asset.frameHeight, asset.frameWidth, asset.frameHeight,
        -asset.anchorX, -asset.footY, asset.frameWidth, asset.frameHeight);
    }
    this.sprites.set(key, canvas);
    return canvas;
  }

  render(ctx) {
    const e = this.engine;
    if (e.building.state === 'inside') return;
    const feetY = e.getGroundLevel() + (e.character.footOffsetY ?? e.character.height - 2) + 5;
    const heightScale = Math.min(1, (e.character.footOffsetY ?? e.character.height - 2) / 51);
    for (const person of this.people) {
      const x = Math.round(person.x - e.cameraX);
      if (x < -80 || x > e.virtualWidth + 80) continue;
      const sprite = this.sprite(person);
      if (!sprite) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, 14 - person.downTime);
      ctx.fillStyle = '#10182055';
      ctx.fillRect(x - (person.state === 'down' ? 22 : 10), Math.round(feetY), person.state === 'down' ? 45 : 20, 2);
      ctx.translate(x, Math.round(feetY));
      ctx.scale(person.facing, 1);
      ctx.drawImage(sprite, Math.round(-34 * heightScale), Math.round(-54 * heightScale), Math.round(100 * heightScale), Math.round(76 * heightScale));
      ctx.restore();
      if (person.hits && person.state !== 'down') {
        ctx.fillStyle = '#1c2330'; ctx.fillRect(x - 8, feetY - 54 * heightScale, 17, 5);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i < person.hits ? '#e6b96c' : '#58677d';
          ctx.fillRect(x - 6 + i * 5, Math.round(feetY - 53 * heightScale), 3, 3);
        }
      }
      if (person.alert > 0 && person.state !== 'down') {
        ctx.fillStyle = '#ffe2a2';
        ctx.fillRect(x - 1, Math.round(feetY - 62 * heightScale), 2, 4);
        ctx.fillRect(x - 1, Math.round(feetY - 56 * heightScale), 2, 1);
      }
      if (person.flash > 0) {
        ctx.fillStyle = '#ffedbc';
        const y = Math.round(feetY - 30 * heightScale);
        ctx.fillRect(x - 6, y, 12, 2); ctx.fillRect(x - 1, y - 5, 2, 12);
      }
      if (person.speechTimer > 0 && person.speechText && person.state !== 'down' && person.state !== 'flee') {
        ctx.save();
        ctx.font = '6px monospace';
        const text = person.speechText;
        const textWidth = ctx.measureText(text).width;
        const bubbleW = Math.round(textWidth + 8);
        const bubbleH = 11;
        const bubbleX = Math.round(Math.max(4, Math.min(e.virtualWidth - bubbleW - 4, x - bubbleW / 2)));
        const bubbleY = Math.round(feetY - 68 * heightScale);

        ctx.fillStyle = '#0f141c';
        ctx.fillRect(bubbleX - 1, bubbleY - 1, bubbleW + 2, bubbleH + 2);
        ctx.fillStyle = '#fff4db';
        ctx.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);

        ctx.fillStyle = '#fff4db';
        ctx.fillRect(x - 1, bubbleY + bubbleH, 3, 2);
        ctx.fillStyle = '#0f141c';
        ctx.fillRect(x - 2, bubbleY + bubbleH + 2, 2, 1);

        ctx.fillStyle = '#1c2330';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, bubbleX + 4, bubbleY + bubbleH / 2 + 0.5);
        ctx.restore();
      }
    }
  }
};
