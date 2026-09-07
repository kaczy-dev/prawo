import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PenalArticle, PrescriptionResult } from '../models/legal.model';
import { PrescriptionCalculatorService } from '../services/prescription-calculator.service';

@Component({
  selector: 'app-prescription-timer',
  imports: [CommonModule, MatIconModule],
  template: `
    <div
      id="prescription-timer-card"
      class="bg-slate-900 border rounded-2xl p-5 md:p-6 shadow-xl transition-all"
      [class.border-red-500]="result().severity === 'critical'"
      [class.border-emerald-500]="result().severity === 'prescribed'"
      [class.border-amber-500]="result().severity === 'warning'"
      [class.border-slate-800]="result().severity === 'active'"
    >
      <!-- Nagłówek Licznika Przedawnienia -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <mat-icon class="text-lg">hourglass_empty</mat-icon>
            </span>
            <h3 class="text-base md:text-lg font-bold text-white flex items-center gap-2">
              Licznik Przedawnienia Karalności (Prescription Timer)
            </h3>
            <!-- Status Badge -->
            <span
              [class]="statusBadgeClass()"
              class="px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider flex items-center gap-1"
            >
              <mat-icon class="text-xs">{{ statusIcon() }}</mat-icon>
              {{ statusLabel() }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Automatyczne obliczanie ustania karalności wg <strong>art. 101 i 102 Kodeksu Karnego</strong> na podstawie daty czynu.
          </p>
        </div>

        <!-- Przycisk kopiowania i zapisu -->
        <div class="flex items-center gap-2">
          <button
            id="btn-copy-prescription-calc"
            type="button"
            (click)="copyCalculation()"
            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
            title="Kopiuj podsumowanie obliczeń do schowka"
          >
            <mat-icon class="text-sm text-amber-400">{{ isCopied() ? 'check' : 'content_copy' }}</mat-icon>
            <span>{{ isCopied() ? 'Skopiowano' : 'Kopiuj' }}</span>
          </button>

          <button
            id="btn-save-prescription-to-note"
            type="button"
            (click)="exportToNote()"
            class="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 font-medium"
            title="Utwórz nową notatkę z kompletną kalkulacją przedawnienia"
          >
            <mat-icon class="text-sm">post_add</mat-icon>
            <span>Do Notatki</span>
          </button>
        </div>
      </div>

      <!-- Ostrzeżenie o zbliżającym się przedawnieniu lub ustałej karalności -->
      @if (result().warningNotice) {
        <div
          [class]="alertBoxClass()"
          class="p-4 rounded-xl mb-5 flex items-start gap-3 border shadow-md animate-fade-in"
        >
          <mat-icon class="text-xl shrink-0 mt-0.5">{{ alertIcon() }}</mat-icon>
          <div class="text-xs space-y-1">
            <div class="font-bold text-sm">{{ alertHeading() }}</div>
            <p class="leading-relaxed">{{ result().warningNotice }}</p>
          </div>
        </div>
      }

      <!-- Formularz parametrów daty i postępowania -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <!-- Pole wyboru daty popełnienia czynu -->
        <div>
          <label for="input-prescription-date" class="block text-xs font-semibold text-slate-300 mb-1.5">
            Data popełnienia czynu / zdarzenia:
          </label>
          <input
            id="input-prescription-date"
            type="date"
            [value]="selectedEventDate()"
            (change)="onDateChange($any($event.target).value)"
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <!-- Szybkie presety daty -->
        <div class="md:col-span-2">
          <span class="block text-xs font-semibold text-slate-400 mb-1.5">Szybkie ustawienie daty zdarzenia:</span>
          <div class="flex items-center gap-1.5 flex-wrap">
            @for (preset of datePresets; track preset.label) {
              <button
                type="button"
                (click)="applyDatePreset(preset.yearsAgo, preset.monthsAgo)"
                class="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
              >
                {{ preset.label }}
              </button>
            }
          </div>
        </div>

        <!-- Opcje procesowe: art. 102 k.k. & art. 101 § 2 k.k. -->
        <div class="md:col-span-3 flex flex-wrap gap-4 pt-3 border-t border-slate-800 text-xs">
          <label class="flex items-center gap-2 text-slate-200 cursor-pointer select-none">
            <input
              id="chk-proceedings-in-personam"
              type="checkbox"
              [checked]="hasProceedings()"
              (change)="hasProceedings.set($any($event.target).checked)"
              class="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4 cursor-pointer"
            />
            <span class="font-medium">
              Wszczęto postępowanie przeciwko osobie (postawiono zarzuty) – <strong>art. 102 k.k.</strong>
              <span class="text-amber-400 font-bold ml-1">(+{{ result().extendedYears }} lat)</span>
            </span>
          </label>

          <label class="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
            <input
              id="chk-private-prosecution"
              type="checkbox"
              [checked]="isPrivateProsecution()"
              (change)="isPrivateProsecution.set($any($event.target).checked)"
              class="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4 cursor-pointer"
            />
            <span>Ścigane z oskarżenia prywatnego (art. 101 § 2 k.k. – max 3 lata)</span>
          </label>
        </div>
      </div>

      <!-- Karta Wskaźników Czasowych & Odliczania (Countdown Tiles) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <!-- Kafelek 1: Data graniczna -->
        <div class="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
          <div class="text-[11px] text-slate-400 uppercase font-semibold">Data ustania karalności</div>
          <div class="text-sm sm:text-base font-bold text-amber-300 mt-1 font-mono">
            {{ result().formattedExpirationDate }}
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">ISO: {{ result().targetExpirationDate }}</div>
        </div>

        <!-- Kafelek 2: Łączny okres przedawnienia -->
        <div class="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
          <div class="text-[11px] text-slate-400 uppercase font-semibold">Łączny okres ścigania</div>
          <div class="text-base sm:text-lg font-bold text-white mt-1">
            {{ result().totalYears }} <span class="text-xs font-normal text-slate-400">lat</span>
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">
            Bazowy: {{ result().baseYears }} lat + art. 102: {{ result().extendedYears }} lat
          </div>
        </div>

        <!-- Kafelek 3: Czas pozostały -->
        <div class="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
          <div class="text-[11px] text-slate-400 uppercase font-semibold">
            {{ result().isExpired ? 'Od ustania karalności minęło' : 'Pozostało do przedawnienia' }}
          </div>
          <div
            class="text-base sm:text-lg font-bold mt-1"
            [class.text-emerald-400]="result().isExpired"
            [class.text-red-400]="result().severity === 'critical'"
            [class.text-amber-400]="result().severity === 'warning'"
            [class.text-sky-300]="result().severity === 'active'"
          >
            @if (result().isExpired) {
              <span>{{ -result().daysRemaining }} dni</span>
            } @else {
              <span>{{ result().daysRemaining }} dni</span>
            }
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">
            ok. {{ result().yearsRemaining }} lat / {{ result().monthsRemaining }} mies.
          </div>
        </div>

        <!-- Kafelek 4: Postęp upływu terminu -->
        <div class="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
          <div>
            <div class="text-[11px] text-slate-400 uppercase font-semibold">Upływ terminu karalności</div>
            <div class="text-base sm:text-lg font-bold text-slate-200 mt-1 font-mono">
              {{ result().progressPercent }}%
            </div>
          </div>
          <!-- Progress Bar -->
          <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              class="h-full transition-all duration-500 rounded-full"
              [class.bg-emerald-500]="result().isExpired"
              [class.bg-red-500]="result().severity === 'critical'"
              [class.bg-amber-500]="result().severity === 'warning'"
              [class.bg-sky-500]="result().severity === 'active'"
              [style.width.%]="result().progressPercent"
            ></div>
          </div>
        </div>
      </div>

      <!-- Podstawa prawna i zalecenie taktyczne obrońcy -->
      <div class="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 text-xs">
        <div>
          <span class="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
            Zastosowana norma prawna:
          </span>
          <div class="font-mono text-amber-300 font-semibold">{{ result().legalBasis }}</div>
          <p class="text-slate-300 mt-1 leading-relaxed">{{ result().statutoryRuleSummary }}</p>
        </div>

        <div class="pt-3 border-t border-slate-800/80">
          <span class="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block mb-1">
            Wskazówka Taktyczna dla Obrońcy / Podatnika:
          </span>
          <p class="text-slate-200 leading-relaxed font-medium bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            {{ result().defenseTacticsRecommendation }}
          </p>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescriptionTimer {
  private readonly calcService = inject(PrescriptionCalculatorService);

  readonly article = input.required<PenalArticle>();
  readonly initialEventDate = input<string>('');

  readonly createNoteWithPrescription = output<{ title: string; content: string; linkedArticle: string }>();

  // Stan lokalny licznika
  readonly selectedEventDate = signal<string>(this.getDefaultDate());
  readonly hasProceedings = signal<boolean>(false);
  readonly isPrivateProsecution = signal<boolean>(false);
  readonly isCopied = signal<boolean>(false);

  readonly datePresets = [
    { label: 'Dzisiaj', yearsAgo: 0, monthsAgo: 0 },
    { label: '6 mies. temu', yearsAgo: 0, monthsAgo: 6 },
    { label: '1 rok temu', yearsAgo: 1, monthsAgo: 0 },
    { label: '3 lata temu', yearsAgo: 3, monthsAgo: 0 },
    { label: '5 lat temu', yearsAgo: 5, monthsAgo: 0 },
    { label: '10 lat temu', yearsAgo: 10, monthsAgo: 0 },
    { label: '14 lat temu', yearsAgo: 14, monthsAgo: 0 },
  ];

  constructor() {
    // Jeśli przekazano initialEventDate, zainicjuj
    if (this.initialEventDate()) {
      this.selectedEventDate.set(this.initialEventDate());
    }
  }

  readonly result = computed<PrescriptionResult>(() => {
    return this.calcService.calculatePrescription(
      this.article(),
      this.selectedEventDate(),
      this.hasProceedings(),
      this.isPrivateProsecution()
    );
  });

  onDateChange(val: string): void {
    if (val) {
      this.selectedEventDate.set(val);
    }
  }

  applyDatePreset(yearsAgo: number, monthsAgo: number): void {
    const d = new Date();
    d.setFullYear(d.getFullYear() - yearsAgo);
    d.setMonth(d.getMonth() - monthsAgo);
    this.selectedEventDate.set(d.toISOString().split('T')[0]);
  }

  statusLabel(): string {
    const s = this.result().severity;
    switch (s) {
      case 'prescribed':
        return 'Przedawnione (Umorzenie)';
      case 'critical':
        return 'Alert Krytyczny (< 180 dni)';
      case 'warning':
        return 'Ostrzeżenie (< 2 lata)';
      case 'active':
        return 'Karalność w toku';
    }
  }

  statusIcon(): string {
    const s = this.result().severity;
    switch (s) {
      case 'prescribed':
        return 'check_circle';
      case 'critical':
        return 'report_problem';
      case 'warning':
        return 'warning';
      case 'active':
        return 'schedule';
    }
  }

  statusBadgeClass(): string {
    const s = this.result().severity;
    switch (s) {
      case 'prescribed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'critical':
        return 'bg-red-500/25 text-red-300 border-red-500/50 animate-pulse';
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'active':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    }
  }

  alertBoxClass(): string {
    const s = this.result().severity;
    switch (s) {
      case 'prescribed':
        return 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200';
      case 'critical':
        return 'bg-red-950/60 border-red-500/50 text-red-200';
      case 'warning':
        return 'bg-amber-950/60 border-amber-500/40 text-amber-200';
      default:
        return 'bg-slate-950/60 border-slate-800 text-slate-300';
    }
  }

  alertIcon(): string {
    const s = this.result().severity;
    switch (s) {
      case 'prescribed':
        return 'verified';
      case 'critical':
        return 'notification_important';
      case 'warning':
        return 'warning_amber';
      default:
        return 'info';
    }
  }

  alertHeading(): string {
    const s = this.result().severity;
    switch (s) {
      case 'prescribed':
        return 'USTANIE KARALNOŚCI CZYNU (Art. 17 § 1 pkt 6 k.p.k.)';
      case 'critical':
        return 'OSTRZEŻENIE: Zbliżający się upływ okresu przedawnienia!';
      case 'warning':
        return 'Uwaga: Karalność czynu wygasa za mniej niż 2 lata';
      default:
        return 'Bieg przedawnienia karalności';
    }
  }

  async copyCalculation(): Promise<void> {
    const r = this.result();
    const text = `KALKULACJA PRZEDAWNIENIA KARALNOŚCI (Prawnik z Łuczniczej)
Czyn: Art. ${r.article.number}${r.article.suffix || ''} k.k. (${r.article.title})
Data zdarzenia: ${r.eventDate}
Data ustania karalności: ${r.formattedExpirationDate} (${r.targetExpirationDate})
Status: ${this.statusLabel()} (${r.isExpired ? 'Przedawnione' : `Pozostało ${r.daysRemaining} dni`})
Łączny okres: ${r.totalYears} lat (baza: ${r.baseYears} lat, art. 102 k.k.: +${r.extendedYears} lat)
Podstawa prawna: ${r.legalBasis}
Wyjaśnienie: ${r.statutoryRuleSummary}
Zalecenie taktyczne: ${r.defenseTacticsRecommendation}`;

    try {
      await navigator.clipboard.writeText(text);
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2500);
    } catch (e) {
      console.warn('Nie udało się skopiować kalkulacji:', e);
    }
  }

  exportToNote(): void {
    const r = this.result();
    const art = r.article;
    const title = `Przedawnienie karalności – Art. ${art.number}${art.suffix || ''} k.k. (zdarzenie ${r.eventDate})`;
    const content = `PROTOKÓŁ KALKULACJI PRZEDAWNIENIA KARALNOŚCI
Kwalifikacja prawna: Art. ${art.number}${art.suffix || ''} k.k. – ${art.title}
Data popełnienia czynu: ${r.eventDate}
Data ustania karalności: ${r.formattedExpirationDate} (${r.targetExpirationDate})
Stan na dzień analizy: ${r.isExpired ? 'PRZEDAWNIONE (art. 17 § 1 pkt 6 k.p.k.)' : `Pozostało ${r.daysRemaining} dni do przedawnienia`}
Wszczęcie postępowania in personam (art. 102 k.k.): ${r.hasProceedingsInPersonam ? 'TAK (+10/5 lat)' : 'NIE (tylko bieg podstawowy)'}

Podstawa prawna: ${r.legalBasis}
Reguła kodeksowa: ${r.statutoryRuleSummary}

ZALECENIA DLA OBROŃCY:
${r.defenseTacticsRecommendation}
`;

    this.createNoteWithPrescription.emit({
      title,
      content,
      linkedArticle: `Art. ${art.number}${art.suffix || ''} k.k.`,
    });
  }

  private getDefaultDate(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1); // Domyślnie 1 rok wstecz dla realizmu
    return d.toISOString().split('T')[0];
  }
}
