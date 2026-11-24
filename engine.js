import './pedestrian_assets.js';
import './pedestrians.js';
import './entry_assets.js';
import './location_dialogues.js';
import './building_interaction.js';
import './game_audio.js';
import './moving_attack.js';
/**
 * PIXEL ART ANIMATION ENGINE & COMPOSITOR
 * 
 * Odpowiada za:
 * - Precyzyjny integer blitting (bez ułamkowych pikseli i bez antyaliasingu)
 * - Maszynę stanów animacji postaci (Idle, Walk, Run, Attack, Jump, Special)
 * - Onion Skinning (podgląd poprzedniej klatki - przydatne dla animatora)
 * - Skalowanie wirtualnego bufora 320x180 na ekran z zachowaniem ostrości (crisp-edges)
 */

import { PixelCharacter } from './character_sprites.js';
import { PixelBackground } from './background_generator.js';

export class AnimationEngine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    // Wirtualna rozdzielczość retro (16:9 pixel-perfect)
    this.virtualWidth = 320;
    this.virtualHeight = 180;

    // Bufor pomocniczy (Offscreen / Virtual Canvas)
    this.buffer = document.createElement('canvas');
    this.buffer.width = this.virtualWidth;
    this.buffer.height = this.virtualHeight;
    this.bctx = this.buffer.getContext('2d', { willReadFrequently: true });

    // Wyłączenie jakiegokolwiek wygładzania obrazu
    this.ctx.imageSmoothingEnabled = false;
    this.bctx.imageSmoothingEnabled = false;

    // Moduły
    this.character = new PixelCharacter();
    this.background = new PixelBackground(this.virtualWidth, this.virtualHeight);
    this.audio = new globalThis.GameAudio();

    // Stan postaci
    this.player = {
      x: 55,             // Początkowa pozycja na ulicy przy barierce
      y: 112,            // 142 (podłoga) - 30 (wysokość stóp)
      vx: 0,
      vy: 0,
      facing: 1,         // 1 = w prawo, -1 = w lewo
      isGrounded: true,
      currentAnim: 'idle',
      frameIndex: 0,
      frameTimer: 0,
      fps: 10,           // Domyślna szybkość klatek
      isPlaying: true,
      loop: true,
      onionSkin: false,
      prevFrameCanvas: null
    };

    // Kamera
    this.cameraX = 0;

    // Klawisze i wejście
    this.keys = {};
    this.building = new globalThis.BuildingInteraction(this);
    this.pedestrians = new globalThis.Pedestrians(this);
    this.movingAttack = new globalThis.MovingAttackAnimation();
    this.initInput();

    // Czas i pętla gry
    this.lastTime = performance.now();
    this.timeCounter = 0;

    // Tryb demonstracyjny (postać sama wykonuje sekwencję ruchów)
    this.demoMode = false;
    this.demoTimer = 0;

    // Callbacki do powiadamiania UI o zmianie klatek
    this.onFrameChange = null;
    this.onStateChange = null;

    // Uruchomienie pętli
    this.loop = this.loop.bind(this);
    this.ready = this.setLevel('prl');
    const start = () => {
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop);
    };
    this.ready.then(start, start);
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      if (this.building.handleKey(e)) return;
      this.keys[e.code] = true;

      // Klawisze bezpośredniego przełączania animacji (dla szybkiego testu)
      if (e.code === 'Digit1') this.setAnimation('idle');
      if (e.code === 'Digit2') this.setAnimation('walk');
      if (e.code === 'Digit3') this.setAnimation('run');
      if (e.code === 'Digit4') this.setAnimation('attack', false);
      if (e.code === 'Digit5') this.setAnimation('jump');
      if (e.code === 'Digit6') this.setAnimation('special', false);

      // Spacja = skok
      if (e.code === 'Space' && this.player.isGrounded) {
        this.jump();
      }
      // F lub J = atak kataną
      if ((e.code === 'KeyF' || e.code === 'KeyJ') && this.player.currentAnim !== 'attack') {
        this.triggerAttack();
      }
      // E lub K = specjalny impuls
      if ((e.code === 'KeyE' || e.code === 'KeyK') && this.player.currentAnim !== 'special') {
        this.triggerSpecial();
      }
    });

    window.addEventListener('blur', () => { this.keys = {}; });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setAnimation(animName, loop = true) {
    if (!this.character.animations[animName]) return;
    if (this.player.currentAnim === animName && this.player.isPlaying) return;

    if (animName === 'attack') this.pedestrians.beginAttack();
    this.player.currentAnim = animName;
    this.player.frameIndex = 0;
    this.player.frameTimer = 0;
    this.player.loop = loop;
    this.player.isPlaying = true;

    // Dobór naturalnej prędkości klatek w zależności od akcji
    if (animName === 'idle') this.player.fps = 7;
    else if (animName === 'walk') this.player.fps = 9;
    else if (animName === 'run') this.player.fps = 13;
    else if (animName === 'attack') this.player.fps = 11;
    else if (animName === 'jump') this.player.fps = 8;
    else if (animName === 'special') this.player.fps = 9;

    if (this.onStateChange) this.onStateChange(animName);
  }

  getGroundLevel() {
    if (this.background.level === 'prl') {
      const feetY = this.character.footOffsetY ?? (this.character.height - 2);
      return this.background.prlBackground.walkingLineY - feetY;
    }
    return 112;
  }

  async setLevel(level) {
    if (this.building?.active) this.building.reset();
    const previousGround = this.getGroundLevel();
    await this.background.setLevel(level);
    this.pedestrians.reset();
    // Preserve the current jump height when changing scenery in mid-air.
    this.player.y += this.getGroundLevel() - previousGround;
  }

  triggerAttack() {
    if (this.building.active) return;
    this.setAnimation('attack', false);
  }

  triggerSpecial() {
    if (this.building.active) return;
    this.setAnimation('special', false);
  }

  jump() {
    if (this.building.active) return;
    if (this.player.isGrounded) {
      this.audio.jump();
      this.player.vy = -4.5;
      this.player.isGrounded = false;
      this.setAnimation('jump', false);
      this.player.frameIndex = 1;
      this.player.frameTimer = 0;
    }
  }

  // Ręczne sterowanie odtwarzaniem klatka po klatce
  setFPS(fps) {
    this.player.fps = Math.max(1, Math.min(30, fps));
  }

  stepNext() {
    const frames = this.character.animations[this.player.currentAnim];
    if (!frames) return;
    this.player.frameIndex = (this.player.frameIndex + 1) % frames.length;
    if (this.onFrameChange) this.onFrameChange(this.player.frameIndex, frames.length);
  }

  stepPrev() {
    const frames = this.character.animations[this.player.currentAnim];
    if (!frames) return;
    this.player.frameIndex = (this.player.frameIndex - 1 + frames.length) % frames.length;
    if (this.onFrameChange) this.onFrameChange(this.player.frameIndex, frames.length);
  }

  togglePlayPause() {
    this.player.isPlaying = !this.player.isPlaying;
    return this.player.isPlaying;
  }

  toggleOnionSkin() {
    this.player.onionSkin = !this.player.onionSkin;
    return this.player.onionSkin;
  }

  // --- AKTUALIZACJA LOGIKI I FIZYKI ---
  update(dt) {
    if (this.building.update(dt)) {
      this.pedestrians.update(dt);
      return;
    }
    const previousX = this.player.x;
    this.timeCounter += dt;

    // Tryb demonstracyjny
    if (this.demoMode) {
      this.updateDemo(dt);
    } else {
      this.updatePlayerMovement(dt);
    }

    this.pedestrians.update(dt);

    // Aktualizacja klatek animacji postaci
    if (this.player.isPlaying && !(this.player.currentAnim === 'jump' && !this.player.isGrounded)) {
      const frames = this.character.animations[this.player.currentAnim];
      const frameDuration = 1 / this.player.fps;
      this.player.frameTimer += dt;

      if (this.player.frameTimer >= frameDuration) {
        this.player.frameTimer -= frameDuration;

        // Zapamiętaj poprzednią klatkę do Onion Skinning
        this.player.prevFrameCanvas = frames[this.player.frameIndex];

        if (this.player.frameIndex < frames.length - 1) {
          this.player.frameIndex++;
        } else {
          if (this.player.loop) {
            this.player.frameIndex = 0;
          } else {
            // Animacja jednorazowa zakończona (np. atak) -> powrót do idle lub walk
            if (this.player.isGrounded) {
              if (Math.abs(this.player.vx) > 0.1) {
                this.setAnimation((this.keys['ShiftLeft'] || this.keys['ShiftRight']) ? 'run' : 'walk');
              } else {
                this.setAnimation('idle');
              }
            }
          }
        }

        if (this.onFrameChange) {
          this.onFrameChange(this.player.frameIndex, frames.length);
        }
      }
    }

    this.movingAttack.update(this, dt, this.player.x !== previousX);
    // Płynne podążanie kamery za postacią (kamera NIGDY nie zjeżdża poniżej 0)
    this.audio.setWalking(
      this.player.isGrounded && this.player.isPlaying && this.player.x !== previousX &&
      ['walk', 'run', 'attack'].includes(this.player.currentAnim),
      Boolean(this.keys['ShiftLeft'] || this.keys['ShiftRight'])
    );
    const targetCamX = Math.max(0, this.player.x - 120);
    this.cameraX += (targetCamX - this.cameraX) * 0.08;
    if (this.cameraX < 0) this.cameraX = 0;
  }

  updatePlayerMovement(dt) {
    const isAttacking = this.player.currentAnim === 'attack';
    const canMove = this.player.currentAnim !== 'special';

    const isRunning = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const speed = isRunning ? 2.4 : 1.2;

    let moveX = 0;
    if (canMove) {
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
        moveX -= 1;
        if (!isAttacking) this.player.facing = -1;
      }
      if (this.keys['KeyD'] || this.keys['ArrowRight']) {
        moveX += 1;
        if (!isAttacking) this.player.facing = 1;
      }
    }

    // Ruch w poziomie z blokadą wyjścia w lewo poza początek ulicy
    this.player.vx = moveX * speed;
    this.player.x += this.player.vx * dt * 60;

    const minPlayerX = 26;
    if (this.player.x < minPlayerX) {
      this.player.x = minPlayerX;
      this.player.vx = 0;
    }

    // Grawitacja i ruch w pionie
    if (!this.player.isGrounded) {
      this.player.vy += 0.22; // Grawitacja pixelowa
      this.player.y += this.player.vy;

      // Hold the same bent-knee pose throughout flight.
      if (this.player.currentAnim === 'jump') {
        this.player.frameIndex = 1;
      }

      // Lądowanie na platformie
      const groundLevel = this.getGroundLevel(); // 142 podłoga - 30 wysokość stóp
      if (this.player.y >= groundLevel) {
        this.player.y = groundLevel;
        this.player.vy = 0;
        this.player.isGrounded = true;

        // Klatka lądowania
        if (this.player.currentAnim === 'jump') {
          this.player.frameIndex = 3;
          setTimeout(() => {
            if (this.player.isGrounded && !['attack', 'special'].includes(this.player.currentAnim)) {
              this.setAnimation(Math.abs(this.player.vx) > 0.1 ? (isRunning ? 'run' : 'walk') : 'idle');
            }
          }, 120);
        }
      }
    }

    // Automatyczny dobór animacji chodu/biegu/idle gdy jesteśmy na ziemi
    if (this.player.isGrounded && canMove && !isAttacking) {
      if (Math.abs(this.player.vx) > 0.1) {
        const desiredAnim = isRunning ? 'run' : 'walk';
        if (this.player.currentAnim !== desiredAnim) {
          this.setAnimation(desiredAnim);
        }
      } else {
        if (this.player.currentAnim !== 'idle' && this.player.currentAnim !== 'jump') {
          this.setAnimation('idle');
        }
      }
    }
  }

  updateDemo(dt) {
    this.demoTimer += dt;
    // Pętla demo: postać idzie w prawo, biegnie, tnie kataną, skacze, idzie w lewo
    const phase = Math.floor(this.demoTimer % 14);

    if (phase < 3) {
      this.player.facing = 1;
      this.player.x += 1.2;
      if (this.player.currentAnim !== 'walk') this.setAnimation('walk');
    } else if (phase < 6) {
      this.player.facing = 1;
      this.player.x += 2.2;
      if (this.player.currentAnim !== 'run') this.setAnimation('run');
    } else if (phase < 8) {
      if (this.player.currentAnim !== 'attack') this.triggerAttack();
    } else if (phase < 10) {
      if (this.player.isGrounded && this.player.currentAnim !== 'jump') {
        this.jump();
      }
    } else if (phase < 12) {
      this.player.facing = -1;
      this.player.x = Math.max(30, this.player.x - 1.8);
      if (this.player.currentAnim !== 'walk') this.setAnimation('walk');
    } else {
      if (this.player.currentAnim !== 'special') this.triggerSpecial();
    }
  }

  // --- RENDEROWANIE PIXEL-PERFECT ---
  render() {
    if (this.building.state === 'inside') {
      this.building.drawInterior(this.ctx, this.canvas.width, this.canvas.height);
      return;
    }
    const bctx = this.bctx;

    // 1. Czyszczenie bufora wirtualnego
    bctx.fillStyle = '#050512';
    bctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    // 2. Renderowanie wielowarstwowego tła
    this.background.render(bctx, this.cameraX, this.timeCounter);
    this.building.renderBehindPlayer(bctx);
    this.pedestrians.render(bctx);

    // 3. Pozycja postaci na ekranie (ZAWSZE zaokrąglona do liczby całkowitej!)
    const screenX = Math.round(this.player.x - this.cameraX);
    const screenY = Math.round(this.player.y);

    const currentFrames = this.character.animations[this.player.currentAnim];
    const currentFrame = this.movingAttack.frame(this, currentFrames?.[this.player.frameIndex]);

    if (currentFrame && !['entering', 'inside'].includes(this.building.state)) {
      // 4. ONION SKINNING (jeśli włączony - pokazuje widmo poprzedniej klatki w kolorze cyan)
      if (this.player.onionSkin && this.player.prevFrameCanvas) {
        bctx.save();
        bctx.globalAlpha = 0.35;
        this.blitFrame(bctx, this.player.prevFrameCanvas, screenX - (this.player.facing * 2), screenY, this.player.facing);
        bctx.restore();
      }

      // 5. NAKŁADANIE WŁAŚCIWEJ KLATKI POSTACI (BLITTING)
      this.blitFrame(bctx, currentFrame, screenX, screenY, this.player.facing);
    }

    // 6. Przeskalowanie bufora 320x180 na główny Canvas użytkownika z zachowaniem crisp-edges
    this.building.render(bctx);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(
      this.buffer,
      0, 0, this.virtualWidth, this.virtualHeight,
      0, 0, this.canvas.width, this.canvas.height
    );
  }

  /**
   * Kluczowa metoda nakładania klatki rastrowej (Blitting)
   * Bez antyaliasingu, bez rozmycia krawędzi, z odbiciem lustrzanym w całościowych pikselach
   */
  blitFrame(ctx, frameCanvas, x, y, facing) {
    ctx.save();
    if (facing === 1) {
      // Rysowanie w prawo - bezpośredni zrzut pikseli
      ctx.drawImage(frameCanvas, x, y);
    } else {
      // Odbicie w lewo - transformacja na całych pikselach (round)
      ctx.translate(x + this.character.width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(frameCanvas, 0, 0);
    }
    ctx.restore();
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  }
}
