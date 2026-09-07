import { Injectable, signal } from '@angular/core';

export interface GuardrailCheckResult {
  isAllowed: boolean;
  violationType?: 'crime_facilitation' | 'evidence_destruction' | 'asset_hiding' | 'jailbreak_attempt';
  warningTitle?: string;
  warningMessage?: string;
  statutoryBasis?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LegalGuardrailService {
  // Lista wzorców zapytań o modus operandi i pomocnictwo w przestępstwie (art. 18 § 3 k.k.)
  private readonly BLOCKED_PATTERNS: { regex: RegExp; type: GuardrailCheckResult['violationType']; title: string; message: string; basis: string }[] = [
    {
      regex: /(jak\s+(zatuszowa[ćc]|ukry[ćc]|zataji[ćc]|zniszczy[ćc])\s+(dowod|ślad|krew|odcisk|cia[łl]|narz[ęe]dzi))/i,
      type: 'evidence_destruction',
      title: 'Zablokowano: Zacieranie Śladów Przestępstwa',
      message: 'System Prawnik z Łuczniczej nie udziela instruktażu dotyczącego niszczenia dowodów ani utrudniania postępowania karnego (p.o. art. 239 k.k. poplecznictwo). Udzielamy wyłącznie informacji o prawach procesowych i obronie.',
      basis: 'Art. 239 § 1 k.k. (Poplecznictwo) oraz art. 18 § 3 k.k. (Pomocnictwo)',
    },
    {
      regex: /(jak\s+(sfa[łl]szowa[ćc]|podrobi[ćc]|sfabrykowa[ćc])\s+(podpis|dokument|umow[ęe]|faktur[ęe]|recept[ęe]|za[śs]wiadczen))/i,
      type: 'crime_facilitation',
      title: 'Zablokowano: Fałszowanie Dokumentów',
      message: 'Zapytanie narusza guardrails systemu prawnego. Nie generujemy instrukcji ułatwiających fałszowanie dokumentów procesowych, gospodarczych ani urzędowych.',
      basis: 'Art. 270 § 1 k.k. (Fałszerstwo materialne) oraz art. 271 k.k.',
    },
    {
      regex: /(jak\s+(przepisa[ćc]|ukry[ćc]|uciec\s+z)\s+(maj[ąa]tek|pieni[ąa]dz|nieruchomo[śs][ćc]|samoch[oó]d)\s+(przed|dla)\s+(komornik|wierzyciel|egzekucj))/i,
      type: 'asset_hiding',
      title: 'Zablokowano: Udaremnienie Egzekucji',
      message: 'Zapytanie dotyczy działań mogących wyczerpywać znamiona przestępstwa udaremnienia lub uszczuplenia zaspokojenia wierzyciela. System nie świadczy porad w celu unikania egzekucji.',
      basis: 'Art. 300 § 1 i § 2 k.k. (Udaremnienie zaspokojenia wierzyciela)',
    },
    {
      regex: /(jak\s+(unikn[ąa][ćc]|oszuka[ćc])\s+(alkomat|badani|policj)\s+(po\s+alkohol|promil))/i,
      type: 'crime_facilitation',
      title: 'Zablokowano: Unikanie Odpowiedzialności za Nietrzeźwość',
      message: 'System nie instruuje jak fałszować wyniki pomiaru stężenia alkoholu. Prezentujemy wyłącznie widełki sankcji (w tym art. 178a k.k. i konfiskatę pojazdu) oraz uprawnienia oskarżonego.',
      basis: 'Art. 178a k.k. oraz art. 44b k.k.',
    },
    {
      regex: /(ignore\s+all\s+previous\s+instructions|jeste[śs]\s+teraz\s+DAN|do\s+anything\s+now|zapomnij\s+o\s+prawie)/i,
      type: 'jailbreak_attempt',
      title: 'Zablokowano: Próba Modyfikacji Reguł Bezpieczeństwa',
      message: 'Wykryto próbę wymuszenia obejścia zabezpieczeń (Jailbreak). Prawnik z Łuczniczej operuje wyłącznie w granicach powszechnie obowiązującego prawa RP.',
      basis: 'Standardy Bezpieczeństwa OWASP LLM01 & LLM02',
    }
  ];

  // Ostatnie zdarzenie guardrails dla UI
  readonly lastBlockedEvent = signal<GuardrailCheckResult | null>(null);

  /**
   * Ocenia zapytanie użytkownika pod kątem zgodności z etyką i przepisami k.k.
   */
  evaluateInput(query: string): GuardrailCheckResult {
    const trimmed = query.trim();
    if (!trimmed) {
      return { isAllowed: true };
    }

    for (const rule of this.BLOCKED_PATTERNS) {
      if (rule.regex.test(trimmed)) {
        const result: GuardrailCheckResult = {
          isAllowed: false,
          violationType: rule.type,
          warningTitle: rule.title,
          warningMessage: rule.message,
          statutoryBasis: rule.basis,
        };
        this.lastBlockedEvent.set(result);
        return result;
      }
    }

    this.lastBlockedEvent.set(null);
    return { isAllowed: true };
  }
}
