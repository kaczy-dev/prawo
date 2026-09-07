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
      <!-- Pasek wyszukiwania w orzecznictwie -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <mat-icon class="text-amber-400">account_balance</mat-icon>
              Baza Orzecznictwa Sądu Najwyższego i Sądów Apelacyjnych
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              Kluczowe tezy, linie orzecznicze, sygnatury akt oraz przykłady orzeczonych kar w sprawach karnych.
            </p>
          </div>
          <span class="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            Łącznie: {{ filteredRulings().length }} orzeczeń
          </span>
        </div>

        <div class="relative">
          <mat-icon class="absolute left-3.5 top-3 text-slate-500 text-lg">search</mat-icon>
          <input
            id="input-ruling-search"
            type="text"
            [value]="searchQuery()"
            (input)="searchQuery.set($any($event.target).value)"
            placeholder="Szukaj orzeczenia po sygnaturze (np. I KZP, II KK), przepisie lub zagadnieniu prawnym..."
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      <!-- Siatka Orzeczeń Sądowych -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        @for (ruling of filteredRulings(); track ruling.id) {
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-amber-300 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {{ ruling.signature }}
                  </span>
                  <span class="text-xs font-semibold text-slate-300">{{ ruling.court }}</span>
                </div>
                <span class="text-xs text-slate-500 font-mono">{{ ruling.date }}</span>
              </div>

              <div class="text-xs font-mono text-amber-400/90 mb-2">
                Przepis: {{ ruling.articleRef }}
              </div>

              <h3 class="text-sm font-bold text-white mb-2">
                {{ ruling.title }}
              </h3>

              <!-- Teza orzeczenia -->
              <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 mb-3">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teza orzeczenia:</span>
                <p class="text-xs text-slate-300 italic font-serif leading-relaxed">
                  "{{ ruling.thesis }}"
                </p>
              </div>

              <!-- Wyjaśnienie prostym językiem -->
              <p class="text-xs text-slate-400 mb-3 leading-relaxed font-sans">
                <strong class="text-slate-300">W praktyce:</strong> {{ ruling.summaryPlain }}
              </p>

              <!-- Zastosowana kara -->
              <div class="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 mb-3 text-xs">
                <span class="font-bold text-slate-400 block text-[10px] uppercase">Zastosowana kara / rozstrzygnięcie:</span>
                <span class="text-emerald-400 font-medium">{{ ruling.sanctionImposed }}</span>
              </div>
            </div>

            <!-- Tagi i akcje -->
            <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <div class="flex flex-wrap gap-1">
                @for (t of ruling.tags; track t) {
                  <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                    #{{ t }}
                  </span>
                }
              </div>

              <div class="flex items-center gap-2">
                <button
                  id="btn-ruling-read-{{ ruling.id }}"
                  (click)="tts.speakRuling(ruling)"
                  [class]="tts.isPlaying() && tts.currentTextId() === ruling.id
                    ? 'text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-amber-300'"
                  class="text-xs flex items-center gap-1 font-medium cursor-pointer transition-colors"
                  title="Odsłuchaj orzeczenie i tezę na głos (Lektor Web Speech API)"
                  aria-label="Odsłuchaj orzeczenie na głos"
                >
                  <mat-icon class="text-xs">{{ tts.isPlaying() && tts.currentTextId() === ruling.id && !tts.isPaused() ? 'volume_up' : 'record_voice_over' }}</mat-icon>
                  <span>{{ tts.isPlaying() && tts.currentTextId() === ruling.id ? (tts.isPaused() ? 'Wznów' : 'Pauza') : 'Czytaj' }}</span>
                </button>
                <button
                  (click)="checkThreat.emit(ruling)"
                  class="text-xs text-slate-300 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer transition-colors"
                  title="Sprawdź zagrożenie karne dla tego orzeczenia w kalkulatorze"
                >
                  <mat-icon class="text-xs text-amber-400">gavel</mat-icon>
                  Co grozi?
                </button>
                <button
                  (click)="sendToNotes.emit(ruling)"
                  class="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <mat-icon class="text-xs">bookmark_add</mat-icon>
                  Do notatek
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="md:col-span-2 text-center py-12 text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            Brak orzeczeń spełniających kryteria wyszukiwania.
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulingsBrowser {
  readonly legalData = inject(LegalDataService);
  readonly tts = inject(TextToSpeechService);

  readonly searchQuery = signal<string>('');

  readonly checkThreat = output<CourtRuling>();
  readonly sendToNotes = output<CourtRuling>();

  readonly filteredRulings = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const all = this.legalData.courtRulings();
    if (!q) return all;

    return all.filter((r) => {
      const combined = `${r.signature} ${r.court} ${r.articleRef} ${r.title} ${r.thesis} ${r.tags.join(' ')}`.toLowerCase();
      return combined.includes(q);
    });
  });

  setSearchQuery(q: string): void {
    this.searchQuery.set(q);
  }
}
