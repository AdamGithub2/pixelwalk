# PIXEL ART ANIMATION ENGINE // FRAME BLITTER

### Wejście do Społem

Na poziomie Polska / PRL podejdź pod drzwi Społem i naciśnij **↑ / W** albo kliknij podpowiedź wejścia. Bohater odwraca się tyłem, idzie do drzwi i zmniejsza się wraz z oddalaniem. Po przejściu pojawia się wnętrze sklepu z zakupami i rozmową ze sprzedawczynią.

Opcje wybierzesz myszą, dotykiem, klawiszami **1–3** lub **↑ / ↓ + Enter**. **Esc** wraca do głównego menu sklepu, a z niego na ulicę. Zakupy i portfel są zachowywane do odświeżenia strony. Scenę, animację wejścia i menu obsługuje wspólny plik `building_interaction.js` dla wersji samodzielnej i modułowej.

Wejście bohatera korzysta z 4 wygenerowanych klatek obrotu oraz 4 klatek chodu tyłem, opartych na `hero_tight.png`. Źródło i prompt imagegen znajdują się w `assets/entry/hero-entry-source.png` i `assets/entry/generation-prompt.txt`. `python build_entry_assets.py` pakuje klatki do `entry_assets.js`. Postać obraca się przez 0,35 s, potem idzie w stronę drzwi i maleje; animacja działa też przy wejściu do bloku.

### Pozostałe wejścia, klatki i domofony

Na panoramie jest dziesięć wejść: Społem, Ruch, kino, targ i sześć budynków mieszkalnych. Podejdź do drzwi i naciśnij **↑ / W** albo kliknij podpowiedź. Ruch sprzedaje gazety i krzyżówki, kino papierowe bilety, a targ jabłka. Zakupy korzystają ze wspólnego portfela i plecaka; brak pieniędzy blokuje zakup.

Każdy budynek mieszkalny ma inną wygenerowaną klatkę: kamienica z drewnianymi schodami, blok zielony, niebieski, żółty, punktowiec z windą i blok turkusowy. Wnętrza mają przetarte lamperie, odpryski, zacieki, wytarte lastryko i stare skrzynki. W menu klatki można obejrzeć wnętrze lub wybrać domofon. **1–5**, mysz lub dotyk wybierają mieszkańca; po dźwięku wyświetla się odpowiedź albo informacja, że nikt nie odbiera. **Esc** wraca do menu klatki, a z niego na ulicę. Powrót i wyjście anulują dzwonienie.

Dziewięć nowych grafik rastrowych pochodzi z wbudowanego generatora `image_gen`; zapisano je w `assets/interiors/` (`stairwell-01.png`–`stairwell-06.png`, `ruch.png`, `cinema.png`, `market.png`). Pełne prompty są w `assets/interiors/generation-prompts.json`. Grafiki są ładowane z lokalnych plików zarówno przez HTTP, jak i w samodzielnym `index.html` otwieranym przez `file://`.

### Rozmowy, notatnik i mieszkanie 5

`location_dialogues.js` zawiera osobne listy mieszkańców sześciu budynków oraz sprzedawców Społem, Ruchu, kina i targu. Po odebraniu domofonu można wybierać pytania. Rozmówcy podpowiadają, gdzie znaleźć osoby interesujące się naprawą sprzętu, nagraniami i kasetami; mają też własne historie o osiedlu. Przeczytane odpowiedzi trafiają do wspólnego notatnika dostępnego w menu lokacji. Notatki pozostają do odświeżenia strony, tak jak plecak i portfel.

W starej kamienicy pozycja **5** na liście domofonu to **Moje mieszkanie**. Wejście jest też dostępne bezpośrednio w menu klatki. Pokój ma wygenerowane tło `assets/interiors/apartment-05.png`: komputer z monitorem CRT, osobną obudową i klawiaturą oraz jeden radiomagnetofon z dwiema kieszeniami na kasety. Prompt wbudowanego `image_gen` zapisano w `assets/interiors/apartment-05-prompt.txt`. Komputer i radio można obejrzeć; wyposażenie przygotowuje miejsce pod przyszłą misję przegrywania, sama misja nie jest jeszcze uruchomiona.

Większa postać bohatera jest rysowana na tle klatki kamienicy i mieszkania 5 z istniejących klatek idle. **Esc** z menu mieszkania wraca na klatkę, a kolejny **Esc** na ulicę. Testy dialogów i powrotów: `node --test tests/location-dialogues.test.cjs`.

