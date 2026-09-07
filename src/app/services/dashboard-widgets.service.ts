import { Injectable, signal, effect, inject } from '@angular/core';
import {
  DashboardPreferences,
  DashboardWidgetConfig,
  DashboardWidgetId,
  RecentSearchItem,
  ActiveCaseItem,
  PenalArticle,
} from '../models/legal.model';
import { LegalDataService } from './legal-data.service';
import { OfflineSyncService } from './offline-sync.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardWidgetsService {
  private readonly legalData = inject(LegalDataService);
  private readonly offlineSync = inject(OfflineSyncService);

  private readonly PREFS_KEY = 'prawnbot_dashboard_preferences_v1';
  private readonly RECENT_SEARCHES_KEY = 'prawnbot_recent_searches_v1';
  private readonly ACTIVE_CASES_KEY = 'prawnbot_active_cases_v1';
  private readonly PINNED_ARTICLES_KEY = 'prawnbot_pinned_articles_v1';

  // Domyślna konfiguracja widżetów
  private readonly defaultWidgets: DashboardWidgetConfig[] = [
    {
      id: 'pinned-articles',
      title: 'Najczęściej Wykorzystywane Artykuły k.k.',
      icon: 'bookmark',
      visible: true,
      colSpan: 1,
      order: 0,
      collapsed: false,
    },
    {
      id: 'active-cases',
      title: 'Aktywne Sprawy Kancelarii & Terminy',
      icon: 'folder_shared',
      visible: true,
      colSpan: 1,
      order: 1,
      collapsed: false,
    },
    {
      id: 'recent-searches',
      title: 'Ostatnie Wyszukiwania & Scenariusze',
      icon: 'history',
      visible: true,
      colSpan: 1,
      order: 2,
      collapsed: false,
    },
  ];

  readonly preferences = signal<DashboardPreferences>({
    columns: 2,
    density: 'comfortable',
    widgets: this.defaultWidgets,
  });

  readonly isCustomizing = signal<boolean>(false);
  readonly recentSearches = signal<RecentSearchItem[]>([]);
  readonly activeCases = signal<ActiveCaseItem[]>([]);
  readonly pinnedArticleIds = signal<string[]>(['art-178a', 'art-278', 'art-286', 'art-25']);

  constructor() {
    this.loadPreferences();
    this.loadRecentSearches();
    this.loadActiveCases();
    this.loadPinnedArticles();

    // Automatyczne zapisywanie preferencji przy zmianie stanu
    effect(() => {
      this.savePreferencesToStorage(this.preferences());
    });
  }

  // --- Zarządzanie preferencjami siatki (Grid Layout) ---
  private loadPreferences(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(this.PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DashboardPreferences;
        if (parsed && Array.isArray(parsed.widgets)) {
          // Upewnij się, że nowe widżety są uwzględnione
          const mergedWidgets = this.defaultWidgets.map((def) => {
            const existing = parsed.widgets.find((w) => w.id === def.id);
            return existing ? { ...def, ...existing } : def;
          });
          mergedWidgets.sort((a, b) => a.order - b.order);

          this.preferences.set({
            columns: parsed.columns || 2,
            density: parsed.density || 'comfortable',
            widgets: mergedWidgets,
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Nie można załadować preferencji pulpitu:', e);
    }
  }

  private savePreferencesToStorage(prefs: DashboardPreferences): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('Błąd zapisu preferencji pulpitu:', e);
    }
  }

  setColumns(cols: 1 | 2 | 3): void {
    this.preferences.update((p) => ({ ...p, columns: cols }));
  }

  setDensity(density: 'comfortable' | 'compact'): void {
    this.preferences.update((p) => ({ ...p, density }));
  }

  toggleWidgetCollapse(widgetId: DashboardWidgetId): void {
    this.preferences.update((p) => ({
      ...p,
      widgets: p.widgets.map((w) =>
        w.id === widgetId ? { ...w, collapsed: !w.collapsed } : w
      ),
    }));
  }

  toggleWidgetVisibility(widgetId: DashboardWidgetId): void {
    this.preferences.update((p) => ({
      ...p,
      widgets: p.widgets.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      ),
    }));
  }

  toggleWidgetColSpan(widgetId: DashboardWidgetId): void {
    this.preferences.update((p) => ({
      ...p,
      widgets: p.widgets.map((w) =>
        w.id === widgetId ? { ...w, colSpan: w.colSpan === 1 ? 2 : 1 } : w
      ),
    }));
  }

  moveWidget(widgetId: DashboardWidgetId, direction: 'up' | 'down'): void {
    const list = [...this.preferences().widgets].sort((a, b) => a.order - b.order);
    const index = list.findIndex((w) => w.id === widgetId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = list[index - 1];
      list[index - 1] = list[index];
      list[index] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index + 1];
      list[index + 1] = list[index];
      list[index] = temp;
    }

    // Ponownie przypisz numery kolejności (order)
    const reordered = list.map((w, idx) => ({ ...w, order: idx }));
    this.preferences.update((p) => ({ ...p, widgets: reordered }));
  }

  resetLayout(): void {
    this.preferences.set({
      columns: 2,
      density: 'comfortable',
      widgets: this.defaultWidgets.map((w) => ({ ...w })),
    });
  }

  toggleCustomizing(): void {
    this.isCustomizing.update((v) => !v);
  }

  // --- Przypięte Artykuły (Pinned Articles) ---
  private loadPinnedArticles(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(this.PINNED_ARTICLES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.pinnedArticleIds.set(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Błąd ładowania przypiętych artykułów:', e);
    }
  }

  private savePinnedArticles(ids: string[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.PINNED_ARTICLES_KEY, JSON.stringify(ids));
    } catch (e) {
      console.error('Błąd zapisu przypiętych artykułów:', e);
    }
  }

  togglePinArticle(articleId: string): void {
    const current = this.pinnedArticleIds();
    const updated = current.includes(articleId)
      ? current.filter((id) => id !== articleId)
      : [...current, articleId];

    this.pinnedArticleIds.set(updated);
    this.savePinnedArticles(updated);
    this.legalData.toggleArticleOfflinePin(articleId);
  }

  isArticlePinned(articleId: string): boolean {
    return this.pinnedArticleIds().includes(articleId);
  }

  getPinnedArticles(): PenalArticle[] {
    const ids = this.pinnedArticleIds();
    const all = this.legalData.articles();
    return all.filter((a) => ids.includes(a.id));
  }

  // --- Ostatnie Wyszukiwania (Recent Searches) ---
  private loadRecentSearches(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(this.RECENT_SEARCHES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.recentSearches.set(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Błąd ładowania ostatnich wyszukiwań:', e);
    }

    // Przykłady początkowe
    const initial: RecentSearchItem[] = [
      {
        id: 'search-1',
        query: 'Jazda samochodem 1.6 promila po alkoholu',
        timestamp: 'Dzisiaj, 09:15',
        matchedCount: 2,
        riskLevel: 'bardzo wysoki',
        isPinned: true,
      },
      {
        id: 'search-2',
        query: 'Kradzież w markecie na kwotę 950 zł',
        timestamp: 'Wczoraj, 18:30',
        matchedCount: 2,
        riskLevel: 'średni',
        isPinned: true,
      },
      {
        id: 'search-3',
        query: 'Odpieranie ataku nożownika przed domem (obrona konieczna)',
        timestamp: '2 dni temu',
        matchedCount: 1,
        riskLevel: 'niski',
        isPinned: false,
      },
    ];
    this.recentSearches.set(initial);
  }

  recordSearch(query: string, matchedCount: number, riskLevel: 'niski' | 'średni' | 'wysoki' | 'bardzo wysoki'): void {
    if (!query || query.trim().length < 3) return;
    const cleanQuery = query.trim();

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const existing = this.recentSearches().find((s) => s.query.toLowerCase() === cleanQuery.toLowerCase());
    const isPinned = existing ? existing.isPinned : false;

    const newItem: RecentSearchItem = {
      id: `search-${Date.now()}`,
      query: cleanQuery,
      timestamp: `Dzisiaj, ${timeStr}`,
      matchedCount,
      riskLevel,
      isPinned,
    };

    const filtered = this.recentSearches().filter((s) => s.query.toLowerCase() !== cleanQuery.toLowerCase());
    const updated = [newItem, ...filtered].slice(0, 15);
    this.recentSearches.set(updated);
    this.saveRecentSearches(updated);
  }

  togglePinSearch(id: string): void {
    const updated = this.recentSearches().map((s) =>
      s.id === id ? { ...s, isPinned: !s.isPinned } : s
    );
    this.recentSearches.set(updated);
    this.saveRecentSearches(updated);
  }

  removeRecentSearch(id: string): void {
    const updated = this.recentSearches().filter((s) => s.id !== id);
    this.recentSearches.set(updated);
    this.saveRecentSearches(updated);
  }

  clearRecentSearches(): void {
    const updated = this.recentSearches().filter((s) => s.isPinned);
    this.recentSearches.set(updated);
    this.saveRecentSearches(updated);
  }

  private saveRecentSearches(items: RecentSearchItem[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Błąd zapisu ostatnich wyszukiwań:', e);
    }
  }

  // --- Aktywne Sprawy (Active Cases) ---
  private loadActiveCases(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(this.ACTIVE_CASES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.activeCases.set(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Błąd ładowania aktywnych spraw:', e);
    }

    // Przykłady początkowe spraw kancelarii
    const sampleCases: ActiveCaseItem[] = [
      {
        id: 'case-1',
        title: 'Sprawa J. Kowalski – zarzut art. 178a § 1 k.k.',
        caseNumber: 'II K 114/24',
        clientName: 'Jan Kowalski',
        stage: 'Przygotowawcze (Policja/Prokuratura)',
        priority: 'pilne',
        linkedArticleRef: 'Art. 178a § 1 k.k.',
        updatedAt: '2024-03-20',
        summary: 'Badanie 0.28 mg/l. Przygotowano wniosek o warunkowe umorzenie postępowania bez utraty uprawnień.',
      },
      {
        id: 'case-2',
        title: 'Sprawa A. Nowak – transakcje BLIK',
        caseNumber: 'III K 89/24',
        clientName: 'Anna Nowak',
        stage: 'Sąd I Instancji',
        priority: 'normalne',
        linkedArticleRef: 'Art. 286 § 1 k.k.',
        updatedAt: '2024-03-18',
        summary: 'Wniosek o zakwalifikowanie czynu jako wypadku mniejszej wagi (art. 286 § 3 k.k.).',
      },
      {
        id: 'case-3',
        title: 'Zdarzenie klubowe – obrona konieczna',
        caseNumber: 'DS 45/24',
        clientName: 'Piotr Wiśniewski',
        stage: 'Przygotowawcze (Policja/Prokuratura)',
        priority: 'pilne',
        linkedArticleRef: 'Art. 25 § 1 k.k.',
        updatedAt: '2024-03-15',
        summary: 'Przesłuchanie w charakterze podejrzanego z art. 158 § 1 k.k. Zgłoszono wniosek o zabezpieczenie monitoringu.',
      },
    ];
    this.activeCases.set(sampleCases);
  }

  addActiveCase(item: Omit<ActiveCaseItem, 'id' | 'updatedAt'>): void {
    const newCase: ActiveCaseItem = {
      ...item,
      id: `case-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newCase, ...this.activeCases()];
    this.activeCases.set(updated);
    this.saveActiveCases(updated);

    // Kolejkuj dodanie nowej sprawy w OfflineSyncService
    this.offlineSync.enqueueChange('case', 'CREATE', newCase.id, newCase);
  }

  updateCaseStage(id: string, stage: ActiveCaseItem['stage']): void {
    const updated = this.activeCases().map((c) =>
      c.id === id ? { ...c, stage, updatedAt: new Date().toISOString().split('T')[0] } : c
    );
    this.activeCases.set(updated);
    this.saveActiveCases(updated);

    const updatedCase = updated.find((c) => c.id === id);
    if (updatedCase) {
      this.offlineSync.enqueueChange('case', 'UPDATE', id, updatedCase);
    }
  }

  deleteActiveCase(id: string): void {
    const deletedCase = this.activeCases().find((c) => c.id === id);
    const updated = this.activeCases().filter((c) => c.id !== id);
    this.activeCases.set(updated);
    this.saveActiveCases(updated);

    this.offlineSync.enqueueChange('case', 'DELETE', id, {
      id,
      title: deletedCase?.title || id,
    });
  }

  private saveActiveCases(cases: ActiveCaseItem[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.ACTIVE_CASES_KEY, JSON.stringify(cases));
    } catch (e) {
      console.error('Błąd zapisu aktywnych spraw:', e);
    }
  }
}
