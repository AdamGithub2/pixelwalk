/**
 * CHARACTER SPRITES GENERATOR & FRAME MANAGER
 * 
 * Zawiera 2 unikalne postacie pixel art:
 * 1. URBAN HERO (DOMYŚLNY): Bohater w bluzie i plecaku na wzór przesłanej grafiki
 *    - Bluza hoodie ze sznurkami i kieszenią kangurka
 *    - Plecak na plecach bujający się w rytm chodu i biegu
 *    - Słuchawki na szyi (cyan) i fryzura z grzywką
 *    - Spodnie bojówki i retro sneakersy z białą podeszwą
 *    - Animacje: Idle (oddech i mrugnięcie), Walk (kroki i plecak), Run (sprint z pyłem),
 *      Jump (wyskoki), Attack (wymach i obrót), Special (słuchawki na uszy i nutki lo-fi)
 * 
 * 2. CYBER RONIN: Wojownik w ciemnym płaszczu, szaliku, cyber-wizjerze i z kataną
 */

export const PALETTE = {
  // Wspólne
  '.': null,
  '#': '#0a0914',
  'shadow': 'rgba(10, 9, 21, 0.45)',

  // Urban Hero (Bohater w bluzie i plecaku)
  'uh_skin': '#f0b48c',
  'uh_skin_d': '#cf835d',
  'uh_hair': '#543224',
  'uh_hair_l': '#784732',
  'uh_hoodie': '#4a5d78',
  'uh_hoodie_d': '#334155',
  'uh_hoodie_l': '#64748b',
  'uh_string': '#f8fafc',
  'uh_pack': '#82384a',
  'uh_pack_d': '#5e2433',
  'uh_pack_z': '#d4a373',
  'uh_phone': '#00f0ff',
  'uh_pants': '#242838',
  'uh_pants_d': '#181b26',
  'uh_shoe_w': '#ffffff',
  'uh_shoe_c': '#c0392b',
  'uh_note': '#ff007f',

  // Cyber Ronin
  'cr_c': '#181b2e',
  'cr_C': '#283152',
  'cr_h': '#ffb085',
  'cr_H': '#d97d57',
  'cr_v': '#00f0ff',
  'cr_V': '#ffffff',
  'cr_s': '#e63946',
  'cr_S': '#ff6b6b',
  'cr_b': '#131124',
  'cr_w': '#f1faee',
  'cr_W': '#00ffff',
  'cr_g': '#ffbe0b',
  'cr_p': '#ff007f'
};

export class PixelCharacter {
  constructor(skin = 'urban_hero') {
    this.width = 32;
    this.height = 32;
    this.currentSkin = skin; // 'urban_hero' lub 'cyber_ronin'
    this.animations = {};
    this.initAnimations();
  }

