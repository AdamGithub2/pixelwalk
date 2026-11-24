# PIXEL ART ANIMATION ENGINE // FRAME BLITTER

### Ekwipunek, notatnik i zadania

Stały pasek na ekranie otwiera **Ekwipunek [I]**, **Notatnik [N]** i
**Dziennik zadań [L]** na ulicy oraz we wszystkich wnętrzach. Ekwipunek pokazuje
portfel i posiadane przedmioty, a notatnik gromadzi krótkie adresy i wskazówki
poznane w rozmowach, bez przepisywania całych odpowiedzi.
**Esc** zamyka panel i wraca do przerwanej rozmowy lub eksploracji.
Rozmówcy mają co najmniej trzy pytania; przeczytane tematy oznaczono ✓.
Przyciski powrotu mają strzałkę ↩ i osobny styl, a wyjście na ulicę dodatkowo
wyróżnia się kolorem. Tab przechodzi między przyciskami paska i rozmowy.

Wątek „Pierwsza własna kopia” obejmuje trzy etapy z listami postępu:
poznanie radiomagnetofonu i porad Stefana oraz Zofii, zdobycie oryginału od Zofii
i czystej kasety od Marka, następnie kopiowanie, tekstowo przedstawiony odsłuch
w mieszkaniu 5 i sprzedaż sprawdzonej kopii Piotrowi za 12 zł. Cele w dzienniku
nie zdradzają rozmówców ani adresów. Kopiowanie zużywa czystą taśmę i zachowuje
oryginał. Przedmioty zadaniowe można otrzymać tylko raz; sprzedaż jest jednorazowa.

Stan gry jest automatycznie zapisywany w `localStorage`: po zmianach, co dwie
sekundy oraz przy opuszczeniu karty. Po odświeżeniu wracają portfel, przedmioty,
notatki, przeczytane tematy, postęp zadań, poziom i położenie postaci lub wnętrze.
Rozmowa po wczytaniu wraca do menu lokacji. Zapis dotyczy tej przeglądarki i tego
adresu gry; usunięcie danych witryny usuwa również zapis. Uszkodzony zapis nie
blokuje uruchomienia gry, a blokada pamięci przeglądarki wyświetla komunikat.

Skok i atak są tymczasowo ukryte, a ich skróty nie działają podczas gry.
SP pozostaje widoczne jako nieaktywna akcja w przygotowaniu.

### Nowi przechodnie w stylu PRL

Obok dresiarza pojawiają się kolejno staruszka z laską i siatką, matka z dzieckiem
w granatowym wózku oraz dorosła blondynka w minispódniczce i szpilkach. Mają
osobne cykle chodu i pośpiechu oraz stroje inspirowane latami 70./80. Staruszka
idzie z prędkością 11 px/s, matka 18 px/s, blondynka 21 px/s, a dresiarz 23 px/s.
Nowe postacie korzystają ze wspólnej logiki przechodniów i własnych temp animacji.
Matka po zatrzymaniu pozostaje przy stojącym wózku. Nowe NPC nie odtwarzają
męskich kwestii dresiarza.

Grafiki wygenerowano wbudowanym narzędziem `image_gen`. Źródła i atlasy są
w `assets/pedestrians/`: `elderly-source.png`, `mother-source.png`,
`blonde-source.png` oraz odpowiadające im pliki `*-sprites.png`. Pełne prompty
zapisano w `assets/pedestrians/prl-generation-prompts.json`.
`python build_prl_pedestrian_assets.py` pakuje 24 klatki do
`prl_pedestrian_assets.js`, również do działania przez `file://`.
Testy: `node --test tests/*.test.cjs`.

Matka korzysta z poprawionego, ośmioklatkowego cyklu z
`assets/pedestrians/mother-walk-v2-source.png`. Nogi animują się zgodnie
z przebytą odległością (24 px na pełny cykl); wózek ma stałą grafikę
i położenie względem matki, dzięki czemu nie cofa się przy zmianach klatek.

### Wejście do Społem

Na poziomie Polska / PRL podejdź pod drzwi Społem i naciśnij **↑ / W** albo kliknij podpowiedź wejścia. Bohater odwraca się tyłem, idzie do drzwi i zmniejsza się wraz z oddalaniem. Po przejściu pojawia się wnętrze sklepu z zakupami i rozmową ze sprzedawczynią.

Opcje wybierzesz myszą, dotykiem, klawiszami **1–3** lub **↑ / ↓ + Enter**. **Esc** wraca do głównego menu sklepu, a z niego na ulicę. Zakupy i portfel są zachowywane w automatycznym zapisie przeglądarki. Scenę, animację wejścia i menu obsługuje wspólny plik `building_interaction.js` dla wersji samodzielnej i modułowej.

Wejście bohatera korzysta z 4 wygenerowanych klatek obrotu oraz 4 klatek chodu tyłem, opartych na `hero_tight.png`. Źródło i prompt imagegen znajdują się w `assets/entry/hero-entry-source.png` i `assets/entry/generation-prompt.txt`. `python build_entry_assets.py` pakuje klatki do `entry_assets.js`. Postać obraca się przez 0,35 s, potem idzie w stronę drzwi i maleje; animacja działa też przy wejściu do bloku.

### Pozostałe wejścia, klatki i domofony

