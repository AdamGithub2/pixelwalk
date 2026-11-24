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
    )).then(entries => { this.layers = Object.fromEntries(entries); })
      .catch(error => { this.loading = null; throw error; });
    return this.loading;
  }

  tile(ctx, image, cameraX, speed, y) {
    const offset = Math.floor(Math.max(0, cameraX) * speed) % image.width;
    for (let x = -offset; x < this.width; x += image.width) {
      ctx.drawImage(image, x, y);
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
  }
};
