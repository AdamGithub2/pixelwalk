const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../pedestrians.js');

function setup() {
  const engine = {
    building: { active: false }, cameraX: 0, virtualWidth: 320,
    character: { width: 48 },
    player: { x: 100, facing: 1, currentAnim: 'idle', isPlaying: true, isGrounded: true }
  };
  const crowd = new globalThis.Pedestrians(engine);
  crowd.spawnTimer = 100;
  return { engine, crowd };
}

function swing(engine, crowd, dt = 0.12) {
  engine.player.currentAnim = 'attack';
  crowd.beginAttack();
  crowd.update(dt);
}

test('unprovoked pedestrians walk without damaging or chasing the player', () => {
  const { engine, crowd } = setup();
  const person = crowd.spawn(150, -1, true);
  const player = { ...engine.player };
  crowd.update(1);
  assert.equal(person.state, 'walk');
  assert.equal(person.x, 127);
  assert.equal(person.hits, 0);
  assert.deepEqual(engine.player, player);
});

test('each swing hits only once, contact triggers flight, and the third hit causes a fall', () => {
  const { engine, crowd } = setup();
  const person = crowd.spawn(145, -1);
  swing(engine, crowd);
  assert.equal(person.hits, 1);
  assert.equal(person.state, 'flee');
  assert.equal(person.facing, 1);
  crowd.update(0.04);
  crowd.update(0.04);
  assert.equal(person.hits, 1);
  swing(engine, crowd);
  assert.equal(person.state, 'flee');
  assert.equal(person.hits, 2);
  swing(engine, crowd);
  assert.equal(person.hits, 3);
  assert.equal(person.state, 'down');
  swing(engine, crowd);
  assert.equal(person.hits, 3);
});

test('hits respect facing, distance, the contact window, and grounded state', () => {
  const { engine, crowd } = setup();
  const behind = crowd.spawn(100);
  const far = crowd.spawn(210);
  const ahead = crowd.spawn(150);
  swing(engine, crowd, 0.05);
  assert.equal(ahead.hits, 0);
  engine.player.isGrounded = false;
  crowd.update(0.07);
  assert.equal(ahead.hits, 0);
  engine.player.isGrounded = true;
  crowd.update(0.03);
  assert.equal(ahead.hits, 1);
  assert.equal(behind.hits, 0);
  assert.equal(far.hits, 0);
  engine.player.facing = -1;
  swing(engine, crowd);
  assert.equal(behind.hits, 1);
});

test('fleeing is faster than walking and catchable with sprint; left edge redirects escape', () => {
  const { crowd } = setup();
  const person = crowd.spawn(160, 1);
  crowd.hit(person);
  person.stun = 0;
  const x = person.x;
  crowd.update(1);
  assert.ok(person.x - x > 72);
  assert.ok(person.x - x < 144);
  person.x = 35;
  person.facing = -1;
  crowd.update(0.1);
  assert.equal(person.x, 35);
  assert.equal(person.facing, 1);
});

test('entering, interiors and leaving keep pedestrians moving but cancel combat', () => {
  const { engine, crowd } = setup();
  const person = crowd.spawn(145);
  swing(engine, crowd, 0.05);
  engine.building.active = true;
  for (const state of ['entering', 'inside', 'leaving']) {
    engine.building.state = state;
    const before = { ...person };
    crowd.update(0.1);
    assert.ok(person.x < before.x);
    assert.ok(person.phase > before.phase);
    assert.equal(person.hits, 0);
    assert.equal(crowd.swing, null);
  }
  crowd.reset();
  assert.equal(crowd.people.length, 0);
  assert.equal(crowd.swing, null);
});

test('ambient spawning stays bounded and downed characters eventually disappear', () => {
  const { crowd } = setup();
  for (let i = 0; i < 8; i++) { crowd.spawnTimer = 0; crowd.update(0.01); }
  assert.equal(crowd.people.length, 3);
  const person = crowd.people[0];
  person.state = 'down';
  person.downTime = 14;
  crowd.update(0.01);
  assert.ok(!crowd.people.includes(person));
});
