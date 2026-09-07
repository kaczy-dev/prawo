import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PenalArticle, ThreatAnalysisResult } from '../models/legal.model';
import { SpeechDictationService } from '../services/speech-dictation.service';
import { LegalDataService } from '../services/legal-data.service';
import { PrescriptionTimer } from './prescription-timer';

export interface QuickScenario {
  label: string;
  category: string;
  query: string;
  artRef: string;
}

@Component({
  selector: 'app-threat-calculator',
  imports: [CommonModule, MatIconModule, PrescriptionTimer],
  template: `
    <section id="section-threat-calc" class="space-y-6">
      <!-- Panel wprowadzania sytuacji (Taste-Skill Anti-Slop: intentional layout, distinct branding) -->
      <div class="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 md:p-7 shadow-2xl relative overflow-hidden">
        <!-- Subtelny akcent tożsamościowy -->
        <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-400/50 to-amber-500/0"></div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div class="max-w-2xl">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                Wykładnia & Kwalifikacja Czynu
              </span>
              <span class="text-xs text-slate-500 font-mono">k.k. 2024–2026</span>
            </div>
            <h2 class="text-xl md:text-2xl font-bold text-white tracking-tight font-serif flex items-center gap-2">
              Kalkulator Zagrożenia Karnego
            </h2>
            <p class="text-xs md:text-sm text-slate-400 mt-1 leading-relaxed">
              Wprowadź lub podyktuj czyn procesowy. Silnik dokona automatycznej rekonstrukcji znamion, wymiaru kary i środków karnych.
            </p>
          </div>

          @if (threatAnalysis()) {
            <div class="flex items-center gap-2 flex-wrap self-start md:self-auto no-print shrink-0">
              <button
                id="btn-print-threat-analysis"
                type="button"
                (click)="triggerPrint()"
                class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
                title="Wydrukuj urzędową opinię prawno-karną A4 (Ctrl+P)"
              >
                <mat-icon class="text-base text-amber-400">print</mat-icon>
                <span>Drukuj Opinię</span>
              </button>

              <button
                id="btn-export-analysis-pdf"
                type="button"
                (click)="exportPdf.emit()"
                class="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
                title="Pobierz opinię prawną w formacie pliku PDF"
              >
                <mat-icon class="text-base">picture_as_pdf</mat-icon>
                <span>Eksportuj PDF</span>
              </button>
            </div>
          }
        </div>

        <!-- Banner aktywnego dyktowania zapytania -->
        @if (speech.isListening() && speech.activeTarget() === 'threat-calc-query') {
          <div class="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200 animate-pulse">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span class="font-bold">Dyktowanie stanu faktycznego (Web Speech API)...</span>
              <span class="italic text-slate-200">„{{ speech.currentInterim() || 'Mów do mikrofonu...' }}”</span>
            </div>
            <button
              (click)="stopDictation()"
              class="px-2 py-0.5 bg-red-500/20 text-red-200 border border-red-500/30 rounded text-xs cursor-pointer"
            >
              Zatrzymaj
            </button>
          </div>
        }

        <!-- Pasek wprowadzania zapytania z dyktowaniem i przyciskami -->
        <div class="flex flex-col sm:flex-row gap-2.5">
          <div class="relative flex-1 flex items-center">
            <mat-icon class="absolute left-3.5 text-amber-400 text-lg pointer-events-none">manage_search</mat-icon>
            <input
              id="input-threat-query"
              type="text"
              [value]="query()"
              (input)="onQueryInput($any($event.target).value)"
              (keydown.enter)="runAnalysis.emit()"
              placeholder="Wpisz lub podyktuj czyn: np. jazda samochodem 1.6 promila, kradzież 1200 zł, art. 286..."
              class="w-full pl-10 pr-20 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
            />
            <div class="absolute right-2 flex items-center gap-1">
              <!-- Przycisk Web Speech API w wyszukiwarce -->
              <button
                type="button"
                (click)="toggleQueryDictation()"
                [class]="isDictating() ? 'text-red-400 animate-pulse bg-red-500/20' : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'"
                class="p-1.5 rounded-lg transition-colors cursor-pointer"
                [title]="isDictating() ? 'Zatrzymaj dyktowanie' : 'Dyktuj czyn głosem (Web Speech API)'"
              >
                <mat-icon class="text-lg">{{ isDictating() ? 'mic' : 'mic_none' }}</mat-icon>
              </button>

              @if (query().trim()) {
                <button
                  type="button"
                  (click)="clearQuery.emit()"
                  class="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer transition-colors"
                  title="Wyczyść zapytanie"
                >
                  <mat-icon class="text-base">close</mat-icon>
                </button>
              }
            </div>
          </div>
          <button
            id="btn-run-threat-analysis"
            (click)="runAnalysis.emit()"
            class="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap shadow-md shadow-amber-500/25"
          >
            <mat-icon class="text-base">gavel</mat-icon>
            <span>Analizuj Zagrożenie</span>
          </button>
        </div>

        <!-- Filtry kategorii czynów -->
        <div class="mt-4 pt-3 border-t border-slate-800/80">
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar text-xs">
            <span class="text-slate-500 font-medium whitespace-nowrap mr-1">Kategorie:</span>
            @for (cat of categories; track cat.id) {
              <button
                (click)="categoryFilterChange.emit(cat.id)"
                [class]="activeCategory() === cat.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
                class="px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
              >
                {{ cat.label }}
              </button>
            }
          </div>

          <!-- Szybkie przykłady z życia (Chips powiązane z filtrem) -->
          <div class="flex items-center gap-2 mt-2.5 flex-wrap">
            @for (sc of filteredScenarios(); track sc.label) {
              <button
                (click)="onSelectScenario(sc.query)"
                class="text-xs bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-amber-300 border border-slate-700/70 px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <mat-icon class="text-[14px] text-amber-400/80">search</mat-icon>
                <span>{{ sc.label }}</span>
              </button>
            }
          </div>

        </div>
      </div>

      <!-- Pasek podsumowania aktywnego wyszukiwania -->
      @if (threatAnalysis(); as res) {
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-slate-400">Wyniki wyszukiwania dla:</span>
              <span class="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                "{{ query() }}"
              </span>
              <span class="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {{ res.matchedArticles.length }} art. k.k.
              </span>
              <span class="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {{ res.similarRulings.length }} orzeczeń SN
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap self-end md:self-auto">
            <button
              (click)="searchInPenalCode.emit(query())"
              class="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              title="Wyszukaj to hasło w Kodeksie Karnym"
            >
              <mat-icon class="text-xs text-amber-400">menu_book</mat-icon>
              <span>Szukaj w Kodeksie</span>
            </button>
            <button
              (click)="searchInRulings.emit(query())"
              class="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              title="Wyszukaj orzeczenia SN dla tego czynu"
            >
              <mat-icon class="text-xs text-amber-400">account_balance</mat-icon>
              <span>Szukaj w Orzecznictwie</span>
            </button>
            <button
              (click)="clearQuery.emit()"
              class="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
              title="Wyczyść zapytanie i wyniki"
            >
              <mat-icon class="text-xs">restart_alt</mat-icon>
              <span>Wyczyść</span>
            </button>
          </div>
        </div>
      }

      <!-- Wynik Kompleksowej Analizy -->
      @if (threatAnalysis(); as res) {
        <!-- Dedykowany nagłówek urzędowy opinii widoczny WYŁĄCZNIE przy drukowaniu -->
        <div class="hidden print:block mb-6 pb-4 border-b-2 border-slate-900 text-slate-900 print-avoid-break">
          <div class="flex items-center justify-between gap-4 mb-3">
            <div>
              <div class="text-[11px] font-bold uppercase tracking-widest text-slate-700">Kancelaria Prawna & System PRAWNBOT</div>
              <h1 class="text-xl font-bold text-slate-950">OFICJALNA ANALIZA ZAGROŻENIA I KWALIFIKACJI CZYNU</h1>
              <p class="text-xs text-slate-600">Sporządzono zgodnie ze stanem prawnym Kodeksu Karnego RP (2025/2026)</p>
            </div>
            <div class="text-right text-xs text-slate-700 font-mono">
              <div>Data wydruku: <strong>{{ printDate }}</strong></div>
              <div>Sygn. ref: <strong>{{ printReferenceId }}</strong></div>
              <div class="mt-1 inline-block border border-slate-900 px-2 py-0.5 font-bold uppercase text-[10px]">
                DOKUMENT ANALITYCZNY
              </div>
            </div>
          </div>

          <div class="bg-slate-100 p-3 rounded border border-slate-300 text-xs mt-2">
            <span class="font-bold text-slate-800 block uppercase text-[10px]">Badany stan faktyczny / zapytanie:</span>
            <p class="text-sm font-semibold text-slate-950 italic mt-0.5">„{{ query() }}”</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Kolumna Lewa: Podsumowanie Zagrożenia & Kwalifikacja (2/3) -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Karta Kwalifikacji Głównej -->
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <!-- Poziom ryzyka w nagłówku -->
              <div class="flex items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
                <div class="flex items-center gap-3">
                  <div
                    [class]="res.riskLevel === 'bardzo wysoki'
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : res.riskLevel === 'wysoki'
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : res.riskLevel === 'średni'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'"
                    class="px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wide"
                  >
                    Ryzyko: {{ res.riskLevel }}
                  </div>
                  <span class="text-xs text-slate-400">Wstępna kwalifikacja prawno-karna</span>
                </div>
                <span class="text-xs text-slate-500 font-mono">Stan prawny: 2025/2026</span>
              </div>

              <!-- Zakres Ustawowego Zagrożenia -->
              <div class="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 mb-5">
                <span class="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Główny wymiar ustawowego zagrożenia:
                </span>
                <p class="text-base md:text-lg font-bold text-amber-300">
                  {{ res.primarySentenceRange }}
                </p>
              </div>

              <!-- Licznik Przedawnienia Karalności (Prescription Timer) powiązany z analizowanym czynem -->
              @if (res.matchedArticles.length > 0) {
                <div class="mb-6 space-y-3">
                  @if (res.matchedArticles.length > 1) {
                    <div class="flex items-center gap-2 flex-wrap bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                      <span class="text-xs text-slate-400 font-semibold flex items-center gap-1">
                        <mat-icon class="text-xs text-amber-400">schedule</mat-icon>
                        Sprawdź przedawnienie dla:
                      </span>
                      @for (art of res.matchedArticles; track art.id) {
                        <button
                          type="button"
                          (click)="selectedPrescriptionArticle.set(art)"
                          [class]="(selectedPrescriptionArticle()?.id || res.matchedArticles[0].id) === art.id
                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-700/80 hover:text-slate-200'"
                          class="px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Art. {{ art.number }}{{ art.suffix || '' }} k.k.
                        </button>
                      }
                    </div>
                  }

                  <app-prescription-timer
                    [article]="selectedPrescriptionArticle() || res.matchedArticles[0]"
                    (createNoteWithPrescription)="savePrescriptionNote.emit($event)"
                  />
                </div>
              }

              <!-- Wyjaśnienie prostym językiem mecenasa -->
              <div class="mb-5">
                <h3 class="text-sm font-semibold text-slate-200 flex items-center gap-1.5 mb-2">
                  <mat-icon class="text-amber-400 text-base">forum</mat-icon>
                  Wyjaśnienie prostym językiem (komentarz obrońcy):
                </h3>
                <p class="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 font-sans">
                  {{ res.plainExplanation }}
                </p>
              </div>

              <!-- Środki obligatoryjne i nowe przepisy (np. konfiskata auta) -->
              @if (res.mandatoryMeasures.length > 0) {
                <div class="bg-red-950/30 border border-red-500/30 rounded-xl p-4 mb-5">
                  <h4 class="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <mat-icon class="text-sm text-red-400">warning</mat-icon>
                    Środki karne, nawiązki i obostrzenia obligatoryjne (nowelizacja 2024–2026):
                  </h4>
                  <ul class="space-y-1.5 text-xs text-slate-300">
                    @for (measure of res.mandatoryMeasures; track measure) {
                      <li class="flex items-start gap-2">
                        <span class="text-red-400 font-bold mt-0.5">•</span>
                        <span>{{ measure }}</span>
                      </li>
                    }
                  </ul>
                </div>
              }

              <!-- Dopasowane Artykuły Kodeksu Karnego -->
              <div>
                <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Podstawa prawna z Kodeksu Karnego:
                </h4>
                <div class="space-y-3">
                  @for (art of res.matchedArticles; track art.id) {
                    <div class="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                      <div class="flex items-center justify-between gap-2 mb-1.5">
                        <span class="text-sm font-bold text-amber-400">
                          Art. {{ art.number }}{{ art.suffix || '' }} k.k. – {{ art.title }}
                        </span>
                        <span class="text-[11px] text-slate-400 font-mono">{{ art.chapterNumber }}</span>
                      </div>
                      <p class="text-xs text-slate-300 font-serif leading-relaxed line-clamp-3 mb-2.5">
                        {{ art.content }}
                      </p>
                      <div class="flex items-center gap-2 flex-wrap">
                        <button
                          (click)="inspectArticle.emit(art)"
                          class="text-[11px] text-amber-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Przejdź do pełnej treści artykułu w Kodeksie Karnym"
                        >
                          <mat-icon class="text-xs text-amber-400">menu_book</mat-icon>
                          Zobacz w Kodeksie
                        </button>
                        <button
                          (click)="createNote.emit(art)"
                          class="text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <mat-icon class="text-xs">add</mat-icon>
                          Utwórz notatkę do tego art.
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Okoliczności łagodzące i obciążające -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Łagodzące -->
              <div class="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-lg">
                <h3 class="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mb-3">
                  <mat-icon class="text-emerald-400 text-base">verified</mat-icon>
                  Okoliczności łagodzące (argumenty obrony):
                </h3>
                <ul class="space-y-2 text-xs text-slate-300">
                  @for (factor of res.mitigatingFactors; track factor) {
                    <li class="flex items-start gap-2">
                      <mat-icon class="text-xs text-emerald-400 mt-0.5">check_circle</mat-icon>
                      <span>{{ factor }}</span>
                    </li>
                  }
                </ul>
              </div>

              <!-- Obciążające -->
              <div class="bg-slate-900 border border-red-500/20 rounded-2xl p-5 shadow-lg">
                <h3 class="text-sm font-bold text-red-400 flex items-center gap-1.5 mb-3">
                  <mat-icon class="text-red-400 text-base">error_outline</mat-icon>
                  Okoliczności obciążające (ryzyka procesowe):
                </h3>
                <ul class="space-y-2 text-xs text-slate-300">
                  @for (factor of res.aggravatingFactors; track factor) {
                    <li class="flex items-start gap-2">
                      <mat-icon class="text-xs text-red-400 mt-0.5">cancel</mat-icon>
                      <span>{{ factor }}</span>
                    </li>
                  }
                </ul>
              </div>
            </div>
          </div>

          <!-- Kolumna Prawa: Orzecznictwo SN i Rekomendowana Strategia (1/3) -->
          <div class="space-y-6 lg:sticky lg:top-24 self-start">
            <!-- Karta Rekomendowanych Kroków Obrony -->
            <div class="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 shadow-xl ring-1 ring-white/5">
              <h3 class="text-sm font-bold text-amber-300 flex items-center gap-2 mb-3">
                <mat-icon class="text-amber-400 text-base">lightbulb</mat-icon>
                Rekomendowana Strategia Procesowa:
              </h3>
              <ol class="space-y-2.5 text-xs text-slate-300">
                @for (step of res.recommendedSteps; track step; let i = $index) {
                  <li class="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span class="font-mono font-bold text-amber-400">{{ i + 1 }}.</span>
                    <span class="leading-relaxed">{{ step }}</span>
                  </li>
                }
              </ol>
            </div>

            <!-- Podobne Wyroki i Orzeczenia Sądu Najwyższego -->
            <div class="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 shadow-xl ring-1 ring-white/5">
              <div class="flex items-center justify-between gap-2 mb-3">
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                  <mat-icon class="text-amber-400 text-base">balance</mat-icon>
                  Precedensy i Wyroki SN:
                </h3>
                <span class="text-[11px] text-slate-400 font-mono">{{ res.similarRulings.length }} wyroki</span>
              </div>

              <div class="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                @for (ruling of res.similarRulings; track ruling.id) {
                  <div class="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
                    <div class="flex items-center justify-between gap-2 mb-1">
                      <span class="font-mono font-bold text-amber-300 text-xs">{{ ruling.signature }}</span>
                      <span class="text-[10px] text-slate-400">{{ ruling.date }}</span>
                    </div>
                    <p class="text-xs font-semibold text-slate-200 mb-1.5">{{ ruling.title }}</p>
                    <p class="text-[11px] text-slate-400 italic mb-2 line-clamp-2">"{{ ruling.thesis }}"</p>
                    <div class="bg-slate-900 p-2 rounded text-[11px] border border-slate-800 text-emerald-300">
                      <span class="font-bold text-slate-400 block text-[10px] uppercase">Zastosowany wyrok:</span>
                      {{ ruling.sanctionImposed }}
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Stopka prawna z klauzulą poufności widoczna WYŁĄCZNIE na wydruku -->
        <div class="hidden print:block mt-8 pt-4 border-t border-slate-400 text-[10px] text-slate-700 print-avoid-break">
          <div class="flex justify-between items-start gap-4">
            <div class="max-w-2xl">
              <strong>PRAWNBOT LEGAL ADVISORY:</strong> Niniejszy dokument stanowi wstępną komputerową analizę prawno-karną opartą na przepisach ustawy z dnia 6 czerwca 1997 r. – Kodeks Karny (Dz.U. z 2024 r. poz. 17 ze zm.) oraz najnowszym orzecznictwie Sądu Najwyższego RP. Wydruk objęty jest klauzulą poufności klienta.
            </div>
            <div class="text-right font-mono text-[9px] text-slate-600 whitespace-nowrap">
              Wygenerowano przez prawnBot AI<br />
              Wydruk urzędowy A4
            </div>
          </div>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreatCalculator {
  readonly speech = inject(SpeechDictationService);
  readonly legalData = inject(LegalDataService);

  readonly selectedPrescriptionArticle = signal<PenalArticle | null>(null);

  readonly printDate = new Date().toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly printReferenceId = `PB-KK-${Date.now().toString(36).toUpperCase()}`;

  triggerPrint(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  readonly query = input<string>('');
  readonly activeCategory = input<string>('all');
  readonly threatAnalysis = input<ThreatAnalysisResult | null>(null);
  readonly filteredScenarios = input<QuickScenario[]>([]);

  readonly queryChange = output<string>();
  readonly categoryFilterChange = output<string>();
  readonly runAnalysis = output<void>();
  readonly clearQuery = output<void>();
  readonly inspectArticle = output<PenalArticle>();
  readonly createNote = output<PenalArticle>();
  readonly searchInPenalCode = output<string>();
  readonly searchInRulings = output<string>();
  readonly exportPdf = output<void>();
  readonly savePrescriptionNote = output<{ title: string; content: string; linkedArticle: string }>();

  readonly categories = [
    { id: 'all', label: 'Wszystkie' },
    { id: 'traffic', label: 'Drogowe & Alkohol' },
    { id: 'theft', label: 'Kradzieże & Mienie' },
    { id: 'fraud', label: 'Oszustwa & BLIK' },
    { id: 'violence', label: 'Bójki & Zdrowie' },
    { id: 'threats', label: 'Stalking & Groźby' },
    { id: 'family', label: 'Alimenty & Rodzina' },
    { id: 'defense', label: 'Obrona & Umorzenie' },
  ];

  isDictating(): boolean {
    return this.speech.isListening() && this.speech.activeTarget() === 'threat-calc-query';
  }

  toggleQueryDictation(): void {
    if (this.isDictating()) {
      this.speech.stop();
      return;
    }

    this.speech.start('threat-calc-query', (chunk: string, isFinal: boolean) => {
      if (isFinal) {
        const current = this.query().trim();
        const sep = current ? ' ' : '';
        const updated = `${current}${sep}${chunk}`.trim();
        this.queryChange.emit(updated);
      }
    });
  }

  stopDictation(): void {
    this.speech.stop();
  }

  onQueryInput(val: string): void {
    this.queryChange.emit(val);
  }

  onSelectScenario(queryText: string): void {
    this.queryChange.emit(queryText);
    this.runAnalysis.emit();
  }
}
