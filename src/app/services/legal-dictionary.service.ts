import { Injectable, signal } from '@angular/core';
import { LegalDictionaryTerm } from '../models/legal.model';

@Injectable({
  providedIn: 'root',
})
export class LegalDictionaryService {
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedTerm = signal<LegalDictionaryTerm | null>(null);
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('all');

  // Pływający podgląd kontekstowy (tooltip) przy zaznaczeniu / dwukliku
  readonly activeTooltip = signal<{
    term: LegalDictionaryTerm;
    x: number;
    y: number;
    selectedText: string;
  } | null>(null);

  // Baza pojęć słownika offline
  readonly terms: LegalDictionaryTerm[] = [
    {
      id: 'kontratyp',
      term: 'Kontratyp',
      aliases: ['kontratyp', 'kontratypu', 'kontratypie', 'kontratypem', 'kontratypy', 'kontratypów'],
      category: 'Obrona i wyłączenia',
      plainDefinition: 'Okoliczność, która wyłącza bezprawność czynu. Oznacza to, że zachowanie, które formalnie wygląda jak przestępstwo (np. uderzenie napastnika), w świetle prawa jest w pełni legalne i niekaralne.',
      legalBasis: 'Art. 25 k.k. (obrona konieczna), Art. 26 k.k. (stan wyższej konieczności)',
      practicalExample: 'Wybicie szyby w cudzym samochodzie jest zazwyczaj przestępstwem zniszczenia mienia, ale staje się legalnym kontratypem (stanem wyższej konieczności), jeśli zrobisz to, by uratować zamknięte w upale dziecko.',
      warningTip: 'Przekroczenie granic kontratypu (np. nadmierna siła w obronie) może skutkować odpowiedzialnością karną, choć sąd może zastosować nadzwyczajne złagodzenie kary.',
      relatedArticleId: 'art-25',
    },
    {
      id: 'obrona-konieczna',
      term: 'Obrona konieczna',
      aliases: ['obrona konieczna', 'obrony koniecznej', 'obronie koniecznej', 'obroną konieczną'],
      category: 'Obrona i wyłączenia',
      plainDefinition: 'Prawo każdego człowieka do odparcia bezpośredniego i bezprawnego zamachu na jakiekolwiek dobro chronione prawem (własne lub innej osoby). Czyn popełniony w obronie koniecznej nie jest przestępstwem.',
      legalBasis: 'Art. 25 § 1, 2, 2a k.k.',
      practicalExample: 'Gdy napastnik rzuca się na ciebie z nożem, a ty używasz gazu pieprzowego lub powalasz go na ziemię powodując złamanie ręki, działasz w granicach obrony koniecznej.',
      warningTip: 'Obrona musi być podjęta w trakcie trwania zamachu. Uderzenie napastnika, gdy ten już ucieka lub leży obezwładniony, jest zemstą/odwetem, a nie obroną konieczną.',
      relatedArticleId: 'art-25',
    },
    {
      id: 'zamiar-ewentualny',
      term: 'Zamiar ewentualny (dolus eventualis)',
      aliases: ['zamiar ewentualny', 'zamiaru ewentualnego', 'zamiarze ewentualnym', 'dolus eventualis'],
      category: 'Zasady ogólne',
      plainDefinition: 'Sytuacja, w której sprawca wprawdzie nie dąży bezpośrednio do popełnienia przestępstwa, ale przewiduje możliwość jego popełnienia i godzi się na to.',
      legalBasis: 'Art. 9 § 1 k.k.',
      practicalExample: 'Kierowca pędzi 140 km/h przez przejście dla pieszych w centrum miasta. Nie chce zabić pieszego (brak zamiaru bezpośredniego), ale wie, że może kogoś potrącić i ma to gdzieś – godzi się na taki skutek.',
      warningTip: 'Pomiędzy zamiarem ewentualnym a lekkomyślnością (świadomą nieumyślnością) istnieje cienka granica: przy lekkomyślności sprawca bezpodstawnie przypuszcza, że skutku uniknie.',
    },
    {
      id: 'zamiar-bezposredni',
      term: 'Zamiar bezpośredni (dolus directus)',
      aliases: ['zamiar bezpośredni', 'zamiaru bezpośredniego', 'zamiarze bezpośrednim', 'dolus directus'],
      category: 'Zasady ogólne',
      plainDefinition: 'Sprawca chce popełnić czyn zabroniony – jego celem i wolą jest dokonanie danego czynu (np. chce ukraść portfel, chce oszukać na BLIK).',
      legalBasis: 'Art. 9 § 1 k.k.',
      practicalExample: 'Złodziej planuje wejście do sklepu, chowa towar do plecaka i ucieka – działa w zamiarze bezpośrednim.',
    },
    {
      id: 'warunkowe-umorzenie',
      term: 'Warunkowe umorzenie postępowania',
      aliases: ['warunkowe umorzenie', 'warunkowego umorzenia', 'warunkowemu umorzeniu', 'warunkowym umorzeniu'],
      category: 'Kary i środki',
      plainDefinition: 'Instytucja prawa karnego pozwalająca osobie niekaranej uniknąć wpisu do Krajowego Rejestru Karnego (KRK) jako skazany za przestępstwo. Sąd uznaje winę sprawcy, ale odstępuje od skazania i wyznacza okres próby (od 1 do 3 lat).',
      legalBasis: 'Art. 66 i 67 k.k.',
      practicalExample: 'Student po raz pierwszy w życiu przywłaszczył znaleziony telefon. Przyznał się, przeprosił i oddał sprzęt. Sąd warunkowo umarza sprawę na okres 1 roku próby – student zachowuje status osoby niekaranej.',
      warningTip: 'Możliwe tylko w przestępstwach zagrożonych karą do 5 lat pozbawienia wolności i tylko wobec sprawców dotychczas niekaranych za przestępstwo umyślne.',
    },
    {
      id: 'przepadek-pojazdu',
      term: 'Przepadek pojazdu (konfiskata auta)',
      aliases: ['przepadek pojazdu', 'przepadku pojazdu', 'konfiskata auta', 'konfiskaty auta', 'przepadek mienia'],
      category: 'Kary i środki',
      plainDefinition: 'Obligatoryjny środek orzekany przez sąd od 14 marca 2024 r., polegający na przymusowej utracie na rzecz Skarbu Państwa pojazdu mechanicznego, którym kierowano pod wpływem alkoholu lub narkotyków.',
      legalBasis: 'Art. 44b k.k. w zw. z art. 178a § 5 k.k.',
      practicalExample: 'Kierowca zatrzymany mający 1.6 promila alkoholu we krwi traci swój samochód. Jeśli auto należało do leasingodawcy lub pracodawcy, sąd orzeka obowiązek zapłaty równowartości rynkowej auta.',
      warningTip: 'Sąd może odstąpić od przepadku pojazdu jedynie w wyjątkowych przypadkach uzasadnionych szczególnymi okolicznościami (art. 44b § 2 k.k.).',
      relatedArticleId: 'art-178a',
    },
    {
      id: 'zbieg-przestepstw',
      term: 'Zbieg przestępstw i kara łączna',
      aliases: ['zbieg przestępstw', 'zbiegu przestępstw', 'kara łączna', 'kary łącznej', 'karę łączną'],
      category: 'Kary i środki',
      plainDefinition: 'Gdy sprawca popełnił dwa lub więcej przestępstw, zanim zapadł pierwszy wyrok skazujący. Sąd nie sumuje prostoliniowo wszystkich kar, lecz orzeka karę łączną w granicach od najwyższej kary jednostkowej do ich sumy (zasada asperacji lub absorpcji).',
      legalBasis: 'Art. 85 i 86 k.k.',
      practicalExample: 'Sprawca dostał wyrok 6 miesięcy za kradzież i 1 rok za włamanie. Kara łączna może wynieść np. 1 rok i 2 miesiące (a nie proste 1,5 roku).',
    },
    {
      id: 'zbrodnia-wystepek',
      term: 'Zbrodnia a występek',
      aliases: ['zbrodnia', 'zbrodni', 'zbrodnię', 'występek', 'występku', 'występkiem', 'zbrodnie'],
      category: 'Typy przestępstw',
      plainDefinition: 'Podstawowy podział przestępstw w polskim prawie karnym. Zbrodnia to czyn zagrożony karą pozbawienia wolności na czas nie krótszy od lat 3 albo karą dożywotniego pozbawienia wolności (np. zabójstwo, rozbój z bronią). Występek to czyn zagrożony grzywną, ograniczeniem wolności lub więzieniem powyżej 1 miesiąca.',
      legalBasis: 'Art. 7 § 1, 2, 3 k.k.',
      practicalExample: 'Pobicie ze skutkiem śmiertelnym może być zbrodnią lub występkiem w zależności od kwalifikacji, natomiast zwykła kradzież jest zawsze występkiem.',
      warningTip: 'Zbrodnię można popełnić WYŁĄCZNIE umyślnie. Występek można popełnić także nieumyślnie, jeśli ustawa tak stanowi.',
    },
    {
      id: 'recydywa',
      term: 'Recydywa (powrót do przestępstwa)',
      aliases: ['recydywa', 'recydywy', 'recydywie', 'recydywą', 'recydywista', 'multirecydywa'],
      category: 'Kary i środki',
      plainDefinition: 'Sytuacja, gdy sprawca skazany za przestępstwo umyślne na karę pozbawienia wolności popełnia w ciągu 5 lat po odbyciu co najmniej 6 miesięcy kary umyślne przestępstwo podobne. Skutkuje to zaostrzeniem dolnej i górnej granicy kary.',
      legalBasis: 'Art. 64 § 1 k.k. (podstawowa), Art. 64 § 2 k.k. (wielokrotna/specjalna)',
      practicalExample: 'Osoba, która odsiedziała 8 miesięcy za włamanie, w 3. roku po wyjściu z więzienia znowu dokonuje kradzieży. Sąd może wymierzyć karę przewyższającą górną granicę o połowę.',
    },
    {
      id: 'czyn-ciagly',
      term: 'Czyn ciągły',
      aliases: ['czyn ciągły', 'czynu ciągłego', 'czynem ciągłym'],
      category: 'Zasady ogólne',
      plainDefinition: 'Dwa lub więcej zachowań podjętych w krótkich odstępach czasu w wykonaniu z góry powziętego zamiaru, które prawo uważa za jeden czyn zabroniony.',
      legalBasis: 'Art. 12 § 1 k.k.',
      practicalExample: 'Pracownik magazynu przez 10 kolejnych dni wynosi każdego dnia 1 karton sprzętu o wartości 200 zł. Zamiast 10 osobnych wykroczeń, odpowiada za jedno przestępstwo kradzieży ciągłej na łączną kwotę 2000 zł.',
    },
    {
      id: 'ciag-przestepstw',
      term: 'Ciąg przestępstw',
      aliases: ['ciąg przestępstw', 'ciągu przestępstw', 'ciągiem przestępstw'],
      category: 'Zasady ogólne',
      plainDefinition: 'Popełnienie w krótkich odstępach czasu z wykorzystaniem takiej samej sposobności dwóch lub więcej przestępstw, zanim zapadł pierwszy wyrok. Sąd orzeka jedną karę na podstawie przepisu o najwyższym zagrożeniu podwyższonego o połowę.',
      legalBasis: 'Art. 91 § 1 k.k.',
      practicalExample: 'Włamywacz w jedną noc okradł 4 różne piwnice w tym samym bloku.',
    },
    {
      id: 'tymczasowe-aresztowanie',
      term: 'Tymczasowe aresztowanie (TA)',
      aliases: ['tymczasowe aresztowanie', 'tymczasowego aresztowania', 'areszt tymczasowy', 'aresztu tymczasowego'],
      category: 'Procedura karna',
      plainDefinition: 'Najsurowszy środek zapobiegawczy o charakterze izolacyjnym, orzekany wyłącznie przez sąd na wniosek prokuratora w celu zabezpieczenia prawidłowego toku postępowania.',
      legalBasis: 'Art. 249 i 258 k.p.k.',
      practicalExample: 'Areszt stosuje się przy uzasadnionej obawie ucieczki, ukrywania się, matactwa (wpływania na świadków) lub przy groźbie surowej kary (od 8 lat więzienia).',
      warningTip: 'Tymczasowe aresztowanie nie jest karą, lecz środkiem zapobiegawczym. Czas spędzony w areszcie zalicza się w stosunku 1:1 na poczet orzeczonej kary pozbawienia wolności.',
    },
    {
      id: 'podejrzany-oskarzony',
      term: 'Podejrzany a oskarżony',
      aliases: ['podejrzany', 'podejrzanego', 'oskarżony', 'oskarżonego', 'oskarżonym'],
      category: 'Procedura karna',
      plainDefinition: 'Podejrzany to osoba, co do której wydano postanowienie o przedstawieniu zarzutów w śledztwie lub dochodzeniu (etap prokuratorski). Oskarżonym staje się dopiero w momencie wniesienia aktu oskarżenia do sądu.',
      legalBasis: 'Art. 71 § 1 i 2 k.p.k.',
      practicalExample: 'Gdy policja wzywa cię na przesłuchanie z zarzutem – jesteś podejrzanym. Gdy sprawa trafia na wokandę sądową – stajesz się oskarżonym.',
    },
    {
      id: 'zatarcie-skazania',
      term: 'Zatarcie skazania',
      aliases: ['zatarcie skazania', 'zatarcia skazania', 'zatarciu skazania', 'czysta kartoteka'],
      category: 'Kary i środki',
      plainDefinition: 'Fikcja prawna, zgodnie z którą z mocy prawa lub na wniosek skazanego, po upływie określonego czasu od wykonania kary, skazanie uważa się za niebyłe, a wpis w Krajowym Rejestrze Karnym (KRK) zostaje usunięty.',
      legalBasis: 'Art. 106, 107 k.k.',
      practicalExample: 'Po zatarciu skazania osoba może zgodnie z prawdą i prawem oświadczyć przed pracodawcą, że „nie była karana”.',
      warningTip: 'Przy grzywnie zatarcie następuje po roku od zapłaty; przy więzieniu zasadniczo po 10 latach (lub po 5 latach na wniosek przy karze do 3 lat).',
    },
    {
      id: 'znikoma-szkodliwosc',
      term: 'Znikoma szkodliwość społeczna czynu',
      aliases: ['znikoma szkodliwość', 'znikomej szkodliwości', 'społeczna szkodliwość', 'znikomy stopień'],
      category: 'Obrona i wyłączenia',
      plainDefinition: 'Konstrukcja stanowiąca, że nie stanowi przestępstwa czyn, którego społeczna szkodliwość jest znikoma. W takim przypadku postępowanie karne umarza się bez orzekania jakiejkolwiek kary.',
      legalBasis: 'Art. 1 § 2 k.k., Art. 115 § 2 k.k.',
      practicalExample: 'Zerwanie jabłka z prywatnego sadu wartego 1 zł formalnie wyczerpuje znamiona kradzieży, lecz z uwagi na znikomą szkodliwość nie zostanie zakwalifikowane jako przestępstwo.',
    },
    {
      id: 'nawiazka',
      term: 'Nawiązka',
      aliases: ['nawiązka', 'nawiązki', 'nawiązce', 'nawiązkę'],
      category: 'Kary i środki',
      plainDefinition: 'Środek karny lub kompensacyjny orzekany przez sąd, polegający na obowiązku zapłaty określonej kwoty pieniężnej na rzecz pokrzywdzonego, a w określonych wypadkach na rzecz Funduszu Pomocy Pokrzywdzonym (FS).',
      legalBasis: 'Art. 47 k.k., Art. 43a k.k.',
      practicalExample: 'Przy skazaniu za jazdę pod wpływem alkoholu (art. 178a § 1 k.k.) sąd ma OBOWIĄZEK orzec świadczenie pieniężne (nawiązkę) w wysokości minimum 5 000 zł.',
      relatedArticleId: 'art-178a',
    },
    {
      id: 'usilowanie',
      term: 'Usiłowanie',
      aliases: ['usiłowanie', 'usiłowania', 'usiłowaniu', 'usiłowaniem'],
      category: 'Zasady ogólne',
      plainDefinition: 'Zachowanie zmierzające bezpośrednio do dokonania przestępstwa, które jednak nie następuje (np. ofiara uciekła, broń zacięła się, alarm spłoszył włamywacza).',
      legalBasis: 'Art. 13 i 14 k.k.',
      practicalExample: 'Sprawca wybił okno i sięgnął po laptopa, ale został spłoszony przez psa. Odpowiada za usiłowanie kradzieży z włamaniem.',
      warningTip: 'Sąd wymierza karę za usiłowanie w takich samych granicach jak za dokonanie przestępstwa, chyba że zachodzi usiłowanie nieudolne.',
    },
    {
      id: 'pomocnictwo-podzeganie',
      term: 'Podżeganie i pomocnictwo',
      aliases: ['podżeganie', 'podżegania', 'pomocnictwo', 'pomocnictwa', 'podżegacz', 'pomocnik'],
      category: 'Zasady ogólne',
      plainDefinition: 'Formy zjawiskowe przestępstwa. Podżegacz nakłania inną osobę do popełnienia czynu zabronionego. Pomocnik ułatwia popełnienie czynu (np. dostarcza narzędzia, klucze, kod PIN, stoi na czatach).',
      legalBasis: 'Art. 18 § 2 i § 3 k.k.',
      practicalExample: 'Ktoś pożycza swój samochód koledze wiedząc, że ten użyje go do ucieczki po kradzieży. Odpowiada karnie jako pomocnik.',
    },
    {
      id: 'wypadek-mniejszej-wagi',
      term: 'Wypadek mniejszej wagi',
      aliases: ['wypadek mniejszej wagi', 'wypadku mniejszej wagi', 'mniejszej wagi'],
      category: 'Obrona i wyłączenia',
      plainDefinition: 'Szczególna postać przestępstwa, w której ze względu na niską wartość szkody, motywację sprawcy lub brak drastycznych skutków, ustawa przewiduje znacznie łagodniejszy wymiar kary (często tylko grzywnę).',
      legalBasis: 'Np. Art. 278 § 3 k.k., Art. 279 § 2 k.k., Art. 286 § 3 k.k.',
      practicalExample: 'Przy oszustwie na kwotę 20 zł w internecie obrońca wnosi o zakwalifikowanie czynu jako wypadku mniejszej wagi, chroniąc klienta przed karą do 8 lat więzienia.',
    },
    {
      id: 'tajemnica-obroncza',
      term: 'Tajemnica obrończa',
      aliases: ['tajemnica obrończa', 'tajemnicy obrończej', 'tajemnicą obrończą'],
      category: 'Procedura karna',
      plainDefinition: 'Bezwzględny zakaz przesłuchiwania obrońcy co do faktów, o których dowiedział się udzielając porady prawnej lub prowadząc sprawę. Żaden sąd ani prokurator nie może zwolnić adwokata z tajemnicy obrończej.',
      legalBasis: 'Art. 178 pkt 1 k.p.k.',
      practicalExample: 'Cokolwiek powiesz swojemu adwokatowi w cztery oczy, pozostaje na zawsze chronione i nie może zostać wykorzystane jako dowód przeciwko tobie.',
    },
  ];

