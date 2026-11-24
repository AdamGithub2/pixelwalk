const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
require('../pedestrians.js');

for (const filename of ['engine.js', 'index.html']) {
  const source = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
  const start = source.indexOf('class AnimationEngine');
  const prototype = vm.runInNewContext(source.slice(start, source.indexOf('\n}', start) + 2) + '\nAnimationEngine.prototype', { setTimeout });
  function setup(keys = {}) {
    const e = Object.create(prototype);
    Object.assign(e, {
      keys, cameraX: 0, timeCounter: 0, virtualWidth: 320,
      building: { active: false, update: () => false },
      background: { level: 'city' },
      audio: { playPasserby: () => false, setWalking: (walking, running) => { e.footsteps = { walking, running }; } },
      character: { width: 48, animations: Object.fromEntries(['idle', 'walk', 'run', 'attack', 'special'].map(name => [name, Array(name === 'attack' ? 5 : 6).fill({})])) },
      player: { x: 200, y: 112, vx: 0, vy: 0, facing: 1, isGrounded: true, isPlaying: true, currentAnim: 'idle', frameIndex: 0, frameTimer: 0, fps: 7, loop: true }
    });
    e.pedestrians = new globalThis.Pedestrians(e);
    e.pedestrians.spawnTimer = 100;
    return e;
  }

  test(`${filename}: sprint continues through the full attack, then returns to running`, () => {
    for (const shift of ['ShiftLeft', 'ShiftRight']) {
      const e = setup({ KeyD: true, [shift]: true });
      e.triggerAttack();
      const person = e.pedestrians.spawn(254, -1);
      for (let frame = 0; frame < 32; frame++) {
        const before = e.player.x;
        e.update(1 / 60);
        assert.ok(Math.abs(e.player.x - before - 2.4) < 0.00001);
        if (frame < 20) assert.equal(e.player.currentAnim, 'attack');
      }
      assert.equal(e.player.currentAnim, 'run');
      assert.equal(person.hits, 1, 'the moving swing still hits only once');
      assert.equal(e.footsteps.walking, true);
      assert.equal(e.footsteps.running, true);
    }
  });

  test(`${filename}: walking and stationary attacks finish without cancelling the swing`, () => {
    for (const moving of [false, true]) {
      const e = setup(moving ? { KeyA: true } : {});
      e.player.facing = -1;
      e.triggerAttack();
      for (let i = 0; i < 32; i++) e.update(1 / 60);
      assert.equal(e.player.currentAnim, moving ? 'walk' : 'idle');
      assert.ok(Math.abs(e.player.x - (moving ? 161.6 : 200)) < 0.00001);
    }
  });

  test(`${filename}: changing direction during a swing keeps the hit and sprite facing consistent`, () => {
    const e = setup({ KeyA: true, ShiftLeft: true });
    e.triggerAttack();
    e.update(1 / 60);
    assert.ok(e.player.x < 200);
    assert.equal(e.player.facing, 1);
    assert.equal(e.pedestrians.swing.facing, 1);
    for (let i = 0; i < 32; i++) e.update(1 / 60);
    assert.equal(e.player.facing, -1);
    assert.equal(e.player.currentAnim, 'run');
  });
}
