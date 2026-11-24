const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../location_dialogues.js');
require('../building_interaction.js');

function setup(id = 'tenement') {
  const interaction = Object.create(globalThis.BuildingInteraction.prototype);
  Object.assign(interaction, {
    destination: { id, type: 'block', description: 'Klatka.' },
    room: null, state: 'inside', elapsed: 0, notes: new Map(), pendingCall: null,
    engine: { audio: { setWalking() {}, ringIntercom() {} } },
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
      assert.match([...b.notes.values()].at(-1).title, new RegExp(person.name));
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
  b.choices[0][1]();
  assert.equal(b.notes.size, 1);
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
    assert.equal(b.notes.size, 1);
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
