import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardWidgetsService } from '../services/dashboard-widgets.service';
import { LegalDataService } from './../services/legal-data.service';
import { DashboardWidgetConfig, PenalArticle } from '../models/legal.model';

@Component({
  selector: 'app-dashboard-widget-grid',
  imports: [CommonModule, MatIconModule],
  template: `
    <div id="dashboard-widget-system" class="space-y-4 mb-6">
      <!-- Pasek Sterowania Pulpitem (Header & Customize Bar) -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <mat-icon class="text-xl">dashboard_customize</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-white tracking-wide">
                Pulpit Kancelaryjny & Przypięte Moduły
              </h2>
              <span class="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                Układ: {{ widgetsService.preferences().columns }} kol.
              </span>
            </div>
            <p class="text-xs text-slate-400">
              Personalizowany widok roboczy: przypięte artykuły k.k., aktywne sprawy oraz historia zapytań.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          <!-- Wybór kolumn siatki -->
          <div class="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1 text-xs">
            <button
              type="button"
              (click)="widgetsService.setColumns(1)"
              [class]="widgetsService.preferences().columns === 1 ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'"
              class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              title="1 kolumna (układ zwarty)"
            >
              1
            </button>
            <button
              type="button"
              (click)="widgetsService.setColumns(2)"
              [class]="widgetsService.preferences().columns === 2 ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'"
              class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              title="2 kolumny (układ standardowy)"
            >
              2
            </button>
            <button
              type="button"
              (click)="widgetsService.setColumns(3)"
              [class]="widgetsService.preferences().columns === 3 ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'"
              class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              title="3 kolumny (układ panoramiczny)"
            >
              3
            </button>
          </div>

          <!-- Przycisk konfiguracji siatki -->
          <button
            id="btn-toggle-customize-dashboard"
            type="button"
            (click)="widgetsService.toggleCustomizing()"
            [class]="widgetsService.isCustomizing() ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <mat-icon class="text-sm">tune</mat-icon>
            <span>{{ widgetsService.isCustomizing() ? 'Zakończ Edycję' : 'Dostosuj Pulpit' }}</span>
          </button>
        </div>
      </div>

      <!-- Panel Konfiguracji Widżetów (Widoczny w trybie edycji) -->
      @if (widgetsService.isCustomizing()) {
        <div class="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-4 sm:p-5 text-xs text-slate-200 space-y-3 animate-fade-in">
          <div class="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-2">
            <div class="flex items-center gap-2 font-bold text-amber-300">
              <mat-icon class="text-sm">settings</mat-icon>
              <span>Ustawienia widoczności i układu widżetów</span>
            </div>
            <button
              type="button"
              (click)="widgetsService.resetLayout()"
              class="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <mat-icon class="text-xs">restart_alt</mat-icon>
              <span>Przywróć domyślny układ</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            @for (widget of widgetsService.preferences().widgets; track widget.id) {
              <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-sm text-amber-400">{{ widget.icon }}</mat-icon>
                  <span class="font-medium text-slate-200">{{ widget.title }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="widgetsService.toggleWidgetVisibility(widget.id)"
                    [class]="widget.visible ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'"
                    class="p-1 rounded-md text-xs cursor-pointer"
                    [title]="widget.visible ? 'Ukryj widżet' : 'Pokaż widżet'"
                  >
                    <mat-icon class="text-sm">{{ widget.visible ? 'visibility' : 'visibility_off' }}</mat-icon>
                  </button>
                  <button
                    type="button"
                    (click)="widgetsService.moveWidget(widget.id, 'up')"
                    class="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                    title="Przesuń w lewo / w górę"
                  >
                    <mat-icon class="text-sm">arrow_upward</mat-icon>
                  </button>
                  <button
                    type="button"
                    (click)="widgetsService.moveWidget(widget.id, 'down')"
                    class="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                    title="Przesuń w prawo / w dół"
                  >
                    <mat-icon class="text-sm">arrow_downward</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Dynamiczna Siatka Widżetów (Widget Grid System) -->
      <div
        class="grid gap-4 transition-all duration-300"
        [class]="getGridColsClass()"
      >
        @for (widget of visibleWidgets(); track widget.id) {
          <div
            [id]="'widget-' + widget.id"
            class="bg-slate-900/85 border border-slate-800/90 rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all duration-200 hover:border-slate-700/90"
            [class.col-span-full]="widget.colSpan === 2 && widgetsService.preferences().columns > 1"
          >
            <!-- Pasek Nagłówka Widżetu -->
            <div class="px-4 py-3.5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <mat-icon class="text-amber-400 text-lg">{{ widget.icon }}</mat-icon>
                <h3 class="text-xs sm:text-sm font-bold text-slate-100 tracking-wide">
                  {{ widget.title }}
                </h3>
                @if (widget.id === 'pinned-articles') {
                  <span class="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.2 rounded-full font-mono">
                    {{ widgetsService.pinnedArticleIds().length }}
                  </span>
                }
                @if (widget.id === 'active-cases') {
                  <span class="text-[10px] bg-blue-500/15 border border-blue-500/30 text-blue-300 px-2 py-0.2 rounded-full font-mono">
                    {{ widgetsService.activeCases().length }}
                  </span>
                }
                @if (widget.id === 'recent-searches') {
                  <span class="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.2 rounded-full font-mono">
                    {{ widgetsService.recentSearches().length }}
                  </span>
                }
              </div>

              <!-- Narzędzia karty widżetu (zwijanie, przestawianie) -->
              <div class="flex items-center gap-1">
                @if (widget.id === 'active-cases') {
                  <button
                    type="button"
                    (click)="toggleAddCaseModal()"
                    class="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                    title="Dodaj nową sprawę"
                  >
                    <mat-icon class="text-xs">add</mat-icon>
                    <span class="hidden sm:inline">Nowa</span>
                  </button>
                }

                @if (widget.id === 'recent-searches') {
                  <button
                    type="button"
                    (click)="widgetsService.clearRecentSearches()"
                    class="text-slate-400 hover:text-red-300 text-[11px] p-1 rounded hover:bg-slate-800 cursor-pointer"
                    title="Wyczyść nieprzypięte wyszukiwania"
                  >
                    <mat-icon class="text-xs">delete_sweep</mat-icon>
                  </button>
                }

                <button
                  type="button"
                  (click)="widgetsService.toggleWidgetCollapse(widget.id)"
                  class="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
                  [title]="widget.collapsed ? 'Rozwiń widżet' : 'Zwiń widżet'"
                >
                  <mat-icon class="text-sm">{{ widget.collapsed ? 'expand_more' : 'expand_less' }}</mat-icon>
                </button>
              </div>
            </div>

            <!-- Treść Widżetu (Rozwijana) -->
            @if (!widget.collapsed) {
              <div class="p-4 flex-1 overflow-y-auto max-h-[380px] space-y-2.5">
                <!-- ================= WIDŻET 1: PRZYPIĘTE ARTYKUŁY ================= -->
                @if (widget.id === 'pinned-articles') {
                  @if (widgetsService.getPinnedArticles().length === 0) {
                    <div class="text-center py-6 text-slate-400 space-y-2 text-xs">
                      <mat-icon class="text-2xl text-slate-600">bookmark_border</mat-icon>
                      <p>Brak przypiętych artykułów. Przypnij kluczowe przepisy k.k. za pomocą poniższego selektora.</p>
                    </div>
                  } @else {
                    <div class="space-y-2">
                      @for (art of widgetsService.getPinnedArticles(); track art.id) {
                        <div class="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div class="space-y-1">
                            <div class="flex items-center gap-2 flex-wrap">
                              <span class="font-mono font-bold text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                Art. {{ art.number }}{{ art.suffix || '' }} {{ art.codePrefix || 'k.k.' }}
                              </span>
                              @if (art.isFelony) {
                                <span class="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/30">
                                  Zbrodnia
                                </span>
                              }
                              <span class="text-xs font-semibold text-slate-200">
                                {{ art.title }}
                              </span>
                            </div>
                            <p class="text-[11px] text-slate-400 line-clamp-1">
                              {{ art.plainSummary }}
                            </p>
                            <div class="flex items-center gap-2 text-[10px] text-emerald-400">
                              <mat-icon class="text-[12px]">gavel</mat-icon>
                              <span>{{ art.penalties.summary }}</span>
                            </div>
                          </div>

                          <div class="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
                            <button
                              type="button"
                              (click)="analyzeInCalculator(art)"
                              class="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                              title="Przeanalizuj w kalkulatorze"
                            >
                              <mat-icon class="text-xs">gavel</mat-icon>
                              <span>Kalkulator</span>
                            </button>
                            <button
                              type="button"
                              (click)="openArticleInCode.emit(art.id)"
                              class="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
                              title="Otwórz pełny artykuł w Kodeksie Karnym"
                            >
                              <mat-icon class="text-xs">menu_book</mat-icon>
                            </button>
                            <button
                              type="button"
                              (click)="widgetsService.togglePinArticle(art.id)"
                              class="p-1.5 text-amber-400 hover:text-red-400 rounded-lg text-xs transition-colors cursor-pointer"
                              title="Odepnij z pulpitu"
                            >
                              <mat-icon class="text-xs">bookmark_remove</mat-icon>
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }

                  <!-- Szybkie dodawanie artykułów do przypiętych -->
                  <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                    <span class="text-slate-500">Dodaj do przypiętych:</span>
                    <div class="flex items-center gap-1 flex-wrap">
                      @for (sug of suggestedArticles; track sug.id) {
                        @if (!widgetsService.isArticlePinned(sug.id)) {
                          <button
                            type="button"
                            (click)="widgetsService.togglePinArticle(sug.id)"
                            class="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 cursor-pointer transition-colors"
                          >
                            + Art. {{ sug.label }}
                          </button>
                        }
                      }
                    </div>
                  </div>
                }

                <!-- ================= WIDŻET 2: AKTYWNE SPRAWY ================= -->
                @if (widget.id === 'active-cases') {
                  @if (isAddingCase()) {
                    <!-- Formularz dodawania sprawy -->
                    <div class="bg-slate-950 border border-amber-500/40 rounded-xl p-3 space-y-2 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-amber-300">Rejestracja Nowej Sprawy</span>
                        <button type="button" (click)="isAddingCase.set(false)" class="text-slate-400 hover:text-white">
                          <mat-icon class="text-xs">close</mat-icon>
                        </button>
                      </div>
                      <input
                        #titleInput
                        type="text"
                        placeholder="Tytuł sprawy / Zarzut..."
                        class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 placeholder-slate-500"
                      />
                      <div class="grid grid-cols-2 gap-2">
                        <input
                          #clientInput
                          type="text"
                          placeholder="Klient (np. Jan Kowalski)"
                          class="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 placeholder-slate-500"
                        />
                        <input
                          #numInput
                          type="text"
                          placeholder="Sygn. akt (np. II K 45/24)"
                          class="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 placeholder-slate-500"
                        />
                      </div>
                      <textarea
                        #descInput
                        rows="2"
                        placeholder="Krótki stan faktyczny / przyjęta linia obrony..."
                        class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 placeholder-slate-500"
                      ></textarea>
                      <div class="flex justify-end gap-2">
                        <button
                          type="button"
                          (click)="isAddingCase.set(false)"
                          class="px-2.5 py-1 text-slate-400 hover:text-white cursor-pointer"
                        >
                          Anuluj
                        </button>
                        <button
                          type="button"
                          (click)="saveNewCase(titleInput.value, clientInput.value, numInput.value, descInput.value)"
                          class="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded cursor-pointer"
                        >
                          Zapisz Sprawę
                        </button>
                      </div>
                    </div>
                  }

                  @if (widgetsService.activeCases().length === 0) {
                    <div class="text-center py-6 text-slate-400 space-y-2 text-xs">
                      <mat-icon class="text-2xl text-slate-600">folder_open</mat-icon>
                      <p>Brak aktywnych spraw. Kliknij „Nowa”, aby zarejestrować sprawę klienta.</p>
                    </div>
                  } @else {
                    <div class="space-y-2">
                      @for (c of widgetsService.activeCases(); track c.id) {
                        <div class="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition-all space-y-2">
                          <div class="flex items-start justify-between gap-2">
                            <div>
                              <div class="flex items-center gap-2">
                                <span class="font-bold text-xs text-white">{{ c.title }}</span>
                                @if (c.caseNumber) {
                                  <span class="text-[10px] font-mono bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded border border-slate-700">
                                    {{ c.caseNumber }}
                                  </span>
                                }
                              </div>
                              <span class="text-[11px] text-slate-400">{{ c.clientName }}</span>
                            </div>
                            <span
                              [class]="c.priority === 'pilne'
                                ? 'bg-red-950/80 text-red-300 border-red-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'"
                              class="text-[10px] uppercase font-bold px-2 py-0.5 rounded border"
                            >
                              {{ c.priority }}
                            </span>
                          </div>

                          <p class="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                            {{ c.summary }}
                          </p>

                          <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
                            <span class="text-slate-400 italic">Etap: {{ c.stage }}</span>
                            <div class="flex items-center gap-1.5">
                              @if (c.linkedArticleRef) {
                                <button
                                  type="button"
                                  (click)="openInCalculator.emit(c.linkedArticleRef)"
                                  class="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                                >
                                  {{ c.linkedArticleRef }}
                                </button>
                              }
                              <button
                                type="button"
                                (click)="widgetsService.deleteActiveCase(c.id)"
                                class="text-slate-500 hover:text-red-400 p-0.5 cursor-pointer"
                                title="Usuń sprawę"
                              >
                                <mat-icon class="text-xs">delete</mat-icon>
                              </button>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                }

                <!-- ================= WIDŻET 3: OSTATNIE WYSZUKIWANIA ================= -->
                @if (widget.id === 'recent-searches') {
                  @if (widgetsService.recentSearches().length === 0) {
                    <div class="text-center py-6 text-slate-400 space-y-2 text-xs">
                      <mat-icon class="text-2xl text-slate-600">history_toggle_off</mat-icon>
                      <p>Brak ostatnich wyszukiwań. Wpisz zdarzenie w kalkulatorze, aby zapisać historię.</p>
                    </div>
                  } @else {
                    <div class="space-y-1.5">
                      @for (s of widgetsService.recentSearches(); track s.id) {
                        <div class="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 hover:border-slate-700 transition-all flex items-center justify-between gap-2">
                          <button
                            type="button"
                            (click)="openInCalculator.emit(s.query)"
                            class="text-left flex-1 space-y-0.5 cursor-pointer group"
                          >
                            <div class="flex items-center gap-2">
                              @if (s.isPinned) {
                                <mat-icon class="text-[12px] text-amber-400">push_pin</mat-icon>
                              }
                              <span class="text-xs font-medium text-slate-200 group-hover:text-amber-300 transition-colors line-clamp-1">
                                "{{ s.query }}"
                              </span>
                            </div>
                            <div class="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>{{ s.timestamp }}</span>
                              <span>•</span>
                              <span
                                [class]="s.riskLevel === 'bardzo wysoki' || s.riskLevel === 'wysoki' ? 'text-red-400' : 'text-emerald-400'"
                              >
                                Ryzyko: {{ s.riskLevel }}
                              </span>
                            </div>
                          </button>

                          <div class="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              (click)="widgetsService.togglePinSearch(s.id)"
                              [class]="s.isPinned ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'"
                              class="p-1 rounded cursor-pointer"
                              [title]="s.isPinned ? 'Odepnij zapytanie' : 'Przypnij na stałe'"
                            >
                              <mat-icon class="text-xs">{{ s.isPinned ? 'push_pin' : 'push_pin' }}</mat-icon>
                            </button>
                            <button
                              type="button"
                              (click)="widgetsService.removeRecentSearch(s.id)"
                              class="text-slate-500 hover:text-red-400 p-1 rounded cursor-pointer"
                              title="Usuń z historii"
                            >
                              <mat-icon class="text-xs">close</mat-icon>
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                }

                <!-- ================= WIDŻET 4: SZYBKIE NARZĘDZIA ================= -->
                @if (widget.id === 'quick-launcher') {
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <!-- Skrót: Słownik Prawny -->
                    <button
                      type="button"
                      (click)="openDictionary.emit(undefined)"
                      class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 text-left transition-all cursor-pointer group flex items-start gap-2.5"
                    >
                      <div class="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
                        <mat-icon class="text-base">auto_stories</mat-icon>
                      </div>
                      <div>
                        <div class="font-bold text-slate-200 group-hover:text-amber-300">Słownik Prawny</div>
                        <div class="text-[11px] text-slate-400">Pojęcia i definicje offline</div>
                      </div>
                    </button>

                    <!-- Skrót: Nowa Szyfrowana Notatka -->
                    <button
                      type="button"
                      (click)="openNotes.emit()"
                      class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 text-left transition-all cursor-pointer group flex items-start gap-2.5"
                    >
                      <div class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                        <mat-icon class="text-base">enhanced_encryption</mat-icon>
                      </div>
                      <div>
                        <div class="font-bold text-slate-200 group-hover:text-emerald-300">Skarbiec AES-256</div>
                        <div class="text-[11px] text-slate-400">Szyfrowane akta i notatki</div>
                      </div>
                    </button>

                    <!-- Skrót: Przewodnik Obrona Konieczna -->
                    <button
                      type="button"
                      (click)="openHandbookTopic('obrona-konieczna-art-25')"
                      class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 text-left transition-all cursor-pointer group flex items-start gap-2.5"
                    >
                      <div class="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                        <mat-icon class="text-base">shield</mat-icon>
                      </div>
                      <div>
                        <div class="font-bold text-slate-200 group-hover:text-blue-300">Kazus: Obrona Konieczna</div>
                        <div class="text-[11px] text-slate-400">Art. 25 k.k. z orzecznictwem</div>
                      </div>
                    </button>

                    <!-- Skrót: Przewodnik Konfiskata Auta -->
                    <button
                      type="button"
                      (click)="openHandbookTopic('alkohol-art-178a-konfiskata')"
                      class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 text-left transition-all cursor-pointer group flex items-start gap-2.5"
                    >
                      <div class="p-1.5 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20">
                        <mat-icon class="text-base">no_drinks</mat-icon>
                      </div>
                      <div>
                        <div class="font-bold text-slate-200 group-hover:text-red-300">Konfiskata Pojazdów</div>
                        <div class="text-[11px] text-slate-400">Reguły po 14 marca 2024</div>
                      </div>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardWidgetGrid {
  readonly widgetsService = inject(DashboardWidgetsService);
  readonly legalData = inject(LegalDataService);

  readonly openInCalculator = output<string>();
  readonly openArticleInCode = output<string>();
  readonly openNotes = output<void>();
  readonly openDictionary = output<string | undefined>();
  readonly openHandbook = output<string>();

  readonly isAddingCase = signal<boolean>(false);

  readonly suggestedArticles = [
    { id: 'art-148', label: '148 (Zabójstwo)' },
    { id: 'art-280', label: '280 (Rozbój)' },
    { id: 'art-190', label: '190 (Groźba bezprawna)' },
    { id: 'art-66', label: '66 (Warunkowe umorzenie)' },
  ];

  visibleWidgets(): DashboardWidgetConfig[] {
    const list = this.widgetsService.preferences().widgets.filter((w) => w.visible);
    return list.sort((a, b) => a.order - b.order);
  }

  getGridColsClass(): string {
    const cols = this.widgetsService.preferences().columns;
    if (cols === 1) return 'grid-cols-1';
    if (cols === 3) return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
    return 'grid-cols-1 lg:grid-cols-2';
  }

  analyzeInCalculator(art: PenalArticle): void {
    const query = `Art. ${art.number}${art.suffix || ''} k.k. ${art.title}`;
    this.openInCalculator.emit(query);
  }

  toggleAddCaseModal(): void {
    this.isAddingCase.update((v) => !v);
  }

  saveNewCase(title: string, client: string, num: string, summary: string): void {
    if (!title.trim()) return;
    this.widgetsService.addActiveCase({
      title: title.trim(),
      clientName: client.trim() || 'Klient anonimowy',
      caseNumber: num.trim() || undefined,
      stage: 'Przygotowawcze (Policja/Prokuratura)',
      priority: 'pilne',
      summary: summary.trim() || 'Wstępna analiza prawno-karna',
    });
    this.isAddingCase.set(false);
  }

  openHandbookTopic(slug: string): void {
    this.openHandbook.emit(slug);
  }
}
