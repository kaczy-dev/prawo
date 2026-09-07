export interface PenalArticle {
  id: string;
  number: number;
  suffix?: string;
  codePrefix?: string; // np. 'k.k.', 'k.w.', 'UoPN'
  title: string;
  chapter: string;
  chapterNumber: string;
  content: string;
  plainSummary: string;
  penalties: {
    fine: boolean; // grzywna
    restrictionOfLiberty: boolean; // ograniczenie wolności
    imprisonmentMinMonths: number; // pozbawienie wolności min
    imprisonmentMaxMonths: number; // pozbawienie wolności max
    summary: string;
  };
  additionalSanctions?: string[]; // np. zakaz prowadzenia pojazdów, przepadek mienia
  isFelony: boolean; // zbrodnia (min. 3 lata) czy występek
  keywords: string[];
  recentAmendment?: {
    date: string;
    description: string;
    previousContent?: string;
    amendmentSummary?: string;
  };
  isOfflinePinned?: boolean;
}

export interface CourtRuling {
  id: string;
  signature: string; // np. II KK 142/23
  court: string; // np. Sąd Najwyższy - Izba Karna
  date: string;
  articleRef: string; // np. Art. 278 § 1 k.k.
  title: string;
  thesis: string; // Teza orzeczenia
  sanctionImposed: string; // Zastosowana kara / orzeczenie
  summaryPlain: string; // Wyjaśnienie prostym językiem
  tags: string[];
}

export interface LegalAlert {
  id: string;
  date: string;
  title: string;
  affectedArticles: string[];
  severity: 'high' | 'medium' | 'info';
  summary: string;
  fullDescription: string;
  practicalImpact: string;
}

export interface EncryptedNote {
  id: string;
  title: string;
  content: string; // W pamięci jawne, w storage zaszyfrowane AES-GCM
  category: 'Sprawa klienta' | 'Analiza prawna' | 'Wniosek dowodowy' | 'Notatka z rozprawy';
  linkedArticle?: string;
  tags: string[];
  updatedAt: string;
  isEncrypted: boolean;
}

export interface ThreatAnalysisResult {
  matchedArticles: PenalArticle[];
  riskLevel: 'niski' | 'średni' | 'wysoki' | 'bardzo wysoki';
  possibleSanctions: string[];
  primarySentenceRange: string;
  mandatoryMeasures: string[];
  mitigatingFactors: string[];
  aggravatingFactors: string[];
  plainExplanation: string;
  similarRulings: CourtRuling[];
  recommendedSteps: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  referencedArticles?: string[];
  referencedRulings?: string[];
  suggestedFollowUps?: string[];
  legalCategoryBadge?: string;
  actionQuery?: string;
}

export interface UserSession {
  username: string;
  isAuthenticated: boolean;
  loginTime: string;
  vaultKey?: CryptoKey;
}

export interface FormattedParagraph {
  header?: string; // np. "§ 1", "§ 4" lub "Ustęp 1"
  body: string;
}

export interface ReadLaterItem {
  id: string; // id artykułu np. 'art-178a'
  articleId: string;
  articleNumber: number;
  articleSuffix?: string;
  title: string;
  chapter: string;
  chapterNumber: string;
  rawContent: string;
  formattedParagraphs: FormattedParagraph[];
  plainSummary: string;
  penaltiesSummary: string;
  additionalSanctions?: string[];
  isFelony: boolean;
  savedAt: string;
  readingTimeMinutes: number;
  isRead: boolean;
  userNotes?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  scenario: string; // Opis sytuacji z życia codziennego
  legalDilemma: string; // Kluczowe pytanie i wątpliwość prawna
  courtResolution: string; // Wykładnia sądu i zastosowany przepis
  practicalTakeaway: string; // Praktyczny wniosek dla każdego
  relatedArticles: { code: string; label: string; articleId?: string }[];
  relatedRulingSignatures: string[];
  calculatorScenarioQuery?: string; // Gotowe zapytanie do przetestowania w kalkulatorze zagrożenia
}

export interface HandbookQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface HandbookTopic {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  difficulty: 'podstawowy' | 'średniozaawansowany' | 'zaawansowany';
  category: 'Część ogólna' | 'Ruch drogowy' | 'Mienie i oszustwa' | 'Życie i zdrowie' | 'Procedura i zatrzymanie';
  readTimeMinutes: number;
  icon: string;
  summary: string;
  sections: {
    heading: string;
    paragraphs: string[];
  }[];
  keyRules: string[];
  mythsAndFacts: {
    myth: string;
    fact: string;
  }[];
  caseStudies: CaseStudy[];
  linkedArticleRefs: { code: string; label: string; articleId?: string }[];
  linkedRulingSignatures: string[];
  quickScenarioQuery?: string;
  quiz?: HandbookQuizQuestion;
}

