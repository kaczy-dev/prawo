import { TestBed } from '@angular/core/testing';
import { PrawnBotAiService } from './prawn-bot-ai.service';
import { LegalDataService } from './legal-data.service';

describe('PrawnBotAiService', () => {
  let service: PrawnBotAiService;
  let legalData: LegalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PrawnBotAiService, LegalDataService],
    });
    service = TestBed.inject(PrawnBotAiService);
    legalData = TestBed.inject(LegalDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle public beer drinking accurately without accusing user of drunk driving', () => {
    const query = 'ile mi grozi za picie piwa w parku?';
    const response = service.generateChatResponse(query, 'citizen');

    // Must mention 100 PLN fine and appropriate article
    expect(response.text).toContain('100 zł');
    expect(response.text).toContain('43¹');
    // Must NOT confuse with drunk driving (art. 178a k.k.)
    expect(response.text).not.toContain('178a');
    expect(response.text).not.toContain('więzienia');
    expect(response.text).not.toContain('konfiskata');
  });

  it('should distinguish cycling under influence from drunk driving in a car', () => {
    const query = 'co mi grozi za jazdę rowerem po dwóch piwach?';
    const response = service.generateChatResponse(query, 'citizen');

    // Must mention art. 87 k.w., 1000/2500 zł fine, and protection of Category B driving license
    expect(response.text).toContain('87');
    expect(response.text).toContain('mandat');
    expect(response.text).toContain('kat. B');
    // Must NOT claim car confiscation under art. 44b k.k.
    expect(response.text).not.toContain('konfiskata pojazdu mechanicznego');
  });

  it('should address driving a motorized vehicle drunk under art. 178a k.k.', () => {
    const query = 'jakie są konsekwencje jazdy samochodem pod wpływem alkoholu?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('178a');
    expect(response.text).toContain('mechaniczn');
  });

  it('should respond politely to greetings without accusing user of a crime', () => {
    const query = 'Cześć! W czym możesz mi pomóc?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('Dzień dobry');
    expect(response.text).not.toContain('178a');
    expect(response.text).not.toContain('pozbawienia wolności');
  });

  it('should explain car confiscation under art. 44b k.k. including 1.5 promile and leasing rules', () => {
    const query = 'kiedy grozi konfiskata samochodu za alkohol i co jeśli auto jest w leasingu?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('44b');
    expect(response.text).toContain('1,5 promila');
    expect(response.text).toContain('LEASING');
    expect(response.text).toContain('równowartości');
  });

  it('should explain breathalyzer error margin and calibration rules under art. 5 par. 2 kpk', () => {
    const query = 'jaki jest margines błędu alkomatu i czy świadectwo wzorcowania ma znaczenie?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('wzorcowania');
    expect(response.text).toContain('niepewność pomiarową');
    expect(response.text).toContain('5 § 2 k.p.k.');
  });

  it('should explain alcohol testing at work under Labour Code art. 22(1c) kp', () => {
    const query = 'czy szef może mnie zbadać alkomatem w pracy i co grozi za odmowę?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('22¹c');
    expect(response.text).toContain('Kodeksu Pracy');
    expect(response.text).toContain('Policji');
    expect(response.text).toContain('dyscyplinarne');
  });

  it('should distinguish non-motorized watercraft from motorboats under water safety act', () => {
    const query = 'co grozi za picie piwa na kajaku i rowerze wodnym?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('35');
    expect(response.text).toContain('500 zł');
    expect(response.text).toContain('NIE TRACISZ prawa jazdy');
  });

  it('should debunk the blackout intoxication excuse under art. 31 par. 3 kk', () => {
    const query = 'czy urwany film po alkoholu zmniejsza karę w sądzie?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('31 § 3 k.k.');
    expect(response.text).toContain('Actio libera in causa');
    expect(response.text).toContain('obciążająca');
  });

  it('should accurately analyze situation for car confiscation in analyzeSituation', () => {
    const analysis = service.analyzeSituation('zatrzymano mnie za 1.6 promila za kółkiem auta, czy grozi konfiskata pojazdu?');
    const has44b = analysis.matchedArticles.some((a) => a.id === 'art-44b-kk');
    const has178a = analysis.matchedArticles.some((a) => a.id === 'art-178a');

    expect(has44b).toBe(true);
    expect(has178a).toBe(true);
  });

  it('should explain samowola budowlana, 50 000 zl fee and 30 days deadline under art. 48 and 90 Pr. bud.', () => {
    const query = 'co mi grozi za samowolę budowlaną i jak ją zalegalizować?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('90');
    expect(response.text).toContain('50 000 zł');
    expect(response.text).toContain('30 dni');
    expect(response.text).toContain('rozbiórk');
  });

  it('should explain simplified 20-year legalisation without fees under art. 49f Pr. bud.', () => {
    const query = 'jak działa darmowa legalizacja po 20 latach dla starej samowoli budowlanej?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('49f');
    expect(response.text).toContain('0 ZŁ');
    expect(response.text).toContain('20 lat');
  });

  it('should explain moving in without occupancy permit (zamieszkanie bez odbioru) and 60-day warning', () => {
    const query = 'co grozi za zamieszkanie w domu bez odbioru i jakie są kary PINB?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('93');
    expect(response.text).toContain('10 000 zł');
    expect(response.text).toContain('60 dni');
    expect(response.text).toContain('ŻÓŁTEJ KARTKI');
  });

  it('should explain distance from boundary lines (4m with windows, 3m blind wall)', () => {
    const query = 'ile metrów od granicy działki sąsiada mogę postawić ścianę z oknem?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('4 METRY');
    expect(response.text).toContain('3 METRY');
    expect(response.text).toContain('okna');
  });

  it('should explain 70m2 houses and fence height rules without permit under art. 29 Pr. bud.', () => {
    const query = 'do jakiej wysokości ogrodzenie nie wymaga zgłoszenia i jak postawić dom do 70m2?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('70 m²');
    expect(response.text).toContain('2,20 m');
    expect(response.text).toContain('kierownika budowy');
  });

  it('should explain site manager safety liability under art. 220 kk for accidents on construction site', () => {
    const query = 'jaka jest odpowiedzialność kierownika budowy za wypadek pracownika i upadek z rusztowania?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('220');
    expect(response.text).toContain('kierownik budowy');
    expect(response.text).toContain('BHP');
  });

  it('should explain disaster risk and demolishing load-bearing walls under art. 163 and 164 kk', () => {
    const query = 'co grozi za samowolne wyburzenie ściany nośnej w bloku mieszkalnym?';
    const response = service.generateChatResponse(query, 'citizen');

    expect(response.text).toContain('164');
    expect(response.text).toContain('ściany nośnej');
  });

  it('should accurately analyze situation for construction unauthorized work in analyzeSituation', () => {
    const analysis = service.analyzeSituation('postawiłem garaż i dom bez pozwolenia na budowę, czy grozi nakaz rozbiórki?');
    const hasArt90 = analysis.matchedArticles.some((a) => a.id === 'art-90-pr-bud');
    const hasArt48 = analysis.matchedArticles.some((a) => a.id === 'art-48-pr-bud');

    expect(hasArt90).toBe(true);
    expect(hasArt48).toBe(true);
    expect(analysis.primarySentenceRange).toContain('90 Pr. bud.');
    expect(analysis.possibleSanctions.some((s) => s.includes('50 000 zł'))).toBe(true);
  });
});
