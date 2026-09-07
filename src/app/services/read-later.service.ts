import { Injectable, signal, computed } from '@angular/core';
import { PenalArticle, ReadLaterItem, FormattedParagraph } from '../models/legal.model';

@Injectable({
  providedIn: 'root',
})
export class ReadLaterService {
  private readonly DB_NAME = 'PrawnBotOfflineDB';
  private readonly STORE_NAME = 'read_later_articles';
  private readonly DB_VERSION = 1;
  private readonly FALLBACK_KEY = 'prawnbot_read_later_fallback';

  private db: IDBDatabase | null = null;
  private isIndexedDbSupported = typeof window !== 'undefined' && 'indexedDB' in window;

  // Reaktywny stan listy artykułów do przeczytania
  readonly items = signal<ReadLaterItem[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorState = signal<string | null>(null);

  // Pochodne sygnały do wygodnej obsługi w UI
  readonly count = computed(() => this.items().length);
  readonly unreadCount = computed(() => this.items().filter((item) => !item.isRead).length);
  readonly savedIdsSet = computed(() => new Set(this.items().map((item) => item.id)));

  constructor() {
    this.initStorage();
  }

  /**
   * Inicjalizacja magazynu IndexedDB z bezpiecznym fallbackiem do localStorage
   */
  private async initStorage(): Promise<void> {
    if (!this.isIndexedDbSupported) {
      this.loadFromFallback();
      this.isLoading.set(false);
      return;
    }

    try {
      this.db = await this.openDatabase();
      await this.loadAllItems();
    } catch (err) {
      console.warn('Błąd otwierania IndexedDB, przełączanie na tryb awaryjny (localStorage):', err);
      this.loadFromFallback();
    } finally {
      this.isLoading.set(false);
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
            store.createIndex('savedAt', 'savedAt', { unique: false });
            store.createIndex('isRead', 'isRead', { unique: false });
            store.createIndex('articleNumber', 'articleNumber', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Błąd dostępu do IndexedDB'));
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Ładowanie wszystkich zapisanych artykułów z bazy
   */
  async loadAllItems(): Promise<ReadLaterItem[]> {
    if (!this.db) {
      return this.loadFromFallback();
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const list: ReadLaterItem[] = (request.result || []).sort(
            (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
          );
          this.items.set(list);
          resolve(list);
        };

        request.onerror = () => {
          console.error('Błąd odczytu z IndexedDB:', request.error);
          const fallback = this.loadFromFallback();
          resolve(fallback);
        };
      } catch (err) {
        console.error('Wyjątek podczas odczytu IndexedDB:', err);
        const fallback = this.loadFromFallback();
        resolve(fallback);
      }
    });
  }

  /**
   * Zapis artykułu do przeczytania z estetycznym formatowaniem paragrafów (§)
   */
  async saveArticle(article: PenalArticle, userNotes?: string): Promise<ReadLaterItem> {
    const formattedParagraphs = this.parseFormattedParagraphs(article.content);
    const readingTime = this.calculateReadingTime(article.content);

    const item: ReadLaterItem = {
      id: article.id,
      articleId: article.id,
      articleNumber: article.number,
      articleSuffix: article.suffix,
      title: article.title,
      chapter: article.chapter,
      chapterNumber: article.chapterNumber,
      rawContent: article.content,
      formattedParagraphs,
      plainSummary: article.plainSummary,
      penaltiesSummary: article.penalties.summary,
      additionalSanctions: article.additionalSanctions,
      isFelony: article.isFelony,
      savedAt: new Date().toISOString(),
      readingTimeMinutes: readingTime,
      isRead: false,
      userNotes: userNotes || '',
    };

    if (this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = this.db!.transaction(this.STORE_NAME, 'readwrite');
          const store = tx.objectStore(this.STORE_NAME);
          const req = store.put(item);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.warn('Zapis do IndexedDB nieudany, zapis do localStorage:', err);
        this.saveToFallback(item);
      }
    } else {
      this.saveToFallback(item);
    }

    // Aktualizacja sygnału w pamięci
    this.items.update((current) => {
      const filtered = current.filter((i) => i.id !== item.id);
      return [item, ...filtered];
    });

    return item;
  }

  /**
   * Usunięcie artykułu z listy 'Read Later'
   */
  async removeArticle(articleId: string): Promise<void> {
    if (this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = this.db!.transaction(this.STORE_NAME, 'readwrite');
          const store = tx.objectStore(this.STORE_NAME);
          const req = store.delete(articleId);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.warn('Błąd usuwania z IndexedDB, usuwanie z fallback:', err);
      }
    }

    // Usunięcie z fallbacku localStorage
    this.removeFromFallback(articleId);

    // Aktualizacja reaktywnego stanu
    this.items.update((current) => current.filter((i) => i.id !== articleId));
  }

