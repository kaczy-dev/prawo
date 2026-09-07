import { Injectable, signal } from '@angular/core';

// Interfejsy TypeScript dla Web Speech API
export interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

export interface SpeechRecognitionResultListLike {
  length: number;
  item(index: number): SpeechRecognitionResultLike;
  [index: number]: SpeechRecognitionResultLike;
}

export interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike;
}

export interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

export interface SpeechRecognitionInstanceLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognitionInstanceLike, ev: Event) => unknown) | null;
  onresult: ((this: SpeechRecognitionInstanceLike, ev: SpeechRecognitionEventLike) => unknown) | null;
  onerror: ((this: SpeechRecognitionInstanceLike, ev: SpeechRecognitionErrorEventLike) => unknown) | null;
  onend: ((this: SpeechRecognitionInstanceLike, ev: Event) => unknown) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstanceLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstanceLike;
  }
}

export type DictationCallback = (text: string, isFinal: boolean) => void;

@Injectable({
  providedIn: 'root',
})
export class SpeechDictationService {
  // Sygnały reaktywne stanu dyktowania
  readonly isListening = signal<boolean>(false);
  readonly activeTarget = signal<string | null>(null);
  readonly currentInterim = signal<string>('');
  readonly lastError = signal<string | null>(null);
  readonly isSupported = signal<boolean>(false);

  private recognition: SpeechRecognitionInstanceLike | null = null;
  private currentCallback: DictationCallback | null = null;
  private shouldStayActive = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Sprawdza dostępność Web Speech API w bieżącej przeglądarce
   */
  private checkSupport(): void {
    if (typeof window === 'undefined') {
      this.isSupported.set(false);
      return;
    }

    const SpeechApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.isSupported.set(!!SpeechApi);
  }

  /**
   * Inicjalizuje instancję silnika rozpoznawania mowy dla języka polskiego
   */
  private initRecognition(): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechApi) {
      this.lastError.set('Twoja przeglądarka nie wspiera Web Speech API (zalecany Chrome/Edge/Safari).');
      this.isSupported.set(false);
      return false;
    }

    try {
      this.recognition = new SpeechApi();
      this.recognition.lang = 'pl-PL';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening.set(true);
        this.lastError.set(null);
      };

      this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcriptChunk = res[0].transcript;

          if (res.isFinal) {
            finalText += transcriptChunk;
          } else {
            interimText += transcriptChunk;
          }
        }

        this.currentInterim.set(interimText);

        if (finalText && this.currentCallback) {
          // Formatowanie znaków interpunkcyjnych w języku polskim
          const formatted = this.formatPunctuation(finalText);
          this.currentCallback(formatted, true);
        } else if (interimText && this.currentCallback) {
          this.currentCallback(interimText, false);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        let msg = 'Wystąpił błąd dyktowania mowy.';
        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            msg = 'Brak dostępu do mikrofonu. Zezwól aplikacji na użycie mikrofonu w ustawieniach przeglądarki.';
            this.shouldStayActive = false;
            break;
          case 'no-speech':
            // Ignorujemy chwilowy brak mowy w trybie ciągłym
            return;
          case 'audio-capture':
            msg = 'Nie wykryto sprawnego mikrofonu w Twoim urządzeniu.';
            this.shouldStayActive = false;
            break;
          case 'network':
            msg = 'Brak połączenia z lokalnym lub sieciowym modułem syntezy mowy.';
            break;
          case 'aborted':
            return;
        }

        this.lastError.set(msg);
        this.isListening.set(false);
      };

      this.recognition.onend = () => {
        this.currentInterim.set('');
        // Jeśli użytkownik nie zatrzymał dyktowania ręcznie, restartuj nasłuch (ciągły tryb kancelaryjny)
        if (this.shouldStayActive) {
          try {
            this.recognition?.start();
          } catch {
            this.isListening.set(false);
          }
        } else {
          this.isListening.set(false);
          this.activeTarget.set(null);
          this.currentCallback = null;
        }
      };

      return true;
    } catch (err) {
      console.error('Błąd inicjalizacji Web Speech API:', err);
      this.lastError.set('Nie udało się uruchomić rozpoznawania mowy.');
      return false;
    }
  }

  /**
   * Rozpoczyna dyktowanie do wskazanego celu (np. pola formularza)
   */
  start(targetId: string, callback: DictationCallback): void {
    if (!this.recognition && !this.initRecognition()) {
      return;
    }

    // Jeśli już słucha innego pola, zatrzymaj poprzednie
    if (this.isListening() && this.activeTarget() !== targetId) {
      this.stop();
    }

    this.activeTarget.set(targetId);
    this.currentCallback = callback;
    this.shouldStayActive = true;
    this.lastError.set(null);

    try {
      this.recognition?.start();
    } catch {
      // Jeśli już było aktywne, zaktualizuj callback
      this.isListening.set(true);
    }
  }

  /**
   * Zatrzymuje aktywne dyktowanie
   */
  stop(): void {
    this.shouldStayActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignoruj błąd zatrzymania
      }
    }
    this.isListening.set(false);
    this.activeTarget.set(null);
    this.currentInterim.set('');
    this.currentCallback = null;
  }

  /**
   * Przełącza stan dyktowania (toggle)
   */
  toggle(targetId: string, callback: DictationCallback): void {
    if (this.isListening() && this.activeTarget() === targetId) {
      this.stop();
    } else {
      this.start(targetId, callback);
    }
  }

  /**
   * Inteligentne formatowanie mowy prawniczej:
   * Zamienia komendy głosowe na znaki interpunkcyjne
   */
  formatPunctuation(rawText: string): string {
    let text = rawText;

    const replacements: [RegExp, string][] = [
      [/\s+(kropka|kropka\.)/gi, '.'],
      [/\s+(przecinek|przecinek,)/gi, ','],
      [/\s+(dwukropek|dwukropek:)/gi, ':'],
      [/\s+(średnik|średnik;)/gi, ';'],
      [/\s+(myślnik|pauza)/gi, ' -'],
      [/\s+(nowa linia|nowy wiersz)/gi, '\n'],
      [/\s+(nowy akapit)/gi, '\n\n'],
      [/\s+(otwórz cudzysłów|cudzysłów otwórz)/gi, ' „'],
      [/\s+(zamknij cudzysłów|cudzysłów zamknij)/gi, '”'],
      [/\s+(otwórz nawias|nawias otwórz)/gi, ' ('],
      [/\s+(zamknij nawias|nawias zamknij)/gi, ')'],
      [/\s+(pytajnik|znak zapytania)/gi, '?'],
      [/\s+(wykrzyknik)/gi, '!'],
      [/\s+artykuk[łl]\s+(\d+)/gi, ' art. $1'],
      [/\s+paragraf\s+(\d+)/gi, ' § $1'],
    ];

    for (const [pattern, repl] of replacements) {
      text = text.replace(pattern, repl);
    }

    return text;
  }
}