  constructor() {
    this.initGlobalDoubleClickListener();
  }

  // Wyszukiwanie hasła na podstawie wyrazu (uwzględnia odmianę)
  findTerm(word: string): LegalDictionaryTerm | null {
    if (!word) return null;
    const clean = word.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'„”]/g, '');
    if (clean.length < 3) return null;

    // 1. Dopasowanie bezpośrednie lub po aliasach
    for (const item of this.terms) {
      if (item.term.toLowerCase() === clean) return item;
      if (item.aliases.some((a) => a.toLowerCase() === clean)) return item;
    }

    // 2. Dopasowanie częściowe (stemming proste)
    for (const item of this.terms) {
      if (item.aliases.some((a) => clean.startsWith(a.toLowerCase().slice(0, -1)))) {
        return item;
      }
      if (clean.includes(item.term.toLowerCase())) {
        return item;
      }
    }

    return null;
  }

  // Globalny listener dwukliku na tekście
  private initGlobalDoubleClickListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('dblclick', (event: MouseEvent) => {
      // Ignoruj kliknięcia w polach edycyjnych input i textarea
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : '';
      if (!selectedText || selectedText.length < 3 || selectedText.length > 50) {
        this.hideTooltip();
        return;
      }

      const foundTerm = this.findTerm(selectedText);
      if (foundTerm) {
        // Pozycja myszy z uwzględnieniem marginesu okna
        const x = Math.min(Math.max(event.clientX - 100, 16), window.innerWidth - 320);
        const y = Math.min(event.clientY + 15, window.innerHeight - 150);

        this.activeTooltip.set({
          term: foundTerm,
          x,
          y,
          selectedText,
        });
      } else {
        this.hideTooltip();
      }
    });

