import './prl_assets.js';
import './prl_background.js';
/**
 * ZAJEBISTE WIELOWARSTWOWE TŁO PIXEL ART (320x180 Virtual Resolution)
 * 
 * Bezwzględnie płynne, nieskończone zapętlenie (Zero szwów, Zero nagłych przeskoków):
 * 1. Tło zmierzchu (640x180): Ping-Pong Mirrored Loop (320px normalne + 320px lustrzane) -> 100% brak szwów
 * 2. Druga warstwa (Wieżowce): Sekwencja 1..7 wprost + 6..2 w odbiciu lustrzanym -> płynna nieskończona panorama
 * 3. Pierwsza warstwa (Kamienice): Sekwencja 1..10 wprost + 9..2 w odbiciu lustrzanym -> brak powtórzeń i płynne łączenie
 * 4. Pierwszy plan: Ciągły chodnik z kałużami, barierka końcowa po lewej (x=0..25) i blokada wyjścia gracza poza scenę
 */

import { BUILDINGS_DATA } from './buildings_data.js';
import { SKYSCRAPERS_DATA } from './skyscrapers_data.js';
import { DUSK_CITY_BG } from './dusk_city_data.js';

export class PixelBackground {
  constructor(width = 320, height = 180) {
    this.width = width;
    this.height = height;
    this.level = 'city';
    this.prlBackground = new globalThis.PrlBackground(width, height);

    this.skyCanvas = document.createElement('canvas');
    this.farSkylineCanvas = document.createElement('canvas');
    this.midCityCanvas = document.createElement('canvas');
    this.foregroundCanvas = document.createElement('canvas');

    // Stałe szerokości buforów dla bezszwowego zapętlenia (raz ustalone w konstruktorze)
    this.farSkylineLoopWidth = 845;
    this.midCityLoopWidth = 1329;
    this.foregroundLoopWidth = 640;
    this.duskLoopWidth = 640;

    this.farSkylineCanvas.width = this.farSkylineLoopWidth;
    this.farSkylineCanvas.height = this.height;

    this.midCityCanvas.width = this.midCityLoopWidth;
    this.midCityCanvas.height = this.height;

    this.foregroundCanvas.width = this.foregroundLoopWidth;
    this.foregroundCanvas.height = this.height;

    this.skyCanvas.width = this.width * 2;
    this.skyCanvas.height = this.height;

    [this.skyCanvas, this.farSkylineCanvas, this.midCityCanvas, this.foregroundCanvas].forEach(c => {
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
    });

    this.stars = [];
    this.smokeParticles = [];
    this.buildingImages = [];
    this.skyscraperImages = [];

    this.midCityDrawn = false;
    this.farSkylineDrawn = false;

    // Tło zmierzchu (zabezpieczone 640x180 Ping-Pong)
    this.duskCityImg = new Image();
    this.duskCityLoaded = false;
    this.duskCityImg.onload = () => {
      this.duskCityLoaded = true;
    };
    this.duskCityImg.src = DUSK_CITY_BG;

    this.initWorld();
    this.loadAllSprites();
  }

