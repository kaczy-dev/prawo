import { Injectable, computed, signal } from '@angular/core';
import { CourtRuling, PenalArticle } from '../models/legal.model';

export interface SpeechChunk {
  text: string;
  originalText: string;
  index: number;
}

export interface ReadAloudPayload {
  id: string;
  title: string;
  subtitle?: string;
  chunks: string[];
}

@Injectable({
  providedIn: 'root',
})
export class TextToSpeechService {
  // Sygnały reaktywne stanu odtwarzania mowy (Web Speech API)
  readonly isSupported = signal<boolean>(false);
  readonly isPlaying = signal<boolean>(false);
  readonly isPaused = signal<boolean>(false);
  readonly currentTextId = signal<string | null>(null);
  readonly currentTitle = signal<string>('');
  readonly currentSubtitle = signal<string>('');
  readonly currentChunkIndex = signal<number>(0);
  readonly totalChunks = signal<number>(0);
  readonly currentChunkText = signal<string>('');
  readonly playbackRate = signal<number>(1.0); // 0.75x, 1.0x, 1.25x, 1.5x, 1.75x
  readonly lastError = signal<string | null>(null);

  // Lista dostępnych głosów w przeglądarce
  readonly availableVoices = signal<SpeechSynthesisVoice[]>([]);
  readonly selectedVoice = signal<SpeechSynthesisVoice | null>(null);

  // Obliczona lista głosów w języku polskim (Zero-Leak: preferencja głosów 100% lokalnych)
  readonly polishVoices = computed(() => {
    const allPl = this.availableVoices().filter(
      (v) => v.lang.startsWith('pl') || v.lang.includes('PL')
    );
    // Jeśli dostępne są głosy lokalne (offline), wybierz wyłącznie je, eliminując wyciek audio do chmury
    const localOnly = allPl.filter((v) => v.localService);
    return localOnly.length > 0 ? localOnly : allPl;
  });

  // Postęp odtwarzania w procentach (0 - 100%)
  readonly progressPercent = computed(() => {
    const total = this.totalChunks();
    if (total <= 0) return 0;
    const current = this.currentChunkIndex();
    return Math.min(100, Math.round(((current + 1) / total) * 100));
  });

