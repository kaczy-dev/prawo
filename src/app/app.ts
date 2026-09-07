import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LegalDataService } from './services/legal-data.service';
import { PrawnBotAiService } from './services/prawn-bot-ai.service';
import { CryptoService } from './services/crypto.service';
import { PdfExportService } from './services/pdf-export.service';
import { SpeechDictationService } from './services/speech-dictation.service';
import {
  PenalArticle,
  CourtRuling,
  ThreatAnalysisResult,
} from './models/legal.model';

import { ThreatCalculator } from './components/threat-calculator';
import { PenalCodeBrowser } from './components/penal-code-browser';
import { RulingsBrowser } from './components/rulings-browser';
import { LegalChat } from './components/legal-chat';
import { EncryptedNotes } from './components/encrypted-notes';
import { LegalAlerts } from './components/legal-alerts';
import { TechnicalDocs } from './components/technical-docs';
import { VaultModal } from './components/vault-modal';
import { ReadAloudPlayer } from './components/read-aloud-player';
import { TextToSpeechService } from './services/text-to-speech.service';
import { HandbooksBrowser } from './components/handbooks-browser';
import { HandbooksDataService } from './services/handbooks-data.service';
import { DashboardWidgetGrid } from './components/dashboard-widget-grid';
import { DashboardWidgetsService } from './services/dashboard-widgets.service';
import { LegalDictionaryModal } from './components/legal-dictionary-modal';
import { LegalContextTooltip } from './components/legal-context-tooltip';
import { LegalDictionaryService } from './services/legal-dictionary.service';
import { OfflineSyncManagerModal } from './components/offline-sync-manager-modal';
import { OfflineSyncService } from './services/offline-sync.service';

