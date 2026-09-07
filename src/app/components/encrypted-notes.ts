import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CourtRuling, EncryptedNote, PenalArticle } from '../models/legal.model';
import { LegalDataService } from '../services/legal-data.service';
import { CryptoService } from '../services/crypto.service';
import { PdfExportService } from '../services/pdf-export.service';
import { SpeechDictationService } from '../services/speech-dictation.service';

@Component({
  selector: 'app-encrypted-notes',
  imports: [CommonModule, MatIconModule],
  template: `
    <section id="section-notes" class="space-y-6">
      <!-- Nagłówek i status skarbca -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <mat-icon class="text-amber-400">lock</mat-icon>
              Lokalny Notatnik Kancelaryjny (Szyfrowanie AES-256-GCM)
            </h2>
            @if (cryptoService.isAuthenticated()) {
              <span class="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-mono">
                <mat-icon class="text-xs">verified_user</mat-icon>
                AES-GCM Aktywny
              </span>
            } @else {
              <span class="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <mat-icon class="text-xs">lock_open</mat-icon>
                Tryb bez hasła
              </span>
            }
          </div>
          <p class="text-xs md:text-sm text-slate-400">
            Wszystkie notatki spraw, dane klientów i strategie obrony są szyfrowane lokalnie w przeglądarce.
            Obsługuje <strong>dyktowanie głosem (Web Speech API)</strong> z formatowaniem polskiej terminologii prawnej.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="navigateToCases.emit()"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Powrót do dossier i aktywnych spraw"
          >
            <mat-icon class="text-sm text-amber-400">arrow_back</mat-icon>
            <span>Dossier Spraw</span>
          </button>

          @if (!showNoteForm()) {
            <button
              id="btn-create-new-note"
              (click)="resetNoteForm(); showNoteForm.set(true)"
              class="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-xs md:text-sm px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <mat-icon class="text-base">add</mat-icon>
              <span>Nowa Notatka</span>
            </button>
          }
        </div>
      </div>

      <!-- Formularz tworzenia / edycji notatki -->
      @if (showNoteForm()) {
        <div class="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-sm font-bold text-amber-300 flex items-center gap-2">
              <mat-icon class="text-base">edit_note</mat-icon>
              {{ editingNoteId() ? 'Edycja Notatki Sprawy' : 'Tworzenie Nowej Notatki Kancelaryjnej' }}
            </h3>
            <button
              (click)="resetNoteForm()"
              class="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
            >
              <mat-icon class="text-sm">close</mat-icon>
              Anuluj
            </button>
          </div>

          <!-- Banner informacyjny o aktywnym dyktowaniu -->
          @if (speech.isListening() && (speech.activeTarget() === 'note-title' || speech.activeTarget() === 'note-content')) {
            <div class="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between gap-3 text-xs text-amber-200 animate-pulse">
              <div class="flex items-center gap-2.5">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <div>
                  <span class="font-bold">Dyktowanie do {{ speech.activeTarget() === 'note-title' ? 'tytułu' : 'treści notatki' }}...</span>
                  <span class="ml-2 italic text-slate-200">„{{ speech.currentInterim() || 'Mów do mikrofonu...' }}”</span>
                </div>
              </div>
              <button
                (click)="speech.stop()"
                class="px-2.5 py-1 bg-red-500/30 hover:bg-red-500/50 text-red-200 rounded-lg border border-red-500/40 cursor-pointer text-xs flex items-center gap-1"
              >
                <mat-icon class="text-xs">stop</mat-icon>
                Zatrzymaj
              </button>
            </div>
          }

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Tytuł notatki z dyktowaniem -->
            <div class="md:col-span-2">
              <div class="flex items-center justify-between mb-1">
                <label for="input-note-title" class="text-xs font-semibold text-slate-300">
                  Tytuł notatki / Sygnatura sprawy:
                </label>
                <button
                  type="button"
                  (click)="toggleTitleDictation()"
                  [class]="isDictatingTitle() ? 'text-red-400 font-bold animate-pulse' : 'text-slate-400 hover:text-amber-300'"
                  class="text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                  title="Dyktuj tytuł notatki"
                >
                  <mat-icon class="text-xs">{{ isDictatingTitle() ? 'mic' : 'mic_none' }}</mat-icon>
                  <span>{{ isDictatingTitle() ? 'Słucham...' : 'Dyktuj tytuł' }}</span>
                </button>
              </div>
              <input
                id="input-note-title"
                type="text"
                [value]="noteTitle()"
                (input)="noteTitle.set($any($event.target).value)"
                placeholder="np. Kowalski Jan – Obrona z art. 178a k.k., badanie alkomatem"
                class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <!-- Kategoria -->
            <div>
              <label for="select-note-category" class="block text-xs font-semibold text-slate-300 mb-1">Kategoria:</label>
              <select
                id="select-note-category"
                [value]="noteCategory()"
                (change)="noteCategory.set($any($event.target).value)"
                class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Sprawa klienta">Sprawa klienta</option>
                <option value="Analiza prawna">Analiza prawna</option>
                <option value="Wniosek dowodowy">Wniosek dowodowy</option>
                <option value="Notatka z rozprawy">Notatka z rozprawy</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Powiązany artykuł -->
            <div>
              <label for="input-note-linked-art" class="block text-xs font-semibold text-slate-300 mb-1">Powiązany artykuł k.k.:</label>
              <input
                id="input-note-linked-art"
                type="text"
                [value]="noteLinkedArticle()"
                (input)="noteLinkedArticle.set($any($event.target).value)"
                placeholder="np. Art. 178a § 1 k.k."
                class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <!-- Tagi -->
            <div class="md:col-span-2">
              <label for="input-note-tags" class="block text-xs font-semibold text-slate-300 mb-1">Tagi (oddzielone przecinkami):</label>
              <input
                id="input-note-tags"
                type="text"
                [value]="noteTagsInput()"
                (input)="noteTagsInput.set($any($event.target).value)"
                placeholder="np. alkomat, konfiskata, linia obrony, świadek"
                class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <!-- Pasek szablonów procesowych -->
          <div class="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              <span class="text-[11px] text-amber-400 font-semibold whitespace-nowrap flex items-center gap-1 mr-1">
                <mat-icon class="text-xs">description</mat-icon> Wstaw szablon pisma:
              </span>
              <button
                type="button"
                (click)="applyTemplate('warunkowe-umorzenie')"
                class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-amber-300 text-xs whitespace-nowrap cursor-pointer transition-colors"
                title="Wstaw strukturę wniosku o warunkowe umorzenie postępowania (art. 66 k.k.)"
              >
                Wniosek o warunkowe umorzenie
              </button>
              <button
                type="button"
                (click)="applyTemplate('wniosek-dowodowy')"
                class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-amber-300 text-xs whitespace-nowrap cursor-pointer transition-colors"
                title="Wstaw wniosek dowodowy o dopuszczenie dowodu (art. 169 k.p.k.)"
              >
                Wniosek dowodowy (art. 169 k.p.k.)
              </button>
              <button
                type="button"
                (click)="applyTemplate('zazalenie-zatrzymanie')"
                class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-amber-300 text-xs whitespace-nowrap cursor-pointer transition-colors"
                title="Wstaw wzór zażalenia na zatrzymanie prawa jazdy / pojazdu"
              >
                Zażalenie (zatrzymanie prawa jazdy)
              </button>
              <button
                type="button"
                (click)="applyTemplate('nadzwyczajne-zlagodzenie')"
                class="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-200 hover:text-emerald-100 text-xs whitespace-nowrap cursor-pointer transition-colors"
                title="Wstaw wniosek o nadzwyczajne złagodzenie kary (art. 60 § 2 k.k.)"
              >
                Nadzwyczajne złagodzenie (art. 60 k.k.)
              </button>
              <button
                type="button"
                (click)="applyTemplate('umorzenie-narkotyki')"
                class="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-200 hover:text-emerald-100 text-xs whitespace-nowrap cursor-pointer transition-colors"
                title="Wstaw wniosek o umorzenie z art. 62a UoPN (posiadanie nieznacznej ilości)"
              >
                Umorzenie z art. 62a UoPN
              </button>
              <button
                type="button"
                (click)="applyTemplate('linia-obrony')"
                class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-amber-300 text-xs whitespace-nowrap cursor-pointer transition-colors"
                title="Wstaw konspekt memorandum strategii procesowej"
              >
                Memorandum linii obrony
              </button>
            </div>
          </div>

          <!-- Treść notatki z dyktowaniem Web Speech API -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="textarea-note-content" class="text-xs font-semibold text-slate-300">
                Treść notatki / Ustalenia ze spotkania / Tezy dowodowe:
              </label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="toggleContentDictation()"
                  [class]="isDictatingContent()
                    ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-500/40'
                    : 'bg-slate-800 text-slate-300 hover:text-amber-300 hover:bg-slate-700 border border-slate-700'"
                  class="px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  [title]="isDictatingContent() ? 'Zatrzymaj dyktowanie' : 'Dyktuj treść notatki głosem (Web Speech API)'"
                >
                  <mat-icon class="text-xs">{{ isDictatingContent() ? 'mic' : 'mic_none' }}</mat-icon>
                  <span>{{ isDictatingContent() ? 'Zatrzymaj dyktowanie' : 'Dyktuj głosem (pl-PL)' }}</span>
                </button>
              </div>
            </div>

            <div class="relative">
              <textarea
                id="textarea-note-content"
                rows="8"
                [value]="noteContent()"
                (input)="noteContent.set($any($event.target).value)"
                placeholder="Wpisz treść lub naciśnij 'Dyktuj głosem' i dyktuj swobodnie. System automatycznie rozpoznaje komendy: 'kropka', 'przecinek', 'nowy akapit', 'artykuł 178a', 'paragraf 1'..."
                class="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans leading-relaxed transition-colors"
              ></textarea>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 mt-1 text-[11px] text-slate-400">
              <div class="flex items-center gap-1.5">
                <mat-icon class="text-xs text-amber-400">tips_and_updates</mat-icon>
                <span>Komendy głosowe: <em>„kropka”</em>, <em>„przecinek”</em>, <em>„nowy akapit”</em>, <em>„artykuł [nr]”</em>, <em>„paragraf [nr]”</em></span>
              </div>
              <span class="font-mono text-slate-500">{{ noteContent().length }} znaków</span>
            </div>
          </div>

          <!-- Przyciski akcji -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              (click)="resetNoteForm()"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Anuluj
            </button>
            <button
              id="btn-save-note"
              (click)="saveCurrentNote()"
              [disabled]="!noteTitle().trim() || !noteContent().trim()"
              class="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <mat-icon class="text-xs">save</mat-icon>
              <span>Zapisz w Skarbcu</span>
            </button>
          </div>
        </div>
      }

      <!-- Filtry notatek -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span class="text-xs text-slate-400 font-semibold whitespace-nowrap">Kategoria:</span>
          <button
            (click)="selectedCategoryFilter.set('all')"
            [class]="selectedCategoryFilter() === 'all' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
            class="text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
          >
            Wszystkie ({{ legalData.notes().length }})
          </button>
          <button
            (click)="selectedCategoryFilter.set('Sprawa klienta')"
            [class]="selectedCategoryFilter() === 'Sprawa klienta' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
            class="text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
          >
            Sprawy klienta
          </button>
          <button
            (click)="selectedCategoryFilter.set('Analiza prawna')"
            [class]="selectedCategoryFilter() === 'Analiza prawna' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
            class="text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
          >
            Analizy prawne
          </button>
          <button
            (click)="selectedCategoryFilter.set('Wniosek dowodowy')"
            [class]="selectedCategoryFilter() === 'Wniosek dowodowy' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
            class="text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
          >
            Wnioski dowodowe
          </button>
        </div>

        <div class="relative w-full sm:w-64">
          <mat-icon class="absolute left-2.5 top-2 text-slate-500 text-sm">search</mat-icon>
          <input
            type="text"
            [value]="notesSearchQuery()"
            (input)="notesSearchQuery.set($any($event.target).value)"
            placeholder="Szukaj w notatkach..."
            class="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <!-- Siatka notatek -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (note of filteredNotes(); track note.id) {
          <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-amber-400">
                  {{ note.category }}
                </span>
                <span class="text-[11px] text-slate-500 font-mono">
                  {{ note.updatedAt }}
                </span>
              </div>

              <h4 class="text-sm md:text-base font-bold text-white mb-2 leading-snug">
                {{ note.title }}
              </h4>

              @if (note.linkedArticle) {
                <div class="mb-3">
                  <span class="text-xs bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                    {{ note.linkedArticle }}
                  </span>
                </div>
              }

              <p class="text-xs text-slate-300 whitespace-pre-line line-clamp-4 mb-4 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                {{ note.content }}
              </p>

              @if (note.tags.length > 0) {
                <div class="flex flex-wrap gap-1 mb-4">
                  @for (tag of note.tags; track tag) {
                    <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      #{{ tag }}
                    </span>
                  }
                </div>
              }
            </div>

            <!-- Akcje: Eksport do PDF, Edycja, Usunięcie -->
            <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <button
                (click)="exportNoteToPdf(note)"
                class="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <mat-icon class="text-sm">picture_as_pdf</mat-icon>
                <span>Eksportuj do PDF</span>
              </button>

              <div class="flex items-center gap-1">
                <button
                  (click)="editNote(note)"
                  class="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                  title="Edytuj"
                >
                  <mat-icon class="text-sm">edit</mat-icon>
                </button>
                <button
                  (click)="deleteNote(note.id)"
                  class="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                  title="Usuń"
                >
                  <mat-icon class="text-sm">delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="md:col-span-2 text-center py-12 text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            Brak zapisanych notatek. Utwórz pierwszą notatkę sprawy lub podyktuj ją głosem za pomocą przycisku powyżej.
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncryptedNotes {
  readonly legalData = inject(LegalDataService);
  readonly cryptoService = inject(CryptoService);
  readonly pdfService = inject(PdfExportService);
  readonly speech = inject(SpeechDictationService);

  readonly requestUnlockVault = output<void>();
  readonly navigateToCases = output<void>();

  readonly showNoteForm = signal<boolean>(false);
  readonly editingNoteId = signal<string | null>(null);
  readonly noteTitle = signal<string>('');
  readonly noteCategory = signal<EncryptedNote['category']>('Sprawa klienta');
  readonly noteLinkedArticle = signal<string>('');
  readonly noteContent = signal<string>('');
  readonly noteTagsInput = signal<string>('');

  readonly selectedCategoryFilter = signal<string>('all');
  readonly notesSearchQuery = signal<string>('');

  readonly filteredNotes = computed(() => {
    const cat = this.selectedCategoryFilter();
    const query = this.notesSearchQuery().toLowerCase().trim();
    let list = this.legalData.notes();

    if (cat !== 'all') {
      list = list.filter((n) => n.category === cat);
    }

    if (query) {
      list = list.filter((n) =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        (n.linkedArticle && n.linkedArticle.toLowerCase().includes(query)) ||
        n.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return list;
  });

  insertTemplate(tmpl: string): void {
    this.showNoteForm.set(true);
    if (tmpl === 'art66' || tmpl === 'warunkowe-umorzenie') {
      this.applyTemplate('warunkowe-umorzenie');
    } else if (tmpl === 'art60' || tmpl === 'nadzwyczajne-zlagodzenie') {
      this.applyTemplate('nadzwyczajne-zlagodzenie');
    } else if (tmpl === 'uopn62a' || tmpl === 'umorzenie-narkotyki') {
      this.applyTemplate('umorzenie-narkotyki');
    } else if (tmpl === 'art169' || tmpl === 'wniosek-dowodowy') {
      this.applyTemplate('wniosek-dowodowy');
    } else if (tmpl === 'driving' || tmpl === 'zazalenie-zatrzymanie') {
      this.applyTemplate('zazalenie-zatrzymanie');
    } else {
      this.applyTemplate('linia-obrony');
    }
  }

  applyTemplate(type: 'warunkowe-umorzenie' | 'nadzwyczajne-zlagodzenie' | 'umorzenie-narkotyki' | 'wniosek-dowodowy' | 'zazalenie-zatrzymanie' | 'linia-obrony'): void {
    switch (type) {
      case 'nadzwyczajne-zlagodzenie':
        this.noteTitle.set('Wniosek o nadzwyczajne złagodzenie kary (art. 60 § 2 k.k.)');
        this.noteCategory.set('Analiza prawna');
        this.noteLinkedArticle.set('Art. 60 § 2 i § 6 k.k.');
        this.noteTagsInput.set('art 60 kk, nadzwyczajne złagodzenie, pojednanie, naprawienie szkody, wniosek');
        this.noteContent.set(
`SĄD REJONOWY W: [Miejscowość, Wydział Karny]
Sygn. akt: [Sygnatura akt sprawy]

Oskarżony: [Imię i Nazwisko]
Obrońca: [Imię i Nazwisko Adwokata]

WNIOSEK OBROŃCY O ZASTOSOWANIE NADZWYCZAJNEGO ZŁAGODZENIA KARY
(art. 60 § 2 pkt 1 i § 6 k.k.)

Działając jako obrońca oskarżonego, na zasadzie art. 60 § 2 pkt 1 k.k. w zw. z art. 60 § 6 pkt 3/4 k.k., wnoszę o:
1. Zastosowanie wobec oskarżonego dobrodziejstwa nadzwyczajnego złagodzenia kary.
2. Wymierzenie kary wolnościowej w postaci grzywny albo kary ograniczenia wolności, ewentualnie kary pozbawienia wolności z warunkowym zawieszeniem jej wykonania (art. 69 § 1 k.k.).

UZASADNIENIE
1. POJEDNANIE I NAPRAWIENIE SZKODY: Oskarżony przed otwarciem przewodu sądowego w całości zrekompensował szkodę materialną wyrządzoną przestępstwem oraz zawarł z pokrzywdzonym ugodę pojednawczą.
2. POSTAWA SPRAWCY: Oskarżony szczerze wyraził skruchę, złożył wyczerpujące wyjaśnienia i współpracował z organami ścigania.
3. Zgodnie z utrwalonym orzecznictwem Sądu Najwyższego (m.in. I KZP 12/20) całkowite naprawienie szkody i pojednanie z pokrzywdzonym stanowi samodzielną podstawę do odstąpienia od kary izolacyjnej.`
        );
        break;

      case 'umorzenie-narkotyki':
        this.noteTitle.set('Wniosek o umorzenie postępowania na podst. art. 62a UoPN');
        this.noteCategory.set('Wniosek dowodowy');
        this.noteLinkedArticle.set('Art. 62a UoPN');
        this.noteTagsInput.set('uopn, art 62a, marihuana, własny użytek, nieznaczna ilość, umorzenie');
        this.noteContent.set(
`PROKURATURA REJONOWA W: [Miejscowość] / KOMENDA POLICJI
Sygn. akt: [Sygnatura dochodzenia / śledztwa]

Podejrzany: [Imię i Nazwisko]
Obrońca: [Imię i Nazwisko Adwokata]

WNIOSEK O UMORZENIE POSTĘPOWANIA PRZED WYDANIEM POSTANOWIENIA O WSZCZĘCIU
(art. 62a Ustawy o przeciwdziałaniu narkomanii)

Działając imieniem podejrzanego, na podstawie art. 62a UoPN, wnoszę o:
1. Umorzenie postępowania karnego w przedmiocie zarzutu z art. 62 ust. 1 UoPN.
2. Orzeczenie przepadku zabezpieczonych substancji odurzających.

UZASADNIENIE
1. ILOŚĆ NIEZNACZNA: Przedmiotem zabezpieczenia była minimalna ilość suszu ([...] grama), stanowiąca co najwyżej jedną porcję konsumpcyjną.
2. WŁASNY UŻYTEK: W toku przeszukania nie ujawniono wag elektronicznych, woreczków strunowych ani gotówki wskazującej na dystrybucję.
3. BEZCELOWOŚĆ KARANIA: Podejrzany jest osobą młodą, dotychczas niekaraną, pracującą/uczącą się. Stopień społecznej szkodliwości czynu jest znikomy, a orzeczenie kary byłoby sprzeczne z celami wychowawczymi.`
        );
        break;

      case 'warunkowe-umorzenie':
        this.noteTitle.set('Wniosek o warunkowe umorzenie postępowania karnego (art. 66 k.k.)');
        this.noteCategory.set('Analiza prawna');
        this.noteLinkedArticle.set('Art. 66 k.k.');
        this.noteTagsInput.set('warunkowe umorzenie, art. 66 k.k., niekaralność, wniosek');
        this.noteContent.set(
`SĄD REJONOWY W: [Miejscowość, Wydział Karny]
Sygn. akt: [Wpisz sygnaturę akt sprawy]

Podejrzany / Oskarżony: [Imię i Nazwisko]
Obrońca: [Imię i Nazwisko Adwokata / Radcy]

WNIOSEK O WARUNKOWE UMORZENIE POSTĘPOWANIA KARNEGO
Działając jako obrońca oskarżonego [Imię Nazwisko], na podstawie art. 66 § 1 i 2 k.k. oraz art. 67 § 1 k.k. wnoszę o:

1. Warunkowe umorzenie postępowania karnego wobec oskarżonego na okres próby wynoszący [1 rok / 2 lata].
2. Orzeczenie świadczenia pieniężnego na rzecz Funduszu Pomocy Pokrzywdzonym w kwocie [np. 1000 - 3000 zł].
3. Odstąpienie od orzekania zakazu prowadzenia pojazdów na podstawie art. 67 § 3 k.k.

UZASADNIENIE
1. Dotychczasowa niekaralność sprawcy za przestępstwo umyślne (brak wpisu w KRK).
2. Wina i społeczna szkodliwość czynu nie są znaczne: [wskazać okoliczności łagodzące, np. incydentalny charakter, współpraca z policją].
3. Postawa sprawcy i pozytywna prognoza kryminologiczna: sprawca prowadzi ustabilizowany tryb życia, pracuje zawodowo, posiada pozytywną opinię środowiskową.`
        );
        break;

      case 'wniosek-dowodowy':
        this.noteTitle.set('Wniosek dowodowy o dopuszczenie dowodu (art. 169 k.p.k.)');
        this.noteCategory.set('Wniosek dowodowy');
        this.noteLinkedArticle.set('Art. 169 k.p.k.');
        this.noteTagsInput.set('wniosek dowodowy, kpk, dowody, teza dowodowa');
        this.noteContent.set(
`ORGAN PROWADZĄCY: [Prokuratura Rejonowa / Sąd Rejonowy]
Sygn. akt: [Wpisz sygnaturę]

WNIOSEK DOWODOWY OBROŃCY (art. 169 k.p.k.)
Działając imieniem oskarżonego, wnoszę o:

1. Dopuszczenie i przeprowadzenie dowodu z:
   - [ ] Dokumentu / nagrania monitoringu z dnia [...]
   - [ ] Zeznań świadka: [Imię, nazwisko, adres zamieszkania]
   - [ ] Opinii biegłego z zakresu [...]

2. TEZA DOWODOWA:
   Dowód ten powoływany jest na okoliczność wykazania, że [dokładny opis faktu, który ma być udowodniony, np. brak zamiaru bezpośredniego, stan wyższej konieczności, błąd pomiarowy urządzenia].

UZASADNIENIE
Przeprowadzenie wskazanego dowodu ma kluczowe znaczenie dla rozstrzygnięcia sprawy i nie spowoduje nieuzasadnionej zwłoki w postępowaniu (art. 170 § 1 k.p.k.).`
        );
        break;

      case 'zazalenie-zatrzymanie':
        this.noteTitle.set('Zażalenie na postanowienie o zatrzymaniu prawa jazdy / rzeczy');
        this.noteCategory.set('Wniosek dowodowy');
        this.noteLinkedArticle.set('Art. 135 ust. 1 Prd / art. 217 k.p.k.');
        this.noteTagsInput.set('zażalenie, zatrzymanie prawa jazdy, art. 135 prd, środek przymusu');
        this.noteContent.set(
`DO: Sąd Rejonowy w [Miejscowość]
za pośrednictwem: [Prokuratura / Komenda Policji]
Sygn. akt: [Sygnatura sprawy]

ZAŻALENIE NA POSTANOWIENIE O ZATRZYMANIU
Działając w imieniu podejrzanego, zaskarżam w całości postanowienie z dnia [...] w przedmiocie zatrzymania prawa jazdy / rzeczy.

ZARZUTY:
1. Błąd w ustaleniach faktycznych polegający na przyjęciu, że zachodzi wysokie prawdopodobieństwo orzeczenia środka karnego w postaci zakazu prowadzenia pojazdów.
2. Naruszenie zasady proporcjonalności: zatrzymanie dokumentu uniemożliwia podejrzanemu wykonywanie jedynego źródła zarobkowania niezbędnego do utrzymania rodziny.

WNIOSEK:
Wnoszę o uchylenie zaskarżonego postanowienia i niezwłoczny zwrot dokumentu podejrzanemu.`
        );
        break;

      case 'linia-obrony':
        this.noteTitle.set('Memorandum Strategii Procesowej i Linii Obrony');
        this.noteCategory.set('Sprawa klienta');
        this.noteTagsInput.set('strategia, linia obrony, analiza ryzyka, memorandum');
        this.noteContent.set(
`MEMORANDUM STRATEGICZNE SPRAWY KARNEJ
Klient: [Imię i Nazwisko / Sygnatura wewnętrzna]
Zarzut: [Kwalifikacja prawna z k.k. / k.w.]

I. STAN FAKTYCZNY WEDŁUG KLIENTA:
[Chronologiczny opis zdarzeń ze spotkania z klientem]

II. DOWODY OSKARŻENIA I ICH SŁABE PUNKTY:
- Dowód A: [np. protokół badania alkomatem – weryfikacja świadectwa wzorcowania i czasu próby]
- Dowód B: [np. zeznania świadków – sprzeczności w relacjach]

III. PLANOWANE KROKI OBROŃCZE:
1. Przesłuchanie w postępowaniu przygotowawczym (odmowa składania wyjaśnień vs złożenie wyjaśnień na piśmie).
2. Wnioski dowodowe w trybie art. 169 k.p.k.
3. Wariant A: Walka o uniewinnienie lub zmianę kwalifikacji na wypadek mniejszej wagi.
4. Wariant B: Wniosek o warunkowe umorzenie (art. 66 k.k.) lub konsensualne zakończenie (art. 387 k.p.k.).`
        );
        break;
    }
  }

  isDictatingTitle(): boolean {
    return this.speech.isListening() && this.speech.activeTarget() === 'note-title';
  }

  isDictatingContent(): boolean {
    return this.speech.isListening() && this.speech.activeTarget() === 'note-content';
  }

  toggleTitleDictation(): void {
    if (this.isDictatingTitle()) {
      this.speech.stop();
      return;
    }

    this.speech.start('note-title', (chunk: string, isFinal: boolean) => {
      if (isFinal) {
        const current = this.noteTitle().trim();
        const sep = current ? ' ' : '';
        this.noteTitle.set(`${current}${sep}${chunk}`.trim());
      }
    });
  }

  toggleContentDictation(): void {
    if (this.isDictatingContent()) {
      this.speech.stop();
      return;
    }

    this.speech.start('note-content', (chunk: string, isFinal: boolean) => {
      if (isFinal) {
        const current = this.noteContent().trim();
        const sep = current ? (chunk.startsWith('.') || chunk.startsWith(',') ? '' : ' ') : '';
        this.noteContent.set(`${current}${sep}${chunk}`);
      }
    });
  }

  async saveCurrentNote(): Promise<void> {
    if (this.isDictatingTitle() || this.isDictatingContent()) {
      this.speech.stop();
    }

    const title = this.noteTitle().trim();
    const content = this.noteContent().trim();
    if (!title || !content) return;

    const tags = this.noteTagsInput()
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await this.legalData.saveNote(
        {
          title,
          content,
          category: this.noteCategory(),
          linkedArticle: this.noteLinkedArticle().trim() || undefined,
          tags,
        },
        this.editingNoteId() || undefined
      );
      this.resetNoteForm();
    } catch (e: unknown) {
      const err = e as Error;
      if (!this.cryptoService.isAuthenticated()) {
        this.requestUnlockVault.emit();
      } else {
        alert(err.message || 'Błąd zapisu notatki.');
      }
    }
  }

  editNote(note: EncryptedNote): void {
    this.editingNoteId.set(note.id);
    this.noteTitle.set(note.title);
    this.noteCategory.set(note.category);
    this.noteLinkedArticle.set(note.linkedArticle || '');
    this.noteContent.set(note.content);
    this.noteTagsInput.set(note.tags.join(', '));
    this.showNoteForm.set(true);
  }

  async deleteNote(id: string): Promise<void> {
    await this.legalData.deleteNote(id);
  }

  exportNoteToPdf(note: EncryptedNote): void {
    this.pdfService.exportNoteToPdf(note);
  }

  resetNoteForm(): void {
    if (this.speech.isListening()) {
      this.speech.stop();
    }
    this.editingNoteId.set(null);
    this.noteTitle.set('');
    this.noteLinkedArticle.set('');
    this.noteContent.set('');
    this.noteTagsInput.set('');
    this.showNoteForm.set(false);
  }

  // Metoda publiczna umożliwiająca zainicjowanie notatki z zewnątrz (np. z artykułu lub orzeczenia)
  initNoteFromExternal(title: string, content: string, linkedArticle?: string, tags?: string[]): void {
    this.resetNoteForm();
    this.noteTitle.set(title);
    this.noteContent.set(content);
    if (linkedArticle) this.noteLinkedArticle.set(linkedArticle);
    if (tags) this.noteTagsInput.set(tags.join(', '));
    this.showNoteForm.set(true);
  }

  openCreateFormForArticle(art: PenalArticle): void {
    this.initNoteFromExternal(
      `Notatka prawna – Art. ${art.number}${art.suffix || ''} k.k.`,
      `Stan faktyczny / uwagi do wykładni art. ${art.number} k.k. (${art.title}):\n\n`,
      `Art. ${art.number}${art.suffix || ''} k.k.`,
      [`art ${art.number}`, 'kodeks karny', 'orzecznictwo']
    );
  }

  openCreateFormForRuling(ruling: CourtRuling): void {
    this.initNoteFromExternal(
      `Notatka do orzeczenia ${ruling.signature}`,
      `Sygnatura: ${ruling.signature}\nTeza: ${ruling.thesis}\nWyrok: ${ruling.sanctionImposed}\nUwagi do sprawy klienta: \n\n`,
      ruling.articleRef,
      ['orzecznictwo', ruling.court.toLowerCase(), 'precedens']
    );
  }
}
