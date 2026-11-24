/* Shared by the standalone file:// game and the ES module engine. */
const BUILDING_ENTRY_TIMING = { turn: 0.16, walk: 0.4, fade: 0.14 };
const GAME_SAVE_KEY = 'pixel-osiedle-save-v1';
const GAME_ITEMS = ['bread', 'orangeade', 'newspaper', 'crossword', 'apples', 'ticket', 'originalTape', 'blankTape', 'copiedTape'];

globalThis.BuildingInteraction = class BuildingInteraction {
  constructor(engine) {
    this.engine = engine;
    this.state = 'street';
    this.elapsed = 0;
    this.money = 20;
    this.inventory = { bread: 0, orangeade: 0, newspaper: 0, crossword: 0, apples: 0, ticket: 0 };
    this.frames = new Map();
    this.interiorHero = new globalThis.InteriorHero();
    this.entryAtlas = null;
    this.entryReady = new Promise(resolve => {
      const atlas = new Image();
      atlas.onload = () => { this.entryAtlas = atlas; resolve(true); };
      atlas.onerror = () => resolve(false);
      atlas.src = globalThis.ENTRY_HERO_ASSETS.sheet;
    });
    this.interiorImage = new Image();
    this.interiorImage.src = './Nostalgiczny sklep Społem w pikselach.png';
    this.destinations = [
      { id: 'tenement', type: 'block', x: 40, width: 12, title: 'KAMIENICA', subtitle: 'Stara klatka', asset: 'stairwell-01', description: 'Drewniane stopnie skrzypią. Bordowa lamperia jest przetarta, a pod oknem odchodzi tynk.' },
      { id: 'spolem', x: 144, width: 19, title: 'SPOŁEM', subtitle: 'Sklep osiedlowy' },
      { id: 'block', type: 'block', x: 250, width: 25, title: 'BLOK NR 2', subtitle: 'Zielona klatka', asset: 'stairwell-02', description: 'Zapach wilgotnego lastryka. Zielona farba odpryskuje z poręczy, nad skrzynkami brzęczy świetlówka.' },
      { id: 'ruch', x: 367, width: 12, title: 'RUCH', subtitle: 'Prasa i drobiazgi', asset: 'ruch' },
      { id: 'block-blue', type: 'block', x: 458, width: 23, title: 'BLOK NR 3', subtitle: 'Niebieska klatka', asset: 'stairwell-03', description: 'Niebieska lamperia pamięta lepsze czasy. Pod oknem stoi stary kaloryfer, na tablicy wiszą pożółkłe ogłoszenia.' },
      { id: 'cinema', x: 637, width: 80, title: 'KINO', subtitle: 'Kasa biletowa', asset: 'cinema' },
      { id: 'market', x: 869, width: 19, title: 'TARG', subtitle: 'Warzywniak pod dachem', asset: 'market' },
      { id: 'block-yellow', type: 'block', x: 1238, width: 28, title: 'BLOK NR 4', subtitle: 'Żółta klatka', asset: 'stairwell-04', description: 'Musztardowa farba, chłodne lastryko i ciężkie drzwi do piwnicy. W rogu widać ślady dawnego zacieku.' },
      { id: 'tower', type: 'block', x: 1420, width: 13, title: 'PUNKTOWIEC', subtitle: 'Klatka z windą', asset: 'stairwell-05', description: 'Za porysowanymi drzwiami buczy stara winda. Rdzawa lamperia i gołe przewody pod sufitem.' },
      { id: 'block-turquoise', type: 'block', x: 1576, width: 20, title: 'BLOK NR 6', subtitle: 'Turkusowa klatka', asset: 'stairwell-06', description: 'Spod turkusowej farby wychodzi beż. Wgniecione skrzynki, zardzewiała rura i wydeptane stopnie.' }
    ];
    this.images = new Map();
    for (const destination of this.destinations) {
      destination.prompt = `↑ / W · ${destination.type === 'block' ? 'Wejdź do klatki' : 'Wejdź: ' + destination.title}`;
      if (destination.asset) {
        const image = new Image();
        image.src = `./assets/interiors/${destination.asset}.png`;
        this.images.set(destination.id, image);
      }
    }
    this.destination = null;
    this.pendingCall = null;
    this.room = null;
    this.notes = new Map();
    this.readTopics = new Set();
    this.questFlags = new Set();
    this.restoring = true;
    this.saveElapsed = 0;
    this.createJournal();
    const apartment = new Image();
    apartment.src = './assets/interiors/apartment-05.png';
    this.images.set('apartment-05', apartment);
    this.prompt = document.createElement('button');
    this.prompt.className = 'building-prompt';
    this.prompt.textContent = '↑ / W · Wejdź do Społem';
    this.prompt.hidden = true;
    this.prompt.addEventListener('click', () => this.enter());
    document.body.append(this.prompt);
    this.panel = document.createElement('section');
    this.panel.className = 'shop-dialog';
    this.panel.hidden = true;
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-modal', 'true');
    this.panel.setAttribute('aria-label', 'Sklep Społem');
    this.panel.innerHTML = '<div class="shop-heading"><span>SPOŁEM <small>Sklep osiedlowy</small></span><span class="shop-wallet"></span></div><p class="shop-message" role="status" aria-live="polite"></p><div class="shop-choices"></div><small class="shop-help">↑ ↓ wybór · Enter zatwierdź · Esc powrót / wyjście</small>';
    document.body.append(this.panel);
    this.loadGame();
    window.addEventListener('pagehide', () => this.saveGame());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.saveGame();
    });
  }

  get active() { return this.state !== 'street' || Boolean(this.journalTab); }

  saveGame() {
    if (this.restoring || !this.engine.player) return false;
    const e = this.engine;
    const position = this.state !== 'street' && this.saved ? this.saved : e.player;
    const data = {
      version: 1, money: this.money, inventory: this.inventory,
      readTopics: [...this.readTopics], questFlags: [...this.questFlags],
      location: {
        level: e.background.level, skin: e.character.currentSkin,
        x: position.x, cameraX: this.saved?.cameraX ?? e.cameraX, facing: position.facing,
        destination: this.state === 'inside' ? this.destination?.id : null,
        room: this.state === 'inside' ? this.room : null
      }
    };
    try {
      globalThis.localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(data));
      this.saveFailed = false;
      return true;
    } catch {
      this.saveFailed = true;
      if (this.questNotice) this.questNotice.textContent = 'Zapis niedostępny — przeglądarka blokuje pamięć gry.';
      return false;
    }
  }

  loadGame() {
    try {
      const data = JSON.parse(globalThis.localStorage.getItem(GAME_SAVE_KEY));
      if (!data || data.version !== 1) return;
      if (!Number.isSafeInteger(data.money) || data.money < 0 || data.money > 1000000) return;
      if (!data.inventory || typeof data.inventory !== 'object') return;
      const topics = new Set(Object.values(globalThis.LOCATION_DIALOGUES.homes).flat()
        .concat(Object.values(globalThis.LOCATION_DIALOGUES.shops))
        .flatMap(person => (person.topics ?? []).map((_, i) => `${person.name}:${i}`)));
      this.money = data.money;
      for (const item of GAME_ITEMS) {
        const count = data.inventory[item];
        this.inventory[item] = Number.isSafeInteger(count) && count >= 0 && count <= 9999 ? count : 0;
      }
      this.readTopics = new Set((Array.isArray(data.readTopics) ? data.readTopics : []).filter(key => topics.has(key)));
      const flags = ['radio', 'original', 'blank', 'copied', 'listened', 'sold'];
      this.questFlags = new Set((Array.isArray(data.questFlags) ? data.questFlags : []).filter(flag => flags.includes(flag)));
      for (const people of [...Object.values(globalThis.LOCATION_DIALOGUES.homes), Object.values(globalThis.LOCATION_DIALOGUES.shops)]) {
        for (const speaker of people) (speaker.topics ?? []).forEach((_, index) => {
          if (this.readTopics.has(`${speaker.name}:${index}`)) this.recordTopic(speaker, index);
        });
      }
      const location = data.location;
      if (location && ['city', 'prl'].includes(location.level) && Number.isFinite(location.x) && location.x >= 0 && location.x <= 10000000 && Number.isFinite(location.cameraX) && location.cameraX >= 0 && location.cameraX <= 10000000) this.loadedLocation = location;
      this.questNotice.textContent = '✓ Wczytano zapis gry';
    } catch {
      // A missing, corrupted or unavailable save must never prevent starting the game.
    }
  }

  async restoreLocation() {
    try {
      const location = this.loadedLocation;
      if (!location) return;
      const e = this.engine;
      if (location.level !== e.background.level) await e.setLevel(location.level);
      if (['urban_hero', 'cyber_ronin'].includes(location.skin)) e.character.setSkin(location.skin);
      e.cameraX = location.cameraX;
      Object.assign(e.player, { x: location.x, y: e.getGroundLevel(), facing: location.facing === -1 ? -1 : 1, vx: 0, vy: 0, isGrounded: true });
      e.setAnimation('idle');
      const destination = location.level === 'prl' && this.destinations.find(place => place.id === location.destination);
      if (destination) {
        this.saved = { x: e.player.x, y: e.player.y, facing: e.player.facing, cameraX: e.cameraX };
        this.destination = destination;
        this.state = 'inside';
        this.room = destination.id === 'tenement' && location.room === 'apartment' ? 'apartment' : null;
        document.body.classList.add('in-building');
        this.showMenu();
      }
    } finally {
      this.restoring = false;
    }
  }

  recordTopic(speaker, index) {
    const key = `${speaker.name}:${index}`;
    this.readTopics.add(key);
    const answer = speaker.topics[index][1];
    for (const contact of globalThis.LOCATION_DIALOGUES.contacts) {
      if (contact.name === speaker.name || contact.match.test(answer)) this.notes.set(`contact:${contact.id}`, { title: contact.name, text: contact.text });
    }
    const tip = globalThis.LOCATION_DIALOGUES.tips[key];
    if (tip) this.notes.set(`tip:${key}`, { title: tip[0], text: tip[1] });
  }

  createJournal() {
    this.toolbar = document.createElement('nav');
    this.toolbar.className = 'game-tools';
    this.toolbar.setAttribute('aria-label', 'Ekwipunek i dzienniki');
    for (const [tab, label, key] of [['inventory', '▣ Ekwipunek', 'I'], ['notes', '▤ Notatnik', 'N'], ['quests', '☑ Zadania', 'L']]) {
      const button = document.createElement('button');
      button.textContent = `${label} [${key}]`;
      button.setAttribute('aria-expanded', 'false');
      button.dataset.tab = tab;
      button.addEventListener('click', () => this.openJournal(tab));
      this.toolbar.append(button);
    }
    this.questNotice = document.createElement('span');
    this.questNotice.className = 'quest-notice';
    this.questNotice.setAttribute('role', 'status');
    this.questNotice.textContent = 'Nowe zadanie: Pierwsza własna kopia';
    this.toolbar.append(this.questNotice);
    this.journal = document.createElement('section');
    this.journal.className = 'journal-panel';
    this.journal.hidden = true;
    this.journal.setAttribute('role', 'dialog');
    this.journal.setAttribute('aria-modal', 'true');
    document.body.append(this.toolbar, this.journal);
  }

  markQuest(flag) {
    this.questFlags ??= new Set();
    if (this.questFlags.has(flag)) return;
    this.questFlags.add(flag);
    if (this.questNotice) this.questNotice.textContent = flag === 'sold' ? '✓ Zadanie ukończone: Pierwsza własna kopia' : '✓ Zaktualizowano dziennik zadań [L]';
    this.saveGame();
  }

  questChapters() {
    const has = flag => this.questFlags?.has(flag) ?? false;
    return [
      { title: '1. Poznaj swój sprzęt', steps: [
        ['Obejrzyj swój magnetofon w mieszkaniu nr 5 w kamienicy.', has('radio')],
        ['Zdobądź informacje o przegrywaniu kaset.', this.readTopics.has('Stefan Malec:0')],
        ['Zdobądź informacje o ochronie oryginału nagrania.', this.readTopics.has('Zofia Wiśniewska:1')]
      ] },
      { title: '2. Zdobądź dwie kasety', steps: [
        ['Zdobądź nagranie.', has('original')],
        ['Zdobądź czystą kasetę.', has('blank')]
      ] },
      { title: '3. Pierwsza własna kopia', steps: [
        ['Wykonaj kopię nagrania.', has('copied')],
        ['Odsłuchaj kopię.', has('listened')],
        ['Sprzedaj sprawdzoną kopię nagrania.', has('sold')]
      ] }
    ];
  }

  openJournal(tab) {
    if (this.journalTab === tab) return this.closeJournal();
    if (!this.journalTab) this.journalReturnFocus = document.activeElement;
    this.journalTab = tab;
    this.engine.keys = {};
    this.engine.audio.setWalking(false);
    this.panel.inert = true;
    document.body.classList.add('journal-open');
    this.prompt.hidden = true;
    this.journal.hidden = false;
    const titles = { inventory: 'Ekwipunek', notes: 'Notatnik', quests: 'Dziennik zadań' };
    this.journal.setAttribute('aria-label', titles[tab]);
    this.journal.replaceChildren();
    const heading = document.createElement('h2');
    heading.textContent = titles[tab];
    this.journal.append(heading);
    const addCard = (title, content) => {
      const card = document.createElement('article');
      const name = document.createElement('h3');
      name.textContent = title;
      const text = document.createElement('p');
      text.textContent = content;
      card.append(name, text);
      this.journal.append(card);
      return card;
    };
    if (tab === 'inventory') {
      addCard('Portfel', `${this.money} zł`);
      const names = { bread: 'Chleb', orangeade: 'Oranżada', newspaper: 'Gazeta', crossword: 'Krzyżówki', apples: 'Jabłka', ticket: 'Bilet do kina', originalTape: 'Pożyczona kaseta Zofii · oryginał', blankTape: 'Czysta kaseta C60', copiedTape: 'Własna kopia nagrania' };
      const items = Object.entries(this.inventory).filter(([, count]) => count > 0);
      items.forEach(([item, count]) => addCard(names[item] ?? item, `Ilość: ${count}`));
      if (!items.length) addCard('Plecak jest pusty', 'Przedmioty z zakupów i zadań pojawią się tutaj.');
    } else if (tab === 'notes') {
      if (!this.notes.size) addCard('Jeszcze brak notatek', 'Rozmawiaj z mieszkańcami. Przydatne adresy i wskazówki zapisują się tutaj.');
      this.notes.forEach(note => addCard(note.title, note.text));
    } else {
      const chapters = this.questChapters();
      const current = chapters.findIndex(chapter => chapter.steps.some(([, done]) => !done));
      addCard('Pierwsza własna kopia', current < 0 ? 'Ukończone! Kopia została nagrana, odsłuchana i sprzedana. Zarobek: 12 zł.' : 'Poznaj obsługę magnetofonu, zdobądź kasety i przygotuj własną kopię na sprzedaż.');
      chapters.forEach((chapter, index) => {
        const done = chapter.steps.filter(([, complete]) => complete).length;
        const card = addCard(`${done === chapter.steps.length ? '✓' : index === current ? '→' : '○'} ${chapter.title} · ${done}/${chapter.steps.length}`, chapter.steps.map(([label, complete]) => `${complete ? '✓' : '□'} ${label}`).join('\n'));
        card.classList.toggle('quest-current', index === current);
      });
    }
    const close = document.createElement('button');
    close.className = 'navigation-back';
    close.textContent = '↩ Powrót do gry · Esc';
    close.addEventListener('click', () => this.closeJournal());
    this.journal.append(close);
    this.toolbar.querySelectorAll('button').forEach(button => button.setAttribute('aria-expanded', String(button.dataset.tab === tab)));
    close.focus({ preventScroll: true });
  }

  closeJournal() {
    this.journalTab = null;
    this.journal.hidden = true;
    this.panel.inert = false;
    this.engine.keys = {};
    document.body.classList.remove('journal-open');
    this.toolbar.querySelectorAll('button').forEach(button => button.setAttribute('aria-expanded', 'false'));
    this.journalReturnFocus?.focus({ preventScroll: true });
  }

  get residents() { return globalThis.LOCATION_DIALOGUES.homes[this.destination?.id] ?? []; }

  nearbyDoor() {
    const e = this.engine;
    const scenery = e.background.prlBackground;
    if (e.background.level !== 'prl' || !scenery?.layers || !e.player.isGrounded || e.demoMode) return null;
    // Use the same integer parallax and panorama repetition as the building layer.
    const width = scenery.layers.front.width;
    const offset = Math.floor(Math.max(0, e.cameraX) * 0.45) % width;
    const center = e.player.x - e.cameraX + e.character.width / 2;
    return this.destinations.map(destination => {
      const x = destination.x - offset + Math.round((center - (destination.x - offset)) / width) * width;
      return { x, y: scenery.buildingBaselineY - 1, destination };
    }).filter(door => Math.abs(door.x - center) <= 22)
      .sort((a, b) => Math.abs(a.x - center) - Math.abs(b.x - center))[0] ?? null;
  }

  handleKey(event) {
    if (event.target.closest?.('input, select, textarea') || document.querySelector('.side-drawer.open')) return false;
    const tab = { KeyI: 'inventory', KeyN: 'notes', KeyL: 'quests' }[event.code];
    if (tab) {
      event.preventDefault();
      if (!event.repeat) this.openJournal(tab);
      return true;
    }
    if (this.journalTab) {
      if (event.code === 'Escape') { event.preventDefault(); this.closeJournal(); }
      else if (event.code === 'Tab') {
        const buttons = [...this.toolbar.querySelectorAll('button'), ...this.journal.querySelectorAll('button')];
        const index = buttons.indexOf(document.activeElement);
        event.preventDefault();
        buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      } else if (!['Enter', 'Space'].includes(event.code)) event.preventDefault();
      return true;
    }
    if (event.target.closest?.('.game-tools') && ['Enter', 'Space'].includes(event.code)) return true;
    if (this.active && event.code === 'Tab') {
      const buttons = [...this.toolbar.querySelectorAll('button'), ...this.panel.querySelectorAll('button')];
      const index = buttons.indexOf(document.activeElement);
      event.preventDefault();
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      return true;
    }
    if (!this.active) {
      if (['ArrowUp', 'KeyW'].includes(event.code) && this.nearbyDoor()) {
        if (!event.repeat) this.enter();
        event.preventDefault();
        return true;
      }
      return false;
    }
    event.preventDefault();
    if (event.repeat || this.state !== 'inside') return true;
    if (event.code === 'Escape') {
      if (this.backAction) this.backAction();
      else if (this.menu === 'main' && this.room === 'apartment') this.leaveApartment();
      else if (this.menu === 'main') this.exit();
      else this.showMenu();
    } else if (['ArrowUp', 'ArrowDown'].includes(event.code)) {
      const buttons = [...this.panel.querySelectorAll('button')];
      const index = buttons.indexOf(document.activeElement);
      buttons[(index + (event.code === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length].focus();
    } else if (/^Digit[1-6]$/.test(event.code)) {
      this.panel.querySelectorAll('button')[Number(event.code.slice(-1)) - 1]?.click();
    } else if (['Enter', 'Space'].includes(event.code)) {
      if (this.panel.contains(document.activeElement)) document.activeElement.click();
    } else if (event.code === 'Tab') {
      const buttons = [...this.panel.querySelectorAll('button')];
      const index = buttons.indexOf(document.activeElement);
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    }
    return true;
  }

  enter() {
    const door = this.nearbyDoor();
    if (this.active || !door) return;
    const e = this.engine;
    this.saved = { x: e.player.x, y: e.getGroundLevel(), facing: e.player.facing, cameraX: e.cameraX };
    this.door = door;
    this.destination = door.destination;
    this.room = null;
    this.state = 'entering';
    this.elapsed = 0;
    this.previousFocus = document.activeElement;
    e.keys = {};
    e.player.vx = e.player.vy = 0;
    e.setAnimation('idle');
    this.prompt.hidden = true;
    document.body.classList.add('in-building');
  }

  exit() {
    if (this.state !== 'inside') return;
    this.state = 'leaving';
    this.elapsed = 0;
    this.panel.hidden = true;
    this.pendingCall = null;
    this.engine.keys = {};
  }

  reset() {
    const e = this.engine;
    if (this.saved) {
      Object.assign(e.player, { x: this.saved.x, y: this.saved.y, facing: this.saved.facing, vx: 0, vy: 0, isGrounded: true });
      e.cameraX = this.saved.cameraX;
    }
    this.state = 'street';
    this.saved = null;
    this.destination = null;
    this.room = null;
    this.speaker = null;
    this.interiorHero.scene = null;
    this.pendingCall = null;
    this.panel.hidden = this.prompt.hidden = true;
    e.keys = {};
    e.audio.setWalking(false);
    document.body.classList.remove('in-building');
    this.previousFocus?.focus({ preventScroll: true });
    this.saveGame();
  }

  update(dt) {
    this.saveElapsed = (this.saveElapsed ?? 0) + dt;
    if (this.saveElapsed >= 2) {
      this.saveElapsed = 0;
      this.saveGame();
    }
    if (this.journalTab) return true;
    if (!this.active) {
      const door = this.nearbyDoor();
      this.prompt.hidden = !door;
      if (door) this.prompt.textContent = door.destination.prompt;
      return false;
    }
    this.elapsed += dt;
    if (this.state === 'inside' && this.destination?.id === 'tenement') this.interiorHero.update(dt);
    const arrival = BUILDING_ENTRY_TIMING.turn + BUILDING_ENTRY_TIMING.walk;
    const walking = this.state === 'entering' && this.elapsed >= BUILDING_ENTRY_TIMING.turn && this.elapsed < arrival;
    this.engine.audio.setWalking(walking);
    if (this.state === 'entering' && this.elapsed >= arrival + BUILDING_ENTRY_TIMING.fade) {
      this.state = 'inside';
      this.elapsed = 0;
      this.engine.audio.setWalking(false);
      this.showMenu();
    } else if (this.state === 'leaving' && this.elapsed >= 0.5) {
      this.reset();
    }
    if (this.state === 'inside' && this.pendingCall) {
      this.pendingCall.remaining -= dt;
      if (this.pendingCall.remaining <= 0) {
        const resident = this.pendingCall.resident;
        this.pendingCall = null;
        this.showConversation(resident, () => this.showIntercom());
      }
    }
    return true;
  }

  showMenu(message = 'Dzień dobry! Co podać?') {
    this.pendingCall = null;
    this.speaker = null;
    if (this.room === 'apartment') return this.showApartment();
    if (this.destination?.type === 'block') return this.showStairwell();
    if (this.destination?.id !== 'spolem') return this.showLocalMenu();
    this.menu = 'main';
    this.setChoices(message, [
      ['Zobacz towary', () => this.showGoods()],
      ['Porozmawiaj', () => this.showShopConversation()],
      ['Notatnik', () => this.showNotebook()],
      ['Wyjdź na ulicę', () => this.exit()]
    ]);
  }

  showStairwell(message = this.destination.description) {
    if (this.destination.id === 'tenement') this.interiorHero.enter('tenement:stairs');
    this.menu = 'main';
    this.setChoices(message, [
      ...(this.destination.id === 'tenement' ? [['Mieszkanie 5 · moje mieszkanie', () => this.showApartment()]] : []),
      ['Domofon · spis mieszkańców', () => this.showIntercom()],
      ['Obejrzyj klatkę', () => this.showStairwell(this.destination.description + ' Na półpiętrze słychać radio zza zamkniętych drzwi.')],
      ['Notatnik', () => this.showNotebook()],
      ['Wyjdź na ulicę', () => this.exit()]
    ]);
  }

  showLocalMenu() {
    this.menu = 'main';
    const messages = {
      ruch: 'Dzień dobry. Jest dzisiejsza prasa i krzyżówki. Co podać?',
      cinema: 'Wieczorny seans o dziewiętnastej. Bilety kupisz tutaj, w kasie.',
      market: 'Jabłka prosto z sadu! Proszę podejść, proszę wybierać.'
    };
    this.setChoices(messages[this.destination.id], [
      [this.destination.id === 'cinema' ? 'Kup bilet' : 'Zobacz towary', () => this.showGoods()],
      ['Porozmawiaj', () => this.showShopConversation()],
      ['Notatnik', () => this.showNotebook()],
      ['Wyjdź na ulicę', () => this.exit()]
    ]);
  }

  showIntercom() {
    this.menu = 'intercom';
    this.pendingCall = null;
    this.setChoices('Wybierz osobę, do której chcesz zadzwonić domofonem.', [
      ...this.residents.map(resident => [`${resident.name} · m. ${resident.flat}`, () => this.callResident(resident)]),
      ['Wróć do klatki', () => this.showMenu()]
    ]);
  }

  callResident(resident) {
    if (resident.own) return this.showApartment();
    this.menu = 'intercom-call';
    this.setChoices(`Dzwonienie… ${resident.name}, mieszkanie ${resident.flat}.`, [
      ['Wybierz inną osobę', () => this.showIntercom()],
      ['Wróć na ulicę', () => this.exit()]
    ]);
    this.pendingCall = { resident, remaining: 1.5 };
    this.engine.audio.ringIntercom();
  }

  showShopConversation() {
    this.showConversation(globalThis.LOCATION_DIALOGUES.shops[this.destination.id], () => this.showMenu());
  }

  showConversation(speaker, back, message = speaker.greeting) {
    this.menu = 'conversation';
    this.speaker = speaker;
    this.setChoices(message, [
      ...speaker.topics.map(([question, answer], index) => [question, () => {
        this.recordTopic(speaker, index);
        if ((speaker.name === 'Stefan Malec' && index === 0) || (speaker.name === 'Zofia Wiśniewska' && index === 1)) this.markQuest(`talk:${speaker.name}:${index}`);
        else if (this.questNotice) this.questNotice.textContent = '✓ Rozmowa zapamiętana · wskazówki w notatniku [N]';
        if (speaker.name === 'Zofia Wiśniewska' && index === 3 && !this.questFlags.has('original')) {
          this.inventory.originalTape = 1;
          this.markQuest('original');
        }
        if (speaker.name === 'Marek Wójcik' && index === 3 && !this.questFlags.has('blank')) {
          this.inventory.blankTape = 1;
          this.markQuest('blank');
        }
        const reply = speaker.name === 'Piotr Zieliński' && index === 3 ? this.sellTape() : answer;
        this.saveGame();
        this.showConversation(speaker, back, reply);
      }]),
      ['Zakończ rozmowę', back]
    ]);
  }

  showNotebook(page = 0) {
    if (this.journal) return this.openJournal('notes');
    this.pendingCall = null;
    this.speaker = null;
    this.menu = 'notebook';
    const notes = [...this.notes.values()];
    const pageCount = Math.max(1, Math.ceil(notes.length / 3));
    page = Math.max(0, Math.min(page, pageCount - 1));
    this.setChoices(notes.length ? `Poznane informacje · strona ${page + 1} z ${pageCount}` : 'Notatnik jest pusty. Zapytaj mieszkańców lub sprzedawców o okolicę.', [
      ...notes.slice(page * 3, page * 3 + 3).map(note => [note.title, () => {
        this.menu = 'note';
        this.setChoices(note.text, [['Wróć do notatnika', () => this.showNotebook(page)]]);
      }]),
      ...(page > 0 ? [['Poprzednia strona', () => this.showNotebook(page - 1)]] : []),
      ...(page + 1 < pageCount ? [['Następna strona', () => this.showNotebook(page + 1)]] : []),
      ['Wróć', () => this.showMenu()]
    ]);
  }

  showApartment() {
    if (this.destination.id !== 'tenement') return;
    this.interiorHero.enter('tenement:apartment');
    this.room = 'apartment';
    this.pendingCall = null;
    this.speaker = null;
    this.menu = 'main';
    this.setChoices('Moje mieszkanie, numer 5. Monitor kineskopowy cicho brzęczy. Na szafce stoi radiomagnetofon z dwiema kieszeniami na kasety.', [
      ['Podejdź do komputera', () => this.inspectHome('computer')],
      ['Obejrzyj radiomagnetofon', () => this.inspectHome('cassette')],
      ['Notatnik', () => this.showNotebook()],
      ['Wyjdź na klatkę', () => this.leaveApartment()]
    ]);
  }

  inspectHome(object) {
    if (object === 'cassette') this.markQuest('radio');
    this.interiorHero.walkTo(object === 'computer' ? 0.19 : 0.23);
    this.menu = 'home-detail';
    const details = {
      computer: 'Stary komputer, osobna obudowa, klawiatura i głęboki monitor CRT. Na zielonym ekranie miga kursor. Obok leżą zapisane kartki i pudełka po kasetach.',
      cassette: 'Jeden radiomagnetofon, dwie kieszenie: A do odtwarzania oryginału, B do nagrania kopii. Włóż pożyczone nagranie do A, a czystą kasetę do B. Po kopiowaniu odsłuchaj rezultat.'
    };
    this.setChoices(details[object], [
      ...(object === 'cassette' ? [
        ['Nagraj kopię kasety', () => this.copyTape()],
        ['Odsłuchaj własną kopię', () => this.listenTape()]
      ] : []),
      ...(object === 'cassette' ? [['Jak przygotować kasety?', () => {
        this.setChoices('Oryginał i kaseta docelowa muszą być osobno. Sprawdź ich opis i długość. Porozmawiaj z mieszkańcami o obsłudze magnetofonu i zabezpieczeniu oryginalnego nagrania.', [['Wróć do radiomagnetofonu', () => this.inspectHome('cassette')]]);
      }]] : []),
      ['Wróć do pokoju', () => this.showApartment()]
    ]);
  }

  leaveApartment() {
    this.room = null;
    this.showMenu();
  }

  copyTape() {
    const prepared = this.questChapters()[0].steps.every(([, done]) => done);
    let message;
    if (this.questFlags?.has('copied')) message = 'Kopia jest już gotowa. Teraz odsłuchaj ją od początku do końca.';
    else if (!prepared) message = 'Najpierw poznaj obsługę sprzętu i zabezpieczenie oryginału. Dziennik zadań [L] wskaże brakujące kroki.';
    else if (!this.inventory.originalTape || !this.inventory.blankTape) message = 'Potrzebujesz oryginału nagrania i osobnej czystej taśmy. Poszukaj wskazówek w rozmowach i notatniku [N].';
    else {
      this.inventory.blankTape--;
      this.inventory.copiedTape = 1;
      this.markQuest('copied');
      message = 'Kopiowanie zakończone. Oryginał pozostał bez zmian, a własna kopia trafia do plecaka. Odsłuchaj ją, żeby sprawdzić nagranie.';
    }
    this.menu = 'home-detail';
    this.setChoices(message, [['Wróć do radiomagnetofonu', () => this.inspectHome('cassette')]]);
  }

  listenTape() {
    if (this.inventory.copiedTape) this.markQuest('listened');
    this.menu = 'home-detail';
    this.setChoices(this.inventory.copiedTape ? 'Sprawdzasz początek i koniec obu stron: muzyka jest kompletna, kopia brzmi poprawnie. Możesz ją sprzedać. Poszukaj kogoś, kto zbiera nagrania.' : 'Nie masz jeszcze własnej kopii. Najpierw przygotuj kasety i nagraj materiał.', [['Wróć do radiomagnetofonu', () => this.inspectHome('cassette')]]);
  }

  sellTape() {
    if (this.questFlags.has('sold')) return 'Tę kopię już od ciebie kupiłem. Dziękuję za nagranie!';
    if (!this.inventory.copiedTape) return 'Chętnie kupię kopię za 12 zł. Najpierw musisz ją nagrać na osobnej kasecie.';
    if (!this.questFlags.has('listened')) return 'Najpierw odsłuchaj kopię u siebie. Chcę mieć pewność, że całe nagranie jest na taśmie.';
    this.inventory.copiedTape--;
    this.money += 12;
    this.markQuest('sold');
    return 'Biorę ją! Dostajesz 12 zł, a kopia trafia do kolekcji Piotra. Zadanie „Pierwsza własna kopia” ukończone.';
  }

  showGoods(message, preserveSelection = false) {
    this.menu = 'goods';
    message ??= {
      spolem: 'Proszę wybierać. Wszystko świeżutkie!',
      ruch: 'Dzisiejsza gazeta i nowy numer krzyżówek. Proszę wybierać.',
      cinema: 'Jeden bilet na wieczorny seans kosztuje 8 zł.',
      market: 'Torba jabłek kosztuje 5 zł. Prosto z sadu!'
    }[this.destination.id];
    if (this.destination.id !== 'spolem') {
      const goods = {
        ruch: [['Gazeta · 2 zł', 'newspaper', 2, 'Gazeta trafia do plecaka.'], ['Krzyżówki · 3 zł', 'crossword', 3, 'Krzyżówki trafiają do plecaka.']],
        cinema: [['Bilet na seans · 8 zł', 'ticket', 8, 'Papierowy bilet trafia do plecaka.']],
        market: [['Jabłka · 5 zł', 'apples', 5, 'Torba jabłek trafia do plecaka.']]
      };
      return this.setChoices(message, [
        ...goods[this.destination.id].map(([label, item, price, reply]) => [label, () => this.buy(item, price, reply)]),
        ['Wróć', () => this.showMenu()]
      ], preserveSelection);
    }
    this.setChoices(message, [
      ['Chleb · 4 zł', () => this.buy('bread', 4, 'Chleb trafia do plecaka.')],
      ['Oranżada · 3 zł', () => this.buy('orangeade', 3, 'Oranżada trafia do plecaka.')],
      ['Wróć', () => this.showMenu()]
    ], preserveSelection);
  }

  buy(item, price, message) {
    if (this.money < price) return this.showGoods('Brakuje pieniędzy. Może następnym razem?', true);
    this.money -= price;
    this.inventory[item]++;
    this.saveGame();
    this.showGoods(message, true);
  }

  setChoices(message, choices, preserveSelection = false) {
    this.backAction = choices.find(([label]) => /^(Wróć|Wyjdź|Zakończ rozmowę)/.test(label))?.[1] ?? null;
    this.panel.hidden = false;
    const intercom = this.menu === 'intercom' || this.menu === 'intercom-call';
    const atHome = this.room === 'apartment';
    const talking = this.menu === 'conversation' && this.speaker;
    const residential = this.destination?.type === 'block';
    this.panel.classList.toggle('intercom-mode', intercom);
    this.panel.classList.toggle('dialogue-mode', ['conversation', 'notebook'].includes(this.menu));
    this.panel.classList.toggle('tenement-mode', this.destination.id === 'tenement');
    const title = atHome ? 'MOJE MIESZKANIE' : this.destination.title;
    this.panel.setAttribute('aria-label', intercom ? 'Domofon przy klatce' : talking ? this.speaker.name : title);
    this.panel.querySelector('.shop-heading > span:first-child').innerHTML = intercom
      ? 'DOMOFON <small>Spis mieszkańców</small>' : talking ? `${this.speaker.name} <small>Rozmowa</small>` : `${title} <small>${atHome ? 'Kamienica · mieszkanie 5' : this.destination.subtitle}</small>`;
    const wallet = this.panel.querySelector('.shop-wallet');
    wallet.hidden = residential;
    wallet.textContent = `${this.money} zł`;
    this.panel.querySelector('.shop-help').textContent = intercom
      ? '1–5 mieszkanie · ↑ ↓ wybór · Enter zatwierdź · Esc powrót / wyjście'
      : '↑ ↓ wybór · Enter zatwierdź · Esc powrót / wyjście';
    this.panel.querySelector('.shop-message').textContent = message;
    const container = this.panel.querySelector('.shop-choices');
    const selected = preserveSelection ? [...container.children].indexOf(document.activeElement) : 0;
    container.replaceChildren(...choices.map(([label, action], i) => {
      const button = document.createElement('button');
      const navigation = /^(Wróć|Wyjdź|Zakończ rozmowę)/.test(label);
      button.classList.toggle('navigation-back', navigation);
      button.classList.toggle('navigation-exit', /^(Wyjdź|Wróć na ulicę)/.test(label));
      const read = talking && this.readTopics.has(`${this.speaker.name}:${i}`);
      button.classList.toggle('topic-read', Boolean(read));
      button.textContent = navigation ? `↩ ${label}` : `${i + 1}. ${read ? '✓ ' : ''}${label}`;
      button.addEventListener('click', action);
      return button;
    }));
    container.children[Math.max(0, selected)]?.focus({ preventScroll: true });
    this.saveGame();
  }

  backFrame() {
    if (this.engine.character.currentSkin === 'cyber_ronin') return this.legacyBackFrame();
    if (!this.entryAtlas) return this.engine.character.animations.idle[0];
    const asset = globalThis.ENTRY_HERO_ASSETS;
    const turning = this.elapsed < BUILDING_ENTRY_TIMING.turn;
    const index = turning ? Math.min(3, Math.floor(this.elapsed / (BUILDING_ENTRY_TIMING.turn / 4)))
      : Math.floor((this.elapsed - BUILDING_ENTRY_TIMING.turn) * 12) % asset.frames;
    const mirrored = turning && this.saved.facing === -1;
    const key = `entry:${turning ? 0 : 1}:${index}:${mirrored}`;
    if (this.frames.has(key)) return this.frames.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = asset.frameWidth;
    canvas.height = asset.frameHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if (mirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(this.entryAtlas, index * asset.frameWidth, turning ? 0 : asset.frameHeight,
      asset.frameWidth, asset.frameHeight, 0, 0, canvas.width, canvas.height);
    this.frames.set(key, canvas);
    return canvas;
  }

  legacyBackFrame() {
    const skin = this.engine.character.currentSkin;
    const key = `${skin}:${Math.floor(this.elapsed * 9) % 6}`;
    if (this.frames.has(key)) return this.frames.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 48;
    const c = canvas.getContext('2d');
    const r = (color, x, y, w, h) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    const ronin = skin === 'cyber_ronin';
    const step = [0, 2, 1, 0, -2, -1][Math.floor(this.elapsed * 9) % 6];
    const bob = Math.abs(step) === 2 ? 1 : 0;
    r('#11151f', 10, 31, 6, 12 - step);
    r('#252c3b', 17, 31, 6, 12 + step);
    r(ronin ? '#26394a' : '#b14f43', 9, 41 - step, 7, 4);
    r(ronin ? '#26394a' : '#b14f43', 17, 41 + step, 7, 4);
    r('#c6c7ba', 9, 44 - step, 7, 1); r('#c6c7ba', 17, 44 + step, 7, 1);
    r(ronin ? '#131322' : '#334459', 7, 17 + bob, 19, 17);
    r(ronin ? '#25233b' : '#52637c', 5, 18 + bob + step, 4, 14);
    r(ronin ? '#25233b' : '#52637c', 24, 18 + bob - step, 4, 14);
    r('#c38f71', 6, 31 + bob + step, 3, 3); r('#c38f71', 24, 31 + bob - step, 3, 3);
    r(ronin ? '#10101c' : '#31241f', 10, 3 + bob, 13, 13);
    r(ronin ? '#25233b' : '#594031', 11, 3 + bob, 10, 7);
    r(ronin ? '#df4363' : '#738299', 9, 14 + bob, 15, 5);
    if (!ronin) {
      r('#342732', 10, 21 + bob, 14, 14);
      r('#71384b', 11, 20 + bob, 12, 14);
      r('#985568', 12, 21 + bob, 9, 3);
      r('#4e293a', 13, 28 + bob, 8, 5);
      r('#c19c70', 14, 28 + bob, 6, 1);
      r('#35b8bc', 9, 16 + bob, 2, 4); r('#35b8bc', 23, 16 + bob, 2, 4);
    } else r('#df4363', 21, 17 + bob, 3, 15);
    this.frames.set(key, canvas);
    return canvas;
  }

  render(ctx) {
    const e = this.engine;
    if (this.state === 'inside') {
      this.drawInterior(ctx);
      return;
    }
    if (this.state === 'entering') {
      const progress = Math.max(0, Math.min(1, (this.elapsed - BUILDING_ENTRY_TIMING.turn) / BUILDING_ENTRY_TIMING.walk));
      const scale = 1 - progress * 0.58;
      const feet = this.saved.y + (e.character.footOffsetY ?? e.character.height - 2);
      const startX = this.saved.x - this.saved.cameraX + e.character.width / 2;
      const x = startX + (this.door.x - startX) * progress;
      const y = feet + (this.door.y - feet) * progress;
      const frame = this.backFrame();
      const sourceFoot = frame.width === 32 ? 45 : 51;
      const factor = (e.character.footOffsetY ?? e.character.height - 2) / sourceFoot * scale;
      const height = Math.round(frame.height * factor);
      const width = Math.round(frame.width * factor);
      ctx.fillStyle = 'rgba(15,20,25,0.35)';
      ctx.fillRect(Math.round(x - width / 3), Math.round(y), Math.round(width * 2 / 3), 1);
      ctx.drawImage(frame, Math.round(x - width / 2), Math.round(y - sourceFoot * factor), width, height);
    }
  }

  renderTransition(ctx) {
    if (this.state === 'entering') {
      const arrival = BUILDING_ENTRY_TIMING.turn + BUILDING_ENTRY_TIMING.walk;
      if (this.elapsed > arrival) {
        ctx.fillStyle = `rgba(12,17,20,${Math.min(1, (this.elapsed - arrival) / BUILDING_ENTRY_TIMING.fade)})`;
        ctx.fillRect(0, 0, 320, 180);
      }
    } else if (this.state === 'leaving') {
      ctx.fillStyle = `rgba(12,17,20,${1 - Math.min(1, this.elapsed / 0.5)})`;
      ctx.fillRect(0, 0, 320, 180);
    }
  }

  renderBehindPlayer(ctx) {
    if (this.state !== 'street') return;
    const door = this.nearbyDoor();
    if (!door) return;
    ctx.save();
    ctx.strokeStyle = '#f4d28a';
    ctx.strokeRect(Math.round(door.x) - Math.round(door.destination.width / 2), door.y - 26, door.destination.width, 26);
    ctx.fillStyle = '#ffe5a9';
    ctx.fillRect(Math.round(door.x) - 1, door.y - 31 + Math.round(Math.sin(this.engine.timeCounter * 4)), 3, 2);
    ctx.restore();
  }

  drawInterior(ctx, width = this.engine.virtualWidth, height = this.engine.virtualHeight) {
    ctx.fillStyle = '#201b16';
    ctx.fillRect(0, 0, width, height);
    const image = this.images.get(this.room === 'apartment' ? 'apartment-05' : this.destination?.id) ?? this.interiorImage;
    if (!image.complete || !image.naturalWidth) {
      ctx.fillStyle = '#f2e5c5';
      ctx.font = `${Math.max(12, Math.round(width / 40))}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('Wczytywanie wnętrza…', width / 2, height / 3);
      ctx.textAlign = 'start';
      return;
    }
    // Draw the original at display resolution, preserving its full 4:3 composition.
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = Math.round(image.naturalWidth * scale);
    const drawHeight = Math.round(image.naturalHeight * scale);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, Math.round((width - drawWidth) / 2), Math.round((height - drawHeight) / 2), drawWidth, drawHeight);
    if (this.destination.id === 'tenement') this.drawInteriorHero(ctx, width, height, drawWidth, drawHeight);
  }

  drawInteriorHero(ctx, width, height, drawWidth, drawHeight) {
    this.interiorHero.enter(`${this.destination.id}:${this.room ?? 'stairs'}`);
    if (this.engine.character.currentSkin === 'urban_hero' && this.interiorHero.draw(ctx, width, height, drawWidth, drawHeight)) return;
    const character = this.engine.character;
    const frames = character.animations.idle;
    const frame = frames?.[Math.floor(this.elapsed * 7) % frames.length];
    if (!frame) return;
    const scale = Math.max(1, Math.floor(drawHeight * 0.52 / character.height));
    const heroWidth = character.width * scale;
    const left = Math.round((width - drawWidth) / 2 + drawWidth * 0.16 - heroWidth / 2);
    const feet = Math.round((height - drawHeight) / 2 + drawHeight * 0.92);
    const top = feet - (character.footOffsetY ?? character.height - 2) * scale;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(12, 15, 14, 0.32)';
    ctx.fillRect(left + Math.round(heroWidth * 0.30), feet, Math.round(heroWidth * 0.4), Math.max(2, scale));
    ctx.drawImage(frame, left, top, heroWidth, character.height * scale);
    ctx.restore();
  }
};
