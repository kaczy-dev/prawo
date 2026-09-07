import { Injectable } from '@angular/core';
import { PenalArticle, PrescriptionResult, PrescriptionSeverity } from '../models/legal.model';

@Injectable({
  providedIn: 'root',
})
export class PrescriptionCalculatorService {
  /**
   * Główna funkcja kalkulująca przedawnienie karalności na podstawie art. 101 i 102 Kodeksu Karnego
   * @param article Przepis k.k.
   * @param eventDateStr Data popełnienia czynu w formacie YYYY-MM-DD
   * @param hasProceedingsInPersonam Czy wszczęto postępowanie przeciwko osobie (art. 102 k.k.)
   * @param isPrivateProsecution Czy czyn ścigany jest z oskarżenia prywatnego (art. 101 § 2 k.k.)
   */
  calculatePrescription(
    article: PenalArticle,
    eventDateStr: string,
    hasProceedingsInPersonam = false,
    isPrivateProsecution = false
  ): PrescriptionResult {
    const today = new Date();
    const eventDate = this.parseDate(eventDateStr) || today;

    // 1. Ustalenie czy czyn ulega w ogóle przedawnieniu (art. 105 k.k.)
    const isNeverPrescribed = this.checkIfNeverPrescribed(article);

    // 2. Obliczenie okresu podstawowego (art. 101 k.k.)
    const baseYears = this.calculateBaseYears(article, isPrivateProsecution);

    // 3. Przedłużenie okresu w razie wszczęcia postępowania in personam (art. 102 k.k.)
    const extendedYears = hasProceedingsInPersonam
      ? this.calculateExtendedYears(article, baseYears, isPrivateProsecution)
      : 0;

    const totalYears = baseYears + extendedYears;

    // 4. Wyliczenie docelowej daty ustania karalności
    const expirationDate = new Date(eventDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + totalYears);

    const nowTime = today.getTime();
    const expTime = expirationDate.getTime();
    const eventTime = eventDate.getTime();

    const diffMs = expTime - nowTime;
    const isExpired = !isNeverPrescribed && diffMs <= 0;

    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const monthsRemaining = Math.max(0, Math.floor(daysRemaining / 30.4375));
    const yearsRemaining = Math.max(0, Math.floor(daysRemaining / 365.25));

    // 5. Postęp upływu terminu przedawnienia (0 - 100%)
    const totalDurationMs = expTime - eventTime;
    const elapsedMs = nowTime - eventTime;
    let progressPercent = 0;
    if (totalDurationMs > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));
    }
    if (isExpired) {
      progressPercent = 100;
    }

    // 6. Stopień alarmu / status
    let severity: PrescriptionSeverity = 'active';
    if (isExpired) {
      severity = 'prescribed';
    } else if (daysRemaining <= 180) {
      severity = 'critical'; // Mniej niż 6 miesięcy do wygaśnięcia karalności!
    } else if (daysRemaining <= 730) {
      severity = 'warning'; // Mniej niż 2 lata
    }

    // 7. Podstawa prawna i podsumowanie reguły
    const legalBasis = this.determineLegalBasis(article, hasProceedingsInPersonam, isPrivateProsecution);
    const statutoryRuleSummary = this.generateRuleSummary(article, baseYears, extendedYears, hasProceedingsInPersonam);
    const defenseTacticsRecommendation = this.generateDefenseTactics(isExpired, daysRemaining, hasProceedingsInPersonam);

    const formattedExpirationDate = expirationDate.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let warningNotice: string | undefined;
    if (isExpired) {
      warningNotice = 'Karalność czynu uległa bezwzględnemu przedawnieniu. Zachodzi negatywna przesłanka procesowa z art. 17 § 1 pkt 6 k.p.k. – postępowanie nie może być wszczęte, a wszczęte podlega umorzeniu.';
    } else if (severity === 'critical') {
      warningNotice = `PILNE ZAGROŻENIE PRZEDAWNIENIEM: Do definitywnego ustania karalności pozostało zaledwie ${daysRemaining} dni! Wszelkie zaniechania organów ścigania lub sądu mogą skutkować koniecznością umorzenia sprawy.`;
    } else if (severity === 'warning') {
      warningNotice = `Zbliżający się termin przedawnienia: do wygaśnięcia ścigania pozostało poniżej 2 lat (${daysRemaining} dni). Warto monitorować czynności procesowe i ewentualne przerwy w biegu terminu.`;
    }

    return {
      eventDate: eventDate.toISOString().split('T')[0],
      calculationDate: today.toISOString().split('T')[0],
      article,
      baseYears,
      extendedYears,
      totalYears,
      hasProceedingsInPersonam,
      isPrivateProsecution,
      isNeverPrescribed,
      targetExpirationDate: expirationDate.toISOString().split('T')[0],
      formattedExpirationDate,
      isExpired,
      daysRemaining,
      monthsRemaining,
      yearsRemaining,
      severity,
      progressPercent,
      legalBasis,
      statutoryRuleSummary,
      defenseTacticsRecommendation,
      warningNotice,
    };
  }

  private calculateBaseYears(article: PenalArticle, isPrivateProsecution: boolean): number {
    if (isPrivateProsecution) {
      // Art. 101 § 2 k.k. – przedawnienie z oskarżenia prywatnego: max 3 lata od czasu popełnienia
      return 3;
    }

    // Zabójstwo (art. 148 k.k.)
    if (article.number === 148 || article.keywords.includes('zabójstwo')) {
      return 40; // Art. 101 § 1 pkt 1 k.k.
    }

    // Inna zbrodnia (karalna od 3 lat pozbawienia wolności w górę)
    if (article.isFelony) {
      return 30; // Art. 101 § 1 pkt 2 k.k.
    }

    const maxMonths = article.penalties?.imprisonmentMaxMonths || 0;

    // Występek zagrożony karą powyżej 5 lat (np. art. 278 § 1, 286 § 1, 158 § 2, 280 § 1)
    if (maxMonths > 60) {
      return 15; // Art. 101 § 1 pkt 3 k.k.
    }

    // Występek zagrożony karą powyżej 3 lat (np. od 37 do 60 miesięcy)
    if (maxMonths > 36) {
      return 10; // Art. 101 § 1 pkt 4 k.k.
    }

    // Pozostałe występki (do 3 lat pozbawienia wolności, ograniczenie wolności lub grzywna)
    return 5; // Art. 101 § 1 pkt 5 k.k.
  }

  private calculateExtendedYears(article: PenalArticle, baseYears: number, isPrivateProsecution: boolean): number {
    if (isPrivateProsecution) {
      return 5; // Art. 102 k.k. w pozostałych wypadkach z upływem 5 lat
    }

    // Art. 102 k.k.:
    // Jeżeli w okresie, o którym mowa w art. 101, wszczęto postępowanie przeciwko osobie,
    // karalność przestępstwa określonego w § 1 pkt 1-4 ustaje z upływem 10 lat,
    // a w pozostałych wypadkach z upływem 5 lat od zakończenia tego okresu.
    if (baseYears >= 10) {
      return 10;
    }
    return 5;
  }

  private checkIfNeverPrescribed(article: PenalArticle): boolean {
    // Art. 105 k.k. – zbrodnie przeciwko pokojowi, ludzkości i przestępstwa wojenne
    const kw = article.keywords.map((k) => k.toLowerCase());
    return kw.includes('ludobójstwo') || kw.includes('zbrodnie wojenne') || kw.includes('przeciwko ludzkości');
  }

  private determineLegalBasis(
    article: PenalArticle,
    hasProceedingsInPersonam: boolean,
    isPrivateProsecution: boolean
  ): string {
    if (isPrivateProsecution) {
      return hasProceedingsInPersonam
        ? 'Art. 101 § 2 k.k. w zw. z art. 102 k.k. (3 lata + 5 lat z zarzutami)'
        : 'Art. 101 § 2 k.k. (3 lata od popełnienia czynu)';
    }

    if (article.number === 148) {
      return hasProceedingsInPersonam
        ? 'Art. 101 § 1 pkt 1 k.k. w zw. z art. 102 k.k. (40 lat + 10 lat)'
        : 'Art. 101 § 1 pkt 1 k.k. (40 lat)';
    }

    if (article.isFelony) {
      return hasProceedingsInPersonam
        ? 'Art. 101 § 1 pkt 2 k.k. w zw. z art. 102 k.k. (30 lat + 10 lat)'
        : 'Art. 101 § 1 pkt 2 k.k. (30 lat)';
    }

    const maxMonths = article.penalties?.imprisonmentMaxMonths || 0;
    if (maxMonths > 60) {
      return hasProceedingsInPersonam
        ? 'Art. 101 § 1 pkt 3 k.k. w zw. z art. 102 k.k. (15 lat + 10 lat)'
        : 'Art. 101 § 1 pkt 3 k.k. (15 lat)';
    }

    if (maxMonths > 36) {
      return hasProceedingsInPersonam
        ? 'Art. 101 § 1 pkt 4 k.k. w zw. z art. 102 k.k. (10 lat + 10 lat)'
        : 'Art. 101 § 1 pkt 4 k.k. (10 lat)';
    }

    return hasProceedingsInPersonam
      ? 'Art. 101 § 1 pkt 5 k.k. w zw. z art. 102 k.k. (5 lat + 5 lat)'
      : 'Art. 101 § 1 pkt 5 k.k. (5 lat)';
  }

  private generateRuleSummary(
    article: PenalArticle,
    baseYears: number,
    extendedYears: number,
    hasProceedingsInPersonam: boolean
  ): string {
    const maxYears = Math.floor((article.penalties?.imprisonmentMaxMonths || 0) / 12);
    let desc = `Czyn z art. ${article.number}${article.suffix || ''} k.k. (${article.title}) `;

    if (article.isFelony) {
      desc += `stanowi zbrodnię, dlatego podstawowy okres przedawnienia wynosi ${baseYears} lat.`;
    } else if (maxYears > 5) {
      desc += `zagrożony jest karą do ${maxYears} lat pozbawienia wolności (> 5 lat), co daje okres podstawowy ${baseYears} lat.`;
    } else if (maxYears > 3) {
      desc += `zagrożony jest karą do ${maxYears} lat pozbawienia wolności (> 3 lat), co implikuje ${baseYears} lat przedawnienia.`;
    } else {
      desc += `jako pozostały występek przedawnia się w okresie podstawowym ${baseYears} lat.`;
    }

    if (hasProceedingsInPersonam) {
      desc += ` W związku ze wszczęciem postępowania in personam (postawieniem zarzutów), zgodnie z art. 102 k.k. termin uległ wydłużeniu o dodatkowe ${extendedYears} lat (łącznie ${baseYears + extendedYears} lat).`;
    } else {
      desc += ` Aktualnie nie zaznaczono wszczęcia postępowania in personam – jeżeli sprawcy nie przedstawiono zarzutów, liczy się wyłącznie okres podstawowy ${baseYears} lat.`;
    }

    return desc;
  }

  private generateDefenseTactics(isExpired: boolean, daysRemaining: number, hasProceedingsInPersonam: boolean): string {
    if (isExpired) {
      return 'STRATEGIA OBROŃCY: Złożyć natychmiastowy wniosek o umorzenie postępowania przygotowawczego lub sądowego na podstawie art. 17 § 1 pkt 6 k.p.k. Przedawnienie karalności stanowi bezwzględną przeszkodę procesową, braną przez sąd pod uwagę z urzędu na każdym etapie.';
    }

    if (daysRemaining <= 180) {
      return 'STRATEGIA OBROŃCY: Krytycznie krótki czas do przedawnienia. Należy zweryfikować, czy organ procesowy nie uchybił terminom, a w razie braku prawomocnego wyroku po dacie granicznej, żądać natychmiastowego umorzenia. Unikać wniosków mogących skutkować zawieszeniem biegu przedawnienia (art. 104 k.k.).';
    }

    if (!hasProceedingsInPersonam) {
      return 'WSKAZÓWKA PRAKTYCZNA: Sprawa toczy się „w sprawie” (in rem), a nie „przeciwko osobie” (in personam). Dopóki nie nastąpi formalne przedstawienie zarzutów sprawcy, termin przedawnienia NIE ulega wydłużeniu o 5 lub 10 lat z art. 102 k.k.';
    }

    return 'STAN POSTĘPOWANIA: Postępowanie jest w toku, termin przedawnienia biegnie z uwzględnieniem przedłużenia z art. 102 k.k. Należy kontrolować prawidłowość doręczeń i ewentualne przesłanki zawieszenia postępowania.';
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }
}
