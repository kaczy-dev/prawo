import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export type DocumentType = 'opinia' | 'wniosek' | 'memorandum';

@Component({
  selector: 'app-document-export-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        class="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header / Controls Toolbar -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <mat-icon class="text-2xl">print</mat-icon>
            </div>
            <div>
              <h3 class="text-base font-serif font-bold text-slate-100">Kancelaryjny Panel Wydruku i Eksportu A4</h3>
              <p class="text-xs text-slate-400">Generowanie oficjalnych dokumentów z nagłówkiem kancelarii, sygnaturą i klauzulą tajemnicy</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Format selector -->
            <div class="hidden sm:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button 
                (click)="docType.set('opinia')"
                [class]="docType() === 'opinia' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'"
                class="px-3 py-1 text-xs rounded-lg transition-all cursor-pointer"
              >
                Opinia Prawna
              </button>
              <button 
                (click)="docType.set('wniosek')"
                [class]="docType() === 'wniosek' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'"
                class="px-3 py-1 text-xs rounded-lg transition-all cursor-pointer"
              >
                Wniosek Procesowy
              </button>
              <button 
                (click)="docType.set('memorandum')"
                [class]="docType() === 'memorandum' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'"
                class="px-3 py-1 text-xs rounded-lg transition-all cursor-pointer"
              >
                Memorandum
              </button>
            </div>

            <button 
              (click)="closeModal.emit()" 
              class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <mat-icon class="text-xl">close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Document Preview Canvas (Styled as Physical A4 Sheet) -->
        <div class="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950/80 flex justify-center">
          <div class="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-10 md:p-14 rounded-lg shadow-2xl shadow-black/60 font-serif leading-relaxed text-sm flex flex-col justify-between print:shadow-none print:p-0">
            <!-- Top Section -->
            <div>
              <!-- Attorney Office Header -->
              <div class="border-b-2 border-slate-900 pb-4 mb-8 flex items-start justify-between">
                <div>
                  <h1 class="text-lg font-bold tracking-tight uppercase text-slate-900 font-sans">Kancelaria Adwokacka</h1>
                  <p class="text-xs text-slate-600 font-sans mt-0.5">adw. Jan Kowalski • Izba Adwokacka w Warszawie</p>
                  <p class="text-xs text-slate-500 font-sans">Al. Ujazdowskie 28/4, 00-540 Warszawa • kancelaria@adwokatura.pl</p>
                </div>
                <div class="text-right text-xs font-sans text-slate-600 space-y-1">
                  <div>Warszawa, dnia {{ todayDate }}</div>
                  <div class="font-bold text-slate-900">Znak sprawy: KA/K/{{ caseNumber() }}</div>
                </div>
              </div>

              <!-- Document Title -->
              <div class="text-center my-6">
                <h2 class="text-xl font-bold uppercase tracking-wide text-slate-900">
                  @switch (docType()) {
                    @case ('opinia') {
                      <span>Opinia Prawno-Karna</span>
                    }
                    @case ('wniosek') {
                      <span>Wniosek o Wydanie Wyroku Łącznego</span>
                    }
                    @case ('memorandum') {
                      <span>Memorandum Strategii Procesowej</span>
                    }
                  }
                </h2>
                <div class="w-24 h-0.5 bg-amber-600 mx-auto mt-2"></div>
                <p class="text-xs text-slate-500 italic mt-2">w przedmiocie kwalifikacji czynu oraz wymiaru kary</p>
              </div>

              <!-- Content Body -->
              <div class="space-y-4 text-[13px] text-justify text-slate-800 leading-normal">
                <p>
                  <strong>I. STAN FAKTYCZNY I SYGNATURY:</strong><br/>
                  Sprawa dotyczy analizy zbiegu przepisów ustawy oraz zbiegu przestępstw pod rządem ustawy Kodeks karny w brzmieniu uwzględniającym reformy z lat 2023–2026.
                </p>

                <p>
                  <strong>II. KWALIFIKACJA PRAWNA I ZAGROŻENIE USTAWOWE:</strong><br/>
                  Zgodnie z brzmieniem art. 85 § 1 k.k., jeżeli sprawca popełnił dwa lub więcej przestępstw, zanim zapadł pierwszy wyrok, chociażby nieprawomocny, co do któregokolwiek z nich i wymierzono za nie kary tego samego rodzaju albo inne podlegające łączeniu, sąd orzeka karę łączną, biorąc za podstawę kary z osobna wymierzone za zbiegające się przestępstwa.
                </p>

                <div class="p-4 rounded border border-slate-300 bg-slate-50 my-3 font-sans text-xs">
                  <div class="font-bold text-slate-900 mb-1">Zestawienie wyroków jednostkowych podlegających łączeniu:</div>
                  <ul class="list-disc pl-5 space-y-1 text-slate-700">
                    <li>Wyrok Sądu Rejonowego dla Warszawy-Śródmieścia, sygn. akt II K 120/24 – kara 3 lat pozbawienia wolności (art. 280 § 1 k.k.)</li>
                    <li>Wyrok Sądu Rejonowego dla Warszawy-Mokotowa, sygn. akt III K 455/23 – kara 1 roku i 6 miesięcy pozbawienia wolności (art. 278 § 1 k.k.)</li>
                  </ul>
                  <div class="mt-3 font-medium text-slate-900">
                    Wnioskowana kara łączna przy zastosowaniu zasady asperacji z przewagą absorpcji: <strong>3 lata i 4 miesiące pozbawienia wolności</strong>.
                  </div>
                </div>

                <p>
                  <strong>III. KONKLUZJA I REKOMENDACJA OBROŃCZA:</strong><br/>
                  Mając na uwadze ścisły związek czasowy i przedmiotowy pomiędzy zarzucanymi czynami oraz postawę sprawcy w toku postępowania, w pełni uzasadnione jest orzeczenie kary łącznej w dolnych granicach ustawowego zagrożenia.
                </p>
              </div>
            </div>

            <!-- Footer & Signature -->
            <div class="pt-8 border-t border-slate-300 mt-8">
              <div class="flex justify-between items-end text-xs font-sans">
                <div class="text-slate-500 max-w-xs text-[10px] leading-tight">
                  <span class="font-bold text-slate-700">KLAUZULA POUFNOŚCI:</span> Dokument stanowi tajemnicę adwokacką w rozumieniu art. 6 ustawy – Prawo o adwokaturze. Rozpowszechnianie zabronione.
                </div>
                <div class="text-center">
                  <div class="italic font-serif text-slate-600 mb-6">[podpis adwokata]</div>
                  <div class="border-t border-slate-400 pt-1 font-bold text-slate-800">adw. Jan Kowalski</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400">Format: A4 (210 × 297 mm)</span>
          </div>
          <div class="flex items-center gap-3">
            <button 
              (click)="closeModal.emit()" 
              class="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Anuluj
            </button>
            <button 
              (click)="printDocument()" 
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <mat-icon class="text-base">print</mat-icon>
              Drukuj / Eksportuj do PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DocumentExportModalComponent {
  closeModal = output<void>();

  docType = signal<DocumentType>('opinia');
  caseNumber = signal<string>('2026/09/KK');

  get todayDate(): string {
    return new Date().toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  printDocument() {
    window.print();
  }
}