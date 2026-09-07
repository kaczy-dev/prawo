import { Injectable, inject } from '@angular/core';
import { LegalDataService } from './legal-data.service';
import { LegalGuardrailService } from './legal-guardrail.service';
import { PenalArticle, ThreatAnalysisResult, ChatMessage } from '../models/legal.model';

@Injectable({
  providedIn: 'root',
})
export class PrawnBotAiService {
  private readonly legalData = inject(LegalDataService);
  private readonly guardrail = inject(LegalGuardrailService);

  /**
   * Główny silnik analizy ryzyka "Co mi grozi?"
   * Działa w 100% lokalnie w przeglądarce, bez zewnętrznych API.
   */
  analyzeSituation(rawQuery: string): ThreatAnalysisResult {
    // Ewaluacja Guardrails (zapobieganie pomocnictwu w przestępstwie art. 18 § 3 k.k.)
    const guardrailCheck = this.guardrail.evaluateInput(rawQuery);
    if (!guardrailCheck.isAllowed) {
      return {
        matchedArticles: [],
        riskLevel: 'bardzo wysoki',
        primarySentenceRange: 'ZAPYTANIE ZABLOKOWANE PRZEZ GUARDRAILS',
        possibleSanctions: [guardrailCheck.statutoryBasis || 'Art. 18 § 3 k.k. (Pomocnictwo)'],
        mandatoryMeasures: ['Odmowa generowania instrukcji modus operandi'],
        mitigatingFactors: ['Skorzystanie z profesjonalnej pomocy adwokata w toczącym się śledztwie'],
        aggravatingFactors: ['Podejmowanie prób zacierania śladów (art. 239 k.k.)'],
        plainExplanation: `${guardrailCheck.warningTitle}: ${guardrailCheck.warningMessage}`,
        similarRulings: [],
        recommendedSteps: [
          'Skonsultuj się osobiście z adwokatem lub radcą prawnym w kancelarii.',
          'Pamiętaj, że oskarżony/podejrzany ma prawo do odmowy składania wyjaśnień (art. 175 k.p.k.).',
          'Nie podejmuj działań zmierzających do niszczenia dowodów lub matactwa procesowego.',
        ],
      };
    }

    const q = rawQuery.toLowerCase().trim();
    const allArticles = this.legalData.articles();
    const allRulings = this.legalData.courtRulings();

    let matchedArticles: PenalArticle[] = [];
    let riskLevel: 'niski' | 'średni' | 'wysoki' | 'bardzo wysoki' = 'średni';
    let primarySentenceRange = '';
    const possibleSanctions: string[] = [];
    const mandatoryMeasures: string[] = [];
    const mitigatingFactors: string[] = [];
    const aggravatingFactors: string[] = [];
    let plainExplanation = '';
    const recommendedSteps: string[] = [];

    // Oczyszczanie zapytania z potocznych fraz wstępnych ("co mi grozi za...", "ile grozi za...")
    const cleanQ = q
      .replace(/^(co\s+mi\s+grozi\s+za|co\s+grozi\s+za|ile\s+grozi\s+za|jaka\s+kara\s+za|jaka\s+jest\s+kara\s+za|co\s+mi\s+grozi|co\s+grozi)\s+/gi, '')
      .trim();
    const testQ = cleanQ || q;

    // Bezpośrednie dopasowanie po numerze artykułu (np. "art 178a", "art. 286", "278")
    const artNumMatch = testQ.match(/(?:art\.?|artyku[łl])?\s*(\d+)([a-z]?)/i);
    if (artNumMatch) {
      const num = parseInt(artNumMatch[1], 10);
      const suffix = (artNumMatch[2] || '').toLowerCase();
      const directArt = allArticles.find(
        (a) => a.number === num && (suffix ? (a.suffix || '').toLowerCase() === suffix : true)
      );
      if (directArt) {
        matchedArticles.push(directArt);
      }
    }

    // 1. Wykrywanie kontekstu prawnego na podstawie słów kluczowych i reguł semantycznych
    const isPoliceChase = testQ.includes('pościg') || testQ.includes('ucieczk') && (testQ.includes('policj') || testQ.includes('radiowóz') || testQ.includes('kontrol')) || testQ.includes('178b');
    const isAlcoholTraffic = !isPoliceChase && (testQ.includes('alkohol') || testQ.includes('promil') || testQ.includes('pijan') || testQ.includes('piw') || testQ.includes('wódk') || testQ.includes('samochód') || testQ.includes('autem') || testQ.includes('kierowc') || testQ.includes('178a') || testQ.includes('prawo jazdy'));
    const isAccidentOrHitAndRun = testQ.includes('wypadek') || testQ.includes('potrąc') || (testQ.includes('ucieczk') && (testQ.includes('miejsca') || testQ.includes('kolizj') || testQ.includes('wypadk'))) || testQ.includes('177') || testQ.includes('178 ');
    const isFailureToHelp = testQ.includes('nieudzielenie pomocy') || (testQ.includes('pomoc') && (testQ.includes('nie udzieliłem') || testQ.includes('nie pomógł') || testQ.includes('zostawił rann'))) || testQ.includes('162');
    const isBodilyHarm = testQ.includes('uszczerbek') || testQ.includes('złamał') || testQ.includes('złamanie nosa') || testQ.includes('wybicie oka') || testQ.includes('okaleczen') || testQ.includes('obrażenia') || testQ.includes('rozstrój') || testQ.includes('156') || testQ.includes('157');
    const isForgery = testQ.includes('podrob') || testQ.includes('sfałszow') || testQ.includes('podpis') || testQ.includes('lewe l4') || testQ.includes('fałszywe l4') || testQ.includes('zwolnieni') || testQ.includes('przerobion') || testQ.includes('270');
    const isAppropriation = testQ.includes('przywłaszcz') || testQ.includes('znaleziony telefon') || testQ.includes('znaleziony portfel') || testQ.includes('znalezione nie kradzione') || testQ.includes('sprzeniewierz') || testQ.includes('nie oddał') || testQ.includes('284');
    const isFencing = testQ.includes('pasers') || testQ.includes('kupiłem kradzion') || testQ.includes('kradziony telefon') || testQ.includes('rzecz z kradzieży') || testQ.includes('291') || testQ.includes('292');
    const isBribery = testQ.includes('łapówk') || testQ.includes('przekup') || testQ.includes('w łapę') || testQ.includes('dałem policjantowi') || testQ.includes('korupcj') || testQ.includes('229');
    const isFalseTestimony = testQ.includes('fałszywe zeznan') || testQ.includes('kłamałem na policji') || testQ.includes('kłamstwo w sądzie') || testQ.includes('zataił prawd') || testQ.includes('233');
    const isHidingAssets = testQ.includes('ukrywanie majątku') || testQ.includes('przepisanie na żonę') || testQ.includes('komornik') || testQ.includes('darowizna przed długami') || testQ.includes('300');
    const isInsult = testQ.includes('zniewag') || testQ.includes('wyzwisk') || testQ.includes('obelg') || testQ.includes('znieważył') || testQ.includes('216');

    // Kwota do 800 zł przy kradzieży / zniszczeniu
    const hasUnder800Val = /([1-7]\d\d|\b[1-9]\d\b|\b800\b)\s*(zł|zl|pln)/i.test(testQ) || testQ.includes('do 800') || testQ.includes('poniżej 800') || testQ.includes('119 kw');
    const isTheft = testQ.includes('kradzież') || testQ.includes('ukradł') || testQ.includes('zabrał') || testQ.includes('sklep') || testQ.includes('towar') || testQ.includes('rower') || testQ.includes('278') || testQ.includes('119');
    const isBurglary = testQ.includes('włamani') || testQ.includes('zbliżeniow') || testQ.includes('karta bank') || testQ.includes('wybił szybę') || testQ.includes('zamek') || testQ.includes('279');
    const isFraud = testQ.includes('oszust') || testQ.includes('blik') || testQ.includes('wyłudz') || testQ.includes('fałszyw') || testQ.includes('pieniądze z konta') || testQ.includes('286');
    const isFight = testQ.includes('bójk') || testQ.includes('pobił') || testQ.includes('uderzył') || testQ.includes('awantur') || testQ.includes('stłukł') || testQ.includes('158');
    const isPolice = !isPoliceChase && (testQ.includes('policj') || testQ.includes('radiowóz') || testQ.includes('funkcjonariusz') || testQ.includes('mundur') || testQ.includes('226') || testQ.includes('222'));
    const isStalking = testQ.includes('stalk') || testQ.includes('nęka') || testQ.includes('śledz') || testQ.includes('wiadomoś') || testQ.includes('190a');
    const isThreat = !isStalking && (testQ.includes('groźb') || testQ.includes('grozi') || testQ.includes('zastrasz') || testQ.includes('zabiję cię') || testQ.includes('pożałujesz') || testQ.includes('190'));
    const isSelfDefense = testQ.includes('obrona') || testQ.includes('napadł mnie') || testQ.includes('broniłem') || testQ.includes('odparłem') || testQ.includes('kontratyp') || testQ.includes('art 25');
    const isRobbery = testQ.includes('rozbój') || testQ.includes('nóż') || testQ.includes('bronią') || testQ.includes('zastraszył nożem') || testQ.includes('280');
    const isAlimony = testQ.includes('aliment') || (testQ.includes('komornik') && testQ.includes('dzieck')) || testQ.includes('nie płacę') || testQ.includes('209');
    const isDomesticViolence = testQ.includes('znęcan') || testQ.includes('przemoc domow') || testQ.includes('niebieska karta') || testQ.includes('bicie żony') || testQ.includes('207');
    const isConditionalDischarge = testQ.includes('warunkow') || testQ.includes('umorzen') || testQ.includes('czysta kartotek') || testQ.includes('art 66');
    const isNightPeace = testQ.includes('cisz') || testQ.includes('nocn') || testQ.includes('spoczynek') || testQ.includes('hałas') || testQ.includes('muzyk') || testQ.includes('imprez') || testQ.includes('51 kw') || (testQ.includes('sąsiad') && (testQ.includes('hałas') || testQ.includes('waleni') || testQ.includes('muzyk') || testQ.includes('krzyk')));
    const isNoLicense = testQ.includes('bez uprawnień') || testQ.includes('bez prawa jazdy') || testQ.includes('brak uprawnień') || testQ.includes('brak prawa jazdy') || testQ.includes('94 kw') || testQ.includes('bez prawka');
    const isDrugsPossession = testQ.includes('marihuan') || testQ.includes('narkotyk') || testQ.includes('zioł') || testQ.includes('trawk') || testQ.includes('skręt') || testQ.includes('amfetamin') || testQ.includes('substancj') || testQ.includes('62 uopn') || testQ.includes('62a');
    const isDefamation = testQ.includes('zniesław') || testQ.includes('pomów') || testQ.includes('hejt') || testQ.includes('oczern') || testQ.includes('opinia google') || testQ.includes('facebook') || testQ.includes('212');
    const isPropertyDamage = testQ.includes('zniszcz') || testQ.includes('uszkodz') || testQ.includes('porysow') || testQ.includes('dewast') || testQ.includes('wybicie szyb') || testQ.includes('graffiti') || testQ.includes('288') || testQ.includes('124 kw');
    const isCourtBanViolation = testQ.includes('złamanie zakazu') || testQ.includes('zakaz sądowy') || testQ.includes('pomimo zakazu') || testQ.includes('wbrew zakazowi') || testQ.includes('244');

    // Dopasowanie artykułów
    if (isPoliceChase) {
      const art = allArticles.find((a) => a.id === 'art-178b-kk');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isAccidentOrHitAndRun) {
      const art1 = allArticles.find((a) => a.id === 'art-178-kk');
      const art2 = allArticles.find((a) => a.id === 'art-177-kk');
      if (art1 && !matchedArticles.includes(art1)) matchedArticles.push(art1);
      if (art2 && !matchedArticles.includes(art2)) matchedArticles.push(art2);
    }
    if (isFailureToHelp) {
      const art = allArticles.find((a) => a.id === 'art-162-kk');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isBodilyHarm) {
      const art1 = allArticles.find((a) => a.id === 'art-157-kk');
      const art2 = allArticles.find((a) => a.id === 'art-156-kk');
      if (art1 && !matchedArticles.includes(art1)) matchedArticles.push(art1);
      if (art2 && !matchedArticles.includes(art2)) matchedArticles.push(art2);
    }
    if (isForgery) {
      const art = allArticles.find((a) => a.id === 'art-270-kk');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isAppropriation) {
      const art = allArticles.find((a) => a.id === 'art-284-kk');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isFencing) {
      const art = allArticles.find((a) => a.id === 'art-291-kk');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isBribery) {
      const art = allArticles.find((a) => a.id === 'art-229-kk');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isFalseTestimony) {
      const art = allArticles.find((a) => a.id === 'art-233-kk');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isHidingAssets) {
      const art = allArticles.find((a) => a.id === 'art-300-kk');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isInsult) {
      const art = allArticles.find((a) => a.id === 'art-216-kk');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isNightPeace) {
      const artKw = allArticles.find((a) => a.id === 'art-51-kw');
      if (artKw && !matchedArticles.includes(artKw)) matchedArticles.push(artKw);
      if (testQ.includes('nęka') || testQ.includes('uporczyw') || testQ.includes('specjalnie') || testQ.includes('złośliw')) {
        const artStalk = allArticles.find((a) => a.id === 'art-190a');
        const art191 = allArticles.find((a) => a.id === 'art-191-kk');
        if (artStalk && !matchedArticles.includes(artStalk)) matchedArticles.push(artStalk);
        if (art191 && !matchedArticles.includes(art191)) matchedArticles.push(art191);
      }
    }
    if (isNoLicense) {
      const art = allArticles.find((a) => a.id === 'art-94-kw');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isDrugsPossession) {
      const art = allArticles.find((a) => a.id === 'art-62-uopn');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isDefamation) {
      const art = allArticles.find((a) => a.id === 'art-212-kk');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isPropertyDamage) {
      if (hasUnder800Val) {
        const artKw = allArticles.find((a) => a.id === 'art-124-kw');
        if (artKw && !matchedArticles.includes(artKw)) matchedArticles.push(artKw);
      } else {
        const art = allArticles.find((a) => a.id === 'art-288-kk');
        if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
      }
    }
    if (isCourtBanViolation) {
      const art = allArticles.find((a) => a.id === 'art-244-kk');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isAlcoholTraffic) {
      const art = allArticles.find((a) => a.id === 'art-178a');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isBurglary) {
      const art = allArticles.find((a) => a.id === 'art-279');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    } else if (isTheft) {
      if (hasUnder800Val) {
        const artKw = allArticles.find((a) => a.id === 'art-119-kw');
        if (artKw && !matchedArticles.includes(artKw)) matchedArticles.push(artKw);
      } else {
        const art = allArticles.find((a) => a.id === 'art-278');
        if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
      }
    }
    if (isRobbery) {
      const art = allArticles.find((a) => a.id === 'art-280');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isFraud) {
      const art = allArticles.find((a) => a.id === 'art-286');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isFight) {
      const art = allArticles.find((a) => a.id === 'art-158');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isPolice) {
      const art1 = allArticles.find((a) => a.id === 'art-226');
      const art2 = allArticles.find((a) => a.id === 'art-222');
      if (art1 && !matchedArticles.includes(art1)) matchedArticles.push(art1);
      if (art2 && !matchedArticles.includes(art2)) matchedArticles.push(art2);
    }
    if (isStalking) {
      const art = allArticles.find((a) => a.id === 'art-190a');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    } else if (isThreat) {
      const art = allArticles.find((a) => a.id === 'art-190');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isSelfDefense) {
      const art = allArticles.find((a) => a.id === 'art-25');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isAlimony) {
      const art = allArticles.find((a) => a.id === 'art-209');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isDomesticViolence) {
      const art = allArticles.find((a) => a.id === 'art-207');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }
    if (isConditionalDischarge) {
      const art = allArticles.find((a) => a.id === 'art-66');
      if (art && !matchedArticles.includes(art)) matchedArticles.push(art);
    }

    // Jeśli brak bezpośredniego dopasowania, przeszukaj pełnotekstowo słowa
    if (matchedArticles.length === 0) {
      const words = testQ.split(/\s+/).filter((w) => w.length > 2);
      matchedArticles = allArticles.filter((art) => {
        const text = `${art.title} ${art.content} ${art.plainSummary} ${art.keywords.join(' ')}`.toLowerCase();
        return words.some((w) => text.includes(w));
      });
    }

    // Jeśli nadal puste, podaj najważniejszy artykuł poglądowo
    if (matchedArticles.length === 0) {
      matchedArticles = [allArticles[0]];
    }

    // 2. Obliczenie sankcji i poziomu ryzyka
    const primary = matchedArticles[0];

    if (isAlcoholTraffic) {
      riskLevel = q.includes('1.5') || q.includes('recydyw') || q.includes('drugi raz') ? 'bardzo wysoki' : 'wysoki';
      primarySentenceRange = 'Pozbawienie wolności od 1 miesiąca do lat 3 (lub do 5 lat w recydywie)';
      possibleSanctions.push(
        'Kara pozbawienia wolności (często orzekana z warunkowym zawieszeniem lub w Systemie Dozoru Elektronicznego SDE)',
        'Obligatoryjny zakaz prowadzenia wszelkich pojazdów mechanicznych na okres od 3 do 15 lat',
        'Świadczenie pieniężne na Fundusz Sprawiedliwości: minimum 5 000 zł (recydywa min. 10 000 zł)'
      );
      mandatoryMeasures.push(
        'UWAGA! Nowe prawo od 14.03.2024 r.: Obligatoryjna konfiskata pojazdu mechanicznego (przepadek auta) przy stężeniu powyżej 1,5 promila alkoholu we krwi (lub powyżej 1,0 promila przy recydywie lub spowodowaniu wypadku). Jeżeli auto nie należy w całości do sprawcy – orzeka się zapłatę nawiązki o wartości rynkowej samochodu.'
      );
      mitigatingFactors.push(
        'Stężenie alkoholu tuż powyżej progu przestępstwa (np. 0.55 promila / 0.26 mg/l)',
        'Dotychczasowa całkowita niekaralność (możliwość ubiegania się o warunkowe umorzenie postępowania art. 66 k.k.)',
        'Zatrzymanie się do kontroli bez próby ucieczki, współpraca z policją',
        'Szczególna sytuacja życiowa lub rodzinna uzasadniająca konieczność posiadania uprawnień (np. praca, opieka nad chorym członkiem rodziny)'
      );
      aggravatingFactors.push(
        'Spowodowanie kolizji lub wypadku drogowego',
        'Przewożenie pasażerów, zwłaszcza małoletnich dzieci',
        'Wcześniejsza karalność za jazdę po alkoholu (art. 178a § 4 k.k.)',
        'Stężenie przekraczające 1.5 - 2.0 promile'
      );
      plainExplanation =
        'Jazda w stanie nietrzeźwości (powyżej 0.5 promila) to zawsze przestępstwo wpisywane do Krajowego Rejestru Karnego. Kluczowym celem obrony w tego typu sprawie jest walka o warunkowe umorzenie postępowania (art. 66 k.k.) – jeśli sąd się zgodzi, zachowujesz czystą kartotekę karną, a zakaz prowadzenia pojazdów może zostać skrócony nawet do 1 roku.';
      recommendedSteps.push(
        'Żądaj dokładnego protokołu z badania alkomatem i weryfikacji świadectwa wzorcowania urządzenia.',
        'Jeśli wynik był graniczny (np. 0.26 mg/l), natychmiast wnioskuj o badanie krwi w odstępach 30-minutowych (krzywa alkoholowa).',
        'Wpłać dobrowolną nawiązkę na Fundusz Pomocy Pokrzywdzonym jeszcze przed skierowaniem aktu oskarżenia do sądu.',
        'Złóż udokumentowany wniosek o warunkowe umorzenie postępowania z art. 66 k.k.'
      );
    } else if (isBurglary) {
      riskLevel = 'wysoki';
      primarySentenceRange = 'Pozbawienie wolności od 1 roku do 10 lat (typ podstawowy)';
      possibleSanctions.push(
        'Kara bezwzględnego pozbawienia wolności lub kara z warunkowym zawieszeniem',
        'Grzywna orzekana obok kary pozbawienia wolności',
        'Obowiązek pełnego naprawienia szkody (zwrot pieniędzy pokrzywdzonemu)'
      );
      mandatoryMeasures.push(
        'Kradzież z włamaniem (w tym płatność zbliżeniowa znalezioną kartą) NIE podlega progowi 800 zł. Nawet zakup za 5 zł to zbrodnia/występek z art. 279 k.k.!'
      );
      mitigatingFactors.push(
        'Niewielka wartość zaboru – szansa na zakwalifikowanie czynu jako "wypadek mniejszej wagi" (art. 279 § 2 k.k., kara od 3 miesięcy do 5 lat)',
        'Natychmiastowe naprawienie szkody i przeproszenie pokrzywdzonego',
        'Niekaralność sprawcy'
      );
      aggravatingFactors.push('Włamanie do lokalu mieszkalnego w nocy', 'Działanie w zorganizowanej grupie', 'Zniszczenie mienia o dużej wartości');
      plainExplanation =
        'Polskie prawo traktuje kradzież z włamaniem bardzo surowo. Nawet jeśli sprawa dotyczy płatności zbliżeniowej skradzioną kartą na 15 zł, prokurator stawia zarzut z art. 279 k.k. Głównym zadaniem obrońcy jest zmiana kwalifikacji na "wypadek mniejszej wagi", co pozwala orzec karę wolnościową lub zawieszenie.';
      recommendedSteps.push(
        'Natychmiast wyrównaj szkodę (zwróć pobraną kwotę lub zniszczony przedmiot).',
        'Złóż wniosek o pojednanie i mediację z pokrzywdzonym (art. 23a k.p.k.).',
        'Wnioskuj o kwalifikację z art. 279 § 2 k.k. (wypadek mniejszej wagi).'
      );
    } else if (isTheft) {
      const isOver800 = q.includes('800') || q.includes('1000') || q.includes('tysiąc') || q.includes('drogi') || !q.includes('drobna');
      riskLevel = isOver800 ? 'średni' : 'niski';
      primarySentenceRange = isOver800
        ? 'Pozbawienie wolności od 3 miesięcy do 5 lat (przestępstwo art. 278 k.k.)'
        : 'Grzywna do 5000 zł lub areszt (wykroczenie z art. 119 k.w. dla wartości do 800 zł)';
      possibleSanctions.push(
        isOver800 ? 'Pozbawienie wolności, ograniczenie wolności (prace społeczne), grzywna' : 'Grzywna w postępowaniu mandatowym lub sądowym, areszt'
      );
      mandatoryMeasures.push('Obowiązek zwrotu skradzionego towaru lub zapłata jego równowartości.');
      mitigatingFactors.push('Zwrócenie towaru w nienaruszonym stanie', 'Wartość poniżej 800 zł (brak wpisu do rejestru karnego KRK)', 'Działanie z biedy lub pod wpływem impulsu');
      aggravatingFactors.push('Kradzież zuchwała', 'Działanie w ramach stałego źródła dochodu');
      plainExplanation =
        'Od 1 października 2023 r. kluczowa granica wynosi dokładnie 800 zł. Jeśli wartość skradzionej rzeczy nie przekracza 800 zł, jest to jedynie wykroczenie (nie ma wyroku skazującego za przestępstwo i nie trafiasz do rejestru skazanych KRK). Powyżej 800 zł grozi odpowiedzialność karna.';
      recommendedSteps.push(
        'Sprawdź rzeczywistą cenę netto/brutto skradzionej rzeczy (często zawyżaną przez sklepy).',
        'Jeśli wartość jest bliska 800 zł, rzeczoznawca może wycenić wartość rynkową poniżej progu przestępstwa.',
        'W razie przekroczenia progu – wnoś o wypadek mniejszej wagi (art. 278 § 3 k.k.).'
      );
    } else if (isFight) {
      riskLevel = 'średni';
      primarySentenceRange = 'Pozbawienie wolności od 3 miesięcy do lat 5 (art. 158 § 1 k.k.)';
      possibleSanctions.push('Kara ograniczenia wolności, prace społeczne, dozór elektroniczny lub pozbawienie wolności');
      mandatoryMeasures.push('Solidarna nawiązka i zadośćuczynienie finansowe dla poszkodowanego');
      mitigatingFactors.push('Prowokacja ze strony przeciwnika', 'Działanie w celu powstrzymania dalszej eskalacji', 'Przeproszenie i zawarcie ugody');
      aggravatingFactors.push('Użycie niebezpiecznego narzędzia (np. butelki, pałki)', 'Atak z przewagą liczebną', 'Ciężki uszczerbek na zdrowiu ofiary');
      plainExplanation =
        'W bójce lub pobiciu każdy uczestnik odpowiada karnie za samo narażenie człowieka na niebezpieczeństwo. Nie ma znaczenia, czy to akurat twój cios powalił przeciwnika. Ważne jest jednak wykazanie, czy nie działałeś w warunkach obrony koniecznej (art. 25 k.k.).';
      recommendedSteps.push(
        'Zabezpiecz nagrania z monitoringu miejskiego lub kamer klubowych, zanim zostaną nadpisane (zwykle po 7-30 dniach).',
        'Ustal świadków zdarzenia i złóż wniosek o ich natychmiastowe przesłuchanie.',
        'Zgłoś się na obdukcję lekarską, jeśli sam odniosłeś obrażenia.'
      );
    } else if (isPolice) {
      riskLevel = 'średni';
      primarySentenceRange = 'Grzywna, ograniczenie wolności lub pozbawienie wolności do 1 roku (art. 226) lub do 3 lat (art. 222)';
      possibleSanctions.push('Grzywna, prace społeczne (ograniczenie wolności), zadośćuczynienie finansowe dla funkcjonariusza');
      mandatoryMeasures.push('Wpis do Krajowego Rejestru Karnego w razie wyroku skazującego');
      mitigatingFactors.push('Działanie pod wpływem silnego wzburzenia wywołanego niewłaściwym zachowaniem policjanta', 'Pisemne przeprosiny funkcjonariusza', 'Dotychczasowa niekaralność');
      aggravatingFactors.push('Czynna agresja fizyczna, szarpanie za mundur, zniszczenie sprzętu służbowego', 'Znaczny stan upojenia alkoholowego');
      plainExplanation =
        'Sądy w Polsce rygorystycznie chronią funkcjonariuszy publicznych. Jednakże samo użycie nieparlamentarnych słów pod wpływem emocji często kończy się warunkowym umorzeniem lub grzywną, pod warunkiem oficjalnych przeprosin.';
      recommendedSteps.push(
        'Skieruj oficjalne pisemne przeprosiny do komendanta jednostki i samego funkcjonariusza.',
        'Wnioskuj o warunkowe umorzenie postępowania karnego z rocznym okresem próby.'
      );
    } else if (isSelfDefense) {
      riskLevel = 'niski';
      primarySentenceRange = 'Brak kary – wyłączenie bezprawności czynu (kontratyp art. 25 k.k.)';
      possibleSanctions.push('W przypadku przekroczenia granic obrony koniecznej: nadzwyczajne złagodzenie kary lub odstąpienie od wymierzenia kary');
      mandatoryMeasures.push('Brak sankcji karnej przy uznaniu działania w obronie koniecznej');
      mitigatingFactors.push('Nagłość i brutalność ataku napastnika', 'Obrona we własnym mieszkaniu ("mój dom moją twierdzą")', 'Strach i wzburzenie usprawiedliwione okolicznościami zamachu');
      aggravatingFactors.push('Kontynuowanie ataku, gdy napastnik leżał już bezradny lub uciekał');
      plainExplanation =
        'Obrona konieczna całkowicie znosi przestępstwo. Nie popełnia przestępstwa ten, kto odpiera bezpośredni i bezprawny zamach. Od 2018 roku obowiązuje przepis chroniący obrońcę przed karą, jeśli odpiera atak we własnym domu lub na ogrodzonej posesji.';
      recommendedSteps.push(
        'Nigdy nie przyznawaj się do winy za przestępstwo – od początku konsekwentnie składaj wyjaśnienia, że działałeś wyłącznie w celu ratowania życia lub zdrowia.',
        'Zabezpiecz ślady ataku napastnika (uszkodzone drzwi, zniszczone ubrania, obrażenia na ciele).'
      );
    } else if (isStalking) {
      riskLevel = 'wysoki';
      primarySentenceRange = 'Pozbawienie wolności od 6 miesięcy do lat 8 (art. 190a § 1 k.k.)';
      possibleSanctions.push(
        'Kara pozbawienia wolności od 6 miesięcy do 8 lat (od 2 do 15 lat, jeśli ofiara targnie się na życie)',
        'Zakaz zbliżania się i kontaktowania z pokrzywdzonym (art. 41a k.k.)',
        'Nawiązka finansowa na rzecz pokrzywdzonego'
      );
      mandatoryMeasures.push(
        'Środki zabezpieczające: natychmiastowy zakaz zbliżania się, nakaz powstrzymywania się od kontaktu i dozór elektroniczny (SDE).'
      );
      mitigatingFactors.push(
        'Zaprzestanie wszelkich kontaktów po pierwszym wyraźnym sprzeciwie',
        'Dobrowolne podjęcie terapii psychologicznej / leczenia',
        'Brak bezpośrednich gróźb karalnych i przemocy fizycznej'
      );
      aggravatingFactors.push(
        'Długotrwałość nękania (wiele miesięcy)',
        'Wykorzystanie wizerunku lub podszywanie się w social mediach (art. 190a § 2 k.k.)',
        'Doprowadzenie pokrzywdzonego do rozstroju zdrowia'
      );
      plainExplanation =
        'Stalking (uporczywe nękanie) to przestępstwo polegające na naruszaniu prywatności i wzbudzaniu poczucia zagrożenia lub poniżenia. Po zaostrzeniu kar górna granica wynosi aż 8 lat więzienia. Kluczem obrony jest ustalenie, czy kontakty nie były wzajemne lub sprowokowane.';
      recommendedSteps.push(
        'Bezwzględnie i natychmiast przerwij wszelki kontakt z pokrzywdzonym (brak telefonów, sms, wiadomości przez znajomych).',
        'Zabezpiecz historię korespondencji w celu wykazania, czy kontakty nie miały charakteru wzajemnego.',
        'Wnioskuj o skierowanie sprawy do mediacji (art. 23a k.p.k.) i złóż wniosek o ugodę.'
      );
    } else if (isDomesticViolence) {
      riskLevel = 'wysoki';
      primarySentenceRange = 'Pozbawienie wolności od 3 miesięcy do lat 5 (ze szczególnym okrucieństwem od 1 do 10 lat)';
      possibleSanctions.push(
        'Kara pozbawienia wolności',
        'Natychmiastowy nakaz opuszczenia wspólnie zajmowanego lokalu i zakaz zbliżania się',
        'Dozór policji i zakaz kontaktowania się'
      );
      mandatoryMeasures.push(
        'Nowe procedury antyprzemocowe: policja może wydać natychmiastowy nakaz opuszczenia mieszkania na 14 dni z możliwością przedłużenia przez sąd cywilny.'
      );
      mitigatingFactors.push(
        'Pojednanie stron, podjęcie terapii uzależnień lub programu korekcyjnego',
        'Czyn miał charakter incydentalny w toku wzajemnego konfliktu',
        'Brak uszkodzeń ciała i zaświadczeń lekarskich'
      );
      aggravatingFactors.push(
        'Działanie w obecności małoletnich dzieci',
        'Działanie pod wpływem alkoholu lub środków odurzających',
        'Długotrwałe znęcanie psychiczne'
      );
      plainExplanation =
        'Przestępstwo znęcania się (art. 207 k.k.) wymaga wykazania przewagi sprawcy nad ofiarą i powtarzalności zachowań. Jeżeli konflikt ma charakter symetryczny (obie strony kłócą się i prowokują nawzajem), linia orzecznicza SN wskazuje, że nie zachodzi przestępstwo z art. 207 k.k.';
      recommendedSteps.push(
        'Wyprowadź się lub zachowaj bezpieczny dystans, aby nie dopuścić do dalszych interwencji policji.',
        'Weryfikuj wpisy w procedurze Niebieskiej Karty i zeznania świadków.',
        'Wnioskuj o dołączenie dowodów na wzajemny charakter konfliktu domowego.'
      );
    } else if (isAlimony) {
      riskLevel = 'średni';
      primarySentenceRange = 'Grzywna, ograniczenie wolności lub pozbawienie wolności do 1 roku (art. 209 k.k.)';
      possibleSanctions.push(
        'Kara ograniczenia wolności (prace społeczne)',
        'Dozór elektroniczny SDE',
        'Kara pozbawienia wolności'
      );
      mandatoryMeasures.push(
        'Kluczowa klauzula bezkarności (art. 209 § 4 k.k.): Nie podlega karze sprawca, który wpłaci w całości zaległe alimenty przed upływem 30 dni od pierwszego przesłuchania w charakterze podejrzanego!'
      );
      mitigatingFactors.push(
        'Uregulowanie całości długu w terminie 30 dni (gwarancja bezkarności z mocy prawa)',
        'Częściowe, regularne wpłaty na miarę możliwości zarobkowych',
        'Udokumentowana choroba, utrata pracy lub nagła niezdolność do pracy'
      );
      aggravatingFactors.push(
        'Całkowity brak wpłat przez wiele lat',
        'Ukrywanie majątku i praca "na czarno" w celu udaremnienia egzekucji komorniczej'
      );
      plainExplanation =
        'Niealimentacja staje się przestępstwem, gdy zaległość osiągnie równowartość 3 rat alimentacyjnych. Ustawodawca wprowadził jednak klauzulę bezkarności: spłata zaległości w ciągu 30 dni od pierwszego przesłuchania chroni przed jakimkolwiek wyrokiem skazującym.';
      recommendedSteps.push(
        'Jeśli zostałeś wezwany na policję, masz dokładnie 30 dni od przesłuchania na całkowite uregulowanie długu – zrób to, a unikniesz kary (art. 209 § 4 k.k.).',
        'Jeżeli nie masz całej kwoty, dokonaj wpłaty częściowej i złóż wniosek o ugodę lub obniżenie alimentów z datą wsteczną w sądzie rodzinnym.'
      );
    } else if (isConditionalDischarge) {
      riskLevel = 'niski';
      primarySentenceRange = 'Brak kary kryminalnej – wyznaczenie okresu próby (1-3 lata) (art. 66 k.k.)';
      possibleSanctions.push(
        'Świadczenie pieniężne na Fundusz Sprawiedliwości',
        'Obowiązek naprawienia szkody lub przeproszenia pokrzywdzonego'
      );
      mandatoryMeasures.push(
        'Czysta kartoteka w Krajowym Rejestrze Karnym (KRK) – zachowanie statusu osoby niekaranej!'
      );
      mitigatingFactors.push(
        'Uprzednia niekaralność za przestępstwo umyślne',
        'Niewielki stopień społecznej szkodliwości czynu',
        'Pojednanie z pokrzywdzonym i naprawienie szkody'
      );
      aggravatingFactors.push(
        'Wcześniejsza karalność',
        'Zagrożenie ustawowe czynu przekraczające 5 lat pozbawienia wolności'
      );
      plainExplanation =
        'Warunkowe umorzenie postępowania to najkorzystniejsze rozstrzygnięcie dla osoby, która popełniła występek. Sąd uznaje winę, ale nie wymierza kary i nie wpisuje skazania do KRK. Zachowujesz status osoby niekaranej.';
      recommendedSteps.push(
        'Złóż wniosek o warunkowe umorzenie postępowania na etapie postępowania przygotowawczego lub przed sądem.',
        'Dołącz zaświadczenie o niekaralności, opinię z miejsca pracy i dowód wpłaty na rzecz pokrzywdzonego.'
      );
    } else if (isNightPeace) {
      riskLevel = testQ.includes('nęka') || testQ.includes('złośliw') || testQ.includes('pobici') ? 'średni' : 'niski';
      primarySentenceRange = 'Mandat 100–500 zł (lub do 1000 zł przy zbiegu). W sądzie: grzywna 20–5000 zł, ograniczenie wolności (1 m-c) lub areszt (5-30 dni) (art. 51 k.w.)';
      possibleSanctions.push(
        'Mandat karny w wysokości od 100 do 500 zł nakładany przez Policję lub Straż Miejską na gorącym uczynku',
        'W przypadku skierowania wniosku o ukaranie do Sądu Rejonowego: grzywna od 20 zł do 5 000 zł',
        'Kara ograniczenia wolności: 1 miesiąc (obowiązek wykonywania nieodpłatnej kontrolowanej pracy na cele społeczne od 20 do 40 godzin)',
        'Kara aresztu od 5 do 30 dni (w skrajnych przypadkach chuligańskich lub rażącej recydywy)'
      );
      mandatoryMeasures.push(
        'CZYSTA KARTOTEKA (KRK): Zakłócenie ciszy/spoczynku nocnego to WYKROCZENIE (art. 51 k.w.). Ukaranie mandatem lub grzywną sądową NIE POWODUJE wpisu do Krajowego Rejestru Karnego jako osoba karana za przestępstwo!',
        'OSTRZEŻENIE O ESKALACJI DO KODEKSU KARNEGO: Jeśli hałasowanie, walenie w rury lub puszczanie muzyki jest celowe, złośliwe i długotrwałe w celu udręczenia sąsiada, prokurator stawia zarzuty z Kodeksu Karnego: stalking (art. 190a § 1 k.k. – kara od 6 miesięcy do 8 lat więzienia) lub utrudnianie korzystania z lokalu mieszkalnego (art. 191 § 1a k.k. – kara do 3 lat więzienia)!'
      );
      mitigatingFactors.push(
        'Incydentalny charakter zdarzenia (np. jednorazowa uroczystość rodzinna, parapetówka)',
        'Natychmiastowe podporządkowanie się poleceniom policji i ściszenie muzyki',
        'Zwykłe odgłosy życia codziennego (płacz niemowlęcia, awaria, pojedynczy upadek przedmiotu, remont w dzień) – wyrok SN III KRN 189/92 potwierdza brak znamion wybryku',
        'Pojednanie z sąsiadem i przeprosiny'
      );
      aggravatingFactors.push(
        'Działanie pod wpływem alkoholu lub środków odurzających (art. 51 § 2 k.w. – podstawa zaostrzenia sankcji)',
        'Charakter chuligański czynu lub wulgaryzmy wykrzykiwane przez okno/balkon',
        'Wielokrotne interwencje policji tej samej nocy',
        'Awantura z policją lub odmowa okazania dokumentu tożsamości (art. 65 k.w.)'
      );
      plainExplanation =
        'W polskim prawie termin „cisza nocna” formalnie nie występuje w kodeksie – art. 51 k.w. posługuje się pojęciem „spoczynku nocnego” (zwyczajowo 22:00–06:00). Karalny jest wybryk, czyli zachowanie rażąco naruszające normy współżycia. Zwykły mandat to 100–500 zł. Nie trafia on do KRK. Jeśli jednak hałas jest formą złośliwego terroru sąsiedzkiego, wkracza Kodeks Karny.';
      recommendedSteps.push(
        'W trakcie interwencji zachowaj spokój, wylegitymuj się i natychmiast wycisz źródło dźwięku.',
        'Jeśli zarzut jest nieuzasadniony (np. to nie z Twojego lokalu dobiegał hałas) – masz prawo odmówić przyjęcia mandatu (art. 97 k.p.w.). Sprawa trafi do Sądu Rejonowego.',
        'W sądzie powołaj się na wyrok SN III KRN 189/92 (brak znamienia wybryku przy normalnym funkcjonowaniu).',
        'W przypadku konfliktu sąsiedzkiego złóż wniosek o mediację przedsądową.'
      );
    } else if (isNoLicense) {
      riskLevel = 'wysoki';
      primarySentenceRange = 'Grzywna min. 1500 zł do 30 000 zł oraz OBLIGATORYJNY zakaz prowadzenia pojazdów od 6 miesięcy do 3 lat (art. 94 § 1 i 3 k.w.)';
      possibleSanctions.push(
        'Sądowa grzywna w wysokości od 1 500 zł do 30 000 zł',
        'Obligatoryjny zakaz prowadzenia wszelkich pojazdów mechanicznych na okres od 6 miesięcy do 3 lat',
        'Kara aresztu lub ograniczenia wolności w przypadkach rażących',
        'Koszty odholowania i parkingu pojazdu'
      );
      mandatoryMeasures.push(
        'UWAGA! Zgodnie z art. 94 § 3 k.w. i uchwałą Sądu Najwyższego (I KZP 4/22), orzeczenie zakazu prowadzenia pojazdów jest BEZWZGLĘDNIE OBLIGATORYJNE. Sąd nie może od niego odstąpić!',
        'Złamanie orzeczonego zakazu stanowi już poważne PRZESTĘPSTWO z art. 244 k.k. zagrożone karą do 5 lat pozbawienia wolności!'
      );
      mitigatingFactors.push(
        'Kierowanie w stanie wyższej konieczności (np. nagłe zawiezienie chorej osoby do szpitala)',
        'Posiadanie uprawnień w przeszłości (np. brak dokumentu z przyczyn formalnych)',
        'Niekaralność sprawcy za wykroczenia drogowe'
      );
      aggravatingFactors.push(
        'Ucieczka przed kontrolą drogową policji',
        'Równoczesny stan po spożyciu alkoholu lub środków odurzających',
        'Wielokrotna jazda bez uprawnień'
      );
      plainExplanation =
        'Od 1 stycznia 2022 r. jazda bez prawa jazdy jest traktowana bezwzględnie surowo. Minimalna grzywna w sądzie wynosi 1500 zł, a sąd MUSI orzec zakaz prowadzenia pojazdów na minimum 6 miesięcy. Wsiadając do auta z zakazem sądowym ryzykujesz natychmiastowe więzienie (art. 244 k.k.).';
      recommendedSteps.push(
        'Nie przyjmuj mandatu, jeśli okoliczności wskazują na stan wyższej konieczności (art. 16 k.w.).',
        'Wnoś o orzeczenie zakazu na najkrótszy dopuszczalny okres (6 miesięcy) oraz z ograniczeniem do określonej kategorii pojazdów.',
        'Pod żadnym pozorem nie siadaj za kółko po ogłoszeniu wyroku – art. 244 k.k. oznacza wyrok skazujący w KRK.'
      );
    } else if (isDrugsPossession) {
      riskLevel = 'średni';
      primarySentenceRange = 'Kara pozbawienia wolności do lat 3 (art. 62 ust. 1 UoPN) lub MOŻLIWOŚĆ CAŁKOWITEGO UMORZENIA (art. 62a UoPN)';
      possibleSanctions.push(
        'Wypadek mniejszej wagi (art. 62 ust. 3 UoPN): grzywna, ograniczenie wolności lub więzienie do roku',
        'Warunkowe umorzenie postępowania na okres próby (art. 66 k.k.)',
        'Kara pozbawienia wolności w zawieszeniu lub SDE',
        'Nawiązka na cele walki z narkomanią do 50 000 zł'
      );
      mandatoryMeasures.push(
        'KLUCZOWA INSTYTUCJA – ART. 62a UoPN: Jeżeli przedmiotem czynu jest nieznaczna ilość marihuany lub innej substancji na własny użytek sprawcy, prokurator lub sąd może UMORZYĆ POSTĘPOWANIE jeszcze przed wydaniem postanowienia o wszczęciu dochodzenia!',
        'Umorzenie z art. 62a UoPN chroni przed wyrokiem skazującym i gwarantuje CZYSTĄ KARTOTEKĘ w rejestrze KRK!'
      );
      mitigatingFactors.push(
        'Znikoma ilość (np. do 1-2 gramów marihuany)',
        'Substancja wyłącznie na własny użytek (brak wagi dilerskiej, brak woreczków strunowych, brak gotówki w małych nominałach)',
        'Dotychczasowa całkowita niekaralność',
        'Dobrowolne wydanie środków i współpraca'
      );
      aggravatingFactors.push(
        'Posiadanie wagi elektronicznej, dużej liczby pustych woreczków (podejrzenie handlu z art. 59 UoPN)',
        'Udzielanie narkotyków innym osobom, zwłaszcza małoletnim',
        'Posiadanie znacznej ilości (art. 62 ust. 2 UoPN – kara od roku do 10 lat więzienia)'
      );
      plainExplanation =
        'W Polsce każde posiadanie narkotyków jest czynem zabronionym. Jednak przy niewielkiej ilości na własny użytek główną strategią obrony jest natychmiastowe złożenie wniosku o umorzenie z art. 62a UoPN, co pozwala zamknąć sprawę bez konsekwencji w kartotece karnej.';
      recommendedSteps.push(
        'Złóż oficjalny wniosek o umorzenie postępowania na podstawie art. 62a Ustawy o przeciwdziałaniu narkomanii.',
        'Wskaż, że ilość była nieznaczna, służyła wyłącznie na własny użytek rekreacyjny i brak jakichkolwiek znamion dystrybucji.',
        'Zabezpiecz zaświadczenie o zatrudnieniu i pozytywną opinię środowiskową.'
      );
    } else if (isDefamation) {
      riskLevel = 'średni';
      primarySentenceRange = 'Grzywna, ograniczenie wolności lub pozbawienie wolności do 1 roku (art. 212 § 2 k.k. – zniesławienie w internecie)';
      possibleSanctions.push(
        'Grzywna wymierzana w stawkach dziennych',
        'Kara ograniczenia wolności (prace społeczno-użyteczne)',
        'Kara pozbawienia wolności do roku przy typie kwalifikowanym w sieci',
        'Nawiązka finansowa na PCK lub cel społeczny do 100 000 zł'
      );
      mandatoryMeasures.push(
        'Sąd na wniosek pokrzywdzonego może orzec podanie wyroku do publicznej wiadomości (np. nakaz publikacji przeprosin na portalu lub profilu społecznościowym).'
      );
      mitigatingFactors.push(
        'Natychmiastowe usunięcie szkalującego wpisu, komentarza lub opinii',
        'Opublikowanie szczerych przeprosin i sprostowania',
        'Działanie pod wpływem prowokacji lub w usprawiedliwionej obronie społecznie uzasadnionego interesu (art. 213 k.k.)'
      );
      aggravatingFactors.push(
        'Działanie zaplanowane, seryjny hejt, tworzenie fałszywych profili',
        'Poważne zniszczenie reputacji zawodowej lub gospodarczej ofiary',
        'Odmowa usunięcia wpisu pomimo wezwania przedsądowego'
      );
      plainExplanation =
        'Zniesławienie w internecie (art. 212 § 2 k.k.) to przestępstwo ścigane z oskarżenia prywatnego. Anonimowość w sieci jest pozorna – policja na polecenie sądu ustala numery IP i dane abonenta. Najlepszym wyjściem jest ugoda i pojednanie podczas posiedzenia pojednawczego w sądzie.';
      recommendedSteps.push(
        'Usuń sporny wpis i zabezpiecz dowody na ewentualną prawdziwość zarzutów (dowód prawdy art. 213 k.k.).',
        'Zaproponuj pokrzywdzonemu ugodę na posiedzeniu pojednawczym w sądzie.',
        'Wnoś o warunkowe umorzenie postępowania (art. 66 k.k.) w razie braku porozumienia.'
      );
    } else if (isPropertyDamage) {
      const isOver800 = !testQ.includes('poniżej 800') && !testQ.includes('do 800') && !testQ.includes('drobne');
      riskLevel = isOver800 ? 'średni' : 'niski';
      primarySentenceRange = isOver800
        ? 'Pozbawienie wolności od 3 miesięcy do lat 5 (art. 288 § 1 k.k. powyżej 800 zł)'
        : 'Grzywna do 5000 zł, areszt lub ograniczenie wolności (art. 124 k.w. poniżej 800 zł)';
      possibleSanctions.push(
        isOver800
          ? 'Kara pozbawienia wolności, ograniczenie wolności lub grzywna (wypadek mniejszej wagi art. 288 § 2 k.k.)'
          : 'Grzywna w mandacie lub przed sądem za wykroczenie (art. 124 k.w.)',
        'Obligatoryjny obowiązek pełnego naprawienia szkody (art. 46 k.k. / art. 124 § 4 k.w.)'
      );
      mandatoryMeasures.push(
        'Próg przepołowienia: 800 zł. Szkoda wyceniona do 800 zł to WYKROCZENIE (brak wpisu do KRK). Szkoda powyżej 800 zł to PRZESTĘPSTWO z Kodeksu Karnego!'
      );
      mitigatingFactors.push(
        'Natychmiastowe pokrycie kosztów naprawy (np. zapłata za lakiernika/wymianę szyby)',
        'Działanie nieumyślne lub pod wpływem wzburzenia',
        'Pojednanie z właścicielem mienia'
      );
      aggravatingFactors.push(
        'Występek o charakterze chuligańskim',
        'Wysoka wartość szkody (powyżej 200 000 zł art. 294 k.k.)',
        'Użycie ognia lub materiałów łatwopalnych'
      );
      plainExplanation =
        'Zniszczenie mienia (np. porysowanie auta) jest kwalifikowane według wartości szkody. Granicą jest 800 zł. Pokrycie szkody pokrzywdzonemu na wczesnym etapie otwiera drogę do umorzenia sprawy lub uznania wypadku mniejszej wagi.';
      recommendedSteps.push(
        'Zweryfikuj kosztorys naprawy – poszkodowani i ubezpieczyciele często zawyżają koszty części.',
        'Wyrównaj rzeczywistą szkodę i podpisz porozumienie pojednawcze z właścicielem mienia.',
        'Wnoś o wypadek mniejszej wagi (art. 288 § 2 k.k.) lub umorzenie z art. 66 k.k.'
      );
    } else if (isCourtBanViolation) {
      riskLevel = 'bardzo wysoki';
      primarySentenceRange = 'Pozbawienie wolności od 3 miesięcy do lat 5 (art. 244 k.k.)';
      possibleSanctions.push(
        'Bezwzględna kara pozbawienia wolności (sądy rzadko orzekają zawieszenie przy łamaniu zakazów)',
        'Nowy, wydłużony zakaz prowadzenia pojazdów (często dożywotni)',
        'Świadczenie pieniężne na Fundusz Sprawiedliwości (min. 5 000 zł)'
      );
      mandatoryMeasures.push(
        'Naruszenie sądowego zakazu to przestępstwo przeciwko wymiarowi sprawiedliwości. Traktowane jest jako jawne lekceważenie prawa i państwa!'
      );
      mitigatingFactors.push(
        'Skrajny stan wyższej konieczności (ratowanie zdrowia ludzkiego)',
        'Prowadzenie pojazdu na odcinku kilkunastu metrów (np. przestawienie auta na parkingu)',
        'Niewiedza o uprawomocnieniu się wyroku (brak prawidłowego doręczenia)'
      );
      aggravatingFactors.push(
        'Kolejne złamanie zakazu (multirecydywa)',
        'Jazda pod wpływem alkoholu w trakcie zakazu',
        'Spowodowanie wypadku lub kolizji'
      );
      plainExplanation =
        'Jazda pomimo wyroku sądu zakazującego prowadzenia to art. 244 k.k. Grozi za to do 5 lat więzienia. Kluczowe jest zbadanie, czy orzeczenie o zakazie zostało prawidłowo doręczone i czy sprawca miał świadomość jego prawomocności.';
      recommendedSteps.push(
        'Sprawdź w aktach sprawy datę uprawomocnienia orzeczenia i zwrotne potwierdzenie odbioru (ZPO).',
        'Złóż wniosek o odbywanie kary w systemie dozoru elektronicznego (SDE).',
        'Konsultuj niezwłocznie linię obrony z adwokatem.'
      );
    } else {
      // Przypadek ogólny
      riskLevel = primary.isFelony ? 'bardzo wysoki' : 'średni';
      primarySentenceRange = primary.penalties.summary;
      possibleSanctions.push(primary.penalties.summary);
      if (primary.additionalSanctions) {
        mandatoryMeasures.push(...primary.additionalSanctions);
      }
      mitigatingFactors.push('Dotychczasowa niekaralność', 'Naprawienie szkody', 'Współpraca z organami ścigania');
      aggravatingFactors.push('Działanie zaplanowane', 'Wyrządzenie znacznej szkody majątkowej');
      plainExplanation = primary.plainSummary;
      recommendedSteps.push(
        'Skorzystaj z prawa do odmowy składania wyjaśnień do czasu konsultacji z adwokatem (art. 175 k.p.k.).',
        'Złóż wniosek o wgląd w akta sprawy.'
      );
    }

    // Dopasowanie powiązanych orzeczeń sądowych
    const similarRulings = allRulings.filter((ruling) => {
      return matchedArticles.some((a) => ruling.articleRef.includes(`Art. ${a.number}`));
    });

    return {
      matchedArticles,
      riskLevel,
      possibleSanctions,
      primarySentenceRange,
      mandatoryMeasures,
      mitigatingFactors,
      aggravatingFactors,
      plainExplanation,
      similarRulings: similarRulings.length > 0 ? similarRulings : [allRulings[0]],
      recommendedSteps,
    };
  }

