import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LegalDictionaryService } from '../services/legal-dictionary.service';
import { LegalDictionaryTerm } from '../models/legal.model';
import { TextToSpeechService } from '../services/text-to-speech.service';

@Component({
  selector: 'app-legal-dictionary-modal',
  imports: [CommonModule, MatIconModule],
  template: `
    <div
      id="modal-legal-dictionary"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      (click)="onBackdropClick($event)"
      (keydown.escape)="closeModal()"
      tabindex="-1"
    >
      <div
        class="bg-slate-900 border border-amber-500/30 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border-t-2 border-t-amber-400"
      >
        <!-- Nagłówek Modala ze statusem Offline i wyszukiwarką -->
        <div class="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col gap-4">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <mat-icon class="text-2xl">auto_stories</mat-icon>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-lg sm:text-xl font-bold text-white tracking-wide">
                    Słownik Pojęć Prawno-Karnych
                  </h2>
                  <span class="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                    100% Offline
                  </span>
                </div>
                <p class="text-xs text-slate-400">
                  Przystępne wyjaśnienia skomplikowanego żargonu sądowego z przykładami i podstawą k.k.
                </p>
              </div>
            </div>

            <button
              id="btn-close-dictionary-modal"
              type="button"
              (click)="closeModal()"
              class="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Zamknij słownik (Esc)"
            >
              <mat-icon class="text-xl">close</mat-icon>
            </button>
          </div>

          <!-- Wyszukiwarka terminów -->
          <div class="relative flex items-center">
            <mat-icon class="absolute left-3.5 text-amber-400/80 text-lg pointer-events-none">search</mat-icon>
            <input
              id="input-dictionary-search"
              type="text"
              [value]="dict.searchQuery()"
              (input)="onSearchInput($any($event.target).value)"
              placeholder="Wyszukaj pojęcie, np. kontratyp, zamiar ewentualny, recydywa, konfiskata..."
              class="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            @if (dict.searchQuery()) {
              <button
                type="button"
                (click)="dict.searchQuery.set('')"
                class="absolute right-3 text-slate-400 hover:text-white p-1"
                title="Wyczyść szukanie"
              >
                <mat-icon class="text-base">close</mat-icon>
              </button>
            }
          </div>

          <!-- Filtry kategorii -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span class="text-slate-500 font-medium whitespace-nowrap mr-1">Działy:</span>
            @for (cat of categories; track cat.id) {
              <button
                type="button"
                (click)="dict.selectedCategory.set(cat.id)"
                [class]="dict.selectedCategory() === cat.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
                class="px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
              >
                {{ cat.label }}
              </button>
            }
          </div>
        </div>

        <!-- Zawartość Modala: Kolumna Listy + Szczegóły Terminu -->
        <div class="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <!-- Lewa kolumna: Lista haseł -->
          <div class="md:col-span-5 p-3 overflow-y-auto max-h-[60vh] space-y-1.5 bg-slate-950/40">
            @if (dict.filteredTerms().length === 0) {
              <div class="p-6 text-center text-slate-400 space-y-2">
                <mat-icon class="text-3xl text-slate-600">search_off</mat-icon>
                <p class="text-sm">Nie znaleziono hasła dla „{{ dict.searchQuery() }}”.</p>
                <button
                  type="button"
                  (click)="dict.searchQuery.set(''); dict.selectedCategory.set('all')"
                  class="text-xs text-amber-400 hover:underline cursor-pointer"
                >
                  Pokaż wszystkie hasła
                </button>
              </div>
            } @else {
              @for (item of dict.filteredTerms(); track item.id) {
                <button
                  type="button"
                  [id]="'term-item-' + item.id"
                  (click)="dict.selectTerm(item)"
                  [class]="dict.selectedTerm()?.id === item.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80 text-slate-300'"
                  class="w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 group block"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors">
                      {{ item.term }}
                    </span>
                    <span class="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                      {{ item.category }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {{ item.plainDefinition }}
                  </p>
                </button>
              }
            }
          </div>

          <!-- Prawa kolumna: Karta szczegółowa aktywnego pojęcia -->
          <div class="md:col-span-7 p-5 sm:p-6 overflow-y-auto max-h-[60vh] bg-slate-900/90 space-y-5">
            @if (activeTerm(); as term) {
              <div class="space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span class="text-[11px] uppercase font-bold text-amber-400 tracking-wider">
                      {{ term.category }}
                    </span>
                    <h3 class="text-xl sm:text-2xl font-bold text-white mt-0.5">
                      {{ term.term }}
                    </h3>
                  </div>

                  <!-- Przyciski akcji audio i kopiowania -->
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="toggleAudio(term)"
                      [class]="isListeningToTerm(term) ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'"
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs transition-all cursor-pointer shadow-sm"
                      title="Odsłuchaj definicję lektorem mowy"
                    >
                      <mat-icon class="text-sm">{{ isListeningToTerm(term) ? 'stop' : 'volume_up' }}</mat-icon>
                      <span>{{ isListeningToTerm(term) ? 'Zatrzymaj' : 'Odsłuchaj' }}</span>
                    </button>

                    <button
                      type="button"
                      (click)="copyDefinition(term)"
                      class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs transition-colors cursor-pointer"
                      title="Skopiuj treść definicji do schowka"
                    >
                      <mat-icon class="text-sm">content_copy</mat-icon>
                      <span>{{ isCopied() ? 'Skopiowano!' : 'Kopiuj' }}</span>
                    </button>
                  </div>
                </div>

                <!-- Prosta definicja dla laika -->
                <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div class="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wide">
                    <mat-icon class="text-sm">lightbulb</mat-icon>
                    <span>Wyjaśnienie prostym językiem</span>
                  </div>
                  <p class="text-sm text-slate-200 leading-relaxed font-sans">
                    {{ term.plainDefinition }}
                  </p>
                </div>

                <!-- Życiowy kazus / przykład -->
                <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div class="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wide">
                    <mat-icon class="text-sm">history_edu</mat-icon>
                    <span>Przykład z życia (Kazus praktyczny)</span>
                  </div>
                  <p class="text-sm text-slate-300 leading-relaxed italic">
                    „{{ term.practicalExample }}”
                  </p>
                </div>

                <!-- Podstawa prawna i powiązanie z kodeksem -->
                <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div class="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wide">
                    <mat-icon class="text-sm">gavel</mat-icon>
                    <span>Podstawa prawna</span>
                  </div>
                  <div class="flex items-center justify-between gap-3 flex-wrap">
                    <span class="text-sm font-mono font-bold text-emerald-300">
                      {{ term.legalBasis }}
                    </span>
                    @if (term.relatedArticleId) {
                      <button
                        type="button"
                        (click)="navigateToArticle(term.relatedArticleId)"
                        class="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer underline"
                      >
                        Zobacz w Kodeksie Karnym <mat-icon class="text-xs">arrow_forward</mat-icon>
                      </button>
                    }
                  </div>
                </div>

                <!-- Wskazówka / Ostrzeżenie obrońcy -->
                @if (term.warningTip) {
                  <div class="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 space-y-1">
                    <div class="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wide">
                      <mat-icon class="text-sm">warning</mat-icon>
                      <span>Wskazówka obrońcy / Pułapka procesowa</span>
                    </div>
                    <p class="text-xs text-amber-200/90 leading-relaxed">
                      {{ term.warningTip }}
                    </p>
                  </div>
                }
              </div>
            } @else {
              <div class="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                <mat-icon class="text-4xl text-slate-600">touch_app</mat-icon>
                <p class="text-sm">Wybierz pojęcie z listy po lewej stronie, aby wyświetlić definicję i przykłady.</p>
              </div>
            }
          </div>
        </div>

        <!-- Stopka ze wskazówką dot. dwukliku -->
        <div class="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-4">
          <div class="flex items-center gap-2">
            <mat-icon class="text-sm text-amber-400">touch_app</mat-icon>
            <span>Wskazówka: <strong>Kliknij dwukrotnie (double-click)</strong> na dowolny termin prawny w aplikacji, aby szybko otworzyć to hasło.</span>
          </div>
          <button
            type="button"
            (click)="closeModal()"
            class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer"
          >
            Zamknij (Esc)
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalDictionaryModal {
  readonly dict = inject(LegalDictionaryService);
  readonly tts = inject(TextToSpeechService);

  readonly inspectArticle = output<string>();

  readonly isCopied = signal<boolean>(false);

  readonly categories = [
    { id: 'all', label: 'Wszystkie' },
    { id: 'Zasady ogólne', label: 'Zasady ogólne' },
    { id: 'Obrona i wyłączenia', label: 'Obrona i wyłączenia' },
    { id: 'Kary i środki', label: 'Kary i środki' },
    { id: 'Procedura karna', label: 'Procedura karna' },
    { id: 'Typy przestępstw', label: 'Typy przestępstw' },
  ];

  activeTerm(): LegalDictionaryTerm | null {
    const selected = this.dict.selectedTerm();
    if (selected) return selected;
    const filtered = this.dict.filteredTerms();
    return filtered.length > 0 ? filtered[0] : null;
  }

  onSearchInput(val: string): void {
    this.dict.searchQuery.set(val);
  }

  closeModal(): void {
    this.dict.closeModal();
  }

  onBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) {
      this.closeModal();
    }
  }

  navigateToArticle(artId: string): void {
    this.inspectArticle.emit(artId);
    this.closeModal();
  }

  isListeningToTerm(term: LegalDictionaryTerm): boolean {
    return this.tts.isPlaying() && this.tts.currentTextId() === `dict-${term.id}`;
  }

  toggleAudio(term: LegalDictionaryTerm): void {
    if (this.isListeningToTerm(term)) {
      this.tts.stop();
      return;
    }

    const textToSpeak = `${term.term}. Wyjaśnienie: ${term.plainDefinition}. Przykład z życia: ${term.practicalExample}. Podstawa prawna: ${term.legalBasis}. ${term.warningTip ? 'Wskazówka: ' + term.warningTip : ''}`;
    this.tts.startPlayback(`dict-${term.id}`, term.term, 'Słownik Prawny', textToSpeak);
  }

  copyDefinition(term: LegalDictionaryTerm): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const formatted = `[Słownik prawnBot] ${term.term}\nDefinicja: ${term.plainDefinition}\nPrzykład: ${term.practicalExample}\nPodstawa: ${term.legalBasis}`;
      navigator.clipboard.writeText(formatted).then(() => {
        this.isCopied.set(true);
        setTimeout(() => this.isCopied.set(false), 2000);
      });
    }
  }
}
