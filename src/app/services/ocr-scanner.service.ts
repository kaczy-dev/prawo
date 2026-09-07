import { Injectable, signal } from '@angular/core';

export interface ExtractedCourtCaseInfo {
  caseSignature?: string; // np. II K 123/24
  articles: string[];     // np. ['art. 178a § 1 k.k.', 'art. 280 § 2 k.k.']
  deadlines: {
    title: string;
    days: number;
    basis: string;
    description: string;
  }[];
  rawText: string;
  confidence: number;
}

@Injectable({
  providedIn: 'root',
})
export class OcrScannerService {
  readonly isProcessing = signal<boolean>(false);
  readonly progressPercentage = signal<number>(0);
  readonly statusMessage = signal<string>('');

  /**
   * Rozpoznawanie tekstu z obrazu w 100% lokalnie w przeglądarce za pomocą Tesseract.js (WASM)
   */
  async recognizeDocument(imageSource: string | HTMLCanvasElement | Blob | File): Promise<ExtractedCourtCaseInfo> {
    if (typeof window === 'undefined') {
      throw new Error('OCR jest dostępny wyłącznie w przeglądarce użytkownika.');
    }

    this.isProcessing.set(true);
    this.progressPercentage.set(5);
    this.statusMessage.set('Inicjalizacja lokalnego silnika OCR (WASM)...');

    let worker: any = null;
    try {
      // Importujemy dedykowaną przeglądarkową dystrybucję ESM, która nie odwołuje się do Node'owego __dirname
      // @ts-expect-error Nieoficjalna ścieżka wewnętrzna modułu ESM
      const tesseractModule: any = await import('tesseract.js/dist/tesseract.esm.min.js');
      const createWorker = tesseractModule.createWorker || (tesseractModule.default && tesseractModule.default.createWorker);
      
      worker = await createWorker('pol', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            const p = Math.round((m.progress || 0) * 100);
            this.progressPercentage.set(Math.max(10, p));
            this.statusMessage.set(`Rozpoznawanie tekstu pisma: ${p}%`);
          } else if (m.status) {
            this.statusMessage.set(`Przygotowanie silnika: ${m.status}...`);
          }
        },
      });

      this.statusMessage.set('Skanowanie tekstu...');
      const ret = await worker.recognize(imageSource);
      const rawText = ret.data.text || '';
      const confidence = ret.data.confidence || 0;

      this.statusMessage.set('Ekstrakcja sygnatur i terminów procesowych...');
      const parsed = this.parseCourtDocument(rawText);

      this.progressPercentage.set(100);
      this.statusMessage.set('Ukończono analizę dokumentu');

      return {
        ...parsed,
        rawText,
        confidence,
      };
    } catch (err) {
      console.error('Błąd lokalnego OCR:', err);
      throw new Error('Nie udało się przeprowadzić lokalnego rozpoznawania pisma. Upewnij się, że obraz jest czytelny.');
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // ignore cleanup errors
        }
      }
      this.isProcessing.set(false);
    }
  }

  /**
   * Heurystyczna ekstrakcja polskich sygnatur sądowych, artykułów oraz terminów zawitych
   */
  parseCourtDocument(text: string): {
    caseSignature?: string;
    articles: string[];
    deadlines: { title: string; days: number; basis: string; description: string }[];
  } {
    // 1. Ekstrakcja sygnatury akt: np. II K 123/24, III Kp 45/23, V Ka 890/22, II AKa 14/23
    const signatureRegex = /\b([I|V|X]+)\s*(K|Kp|Ka|AKa|AKo|Ko|Kz|AKz|W|Kop)\s*(\d+)\s*[\/|\\]\s*(\d{2,4})\b/i;
    const sigMatch = text.match(signatureRegex);
    const caseSignature = sigMatch ? sigMatch[0].toUpperCase().replace(/\s+/g, ' ') : undefined;

    // 2. Ekstrakcja powoływanych artykułów k.k. / k.p.k.
    const articleRegex = /art\.\s*(\d+[a-z]?)(?:\s*§\s*(\d+[a-z]?))?(?:\s*pkt\s*(\d+))?\s*(k\.?k\.?|k\.?p\.?k\.?)/gi;
    const articlesFound = new Set<string>();
    let artMatch: RegExpExecArray | null;
    while ((artMatch = articleRegex.exec(text)) !== null) {
      articlesFound.add(artMatch[0].trim());
    }

    // 3. Rozpoznawanie terminów procesowych i pouczeń
    const deadlines: { title: string; days: number; basis: string; description: string }[] = [];
    const lower = text.toLowerCase();

    if (lower.includes('apelacj') || lower.includes('wyrok') || lower.includes('uzasadnieni')) {
      if (lower.includes('uzasadnieni') || lower.includes('sporządzenie uzasadnienia')) {
        deadlines.push({
          title: 'Wniosek o sporządzenie uzasadnienia wyroku',
          days: 7,
          basis: 'art. 422 § 1 k.p.k.',
          description: 'Termin zawity na złożenie wniosku o sporządzenie na piśmie i doręczenie uzasadnienia wyroku.',
        });
      }
      if (lower.includes('apelacj')) {
        deadlines.push({
          title: 'Apelacja od wyroku sądu',
          days: 14,
          basis: 'art. 445 § 1 k.p.k.',
          description: 'Termin na wniesienie apelacji (biegnie od daty doręczenia wyroku z uzasadnieniem).',
        });
      }
    }

    if (lower.includes('zażaleni') || lower.includes('postanowieni')) {
      deadlines.push({
        title: 'Zażalenie na postanowienie sądu / prokuratora',
        days: 7,
        basis: 'art. 460 k.p.k.',
        description: 'Termin zawity na wniesienie zażalenia na zaskarżalne postanowienie lub zarządzenie.',
      });
    }

    if (lower.includes('nakaz zapłaty') || lower.includes('sprzeciw od wyroku nakazowego') || lower.includes('wyrok nakazowy')) {
      deadlines.push({
        title: 'Sprzeciw od wyroku nakazowego',
        days: 7,
        basis: 'art. 505 § 1 k.p.k.',
        description: 'Termin na złożenie sprzeciwu do sądu, który wydał wyrok nakazowy. Złożenie sprzeciwu powoduje utratę mocy wyroku.',
      });
    }

    return {
      caseSignature,
      articles: Array.from(articlesFound),
      deadlines,
    };
  }
}
