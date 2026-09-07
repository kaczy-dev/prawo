import { Injectable, inject } from '@angular/core';
import { PenalArticle, MitigationArt60Simulation } from '../models/legal.model';
import { LegalDataService } from './legal-data.service';

export interface DirectiveWeights {
  guiltDegree: 'znikomy' | 'nieznaczny' | 'średni' | 'znaczny';
  socialHarm: 'znikoma' | 'nieznaczna' | 'średnia' | 'znaczna';
  preventiveGoalIndividual: boolean; // prewencja indywidualna
  preventiveGoalGeneral: boolean;    // prewencja ogólna
  reconciliationWithVictim: boolean; // pojednanie i naprawienie szkody
  voluntaryDisclosure: boolean;      // przyznanie się i współpraca
  priorConvictions: boolean;         // uprzednia karalność / recydywa
  youthfulOffender: boolean;         // młodociany sprawca
}

export interface DirectiveCalculationResult {
  article: PenalArticle;
  suggestedPenaltyRange: {
    minMonths: number;
    maxMonths: number;
    summary: string;
  };
  recommendedForm: 'grzywna' | 'ograniczenie_wolnosci' | 'pozbawienie_wolnosci' | 'kara_mieszana';
  isSuspensionPossible: boolean; // warunkowe zawieszenie (art. 69 k.k. - kara do 1 roku i sprawca niekarany)
  art60Mitigation: MitigationArt60Simulation;
  justificationNotes: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PenaltyCalculatorService {
  private readonly legalDataService = inject(LegalDataService);

  /**
   * Wylicza szczegółową symulację dyrektyw sądowego wymiaru kary (art. 53 k.k.) oraz nadzwyczajnego złagodzenia (art. 60 k.k.)
   */
  calculateDirectives(article: PenalArticle, directives: DirectiveWeights): DirectiveCalculationResult {
    const minM = article.penalties.imprisonmentMinMonths;
    const maxM = article.penalties.imprisonmentMaxMonths;
    const isFelony = article.isFelony || minM >= 36;
    const justificationNotes: string[] = [];

    // Podstawowe wyliczenie Art. 60 k.k.
    const art60 = this.calculateArt60(article, directives);

    // Ocena dyrektyw wymiaru kary (art. 53 k.k.)
    let baseMin = minM;
    let baseMax = maxM;

    if (directives.reconciliationWithVictim) {
      justificationNotes.push('Pojednanie z pokrzywdzonym i naprawienie szkody stanowi silną okoliczność łagodzącą (art. 53 § 3 k.k.).');
    }
    if (directives.voluntaryDisclosure) {
      justificationNotes.push('Przyznanie się do winy i złożenie wyjaśnień sprzyja orzeczeniu kary w dolnych granicach ustawowego zagrożenia.');
    }
    if (directives.youthfulOffender) {
      justificationNotes.push('Wobec sprawcy młodocianego sąd kieruje się przede wszystkim celami wychowawczymi (art. 54 § 1 k.k.).');
    }
    if (directives.priorConvictions) {
      justificationNotes.push('Uprzednia karalność przemawia przeciwko łagodnemu traktowaniu i wyklucza warunkowe zawieszenie kary pozbawienia wolności.');
    }

    // Rekomendacja formy kary
    let recommendedForm: DirectiveCalculationResult['recommendedForm'] = 'pozbawienie_wolnosci';

    if (article.penalties.fine && (directives.socialHarm === 'znikoma' || directives.socialHarm === 'nieznaczna') && !directives.priorConvictions) {
      recommendedForm = 'grzywna';
    } else if (article.penalties.restrictionOfLiberty && (directives.reconciliationWithVictim || directives.youthfulOffender) && baseMin <= 12) {
      recommendedForm = 'ograniczenie_wolnosci';
    } else if (baseMax <= 96 && (directives.reconciliationWithVictim || directives.voluntaryDisclosure)) {
      recommendedForm = 'kara_mieszana'; // art. 37b k.k.
    }

    // Warunkowe zawieszenie wykonania kary (art. 69 k.k.)
    // Dopuszczalne, gdy orzeczona kara nie przekracza 1 roku pozbawienia wolności, a sprawca w czasie popełnienia czynu nie był skazany na karę pozbawienia wolności.
    const isSuspensionPossible = !directives.priorConvictions && (baseMin <= 12 || art60.isApplicable);

    const summary = `${baseMin > 0 ? `${baseMin} mies.` : '0'} – ${baseMax >= 12 ? `${baseMax / 12} lat` : `${baseMax} mies.`}`;

    return {
      article,
      suggestedPenaltyRange: {
        minMonths: baseMin,
        maxMonths: baseMax,
        summary,
      },
      recommendedForm,
      isSuspensionPossible,
      art60Mitigation: art60,
      justificationNotes,
    };
  }

  /**
   * Precyzyjny algorytm przeliczania nadzwyczajnego złagodzenia kary na podstawie art. 60 § 1, 2, 3 i 6 k.k.
   */
  calculateArt60(article: PenalArticle, directives?: Partial<DirectiveWeights>): MitigationArt60Simulation {
    const minM = article.penalties.imprisonmentMinMonths;
    const isFelony = article.isFelony || minM >= 36;

    const eligibleGrounds: string[] = [];

    if (directives?.reconciliationWithVictim) {
      eligibleGrounds.push('Pojednanie się z pokrzywdzonym i naprawienie szkody (art. 60 § 2 pkt 1 k.k.)');
    }
    if (directives?.voluntaryDisclosure) {
      eligibleGrounds.push('Współpraca procesowa i ujawnienie istotnych okoliczności czynu (art. 60 § 3 k.k.)');
    }
    if (directives?.youthfulOffender) {
      eligibleGrounds.push('Młodociany sprawca – względy wychowawcze (art. 60 § 1 k.k.)');
    }

    if (eligibleGrounds.length === 0) {
      eligibleGrounds.push(
        'Pojednanie się z pokrzywdzonym i naprawienie szkody (art. 60 § 2 pkt 1 k.k.)',
        'Szczególna postawa sprawcy – aktywne starania o zapobieżenie szkodzie (art. 60 § 2 pkt 2 k.k.)',
        'Współpraca procesowa („mały świadek koronny” – art. 60 § 3 k.k.)'
      );
    }

    let mitigatedRange = '';
    let statutoryRulesSummary = '';

    if (isFelony && minM >= 60) {
      // Zbrodnia z dolną granicą min. 5 lat (art. 60 § 6 pkt 2 k.k.)
      mitigatedRange = 'Kara pozbawienia wolności od 2 lat i 8 miesięcy (zamiast minimum 5 lat)';
      statutoryRulesSummary = 'Zbrodnia zagrożona karą od co najmniej 5 lat: sąd wymierza karę nie niższą od 2 lat i 8 miesięcy pozbawienia wolności (art. 60 § 6 pkt 2 k.k.).';
    } else if (isFelony) {
      // Zbrodnia z dolną granicą min. 3 lat (art. 60 § 6 pkt 1 k.k.)
      mitigatedRange = 'Kara pozbawienia wolności od 1 roku (zamiast minimum 3 lat)';
      statutoryRulesSummary = 'Zbrodnia z dolną granicą co najmniej 3 lat: sąd wymierza karę pozbawienia wolności nie niższą od 1/3 dolnej granicy, czyli od 1 roku (art. 60 § 6 pkt 1 k.k.). Otwiera to drogę do warunkowego zawieszenia kary (art. 60 § 5 k.k.)!';
    } else if (minM >= 12) {
      // Występek z dolną granicą min. 1 roku (art. 60 § 6 pkt 3 k.k.)
      mitigatedRange = 'Grzywna (od 100 stawek dziennych), kara ograniczenia wolności (prace społeczne) ALBO pozbawienie wolności od 1 miesiąca do 11 miesięcy';
      statutoryRulesSummary = 'Występek z dolną granicą co najmniej 1 roku: sąd wymierza grzywnę, karę ograniczenia wolności albo karę pozbawienia wolności poniżej 1 roku (art. 60 § 6 pkt 3 k.k.). Pozwala to całkowicie uniknąć więzienia!';
    } else {
      // Występek z dolną granicą poniżej 1 roku (art. 60 § 6 pkt 4 k.k.)
      mitigatedRange = 'Grzywna ALBO kara ograniczenia wolności (prace społeczno-użyteczne)';
      statutoryRulesSummary = 'Występek z dolną granicą poniżej 1 roku: sąd orzeka wyłącznie grzywnę albo karę ograniczenia wolności (art. 60 § 6 pkt 4 k.k.). Całkowite wyłączenie kary izolacyjnej!';
    }

    const conditions: string[] = [
      'Naprawienie wyrządzonej szkody w całości lub w części przed wydaniem wyroku',
      'Pojednanie z pokrzywdzonym (ugoda przedsądowa lub mediacja na podst. art. 23a k.p.k.)',
      'Ujawnienie istotnych okoliczności czynu i brak utrudniania postępowania karnego',
      'Brak działania w warunkach recydywy wielokrotnej (art. 64 § 2 k.k.)',
    ];

    return {
      isApplicable: true,
      legalBasis: 'Art. 60 § 1, § 2 oraz § 6 Kodeksu Karnego',
      eligibleGrounds,
      originalRange: article.penalties.summary,
      mitigatedRange,
      statutoryRulesSummary,
      conditions,
    };
  }
}