Projekt dedykowany animacji klatkowej w stylu **Pixel Art** bez użycia SVG i bez wektorowych transformacji, które niszczą charakterystyczną ostrość pikseli.

### Przechodnie i pościg

Atak **F / J** działa również podczas chodu i biegu (**Shift + kierunek**), bez zatrzymywania postaci. Animacja ciosu kończy się przed powrotem do chodu lub sprintu. Na telefonie można przytrzymać kierunek i RUN, jednocześnie naciskając ATK.

`moving_attack.js` łączy górę klatki ciosu z nogami aktualnej klatki chodu lub biegu. Cykl kroków trwa niezależnie od uderzeń, również przy przejściu z ataku do biegu; stopy zachowują wysokość z oryginalnych klatek. Korzysta z istniejących grafik rastrowych obu skórek, bez nowych generowanych obrazów.

Gdy spokojnie idący dresik zbliży się do bohatera, odtwarzany jest losowo jeden z dwóch dodanych plików MP3 ElevenLabs. Każdy przechodzień mówi raz; między wypowiedziami jest co najmniej 6 sekund przerwy, a głosy nie nakładają się. Muzyka przycicha na czas tekstu. Wyciszenie i opuszczenie karty zatrzymują głos. Przechodnie nie mówią do bohatera przebywającego we wnętrzu ani podczas ucieczki.

Muzyka startuje po kliknięciu, dotknięciu lub klawiszu. Jeśli przeglądarka odrzuci pierwszą próbę, kolejne gesty ponawiają odtwarzanie; wznowienie działa też po załadowaniu muzyki i powrocie do karty. Testy dźwięku i przechodniów: `node --test tests/game_audio.test.cjs tests/pedestrians.test.cjs`.

Co kilka sekund na ulicy pojawiają się przechodnie w niebieskich ortalionowych dresach, niektórzy z kijem baseballowym. Sami nie atakują. Trafienie klawiszem **F / J** lub przyciskiem **ATK** powoduje ucieczkę. Dogonisz ich sprintem (**Shift + ruch**); trzecie celne uderzenie przewraca postać. Jeden zamach może trafić danego przechodnia tylko raz. Trzy znaczniki nad trafionym przechodniem pokazują liczbę otrzymanych ciosów.

Logika przechodniów jest we wspólnym pliku `pedestrians.js`. Grafika v2 została wygenerowana narzędziem imagegen na podstawie `hero_tight.png`: 16 klatek chodu i biegu, z kijem i bez, znajduje się w `assets/pedestrians/tracksuit-atlas-v2.png`. Prompt zapisano w `assets/pedestrians/generation-prompt.txt`. Skrypt `python build_pedestrian_assets.py` pakuje atlas do klatek 48×56 i pliku `pedestrian_assets.js`, również dla uruchamiania przez `file://`. Testy uruchomisz poleceniem `node --test tests/pedestrians.test.cjs`.

Po upadku wyświetlana jest osobna grafika leżącej postaci z `assets/pedestrians/tracksuit-downed-source.png`, w wariancie z upuszczonym kijem lub bez. Zastępuje obróconą klatkę chodu po zakończeniu krótkiego przewrócenia. Prompt imagegen znajduje się w `assets/pedestrians/downed-generation-prompt.txt`; ten sam skrypt pakujący przygotowuje obie pozy do gry.

---

## 🎮 Dlaczego klatki rastrowe (Blitting) zamiast SVG?

1. **Pixel-Perfect Grid (Integer Snapping)**:
   - W pixel artcie każdy piksel musi być fizycznym, całkowitoliczbowym kwadratem siatki (np. 320x180 px).
   - SVG przy obrotach czy skalowaniu używa antyaliasingu (wygładzania), co tworzy niechciane, rozmyte, półprzezroczyste przejścia na brzegach.
2. **Nakładanie obrazów (Image Blitting)**:
   - Każda klatka to niezależny, gotowy obraz rastrowy (`OffscreenCanvas` lub zrzut matrycy).
   - Animacja polega na natychmiastowym podmienianiu klatek w odpowiednim tempie (FPS), dokładnie tak jak w klasycznych grach 16-bitowych i automatach arcade.

---

## 📂 Struktura folderu `pixel_animacja`

