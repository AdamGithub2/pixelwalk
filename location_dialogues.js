/* Dialogue topics are separate from door positions and rendering. */
(() => {
  const resident = (name, greeting, topics) => ({ name, greeting, topics });
  const homes = {
    tenement: [
      resident('Helena Wolska', 'A, to sąsiad spod piątki! Dobrze, że jesteś. O co chcesz zapytać?', [
        ['Kto tutaj zna się na sprzęcie?', 'Stefan Malec z zielonego bloku, mieszkanie 1. Naprawiał mi radio. Zanim oddasz magnetofon do serwisu, zapytaj jego.'],
        ['Co to za muzyka na klatce?', 'To Zofia z niebieskiego bloku puszcza swoje nagrania przy otwartym oknie. Ma kasety z dawnych audycji. Mieszka pod jedynką.'],
        ['Co wiesz o moim mieszkaniu?', 'Twoja piątka jest na górze. Komputer został na biurku, a obok stoi ten twój dwukasetowy radiomagnetofon. Tylko nie nagrywaj nic na jedynej kopii ulubionej kasety!']
      ]),
      resident('Witold Baran', 'Witold, spod dwójki. Słucham.', [
        ['Dlaczego tu tak skrzypi?', 'Stopnie są jeszcze sprzed wojny. Trzeci od półpiętra ugina się najbardziej. Administracja łata dach, a na schody ciągle brakuje pieniędzy.']
      ]),
      resident('Teresa Mazur', 'Dzień dobry, sąsiedzie. W czym pomóc?', [
        ['Gdzie szukać ogłoszeń?', 'Roman w kiosku Ruch odkłada gazetę z ogłoszeniami. Ludzie wpisują tam naprawy i wymianę używanego sprzętu. Z nim warto porozmawiać.']
      ]),
      resident('Leszek Wrona', 'Tak? Tylko chwilę, ściszę radio.', [
        ['Co jest za tymi drzwiami na dole?', 'Piwnice i komórki. Kiedyś trzymaliśmy tam wspólną antenę. Teraz wszystko wilgotnieje, więc kaset ani elektroniki tam nie zostawiaj.']
      ]),
      { name: 'Moje mieszkanie', own: true }
    ],
    block: [
      resident('Stefan Malec', 'Stefan Malec. Jeśli chodzi o radio, proszę opisać usterkę.', [
        ['Jak przegrywać na dwukasetowym radiu?', 'Najpierw sprawdź oznaczenia. W twoim sprzęcie kieszeń A odtwarza oryginał, B nagrywa kopię. Do B wkładasz kasetę docelową, a oryginał zostawiasz w A.'],
        ['Dlaczego kopia czasem brzmi gorzej?', 'Brudna głowica albo wyciągnięta taśma robią swoje. Zanim obwinisz kasetę, posłuchaj oryginału. Szybkie kopiowanie też potrafi pogorszyć dźwięk.'],
        ['Kto ma ciekawe nagrania?', 'Zofia Wiśniewska, niebieski blok, jedynka. Nagrywała audycje z radia. A o koncertach w kinie najwięcej wie Piotr z żółtego bloku.']
      ]),
      resident('Anna Kowalska', 'Anna Kowalska, dzień dobry. Właśnie zaparzyłam herbatę.', [
        ['Co się dzieje w okolicy?', 'Piekarnia dowozi chleb do Społem rano. Irena, sprzedawczyni, zna prawie wszystkich. Jeśli szukasz kogoś po nazwisku, zacznij od niej.']
      ]),
      resident('Henryk Lis', 'Tak, Henryk. Proszę mówić.', [
        ['Skąd te ślady pod oknem?', 'Rura puściła zeszłej zimy. Zamalowali tylko kawałek, dlatego są trzy odcienie zielonego. Prawdziwą historię bloku widać na ścianach.']
      ]),
      resident('Danuta Król', 'Halo? Słyszę, słyszę.', [
        ['Gdzie można spokojnie posłuchać radia?', 'W domu. Tutaj świetlówka sieje zakłócenia, a przy windzie w punktowcu jest jeszcze gorzej. Nie oceniaj radia po odsłuchu na klatce.']
      ]),
      resident('Andrzej Sikora', 'Andrzej spod piątki. O co chodzi?', [
        ['Kto dba o tę klatkę?', 'Sprzątamy na zmianę, po jednym piętrze. Tabliczka z dyżurami wisi przy skrzynkach, choć farba na niej już prawie zeszła.']
      ])
    ],
    'block-blue': [
      resident('Zofia Wiśniewska', 'Kto tam? Proszę mówić głośniej, ten domofon ledwo działa.', [
        ['Podobno zbierasz kasety?', 'Nagrywałam audycje muzyczne. Każda kaseta ma kartkę: data, wykonawca i strona A albo B. Bez opisu szybko zapomnisz, co gdzie jest.'],
        ['Jak nie skasować oryginału?', 'Na moich najważniejszych kasetach są wyłamane języczki zabezpieczające. Magnetofon nie pozwoli ich tak łatwo nadpisać. Kopię zawsze rób na osobnej taśmie.'],
        ['Co oznacza C60?', 'To około godziny łącznie, po pół godziny na stronę. Przy dłuższym nagraniu trzeba pilnować końca strony. Piotr z żółtego bloku lubi koncerty, które na jednej się nie mieszczą.']
      ]),
      resident('Kazimierz Bąk', 'Kazimierz. Zaraz, tylko odłożę słuchawkę telefonu.', [
        ['Skąd te ogłoszenia na tablicy?', 'RSM przynosi swoje, a lokatorzy dopinają resztę. Jak szukasz naprawy radia, nazwisko Malec pojawiało się tu już nieraz.']
      ]),
      resident('Maria Pawlak', 'Dzień dobry. Kogo szukasz?', [
        ['Gdzie kupujesz prasę?', 'U Romana w Ruchu. Jak zapytasz o konkretny numer gazety, czasem wyciąga go spod lady. Lubi, kiedy ktoś pamięta, po co przyszedł.']
      ]),
      resident('Ryszard Cieślak', 'Ryszard, słucham.', [
        ['Co tak stuka wieczorami?', 'Kaloryfer przy oknie. Niesie się po rurach aż na ostatnie piętro. W nagraniach robionych mikrofonem też go później słychać.']
      ]),
      resident('Elżbieta Sobczak', 'Tak, jestem w domu.', [
        ['Dlaczego tu jest tak zimno?', 'Okno na półpiętrze się nie domyka. Ktoś podłożył gazetę, ale przeciąg i tak został. Naprawa ciągle czeka na liście administracji.']
      ])
    ],
    'block-yellow': [
      resident('Piotr Zieliński', 'Piotr. Chwileczkę… już wyłączyłem adapter. Słucham.', [
        ['Podobno znasz się na koncertach?', 'Zbieram nagrania koncertowe i plakaty z kina. Pani Halina z kasy pamięta nawet seanse, których nie ma już na afiszach.'],
        ['Jak opisać skopiowaną kasetę?', 'Zapisz wykonawcę, tytuł, źródło i stronę. Kiedy pożyczysz komuś samą kasetę bez pudełka, opis na etykiecie uratuje ci pamięć.'],
        ['Kto jeszcze interesuje się sprzętem?', 'Zygmunt z punktowca, mieszkanie 2, był kinooperatorem. Umie odróżnić problem z nagraniem od kłopotu z odtwarzaczem.']
      ]),
      resident('Barbara Dudek', 'Barbara, dzień dobry.', [
        ['Gdzie jest najbliższy targ?', 'Za kinem. Basia od jabłek stoi w hali pod dachem. Zna ludzi, którzy pojawiają się tam ze starymi płytami i używanym sprzętem.']
      ]),
      resident('Józef Stępień', 'Tak? Józef przy domofonie.', [
        ['Co jest za drzwiami do piwnicy?', 'Suszarnia. Przez nią wilgoć wychodzi w narożniku klatki. Dlatego skrzynki przy samych drzwiach tak rdzewieją.']
      ]),
      resident('Krystyna Wójcik', 'Słucham, tylko proszę nie trzaskać drzwiami.', [
        ['Co wisi przy skrzynkach?', 'Kartka o wymianie domofonu. Wisi trzeci miesiąc. Kiedy słuchawka trzeszczy, to przewód, a nie to, że ktoś nie chce rozmawiać.']
      ]),
      resident('Roman Sowa', 'Roman spod piątki. Tak?', [
        ['Skąd tu tyle różnych poręczy?', 'Jedną naprawił ślusarz po przeprowadzce sąsiadów. Nowy fragment pomalowano na czarno, starego już nikt nie ruszył.']
      ])
    ],
    tower: [
      resident('Wanda Górska', 'Wanda Górska. Jeśli winda znowu stoi, proszę powiedzieć na którym piętrze.', [
        ['Kogo tutaj warto odwiedzić?', 'Zygmunta spod dwójki. Pracował w kabinie projekcyjnej. Jak coś trzeszczy, najpierw słucha, dopiero potem bierze śrubokręt.'],
        ['Dlaczego radio tutaj szumi?', 'Przy silniku windy i świetlówkach łapie zakłócenia. W mieszkaniu przy oknie bywa lepiej. Nie trzymaj odbiornika przy przewodach windy.'],
        ['Co słychać na osiedlu?', 'W turkusowym bloku Marek zbiera kasety z pustymi pudełkami. On zawsze mówi: najpierw opisz, potem odkładaj. Inaczej robi się z tego jeden wielki bałagan.']
      ]),
      resident('Zygmunt Kurek', 'Zygmunt. Coś z dźwiękiem czy z obrazem?', [
        ['Jak rozpoznać dobrą kopię?', 'Odsłuchaj początek i koniec obu stron. Sama świecąca kontrolka nagrywania niczego nie dowodzi. Sprawdź też, czy nie nagrałeś ciszy zamiast muzyki.']
      ]),
      resident('Irena Wilk', 'Halo, Irena. Słucham.', [
        ['Dlaczego drzwi windy mają szybkę?', 'Żeby było widać, czy kabina już jest. Stara winda ma swój rytm: najpierw zgrzyt, potem uderzenie drzwi. Tutaj każdy go rozpoznaje.']
      ]),
      resident('Tadeusz Zając', 'Tak, jestem. O co chodzi?', [
        ['Co widać z ostatniego piętra?', 'Dach kina i cały targ. Dawniej anteny były wspólne, teraz każdy dokłada swoją. Stąd ten las drutów nad blokiem.']
      ]),
      resident('Alina Michalak', 'Dzień dobry, słucham.', [
        ['Gdzie oddaje się sprzęt do naprawy?', 'Zanim pojedziesz daleko, zadzwoń do Stefana Malca w zielonym bloku. Pod jedynką. Sąsiadom nieraz pomógł.']
      ])
    ],
    'block-turquoise': [
      resident('Marek Wójcik', 'Marek. O, ktoś z osiedla! Co cię sprowadza?', [
        ['Dlaczego zbierasz pudełka po kasetach?', 'Bez pudełka taśma zbiera kurz, a etykieta się wyciera. Mam nawet osobne przegródki na oryginały i kopie. To oszczędza pomyłek.'],
        ['Gdzie szukać informacji o kasetach?', 'Roman w Ruchu zna ogłoszenia. A na targu Basia kojarzy stałych bywalców ze sprzętem. Lepiej zapytać ich niż brać pierwszą taśmę z nieznanego źródła.'],
        ['Jak przygotować się do przegrywania?', 'Oddziel oryginał od kasety docelowej, sprawdź długość i opisz obie. Dopiero potem wkładaj je do kieszeni magnetofonu. Mniej nerwów, kiedy wszystko jest na swoim miejscu.']
      ]),
      resident('Bożena Nowicka', 'Bożena. Tak, słyszę.', [
        ['Skąd tu turkusowa farba?', 'Każda ekipa malowała inaczej. Pod spodem jest beż, jeszcze niżej stara zieleń. Przy rurze możesz zobaczyć wszystkie warstwy.']
      ]),
      resident('Wiesław Urban', 'Wiesław. Mów śmiało.', [
        ['Co jest przy wejściu do piwnicy?', 'Stara tablica rozdzielcza. Elektryk prosił, żeby niczego tam nie opierać. Sprzęt do słuchania trzymaj raczej z dala od tego kąta.']
      ]),
      resident('Halina Wysocka', 'Dzień dobry. Halina przy domofonie.', [
        ['Czy często chodzisz do kina?', 'Jak tylko zmienią afisz. Kasjerka ma też stare plakaty w gablocie. Można dowiedzieć się z nich więcej niż z samego tytułu filmu.']
      ]),
      resident('Leon Jaworski', 'Leon. Słucham sąsiada.', [
        ['Kto zostawia kartki przy skrzynkach?', 'Marek spod jedynki. Wypisuje, komu pożyczył kasetę. Dzięki temu nawet po miesiącu wie, u kogo szukać nagrania.']
      ])
    ]
  };
  for (const entries of Object.values(homes)) entries.forEach((person, i) => { person.flat = i + 1; });
  const shops = {
    spolem: resident('Irena ze Społem', 'Dzień dobry! Towar już rozłożony. Czego chcesz się dowiedzieć?', [
      ['Kto zna wszystkich na osiedlu?', 'Roman w kiosku ma prasę i ogłoszenia. Helena z kamienicy, spod jedynki, pamięta z kolei, kto gdzie mieszka. Dwie dobre osoby, jeśli kogoś szukasz.'],
      ['Gdzie pytać o stare radia?', 'Stefan Malec, zielony blok, mieszkanie 1. Naprawiał radio na zapleczu. Nie trzeba było wyrzucać go i kupować nowego.'],
      ['Co jest za kinem?', 'Zadaszony targ. Basia sprzedaje jabłka, ale zna też ludzi ze straganów z używanymi rzeczami.']
    ]),
    ruch: resident('Roman z Ruchu', 'Prasa, krzyżówki… ale pogadać też można. O co chodzi?', [
      ['Co można znaleźć w ogłoszeniach?', 'Naprawy, zamiany, używany sprzęt. Warto zapisać nazwisko i numer mieszkania, bo samo „ten pan z bloku” niewiele potem pomaga.'],
      ['Kto zbiera kasety?', 'Zofia z niebieskiego bloku, jedynka. Opisuje każdą audycję. Marek w turkusowym też ma porządek, tylko bardziej interesują go pudełka i kopie.'],
      ['Gdzie dowiedzieć się o kinie?', 'U Haliny w kasie. Afisz mówi, co grają, ale ona pamięta też dawne pokazy i zna kinooperatorów.']
    ]),
    cinema: resident('Halina z kasy kina', 'Bilety są, a do seansu jeszcze chwila. Pytaj.', [
      ['Kto zajmował się tu dźwiękiem?', 'Zygmunt Kurek, teraz punktowiec, mieszkanie 2. Zawsze sprawdzał cały materiał, nie tylko pierwsze sekundy nagrania.'],
      ['Czy ktoś zbiera stare programy?', 'Piotr Zieliński z żółtego bloku, spod jedynki. Gromadzi afisze i nagrania koncertów. Zna tytuły, których nikt tutaj już nie pamięta.'],
      ['Jak wygląda praca w kabinie?', 'Ciemno, gorąco od aparatury, wszystko opisane na pudełkach. Kiedy materiał jest jedyny, najpierw się go zabezpiecza. Dopiero potem puszcza w obieg.']
    ]),
    market: resident('Basia ze straganu', 'Jabłka świeże. Co poza zakupami cię interesuje?', [
      ['Kto przynosi tu stare sprzęty?', 'Różni ludzie, więc najpierw pytaj, czy rzecz działa. Stefan z zielonego bloku zna się na radiach; warto z nim porozmawiać, zanim coś weźmiesz.'],
      ['Na co uważać przy starych kasetach?', 'Na popękane obudowy i wilgoć. Ładne pudełko nie powie ci, czy w środku jest dobre nagranie. Marek z turkusowego ogląda każdą taśmę osobno.'],
      ['Jak trafić do starej kamienicy?', 'Po drugiej stronie kina miniesz Ruch i Społem. Kamienica jest jeszcze dalej w lewo. Helena spod jedynki na pewno odbierze.']
    ])
  };
  globalThis.LOCATION_DIALOGUES = { homes, shops };
})();
