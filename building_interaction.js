/* Shared by the standalone file:// game and the ES module engine. */
globalThis.BuildingInteraction = class BuildingInteraction {
  constructor(engine) {
    this.engine = engine;
    this.state = 'street';
    this.elapsed = 0;
    this.money = 20;
    this.inventory = { bread: 0, orangeade: 0, newspaper: 0, crossword: 0, apples: 0, ticket: 0 };
    this.frames = new Map();
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
      { id: 'tenement', type: 'block', x: 45, width: 12, title: 'KAMIENICA', subtitle: 'Stara klatka', asset: 'stairwell-01', description: 'Drewniane stopnie skrzypią. Bordowa lamperia jest przetarta, a pod oknem odchodzi tynk.' },
      { id: 'spolem', x: 144, width: 19, title: 'SPOŁEM', subtitle: 'Sklep osiedlowy' },
      { id: 'block', type: 'block', x: 254, width: 15, title: 'BLOK NR 2', subtitle: 'Zielona klatka', asset: 'stairwell-02', description: 'Zapach wilgotnego lastryka. Zielona farba odpryskuje z poręczy, nad skrzynkami brzęczy świetlówka.' },
      { id: 'ruch', x: 367, width: 12, title: 'RUCH', subtitle: 'Prasa i drobiazgi', asset: 'ruch' },
      { id: 'block-blue', type: 'block', x: 454, width: 14, title: 'BLOK NR 3', subtitle: 'Niebieska klatka', asset: 'stairwell-03', description: 'Niebieska lamperia pamięta lepsze czasy. Pod oknem stoi stary kaloryfer, na tablicy wiszą pożółkłe ogłoszenia.' },
      { id: 'cinema', x: 630, width: 28, title: 'KINO', subtitle: 'Kasa biletowa', asset: 'cinema' },
      { id: 'market', x: 868, width: 17, title: 'TARG', subtitle: 'Warzywniak pod dachem', asset: 'market' },
      { id: 'block-yellow', type: 'block', x: 1216, width: 13, title: 'BLOK NR 4', subtitle: 'Żółta klatka', asset: 'stairwell-04', description: 'Musztardowa farba, chłodne lastryko i ciężkie drzwi do piwnicy. W rogu widać ślady dawnego zacieku.' },
      { id: 'tower', type: 'block', x: 1420, width: 13, title: 'PUNKTOWIEC', subtitle: 'Klatka z windą', asset: 'stairwell-05', description: 'Za porysowanymi drzwiami buczy stara winda. Rdzawa lamperia i gołe przewody pod sufitem.' },
      { id: 'block-turquoise', type: 'block', x: 1579, width: 13, title: 'BLOK NR 6', subtitle: 'Turkusowa klatka', asset: 'stairwell-06', description: 'Spod turkusowej farby wychodzi beż. Wgniecione skrzynki, zardzewiała rura i wydeptane stopnie.' }
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
    this.residents = [
      { name: 'Anna Kowalska', flat: 1, reply: 'Anna Kowalska: Tak, słucham? Właśnie zaparzyłam herbatę. W czym mogę pomóc?' },
      { name: 'Jan Nowak', flat: 2, reply: 'Jan Nowak: Dzień dobry! Jeśli chodzi o rower, stoi bezpiecznie w piwnicy.' },
      { name: 'Zofia Wiśniewska', flat: 3, reply: 'Zofia Wiśniewska: Kto tam? Proszę mówić głośniej, słabo słyszę przez ten domofon.' },
      { name: 'Piotr Zieliński', flat: 4, reply: 'Piotr Zieliński: Chwileczkę… Już jestem. O co chodzi?' },
      { name: 'Marek Wójcik', flat: 5, reply: 'Mieszkanie 5: Nikt nie odbiera. Spróbuj później.' }
    ];
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
  }

  get active() { return this.state !== 'street'; }

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
      if (this.menu === 'main') this.exit();
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
    this.pendingCall = null;
    this.panel.hidden = this.prompt.hidden = true;
    e.keys = {};
    e.audio.setWalking(false);
    document.body.classList.remove('in-building');
    this.previousFocus?.focus({ preventScroll: true });
  }

  update(dt) {
    if (!this.active) {
      const door = this.nearbyDoor();
      this.prompt.hidden = !door;
      if (door) this.prompt.textContent = door.destination.prompt;
      return false;
    }
    this.elapsed += dt;
    const walking = this.state === 'entering' && this.elapsed >= 0.35 && this.elapsed < 1.85;
    this.engine.audio.setWalking(walking);
    if (this.state === 'entering' && this.elapsed >= 2.25) {
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
        this.setChoices(resident.reply, [
          ['Wybierz inną osobę', () => this.showIntercom()],
          ['Wróć na ulicę', () => this.exit()]
        ]);
      }
    }
    return true;
  }

  showMenu(message = 'Dzień dobry! Co podać?') {
    this.pendingCall = null;
    if (this.destination?.type === 'block') return this.showStairwell();
    if (this.destination?.id !== 'spolem') return this.showLocalMenu();
    this.menu = 'main';
    this.setChoices(message, [
      ['Zobacz towary', () => this.showGoods()],
      ['Porozmawiaj', () => this.showMenu('Świeży chleb przyjeżdża codziennie rano. A po drugiej stronie ulicy znów grają coś w kinie!')],
      ['Wyjdź na ulicę', () => this.exit()]
    ]);
  }

  showStairwell(message = this.destination.description) {
    this.menu = 'main';
    this.setChoices(message, [
      ['Domofon · spis mieszkańców', () => this.showIntercom()],
      ['Obejrzyj klatkę', () => this.showStairwell(this.destination.description + ' Na półpiętrze słychać radio zza zamkniętych drzwi.')],
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
    const gossip = {
      ruch: 'Gazety przywożą o świcie. Krzyżówki szybko znikają, sąsiedzi kupują je do popołudniowej herbaty.',
      cinema: 'Plakaty zmieniamy ręcznie. Proszę zachować bilet — bileter sprawdza go przy sali.',
      market: 'Dzisiaj najlepsze jabłka. Skrzynki stoją od rana, a w hali jak zwykle trochę ciągnie.'
    };
    this.setChoices(messages[this.destination.id], [
      [this.destination.id === 'cinema' ? 'Kup bilet' : 'Zobacz towary', () => this.showGoods()],
      ['Porozmawiaj', () => { this.menu = 'conversation'; this.setChoices(gossip[this.destination.id], [['Wróć', () => this.showMenu()]]); }],
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
    this.menu = 'intercom-call';
    this.setChoices(`Dzwonienie… ${resident.name}, mieszkanie ${resident.flat}.`, [
      ['Wybierz inną osobę', () => this.showIntercom()],
      ['Wróć na ulicę', () => this.exit()]
    ]);
    this.pendingCall = { resident, remaining: 1.5 };
    this.engine.audio.ringIntercom();
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
    this.showGoods(message, true);
  }

  setChoices(message, choices, preserveSelection = false) {
    this.panel.hidden = false;
    const intercom = this.menu === 'intercom' || this.menu === 'intercom-call';
    const residential = this.destination?.type === 'block';
    this.panel.classList.toggle('intercom-mode', intercom);
    this.panel.setAttribute('aria-label', intercom ? 'Domofon przy klatce' : this.destination.title);
    this.panel.querySelector('.shop-heading > span:first-child').innerHTML = intercom
      ? 'DOMOFON <small>Spis mieszkańców</small>' : `${this.destination.title} <small>${this.destination.subtitle}</small>`;
    const wallet = this.panel.querySelector('.shop-wallet');
    wallet.hidden = residential;
    const labels = { bread: 'chleb', orangeade: 'oranżada', newspaper: 'gazeta', crossword: 'krzyżówki', apples: 'jabłka', ticket: 'bilet' };
    const contents = Object.entries(this.inventory).filter(([, count]) => count).map(([item, count]) => `${count} × ${labels[item]}`);
    wallet.textContent = `${this.money} zł · Plecak: ${contents.join(', ') || 'pusty'}`;
    this.panel.querySelector('.shop-help').textContent = intercom
      ? '1–5 mieszkanie · ↑ ↓ wybór · Enter zatwierdź · Esc powrót / wyjście'
      : '↑ ↓ wybór · Enter zatwierdź · Esc powrót / wyjście';
    this.panel.querySelector('.shop-message').textContent = message;
    const container = this.panel.querySelector('.shop-choices');
    const selected = preserveSelection ? [...container.children].indexOf(document.activeElement) : 0;
    container.replaceChildren(...choices.map(([label, action], i) => {
      const button = document.createElement('button');
      button.textContent = `${i + 1}. ${label}`;
      button.addEventListener('click', action);
      return button;
    }));
    container.children[Math.max(0, selected)]?.focus({ preventScroll: true });
  }

  backFrame() {
    if (this.engine.character.currentSkin === 'cyber_ronin') return this.legacyBackFrame();
    if (!this.entryAtlas) return this.engine.character.animations.idle[0];
    const asset = globalThis.ENTRY_HERO_ASSETS;
    const turning = this.elapsed < 0.35;
    const index = turning ? Math.min(3, Math.floor(this.elapsed / 0.0875))
      : Math.floor((this.elapsed - 0.35) * 9) % asset.frames;
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
      const t = Math.max(0, Math.min(1, (this.elapsed - 0.35) / 1.5));
      const ease = t * t * (3 - 2 * t);
      const scale = 1 - ease * 0.58;
      const feet = this.saved.y + (e.character.footOffsetY ?? e.character.height - 2);
      const startX = this.saved.x - this.saved.cameraX + e.character.width / 2;
      const x = startX + (this.door.x - startX) * ease;
      const y = feet + (this.door.y - feet) * ease;
      const frame = this.backFrame();
      const sourceFoot = frame.width === 32 ? 45 : 51;
      const factor = (e.character.footOffsetY ?? e.character.height - 2) / sourceFoot * scale;
      const height = Math.round(frame.height * factor);
      const width = Math.round(frame.width * factor);
      ctx.fillStyle = 'rgba(15,20,25,0.35)';
      ctx.fillRect(Math.round(x - width / 3), Math.round(y), Math.round(width * 2 / 3), 1);
      ctx.drawImage(frame, Math.round(x - width / 2), Math.round(y - sourceFoot * factor), width, height);
      if (this.elapsed > 1.8) {
        ctx.fillStyle = `rgba(12,17,20,${Math.min(1, (this.elapsed - 1.8) / 0.35)})`;
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
    const image = this.images.get(this.destination?.id) ?? this.interiorImage;
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
  }
};
