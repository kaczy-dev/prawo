import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CourtRuling } from '../models/legal.model';
import { LegalDataService } from '../services/legal-data.service';
import { TextToSpeechService } from '../services/text-to-speech.service';

@Component({
  selector: 'app-rulings-browser',
  imports: [CommonModule, MatIconModule],
  template: `
    <section id="section-rulings" class="space-y-6">
      <!-- Pasek wyszukiwania i filtrów orzecznictwa (Desktop: jednowierszowy, bez łamania) -->
      <div class="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-400/50 to-amber-500/0"></div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                Orzecznictwo i Tezy Sądowe
              </span>
              <span class="text-xs text-slate-400">Sąd Najwyższy & Sądy Apelacyjne</span>
            </div>
            <h2 class="text-lg md:text-xl font-serif font-bold text-white flex items-center gap-2">
              <mat-icon class="text-amber-400">account_balance</mat-icon>
              Baza Orzecznictwa i Linii Sądowych
            </h2>
          </div>
          <span class="text-xs text-slate-300 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
            Orzeczeń: <strong class="text-amber-400">{{ filteredRulings().length }}</strong>
          </span>
        </div>

        <div class="flex flex-col md:flex-row items-center gap-3">
          <div class="relative flex-1 w-full">
            <mat-icon class="absolute left-3.5 top-3 text-slate-500 text-lg">search</mat-icon>
            <input
              id="input-ruling-search"
              type="text"
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value)"
              placeholder="Szukaj po sygnaturze (np. I KZP, II KK, IV KK), przepisie lub zagadnieniu..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <!-- Pasek filtrów izb i lat w jednym rzędzie (desktop) -->
          <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0 shrink-0">
            <!-- Filtr Izby -->
            <button
              (click)="selectedCourtFilter.set('all')"
              [class]="selectedCourtFilter() === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
              class="px-2.5 py-1.5 rounded-lg border text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.98]"
            >
              Wszystkie Sądy
            </button>
            <button
              (click)="selectedCourtFilter.set('sn-karna')"
              [class]="selectedCourtFilter() === 'sn-karna'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
              class="px-2.5 py-1.5 rounded-lg border text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.98]"
            >
              SN Izba Karna
            </button>
            <button
              (click)="selectedCourtFilter.set('sa')"
              [class]="selectedCourtFilter() === 'sa'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
              class="px-2.5 py-1.5 rounded-lg border text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.98]"
            >
              Sądy Apelacyjne
            </button>

            <!-- Filtr Rocznika -->
            <select
              [value]="selectedYearFilter()"
              (change)="selectedYearFilter.set($any($event.target).value)"
              class="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Wszystkie lata</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020 i starsze</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Układ Dwuszpaltowy Desktop (5/12 lista sygnatur + 7/12 pełne uzasadnienie i analiza) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Lewa kolumna: Lista orzeczeń i sygnatur (5/12) -->
        <div class="lg:col-span-5 space-y-3 max-h-[780px] overflow-y-auto pr-1">
          @for (ruling of filteredRulings(); track ruling.id) {
            <div
              role="button"
              tabindex="0"
              (click)="selectRuling(ruling)"
              (keydown.enter)="selectRuling(ruling)"
              [class]="selectedRuling()?.id === ruling.id
                ? 'bg-slate-800/95 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'"
              class="border rounded-xl p-4 transition-all cursor-pointer relative group active:scale-[0.99]"
            >
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <span class="font-mono font-bold text-amber-300 text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {{ ruling.signature }}
                </span>
                <span class="text-[11px] text-slate-400 font-mono">{{ ruling.date }}</span>
              </div>

              <div class="text-[11px] text-amber-400/90 font-mono mb-1">
                {{ ruling.articleRef }}
              </div>

              <h3 class="text-xs font-bold text-slate-100 line-clamp-2 mb-1.5">
                {{ ruling.title }}
              </h3>

              <p class="text-[11px] text-slate-400 line-clamp-2 italic font-serif mb-2">
                "{{ ruling.thesis }}"
              </p>

              <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/60">
                <span class="truncate max-w-[200px]">{{ ruling.court }}</span>
                <span class="text-emerald-400 font-medium truncate max-w-[150px]">{{ ruling.sanctionImposed }}</span>
              </div>
            </div>
          } @empty {
            <div class="text-center py-12 text-slate-500 text-sm bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
              Brak orzeczeń spełniających wybrane kryteria wyszukiwania.
            </div>
          }
        </div>

        <!-- Prawa kolumna: Szczegółowe uzasadnienie, teza i analiza linii orzeczniczej (7/12) -->
        <div class="lg:col-span-7">
          @if (selectedRuling(); as r) {
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 sticky top-20">
              <!-- Nagłówek orzeczenia -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div class="flex items-center gap-2 mb-1.5">
                    <span class="font-mono font-bold text-amber-300 text-sm bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30">
                      {{ r.signature }}
                    </span>
                    <span class="text-xs text-slate-400 font-mono">{{ r.date }}</span>
                  </div>
                  <h2 class="text-base sm:text-lg font-serif font-bold text-white leading-snug">
                    {{ r.title }}
                  </h2>
                  <div class="text-xs text-amber-400 font-mono mt-1">
                    Podstawa: {{ r.articleRef }} | {{ r.court }}
                  </div>
                </div>

                <!-- Pasek akcji -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    (click)="tts.speakRuling(r)"
                    [class]="tts.isPlaying() && tts.currentTextId() === r.id
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-[0.98]'"
                    class="flex items-center gap-1.5 border text-xs px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                    title="Odsłuchaj tezę wyroku na głos"
                  >
                    <mat-icon class="text-sm">{{ tts.isPlaying() && tts.currentTextId() === r.id && !tts.isPaused() ? 'volume_up' : 'record_voice_over' }}</mat-icon>
                    <span>{{ tts.isPlaying() && tts.currentTextId() === r.id ? (tts.isPaused() ? 'Wznów' : 'Pauza') : 'Czytaj' }}</span>
                  </button>

                  <button
                    (click)="checkThreat.emit(r)"
                    class="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 active:scale-[0.98] border border-amber-500/30 text-amber-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    title="Otwórz w kalkulatorze 'Co mi grozi?'"
                  >
                    <mat-icon class="text-sm">gavel</mat-icon>
                    <span>Co grozi?</span>
                  </button>

                  <button
                    (click)="sendToNotes.emit(r)"
                    class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    title="Wstaw jako tezę do zaszyfrowanej notatki"
                  >
                    <mat-icon class="text-sm">edit_note</mat-icon>
                    <span>Do notatek</span>
                  </button>
                </div>
              </div>

              <!-- Oficjalna teza orzeczenia -->
              <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <mat-icon class="text-sm">format_quote</mat-icon>
                  Urzędowa teza orzeczenia Sądu:
                </span>
                <p class="text-sm text-slate-100 font-serif italic leading-relaxed whitespace-pre-line">
                  "{{ r.thesis }}"
                </p>
              </div>

              <!-- Wykładnia praktyczna i znaczenie procesowe -->
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <mat-icon class="text-sm text-amber-400">psychology</mat-icon>
                  Wykładnia praktyczna dla obrońcy / oskarżonego:
                </h4>
                <div class="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 font-sans">
                  {{ r.summaryPlain }}
                </div>
              </div>

              <!-- Zastosowane rozstrzygnięcie i orzeczona sankcja -->
              <div class="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4">
                <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Zastosowane rozstrzygnięcie w instancji orzekającej:
                </span>
                <p class="text-xs sm:text-sm font-semibold text-emerald-300">
                  {{ r.sanctionImposed }}
                </p>
              </div>

              <!-- Tagi i linie orzecznicze -->
              <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                <div class="flex flex-wrap gap-1.5">
                  @for (t of r.tags; track t) {
                    <span class="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded">
                      #{{ t }}
                    </span>
                  }
                </div>
                <span class="text-[11px] text-slate-500 font-mono">ID: {{ r.id }}</span>
              </div>
            </div>
          } @else {
            <div class="text-center py-20 text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
              Wybierz orzeczenie z lewej kolumny, aby wyświetlić pełną tezę i wykładnię prawną.
            </div>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulingsBrowser {
  readonly legalData = inject(LegalDataService);
  readonly tts = inject(TextToSpeechService);

  readonly searchQuery = signal<string>('');
  readonly selectedCourtFilter = signal<'all' | 'sn-karna' | 'sa'>('all');
  readonly selectedYearFilter = signal<string>('all');
  readonly selectedRuling = signal<CourtRuling | null>(null);

  readonly checkThreat = output<CourtRuling>();
  readonly sendToNotes = output<CourtRuling>();

  constructor() {
    const list = this.legalData.courtRulings();
    if (list.length > 0) {
      this.selectedRuling.set(list[0]);
    }
  }

  selectRuling(ruling: CourtRuling): void {
    this.selectedRuling.set(ruling);
  }

  readonly filteredRulings = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const court = this.selectedCourtFilter();
    const year = this.selectedYearFilter();
    const all = this.legalData.courtRulings();

    return all.filter((r) => {
      // Filtr sądu
      if (court === 'sn-karna' && !r.court.includes('Sąd Najwyższy')) return false;
      if (court === 'sa' && !r.court.includes('Sąd Apelacyjny')) return false;

      // Filtr roku
      if (year !== 'all') {
        if (year === '2020') {
          const rYear = parseInt(r.date.substring(0, 4), 10);
          if (rYear > 2020) return false;
        } else if (!r.date.startsWith(year)) {
          return false;
        }
      }

      if (!q) return true;
      const combined = `${r.signature} ${r.court} ${r.articleRef} ${r.title} ${r.thesis} ${r.summaryPlain} ${r.tags.join(' ')}`.toLowerCase();
      return combined.includes(q);
    });
  });

  setSearchQuery(q: string): void {
    this.searchQuery.set(q);
  }
}