export type ActiveTab =
  | 'threat-calc'
  | 'handbooks'
  | 'penal-code'
  | 'rulings'
  | 'ai-chat'
  | 'alerts'
  | 'notes'
  | 'technical-docs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    CommonModule,
    MatIconModule,
    ThreatCalculator,
    DashboardWidgetGrid,
    HandbooksBrowser,
    PenalCodeBrowser,
    RulingsBrowser,
    LegalChat,
    EncryptedNotes,
    LegalAlerts,
    TechnicalDocs,
    VaultModal,
    ReadAloudPlayer,
    LegalDictionaryModal,
    LegalContextTooltip,
    OfflineSyncManagerModal,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly legalData = inject(LegalDataService);
  readonly aiService = inject(PrawnBotAiService);
  readonly cryptoService = inject(CryptoService);
  readonly pdfService = inject(PdfExportService);
  readonly speech = inject(SpeechDictationService);
  readonly tts = inject(TextToSpeechService);
  readonly widgetsService = inject(DashboardWidgetsService);
  readonly dictService = inject(LegalDictionaryService);
  readonly handbooksData = inject(HandbooksDataService);
  readonly offlineSync = inject(OfflineSyncService);

  readonly penalCodeComp = viewChild(PenalCodeBrowser);
  readonly rulingsComp = viewChild(RulingsBrowser);
  readonly notesComp = viewChild(EncryptedNotes);

  // Aktywna zakładka
  readonly activeTab = signal<ActiveTab>('threat-calc');

  // Stan kalkulatora "Co mi grozi?" oraz wyszukiwarki globalnej
  readonly threatQuery = signal<string>(
    'Jazda samochodem pod wpływem alkoholu, badanie wykazało 1.6 promila'
  );
  readonly quickSearchQuery = signal<string>('');
  readonly showQuickSearchDropdown = signal<boolean>(false);
  readonly threatCategoryFilter = signal<string>('all');
  readonly threatAnalysis = signal<ThreatAnalysisResult | null>(null);

  // Modal skarbca
  readonly isVaultModalOpen = signal<boolean>(false);

  // Popularne scenariusze czynów zabronionych do natychmiastowego wyszukiwania
  readonly popularScenarios = [
    {
      label: 'Zakłócanie ciszy nocnej (art. 51 k.w.)',
      category: 'order',
      query:
        'Zakłócanie ciszy nocnej, głośna muzyka po 22:00, odmowa przyjęcia mandatu (art. 51 k.w.)',
      artRef: 'Art. 51 k.w.',
    },
    {
      label: 'Jazda bez uprawnień (art. 94 k.w.)',
      category: 'traffic',
      query:
        'Jazda samochodem bez prawa jazdy i uprawnień (art. 94 k.w. zakaz prowadzenia)',
      artRef: 'Art. 94 k.w.',
    },
    {
      label: 'Posiadanie marihuany (art. 62a UoPN)',
      category: 'drugs',
      query:
        'Posiadanie 1 grama marihuany na własny użytek (art. 62a UoPN umorzenie)',
      artRef: 'Art. 62a UoPN',
    },
    {
      label: 'Hejt w internecie (art. 212 k.k.)',
      category: 'defamation',
      query:
        'Hejt w internecie, fałszywa opinia na Google i pomówienie w social mediach (art. 212 k.k.)',
      artRef: 'Art. 212 k.k.',
    },
    {
      label: 'Porysowanie auta / szkoda (art. 288 k.k.)',
      category: 'theft',
      query:
        'Porysowanie lakieru samochodu na parkingu, wycena szkody (art. 288 k.k.)',
      artRef: 'Art. 288 k.k.',
    },
    {
      label: 'Złamanie zakazu sądowego (art. 244 k.k.)',
      category: 'official',
      query:
        'Prowadzenie pojazdu w okresie obowiązywania sądowego zakazu (art. 244 k.k.)',
      artRef: 'Art. 244 k.k.',
    },
    {
      label: 'Jazda 1.6 promila (Konfiskata auta)',
      category: 'traffic',
      query:
        'Jazda samochodem pod wpływem alkoholu, badanie wykazało 1.6 promila (konfiskata auta)',
      artRef: 'Art. 178a k.k.',
    },
    {
      label: 'Kradzież w markecie (1200 zł)',
      category: 'theft',
      query:
        'Kradzież w markecie towaru o wartości 1200 zł (próg przestępstwa 800 zł)',
      artRef: 'Art. 278 k.k.',
    },
    {
      label: 'Płatność cudzą kartą zbliżeniową',
      category: 'theft',
      query:
        'Płatność zbliżeniowa znalezioną kartą bankową (kradzież z włamaniem)',
      artRef: 'Art. 279 k.k.',
    },
    {
      label: 'Oszustwo internetowe / BLIK',
      category: 'fraud',
      query:
        'Wyłudzenie kodu BLIK i oszustwo w serwisie ogłoszeniowym (art. 286 k.k.)',
      artRef: 'Art. 286 k.k.',
    },
    {
      label: 'Bójka i pobicie pod klubem',
      category: 'violence',
      query:
        'Udział w bójce pod klubem i naruszenie czynności narządu ciała (art. 158 k.k.)',
      artRef: 'Art. 158 k.k.',
    },
    {
      label: 'Stalking i uporczywe smsy',
      category: 'threats',
      query:
        'Uporczywe nękanie wiadomościami SMS, nachodzenie w miejscu pracy (art. 190a k.k.)',
      artRef: 'Art. 190a k.k.',
    },
    {
      label: 'Groźby karalne',
      category: 'threats',
      query:
        'Grożenie pozbawieniem życia w kłótni sąsiedzkiej (art. 190 k.k.)',
      artRef: 'Art. 190 k.k.',
    },
    {
      label: 'Zniewaga policjanta na służbie',
      category: 'official',
      query:
        'Zniewaga i wyzwiska pod adresem interweniującego policjanta (art. 226 k.k.)',
      artRef: 'Art. 226 k.k.',
    },
    {
      label: 'Zaległości alimentacyjne (>3 m-ce)',
      category: 'family',
      query:
        'Niepłacenie alimentów przez okres przekraczający 3 miesiące (art. 209 k.k.)',
      artRef: 'Art. 209 k.k.',
    },
    {
      label: 'Przemoc domowa / znęcanie',
      category: 'family',
      query:
        'Awantury domowe, znęcanie psychiczne i fizyczne, Niebieska Karta (art. 207 k.k.)',
      artRef: 'Art. 207 k.k.',
    },
    {
      label: 'Obrona konieczna w domu',
      category: 'defense',
      query:
        'Odpieranie ataku włamywacza we własnym domu (art. 25 k.k. obrona konieczna)',
      artRef: 'Art. 25 k.k.',
    },
    {
      label: 'Warunkowe umorzenie postępowania',
      category: 'defense',
      query:
        'Warunkowe umorzenie postępowania karnego dla osoby niekaranej (art. 66 k.k.)',
      artRef: 'Art. 66 k.k.',
    },
  ];

  readonly filteredScenarios = computed(() => {
    const cat = this.threatCategoryFilter();
    if (cat === 'all') return this.popularScenarios;
    return this.popularScenarios.filter((s) => s.category === cat);
  });

  constructor() {
    this.runThreatAnalysis();
  }

  // --- Integracja Dyktowania Web Speech API w Headerze ---
  isHeaderDictating(): boolean {
    return this.speech.isListening() && this.speech.activeTarget() === 'header-global-search';
  }

  toggleHeaderDictation(): void {
    if (this.isHeaderDictating()) {
      this.speech.stop();
      return;
    }

    this.speech.start('header-global-search', (chunk: string, isFinal: boolean) => {
      this.quickSearchQuery.set(chunk);
      if (isFinal) {
        this.executeGlobalSearch(chunk.trim());
      }
    });
  }

  // --- Akcje Kalkulatora i Wyszukiwarki "Co mi grozi?" ---
  setThreatQuery(q: string): void {
    this.threatQuery.set(q);
  }

  setThreatCategory(cat: string): void {
    this.threatCategoryFilter.set(cat);
  }

  executeGlobalSearch(customQuery?: string): void {
    const q = (customQuery !== undefined ? customQuery : this.quickSearchQuery()).trim();
    if (!q) return;
    this.threatQuery.set(q);
    this.quickSearchQuery.set(q);
    this.showQuickSearchDropdown.set(false);
    this.activeTab.set('threat-calc');
    this.runThreatAnalysis();
  }

  clearThreatQuery(): void {
    this.threatQuery.set('');
    this.quickSearchQuery.set('');
    this.threatAnalysis.set(null);
  }

  runThreatAnalysis(): void {
    const query = this.threatQuery();
    if (!query.trim()) return;
    const result = this.aiService.analyzeSituation(query);
    this.threatAnalysis.set(result);
    if (result) {
      this.widgetsService.recordSearch(
        query,
        result.matchedArticles.length,
        result.riskLevel
      );
    }
  }

  exportCurrentAnalysisToPdf(): void {
    const result = this.threatAnalysis();
    if (!result) return;
    this.pdfService.exportThreatAnalysisToPdf(this.threatQuery(), result);
  }

  // --- Słownik Pojęć Prawnych (Offline) ---
  openLegalDictionary(termIdOrName?: string): void {
    this.dictService.openModal(termIdOrName);
  }

  // --- Przejścia Międzyzakładkowe ---
  searchInPenalCodeById(articleId: string): void {
    this.activeTab.set('penal-code');
    setTimeout(() => {
      this.penalCodeComp()?.selectArticleById(articleId);
    }, 50);
  }

  openHandbookTopic(slug: string): void {
    this.activeTab.set('handbooks');
    this.handbooksData.selectTopic(slug);
  }

  searchInPenalCode(query: string): void {
    this.activeTab.set('penal-code');
    setTimeout(() => {
      this.penalCodeComp()?.setSearchQuery(query);
    }, 50);
  }

  searchInRulings(query: string): void {
    this.activeTab.set('rulings');
    setTimeout(() => {
      this.rulingsComp()?.setSearchQuery(query);
    }, 50);
  }

  inspectArticleFromThreat(art: PenalArticle): void {
    this.activeTab.set('penal-code');
    setTimeout(() => {
      this.penalCodeComp()?.selectArticleByRef(art);
    }, 50);
  }

  openCalculatorFromChat(query: string): void {
    this.threatQuery.set(query);
    this.quickSearchQuery.set(query);
    this.activeTab.set('threat-calc');
    this.runThreatAnalysis();
  }

  inspectArticleFromChat(artRef: string): void {
    this.activeTab.set('penal-code');
    setTimeout(() => {
      this.penalCodeComp()?.setSearchQuery(artRef);
    }, 50);
  }

  // --- Integracja z Podręcznikami Prawa ---
  openArticleFromHandbook(artRef: string): void {
    this.activeTab.set('penal-code');
    setTimeout(() => {
      this.penalCodeComp()?.setSearchQuery(artRef);
    }, 50);
  }

  openRulingFromHandbook(sig: string): void {
    this.activeTab.set('rulings');
    setTimeout(() => {
      this.rulingsComp()?.setSearchQuery(sig);
    }, 50);
  }

  testScenarioInCalculator(query: string): void {
    this.threatQuery.set(query);
    this.quickSearchQuery.set(query);
    this.activeTab.set('threat-calc');
    this.runThreatAnalysis();
  }

  checkThreatForArticle(art: PenalArticle): void {
    const query = `Art. ${art.number}${art.suffix || ''} k.k. ${art.title}`;
    this.threatQuery.set(query);
    this.quickSearchQuery.set(query);
    this.activeTab.set('threat-calc');
    this.runThreatAnalysis();
  }

  checkThreatForRuling(ruling: CourtRuling): void {
    const query = `${ruling.articleRef} ${ruling.title}`;
    this.threatQuery.set(query);
    this.quickSearchQuery.set(query);
    this.activeTab.set('threat-calc');
    this.runThreatAnalysis();
  }

  createNoteForArticle(art: PenalArticle): void {
    this.activeTab.set('notes');
    setTimeout(() => {
      this.notesComp()?.openCreateFormForArticle(art);
    }, 50);
  }

  createNoteForRuling(ruling: CourtRuling): void {
    this.activeTab.set('notes');
    setTimeout(() => {
      this.notesComp()?.openCreateFormForRuling(ruling);
    }, 50);
  }

  // --- Skarbiec Kryptograficzny ---
  openVaultModal(): void {
    this.isVaultModalOpen.set(true);
  }

  closeVaultModal(): void {
    this.isVaultModalOpen.set(false);
  }

  lockVault(): void {
    this.cryptoService.logout();
  }

  // --- Offline Sync & Przedawnienie ---
  openSyncManager(): void {
    this.offlineSync.openModal();
  }

  async savePrescriptionNote(data: { title: string; content: string; linkedArticle: string }): Promise<void> {
    const success = await this.legalData.saveNote({
      title: data.title,
      content: data.content,
      linkedArticle: data.linkedArticle,
      category: 'Analiza prawna',
      tags: ['przedawnienie', 'kalkulator', 'art. 101 k.k.'],
    });
    if (success) {
      this.activeTab.set('notes');
    }
  }
}
