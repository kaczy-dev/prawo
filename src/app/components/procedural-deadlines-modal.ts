import { Component, ChangeDetectionStrategy, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  ProceduralDeadlinesService,
  DeadlineCalculationResult,
  ProceduralDeadlineType,
} from '../services/procedural-deadlines.service';

@Component({
  selector: 'app-procedural-deadlines-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
         (click)="onBackdropClick($event)">
      <div class="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#141928] via-[#0f1422] to-[#0a0d16] text-slate-100 shadow-2xl shadow-black/80 overflow-hidden"
           (click)="$event.stopPropagation()">
        
        <!-- Złota wstęga górna -->
        <div class="h-1 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        <!-- Nagłówek Modalu -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-slate-900/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <mat-icon>schedule</mat-icon>
            </div>
            <div>
              <h2 class="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
                Kalkulator Terminów Procesowych
                <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono">
                  art. 122–126 k.p.k.
                </span>
              </h2>
              <p class="text-xs text-slate-400">Obliczanie terminów zawitych z regułą soboty i świąt (art. 123 § 3 k.p.k.)</p>
            </div>
          </div>
          <button (click)="close.emit()" 
                  class="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                  title="Zamknij (Esc)">
            <mat-icon class="text-xl">close</mat-icon>
          </button>
        </div>

        <!-- Treść Modalu -->
        <div class="p-6 overflow-y-auto space-y-6 text-sm">
          
          <!-- Wybór czynności procesowej -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold uppercase tracking-wider text-amber-400">
              Czynność procesowa / Środek zaskarżenia
            </label>
            <select [ngModel]="selectedTypeId()" 
                    (ngModelChange)="onTypeChange($event)"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-amber-400 transition-colors">
              @for (type of deadlineTypes; track type.id) {
                <option [value]="type.id">
                  {{ type.name }} ({{ type.defaultDays }} dni — {{ type.basisArticle }})
                </option>
              }
            </select>
          </div>

          <!-- Data doręczenia / ogłoszenia oraz Dni -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-300">
                Data ogłoszenia / doręczenia (Dies a quo)
              </label>
              <input type="date" 
                     [ngModel]="eventDate()" 
                     (ngModelChange)="onDateChange($event)"
                     class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-amber-400 transition-colors font-mono" />
              <p class="text-[11px] text-slate-500">Zgodnie z art. 123 § 1 k.p.k. tego dnia nie wlicza się do biegu terminu.</p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-300">
                Długość terminu (dni)
              </label>
              <input type="number" 
                     [ngModel]="customDays()" 
                     (ngModelChange)="onDaysChange($event)"
                     min="1" max="365"
                     class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 text-sm focus:outline-none focus:border-amber-400 transition-colors font-mono" />
              <p class="text-[11px] text-slate-500">Możesz skorygować liczbę dni, jeśli sąd wyznaczył inny termin.</p>
            </div>
          </div>

          <!-- Wynik Obliczenia -->
          @if (calculation(); as calc) {
            <div class="p-4 rounded-xl border"
                 [class.border-emerald-500/40]="!calc.isExpired && !calc.isUrgent"
                 [class.bg-emerald-950/20]="!calc.isExpired && !calc.isUrgent"
                 [class.border-amber-500/40]="calc.isUrgent && !calc.isExpired"
                 [class.bg-amber-950/20]="calc.isUrgent && !calc.isExpired"
                 [class.border-rose-500/40]="calc.isExpired"
                 [class.bg-rose-950/20]="calc.isExpired">
              
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span class="text-xs font-medium uppercase tracking-wider text-slate-400">Termin końcowy na złożenie pisma:</span>
                  <div class="text-2xl font-bold font-mono tracking-tight"
                       [class.text-emerald-400]="!calc.isExpired && !calc.isUrgent"
                       [class.text-amber-400]="calc.isUrgent && !calc.isExpired"
                       [class.text-rose-400]="calc.isExpired">
                    {{ calc.adjustedEndDate }}
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="px-3 py-1.5 rounded-lg text-xs font-semibold font-mono"
                        [class.bg-emerald-500/20]="!calc.isExpired && !calc.isUrgent"
                        [class.text-emerald-300]="!calc.isExpired && !calc.isUrgent"
                        [class.bg-amber-500/20]="calc.isUrgent && !calc.isExpired"
                        [class.text-amber-300]="calc.isUrgent && !calc.isExpired"
                        [class.bg-rose-500/20]="calc.isExpired"
                        [class.text-rose-300]="calc.isExpired">
                    @if (calc.isExpired) {
                      TERMIN UCHYBIONY ({{ Math.abs(calc.daysRemaining) }} dni temu)
                    } @else if (calc.daysRemaining === 0) {
                      DZISIAJ JEST OSTATNI DZIEŃ!
                    } @else {
                      POZOSTAŁO: {{ calc.daysRemaining }} DNI
                    }
                  </span>
                </div>
              </div>

              <!-- Informacja o przedłużeniu art. 123 § 3 k.p.k. -->
              @if (calc.isExtendedByWeekendOrHoliday) {
                <div class="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                  <mat-icon class="text-base text-amber-400 shrink-0 mt-0.5">event_available</mat-icon>
                  <div>
                    <strong>Zastosowano art. 123 § 3 k.p.k. (Przesunięcie terminu):</strong><br>
                    Pierwotny termin upływał {{ calc.rawEndDate }}. Z uwagi na to, że wypadł w sobotę, niedzielę lub święto ustawowo wolne, termin uległ wydłużeniu do najbliższego dnia roboczego (<strong>{{ calc.adjustedEndDate }}</strong>).
                  </div>
                </div>
              }

              <!-- Skutki i wskazówki nadania -->
              <div class="mt-4 space-y-2">
                <div class="text-xs text-slate-300">
                  <span class="font-semibold text-slate-200">Podstawa prawna:</span> {{ calc.deadlineType.basisArticle }}
                  @if (calc.deadlineType.isFatalDeadline) {
                    <span class="ml-2 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-[10px]">
                      TERMIN ZAWITY
                    </span>
                  }
                </div>
                <p class="text-xs text-slate-400">
                  <span class="font-medium text-slate-300">Skutki uchybienia:</span> {{ calc.deadlineType.consequences }}
                </p>
                <div class="pt-2 border-t border-slate-800 space-y-1">
                  @for (tip of calc.dispatchTips; track tip) {
                    <div class="text-[11px] text-slate-400 flex items-start gap-1.5">
                      <mat-icon class="text-xs text-amber-400 shrink-0 mt-0.5">verified</mat-icon>
                      <span>{{ tip }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Szybkie akcje -->
              <div class="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-800">
                <button (click)="copyCalculation()"
                        class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors">
                  <mat-icon class="text-sm">content_copy</mat-icon>
                  {{ copySuccess() ? 'Skopiowano do schowka!' : 'Kopiuj kalkulację do schowka' }}
                </button>
              </div>

            </div>
          }

        </div>

        <!-- Stopka -->
        <div class="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <span>Kalkulator uwzględnia kalendarz świąt RP oraz regułę Poczty Polskiej (art. 124 k.p.k.).</span>
          <button (click)="close.emit()"
                  class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors">
            Zamknij
          </button>
        </div>

      </div>
    </div>
  `,
})
export class ProceduralDeadlinesModalComponent {
  private deadlinesService = inject(ProceduralDeadlinesService);

  readonly close = output<void>();

  readonly deadlineTypes = this.deadlinesService.deadlineTypes;
  readonly selectedTypeId = signal<string>('uzasadnienie_wyroku');
  readonly eventDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly customDays = signal<number>(7);
  readonly copySuccess = signal<boolean>(false);

  readonly calculation = signal<DeadlineCalculationResult | null>(null);

  protected readonly Math = Math;

  constructor() {
    this.recalculate();
  }

  onTypeChange(newId: string): void {
    this.selectedTypeId.set(newId);
    const type = this.deadlineTypes.find((t) => t.id === newId);
    if (type) {
      this.customDays.set(type.defaultDays);
    }
    this.recalculate();
  }

  onDateChange(newDate: string): void {
    this.eventDate.set(newDate);
    this.recalculate();
  }

  onDaysChange(newDays: number): void {
    this.customDays.set(newDays);
    this.recalculate();
  }

  recalculate(): void {
    const res = this.deadlinesService.calculateDeadline(
      this.selectedTypeId(),
      this.eventDate(),
      this.customDays()
    );
    this.calculation.set(res);
  }

  copyCalculation(): void {
    const calc = this.calculation();
    if (!calc) return;

    const text = `KALKULACJA TERMINU PROCESOWEGO (k.p.k.):
Czynność: ${calc.deadlineType.name} (${calc.deadlineType.basisArticle})
Data początkowa (zdarzenie/doręczenie): ${calc.startDate}
Długość terminu: ${this.customDays()} dni
Ostateczny termin złożenia: ${calc.adjustedEndDate} ${calc.isExtendedByWeekendOrHoliday ? `(przesunięto z ${calc.rawEndDate} na mocy art. 123 § 3 k.p.k.)` : ''}
Status: ${calc.isExpired ? 'TERMIN UCHYBIONY!' : `Pozostało: ${calc.daysRemaining} dni`}
Zasada zachowania terminu: Nadanie w placówce Poczty Polskiej (art. 124 k.p.k.)`;

    navigator.clipboard?.writeText(text).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2500);
    });
  }

  onBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) {
      this.close.emit();
    }
  }
}