  /**
   * Czat asystenta prawnego prawnBot – w 100% offline i darmowy.
   * Odpowiada prostym językiem prawniczym, cytuje artykuły i podaje praktyczne wskazówki.
   */
  generateChatResponse(userPrompt: string): ChatMessage {
    const q = userPrompt.toLowerCase().trim();
    let text = '';
    const referencedArticles: string[] = [];
    const referencedRulings: string[] = [];
    let suggestedFollowUps: string[] = [];
    let legalCategoryBadge: string | undefined = undefined;
    let actionQuery: string | undefined = undefined;

    // 1. ZAKŁÓCANIE CISZY NOCNEJ / SPOCZYNKU NOCNEGO (art. 51 k.w. vs art. 190a k.k. / art. 191 § 1a k.k.)
    if (
      q.includes('cisz') ||
      q.includes('nocn') ||
      q.includes('spoczynk') ||
      (q.includes('hałas') && (q.includes('noc') || q.includes('sąsiad') || q.includes('muzyk') || q.includes('imprez'))) ||
      q.includes('51 kw') ||
      q.includes('51 k.w')
    ) {
      referencedArticles.push('Art. 51 k.w.', 'Art. 190a k.k.', 'Art. 191 § 1a k.k.');
      referencedRulings.push('III KRN 189/92', 'I KZP 10/19');
      legalCategoryBadge = 'Kodeks Wykroczeń (art. 51 k.w.) & Kodeks Karny';
      actionQuery = 'Zakłócanie ciszy nocnej i spoczynku po 22:00 (art. 51 k.w.)';
      text = `**Co grozi za zakłócanie ciszy nocnej? Kompletna analiza prawno-karna:**

W polskim systemie prawnym termin „cisza nocna” jest pojęciem potocznym i regulaminowym. Ustawodawca w **art. 51 Kodeksu Wykroczeń (k.w.)** posługuje się terminem **„spoczynek nocny”** (zwyczajowo i w orzecznictwie przyjęte godziny **22:00 – 06:00**).

---

### 1. Kwalifikacja podstawowa: Kodeks Wykroczeń (art. 51 § 1 i § 2 k.w.)
Zgodnie z art. 51 § 1 k.w.: *Kto krzykiem, hałasem, alarmem lub innym wybrykiem zakłóca spokój, porządek publiczny, spoczynek nocny albo wywołuje zgorszenie w miejscu publicznym, podlega karze aresztu, ograniczenia wolności albo grzywny.*

**Jakie kary grożą w praktyce?**
- **Mandat karny od Policji lub Straży Miejskiej:** od **100 zł do 500 zł** (do **1 000 zł**, gdy zachodzi zbieg z innym wykroczeniem, np. spożywaniem alkoholu w miejscu publicznym lub odmową okazania dokumentu).
- **Przed Sądem Rejonowym (w razie odmowy mandatu):**
  - Grzywna od **20 zł do 5 000 zł**,
  - Kara **ograniczenia wolności** – 1 miesiąc (obowiązek 20–40 godzin prac społecznych),
  - Kara **aresztu** od **5 do 30 dni** (stosowana przy skrajnych wybrykach chuligańskich lub recydywie).
- **Zaostrzenie (§ 2):** Jeżeli czyn miał charakter chuligański lub sprawca był pod wpływem alkoholu/narkotyków, sąd orzeka areszt, ograniczenie wolności lub wysoką grzywnę.

---

### 2. Czysta kartoteka: Czy mandat lub grzywna trafia do rejestru karnego (KRK)?
**NIE!** Wykroczenie z art. 51 k.w. ukarane mandatem lub grzywną sądową **NIE jest wpisywane do Krajowego Rejestru Karnego (KRK)** w rejestrze osób skazanych za przestępstwa. Pobierając zaświadczenie o niekaralności z sądu, nadal masz **czystą kartotekę**! Jedynie kara aresztu za wykroczenie podlega wpisowi.

---

### 3. KIEDY SPRAWA ESKALUJE DO KODEKSU KARNEGO (Więzienie)?
Jeżeli zakłócanie ciszy nie jest pojedynczą imprezą, lecz celowym i systematycznym działaniem przeciwko sąsiadowi, sprawca odpowiada z **Kodeksu Karnego**:
1. **Art. 190a § 1 k.k. (Uporczywe nękanie / Stalking sąsiedzki):**
   - Celowe puszczanie głośnej muzyki, dudnienie basami, uderzanie w ściany/rury w celu udręczenia psychicznego sąsiada.
   - **Kara:** pozbawienie wolności **od 6 miesięcy do lat 8** oraz zakaz zbliżania się i kontaktowania! (potwierdza to uchwała SN *I KZP 10/19*).
2. **Art. 191 § 1a k.k. (Zmuszanie i utrudnianie korzystania z lokalu mieszkalnego):**
   - Stosowanie immisji hałasowych i wibracji uniemożliwiających normalne zamieszkiwanie.
   - **Kara:** pozbawienie wolności **do lat 3**.
3. **Art. 226 / 222 k.k.:**
   - Wszczęcie awantury z interweniującymi policjantami, wyzwiska lub szarpanie za mundur – przestępstwo przeciwko funkcjonariuszom (kara do 3 lat więzienia).

---

### 4. Orzecznictwo Sądu Najwyższego – Czym jest „wybryk”? (Wyrok SN III KRN 189/92)
Sąd Najwyższy jednoznacznie orzekł, że **zwykłe odgłosy życia codziennego NIE są wykroczeniem**:
- Płacz ząbkującego niemowlęcia lub małego dziecka,
- Chodzenie po skrzypiącym parkiecie lub korzystanie z łazienki w nocy,
- Pojedynczy upadek przedmiotu lub nagła awaria hydrauliczna,
- Uzasadnione prace remontowe prowadzone w ciągu dnia.
Wykroczeniem jest wyłącznie **„wybryk”** – czyn rażący, złośliwy lub demonstracyjnie lekceważący spokój innych (np. sprzęt audio na cały regulator po 22:00, krzyki z balkonu, rzucanie petard).

---

### 5. Rekomendowane kroki obronne:
1. **Podczas interwencji:** Zachowaj całkowity spokój, wylegitymuj się i natychmiast wycisz muzykę.
2. **Odmowa mandatu (art. 97 k.p.w.):** Jeżeli zarzut jest bezpodstawny (np. hałas dochodził z innej klatki lub nie stanowił wybryku), masz prawo odmówić przyjęcia mandatu. Sprawa trafi do Sądu Rejonowego, gdzie oskarżyciel musi udowodnić winę.
3. **Konflikt sąsiedzki:** Zaproponuj mediację sąsiedzką lub montaż mat wygłuszających, by wykluczyć zarzut stalkingu.`;
      suggestedFollowUps = [
        'Kiedy odmówić przyjęcia mandatu za hałas?',
        'Co zrobić, gdy to sąsiad złośliwie wzywa na mnie policję?',
        'Jaka jest granica między art. 51 k.w. a stalkingiem art. 190a k.k.?',
        'Czy remont w sobotę o 8:00 rano to wykroczenie?',
      ];
    } else if (
      q.includes('bez prawa jazdy') ||
      q.includes('bez uprawnień') ||
      q.includes('brak uprawnień') ||
      q.includes('brak prawa jazdy') ||
      q.includes('94 kw') ||
      q.includes('bez prawka')
    ) {
      referencedArticles.push('Art. 94 k.w.', 'Art. 244 k.k.');
      referencedRulings.push('I KZP 4/22');
      legalCategoryBadge = 'Kodeks Wykroczeń (art. 94 k.w.) & Kodeks Karny (art. 244 k.k.)';
      actionQuery = 'Prowadzenie bez uprawnień (art. 94 k.w., min. 1500 zł i zakaz)';
      text = `**Co grozi za jazdę bez prawa jazdy (brak uprawnień)?**

Od 1 stycznia 2022 r. przepisy uległy drastycznemu zaostrzeniu. Jazda bez uprawnień nie jest już drobnym mandatem 300–500 zł.

---

### 1. Kwalifikacja prawna: Art. 94 § 1 i § 3 Kodeksu Wykroczeń
- **Grzywna:** Sąd orzeka grzywnę w wysokości **od 1 500 zł do aż 30 000 zł** (art. 94 § 1 k.w.).
- **OBLIGATORYJNY ZAKAZ PROWADZENIA POJAZDÓW (art. 94 § 3 k.w.):**
  Sąd **ma bezwzględny ustawowy obowiązek** orzeczenia zakazu prowadzenia pojazdów na okres **od 6 miesięcy do 3 lat**!
  Potwierdziła to uchwała Sądu Najwyższego (*I KZP 4/22*) – sąd **nie może** darować zakazu ani odstąpić od jego wymierzenia!

---

### 2. Śmiertelna pułapka: Art. 244 Kodeksu Karnego!
Jeżeli kierowca zostanie ponownie zatrzymany w czasie, gdy obowiązuje orzeczony przez sąd zakaz – nie odpowiada już za wykroczenie!
Wypełnia znamiona **przestępstwa z art. 244 k.k. (złamanie zakazu sądowego)**:
- Kara: **od 3 miesięcy do 5 lat pozbawienia wolności**,
- Kolejny zakaz prowadzenia (nawet **dożywotni**),
- Wpis do Krajowego Rejestru Karnego (KRK) i status osoby skazanej.

---

### 3. Linia obrony:
- Jeżeli kierowałeś z powodu nagłego zagrożenia życia lub zdrowia (np. natychmiastowe zawiezienie chorego dziecka do szpitala) – powołaj się na **stan wyższej konieczności (art. 16 k.w.)**, co wyłącza bezprawność czynu.
- Wnoś o wymierzenie zakazu na minimalny dopuszczalny okres (6 miesięcy) oraz z ograniczeniem do konkretnej kategorii pojazdów.`;
      suggestedFollowUps = [
        'Czy zakaz z art. 94 k.w. obejmuje wszystkie kategorie praw jazdy?',
        'Co grozi za złamanie sądowego zakazu prowadzenia (art. 244 k.k.)?',
        'Czy można jeździć skuterem lub rowerem po orzeczeniu zakazu?',
      ];
    } else if (
      q.includes('marihuan') ||
      q.includes('narkotyk') ||
      q.includes('zioł') ||
      q.includes('trawk') ||
      q.includes('skręt') ||
      q.includes('62 uopn') ||
      q.includes('62a')
    ) {
      referencedArticles.push('Art. 62 UoPN', 'Art. 62a UoPN', 'Art. 66 k.k.');
      legalCategoryBadge = 'Ustawa o Przeciwdziałaniu Narkomanii (UoPN)';
      actionQuery = 'Posiadanie marihuany na własny użytek (art. 62a UoPN)';
      text = `**Co grozi za posiadanie marihuany lub narkotyków w Polsce?**

W polskim prawie posiadanie nawet śladowej ilości substancji zabronionej (np. 0.5g marihuany) jest formalnie przestępstwem z **Ustawy o przeciwdziałaniu narkomanii (UoPN)**. Istnieją jednak kluczowe instytucje chroniące przed więzieniem i wpisem do rejestru skazanych.

---

### 1. Kwalifikacja podstawowa:
- **Art. 62 ust. 1 UoPN (Typ podstawowy):** Kara pozbawienia wolności **do lat 3**.
- **Art. 62 ust. 3 UoPN (Wypadek mniejszej wagi):** Grzywna, ograniczenie wolności lub więzienie **do roku**.

---

### 2. KLUCZ DO CZYSTEJ KARTOTEKI: Art. 62a UoPN (Umorzenie na własny użytek)
Zgodnie z art. 62a UoPN, jeżeli:
1. Przedmiotem czynu są środki odurzające w **ilości nieznacznej** (np. 1–2 gramy marihuany),
2. Substancja była przeznaczona **wyłącznie na własny użytek**,
3. Stopień społecznej szkodliwości czynu nie jest znaczny,
**prokurator lub sąd może UMORZYĆ postępowanie** również przed wydaniem postanowienia o wszczęciu śledztwa lub dochodzenia!
*Skutek:* Brak wyroku, brak kary i **bezwzględnie czysta kartoteka w Krajowym Rejestrze Karnym (KRK)**!

---

### 3. Kiedy grozi surowe więzienie?
- Posiadanie wagi dilerskiej, wielu pustych woreczków strunowych i gotówki – podejrzenie handlu/udzielania (art. 58 lub 59 UoPN – kara do 10 lat więzienia).
- Posiadanie znacznej ilości (art. 62 ust. 2 UoPN – kara od 1 roku do 10 lat więzienia).

---

### 4. Praktyczna strategia adwokacka:
- Złóż formalny wniosek o umorzenie postępowania na podstawie **art. 62a UoPN**.
- Konsekwentnie podtrzymuj, że susz służył wyłącznie na użytek własny i nie miał być nikomu udostępniany.
- W razie odmowy umorzenia z art. 62a walcz o **warunkowe umorzenie postępowania (art. 66 k.k.)**.`;
      suggestedFollowUps = [
        'Jaka ilość marihuany jest uznawana za „nieznaczną” w sądach?',
        'Co grozi za jazdę pod wpływem THC (marihuany)?',
        'Czy medyczna marihuana na receptę zwalnia z odpowiedzialności?',
      ];
    } else if (
      q.includes('zniesław') ||
      q.includes('pomów') ||
      q.includes('hejt') ||
      q.includes('oczern') ||
      q.includes('w internecie') ||
      q.includes('facebook') ||
      q.includes('opinia google') ||
      q.includes('212')
    ) {
      referencedArticles.push('Art. 212 k.k.', 'Art. 213 k.k.', 'Art. 216 k.k.');
      referencedRulings.push('IV KK 23/21');
      legalCategoryBadge = 'Kodeks Karny (art. 212 k.k. - Zniesławienie)';
      actionQuery = 'Zniesławienie i hejt na forach internetowych (art. 212 k.k.)';
      text = `**Co grozi za hejt, zniesławienie i pomówienie w internecie? (Art. 212 k.k.)**

Hejt internetowy, publikacja fałszywych oskarżeń na forach, grupach na Facebooku czy w opiniach Google podlega odpowiedzialności karnej.

---

### 1. Kwalifikacja prawna:
- **Art. 212 § 1 k.k. (Typ podstawowy):** Grzywna albo kara ograniczenia wolności.
- **Art. 212 § 2 k.k. (Typ kwalifikowany – środki masowego komunikowania, w tym internet):**
  Grzywna, kara ograniczenia wolności albo **kara pozbawienia wolności do roku**!

---

### 2. Sankcje dodatkowe i finansowe:
- **Nawiązka (art. 212 § 3 k.k.):** Sąd może orzec nawiązkę na rzecz pokrzywdzonego, Polskiego Czerwonego Krzyża (PCK) lub inny cel społeczny w kwocie aż **do 100 000 zł**.
- **Podanie wyroku do publicznej wiadomości:** Nakaz publikacji przeprosin na profilu społecznościowym lub portalu.

---

### 3. Pozorna anonimowość w sieci:
Sąd Najwyższy w wyroku *IV KK 23/21* potwierdził, że posługiwanie się fikcyjnym kontem lub pseudonimem w żaden sposób nie zwalnia z odpowiedzialności karnej. Na polecenie sądu organy ścigania ustalają adres IP i dane abonenta u operatora telekomunikacyjnego.

---

### 4. Linia obrony (Art. 213 k.k. – Kontratyp prawdy):
- Nie popełnia przestępstwa, kto publicznie podnosi lub rozgłasza **prawdziwy zarzut** dotyczący osoby pełniącej funkcję publiczną lub służący obronie społecznie uzasadnionego interesu.
- W pozostałych sprawach najskuteczniejszą drogą jest natychmiastowe usunięcie wpisu, publikacja sprostowania i zawarcie ugody na sądowym posiedzeniu pojednawczym.`;
      suggestedFollowUps = [
        'Czym różni się zniesławienie (art. 212 k.k.) od zniewagi (art. 216 k.k.)?',
        'Jak policja ustala autora anonimowego komentarza w internecie?',
        'Czy negatywna opinia w Google Maps to przestępstwo?',
      ];
    } else if (
      q.includes('zniszcz') ||
      q.includes('uszkodz') ||
      q.includes('porysow') ||
      q.includes('szyb') ||
      q.includes('graffiti') ||
      q.includes('dewast') ||
      q.includes('288')
    ) {
      referencedArticles.push('Art. 288 k.k.', 'Art. 124 k.w.', 'Art. 46 k.k.');
      legalCategoryBadge = 'Kodeks Karny (art. 288 k.k.) & Kodeks Wykroczeń (art. 124 k.w.)';
      actionQuery = 'Zniszczenie mienia i porysowanie samochodu (art. 288 k.k.)';
      text = `**Co grozi za zniszczenie cudzego mienia (np. porysowanie auta, wybicie szyby)?**

Od 1 października 2023 r. obowiązuje nowy próg przepołowienia wynoszący dokładnie **800 zł**.

---

### 1. Wartość szkody POWYŻEJ 800 zł – Przestępstwo (Art. 288 k.k.):
- **Typ podstawowy (art. 288 § 1 k.k.):** Kara pozbawienia wolności **od 3 miesięcy do 5 lat**.
- **Wypadek mniejszej wagi (art. 288 § 2 k.k.):** Grzywna, kara ograniczenia wolności albo pozbawienia wolności **do roku**.
- **Obligatoryjny obowiązek naprawienia szkody (art. 46 k.k.):** Pokrycie pełnego kosztu lakierowania, wymiany podzespołów lub zakupu nowej rzeczy.

---

### 2. Wartość szkody DO 800 zł – Wykroczenie (Art. 124 k.w.):
- Kara aresztu, ograniczenia wolności albo grzywny do 5 000 zł.
- **Brak wpisu do rejestru skazanych KRK!**

---

### 3. Strategia obrony:
1. **Weryfikacja wyceny szkody:** Poszkodowani i ASO często zawyżają koszty lakierowania (np. żądają lakierowania całego elementu za 1500 zł, podczas gdy polerowanie kosztuje 400 zł). Zbicie wyceny poniżej 800 zł ratuje przed statusem przestępcy!
2. **Natychmiastowe porozumienie pojednawcze:** Pokrycie szkody poszkodowanemu pozwala zamknąć sprawę bez wyroku na podstawie warunkowego umorzenia (art. 66 k.k.).`;
      suggestedFollowUps = [
        'Jak podważyć wycenę szkody sporządzoną przez ubezpieczyciela?',
        'Czy porysowanie auta można zakończyć ugodą bez sądu?',
        'Co to jest wypadek mniejszej wagi z art. 288 § 2 k.k.?',
      ];
    } else if (
      q.includes('złamanie zakazu') ||
      q.includes('zakaz sądowy') ||
      q.includes('pomimo zakazu') ||
      q.includes('wbrew zakazowi') ||
      q.includes('244')
    ) {
      referencedArticles.push('Art. 244 k.k.', 'Art. 43a k.k.w.');
      legalCategoryBadge = 'Kodeks Karny (art. 244 k.k. - Wymiar Sprawiedliwości)';
      actionQuery = 'Złamanie sądowego zakazu prowadzenia pojazdów (art. 244 k.k.)';
      text = `**Co grozi za niestosowanie się do orzeczonego zakazu sądowego? (Art. 244 k.k.)**

Złamanie orzeczonego przez sąd zakazu (najczęściej zakazu prowadzenia pojazdów, zakazu zbliżania się lub zakazu zajmowania stanowiska) to przestępstwo przeciwko wymiarowi sprawiedliwości.

---

### 1. Zagrożenie ustawowe:
- **Kara:** pozbawienie wolności **od 3 miesięcy do 5 lat**.
- Sądy w Polsce traktują ten czyn bardzo rygorystycznie – w przypadku ponownej jazdy pod wpływem lub w okresie zakazu bardzo rzadko stosuje się warunkowe zawieszenie kary.

---

### 2. Sankcje dodatkowe:
- **Kolejny, wydłużony zakaz prowadzenia pojazdów** (często dożywotni),
- **Świadczenie pieniężne na Fundusz Sprawiedliwości:** minimum **5 000 zł** (przy recydywie min. 10 000 zł).

---

### 3. Szanse na obronę:
- Zbadanie prawidłowości doręczenia orzeczenia – jeśli wyrok zapadł zaocznie i nie został prawidłowo doręczony, można wykazywać brak zamiaru umyślnego.
- W razie wyroku skazującego do 1 roku i 6 miesięcy: natychmiastowy wniosek o **odbywanie kary w Systemie Dozoru Elektronicznego (SDE - opaska w domu)** wraz z wnioskiem o wstrzymanie wykonania kary.`;
      suggestedFollowUps = [
        'Jak uzyskać dozór elektroniczny (SDE) za art. 244 k.k.?',
        'Czy po upływie zakazu trzeba zdawać egzamin na prawo jazdy?',
        'Co jeśli prowadziłem w stanie wyższej konieczności?',
      ];
    } else if (
      q.includes('pościg') ||
      (q.includes('ucieczk') && (q.includes('policj') || q.includes('radiowóz') || q.includes('kontrol'))) ||
      q.includes('178b')
    ) {
      referencedArticles.push('Art. 178b k.k.', 'Art. 42 § 1a k.k.');
      legalCategoryBadge = 'Kodeks Karny (art. 178b k.k. - Ucieczka przed policją)';
      actionQuery = 'Ucieczka przed radiowozem policyjnym na sygnałach (art. 178b k.k.)';
      text = `**Co grozi za niezatrzymanie się do kontroli i ucieczkę przed pościgiem policyjnym? (Art. 178b k.k.)**

Ucieczka przed policją to w polskim prawie od 2017 roku **przestępstwo** (nie wykroczenie!), za które nie ma mandatu – sprawa zawsze trafia do sądu karnego!

---

### 1. Zagrożenie ustawowe:
- **Kara pozbawienia wolności:** od **3 miesięcy do lat 5**.
- **Obligatoryjny zakaz prowadzenia wszelkich pojazdów mechanicznych:** na okres **od 1 roku do 15 lat** (art. 42 § 1a k.k.) – sąd NIE MOŻE zrezygnować z zakazu!
- **Wpis do Krajowego Rejestru Karnego (KRK):** utrata statusu osoby niekaranej.

---

### 2. Kiedy czyn stanowi przestępstwo z art. 178b k.k.?
Warunkiem skazania jest jednoczesne wystąpienie sygnałów:
1. Radiowóz/pojazd policji używał **sygnałów świetlnych (niebieskie błyski)** oraz **dźwiękowych (syrena)**.
2. Funkcjonariusz wydał wyraźne polecenie zatrzymania, a kierowca kontynuował ucieczkę.
*Uwaga:* Jeśli policjant machał jedynie tarczą („lizakiem”) z pobocza bez pościgu na sygnałach, jest to wykroczenie z art. 92 § 2 k.w. (grzywna lub areszt), a nie przestępstwo z art. 178b k.k.!

---

### 3. Skuteczna linia obrony:
- **Brak dostrzeżenia sygnałów:** Wykazywanie złej widoczności, głośnej muzyki w aucie, ukształtowania terenu (brak zamiaru umyślnego ucieczki).
- **Zatrzymanie w bezpiecznym miejscu:** Wykazywanie, że kierowca nie uciekał, lecz szukał oświetlonego, bezpiecznego zjazdu/stacji benzynowej.
- **Walka o warunkowe umorzenie (art. 66 k.k.):** W wyjątkowych sytuacjach dla osób dotychczas niekaranych, by uratować prawo jazdy.`;
      suggestedFollowUps = [
        'Czym różni się ucieczka (art. 178b k.k.) od niezastosowania się do lizaka (art. 92 k.w.)?',
        'Czy można uratować prawo jazdy przy art. 178b k.k.?',
        'Jakie nagrania z wideorejestratora radiowozu zabezpieczyć?',
      ];
    } else if (
      q.includes('wypadk') ||
      q.includes('potrąc') ||
      (q.includes('ucieczk') && (q.includes('miejsca') || q.includes('kolizj'))) ||
      q.includes('177') ||
      q.includes('178')
    ) {
      referencedArticles.push('Art. 177 k.k.', 'Art. 178 k.k.', 'Art. 42 § 3 k.k.');
      legalCategoryBadge = 'Kodeks Karny (art. 177 & 178 k.k. - Wypadek i Ucieczka)';
      actionQuery = 'Wypadek drogowy i ucieczka z miejsca zdarzenia (art. 177 i 178 k.k.)';
      text = `**Co grozi za spowodowanie wypadku i ucieczkę z miejsca zdarzenia? (Art. 177 & 178 k.k.)**

Polskie prawo traktuje ucieczkę z miejsca wypadku na równi z jazdą w stanie głębokiego upojenia alkoholowego!

---

### 1. Kiedy zderzenie to kolizja (wykroczenie), a kiedy wypadek (przestępstwo)?
- **Kolizja (art. 86 k.w.):** Uszkodzenia aut lub obrażenia ciała u poszkodowanych trwające **do 7 dni** (mandat lub grzywna, brak KRK).
- **Wypadek (art. 177 § 1 k.k.):** Rozstrój zdrowia poszkodowanego trwający **powyżej 7 dni** (np. złamanie, skręcenie, wstrząśnienie mózgu) – kara do 3 lat więzienia.
- **Wypadek ciężki / śmiertelny (art. 177 § 2 k.k.):** Śmierć lub ciężki uszczerbek – kara od 6 miesięcy do 8 lat więzienia.

---

### 2. Zaostrzenie z art. 178 k.k. za UCIECZKĘ z miejsca wypadku:
- W wypadkach ze skutkiem śmiertelnym lub ciężkim uszczerbkiem przy ucieczce sprawcy grozi kara **od 5 do 20 lat bezwzględnego więzienia**!
- **Obligatoryjny dożywotni zakaz prowadzenia pojazdów** (art. 42 § 3 k.k.).
- **Regres ubezpieczeniowy (Ubezpieczeniowy Fundusz Gwarancyjny / OC):** Ubezpieczyciel wypłaci odszkodowanie ofierze, a następnie ściągnie od sprawcy całą kwotę (często setki tysięcy lub miliony złotych!).

---

### 3. Obrona i pierwsze kroki:
- Natychmiastowe zgłoszenie się na policję z adwokatem – wyjaśnienie, że oddalenie się wynikało z **szoku powypadkowego** lub konieczności wezwania pomocy medycznej, a nie z chęci uniknięcia odpowiedzialności.`;
      suggestedFollowUps = [
        'Co to jest szok powypadkowy a ucieczka z miejsca zdarzenia?',
        'Jak ubezpieczyciel dochodzi regresu za ucieczkę?',
        'Kiedy obrażenia ciała przekraczają próg 7 dni?',
      ];
    } else if (
      q.includes('nieudzielenie pomocy') ||
      (q.includes('pomoc') && (q.includes('nie udzieliłem') || q.includes('nie pomógł') || q.includes('zostawił rann'))) ||
      q.includes('162')
    ) {
      referencedArticles.push('Art. 162 k.k.');
      legalCategoryBadge = 'Kodeks Karny (art. 162 k.k. - Nieudzielenie Pomocy)';
      actionQuery = 'Nieudzielenie pomocy osobie w bezpośrednim niebezpieczeństwie (art. 162 k.k.)';
      text = `**Co grozi za nieudzielenie pomocy człowiekowi w niebezpieczeństwie? (Art. 162 k.k.)**

W Polsce istnieje powszechny prawny obowiązek ratowania każdego człowieka znajdującego się w bezpośrednim zagrożeniu utraty życia lub ciężkiego uszczerbku na zdrowiu.

---

### 1. Zagrożenie karą:
- Kara pozbawienia wolności **do lat 3**.
- Wpis do rejestru skazanych KRK.

---

### 2. Jak spełnić obowiązek i uniknąć odpowiedzialności?
- Wystarczy **wybrać numer alarmowy 112** i powiadomić służby ratunkowe podając lokalizację zdarzenia! Prawo NIE wymaga narażania własnego życia (np. wchodzenia do płonącego auta lub na cienki lód).
- **Wyłączenie odpowiedzialności (art. 162 § 2 k.k.):** Nie popełnia przestępstwa ten, kto nie udziela pomocy, do której konieczny jest zabieg medyczny, albo gdy na miejscu są już wykwalifikowane służby (pogotowie, straż, policja).

---

### 3. Linia obrony:
- Wykazanie, że świadek był przekonany, że poszkodowany ma już zapewnioną pomoc innych osób.
- Wykazanie uzasadnionego lęku przed agresją poszkodowanego lub zagrożeniem własnego życia.`;
      suggestedFollowUps = [
        'Czy telefon na 112 zwalnia z odpowiedzialności za art. 162 k.k.?',
        'Czy świadek wypadku ma obowiązek reanimacji?',
        'Kiedy zachodzi stan wyższej konieczności?',
      ];
    } else if (
      q.includes('fałszowan') ||
      q.includes('podrob') ||
      q.includes('podpis') ||
      q.includes('lewe l4') ||
      q.includes('fałszywe l4') ||
      q.includes('270')
    ) {
      referencedArticles.push('Art. 270 k.k.');
      referencedRulings.push('II KK 219/22');
      legalCategoryBadge = 'Kodeks Karny (art. 270 k.k. - Fałszerstwo dokumentów)';
      actionQuery = 'Podrobienie podpisu na umowie lub posłużenie się fałszywym L4 (art. 270 k.k.)';
      text = `**Co grozi za podrobienie podpisu lub sfałszowanie dokumentu? (Art. 270 k.k.)**

Uwaga na powszechny mit: **Zgoda męża, żony, rodzica czy szefa na podpisanie się ich nazwiskiem NIE LEGALIZUJE czynu!** Sąd Najwyższy wielokrotnie orzekał, że podrobienie cudzego podpisu nawet za wiedzą i aprobatą tej osoby pozostaje przestępstwem z art. 270 k.k.

---

### 1. Zagrożenie ustawowe:
- **Typ podstawowy (art. 270 § 1 k.k.):** Grzywna, kara ograniczenia wolności albo **kara pozbawienia wolności od 3 miesięcy do lat 5**.
- **Wypadek mniejszej wagi (art. 270 § 2a k.k.):** Grzywna, ograniczenie wolności lub więzienie **do lat 2**.
- Przestępstwem jest zarówno samo podrobienie, jak i **użycie** sfałszowanego dokumentu (np. przedłożenie w urzędzie, banku, ZUS czy u pracodawcy).

---

### 2. Typowe sytuacje:
- **Podpisanie odbioru paczki / umowy za małżonka:** Z punktu widzenia prawa karnego to fałszerstwo materialne. Należy podpisywać się zawsze WŁASNYM imieniem i nazwiskiem ze wskazaniem upoważnienia (np. *„Jan Kowalski z up. Anny Kowalskiej”*).
- **Kupno lewego zwolnienia lekarskiego (L4):** Zbieg przestępstwa z art. 270 k.k. oraz wyłudzenia zasiłku z ZUS (art. 286 k.k. – oszustwo).

---

### 3. Linia obrony w sprawach o podrobienie:
1. Wnoszenie o uznanie czynu za **wypadek mniejszej wagi (art. 270 § 2a k.k.)** z uwagi na brak zamiaru wyrządzenia szkody finansowej.
2. Złożenie wniosku o **warunkowe umorzenie postępowania (art. 66 k.k.)** – idealna ścieżka dla osób niekaranych, pozwalająca zachować czystą kartotekę w KRK.`;
      suggestedFollowUps = [
        'Czy podpisanie się za żonę za jej zgodą to przestępstwo?',
        'Co grozi pracownikowi za lewe L4 kupione w internecie?',
        'Jak uzyskać warunkowe umorzenie za podrobienie podpisu?',
      ];
    } else if (
      q.includes('przywłaszcz') ||
      q.includes('znaleziony telefon') ||
      q.includes('znaleziony portfel') ||
      q.includes('znalezione nie kradzione') ||
      q.includes('sprzeniewierz') ||
      q.includes('284')
    ) {
      referencedArticles.push('Art. 284 k.k.', 'Art. 119 k.w.');
      legalCategoryBadge = 'Kodeks Karny (art. 284 k.k.) & Wykroczenia (art. 119 k.w.)';
      actionQuery = 'Przywłaszczenie znalezionego telefonu lub portfela (art. 284 k.k.)';
      text = `**Co grozi za przywłaszczenie rzeczy znalezionej (np. telefonu, portfela, gotówki)?**

Zasada „znalezione nie kradzione” to **całkowity mit prawny**. Zatrzymanie dla siebie znalezionego przedmiotu jest czynem zabronionym!

---

### 1. Kwalifikacja prawna w zależności od wartości (próg 800 zł):
- **Wartość do 800 zł – Wykroczenie (art. 119 § 1 k.w.):** Kara grzywny do 5 000 zł lub areszt. Brak wpisu do KRK.
- **Wartość powyżej 800 zł – Przestępstwo przywłaszczenia rzeczy znalezionej (art. 284 § 3 k.k.):** Grzywna, ograniczenie wolności albo **kara pozbawienia wolności do roku**.
- **Sprzeniewierzenie rzeczy powierzonej (art. 284 § 2 k.k., np. auto z leasingu, laptop służbowy):** Kara **od 3 miesięcy do 5 lat więzienia**!

---

### 2. Jak namierza policja?
W przypadku telefonów komórkowych operatorzy na wniosek policji natychmiast namierzają **numer IMEI** po zalogowaniu nowej karty SIM lub podłączeniu do sieci Wi-Fi. Zatrzymanie następuje najczęściej w miejscu zamieszkania.

---

### 3. Jak wyjść z sytuacji bez wyroku?
- **Natychmiastowy zwrot rzeczy:** Złożenie rzeczy do Biura Rzeczy Znalezionych lub na komendzie z oświadczeniem, że poszukiwano właściciela.
- **Czynny żal i naprawienie szkody:** Zwrot telefonu pokrzywdzonemu przed skierowaniem aktu oskarżenia skutkuje zazwyczaj wnioskiem o **umorzenie postępowania** z uwagi na znikomą szkodliwość społeczną (art. 1 § 2 k.k.) lub warunkowym umorzeniem (art. 66 k.k.).`;
      suggestedFollowUps = [
        'Jak policja namierza znaleziony smartfon po numerze IMEI?',
        'Jaki jest legalny termin na oddanie znalezionej rzeczy?',
        'Co grozi za przywłaszczenie leasingowanego samochodu?',
      ];
    } else if (
      q.includes('paser') ||
      q.includes('kupiłem kradzion') ||
      q.includes('kradziony rower') ||
      q.includes('kradziony telefon') ||
      q.includes('291') ||
      q.includes('292')
    ) {
      referencedArticles.push('Art. 291 k.k.', 'Art. 292 k.k.');
      legalCategoryBadge = 'Kodeks Karny (art. 291 & 292 k.k. - Paserstwo)';
      actionQuery = 'Paserstwo umyślne i nieumyślne – kupno rzeczy kradzionej (art. 291 k.k.)';
      text = `**Co grozi za kupno lub przyjęcie rzeczy pochodzącej z kradzieży? (Art. 291 i 292 k.k.)**

Kupno okazyjnego telefonu, roweru, laptopa lub części samochodowych bez sprawdzenia pochodzenia rodzi poważną odpowiedzialność karną.

---

### 1. Paserstwo umyślne vs nieumyślne:
- **Paserstwo umyślne (art. 291 § 1 k.k.):** Sprawca wiedział, że rzecz pochodzi z przestępstwa. Zagrożenie karą: **od 3 miesięcy do 5 lat pozbawienia wolności**.
- **Paserstwo nieumyślne (art. 292 § 1 k.k.):** Sprawca nie wiedział, ale na podstawie okoliczności (np. brak pudełka, brak ładowarki, cena 400 zł za telefon warty 3500 zł, transakcja na parkingu w nocy) **powinien i mógł przypuszczać**, że rzecz została skradziona. Zagrożenie karą: grzywna, ograniczenie wolności lub **pozbawienie wolności do lat 2**.

---

### 2. Konsekwencje majątkowe:
- Skradziona rzecz zostaje **odebrana przez policję i zwrócona prawowitemu właścicielowi** – nabywca traci zarówno przedmiot, jak i zapłacone pieniądze!

---

### 3. Linia obrony:
- Wykazywanie dochowania należytej staranności: zabezpieczenie dowodu zakupu (umowa kupna-sprzedaży, przelew bankowy, korespondencja na portalu OLX/Vinted).
- Złożenie wyjaśnień świadczących o braku jakichkolwiek podejrzeń co do legalności przedmiotu.`;
      suggestedFollowUps = [
        'Kiedy sąd uznaje cenę za rażąco zaniżoną w paserstwie?',
        'Czy tracę pieniądze, jeśli kupiłem skradziony rower w dobrej wierze?',
        'Jak zabezpieczyć się przed paserstwem kupując z drugiej ręki?',
      ];
    } else if (
      q.includes('łapówk') ||
      q.includes('przekup') ||
      q.includes('w łapę') ||
      q.includes('policjantowi') ||
      q.includes('229')
    ) {
      referencedArticles.push('Art. 229 k.k.');
      legalCategoryBadge = 'Kodeks Karny (art. 229 k.k. - Korupcja / Łapownictwo)';
      actionQuery = 'Wręczenie korzyści majątkowej funkcjonariuszowi policji (art. 229 k.k.)';
      text = `**Co grozi za próbę wręczenia łapówki policjantowi lub urzędnikowi? (Art. 229 k.k.)**

Propozycja „dogadania się” podczas kontroli drogowej i włożenie banknotu do dowodu rejestracyjnego to jedno z najsurowiej ściganych przestępstw korupcyjnych w Polsce.

---

### 1. Zagrożenie ustawowe:
- **Typ podstawowy (art. 229 § 1 k.k.):** Kara pozbawienia wolności **od 6 miesięcy do lat 8**.
- **W celu skłonienia do złamania prawa (§ 3, np. puszczenie pijanego kierowcy lub brak punktów):** Kara pozbawienia wolności **od roku do lat 10**!
- Radiowozy policyjne są wyposażone w kamery i mikrofony rejestrujące przebieg interwencji – próba wręczenia pieniędzy natychmiast kończy się zatrzymaniem w areszcie (art. 244 k.p.k.).

---

### 2. Klauzula bezkarności (Art. 229 § 6 k.k.):
Sprawca wręczenia łapówki **NIE PODLEGA KARZE**, jeżeli korzyść została przyjęta, a sprawca sam zawiadomił policję lub prokuraturę i ujawnił wszystkie okoliczności, **zanim organ ścigania się o tym dowiedział**!

---

### 3. Strategia obrony w razie zarzutu:
- Wykazywanie braku intencji korupcyjnej (np. omyłkowe pozostawienie pieniędzy w etui dokumentów bez słownej propozycji odstąpienia od czynności).
- W razie udowodnionego czynu: wniosek o nadzwyczajne złagodzenie kary lub warunkowe zawieszenie.`;
      suggestedFollowUps = [
        'Jak działa klauzula niekaralności z art. 229 § 6 k.k.?',
        'Co jeśli pieniądze w dokumentach leżały tam przez przypadek?',
        'Czy policjant ma obowiązek nagrywać kontrolę drogową?',
      ];
    } else if (
      q.includes('fałszywe zeznan') ||
      q.includes('kłamałem na policji') ||
      q.includes('kłamstwo w sądzie') ||
      q.includes('zataił prawd') ||
      q.includes('233')
    ) {
      referencedArticles.push('Art. 233 k.k.');
      legalCategoryBadge = 'Kodeks Karny (art. 233 k.k. - Fałszywe zeznania)';
      actionQuery = 'Składanie fałszywych zeznań przed policją lub sądem (art. 233 k.k.)';
      text = `**Co grozi za składanie fałszywych zeznań i kłamstwo przed sądem lub policją? (Art. 233 k.k.)**

Świadek pouczony o odpowiedzialności karnej z art. 233 k.k. ma bezwzględny obowiązek mówienia prawdy. Za kłamstwo lub zatajenie prawdy grozi surowe więzienie!

---

### 1. Wymiar kary:
- **Typ podstawowy (art. 233 § 1 k.k.):** Kara pozbawienia wolności **od 6 miesięcy do lat 8**.
- **Kłamstwo ze strachu przed odpowiedzialnością grożącą sobie lub bliskim (§ 1a):** Kara pozbawienia wolności **od 3 miesięcy do lat 5**.

---

### 2. Różnica: PODEJRZANY a ŚWIADEK:
- **Podejrzany / Oskarżony:** Ma konstytucyjne prawo do obrony i **nie ponosi odpowiedzialności karnej za kłamstwo** ani odmowę odpowiedzi (art. 175 k.p.k.).
- **Świadek:** Ma obowiązek mówić prawdę. Jeśli jednak odpowiedź mogłaby narazić świadka lub osobę najbliższą na odpowiedzialność karną, świadek ma prawo **uchylić się od odpowiedzi na to pytanie (art. 183 § 1 k.p.k.)** zamiast kłamać!

---

### 3. Złota szansa: Sprostowanie fałszywych zeznań (Art. 233 § 5 k.k.):
Sąd może zastosować **nadzwyczajne złagodzenie kary, a nawet odstąpić od jej wymierzenia**, jeżeli sprawca dobrowolnie sprostuje fałszywe zeznanie, ZANIM zapadnie rozstrzygnięcie sprawy. Natychmiastowe złożenie pisemnego sprostowania z adwokatem jest jedynym bezpiecznym ratunkiem.`;
      suggestedFollowUps = [
        'Jak skorzystać z art. 183 k.p.k. i odmówić odpowiedzi na pytanie?',
        'Co zrobić, jeśli już skłamałem w protokole przesłuchania?',
        'Czy podejrzany może kłamać w obronie własnej?',
      ];
    } else if (
      q.includes('ukrywanie majątku') ||
      q.includes('przepisanie na żonę') ||
      q.includes('darowizna przed długami') ||
      (q.includes('komornik') && (q.includes('uciec') || q.includes('ukryć') || q.includes('mająt'))) ||
      q.includes('300')
    ) {
      referencedArticles.push('Art. 300 k.k.', 'Art. 527 k.c.');
      legalCategoryBadge = 'Kodeks Karny (art. 300 k.k. - Ochrona Wierzycieli)';
      actionQuery = 'Ukrywanie majątku przed egzekucją komorniczą (art. 300 k.k.)';
      text = `**Co grozi za przepisywanie majątku i ukrywanie pieniędzy przed komornikiem? (Art. 300 k.k.)**

Przepisanie mieszkania, darowizna samochodu na członka rodziny lub wypłata gotówki w celu udaremnienia egzekucji długu to przestępstwo gospodarcze.

---

### 1. Zagrożenie karą z art. 300 k.k.:
- **W razie grożącej niewypłacalności (art. 300 § 1 k.k.):** Kara pozbawienia wolności **do lat 3**.
- **W celu udaremnienia wykonania orzeczenia sądu (art. 300 § 2 k.k., po wyroku lub w trakcie komornika):** Kara pozbawienia wolności **od 3 miesięcy do lat 5**.
- Ściganiu podlega również osoba, która przyjęła darowiznę lub fikcyjnie nabyła majątek wiedząc o długach (pomocnictwo).

---

### 2. Płaszczyzna cywilna – Skarga Pauliańska (art. 527 k.c.):
Wierzyciel w sądzie cywilnym wytacza powództwo ze skargi pauliańskiej. Czynność darowizny zostaje uznana za **bezskuteczną wobec wierzyciela**, a komornik licytuje przepisany dom czy auto z majątku obdarowanego członka rodziny!

---

### 3. Legalne rozwiązania problemów z długami:
- Zamiast fikcyjnego ukrywania majątku: **Upadłość konsumencka** (całkowite legalne umorzenie długów przez sąd upadłościowy).
- Restrukturyzacja zadłużenia i zawarcie ugody z wierzycielem przy udziale mediatora.`;
      suggestedFollowUps = [
        'Jak działa skarga pauliańska (art. 527 k.c.) w praktyce?',
        'Czy upadłość konsumencka chroni przed art. 300 k.k.?',
        'Kiedy darowizna nie stanowi przestępstwa ukrywania majątku?',
      ];
    } else if (
      q.includes('uderz') ||
      q.includes('pobił') ||
      q.includes('złamanie nosa') ||
      q.includes('uszczerbek') ||
      q.includes('157') ||
      q.includes('156')
    ) {
      referencedArticles.push('Art. 157 k.k.', 'Art. 156 k.k.', 'Art. 46 k.k.');
      legalCategoryBadge = 'Kodeks Karny (art. 157 & 156 k.k. - Uszkodzenie ciała)';
      actionQuery = 'Pobicie, złamanie nosa i rozstrój zdrowia (art. 157 k.k.)';
      text = `**Co grozi za uderzenie, uszkodzenie ciała i rozstrój zdrowia? (Art. 156 & 157 k.k.)**

W prawie karnym kluczem do kwalifikacji każdego uderzenia i bójki jest **opinia biegłego lekarza sądowego** oraz czas trwania rozstroju zdrowia:

---

### 1. Stopnie uszkodzenia ciała:
1. **Lekki uszczerbek – poniżej 7 dni (art. 157 § 2 k.k.):**
   - Objawy: siniaki, zadrapania, rozcięta warga, powierzchowne stłuczenia.
   - Kara: grzywna, ograniczenie wolności lub więzienie do lat 2.
   - **Ściganie z oskarżenia prywatnego:** Policja ani prokuratura nie prowadzą sprawy z urzędu (poszkodowany sam musi wnieść prywatny akt oskarżenia i opłacić 300 zł wpisu).
2. **Średni uszczerbek – powyżej 7 dni (art. 157 § 1 k.k.):**
   - Objawy: złamany nos z przemieszczeniem, pęknięcie kości, zwichnięcie stawu, wstrząśnienie mózgu.
   - Kara: **od 3 miesięcy do 5 lat pozbawienia wolności**. Sprawa ścigana przez prokuratora z urzędu!
3. **Ciężki uszczerbek (art. 156 k.k. – Zbrodnia):**
   - Utrata wzroku, słuchu, trwałe zeszpecenie twarzy. Kara: **od 3 do 20 lat więzienia** (zakaz zawieszenia kary!).

---

### 2. Finanse i nawiązki (art. 46 k.k.):
Sąd zobowiązuje sprawcę do zapłaty **zadośćuczynienia za krzywdę i ból** oraz pokrycia kosztów prywatnego leczenia, rehabilitacji i utraconych zarobków (od kilku do kilkudziesięciu tysięcy złotych).

---

### 3. Linia obrony:
- Wykazywanie **obrony koniecznej (art. 25 k.k.)** lub silnego wzburzenia wywołanego prowokacją pokrzywdzonego.
- Badanie opinii biegłego – weryfikacja, czy obrażenia faktycznie przekraczały 7 dni (zbicie kwalifikacji do art. 157 § 2 k.k. pozwala zamknąć sprawę ugodą!).`;
      suggestedFollowUps = [
        'Jak biegły medycyny sądowej ocenia próg 7 dni rozstroju zdrowia?',
        'Ile wynosi zadośćuczynienie za złamany nos w sądzie karnym?',
        'Jak doprowadzić do ugody w sprawach z art. 157 k.k.?',
      ];
    } else if (q.includes('recydyw') || q.includes('kolejny raz') || q.includes('drugi raz')) {
      referencedArticles.push('Art. 64 k.k.');
      legalCategoryBadge = 'Kodeks Karny (art. 64 k.k. - Recydywa)';
      text = `**Recydywa w polskim prawie karnym (art. 64 k.k.)** oznacza powrót do przestępstwa. Wyróżniamy dwa główne rodzaje:

1. **Recydywa podstawowa (art. 64 § 1 k.k.):**
   - Warunek: Sprawca skazany za przestępstwo umyślne na karę pozbawienia wolności popełnia w ciągu **5 lat** po odbyciu co najmniej **6 miesięcy kary** nowe umyślne przestępstwo podobne.
   - Skutek: Sąd może wymierzyć karę pozbawienia wolności do górnej granicy ustawowego zagrożenia **zwiększonej o połowę**.

2. **Recydywa wielokrotna / specjalna (art. 64 § 2 k.k.):**
   - Dotyczy najcięższych przestępstw (przeciwko życiu, zdrowiu, mieniu z użyciem przemocy).
   - Skutek: Sąd wymierza karę powyżej dolnej granicy, aż do górnej granicy zwiększonej o połowę.

*Praktyczna rada kancelarii:* Kluczowe dla obrony jest wyliczenie 5-letniego terminu oraz zbadanie, czy poprzednio odbyta kara faktycznie przekroczyła 6 miesięcy efektywnego pozbawienia wolności.`;
      suggestedFollowUps = ['Kiedy następuje zatarcie skazania?', 'Czy dozór elektroniczny liczy się do recydywy?', 'Jak uniknąć bezwzględnego więzienia w recydywie?'];
    } else if (q.includes('obrona konieczn') || q.includes('mój dom') || q.includes('napadnięty')) {
      referencedArticles.push('Art. 25 k.k.');
      referencedRulings.push('V KK 121/20');
      legalCategoryBadge = 'Kodeks Karny (art. 25 k.k. - Kontratyp)';
      text = `**Obrona konieczna (art. 25 k.k.) – najważniejsze zasady:**

- **Nie popełniasz przestępstwa**, jeśli odpierasz bezpośredni i bezprawny zamach na życie, zdrowie lub mienie (własne lub innej osoby).
- Prawo nie zmusza cię do ucieczki – masz prawo stanowczo odeprzeć atak (potwierdza to Sąd Najwyższy m.in. w wyroku *V KK 121/20*).
- **Zasada "Mój dom moją twierdzą" (art. 25 § 2a k.k.):** Jeśli ktoś wdrapał się do Twojego mieszkania, domu lub na ogrodzoną posesję, nie podlegasz karze nawet przy przekroczeniu granic obrony, chyba że przekroczenie było rażące.

*Praktyczna rada:* Podczas przesłuchania kluczowe jest wykazanie, że atak był **bezpośredni** (trwał w chwili obrony, a nie po tym, jak napastnik już uciekał) oraz że działałeś w stanie wzburzenia usprawiedliwionego strachem.`;
      suggestedFollowUps = ['Kiedy przekracza się granice obrony koniecznej?', 'Czy gaz pieprzowy jest legalny w obronie?', 'Co zrobić, gdy policja stawia zarzuty za pobicie napastnika?'];
    } else if (q.includes('warunkowe umorzenie') || q.includes('czysta kartoteka') || q.includes('krk')) {
      referencedArticles.push('Art. 66 k.k.', 'Art. 67 k.k.');
      legalCategoryBadge = 'Kodeks Karny (art. 66 k.k. - Środki probacyjne)';
      text = `**Warunkowe umorzenie postępowania (art. 66 k.k.) – ratunek dla czystej kartoteki:**

Jest to najkorzystniejsze rozwiązanie dla osoby oskarżonej. Sprawa zostaje formalnie umorzona, a Ty **pozostajesz osobą niekaraną w Krajowym Rejestrze Karnym (KRK)**!

**Warunki:**
1. Czyn jest zagrożony karą nieprzekraczającą 5 lat pozbawienia wolności.
2. Sprawca był dotychczas **niekarany za przestępstwo umyślne**.
3. Wina i społeczna szkodliwość czynu nie są znaczne.
4. Okoliczności zdarzenia nie budzą wątpliwości (zwykle wymaga przyznania się do faktów).

*Sąd wyznacza okres próby (od 1 do 3 lat)* i najczęściej nakłada obowiązek wpłaty na Fundusz Sprawiedliwości lub przeproszenia pokrzywdzonego. Po pomyślnym upływie próby sprawa jest ostatecznie zamknięta.`;
      suggestedFollowUps = ['Do jakich przestępstw można zastosować warunkowe umorzenie?', 'Ile kosztuje wpłata na Fundusz Sprawiedliwości?', 'Co jeśli złamię okres próby?'];
    } else if (q.includes('konfiskat') || q.includes('utrata auta') || q.includes('1.5 promila')) {
      referencedArticles.push('Art. 178a § 5 k.k.', 'Art. 44b k.k.');
      legalCategoryBadge = 'Kodeks Karny (art. 178a & 44b k.k. - Konfiskata)';
      actionQuery = 'Jazda samochodem pod wpływem alkoholu, badanie wykazało 1.6 promila (konfiskata auta)';
      text = `**Konfiskata pojazdów mechanicznych (prawo obowiązujące od 14 marca 2024 r.):**

Nowe przepisy nakazują sądowi orzeczenie przepadku samochodu w następujących sytuacjach:
1. **Powyżej 1,5 promila alkoholu we krwi** (lub 0,75 mg/l w wydychanym powietrzu) – konfiskata jest **obligatoryjna** (chyba że zachodzi wyjątkowy wypadek uzasadniony szczególnymi okolicznościami).
2. **Powyżej 1,0 promila**, jeśli sprawca spowodował wypadek drogowy lub dopuścił się recydywy (był już wcześniej karany za jazdę po alkoholu).
3. **Ucieczka z miejsca wypadku** – konfiskata bez względu na stężenie alkoholu.

**Co jeśli samochód nie należał do kierowcy (np. leasing, auto służbowe, współwłasność)?**
Sąd orzeka **przepadek równowartości pojazdu** – kierowca musi z własnej kieszeni zapłacić średnią wartość rynkową takiego auta.`;
      suggestedFollowUps = ['Jak uniknąć konfiskaty samochodu?', 'Czy sąd może odstąpić od przepadku auta?', 'Jak wygląda procedura zabezpieczenia auta przez policję?'];
    } else if (q.includes('dozór elektroniczny') || q.includes('sde') || q.includes('opaska')) {
      referencedArticles.push('Art. 43a k.k.w.');
      legalCategoryBadge = 'Kodeks Karny Wykonawczy (art. 43a k.k.w. - SDE)';
      text = `**System Dozoru Elektronicznego (SDE) – odbywanie kary w domu zamiast w więzieniu:**

Dozór elektroniczny pozwala odbywać karę z nadajnikiem (tzw. "opaską") w miejscu zamieszkania, zachowując pracę i kontakt z rodziną.

**Wymogi formalne:**
1. Kara pozbawienia wolności nie przekracza **1 roku i 6 miesięcy** (lub suma kar).
2. Sprawca posiada stałe miejsce pobytu oraz zgodę dorosłych domowników.
3. W lokalu są warunki techniczne (zasięg sieci GSM).
4. Sąd Penitencjarny uzna, że cele kary zostaną osiągnięte na wolności.

*Wskazówka:* Wniosek o SDE należy złożyć do Sądu Okręgowego – Wydziału Penitencjarnego niezwłocznie po uprawomocnieniu się wyroku, wraz z wnioskiem o wstrzymanie wykonania kary!`;
      suggestedFollowUps = ['Jak napisać wniosek o SDE?', 'Czy można wychodzić do pracy mając dozór elektroniczny?', 'Co grozi za zerwanie opaski SDE?'];
    } else if (q.includes('zatrzyman') || q.includes('policja zatrzymała') || q.includes('prawa zatrzymanego')) {
      referencedArticles.push('Art. 244 k.p.k.', 'Art. 245 k.p.k.', 'Art. 175 k.p.k.');
      legalCategoryBadge = 'Kodeks Postępowania Karnego (Prawa Zatrzymanego)';
      text = `**Prawa osoby zatrzymanej przez policję (Niezbędnik Kancelaryjny):**

1. **Prawo do milczenia (art. 175 k.p.k.):** Masz bezwzględne prawo do odmowy składania wyjaśnień i odpowiedzi na pytania. Nie musisz niczego tłumaczyć przed konsultacją z obrońcą.
2. **Prawo do kontaktu z adwokatem (art. 245 k.p.k.):** Żądaj natychmiastowego powiadomienia i bezpośredniej rozmowy z wybranym adwokatem w cztery oczy.
3. **Prawo do telefonu do osoby najbliższej:** Policja ma obowiązek niezwłocznie zawiadomić wskazaną osobę.
4. **Maksymalny czas zatrzymania:** 
   - 48 godzin do dyspozycji prokuratora.
   - Dodatkowe 24 godziny (łącznie max. 72 godziny), jeżeli prokurator skieruje do sądu wniosek o tymczasowe aresztowanie.
5. **Prawo do bezpłatnego tłumacza i pomocy medycznej.**`;
      suggestedFollowUps = ['Co mówić podczas pierwszego przesłuchania?', 'Jak złożyć zażalenie na zatrzymanie?', 'Kiedy sąd orzeka tymczasowy areszt?'];
    } else if (
      q.includes('co mi grozi') ||
      q.includes('co grozi') ||
      q.includes('ile grozi') ||
      q.includes('jaka kara') ||
      q.includes('kara za') ||
      q.includes('art') ||
      q.includes('kradzież') ||
      q.includes('alkohol') ||
      q.includes('bójk') ||
      q.includes('oszust') ||
      q.includes('blik') ||
      q.includes('aliment')
    ) {
      // DYNAMICZNY SILNIK ANALIZY DLA KAŻDEGO ZAPYTANIA O KARĘ
      const analysis = this.analyzeSituation(userPrompt);
      const mainArt = analysis.matchedArticles[0];
      const codeType = mainArt.codePrefix || 'k.k.';
      legalCategoryBadge = `${codeType === 'k.w.' ? 'Kodeks Wykroczeń' : codeType === 'UoPN' ? 'Ustawa Narkotykowa' : 'Kodeks Karny'} (${mainArt.title})`;
      actionQuery = userPrompt;

      for (const a of analysis.matchedArticles) {
        referencedArticles.push(`Art. ${a.number}${a.suffix || ''} ${a.codePrefix || 'k.k.'}`);
      }
      for (const r of analysis.similarRulings.slice(0, 2)) {
        referencedRulings.push(r.signature);
      }

      const riskColorBadge =
        analysis.riskLevel === 'bardzo wysoki'
          ? '🔴 BARDZO WYSOKIE'
          : analysis.riskLevel === 'wysoki'
            ? '🟠 WYSOKIE'
            : analysis.riskLevel === 'średni'
              ? '🟡 ŚREDNIE'
              : '🟢 NISKIE';

      text = `**Analiza kwalifikacji prawno-karnej: „${userPrompt}”**

- **Poziom ryzyka prawnego:** ${riskColorBadge}
- **Podstawa prawna:** ${analysis.matchedArticles.map((a) => `**Art. ${a.number}${a.suffix || ''} ${a.codePrefix || 'k.k.'}** – *${a.title}*`).join(', ')}

---

### 1. Zagrożenie ustawowe i realne sankcje:
- **Ustawowy wymiar kary:** ${analysis.primarySentenceRange}
${analysis.possibleSanctions.map((s) => `- ${s}`).join('\n')}

---

### 2. Kluczowe środki i obostrzenia:
${analysis.mandatoryMeasures.map((m) => `⚠️ ${m}`).join('\n\n')}

---

### 3. Czynniki łagodzące (argumenty obrony):
${analysis.mitigatingFactors.map((f) => `✔️ ${f}`).join('\n')}

---

### 4. Czynniki zaostrzające (ryzyka oskarżenia):
${analysis.aggravatingFactors.map((f) => `❌ ${f}`).join('\n')}

---

### 5. Rekomendowane działania:
${analysis.recommendedSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

*Wskazówka:* Możesz przejść do zakładki **Kalkulator Zagrożenia**, aby wyeksportować pełną pisemną opinię prawną do pliku PDF.`;

      suggestedFollowUps = [
        'Jak uzyskać warunkowe umorzenie w tej sprawie?',
        'Co mówić na pierwszym przesłuchaniu na policji?',
        'Czy sprawa trafi do rejestru skazanych KRK?',
      ];
    } else {
      // Domyślna odpowiedź doradcy prawnego Prawnik z Łuczniczej
      text = `Jestem **Prawnik z Łuczniczej** – Twoim asystentem prawa karnego. Działam w 100% lokalnie i bezpiecznie na Twoim urządzeniu, gwarantując pełną poufność danych.

Mogę pomóc Ci w:
- **Analizie "Co mi grozi?"**: Wpisz sytuację życiową (np. *jazda po 2 piwach*, *kradzież w markecie*, *płatność znalezioną kartą*), a przedstawię sankcje, przepisy i linię obrony.
- **Wyjaśnianiu trudnych pojęć prostym językiem**: recydywa, obrona konieczna, warunkowe umorzenie, dozór elektroniczny, zatarcie skazania.
- **Wyszukiwaniu orzecznictwa Sądu Najwyższego**: tezy, sygnatury i precedensy.
- **Sprawdzaniu zmian przepisów**: m.in. konfiskata aut od 2024 r., próg 800 zł przy kradzieży.

W czym konkretnie mogę pomóc w Twojej sprawie?`;
      suggestedFollowUps = [
        'Co grozi za jazdę po alkoholu?',
        'Co to jest wypadek mniejszej wagi?',
        'Jakie są prawa osoby zatrzymanej?',
        'Kiedy sąd może zawiesić wykonanie kary?',
      ];
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      text,
      referencedArticles: referencedArticles.length > 0 ? referencedArticles : undefined,
      referencedRulings: referencedRulings.length > 0 ? referencedRulings : undefined,
      suggestedFollowUps,
      legalCategoryBadge,
      actionQuery,
    };
  }

