import {
  Component,
  ChangeDetectionStrategy,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HandbooksDataService } from '../services/handbooks-data.service';
import { TextToSpeechService } from '../services/text-to-speech.service';
import { HandbookTopic } from '../models/legal.model';

@Component({
  selector: 'app-handbooks-browser',
  imports: [CommonModule, MatIconModule],
  template: `
    <section id="section-handbooks" class="space-y-6">
      <!-- Nagłówek Sekcji Podręczników -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-semibold text-xs uppercase tracking-wider border border-amber-500/30">
                Baza Wiedzy & Edukacja Prawna
              </span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px] border border-emerald-500/30 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Dostępne Offline
              </span>
            </div>
            <h1 class="text-xl md:text-2xl font-bold text-white tracking-tight">
              Interaktywne Podręczniki Prawa Karnego
            </h1>
            <p class="text-sm text-slate-400 mt-1 max-w-2xl">
              Przystępne wyjaśnienia przepisów bez skomplikowanego żargonu, autentyczne studia przypadków (case studies) oraz bezpośrednie odnośniki do kodeksu i orzeczeń Sądu Najwyższego.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <div class="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-right">
              <span class="text-[10px] text-slate-400 block uppercase font-mono">Dostępne tomy:</span>
              <span class="text-lg font-bold text-amber-400">{{ dataService.topics().length }} poradników</span>
            </div>
          </div>
        </div>

        <!-- Pasek Wyszukiwania i Filtrów -->
        <div class="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-3">
          <!-- Wyszukiwarka tekstowa offline -->
          <div class="md:col-span-6 relative">
            <mat-icon class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</mat-icon>
            <input
              id="input-handbook-search"
              type="text"
              [value]="dataService.searchQuery()"
              (input)="onSearchInput($event)"
              placeholder="Szukaj pojęcia, np. obrona konieczna, BLIK, konfiskata auta, zatrzymanie..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
            />
            @if (dataService.searchQuery()) {
              <button
                type="button"
                (click)="dataService.setSearchQuery('')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Wyczyść szukanie"
              >
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            }
          </div>

          <!-- Filtr Kategorii -->
          <div class="md:col-span-4">
            <select
              id="select-handbook-category"
              [value]="dataService.selectedCategory()"
              (change)="onCategoryChange($event)"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 cursor-pointer"
            >
              @for (cat of dataService.categories; track cat.id) {
                <option [value]="cat.id">{{ cat.label }}</option>
              }
            </select>
          </div>

          <!-- Filtr Poziomu Trudności -->
          <div class="md:col-span-2">
            <select
              id="select-handbook-difficulty"
              [value]="dataService.selectedDifficulty()"
              (change)="onDifficultyChange($event)"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-amber-500/60 cursor-pointer"
            >
              @for (diff of dataService.difficulties; track diff.id) {
                <option [value]="diff.id">{{ diff.label }}</option>
              }
            </select>
          </div>
        </div>
      </div>

      <!-- Główny Układ: Lista Podręczników po lewej (lub na górze na mobile) + Treść Podręcznika -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Lewa kolumna: Lista tematów (4 z 12 kolumn) -->
        <div class="lg:col-span-4 space-y-3">
          <div class="flex items-center justify-between px-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Katalog zagadnień ({{ dataService.filteredTopics().length }})
            </span>
          </div>

          @if (dataService.filteredTopics().length === 0) {
            <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
              <mat-icon class="text-3xl text-slate-500 mb-2">menu_book</mat-icon>
              <p class="text-sm font-medium text-slate-300">Brak podręczników spełniających kryteria</p>
              <p class="text-xs text-slate-500 mt-1">Zmień frazę wyszukiwania lub filtry kategorii.</p>
              <button
                type="button"
                (click)="resetFilters()"
                class="mt-3 text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                Resetuj filtry
              </button>
            </div>
          }

          <div class="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            @for (topic of dataService.filteredTopics(); track topic.id) {
              <button
                type="button"
                [id]="'topic-item-' + topic.id"
                (click)="selectTopic(topic)"
                [class]="dataService.selectedTopicId() === topic.id
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/5'
                  : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'"
                class="w-full p-4 rounded-xl border transition-all cursor-pointer group text-left relative overflow-hidden block"
              >
                @if (dataService.selectedTopicId() === topic.id) {
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                }

                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    [class]="getDifficultyBadgeClass(topic.difficulty)"
                    class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border"
                  >
                    {{ topic.difficulty }}
                  </span>
                  <span class="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <mat-icon class="text-[13px] text-slate-500">schedule</mat-icon>
                    {{ topic.readTimeMinutes }} min
                  </span>
                </div>

                <h3
                  [class]="dataService.selectedTopicId() === topic.id ? 'text-amber-300' : 'text-slate-100 group-hover:text-amber-200'"
                  class="text-sm font-bold transition-colors line-clamp-2"
                >
                  {{ topic.title }}
                </h3>

                <p class="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {{ topic.summary }}
                </p>

                <div class="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span class="font-medium text-slate-400">{{ topic.category }}</span>
                  <span class="text-amber-400/80 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform font-medium">
                    Czytaj <mat-icon class="text-xs">chevron_right</mat-icon>
                  </span>
                </div>
              </button>
            }
          </div>
        </div>

        <!-- Prawa kolumna: Szczegółowy widok wybranego podręcznika (8 z 12 kolumn) -->
        <div class="lg:col-span-8">
          @if (dataService.selectedTopic(); as activeTopic) {
            <article class="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
              <!-- Nagłówek Artykułu Podręcznikowego -->
              <div class="border-b border-slate-800 pb-6">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div class="flex items-center gap-2">
                    <span class="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <mat-icon class="text-xl">{{ activeTopic.icon }}</mat-icon>
                    </span>
                    <div>
                      <span class="text-xs text-slate-400 uppercase font-mono block">{{ activeTopic.category }}</span>
                      <span
                        [class]="getDifficultyBadgeClass(activeTopic.difficulty)"
                        class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border inline-block mt-0.5"
                      >
                        Poziom: {{ activeTopic.difficulty }}
                      </span>
                    </div>
                  </div>

                  <!-- Przyciski akcji: Czytaj na głos (Web Speech API) & Przetestuj w kalkulatorze -->
                  <div class="flex items-center gap-2">
                    <button
                      id="btn-handbook-read-aloud"
                      type="button"
                      (click)="toggleReadAloud(activeTopic)"
                      [class]="isListeningToTopic(activeTopic) ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'"
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
                      title="Odsłuchaj treść podręcznika za pomocą syntezatora mowy (Web Speech API)"
                    >
                      <mat-icon class="text-base">{{ isListeningToTopic(activeTopic) ? 'stop' : 'volume_up' }}</mat-icon>
                      <span>{{ isListeningToTopic(activeTopic) ? 'Zatrzymaj odsłuch' : 'Czytaj na głos' }}</span>
                    </button>

                    @if (activeTopic.quickScenarioQuery) {
                      <button
                        type="button"
                        (click)="testInCalculator.emit(activeTopic.quickScenarioQuery)"
                        class="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="Przełącz do modułu 'Co mi grozi?' z zapytaniem z tego podręcznika"
                      >
                        <mat-icon class="text-base text-amber-400">gavel</mat-icon>
                        <span class="hidden sm:inline">Kalkulator</span>
                      </button>
                    }
                  </div>
                </div>

                <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  {{ activeTopic.title }}
                </h2>
                <p class="text-sm font-medium text-amber-300/90 mt-1 font-mono">
                  {{ activeTopic.subtitle }}
                </p>

                <!-- Wstępne podsumowanie prostym językiem -->
                <div class="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-sm leading-relaxed">
                  <span class="font-bold text-amber-400 block text-xs uppercase tracking-wider mb-1">
                    W skrócie (dla nieprawnika):
                  </span>
                  {{ activeTopic.summary }}
                </div>
              </div>

              <!-- Sekcje merytoryczne z przejrzystymi wyjaśnieniami -->
              <div class="space-y-6">
                @for (sec of activeTopic.sections; track sec.heading) {
                  <section class="space-y-2.5">
                    <h3 class="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <span class="w-1.5 h-4 bg-amber-400 rounded-full"></span>
                      {{ sec.heading }}
                    </h3>
                    @for (para of sec.paragraphs; track para) {
                      <p class="text-sm text-slate-300 leading-relaxed">
                        {{ para }}
                      </p>
                    }
                  </section>
                }
              </div>

              <!-- Złote Zasady w pigułce -->
              <div class="bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 rounded-xl p-5">
                <div class="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
                  <mat-icon class="text-lg">tips_and_updates</mat-icon>
                  <span>Złote zasady w pigułce – zapamiętaj:</span>
                </div>
                <ul class="space-y-2 text-xs md:text-sm text-slate-200">
                  @for (rule of activeTopic.keyRules; track rule) {
                    <li class="flex items-start gap-2.5">
                      <mat-icon class="text-amber-400 text-base shrink-0 mt-0.5">check_circle</mat-icon>
                      <span>{{ rule }}</span>
                    </li>
                  }
                </ul>
              </div>

              <!-- Mity vs Fakty prawne -->
              @if (activeTopic.mythsAndFacts.length > 0) {
                <div class="space-y-3">
                  <h3 class="text-base font-bold text-slate-200 flex items-center gap-2">
                    <mat-icon class="text-red-400 text-lg">fact_check</mat-icon>
                    <span>Mity vs Rzeczywistość prawna</span>
                  </h3>
                  <div class="grid grid-cols-1 gap-3">
                    @for (item of activeTopic.mythsAndFacts; track item.myth) {
                      <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                        <div class="flex items-start gap-2 text-red-300">
                          <span class="font-bold uppercase text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/30 shrink-0">
                            MIT
                          </span>
                          <span class="italic font-medium">„{{ item.myth }}”</span>
                        </div>
                        <div class="flex items-start gap-2 text-emerald-300 pl-2 border-l-2 border-emerald-500/40">
                          <span class="font-bold uppercase text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
                            FAKT
                          </span>
                          <span class="text-slate-200">{{ item.fact }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Studia Przypadków (Case Studies) z życia codziennego -->
              <div class="space-y-4 pt-4 border-t border-slate-800">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <mat-icon class="text-lg">work_history</mat-icon>
                    </span>
                    <div>
                      <h3 class="text-lg font-bold text-white">Studia Przypadków (Case Studies)</h3>
                      <p class="text-xs text-slate-400">Jak przepisy są stosowane w salach sądowych i na policji</p>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  @for (cs of activeTopic.caseStudies; track cs.id) {
                    <div class="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3.5 relative overflow-hidden">
                      <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <h4 class="text-sm font-bold text-amber-300 flex items-center gap-2">
                          <mat-icon class="text-base text-amber-400">description</mat-icon>
                          {{ cs.title }}
                        </h4>
                        @if (cs.calculatorScenarioQuery) {
                          <button
                            type="button"
                            (click)="testInCalculator.emit(cs.calculatorScenarioQuery)"
                            class="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30 transition-colors"
                            title="Przetestuj ten przypadek w module 'Co mi grozi?'"
                          >
                            <mat-icon class="text-xs">calculate</mat-icon>
                            <span>Przetestuj w kalkulatorze</span>
                          </button>
                        }
                      </div>

                      <!-- Sytuacja z życia -->
                      <div class="text-xs space-y-1">
                        <span class="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                          Sytuacja z życia:
                        </span>
                        <p class="text-slate-200 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          {{ cs.scenario }}
                        </p>
                      </div>

                      <!-- Dylemat Prawny -->
                      <div class="text-xs space-y-1">
                        <span class="font-bold text-amber-400/90 uppercase tracking-wider text-[10px] block">
                          Wątpliwość i dylemat prawny:
                        </span>
                        <p class="text-amber-200/90 italic pl-3 border-l-2 border-amber-500/50">
                          {{ cs.legalDilemma }}
                        </p>
                      </div>

                      <!-- Rozstrzygnięcie Sądu / Prokuratury -->
                      <div class="text-xs space-y-1">
                        <span class="font-bold text-emerald-400 uppercase tracking-wider text-[10px] block">
                          Rozstrzygnięcie sądu i zastosowany przepis:
                        </span>
                        <p class="text-slate-200 bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/30 leading-relaxed">
                          {{ cs.courtResolution }}
                        </p>
                      </div>

                      <!-- Praktyczny wniosek dla każdego -->
                      <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2 text-xs text-slate-300">
                        <mat-icon class="text-amber-400 text-sm shrink-0 mt-0.5">lightbulb</mat-icon>
                        <div>
                          <strong class="text-white">Praktyczny wniosek:</strong> {{ cs.practicalTakeaway }}
                        </div>
                      </div>

                      <!-- Powiązane artykuły & orzecznictwo w case study -->
                      <div class="pt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span class="text-[10px] text-slate-400 font-mono uppercase">Przepisy:</span>
                        @for (art of cs.relatedArticles; track art.code) {
                          <button
                            type="button"
                            (click)="onOpenArticleRef(art.code, art.articleId)"
                            class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer flex items-center gap-1"
                            [title]="'Zobacz pełną treść ' + art.code + ' w Kodeksie Karnym'"
                          >
                            <mat-icon class="text-xs">menu_book</mat-icon>
                            <span>{{ art.code }}</span>
                          </button>
                        }

                        @if (cs.relatedRulingSignatures.length > 0) {
                          <span class="text-[10px] text-slate-400 font-mono uppercase ml-2">Orzeczenia:</span>
                          @for (sig of cs.relatedRulingSignatures; track sig) {
                            <button
                              type="button"
                              (click)="inspectRuling.emit(sig)"
                              class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 font-mono text-[11px] border border-slate-800 hover:border-emerald-500/40 transition-colors cursor-pointer flex items-center gap-1"
                              [title]="'Wyszukaj wyrok SN: ' + sig"
                            >
                              <mat-icon class="text-xs">gavel</mat-icon>
                              <span>{{ sig }}</span>
                            </button>
                          }
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Interaktywny Quiz Sprawdzający Wiedzę -->
              @if (activeTopic.quiz; as q) {
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="p-1 rounded bg-amber-500/20 text-amber-400">
                        <mat-icon class="text-base">quiz</mat-icon>
                      </span>
                      <h4 class="text-sm font-bold text-white">Sprawdź co zapamiętałeś (Mini-Quiz)</h4>
                    </div>
                    @if (selectedQuizOption() !== null) {
                      <button
                        type="button"
                        (click)="resetQuiz()"
                        class="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Rozwiąż ponownie
                      </button>
                    }
                  </div>

                  <p class="text-xs md:text-sm font-semibold text-slate-200">
                    {{ q.question }}
                  </p>

                  <div class="space-y-2">
                    @for (opt of q.options; track opt; let i = $index) {
                      <button
                        type="button"
                        (click)="selectQuizAnswer(i, q.correctIndex)"
                        [class]="getQuizOptionClass(i, q.correctIndex)"
                        class="w-full text-left p-3 rounded-lg border text-xs md:text-sm transition-all cursor-pointer flex items-start gap-3"
                      >
                        <span class="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {{ ['A', 'B', 'C', 'D'][i] }}
                        </span>
                        <span class="flex-1">{{ opt }}</span>
                      </button>
                    }
                  </div>

                  @if (selectedQuizOption() !== null) {
                    <div
                      [class]="isQuizAnswerCorrect() ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-red-950/30 border-red-500/40 text-red-200'"
                      class="p-3 rounded-lg border text-xs leading-relaxed"
                    >
                      <strong class="block mb-1 font-bold">
                        {{ isQuizAnswerCorrect() ? 'Świetnie! Poprawna odpowiedź.' : 'Niestety, to nie ta odpowiedź.' }}
                      </strong>
                      {{ q.explanation }}
                    </div>
                  }
                </div>
              }

              <!-- Powiązania systemowe: Artykuły Kodeksu i Orzecznictwo SN -->
              <div class="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <mat-icon class="text-sm">menu_book</mat-icon>
                    Przepisy Kodeksu Karnego:
                  </span>
                  <div class="space-y-2">
                    @for (art of activeTopic.linkedArticleRefs; track art.code) {
                      <button
                        type="button"
                        (click)="onOpenArticleRef(art.code, art.articleId)"
                        class="w-full text-left p-2 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <strong class="text-amber-300 font-mono">{{ art.code }}</strong>
                          <span class="text-slate-400 block text-[11px]">{{ art.label }}</span>
                        </div>
                        <mat-icon class="text-xs text-slate-500 group-hover:text-amber-400 transition-colors">arrow_forward</mat-icon>
                      </button>
                    }
                  </div>
                </div>

                <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <mat-icon class="text-sm">gavel</mat-icon>
                    Kluczowe Orzeczenia SN:
                  </span>
                  <div class="space-y-2">
                    @for (sig of activeTopic.linkedRulingSignatures; track sig) {
                      <button
                        type="button"
                        (click)="inspectRuling.emit(sig)"
                        class="w-full text-left p-2 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 border border-slate-800 hover:border-emerald-500/40 transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <strong class="text-emerald-300 font-mono">Wyrok SN: {{ sig }}</strong>
                          <span class="text-slate-400 block text-[11px]">Zobacz tezę i wykładnię prawną</span>
                        </div>
                        <mat-icon class="text-xs text-slate-500 group-hover:text-emerald-400 transition-colors">search</mat-icon>
                      </button>
                    }
                  </div>
                </div>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandbooksBrowser {
  readonly dataService = inject(HandbooksDataService);
  readonly tts = inject(TextToSpeechService);

  readonly inspectArticle = output<string>(); // kod artykułu lub id
  readonly inspectRuling = output<string>(); // sygnatura orzeczenia
  readonly testInCalculator = output<string>(); // zapytanie do kalkulatora

  readonly selectedQuizOption = signal<number | null>(null);
  readonly isQuizAnswerCorrect = signal<boolean>(false);

  selectTopic(topic: HandbookTopic): void {
    this.dataService.selectTopic(topic.id);
    this.resetQuiz();
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.dataService.setSearchQuery(val);
  }

  onCategoryChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.dataService.setCategory(val);
  }

  onDifficultyChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.dataService.setDifficulty(val);
  }

  resetFilters(): void {
    this.dataService.setSearchQuery('');
    this.dataService.setCategory('all');
    this.dataService.setDifficulty('all');
  }

  onOpenArticleRef(code: string, articleId?: string): void {
    this.inspectArticle.emit(articleId || code);
  }

  getDifficultyBadgeClass(diff: string): string {
    switch (diff) {
      case 'podstawowy':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'średniozaawansowany':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'zaawansowany':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }

  // Integracja z Web Speech API (Read-Aloud)
  isListeningToTopic(topic: HandbookTopic): boolean {
    return this.tts.isPlaying() && this.tts.currentTextId() === topic.id;
  }

  toggleReadAloud(topic: HandbookTopic): void {
    if (this.isListeningToTopic(topic)) {
      this.tts.stop();
      return;
    }

    // Przygotuj pełny tekst do odczytania: tytuł, wstęp, sekcje, złote zasady
    const sectionsText = topic.sections
      .map((s) => `${s.heading}. ${s.paragraphs.join(' ')}`)
      .join('\n\n');

    const rulesText = `Złote zasady w pigułce: ${topic.keyRules.join('. ')}`;

    const fullSpeech = `${topic.title}. ${topic.subtitle}.\n\nW skrócie: ${topic.summary}\n\n${sectionsText}\n\n${rulesText}`;

    this.tts.startPlayback(topic.id, topic.title, topic.category, fullSpeech);
  }

  // Quiz logic
  selectQuizAnswer(index: number, correctIndex: number): void {
    this.selectedQuizOption.set(index);
    this.isQuizAnswerCorrect.set(index === correctIndex);
  }

  resetQuiz(): void {
    this.selectedQuizOption.set(null);
    this.isQuizAnswerCorrect.set(false);
  }

  getQuizOptionClass(index: number, correctIndex: number): string {
    const selected = this.selectedQuizOption();
    if (selected === null) {
      return 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700';
    }

    if (index === correctIndex) {
      return 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-semibold';
    }

    if (index === selected && index !== correctIndex) {
      return 'bg-red-950/40 border-red-500 text-red-200';
    }

    return 'bg-slate-900/50 border-slate-800/60 text-slate-500 opacity-60';
  }
}
