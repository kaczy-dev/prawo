import { Injectable, signal, computed } from '@angular/core';
import { HandbookTopic } from '../models/legal.model';

@Injectable({
  providedIn: 'root',
})
export class HandbooksDataService {
  readonly topics = signal<HandbookTopic[]>([
    {
      id: 'hb-obrona-konieczna',
      title: 'Obrona konieczna – kiedy i jak możesz się bronić?',
      subtitle: 'Art. 25 k.k. – Granice legalnej obrony, obrona miru domowego i mity o ucieczce',
      slug: 'obrona-konieczna-granice',
      difficulty: 'podstawowy',
      category: 'Część ogólna',
      readTimeMinutes: 5,
      icon: 'shield',
      summary: 'W polskim prawie nikt nie ma obowiązku uciekać przed bandytą. Prawo nie ustępuje przed bezprawiem. Dowiedz się, czym jest zamach bezpośredni i bezprawny oraz jak chroni Cię zasada „mój dom moją twierdzą”.',
      sections: [
        {
          heading: '1. Czym jest obrona konieczna (kontratyp)?',
          paragraphs: [
            'Obrona konieczna (art. 25 § 1 k.k.) oznacza, że działanie podjęte w celu odparcia bezpośredniego, bezprawnego zamachu na jakiekolwiek dobro chronione prawem (Twoje życie, zdrowie, nietykalność, a nawet mienie czy godność) nie jest przestępstwem. Sprawca działający w obronie koniecznej nie popełnia czynu zabronionego.',
            'Zamach musi być bezprawny (np. fizyczny atak, próba kradzieży, włamanie) oraz bezpośredni – czyli taki, który już trwa lub za ułamek sekundy nieuchronnie nastąpi (np. napastnik wyciąga nóż i rusza w Twoją stronę). Nie wolno natomiast „bronić się” przed zamachem, który dopiero może nastąpić za tydzień, ani mścić się po fakcie, gdy napastnik już uciekł.',
          ],
        },
        {
          heading: '2. Współmierność obrony i eksces (przekroczenie granic)',
          paragraphs: [
            'Sposób obrony musi być współmierny do niebezpieczeństwa zamachu. Nie oznacza to jednak, że musisz bronić się „taką samą bronią” jak napastnik! Jeśli zostałeś zaatakowany przez silniejszego agresora gołymi rękami, użycie gazu pieprzowego lub podręcznego przedmiotu jest jak najbardziej dopuszczalne.',
            'Przekroczenie granic obrony koniecznej (tzw. eksces) zachodzi w dwóch formach: eksces intensywny (zastosowanie środka rażąco niewspółmiernego, np. zastrzelenie uciekającego złodzieja jabłek) oraz eksces ekstensywny (zbyt wczesna lub spóźniona obrona – np. bicie leżącego i obezwładnionego agresora). Nawet przy ekscesie sąd może zastosować nadzwyczajne złagodzenie kary lub odstąpić od jej wymierzenia.',
          ],
        },
        {
          heading: '3. Obrona miru domowego – Art. 25 § 2a k.k. („Mój dom moją twierdzą”)',
          paragraphs: [
            'Od 2018 roku polskie prawo przewiduje szczególną ochronę lokatora. Jeżeli ktoś wdziera się do Twojego mieszkania, domu, lokalu lub na ogrodzoną posesję, albo nie opuszcza ich mimo wezwania – nie podlega karze ten, kto przekracza granice obrony koniecznej, chyba że przekroczenie było rażące.',
            'W praktyce oznacza to ogromne domniemanie na korzyść obrońcy: w swoim domu masz prawo działać w skrajnym stresie i nie musisz z linijką w ręku mierzyć siły obrony przed intruzem.',
          ],
        },
      ],
      keyRules: [
        'Prawo nie musi ustępować przed bezprawiem – nie masz prawnego obowiązku ucieczki przed napastnikiem.',
        'Możesz stanąć w obronie nie tylko siebie, ale także osoby trzeciej (np. bitej kobiety na przystanku).',
        'Gdy napastnik zrezygnował i ucieka, zamach ustał – dalszy pościg i wymierzanie „sprawiedliwości” to przestępstwo pobicia lub naruszenia nietykalności.',
        'W mieszkaniu lub na ogrodzonej posesji chroni Cię art. 25 § 2a k.k. – intruz bierze ryzyko na siebie.',
      ],
      mythsAndFacts: [
        {
          myth: 'Musisz najpierw próbować uciekać, a dopiero w ostateczności możesz uderzyć napastnika.',
          fact: 'Fałsz. Zgodnie z utrwaloną linią Sądu Najwyższego zaatakowany obywatel ma prawo do aktywnej obrony i nie ma obowiązku ratowania się ucieczką.',
        },
        {
          myth: 'Możesz użyć tylko takiej broni, jaką ma napastnik (np. nóż tylko na nóż).',
          fact: 'Bzdura. Obrona ma być skuteczna. Drobna kobieta zaatakowana przez potężnego mężczyznę ma pełne prawo użyć gazu, pałki lub noża, aby wyrównać szanse.',
        },
        {
          myth: 'Jeżeli obezwładniłeś agresora i leży na ziemi, możesz go „dla nauczki” jeszcze kopnąć.',
          fact: 'Nie wolno! To podręcznikowy eksces ekstensywny (spóźniona obrona). W tym momencie stajesz się agresorem i odpowiadasz karnie za pobicie lub uszkodzenie ciała.',
        },
      ],
      caseStudies: [
        {
          id: 'cs-obrona-1',
          title: 'Atak w klatce schodowej i użycie gazu pieprzowego',
          scenario: 'Pan Tomasz (34 lata) wracał wieczorem do domu. Na klatce schodowej został zablokowany przez dwóch pijanych i agresywnych mężczyzn, którzy zażądali wydania portfela i zegarka, popychając go na ścianę. Tomasz wyjął z kieszeni gaz pieprzowy, obezwładnił obu napastników i uciekł do mieszkania, wzywając Policję.',
          legalDilemma: 'Czy użycie gazu obezwładniającego i spowodowanie pieczenia spojówek stanowiło naruszenie nietykalności cielesnej lub uszczerbek na zdrowiu napastników?',
          courtResolution: 'Prokuratura umorzyła postępowanie z uwagi na działanie w ramach kontratypu obrony koniecznej (art. 25 § 1 k.k.). Zamach na mienie i nietykalność był bezpośredni i bezprawny, a użycie gazu pieprzowego stanowiło wzorowy, współmierny środek obronny.',
          practicalTakeaway: 'Noszenie atestowanego gazu pieprzowego jest w 100% legalne i stanowi jeden z najbezpieczniejszych procesowo środków obrony koniecznej w Polsce.',
          relatedArticles: [
            { code: 'Art. 25 § 1 k.k.', label: 'Obrona konieczna', articleId: 'art-25' },
            { code: 'Art. 280 k.k.', label: 'Rozbój' },
          ],
          relatedRulingSignatures: ['II KK 142/23', 'V KK 241/22'],
          calculatorScenarioQuery: 'odparcie ataku dwóch napastników gazem pieprzowym w obronie portfela',
        },
        {
          id: 'cs-obrona-2',
          title: 'Nocne włamanie do domu – art. 25 § 2a k.k.',
          scenario: 'Pani Anna (42 lata) spała w domu z dziećmi. O godzinie 2:30 w nocy usłyszała brzęk wybijanej szyby w salonie. W korytarzu zauważyła zamaskowanego mężczyznę z łomem. Anna chwyciła stojący w sieni kij bejsbolowy i z całej siły uderzyła intruza w ramię, powodując złamanie kości obojczyka. Intruz uciekł przez okno i został zatrzymany w szpitalu.',
          legalDilemma: 'Czy złamanie kości obojczyka intruza nie było zbyt drastycznym środkiem, skoro intruz jeszcze nikogo nie uderzył?',
          courtResolution: 'Sąd i prokurator zastosowali art. 25 § 2a k.k. Wtargnięcie do lokalu mieszkalnego w nocy z niebezpiecznym narzędziem daje lokatorowi pełne prawo do zdecydowanej obrony. Działanie Anny nie stanowiło rażącego przekroczenia granic obrony.',
          practicalTakeaway: 'W granicach własnego mieszkania prawo chroni Cię szczególnie silnie. Nie musisz czekać, aż intruz zada pierwszy cios.',
          relatedArticles: [
            { code: 'Art. 25 § 2a k.k.', label: 'Obrona miru domowego', articleId: 'art-25' },
            { code: 'Art. 193 k.k.', label: 'Zakłócenie miru domowego' },
          ],
          relatedRulingSignatures: ['IV KK 109/21'],
          calculatorScenarioQuery: 'uderzenie kijem bejsbolowym włamywacza w domu w nocy',
        },
      ],
      linkedArticleRefs: [
        { code: 'Art. 25 k.k.', label: 'Obrona konieczna i mir domowy', articleId: 'art-25' },
        { code: 'Art. 158 k.k.', label: 'Udział w bójce lub pobiciu', articleId: 'art-158' },
        { code: 'Art. 193 k.k.', label: 'Naruszenie miru domowego' },
      ],
      linkedRulingSignatures: ['II KK 142/23', 'V KK 241/22'],
      quickScenarioQuery: 'art. 25 obrona konieczna napadnięty',
      quiz: {
        question: 'Czy zaatakowany na ulicy obywatel ma prawny obowiązek ratować się ucieczką, zanim użyje siły do obrony?',
        options: [
          'Tak, prawo nakazuje ucieczkę, a siły wolno użyć tylko w ślepym zaułku.',
          'Nie, prawo nie musi ustępować przed bezprawiem – obrona przed bezpośrednim zamachem jest prawem obywatela.',
          'Tak, ale tylko jeśli napastnik nie posiada niebezpiecznego narzędzia.',
          'Zależy to wyłącznie od tego, czy na miejscu zdarzenia znajduje się funkcjonariusz Policji.',
        ],
        correctIndex: 1,
        explanation: 'Zgodnie z ugruntowaną linią orzeczniczą Sądu Najwyższego (m.in. wyrok II KK 142/23), obywatel nie ma obowiązku uciekać przed zamachem. Ma pełne prawo podjąć skuteczną obronę konieczną.',
      },
    },

    {
      id: 'hb-alkohol-konfiskata',
      title: 'Jazda po alkoholu i konfiskata auta (stan 2024–2026)',
      subtitle: 'Art. 178a k.k. oraz Art. 44b k.k. – Stan po użyciu vs stan nietrzeźwości, utrata samochodu i nawiązki',
      slug: 'alkohol-konfiskata-pojazdu',
      difficulty: 'podstawowy',
      category: 'Ruch drogowy',
      readTimeMinutes: 6,
      icon: 'directions_car',
      summary: '14 marca 2024 r. weszła w życie rewolucyjna nowelizacja Kodeksu Karnego. Jazda z wynikiem powyżej 1,5 promila oznacza bezwzględną utratę auta. Sprawdź, co dzieje się, gdy auto jest w leasingu, należy do pracodawcy lub żony.',
      sections: [
        {
          heading: '1. Wykroczenie czy przestępstwo? Dwa kluczowe progi',
          paragraphs: [
            'W polskim prawie istnieją dwa fundamentalne stany stężenia alkoholu: stan po użyciu alkoholu (od 0,2 do 0,5 promila we krwi lub od 0,1 do 0,25 mg/l w wydychanym powietrzu) oraz stan nietrzeźwości (powyżej 0,5 promila lub powyżej 0,25 mg/l).',
            'Stan po użyciu (do 0,5‰) to wykroczenie z art. 87 Kodeksu Wykroczeń – grozi za to areszt, grzywna do 30 000 zł i zakaz prowadzenia od 6 miesięcy do 3 lat. Nie ma wpisu do rejestru skazanych (KRK). Natomiast powyżej 0,5‰ to już przestępstwo z art. 178a § 1 k.k., za które grozi do 3 lat więzienia, minimum 5000 zł nawiązki na Fundusz Sprawiedliwości i zakaz prowadzenia na minimum 3 lata.',
          ],
        },
        {
          heading: '2. Nowe zasady konfiskaty samochodów (Art. 44b k.k.)',
          paragraphs: [
            'Od 14 marca 2024 r. sąd obligatoryjnie orzeka przepadek pojazdu mechanicznego, jeżeli kierowca miał we krwi co najmniej 1,5 promila alkoholu (lub co najmniej 0,75 mg/l w wydychanym powietrzu).',
            'Sąd orzeka konfiskatę również przy niższym stężeniu (od 1,0 promila), jeżeli kierowca spowodował wypadek drogowy lub dopuścił się recydywy (był już wcześniej karany za jazdę po alkoholu).',
          ],
        },
        {
          heading: '3. Co jeśli auto nie jest Twoją wyłączną własnością?',
          paragraphs: [
            'Jeżeli w chwili popełnienia czynu pojazd nie stanowił wyłącznej własności sprawcy (np. samochód w leasingu, wynajmie długoterminowym, na kredyt lub stanowiący majątek wspólny małżonków) – sąd orzeka przepadek równowartości pojazdu!',
            'Wartość pojazdu ustala się na podstawie wartości określonej w polisie ubezpieczeniowej (AC), a w razie jej braku – średniej wartości rynkowej według tabel Eurotax/Info-Ekspert. Z kolei jeśli sprawca prowadził pojazd wykonując czynności zawodowe dla pracodawcy (np. kierowca ciężarówki lub dostawczaka), sąd orzeka nawiązkę na rzecz Funduszu Sprawiedliwości w wysokości od 5 000 zł do aż 100 000 zł.',
          ],
        },
      ],
      keyRules: [
        'Do 0,2 promila – jazda jest legalna w Polsce (tzw. margines błędu).',
        '0,21 - 0,5 promila – wykroczenie drogowe (mandat/sąd, grzywna do 30 tys. zł, zakaz jazdy).',
        'Powyżej 0,5 promila – przestępstwo kryminalne (art. 178a k.k., wpis do KRK, min. 3 lata zakazu).',
        'Od 1,5 promila – bezwzględna konfiskata auta lub zapłata jego rynkowej wartości.',
        'Odmowa dmuchania w alkomat oznacza przymusowe pobranie krwi w szpitalu przez policję.',
      ],
      mythsAndFacts: [
        {
          myth: 'Jeżeli jadę autem żony lub w leasingu, to policja nic mi nie zrobi i nie stracę pieniędzy.',
          fact: 'Fałsz! Zgodnie z art. 44b § 2 k.k. sąd nakaże Ci zapłacić pełną równowartość rynkową tego samochodu z własnej kieszeni.',
        },
        {
          myth: 'Jak wypiję piwo i pojadę rowerem lub hulajnogą, to odbiorą mi prawo jazdy na samochód.',
          fact: 'Nie. Prowadzenie roweru lub hulajnogi po alkoholu to wykroczenie z art. 87 § 1a k.w. Grozi za to mandat 1000–2500 zł, ale zakaz prowadzenia dotyczy wyłącznie pojazdów niemechanicznych (nie tracisz prawa jazdy kat. B).',
        },
        {
          myth: 'Stan „wczorajszy” rano jest łagodniej traktowany przez sąd.',
          fact: 'Sąd nie rozróżnia, czy piłeś 2 godziny temu, czy 10 godzin temu. Liczy się wyłącznie wynik badania stężenia alkoholu w chwili kierowania.',
        },
      ],
      caseStudies: [
        {
          id: 'cs-alkohol-1',
          title: 'Kierowca z 1.6 promila w prywatnym samochodzie',
          scenario: 'Marek (29 lat) został zatrzymany do rutynowej kontroli drogowej w niedzielę o 9:00 rano po weselu. Badanie alkomatem wykazało 0,78 mg/l (ok. 1,63 promila). Prowadził własnego Volkswagena Passata z 2019 roku o wartości rynkowej 65 000 zł.',
          legalDilemma: 'Czy policja i sąd miały prawo zatrzymać i skonfiskować pojazd, skoro Marek nie spowodował żadnego zagrożenia ani kolizji?',
          courtResolution: 'Policja dokonała tymczasowego zajęcia pojazdu, a prokurator wydał postanowienie o zabezpieczeniu majątkowym. Sąd skazał Marka z art. 178a § 1 k.k. i orzekł obligatoryjny przepadek pojazdu (art. 44b § 1 k.k.), 3 lata zakazu prowadzenia i 5000 zł świadczenia.',
          practicalTakeaway: 'Przekroczenie progu 1,5 promila uruchamia automatyczną procedurę konfiskaty, niezależnie od tego, jak spokojnie kierowca jechał.',
          relatedArticles: [
            { code: 'Art. 178a § 1 k.k.', label: 'Prowadzenie pod wpływem alkoholu', articleId: 'art-178a' },
            { code: 'Art. 44b k.k.', label: 'Przepadek pojazdu mechanicznego' },
          ],
          relatedRulingSignatures: ['IV KK 312/23', 'III KK 98/24'],
          calculatorScenarioQuery: 'jazda samochodem 1.6 promila konfiskata auta',
        },
        {
          id: 'cs-alkohol-2',
          title: 'Pracownik handlowy w aucie służbowym (1.7 promila)',
          scenario: 'Krzysztof, przedstawiciel handlowy, wracał autem firmowym (własność spółki z o.o.) mając 1,7 promila. Auto warte było 120 000 zł. Czy spółka straciła pojazd?',
          legalDilemma: 'Czy sąd może skonfiskować samochód należący do niewinnego pracodawcy?',
          courtResolution: 'Nie. Przepisy chronią pracodawców (art. 44b § 3 k.k.). Sąd nie skonfiskował auta spółki, lecz orzekł wobec Krzysztofa nawiązkę na rzecz Funduszu Sprawiedliwości w kwocie 25 000 zł oraz zakaz prowadzenia na 4 lata.',
          practicalTakeaway: 'Dla aut firmowych ustawodawca przewidział wysoką nawiązkę finansową płaconą przez kierowcę, zamiast odbioru pojazdu niewinnej firmie.',
          relatedArticles: [
            { code: 'Art. 178a § 1 k.k.', label: 'Prowadzenie pod wpływem', articleId: 'art-178a' },
            { code: 'Art. 44b § 3 k.k.', label: 'Nawiązka przy pojeździe służbowym' },
          ],
          relatedRulingSignatures: ['II KK 410/24'],
          calculatorScenarioQuery: 'pijany kierowca w aucie firmowym pracodawcy',
        },
      ],
      linkedArticleRefs: [
        { code: 'Art. 178a k.k.', label: 'Prowadzenie w stanie nietrzeźwości', articleId: 'art-178a' },
        { code: 'Art. 44b k.k.', label: 'Konfiskata pojazdu mechanicznego' },
        { code: 'Art. 42 § 2 k.k.', label: 'Obligatoryjny zakaz prowadzenia' },
      ],
      linkedRulingSignatures: ['IV KK 312/23', 'III KK 98/24'],
      quickScenarioQuery: 'art. 178a jazda po alkoholu konfiskata',
      quiz: {
        question: 'Od jakiego stężenia alkoholu we krwi sąd ma obowiązek orzec konfiskatę samochodu sprawcy (art. 44b k.k.)?',
        options: [
          'Od 0,5 promila',
          'Od 1,0 promila (lub 0,5‰ jeśli doszło do kolizji)',
          'Od 1,5 promila (lub od 1,0‰ jeśli spowodował wypadek lub był recydywistą)',
          'Wyłącznie od 2,5 promila',
        ],
        correctIndex: 2,
        explanation: 'Zgodnie z art. 44b § 1 k.k. bezwzględny przepadek auta obowiązuje od 1,5 promila, a w przypadku recydywy lub wypadku drogowego – już od 1,0 promila.',
      },
    },

    {
      id: 'hb-kradziez-przywlaszczenie',
      title: 'Kradzież a przywłaszczenie – próg 800 zł i granice czynu',
      subtitle: 'Art. 278 k.k., Art. 284 k.k. oraz Art. 119 k.w. – Nowy próg kwotowy i „znalezione nie kradzione”',
      slug: 'kradziez-przywlaszczenie-prog-800',
      difficulty: 'podstawowy',
      category: 'Mienie i oszustwa',
      readTimeMinutes: 5,
      icon: 'storefront',
      summary: 'Od 1 października 2023 r. próg kradzieży wynosi 800 zł. Poniżej tej kwoty kradzież w sklepie to wykroczenie, powyżej – przestępstwo z wpisem do rejestru skazanych. Dowiedz się, dlaczego zatrzymanie znalezionego telefonu to przestępstwo przywłaszczenia.',
      sections: [
        {
          heading: '1. Różnica między kradzieżą a przywłaszczeniem',
          paragraphs: [
            'Kradzież (art. 278 k.k.) polega na zaborze cudzej rzeczy ruchomej w celu przywłaszczenia – czyli sprawca fizycznie zabiera rzecz z posiadania innej osoby bez jej zgody (np. wyciąga portfel z kieszeni, wynosi towar ze sklepu).',
            'Przywłaszczenie (art. 284 k.k.) zachodzi wtedy, gdy rzecz już legalnie lub przypadkowo znalazła się w rękach sprawcy (np. pożyczyłeś koledze laptopa, a on odmawia zwrotu i go sprzedał; albo znalazłeś portfel na ławce w parku i postanowiłeś zatrzymać go dla siebie).',
          ],
        },
        {
          heading: '2. Nowy próg przepołowiony – 800 zł (od października 2023 r.)',
          paragraphs: [
            'Przez lata próg oddzielający wykroczenie od przestępstwa wynosił 500 zł. Od 1 października 2023 r. kwota graniczna została podniesiona do 800 zł.',
            'Jeżeli wartość skradzionej rzeczy nie przekracza 800 zł, czyn stanowi wykroczenie z art. 119 Kodeksu Wykroczeń (grozi za to areszt, ograniczenie wolności lub grzywna do 5000 zł, brak wpisu o wyroku w KRK). Jeżeli wartość wynosi choćby 801 zł – odpowiadasz za przestępstwo z art. 278 k.k., zagrożone karą do 5 lat więzienia i trwałym wpisem do rejestru skazanych.',
          ],
        },
        {
          heading: '3. Wyjątki: Kradzież z włamaniem i kradzież szczególnie zuchwała',
          paragraphs: [
            'Pamiętaj! Próg 800 zł dotyczy wyłącznie kradzieży zwykłej. Nie ma żadnego znaczenia przy kradzieży z włamaniem (art. 279 k.k.) ani kradzieży szczególnie zuchwałej (art. 278a k.k.).',
            'Jeżeli wybijesz szybę w samochodzie i ukradniesz paczkę gum do żucia wartą 3 zł – popełniasz zbrodnię/występek kradzieży z włamaniem, za który grozi od 1 roku do 10 lat więzienia!',
          ],
        },
      ],
      keyRules: [
        'Zwykła kradzież do 800 zł to wykroczenie (art. 119 k.w.), powyżej 800 zł – przestępstwo (art. 278 k.k.).',
        'Przy kradzieży z włamaniem (np. zerwanie kłódki, wyłamanie zamka, wybicie szyby) wartość łupu nie ma znaczenia – zawsze grozi do 10 lat więzienia.',
        '„Znalezione nie kradzione” to mit. Znalezienie i zatrzymanie cudzego telefonu to przywłaszczenie (art. 284 § 3 k.k.).',
        'Masz prawny obowiązek oddać znalezioną rzecz właścicielowi lub do Biura Rzeczy Znalezionych / na Policję.',
      ],
      mythsAndFacts: [
        {
          myth: 'Jeżeli znalazłem w autobusie iPhone’a i nie było obok właściciela, mogę go legalnie sformatować i używać.',
          fact: 'Absolutnie nie! To przestępstwo przywłaszczenia rzeczy znalezionej (art. 284 § 3 k.k.). Nowoczesne telefony logują się do sieci po numerze IMEI i policja bez trudu namierza nowego użytkownika.',
        },
        {
          myth: 'Ukradłem w markecie towar za 790 zł, więc policja nie może mnie zatrzymać.',
          fact: 'Nieprawda. Policja może zatrzymać sprawcę wykroczenia na gorącym uczynku. Sprawa trafia do sądu rejonowego w postępowaniu przyspieszonym.',
        },
      ],
      caseStudies: [
        {
          id: 'cs-kradziez-1',
          title: 'Znaleziony smartfon na ławce w galerii handlowej',
          scenario: 'Kamil (21 lat) zauważył na ławce w centrum handlowym telefon Samsung Galaxy S23 warty 3200 zł. Zamiast oddać go ochronie galerii, wyłączył go, wyjął kartę SIM i włożył własną. Po 2 tygodniach do jego drzwi zapukała Policja, która namierzyła aparat po numerze IMEI.',
          legalDilemma: 'Czy Kamil ukradł telefon, skoro nikomu go nie wyrwał, a telefon po prostu leżał bez opieki?',
          courtResolution: 'Sąd uznał Kamila za winnego przestępstwa przywłaszczenia rzeczy znalezionej (art. 284 § 3 k.k.). Ponieważ Kamil przeprosił właściciela i oddał nieuszkodzony telefon, sąd warunkowo umorzył postępowanie na 1 rok próby z nakazem wpłaty 1000 zł.',
          practicalTakeaway: 'Zatrzymanie zgubionej rzeczy to przywłaszczenie. Oddanie do Biura Rzeczy Znalezionych chroni przed odpowiedzialnością karną i uprawnia do 10% znaleźnego!',
          relatedArticles: [
            { code: 'Art. 284 § 3 k.k.', label: 'Przywłaszczenie rzeczy znalezionej', articleId: 'art-284' },
            { code: 'Art. 66 k.k.', label: 'Warunkowe umorzenie', articleId: 'art-66' },
          ],
          relatedRulingSignatures: ['V KK 118/22'],
          calculatorScenarioQuery: 'znalezienie telefonu w galerii i zatrzymanie dla siebie art 284',
        },
      ],
      linkedArticleRefs: [
        { code: 'Art. 278 k.k.', label: 'Kradzież mienia', articleId: 'art-278' },
        { code: 'Art. 284 k.k.', label: 'Przywłaszczenie', articleId: 'art-284' },
        { code: 'Art. 66 k.k.', label: 'Warunkowe umorzenie postępowania', articleId: 'art-66' },
      ],
      linkedRulingSignatures: ['V KK 118/22', 'I KZP 4/23'],
      quickScenarioQuery: 'kradzież w sklepie próg 800 zł',
      quiz: {
        question: 'Jaka kwota wartości mienia oddziela obecnie wykroczenie kradzieży od przestępstwa z Kodeksu Karnego?',
        options: ['500 zł', '800 zł', '1000 zł', '1200 zł'],
        correctIndex: 1,
        explanation: 'Od 1 października 2023 r. kwota graniczna wynosi 800 zł. Kradzież do 800 zł to wykroczenie (art. 119 k.w.), a powyżej 800 zł – przestępstwo (art. 278 k.k.).',
      },
    },

    {
      id: 'hb-oszustwa-blik',
      title: 'Oszustwa internetowe, phishing i wyłudzenia na BLIK',
      subtitle: 'Art. 286 k.k., Art. 287 k.k. – Brak progu kwotowego, spoofing i odpowiedzialność „słupów” bankowych',
      slug: 'oszustwa-internetowe-blik-phishing',
      difficulty: 'średniozaawansowany',
      category: 'Mienie i oszustwa',
      readTimeMinutes: 7,
      icon: 'lock_reset',
      summary: 'W oszustwie internetowym nie ma pojęcia wykroczenia. Wyłudzenie nawet 20 zł kodem BLIK na OLX lub Vinted to przestępstwo zagrożone karą do 8 lat więzienia. Zobacz, jak działają oszuści i czym grozi udostępnienie konta jako „muł finansowy”.',
      sections: [
        {
          heading: '1. Artykuł 286 k.k. – Oszustwo klasyczne i komputerowe',
          paragraphs: [
            'Zgodnie z art. 286 § 1 k.k., kto w celu osiągnięcia korzyści majątkowej doprowadza inną osobę do niekorzystnego rozporządzenia mieniem za pomocą wprowadzenia jej w błąd (albo wyzyskania błędu), podlega karze od 6 miesięcy do 8 lat pozbawienia wolności.',
            'Kluczowa zasada: w przestępstwie oszustwa NIE MA PROGU 800 zł! Każde celowe oszukanie kupującego na Allegro, Vinted czy Marketplace na kwotę 30 zł jest przestępstwem kryminalnym z urzędu.',
          ],
        },
        {
          heading: '2. Wyłudzenie kodu BLIK i przejęcie konta społecznościowego',
          paragraphs: [
            'Typowy scenariusz: cyberprzestępca przejmuje konto na Messengerze lub Instagramie, po czym pisze do znajomych ofiary: „Cześć, stoję przy kasie i brakuje mi na leki/paliwo, podasz kod BLIK? Zaraz oddam przelewem”.',
            'Wypłata środków kodem BLIK z bankomatu to przestępstwo oszustwa połączone z przełamaniem zabezpieczeń (art. 286 § 1 k.k. w zb. z art. 267 k.k.). Sądy wymierzają za ten proceder surowe bezwzględne kary pozbawienia wolności.',
          ],
        },
        {
          heading: '3. Pułapka „pracy zdalnej” i status muła finansowego (art. 299 k.k.)',
          paragraphs: [
            'Młodzi ludzie często dają się skusić ogłoszeniom o rzekomej pracy „asystenta transferów kryptowalut” lub „testera płatności”. Zadanie polega na przyjęciu przelewu na własne konto bankowe i natychmiastowej wypłacie gotówki lub zakupie Bitcoinów w bankomacie.',
            'W rzeczywistości na to konto trafiają pieniądze skradzione ofiarom oszustw. Osoba udostępniająca konto zostaje oskarżona o pomocnictwo w oszustwie oraz pranie brudnych pieniędzy (art. 299 k.k. – do 8 lat więzienia), a banki wpisują ją na czarną listę z blokadą rachunków.',
          ],
        },
      ],
      keyRules: [
        'W oszustwie (art. 286 k.k.) nie ma progu minimalnego – nawet 10 zł wyłudzone na OLX to przestępstwo ścigane z urzędu.',
        'Nigdy nie podawaj kodu BLIK na czacie bez wcześniejszego zadzwonienia do znajomego i potwierdzenia głosem.',
        'Nigdy nie udostępniaj swojego konta bankowego osobom trzecim pod pozorem „pracy” – zostaniesz pociągnięty do odpowiedzialności za pranie brudnych pieniędzy.',
      ],
      mythsAndFacts: [
        {
          myth: 'Jeżeli oszukałem kogoś na Vinted tylko na 150 zł, to grozi mi co najwyżej mandat.',
          fact: 'Absolutna bzdura! Oszustwo nie jest wykroczeniem. Każde wprowadzenie w błąd dla zysku to art. 286 k.k. (od 6 miesięcy do 8 lat więzienia).',
        },
      ],
      caseStudies: [
        {
          id: 'cs-oszustwo-1',
          title: 'Wyłudzenie kodu BLIK na kwotę 500 zł',
          scenario: 'Hubert (20 lat) wypłacił z bankomatu 500 zł kodem BLIK, który otrzymał na Telegramie od anonimowego zleceniodawcy, zatrzymując 50 zł prowizji. Pieniądze pochodziły od kobiety oszukanej na Messengerze metodą „na córkę”.',
          legalDilemma: 'Czy Hubert odpowiada za oszustwo, skoro nie on pisał fałszywe wiadomości do poszkodowanej?',
          courtResolution: 'Sąd skazał Huberta za pomocnictwo w oszustwie (art. 18 § 3 k.k. w zw. z art. 286 § 1 k.k.). Nakazano mu naprawienie szkody (zwrot 500 zł) oraz wymierzono karę 6 miesięcy ograniczenia wolności (prace społeczne).',
          practicalTakeaway: 'Wypłacanie cudzych kodów BLIK za prowizję jest bezpośrednim udziałem w łańcuchu cyberprzestępstwa.',
          relatedArticles: [
            { code: 'Art. 286 § 1 k.k.', label: 'Oszustwo', articleId: 'art-286' },
            { code: 'Art. 18 § 3 k.k.', label: 'Pomocnictwo w przestępstwie' },
          ],
          relatedRulingSignatures: ['III KK 219/22'],
          calculatorScenarioQuery: 'wyłudzenie kodu blik oszustwo na olx art 286',
        },
      ],
      linkedArticleRefs: [
        { code: 'Art. 286 k.k.', label: 'Oszustwo majątkowe', articleId: 'art-286' },
        { code: 'Art. 287 k.k.', label: 'Oszustwo komputerowe' },
      ],
      linkedRulingSignatures: ['III KK 219/22', 'V KK 350/23'],
      quickScenarioQuery: 'art. 286 wyłudzenie blik oszustwo internetowe',
    },

    {
      id: 'hb-cisza-nocna-sasiedzi',
      title: 'Cisza nocna, hałas i nękanie sąsiedzkie',
      subtitle: 'Art. 51 k.w., Art. 190a k.k. oraz Art. 191 § 1a k.k. – Spoczynek nocny, mandaty i stalking lokatorski',
      slug: 'cisza-nocna-halas-stalking-sasiedzki',
      difficulty: 'podstawowy',
      category: 'Część ogólna',
      readTimeMinutes: 5,
      icon: 'volume_off',
      summary: 'Choć pojęcie „ciszy nocnej” formalnie nie występuje w ustawie, Kodeks Wykroczeń chroni „spoczynek nocny” (22:00–6:00). Gdy głośne zachowania stają się złośliwym nękaniem, sprawa przekształca się w przestępstwo zagrożone więzieniem.',
      sections: [
        {
          heading: '1. Zakłócenie spoczynku nocnego (art. 51 k.w.)',
          paragraphs: [
            'Art. 51 § 1 Kodeksu Wykroczeń penalizuje zakłócanie spokoju, porządku publicznego lub spoczynku nocnego krzykiem, hałasem, alarmem lub innym wybrykiem. Nie ma wymogu mierzenia decybeli – liczy się subiektywna i obiektywna uciążliwość dla otoczenia.',
            'Za incydentalną głośną imprezę lub wiercenie po 22:00 grozi mandat od 100 do 500 zł, a w sądzie grzywna do 5000 zł lub areszt.',
          ],
        },
        {
          heading: '2. Kiedy hałas staje się przestępstwem z Kodeksu Karnego?',
          paragraphs: [
            'Jeżeli sąsiad celowo, złośliwie i systematycznie puszcza głośne dudnienie, stuka w rury czy nęka innych mieszkańców, czyn przekracza ramy wykroczenia i kwalifikuje się pod Kodeks Karny.',
            'Art. 191 § 1a k.k. przewiduje karę do 3 lat więzienia za stosowanie przemocy innego rodzaju w sposób istotnie utrudniający korzystanie z lokalu mieszkalnego (tzw. stalking mieszkaniowy). Ponadto może wchodzić w grę art. 190a k.k. (uporczywe nękanie – do 8 lat więzienia).',
          ],
        },
      ],
      keyRules: [
        'Spoczynek nocny trwa zwyczajowo w godz. 22:00–06:00.',
        'Spokój publiczny można zakłócić również w ciągu dnia (np. bezustanna głośna muzyka zakłócająca pracę zdalną sąsiadów).',
        'Złośliwe, celowe generowanie hałasów przeciwko sąsiadowi to przestępstwo z art. 191 § 1a k.k. (do 3 lat więzienia).',
      ],
      mythsAndFacts: [
        {
          myth: 'Do godziny 22:00 mogę w mieszkaniu puszczać muzykę na pełny regulator i policja nic nie może zrobić.',
          fact: 'Nieprawda! Art. 51 k.w. chroni „spokój publiczny” przez całą dobę. Odtwarzanie ogłuszającej muzyki w południe również jest wykroczeniem wybryku.',
        },
      ],
      caseStudies: [
        {
          id: 'cs-halas-1',
          title: 'Złośliwe puszczanie infradźwięków i uderzanie w podłogę',
          scenario: 'Sąsiad z góry przez 6 miesięcy codziennie w nocy i nad ranem puszczał subwoofrem niskie częstotliwości i rzucał ciężkimi przedmiotami w podłogę, aby zmusić lokatorów z dołu do wyprowadzki. Lokatorzy zgromadzili nagrania i dziennik interwencji.',
          legalDilemma: 'Czy sprawca mógł odpowiadać za przestępstwo, skoro nie dotknął sąsiadów fizycznie?',
          courtResolution: 'Sąd skazał sąsiada na podstawie art. 191 § 1a k.k. na 10 miesięcy ograniczenia wolności, zakaz zbliżania się oraz 8000 zł nawiązki dla poszkodowanych za utrudnianie korzystania z mieszkania.',
          practicalTakeaway: 'Dziennik zdarzeń, nagrania audio/wideo i notatki z interwencji policji są kluczowym materiałem dowodowym przeciwko uciążliwemu sąsiadowi.',
          relatedArticles: [
            { code: 'Art. 191 § 1a k.k.', label: 'Utrudnianie korzystania z lokalu', articleId: 'art-191-kk' },
            { code: 'Art. 51 k.w.', label: 'Zakłócenie spoczynku nocnego', articleId: 'art-51-kw' },
          ],
          relatedRulingSignatures: ['II KK 85/21'],
          calculatorScenarioQuery: 'art. 191 utrudnianie korzystania z lokalu hałas sąsiad',
        },
      ],
      linkedArticleRefs: [
        { code: 'Art. 51 k.w.', label: 'Zakłócenie spoczynku nocnego', articleId: 'art-51-kw' },
        { code: 'Art. 191 § 1a k.k.', label: 'Stalking mieszkaniowy', articleId: 'art-191-kk' },
        { code: 'Art. 190a k.k.', label: 'Uporczywe nękanie (stalking)', articleId: 'art-190a' },
      ],
      linkedRulingSignatures: ['II KK 85/21', 'IV KK 205/23'],
      quickScenarioQuery: 'zakłócanie ciszy nocnej sąsiad 51 kw',
    },

    {
      id: 'hb-bojka-pobicie',
      title: 'Bójka a pobicie – odpowiedzialność zbiorowa',
      subtitle: 'Art. 158 k.k., Art. 159 k.k. – Różnica między starciem a napaścią oraz zasada „odpowiada każdy uczestnik”',
      slug: 'bojka-a-pobicie-odpowiedzialnosc-zbiorowa',
      difficulty: 'zaawansowany',
      category: 'Życie i zdrowie',
      readTimeMinutes: 6,
      icon: 'sports_mma',
      summary: 'Dlaczego w polskim prawie odpowiadasz za udział w bójce, nawet jeśli nie zadałeś żadnego ciosu? Poznaj specyfikę art. 158 k.k. i dowiedz się, czym różni się bójka od pobicia.',
      sections: [
        {
          heading: '1. Bójka a pobicie – fundamentalna różnica',
          paragraphs: [
            'W języku potocznym te słowa są używane zamiennie, ale w Kodeksie Karnym to zupełnie inne zjawiska.',
            'Bójka (starcie dwustronne): co najmniej trzy osoby biorą udział w starciu, w którym każda strona atakuje i każda się broni. Nie ma wyraźnego podziału na wyłącznie napastników i wyłącznie ofiary.',
            'Pobicie (napaść jednostronna): co najmniej dwie osoby bezprawnie atakują jedną (lub kilka) osób, które wyłącznie się bronią lub są bezbronne. Jest wyraźna przewaga napastników.',
          ],
        },
        {
          heading: '2. Zagrożenie i odpowiedzialność za sam udział',
          paragraphs: [
            'Art. 158 § 1 k.k. stanowi: „Kto bierze udział w bójce lub pobiciu, w którym naraża się człowieka na bezpośrednie niebezpieczeństwo utraty życia albo nastąpienia ciężkiego uszczerbku na zdrowiu, podlega karze pozbawienia wolności do lat 3”.',
            'Jeżeli następstwem bójki jest ciężki uszczerbek na zdrowiu – kara wynosi od 1 roku do 10 lat więzienia (§ 2). Jeżeli następstwem jest śmierć człowieka – od 2 do 15 lat więzienia (§ 3).',
            'Co szokuje wielu: prokuratura NIE MUSI udowadniać, czyj konkretnie cios spowodował śmierć lub złamanie! Każdy uczestnik bójki odpowiada za ten cięższy skutek, o ile mógł go przewidzieć.',
          ],
        },
      ],
      keyRules: [
        'Bójka wymaga udziału min. 3 osób o zmiennym statusie atakujący/broniący.',
        'Pobicie wymaga min. 2 napastników na 1 ofiarę.',
        'Odpowiadasz za sam udział w bójce, nawet jeśli tylko stałeś obok i dopingowałeś kolegów lub trzymałeś ofiarę.',
        'Użycie niebezpiecznego narzędzia (nóż, kastet, maczeta) zaostrza karę (art. 159 k.k. – od 6 miesięcy do 8 lat więzienia).',
      ],
      mythsAndFacts: [
        {
          myth: 'Skoro nie uderzyłem nikogo, a tylko stałem i blokowałem przejście, to jestem niewinny.',
          fact: 'Nieprawda! Zgodnie z orzecznictwem SN udziałem w pobiciu jest każda forma fizycznego lub psychicznego wsparcia napastników (blokowanie ucieczki, przytrzymywanie, podżeganie).',
        },
      ],
      caseStudies: [
        {
          id: 'cs-bojka-1',
          title: 'Szarpanina pod dyskoteką i odpowiedzialność trzech kolegów',
          scenario: 'Pod klubem muzycznym trzech mężczyzn zaatakowało jednego chłopaka. Pierwszy przewrócił go na ziemię, drugi kopnął w tułów, a trzeci stał nad nim i odpychał świadków, którzy chcieli pomóc. Pokrzywdzony doznał złamania żeber i wstrząśnienia mózgu.',
          legalDilemma: 'Czy trzeci mężczyzna, który nikogo bezpośrednio nie uderzył, może odpowiadać za pobicie?',
          courtResolution: 'Sąd uznał wszystkich trzech za winnych przestępstwa pobicia (art. 158 § 1 k.k.). Trzeci sprawca swoim zachowaniem uniemożliwił ofierze obronę i ucieczkę, co stanowiło bezpośredni udział w pobiciu.',
          practicalTakeaway: 'Obecność w grupie napastników i asystowanie przy ataku jest traktowane przez sądy na równi z zadawaniem ciosów.',
          relatedArticles: [
            { code: 'Art. 158 § 1 k.k.', label: 'Pobicie', articleId: 'art-158' },
            { code: 'Art. 157 § 1 k.k.', label: 'Średni uszczerbek na zdrowiu' },
          ],
          relatedRulingSignatures: ['I KZP 12/21', 'II KK 380/23'],
          calculatorScenarioQuery: 'udział w pobiciu trzech na jednego art 158',
        },
      ],
      linkedArticleRefs: [
        { code: 'Art. 158 k.k.', label: 'Udział w bójce lub pobiciu', articleId: 'art-158' },
        { code: 'Art. 159 k.k.', label: 'Użycie niebezpiecznego narzędzia w bójce' },
      ],
      linkedRulingSignatures: ['I KZP 12/21', 'II KK 380/23'],
      quickScenarioQuery: 'art. 158 bójka lub pobicie odpowiedzialność',
    },

    {
      id: 'hb-warunkowe-umorzenie',
      title: 'Warunkowe umorzenie postępowania – jak zachować czysty KRK',
      subtitle: 'Art. 66 k.k., Art. 67 k.k. – Ratunek dla niekaranych, okres próby i brak wpisu o skazaniu',
      slug: 'warunkowe-umorzenie-postepowania-krk',
      difficulty: 'średniozaawansowany',
      category: 'Procedura i zatrzymanie',
      readTimeMinutes: 6,
      icon: 'verified_user',
      summary: 'Popełniłeś błąd po raz pierwszy w życiu i grozi Ci wyrok? Warunkowe umorzenie to najcenniejsza instytucja prawa karnego – sąd uznaje Twoją winę, ale nie wydaje wyroku skazującego, dzięki czemu Twoja kartoteka w KRK pozostaje czysta.',
      sections: [
        {
          heading: '1. Czym jest warunkowe umorzenie postępowania?',
          paragraphs: [
            'Warunkowe umorzenie (art. 66 k.k.) to rezygnacja ze skazania i wymierzenia kary sprawcy, którego wina i społeczna szkodliwość czynu nie są znaczne, a okoliczności popełnienia czynu nie budzą wątpliwości.',
            'Sprawa zostaje umorzona na okres próby od 1 roku do 3 lat. Jeżeli w tym czasie nie popełnisz nowego przestępstwa, postępowanie jest ostatecznie zakończone, a Ty formalnie i prawnie pozostajesz osobą NIEKARANĄ za przestępstwo!',
          ],
        },
        {
          heading: '2. Jakie warunki musisz spełnić?',
          paragraphs: [
            '1. Czyn musi być zagrożony karą nieprzekraczającą 5 lat pozbawienia wolności (np. art. 178a § 1 k.k., art. 278 § 1 k.k., posiadanie małej ilości narkotyków).',
            '2. Sprawca nie był wcześniej karany za przestępstwo umyślne.',
            '3. Wina i społeczna szkodliwość czynu nie są znaczne.',
            '4. Postawa sprawcy, jego warunki osobiste i dotychczasowe życie dają gwarancję przestrzegania prawa.',
          ],
        },
        {
          heading: '3. Koszty i obowiązki probacyjne',
          paragraphs: [
            'Sąd warunkowo umarzając postępowanie niemal zawsze nakłada obowiązki (art. 67 § 3 k.k.): naprawienie szkody (np. oddanie pieniędzy pokrzywdzonemu), przeproszenie pokrzywdzonego oraz świadczenie pieniężne na Fundusz Sprawiedliwości (najczęściej od 1000 do 5000 zł).',
          ],
        },
      ],
      keyRules: [
        'Warunkowe umorzenie NIE JEST wyrokiem skazującym – zachowujesz czyste zaświadczenie o niekaralności z KRK.',
        'Możliwe tylko przy przestępstwach zagrożonych karą do 5 lat więzienia.',
        'Okres próby wynosi od 1 do 3 lat.',
        'Konieczne jest pojednanie się z pokrzywdzonym lub naprawienie wyrządzonej szkody.',
      ],
      mythsAndFacts: [
        {
          myth: 'Warunkowe umorzenie oznacza, że w papierach z sądu będę miał status osoby skazanej.',
          fact: 'Nie! W punkcie informacyjnym KRK otrzymujesz zaświadczenie: „NIE FIGURUJE W KARTOTECE KARNEJ”. Możesz pracować w zawodach wymagających niekaralności.',
        },
      ],
      caseStudies: [
        {
          id: 'cs-umorzenie-1',
          title: 'Młody programista zatrzymany z 0,7 promila na skuterze',
          scenario: 'Piotr (26 lat), student i programista, wracał nocą skuterem elektrycznym mając 0,65 promila. Został oskarżony z art. 178a § 1 k.k. Wyrok skazujący oznaczałby utratę kontraktu B2B z zagranicznym bankiem.',
          legalDilemma: 'Czy osoba, która popełniła przestępstwo prowadzenia pojazdu w stanie nietrzeźwości, może ubiegać się o warunkowe umorzenie?',
          courtResolution: 'Obrońca złożył wniosek o warunkowe umorzenie, wskazując na nieposzlakowaną opinię, wolontariat i incydentalny charakter czynu. Sąd warunkowo umorzył sprawę na 2 lata próby, skracając zakaz prowadzenia do 1 roku i orzekając 3000 zł świadczenia. Piotr zachował czyste konto w KRK.',
          practicalTakeaway: 'Aktywność obrońcy i zgromadzenie dokumentów potwierdzających dotychczasowy nienaganny tryb życia może uratować karierę zawodową.',
          relatedArticles: [
            { code: 'Art. 66 k.k.', label: 'Warunkowe umorzenie', articleId: 'art-66' },
            { code: 'Art. 178a § 1 k.k.', label: 'Prowadzenie w stanie nietrzeźwości', articleId: 'art-178a' },
          ],
          relatedRulingSignatures: ['III KK 15/22'],
          calculatorScenarioQuery: 'art. 66 warunkowe umorzenie pierwszy raz czysta kartoteka',
        },
      ],
      linkedArticleRefs: [
        { code: 'Art. 66 k.k.', label: 'Przesłanki warunkowego umorzenia', articleId: 'art-66' },
        { code: 'Art. 67 k.k.', label: 'Okres próby i obowiązki naprawienia szkody' },
      ],
      linkedRulingSignatures: ['III KK 15/22', 'II KK 401/23'],
      quickScenarioQuery: 'art. 66 warunkowe umorzenie postępowania',
    },

    {
      id: 'hb-zatrzymanie-policja',
      title: 'Zatrzymanie przez Policję – prawa obywatela krok po kroku',
      subtitle: 'Art. 244 k.p.k., Art. 245 k.p.k. – Prawo do milczenia, kontakt z adwokatem, reguła 48h i zażalenie',
      slug: 'zatrzymanie-przez-policje-prawa-obywatela',
      difficulty: 'podstawowy',
      category: 'Procedura i zatrzymanie',
      readTimeMinutes: 7,
      icon: 'badge',
      summary: 'Co zrobić, gdy zostajesz zatrzymany przez Policję? Jakie masz niezbywalne prawa, ile maksymalnie możesz spędzić na dołku i dlaczego skorzystanie z prawa do milczenia to Twoja najlepsza tarcza procesowa.',
      sections: [
        {
          heading: '1. Podstawa zatrzymania i natychmiastowe pouczenie',
          paragraphs: [
            'Policja ma prawo zatrzymać osobę podejrzaną, jeśli istnieje uzasadnione przypuszczenie, że popełniła ona przestępstwo, a zachodzi obawa ucieczki, ukrycia się lub zatarcia śladów (art. 244 § 1 k.p.k.).',
            'Funkcjonariusz ma bezwzględny obowiązek natychmiast podać przyczynę zatrzymania oraz pouczyć Cię o przysługujących prawach (w tym prawie do milczenia i obrońcy).',
          ],
        },
        {
          heading: '2. Trzy najważniejsze prawa zatrzymanego',
          paragraphs: [
            '1. Prawo do milczenia (art. 175 k.p.k. w zw. z art. 74 k.p.k.): Nie masz obowiązku odpowiadać na żadne pytania dotyczące okoliczności czynu. Możesz oświadczyć: „Odmawiam składania wyjaśnień i odpowiedzi na pytania do czasu kontaktu z moim adwokatem”. Skorzystanie z tego prawa nie może być traktowane jako dowód winy!',
            '2. Prawo do kontaktu z adwokatem / radcą prawnym (art. 245 k.p.k.): Masz prawo zażądać niezwłocznego umożliwienia kontaktu z adwokatem lub zawiadomienia go przez policję oraz bezpośredniej rozmowy w cztery oczy.',
            '3. Prawo do powiadomienia osoby najbliższej: Na Twoje żądanie policja musi natychmiast zawiadomić rodzinę lub wskazaną osobę o Twoim zatrzymaniu i miejscu pobytu.',
          ],
        },
        {
          heading: '3. Zegar tyka: Zasada 48 + 24 godziny',
          paragraphs: [
            'Policja może zatrzymać Cię na maksymalnie 48 godzin od momentu faktycznego pozbawienia wolności (np. zatrzymania na ulicy). W tym czasie prokurator musi albo Cię wypuścić, albo przekazać do dyspozycji sądu z wnioskiem o tymczasowe aresztowanie.',
            'Sąd ma kolejne 24 godziny na przesłuchanie i wydanie postanowienia o areszcie. Jeżeli w ciągu łącznie 72 godzin nie doręczono Ci postanowienia o tymczasowym aresztowaniu – musisz zostać natychmiast zwolniony!',
          ],
        },
        {
          heading: '4. Zażalenie na zatrzymanie (art. 246 k.p.k.)',
          paragraphs: [
            'W terminie 7 dni od zwolnienia masz prawo złożyć zażalenie do Sądu Rejonowego na zasadność, legalność oraz prawidłowość zatrzymania. W razie stwierdzenia bezzasadnego zatrzymania przysługuje Ci odszkodowanie i zadośćuczynienie od Skarbu Państwa.',
          ],
        },
      ],
      keyRules: [
        'Zawsze żądaj sporządzenia protokołu zatrzymania i wpisania do niego dokładnej godziny ujęcia.',
        'Skorzystaj z prawa do odmowy składania wyjaśnień do momentu przyjazdu adwokata.',
        'Masz prawo do kontaktu z adwokatem i powiadomienia rodziny.',
        'Maksymalny czas w dyspozycji policji i prokuratora to 48 godzin.',
        'Nigdy nie podpisuj protokołu bez uprzedniego dokładnego przeczytania każdego słowa.',
      ],
      mythsAndFacts: [
        {
          myth: 'Jeśli odmówię zeznań na policji, to prokurator uzna, że jestem na pewno winny i wsadzi mnie do aresztu.',
          fact: 'Bzdura! Odmowa składania wyjaśnień to konstytucyjne prawo każdego obywatela. Wypowiedzi złożone w stresie bez adwokata są najczęstszą przyczyną późniejszych problemów w sądzie.',
        },
        {
          myth: 'Policjant może mnie przetrzymywać na dołku tak długo, jak uważa za stosowne.',
          fact: 'Fałsz. Po 48 godzinach bez wniosku do sądu musisz wyjść na wolność.',
        },
      ],
      caseStudies: [
        {
          id: 'cs-zatrzymanie-1',
          title: 'Skuteczne skorzystanie z prawa do milczenia i brak aresztu',
          scenario: 'Tomasz został zatrzymany w sprawie domniemanego udziału w wyłudzeniu kredytu. Na komendzie policjanci naciskali: „Jak się przyznasz teraz, to pójdziesz do domu”. Tomasz oświadczył spokojnie: „Skorzystam z prawa do milczenia i żądam kontaktu z obrońcą”.',
          legalDilemma: 'Czy odmowa odpowiedzi na pytania śledczych uniemożliwiła obronę?',
          courtResolution: 'Przybyli adwokat zapoznał się z materiałami dowodowymi. Okazało się, że dowody prokuratury były znikome (oparte na pomówieniu). Sąd odrzucił wniosek o tymczasowe aresztowanie i Tomasz wyszedł na wolność za poręczeniem majątkowym.',
          practicalTakeaway: 'Nie daj się skusić obietnicom szybkiego wyjścia za przyznanie się do winy na komendzie bez obecności obrońcy.',
          relatedArticles: [
            { code: 'Art. 244 k.p.k.', label: 'Zatrzymanie przez Policję' },
            { code: 'Art. 245 k.p.k.', label: 'Prawo do kontaktu z adwokatem' },
          ],
          relatedRulingSignatures: ['II KK 175/21', 'I KZP 8/22'],
          calculatorScenarioQuery: 'prawa zatrzymanego policja 48 godzin art 244 kpk',
        },
      ],
      linkedArticleRefs: [
        { code: 'Art. 244 k.p.k.', label: 'Przesłanki zatrzymania obywatela' },
        { code: 'Art. 245 k.p.k.', label: 'Kontakt z adwokatem' },
        { code: 'Art. 246 k.p.k.', label: 'Zażalenie do sądu na zatrzymanie' },
      ],
      linkedRulingSignatures: ['II KK 175/21', 'I KZP 8/22'],
      quickScenarioQuery: 'zatrzymanie przez policję prawa 48 godzin',
    },
    {
      id: 'hb-narkotyki-uopn',
      title: 'Posiadanie narkotyków i umorzenie z art. 62a UoPN',
      subtitle: 'Niewielka ilość na własny użytek, definicja „znacznej ilości” i jak uniknąć wpisu do KRK',
      slug: 'narkotyki-art-62-62a-uopn',
      difficulty: 'podstawowy',
      category: 'Procedura i zatrzymanie',
      readTimeMinutes: 6,
      icon: 'medication',
      summary: 'W Polsce każde posiadanie narkotyków jest przestępstwem, ale art. 62a UoPN daje realną szansę na całkowite umorzenie sprawy bez kary i bez wpisu do Krajowego Rejestru Karnego. Poznaj kryteria i linię obrony.',
      sections: [
        {
          heading: '1. Każda ilość jest nielegalna, ale liczy się przeznaczenie',
          paragraphs: [
            'W polskim porządku prawnym nie obowiązuje pojęcie „dozwolonej ilości rekreacyjnej”. Posiadanie nawet 0.5 grama marihuany formalnie wypełnia znamiona przestępstwa z art. 62 ust. 1 UoPN, za co grozi do 3 lat więzienia.',
            'Ustawodawca wprowadził jednak kluczowy wentyl bezpieczeństwa: art. 62a UoPN, który pozwala prokuratorowi lub sądowi umorzyć postępowanie jeszcze przed wszczęciem dochodzenia lub na jego wczesnym etapie.',
          ],
        },
        {
          heading: '2. Warunki umorzenia na podstawie art. 62a UoPN',
          paragraphs: [
            'Aby sprawa została umorzona z art. 62a UoPN, muszą zostać spełnione łącznie trzy warunki: 1) ilość środka musi być nieznaczna (zazwyczaj od ułamka grama do kilku gramów suszu), 2) narkotyk musi być przeznaczony wyłącznie na własny użytek sprawcy (brak wagi dilerskiej, woreczków strunowych, gotówki w drobnych nominałach), 3) orzeczenie kary byłoby niecelowe ze względu na stopień społecznej szkodliwości.',
          ],
        },
        {
          heading: '3. Co oznacza „znaczna ilość” (art. 62 ust. 2 i art. 56 ust. 3)?',
          paragraphs: [
            'Zgodnie z ugruntowaną linią Sądu Najwyższego (m.in. I KZP 24/18) znaczna ilość to taka, która pozwala na jednorazowe odurzenie co najmniej kilkudziesięciu osób (w praktyce orzeczniczej od kilkudziesięciu do kilkuset porcji handlowych). Przy znacznej ilości dolna granica kary to aż 1 rok więzienia, a przy handlu – zbrodnia od 2 do 15 lat.',
          ],
        },
      ],
      keyRules: [
        'Złóż wniosek o umorzenie z art. 62a UoPN już podczas pierwszego przesłuchania na policji.',
        'Wykazuj, że substancja służyła wyłącznie do użytku własnego (brak cech dystrybucji).',
        'Umorzenie z art. 62a UoPN oznacza brak skazania i czystą kartotekę w KRK.',
        'Przy większych ilościach żądaj zbadania czystego stężenia substancji aktywnej (THC).',
      ],
      mythsAndFacts: [
        {
          myth: 'Do 5 gramów marihuany jest w Polsce w 100% legalne i policja nic nie może zrobić.',
          fact: 'Fałsz! W Polsce nie ma progu legalnego posiadania. Za 0.1 grama zostaniesz zatrzymany. Jedyną drogą jest art. 62a UoPN.',
        },
        {
          myth: 'Umorzenie z art. 62a UoPN oznacza wpis do Krajowego Rejestru Karnego jako przestępca.',
          fact: 'Nieprawda. Umorzenie to brak wyroku skazującego – zachowujesz w 100% status osoby niekaranej.',
        },
      ],
      caseStudies: [
        {
          id: 'cs-uopn-1',
          title: 'Zatrzymanie z 2 gramami suszu podczas kontroli drogowej',
          scenario: 'Kamil (22 lata, student, dotąd niekarany) został zatrzymany w trakcie rutynowej kontroli. W schowku miał 1.8g marihuany. Policja zabezpieczyła telefon i przeszukała mieszkanie, gdzie nie znaleziono żadnych innych narkotyków ani wag.',
          legalDilemma: 'Czy Kamil trafi do więzienia i czy jego nazwisko pojawi się w KRK?',
          courtResolution: 'Obrońca złożył wniosek o umorzenie z art. 62a UoPN. Prokurator po weryfikacji niekaralności i braku cech handlu umorzył śledztwo. Zabezpieczony susz uległ przepadkowi, a Kamil ma czyste konto w KRK.',
          practicalTakeaway: 'Szybkie wykazanie niekaralności i jednorazowego charakteru posiadania otwiera prostą drogę do art. 62a UoPN.',
          relatedArticles: [
            { code: 'Art. 62 UoPN', label: 'Posiadanie narkotyków' },
            { code: 'Art. 62a UoPN', label: 'Umorzenie nieznacznej ilości' },
          ],
          relatedRulingSignatures: ['I KZP 24/18'],
          calculatorScenarioQuery: 'posiadanie 2g marihuany na własny użytek art 62a uopn',
        },
      ],
      linkedArticleRefs: [
        { code: 'Art. 62 UoPN', label: 'Posiadanie narkotyków' },
        { code: 'Art. 62a UoPN', label: 'Klauzula umorzenia' },
        { code: 'Art. 56 UoPN', label: 'Obrót narkotykami' },
      ],
      linkedRulingSignatures: ['I KZP 24/18'],
      quickScenarioQuery: 'art 62 uopn marihuana własny użytek umorzenie',
    },
    {
      id: 'hb-oszustwo-286',
      title: 'Oszustwo (Art. 286 k.k.) – wyłudzenia internetowe, kredyty i BLIK',
      subtitle: 'Znamiona przestępstwa, zamiar bezpośredni i granica między niewypłacalnością a przestępstwem',
      slug: 'oszustwo-art-286-kk',
      difficulty: 'średniozaawansowany',
      category: 'Mienie i oszustwa',
      readTimeMinutes: 7,
      icon: 'receipt_long',
      summary: 'Gdzie kończy się spór cywilny o niezapłaconą fakturę, a zaczyna odpowiedzialność karna za oszustwo? Dowiedz się, czym jest zamiar bezpośredni kierunkowy (dolus directus coloratus) i jak bronić się przed zarzutem z art. 286 k.k.',
      sections: [
        {
          heading: '1. Kiedy niezapłacenie długu jest przestępstwem oszustwa?',
          paragraphs: [
            'Art. 286 § 1 k.k. penalizuje doprowadzenie innej osoby do niekorzystnego rozporządzenia mieniem za pomocą wprowadzenia w błąd, wyzyskania błędu lub niezdolności do należytego pojmowania. Grozi za to od 6 miesięcy do aż 8 lat pozbawienia wolności.',
            'Kluczowe: samo niewywiązanie się z umowy lub brak środków na zapłacenie faktury NIE jest oszustwem! Aby zaistniało przestępstwo, sprawca musiał mieć z góry powzięty zamiar niewywiązania się z płatności JUŻ W MOMENCIE zawierania umowy.',
          ],
        },
        {
          heading: '2. Nowoczesne metody: wyłudzenia na kod BLIK i fałszywe sklepy',
          paragraphs: [
            'Podszywanie się pod znajomego w komunikatorze i wyłudzanie kodu BLIK stanowi oszustwo kwalifikowane w zbiegu z art. 267 k.k. (nielegalny dostęp do systemu). Sądy powszechne traktują ten proceder jako przestępczość zorganizowaną i rzadko stosują warunkowe zawieszenie kary bez naprawienia szkody.',
          ],
        },
        {
          heading: '3. Linia obrony: wypadek mniejszej wagi (art. 286 § 3 k.k.) i naprawienie szkody',
          paragraphs: [
            'W przypadku mniejszych kwot kluczowym celem obrony jest zakwalifikowanie czynu jako wypadek mniejszej wagi z § 3, co umożliwia orzeczenie samej grzywny lub ograniczenia wolności. Z kolei całkowite naprawienie szkody (art. 46 k.k.) otwiera drogę do nadzwyczajnego złagodzenia z art. 60 k.k.',
          ],
        },
      ],
      keyRules: [
        'Brak zamiaru w chwili zawierania umowy wyklucza skazanie za oszustwo z art. 286 k.k.',
        'Spór o nienależyte wykonanie umowy to domena sądu cywilnego, a nie prokuratora.',
        'Szybkie oddanie środków pokrzywdzonemu diametralnie zmienia ocenę sądu (art. 60 k.k.).',
        'Przy kwotach powyżej 200 000 zł grozi odpowiedzialność z art. 294 § 1 k.k. (do 10 lat więzienia).',
      ],
      mythsAndFacts: [
        {
          myth: 'Każda niezapłacona w terminie faktura lub pożyczka to automatycznie przestępstwo oszustwa.',
          fact: 'Nie! Jeśli utraciłeś płynność finansową z przyczyn obiektywnych po zawarciu umowy, to sprawa cywilna, a nie karna.',
        },
        {
          myth: 'Jeśli oddam pieniądze po wszczęciu śledztwa, prokurator musi automatycznie umorzyć sprawę.',
          fact: 'Nie musi, ale naprawienie szkody daje obrońcy potężny argument za warunkowym umorzeniem (art. 66 k.k.) lub łagodną karą.',
        },
      ],
      caseStudies: [
        {
          id: 'cs-286-1',
          title: 'Niezapłacona partia towaru w firmie budowlanej a zarzut oszustwa',
          scenario: 'Przedsiębiorca Marek zamówił materiały budowlane na kwotę 45 000 zł z odroczonym terminem płatności 30 dni. Przed upływem terminu jego główny kontrahent zbankrutował, przez co Marek stracił płynność i nie uregulował faktury. Dostawca złożył zawiadomienie o popełnieniu przestępstwa z art. 286 § 1 k.k.',
          legalDilemma: 'Czy Marek dopuścił się oszustwa gospodarczego?',
          courtResolution: 'Prokuratura umorzyła śledztwo wobec braku znamion czynu zabronionego. Obrońca przedstawił wyciągi bankowe wykazujące, że w chwili zamawiania towaru firma Marka była wypłacalna i liczyła na zapłatę od kontrahenta. Brak było zamiaru bezpośredniego w chwili zawierania umowy.',
          practicalTakeaway: 'Dowody księgowe z daty transakcji są decydujące dla wykazania czystości intencji gospodarczych.',
          relatedArticles: [
            { code: 'Art. 286 § 1 k.k.', label: 'Oszustwo' },
            { code: 'Art. 286 § 3 k.k.', label: 'Wypadek mniejszej wagi' },
          ],
          relatedRulingSignatures: ['II AKa 314/23'],
          calculatorScenarioQuery: 'art 286 kk oszustwo niezapłacona faktura zamiar bezpośredni',
        },
      ],
      linkedArticleRefs: [
        { code: 'Art. 286 k.k.', label: 'Oszustwo klasyczne i gospodarcze' },
        { code: 'Art. 294 k.k.', label: 'Mienie znacznej wartości' },
        { code: 'Art. 60 k.k.', label: 'Nadzwyczajne złagodzenie przy naprawieniu szkody' },
      ],
      linkedRulingSignatures: ['II AKa 314/23'],
      quickScenarioQuery: 'art 286 kk wyłudzenie oszustwo internetowe',
    },
  ]);

