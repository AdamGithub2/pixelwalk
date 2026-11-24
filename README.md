# PIXEL ART ANIMATION ENGINE // FRAME BLITTER

### Wejście do Społem

Na poziomie Polska / PRL podejdź pod drzwi Społem i naciśnij **↑ / W** albo kliknij podpowiedź wejścia. Bohater odwraca się tyłem, idzie do drzwi i zmniejsza się wraz z oddalaniem. Po przejściu pojawia się wnętrze sklepu z zakupami i rozmową ze sprzedawczynią.

Opcje wybierzesz myszą, dotykiem, klawiszami **1–3** lub **↑ / ↓ + Enter**. **Esc** wraca do głównego menu sklepu, a z niego na ulicę. Zakupy i portfel są zachowywane do odświeżenia strony. Scenę, animację wejścia i menu obsługuje wspólny plik `building_interaction.js` dla wersji samodzielnej i modułowej.

Wejście bohatera korzysta z 4 wygenerowanych klatek obrotu oraz 4 klatek chodu tyłem, opartych na `hero_tight.png`. Źródło i prompt imagegen znajdują się w `assets/entry/hero-entry-source.png` i `assets/entry/generation-prompt.txt`. `python build_entry_assets.py` pakuje klatki do `entry_assets.js`. Postać obraca się przez 0,35 s, potem idzie w stronę drzwi i maleje; animacja działa też przy wejściu do bloku.

### Klatka i domofon

W szarym bloku bezpośrednio po prawej stronie Społem jest drugie wejście (**↑ / W** lub przycisk na ekranie). Pojawia się obraz `Retro Pixel-Art Entrance with Flowering Balconies.png` oraz lista pięciu mieszkańców. **1–5**, mysz lub dotyk wybierają osobę; po dźwięku domofonu wyświetla się odpowiedź albo informacja, że nikt nie odbiera. **Esc** wraca do listy, a z listy na ulicę. Wyjście anuluje trwające dzwonienie.

Projekt dedykowany animacji klatkowej w stylu **Pixel Art** bez użycia SVG i bez wektorowych transformacji, które niszczą charakterystyczną ostrość pikseli.

### Przechodnie i pościg

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
