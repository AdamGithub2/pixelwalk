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

test('nearby walkers speak once, with a cooldown and no speech from interiors or fleeing people', () => {
  const { engine, crowd } = setup();
  let lines = 0;
  engine.audio = { playPasserby: () => { lines++; return true; } };
  const person = crowd.spawn(145, 1);
  engine.building.active = true;
  crowd.update(0.01);
  assert.equal(lines, 0);
  engine.building.active = false;
  crowd.update(0.01);
  crowd.update(0.01);
  assert.equal(lines, 1);
  assert.equal(person.hasSpoken, true);
  const next = crowd.spawn(145, 1);
  crowd.update(0.01);
  assert.equal(lines, 1);
  crowd.voiceCooldown = 0;
  next.state = 'flee';
  crowd.update(0.01);
  assert.equal(lines, 1);
  next.state = 'walk';
  crowd.update(0.01);
  assert.equal(lines, 2);
});

test('unavailable audio does not consume a walkers line', () => {
  const { engine, crowd } = setup();
  engine.audio = { playPasserby: () => false };
  const person = crowd.spawn(145);
  crowd.update(0.01);
  assert.equal(person.hasSpoken, false);
  engine.audio.playPasserby = () => true;
  crowd.update(0.01);
  assert.equal(person.hasSpoken, true);
});

test('PRL pedestrians have individual speeds and the elderly woman walks slowest', () => {
  const { crowd } = setup();
  const types = ['tracksuit', 'elderly', 'mother', 'blonde'];
  const people = types.map(type => crowd.spawn(200, 1, true, type));
  crowd.update(1);
  assert.deepEqual(people.map(person => person.x - 200), [23, 11, 18, 21]);
  assert.deepEqual(people.map(person => person.hasBat), [true, false, false, false]);
  assert.ok(people[1].phase < 7);
  for (const person of people) { crowd.hit(person); person.stun = 0; }
  const starts = people.map(person => person.x);
  crowd.update(1);
  assert.deepEqual(people.map((person, i) => person.x - starts[i]), [92, 30, 46, 64]);
});

test('ambient arrivals cycle through the original and all three new NPCs', () => {
  const { crowd } = setup();
  const types = [];
  for (let i = 0; i < 8; i++) {
    crowd.people = [];
    crowd.spawnTimer = 0;
    crowd.update(0.01);
    types.push(crowd.people[0].type);
  }
  assert.deepEqual(types, ['tracksuit', 'elderly', 'mother', 'blonde',
    'tracksuit', 'elderly', 'mother', 'blonde']);
  crowd.reset();
  crowd.spawnTimer = 0;
  crowd.update(0.01);
  assert.equal(crowd.people[0].type, 'tracksuit');
});

test('new NPCs do not reuse the tracksuit male voice and retain hit handling', () => {
  const { engine, crowd } = setup();
  engine.audio = { playPasserby: () => { throw new Error('Wrong NPC voice'); } };
  for (const type of ['elderly', 'mother', 'blonde']) {
    const person = crowd.spawn(145, 1, true, type);
    crowd.update(0.01);
    for (let i = 0; i < 3; i++) crowd.hit(person);
    assert.equal(person.state, 'down');
    assert.equal(person.hasBat, false);
  }
});

test('the mother completes one eight-frame stride per 24 pixels at either speed and direction', () => {
  for (const facing of [-1, 1]) {
    for (const state of ['walk', 'flee']) {
      const { crowd } = setup();
      const mother = crowd.spawn(200, facing, false, 'mother');
      mother.state = state;
      mother.phase = 0;
      const speed = state === 'walk' ? 18 : 46;
      for (let i = 0; i < 10; i++) crowd.update(24 / speed / 10);
      assert.ok(Math.abs(mother.phase - 8) < 1e-9);
      assert.ok(Math.abs(mother.x - (200 + facing * 24)) < 1e-9);
      const phase = mother.phase;
      mother.stun = 1;
      crowd.update(0.1);
      assert.equal(mother.phase, phase);
    }
  }
});

test('tracksuit stops near player to confront, faces player, and resumes after player walks away', () => {
  const { engine, crowd } = setup();
  engine.audio = { playPasserby: () => true, lastVoiceLine: 'Masz jakiś problem?' };
  // player at 100, width 48 -> center 124
  const person = crowd.spawn(145, -1, true, 'tracksuit');
  crowd.update(0.01);
  assert.equal(person.state, 'confront');
  assert.equal(person.facing, -1);
  assert.equal(person.speechText, 'Masz jakiś problem?');
  const stoppedX = person.x;
  crowd.update(1.0);
  assert.equal(person.state, 'confront');
  assert.equal(person.x, stoppedX);

  engine.player.x = 220;
  crowd.update(0.5);
  assert.equal(person.state, 'confront');
  crowd.update(0.8);
  assert.equal(person.state, 'walk');
  assert.equal(person.facing, -1);
  crowd.update(1.0);
  assert.ok(person.x < stoppedX);
});