  p(ctx, x, y, w, h, color) {
    if (!color) return;
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  setSkin(skinName) {
    if (skinName !== 'urban_hero' && skinName !== 'cyber_ronin') return;
    this.currentSkin = skinName;
    this.initAnimations();
  }

  toggleSkin() {
    this.setSkin(this.currentSkin === 'urban_hero' ? 'cyber_ronin' : 'urban_hero');
    return this.currentSkin;
  }

  initAnimations() {
    if (this.currentSkin === 'urban_hero') {
      this.initUrbanHero();
    } else {
      this.initCyberRonin();
    }
  }

  /* ==========================================================================
     1. URBAN HERO: BOHATER W BLUZIE I PLECAKU (NA WZÓR GRAFIKI)
     ========================================================================== */
  initUrbanHero() {
    this.animations['idle'] = this.buildUrbanIdle();
    this.animations['walk'] = this.buildUrbanWalk();
    this.animations['run'] = this.buildUrbanRun();
    this.animations['jump'] = this.buildUrbanJump();
    this.animations['attack'] = this.buildUrbanAttack();
    this.animations['special'] = this.buildUrbanSpecial();
  }

  drawUrbanHead(ctx, x, y, blink = false, headphoneOnEars = false) {
    // Szyja i słuchawki
    this.p(ctx, x - 2, y - 2, 4, 3, PALETTE['#']);
    if (!headphoneOnEars) {
      // Słuchawki na szyi (pałąk i pady cyan)
      this.p(ctx, x - 3, y - 1, 1, 2, PALETTE['uh_phone']);
      this.p(ctx, x + 2, y - 1, 1, 2, PALETTE['uh_phone']);
      this.p(ctx, x - 2, y, 4, 1, '#1b1424');
    } else {
      // Słuchawki założone na uszy
      this.p(ctx, x - 4, y - 5, 2, 3, PALETTE['uh_phone']);
      this.p(ctx, x + 2, y - 5, 2, 3, PALETTE['uh_phone']);
      this.p(ctx, x - 3, y - 9, 6, 1, PALETTE['uh_phone']);
    }

    // Twarz
    this.p(ctx, x - 2, y - 6, 5, 5, PALETTE['uh_skin']);
    this.p(ctx, x - 1, y - 2, 3, 1, PALETTE['uh_skin_d']); // Cień brody

    if (!blink) {
      this.p(ctx, x + 1, y - 4, 1, 1, PALETTE['#']); // Oko
      this.p(ctx, x - 1, y - 3, 1, 1, '#e08575');    // Rumieniec
    } else {
      this.p(ctx, x, y - 4, 2, 1, PALETTE['uh_skin_d']); // Zamknięta powieka
    }

    // Włosy brązowe z grzywką
    this.p(ctx, x - 3, y - 8, 7, 3, PALETTE['uh_hair']);
    this.p(ctx, x - 2, y - 9, 5, 2, PALETTE['uh_hair_l']);
    this.p(ctx, x - 4, y - 7, 2, 4, PALETTE['uh_hair']);
    this.p(ctx, x + 2, y - 6, 2, 3, PALETTE['uh_hair']); // Grzywka opadająca z przodu
  }

  drawUrbanBackpack(ctx, x, y, bounce = 0) {
    // Plecak na plecach za postacią
    const by = y + bounce;
    this.p(ctx, x - 6, by + 1, 5, 8, PALETTE['uh_pack']);
    this.p(ctx, x - 7, by + 2, 2, 6, PALETTE['uh_pack_d']);
    this.p(ctx, x - 4, by + 3, 1, 4, PALETTE['uh_pack_z']); // Zamek błyskawiczny
    this.p(ctx, x - 5, by + 7, 3, 2, PALETTE['uh_pack_d']); // Dolna kieszeń
  }

  drawUrbanHoodieTorso(ctx, x, y) {
    // Bluza hoodie
    this.p(ctx, x - 3, y, 7, 8, PALETTE['#']);
    this.p(ctx, x - 2, y + 1, 5, 6, PALETTE['uh_hoodie']);
    this.p(ctx, x - 2, y + 5, 5, 2, PALETTE['uh_hoodie_d']); // Kieszeń kangurka
    // Sznurki kaptura
    this.p(ctx, x - 1, y + 2, 1, 3, PALETTE['uh_string']);
    this.p(ctx, x + 1, y + 2, 1, 3, PALETTE['uh_string']);

    // Szelka plecaka na ramieniu
    this.p(ctx, x - 3, y + 1, 1, 5, PALETTE['uh_pack']);
    this.p(ctx, x - 3, y + 3, 1, 1, PALETTE['uh_pack_z']); // Klamra na szelce
  }

  buildUrbanIdle() {
    const frames = [];
    for (let i = 0; i < 6; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const bob = (i === 1 || i === 2) ? -1 : 0;
      const packBounce = (i === 2) ? -1 : 0;
      const blink = (i === 4);
      const cx = 16;
      const cy = 15 + bob;

      // Cień
      this.p(ctx, 10, 29, 12, 2, PALETTE['shadow']);

      // Plecak
      this.drawUrbanBackpack(ctx, cx, cy, packBounce);

      // Nogi w jeansach i sneakersach
      this.p(ctx, cx - 4, 23, 3, 5, PALETTE['uh_pants']);
      this.p(ctx, cx + 1, 23, 3, 5, PALETTE['uh_pants']);
      // Buty (czerwono-białe sneakersy z białą podeszwą)
      this.p(ctx, cx - 5, 27, 4, 2, PALETTE['uh_shoe_c']);
      this.p(ctx, cx - 5, 28, 4, 1, PALETTE['uh_shoe_w']);
      this.p(ctx, cx + 1, 27, 4, 2, PALETTE['uh_shoe_c']);
      this.p(ctx, cx + 1, 28, 4, 1, PALETTE['uh_shoe_w']);

      // Tułów (Bluza)
      this.drawUrbanHoodieTorso(ctx, cx, cy);

      // Głowa
      this.drawUrbanHead(ctx, cx, cy, blink);

      // Ręce w kieszeni bluzy
      this.p(ctx, cx - 1, cy + 3, 2, 4, PALETTE['uh_hoodie_d']);
      this.p(ctx, cx, cy + 5, 2, 2, PALETTE['uh_skin']);

      frames.push(canvas);
    }
    return frames;
  }

  buildUrbanWalk() {
    const frames = [];
    const legOffsets = [
      { l: -3, r: 3, bob: 0, pack: 0 },
      { l: -1, r: 1, bob: -1, pack: -1 },
      { l: 2, r: -2, bob: 0, pack: 0 },
      { l: 4, r: -4, bob: 0, pack: 0 },
      { l: 1, r: -1, bob: -1, pack: -1 },
      { l: -2, r: 2, bob: 0, pack: 0 }
    ];

    for (let i = 0; i < 6; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const offset = legOffsets[i];
      const cx = 16;
      const cy = 15 + offset.bob;

      this.p(ctx, 10, 29, 12, 2, PALETTE['shadow']);
      this.drawUrbanBackpack(ctx, cx, cy, offset.pack);

      // Noga lewa
      this.p(ctx, cx - 2 + offset.l, 22, 3, 5, PALETTE['uh_pants_d']);
      this.p(ctx, cx - 3 + offset.l, 26, 4, 2, PALETTE['uh_shoe_c']);
      this.p(ctx, cx - 3 + offset.l, 28, 4, 1, PALETTE['uh_shoe_w']);

      // Noga prawa
      this.p(ctx, cx + offset.r, 22, 3, 5, PALETTE['uh_pants']);
      this.p(ctx, cx - 1 + offset.r, 26, 4, 2, PALETTE['uh_shoe_c']);
      this.p(ctx, cx - 1 + offset.r, 28, 4, 1, PALETTE['uh_shoe_w']);

      this.drawUrbanHoodieTorso(ctx, cx, cy);
      this.drawUrbanHead(ctx, cx + 1, cy, false);

      // Ręce wymachujące w chłodnym rytmie
      this.p(ctx, cx - 3 - offset.r, cy + 2, 2, 4, PALETTE['uh_hoodie_d']);
      this.p(ctx, cx + 2 + offset.r, cy + 2, 2, 4, PALETTE['uh_hoodie']);
      this.p(ctx, cx + 2 + offset.r, cy + 5, 2, 2, PALETTE['uh_skin']);

      frames.push(canvas);
    }
    return frames;
  }

  buildUrbanRun() {
    const frames = [];
    const runCycle = [
      { lX: -6, lY: 2, rX: 5, rY: -2, bob: 0, lean: 2, pack: -1 },
      { lX: -3, lY: 0, rX: 2, rY: -1, bob: -2, lean: 3, pack: -2 },
      { lX: 1, lY: -2, rX: -2, rY: 0, bob: -1, lean: 2, pack: 0 },
      { lX: 5, lY: -2, rX: -6, rY: 2, bob: 0, lean: 2, pack: -1 },
      { lX: 2, lY: -1, rX: -3, rY: 0, bob: -2, lean: 3, pack: -2 },
      { lX: -2, lY: 0, rX: 1, rY: -2, bob: -1, lean: 2, pack: 0 }
    ];

    for (let i = 0; i < 6; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const c = runCycle[i];
      const cx = 15;
      const cy = 15 + c.bob;

      this.p(ctx, 10 + c.lean, 29, 12, 2, PALETTE['shadow']);
      this.drawUrbanBackpack(ctx, cx + c.lean, cy, c.pack);

      // Noga tylna
      this.p(ctx, cx + c.lX, 22 + c.lY, 3, 5, PALETTE['uh_pants_d']);
      this.p(ctx, cx + c.lX - 1, 26 + c.lY, 4, 2, PALETTE['uh_shoe_c']);
      this.p(ctx, cx + c.lX - 1, 28 + c.lY, 4, 1, PALETTE['uh_shoe_w']);

      // Noga przednia
      this.p(ctx, cx + c.rX, 22 + c.rY, 3, 5, PALETTE['uh_pants']);
      this.p(ctx, cx + c.rX - 1, 26 + c.rY, 4, 2, PALETTE['uh_shoe_c']);
      this.p(ctx, cx + c.rX - 1, 28 + c.rY, 4, 1, PALETTE['uh_shoe_w']);

      this.drawUrbanHoodieTorso(ctx, cx + c.lean, cy);
      this.drawUrbanHead(ctx, cx + c.lean + 2, cy - 1, false);

      // Sznurki bluzy powiewające w biegu
      this.p(ctx, cx + c.lean - 3, cy + 3, 1, 2, PALETTE['uh_string']);

      if (i === 0 || i === 3) {
        this.p(ctx, cx - 5, 28, 2, 1, '#d4a373');
      }

      frames.push(canvas);
    }
    return frames;
  }

  buildUrbanJump() {
    const frames = [];
    for (let i = 0; i < 4; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const cx = 16;
      let cy = 15;

      if (i === 0) {
        // Wybicie w górę
        cy = 11;
        this.drawUrbanBackpack(ctx, cx, cy, 1);
        this.p(ctx, cx - 3, cy + 7, 3, 6, PALETTE['uh_pants']);
        this.p(ctx, cx + 1, cy + 7, 3, 6, PALETTE['uh_pants']);
        this.p(ctx, cx - 4, cy + 12, 4, 2, PALETTE['uh_shoe_c']);
        this.p(ctx, cx + 1, cy + 12, 4, 2, PALETTE['uh_shoe_c']);
        this.drawUrbanHoodieTorso(ctx, cx, cy);
        this.drawUrbanHead(ctx, cx, cy - 1);
      } else if (i === 1) {
        // Szczyt: podciągnięte kolana
        cy = 9;
        this.drawUrbanBackpack(ctx, cx, cy, -1);
        this.p(ctx, cx - 4, cy + 6, 4, 4, PALETTE['uh_pants']);
        this.p(ctx, cx + 1, cy + 6, 4, 4, PALETTE['uh_pants']);
        this.p(ctx, cx - 4, cy + 9, 4, 2, PALETTE['uh_shoe_c']);
        this.p(ctx, cx + 1, cy + 9, 4, 2, PALETTE['uh_shoe_c']);
        this.drawUrbanHoodieTorso(ctx, cx, cy);
        this.drawUrbanHead(ctx, cx, cy);
      } else if (i === 2) {
        // Opadanie
        cy = 13;
        this.drawUrbanBackpack(ctx, cx, cy, -2);
        this.p(ctx, cx - 3, cy + 7, 3, 6, PALETTE['uh_pants']);
        this.p(ctx, cx + 1, cy + 7, 3, 6, PALETTE['uh_pants']);
        this.p(ctx, cx - 4, cy + 12, 4, 2, PALETTE['uh_shoe_c']);
        this.p(ctx, cx + 1, cy + 12, 4, 2, PALETTE['uh_shoe_c']);
        this.drawUrbanHoodieTorso(ctx, cx, cy);
        this.drawUrbanHead(ctx, cx, cy);
      } else {
        // Lądowanie (przysiad)
        cy = 18;
        this.p(ctx, 9, 29, 14, 2, PALETTE['shadow']);
        this.drawUrbanBackpack(ctx, cx, cy, 2);
        this.p(ctx, cx - 6, cy + 4, 5, 4, PALETTE['uh_pants']);
        this.p(ctx, cx + 2, cy + 4, 5, 4, PALETTE['uh_pants']);
        this.p(ctx, cx - 7, cy + 7, 5, 2, PALETTE['uh_shoe_c']);
        this.p(ctx, cx + 3, cy + 7, 5, 2, PALETTE['uh_shoe_c']);
        this.drawUrbanHoodieTorso(ctx, cx, cy);
        this.drawUrbanHead(ctx, cx, cy - 1);
      }

      frames.push(canvas);
    }
    return frames;
  }

  buildUrbanAttack() {
    const frames = [];
    for (let i = 0; i < 5; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const cx = 15;
      const cy = 15;

      this.p(ctx, 10, 29, 12, 2, PALETTE['shadow']);
      this.drawUrbanBackpack(ctx, cx, cy);

      if (i === 0) {
        // Naciągnięcie
        this.p(ctx, cx - 4, 23, 3, 5, PALETTE['uh_pants']);
        this.p(ctx, cx + 1, 23, 3, 5, PALETTE['uh_pants']);
        this.drawUrbanHoodieTorso(ctx, cx - 1, cy);
        this.drawUrbanHead(ctx, cx - 1, cy);
        this.p(ctx, cx - 5, cy + 2, 3, 3, PALETTE['uh_hoodie_d']);
      } else if (i === 1) {
        // Wymach ręki z energią
        this.p(ctx, cx - 6, 24, 4, 5, PALETTE['uh_pants']);
        this.p(ctx, cx + 3, 24, 4, 5, PALETTE['uh_pants']);
        this.drawUrbanHoodieTorso(ctx, cx + 2, cy + 1);
        this.drawUrbanHead(ctx, cx + 4, cy);
        this.p(ctx, cx + 6, cy + 2, 7, 2, PALETTE['uh_hoodie']);
        this.p(ctx, cx + 12, cy + 1, 3, 3, PALETTE['uh_phone']);
      } else if (i === 2) {
        // Pełna łukowa smuga
        this.p(ctx, cx - 7, 24, 4, 5, PALETTE['uh_pants']);
        this.p(ctx, cx + 4, 24, 4, 5, PALETTE['uh_pants']);
        this.drawUrbanHoodieTorso(ctx, cx + 3, cy + 1);
        this.drawUrbanHead(ctx, cx + 5, cy);

        const arcPixels = [
          [18, 5], [20, 6], [22, 7], [24, 9], [25, 12], [26, 15], [26, 18], [24, 21], [21, 23]
        ];
        arcPixels.forEach(([px, py]) => {
          this.p(ctx, px, py, 2, 2, PALETTE['uh_phone']);
          this.p(ctx, px - 1, py, 1, 1, '#ffffff');
        });
      } else if (i === 3) {
        // Rozpad smugi
        this.p(ctx, cx - 5, 23, 3, 5, PALETTE['uh_pants']);
        this.p(ctx, cx + 2, 23, 3, 5, PALETTE['uh_pants']);
        this.drawUrbanHoodieTorso(ctx, cx + 1, cy);
        this.drawUrbanHead(ctx, cx + 2, cy);
        this.p(ctx, 24, 9, 1, 1, PALETTE['uh_phone']);
        this.p(ctx, 26, 16, 1, 1, PALETTE['uh_phone']);
      } else {
        // Powrót
        this.p(ctx, cx - 4, 23, 3, 5, PALETTE['uh_pants']);
        this.p(ctx, cx + 1, 23, 3, 5, PALETTE['uh_pants']);
        this.drawUrbanHoodieTorso(ctx, cx, cy);
        this.drawUrbanHead(ctx, cx, cy);
      }

      frames.push(canvas);
    }
    return frames;
  }

  buildUrbanSpecial() {
    // Specjalna animacja miejska: bohater zakłada słuchawki na uszy i buja się w rytm muzyki,
    // a z góry unoszą się pikselowe nutki lo-fi!
    const frames = [];
    for (let i = 0; i < 5; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const cx = 16;
      const cy = 15 + ((i % 2 === 1) ? -1 : 0);

      this.p(ctx, 10, 29, 12, 2, PALETTE['shadow']);
      this.drawUrbanBackpack(ctx, cx, cy);

      this.p(ctx, cx - 4, 23, 3, 5, PALETTE['uh_pants']);
      this.p(ctx, cx + 1, 23, 3, 5, PALETTE['uh_pants']);
      this.drawUrbanHoodieTorso(ctx, cx, cy);

      // Słuchawki założone na uszy!
      this.drawUrbanHead(ctx, cx, cy, false, true);

      // Ręce poprawiające słuchawki przy uszach
      if (i < 2) {
        this.p(ctx, cx - 4, cy - 3, 2, 4, PALETTE['uh_hoodie']);
        this.p(ctx, cx + 2, cy - 3, 2, 4, PALETTE['uh_hoodie']);
      } else {
        // Ręce w kieszeni
        this.p(ctx, cx - 1, cy + 3, 2, 4, PALETTE['uh_hoodie_d']);
      }

      // Unosząca się pixelowa nutka lo-fi
      const noteY = cy - 8 - i * 2;
      const noteX = cx + 6 + Math.round(Math.sin(i) * 2);
      this.p(ctx, noteX, noteY, 2, 2, PALETTE['uh_note']);
      this.p(ctx, noteX + 1, noteY - 3, 1, 4, PALETTE['uh_note']);
      this.p(ctx, noteX + 2, noteY - 3, 2, 1, PALETTE['uh_note']);

      frames.push(canvas);
    }
    return frames;
  }

  /* ==========================================================================
     2. CYBER RONIN (WOJOWNIK Z KATANĄ)
     ========================================================================== */
  initCyberRonin() {
    this.animations['idle'] = this.buildRoninIdle();
    this.animations['walk'] = this.buildRoninWalk();
    this.animations['run'] = this.buildRoninRun();
    this.animations['attack'] = this.buildRoninAttack();
    this.animations['jump'] = this.buildRoninJump();
    this.animations['special'] = this.buildRoninSpecial();
  }

  drawRoninHead(ctx, x, y, blink = false) {
    this.p(ctx, x - 3, y - 5, 7, 6, PALETTE['#']);
    this.p(ctx, x - 2, y - 6, 5, 2, PALETTE['cr_c']);
    this.p(ctx, x - 3, y - 4, 3, 4, PALETTE['cr_C']);
    this.p(ctx, x, y - 3, 3, 4, PALETTE['cr_h']);
    this.p(ctx, x - 1, y - 1, 2, 2, PALETTE['cr_H']);
    if (!blink) {
      this.p(ctx, x + 1, y - 2, 3, 1, PALETTE['cr_v']);
      this.p(ctx, x + 2, y - 2, 1, 1, PALETTE['cr_V']);
    } else {
      this.p(ctx, x + 1, y - 2, 3, 1, PALETTE['cr_C']);
    }
    this.p(ctx, x - 2, y + 1, 5, 2, PALETTE['cr_s']);
    this.p(ctx, x - 1, y + 1, 3, 1, PALETTE['cr_S']);
  }

  drawRoninScarfTail(ctx, x, y, waveOffset = 0, length = 4) {
    for (let i = 0; i < length; i++) {
      const sx = x - 3 - i * 2;
      const sy = y + 1 + Math.round(Math.sin((waveOffset + i) * 0.8) * 2);
      this.p(ctx, sx, sy, 2, 2, PALETTE['cr_s']);
      this.p(ctx, sx + 1, sy, 1, 1, PALETTE['cr_S']);
    }
  }

  drawRoninTorso(ctx, x, y) {
    this.p(ctx, x - 3, y, 6, 7, PALETTE['#']);
    this.p(ctx, x - 2, y, 4, 6, PALETTE['cr_C']);
    this.p(ctx, x - 2, y + 2, 2, 4, PALETTE['cr_c']);
    this.p(ctx, x - 3, y + 5, 6, 1, PALETTE['#']);
    this.p(ctx, x - 1, y + 5, 2, 1, PALETTE['cr_g']);
  }

  buildRoninIdle() {
    const frames = [];
    for (let i = 0; i < 6; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const breath = (i === 1 || i === 2) ? -1 : 0;
      const cx = 16;
      const cy = 16 + breath;

      this.p(ctx, 11, 29, 10, 2, PALETTE['shadow']);
      this.p(ctx, cx - 4, cy + 5, 8, 8, PALETTE['cr_c']);
      this.drawRoninScarfTail(ctx, cx, cy, i, 4);

      this.p(ctx, cx - 4, 23, 3, 6, PALETTE['cr_b']);
      this.p(ctx, cx + 1, 23, 3, 6, PALETTE['cr_b']);
      this.p(ctx, cx - 5, 27, 4, 2, PALETTE['#']);
      this.p(ctx, cx + 1, 27, 4, 2, PALETTE['#']);

      this.drawRoninTorso(ctx, cx, cy);
      this.drawRoninHead(ctx, cx, cy, i === 4);

      this.p(ctx, cx - 4, cy - 2, 1, 9, PALETTE['#']);
      this.p(ctx, cx - 4, cy - 4, 2, 2, PALETTE['cr_w']);

      frames.push(canvas);
    }
    return frames;
  }

  buildRoninWalk() {
    const frames = [];
    const legOffsets = [
      { l: -3, r: 3, bob: 0 },
      { l: -1, r: 1, bob: -1 },
      { l: 2, r: -2, bob: 0 },
      { l: 4, r: -4, bob: 0 },
      { l: 1, r: -1, bob: -1 },
      { l: -2, r: 2, bob: 0 }
    ];

    for (let i = 0; i < 6; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const offset = legOffsets[i];
      const cx = 16;
      const cy = 16 + offset.bob;

      this.p(ctx, 11, 29, 10, 2, PALETTE['shadow']);
      this.drawRoninScarfTail(ctx, cx, cy, i * 1.5, 5);

      this.p(ctx, cx - 2 + offset.l, 23, 3, 4, PALETTE['cr_b']);
      this.p(ctx, cx - 3 + offset.l, 27, 4, 2, PALETTE['#']);

      this.p(ctx, cx - 4, cy + 4, 7, 7, PALETTE['cr_c']);

      this.p(ctx, cx + offset.r, 23, 3, 4, PALETTE['cr_b']);
      this.p(ctx, cx - 1 + offset.r, 27, 4, 2, PALETTE['#']);

      this.drawRoninTorso(ctx, cx + 1, cy);
      this.drawRoninHead(ctx, cx + 1, cy, false);

      this.p(ctx, cx - 3 - offset.r, cy + 2, 2, 4, PALETTE['#']);
      this.p(ctx, cx + 2 + offset.r, cy + 2, 2, 4, PALETTE['cr_C']);

      frames.push(canvas);
    }
    return frames;
  }

  buildRoninRun() {
    const frames = [];
    const runCycle = [
      { lX: -6, lY: 2, rX: 5, rY: -2, bob: 0, lean: 2 },
      { lX: -3, lY: 0, rX: 2, rY: -1, bob: -2, lean: 3 },
      { lX: 1, lY: -2, rX: -2, rY: 0, bob: -1, lean: 2 },
      { lX: 5, lY: -2, rX: -6, rY: 2, bob: 0, lean: 2 },
      { lX: 2, lY: -1, rX: -3, rY: 0, bob: -2, lean: 3 },
      { lX: -2, lY: 0, rX: 1, rY: -2, bob: -1, lean: 2 }
    ];

    for (let i = 0; i < 6; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const c = runCycle[i];
      const cx = 15;
      const cy = 16 + c.bob;

      this.p(ctx, 10 + c.lean, 29, 12, 2, PALETTE['shadow']);

      for (let s = 0; s < 6; s++) {
        const sx = cx - 4 - s * 2;
        const sy = cy + Math.round(Math.sin((i * 2 + s) * 0.9) * 2);
        this.p(ctx, sx, sy, 2, 2, PALETTE['cr_s']);
      }

      this.p(ctx, cx + c.lX, 22 + c.lY, 3, 5, PALETTE['cr_b']);
      this.p(ctx, cx + c.lX - 1, 26 + c.lY, 4, 2, PALETTE['#']);

      this.p(ctx, cx - 6, cy + 3, 7, 6, PALETTE['cr_c']);

      this.p(ctx, cx + c.rX, 22 + c.rY, 3, 5, PALETTE['cr_b']);
      this.p(ctx, cx + c.rX - 1, 26 + c.rY, 4, 2, PALETTE['#']);

      this.drawRoninTorso(ctx, cx + c.lean, cy);
      this.drawRoninHead(ctx, cx + c.lean + 2, cy - 1, false);

      if (i === 0 || i === 3) {
        this.p(ctx, cx - 5, 28, 2, 1, PALETTE['cr_H']);
      }

      frames.push(canvas);
    }
    return frames;
  }

  buildRoninJump() {
    const frames = [];
    for (let i = 0; i < 4; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const cx = 16;
      let cy = 16;

      if (i === 0) {
        cy = 12;
        this.drawRoninScarfTail(ctx, cx, cy + 3, 1, 4);
        this.p(ctx, cx - 3, cy + 7, 3, 7, PALETTE['cr_b']);
        this.p(ctx, cx + 1, cy + 7, 3, 7, PALETTE['cr_b']);
        this.drawRoninTorso(ctx, cx, cy);
        this.drawRoninHead(ctx, cx, cy - 1);
      } else if (i === 1) {
        cy = 10;
        this.drawRoninScarfTail(ctx, cx, cy + 2, 3, 5);
        this.p(ctx, cx - 4, cy + 6, 4, 4, PALETTE['cr_b']);
        this.p(ctx, cx + 1, cy + 6, 4, 4, PALETTE['cr_b']);
        this.drawRoninTorso(ctx, cx, cy);
        this.drawRoninHead(ctx, cx, cy);
      } else if (i === 2) {
        cy = 14;
        this.p(ctx, cx - 5, cy + 2, 10, 5, PALETTE['cr_c']);
        this.p(ctx, cx - 3, cy + 7, 3, 6, PALETTE['cr_b']);
        this.p(ctx, cx + 1, cy + 7, 3, 6, PALETTE['cr_b']);
        this.drawRoninTorso(ctx, cx, cy);
        this.drawRoninHead(ctx, cx, cy);
      } else {
        cy = 19;
        this.p(ctx, 9, 29, 14, 2, PALETTE['shadow']);
        this.p(ctx, cx - 6, cy + 4, 5, 4, PALETTE['cr_b']);
        this.p(ctx, cx + 2, cy + 4, 5, 4, PALETTE['cr_b']);
        this.drawRoninTorso(ctx, cx, cy);
        this.drawRoninHead(ctx, cx, cy - 1);
      }

      frames.push(canvas);
    }
    return frames;
  }

  buildRoninAttack() {
    const frames = [];
    for (let i = 0; i < 5; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const cx = 15;
      const cy = 16;
      this.p(ctx, 10, 29, 12, 2, PALETTE['shadow']);

      if (i === 0) {
        this.p(ctx, cx - 4, 23, 3, 6, PALETTE['cr_b']);
        this.p(ctx, cx + 1, 23, 3, 6, PALETTE['cr_b']);
        this.drawRoninTorso(ctx, cx - 1, cy + 1);
        this.drawRoninHead(ctx, cx - 1, cy + 1);
        this.p(ctx, cx - 5, cy - 3, 3, 3, PALETTE['cr_c']);
        this.p(ctx, cx - 8, cy - 8, 3, 7, PALETTE['cr_w']);
        this.p(ctx, cx - 9, cy - 9, 1, 2, PALETTE['cr_W']);
      } else if (i === 1) {
        this.p(ctx, cx - 6, 24, 4, 5, PALETTE['cr_b']);
        this.p(ctx, cx + 3, 24, 4, 5, PALETTE['cr_b']);
        this.drawRoninTorso(ctx, cx + 2, cy + 2);
        this.drawRoninHead(ctx, cx + 4, cy + 1);
        this.p(ctx, cx + 6, cy + 2, 10, 2, PALETTE['cr_w']);
        this.p(ctx, cx + 14, cy + 1, 4, 4, PALETTE['cr_W']);
      } else if (i === 2) {
        this.p(ctx, cx - 7, 24, 4, 5, PALETTE['cr_b']);
        this.p(ctx, cx + 4, 24, 4, 5, PALETTE['cr_b']);
        this.drawRoninTorso(ctx, cx + 3, cy + 2);
        this.drawRoninHead(ctx, cx + 5, cy + 1);

        const arcPixels = [
          [18, 5], [20, 6], [22, 7], [24, 9], [25, 12], [26, 15], [26, 18], [24, 21], [21, 23]
        ];
        arcPixels.forEach(([px, py]) => {
          this.p(ctx, px, py, 2, 2, PALETTE['cr_p']);
          this.p(ctx, px - 1, py, 1, 1, PALETTE['cr_W']);
          this.p(ctx, px + 1, py + 1, 1, 1, PALETTE['cr_v']);
        });

        this.p(ctx, cx + 7, cy + 6, 8, 2, PALETTE['cr_w']);
      } else if (i === 3) {
        this.p(ctx, cx - 5, 23, 3, 6, PALETTE['cr_b']);
        this.p(ctx, cx + 2, 23, 3, 6, PALETTE['cr_b']);
        this.drawRoninTorso(ctx, cx + 1, cy + 1);
        this.drawRoninHead(ctx, cx + 2, cy);
        this.p(ctx, cx + 5, cy + 4, 2, 7, PALETTE['cr_w']);
      } else {
        this.p(ctx, cx - 4, 23, 3, 6, PALETTE['cr_b']);
        this.p(ctx, cx + 1, 23, 3, 6, PALETTE['cr_b']);
        this.drawRoninTorso(ctx, cx, cy);
        this.drawRoninHead(ctx, cx, cy);
        this.p(ctx, cx + 3, cy + 2, 2, 6, PALETTE['cr_w']);
      }

      frames.push(canvas);
    }
    return frames;
  }

  buildRoninSpecial() {
    const frames = [];
    for (let i = 0; i < 5; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const cx = 16;
      const cy = 16;

      this.p(ctx, 11, 29, 10, 2, PALETTE['shadow']);
      this.p(ctx, cx - 4, 23, 3, 6, PALETTE['cr_b']);
      this.p(ctx, cx + 1, 23, 3, 6, PALETTE['cr_b']);
      this.drawRoninTorso(ctx, cx, cy);
      this.drawRoninHead(ctx, cx, cy);

      this.p(ctx, cx + 3, cy + 1, 4, 2, PALETTE['cr_c']);

      const radius = i + 1;
      const ballX = cx + 8;
      const ballY = cy + 2;

      if (i < 4) {
        this.p(ctx, ballX - radius, ballY, radius * 2 + 1, 1, PALETTE['cr_v']);
        this.p(ctx, ballX, ballY - radius, 1, radius * 2 + 1, PALETTE['cr_v']);
        this.p(ctx, ballX - 1, ballY - 1, 3, 3, PALETTE['cr_W']);
      } else {
        this.p(ctx, ballX + 2, ballY - 4, 2, 9, PALETTE['cr_v']);
        this.p(ctx, ballX + 4, ballY - 6, 2, 13, PALETTE['cr_W']);
        this.p(ctx, ballX + 6, ballY - 8, 1, 17, PALETTE['cr_p']);
      }

      frames.push(canvas);
    }
    return frames;
  }

  generateSpritesheet() {
    const animNames = Object.keys(this.animations);
    let maxFrames = 0;
    animNames.forEach(name => {
      maxFrames = Math.max(maxFrames, this.animations[name].length);
    });

    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = maxFrames * this.width;
    sheetCanvas.height = animNames.length * this.height;
    const ctx = sheetCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    animNames.forEach((name, rowIndex) => {
      const frames = this.animations[name];
      frames.forEach((frameCanvas, colIndex) => {
        ctx.drawImage(frameCanvas, colIndex * this.width, rowIndex * this.height);
      });
    });

    return {
      canvas: sheetCanvas,
      rows: animNames,
      frameWidth: this.width,
      frameHeight: this.height,
      maxFrames
    };
  }
}
