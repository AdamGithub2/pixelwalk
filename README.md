# PIXEL ART ANIMATION ENGINE // FRAME BLITTER

Projekt dedykowany animacji klatkowej w stylu **Pixel Art** bez użycia SVG i bez wektorowych transformacji, które niszczą charakterystyczną ostrość pikseli.

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
