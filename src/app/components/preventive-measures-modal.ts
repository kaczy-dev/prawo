import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface BailOption {
  type: string;
  article: string;
  name: string;
  description: string;
  conditions: string;
}

@Component({
  selector: 'app-preventive-measures-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
         (click)="onBackdropClick($event)">
      <div class="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#141928] via-[#0f1422] to-[#0a0d16] text-slate-100 shadow-2xl shadow-black/80 overflow-hidden"
           (click)="$event.stopPropagation()">
        
        <!-- Złota wstęga górna -->
        <div class="h-1 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        <!-- Nagłówek -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-slate-900/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <mat-icon>gavel</mat-icon>
            </div>
            <div>
              <h2 class="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
                Asystent Środków Zapobiegawczych & Przesłanek Aresztowych
                <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono">
                  art. 249–275 k.p.k.
                </span>
              </h2>
              <p class="text-xs text-slate-400">Analiza tymczasowego aresztowania, środków wolnościowych i procedury pierwszych 48/24h</p>
            </div>
          </div>
          <button (click)="close.emit()" 
                  class="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                  title="Zamknij (Esc)">
            <mat-icon class="text-xl">close</mat-icon>
          </button>
        </div>

        <!-- Zakładki wewnątrz modalu: Analizator Przesłanek vs Pierwsze 24h -->
        <div class="px-6 pt-3 border-b border-slate-800 flex gap-4 bg-slate-900/30">
          <button (click)="activeSubTab.set('arrest-analysis')"
                  class="pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors relative"
                  [class.text-amber-400]="activeSubTab() === 'arrest-analysis'"
                  [class.text-slate-400]="activeSubTab() !== 'arrest-analysis'">
            Weryfikacja Przesłanek Aresztu (art. 249/258)
            @if (activeSubTab() === 'arrest-analysis') {
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full"></div>
            }
          </button>
          <button (click)="activeSubTab.set('first-24h')"
                  class="pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors relative flex items-center gap-1.5"
                  [class.text-amber-400]="activeSubTab() === 'first-24h'"
                  [class.text-slate-400]="activeSubTab() !== 'first-24h'">
            <mat-icon class="text-xs">timer</mat-icon>
            Pierwsze 24h / 48h: Niezbędnik Zatrzymania
            @if (activeSubTab() === 'first-24h') {
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full"></div>
            }
          </button>
          <button (click)="activeSubTab.set('alternatives')"
                  class="pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors relative"
                  [class.text-amber-400]="activeSubTab() === 'alternatives'"
                  [class.text-slate-400]="activeSubTab() !== 'alternatives'">
            Katalog Środków Wolnościowych
            @if (activeSubTab() === 'alternatives') {
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full"></div>
            }
          </button>
        </div>

        <!-- Treść Modalu -->
        <div class="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          
          @if (activeSubTab() === 'arrest-analysis') {
            <div class="space-y-6">
              
              <!-- Przesłanka ogólna -->
              <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-slate-200 flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-mono">1</span>
                    Przesłanka ogólna: Duże prawdopodobieństwo popełnienia czynu (art. 249 § 1 k.p.k.)
                  </div>
                  <input type="checkbox" [(ngModel)]="hasGeneralEvidence" class="rounded accent-amber-500 w-4 h-4 cursor-pointer" />
                </div>
                <p class="text-xs text-slate-400 pl-8">
                  Środki zapobiegawcze można stosować tylko wtedy, gdy zebrane dowody wskazują na duże prawdopodobieństwo, że oskarżony/podejrzany popełnił przestępstwo. Jeśli dowody są poszlakowe lub sprzeczne, żaden środek zapobiegawczy nie może zostać zastosowany!
                </p>
              </div>

              <!-- Przesłanki szczególne -->
              <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div class="font-semibold text-slate-200 flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-mono">2</span>
                  Przesłanki szczególne aresztu (art. 258 k.p.k.) — zaznacz zarzuty prokuratury:
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
                  <label class="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input type="checkbox" [(ngModel)]="riskFlight" class="mt-0.5 accent-amber-500 rounded" />
                    <div class="text-xs">
                      <strong class="text-slate-200">Ucieczka / Ukrywanie się</strong> (art. 258 § 1 pkt 1)<br>
                      <span class="text-slate-400">Brak stałego miejsca pobytu, pobyt za granicą, próba ucieczki.</span>
                    </div>
                  </label>

                  <label class="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input type="checkbox" [(ngModel)]="riskCollusion" class="mt-0.5 accent-amber-500 rounded" />
                    <div class="text-xs">
                      <strong class="text-slate-200">Obawa Matactwa</strong> (art. 258 § 1 pkt 2)<br>
                      <span class="text-slate-400">Nakłanianie świadków do fałszywych zeznań, niszczenie śladów.</span>
                    </div>
                  </label>

                  <label class="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input type="checkbox" [(ngModel)]="riskSeverePenalty" class="mt-0.5 accent-amber-500 rounded" />
                    <div class="text-xs">
                      <strong class="text-slate-200">Groźba surowej kary (&ge; 8 lat)</strong> (art. 258 § 2)<br>
                      <span class="text-slate-400">Górna granica ustawowego zagrożenia wynosi min. 8 lat pozbawienia wolności.</span>
                    </div>
                  </label>

                  <label class="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input type="checkbox" [(ngModel)]="riskRecidivism" class="mt-0.5 accent-amber-500 rounded" />
                    <div class="text-xs">
                      <strong class="text-slate-200">Recydywa / Nowy czyn</strong> (art. 258 § 3)<br>
                      <span class="text-slate-400">Uzasadniona obawa popełnienia ciężkiego przestępstwa przeciwko życiu/zdrowiu.</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Przesłanki negatywne (art. 259 k.p.k.) -->
              <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div class="font-semibold text-slate-200 flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">3</span>
                  Przesłanki negatywne aresztu (art. 259 k.p.k. - zakaz stosowania aresztu):
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
                  <label class="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input type="checkbox" [(ngModel)]="negativeHealth" class="mt-0.5 accent-emerald-500 rounded" />
                    <div class="text-xs">
                      <strong class="text-emerald-300">Zagrożenie życia lub zdrowia</strong> (art. 259 § 1 pkt 1)<br>
                      <span class="text-slate-400">Ciężka choroba, której leczenie w warunkach więziennych jest niemożliwe.</span>
                    </div>
                  </label>

                  <label class="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input type="checkbox" [(ngModel)]="negativeFamily" class="mt-0.5 accent-emerald-500 rounded" />
                    <div class="text-xs">
                      <strong class="text-emerald-300">Wyjątkowo ciężkie skutki dla rodziny</strong> (art. 259 § 1 pkt 2)<br>
                      <span class="text-slate-400">Jedyny żywiciel rodziny, opieka nad niepełnosprawnym dzieckiem.</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Ocena ryzyka i rekomendacja obrony -->
              <div class="p-4 rounded-xl border bg-slate-900/80"
                   [class.border-rose-500/50]="getArrestRisk() === 'WYSOKIE' && !hasNegativePremise()"
                   [class.border-amber-500/50]="getArrestRisk() === 'ŚREDNIE' && !hasNegativePremise()"
                   [class.border-emerald-500/50]="hasNegativePremise() || getArrestRisk() === 'NISKIE'">
                <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span class="text-xs uppercase tracking-wider text-slate-400">Prognoza Sądowa: Prawdopodobieństwo Zastosowania Aresztu</span>
                    <div class="text-xl font-bold font-serif"
                         [class.text-rose-400]="getArrestRisk() === 'WYSOKIE' && !hasNegativePremise()"
                         [class.text-amber-400]="getArrestRisk() === 'ŚREDNIE' && !hasNegativePremise()"
                         [class.text-emerald-400]="hasNegativePremise() || getArrestRisk() === 'NISKIE'">
                      {{ hasNegativePremise() ? 'ZAKAZ STOSOWANIA ARESZTU (art. 259 k.p.k.)' : getArrestRisk() }}
                    </div>
                  </div>
                </div>

                <div class="mt-3 space-y-2 text-xs text-slate-300">
                  <p><strong>Linia obrony na posiedzeniu aresztowym:</strong></p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Powołanie się na <strong>zasadę minimalizacji i subsydiarności</strong> (art. 257 § 1 k.p.k.) – areszt jest środkiem ostatecznym (*ultima ratio*).</li>
                    <li>Złożenie alternatywnego wniosku o <strong>dozór Policji</strong> (art. 275 k.p.k.) oraz <strong>poręczenie majątkowe</strong> (art. 266 k.p.k. / art. 257 § 2 k.p.k. z zastrzeżeniem zmiany aresztu po wpłacie kaucji).</li>
                    <li>Wytyk braków dowodowych: sama surowość grożącej kary (art. 258 § 2 k.p.k.) wg orzecznictwa ETPCz i SN nie może stanowić wyłącznej podstawy wielomiesięcznego aresztu bez wykazania realnego matactwa.</li>
                  </ul>
                </div>
              </div>

            </div>
          }

          @if (activeSubTab() === 'first-24h') {
            <div class="space-y-4">
              
              <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                <strong>Złote zasady podczas zatrzymania przez Policję (art. 244-248 k.p.k.):</strong>
                <p class="mt-1 text-slate-300">Każde słowo wypowiedziane nieformalnie w radiowozie lub na korytarzu może znaleźć się w notatce urzędowej funkcjonariusza. Zachowaj spokój i żądaj kontaktu z adwokatem.</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div class="font-bold text-slate-200 flex items-center gap-2">
                    <mat-icon class="text-amber-400 text-base">mic_off</mat-icon>
                    1. Prawo do milczenia (art. 175 k.p.k.)
                  </div>
                  <p class="text-xs text-slate-400">
                    Podejrzany ma bezwzględne prawo do odmowy składania wyjaśnień oraz odmowy odpowiedzi na poszczególne pytania bez podawania powodów. Skorzystanie z tego prawa nie może być traktowane jako dowód winy!
                  </p>
                </div>

                <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div class="font-bold text-slate-200 flex items-center gap-2">
                    <mat-icon class="text-amber-400 text-base">phone_in_talk</mat-icon>
                    2. Kontakt z Obrońcą (art. 245 k.p.k.)
                  </div>
                  <p class="text-xs text-slate-400">
                    Zatrzymanemu na jego żądanie należy niezwłocznie umożliwić nawiązanie kontaktu z adwokatem lub radcą prawnym, a także bezpośrednią rozmowę bez obecności osób trzecich (chyba że prokurator zastrzeże obecność).
                  </p>
                </div>

                <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div class="font-bold text-slate-200 flex items-center gap-2">
                    <mat-icon class="text-amber-400 text-base">timer</mat-icon>
                    3. Zegary Procesowe: 48h + 24h
                  </div>
                  <p class="text-xs text-slate-400">
                    Policja może zatrzymać obywatela na maksymalnie <strong>48 godzin</strong>. W tym czasie należy przekazać go do sądu z wnioskiem o areszt. Sąd ma <strong>24 godziny</strong> na rozpoznanie wniosku. Jeśli po 72h nie doręczono postanowienia, zatrzymany musi być natychmiast zwolniony (art. 248 k.p.k.).
                  </p>
                </div>

                <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div class="font-bold text-slate-200 flex items-center gap-2">
                    <mat-icon class="text-amber-400 text-base">assignment_turned_in</mat-icon>
                    4. Zażalenie na zatrzymanie (art. 246 k.p.k.)
                  </div>
                  <p class="text-xs text-slate-400">
                    W terminie <strong>7 dni</strong> od zatrzymania można złożyć zażalenie do Sądu Rejonowego na bezzasadność, nielegalność lub nieprawidłowość zatrzymania. W razie uznania zatrzymania za bezzasadne otwiera to drogę do odszkodowania i zadośćuczynienia.
                  </p>
                </div>
              </div>

            </div>
          }

          @if (activeSubTab() === 'alternatives') {
            <div class="space-y-4">
              <p class="text-xs text-slate-400">
                Zgodnie z art. 257 § 1 k.p.k. tymczasowego aresztowania nie stosuje się, jeżeli wystarczający jest inny środek zapobiegawczy:
              </p>

              <div class="space-y-3">
                @for (bail of bailOptions; track bail.type) {
                  <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors">
                    <div class="flex items-center justify-between">
                      <strong class="text-slate-200 text-sm flex items-center gap-2">
                        <mat-icon class="text-amber-400 text-base">shield</mat-icon>
                        {{ bail.name }}
                      </strong>
                      <span class="text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono">
                        {{ bail.article }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-400">{{ bail.description }}</p>
                    <div class="text-[11px] text-amber-300/80 bg-slate-950/40 p-2 rounded border border-slate-800">
                      <strong>Warunki orzeczenia:</strong> {{ bail.conditions }}
                    </div>
                  </div>
                }
              </div>
            </div>
          }

        </div>

        <!-- Stopka -->
        <div class="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <span>Moduł opracowany wg standardów procedury karnej RP oraz orzecznictwa ETPCz.</span>
          <button (click)="close.emit()"
                  class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors">
            Zamknij
          </button>
        </div>

      </div>
    </div>
  `,
})
export class PreventiveMeasuresModalComponent {
  readonly close = output<void>();

  readonly activeSubTab = signal<'arrest-analysis' | 'first-24h' | 'alternatives'>('arrest-analysis');

  hasGeneralEvidence = true;
  riskFlight = false;
  riskCollusion = false;
  riskSeverePenalty = false;
  riskRecidivism = false;
  negativeHealth = false;
  negativeFamily = false;

  readonly bailOptions: BailOption[] = [
    {
      type: 'bail',
      article: 'art. 266 k.p.k.',
      name: 'Poręczenie majątkowe (Kaucja)',
      description: 'Złożenie pieniędzy, papierów wartościowych lub wpis hipoteki na nieruchomości oskarżonego lub osoby trzeciej.',
      conditions: 'Określenie kwoty uzależnione jest od sytuacji majątkowej, wagi czynu i rozmiaru wyrządzonej szkody.',
    },
    {
      type: 'police_supervision',
      article: 'art. 275 k.p.k.',
      name: 'Dozór Policji',
      description: 'Obowiązek stawiennictwa we właściwej jednostce Policji w określonych odstępach czasu oraz informowania o zmianie miejsca pobytu.',
      conditions: 'Może być połączony z zakazem kontaktowania się ze świadkami lub pokrzywdzonym.',
    },
    {
      type: 'leave_premises',
      article: 'art. 275a k.p.k.',
      name: 'Nakaz opuszczenia lokalu mieszkalnego',
      description: 'Nakaz okresowego opuszczenia lokalu zajmowanego wspólnie z pokrzywdzonym w sprawach o przestępstwo z użyciem przemocy.',
      conditions: 'Stosowany w sprawach o znęcanie (art. 207 k.k.) na okres do 3 miesięcy z możliwością przedłużenia.',
    },
    {
      type: 'travel_ban',
      article: 'art. 277 k.p.k.',
      name: 'Zakaz opuszczania kraju i zatrzymanie paszportu',
      description: 'Zakaz wyjazdu poza granice RP, połączony z odebraniem paszportu lub dowodu osobistego.',
      conditions: 'Stosowany przy obawie wyjazdu za granicę w celu uniknięcia odpowiedzialności.',
    },
  ];

  hasNegativePremise(): boolean {
    return this.negativeHealth || this.negativeFamily;
  }

  getArrestRisk(): 'NISKIE' | 'ŚREDNIE' | 'WYSOKIE' {
    if (!this.hasGeneralEvidence) return 'NISKIE';
    let count = 0;
    if (this.riskFlight) count += 2;
    if (this.riskCollusion) count += 2;
    if (this.riskSeverePenalty) count += 1;
    if (this.riskRecidivism) count += 2;

    if (count >= 3) return 'WYSOKIE';
    if (count >= 1) return 'ŚREDNIE';
    return 'NISKIE';
  }

  onBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) {
      this.close.emit();
    }
  }
}