    // Ukryj tooltip przy kliknięciu gdziekolwiek indziej
    window.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('#legal-context-tooltip')) {
        return;
      }
      if (this.activeTooltip()) {
        this.hideTooltip();
      }
    });
  }

  openModal(termIdOrName?: string): void {
    if (termIdOrName) {
      const term = this.terms.find(
        (t) => t.id === termIdOrName || t.term.toLowerCase() === termIdOrName.toLowerCase()
      ) || this.findTerm(termIdOrName);

      if (term) {
        this.selectedTerm.set(term);
        this.searchQuery.set(term.term);
      }
    }
    this.hideTooltip();
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  hideTooltip(): void {
    this.activeTooltip.set(null);
  }

  selectTerm(term: LegalDictionaryTerm): void {
    this.selectedTerm.set(term);
  }

  filteredTerms(): LegalDictionaryTerm[] {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.terms.filter((term) => {
      const matchesCat = cat === 'all' || term.category === cat;
      if (!matchesCat) return false;

      if (!q) return true;
      return (
        term.term.toLowerCase().includes(q) ||
        term.plainDefinition.toLowerCase().includes(q) ||
        term.legalBasis.toLowerCase().includes(q) ||
        term.practicalExample.toLowerCase().includes(q) ||
        term.aliases.some((a) => a.toLowerCase().includes(q))
      );
    });
  }
}