  /**
   * Zmiana statusu przeczytane / nieprzeczytane
   */
  async toggleReadStatus(articleId: string): Promise<void> {
    const existing = this.items().find((i) => i.id === articleId);
    if (!existing) return;

    const updated: ReadLaterItem = { ...existing, isRead: !existing.isRead };

    if (this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = this.db!.transaction(this.STORE_NAME, 'readwrite');
          const store = tx.objectStore(this.STORE_NAME);
          const req = store.put(updated);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.warn('Błąd aktualizacji statusu przeczytania:', err);
      }
    }

    this.saveToFallback(updated);
    this.items.update((current) => current.map((i) => (i.id === articleId ? updated : i)));
  }

  /**
   * Aktualizacja notatek użytkownika do zapisanego artykułu
   */
  async updateNotes(articleId: string, notes: string): Promise<void> {
    const existing = this.items().find((i) => i.id === articleId);
    if (!existing) return;

    const updated: ReadLaterItem = { ...existing, userNotes: notes };

    if (this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = this.db!.transaction(this.STORE_NAME, 'readwrite');
          const store = tx.objectStore(this.STORE_NAME);
          const req = store.put(updated);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.warn('Błąd aktualizacji notatek:', err);
      }
    }

    this.saveToFallback(updated);
    this.items.update((current) => current.map((i) => (i.id === articleId ? updated : i)));
  }

  /**
   * Sprawdzenie czy dany artykuł jest już zapisany w Read Later
   */
  isArticleSaved(articleId: string): boolean {
    return this.savedIdsSet().has(articleId);
  }

  /**
   * Parser zamieniający surowy tekst kodeksu na czytelne bloki paragrafów (§)
   */
  private parseFormattedParagraphs(raw: string): FormattedParagraph[] {
    const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const result: FormattedParagraph[] = [];

    let currentHeader = '';
    let currentBody = '';

    for (const line of lines) {
      // Rozpoznaj linie rozpoczynające się od paragrafu np. "§ 1.", "§ 2a."
      const match = line.match(/^(§\s*\d+[a-z]?\.?)\s*(.*)$/i);
      if (match) {
        if (currentBody || currentHeader) {
          result.push({ header: currentHeader || undefined, body: currentBody.trim() });
        }
        currentHeader = match[1].replace(/\.$/, '');
        currentBody = match[2] || '';
      } else {
        if (currentBody) {
          currentBody += ' ' + line;
        } else {
          currentBody = line;
        }
      }
    }

    if (currentBody || currentHeader) {
      result.push({ header: currentHeader || undefined, body: currentBody.trim() });
    }

    return result.length > 0 ? result : [{ body: raw }];
  }

  /**
   * Obliczenie szacowanego czasu czytania (w minutach)
   */
  private calculateReadingTime(text: string): number {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 130);
    return Math.max(1, minutes);
  }

  // --- Metody obsługi trybu awaryjnego (localStorage) ---

  private loadFromFallback(): ReadLaterItem[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const raw = localStorage.getItem(this.FALLBACK_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.items.set(parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('Błąd odczytu fallback Read Later z localStorage:', e);
    }
    return [];
  }

  private saveToFallback(item: ReadLaterItem): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const current = this.loadFromFallback().filter((i) => i.id !== item.id);
      const updated = [item, ...current];
      localStorage.setItem(this.FALLBACK_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Błąd zapisu fallback Read Later:', e);
    }
  }

  private removeFromFallback(articleId: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const current = this.loadFromFallback().filter((i) => i.id !== articleId);
      localStorage.setItem(this.FALLBACK_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('Błąd usuwania fallback Read Later:', e);
    }
  }
}
