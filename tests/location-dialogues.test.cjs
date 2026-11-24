const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../location_dialogues.js');
require('../building_interaction.js');

function setup(id = 'tenement') {
  const interaction = Object.create(globalThis.BuildingInteraction.prototype);
  Object.assign(interaction, {
    destination: { id, type: 'block', description: 'Klatka.' },
    room: null, state: 'inside', elapsed: 0, notes: new Map(), pendingCall: null,
    questFlags: new Set(), readTopics: new Set(), inventory: {},
    engine: { audio: { setWalking() {}, ringIntercom() {} } },
    interiorHero: { enter() {}, update() {}, walkTo() {} },
    setChoices(message, choices) { this.message = message; this.choices = choices; }
  });
  return interaction;
}

test('all six intercoms have their own residents and different information', () => {
  const homes = globalThis.LOCATION_DIALOGUES.homes;
  assert.equal(Object.keys(homes).length, 6);
  const names = new Set();
  const answers = new Set();
  for (const id of Object.keys(homes)) {
    const b = setup(id);
    b.showIntercom();
    assert.equal(b.choices.length, 6);
    for (const person of b.residents) {
      assert.equal(names.has(person.name), false, person.name);
      names.add(person.name);
      if (person.own) continue;
      b.callResident(person);
      assert.equal(b.pendingCall.resident, person);
      b.update(1.6);
      assert.equal(b.speaker, person);
      assert.equal(b.message, person.greeting);
      const [question, answer] = person.topics[0];
      assert.equal(answers.has(answer), false, person.name);
      answers.add(answer);
      b.choices[0][1]();
      assert.equal(b.message, answer);
      assert.equal(b.readTopics.has(`${person.name}:0`), true);
      b.choices.at(-1)[1]();
      assert.equal(b.menu, 'intercom');
    }
  }
});

test('flat 5 in the old tenement opens the home without an intercom call', () => {
  const b = setup();
  b.showIntercom();
  assert.match(b.choices[4][0], /Moje mieszkanie.*5/);
  b.choices[4][1]();
  assert.equal(b.room, 'apartment');
  assert.equal(b.pendingCall, null);
  assert.equal(b.menu, 'main');
  assert.match(b.message, /dwiema kieszeniami/);
  b.choices[1][1]();
  assert.equal(b.menu, 'home-detail');
  assert.match(b.message, /A do odtwarzania.*B do nagrania/);
  b.leaveApartment();
  assert.equal(b.room, null);
  assert.equal(b.menu, 'main');
  assert.equal(b.destination.id, 'tenement');
});

test('repeated topics do not duplicate notes and the notebook stays within six keyboard choices', () => {
  const b = setup('block');
  b.callResident(b.residents[0]);
  b.update(1.6);
  b.choices[0][1]();
  const size = b.notes.size;
  b.choices[0][1]();
  assert.equal(b.notes.size, size);
  assert.ok([...b.notes.values()].some(note => /Kieszeń A/.test(note.text)));
  for (let i = 0; i < 20; i++) b.notes.set(`test:${i}`, { title: `Informacja ${i}`, text: `Treść ${i}` });
  b.showNotebook(1);
  assert.equal(b.choices.length, 6);
  b.choices[0][1]();
  assert.equal(b.menu, 'note');
  assert.match(b.message, /Treść/);
  b.choices[0][1]();
  assert.match(b.message, /strona 2/);
});

test('each shop offers useful conversation topics that can be saved as notes', () => {
  for (const id of Object.keys(globalThis.LOCATION_DIALOGUES.shops)) {
    const b = setup(id);
    b.destination.type = undefined;
    b.showShopConversation();
    assert.equal(b.speaker, globalThis.LOCATION_DIALOGUES.shops[id]);
    assert.equal(b.choices.length, 4);
    b.choices[0][1]();
    assert.ok(b.notes.size > 0);
    b.choices.at(-1)[1]();
    assert.equal(b.menu, 'main');
  }
});

test('returning to the location cancels a pending intercom response', () => {
  const b = setup('block-blue');
  b.callResident(b.residents[0]);
  b.showMenu();
  b.update(2);
  assert.equal(b.pendingCall, null);
  assert.equal(b.menu, 'main');
  assert.equal(b.speaker, null);
});