  // Wewnętrzny stan odtwarzacza
  private chunks: SpeechChunk[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private isManuallyStopped = false;

  constructor() {
    this.initSpeechSynthesis();
  }

  /**
   * Inicjalizacja syntezatora mowy i nasłuchiwanie załadowania głosów systemowych
   */
  private initSpeechSynthesis(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isSupported.set(false);
      this.lastError.set('Twoja przeglądarka nie obsługuje syntezy mowy Web Speech API.');
      return;
    }

    this.isSupported.set(true);

    // Pobranie głosów (w Chrome głosy ładują się asynchronicznie)
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        this.availableVoices.set(voices);

        // Wybór bezpiecznego lokalnego głosu offline (Zero-Data-Retention / Zero-Leak)
        if (!this.selectedVoice()) {
          const plVoices = this.polishVoices();
          const localPl = plVoices.find((v) => v.localService) || plVoices[0] || null;
          this.selectedVoice.set(localPl);
        }
      }
    };

    updateVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  /**
   * Przygotowuje tekst aktu prawnego do odczytania:
   * Rozwija skróty prawnicze (art., §, ust., k.k.) na pełne brzmienie fonetyczne
   * dla maksymalnej czytelności dla osób niewidomych i niedowidzących.
   */
  normalizeLegalTextForSpeech(rawText: string): string {
    if (!rawText) return '';

    return rawText
      .replace(/§\s*(\d+)/gi, 'paragraf $1')
      .replace(/\bart\.\s*(\d+[a-z]?)/gi, 'artykuł $1')
      .replace(/\bust\.\s*(\d+)/gi, 'ustęp $1')
      .replace(/\bpkt\s*(\d+)/gi, 'punkt $1')
      .replace(/\blit\.\s*([a-z])/gi, 'litera $1')
      .replace(/\bzw\.\s*z\b/gi, 'w związku z')
      .replace(/\bk\.k\./gi, 'Kodeksu karnego')
      .replace(/\bk\.w\./gi, 'Kodeksu wykroczeń')
      .replace(/\bk\.p\.k\./gi, 'Kodeksu postępowania karnego')
      .replace(/\bk\.p\.c\./gi, 'Kodeksu postępowania cywilnego')
      .replace(/\bk\.c\./gi, 'Kodeksu cywilnego')
      .replace(/\bk\.p\./gi, 'Kodeksu pracy')
      .replace(/\bk\.k\.w\./gi, 'Kodeksu karnego wykonawczego')
      .replace(/\bUoPN\b/gi, 'Ustawy o przeciwdziałaniu narkomanii')
      .replace(/\bPRD\b/gi, 'Prawa o ruchu drogowym')
      .replace(/\bSN\b/gi, 'Sąd Najwyższy')
      .replace(/\bSA\b/gi, 'Sąd Apelacyjny')
      .replace(/\bSO\b/gi, 'Sąd Okręgowy')
      .replace(/\bSR\b/gi, 'Sąd Rejonowy')
      .replace(/\bDz\.U\./gi, 'Dziennik Ustaw')
      .replace(/\bpoz\.\s*(\d+)/gi, 'pozycja $1')
      .replace(/\bm-cy\b/gi, 'miesięcy')
      .replace(/\bm-ca\b/gi, 'miesiąca')
      .replace(/\br\./gi, 'roku')
      .replace(/\bzł\b/gi, 'złotych')
      .replace(/\bnp\./gi, 'na przykład')
      .replace(/\btj\./gi, 'to jest')
      .replace(/\btzw\./gi, 'tak zwany')
      .replace(/\bws\.\b/gi, 'w sprawie')
      .replace(/\bpost\.\b/gi, 'postanowienie')
      .replace(/\bwyrok\s+z\s+dnia\b/gi, 'wyrok z dnia')
      .replace(/–/g, '-')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Dzieli długi tekst aktu prawnego na logiczne, łatwe do przyswojenia segmenty.
   * Zapobiega również powszechnemu błędowi w przeglądarce Chrome,
   * gdzie wypowiedź >15 sekund ulega samoczynnemu zawieszeniu.
   */
  splitIntoSpeechChunks(text: string): SpeechChunk[] {
    if (!text) return [];

    // Podział na paragrafy/akapity
    const rawParagraphs = text
      .split(/(?=\n|§\s*\d+|Art\.\s*\d+)/g)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const result: SpeechChunk[] = [];
    let chunkIndex = 0;

    for (const para of rawParagraphs) {
      // Jeśli akapit jest bardzo długi, podziel dodatkowo na zdania
      if (para.length > 250) {
        const sentences = para
          .split(/(?<=[.?!;])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ0-9§])/g)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const s of sentences) {
          result.push({
            originalText: s,
            text: this.normalizeLegalTextForSpeech(s),
            index: chunkIndex++,
          });
        }
      } else {
        result.push({
          originalText: para,
          text: this.normalizeLegalTextForSpeech(para),
          index: chunkIndex++,
        });
      }
    }

    return result.length > 0
      ? result
      : [
          {
            originalText: text,
            text: this.normalizeLegalTextForSpeech(text),
            index: 0,
          },
        ];
  }

  /**
   * Rozpoczyna lub przełącza odczytywanie artykułu kodeksu karnego
   */
  speakArticle(article: PenalArticle): void {
    if (!this.isSupported()) return;

    // Jeśli ten sam artykuł jest już odtwarzany, przełącz play/pause
    if (this.currentTextId() === article.id && this.isPlaying()) {
      this.pause();
      return;
    } else if (this.currentTextId() === article.id && this.isPaused()) {
      this.resume();
      return;
    }

    const titleText = `Artykuł ${article.number}${article.suffix || ''} ${article.codePrefix || 'Kodeksu karnego'}. ${article.title}.`;
    const sanctionsText = `Zagrożenie karą: ${article.penalties.summary}.`;
    const explanationText = article.plainSummary
      ? `Komentarz praktyczny: ${article.plainSummary}`
      : '';

    const fullContent = [
      titleText,
      article.content,
      sanctionsText,
      explanationText,
    ]
      .filter((t) => !!t && t.trim().length > 0)
      .join('\n\n');

    this.startPlayback(
      article.id,
      `Art. ${article.number} ${article.codePrefix || 'k.k.'} — ${article.title}`,
      article.chapter,
      fullContent
    );
  }

  /**
   * Rozpoczyna odczytywanie orzeczenia sądowego
   */
  speakRuling(ruling: CourtRuling): void {
    if (!this.isSupported()) return;

    if (this.currentTextId() === ruling.id && this.isPlaying()) {
      this.pause();
      return;
    } else if (this.currentTextId() === ruling.id && this.isPaused()) {
      this.resume();
      return;
    }

    const titleText = `Orzeczenie ${ruling.court}, sygnatura ${ruling.signature}, z dnia ${ruling.date}. Dotyczy przepisu: ${ruling.articleRef}. ${ruling.title}.`;
    const thesisText = `Teza orzeczenia: ${ruling.thesis}`;
    const practicalText = `Wykładnia praktyczna: ${ruling.summaryPlain}`;
    const sanctionText = `Orzeczone rozstrzygnięcie: ${ruling.sanctionImposed}`;

    const fullContent = [titleText, thesisText, practicalText, sanctionText].join('\n\n');

    this.startPlayback(
      ruling.id,
      `${ruling.signature} (${ruling.court})`,
      ruling.title,
      fullContent
    );
  }

  /**
   * Uruchamia odtwarzanie dowolnego tekstu podzielonego na logiczne segmenty
   */
  startPlayback(id: string, title: string, subtitle: string, text: string): void {
    this.stop(); // Zatrzymanie poprzedniego lektora

    this.chunks = this.splitIntoSpeechChunks(text);
    if (this.chunks.length === 0) return;

    this.currentTextId.set(id);
    this.currentTitle.set(title);
    this.currentSubtitle.set(subtitle);
    this.totalChunks.set(this.chunks.length);
    this.currentChunkIndex.set(0);
    this.isManuallyStopped = false;
    this.lastError.set(null);

    this.playChunk(0);
    this.startKeepAlive();
  }

  /**
   * Odtwarza pojedynczy segment tekstu
   */
  private playChunk(index: number): void {
    if (this.isManuallyStopped || !this.isSupported()) return;

    if (index >= this.chunks.length) {
      // Zakończono odtwarzanie całego tekstu
      this.stop();
      return;
    }

    const chunk = this.chunks[index];
    this.currentChunkIndex.set(index);
    this.currentChunkText.set(chunk.originalText);

    try {
      const utterance = new SpeechSynthesisUtterance(chunk.text);
      utterance.rate = this.playbackRate();
      utterance.pitch = 1.0;
      utterance.lang = 'pl-PL';

      const voice = this.selectedVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        this.isPlaying.set(true);
        this.isPaused.set(false);
      };

      utterance.onpause = () => {
        this.isPaused.set(true);
      };

      utterance.onresume = () => {
        this.isPaused.set(false);
      };

      utterance.onend = () => {
        if (!this.isManuallyStopped && this.isPlaying()) {
          // Przejdź płynnie do kolejnego segmentu tekstu
          this.playChunk(index + 1);
        }
      };

      utterance.onerror = (event) => {
        // Ignoruj błąd 'interrupted' lub 'canceled' wywołany celowym zatrzymaniem
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          console.warn('[TextToSpeech] Błąd syntezy mowy:', event.error);
          this.lastError.set(`Błąd syntezy mowy: ${event.error}`);
        }
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('[TextToSpeech] Wyjątek podczas odtwarzania segmentu:', err);
      this.lastError.set('Nie udało się uruchomić modułu syntezatora mowy.');
      this.stop();
    }
  }

  /**
   * Wstrzymuje bieżące odtwarzanie (Pause)
   */
  pause(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.pause();
      this.isPaused.set(true);
    } catch (e) {
      console.warn('Błąd wstrzymania mowy:', e);
    }
  }

  /**
   * Wznawia wstrzymane odtwarzanie (Resume)
   */
  resume(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.resume();
      this.isPaused.set(false);
    } catch (e) {
      console.warn('Błąd wznowienia mowy:', e);
    }
  }

  /**
   * Zatrzymuje odtwarzanie i resetuje stan lektora
   */
  stop(): void {
    this.isManuallyStopped = true;
    this.stopKeepAlive();

    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Błąd anulowania syntezy mowy:', e);
      }
    }

    this.isPlaying.set(false);
    this.isPaused.set(false);
    this.currentTextId.set(null);
    this.currentTitle.set('');
    this.currentSubtitle.set('');
    this.currentChunkIndex.set(0);
    this.totalChunks.set(0);
    this.currentChunkText.set('');
    this.currentUtterance = null;
  }

  /**
   * Przejście do następnego akapitu / zdania
   */
  nextChunk(): void {
    const next = this.currentChunkIndex() + 1;
    if (next < this.chunks.length) {
      window.speechSynthesis.cancel();
      this.playChunk(next);
    }
  }

  /**
   * Powrót do poprzedniego akapitu / zdania
   */
  prevChunk(): void {
    const prev = this.currentChunkIndex() - 1;
    if (prev >= 0) {
      window.speechSynthesis.cancel();
      this.playChunk(prev);
    }
  }

  /**
   * Zmiana tempa czytania (0.75x - 2.0x)
   */
  setRate(rate: number): void {
    this.playbackRate.set(rate);
    // Jeśli aktualnie odtwarzamy, zrestartuj bieżący fragment z nowym tempem
    if (this.isPlaying() && !this.isPaused()) {
      const cur = this.currentChunkIndex();
      window.speechSynthesis.cancel();
      this.playChunk(cur);
    }
  }

  /**
   * Zmiana głosu syntezatora
   */
  setVoice(voice: SpeechSynthesisVoice): void {
    this.selectedVoice.set(voice);
    if (this.isPlaying() && !this.isPaused()) {
      const cur = this.currentChunkIndex();
      window.speechSynthesis.cancel();
      this.playChunk(cur);
    }
  }

  /**
   * Mechanizm zapobiegający samoczynnemu zamrażaniu syntezy mowy w silniku Chromium (Chrome/Edge).
   * Co 10 sekund wysyła krótki impuls pause/resume, utrzymując wątek audio przy życiu.
   */
  private startKeepAlive(): void {
    this.stopKeepAlive();
    if (typeof window === 'undefined') return;

    this.keepAliveTimer = setInterval(() => {
      if (this.isPlaying() && !this.isPaused() && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }
}
