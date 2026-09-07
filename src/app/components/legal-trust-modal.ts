import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-legal-trust-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
         (click)="onBackdropClick($event)">
      <div class="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#141928] via-[#0f1422] to-[#0a0d16] text-slate-100 shadow-2xl shadow-black/80 overflow-hidden"
           (click)="$event.stopPropagation()">
        
        <!-- Złota wstęga górna -->
        <div class="h-1 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        <!-- Nagłówek -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-slate-900/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <mat-icon>verified_user</mat-icon>
            </div>
            <div>
              <h2 class="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
                Nota Prawna, Tajemnica Obrończa i RODO
              </h2>
              <p class="text-xs text-slate-400">Standardy bezpieczeństwa, ochrona danych i status prawny aplikacji</p>
            </div>
          </div>
          <button (click)="close.emit()" 
                  class="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                  title="Zamknij (Esc)">
            <mat-icon class="text-xl">close</mat-icon>
          </button>
        </div>

        <!-- Treść -->
        <div class="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          
          <!-- Klauzula wyłączenia odpowiedzialności -->
          <section class="space-y-2">
            <div class="flex items-center gap-2 text-sm font-bold text-amber-400 font-serif">
              <mat-icon class="text-base">gavel</mat-icon>
              1. Status Prawny i Klauzula Odpowiedzialności (Disclaimer)
            </div>
            <p>
              Aplikacja <strong>„Prawnik z Łuczniczej”</strong> jest zaawansowanym systemem analityczno-edukacyjnym wspomagającym orientację w przepisach prawa karnego, orzecznictwie Sądu Najwyższego oraz sporządzaniu projektów pism procesowych.
            </p>
            <p class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
              <strong>Zastrzeżenie:</strong> Korzystanie z aplikacji nie stanowi świadczenia pomocy prawnej w rozumieniu ustawy z dnia 26 maja 1982 r. Prawo o adwokaturze ani ustawy z dnia 6 lipca 1982 r. o radcach prawnych i nie tworzy stosunku klient–obrońca. Każda sprawa karna wymaga indywidualnej analizy stanu faktycznego przez uprawnionego adwokata lub radcę prawnego.
            </p>
          </section>

          <!-- Tajemnica obrończa -->
          <section class="space-y-2">
            <div class="flex items-center gap-2 text-sm font-bold text-amber-400 font-serif">
              <mat-icon class="text-base">lock</mat-icon>
              2. Ochrona Bezwzględnej Tajemnicy Obrończej (art. 178 k.p.k.)
            </div>
            <p>
              Zgodnie z <strong>art. 178 pkt 1 k.p.k.</strong> obrońca nie może być przesłuchany w charakterze świadka co do faktów, o których dowiedział się udzielając pomocy prawnej lub prowadząc sprawę. Zakaz ten ma charakter bezwzględny i nie może być uchylony przez żaden sąd ani prokuratora.
            </p>
            <p>
              W celu zapewnienia pełnej realizacji konstytucyjnego prawa do obrony (art. 42 ust. 2 Konstytucji RP) architektura aplikacji została zaprojektowana w modelu <strong>Zero-Knowledge / Zero-Cloud</strong>: notatki procesowe i dane personalne klientów są szyfrowane lokalnie w pamięci urządzenia za pomocą algorytmu <strong>AES-256-GCM</strong> i nigdy nie są przesyłane na żaden zewnętrzny serwer.
            </p>
          </section>

          <!-- RODO & Prywatność -->
          <section class="space-y-2">
            <div class="flex items-center gap-2 text-sm font-bold text-amber-400 font-serif">
              <mat-icon class="text-base">shield</mat-icon>
              3. Zgodność z RODO / GDPR (Privacy by Design)
            </div>
            <ul class="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong>Brak serwerowej bazy danych:</strong> Wszelkie akta spraw i notatki zapisywane są wyłącznie w lokalnej pamięci Twojej przeglądarki (IndexedDB / Web Storage).</li>
              <li><strong>Brak śledzenia i analityki:</strong> Aplikacja nie stosuje ciasteczek marketingowych, nie profiluje użytkowników i nie współpracuje z zewnętrznymi sieciami reklamowymi.</li>
              <li><strong>Prawo do usunięcia danych:</strong> W każdej chwili możesz zablokować sejf lub usunąć wszystkie dane lokalne jednym kliknięciem.</li>
            </ul>
          </section>

          <!-- Źródła prawa -->
          <section class="space-y-2">
            <div class="flex items-center gap-2 text-sm font-bold text-amber-400 font-serif">
              <mat-icon class="text-base">menu_book</mat-icon>
              4. Źródła Prawa i Orzecznictwo
            </div>
            <p class="text-slate-400">
              Treści aktów prawnych (Kodeks karny, Kodeks postępowania karnego, Ustawa o przeciwdziałaniu narkomanii) pochodzą z oficjalnych publikacji w Dzienniku Ustaw Rzeczypospolitej Polskiej i odzwierciedlają aktualny stan prawny po nowelizacjach. Tezy orzecznicze pochodzą z bazy orzeczeń Izby Karnej Sądu Najwyższego oraz sądów apelacyjnych.
            </p>
          </section>

        </div>

        <!-- Stopka -->
        <div class="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <span>Standard Kancelarii Cyfrowej RP • Architektura Offline-First</span>
          <button (click)="close.emit()"
                  class="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-medium transition-colors">
            Rozumiem i akceptuję
          </button>
        </div>

      </div>
    </div>
  `,
})
export class LegalTrustModalComponent {
  readonly close = output<void>();

  onBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) {
      this.close.emit();
    }
  }
}