export interface LegalDictionaryTerm {
  id: string;
  term: string; // np. "Kontratyp"
  aliases: string[]; // formy fleksyjne, np. ["kontratyp", "kontratypu", "kontratypem", "kontratypy"]
  category: 'Zasady ogólne' | 'Kary i środki' | 'Obrona i wyłączenia' | 'Procedura karna' | 'Typy przestępstw';
  plainDefinition: string; // Proste wyjaśnienie dla laika
  legalBasis: string; // Podstawa prawna, np. "Art. 25-27 k.k."
  practicalExample: string; // Życiowy kazus obrazujący pojęcie
  warningTip?: string; // Pułapka prawna lub częsty błąd
  relatedArticleId?: string; // Opcjonalne powiązanie z artykułem k.k.
}

export type DashboardWidgetId =
  | 'pinned-articles'
  | 'active-cases'
  | 'recent-searches'
  | 'quick-launcher';

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  title: string;
  icon: string;
  visible: boolean;
  colSpan: 1 | 2; // Rozpiętość w siatce
  order: number;
  collapsed?: boolean;
}

export interface RecentSearchItem {
  id: string;
  query: string;
  timestamp: string;
  matchedCount: number;
  riskLevel: 'niski' | 'średni' | 'wysoki' | 'bardzo wysoki';
  isPinned?: boolean;
}

export interface ActiveCaseItem {
  id: string;
  title: string;
  caseNumber?: string; // np. "II K 45/24"
  clientName?: string;
  stage: 'Przygotowawcze (Policja/Prokuratura)' | 'Sąd I Instancji' | 'Apelacja' | 'Wykonawcze' | 'Konsultacja';
  priority: 'pilne' | 'normalne' | 'niskie';
  linkedArticleRef?: string;
  updatedAt: string;
  summary: string;
  noteId?: string;
}

export interface DashboardPreferences {
  columns: 1 | 2 | 3;
  density: 'comfortable' | 'compact';
  widgets: DashboardWidgetConfig[];
}

// --- Modele Przedawnienia Karalności (Prescription Timer) ---

export type PrescriptionSeverity = 'active' | 'warning' | 'critical' | 'prescribed';

export interface PrescriptionResult {
  eventDate: string; // YYYY-MM-DD
  calculationDate: string; // aktualna data odniesienia
  article: PenalArticle;
  baseYears: number; // np. 5, 10, 15, 30, 40
  extendedYears: number; // np. 0, +5, +10 (art. 102 k.k.)
  totalYears: number;
  hasProceedingsInPersonam: boolean; // wszczęto postępowanie przeciwko osobie (art. 102 k.k.)
  isPrivateProsecution: boolean; // z oskarżenia prywatnego (art. 101 § 2 k.k.)
  isNeverPrescribed: boolean; // zbrodnie nieprzedawniające się (art. 105 k.k.)
  
  targetExpirationDate: string; // Data graniczna ustania karalności (ISO YYYY-MM-DD)
  formattedExpirationDate: string; // sformatowana po polsku, np. 14 października 2028 r.
  
  isExpired: boolean; // czy uległo przedawnieniu
  daysRemaining: number; // dni pozostałe (lub ujemne jeśli po terminie)
  monthsRemaining: number;
  yearsRemaining: number;
  
  severity: PrescriptionSeverity;
  progressPercent: number; // 0 - 100% czasu który upłynął
  
  legalBasis: string; // np. "Art. 101 § 1 pkt 3 k.k. w zw. z art. 102 k.k."
  statutoryRuleSummary: string; // wyjaśnienie zasady
  defenseTacticsRecommendation: string; // porada dla adwokata / podejrzanego
  warningNotice?: string; // komunikat ostrzegawczy
}

// --- Modele Synchronizacji Offline (Offline-First Sync Manager) ---

export type SyncEntityType = 'note' | 'case';
export type SyncOperationType = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncItemStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

export interface SyncQueueItem {
  id: string; // unikalny identyfikator wpisu w kolejce
  entityType: SyncEntityType;
  operation: SyncOperationType;
  entityId: string;
  payload: Record<string, unknown>; // dane notatki lub sprawy
  timestamp: number; // epoch ms utworzenia zmiany
  status: SyncItemStatus;
  retryCount: number;
  errorMessage?: string;
  localVersion?: number;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string; // godzina / data
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  entityType?: SyncEntityType;
  entityId?: string;
  operation?: SyncOperationType;
}

export interface SyncConflict {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  localPayload: Record<string, unknown>;
  remotePayload: Record<string, unknown>;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
  resolved: boolean;
  resolutionChoice?: 'local' | 'remote' | 'merged';
}

export interface AutocompleteSuggestion {
  id: string;
  type: 'article' | 'term' | 'ruling';
  label: string;
  subLabel: string;
  category: string;
  searchQuery: string;
  articleId?: string;
  badge?: string;
}

