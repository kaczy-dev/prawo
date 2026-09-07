import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PenalArticle, ChatMessage } from '../models/legal.model';
import { LegalDataService } from '../services/legal-data.service';
import { PdfExportService } from '../services/pdf-export.service';
import { ReadLaterService } from '../services/read-later.service';
import { PrawnBotAiService } from '../services/prawn-bot-ai.service';
import { SpeechDictationService } from '../services/speech-dictation.service';
import { TextToSpeechService } from '../services/text-to-speech.service';

@Component({
  selector: 'app-penal-code-browser',
  imports: [CommonModule, MatIconModule],
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
    '(document:keydown.arrowleft)': 'onArrowLeft($event)',
    '(document:keydown.arrowright)': 'onArrowRight($event)',
  },
  template: `
    <section id="section-penal-code" class="space-y-6">
      <!-- ================= TRYB SKUPIENIA (FOCUS MODE) ================= -->
      @if (isFocusMode()) {
        @if (selectedArticle(); as art) {
          <div id="penal-focus-mode-view" class="min-h-[85vh] rounded-2xl border p-4 sm:p-8 transition-colors duration-200" [class]="focusContainerClasses()">
            <!-- Pasek Narzędziowy Trybu Skupienia (Sticky) -->
            <div class="sticky top-2 z-20 pb-4 mb-6 border-b flex flex-wrap items-center justify-between gap-3 backdrop-blur-md bg-opacity-95" [class]="focusHeaderBorderClass()">
              <div class="flex items-center gap-3">
                <button
                  id="btn-exit-focus-mode"
                  (click)="exitFocusMode()"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm"
                  [class]="focusButtonClass()"
                  title="Powrót do standardowej przeglądarki kodeksu (Klawisz ESC)"
                >
                  <mat-icon class="text-sm">arrow_back</mat-icon>
                  <span>Wyjdź (ESC)</span>
                </button>

                <div class="flex items-center gap-1 text-xs">
                  <button
                    id="btn-focus-prev-article"
                    (click)="prevArticle()"
                    [disabled]="isFirstArticle()"
                    class="p-1 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    [class]="focusIconBtnClass()"
                    title="Poprzedni artykuł (Strzałka w lewo)"
                  >
                    <mat-icon class="text-sm block">chevron_left</mat-icon>
                  </button>
                  <span class="font-mono text-[11px] px-1 opacity-75">
                    {{ currentArticleIndex() + 1 }} / {{ filteredArticles().length }}
                  </span>
                  <button
                    id="btn-focus-next-article"
                    (click)="nextArticle()"
                    [disabled]="isLastArticle()"
                    class="p-1 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    [class]="focusIconBtnClass()"
                    title="Następny artykuł (Strzałka w prawo)"
                  >
                    <mat-icon class="text-sm block">chevron_right</mat-icon>
                  </button>
                </div>

                <span class="hidden md:inline-block text-xs opacity-60 font-mono">
                  {{ currentReadingTime() }} min czytania
                </span>

                <!-- Przycisk Czytaj na Głos w Trybie Skupienia (Web Speech API) -->
                <button
                  id="btn-focus-read-aloud"
                  (click)="tts.speakArticle(art)"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm"
                  [class]="tts.isPlaying() && tts.currentTextId() === art.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/25'
                    : focusButtonClass()"
                  [title]="tts.isPlaying() && tts.currentTextId() === art.id ? (tts.isPaused() ? 'Wznów odczyt na głos' : 'Wstrzymaj odczyt na głos') : 'Czytaj artykuł na głos (Lektor Web Speech API)'"
                  aria-label="Czytaj artykuł na głos"
                >
                  @if (tts.isPlaying() && tts.currentTextId() === art.id && !tts.isPaused()) {
                    <span class="flex items-end gap-0.5 h-3">
                      <span class="w-1 bg-slate-950 h-3 rounded-full animate-[bounce_0.8s_ease-in-out_infinite]"></span>
                      <span class="w-1 bg-slate-950 h-2 rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.2s]"></span>
                      <span class="w-1 bg-slate-950 h-3.5 rounded-full animate-[bounce_0.9s_ease-in-out_infinite_0.4s]"></span>
                    </span>
                    <span>Pauza</span>
                  } @else if (tts.isPlaying() && tts.currentTextId() === art.id && tts.isPaused()) {
                    <mat-icon class="text-sm">play_arrow</mat-icon>
                    <span>Wznów</span>
                  } @else {
                    <mat-icon class="text-sm">record_voice_over</mat-icon>
                    <span>Czytaj na głos</span>
                  }
                </button>
              </div>

              <!-- Narzędzia czytelności: Kontrast, Rozmiar, Krój, Szerokość -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Motyw Kontrastu -->
                <div class="flex items-center rounded-lg p-0.5 border" [class]="focusToolGroupClass()">
                  <button
                    (click)="focusTheme.set('black')"
                    [class.font-bold]="focusTheme() === 'black'"
                    [class]="focusTheme() === 'black' ? focusActiveThemeClass() : 'opacity-60 hover:opacity-100'"
                    class="px-2.5 py-1 text-xs rounded transition-colors cursor-pointer"
                    title="Maksymalny kontrast: Czerń OLED i krystalicznie biały tekst"
                  >
                    Noir (OLED)
                  </button>
                  <button
                    (click)="focusTheme.set('slate')"
                    [class.font-bold]="focusTheme() === 'slate'"
                    [class]="focusTheme() === 'slate' ? focusActiveThemeClass() : 'opacity-60 hover:opacity-100'"
                    class="px-2.5 py-1 text-xs rounded transition-colors cursor-pointer"
                    title="Ciemny motyw prawniczy (Slate)"
                  >
                    Slate
                  </button>
                  <button
                    (click)="focusTheme.set('sepia')"
                    [class.font-bold]="focusTheme() === 'sepia'"
                    [class]="focusTheme() === 'sepia' ? focusActiveThemeClass() : 'opacity-60 hover:opacity-100'"
                    class="px-2.5 py-1 text-xs rounded transition-colors cursor-pointer"
                    title="Ciepły papier (Sepia) – minimalne zmęczenie wzroku"
                  >
                    Sepia
                  </button>
                </div>

                <!-- Rozmiar Czcionki -->
                <div class="flex items-center rounded-lg p-0.5 border" [class]="focusToolGroupClass()">
                  <button
                    (click)="focusFontSize.set('md')"
                    [class.font-bold]="focusFontSize() === 'md'"
                    [class]="focusFontSize() === 'md' ? focusActiveThemeClass() : 'opacity-60 hover:opacity-100'"
                    class="px-2 py-1 text-xs rounded transition-colors cursor-pointer"
                    title="Standardowy tekst (16px)"
                  >
                    A
                  </button>
                  <button
                    (click)="focusFontSize.set('lg')"
                    [class.font-bold]="focusFontSize() === 'lg'"
                    [class]="focusFontSize() === 'lg' ? focusActiveThemeClass() : 'opacity-60 hover:opacity-100'"
                    class="px-2 py-1 text-xs rounded transition-colors cursor-pointer"
                    title="Powiększony tekst (18px)"
                  >
                    A+
                  </button>
                  <button
                    (click)="focusFontSize.set('xl')"
                    [class.font-bold]="focusFontSize() === 'xl'"
                    [class]="focusFontSize() === 'xl' ? focusActiveThemeClass() : 'opacity-60 hover:opacity-100'"
                    class="px-2 py-1 text-xs rounded transition-colors cursor-pointer"
                    title="Duży tekst (20px)"
                  >
                    A++
                  </button>
                  <button
                    (click)="focusFontSize.set('2xl')"
                    [class.font-bold]="focusFontSize() === '2xl'"
                    [class]="focusFontSize() === '2xl' ? focusActiveThemeClass() : 'opacity-60 hover:opacity-100'"
                    class="px-2 py-1 text-xs rounded transition-colors cursor-pointer"
                    title="Bardzo duży tekst (24px)"
                  >
                    A+++
                  </button>
                </div>

                <!-- Krój pisma: Szeryfowy vs Bezszeryfowy -->
                <div class="flex items-center rounded-lg p-0.5 border" [class]="focusToolGroupClass()">
                  <button
                    (click)="focusFontFamily.set('serif')"
                    [class]="focusFontFamily() === 'serif' ? focusActiveThemeClass() : 'opacity-60 hover:opacity-100'"
                    class="px-2.5 py-1 text-xs font-serif rounded transition-colors cursor-pointer"
                    title="Pismo szeryfowe – optymalne dla aktów prawnych"
                  >
                    Szeryf
                  </button>
                  <button
                    (click)="focusFontFamily.set('sans')"
                    [class]="focusFontFamily() === 'sans' ? focusActiveThemeClass() : 'opacity-60 hover:opacity-100'"
                    class="px-2.5 py-1 text-xs font-sans rounded transition-colors cursor-pointer"
                    title="Pismo bezszeryfowe"
                  >
                    Sans
                  </button>
                </div>

                <!-- Przełącznik Komentarza -->
                <button
                  (click)="showFocusCommentary.set(!showFocusCommentary())"
                  class="px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer flex items-center gap-1"
                  [class]="showFocusCommentary() ? focusActiveThemeClass() : focusToolGroupClass()"
                  [title]="showFocusCommentary() ? 'Ukryj komentarz i sankcje' : 'Pokaż komentarz i sankcje'"
                >
                  <mat-icon class="text-xs">{{ showFocusCommentary() ? 'visibility' : 'visibility_off' }}</mat-icon>
                  <span class="hidden sm:inline">Komentarz</span>
                </button>
              </div>
            </div>

            <!-- Treść Artykułu w Wybranym Formacie -->
            <article class="mx-auto space-y-8 pb-12 transition-all duration-200" [class]="focusWidthClass()">
              <!-- Nagłówek Artykułu -->
              <header class="space-y-3 pb-6 border-b" [class]="focusHeaderBorderClass()">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-mono font-bold px-2.5 py-1 rounded border" [class]="focusParagraphBadgeClasses()">
                    Art. {{ art.number }}{{ art.suffix || '' }} {{ art.codePrefix || 'k.k.' }}
                  </span>
                  <span class="text-xs font-semibold opacity-70">
                    {{ art.chapter }}
                  </span>
                </div>

                <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight" [class]="focusFontFamily() === 'serif' ? 'font-serif' : 'font-sans'">
                  {{ art.title }}
                </h1>

                @if (art.recentAmendment) {
                  <div class="p-3.5 rounded-xl border text-xs leading-relaxed" [class]="focusAmendmentClass()">
                    <strong class="block mb-0.5">Nowelizacja weszła w życie: {{ art.recentAmendment.date }}</strong>
                    <span>{{ art.recentAmendment.description }}</span>
                  </div>
                }
              </header>

              <!-- Treść oficjalna artykułu rozbita na czytelne bloki paragrafowe (§) -->
              <section class="space-y-5" [class]="focusTypographyClasses()">
                @for (para of formattedParagraphs(); track $index) {
                  <div
                    class="p-4 sm:p-5 rounded-2xl border transition-all duration-200 relative"
                    [class]="isParagraphBeingSpoken(art.id, para.body)
                      ? 'ring-2 ring-amber-400 bg-amber-500/20 border-amber-400 shadow-xl shadow-amber-950/40 scale-[1.01]'
                      : focusParagraphClasses()"
                  >
                    @if (isParagraphBeingSpoken(art.id, para.body)) {
                      <span class="absolute -top-3 right-4 bg-amber-500 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow flex items-center gap-1 font-mono select-none animate-pulse">
                        <mat-icon class="text-xs">volume_up</mat-icon>
                        Czytany fragment
                      </span>
                    }
                    @if (para.header) {
                      <span class="inline-block text-xs font-mono font-bold px-2.5 py-0.5 rounded border mr-2 mb-1.5 align-middle select-none" [class]="focusParagraphBadgeClasses()">
                        {{ para.header }}
                      </span>
                    }
                    <span class="leading-relaxed select-text">{{ para.body }}</span>
                  </div>
                }
              </section>

              <!-- Wymiar Kary i Sankcji -->
              <section class="p-5 rounded-2xl border" [class]="focusCardClasses()">
                <div class="flex items-center gap-2 mb-2">
                  <mat-icon class="text-base text-amber-400">gavel</mat-icon>
                  <h3 class="text-xs font-bold uppercase tracking-wider text-amber-400">Ustawowe zagrożenie karą:</h3>
                </div>
                <p class="text-base sm:text-lg font-semibold leading-relaxed">
                  {{ art.penalties.summary }}
                </p>

                @if (art.additionalSanctions && art.additionalSanctions.length > 0) {
                  <div class="mt-4 pt-3 border-t border-slate-800/50 space-y-1.5 text-xs sm:text-sm opacity-90">
                    <span class="font-semibold block mb-1">Dodatkowe środki karne:</span>
                    @for (s of art.additionalSanctions; track s) {
                      <div class="flex items-start gap-2">
                        <span class="text-amber-400 font-bold">•</span>
                        <span>{{ s }}</span>
                      </div>
                    }
                  </div>
                }
              </section>

              <!-- Wykładnia Praktyczna i Komentarz (jeśli włączone) -->
              @if (showFocusCommentary()) {
                <section class="p-5 sm:p-6 rounded-2xl border space-y-3" [class]="focusCardClasses()">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <mat-icon class="text-sm">menu_book</mat-icon>
                      Komentarz prawny i wykładnia praktyczna:
                    </h3>
                  </div>
                  <p class="text-sm sm:text-base leading-relaxed opacity-95">
                    {{ art.plainSummary }}
                  </p>
                </section>
              }

              <!-- Dolna Nawigacja i Akcje w Trybie Skupienia -->
              <footer class="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" [class]="focusHeaderBorderClass()">
                <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    (click)="prevArticle()"
                    [disabled]="isFirstArticle()"
                    class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    [class]="focusButtonClass()"
                  >
                    <mat-icon class="text-sm">arrow_back</mat-icon>
                    <span>Poprzedni artykuł</span>
                  </button>

                  <button
                    (click)="nextArticle()"
                    [disabled]="isLastArticle()"
                    class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    [class]="focusButtonClass()"
                  >
                    <span>Następny artykuł</span>
                    <mat-icon class="text-sm">arrow_forward</mat-icon>
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Przycisk Lektora w stopce Focus Mode -->
                  <button
                    (click)="tts.speakArticle(art)"
                    class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer"
                    [class]="tts.isPlaying() && tts.currentTextId() === art.id ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' : focusButtonClass()"
                    title="Czytaj na głos"
                  >
                    <mat-icon class="text-sm">{{ tts.isPlaying() && tts.currentTextId() === art.id && !tts.isPaused() ? 'pause' : 'record_voice_over' }}</mat-icon>
                    <span>{{ tts.isPlaying() && tts.currentTextId() === art.id ? (tts.isPaused() ? 'Wznów' : 'Pauza') : 'Czytaj' }}</span>
                  </button>

                  <button
                    (click)="copyResponseText(art.content)"
                    class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer"
                    [class]="focusButtonClass()"
                    title="Kopiuj treść artykułu do schowka"
                  >
                    <mat-icon class="text-sm">content_copy</mat-icon>
                    <span>Kopiuj</span>
                  </button>

                  <button
                    (click)="pdfService.exportArticleToPdf(art)"
                    class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer"
                    [class]="focusButtonClass()"
                  >
                    <mat-icon class="text-sm">picture_as_pdf</mat-icon>
                    <span>PDF</span>
                  </button>

                  <button
                    (click)="exitFocusMode()"
                    class="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <mat-icon class="text-sm">fullscreen_exit</mat-icon>
                    <span>Zamknij Focus Mode</span>
                  </button>
                </div>
              </footer>
            </article>
          </div>
        }
      } @else {
        <!-- ================= STANDARDOWY WIDOK Z LISTĄ I PODGLĄDEM ================= -->
        <!-- Pasek wyszukiwania i zaawansowanych filtrów artykułów -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div class="flex flex-col md:flex-row gap-3">
            <div class="relative flex-1">
              <mat-icon class="absolute left-3.5 top-3 text-slate-500 text-lg">search</mat-icon>
              <input
                id="input-article-search"
                type="text"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                placeholder="Szukaj artykułu np. 178a, 278, kradzież, bójka, obrona konieczna..."
                class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <!-- Filtr rozdziału -->
            <select
              id="select-chapter-filter"
              [value]="selectedChapter()"
              (change)="selectedChapter.set($any($event.target).value)"
              class="bg-slate-950 border border-slate-700/80 text-xs md:text-sm text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Wszystkie kodeksy i ustawy (k.k., k.w., UoPN)</option>
              <option value="Kodeks Wykroczeń">Kodeks Wykroczeń (art. 51 cisza nocna, art. 94 brak uprawnień)</option>
              <option value="Ustawa o przeciwdziałaniu narkomanii">Ustawa o przeciwdziałaniu narkomanii (art. 62/62a UoPN)</option>
              <option value="Rozdział II">Rozdział II – Zasady odpowiedzialności (kontratypy art. 25)</option>
              <option value="Rozdział VIII">Rozdział VIII – Poddanie próbie (warunkowe umorzenie art. 66)</option>
              <option value="Rozdział XIX">Rozdział XIX – Życie i zdrowie (bójka i pobicie art. 158)</option>
              <option value="Rozdział XXI">Rozdział XXI – Bezpieczeństwo w komunikacji (alkohol art. 178a)</option>
              <option value="Rozdział XXIII">Rozdział XXIII – Wolność i stalking (art. 190, 190a)</option>
              <option value="Rozdział XXVI">Rozdział XXVI – Rodzina i opieka (alimenty art. 209, znęcanie)</option>
              <option value="Rozdział XXVII">Rozdział XXVII – Cześć i nietykalność (zniesławienie, hejt art. 212)</option>
              <option value="Rozdział XXIX">Rozdział XXIX – Instytucje państwowe (zniewaga policjanta art. 226)</option>
              <option value="Rozdział XXX">Rozdział XXX – Wymiar sprawiedliwości (złamanie zakazu art. 244)</option>
              <option value="Rozdział XXXV">Rozdział XXXV – Mienie (kradzież art. 278, oszustwo, zniszczenie mienia)</option>
            </select>

            <!-- Jednolity Schowek / Zakładki (IndexedDB) -->
            <button
              id="btn-filter-read-later"
              (click)="toggleReadLaterFilter()"
              [class]="onlyReadLater()
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-md active:scale-[0.98]'
                : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white hover:border-amber-500/50 active:scale-[0.98]'"
              class="flex items-center gap-1.5 border px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
              title="Pokaż artykuły zapisane w lokalnym schowku (IndexedDB)"
            >
              <mat-icon class="text-sm">bookmark</mat-icon>
              <span>Zakładki ({{ readLaterService.count() }})</span>
              @if (readLaterService.unreadCount() > 0) {
                <span class="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-red-500 text-white font-bold">
                  {{ readLaterService.unreadCount() }}
                </span>
              }
            </button>
          </div>
        </div>

        <!-- Informacja o aktywnym filtrze Zakładki -->
        @if (onlyReadLater()) {
          <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-200">
            <div class="flex items-center gap-2">
              <mat-icon class="text-amber-400 text-base">bookmark</mat-icon>
              <span>
                Zakładki offline: Wyświetlasz <strong>{{ readLaterService.count() }}</strong> artykułów zapisanych w pamięci podręcznej (IndexedDB).
              </span>
            </div>
            <button
              (click)="onlyReadLater.set(false)"
              class="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
            >
              Pokaż cały kodeks
            </button>
          </div>
        }

        <!-- Układ Dwukolumnowy: Lista Artykułów & Podgląd Szczegółowy / Czat -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Lista Artykułów (5 kolumn) -->
          <div class="lg:col-span-5 space-y-3 max-h-[820px] overflow-y-auto pr-1">
          @for (art of filteredArticles(); track art.id) {
            <div
              role="button"
              tabindex="0"
              (click)="selectArticle(art)"
              (keydown.enter)="selectArticle(art)"
              [class]="selectedArticle()?.id === art.id
                ? 'bg-slate-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'"
              class="border rounded-xl p-4 transition-all cursor-pointer relative group"
            >
              <div class="flex items-start justify-between gap-2 mb-1.5">
                <span class="font-mono font-bold text-amber-400 text-sm">
                  Art. {{ art.number }}{{ art.suffix || '' }} k.k.
                </span>

                <div class="flex items-center gap-1">
                  @if (art.recentAmendment) {
                    <span class="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-mono font-medium">
                      Nowela
                    </span>
                  }

                  <!-- Przycisk Czytaj na Głos w wierszu artykułu -->
                  <button
                    (click)="speakArticleDirectly(art, $event)"
                    class="p-1 rounded cursor-pointer transition-colors"
                    [class.text-amber-400]="tts.isPlaying() && tts.currentTextId() === art.id"
                    [class.text-slate-500]="!(tts.isPlaying() && tts.currentTextId() === art.id)"
                    [title]="tts.isPlaying() && tts.currentTextId() === art.id ? (tts.isPaused() ? 'Wznów odczyt' : 'Wstrzymaj odczyt') : 'Czytaj na głos'"
                  >
                    <mat-icon class="text-sm">
                      {{ tts.isPlaying() && tts.currentTextId() === art.id && !tts.isPaused() ? 'volume_up' : 'volume_mute' }}
                    </mat-icon>
                  </button>

                  <!-- Przycisk Zakładki / Schowek (IndexedDB) -->
                  <button
                    (click)="toggleReadLater(art, $event)"
                    class="p-1 rounded cursor-pointer transition-colors active:scale-95"
                    [class.text-amber-400]="readLaterService.isArticleSaved(art.id)"
                    [class.text-slate-500]="!readLaterService.isArticleSaved(art.id)"
                    [class.hover:text-slate-300]="!readLaterService.isArticleSaved(art.id)"
                    [title]="readLaterService.isArticleSaved(art.id) ? 'Zapisano w Zakładkach (IndexedDB). Kliknij, aby usunąć' : 'Dodaj do Zakładek (IndexedDB)'"
                  >
                    <mat-icon class="text-sm">
                      {{ readLaterService.isArticleSaved(art.id) ? 'bookmark' : 'bookmark_border' }}
                    </mat-icon>
                  </button>
                </div>
              </div>

              <h3 class="text-xs font-semibold text-slate-200 line-clamp-2 mb-1.5">
                {{ art.title }}
              </h3>

              <p class="text-[11px] text-slate-400 line-clamp-2 mb-2 font-serif">
                {{ art.content }}
              </p>

              <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/60">
                <span>{{ art.chapterNumber }}</span>
                <div class="flex items-center gap-2">
                  @if (readLaterService.isArticleSaved(art.id)) {
                    <span class="text-[10px] text-amber-400/80 flex items-center gap-0.5">
                      <mat-icon class="text-[11px]">storage</mat-icon>
                      IndexedDB
                    </span>
                  }
                  <span class="text-amber-400/90 font-medium">
                    {{ art.isFelony ? 'Zbrodnia' : 'Występek' }}
                  </span>
                </div>
              </div>
            </div>
          } @empty {
            <div class="text-center py-12 text-slate-500 text-sm bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
              @if (onlyReadLater()) {
                <div class="space-y-2">
                  <mat-icon class="text-3xl text-slate-600 block mx-auto">auto_stories</mat-icon>
                  <p>Brak zapisanych artykułów w pamięci podręcznej (Read Later).</p>
                  <p class="text-xs text-slate-600">Kliknij ikonę zakładki przy wybranym artykule, aby zapisać go offline w IndexedDB.</p>
                </div>
              } @else {
                <p>Brak artykułów spełniających kryteria wyszukiwania.</p>
              }
            </div>
          }
        </div>

        <!-- Podgląd Szczegółowy Wybranego Artykułu / Tryb Czytania / Czat (7 kolumn) -->
        <div class="lg:col-span-7">
          @if (selectedArticle(); as art) {
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 sticky top-20">
              <!-- Nagłówek Artykułu i Przyciski Akcji -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Art. {{ art.number }}{{ art.suffix || '' }} k.k.
                    </span>
                    <span class="text-xs text-slate-400">{{ art.chapter }}</span>
                  </div>
                  <h2 class="text-lg font-bold text-white font-serif">{{ art.title }}</h2>
                </div>

                <!-- Pasek Narzędziowy -->
                <div class="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0">
                  <!-- Dyskretny Przełącznik Focus Mode (Tryb Skupienia) w prawym rogu paska -->
                  <button
                    id="btn-article-focus-mode"
                    (click)="enterFocusMode()"
                    class="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.98] text-amber-300 font-medium border border-amber-500/30 text-xs px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                    title="Przełącz na uproszczony tryb czytania (Focus Mode) o wysokim kontraście i powiększonym druku"
                  >
                    <mat-icon class="text-sm text-amber-400">center_focus_strong</mat-icon>
                    <span>Tryb Skupienia</span>
                  </button>

                  <!-- Przycisk Czytaj na Głos (Web Speech API) -->
                  <button
                    id="btn-article-read-aloud"
                    (click)="tts.speakArticle(art)"
                    [class]="tts.isPlaying() && tts.currentTextId() === art.id
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm shadow-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-[0.98]'"
                    class="flex items-center gap-1.5 border text-xs px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                    [title]="tts.isPlaying() && tts.currentTextId() === art.id ? (tts.isPaused() ? 'Wznów odczyt na głos' : 'Wstrzymaj odczyt na głos') : 'Odsłuchaj artykuł na głos (Lektor Web Speech API)'"
                    aria-label="Odsłuchaj artykuł na głos"
                  >
                    @if (tts.isPlaying() && tts.currentTextId() === art.id && !tts.isPaused()) {
                      <div class="flex items-end gap-0.5 h-3">
                        <span class="w-0.5 bg-slate-950 rounded-full animate-[bounce_0.8s_ease-in-out_infinite]"></span>
                        <span class="w-0.5 bg-slate-950 rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.2s]"></span>
                        <span class="w-0.5 bg-slate-950 rounded-full animate-[bounce_0.9s_ease-in-out_infinite_0.4s]"></span>
                      </div>
                      <span>Pauza</span>
                    } @else if (tts.isPlaying() && tts.currentTextId() === art.id && tts.isPaused()) {
                      <mat-icon class="text-sm">play_arrow</mat-icon>
                      <span>Wznów</span>
                    } @else {
                      <mat-icon class="text-sm">volume_up</mat-icon>
                      <span>Głos</span>
                    }
                  </button>

                  <!-- Przycisk Zakładki (IndexedDB) -->
                  <button
                    (click)="toggleReadLater(art)"
                    [class]="readLaterService.isArticleSaved(art.id)
                      ? 'bg-amber-500 text-slate-950 font-semibold border-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 active:scale-[0.98]'"
                    class="flex items-center gap-1.5 border text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    [title]="readLaterService.isArticleSaved(art.id) ? 'Usuń z Zakładek' : 'Zapisz do zakładek offline w IndexedDB'"
                  >
                    <mat-icon class="text-sm">
                      {{ readLaterService.isArticleSaved(art.id) ? 'bookmark' : 'bookmark_border' }}
                    </mat-icon>
                    <span>{{ readLaterService.isArticleSaved(art.id) ? 'W Zakładkach' : 'Zakładka' }}</span>
                  </button>

                  <button
                    (click)="checkThreat.emit(art)"
                    class="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 active:scale-[0.98] border border-amber-500/30 text-amber-300 font-medium text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    title="Przeanalizuj w kalkulatorze Co mi grozi?"
                  >
                    <mat-icon class="text-sm">gavel</mat-icon>
                    <span>Co grozi?</span>
                  </button>

                  <button
                    (click)="pdfService.exportArticleToPdf(art)"
                    class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <mat-icon class="text-sm">picture_as_pdf</mat-icon>
                    <span>PDF</span>
                  </button>

                  <button
                    (click)="createNote.emit(art)"
                    class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <mat-icon class="text-sm">edit_note</mat-icon>
                    <span>Notatka</span>
                  </button>
                </div>
              </div>

              <!-- Zakładki Widoku: [ Treść & Komentarz ] | [ Tryb Czytania Offline ] | [ Czat & Pytania Q&A ] -->
              <div class="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <button
                  (click)="activeViewTab.set('details')"
                  [class]="activeViewTab() === 'details'
                    ? 'bg-slate-800 text-amber-400 font-semibold border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'"
                  class="flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                >
                  <mat-icon class="text-sm">menu_book</mat-icon>
                  <span>Treść i Wykładnia</span>
                </button>

                @if (art.recentAmendment) {
                  <button
                    (click)="activeViewTab.set('amendments')"
                    [class]="activeViewTab() === 'amendments'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border-amber-500/50'
                      : 'text-amber-400/80 hover:text-amber-300 border-transparent'"
                    class="flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                    title="Porównaj brzmienie przed i po nowelizacji"
                  >
                    <mat-icon class="text-sm text-amber-400">compare_arrows</mat-icon>
                    <span>Komparator Nowelizacji</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  </button>
                }

                <button
                  (click)="activeViewTab.set('reader')"
                  [class]="activeViewTab() === 'reader'
                    ? 'bg-slate-800 text-amber-400 font-semibold border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'"
                  class="flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                >
                  <mat-icon class="text-sm">chrome_reader_mode</mat-icon>
                  <span>Tryb Czytania (Offline)</span>
                  @if (readLaterService.isArticleSaved(art.id)) {
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  }
                </button>

                <button
                  (click)="activeViewTab.set('chat')"
                  [class]="activeViewTab() === 'chat'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                    : 'bg-slate-800/60 text-amber-300 hover:text-amber-200 border-slate-700'"
                  class="flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                >
                  <mat-icon class="text-sm">chat</mat-icon>
                  <span>Zadaj Pytanie / Czat</span>
                  @if (articleChatHistory().length > 0) {
                    <span class="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-950 text-amber-400 font-mono font-bold">
                      {{ articleChatHistory().length }}
                    </span>
                  }
                </button>
              </div>

              <!-- ================= WIDOK KOMPARATORA NOWELIZACJI ================= -->
              @if (activeViewTab() === 'amendments' && art.recentAmendment) {
                <div class="space-y-4 animate-fade-in">
                  <!-- Nagłówek statusu reformy -->
                  <div class="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4">
                    <div class="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <span class="font-bold flex items-center gap-1.5 text-amber-300 text-sm">
                        <mat-icon class="text-base text-amber-400">published_with_changes</mat-icon>
                        Reforma weszła w życie: {{ art.recentAmendment.date }}
                      </span>
                      <span class="text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                        Stan Prawny: Aktualny (2025/2026)
                      </span>
                    </div>
                    <p class="text-xs text-slate-300 leading-relaxed font-sans">
                      {{ art.recentAmendment.description }}
                    </p>
                    @if (art.recentAmendment.amendmentSummary) {
                      <div class="mt-2.5 pt-2 border-t border-amber-500/20 text-xs text-amber-200/90 font-medium">
                        <strong>Wpływ procesowy obrony:</strong> {{ art.recentAmendment.amendmentSummary }}
                      </div>
                    }
                  </div>

                  <!-- Dwuszpaltowe Porównanie Brzmienia (Diff View) -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Lewa kolumna: Dawne brzmienie -->
                    <div class="bg-slate-950 border border-red-500/30 rounded-xl p-4 flex flex-col">
                      <div class="flex items-center justify-between pb-2 mb-3 border-b border-red-500/20 text-xs">
                        <span class="font-bold text-red-400 flex items-center gap-1">
                          <mat-icon class="text-sm">history</mat-icon>
                          Stan prawny sprzed reformy
                        </span>
                        <span class="text-[10px] text-slate-500 uppercase">Wersja archiwalna</span>
                      </div>
                      <div class="text-xs text-slate-400 font-serif leading-relaxed whitespace-pre-line flex-1 bg-red-950/10 p-3 rounded-lg border border-red-500/10">
                        {{ art.recentAmendment.previousContent || 'Wcześniejsze brzmienie nie przewidywało tych obostrzeń lub sankcji.' }}
                      </div>
                    </div>

                    <!-- Prawa kolumna: Aktualne brzmienie -->
                    <div class="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 flex flex-col">
                      <div class="flex items-center justify-between pb-2 mb-3 border-b border-emerald-500/20 text-xs">
                        <span class="font-bold text-emerald-300 flex items-center gap-1">
                          <mat-icon class="text-sm">verified</mat-icon>
                          Aktualne brzmienie (obowiązujące)
                        </span>
                        <span class="text-[10px] text-emerald-400/80 font-mono">DZIŚ W SĄDZIE</span>
                      </div>
                      <div class="text-xs text-slate-200 font-serif leading-relaxed whitespace-pre-line flex-1 bg-emerald-950/15 p-3 rounded-lg border border-emerald-500/20">
                        {{ art.content }}
                      </div>
                    </div>
                  </div>

                  <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Zasada stosowania prawa względniejszego dla sprawcy (art. 4 § 1 k.k.): Jeżeli w czasie orzekania obowiązuje ustawa inna niż w czasie popełnienia przestępstwa, stosuje się ustawę nową, chyba że ustawa obowiązująca poprzednio była względniejsza dla sprawcy.</span>
                  </div>
                </div>
              }

              <!-- ================= WIDOK 1: TREŚĆ I WYKŁADNIA ================= -->
              @if (activeViewTab() === 'details') {
                <div class="space-y-4">
                  <!-- Ostatnia nowelizacja (jeśli dotyczy) -->
                  @if (art.recentAmendment) {
                    <div class="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200">
                      <span class="font-bold flex items-center gap-1 text-amber-400 mb-1">
                        <mat-icon class="text-sm">update</mat-icon>
                        Nowelizacja weszła w życie: {{ art.recentAmendment.date }}
                      </span>
                      {{ art.recentAmendment.description }}
                    </div>
                  }

                  <!-- Oficjalna Treść Przepisu -->
                  <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                    <span class="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">Treść przepisu:</span>
                    <div class="text-sm text-slate-200 font-serif leading-relaxed whitespace-pre-line">
                      {{ art.content }}
                    </div>
                  </div>

                  <!-- Wymiar Sankcji -->
                  <div class="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                    <span class="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">Ustawowe zagrożenie karą:</span>
                    <p class="text-sm font-semibold text-amber-300">
                      {{ art.penalties.summary }}
                    </p>
                  </div>

                  <!-- Wyjaśnienie Kancelaryjne (Prostym Językiem) -->
                  <div>
                    <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Komentarz prawny i wykładnia praktyczna:
                    </h4>
                    <p class="text-sm text-slate-300 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 leading-relaxed font-sans">
                      {{ art.plainSummary }}
                    </p>
                  </div>

                  <!-- Środki karne i dodatkowe -->
                  @if (art.additionalSanctions && art.additionalSanctions.length > 0) {
                    <div>
                      <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Dodatkowe środki karne / sankcje obligatoryjne:
                      </h4>
                      <ul class="space-y-1.5 text-xs text-slate-300">
                        @for (s of art.additionalSanctions; track s) {
                          <li class="flex items-start gap-2">
                            <span class="text-amber-400 font-bold">•</span>
                            <span>{{ s }}</span>
                          </li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              }

              <!-- ================= WIDOK 2: TRYB CZYTANIA (OFFLINE / READ LATER) ================= -->
              @if (activeViewTab() === 'reader') {
                <div class="space-y-5 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  <!-- Pasek Kontrolek Czytnika -->
                  <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div class="flex items-center gap-2 text-xs text-slate-400">
                      <mat-icon class="text-sm text-amber-400">timer</mat-icon>
                      <span>Szacowany czas: <strong>{{ currentReadingTime() }} min czytania</strong></span>
                      @if (currentReadLaterItem(); as rItem) {
                        <span class="text-slate-600">|</span>
                        <span>Zapisano: {{ rItem.savedAt | date:'dd.MM.yyyy, HH:mm' }}</span>
                      }
                    </div>

                    <div class="flex items-center gap-2">
                      <!-- Regulacja Rozmiaru Czcionki -->
                      <div class="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
                        <button
                          (click)="setFontSize('sm')"
                          [class.text-amber-400]="readerFontSize() === 'sm'"
                          class="px-2 py-1 text-xs text-slate-400 hover:text-white cursor-pointer font-bold"
                          title="Mniejszy tekst"
                        >
                          A-
                        </button>
                        <button
                          (click)="setFontSize('base')"
                          [class.text-amber-400]="readerFontSize() === 'base'"
                          class="px-2 py-1 text-xs text-slate-400 hover:text-white cursor-pointer font-bold"
                          title="Standardowy tekst"
                        >
                          A
                        </button>
                        <button
                          (click)="setFontSize('lg')"
                          [class.text-amber-400]="readerFontSize() === 'lg'"
                          class="px-2 py-1 text-xs text-slate-400 hover:text-white cursor-pointer font-bold"
                          title="Większy tekst"
                        >
                          A+
                        </button>
                      </div>

                      <!-- Przycisk Czytaj na Głos w Trybie Czytnika -->
                      <button
                        (click)="tts.speakArticle(art)"
                        [class]="tts.isPlaying() && tts.currentTextId() === art.id
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'"
                        class="flex items-center gap-1 border px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer"
                        [title]="tts.isPlaying() && tts.currentTextId() === art.id ? (tts.isPaused() ? 'Wznów' : 'Pauza') : 'Odsłuchaj treść artykułu'"
                      >
                        <mat-icon class="text-sm">{{ tts.isPlaying() && tts.currentTextId() === art.id && !tts.isPaused() ? 'volume_up' : 'record_voice_over' }}</mat-icon>
                        <span>{{ tts.isPlaying() && tts.currentTextId() === art.id ? (tts.isPaused() ? 'Wznów' : 'Pauza') : 'Czytaj' }}</span>
                      </button>

                      <!-- Oznacz jako przeczytane -->
                      @if (currentReadLaterItem(); as rItem) {
                        <button
                          (click)="readLaterService.toggleReadStatus(rItem.id)"
                          [class]="rItem.isRead
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'"
                          class="flex items-center gap-1 border px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer"
                        >
                          <mat-icon class="text-sm">{{ rItem.isRead ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                          <span>{{ rItem.isRead ? 'Przeczytane' : 'Do przeczytania' }}</span>
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Czytelne sformatowane bloki paragrafów (§) -->
                  <div class="space-y-3 font-serif" [class]="readerFontSizeClass()">
                    @for (para of formattedParagraphs(); track $index) {
                      <div
                        class="p-3.5 rounded-xl border transition-colors relative"
                        [class]="isParagraphBeingSpoken(art.id, para.body)
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                          : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700'"
                      >
                        @if (isParagraphBeingSpoken(art.id, para.body)) {
                          <span class="inline-block text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded mr-2 mb-1 animate-pulse">
                            Aktualnie czytane
                          </span>
                        }
                        @if (para.header) {
                          <span class="inline-block text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded mr-2 mb-1">
                            {{ para.header }}
                          </span>
                        }
                        <span class="text-slate-200 leading-relaxed">{{ para.body }}</span>
                      </div>
                    }
                  </div>

                  <!-- Kluczowe Wnioski w Trybie Czytnika -->
                  <div class="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs space-y-2">
                    <span class="font-bold text-amber-400 uppercase tracking-wider block">Podsumowanie sankcji:</span>
                    <p class="text-slate-200 font-sans leading-relaxed">{{ art.penalties.summary }}</p>
                  </div>

                  <!-- Notatki Własne Użytkownika (Zapisywane w IndexedDB) -->
                  <div class="pt-3 border-t border-slate-800">
                    <label for="textarea-readlater-notes" class="block text-xs font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                      <span class="flex items-center gap-1">
                        <mat-icon class="text-sm text-amber-400">edit_note</mat-icon>
                        Twoje uwagi i glosa do artykułu (IndexedDB):
                      </span>
                      @if (savedNoteStatus()) {
                        <span class="text-emerald-400 font-mono text-[11px] animate-pulse">Zapisano w pamięci</span>
                      }
                    </label>
                    <textarea
                      id="textarea-readlater-notes"
                      rows="2"
                      [value]="currentArticleUserNote()"
                      (input)="onUserNoteChange($any($event.target).value)"
                      placeholder="Wpisz własną analizę, stan faktyczny klienta lub tezę do tego przepisu..."
                      class="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors font-sans"
                    ></textarea>
                  </div>
                </div>
              }

              <!-- ================= WIDOK 3: CZAT I PYTANIA (Q&A) ================= -->
              @if (activeViewTab() === 'chat') {
                <div class="space-y-4">
                  <!-- Nagłówek Czatu Kontekstowego -->
                  <div class="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <h4 class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <mat-icon class="text-sm">smart_toy</mat-icon>
                        Asystent prawny: Kontekst Art. {{ art.number }}{{ art.suffix || '' }} k.k.
                      </h4>
                      <p class="text-[11px] text-slate-400">
                        Zadaj dowolne pytanie o interpretację, orzecznictwo SN i linię obrony. Działa w 100% offline.
                      </p>
                    </div>

                    @if (articleChatHistory().length > 0) {
                      <button
                        (click)="clearArticleChat()"
                        class="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer"
                      >
                        Wyczyść rozmowę
                      </button>
                    }
                  </div>

                  <!-- Sugerowane Szybkie Pytania (Prompt Chips) -->
                  <div class="flex flex-wrap gap-1.5">
                    @for (chip of contextPromptChips(); track chip) {
                      <button
                        (click)="askContextQuestion(chip)"
                        class="text-[11px] bg-slate-800/80 hover:bg-slate-700/90 text-amber-300 border border-slate-700/80 rounded-lg px-2.5 py-1 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <mat-icon class="text-xs text-amber-400">help_outline</mat-icon>
                        <span>{{ chip }}</span>
                      </button>
                    }
                  </div>

                  <!-- Historia Wiadomości Czatu -->
                  <div class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    @for (msg of articleChatHistory(); track msg.id) {
                      @if (msg.sender === 'user') {
                        <!-- Wiadomość Użytkownika -->
                        <div class="flex justify-end">
                          <div class="bg-amber-500 text-slate-950 font-medium rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] text-xs shadow-md">
                            {{ msg.text }}
                          </div>
                        </div>
                      } @else {
                        <!-- Odpowiedź Asystenta -->
                        <div class="flex justify-start">
                          <div class="bg-slate-950/90 border border-slate-800 text-slate-200 rounded-2xl rounded-tl-none p-4 max-w-[95%] text-xs space-y-2.5 shadow-md">
                            <div class="prose prose-invert prose-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                              {{ msg.text }}
                            </div>

                            <!-- Odesłania do przepisów / orzeczeń -->
                            @if (msg.referencedRulings && msg.referencedRulings.length > 0) {
                              <div class="pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-amber-400">
                                <mat-icon class="text-xs">gavel</mat-icon>
                                <span>Kluczowe orzeczenie: <strong>{{ msg.referencedRulings.join(', ') }}</strong></span>
                              </div>
                            }

                            <!-- Przyciski akcji odpowiedzi -->
                            <div class="flex items-center gap-2 pt-1 text-[11px]">
                              <button
                                (click)="copyResponseText(msg.text)"
                                class="text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <mat-icon class="text-xs">content_copy</mat-icon>
                                <span>Kopiuj</span>
                              </button>
                              <button
                                (click)="saveResponseToNotes(msg.text)"
                                class="text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <mat-icon class="text-xs">note_add</mat-icon>
                                <span>Dodaj do notatek</span>
                              </button>
                            </div>

                            <!-- Pytania pomocnicze (Follow-ups) -->
                            @if (msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0) {
                              <div class="pt-2 border-t border-slate-800/80 space-y-1">
                                <span class="text-[10px] text-slate-400 block font-medium">Pytania uzupełniające:</span>
                                <div class="flex flex-wrap gap-1">
                                  @for (fu of msg.suggestedFollowUps; track fu) {
                                    <button
                                      (click)="askContextQuestion(fu)"
                                      class="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 rounded px-2 py-0.5 cursor-pointer"
                                    >
                                      {{ fu }}
                                    </button>
                                  }
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    }

                    <!-- Spinner Generowania Odpowiedzi -->
                    @if (isGenerating()) {
                      <div class="flex justify-start">
                        <div class="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-2 text-xs text-slate-400">
                          <mat-icon class="animate-spin text-amber-400 text-sm">autorenew</mat-icon>
                          <span>Analiza prawna w toku...</span>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Pasek Wprowadzania Pytania (z Web Speech API Dictation) -->
                  <div class="pt-2 border-t border-slate-800">
                    <div class="flex items-center gap-2">
                      <div class="relative flex-1">
                        <input
                          id="input-article-chat-question"
                          type="text"
                          [value]="currentQuestionInput()"
                          (input)="currentQuestionInput.set($any($event.target).value)"
                          (keydown.enter)="submitQuestion()"
                          placeholder="Zadaj pytanie o Art. {{ art.number }} k.k. (np. jak obniżyć karę, dozór SDE)..."
                          class="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                        />

                        <!-- Przycisk Dyktowania Głosem (Web Speech API) -->
                        <button
                          id="btn-voice-dictation-article-chat"
                          type="button"
                          (click)="toggleVoiceDictation()"
                          [class]="isDictating()
                            ? 'text-red-400 bg-red-500/20 animate-pulse ring-1 ring-red-400'
                            : 'text-slate-400 hover:text-amber-400'"
                          class="absolute right-2 top-2 p-1 rounded-lg transition-colors cursor-pointer"
                          [title]="isDictating() ? 'Zatrzymaj dyktowanie' : 'Dyktuj pytanie głosowo (język polski)'"
                        >
                          <mat-icon class="text-sm">
                            {{ isDictating() ? 'mic' : 'mic_none' }}
                          </mat-icon>
                        </button>
                      </div>

                      <button
                        id="btn-submit-article-question"
                        (click)="submitQuestion()"
                        [disabled]="!currentQuestionInput().trim() || isGenerating()"
                        class="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-md"
                      >
                        <mat-icon class="text-sm">send</mat-icon>
                        <span class="hidden sm:inline">Zapytaj</span>
                      </button>
                    </div>

                    @if (isDictating()) {
                      <div class="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-300 font-mono">
                        <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                        <span>Dyktowanie aktywne... Mów wyraźnie po polsku.</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PenalCodeBrowser {
  readonly legalData = inject(LegalDataService);
  readonly pdfService = inject(PdfExportService);
  readonly readLaterService = inject(ReadLaterService);
  readonly aiService = inject(PrawnBotAiService);
  readonly speech = inject(SpeechDictationService);
  readonly tts = inject(TextToSpeechService);

  // Filtry i wyszukiwanie
  readonly searchQuery = signal<string>('');
  readonly selectedChapter = signal<string>('all');
  readonly onlyReadLater = signal<boolean>(false);
  readonly selectedArticle = signal<PenalArticle | null>(null);

  // Stan Uproszczonego Trybu Czytania (Focus Mode)
  readonly isFocusMode = signal<boolean>(false);
  readonly focusTheme = signal<'black' | 'slate' | 'sepia'>('black');
  readonly focusFontSize = signal<'md' | 'lg' | 'xl' | '2xl'>('lg');
  readonly focusFontFamily = signal<'serif' | 'sans'>('serif');
  readonly focusContentWidth = signal<'optimal' | 'wide'>('optimal');
  readonly showFocusCommentary = signal<boolean>(true);

  // Zakładka widoku szczegółowego w standardowym widoku: 'details' | 'amendments' | 'reader' | 'chat'
  readonly activeViewTab = signal<'details' | 'amendments' | 'reader' | 'chat'>('details');

  // Stan czytnika (Reader Mode)
  readonly readerFontSize = signal<'sm' | 'base' | 'lg'>('base');
  readonly savedNoteStatus = signal<boolean>(false);

  // Stan Czatu Kontekstowego
  readonly articleChatHistory = signal<ChatMessage[]>([]);
  readonly currentQuestionInput = signal<string>('');
  readonly isGenerating = signal<boolean>(false);

  // Zdarzenia wyjściowe do nawigacji w aplikacji
  readonly checkThreat = output<PenalArticle>();
  readonly createNote = output<PenalArticle>();

  // Indeks i nawigacja w Focus Mode
  readonly currentArticleIndex = computed(() => {
    const current = this.selectedArticle();
    if (!current) return -1;
    return this.filteredArticles().findIndex((a) => a.id === current.id);
  });

  readonly isFirstArticle = computed(() => this.currentArticleIndex() <= 0);
  readonly isLastArticle = computed(() => {
    const idx = this.currentArticleIndex();
    const list = this.filteredArticles();
    return idx === -1 || idx >= list.length - 1;
  });

  // Klasy stylów Focus Mode dopasowane do wybranego motywu i kontrastu
  readonly focusContainerClasses = computed(() => {
    switch (this.focusTheme()) {
      case 'black':
        return 'bg-black text-zinc-50 border-zinc-800 shadow-2xl';
      case 'sepia':
        return 'bg-[#fcf9f0] text-[#1c1917] border-[#e4dcc7] shadow-xl';
      case 'slate':
      default:
        return 'bg-slate-950 text-slate-100 border-slate-800 shadow-xl';
    }
  });

  readonly focusHeaderBorderClass = computed(() => {
    switch (this.focusTheme()) {
      case 'black':
        return 'border-zinc-800/90 bg-black/90';
      case 'sepia':
        return 'border-[#e4dcc7] bg-[#fcf9f0]/95';
      case 'slate':
      default:
        return 'border-slate-800/90 bg-slate-950/90';
    }
  });

  readonly focusCardClasses = computed(() => {
    switch (this.focusTheme()) {
      case 'black':
        return 'bg-zinc-950 border-zinc-800 text-zinc-100';
      case 'sepia':
        return 'bg-[#f5efe1] border-[#ded4be] text-[#1c1917]';
      case 'slate':
      default:
        return 'bg-slate-900 border-slate-800 text-slate-100';
    }
  });

  readonly focusParagraphClasses = computed(() => {
    switch (this.focusTheme()) {
      case 'black':
        return 'bg-zinc-900/95 border-zinc-700/80 text-zinc-50 shadow-sm';
      case 'sepia':
        return 'bg-[#ede5d1] border-[#d8ccb3] text-[#18181b] shadow-sm';
      case 'slate':
      default:
        return 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-sm';
    }
  });

  readonly focusParagraphBadgeClasses = computed(() => {
    switch (this.focusTheme()) {
      case 'black':
        return 'text-amber-300 bg-amber-950/90 border-amber-500/50';
      case 'sepia':
        return 'text-[#854d0e] bg-[#fef3c7] border-[#f59e0b]/50';
      case 'slate':
      default:
        return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    }
  });

  readonly focusTypographyClasses = computed(() => {
    const fontClass = this.focusFontFamily() === 'serif' ? 'font-serif' : 'font-sans';
    let sizeClass = 'text-lg leading-loose';
    switch (this.focusFontSize()) {
      case 'md':
        sizeClass = 'text-base leading-relaxed';
        break;
      case 'lg':
        sizeClass = 'text-lg leading-loose';
        break;
      case 'xl':
        sizeClass = 'text-xl leading-loose';
        break;
      case '2xl':
        sizeClass = 'text-2xl leading-loose';
        break;
    }
    return `${fontClass} ${sizeClass}`;
  });

  readonly focusWidthClass = computed(() => {
    return this.focusContentWidth() === 'wide' ? 'max-w-4xl' : 'max-w-3xl';
  });

  readonly focusButtonClass = computed(() => {
    switch (this.focusTheme()) {
      case 'black':
        return 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-100';
      case 'sepia':
        return 'bg-[#ede5d1] hover:bg-[#e4dac0] border-[#d8ccb3] text-[#1c1917]';
      case 'slate':
      default:
        return 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200';
    }
  });

  readonly focusIconBtnClass = computed(() => {
    switch (this.focusTheme()) {
      case 'black':
        return 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-100';
      case 'sepia':
        return 'bg-[#ede5d1] hover:bg-[#e4dac0] border-[#d8ccb3] text-[#1c1917]';
      case 'slate':
      default:
        return 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200';
    }
  });

  readonly focusToolGroupClass = computed(() => {
    switch (this.focusTheme()) {
      case 'black':
        return 'bg-zinc-900/90 border-zinc-800 text-zinc-300';
      case 'sepia':
        return 'bg-[#ede5d1] border-[#d8ccb3] text-[#44403c]';
      case 'slate':
      default:
        return 'bg-slate-900/90 border-slate-800 text-slate-300';
    }
  });

  readonly focusActiveThemeClass = computed(() => {
    switch (this.focusTheme()) {
      case 'black':
        return 'bg-amber-500 text-black font-bold shadow-sm';
      case 'sepia':
        return 'bg-[#b45309] text-white font-bold shadow-sm';
      case 'slate':
      default:
        return 'bg-amber-500 text-slate-950 font-bold shadow-sm';
    }
  });

  readonly focusAmendmentClass = computed(() => {
    switch (this.focusTheme()) {
      case 'black':
        return 'bg-amber-950/40 border-amber-500/40 text-amber-200';
      case 'sepia':
        return 'bg-amber-100 border-amber-300 text-amber-900';
      case 'slate':
      default:
        return 'bg-amber-950/30 border-amber-500/30 text-amber-200';
    }
  });

  // Lista artykułów z uwzględnieniem filtrów tekstowych, rozdziałów oraz Zakładek (IndexedDB)
  readonly filteredArticles = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const chapter = this.selectedChapter();
    const readLaterOnly = this.onlyReadLater();
    const savedIds = this.readLaterService.savedIdsSet();
    const all = this.legalData.articles();

    return all.filter((art) => {
      if (readLaterOnly && !savedIds.has(art.id)) return false;
      if (chapter !== 'all') {
        if (chapter === 'Kodeks Wykroczeń') {
          if (art.codePrefix !== 'k.w.' && !art.chapter.includes('Wykroczeń')) return false;
        } else if (chapter === 'Ustawa o przeciwdziałaniu narkomanii') {
          if (art.codePrefix !== 'UoPN' && !art.chapter.includes('narkomanii')) return false;
        } else if (!art.chapterNumber.includes(chapter) && !art.chapter.includes(chapter)) {
          return false;
        }
      }

      if (!q) return true;
      const combined = `${art.number} ${art.suffix || ''} ${art.title} ${art.content} ${art.plainSummary} ${art.keywords.join(' ')}`.toLowerCase();
      return combined.includes(q);
    });
  });

  // Obiekt artykułu zapisany w IndexedDB (jeśli istnieje)
  readonly currentReadLaterItem = computed(() => {
    const art = this.selectedArticle();
    if (!art) return null;
    return this.readLaterService.items().find((i) => i.id === art.id) || null;
  });

  // Szacowany czas czytania
  readonly currentReadingTime = computed(() => {
    const art = this.selectedArticle();
    if (!art) return 1;
    const words = art.content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 130));
  });

  // Sformatowane paragrafy dla czytnika offline
  readonly formattedParagraphs = computed(() => {
    const art = this.selectedArticle();
    if (!art) return [];

    const lines = art.content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const result: { header?: string; body: string }[] = [];
    let currentHeader = '';
    let currentBody = '';

    for (const line of lines) {
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

    return result.length > 0 ? result : [{ body: art.content }];
  });

  // Sugerowane pytania dopasowane do aktualnego artykułu
  readonly contextPromptChips = computed(() => {
    const art = this.selectedArticle();
    if (!art) return [];

    const chips = ['Kiedy grozi więzienie?', 'Jak złagodzić karę?', 'Czy możliwy dozór (SDE)?'];
    if (art.id === 'art-51-kw') {
      return ['Czy mandat trafia do KRK?', 'Kiedy hałas to stalking (art. 190a k.k.)?', 'Jak odmówić mandatu?', 'Wyrok SN o wybryku'];
    } else if (art.id === 'art-94-kw') {
      return ['Czy zakaz prowadzenia jest obowiązkowy?', 'Co grozi za jazdę z zakazem (art. 244 k.k.)?', 'Stan wyższej konieczności'];
    } else if (art.id === 'art-62-uopn') {
      return ['Jak uzyskać umorzenie z art. 62a UoPN?', 'Co oznacza nieznaczna ilość na własny użytek?', 'Czy sprawa trafi do KRK?'];
    } else if (art.id === 'art-212-kk') {
      return ['Czy za hejt w internecie grozi więzienie?', 'Nawiązka do 100 000 zł', 'Jak działa dowód prawdy (art. 213 k.k.)?'];
    } else if (art.id === 'art-288-kk') {
      return ['Nowy próg 800 zł (wykroczenie vs przestępstwo)', 'Naprawienie szkody lakiernika', 'Wypadek mniejszej wagi'];
    } else if (art.id === 'art-244-kk') {
      return ['Czy grozi bezwzględne więzienie?', 'Jak uzyskać dozór elektroniczny (SDE)?', 'Brak doręczenia wyroku'];
    } else if (art.number === 178 && art.suffix === 'a') {
      chips.unshift('Czy grozi konfiskata auta?');
      chips.push('Warunki odzyskania prawa jazdy');
    } else if (art.number === 278 || art.number === 279 || art.number === 286) {
      chips.unshift('Wypadek mniejszej wagi');
      chips.push('Próg 800 zł przy kradzieży');
    } else if (art.number === 25) {
      chips.unshift('Kiedy przekracza się obronę?');
      chips.push('Mój dom moją twierdzą');
    } else if (art.number === 66) {
      chips.unshift('Kiedy czysta kartoteka?');
      chips.push('Okres próby i koszty');
    }
    return chips;
  });

  constructor() {
    const first = this.legalData.articles()[0];
    if (first) {
      this.selectedArticle.set(first);
      this.initInitialChat(first);
    }
  }

  selectArticle(art: PenalArticle): void {
    this.selectedArticle.set(art);
    // Resetuj lub zainicjuj czat dla nowo wybranego artykułu
    this.initInitialChat(art);
  }

  toggleReadLaterFilter(): void {
    this.onlyReadLater.set(!this.onlyReadLater());
  }

  async toggleReadLater(art: PenalArticle, event?: Event): Promise<void> {
    if (event) event.stopPropagation();

    if (this.readLaterService.isArticleSaved(art.id)) {
      await this.readLaterService.removeArticle(art.id);
    } else {
      await this.readLaterService.saveArticle(art);
    }
  }

  setFontSize(size: 'sm' | 'base' | 'lg'): void {
    this.readerFontSize.set(size);
  }

  readerFontSizeClass(): string {
    switch (this.readerFontSize()) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  }

  currentArticleUserNote(): string {
    const item = this.currentReadLaterItem();
    return item?.userNotes || '';
  }

  async onUserNoteChange(notes: string): Promise<void> {
    const art = this.selectedArticle();
    if (!art) return;

    if (!this.readLaterService.isArticleSaved(art.id)) {
      // Automatycznie zapisz do Read Later przy dodawaniu notatki
      await this.readLaterService.saveArticle(art, notes);
    } else {
      await this.readLaterService.updateNotes(art.id, notes);
    }

    this.savedNoteStatus.set(true);
    setTimeout(() => this.savedNoteStatus.set(false), 2000);
  }

  // --- Integracja Web Speech API w Czacie Artykułu ---

  isDictating(): boolean {
    return this.speech.isListening() && this.speech.activeTarget() === 'article-chat-input';
  }

  toggleVoiceDictation(): void {
    if (this.isDictating()) {
      this.speech.stop();
      return;
    }

    this.speech.start('article-chat-input', (chunk: string, isFinal: boolean) => {
      this.currentQuestionInput.set(chunk);
      if (isFinal) {
        // Po zakończeniu wypowiedzi można zadać pytanie
      }
    });
  }

  // --- Obsługa Pytań i Czatu do Artykułu ---

  private initInitialChat(art: PenalArticle): void {
    this.articleChatHistory.set([
      {
        id: `init-${art.id}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        text: `Dzień dobry. Jestem gotowy odpowiedzieć na wszelkie pytania dotyczące **Art. ${art.number}${art.suffix || ''} k.k. (${art.title})**.\n\nMożesz zapytać m.in. o wymiar kary, warunki zawieszenia, linię orzeczniczą lub kliknąć jedną z sugerowanych podpowiedzi poniżej.`,
      },
    ]);
  }

  askContextQuestion(questionText: string): void {
    this.currentQuestionInput.set(questionText);
    this.submitQuestion();
  }

  submitQuestion(): void {
    const q = this.currentQuestionInput().trim();
    const art = this.selectedArticle();
    if (!q || !art || this.isGenerating()) return;

    // Dodaj pytanie użytkownika
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      text: q,
    };

    this.articleChatHistory.update((prev) => [...prev, userMsg]);
    this.currentQuestionInput.set('');
    this.isGenerating.set(true);

    if (this.isDictating()) {
      this.speech.stop();
    }

    setTimeout(() => {
      const response = this.aiService.askArticleQuestion(art, q);
      this.articleChatHistory.update((prev) => [...prev, response]);
      this.isGenerating.set(false);
    }, 250);
  }

  clearArticleChat(): void {
    const art = this.selectedArticle();
    if (art) this.initInitialChat(art);
  }

  copyResponseText(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }

  saveResponseToNotes(text: string): void {
    const art = this.selectedArticle();
    if (art) {
      this.createNote.emit({
        ...art,
        plainSummary: text,
      });
    }
  }

  setSearchQuery(q: string): void {
    this.searchQuery.set(q);
  }

  selectArticleByRef(art: PenalArticle): void {
    this.selectedArticle.set(art);
    this.searchQuery.set(art.number.toString());
  }

  selectArticleById(id: string): void {
    const found = this.legalData.articles().find((a) => a.id === id);
    if (found) {
      this.selectedArticle.set(found);
      this.searchQuery.set(found.number.toString());
    }
  }

  // --- Metody Uproszczonego Trybu Czytania (Focus Mode) ---

  enterFocusMode(): void {
    if (!this.selectedArticle() && this.filteredArticles().length > 0) {
      this.selectedArticle.set(this.filteredArticles()[0]);
    }
    this.isFocusMode.set(true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  exitFocusMode(): void {
    this.isFocusMode.set(false);
  }

  toggleFocusMode(): void {
    if (this.isFocusMode()) {
      this.exitFocusMode();
    } else {
      this.enterFocusMode();
    }
  }

  onEscapeKey(): void {
    if (this.isFocusMode()) {
      this.exitFocusMode();
    }
  }

  onArrowLeft(event: Event): void {
    if (this.isFocusMode()) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      this.prevArticle();
    }
  }

  onArrowRight(event: Event): void {
    if (this.isFocusMode()) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      this.nextArticle();
    }
  }

  prevArticle(): void {
    const idx = this.currentArticleIndex();
    const list = this.filteredArticles();
    if (idx > 0) {
      this.selectArticle(list[idx - 1]);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  nextArticle(): void {
    const idx = this.currentArticleIndex();
    const list = this.filteredArticles();
    if (idx >= 0 && idx < list.length - 1) {
      this.selectArticle(list[idx + 1]);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  isParagraphBeingSpoken(artId: string, bodyText: string): boolean {
    if (!this.tts.isPlaying() || this.tts.currentTextId() !== artId) return false;
    const currentChunk = this.tts.currentChunkText().trim();
    if (!currentChunk || !bodyText) return false;
    const cleanBody = bodyText.replace(/\s+/g, ' ').trim();
    const cleanChunk = currentChunk.replace(/\s+/g, ' ').trim();
    return cleanBody.includes(cleanChunk.slice(0, 25)) || cleanChunk.includes(cleanBody.slice(0, 25));
  }

  speakArticleDirectly(art: PenalArticle, event: Event): void {
    event.stopPropagation();
    this.tts.speakArticle(art);
  }
}
