const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
require('../interior_hero_assets.js');
const context = vm.createContext({
  INTERIOR_HERO_ASSETS: globalThis.INTERIOR_HERO_ASSETS,
  Image: class { constructor() { this.complete = true; this.naturalWidth = 1448; } }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../interior_hero.js'), 'utf8'), context);
const create = () => new context.InteriorHero();
function drawing() {
  const draws = [];
  return { draws, ctx: { save() {}, restore() {}, fillRect() {}, drawImage(...args) { draws.push(args); } } };
}

test('a new interior starts a walk and settles without overshooting or restarting on redraw', () => {
  const hero = create();
  hero.enter('tenement:stairs');
  assert.equal(hero.walking, true);
  hero.update(0.2);
  assert.ok(hero.x > 0.10 && hero.x < 0.16);
  const before = hero.x;
  hero.enter('tenement:stairs');
  assert.equal(hero.x, before);
  hero.update(3);
  assert.equal(hero.x, 0.16);
  assert.equal(hero.walking, false);
});

test('inspecting objects moves the indoor actor and changing rooms starts a new entry', () => {
  const hero = create();
  hero.enter('tenement:stairs'); hero.update(2);
  hero.walkTo(0.19);
  hero.update(1);
  assert.equal(hero.x, 0.19);
  assert.equal(hero.walking, false);
  hero.enter('tenement:apartment');
  assert.equal(hero.x, 0.10);
  assert.equal(hero.walking, true);
});

test('all generated animation frames retain a fixed floor line and a larger detailed silhouette', () => {
  const hero = create();
  const asset = globalThis.INTERIOR_HERO_ASSETS;
  assert.equal(asset.idle.length, 4);
  assert.equal(asset.walk.length, 4);
  for (const walking of [false, true]) {
    const times = walking ? [0, 0.15, 0.30, 0.44] : [0, 1.2, 2.2, 3.45];
    const crops = new Set();
    for (const [index, time] of times.entries()) {
      hero.walking = walking; hero.time = time;
      hero.walkPhase = index;
      const { ctx, draws } = drawing();
      assert.equal(hero.draw(ctx, 1280, 720, 1280, 720), true);
      const [, sx, sy, sw, sh, dx, dy, dw, dh] = draws[0];
      crops.add(`${sx}:${sy}`);
      assert.ok(sw > 100 && sh > 400, 'use high-detail source crops, not street frames');
      assert.equal(dy + dh, Math.round(720 * 0.92));
      assert.ok(dh > 410 && dh < 440);
    }
    assert.equal(crops.size, 4);
  }
});

test('unavailable indoor art allows the existing character fallback', () => {
  const hero = create();
  hero.image.naturalWidth = 0;
  const { ctx, draws } = drawing();
  assert.equal(hero.draw(ctx, 1280, 720, 1280, 720), false);
  assert.equal(draws.length, 0);
});

test('the same distance gives the same leg phase regardless of speed or frame duration', () => {
  const fast = create();
  const slow = create();
  fast.enter('room'); slow.enter('room');
  slow.moveSpeed = fast.moveSpeed / 2;
  fast.update(0.2);
  for (let i = 0; i < 4; i++) slow.update(0.1);
  assert.ok(Math.abs(fast.x - slow.x) < 1e-9);
  assert.ok(Math.abs(fast.walkPhase - slow.walkPhase) < 1e-9);
});

test('a short approach uses less than half a cycle and idle time cannot advance the legs', () => {
  const hero = create();
  hero.enter('room');
  hero.update(2);
  assert.equal(hero.walking, false);
  assert.ok(hero.walkPhase < 2, 'do not play multiple strides over a short approach');
  const phase = hero.walkPhase;
  hero.update(20);
  assert.equal(hero.walkPhase, phase);
  assert.equal(hero.x, 0.16);
});