  p(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  loadAllSprites() {
    const bKeys = Object.keys(BUILDINGS_DATA);
    let bLoaded = 0;
    bKeys.forEach(k => {
      const img = new Image();
      img.onload = () => {
        bLoaded++;
        if (bLoaded === bKeys.length) {
          this.generateMidCity();
          this.midCityDrawn = true;
        }
      };
      img.src = BUILDINGS_DATA[k];
      this.buildingImages.push(img);
    });

    const sKeys = Object.keys(SKYSCRAPERS_DATA);
    let sLoaded = 0;
    sKeys.forEach(k => {
      const img = new Image();
      img.onload = () => {
        sLoaded++;
        if (sLoaded === sKeys.length) {
          this.generateFarSkyline();
          this.farSkylineDrawn = true;
        }
      };
      img.src = SKYSCRAPERS_DATA[k];
      this.skyscraperImages.push(img);
    });
  }

  initWorld() {
    this.generateFarSkyline();
    this.generateMidCity();
    this.generateForeground();

    // Mrugające gwiazdy na niebie
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * 640),
        y: Math.floor(Math.random() * 75),
        brightness: Math.random(),
        speed: 0.5 + Math.random() * 1.5
      });
    }

    // Dym z kominów
    for (let i = 0; i < 22; i++) {
      this.smokeParticles.push({
        x: Math.random() * this.midCityLoopWidth,
        y: 65 + Math.random() * 10,
        vy: -0.2 - Math.random() * 0.25,
        vx: 0.15 + Math.random() * 0.1,
        life: Math.random() * 40,
        maxLife: 35 + Math.random() * 30
      });
    }
  }

  // --- 2. DRUGA WARSTWA: WIEŻOWCE W PĘTLI PING-PONG (1..7 wprost, 6..2 w odbiciu) ---
  generateFarSkyline() {
    const ctx = this.farSkylineCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.farSkylineCanvas.width, this.height);

    if (this.skyscraperImages && this.skyscraperImages.length >= 7) {
      const skySeq = [
        { idx: 0, flip: false },
        { idx: 1, flip: false },
        { idx: 2, flip: false },
        { idx: 3, flip: false },
        { idx: 4, flip: false },
        { idx: 5, flip: false },
        { idx: 6, flip: false },
        { idx: 5, flip: true },
        { idx: 4, flip: true },
        { idx: 3, flip: true },
        { idx: 2, flip: true },
        { idx: 1, flip: true }
      ];

      let curX = 0;
      skySeq.forEach(item => {
        const sImg = this.skyscraperImages[item.idx];
        if (sImg && (sImg.complete || sImg.naturalWidth > 0)) {
          const sy = 142 - sImg.height;

          ctx.save();
          ctx.globalAlpha = 0.95;
          if (item.flip) {
            ctx.translate(Math.round(curX + sImg.width), Math.round(sy));
            ctx.scale(-1, 1);
            ctx.drawImage(sImg, 0, 0);
          } else {
            ctx.drawImage(sImg, Math.round(curX), Math.round(sy));
          }
          ctx.restore();

          curX += sImg.width + 16;
        }
      });
      this.farSkylineDrawn = true;
    } else {
      for (let x = 0; x < this.farSkylineCanvas.width; x += 45) {
        this.p(ctx, x, 30, 38, 112, '#1e1433');
      }
    }
  }

  // --- 3. PIERWSZA WARSTWA: 10 KAMIENIC W PĘTLI PING-PONG (1..10 wprost, 9..2 w odbiciu) ---
  generateMidCity() {
    const ctx = this.midCityCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.midCityCanvas.width, this.height);

    // Kable telegraficzne łączące dachy w pętli
    for (let cx = 0; cx < this.midCityCanvas.width; cx += 80) {
      const y1 = 68 + Math.round(Math.sin(cx) * 5);
      const y2 = 70 + Math.round(Math.cos(cx) * 5);
      for (let x = 0; x < 80; x++) {
        const t = x / 80;
        const sag = Math.sin(t * Math.PI) * 6;
        const cy = Math.round(y1 + (y2 - y1) * t + sag);
        this.p(ctx, cx + x, cy, 1, 1, '#1b1424');
      }
    }

    if (this.buildingImages && this.buildingImages.length >= 10) {
      const bSeq = [
        { idx: 0, flip: false },
        { idx: 1, flip: false },
        { idx: 2, flip: false },
        { idx: 3, flip: false },
        { idx: 4, flip: false },
        { idx: 5, flip: false },
        { idx: 6, flip: false },
        { idx: 7, flip: false },
        { idx: 8, flip: false },
        { idx: 9, flip: false },
        { idx: 8, flip: true },
        { idx: 7, flip: true },
        { idx: 6, flip: true },
        { idx: 5, flip: true },
        { idx: 4, flip: true },
        { idx: 3, flip: true },
        { idx: 2, flip: true },
        { idx: 1, flip: true }
      ];

      let curX = 0;
      bSeq.forEach(item => {
        const bImg = this.buildingImages[item.idx];
        if (bImg && (bImg.complete || bImg.naturalWidth > 0)) {
          const by = 142 - bImg.height;

          ctx.save();
          if (item.flip) {
            ctx.translate(Math.round(curX + bImg.width), Math.round(by));
            ctx.scale(-1, 1);
            ctx.drawImage(bImg, 0, 0);
          } else {
            ctx.drawImage(bImg, Math.round(curX), Math.round(by));
          }
          ctx.restore();

          curX += bImg.width - 8;
        }
      });
      this.midCityDrawn = true;
    } else {
      let curX = 0;
      while (curX < this.midCityCanvas.width) {
        this.p(ctx, curX, 72, 50, 70, '#2b2238');
        curX += 54;
      }
    }
  }

  // --- 4. PIERWSZY PLAN: CHODNIK, KAŁUŻE, BARIERKA NA POCZĄTKU ULICY (x=0..25) ---
  generateForeground() {
    const ctx = this.foregroundCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const w = this.foregroundLoopWidth;
    const groundY = 142;

    this.p(ctx, 0, groundY, w, 38, '#141221');
    this.p(ctx, 0, groundY, w, 2, '#4d3b63');

    for (let x = 0; x < w; x += 24) {
      this.p(ctx, x, groundY + 2, 1, 36, '#1f1a30');
      this.p(ctx, x + 2, groundY + 4, 2, 2, '#382a47');
    }

    for (let x = 0; x < w; x += 14) {
      this.p(ctx, x, groundY + 2, 7, 2, '#f5b042');
      this.p(ctx, x + 7, groundY + 2, 7, 2, '#181326');
    }

    this.p(ctx, 0, groundY - 14, w, 2, '#4a3b5c');
    this.p(ctx, 0, groundY - 7, w, 1, '#2c223b');
    for (let x = 0; x < w; x += 16) {
      this.p(ctx, x, groundY - 14, 2, 14, '#2c223b');
      this.p(ctx, x, groundY - 15, 2, 1, '#664e7a');
    }

    // Zapora uliczna na początku ulicy po lewej (x=0..25)
    this.p(ctx, 4, groundY - 32, 6, 32, '#1a1829');
    this.p(ctx, 3, groundY - 34, 8, 3, '#ffcc00');
    this.p(ctx, 16, groundY - 26, 4, 26, '#1a1829');
    this.p(ctx, 4, groundY - 24, 16, 5, '#e63946');
    this.p(ctx, 4, groundY - 14, 16, 5, '#ffffff');
    this.p(ctx, 5, groundY - 36, 4, 3, '#ff0055');

    [80, 240, 400, 560].forEach(lx => {
      this.p(ctx, lx, groundY - 38, 2, 38, '#261f36');
      this.p(ctx, lx - 2, groundY - 40, 10, 3, '#3d3052');
      this.p(ctx, lx + 2, groundY - 38, 5, 4, '#fff0c2');
      this.p(ctx, lx + 3, groundY - 37, 3, 2, '#ffffff');

      for (let gy = 0; gy < 8; gy++) {
        const spread = gy * 4;
        this.p(ctx, lx - spread + 4, groundY + 12 + gy * 2, spread * 2, 2, `rgba(255, 218, 148, ${0.12 - gy * 0.012})`);
      }
    });

    const reflections = [
      { x: 45, w: 45, col: '#ffb266' },
      { x: 130, w: 70, col: '#f7ceb0' },
      { x: 220, w: 50, col: '#ff944d' },
      { x: 340, w: 60, col: '#fce2c2' },
      { x: 450, w: 70, col: '#f7ceb0' },
      { x: 540, w: 55, col: '#ffb266' }
    ];

    reflections.forEach(rf => {
      const py = groundY + 12;
      this.p(ctx, rf.x, py, rf.w, 9, '#090812');
      for (let y = py + 1; y < py + 8; y++) {
        if (y % 2 === 0) {
          this.p(ctx, rf.x + 3, y, rf.w - 6, 1, rf.col);
        }
      }
      this.p(ctx, rf.x - 1, py + 3, 2, 2, '#48355c');
      this.p(ctx, rf.x + rf.w - 1, py + 3, 2, 2, '#48355c');
    });

    const catX = 148;
    const catY = groundY - 20;
    this.p(ctx, catX, catY, 7, 6, '#0f0c1a');
    this.p(ctx, catX + 5, catY - 3, 4, 4, '#0f0c1a');
    this.p(ctx, catX + 5, catY - 5, 1, 2, '#0f0c1a');
    this.p(ctx, catX + 8, catY - 5, 1, 2, '#0f0c1a');
    this.p(ctx, catX + 7, catY - 2, 1, 1, '#ffeb3b');
    this.p(ctx, catX + 1, catY + 5, 2, 2, '#0f0c1a');
    this.p(ctx, catX + 5, catY + 5, 2, 2, '#0f0c1a');
  }

  // --- RENDEROWANIE Z BEZSZWOWYM ZAPĘTLENIEM PARALLAXU ---
  async setLevel(level) {
    if (level !== 'city' && level !== 'prl') throw new Error('Nieznany poziom');
    if (level === 'prl') await this.prlBackground.load();
    this.level = level;
  }

  render(targetCtx, cameraX = 0, time = 0) {
    if (this.level === 'prl') {
      this.prlBackground.render(targetCtx, cameraX);
      return;
    }

    targetCtx.imageSmoothingEnabled = false;

    // Gwarancja: cameraX nigdy nie jest ujemny
    const camX = Math.max(0, cameraX);

    // Dynamiczne domalowanie budynków, jeśli obrazy załadowały się po starcie pętli
    if (!this.midCityDrawn && this.buildingImages.length >= 10 && this.buildingImages.every(img => img.complete && img.naturalWidth > 0)) {
      this.generateMidCity();
    }
    if (!this.farSkylineDrawn && this.skyscraperImages.length >= 7 && this.skyscraperImages.every(img => img.complete && img.naturalWidth > 0)) {
      this.generateFarSkyline();
    }

    // 1. TŁO: Obraz "Pixelowe miasto o zmierzchu.png" (Ping-Pong Mirrored Loop 640px)
    if (this.duskCityLoaded || (this.duskCityImg.complete && this.duskCityImg.naturalWidth > 0)) {
      const dLoop = this.duskLoopWidth; // 640
      const dOffset = Math.floor((camX * 0.08) % dLoop);
      targetCtx.drawImage(this.duskCityImg, -dOffset, 0);
      if (dOffset > dLoop - this.width) {
        targetCtx.drawImage(this.duskCityImg, dLoop - dOffset, 0);
      }
    } else {
      targetCtx.fillStyle = '#17152c';
      targetCtx.fillRect(0, 0, this.width, this.height);
    }

    // Gwiazdy
    this.stars.forEach(s => {
      const sx = Math.floor((s.x - camX * 0.04) % 640);
      const renderX = (sx + 640) % 640;
      if (renderX < this.width) {
        const twinkle = Math.sin(time * s.speed + s.brightness * 10);
        if (twinkle > 0.35) {
          this.p(targetCtx, renderX, s.y, 1, 1, '#ffffff');
        }
      }
    });

    // 2. DRUGA WARSTWA: Wielkie wieżowce neonowe (Pętla Ping-Pong)
    const sLoop = this.farSkylineLoopWidth || 845;
    const sOffset = Math.floor((camX * 0.20) % sLoop);
    targetCtx.drawImage(this.farSkylineCanvas, -sOffset, 0);
    if (sOffset > sLoop - this.width) {
      targetCtx.drawImage(this.farSkylineCanvas, sLoop - sOffset, 0);
    }

    // 3. PIERWSZA WARSTWA: Kamienice i bloki (Pętla Ping-Pong)
    const bLoop = this.midCityLoopWidth || 1329;
    const bOffset = Math.floor((camX * 0.45) % bLoop);
    targetCtx.drawImage(this.midCityCanvas, -bOffset, 0);
    if (bOffset > bLoop - this.width) {
      targetCtx.drawImage(this.midCityCanvas, bLoop - bOffset, 0);
    }

    // Dym z kominów
    this.smokeParticles.forEach(sp => {
      sp.y += sp.vy;
      sp.x += sp.vx;
      sp.life++;
      if (sp.life > sp.maxLife || sp.y < 35) {
        sp.y = 65 + Math.random() * 5;
        sp.x = (camX * 0.45) + Math.random() * 320;
        sp.life = 0;
      }
      const px = Math.floor(sp.x - camX * 0.45);
      if (px >= 0 && px < this.width) {
        const alpha = Math.max(0, 1 - sp.life / sp.maxLife);
        const col = alpha > 0.6 ? '#6e4f73' : (alpha > 0.3 ? '#452e4a' : '#231526');
        this.p(targetCtx, px, Math.floor(sp.y), 2, 2, col);
      }
    });

    // 4. CZWARTA WARSTWA: Pierwszy plan - chodnik, kałuże, latarnie, kot (Pętla 640px)
    const fgLoop = this.foregroundLoopWidth; // 640
    const fgOffset = Math.floor(camX % fgLoop);
    targetCtx.drawImage(this.foregroundCanvas, -fgOffset, 0);
    if (fgOffset > fgLoop - this.width) {
      targetCtx.drawImage(this.foregroundCanvas, fgLoop - fgOffset, 0);
    }

    // Kot
    const catTailX = Math.floor(148 - fgOffset);
    const catTailY = 142 - 18;
    const tailWiggle = Math.round(Math.sin(time * 3) * 2);
    this.p(targetCtx, catTailX - 2, catTailY + tailWiggle, 2, 4, '#0f0c1a');
    this.p(targetCtx, catTailX - 4, catTailY - 2 + tailWiggle, 2, 2, '#0f0c1a');
  }
}
