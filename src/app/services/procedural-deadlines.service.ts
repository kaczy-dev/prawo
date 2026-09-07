import { Injectable } from '@angular/core';

export interface ProceduralDeadlineType {
  id: string;
  name: string;
  basisArticle: string;
  defaultDays: number;
  description: string;
  consequences: string;
  isFatalDeadline: boolean; // termin zawity (art. 122 § 1 k.p.k.)
  requiresAttorneyCompulsion?: boolean; // przymus adwokacko-radcowski
}

export interface DeadlineCalculationResult {
  deadlineType: ProceduralDeadlineType;
  startDate: string; // YYYY-MM-DD
  rawEndDate: string; // YYYY-MM-DD przed korektą sobota/święto
  adjustedEndDate: string; // YYYY-MM-DD po korekcie art. 123 § 3 k.p.k.
  isExtendedByWeekendOrHoliday: boolean;
  adjustmentReason?: string;
  daysRemaining: number;
  isExpired: boolean;
  isUrgent: boolean; // mniej niż 48h
  dispatchTips: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ProceduralDeadlinesService {
  readonly deadlineTypes: ProceduralDeadlineType[] = [
    {
      id: 'uzasadnienie_wyroku',
      name: 'Wniosek o doręczenie wyroku z uzasadnieniem',
      basisArticle: 'art. 422 § 1 k.p.k.',
      defaultDays: 7,
      description: 'Złożenie wniosku o sporządzenie na piśmie i doręczenie uzasadnienia wyroku sądu I instancji.',
      consequences: 'Niezłożenie wniosku w terminie zamyka drogę do wniesienia apelacji (termin zawity).',
      isFatalDeadline: true,
    },
    {
      id: 'apelacja_wyrok',
      name: 'Apelacja od wyroku sądu I instancji',
      basisArticle: 'art. 445 § 1 k.p.k.',
      defaultDays: 14,
      description: 'Wniesienie środka odwoławczego od wyroku sądu rejonowego lub okręgowego.',
      consequences: 'Uprawomocnienie się wyroku skazującego i skierowanie kary do wykonania.',
      isFatalDeadline: true,
    },
    {
      id: 'zazalenie_areszt',
      name: 'Zażalenie na tymczasowe aresztowanie / zatrzymanie',
      basisArticle: 'art. 252 § 1 w zw. z art. 460 k.p.k.',
      defaultDays: 7,
      description: 'Zaskarżenie postanowienia sądu o zastosowaniu lub przedłużeniu tymczasowego aresztowania.',
      consequences: 'Utrata prawa do natychmiastowej kontroli instancyjnej zasadności pozbawienia wolności.',
      isFatalDeadline: true,
    },
    {
      id: 'sprzeciw_nakazowy',
      name: 'Sprzeciw od wyroku nakazowego',
      basisArticle: 'art. 506 § 1 k.p.k.',
      defaultDays: 7,
      description: 'Wniesienie sprzeciwu od wyroku wydanego na posiedzeniu bez udziału stron.',
      consequences: 'Wyrok nakazowy uzyskuje moc wyroku prawomocnego.',
      isFatalDeadline: true,
    },
    {
      id: 'zazalenie_postanowienie',
      name: 'Zażalenie na inne postanowienie lub zarządzenie',
      basisArticle: 'art. 460 k.p.k.',
      defaultDays: 7,
      description: 'Zażalenie na postanowienia zamykające drogę do wydania wyroku lub dotyczące środków przymusu.',
      consequences: 'Postanowienie staje się ostateczne.',
      isFatalDeadline: true,
    },
    {
      id: 'odpowiedz_akt_oskarzenia',
      name: 'Pisemna odpowiedź na akt oskarżenia',
      basisArticle: 'art. 338 § 2 k.p.k.',
      defaultDays: 7,
      description: 'Możliwość złożenia pisemnych wyjaśnień, wniosków dowodowych przed wyznaczeniem rozprawy głównej.',
      consequences: 'Sąd proceduje bez uwzględnienia wstępnych wniosków obrony.',
      isFatalDeadline: false,
    },
    {
      id: 'przywrocenie_terminu',
      name: 'Wniosek o przywrócenie terminu zawitego',
      basisArticle: 'art. 126 § 1 k.p.k.',
      defaultDays: 7,
      description: 'Złożenie wniosku w razie uchybienia terminu z przyczyn od strony niezależnych wraz z dopełnieniem czynności!',
      consequences: 'Ostateczne odrzucenie wniosku o przywrócenie terminu.',
      isFatalDeadline: true,
    },
    {
      id: 'kasacja_sn',
      name: 'Kasacja do Sądu Najwyższego',
      basisArticle: 'art. 524 § 1 k.p.k.',
      defaultDays: 30,
      description: 'Nadzwyczajny środek zaskarżenia od prawomocnego wyroku sądu odwoławczego kończącego postępowanie.',
      consequences: 'Zamknięcie drogi do weryfikacji wyroku przez Sąd Najwyższy.',
      isFatalDeadline: true,
      requiresAttorneyCompulsion: true,
    },
  ];

  /**
   * Oblicza docelowy termin procesowy zgodnie z normami art. 123 i 124 Kodeksu Postępowania Karnego
   */
  calculateDeadline(
    deadlineTypeId: string,
    eventDateStr: string,
    customDays?: number
  ): DeadlineCalculationResult | null {
    const deadlineType = this.deadlineTypes.find((d) => d.id === deadlineTypeId);
    if (!deadlineType) return null;

    const startDate = new Date(eventDateStr + 'T00:00:00');
    if (isNaN(startDate.getTime())) return null;

    const daysCount = customDays && customDays > 0 ? customDays : deadlineType.defaultDays;

    // Reguła art. 123 § 1 k.p.k. - do biegu terminu nie wlicza się dnia zdarzenia
    // Zatem termin upływa po dodaniu określonej liczby dni do daty zdarzenia
    const rawEnd = new Date(startDate);
    rawEnd.setDate(rawEnd.getDate() + daysCount);

    // Reguła art. 123 § 3 k.p.k. - przesunięcie z soboty i dni wolnych od pracy
    let adjustedEnd = new Date(rawEnd);
    let isShifted = false;
    let shiftReason = '';

    while (this.isNonWorkingDayOrSaturday(adjustedEnd)) {
      isShifted = true;
      const dayOfWeek = adjustedEnd.getDay();
      if (dayOfWeek === 6) {
        shiftReason = 'Koniec terminu przypada na sobotę (art. 123 § 3 k.p.k.)';
      } else if (dayOfWeek === 0) {
        shiftReason = 'Koniec terminu przypada na niedzielę (art. 123 § 3 k.p.k.)';
      } else {
        shiftReason = 'Koniec terminu przypada na ustawowy dzień wolny od pracy (art. 123 § 3 k.p.k.)';
      }
      // Przesuń na kolejny dzień
      adjustedEnd.setDate(adjustedEnd.getDate() + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endForCompare = new Date(adjustedEnd);
    endForCompare.setHours(0, 0, 0, 0);

    const diffMs = endForCompare.getTime() - today.getTime();
    const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining < 0;
    const isUrgent = daysRemaining >= 0 && daysRemaining <= 2;

    const dispatchTips: string[] = [
      'Art. 124 § 1 k.p.k. – Pismo nadane w polskiej placówce operatora wyznaczonego (Poczta Polska) jest traktowane jak wniesione do sądu w dacie stempla pocztowego.',
      'Zadbaj o zachowanie żółtego potwierdzenia nadania przesyłki poleconej ze stemplem i czytelnym numerem nadawczym.',
      'W przypadku osób pozbawionych wolności decyduje data złożenia pisma w administracji aresztu śledczego lub zakładu karnego (art. 124 § 2 k.p.k.).',
    ];

    if (deadlineType.requiresAttorneyCompulsion) {
      dispatchTips.unshift('UWAGA: Obowiązuje przymus adwokacko-radcowski (art. 526 § 2 k.p.k.) – pismo musi sporządzić i podpisać adwokat lub radca prawny.');
    }

    return {
      deadlineType,
      startDate: this.formatDate(startDate),
      rawEndDate: this.formatDate(rawEnd),
      adjustedEndDate: this.formatDate(adjustedEnd),
      isExtendedByWeekendOrHoliday: isShifted,
      adjustmentReason: isShifted ? shiftReason : undefined,
      daysRemaining,
      isExpired,
      isUrgent,
      dispatchTips,
    };
  }

  /**
   * Sprawdza, czy dany dzień jest sobotą (6), niedzielą (0) lub polskim świętem państwowym/kościelnym
   */
  isNonWorkingDayOrSaturday(date: Date): boolean {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return true;
    }

    return this.isPolishPublicHoliday(date);
  }

  /**
   * Weryfikacja polskich świąt ustawowo wolnych od pracy
   */
  isPolishPublicHoliday(date: Date): boolean {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();
    const year = date.getFullYear();

    // Stałe święta
    if (month === 1 && (day === 1 || day === 6)) return true; // Nowy Rok, Trzech Króli
    if (month === 5 && (day === 1 || day === 3)) return true; // Święto Pracy, 3 Maja
    if (month === 8 && day === 15) return true; // Wniebowzięcie NMP / Święto Wojska Polskiego
    if (month === 11 && (day === 1 || day === 11)) return true; // Wszystkich Świętych, Niepodległości
    if (month === 12 && (day === 25 || day === 26)) return true; // Boże Narodzenie

    // Ruchome święta (Wielkanoc, Poniedziałek Wielkanocny, Boże Ciało)
    const easter = this.calculateEasterSunday(year);
    const easterMonth = easter.getMonth() + 1;
    const easterDay = easter.getDate();

    // Niedziela Wielkanocna (obsługiwana przez getDay() === 0, ale dla porządku)
    if (month === easterMonth && day === easterDay) return true;

    // Poniedziałek Wielkanocny (+1 dzień)
    const easterMonday = new Date(easter);
    easterMonday.setDate(easterMonday.getDate() + 1);
    if (month === easterMonday.getMonth() + 1 && day === easterMonday.getDate()) return true;

    // Boże Ciało (+60 dni od Wielkanocy)
    const corpusChristi = new Date(easter);
    corpusChristi.setDate(corpusChristi.getDate() + 60);
    if (month === corpusChristi.getMonth() + 1 && day === corpusChristi.getDate()) return true;

    return false;
  }

  /**
   * Wyznacza datę Wielkanocy algorytmem Meeusa/Jonesa/Butchera
   */
  private calculateEasterSunday(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