  /**
   * Kontekstowe Q&A oraz czat do konkretnego artykułu Kodeksu Karnego.
   * Łączy treść przepisu, sankcje, orzecznictwo SN i praktykę kancelaryjną.
   */
  askArticleQuestion(article: PenalArticle, userQuestion: string): ChatMessage {
    const q = userQuestion.toLowerCase().trim();
    const prefix = article.codePrefix || 'k.k.';
    const artRef = `Art. ${article.number}${article.suffix || ''} ${prefix}`;
    const referencedArticles: string[] = [artRef];
    const referencedRulings: string[] = [];
    let text = '';
    let suggestedFollowUps: string[] = [];

    // Dopasuj ewentualne orzeczenia z bazy do tego artykułu
    const matchingRulings = this.legalData.courtRulings().filter(
      (r) => r.articleRef.includes(`Art. ${article.number}`) || r.tags.some((t) => article.keywords.includes(t))
    );
    if (matchingRulings.length > 0) {
      referencedRulings.push(matchingRulings[0].signature);
    }

    // Specjalistyczne pytania do Kodeksu Wykroczeń i Ustaw Szczególnych
    if (article.id === 'art-51-kw') {
      if (q.includes('krk') || q.includes('kartotek') || q.includes('rejestr')) {
        text = `**Czy mandat lub wyrok za zakłócanie ciszy nocnej (art. 51 k.w.) trafia do rejestru karnego (KRK)?**

**NIE.** Ukarany za wykroczenie z art. 51 k.w. (zarówno mandatem karnym, jak i wyrokiem nakazowym sądu rejonowego) **pozostaje osobą niekaraną w świetle prawa**.
- Twoja kartoteka w Krajowym Rejestrze Karnym (KRK) pozostaje **w 100% czysta**.
- Możesz bez przeszkód pobrać ze sądu zaświadczenie o niekaralności potrzebne np. do pracy, licencji czy przetargów.
- Jedyny ślad to wpis w policyjnym rejestrze KSIP (Krajowy System Informacyjny Policji), który nie jest rejestrem karnym.`;
        suggestedFollowUps = [
          'Kiedy hałas staje się przestępstwem stalkingu (art. 190a k.k.)?',
          'Jak odmówić przyjęcia mandatu i bronić się w sądzie?',
          'Co oznacza pojęcie wybryku w orzecznictwie Sądu Najwyższego?',
        ];
      } else if (q.includes('stalk') || q.includes('190a') || q.includes('przestępstw')) {
        referencedArticles.push('Art. 190a § 1 k.k.');
        text = `**Kiedy złośliwy hałas i nękanie sąsiadów przestaje być wykroczeniem, a staje się przestępstwem?**

Jeżeli zakłócanie spokoju nie jest jednorazowym incydentem, lecz ma charakter **uporczywy, celowy i złośliwy** (np. codzienne celowe uderzanie w ściany, głośna muzyka puszczana w odwecie w celu udręczenia sąsiada):
- Policja i prokuratura mogą zakwalifikować czyn jako **stalking (art. 190a § 1 k.k.)**.
- **Zagrożenie karne:** Kara pozbawienia wolności **od 6 miesięcy do 8 lat**!
- Skazanie z art. 190a k.k. oznacza **wpis do KRK**, status przestępcy oraz możliwość orzeczenia zakazu zbliżania się i kontaktowania.`;
        suggestedFollowUps = [
          'Jak policja udowadnia uporczywość nękania?',
          'Czy mandat za art. 51 k.w. trafia do rejestru skazanych?',
          'Jakie są granice dozwolonego hałasu w ciągu dnia?',
        ];
      } else if (q.includes('odmów') || q.includes('mandat')) {
        text = `**Odmowa przyjęcia mandatu za zakłócanie ciszy nocnej:**
- Masz pełne prawo odmówić przyjęcia mandatu bez podawania przyczyny policjantowi.
- Sprawa trafia wówczas do Sądu Rejonowego (Wydział Karny / Sekcja Wykroczeń) na wniosek o ukaranie sporządzony przez policję.
- Sąd zazwyczaj wydaje tzw. **wyrok nakazowy** bez wzywania na rozprawę.
- **Kluczowy termin:** Masz **7 dni** od doręczenia wyroku nakazowego na wniesienie **sprzeciwu** – po sprzeciwie wyrok traci moc i odbywa się normalna rozprawa, gdzie możesz przesłuchać świadków i wykazać brak wybryku.`;
        suggestedFollowUps = [
          'Czy koszty sądowe są wysokie po przegranej sprawie?',
          'Czy wyrok sądu za wykroczenie brudzi kartotekę KRK?',
          'Jak zredagować sprzeciw od wyroku nakazowego?',
        ];
      } else {
        text = `**Analiza Art. 51 § 1 i § 2 k.w. (Zakłócenie spokoju i ciszy nocnej):**
- **Czyn zabroniony:** Zakłócenie krzykiem, hałasem, alarmem lub innym wybrykiem spokoju, porządku publicznego, spoczynku nocnego albo wywołanie zgorszenia.
- **Sankcja:** Areszt (od 5 do 30 dni), ograniczenie wolności (1 miesiąc prac społecznych) albo grzywna (od 20 do 5 000 zł). Mandat policyjny wynosi zwykle od 100 do 500 zł.
- **Typ kwalifikowany (§ 2 - charakter chuligański lub alkohol):** Zagrożenie aresztem, ograniczeniem wolności lub grzywną.`;
        suggestedFollowUps = [
          'Czy mandat trafia do rejestru karnego KRK?',
          'Kiedy hałas to stalking z art. 190a k.k.?',
          'Jak skutecznie odmówić mandatu?',
        ];
      }
    } else if (article.id === 'art-94-kw') {
      if (q.includes('zakaz') || q.includes('obowiązk') || q.includes('sąd')) {
        text = `**Obligatoryjny zakaz prowadzenia pojazdów z art. 94 § 1 i § 3 k.w.:**
- Zgodnie z art. 94 § 3 k.w., w razie popełnienia wykroczenia polegającego na prowadzeniu pojazdu mechanicznego bez uprawnień, **orzeczenie zakazu prowadzenia pojazdów jest OBOWIĄZKOWE**!
- Zakaz orzeka sąd rejonowy na okres **od 6 miesięcy do 3 lat**.
- **Minimalna grzywna:** Wynosi ustawowo aż **1 500 zł** (maksymalnie 30 000 zł).
- **Złamanie orzeczonego zakazu:** Stanowi przestępstwo z art. 244 k.k. zagrożone karą **do 5 lat pozbawienia wolności**!`;
        suggestedFollowUps = [
          'Co grozi za jazdę w okresie zakazu sądowego (art. 244 k.k.)?',
          'Czy stan wyższej konieczności zwalnia z zakazu jazdy?',
          'Jak długo trwa zatarcie ukarania za wykroczenie drogowe?',
        ];
      } else if (q.includes('wyższej konieczności') || q.includes('ratowan') || q.includes('szpital')) {
        referencedArticles.push('Art. 16 k.w.');
        text = `**Stan wyższej konieczności (Art. 16 k.w.) a jazda bez uprawnień:**
- Zgodnie z art. 16 k.w., nie popełnia wykroczenia, kto działa w celu uchylenia bezpośredniego niebezpieczeństwa grożącego życiu lub zdrowiu człowieka.
- Jeżeli prowadziłeś pojazd bez prawa jazdy, wioząc do szpitala osobę w stanie nagłego zagrożenia życia (np. zawał, udar, obfity krwotok), zachodzi **kontratyp stanu wyższej konieczności**.
- Sąd umarza postępowanie, nie wymierza grzywny ani zakazu prowadzenia. Należy jednak zabezpieczyć dokumentację medyczną z SOR potwierdzającą stan zagrożenia życia.`;
        suggestedFollowUps = [
          'Jakie dowody złożyć na potwierdzenie stanu wyższej konieczności?',
          'Czy policjant na drodze może odstąpić od ukarania?',
          'Czy orzeczenie zakazu z art. 94 k.w. jest bezwzględnie konieczne?',
        ];
      } else {
        text = `**Kluczowe konsekwencje z Art. 94 k.w. (Prowadzenie pojazdu bez uprawnień):**
- Od 1 stycznia 2022 r. policja nie nakłada mandatu 500 zł – sprawa **bezwzględnie trafia do Sądu Rejonowego** z wnioskiem o ukaranie!
- Grzywna wynosi od 1 500 zł do 30 000 zł.
- Sąd ma prawny obowiązek orzec **zakaz prowadzenia pojazdów na okres od 6 miesięcy do 3 lat**.`;
        suggestedFollowUps = [
          'Czy zakaz prowadzenia pojazdów jest obligatoryjny?',
          'Co grozi za złamanie zakazu (art. 244 k.k.)?',
          'Czy sprawa trafia do KRK?',
        ];
      }
    } else if (article.id === 'art-62-uopn') {
      if (q.includes('62a') || q.includes('umorzen') || q.includes('własny użytek')) {
        referencedArticles.push('Art. 62a UoPN');
        text = `**Umorzenie postępowania z art. 62a Ustawy o przeciwdziałaniu narkomanii:**
Art. 62a UoPN to najważniejsza instytucja obrończa:
1. Dotyczy posiadania środków odurzających w **ilości nieznacznej** (np. 1–3 gramy marihuany).
2. Środki muszą być przeznaczone **wyłącznie na własny użytek sprawcy**.
3. Stopień społecznej szkodliwości czynu nie może być znaczny.

**Korzyści:**
- Prokurator lub sąd **umarza postępowanie** przed skierowaniem aktu oskarżenia.
- Nie ma wyroku skazującego, grzywny ani kary ograniczenia wolności.
- **Czyste konto w KRK:** Pozostajesz w 100% osobą niekaraną!`;
        suggestedFollowUps = [
          'Jaka ilość marihuany jest uznawana za nieznaczną?',
          'Co mówić na przesłuchaniu policji przy zatrzymaniu z suszem?',
          'Kiedy posiadanie grozi karą do 10 lat więzienia?',
        ];
      } else {
        text = `**Posiadanie środków odurzających – Art. 62 UoPN:**
- **Typ podstawowy (art. 62 ust. 1):** Posiadanie narkotyków podlega karze pozbawienia wolności **do lat 3**.
- **Znaczna ilość (art. 62 ust. 2):** Kara pozbawienia wolności **od 1 roku do lat 10**.
- **Wypadek mniejszej wagi (art. 62 ust. 3):** Grzywna, kara ograniczenia wolności albo pozbawienia wolności do 1 roku.
- **Klucz do obrony:** Wniosek o umorzenie na podstawie **art. 62a UoPN** (własny użytek, ilość nieznaczna).`;
        suggestedFollowUps = [
          'Jak uzyskać umorzenie z art. 62a UoPN?',
          'Czy medyczna marihuana na receptę zwalnia z odpowiedzialności?',
          'Czy sprawa trafi do KRK?',
        ];
      }
    } else if (article.id === 'art-212-kk') {
      if (q.includes('prawdy') || q.includes('213') || q.includes('dowód')) {
        referencedArticles.push('Art. 213 k.k.');
        text = `**Kontratyp prawdy (Art. 213 k.k.) w sprawach o zniesławienie:**
Nie popełnia przestępstwa zniesławienia, kto publicznie podnosi lub rozgłasza prawdziwy zarzut:
1. Dotyczący postępowania osoby pełniącej funkcję publiczną, LUB
2. Służący obronie społecznie uzasadnionego interesu (np. ostrzeżenie konsumentów przed oszukańczym sklepem).
*Warunek kluczowy:* Sprawca musi być w stanie **udowodnić prawdziwość zarzutu** przed sądem (art. 213 § 2 k.k.).`;
        suggestedFollowUps = [
          'Czy za hejt w internecie grozi więzienie z art. 212 § 2 k.k.?',
          'Ile wynosi nawiązka finansowa dla pokrzywdzonego?',
          'Jakie są różnice między zniesławieniem a zniewagą (art. 216 k.k.)?',
        ];
      } else {
        text = `**Zniesławienie w internecie – Art. 212 k.k.:**
- **Typ kwalifikowany (art. 212 § 2 k.k.):** Pomówienie za pomocą środków masowego komunikowania (portale społecznościowe, fora, komentarze, Google) podlega grzywnie, karze ograniczenia wolności albo **pozbawienia wolności do roku**.
- **Środki karne:** Sąd może orzec nawiązkę na rzecz pokrzywdzonego lub PCK w kwocie **do 100 000 zł** oraz nakazać podanie wyroku do publicznej wiadomości.`;
        suggestedFollowUps = [
          'Jak działa dowód prawdy z art. 213 k.k.?',
          'Czy usunięcie komentarza zwalnia z odpowiedzialności karnej?',
          'Czy pokrzywdzony może ustalić adres IP hejtera?',
        ];
      }
    } else if (article.id === 'art-288-kk') {
      text = `**Zniszczenie lub uszkodzenie cudzej rzeczy – Art. 288 k.k.:**
- **Ustawowy wymiar kary:** Pozbawienie wolności **od 3 miesięcy do 5 lat**.
- **Nowy próg wykroczeniowy (od 1 października 2023 r.):**
  - Szkoda do **800 zł** to wykroczenie z art. 124 k.w. (grzywna, areszt, brak wpisu do KRK).
  - Szkoda powyżej **800 zł** to przestępstwo z art. 288 k.k. (grozi więzienie i wpis do KRK).
- **Naprawienie szkody (art. 46 k.k.):** Całkowite pokrycie kosztów naprawy (np. lakierowania) otwiera drogę do **warunkowego umorzenia postępowania (art. 66 k.k.)**.`;
      suggestedFollowUps = [
        'Jak wyceniana jest szkoda lakiernicza przez biegłego?',
        'Kiedy zniszczenie mienia kwalifikuje się jako wypadek mniejszej wagi?',
        'Czy zgoda pokrzywdzonego na ugodę zamyka sprawę w prokuraturze?',
      ];
    } else if (article.id === 'art-244-kk') {
      text = `**Naruszenie sądowego zakazu – Art. 244 k.k.:**
- **Wymiar kary:** Kara pozbawienia wolności **od 3 miesięcy do lat 5**.
- **Praktyka orzecznicza:** Sądy traktują ten czyn bardzo surowo jako lekceważenie władzy sądowniczej.
- **Czy można uniknąć pójścia do więzienia?**
  1. Przy karze do 1 roku pozbawienia wolności – walka o **warunkowe zawieszenie (art. 69 k.k.)** (jeśli brak uprzedniej karalności na więzienie).
  2. Przy karze do 1,5 roku – wniosek o odbywanie kary w **Systemie Dozoru Elektronicznego (SDE - obroża w domu)**.`;
      suggestedFollowUps = [
        'Jak złożyć wniosek o dozór elektroniczny (SDE)?',
        'Co jeśli wyrok o zakazie nie został prawidłowo doręczony?',
        'Czy prokurator zgodzi się na dobrowolne poddanie się karze?',
      ];
    } else {
      // Standardowe bloki analizy k.k.
      const isImprisonment = q.includes('więzien') || q.includes('siedzie') || q.includes('areszt') || q.includes('zawieszen') || q.includes('odsiadk');
      const isMitigation = q.includes('złagodzi') || q.includes('obniży') || q.includes('obron') || q.includes('pomóc') || q.includes('linia') || q.includes('uniknąć');
      const isMinor = q.includes('mniejszej wagi') || q.includes('znikoma') || q.includes('mała szkodliwość');
      const isSde = q.includes('sde') || q.includes('dozór') || q.includes('opask') || q.includes('domu');
      const isCosts = q.includes('koszt') || q.includes('grzywn') || q.includes('pieni') || q.includes('nawiązk') || q.includes('odszkodowan');
      const isConfiscation = q.includes('konfiskat') || q.includes('auto') || q.includes('samochód') || q.includes('przepadek');
      const isPolice = q.includes('policj') || q.includes('przesłuchan') || q.includes('mówić') || q.includes('zeznan') || q.includes('wyjaśnień');

      if (isConfiscation && article.number === 178 && article.suffix === 'a') {
        referencedArticles.push('Art. 44b k.k.');
        text = `**Konfiskata pojazdu przy ${artRef}:**
Od 14 marca 2024 r. przepadek auta jest **obligatoryjny**, jeżeli:
1. Kierowca miał we krwi powyżej **1,5 promila alkoholu** (lub 0,75 mg/l w wydychanym powietrzu).
2. Sprawca działał w warunkach recydywy (art. 178a § 4 k.k.) przy stężeniu powyżej **1,0 promila**.
3. Spowodował wypadek przy stężeniu powyżej 1,0 promila lub uciekł z miejsca zdarzenia.

*Wyjątki i linia obrony:* Sąd może odstąpić od przepadku tylko w „wyjątkowych wypadkach uzasadnionych szczególnymi okolicznościami”. Jeżeli samochód był w leasingu, kredycie lub nie należał wyłącznie do sprawcy, orzeka się **przepadek równowartości pojazdu**.`;
        suggestedFollowUps = [
          'Jak wyliczana jest równowartość samochodu?',
          'Czy można odzyskać auto zabezpieczone przez policję?',
          'Kiedy sąd może odstąpić od konfiskaty?',
        ];
      } else if (isImprisonment) {
        const maxMonths = article.penalties.imprisonmentMaxMonths;
        const isEligibleForSuspension = maxMonths <= 60 && !article.isFelony;

        text = `**Zagrożenie karą więzienia i szanse na wyrok w zawieszeniu dla ${artRef}:**
- **Ustawowy wymiar kary:** ${article.penalties.summary}.
- **Zawieszenie wykonania kary (art. 69 k.k.):** Sąd może zawiesić wykonanie kary pozbawienia wolności, jeżeli orzeczona kara nie przekracza **1 roku**, a sprawca w czasie popełnienia przestępstwa **nie był skazany na karę pozbawienia wolności**.
- ${isEligibleForSuspension ? 'Dla tego artykułu orzeczenie kary z warunkowym zawieszeniem jest prawnie dopuszczalne, pod warunkiem przekonania sądu do pozytywnej prognozy kryminologicznej.' : 'Uwaga: artykuł ten przewiduje surowe sankcje. Zbrodnie oraz kary powyżej 1 roku nie kwalifikują się do zawieszenia z art. 69 k.k.'}`;
        suggestedFollowUps = [
          'Jak przekonać sąd do kary w zawieszeniu?',
          'Czy dozór elektroniczny (SDE) jest możliwy zamiast więzienia?',
          'Kiedy przysługuje warunkowe umorzenie postępowania?',
        ];
      } else if (isMitigation) {
        referencedArticles.push('Art. 53 k.k.', 'Art. 60 k.k.');
        text = `**Skuteczne sposoby na złagodzenie odpowiedzialności z ${artRef}:**
1. **Pojednanie i naprawienie szkody (art. 46 k.k.):** Kluczowy czynnik dla sądu – dobrowolne zadośćuczynienie pokrzywdzonemu przed wyrokiem.
2. **Dobrowolne poddanie się karze (art. 387 k.p.k. lub 335 k.p.k.):** Uzgodnienie łagodniejszej kary z prokuratorem pozwala uniknąć procesu i skrajnych sankcji.
3. **Nadzwyczajne złagodzenie kary (art. 60 k.k.):** Zastosowanie grzywny lub ograniczenia wolności nawet przy surowym typie przestępstwa.
4. **Wywiad środowiskowy i opinie:** Przedłożenie dowodów stabilizacji życiowej, opieki nad rodziną lub pracy charytatywnej.`;
        suggestedFollowUps = [
          'Jak złożyć wniosek o dobrowolne poddanie się karze?',
          'Co to jest wniosek o pojednanie w mediacji?',
          'Jakie dowody przedstawić sądowi na korzyść oskarżonego?',
        ];
      } else if (isMinor) {
        referencedArticles.push('Art. 115 § 2 k.k.');
        text = `**Wypadek mniejszej wagi i ocena stopnia społecznej szkodliwości:**
- Wypadek mniejszej wagi to sytuacja, w której ze względu na zbieg okoliczności łagodzących (niska wartość szkody, motywacja sprawcy, zachowanie pokrzywdzonego) czyn cechuje się znacznie niższą szkodliwością społeczną.
- **Konsekwencja prawna:** Sprawca podlega znacznie łagodniejszej sankcji (np. grzywnie lub karze ograniczenia wolności zamiast bezwzględnego więzienia).
- W orzecznictwie SN podkreśla się, że o wypadku mniejszej wagi decydują łącznie okoliczności przedmiotowe (sposób działania) i podmiotowe (osobowość i motywacja).`;
        suggestedFollowUps = [
          'Czy mój przypadek kwalifikuje się jako wypadek mniejszej wagi?',
          'Jaka jest różnica między przestępstwem a wykroczeniem?',
          'Jak wnioskować o zmianę kwalifikacji prawnej?',
        ];
      } else if (isSde) {
        referencedArticles.push('Art. 43a k.k.w.');
        text = `**Dozór elektroniczny (SDE) a ${artRef}:**
Jeżeli w sprawie z ${artRef} zapadnie wyrok pozbawienia wolności do **1 roku i 6 miesięcy**, oskarżony może ubiegać się o odbywanie kary w systemie dozoru elektronicznego (w domu, z nadajnikiem).
- **Zalety:** Możliwość kontynuowania pracy zawodowej, nauki i pobytu z rodziną.
- **Wniosek:** Składa się go do Wydziału Penitencjarnego Sądu Okręgowego zaraz po uprawomocnieniu się wyroku.`;
        suggestedFollowUps = [
          'Co musi zawierać wniosek o dozór elektroniczny?',
          'Jak uzyskać wstrzymanie wykonania kary na czas rozpoznania SDE?',
          'Kiedy sąd penitencjarny odrzuca wniosek o SDE?',
        ];
      } else if (isCosts) {
        text = `**Koszty finansowe i środki majątkowe przy ${artRef}:**
- **Grzywna:** Wymierzana w stawkach dziennych (od 10 do 540 stawek, stawka od 10 zł do 2000 zł w zależności od dochodów).
- **Środki kompensacyjne (art. 46 k.k.):** Obowiązek pełnego naprawienia wyrządzonej szkody lub zadośćuczynienia za krzywdę.
- **Koszty sądowe:** Opłata na rzecz Skarbu Państwa oraz wydatki postępowania (opinie biegłych, ryczałty).
${article.additionalSanctions ? '\nDodatkowo w tym artykule występują: ' + article.additionalSanctions.join('; ') : ''}`;
        suggestedFollowUps = [
          'Jak wnioskować o rozłożenie grzywny na raty?',
          'Czy można zwolnić się z kosztów sądowych?',
          'Kiedy grzywna zamieniana jest na pracę społeczną?',
        ];
      } else if (isPolice) {
        referencedArticles.push('Art. 175 k.p.k.', 'Art. 244 k.p.k.');
        text = `**Postępowanie przygotowawcze i przesłuchanie w sprawie z ${artRef}:**
1. **Art. 175 § 1 k.p.k. (Prawo do milczenia):** Podejrzany ma prawo odmówić składania wyjaśnień lub odpowiedzi na poszczególne pytania bez podawania przyczyn. Skorzystanie z tego prawa **nie może** być traktowane jako dowód winy!
2. **Kontakt z obrońcą:** Przed złożeniem jakichkolwiek oświadczeń żądaj kontaktu z adwokatem.
3. **Zapoznanie z zarzutami:** Policja ma obowiązek precyzyjnie pouczyć Cię o stawianych zarzutach i kwalifikacji prawnej.`;
        suggestedFollowUps = [
          'Czy warto składać wyjaśnienia od razu na komendzie?',
          'Jak ustanowić obrońcę z urzędu lub z wyboru?',
          'Czym różni się status świadka od statusu podejrzanego?',
        ];
      } else {
        // Analiza merytoryczna artykułu z odniesieniem do treści i praktyki
        text = `**Analiza prawna ${artRef} – ${article.title}:**
- **Istota przepisu:** ${article.plainSummary}
- **Zagrożenie ustawowe:** ${article.penalties.summary}
${article.additionalSanctions && article.additionalSanctions.length > 0 ? '- **Dodatkowe środki:** ' + article.additionalSanctions.join('; ') + '\n' : ''}
${matchingRulings.length > 0 ? `\n*Linia orzecznicza (${matchingRulings[0].signature}):* ${matchingRulings[0].thesis}` : ''}

Z punktu widzenia obrońcy kluczowe jest ustalenie stopnia winy, ewentualnego zamiaru (bezpośredni czy ewentualny) oraz obecności okoliczności wyłączających bezprawność.`;
        suggestedFollowUps = [
          'Kiedy grozi kara bezwzględnego więzienia?',
          'Jakie są najczęstsze błędy podczas przesłuchania?',
          'Czy można warunkowo umorzyć sprawę z tego artykułu?',
        ];
      }
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      text,
      referencedArticles,
      referencedRulings: referencedRulings.length > 0 ? referencedRulings : undefined,
      suggestedFollowUps,
    };
  }
}
