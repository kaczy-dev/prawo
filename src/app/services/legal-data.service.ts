import { Injectable, signal, inject } from '@angular/core';
import { PenalArticle, CourtRuling, LegalAlert, EncryptedNote } from '../models/legal.model';
import { CryptoService } from './crypto.service';
import { OfflineSyncService } from './offline-sync.service';

@Injectable({
  providedIn: 'root',
})
export class LegalDataService {
  private readonly cryptoService = inject(CryptoService);
  private readonly offlineSync = inject(OfflineSyncService);

  private readonly NOTES_STORAGE_KEY = 'prawnbot_encrypted_notes';
  private readonly PINNED_ARTICLES_KEY = 'prawnbot_pinned_articles';

  // Stan bazy danych
  readonly articles = signal<PenalArticle[]>([]);
  readonly courtRulings = signal<CourtRuling[]>([]);
  readonly legalAlerts = signal<LegalAlert[]>([]);
  readonly notes = signal<EncryptedNote[]>([]);

  constructor() {
    this.initDatabase();
    this.loadNotesFromStorage();
  }

  private initDatabase(): void {
    // Ładowanie predefiniowanych artykułów Kodeksu Karnego z aktualizacjami (w tym 2023/2024)
    const baseArticles: PenalArticle[] = [
      {
        id: 'art-178a',
        number: 178,
        suffix: 'a',
        title: 'Prowadzenie pojazdu mechanicznego w stanie nietrzeźwości lub pod wpływem środka odurzającego',
        chapter: 'Przestępstwa przeciwko bezpieczeństwu w komunikacji',
        chapterNumber: 'Rozdział XXI',
        content: `§ 1. Kto, znajdując się w stanie nietrzeźwości lub pod wpływem środka odurzającego, prowadzi pojazd mechaniczny w ruchu lądowym, wodnym lub powietrznym, podlega karze pozbawienia wolności do lat 3.
§ 4. Jeżeli sprawca czynu określonego w § 1 był wcześniej prawomocnie skazany za prowadzenie pojazdu mechanicznego w stanie nietrzeźwości (...) podlega karze pozbawienia wolności od 3 miesięcy do lat 5.
§ 5. Sąd orzeka przepadek pojazdu mechanicznego (konfiskata) w przypadkach określonych w art. 44b k.k. (od 14 marca 2024 r. przy stężeniu powyżej 1.5 promila we krwi lub powyżej 1.0 promila przy recydywie/wypadku).`,
        plainSummary: 'Jazda samochodem, motocyklem lub innym pojazdem silnikowym z ponad 0,5 promila alkoholu we krwi (lub 0,25 mg/l w wydychanym powietrzu). Od marca 2024 grozi za to bezwzględna utrata samochodu lub zapłata jego równowartości.',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 1,
          imprisonmentMaxMonths: 36,
          summary: 'Kara do 3 lat pozbawienia wolności (do 5 lat w warunkach recydywy), zakaz prowadzenia od 3 do 15 lat, świadczenie min. 5000 zł na Fundusz Sprawiedliwości.',
        },
        additionalSanctions: [
          'Obligatoryjny zakaz prowadzenia wszelkich pojazdów mechanicznych (min. 3 lata do 15 lat, a przy recydywie dożywotnio)',
          'Świadczenie pieniężne na Fundusz Pomocy Pokrzywdzonym (minimum 5 000 zł, recydywa min. 10 000 zł)',
          'Obligatoryjna konfiskata pojazdu (przepadek) lub orzeczenie nawiązki w wysokości równowartości pojazdu (powyżej 1,5 promila)',
          '15 punktów karnych',
        ],
        isFelony: false,
        keywords: ['pijany kierowca', 'alkohol', 'promile', 'konfiskata auta', 'prawo jazdy', '178a', 'nietrzeźwość', 'samochód', 'kontrola trzeźwości'],
        recentAmendment: {
          date: '14 marca 2024 r.',
          description: 'Wejście w życie obligatoryjnego przepadku pojazdów mechanicznych (konfiskaty aut) kierowcom mającym min. 1,5 promila alkoholu we krwi.',
          previousContent: `§ 1. Kto, znajdując się w stanie nietrzeźwości lub pod wpływem środka odurzającego, prowadzi pojazd mechaniczny w ruchu lądowym, wodnym lub powietrznym, podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do lat 2.
§ 4. Jeżeli sprawca czynu określonego w § 1 był wcześniej prawomocnie skazany (...) podlega karze pozbawienia wolności od 3 miesięcy do lat 5.`,
          amendmentSummary: 'Zaostrzenie sankcji z lat 2 do 3 w § 1 oraz dodanie § 5 wprowadzającego obligatoryjny przepadek pojazdu mechanicznego (art. 44b k.k.) przy stężeniu powyżej 1,5 promila alkoholu.',
        },
        isOfflinePinned: true,
      },
      {
        id: 'art-278',
        number: 278,
        title: 'Kradzież',
        chapter: 'Przestępstwa przeciwko mieniu',
        chapterNumber: 'Rozdział XXXV',
        content: `§ 1. Kto zabiera w celu przywłaszczenia cudzą rzecz ruchomą, podlega karze pozbawienia wolności od 3 miesięcy do lat 5.
§ 3. W wypadku mniejszej wagi, sprawca podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do roku.
§ 5. Przepisy § 1, 3 i 4 stosuje się odpowiednio do kradzieży energii lub karty uprawniającej do podjęcia pieniędzy z automatu bankowego.`,
        plainSummary: 'Zabranie cudzej rzeczy bez zgody właściciela w celu zachowania jej dla siebie. Od 1 października 2023 r. przestępstwem jest kradzież rzeczy o wartości powyżej 800 zł (poniżej tej kwoty jest to wykroczenie z art. 119 Kodeksu Wykroczeń).',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 3,
          imprisonmentMaxMonths: 60,
          summary: 'Pozbawienie wolności od 3 miesięcy do 5 lat. W wypadku mniejszej wagi: grzywna, ograniczenie wolności lub więzienie do roku.',
        },
        additionalSanctions: [
          'Obowiązek naprawienia szkody w całości lub w części (art. 46 k.k.)',
          'Przepadek korzyści majątkowej osiągniętej z przestępstwa',
        ],
        isFelony: false,
        keywords: ['kradzież', 'zabór mienia', 'pieniądze', 'sklep', 'telefon', 'rower', '800 zł', 'występek'],
        recentAmendment: {
          date: '1 października 2023 r.',
          description: 'Podwyższenie progu przepołowionego rozgraniczającego wykroczenie od przestępstwa kradzieży z 500 zł na kwotę 800 zł.',
          previousContent: `Czyn stanowił przestępstwo z art. 278 § 1 k.k. w przypadku szkody przekraczającej kwotę 500 zł (art. 119 § 1 k.w. w brzmieniu sprzed nowelizacji).`,
          amendmentSummary: 'Zmiana tzw. progu przepołowionego: szkody od 500,01 zł do 800 zł zostały zdepenalizowane jako przestępstwa i są obecnie kwalifikowane wyłącznie jako wykroczenia z art. 119 k.w.',
        },
        isOfflinePinned: true,
      },
      {
        id: 'art-279',
        number: 279,
        title: 'Kradzież z włamaniem',
        chapter: 'Przestępstwa przeciwko mieniu',
        chapterNumber: 'Rozdział XXXV',
        content: `§ 1. Kto kradnie z włamaniem, podlega karze pozbawienia wolności od roku do lat 10.
§ 2. W wypadku mniejszej wagi, sprawca podlega karze pozbawienia wolności od 3 miesięcy do lat 5.`,
        plainSummary: 'Kradzież połączona z pokonaniem fizycznej lub elektronicznej bariery zabezpieczającej (np. wyważenie drzwi, rozbicie szyby, płatność zbliżeniowa cudzą skradzioną kartą, włamanie do systemu komputerowego). Próg 800 zł NIE ma tu zastosowania – nawet kradzież batona po wyłamaniu zamka jest zbrodnią/występkiem z art. 279.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 12,
          imprisonmentMaxMonths: 120,
          summary: 'Pozbawienie wolności od 1 roku do 10 lat. W wypadku mniejszej wagi od 3 miesięcy do 5 lat.',
        },
        additionalSanctions: [
          'Obowiązek naprawienia szkody (art. 46 k.k.)',
          'Możliwość orzeczenia grzywny obok kary pozbawienia wolności (art. 33 § 2 k.k.)',
        ],
        isFelony: false,
        keywords: ['włamanie', 'zamek', 'karta bankowa zbliżeniowa', 'sejf', 'drzwi', 'okno', 'kradzież z włamaniem'],
        isOfflinePinned: true,
      },
      {
        id: 'art-286',
        number: 286,
        title: 'Oszustwo',
        chapter: 'Przestępstwa przeciwko mieniu',
        chapterNumber: 'Rozdział XXXV',
        content: `§ 1. Kto, w celu osiągnięcia korzyści majątkowej, doprowadza inną osobę do niekorzystnego rozporządzenia własnym lub cudzym mieniem za pomocą wprowadzenia jej w błąd albo wyzyskania błędu lub niezdolności do należytego pojmowania przedsiębranego działania, podlega karze pozbawienia wolności od 6 miesięcy do lat 8.
§ 3. W wypadku mniejszej wagi, sprawca podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do lat 2.`,
        plainSummary: 'Wyłudzenie pieniędzy lub towaru przez kłamstwo, fałszywy sklep internetowy, oszustwo "na wnuczka" lub "na Blik", nieopłacenie zamówionego towaru, sfałszowanie dokumentów finansowych.',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 6,
          imprisonmentMaxMonths: 96,
          summary: 'Pozbawienie wolności od 6 miesięcy do 8 lat. W wypadku mniejszej wagi: grzywna, ograniczenie wolności lub więzienie do lat 2.',
        },
        additionalSanctions: [
          'Obowiązek pełnego zwrotu wyłudzonej kwoty (naprawienie szkody)',
          'Grzywna orzekana kumulatywnie przy działaniu w celu zysku',
        ],
        isFelony: false,
        keywords: ['oszustwo', 'wyłudzenie', 'blik', 'fałszywy sklep', 'błąd', 'korzyść majątkowa', 'kredyt', 'faktura'],
        isOfflinePinned: true,
      },
      {
        id: 'art-280',
        number: 280,
        title: 'Rozbój',
        chapter: 'Przestępstwa przeciwko mieniu',
        chapterNumber: 'Rozdział XXXV',
        content: `§ 1. Kto kradnie, używając przemocy wobec osoby lub grożąc natychmiastowym jej użyciem albo doprowadzając człowieka do stanu nieprzytomności lub bezbronności, podlega karze pozbawienia wolności od lat 2 do 15.
§ 2. Jeżeli sprawca rozboju posługuje się bronią palną, nożem lub innym podobnie niebezpiecznym przedmiotem (...) podlega karze pozbawienia wolności na czas nie krótszy od lat 3 do 20 (zbrodnia).`,
        plainSummary: 'Kradzież z użyciem siły fizycznej, bicia, zastraszenia nożem lub bronią, gazem pieprzowym. Z użyciem niebezpiecznego narzędzia stanowi zbrodnię.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 24,
          imprisonmentMaxMonths: 180,
          summary: 'Pozbawienie wolności od 2 do 15 lat. Z niebezpiecznym narzędziem: od 3 do 20 lat (zbrodnia).',
        },
        additionalSanctions: [
          'Zadośćuczynienie za krzywdę i nawiązka na rzecz ofiary',
          'Przepadek niebezpiecznych narzędzi',
        ],
        isFelony: true,
        keywords: ['rozbój', 'napad', 'nóż', 'przemoc', 'pobicie z kradzieżą', 'broń', 'zbrodnia'],
        recentAmendment: {
          date: '1 października 2023 r.',
          description: 'Zwiększenie górnej granicy kary za typ podstawowy do 15 lat oraz za typ kwalifikowany do 20 lat.',
        },
        isOfflinePinned: true,
      },
      {
        id: 'art-158',
        number: 158,
        title: 'Udział w bójce lub pobiciu',
        chapter: 'Przestępstwa przeciwko życiu i zdrowiu',
        chapterNumber: 'Rozdział XIX',
        content: `§ 1. Kto bierze udział w bójce lub pobiciu, w którym naraża się człowieka na bezpośrednie niebezpieczeństwo utraty życia albo nastąpienia skutku określonego w art. 156 § 1 lub w art. 157 § 1, podlega karze pozbawienia wolności od 3 miesięcy do lat 5.
§ 2. Jeżeli następstwem bójki lub pobicia jest ciężki uszczerbek na zdrowiu człowieka, sprawca podlega karze pozbawienia wolności od roku do lat 10.
§ 3. Jeżeli następstwem bójki lub pobicia jest śmierć człowieka, sprawca podlega karze pozbawienia wolności od lat 2 do 15.`,
        plainSummary: 'Bójka (starcie przynajmniej 3 osób, gdzie każdy atakuje i broni się) lub pobicie (gdzie jedna strona ma przewagę liczebną lub fizyczną). Odpowiedzialność ponosi każdy uczestnik, nawet jeśli nie zadał decydującego ciosu.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 3,
          imprisonmentMaxMonths: 60,
          summary: 'Pozbawienie wolności od 3 miesięcy do 5 lat (przy ciężkim uszczerbku 1-10 lat, przy śmierci 2-15 lat).',
        },
        additionalSanctions: [
          'Solidarny obowiązek naprawienia szkody i zadośćuczynienia na rzecz pokrzywdzonego',
        ],
        isFelony: false,
        keywords: ['bójka', 'pobicie', 'awantura', 'uderzenie', 'klub', 'cios', 'uszczerbek na zdrowiu'],
        isOfflinePinned: true,
      },
      {
        id: 'art-226',
        number: 226,
        title: 'Zniewaga funkcjonariusza publicznego',
        chapter: 'Przestępstwa przeciwko działalności instytucji państwowych oraz samorządu terytorialnego',
        chapterNumber: 'Rozdział XXIX',
        content: `§ 1. Kto znieważa funkcjonariusza publicznego lub osobę do pomocy mu przybraną, podczas i w związku z pełnieniem obowiązków służbowych, podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do roku.`,
        plainSummary: 'Wulgarne wyzwiska, oplucie, gesty obraźliwe skierowane do policjanta, strażnika miejskiego, sędziego, prokuratora, ratownika medycznego w trakcie interwencji.',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 1,
          imprisonmentMaxMonths: 12,
          summary: 'Grzywna, ograniczenie wolności (np. prace społeczne) lub pozbawienie wolności do 1 roku.',
        },
        additionalSanctions: [
          'Nawiązka na rzecz pokrzywdzonego lub cel społeczny',
          'Podanie wyroku do publicznej wiadomości',
        ],
        isFelony: false,
        keywords: ['policjant', 'zniewaga', 'funkcjonariusz', 'przekleństwa', 'ratownik medyczny', 'interwencja', 'mandat'],
        isOfflinePinned: true,
      },
      {
        id: 'art-222',
        number: 222,
        title: 'Naruszenie nietykalności cielesnej funkcjonariusza',
        chapter: 'Przestępstwa przeciwko działalności instytucji państwowych oraz samorządu terytorialnego',
        chapterNumber: 'Rozdział XXIX',
        content: `§ 1. Kto narusza nietykalność cielesną funkcjonariusza publicznego lub osoby do pomocy mu przybranej podczas lub w związku z pełnieniem obowiązków służbowych, podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do lat 3.`,
        plainSummary: 'Popchnięcie, szarpanie za mundur, uderzenie, kopnięcie policjanta lub ratownika w trakcie czynności służbowych.',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 1,
          imprisonmentMaxMonths: 36,
          summary: 'Grzywna, ograniczenie wolności lub pozbawienie wolności do 3 lat.',
        },
        additionalSanctions: ['Nawiązka na rzecz funkcjonariusza'],
        isFelony: false,
        keywords: ['szarpanie policjanta', 'naruszenie nietykalności', 'mundur', 'areszt'],
        isOfflinePinned: false,
      },
      {
        id: 'art-190',
        number: 190,
        title: 'Groźba bezprawna (karalna)',
        chapter: 'Przestępstwa przeciwko wolności',
        chapterNumber: 'Rozdział XXIII',
        content: `§ 1. Kto grozi innej osobie popełnieniem przestępstwa na jej szkodę lub na szkodę osoby dla niej najbliższej, jeżeli groźba wzbudza w zagrożonym uzasadnioną obawę, że będzie spełniona, podlega karze pozbawienia wolności do lat 3.
§ 2. Ściganie następuje na wniosek pokrzywdzonego.`,
        plainSummary: 'Grożenie pobiciem, podpaleniem domu, zniszczeniem mienia lub śmiercią, jeżeli adresat miał obiektywne powody, by bać się realizacji groźby.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 1,
          imprisonmentMaxMonths: 36,
          summary: 'Pozbawienie wolności do 3 lat (podwyższona z 2 lat od nowelizacji 2023 r.).',
        },
        additionalSanctions: ['Zakaz zbliżania się i kontaktowania z pokrzywdzonym (art. 41a k.k.)'],
        isFelony: false,
        keywords: ['groźba', 'zastraszanie', 'sms z groźbą', 'strach', 'stalking', 'karalna'],
        isOfflinePinned: true,
      },
      {
        id: 'art-190a',
        number: 190,
        suffix: 'a',
        title: 'Stalking (Uporczywe nękanie)',
        chapter: 'Przestępstwa przeciwko wolności',
        chapterNumber: 'Rozdział XXIII',
        content: `§ 1. Kto przez uporczywe nękanie innej osoby lub osoby jej najbliższej wzbudza u niej uzasadnione okolicznościami poczucie zagrożenia, poniżenia lub udręczenia lub istotnie narusza jej prywatność, podlega karze pozbawienia wolności od 6 miesięcy do lat 8.
§ 2. Tej samej karze podlega, kto, podszywając się pod inną osobę, wykorzystuje jej wizerunek, inne jej dane osobowe (...) w celu wyrządzenia jej szkody majątkowej lub osobistej.`,
        plainSummary: 'Wielokrotne, obsesyjne wydzwanianie, śledzenie, nachodzenie w miejscu pracy, zakładanie fałszywych profili w social media, nasyłanie niechcianych paczek.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 6,
          imprisonmentMaxMonths: 96,
          summary: 'Pozbawienie wolności od 6 miesięcy do 8 lat (jeśli ofiara targnie się na życie: od 2 do 15 lat).',
        },
        additionalSanctions: ['Zakaz zbliżania się i nakaz opuszczenia lokalu', 'Dozór elektroniczny'],
        isFelony: false,
        keywords: ['stalking', 'nękanie', 'wiadomości', 'śledzenie', 'fałszywe konto', 'psychiczne'],
        isOfflinePinned: true,
      },
      {
        id: 'art-209',
        number: 209,
        title: 'Uporczywa niealimentacja',
        chapter: 'Przestępstwa przeciwko rodzinie i opiece',
        chapterNumber: 'Rozdział XXVI',
        content: `§ 1. Kto uchyla się od wykonania obowiązku alimentacyjnego określonego co do wysokości orzeczeniem sądowym, ugodą zawartą przed sądem (...) jeżeli łączna wysokość powstałych wskutek tego zaległości stanowi równowartość co najmniej 3 świadczeń okresowych, podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do roku.
§ 4. Nie podlega karze sprawca, który nie później niż przed upływem 30 dni od dnia pierwszego przesłuchania uiścił w całości zaległe alimenty.`,
        plainSummary: 'Zaleganie z alimentami na dzieci lub rodziców na kwotę równą co najmniej trzem miesięcznym ratom.',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 1,
          imprisonmentMaxMonths: 12,
          summary: 'Grzywna, ograniczenie wolności lub pozbawienie wolności do 1 roku (do 2 lat jeśli naraża na niemożność zaspokojenia podstawowych potrzeb).',
        },
        additionalSanctions: ['Klauzula bezkarności w przypadku uregulowania zaległości w terminie 30 dni od przesłuchania'],
        isFelony: false,
        keywords: ['alimenty', 'dziecko', 'komornik', 'zaległości', 'niealimentacja', 'fundusz alimentacyjny'],
        isOfflinePinned: false,
      },
      {
        id: 'art-207',
        number: 207,
        title: 'Znęcanie się psychiczne lub fizyczne',
        chapter: 'Przestępstwa przeciwko rodzinie i opiece',
        chapterNumber: 'Rozdział XXVI',
        content: `§ 1. Kto znęca się fizycznie lub psychicznie nad osobą najbliższą lub nad inną osobą pozostającą w stałym lub przemijającym stosunku zależności od sprawcy, podlega karze pozbawienia wolności od 3 miesięcy do lat 5.
§ 1a. Kto znęca się fizycznie lub psychicznie nad osobą nieporadną ze względu na jej wiek, stan psychiczny lub fizyczny, podlega karze pozbawienia wolności od 6 miesięcy do lat 8.`,
        plainSummary: 'Domowa przemoc, poniżanie, bicie, głodzenie, izolowanie partnera, dzieci lub schorowanych rodziców.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 3,
          imprisonmentMaxMonths: 60,
          summary: 'Pozbawienie wolności od 3 miesięcy do 5 lat (ze szczególnym okrucieństwem od 1 do 10 lat).',
        },
        additionalSanctions: ['Natychmiastowy nakaz opuszczenia lokalu mieszkalnego', 'Zakaz zbliżania się do rodziny'],
        isFelony: false,
        keywords: ['znęcanie', 'przemoc domowa', 'niebieska karta', 'awantury', 'bicie żony', 'bicie męża'],
        isOfflinePinned: true,
      },
      {
        id: 'art-25',
        number: 25,
        title: 'Obrona konieczna (Kontratyp)',
        chapter: 'Zasady odpowiedzialności karnej',
        chapterNumber: 'Rozdział II',
        content: `§ 1. Nie popełnia przestępstwa, kto w obronie koniecznej odpiera bezpośredni, bezprawny zamach na jakiekolwiek dobro chronione prawem.
§ 2. W razie przekroczenia granic obrony koniecznej, w szczególności gdy sprawca zastosował sposób obrony niewspółmierny do niebezpieczeństwa zamachu, sąd może zastosować nadzwyczajne złagodzenie kary, a nawet odstąpić od jej wymierzenia.
§ 2a. Nie podlega karze, kto przekracza granice obrony koniecznej, odpierając zamach połączony z wdarciem się do lokalu mieszkalnego, domu, lokalu lub ogrodzonego terenu przylegającego (...) chyba że przekroczenie było rażące.`,
        plainSummary: 'Całkowite wyłączenie odpowiedzialności karnej za obronę siebie, innej osoby lub mienia przed bezpośrednim, nielegalnym atakiem. Szczególna ochrona obrońcy we własnym mieszkaniu (zasada "mój dom to moja twierdza").',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 0,
          imprisonmentMaxMonths: 0,
          summary: 'Brak kary – czyn nie jest przestępstwem (kontratyp).',
        },
        additionalSanctions: [],
        isFelony: false,
        keywords: ['obrona konieczna', 'atak', 'napadnięty', 'kontratyp', 'mieszkanie', 'wdarcie się', 'brak winy'],
        isOfflinePinned: true,
      },
      {
        id: 'art-66',
        number: 66,
        title: 'Warunkowe umorzenie postępowania karnego',
        chapter: 'Środki związane z poddaniem sprawcy próbie',
        chapterNumber: 'Rozdział VIII',
        content: `§ 1. Sąd może warunkowo umorzyć postępowanie karne, jeżeli wina i społeczna szkodliwość czynu nie są znaczne, okoliczności jego popełnienia nie budzą wątpliwości, a postawa sprawcy niekaranego za przestępstwo umyślne (...) uzasadniają przypuszczenie, że pomimo umorzenia postępowania będzie przestrzegał porządku prawnego.
§ 2. Warunkowego umorzenia nie stosuje się do sprawcy przestępstwa zagrożonego karą przekraczającą 5 lat pozbawienia wolności.`,
        plainSummary: 'Instytucja pozwalająca osobie dotychczas niekaranej na uniknięcie wyroku skazującego i wpisu do Krajowego Rejestru Karnego (KRK). Sprawa zostaje umorzona na okres próby od 1 do 3 lat.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 0,
          imprisonmentMaxMonths: 0,
          summary: 'Brak kary kryminalnej. Wyznacza się okres próby 1-3 lata oraz najczęściej świadczenie pieniężne lub naprawienie szkody.',
        },
        additionalSanctions: ['Okres próby 1-3 lata', 'Brak wpisu o skazaniu w rejestrze KRK'],
        isFelony: false,
        keywords: ['warunkowe umorzenie', 'czysta kartoteka', 'krk', 'pierwszy raz', 'szansa', 'okres próby'],
        isOfflinePinned: true,
      },
      {
        id: 'art-51-kw',
        number: 51,
        codePrefix: 'k.w.',
        title: 'Zakłócenie spokoju, porządku publicznego lub spoczynku nocnego (Cisza nocna)',
        chapter: 'Wykroczenia przeciwko porządkowi i spokojowi publicznemu',
        chapterNumber: 'Rozdział VIII (Kodeks Wykroczeń)',
        content: `§ 1. Kto krzykiem, hałasem, alarmem lub innym wybrykiem zakłóca spokój, porządek publiczny, spoczynek nocny albo wywołuje zgorszenie w miejscu publicznym, podlega karze aresztu, ograniczenia wolności albo grzywny.
§ 2. Jeżeli czyn określony w § 1 ma charakter chuligański lub sprawca dopuszcza się go, będąc pod wpływem alkoholu, środka odurzającego lub innej podobnie działającej substancji lub środka, podlega karze aresztu, ograniczenia wolności albo grzywny.
§ 3. Podżeganie i pomocnictwo są karalne.`,
        plainSummary: 'Główny przepis dotyczący tzw. zakłócania ciszy nocnej (oraz spokoju dziennego). Formalnie w prawie nie ma terminu „cisza nocna”, lecz „spoczynek nocny” (przyjmuje się godziny 22:00–06:00). Kara mandatowa to 100–500 zł (wystawia Policja lub Straż Miejska). Przed sądem grozi areszt (5-30 dni), ograniczenie wolności (1 m-c prac społecznych) lub grzywna do 5000 zł. UWAGA: gdy hałasowanie staje się złośliwe, celowe i uporczywe, sprawa eskaluje do Kodeksu Karnego jako stalking (art. 190a k.k. do 8 lat więzienia) lub utrudnianie korzystania z lokalu (art. 191 § 1a k.k. do 3 lat więzienia).',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 0,
          imprisonmentMaxMonths: 1,
          summary: 'Mandat 100–500 zł. Przed sądem: grzywna 20–5000 zł, areszt od 5 do 30 dni lub ograniczenie wolności 1 miesiąc (prace społeczne).',
        },
        additionalSanctions: [
          'Odmowa przyjęcia mandatu i skierowanie sprawy do Sądu Rejonowego (art. 97 k.p.w.)',
          'Zaostrzenie przy czynie chuligańskim lub pod wpływem alkoholu (art. 51 § 2 k.w.)',
          'Eskalacja do Kodeksu Karnego (art. 190a k.k. lub art. 191 § 1a k.k.) przy uporczywym nękaniu sąsiada',
          'Brak wpisu do Krajowego Rejestru Karnego (KRK) przy ukaraniu grzywną za wykroczenie (czysta kartoteka)',
        ],
        isFelony: false,
        keywords: ['cisza nocna', 'zakłócanie ciszy nocnej', 'hałas', 'spoczynek nocny', 'impreza', 'głośna muzyka', 'sąsiad', '51 kw', 'wybryk', 'mandat', 'awantura'],
        isOfflinePinned: true,
      },
      {
        id: 'art-191-kk',
        number: 191,
        suffix: 'a',
        codePrefix: 'k.k.',
        title: 'Zmuszanie i utrudnianie korzystania z lokalu mieszkalnego (Stalking mieszkaniowy)',
        chapter: 'Przestępstwa przeciwko wolności',
        chapterNumber: 'Rozdział XXIII',
        content: `§ 1. Kto stosuje przemoc wobec osoby lub groźbę bezprawną w celu zmuszenia innej osoby do określonego działania, zaniechania lub znoszenia, podlega karze pozbawienia wolności do lat 3.
§ 1a. Tej samej karze podlega, kto w celu określonym w § 1 stosuje przemoc innego rodzaju uporczywie lub w sposób istotnie utrudniający innej osobie korzystanie z zajmowanego lokalu mieszkalnego (np. celowe generowanie nieznośnego hałasu, wibracji, odcinanie mediów).`,
        plainSummary: 'Kryminalizacja skrajnych form nękania lokatorskiego i sąsiedzkiego. Jeśli zakłócanie ciszy, walenie w rury czy puszczanie basów nie jest incydentem, lecz celowym i systematycznym działaniem utrudniającym mieszkanie – sprawca odpowiada z Kodeksu Karnego i grozi mu do 3 lat więzienia.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 1,
          imprisonmentMaxMonths: 36,
          summary: 'Pozbawienie wolności do lat 3.',
        },
        additionalSanctions: [
          'Środek karny w postaci zakazu zbliżania się i kontaktowania (art. 41a k.k.)',
          'Nawiązka na rzecz pokrzywdzonego sąsiada',
        ],
        isFelony: false,
        keywords: ['nękanie sąsiedzkie', 'utrudnianie korzystania z lokalu', 'hałas celowy', 'kamienica', 'immisje', 'art 191', 'mieszkanie'],
        isOfflinePinned: true,
      },
      {
        id: 'art-212-kk',
        number: 212,
        codePrefix: 'k.k.',
        title: 'Zniesławienie (Pomówienie i hejt w internecie)',
        chapter: 'Przestępstwa przeciwko czci i nietykalności cielesnej',
        chapterNumber: 'Rozdział XXVII',
        content: `§ 1. Kto pomawia inną osobę, grupę osób, instytucję, osobę prawną (...) o takie postępowanie lub właściwości, które mogą poniżyć ją w opinii publicznej lub narazić na utratę zaufania, podlega grzywnie albo karze ograniczenia wolności.
§ 2. Jeżeli sprawca dopuszcza się czynu określonego w § 1 za pomocą środków masowego komunikowania (internet, media społecznościowe, fora), podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do roku.`,
        plainSummary: 'Hejt internetowy, bezprawne oskarżenia, oczernianie na forach, grupach na Facebooku czy w opiniach Google. Środki masowego komunikowania (internet) stanowią typ kwalifikowany zagrożony karą więzienia do 1 roku.',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 1,
          imprisonmentMaxMonths: 12,
          summary: 'Grzywna, ograniczenie wolności lub pozbawienie wolności do roku w przypadku hejtu w internecie.',
        },
        additionalSanctions: [
          'Nawiązka na rzecz pokrzywdzonego, Polskiego Czerwonego Krzyża albo na inny cel społeczny do 100 000 zł',
          'Podanie wyroku do publicznej wiadomości',
        ],
        isFelony: false,
        keywords: ['hejt', 'zniesławienie', 'pomówienie', 'internet', 'forum', 'opinia google', 'facebook', 'obraza', 'oczernianie'],
        isOfflinePinned: true,
      },
      {
        id: 'art-288-kk',
        number: 288,
        codePrefix: 'k.k.',
        title: 'Zniszczenie lub uszkodzenie cudzego mienia',
        chapter: 'Przestępstwa przeciwko mieniu',
        chapterNumber: 'Rozdział XXXV',
        content: `§ 1. Kto cudzą rzecz niszczy, uszkadza lub czyni niezdatną do użytku, podlega karze pozbawienia wolności od 3 miesięcy do lat 5.
§ 2. W wypadku mniejszej wagi, sprawca podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do roku.`,
        plainSummary: 'Porysowanie lakieru samochodu, wybicie szyby, zniszczenie domofonu, pomalowanie elewacji sprayem. Od 1 października 2023 r. szkoda o wartości powyżej 800 zł to przestępstwo (do 5 lat więzienia). Poniżej 800 zł czyn stanowi wykroczenie z art. 124 k.w. (areszt, ograniczenie wolności lub grzywna do 5000 zł).',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 3,
          imprisonmentMaxMonths: 60,
          summary: 'Pozbawienie wolności od 3 miesięcy do 5 lat (w wypadku mniejszej wagi: grzywna, ograniczenie wolności lub więzienie do roku).',
        },
        additionalSanctions: [
          'Obligatoryjny obowiązek naprawienia szkody (art. 46 k.k.)',
          'Nawiązka do kwoty 10 000 zł na rzecz pokrzywdzonego',
        ],
        isFelony: false,
        keywords: ['zniszczenie mienia', 'porysowanie auta', 'wybicie szyby', 'graffiti', 'dewastacja', 'uszkodzenie', '800 zł'],
        isOfflinePinned: true,
      },
      {
        id: 'art-94-kw',
        number: 94,
        codePrefix: 'k.w.',
        title: 'Prowadzenie pojazdu bez wymaganych uprawnień',
        chapter: 'Wykroczenia przeciwko bezpieczeństwu i porządkowi w komunikacji',
        chapterNumber: 'Rozdział XI (Kodeks Wykroczeń)',
        content: `§ 1. Kto na drodze publicznej, w strefie zamieszkania lub strefie ruchu prowadzi pojazd mechaniczny, nie mając do tego uprawnienia, podlega karze aresztu, ograniczenia wolności albo grzywny nie niższej niż 1500 złotych.
§ 3. W razie popełnienia wykroczenia określonego w § 1 orzeka się zakaz prowadzenia pojazdów.`,
        plainSummary: 'Jazda samochodem bez prawa jazdy (np. po utracie za punkty lub nigdy nie wyrobionego). Nowelizacja wprowadziła bezwzględną minimalną grzywnę 1500 zł (do 30 000 zł w sądzie) oraz OBLIGATORYJNY zakaz prowadzenia pojazdów na okres od 6 miesięcy do 3 lat. Złamanie tego zakazu jest już przestępstwem z art. 244 k.k.!',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 0,
          imprisonmentMaxMonths: 1,
          summary: 'Grzywna od 1500 zł do 30 000 zł, ograniczenie wolności albo areszt.',
        },
        additionalSanctions: [
          'Obligatoryjny zakaz prowadzenia pojazdów na okres od 6 miesięcy do 3 lat (art. 94 § 3 k.w.)',
          'Odholowanie pojazdu na koszt kierującego',
        ],
        isFelony: false,
        keywords: ['bez prawa jazdy', 'brak uprawnień', 'art 94 kw', 'zakaz prowadzenia', 'samochód bez prawka', 'mandat 1500'],
        isOfflinePinned: true,
      },
      {
        id: 'art-244-kk',
        number: 244,
        codePrefix: 'k.k.',
        title: 'Niestosowanie się do orzeczonych środków karnych (Złamanie zakazu sądowego)',
        chapter: 'Przestępstwa przeciwko wymiarowi sprawiedliwości',
        chapterNumber: 'Rozdział XXX',
        content: `§ 1. Kto nie stosuje się do orzeczonego przez sąd zakazu zajmowania stanowiska, wykonywania zawodu, prowadzenia działalności, prowadzenia pojazdów (...) podlega karze pozbawienia wolności od 3 miesięcy do lat 5.`,
        plainSummary: 'Prowadzenie samochodu w czasie, gdy obowiązuje sądowy zakaz prowadzenia pojazdów (orzeczony za alkohol, art. 178a k.k. lub art. 94 k.w.). To poważne przestępstwo przeciwko wymiarowi sprawiedliwości. Sądy niemal zawsze orzekają bezwzględne więzienie lub przedłużenie zakazu nawet dożywotnio.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 3,
          imprisonmentMaxMonths: 60,
          summary: 'Pozbawienie wolności od 3 miesięcy do 5 lat.',
        },
        additionalSanctions: [
          'Kolejny, wydłużony zakaz prowadzenia pojazdów (często dożywotni)',
          'Świadczenie pieniężne na Fundusz Sprawiedliwości (min. 5000 zł)',
        ],
        isFelony: false,
        keywords: ['złamanie zakazu', 'art 244', 'zakaz sądowy', 'jazda pomimo zakazu', 'kara więzienia', 'recydywa'],
        isOfflinePinned: true,
      },
      {
        id: 'art-62-uopn',
        number: 62,
        codePrefix: 'UoPN',
        title: 'Posiadanie środków odurzających (w tym marihuany) oraz umorzenie z art. 62a',
        chapter: 'Przepisy karne (Ustawa o przeciwdziałaniu narkomanii)',
        chapterNumber: 'Rozdział 7 (UoPN)',
        content: `Art. 62. 1. Kto, wbrew przepisom ustawy, posiada środki odurzające lub substancje psychotropowe, podlega karze pozbawienia wolności do lat 3.
3. W wypadku mniejszej wagi, sprawca podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do roku.
Art. 62a. Jeżeli przedmiotem czynu są środki odurzające lub substancje psychotropowe w ilości nieznacznej, przeznaczone na własny użytek sprawcy, postępowanie można umorzyć również przed wydaniem postanowienia o wszczęciu śledztwa lub dochodzenia, jeżeli orzeczenie wobec sprawcy kary byłoby niecelowe ze względu na okoliczności popełnienia czynu oraz stopień jego społecznej szkodliwości.`,
        plainSummary: 'W polskim prawie każde posiadanie narkotyków (nawet 0.5g marihuany) jest formalnie przestępstwem. Kluczowym instrumentem prawnym jest art. 62a UoPN: przy nieznacznej ilości na własny użytek i braku dystrybucji prokurator lub sąd może całkowicie umorzyć sprawę bez wpisu do Krajowego Rejestru Karnego (KRK).',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 0,
          imprisonmentMaxMonths: 36,
          summary: 'Kara do 3 lat pozbawienia wolności (wypadek mniejszej wagi do roku). Możliwość całkowitego umorzenia z art. 62a UoPN.',
        },
        additionalSanctions: [
          'Zastosowanie art. 62a UoPN (umorzenie bez skazania i brak wpisu do KRK)',
          'Przepadek substancji odurzających',
          'Nawiązka na cel zapobiegania narkomanii do 50 000 zł',
        ],
        isFelony: false,
        keywords: ['marihuana', 'zioło', 'narkotyki', 'posiadanie narkotyków', 'własny użytek', 'art 62 uopn', 'art 62a', 'umorzenie', 'trawka'],
        isOfflinePinned: true,
      },
      {
        id: 'art-119-kw',
        number: 119,
        codePrefix: 'k.w.',
        title: 'Kradzież lub przywłaszczenie rzeczy do 800 zł (Wykroczenie)',
        chapter: 'Wykroczenia przeciwko mieniu (Kodeks Wykroczeń)',
        chapterNumber: 'Rozdział XI (k.w.)',
        content: `§ 1. Kto kradnie lub przywłaszcza sobie cudzą rzecz ruchomą, jeżeli jej wartość nie przekracza 800 złotych, podlega karze aresztu, ograniczenia wolności albo grzywny.
§ 2. Usiłowanie, podżeganie i pomocnictwo są karalne.
§ 3. W razie popełnienia wykroczenia (...) można orzec obowiązek zapłaty równowartości ukradzionego mienia lub obowiązek naprawienia szkody.`,
        plainSummary: 'Zabór lub przywłaszczenie cudzego przedmiotu o wartości do 800 zł (próg podwyższony 1 października 2023 r.). Sprawca NIE jest przestępcą i NIE trafia do Krajowego Rejestru Karnego (KRK) – ma w 100% czystą kartotekę. Mandat policyjny do 500 zł lub orzeczenie sądu grodzkiego do 5000 zł.',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 0,
          imprisonmentMaxMonths: 1, // Areszt od 5 do 30 dni
          summary: 'Areszt (od 5 do 30 dni), ograniczenie wolności (1 mies. prac społecznych) albo grzywna do 5 000 zł (mandat do 500 zł). Brak wpisu w KRK!',
        },
        additionalSanctions: [
          'Brak wpisu do Krajowego Rejestru Karnego (czysta kartoteka)',
          'Obowiązek zwrotu skradzionej rzeczy lub zapłaty jej równowartości',
          'Przepadek narzędzi posłużących do kradzieży',
        ],
        isFelony: false,
        keywords: ['kradzież do 800 zł', 'art 119 kw', 'kradzież sklepowa', 'wykroczenie kradzieży', 'próg 800 zł', 'mandat w sklepie'],
        isOfflinePinned: true,
      },
      {
        id: 'art-124-kw',
        number: 124,
        codePrefix: 'k.w.',
        title: 'Zniszczenie lub uszkodzenie cudzej rzeczy do 800 zł (Wykroczenie)',
        chapter: 'Wykroczenia przeciwko mieniu (Kodeks Wykroczeń)',
        chapterNumber: 'Rozdział XI (k.w.)',
        content: `§ 1. Kto cudzą rzecz niszczy, uszkadza lub czyni niezdatną do użytku, jeżeli szkoda nie przekracza 800 złotych, podlega karze aresztu, ograniczenia wolności albo grzywny.
§ 2. Usiłowanie, podżeganie i pomocnictwo są karalne.`,
        plainSummary: 'Porysowanie lakieru auta, wybicie małej szyby lub zniszczenie przedmiotu, gdy łączny koszt naprawy nie przekracza 800 zł. Nie stanowi przestępstwa z art. 288 k.k., sprawca nie trafia do rejestru skazanych KRK.',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 0,
          imprisonmentMaxMonths: 1,
          summary: 'Areszt od 5 do 30 dni, ograniczenie wolności lub grzywna do 5 000 zł.',
        },
        additionalSanctions: [
          'Obowiązek naprawienia szkody (art. 124 § 4 k.w.)',
          'Brak wpisu w KRK',
        ],
        isFelony: false,
        keywords: ['uszkodzenie mienia', 'art 124 kw', 'porysowanie auta do 800 zł', 'zniszczenie rzeczy', 'wykroczenie'],
        isOfflinePinned: true,
      },
      {
        id: 'art-156-kk',
        number: 156,
        codePrefix: 'k.k.',
        title: 'Ciężki uszczerbek na zdrowiu',
        chapter: 'Przestępstwa przeciwko życiu i zdrowiu',
        chapterNumber: 'Rozdział XIX',
        content: `§ 1. Kto powoduje ciężki uszczerbek na zdrowiu w postaci: pozbawienia wzroku, słuchu, mowy, zdolności płodzenia, innego ciężkiego kalectwa, ciężkiej choroby nieuleczalnej lub zagrażającej życiu, trwałej choroby psychicznej, całkowitej albo znacznej trwałej niezdolności do pracy w zawodzie lub trwałego, istotnego zeszpecenia lub zniekształcenia ciała, podlega karze pozbawienia wolności na czas nie krótszy od lat 3.
§ 3. Jeżeli następstwem czynu jest śmierć człowieka, sprawca podlega karze pozbawienia wolności od lat 5 albo karze dożywotniego pozbawienia wolności.`,
        plainSummary: 'Najcięższa kategoria uszkodzenia ciała – od 1 października 2023 r. traktowana jako ZBRODNIA (minimalna kara to 3 lata bezwzględnego więzienia, wyklucza zawieszenie kary!). Przykłady: utrata wzroku, wybicie oka, trwałe okaleczenie twarzy, rozległe poparzenia.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 36,
          imprisonmentMaxMonths: 240,
          summary: 'Zbrodnia: kara od 3 do 20 lat pozbawienia wolności. Przy skutku śmiertelnym od 5 do 30 lat lub dożywocie. Zakaz zawieszenia!',
        },
        additionalSanctions: [
          'Zadośćuczynienie finansowe i renta dla pokrzywdzonego (art. 46 k.k.)',
          'Zakaz zbliżania się i kontaktowania',
        ],
        isFelony: true,
        keywords: ['ciężki uszczerbek', 'art 156', 'pobicie kalectwo', 'utrata wzroku', 'zbrodnia', 'trwałe zeszpecenie'],
        isOfflinePinned: true,
      },
      {
        id: 'art-157-kk',
        number: 157,
        codePrefix: 'k.k.',
        title: 'Średni i lekki uszczerbek na zdrowiu (Rozstrój zdrowia poniżej i powyżej 7 dni)',
        chapter: 'Przestępstwa przeciwko życiu i zdrowiu',
        chapterNumber: 'Rozdział XIX',
        content: `§ 1. Kto powoduje naruszenie czynności narządu ciała lub rozstrój zdrowia, inny niż określony w art. 156 § 1, podlega karze pozbawienia wolności od 3 miesięcy do lat 5. (średni uszczerbek – powyżej 7 dni)
§ 2. Kto powoduje naruszenie czynności narządu ciała lub rozstrój zdrowia trwający nie dłużej niż 7 dni, podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do lat 2. (lekki uszczerbek)
§ 4. Ściganie przestępstwa określonego w § 2 (...) odbywa się z oskarżenia prywatnego.`,
        plainSummary: 'Klasyfikacja każdego uderzenia, bójki i zranienia. Kluczowy jest próg 7 dni ustalany przez biegłego medycyny sądowej: poniżej 7 dni (siniak, rozcięta warga) to sprawa z oskarżenia prywatnego (art. 157 § 2 k.k.); powyżej 7 dni (złamanie nosa, pęknięcie kości, wstrząśnienie mózgu) to przestępstwo ścigane przez prokuratora z urzędu (art. 157 § 1 k.k. – do 5 lat więzienia).',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 0,
          imprisonmentMaxMonths: 60,
          summary: 'Lekki (§ 2, do 7 dni): grzywna lub do 2 lat. Średni (§ 1, powyżej 7 dni): od 3 miesięcy do 5 lat pozbawienia wolności.',
        },
        additionalSanctions: [
          'Nawiązka i zadośćuczynienie za ból i leczenie (art. 46 k.k.)',
          'Możliwość warunkowego umorzenia (art. 66 k.k.) przy pojednaniu i naprawieniu szkody',
        ],
        isFelony: false,
        keywords: ['pobicie', 'uderzenie', 'złamanie nosa', 'art 157', 'rozstrój zdrowia 7 dni', 'obrażenia ciała', 'lekki uszczerbek'],
        isOfflinePinned: true,
      },
      {
        id: 'art-162-kk',
        number: 162,
        codePrefix: 'k.k.',
        title: 'Nieudzielenie pomocy człowiekowi w stanie zagrożenia życia',
        chapter: 'Przestępstwa przeciwko życiu i zdrowiu',
        chapterNumber: 'Rozdział XIX',
        content: `§ 1. Kto człowiekowi znajdującemu się w położeniu grożącym bezpośrednim niebezpieczeństwem utraty życia albo ciężkiego uszczerbku na zdrowiu nie udziela pomocy, mogąc jej udzielić bez narażenia siebie lub innej osoby na niebezpieczeństwo utraty życia albo ciężkiego uszczerbku na zdrowiu, podlega karze pozbawienia wolności do lat 3.
§ 2. Nie popełnia przestępstwa, kto nie udziela pomocy, do której jest konieczne poddanie się zabiegowi lekarskiemu albo w warunkach, w których możliwa jest niezwłoczna pomoc ze strony instytucji lub osoby do tego powołanej.`,
        plainSummary: 'Obowiązek prawny pomocy każdemu człowiekowi w śmiertelnym niebezpieczeństwie (np. ofierze wypadku, osobie nieprzytomnej, tonącej). Wystarczy wezwać pogotowie (112), aby uwolnić się od odpowiedzialności karnej. Zaniechanie grozi karą do 3 lat więzienia.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 1,
          imprisonmentMaxMonths: 36,
          summary: 'Pozbawienie wolności do lat 3.',
        },
        additionalSanctions: [
          'Zadośćuczynienie dla rodziny poszkodowanego',
          'Wpis do Krajowego Rejestru Karnego',
        ],
        isFelony: false,
        keywords: ['nieudzielenie pomocy', 'art 162', 'wypadek nieudzielenie', 'wezwanie karetki', 'zagrożenie życia'],
        isOfflinePinned: false,
      },
      {
        id: 'art-177-kk',
        number: 177,
        codePrefix: 'k.k.',
        title: 'Spowodowanie wypadku komunikacyjnego',
        chapter: 'Przestępstwa przeciwko bezpieczeństwu w komunikacji',
        chapterNumber: 'Rozdział XXI',
        content: `§ 1. Kto, naruszając, chociażby nieumyślnie, zasady bezpieczeństwa w ruchu lądowym, wodnym lub powietrznym, powoduje niechcący wypadek, w którym inna osoba odniosła obrażenia ciała określone w art. 157 § 1, podlega karze pozbawienia wolności do lat 3.
§ 2. Jeżeli następstwem wypadku jest śmierć innej osoby albo ciężki uszczerbek na jej zdrowiu, sprawca podlega karze pozbawienia wolności od 6 miesięcy do lat 8.`,
        plainSummary: 'Kolizja drogowa staje się przestępstwem wypadku (art. 177 k.k.), jeżeli chociaż jedna osoba (pasażer, pieszy, inny kierowca) dozna obrażeń ciała na okres powyżej 7 dni. Jeżeli nikt nie odniósł takich obrażeń, jest to jedynie wykroczenie kolizji (art. 86 k.w.).',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 1,
          imprisonmentMaxMonths: 96,
          summary: 'Średnie obrażenia (§ 1): do 3 lat. Śmierć lub ciężki uszczerbek (§ 2): od 6 miesięcy do 8 lat.',
        },
        additionalSanctions: [
          'Zakaz prowadzenia pojazdów (art. 42 k.k.)',
          'Nawiązka na rzecz pokrzywdzonego lub Funduszu Sprawiedliwości',
        ],
        isFelony: false,
        keywords: ['wypadek samochodowy', 'art 177', 'wypadek komunikacyjny', 'potrącenie pieszego', 'zderzenie aut'],
        isOfflinePinned: true,
      },
      {
        id: 'art-178-kk',
        number: 178,
        codePrefix: 'k.k.',
        title: 'Zaostrzenie karalności – Ucieczka z miejsca wypadku lub alkohol/narkotyki',
        chapter: 'Przestępstwa przeciwko bezpieczeństwu w komunikacji',
        chapterNumber: 'Rozdział XXI',
        content: `§ 1. Skazując sprawcę, który popełnił przestępstwo określone w art. 177 znajdując się w stanie nietrzeźwości lub pod wpływem środka odurzającego lub zbiegł z miejsca zdarzenia (...) sąd orzeka karę pozbawienia wolności przewidzianą za przypisane sprawcy przestępstwo w wysokości od dolnej granicy ustawowego zagrożenia zwiększonego o połowę (...) do górnej granicy zwiększonej o połowę.
§ 1a. Jeżeli następstwem wypadku jest śmierć lub ciężki uszczerbek na zdrowiu, a sprawca był pijany lub uciekł, sąd orzeka karę od 5 do 20 lat (od 1 października 2023 r.).`,
        plainSummary: 'Dramatyczne zaostrzenie kar: ucieczka z miejsca wypadku traktowana jest DOKŁADNIE TAK SAMO jak prowadzenie pod wpływem alkoholu! Dolna granica kary rośnie do 5 lat, brak możliwości zawieszenia kary, dożywotni zakaz prowadzenia pojazdów.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 60,
          imprisonmentMaxMonths: 240,
          summary: 'Od 5 do 20 lat pozbawienia wolności w wypadkach śmiertelnych z ucieczką lub alkoholem. Bezwzględne więzienie!',
        },
        additionalSanctions: [
          'Obligatoryjny dożywotni zakaz prowadzenia pojazdów mechanicznych (art. 42 § 3 k.k.)',
          'Nawiązka na rzecz pokrzywdzonego min. 10 000 zł do 100 000 zł',
          'Ubezpieczyciel (OC) występuje z regresem – sprawca z własnej kieszeni pokrywa miliony złotych odszkodowań!',
        ],
        isFelony: true,
        keywords: ['ucieczka z miejsca wypadku', 'art 178', 'wypadek po pijanemu', 'zaostrzenie kary', 'zbiegnięcie', 'regres ubezpieczeniowy'],
        isOfflinePinned: true,
      },
      {
        id: 'art-178b-kk',
        number: 178,
        suffix: 'b',
        codePrefix: 'k.k.',
        title: 'Niezatrzymanie się do kontroli drogowej (Ucieczka przed pościgiem policyjnym)',
        chapter: 'Przestępstwa przeciwko bezpieczeństwu w komunikacji',
        chapterNumber: 'Rozdział XXI',
        content: `Kto, pomimo wydania przez osobę uprawnioną do kontroli ruchu drogowego, poruszającą się pojazdem albo znajdującą się na statku wodnym lub powietrznym, przy użyciu sygnałów dźwiękowych i świetlnych, polecenia zatrzymania pojazdu mechanicznego nie zatrzymuje niezwłocznie pojazdu i kontynuuje jazdę, podlega karze pozbawienia wolności od 3 miesięcy do lat 5.`,
        plainSummary: 'Ucieczka przed radiowozem na sygnałach błyskowych i dźwiękowych to przestępstwo zagrożone karą do 5 lat więzienia oraz OBOWIĄZKOWYM zakazem prowadzenia pojazdów na minimum 1 rok (do 15 lat). Sprawa bezwzględnie trafia do sądu karnego i KRK.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 3,
          imprisonmentMaxMonths: 60,
          summary: 'Pozbawienie wolności od 3 miesięcy do 5 lat.',
        },
        additionalSanctions: [
          'Obligatoryjny zakaz prowadzenia pojazdów mechanicznych od 1 roku do 15 lat (art. 42 § 1a k.k.)',
          'Wpis do Krajowego Rejestru Karnego (status osoby karanej)',
        ],
        isFelony: false,
        keywords: ['ucieczka przed policją', 'art 178b', 'pościg policyjny', 'niezatrzymanie do kontroli', 'koguty policji', 'zakaz prowadzenia'],
        isOfflinePinned: true,
      },
      {
        id: 'art-216-kk',
        number: 216,
        codePrefix: 'k.k.',
        title: 'Zniewaga (Wyzwiska, wulgaryzmy, obraza w internecie)',
        chapter: 'Przestępstwa przeciwko czci i nietykalności cielesnej',
        chapterNumber: 'Rozdział XXVII',
        content: `§ 1. Kto znieważa inną osobę w jej obecności albo choćby pod jej nieobecność, lecz publicznie lub w zamiarze, aby zniewaga do osoby tej dotarła, podlega grzywnie albo karze ograniczenia wolności.
§ 2. Kto znieważa inną osobę za pomocą środków masowego komunikowania, podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do roku.
§ 3. Jeżeli zniewagę wywołało wyzywające zachowanie się poszkodowanego albo jeżeli poszkodowany odpowiedział zniewagą wzajemną (...) sąd może odstąpić od wymierzenia kary.`,
        plainSummary: 'Różnica między zniewagą (art. 216 k.k.) a zniesławieniem (art. 212 k.k.): zniewaga to obelga i naruszenie godności (np. wyzwiska „ty złodzieju, kretynie”), a zniesławienie to zarzut mogący poniżyć w opinii publicznej. Hejt w sieci (fora, komentarze) grozi karą do 1 roku więzienia.',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 0,
          imprisonmentMaxMonths: 12,
          summary: 'Typ podstawowy: grzywna lub ograniczenie wolności. W internecie (§ 2): do 1 roku więzienia.',
        },
        additionalSanctions: [
          'Nawiązka na PCK lub cel społeczny do 100 000 zł (art. 216 § 4 k.k.)',
          'Przeprosiny publiczne na łamach portalu lub mediów',
        ],
        isFelony: false,
        keywords: ['zniewaga', 'art 216', 'wyzwiska w internecie', 'obraza', 'obelgi', 'hejt', 'znieważenie'],
        isOfflinePinned: false,
      },
      {
        id: 'art-229-kk',
        number: 229,
        codePrefix: 'k.k.',
        title: 'Łapownictwo czynne (Wręczenie lub obietnica korzyści majątkowej urzędnikowi / policjantowi)',
        chapter: 'Przestępstwa przeciwko działalności instytucji państwowych oraz samorządu terytorialnego',
        chapterNumber: 'Rozdział XXIX',
        content: `§ 1. Kto udziela albo obiecuje udzielić korzyści majątkowej lub osobistej osobie pełniącej funkcję publiczną w związku z pełnieniem tej funkcji, podlega karze pozbawienia wolności od 6 miesięcy do lat 8.
§ 3. Jeżeli sprawca działa, aby skłonić osobę pełniącą funkcję publiczną do naruszenia przepisów prawa (...) podlega karze pozbawienia wolności od roku do lat 10.
§ 6. (Klauzula niekaralności): Nie podlega karze sprawca (...) jeżeli korzyść majątkowa lub osobista albo ich obietnica zostały przyjęte, a sprawca zawiadomił o tym organ powołany do ścigania przestępstw i ujawnił wszystkie istotne okoliczności przestępstwa, zanim organ ten o nim się dowiedział.`,
        plainSummary: 'Próba wręczenia pieniędzy policjantowi podczas kontroli drogowego lub urzędnikowi („żeby zapomnieć o mandacie”) to ciężkie przestępstwo zagrożone karą do 8 lub 10 lat więzienia! Art. 229 § 6 k.k. zawiera tzw. klauzulę bezkarności w razie samodenuncjacji.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 6,
          imprisonmentMaxMonths: 120,
          summary: 'Typ podstawowy: od 6 miesięcy do 8 lat. W celu skłonienia do złamania prawa: od 1 roku do 10 lat pozbawienia wolności.',
        },
        additionalSanctions: [
          'Przepadek wręczonych pieniędzy lub przedmiotów (art. 44 k.k.)',
          'Wpis do Krajowego Rejestru Karnego (zakaz pełnienia funkcji publicznych)',
        ],
        isFelony: false,
        keywords: ['łapówka', 'art 229', 'przekupstwo', 'danie w łapę policjantowi', 'korupcja', 'wręczenie korzyści'],
        isOfflinePinned: true,
      },
      {
        id: 'art-233-kk',
        number: 233,
        codePrefix: 'k.k.',
        title: 'Fałszywe zeznania i zatajenie prawdy',
        chapter: 'Przestępstwa przeciwko wymiarowi sprawiedliwości',
        chapterNumber: 'Rozdział XXX',
        content: `§ 1. Kto, składając zeznanie mające służyć za dowód w postępowaniu sądowym lub w innym postępowaniu prowadzonym na podstawie ustawy, zeznaje nieprawdę lub zataja prawdę, podlega karze pozbawienia wolności od 6 miesięcy do lat 8.
§ 2. Warunkiem odpowiedzialności jest, aby przyjmujący zeznanie (...) uprzedził go o odpowiedzialności karnej za fałszywe zeznanie lub odebrał od niego przyrzeczenie.
§ 1a. Kto składa fałszywe zeznanie z obawy przed odpowiedzialnością karną grożącą jemu samemu lub jego najbliższym, podlega karze pozbawienia wolności od 3 miesięcy do lat 5.`,
        plainSummary: 'Świadek ma prawny obowiązek mówić prawdę na policji, w prokuraturze i w sądzie (po pouczeniu z art. 233 k.k.). Kłamanie lub zatajenie prawdy grozi karą od 6 miesięcy do 8 lat więzienia. Uwaga: podejrzany ma prawo do milczenia i obrony, ale świadek kłamiący popełnia przestępstwo.',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 6,
          imprisonmentMaxMonths: 96,
          summary: 'Od 6 miesięcy do 8 lat pozbawienia wolności. Z obawy przed odpowiedzialnością (§ 1a): od 3 miesięcy do 5 lat.',
        },
        additionalSanctions: [
          'Wpis do Krajowego Rejestru Karnego',
          'Sąd może zastosować nadzwyczajne złagodzenie kary, jeżeli sprawca sprostuje zeznanie przed rozstrzygnięciem sprawy (art. 233 § 5 k.k.)',
        ],
        isFelony: false,
        keywords: ['fałszywe zeznania', 'art 233', 'kłamstwo na policji', 'kłamstwo w sądzie', 'zatajenie prawdy', 'świadek'],
        isOfflinePinned: true,
      },
      {
        id: 'art-270-kk',
        number: 270,
        codePrefix: 'k.k.',
        title: 'Fałszowanie dokumentów (Podrobienie podpisu, fałszywe L4, przerobienie umowy)',
        chapter: 'Przestępstwa przeciwko wiarygodności dokumentów',
        chapterNumber: 'Rozdział XXXIV',
        content: `§ 1. Kto, w celu użycia za autentyczny, podrabia lub przerabia dokument lub takiego dokumentu jako autentycznego używa, podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności od 3 miesięcy do lat 5.
§ 2. Tej samej karze podlega, kto wypełnia blankiet opatrzony cudzym podpisem, niezgodnie z wolą podpisanego i na jego szkodę albo takiego dokumentu używa.
§ 2a. W wypadku mniejszej wagi, sprawca podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do lat 2.`,
        plainSummary: 'Podrobienie podpisu nawet za zgodą i wiedzą żony/męża/szefa (np. na umowie, oświadczeniu, potwierdzeniu odbioru) jest formalnie PRZESTĘPSTWEM z art. 270 k.k.! Zgoda osoby nie legalizuje podrobienia jej podpisu. To samo dotyczy posługiwania się fałszywym zwolnieniem lekarskim (L4) czy fałszywą legitymacją.',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 3,
          imprisonmentMaxMonths: 60,
          summary: 'Pozbawienie wolności od 3 miesięcy do 5 lat (lub grzywna/ograniczenie wolności).',
        },
        additionalSanctions: [
          'Przepadek sfałszowanych dokumentów',
          'Wpis do Krajowego Rejestru Karnego',
        ],
        isFelony: false,
        keywords: ['podrobienie podpisu', 'art 270', 'fałszowanie dokumentów', 'fałszywe l4', 'podpis za kogoś', 'przerobienie umowy'],
        isOfflinePinned: true,
      },
      {
        id: 'art-284-kk',
        number: 284,
        codePrefix: 'k.k.',
        title: 'Przywłaszczenie rzeczy lub prawa majątkowego (Znaleziony telefon, portfel, leasing)',
        chapter: 'Przestępstwa przeciwko mieniu',
        chapterNumber: 'Rozdział XXXV',
        content: `§ 1. Kto przywłaszcza sobie cudzą rzecz ruchomą lub prawo majątkowe, podlega karze pozbawienia wolności do lat 3.
§ 2. Kto przywłaszcza sobie powierzoną mu rzecz ruchomą (sprzeniewierzenie), podlega karze pozbawienia wolności od 3 miesięcy do lat 5.
§ 3. W wypadku mniejszej wagi lub przywłaszczenia rzeczy znalezionej, sprawca podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do roku.`,
        plainSummary: '„Znalezione nie kradzione” to mit prawny! Zatrzymanie znalezionego telefonu, portfela z pieniędzmi lub laptopa bez oddania właścicielowi albo do biura rzeczy znalezionych jest przestępstwem przywłaszczenia (powyżej 800 zł art. 284 § 3 k.k., do 800 zł art. 119 k.w.). Nieoddanie powierzonego auta z wypożyczalni/leasingu to sprzeniewierzenie (do 5 lat więzienia).',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 0,
          imprisonmentMaxMonths: 36,
          summary: 'Przywłaszczenie rzeczy znalezionej (§ 3): do 1 roku więzienia. Zwykłe (§ 1): do 3 lat. Sprzeniewierzenie (§ 2): od 3 miesięcy do 5 lat.',
        },
        additionalSanctions: [
          'Obowiązek zwrotu rzeczy i naprawienia szkody (art. 46 k.k.)',
          'Możliwość warunkowego umorzenia (art. 66 k.k.) przy oddaniu rzeczy',
        ],
        isFelony: false,
        keywords: ['przywłaszczenie', 'art 284', 'znaleziony telefon', 'sprzeniewierzenie', 'znaleziony portfel', 'nieoddanie rzeczy'],
        isOfflinePinned: true,
      },
      {
        id: 'art-291-kk',
        number: 291,
        codePrefix: 'k.k.',
        title: 'Paserstwo umyślne (Kupno, przyjęcie lub pomoc w zbyciu rzeczy kradzionej)',
        chapter: 'Przestępstwa przeciwko mieniu',
        chapterNumber: 'Rozdział XXXV',
        content: `§ 1. Kto rzecz uzyskaną za pomocą czynu zabronionego nabywa albo pomaga do jej zbycia albo tę rzecz załatwia albo przyjmuje, podlega karze pozbawienia wolności od 3 miesięcy do lat 5.
§ 2. W wypadku mniejszej wagi, sprawca podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do roku.
(Uwaga: art. 292 k.k. przewiduje również paserstwo nieumyślne – kupno rzeczy, gdy na podstawie okoliczności należało przypuszczać, że pochodzi z kradzieży, np. nowy iPhone za 300 zł bez pudełka).`,
        plainSummary: 'Kupienie okazyjnie telefonu, roweru, katalizatora lub części samochodowych pochodzących z kradzieży. Nawet przy braku pewności co do kradzieży, rażąco niska cena rodzi odpowiedzialność za paserstwo nieumyślne (art. 292 k.k. – do 2 lat więzienia). Umyślne paserstwo to kara do 5 lat więzienia.',
        penalties: {
          fine: true,
          restrictionOfLiberty: true,
          imprisonmentMinMonths: 3,
          imprisonmentMaxMonths: 60,
          summary: 'Pozbawienie wolności od 3 miesięcy do 5 lat. Wypadek mniejszej wagi: grzywna, ograniczenie wolności lub do roku.',
        },
        additionalSanctions: [
          'Przepadek nabytej rzeczy na rzecz prawowitego właściciela (brak zwrotu zapłaconej kwoty)',
          'Wpis do Krajowego Rejestru Karnego',
        ],
        isFelony: false,
        keywords: ['paserstwo', 'art 291', 'art 292', 'kupno kradzionego', 'rzecz z kradzieży', 'kradziony telefon'],
        isOfflinePinned: false,
      },
      {
        id: 'art-300-kk',
        number: 300,
        codePrefix: 'k.k.',
        title: 'Udaremnienie lub uszczuplenie zaspokojenia wierzyciela (Ukrywanie majątku przed komornikiem)',
        chapter: 'Przestępstwa przeciwko obrotowi gospodarczemu',
        chapterNumber: 'Rozdział XXXVI',
        content: `§ 1. Kto, w razie grożącej mu niewypłacalności lub upadłości, udaremnia lub uszczupla zaspokojenie swojego wierzyciela przez to, że usuwa, ukrywa, zbywa, darowuje, niszczy, rzeczywiście lub pozornie obciąża albo uszkadza składniki swojego majątku, podlega karze pozbawienia wolności do lat 3.
§ 2. Kto, w celu udaremnienia wykonania orzeczenia sądu lub innego organu państwowego, udaremnia lub uszczupla zaspokojenie swojego wierzyciela przez to, że usuwa, ukrywa, zbywa, darowuje (...) składniki swojego majątku zajęte lub zagrożone zajęciem (...) podlega karze pozbawienia wolności od 3 miesięcy do lat 5.`,
        plainSummary: 'Przepisywanie mieszkań, samochodów lub pieniędzy na rodzinę (darowizna, fikcyjna sprzedaż), gdy toczy się postępowanie komornicze lub sprawa sądowa o zapłatę długu. Stanowi przestępstwo z art. 300 k.k., a czynności prawne są unieważniane przez wierzyciela w drodze skargi pauliańskiej (art. 527 k.c.).',
        penalties: {
          fine: false,
          restrictionOfLiberty: false,
          imprisonmentMinMonths: 3,
          imprisonmentMaxMonths: 60,
          summary: 'Przed komornikiem (§ 2): od 3 miesięcy do 5 lat więzienia. W stanie zagrożenia niewypłacalnością (§ 1): do 3 lat.',
        },
        additionalSanctions: [
          'Unieważnienie darowizny / sprzedaży przez sąd cywilny (skarga pauliańska)',
          'Wpis do Krajowego Rejestru Karnego',
        ],
        isFelony: false,
        keywords: ['ukrywanie majątku', 'art 300', 'przepisanie na żonę', 'komornik', 'ucieczka przed komornikiem', 'darowizna przed długami'],
        isOfflinePinned: true,
      },
    ];

    // Baza orzecznictwa sądowego
    const baseRulings: CourtRuling[] = [
      {
        id: 'sn-178a-1',
        signature: 'I KZP 8/23',
        court: 'Sąd Najwyższy – Izba Karna',
        date: '2023-11-28',
        articleRef: 'Art. 178a § 1 i § 4 k.k.',
        title: 'Pojęcie pojazdu mechanicznego a rower ze wspomaganiem elektrycznym',
        thesis: 'Rower wyposażony w pomocniczy silnik elektryczny o mocy nieprzekraczającej 250 W, odłączany po przekroczeniu prędkości 25 km/h, nie stanowi pojazdu mechanicznego w rozumieniu przepisów art. 178a k.k. Jazda takim pojazdem w stanie nietrzeźwości stanowi wykroczenie z art. 87 § 1a k.w., a nie przestępstwo.',
        sanctionImposed: 'Uchylenie wyroku skazującego za przestępstwo, przekazanie do ukarania grzywną w trybie wykroczeniowym.',
        summaryPlain: 'Jeśli jechałeś rowerem elektrycznym o standardowej mocy po alkoholu, nie popełniłeś przestępstwa z kodeksu karnego, lecz jedynie wykroczenie (grzywna, brak konfiskaty pojazdu).',
        tags: ['alkohol', 'rower elektryczny', 'pojazd mechaniczny', 'wykroczenie a przestępstwo'],
      },
      {
        id: 'sn-278-2',
        signature: 'II KK 219/22',
        court: 'Sąd Najwyższy – Izba Karna',
        date: '2022-09-14',
        articleRef: 'Art. 278 § 1 k.k.',
        title: 'Chwila dokonania kradzieży w sklepie samoobsługowym',
        thesis: 'Zabór rzeczy w sklepie samoobsługowym następuje z chwilą ukrycia towaru w odzieży, torbie lub w innym miejscu wykluczającym kontrolę personelu, niezależnie od faktu, czy sprawca przekroczył już linię kas.',
        sanctionImposed: 'Utrzymanie wyroku skazującego na 6 miesięcy pozbawienia wolności z warunkowym zawieszeniem na 2 lata.',
        summaryPlain: 'Schowanie perfum do kieszeni w sklepie jest już dokonaną kradzieżą, nawet jeśli ochrona zatrzymała sprawcę jeszcze przed kasami.',
        tags: ['kradzież sklepowa', 'usiłowanie a dokonanie', 'zabór mienia'],
      },
      {
        id: 'sn-279-3',
        signature: 'IV KK 305/21',
        court: 'Sąd Najwyższy – Izba Karna',
        date: '2021-12-09',
        articleRef: 'Art. 279 § 1 k.k.',
        title: 'Płatność zbliżeniowa znalezioną kartą bankową jako kradzież z włamaniem',
        thesis: 'Płatność zbliżeniowa cudzą, bezprawnie posiadaną kartą płatniczą bez zgody właściciela stanowi przestępstwo kradzieży z włamaniem określone w art. 279 § 1 k.k., gdyż polega na przełamaniu elektronicznej bariery zabezpieczającej dostęp do rachunku bankowego.',
        sanctionImposed: 'Wymierzono karę 1 roku pozbawienia wolności z warunkowym zawieszeniem wykonania na okres 3 lat oraz dozór kuratora i obowiązek zwrotu 142 zł.',
        summaryPlain: 'Płatność cudzą zbliżeniówką nawet na kwotę 10 zł to kradzież z włamaniem (grozi za to od 1 do 10 lat więzienia, bez względu na niską wartość!).',
        tags: ['karta płatnicza', 'zbliżeniowa', 'włamanie elektroniczne', 'art 279'],
      },
      {
        id: 'sn-25-4',
        signature: 'V KK 121/20',
        court: 'Sąd Najwyższy – Izba Karna',
        date: '2020-07-16',
        articleRef: 'Art. 25 § 1 i § 2 k.k.',
        title: 'Granice obrony koniecznej przy nagłym ataku nożownika',
        thesis: 'Osoba zaatakowana w sposób zagrażający życiu nie ma obowiązku ucieczki ani wyboru środka obrony o mniejszej sile rażenia, jeżeli intensywność i brutalność zamachu uzasadniały użycie narzędzia mogącego spowodować śmierć napastnika.',
        sanctionImposed: 'Uniewinnienie oskarżonego na podstawie art. 25 § 1 k.k.',
        summaryPlain: 'Napadnięty człowiek ma prawo bronić się wszelkimi dostępnymi środkami. Prawo nie wymaga ucieczki ani biernego czekania na cios.',
        tags: ['obrona konieczna', 'uniewinnienie', 'zamach bezpośredni', 'kontratyp'],
      },
      {
        id: 'sa-286-5',
        signature: 'II AKa 314/23',
        court: 'Sąd Apelacyjny w Warszawie',
        date: '2024-02-15',
        articleRef: 'Art. 286 § 1 k.k.',
        title: 'Oszustwo internetowe metodą na kod BLIK i kwalifikacja zorganizowanej grupy',
        thesis: 'Przejęcie konta na portalu społecznościowym i wyłudzanie kodów BLIK od znajomych pokrzywdzonego wyczerpuje znamiona oszustwa z art. 286 § 1 k.k. w zbiegu z art. 267 § 1 k.k. Brak bezpośredniego kontaktu fizycznego nie wyłącza kwalifikacji wprowadzenia w błąd.',
        sanctionImposed: '2 lata i 6 miesięcy pozbawienia wolności bez zawieszenia oraz naprawienie szkody na rzecz 14 osób.',
        summaryPlain: 'Podszywanie się pod kogoś na Messengerze i prośby o kod BLIK to surowo karane oszustwo. Sądy orzekają bezwzględne więzienie przy działalności seryjnej.',
        tags: ['blik', 'oszustwo internetowe', 'social media', 'wyłudzenie'],
      },
      {
        id: 'sn-158-6',
        signature: 'III KK 412/22',
        court: 'Sąd Najwyższy – Izba Karna',
        date: '2023-04-18',
        articleRef: 'Art. 158 § 1 k.k.',
        title: 'Odpowiedzialność solidarna uczestników bójki a brak identyfikacji konkretnego ciosu',
        thesis: 'Dla przypisania odpowiedzialności z art. 158 § 1 k.k. nie jest konieczne udowodnienie, który z uczestników zadał uderzenie wywołujące bezpośrednie niebezpieczeństwo; wystarczy świadomy udział w niebezpiecznym starciu.',
        sanctionImposed: 'Kary od 8 do 14 miesięcy pozbawienia wolności dla wszystkich 4 oskarżonych.',
        summaryPlain: 'Biorąc udział w bójce odpowiadasz karnie nawet wtedy, gdy to twój kolega powalił poszkodowanego na ziemię.',
        tags: ['bójka', 'pobicie', 'odpowiedzialność zbiorowa'],
      },
      {
        id: 'sn-51-kw',
        signature: 'III KRN 189/92',
        court: 'Sąd Najwyższy – Izba Karna',
        date: '1992-12-02',
        articleRef: 'Art. 51 § 1 k.w.',
        title: 'Definicja wybryku oraz naruszenia spoczynku nocnego',
        thesis: 'Wybrykiem w rozumieniu art. 51 § 1 k.w. jest zachowanie rażąco odbiegające od przyjętych norm współżycia społecznego, nacechowane lekceważeniem zasad i spokoju innych. Zakłócenie spoczynku nocnego wymaga wykazania, że zachowanie sprawcy uniemożliwiło lub przerwało sen chociażby jednej osoby, o ile miało charakter obiektywnego wybryku, a nie zwykłych, życiowych czynności bytowych.',
        sanctionImposed: 'Uchylenie orzeczenia o ukaraniu z uwagi na brak znamienia wybryku.',
        summaryPlain: 'Zwykłe odgłosy życia (płacz niemowlaka, skrzypiąca podłoga, pojedynczy upadek przedmiotu, awaria hydrauliczna) NIE są wybrykiem ani wykroczeniem. Wybrykiem jest tylko hałas rażący, złośliwy lub lekceważący innych (np. głośna impreza, krzyki, puszczanie basów po 22).',
        tags: ['cisza nocna', 'spoczynek nocny', 'wybryk', 'art 51 kw', 'odgłosy życia'],
      },
      {
        id: 'sn-190a-kw',
        signature: 'I KZP 10/19',
        court: 'Sąd Najwyższy – Izba Karna',
        date: '2020-02-27',
        articleRef: 'Art. 51 k.w. w zw. z art. 190a § 1 k.k.',
        title: 'Granica między wykroczeniem zakłócenia spokoju a przestępstwem stalkingu',
        thesis: 'Powtarzające się, systematyczne i celowe generowanie uciążliwego hałasu, wibracji lub uderzeń w ściany, ukierunkowane na dręczenie konkretnego sąsiada i wywołanie u niego poczucia bezradności i udręczenia, wykracza poza ramy wykroczenia z art. 51 k.w. i stanowi przestępstwo uporczywego nękania (art. 190a § 1 k.k.).',
        sanctionImposed: 'Kara 1 roku ograniczenia wolności oraz zakaz zbliżania się do sąsiadów.',
        summaryPlain: 'Gdy sąsiad celowo i złośliwie zakłóca spokój noc po nocy, by kogoś wykończyć psychicznie, odpowiada przed sądem karnym za przestępstwo z art. 190a k.k. (do 8 lat więzienia).',
        tags: ['cisza nocna', 'stalking', 'konflikt sąsiedzki', 'art 190a'],
      },
      {
        id: 'sn-212-web',
        signature: 'IV KK 23/21',
        court: 'Sąd Najwyższy – Izba Karna',
        date: '2021-06-15',
        articleRef: 'Art. 212 § 2 k.k.',
        title: 'Zniesławienie w internecie a anonimowość sprawcy',
        thesis: 'Publikacja w mediach społecznościowych lub na forum internetowym wpisów przypisujących innej osobie postępowanie mogące poniżyć ją w opinii publicznej wypełnia znamiona typu kwalifikowanego zniesławienia za pomocą środków masowego komunikowania (art. 212 § 2 k.k.). Posłużenie się pseudonimem lub kontem fikcyjnym nie wyłącza odpowiedzialności karnej.',
        sanctionImposed: 'Grzywna w wysokości 50 stawek dziennych po 100 zł oraz 4000 zł nawiązki.',
        summaryPlain: 'Hejt, fałszywe zarzuty i oszczerstwa w internecie to przestępstwo ścigane karnie. Na wniosek sądu policja ustala adres IP i dane abonenta.',
        tags: ['hejt', 'zniesławienie', 'internet', 'art 212 kk'],
      },
      {
        id: 'sn-94-kw',
        signature: 'I KZP 4/22',
        court: 'Sąd Najwyższy – Izba Karna',
        date: '2022-06-02',
        articleRef: 'Art. 94 § 1 i § 3 k.w.',
        title: 'Obligatoryjny charakter zakazu prowadzenia pojazdów za brak uprawnień',
        thesis: 'W stanie prawnym po 1 stycznia 2022 r. orzeczenie zakazu prowadzenia pojazdów na podstawie art. 94 § 3 k.w. w razie skazania za czyn z art. 94 § 1 k.w. ma charakter bezwzględnie obligatoryjny. Sąd nie może odstąpić od orzeczenia tego środka karnego.',
        sanctionImposed: 'Grzywna 2000 zł oraz zakaz prowadzenia wszelkich pojazdów mechanicznych na okres 1 roku.',
        summaryPlain: 'Kierowca złapany bez prawa jazdy MUSI otrzymać zakaz prowadzenia pojazdów (min. 6 miesięcy). Sąd nie ma prawa zrezygnować z zakazu.',
        tags: ['bez prawa jazdy', 'art 94 kw', 'zakaz prowadzenia', 'obligatoryjny zakaz'],
      },
    ];

    // Alerty o zmianach przepisów
    const baseAlerts: LegalAlert[] = [
      {
        id: 'alert-konfiskata-2024',
        date: '2024-03-14',
        title: 'Wejście w życie konfiskaty pojazdów za jazdę pod wpływem alkoholu',
        affectedArticles: ['Art. 178a § 5 k.k.', 'Art. 44b k.k.'],
        severity: 'high',
        summary: 'Obligatoryjny przepadek auta przy stężeniu min. 1,5 promila lub 1,0 promila przy recydywie/spowodowaniu wypadku.',
        fullDescription: 'Od 14 marca 2024 r. weszła w życie kluczowa nowelizacja Kodeksu karnego wprowadzająca przepadek pojazdu mechanicznego prowadzonego przez sprawcę przestępstwa w ruchu lądowym. Jeżeli samochód nie stanowił wyłącznej własności sprawcy, orzeka się nawiązkę w wysokości wartości rynkowej pojazdu.',
        practicalImpact: 'W sprawach z art. 178a kluczowa linia obrony opiera się na kwestionowaniu procedury pomiaru alkomatem, badania krwi oraz warunków wyjątkowych (art. 44b § 2 k.k. - wypadek uzasadniony szczególnymi okolicznościami).',
      },
      {
        id: 'alert-reforma-kk-2023',
        date: '2023-10-01',
        title: 'Wielka nowelizacja Kodeksu Karnego – zaostrzenie kar i bezwzględne dożywocie',
        affectedArticles: ['Art. 148 k.k.', 'Art. 280 k.k.', 'Art. 190 k.k.', 'Art. 32 k.k.'],
        severity: 'high',
        summary: 'Likwidacja osobnej kary 25 lat pozbawienia wolności, wprowadzenie kary do 30 lat oraz możliwość orzeczenia dożywocia bez warunkowego przedterminowego zwolnienia.',
        fullDescription: 'Ustawodawca drastycznie zaostrzył granice sankcji karnych dla większości przestępstw przeciwko życiu, zdrowiu i mieniu. Podwyższono górne granice za rozbój, groźbę bezprawną, zabójstwo kwalifikowane.',
        practicalImpact: 'Obrona musi precyzyjnie weryfikować datę popełnienia czynu – zgodnie z regułą lex retro non agit (art. 4 § 1 k.k.) stosuje się ustawę względniejszą dla sprawcy.',
      },
      {
        id: 'alert-prog-kradziez-800',
        date: '2023-10-01',
        title: 'Podwyższenie progu kradzieży do 800 zł (art. 119 KW vs art. 278 KK)',
        affectedArticles: ['Art. 278 k.k.', 'Art. 119 k.w.'],
        severity: 'medium',
        summary: 'Czyn polegający na kradzieży mienia do 800 zł jest wykroczeniem, powyżej tej kwoty stanowi przestępstwo.',
        fullDescription: 'Próg tzw. czynu przepołowionego został z dniem 1 października 2023 r. podwyższony z dotychczasowych 500 zł do stałej kwoty 800 zł. Zniesiono także powiązanie tego progu z minimalnym wynagrodzeniem.',
        practicalImpact: 'Sprawy o kradzieże poniżej 800 zł nie podlegają wpisowi do KRK (Krajowego Rejestru Karnego jako przestępstwo).',
      },
      {
        id: 'alert-ochrona-ratownikow',
        date: '2024-01-01',
        title: 'Wzmożona ochrona ratowników medycznych i personelu SOR',
        affectedArticles: ['Art. 222 k.k.', 'Art. 226 k.k.'],
        severity: 'medium',
        summary: 'Ratownicy medyczni i pielęgniarki korzystają z pełnej ochrony prawnej przynależnej funkcjonariuszowi publicznemu.',
        fullDescription: 'Atak fizyczny lub znieważenie ratownika medycznego udzielającego pomocy jest ścigane z urzędu jako przestępstwo z art. 222 lub 226 k.k.',
        practicalImpact: 'Sądy eliminują możliwość warunkowego umarzania postępowań w przypadku agresji wobec załóg karetek pogotowia.',
      },
    ];

    this.articles.set(baseArticles);
    this.courtRulings.set(baseRulings);
    this.legalAlerts.set(baseAlerts);
  }

  private async loadNotesFromStorage(): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(this.NOTES_STORAGE_KEY);
      if (!raw) {
        // Notatki startowe demonstracyjne
        const sampleNotes: EncryptedNote[] = [
          {
            id: 'note-1',
            title: 'Wniosek o warunkowe umorzenie – Kowalski (Art. 178a § 1)',
            content: 'Klient po raz pierwszy w kolizji z prawem. Wynik badania: 0.28 mg/l (0.58 promila). Dobrowolna wpłata na Fundusz Pomocy Pokrzywdzonym w kwocie 5000 zł przed pierwszą rozprawą. Złożono wniosek o wyznaczenie rocznego okresu próby i odstąpienie od zakazu prowadzenia pojazdów na podst. art. 67 § 3 k.k.',
            category: 'Sprawa klienta',
            linkedArticle: 'Art. 178a § 1 k.k.',
            tags: ['Kowalski', 'warunkowe umorzenie', 'alkohol', 'linia obrony'],
            updatedAt: new Date().toISOString().split('T')[0],
            isEncrypted: false,
          },
          {
            id: 'note-2',
            title: 'Analiza wykładni art. 279 k.k. (karta zbliżeniowa)',
            content: 'Zgodnie z uchwałą SN IV KK 305/21 płatność zbliżeniowa to włamanie do systemu. W przypadku małych kwot (np. 15 zł) należy wnosić o wypadek mniejszej wagi z art. 279 § 2 k.k., co umożliwia orzeczenie kary grzywny zamiast więzienia.',
            category: 'Analiza prawna',
            linkedArticle: 'Art. 279 § 1 k.k.',
            tags: ['doktryna', 'orzecznictwo', 'kradzież z włamaniem'],
            updatedAt: new Date().toISOString().split('T')[0],
            isEncrypted: false,
          },
        ];
        this.notes.set(sampleNotes);
        return;
      }

      // Jeśli skarbiec jest odblokowany i dane są zaszyfrowane
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.notes.set(parsed);
      }
    } catch (e) {
      console.warn('Nie można załadować lokalnych notatek:', e);
    }
  }

  async saveNote(note: Omit<EncryptedNote, 'id' | 'updatedAt' | 'isEncrypted'>, existingId?: string): Promise<EncryptedNote> {
    const isAuth = this.cryptoService.isAuthenticated();
    const id = existingId || `note-${Date.now()}`;
    const updatedAt = new Date().toISOString().split('T')[0];

    let contentToStore = note.content;
    let isEncrypted = false;

    // Szyfruj zawartość, jeśli użytkownik jest zalogowany do bezpiecznego skarbca
    if (isAuth) {
      try {
        contentToStore = await this.cryptoService.encrypt(note.content);
        isEncrypted = true;
      } catch (e) {
        console.warn('Szyfrowanie nie powiodło się, zapis w trybie jawnym:', e);
      }
    }

    const newNote: EncryptedNote = {
      ...note,
      id,
      updatedAt,
      content: note.content, // w pamięci trzymamy jawną dla UI
      isEncrypted,
    };

    const currentNotes = this.notes().filter((n) => n.id !== id);
    const updatedList = [newNote, ...currentNotes];
    this.notes.set(updatedList);

    // Zapisz do localStorage z uwzględnieniem zaszyfrowanej treści (contentToStore)
    const storageList = updatedList.map((n) =>
      n.id === id ? { ...n, content: contentToStore } : n
    );
    this.persistNotesToStorage(storageList);

    // Kolejkuj zmianę w OfflineSyncService dla synchronizacji z bazą główną
    const operation = existingId ? 'UPDATE' : 'CREATE';
    this.offlineSync.enqueueChange('note', operation, id, {
      ...newNote,
      content: contentToStore,
    });

    return newNote;
  }

  async deleteNote(id: string): Promise<void> {
    const deletedNote = this.notes().find((n) => n.id === id);
    const updatedList = this.notes().filter((n) => n.id !== id);
    this.notes.set(updatedList);
    this.persistNotesToStorage(updatedList);

    // Kolejkuj usunięcie w OfflineSyncService
    this.offlineSync.enqueueChange('note', 'DELETE', id, {
      id,
      title: deletedNote?.title || id,
    });
  }

  private persistNotesToStorage(notesList: EncryptedNote[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.NOTES_STORAGE_KEY, JSON.stringify(notesList));
    } catch (e) {
      console.error('Błąd zapisu notatek w localStorage:', e);
    }
  }

  toggleArticleOfflinePin(articleId: string): void {
    this.articles.update((arts) =>
      arts.map((a) => (a.id === articleId ? { ...a, isOfflinePinned: !a.isOfflinePinned } : a))
    );
  }
}