test('every resident has several questions and quest supplies are only awarded once', () => {
  for (const people of Object.values(globalThis.LOCATION_DIALOGUES.homes)) {
    for (const person of people) if (!person.own) assert.ok(person.topics.length >= 3, person.name);
  }
  const b = setup('block-blue');
  b.inventory = {};
  b.showConversation(b.residents[0], () => {});
  b.choices[3][1]();
  b.choices[3][1]();
  assert.equal(b.inventory.originalTape, 1);
  b.destination.id = 'block-turquoise';
  b.showConversation(b.residents[0], () => {});
  b.choices[3][1]();
  b.inventory.blankTape = 0;
  b.choices[3][1]();
  assert.equal(b.inventory.blankTape, 0, 'a used blank tape cannot be claimed again');
});

test('cassette quest requires preparation and playback before a single sale', () => {
  const b = setup();
  b.inventory = { originalTape: 1, blankTape: 1 };
  b.copyTape();
  assert.equal(b.inventory.copiedTape, undefined);
  b.listenTape();
  assert.equal(b.questFlags?.has('listened') ?? false, false);
  b.inspectHome('cassette');
  b.recordTopic(globalThis.LOCATION_DIALOGUES.homes.block[0], 0);
  b.recordTopic(globalThis.LOCATION_DIALOGUES.homes['block-blue'][0], 1);
  b.copyTape();
  assert.equal(b.inventory.blankTape, 0);
  assert.equal(b.inventory.originalTape, 1);
  assert.equal(b.inventory.copiedTape, 1);
  b.copyTape();
  assert.equal(b.inventory.blankTape, 0);
  b.money = 20;
  b.sellTape();
  assert.equal(b.money, 20, 'unchecked copies cannot be sold');
  b.listenTape();
  assert.equal(b.questFlags.has('listened'), true);
  assert.equal(b.questChapters()[2].steps[2][1], false, 'playback alone does not complete the quest');
  b.sellTape();
  assert.equal(b.money, 32);
  assert.equal(b.inventory.copiedTape, 0);
  assert.equal(b.inventory.originalTape, 1);
  b.sellTape();
  assert.equal(b.money, 32, 'the same copy cannot be sold twice');
  assert.ok(b.questChapters()[2].steps.every(([, done]) => done));
});

test('quest objectives avoid addresses and notes retain only discovered useful information', () => {
  const b = setup();
  assert.equal(b.notes.size, 0);
  assert.doesNotMatch(JSON.stringify(b.questChapters()), /Stefan|Zofi|Marek|zielony|niebieski|turkusowy/);
  b.recordTopic(globalThis.LOCATION_DIALOGUES.homes.tenement[0], 0);
  assert.equal(b.notes.get('contact:stefan').text, 'Zielony blok, m. 1 · zna się na magnetofonach i przegrywaniu kaset.');
  assert.equal(b.notes.has('contact:zofia'), false);
  assert.equal(b.readTopics.has('Helena Wolska:0'), true);
  assert.ok([...b.notes.values()].every(note => note.text.length < 150));
});

test('browser save round trip retains money, supplies, knowledge and location', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let stored;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    setItem(key, value) { stored = value; }, getItem() { return stored; }
  } });
  try {
    const b = setup();
    b.engine.player = { x: 125, facing: -1 };
    b.engine.cameraX = 20;
    b.engine.background = { level: 'prl' };
    b.engine.character = { currentSkin: 'urban_hero' };
    b.money = 11;
    b.inventory = { bread: 2, originalTape: 1 };
    b.questFlags.add('original');
    b.recordTopic(globalThis.LOCATION_DIALOGUES.homes.block[0], 0);
    assert.equal(b.saveGame(), true);
    const restored = setup();
    restored.questNotice = {};
    restored.loadGame();
    assert.equal(restored.money, 11);
    assert.equal(restored.inventory.bread, 2);
    assert.equal(restored.inventory.originalTape, 1);
    assert.equal(restored.questFlags.has('original'), true);
    assert.equal(restored.readTopics.has('Stefan Malec:0'), true);
    assert.equal(restored.notes.get('tip:Stefan Malec:0').title, 'Przegrywanie kaset');
    assert.equal(restored.loadedLocation.x, 125);
    assert.equal(restored.loadedLocation.destination, 'tenement');
    stored = '{broken';
    assert.doesNotThrow(() => setup().loadGame());
    globalThis.localStorage.setItem = () => { throw new Error('Storage disabled'); };
    assert.equal(b.saveGame(), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});