- **`index.html`** – Główny interfejs z oknem podglądu 16:9, osią czasu klatek (frame scrubber), kontrolkami transportu i modalem eksportu spritesheetu.
- **`character_sprites.js`** – Definicje i generowanie klatek postaci (rozmiar 32x32 px) dla 6 stanów ruchu:
  - `IDLE` (6 klatek) – spokojny oddech, powiewanie szalika, mrugnięcie wizjera.
  - `WALK` (6 klatek) – klasyczny krok z wymachem rąk i ugięciem nóg.
  - `RUN` (6 klatek) – dynamiczny bieg w pochyleniu, szalik w poziomie, pył pod butami.
  - `ATTACK` (5 klatek) – cięcie kataną z łukową pixelową smugą energii (Slash Arc).
  - `JUMP` (4 klatki) – wyskok, wznoszenie, opadanie z powiewającym płaszczem, lądowanie.
  - `SPECIAL` (5 klatek) – ładowanie i wyrzut fali energii cybernetycznej.
- **`background_generator.js`** – Wielowarstwowe tło pixel art (rozdzielczość wirtualna 320x180):
  - Ditherowane niebo ze szachownicowym przejściem kolorów i wielkim księżycem.
  - Odległe wieżowce z czerwonymi lampkami ostrzegawczymi (Parallax 0.15).
  - Środkowy plan z budynkami, oknami i neonami "NEO"/"RAM" (Parallax 0.4).
  - Pierwszy plan: mokra platforma z kałużami odbijającymi kolory neonów (Parallax 1.0).
  - Animowane cząsteczki dymu i cybernetycznego deszczu.
- **`engine.js`** – Silnik odtwarzania i kompozycji:
  - Precyzyjny integer blitting `Math.round(x)`, `Math.round(y)`.
  - Obsługa Onion Skinning (podgląd poprzedniej klatki dla animatora).
  - Maszyna stanów, kontrola FPS, fizyka skoku, sterowanie klawiaturą oraz Auto-Demo.
- **`style.css`** – Cyberpunkowy interfejs, filtr linii skanowania CRT i reguły `image-rendering: pixelated; crisp-edges;`.

---

## 🕹 Sterowanie w aplikacji

| Akcja | Klawisze |
| :--- | :--- |
| **Ruch w lewo / prawo** | <kbd>A</kbd> / <kbd>D</kbd> lub <kbd>←</kbd> / <kbd>→</kbd> |
| **Bieg** | <kbd>Shift</kbd> + Ruch |
| **Skok** | <kbd>Spacja</kbd> |
| **Atak kataną** | <kbd>F</kbd> lub <kbd>J</kbd> |
| **Cyber impuls** | <kbd>E</kbd> lub <kbd>K</kbd> |
| **Wybór animacji 1–6** | <kbd>1</kbd> do <kbd>6</kbd> |
| **Oś czasu / Badanie klatek** | Kliknięcie w dowolną miniaturę klatki na pasku |
| **Onion Skinning** | Przycisk `🧅 ONION SKIN` |
| **Autopilot** | Przycisk `🤖 AUTO DEMO` |

---

## 🎵 Jak podpiąć dźwięki w przyszłości (Audio Hooks)?

Gdy będziesz gotowy dodać efekty dźwiękowe lub muzykę, w pliku `engine.js` wystarczy podpiąć wywołania w miejscach zmiany klatek:

```javascript
// Przykład w engine.js -> update():
if (this.player.currentAnim === 'attack' && this.player.frameIndex === 1) {
  // Odtwórz dźwięk świstu miecza:
  // playSound('katana_slash.wav');
}

if (this.player.currentAnim === 'walk' && (this.player.frameIndex === 0 || this.player.frameIndex === 3)) {
  // Odtwórz dźwięk kroku na mokrej nawierzchni:
  // playSound('footstep_wet.wav');
}
```

---

## 💾 Eksport i własne klatki

- W aplikacji kliknij przycisk **`🖼 ARKUSZ SPRITESHEET`**, aby podejrzeć pełną matrycę wszystkich wygenerowanych klatek.
- Możesz jednym kliknięciem pobrać **`pixel_character_spritesheet.png`** lub tło **`pixel_background_320x180.png`**.
- Nowe klatki można definiować w `character_sprites.js` bezpośrednio jako rysunki na buforze 32x32 lub za pomocą funkcji `createFrameFromAscii()`.