Na panoramie jest dziesięć wejść: Społem, Ruch, kino, targ i sześć budynków mieszkalnych. Podejdź do drzwi i naciśnij **↑ / W** albo kliknij podpowiedź. Ruch sprzedaje gazety i krzyżówki, kino papierowe bilety, a targ jabłka. Zakupy korzystają ze wspólnego portfela i plecaka; brak pieniędzy blokuje zakup.

Każdy budynek mieszkalny ma inną wygenerowaną klatkę: kamienica z drewnianymi schodami, blok zielony, niebieski, żółty, punktowiec z windą i blok turkusowy. Wnętrza mają przetarte lamperie, odpryski, zacieki, wytarte lastryko i stare skrzynki. W menu klatki można obejrzeć wnętrze lub wybrać domofon. **1–5**, mysz lub dotyk wybierają mieszkańca; po dźwięku wyświetla się odpowiedź albo informacja, że nikt nie odbiera. **Esc** wraca do menu klatki, a z niego na ulicę. Powrót i wyjście anulują dzwonienie.

Dziewięć nowych grafik rastrowych pochodzi z wbudowanego generatora `image_gen`; zapisano je w `assets/interiors/` (`stairwell-01.png`–`stairwell-06.png`, `ruch.png`, `cinema.png`, `market.png`). Pełne prompty są w `assets/interiors/generation-prompts.json`. Grafiki są ładowane z lokalnych plików zarówno przez HTTP, jak i w samodzielnym `index.html` otwieranym przez `file://`.

### Rozmowy, notatnik i mieszkanie 5

`location_dialogues.js` zawiera osobne listy mieszkańców sześciu budynków oraz sprzedawców Społem, Ruchu, kina i targu. Po odebraniu domofonu można wybierać pytania. Rozmówcy podpowiadają, gdzie znaleźć osoby interesujące się naprawą sprzętu, nagraniami i kasetami; mają też własne historie o osiedlu. Przydatne informacje z odpowiedzi trafiają do notatnika jako krótkie wpisy o osobach, adresach i obsłudze sprzętu. Notatki, plecak i portfel pozostają w zapisie przeglądarki po odświeżeniu strony.

W starej kamienicy pozycja **5** na liście domofonu to **Moje mieszkanie**. Wejście jest też dostępne bezpośrednio w menu klatki. Pokój ma wygenerowane tło `assets/interiors/apartment-05.png`: komputer z monitorem CRT, osobną obudową i klawiaturą oraz jeden radiomagnetofon z dwiema kieszeniami na kasety. Prompt wbudowanego `image_gen` zapisano w `assets/interiors/apartment-05-prompt.txt`. Komputer i radio można obejrzeć; radiomagnetofon pozwala wykonać i sprawdzić kopię w zadaniu „Pierwsza własna kopia”.

We wnętrzu kamienicy i mieszkania 5 bohater korzysta z osobnego, szczegółowego arkusza pixel art `assets/interior-hero/hero-atlas-source.png`, wygenerowanego wbudowanym `image_gen` na podstawie `hero_hoodie_cropped.png`. Patrzy w prawo i jest wyższy; cztery klatki stania obejmują oddech oraz krótkie mrugnięcie, a cztery klatki chodu obsługują wejście i podejście do komputera/radia. Podłoga pozostaje na jednej wysokości we wszystkich klatkach. Grafiki i animacje postaci na ulicy są niezależne od tej wersji.

`interior_hero.js` obsługuje animację i położenie we wnętrzu. `python build_interior_hero_assets.py` mierzy prostokąty ośmiu wygenerowanych klatek i zapisuje `interior_hero_assets.js`, bez przerysowywania grafiki źródłowej. Prompt: `assets/interior-hero/generation-prompt.txt`. **Esc** z menu mieszkania wraca na klatkę, a kolejny **Esc** na ulicę. Testy: `node --test tests/interior-hero.test.cjs tests/location-dialogues.test.cjs`.

Projekt dedykowany animacji klatkowej w stylu **Pixel Art** bez użycia SVG i bez wektorowych transformacji, które niszczą charakterystyczną ostrość pikseli.

### Przechodnie i pościg

Atak **F / J** działa również podczas chodu i biegu (**Shift + kierunek**), bez zatrzymywania postaci. Animacja ciosu kończy się przed powrotem do chodu lub sprintu. Na telefonie można przytrzymać kierunek i RUN, jednocześnie naciskając ATK.

`moving_attack.js` łączy górę klatki ciosu z nogami aktualnej klatki chodu lub biegu. Cykl kroków trwa niezależnie od uderzeń, również przy przejściu z ataku do biegu; stopy zachowują wysokość z oryginalnych klatek. Korzysta z istniejących grafik rastrowych obu skórek, bez nowych generowanych obrazów.

Gdy spokojnie idący dresik zbliży się do bohatera, zatrzymuje się obok niego, odwraca twarzą w jego stronę i rzuca zaczepkę („Masz jakiś problem?” lub „Wyskakuj z kasy!”) z dymkiem dialogowym i losowym plikiem MP3 ElevenLabs. Dresik stoi obok i czeka, dopóki gracz nie odejdzie; po oddaleniu się bohatera dresik po krótkiej chwili (ok. 1.2 s) rusza dalej w swoją stronę. Każdy przechodzień mówi raz; między wypowiedziami jest co najmniej 6 sekund przerwy, a głosy nie nakładają się. Muzyka przycicha na czas tekstu. Wyciszenie i opuszczenie karty zatrzymują głos. Przechodnie nie mówią do bohatera przebywającego we wnętrzu ani podczas ucieczki.

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
