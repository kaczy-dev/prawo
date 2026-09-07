import { TestBed } from '@angular/core/testing';
import { PenaltyCalculatorService, DirectiveWeights } from './penalty-calculator.service';
import { LegalDataService } from './legal-data.service';
import { PenalArticle } from '../models/legal.model';

describe('PenaltyCalculatorService', () => {
  let service: PenaltyCalculatorService;
  let legalDataService: LegalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PenaltyCalculatorService, LegalDataService],
    });
    service = TestBed.inject(PenaltyCalculatorService);
    legalDataService = TestBed.inject(LegalDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate art. 60 k.k. mitigation for misdemeanour with min >= 1 year (art. 60 § 6 pkt 3 k.k.)', () => {
    const mockArticle: PenalArticle = {
      id: 'test-art',
      number: 280,
      codePrefix: 'k.k.',
      title: 'Rozbój testowy',
      chapter: 'Test',
      chapterNumber: 'Test',
      content: 'test',
      plainSummary: 'test',
      penalties: {
        fine: false,
        restrictionOfLiberty: false,
        imprisonmentMinMonths: 24, // 2 lata
        imprisonmentMaxMonths: 144,
        summary: '2 do 12 lat',
      },
      isFelony: false,
      keywords: ['test'],
    };

    const directives: DirectiveWeights = {
      guiltDegree: 'średni',
      socialHarm: 'średnia',
      preventiveGoalIndividual: true,
      preventiveGoalGeneral: false,
      reconciliationWithVictim: true,
      voluntaryDisclosure: true,
      priorConvictions: false,
      youthfulOffender: false,
    };

    const result = service.calculateDirectives(mockArticle, directives);

    expect(result.art60Mitigation.isApplicable).toBeTrue();
    expect(result.art60Mitigation.mitigatedRange).toContain('Grzywna (od 100 stawek dziennych)');
    expect(result.isSuspensionPossible).toBeTrue();
  });

  it('should calculate art. 60 k.k. mitigation for felony with min >= 3 years (art. 60 § 6 pkt 1 k.k.)', () => {
    const mockFelony: PenalArticle = {
      id: 'test-felony',
      number: 148,
      codePrefix: 'k.k.',
      title: 'Zbrodnia testowa',
      chapter: 'Test',
      chapterNumber: 'Test',
      content: 'test',
      plainSummary: 'test',
      penalties: {
        fine: false,
        restrictionOfLiberty: false,
        imprisonmentMinMonths: 96, // 8 lat
        imprisonmentMaxMonths: 360,
        summary: 'od 8 lat',
      },
      isFelony: true,
      keywords: ['test'],
    };

    const directives: DirectiveWeights = {
      guiltDegree: 'znaczny',
      socialHarm: 'znaczna',
      preventiveGoalIndividual: true,
      preventiveGoalGeneral: true,
      reconciliationWithVictim: false,
      voluntaryDisclosure: true,
      priorConvictions: false,
      youthfulOffender: false,
    };

    const result = service.calculateDirectives(mockFelony, directives);

    expect(result.art60Mitigation.isApplicable).toBeTrue();
    expect(result.art60Mitigation.mitigatedRange).toContain('2 lat i 8 miesięcy');
  });
});
