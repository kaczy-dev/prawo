import { ChangeDetectionStrategy, Component, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface OffenseSentence {
  id: string;
  article: string;
  description: string;
  prisonMonths: number;
}

@Component({
  selector: 'app-cumulative-sentence-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        class="relative w-full max-w-4xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl shadow-black/80 flex flex-col max-h-[90vh] overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <mat-icon class="text-2xl">calculate</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-serif font-bold text-slate-100 tracking-tight">Kalkulator Kary Łącznej</h3>
                <span class="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  art. 85 & 86 k.k.
                </span>
              </div>
              <p class="text-xs text-slate-400">Zbieg przestępstw, granice ustawowe oraz dyrektywy absorpcji i asperacji</p>
            </div>
          </div>
          <button 
            (click)="closeModal.emit()" 
            class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zamknij modal"
          >
            <mat-icon class="text-xl">close</mat-icon>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Law Rules Card -->
          <div class="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-start gap-3">
              <mat-icon class="text-amber-400 text-xl mt-0.5">gavel</mat-icon>
              <div class="text-xs text-slate-300 leading-relaxed">
                <strong class="text-amber-300 font-medium">Zasady orzekania (art. 86 § 1 k.k.):</strong> Sąd wymierza karę łączną w granicach od najwyższej z kar wymierzonych za poszczególne przestępstwa (dolna granica – pełna absorpcja) do ich sumy (górna granica – pełna kumulacja), nie przekraczając 30 lat pozbawienia wolności (art. 86 § 1 k.k. po reformie).
              </div>
            </div>
          </div>

          <!-- Offenses Inputs and Table -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <mat-icon class="text-sm text-amber-400">list_alt</mat-icon>
                Zbiegające się skazania jednostkowe
              </h4>
              <button 
                (click)="addSentence()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-all active:scale-[0.98]"
              >
                <mat-icon class="text-sm">add</mat-icon>
                Dodaj skazanie
              </button>
            </div>

            <div class="space-y-2">
              @for (item of sentences(); track item.id; let i = $index) {
                <div class="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <span class="w-6 text-center text-xs font-mono font-bold text-amber-400/80">#{{ i + 1 }}</span>
                  
                  <div class="w-full sm:w-36">
                    <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Artykuł / Czyn</label>
                    <input 
                      type="text" 
                      [(ngModel)]="item.article" 
                      placeholder="np. art. 280 § 1"
                      class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div class="flex-1">
                    <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Krótki opis czynu / sygnatura</label>
                    <input 
                      type="text" 
                      [(ngModel)]="item.description" 
                      placeholder="np. Rozbój w warunkach recydywy (II K 120/24)"
                      class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div class="w-full sm:w-44 flex items-center gap-2">
                    <div class="flex-1">
                      <label class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Wymiar (miesiące)</label>
                      <div class="relative">
                        <input 
                          type="number" 
                          min="1" 
                          max="360" 
                          [(ngModel)]="item.prisonMonths" 
                          class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                        />
                        <span class="absolute right-2 top-1.5 text-[10px] text-slate-400">mies.</span>
                      </div>
                    </div>
                    <div class="text-right pt-4 text-xs font-mono text-amber-300 w-16">
                      {{ formatMonths(item.prisonMonths) }}
                    </div>
                  </div>

                  <div class="pt-3 sm:pt-4 sm:ml-2 flex justify-end">
                    @if (sentences().length > 1) {
                      <button 
                        (click)="removeSentence(item.id)"
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Usuń skazanie"
                      >
                        <mat-icon class="text-lg">delete</mat-icon>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Interactive Asperation Slider & Visual Range -->
          <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 class="text-sm font-serif font-bold text-slate-100 flex items-center gap-2">
                  <mat-icon class="text-amber-400 text-base">tune</mat-icon>
                  Dyrektywa Wymiaru Kary Łącznej (Absorpcja &harr; Asperacja &harr; Kumulacja)
                </h4>
                <p class="text-xs text-slate-400 mt-0.5">Przesuwaj suwak, aby modelować związek przedmiotowo-podmiotowy zbiegających się czynów</p>
              </div>
              <div class="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold self-start sm:self-auto">
                Wskaźnik: {{ asperationPercentage() }}% ({{ getAsperationLabel() }})
              </div>
            </div>

            <!-- Slider Control -->
            <div class="space-y-2">
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5" 
                [ngModel]="asperationPercentage()"
                (ngModelChange)="asperationPercentage.set($event)"
                class="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div class="flex justify-between text-[11px] font-mono text-slate-400 px-1">
                <span>0% (Pełna absorpcja)</span>
                <span>50% (Umiarkowana asperacja)</span>
                <span>100% (Pełna kumulacja)</span>
              </div>
            </div>

            <!-- Mathematical Bounds Summary -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dolna Granica (Absorpcja)</div>
                <div class="text-lg font-mono font-bold text-slate-200 mt-1">{{ formatMonths(minMonths()) }}</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Najsurowsza kara jednostkowa</div>
              </div>

              <div class="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 relative overflow-hidden">
                <div class="absolute right-2 top-2 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <mat-icon class="text-lg">balance</mat-icon>
                </div>
                <div class="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Kalkulowana Kara Łączna</div>
                <div class="text-2xl font-mono font-extrabold text-amber-400 mt-1">{{ formatMonths(calculatedMonths()) }}</div>
                <div class="text-[11px] text-amber-200/80 mt-0.5">{{ calculatedMonths() }} miesięcy pozbawienia wolności</div>
              </div>

              <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Górna Granica (Suma / Limit)</div>
                <div class="text-lg font-mono font-bold text-slate-200 mt-1">{{ formatMonths(maxMonths()) }}</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Suma kar: {{ sumMonths() }} mies. (ustawowy limit art. 86 k.k.: 360 mies. / 30 lat)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <div class="text-xs text-slate-400 flex items-center gap-2">
            <mat-icon class="text-sm text-emerald-400">verified</mat-icon>
            Zgodne z reformą k.k. z 1 października 2023 r. (podwyższenie granicy do 30 lat pozbawienia wolności)
          </div>
          <div class="flex items-center gap-3">
            <button 
              (click)="closeModal.emit()" 
              class="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Zamknij
            </button>
            <button 
              (click)="copySummary()" 
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
            >
              <mat-icon class="text-sm">{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
              {{ copied() ? 'Skopiowano!' : 'Kopiuj tezę do pisma' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CumulativeSentenceModalComponent {
  closeModal = output<void>();

  sentences = signal<OffenseSentence[]>([
    { id: '1', article: 'art. 280 § 1 k.k.', description: 'Rozbój', prisonMonths: 36 },
    { id: '2', article: 'art. 278 § 1 k.k.', description: 'Kradzież z włamaniem', prisonMonths: 18 },
    { id: '3', article: 'art. 288 § 1 k.k.', description: 'Zniszczenie mienia', prisonMonths: 8 }
  ]);

  asperationPercentage = signal<number>(35);
  copied = signal<boolean>(false);

  minMonths = computed(() => {
    const list = this.sentences();
    if (!list.length) return 0;
    return Math.max(...list.map(s => Number(s.prisonMonths) || 0));
  });

  sumMonths = computed(() => {
    return this.sentences().reduce((acc, s) => acc + (Number(s.prisonMonths) || 0), 0);
  });

  maxMonths = computed(() => {
    // Od 1 października 2023 r. granica kary łącznej pozbawienia wolności wynosi 30 lat (360 miesięcy)
    return Math.min(this.sumMonths(), 360);
  });

  calculatedMonths = computed(() => {
    const min = this.minMonths();
    const max = this.maxMonths();
    if (min >= max) return min;
    const diff = max - min;
    const added = Math.round((diff * this.asperationPercentage()) / 100);
    return min + added;
  });

  addSentence() {
    const newId = String(Date.now());
    this.sentences.update(list => [
      ...list,
      { id: newId, article: 'art. ', description: 'Nowy czyn', prisonMonths: 12 }
    ]);
  }

  removeSentence(id: string) {
    this.sentences.update(list => list.filter(s => s.id !== id));
  }

  formatMonths(totalMonths: number): string {
    if (!totalMonths) return '0 mies.';
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years === 0) return months + ' mies.';
    if (months === 0) return years + ' ' + this.getYearPlural(years);
    return years + ' ' + this.getYearPlural(years) + ' ' + months + ' mies.';
  }

  private getYearPlural(years: number): string {
    if (years === 1) return 'rok';
    if (years >= 2 && years <= 4) return 'lata';
    return 'lat';
  }

  getAsperationLabel(): string {
    const val = this.asperationPercentage();
    if (val <= 10) return 'Zasada niemal pełnej absorpcji';
    if (val <= 35) return 'Umiarkowana asperacja (blisko absorpcji)';
    if (val <= 65) return 'Średnia asperacja';
    if (val <= 90) return 'Surowa asperacja (blisko kumulacji)';
    return 'Zasada pełnej kumulacji';
  }

  copySummary() {
    const text = 'Kalkulacja Kary Łącznej (art. 85-86 k.k.):\n' +
      this.sentences().map((s, idx) => '  ' + (idx + 1) + '. ' + s.article + ' (' + s.description + ') - ' + this.formatMonths(s.prisonMonths)).join('\n') +
      '\n\nGranice: od ' + this.formatMonths(this.minMonths()) + ' do ' + this.formatMonths(this.maxMonths()) +
      '\nProponowany wymiar przy wskaźniku asperacji ' + this.asperationPercentage() + '%: ' + this.formatMonths(this.calculatedMonths()) + ' (' + this.calculatedMonths() + ' miesięcy).';
    
    navigator.clipboard.writeText(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}