  // Wyszukiwanie i filtrowanie
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('all');
  readonly selectedDifficulty = signal<string>('all');
  readonly selectedTopicId = signal<string | null>('hb-obrona-konieczna');

  readonly filteredTopics = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const diff = this.selectedDifficulty();
    const all = this.topics();

    return all.filter((t) => {
      // Kategoria
      if (cat !== 'all' && t.category !== cat) return false;
      // Trudność
      if (diff !== 'all' && t.difficulty !== diff) return false;

      // Szukanie tekstowe
      if (!q) return true;

      const inTitle = t.title.toLowerCase().includes(q);
      const inSubtitle = t.subtitle.toLowerCase().includes(q);
      const inSummary = t.summary.toLowerCase().includes(q);
      const inRules = t.keyRules.some((r) => r.toLowerCase().includes(q));
      const inMyths = t.mythsAndFacts.some((m) => m.myth.toLowerCase().includes(q) || m.fact.toLowerCase().includes(q));
      const inCases = t.caseStudies.some(
        (cs) =>
          cs.title.toLowerCase().includes(q) ||
          cs.scenario.toLowerCase().includes(q) ||
          cs.courtResolution.toLowerCase().includes(q) ||
          cs.practicalTakeaway.toLowerCase().includes(q)
      );

      return inTitle || inSubtitle || inSummary || inRules || inMyths || inCases;
    });
  });

  readonly selectedTopic = computed(() => {
    const id = this.selectedTopicId();
    if (!id) return this.topics()[0] || null;
    return this.topics().find((t) => t.id === id) || this.topics()[0] || null;
  });

  readonly categories = [
    { id: 'all', label: 'Wszystkie działy' },
    { id: 'Część ogólna', label: 'Część ogólna & Obrona' },
    { id: 'Ruch drogowy', label: 'Ruch drogowy & Alkohol' },
    { id: 'Mienie i oszustwa', label: 'Mienie, kradzieże & BLIK' },
    { id: 'Życie i zdrowie', label: 'Zdrowie & bójki' },
    { id: 'Procedura i zatrzymanie', label: 'Zatrzymanie & KRK' },
  ];

  readonly difficulties = [
    { id: 'all', label: 'Wszystkie poziomy' },
    { id: 'podstawowy', label: 'Dla początkujących' },
    { id: 'średniozaawansowany', label: 'Średniozaawansowane' },
    { id: 'zaawansowany', label: 'Dla dociekliwych' },
  ];

  selectTopic(idOrSlug: string): void {
    const found = this.topics().find(
      (t) => t.id === idOrSlug || t.slug === idOrSlug || t.slug.includes(idOrSlug) || idOrSlug.includes(t.slug)
    );
    if (found) {
      this.selectedTopicId.set(found.id);
    } else {
      this.selectedTopicId.set(idOrSlug);
    }
  }

  setSearchQuery(q: string): void {
    this.searchQuery.set(q);
  }

  setCategory(cat: string): void {
    this.selectedCategory.set(cat);
  }

  setDifficulty(diff: string): void {
    this.selectedDifficulty.set(diff);
  }
}
