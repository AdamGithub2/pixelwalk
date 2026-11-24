/* Four independent raster layers, shared by the standalone and module engines. */
globalThis.PrlBackground = class PrlBackground {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.layers = null;
    this.loading = null;
    this.floorTopY = 125;
    this.buildingBaselineY = 128;
    this.walkingLineY = 133;
    this.streetFurniture = null;
  }

  load() {
    if (this.loading) return this.loading;
    this.loading = Promise.all(['sky', 'far', 'front', 'floor'].map(name =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve([name, img]);
        img.onerror = () => reject(new Error('Nie udało się wczytać warstwy: ' + name));
        img.src = globalThis.PRL_ASSETS[name];
      })
    )).then(entries => {
      this.layers = Object.fromEntries(entries);
      this.createStreetFurniture();
    })
      .catch(error => { this.loading = null; throw error; });
    return this.loading;
  }

  tile(ctx, image, cameraX, speed, y) {
    const offset = Math.floor(Math.max(0, cameraX) * speed) % image.width;
    for (let x = -offset; x < this.width; x += image.width) {
      ctx.drawImage(image, x, y);
    }
  }

  createStreetFurniture() {
    // Cached street decorations move with the pavement at full camera speed.
    const canvas = document.createElement('canvas');
    canvas.width = this.layers.front.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const baseY = this.buildingBaselineY + 2;
    const layout = [
      ['bush', 17], ['lamp', 79], ['bench', 110], ['tree', 202],
      ['bush', 291], ['lamp', 329], ['bench', 407], ['tree', 511],
      ['bush', 551], ['lamp', 594], ['bench', 752], ['tree', 801],
      ['lamp', 931], ['bush', 985], ['bench', 1044], ['tree', 1120],
      ['lamp', 1181], ['bush', 1295], ['bench', 1336], ['tree', 1372],
      ['lamp', 1481], ['bench', 1534], ['bush', 1635]
    ];
    layout.forEach(([kind, x], index) => {
      this.drawStreetFurniture(ctx, kind, x, baseY, index);
    });
    this.streetFurniture = canvas;
  }

  drawStreetFurniture(ctx, kind, x, y, seed) {
    const p = (dx, dy, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x + dx, y + dy, w, h);
    };
    const shadow = kind === 'tree' ? 15 : kind === 'bench' ? 16 : 9;
    p(-shadow, 0, shadow * 2, 2, '#343b344f');

    if (kind === 'lamp') {
      // Weathered concrete pole and the shallow hood of an old street light.
      p(-2, -5, 5, 6, '#55594d');
      p(-1, -41, 3, 37, '#5b645c');
      p(-1, -40, 1, 34, '#a1a48b');
      p(1, -37, 1, 30, '#424d47');
      p(0, -43, 3, 3, '#6e776c');
      p(2, -45, 10, 2, '#666f65');
      p(10, -44, 2, 3, '#4b554f');
      p(8, -42, 11, 2, '#3f4b46');
      p(7, -41, 13, 2, '#838b75');
      p(9, -39, 9, 2, '#d8c68e');
      p(10, -39, 6, 1, '#f0dfad');
      p(0, -18, 2, 3, '#8b8871');
      p(0, -9, 1, 2, '#b5ae8d');
      return;
    }

    if (kind === 'bench') {
      // Three wooden back slats, a seat and dark cast-iron supports.
      p(-11, -11, 2, 11, '#35463e');
      p(9, -11, 2, 11, '#35463e');
      for (let row = 0; row < 3; row++) {
        p(-13, -13 + row * 3, 27, 2, '#775d3e');
        p(-12, -13 + row * 3, 25, 1, '#ad9060');
        p(-8 + row * 5, -12 + row * 3, 4, 1, '#594d37');
      }
      p(-14, -5, 29, 2, '#b09665');
      p(-14, -3, 29, 1, '#5b4c35');
      p(-11, -2, 2, 3, '#34433a');
      p(10, -2, 2, 3, '#34433a');
      p(-15, -7, 4, 1, '#424e3e');
      p(12, -7, 4, 1, '#424e3e');
      p(-14, -6, 1, 3, '#424e3e');
      p(14, -6, 1, 3, '#424e3e');
      return;
    }

    if (kind === 'tree') {
      p(-7, -1, 15, 2, '#777a5c');
      p(-5, -2, 11, 2, '#424c38');
      p(-2, -29, 5, 28, '#514b36');
      p(-1, -26, 1, 24, '#94805a');
      p(2, -23, 1, 21, '#373f30');
      for (let i = 0; i < 7; i++) {
        p(-3 - i, -20 - i, 2, 2, '#514b36');
        p(2 + i, -25 - i, 2, 2, '#514b36');
      }
      this.drawFoliage(ctx, x, y - 35, 18, 14, seed);
      this.drawFoliage(ctx, x - 11, y - 29, 10, 9, seed + 3);
      this.drawFoliage(ctx, x + 12, y - 30, 10, 9, seed + 7);
      p(-4, -1, 2, 1, '#b4a274');
      return;
    }

    p(-13, -1, 27, 2, '#787a5d');
    this.drawFoliage(ctx, x - 6, y - 5, 9, 5, seed);
    this.drawFoliage(ctx, x + 5, y - 6, 10, 6, seed + 4);
    p(-14, 0, 29, 1, '#aca98a');
    p(-14, 1, 29, 1, '#606b53');
  }

  drawFoliage(ctx, x, y, rx, ry, seed) {
    // Stepped silhouettes and fixed clustered highlights; no per-frame noise.
    const palette = ['#354536', '#43563a', '#53633e', '#697448', '#84905a', '#a2a16a'];
    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        const edge = ((dx * dx) / (rx * rx)) + ((dy * dy) / (ry * ry));
        const noise = ((dx + rx) * 17 + (dy + ry) * 31 + seed * 13) % 23;
        if (edge > 0.90 + (noise % 4) * 0.035) continue;
        const cluster = Math.sin(Math.floor((dx + seed) / 3) * 2.3 + Math.floor(dy / 3) * 1.7);
        let tone = dy > ry * 0.45 ? 0 : (dx < 0 ? 3 : 2);
        if (cluster > 0.3) tone++;
        if (noise < 3 && dy < ry * 0.3) tone++;
        ctx.fillStyle = palette[Math.min(5, tone)];
        ctx.fillRect(x + dx, y + dy, 1, 1);
      }
    }
  }

  render(ctx, cameraX) {
    if (!this.layers) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#929c9b';
    ctx.fillRect(0, 0, this.width, this.height);
    this.tile(ctx, this.layers.sky, cameraX, 0.06, 0);
    this.tile(ctx, this.layers.far, cameraX, 0.20, 125 - this.layers.far.height);
    this.tile(ctx, this.layers.front, cameraX, 0.45, this.buildingBaselineY - this.layers.front.height);
    this.tile(ctx, this.layers.floor, cameraX, 1, this.floorTopY);
    if (this.streetFurniture) this.tile(ctx, this.streetFurniture, cameraX, 1, 0);
  }
};
