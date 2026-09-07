import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PenalArticle } from '../models/legal.model';
import { PenaltyCalculatorService, DirectiveWeights, DirectiveCalculationResult } from '../services/penalty-calculator.service';

@Component({
  selector: 'app-penalty-directives-panel',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-gradient-to-br from-slate-900/95 via-slate-950 to-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      <!-- Akcent nagłówka -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <mat-icon class="text-lg">tune</mat-icon>
            </span>
            <h3 class="text-base sm:text-lg font-bold text-white tracking-wide">
              Symulator Dyrektyw Wymiaru Kary (Art. 53 k.k. & Art. 60 k.k.)
            </h3>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Dostosuj okoliczności czynu i postawę sprawcy, aby automatycznie obliczyć realne zagrożenie i przesłanki złagodzenia kary.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 border border-slate-700">
            Art. {{ article().number }}{{ article().suffix || '' }} {{ article().codePrefix || 'k.k.' }}
          </span>
        </div>
      </div>

      <!-- Siatka przełączników dyrektyw (Okoliczności łagodzące i obciążające) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <!-- 1. Stopień winy -->
        <div class="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Stopień winy (art. 53 § 1 k.k.)
          </label>
          <div class="grid grid-cols-2 gap-1 text-xs">
            @for (level of guiltLevels; track level) {
              <button
                type="button"
                (click)="setGuiltDegree(level)"
                [class]="directives().guiltDegree === level
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'"
                class="py-1 px-1.5 rounded text-center capitalize cursor-pointer transition-colors text-[11px]"
              >
                {{ level }}
              </button>
            }
          </div>
        </div>

        <!-- 2. Stopień społecznej szkodliwości -->
        <div class="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
          <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Społeczna szkodliwość (art. 115 § 2)
          </label>
          <div class="grid grid-cols-2 gap-1 text-xs">
            @for (level of harmLevels; track level) {
              <button
                type="button"
                (click)="setSocialHarm(level)"
                [class]="directives().socialHarm === level
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'"
                class="py-1 px-1.5 rounded text-center capitalize cursor-pointer transition-colors text-[11px]"
              >
                {{ level }}
              </button>
            }
          </div>
        </div>

        <!-- 3. Pojednanie i naprawienie szkody -->
        <div class="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Naprawienie szkody & Ugoda
          </span>
          <button
            type="button"
            (click)="toggleReconciliation()"
            [class]="directives().reconciliationWithVictim
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'"
            class="w-full py-2 px-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all"
          >
            <span class="flex items-center gap-1.5">
              <mat-icon class="text-sm">{{ directives().reconciliationWithVictim ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              <span>Ugoda z pokrzywdzonym</span>
            </span>
            <span class="text-[10px] font-mono">{{ directives().reconciliationWithVictim ? 'TAK' : 'NIE' }}</span>
          </button>
        </div>

        <!-- 4. Uprzednia karalność / Czysta kartoteka -->
        <div class="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Dotychczasowa karalność (KRK)
          </span>
          <button
            type="button"
            (click)="togglePriorConvictions()"
            [class]="directives().priorConvictions
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'"
            class="w-full py-2 px-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all"
          >
            <span class="flex items-center gap-1.5">
              <mat-icon class="text-sm">{{ directives().priorConvictions ? 'warning' : 'verified' }}</mat-icon>
              <span>{{ directives().priorConvictions ? 'Uprzednio karany' : 'Czysta kartoteka' }}</span>
            </span>
            <span class="text-[10px] font-mono">{{ directives().priorConvictions ? 'RECYDYWA' : 'CZYSTY' }}</span>
          </button>
        </div>
      </div>

      <!-- Dodatkowe przełączniki (Młodociany sprawca, przyznanie się) -->
      <div class="flex items-center gap-2 flex-wrap mb-5">
        <button
          type="button"
          (click)="toggleYouthfulOffender()"
          [class]="directives().youthfulOffender
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
          class="px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <mat-icon class="text-sm text-amber-400">{{ directives().youthfulOffender ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
          <span>Sprawca młodociany (do 21/24 lat – art. 54 k.k.)</span>
        </button>

        <button
          type="button"
          (click)="toggleVoluntaryDisclosure()"
          [class]="directives().voluntaryDisclosure
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
          class="px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <mat-icon class="text-sm text-amber-400">{{ directives().voluntaryDisclosure ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
          <span>Przyznanie się do winy i współpraca procesowa</span>
        </button>
      </div>

      <!-- Wyniki kalkulacji dyrektyw i Art. 60 k.k. -->
      @if (result(); as res) {
        <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          <!-- Główne podsumowanie symulacji -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                Widełki podstawowe (ustawowe):
              </span>
              <p class="text-sm font-bold text-slate-200 font-mono">
                {{ res.suggestedPenaltyRange.summary }}
              </p>
            </div>

            <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                Rekomendowana forma orzeczenia:
              </span>
              <p class="text-sm font-bold text-amber-300 capitalize">
                {{ formatForm(res.recommendedForm) }}
              </p>
            </div>

            <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                Warunkowe zawieszenie (art. 69 k.k.):
              </span>
              <p class="text-sm font-bold flex items-center gap-1.5" [class]="res.isSuspensionPossible ? 'text-emerald-400' : 'text-rose-400'">
                <mat-icon class="text-base">{{ res.isSuspensionPossible ? 'check_circle' : 'cancel' }}</mat-icon>
                <span>{{ res.isSuspensionPossible ? 'Dopuszczalne prawnie' : 'Wykluczone (kara > 1r lub recydywa)' }}</span>
              </p>
            </div>
          </div>

          <!-- Moduł Nadzwyczajnego Złagodzenia Kary (Art. 60 § 6 k.k.) -->
          <div class="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-emerald-950/20 border border-emerald-500/30 rounded-lg p-3.5">
            <div class="flex items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-1.5 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <mat-icon class="text-sm">balance</mat-icon>
                <span>Nadzwyczajne Złagodzenie Kary (Art. 60 § 6 k.k.):</span>
              </div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {{ res.art60Mitigation.legalBasis }}
              </span>
            </div>

            <p class="text-sm font-bold text-emerald-200 mb-2 font-mono">
              {{ res.art60Mitigation.mitigatedRange }}
            </p>

            <p class="text-xs text-slate-300 leading-relaxed mb-3">
              <strong class="text-emerald-300">Reguła ustawowa:</strong> {{ res.art60Mitigation.statutoryRulesSummary }}
            </p>

            @if (res.justificationNotes.length > 0) {
              <div class="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span class="text-[11px] font-semibold text-slate-300 block">Kluczowe argumenty do wniosku obrońcy:</span>
                @for (note of res.justificationNotes; track note) {
                  <div class="flex items-start gap-1.5 text-slate-300">
                    <mat-icon class="text-xs text-amber-400 mt-0.5 shrink-0">arrow_right</mat-icon>
                    <span>{{ note }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class PenaltyDirectivesPanel {
  private readonly penaltyCalc = inject(PenaltyCalculatorService);

  readonly article = input.required<PenalArticle>();

  readonly guiltLevels = ['znikomy', 'nieznaczny', 'średni', 'znaczny'] as const;
  readonly harmLevels = ['znikoma', 'nieznaczna', 'średnia', 'znaczna'] as const;

  readonly directives = signal<DirectiveWeights>({
    guiltDegree: 'średni',
    socialHarm: 'średnia',
    preventiveGoalIndividual: true,
    preventiveGoalGeneral: false,
    reconciliationWithVictim: true,
    voluntaryDisclosure: true,
    priorConvictions: false,
    youthfulOffender: false,
  });

  readonly result = computed<DirectiveCalculationResult>(() => {
    return this.penaltyCalc.calculateDirectives(this.article(), this.directives());
  });

  setGuiltDegree(level: DirectiveWeights['guiltDegree']): void {
    this.directives.update((d) => ({ ...d, guiltDegree: level }));
  }

  setSocialHarm(level: DirectiveWeights['socialHarm']): void {
    this.directives.update((d) => ({ ...d, socialHarm: level }));
  }

  toggleReconciliation(): void {
    this.directives.update((d) => ({ ...d, reconciliationWithVictim: !d.reconciliationWithVictim }));
  }

  togglePriorConvictions(): void {
    this.directives.update((d) => ({ ...d, priorConvictions: !d.priorConvictions }));
  }

  toggleYouthfulOffender(): void {
    this.directives.update((d) => ({ ...d, youthfulOffender: !d.youthfulOffender }));
  }

  toggleVoluntaryDisclosure(): void {
    this.directives.update((d) => ({ ...d, voluntaryDisclosure: !d.voluntaryDisclosure }));
  }

  formatForm(form: DirectiveCalculationResult['recommendedForm']): string {
    switch (form) {
      case 'grzywna':
        return 'Kara grzywny (art. 33 k.k.)';
      case 'ograniczenie_wolnosci':
        return 'Ograniczenie wolności (prace społeczne)';
      case 'kara_mieszana':
        return 'Kara sekwencyjna / mieszana (art. 37b k.k.)';
      case 'pozbawienie_wolnosci':
        return 'Pozbawienie wolności';
      default:
        return form;
    }
  }
}
