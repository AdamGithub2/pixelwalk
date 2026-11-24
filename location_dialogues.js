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
  const neighborhoodTopics = {
    tenement: [
      ['Gdzie mogę zapytać o magnetofon?', 'Stefan Malec mieszka pod jedynką w zielonym bloku. W kamienicy możesz też zapytać Helenę spod jedynki o pozostałych sąsiadów.'],
      ['Jak znaleźć moje mieszkanie?', 'Twoje mieszkanie ma numer 5. Wejdź na klatkę i wybierz swoje mieszkanie. Komputer i radiomagnetofon są w pokoju.']
    ],
    block: [
      ['Kto w tym bloku naprawia sprzęt?', 'Stefan Malec spod jedynki. Zna radia i magnetofony. Zapytaj go o kieszenie A i B, zanim zaczniesz nagrywać.'],
      ['Gdzie szukać nagrań do przegrania?', 'W niebieskim bloku pod jedynką mieszka Zofia Wiśniewska. Ma nagrania radiowe i wie, jak chronić oryginały.']
    ],
    'block-blue': [
      ['U kogo znajdę kasety z muzyką?', 'U Zofii Wiśniewskiej, mieszkanie 1 w naszym bloku. Zapytaj ją o kolekcję i o możliwość pożyczenia nagrania.'],
      ['Gdzie szukać czystej taśmy?', 'Marek Wójcik z turkusowego bloku, mieszkanie 1, zbiera kasety i pudełka. Może ma jakąś wolną taśmę.']
    ],
    'block-yellow': [
      ['Kto zbiera nagrania koncertów?', 'Piotr Zieliński spod jedynki. Porozmawiaj z nim o koncertach i opisywaniu kaset.'],
      ['Kto zna się na jakości nagrania?', 'Zygmunt Kurek z punktowca, mieszkanie 2. Pracował jako kinooperator i zawsze sprawdza cały materiał.']
    ],
    tower: [
      ['Gdzie mieszka dawny kinooperator?', 'Zygmunt Kurek jest tutaj pod dwójką. Zapytaj go, jak sprawdzić gotową kopię.'],
      ['Co zrobić, kiedy magnetofon szumi?', 'Sprawdź go w mieszkaniu z dala od windy i świetlówek. Jeśli nadal szumi, zapytaj Stefana z zielonego bloku, mieszkanie 1.']
    ],
    'block-turquoise': [
      ['Kto ma zapas kaset?', 'Marek Wójcik spod jedynki w naszym bloku. Zapytaj go o czystą kasetę i o przygotowanie taśm do kopiowania.'],
      ['Gdzie mogę zrobić własne nagranie?', 'Masz dwukasetowy radiomagnetofon w mieszkaniu 5 w starej kamienicy. Najpierw zbierz oryginał i osobną czystą taśmę.']
    ]
  };
  for (const [id, entries] of Object.entries(homes)) entries.forEach((person, i) => {
    person.flat = i + 1;
    if (!person.own && person.topics.length === 1) person.topics.push(...neighborhoodTopics[id]);
  });
  homes['block-blue'][0].topics.push(['Czy pożyczysz mi nagranie do skopiowania?', 'Pożyczę ci opisaną kasetę z audycją muzyczną. Trafia do twojego plecaka. Zabezpieczyłam oryginał przed nagraniem — zrób kopię na osobnej taśmie.']);
  homes['block-turquoise'][0].topics.push(['Czy masz dla mnie czystą kasetę?', 'Mam jedną wolną C60, możesz ją wziąć. Wkładam ją do twojego plecaka. Przeznacz ją na kopię, a nagranie Zofii zostaw w spokoju.']);
  homes['block-yellow'][0].topics.push(['Czy kupisz ode mnie kopię nagrania?', 'Za kompletną, sprawdzoną kopię dam 12 zł. Najpierw ją nagraj i odsłuchaj u siebie.']);
  homes['block-yellow'][0].topics[0][1] += ' Kupuję też sprawdzone kopie nagrań — płacę 12 zł za kasetę.';
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
  const contacts = [
    { id: 'stefan', name: 'Stefan Malec', match: /Stefan|Malec|Malca/iu, text: 'Zielony blok, m. 1 · zna się na magnetofonach i przegrywaniu kaset.' },
    { id: 'zofia', name: 'Zofia Wiśniewska', match: /Zofi/iu, text: 'Niebieski blok, m. 1 · kolekcjonuje nagrania; wie, jak zabezpieczyć oryginał.' },
    { id: 'marek', name: 'Marek Wójcik', match: /Marek|Marka/iu, text: 'Turkusowy blok, m. 1 · kasety i pudełka; warto zapytać o czystą taśmę.' },
    { id: 'piotr', name: 'Piotr Zieliński', match: /Piotr/iu, text: 'Żółty blok, m. 1 · zbiera koncerty; kupuje sprawdzone kopie nagrań za 12 zł.' },
    { id: 'zygmunt', name: 'Zygmunt Kurek', match: /Zygmunt/iu, text: 'Punktowiec, m. 2 · dawny kinooperator; zna się na jakości nagrań.' },
    { id: 'helena', name: 'Helena Wolska', match: /Helen/iu, text: 'Kamienica, m. 1 · zna mieszkańców i ich adresy.' },
    { id: 'roman', name: 'Roman z Ruchu', match: /Roman(?:a)? (?:w|z)|Roman z Ruchu/iu, text: 'Kiosk Ruch · ogłoszenia o naprawach, wymianie i używanym sprzęcie.' },
    { id: 'halina', name: 'Halina z kasy kina', match: /Halin(?:a|y|ę) (?:w|z)|[Kk]asjerka/iu, text: 'Kasa kina · zna dawne seanse, koncerty i kinooperatorów.' },
    { id: 'basia', name: 'Basia ze straganu', match: /Basi/iu, text: 'Targ za kinem · zna sprzedawców używanego sprzętu.' }
  ];
  const tips = {
    'Stefan Malec:0': ['Przegrywanie kaset', 'Kieszeń A: oryginał. Kieszeń B: osobna kaseta na kopię.'],
    'Stefan Malec:1': ['Jakość dźwięku', 'Brudna głowica i zużyta taśma pogarszają dźwięk. Szybkie kopiowanie też może obniżyć jakość.'],
    'Zofia Wiśniewska:0': ['Opis nagrania', 'Na kasecie zapisz datę, wykonawcę oraz stronę A/B.'],
    'Zofia Wiśniewska:1': ['Ochrona oryginału', 'Wyłamane języczki chronią kasetę przed nadpisaniem. Kopię nagrywaj na osobnej taśmie.'],
    'Zofia Wiśniewska:2': ['Kaseta C60', '60 minut łącznie · około 30 minut na każdej stronie.'],
    'Piotr Zieliński:1': ['Etykieta kopii', 'Zapisz wykonawcę, tytuł, źródło i stronę nagrania.'],
    'Zygmunt Kurek:0': ['Sprawdzenie kopii', 'Odsłuchaj początek i koniec obu stron. Sprawdź, czy zamiast muzyki nie nagrała się cisza.'],
    'Marek Wójcik:0': ['Przechowywanie kaset', 'Trzymaj kasety w pudełkach; oddziel oryginały od kopii.'],
    'Marek Wójcik:2': ['Przed nagrywaniem', 'Oddziel oryginał od czystej kasety. Sprawdź długość i opisz obie taśmy.'],
    'Basia ze straganu:1': ['Kupowanie starych kaset', 'Sprawdź pęknięcia obudowy, wilgoć i stan nagrania.'],
    'Wanda Górska:1': ['Zakłócenia radia', 'Silnik windy i świetlówki mogą zakłócać odbiór. Sprawdź radio w mieszkaniu przy oknie.']
  };
  globalThis.LOCATION_DIALOGUES = { homes, shops, contacts, tips };
})();
