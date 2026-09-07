import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LegalDataService } from '../services/legal-data.service';
import { PenalArticle } from '../models/legal.model';

@Component({
  selector: 'app-legal-alerts',
  imports: [CommonModule, MatIconModule],
  template: `
    <section id="section-alerts" class="space-y-6">
      <!-- Pasek Tytułowy Modułu Nowelizacji -->
      <div class="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-400/50 to-amber-500/0"></div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                Kalendarium & Komparator Reform
              </span>
              <span class="text-xs text-slate-400">Kodeks Karny 2023–2026</span>
            </div>
            <h2 class="text-lg md:text-xl font-serif font-bold text-white flex items-center gap-2">
              <mat-icon class="text-amber-400">published_with_changes</mat-icon>
              Komparator Nowelizacji i Oś Czasu Reform Karnych
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              (click)="activeView.set('timeline')"
              [class]="activeView() === 'timeline'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
              class="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all active:scale-[0.98]"
            >
              <mat-icon class="text-xs mr-1">timeline</mat-icon>
              Oś Czasu Reform
            </button>
            <button
              (click)="activeView.set('comparator')"
              [class]="activeView() === 'comparator'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
              class="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all active:scale-[0.98]"
            >
              <mat-icon class="text-xs mr-1">compare_arrows</mat-icon>
              Komparator Side-by-Side
            </button>
          </div>
        </div>

        <!-- Opis zasady stosowania prawa względniejszego -->
        <div class="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center gap-2 text-xs text-slate-300">
          <mat-icon class="text-amber-400 text-base shrink-0">balance</mat-icon>
          <span>
            <strong>Zasada intertemporalna (art. 4 § 1 k.k.):</strong> Jeżeli w czasie orzekania obowiązuje ustawa inna niż w czasie popełnienia przestępstwa, stosuje się ustawę nową, chyba że ustawa obowiązująca poprzednio była względniejsza dla sprawcy.
          </span>
        </div>
      </div>

      <!-- ================= WIDOK 1: OŚ CZASU REFORM (16:9 / 21:9 WIDESCREEN) ================= -->
      @if (activeView() === 'timeline') {
        <div class="space-y-4">
          <!-- Horyzontalna oś kroków reform (desktop widescreen banner) -->
          <div class="hidden lg:block bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <mat-icon class="text-sm">view_timeline</mat-icon>
              Chronologiczna Sekwencja Reform Prawa Karnego w Polsce
            </h3>

            <div class="grid grid-cols-4 gap-3 relative">
              @for (alert of legalData.legalAlerts(); track alert.id; let i = $index) {
                <div
                  role="button"
                  tabindex="0"
                  (click)="selectedAlertId.set(alert.id)"
                  [class]="selectedAlertId() === alert.id
                    ? 'bg-slate-800 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'"
                  class="p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between"
                >
                  <div class="flex items-center justify-between gap-1 mb-2">
                    <span class="font-mono text-xs font-bold text-amber-400">
                      {{ alert.date }}
                    </span>
                    <span
                      [class]="alert.severity === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'"
                      class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                    >
                      Krok {{ i + 1 }}
                    </span>
                  </div>

                  <h4 class="text-xs font-bold text-slate-200 line-clamp-2 mb-2">
                    {{ alert.title }}
                  </h4>

                  <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {{ alert.summary }}
                  </p>
                </div>
              }
            </div>
          </div>

          <!-- Rozwinięcie szczegółowe wybranej reformy lub lista mobilna -->
          <div class="space-y-4">
            @for (alert of legalData.legalAlerts(); track alert.id) {
              <div
                [class]="selectedAlertId() === alert.id ? 'ring-1 ring-amber-500/40 bg-slate-900' : 'bg-slate-900/80'"
                class="border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all"
              >
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
                    <span class="text-xs text-amber-300 font-mono font-bold">Wejście w życie: {{ alert.date }}</span>
                  </div>

                  <div class="flex items-center gap-1.5 flex-wrap">
                    @for (artRef of alert.affectedArticles; track artRef) {
                      <span class="text-xs bg-slate-950 text-amber-400 px-2.5 py-0.5 rounded border border-slate-800 font-mono">
                        {{ artRef }}
                      </span>
                    }
                  </div>
                </div>

                <h3 class="text-base font-serif font-bold text-white mb-2">
                  {{ alert.title }}
                </h3>

                <p class="text-sm text-slate-300 mb-4 leading-relaxed font-sans">
                  {{ alert.fullDescription }}
                </p>

                <!-- Wpływ na linię obrony w kancelarii -->
                <div class="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4">
                  <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <mat-icon class="text-xs">gavel</mat-icon> Praktyczne znaczenie dla kancelarii i linii obrony:
                  </span>
                  <p class="text-xs text-slate-300 leading-relaxed font-sans">
                    {{ alert.practicalImpact }}
                  </p>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ================= WIDOK 2: KOMPARATOR SIDE-BY-SIDE (RETRO-AMBER / EMERALD) ================= -->
      @if (activeView() === 'comparator') {
        <div class="space-y-6">
          <!-- Wybór artykułu do porównania -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div class="flex items-center gap-2">
              <mat-icon class="text-amber-400 text-sm">compare</mat-icon>
              <span class="text-xs font-semibold text-slate-300">Wybierz przepis ze znowelizowaną treścią:</span>
            </div>
            <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              @for (art of amendedArticles(); track art.id) {
                <button
                  (click)="selectedArticleId.set(art.id)"
                  [class]="selectedArticleId() === art.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'"
                  class="px-3 py-1.5 rounded-xl border text-xs font-mono whitespace-nowrap cursor-pointer transition-all active:scale-[0.98]"
                >
                  Art. {{ art.number }}{{ art.suffix || '' }} k.k.
                </button>
              }
            </div>
          </div>

          <!-- Karty Porównania Side-by-Side -->
          @if (currentAmendedArticle(); as art) {
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div class="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Art. {{ art.number }}{{ art.suffix || '' }} k.k.
                    </span>
                    <span class="text-xs text-slate-400">{{ art.chapter }}</span>
                  </div>
                  <h3 class="text-base font-serif font-bold text-white">{{ art.title }}</h3>
                </div>

                @if (art.recentAmendment; as am) {
                  <span class="text-xs font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-xl self-start sm:self-auto">
                    Data wejścia w życie: <strong>{{ am.date }}</strong>
                  </span>
                }
              </div>

              <!-- Podsumowanie reformy -->
              @if (art.recentAmendment; as am) {
                <div class="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
                  <span class="font-bold text-amber-400 block uppercase text-[10px]">Istota nowelizacji:</span>
                  <p class="leading-relaxed">{{ am.description }}</p>
                  @if (am.amendmentSummary) {
                    <p class="text-amber-200/90 pt-1 border-t border-slate-800/80">
                      <strong>Wpływ procesowy:</strong> {{ am.amendmentSummary }}
                    </p>
                  }
                </div>
              }

              <!-- Porównanie Side-by-Side (Retro-Amber archiwalny vs Szmaragdowy obowiązujący) -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <!-- Lewa kolumna: Stan archiwalny (Retro-Amber) -->
                <div class="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 flex flex-col shadow-inner">
                  <div class="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-3">
                    <div class="flex items-center gap-2">
                      <mat-icon class="text-sm text-amber-400">history</mat-icon>
                      <span class="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Stan Prawny Przed Reformą
                      </span>
                    </div>
                    <span class="text-[10px] font-mono text-slate-500 uppercase">Wersja archiwalna</span>
                  </div>

                  <div class="text-xs text-amber-100/80 font-serif leading-relaxed whitespace-pre-line flex-1 bg-amber-950/15 p-4 rounded-xl border border-amber-500/10">
                    {{ art.recentAmendment?.previousContent || 'Brak danych archiwalnych w bazie.' }}
                  </div>
                </div>

                <!-- Prawa kolumna: Stan aktualny (Dostojny Szmaragd / Emerald) -->
                <div class="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 flex flex-col shadow-inner">
                  <div class="flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-3">
                    <div class="flex items-center gap-2">
                      <mat-icon class="text-sm text-emerald-400">verified</mat-icon>
                      <span class="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                        Aktualne Brzmienie Obowiązujące
                      </span>
                    </div>
                    <span class="text-[10px] font-mono text-emerald-400/80 font-bold uppercase">Stan Dziś w Sądzie</span>
                  </div>

                  <div class="text-xs text-emerald-100 font-serif leading-relaxed whitespace-pre-line flex-1 bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20">
                    {{ art.content }}
                  </div>
                </div>
              </div>

              <!-- Podsumowanie ustawowego zagrożenia karą -->
              <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                <span class="text-slate-400">Aktualne sankcje: <strong class="text-white">{{ art.penalties.summary }}</strong></span>
                <span class="text-amber-400 font-mono">{{ art.isFelony ? 'Zbrodnia' : 'Występek' }}</span>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalAlerts {
  readonly legalData = inject(LegalDataService);

  readonly activeView = signal<'timeline' | 'comparator'>('timeline');
  readonly selectedAlertId = signal<string>('alert-konfiskata-2024');
  readonly selectedArticleId = signal<string>('art-178a');

  readonly amendedArticles = computed(() => {
    return this.legalData.articles().filter((a) => !!a.recentAmendment);
  });

  readonly currentAmendedArticle = computed(() => {
    const list = this.amendedArticles();
    const found = list.find((a) => a.id === this.selectedArticleId());
    return found || list[0] || null;
  });
}
