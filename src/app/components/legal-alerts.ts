import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LegalDataService } from '../services/legal-data.service';

@Component({
  selector: 'app-legal-alerts',
  imports: [CommonModule, MatIconModule],
  template: `
    <section id="section-alerts" class="space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h2 class="text-lg font-bold text-white flex items-center gap-2 mb-1">
          <mat-icon class="text-red-400">notifications_active</mat-icon>
          System Powiadomień i Alerty o Zmianach w Kodeksie Karnym
        </h2>
        <p class="text-xs md:text-sm text-slate-400">
          Monitoruj najnowsze reformy prawa karnego, zaostrzenia sankcji oraz kluczowe wytyczne dla obrońców w sprawach karnych.
        </p>
      </div>

      <div class="space-y-4">
        @for (alert of legalData.legalAlerts(); track alert.id) {
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
              <div class="flex items-center gap-3">
                <span
                  [class]="alert.severity === 'high'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'"
                  class="text-xs px-2.5 py-1 rounded-lg border font-bold uppercase tracking-wider"
                >
                  {{ alert.severity === 'high' ? 'Wysoki Priorytet' : 'Zmiana Przepisów' }}
                </span>
                <span class="text-xs text-slate-400 font-mono">Wejście w życie: {{ alert.date }}</span>
              </div>

              <div class="flex items-center gap-1.5 flex-wrap">
                @for (artRef of alert.affectedArticles; track artRef) {
                  <span class="text-xs bg-slate-950 text-amber-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                    {{ artRef }}
                  </span>
                }
              </div>
            </div>

            <h3 class="text-base font-bold text-white mb-2">
              {{ alert.title }}
            </h3>

            <p class="text-sm text-slate-300 mb-4 leading-relaxed font-sans">
              {{ alert.fullDescription }}
            </p>

            <!-- Wpływ na linię obrony w kancelarii -->
            <div class="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Praktyczne znaczenie dla kancelarii i linii obrony:
              </span>
              <p class="text-xs text-slate-300 leading-relaxed font-sans">
                {{ alert.practicalImpact }}
              </p>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalAlerts {
  readonly legalData = inject(LegalDataService);
}
