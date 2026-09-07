import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OfflineSyncService } from '../services/offline-sync.service';

@Component({
  selector: 'app-offline-sync-manager-modal',
  imports: [CommonModule, MatIconModule],
  template: `
    @if (syncService.isModalOpen()) {
      <!-- Tło modalu z rozmyciem -->
      <div
        id="offline-sync-modal-backdrop"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Menedżer synchronizacji offline"
        tabindex="-1"
        (click)="onBackdropClick($event)"
        (keydown.escape)="syncService.closeModal()"
      >
        <!-- Kontener okna dialogowego -->
        <div
          id="offline-sync-modal-container"
          class="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in"
        >
          <!-- Nagłówek okna -->
          <div class="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <mat-icon>cloud_sync</mat-icon>
              </span>
              <div>
                <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Menedżer Synchronizacji Offline-First
                </h2>
                <p class="text-xs text-slate-400">
                  Kolejka lokalnych modyfikacji akt i notatek z automatycznym uzgadnianiem po powrocie do sieci
                </p>
              </div>
            </div>

            <button
              id="btn-close-sync-modal"
              type="button"
              (click)="syncService.closeModal()"
              class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Zamknij"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Pasek statusu łączności i kontrolka symulacji offline -->
          <div class="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-400">Stan łączności:</span>
              @if (syncService.effectiveOnline()) {
                <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Połączono (Baza Centralna Aktywna)
                </span>
              } @else {
                <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                  Tryb Offline (Zmiany są kolejkowane)
                </span>
              }

              @if (syncService.lastSyncTime()) {
                <span class="text-[11px] text-slate-500 ml-2 hidden sm:inline">
                  Ostatnia synchronizacja: <strong class="text-slate-400">{{ syncService.lastSyncTime() }}</strong>
                </span>
              }
            </div>

            <!-- Przełącznik symulacji Offline (dla ułatwienia prezentacji) -->
            <div class="flex items-center gap-3">
              <button
                id="btn-toggle-simulated-offline"
                type="button"
                (click)="syncService.toggleSimulatedOffline()"
                class="px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5"
                [class.bg-amber-500/20]="syncService.isSimulatedOffline()"
                [class.border-amber-500/40]="syncService.isSimulatedOffline()"
                [class.text-amber-300]="syncService.isSimulatedOffline()"
                [class.bg-slate-800]="!syncService.isSimulatedOffline()"
                [class.border-slate-700]="!syncService.isSimulatedOffline()"
                [class.text-slate-300]="!syncService.isSimulatedOffline()"
              >
                <mat-icon class="text-sm">
                  {{ syncService.isSimulatedOffline() ? 'wifi_off' : 'wifi' }}
                </mat-icon>
                <span>
                  {{ syncService.isSimulatedOffline() ? 'Symulacja Offline: WŁĄCZONA' : 'Symuluj brak sieci' }}
                </span>
              </button>

              <button
                id="btn-force-sync-now"
                type="button"
                (click)="syncService.syncPendingQueue()"
                [disabled]="!syncService.effectiveOnline() || syncService.isSyncing() || syncService.pendingCount() === 0"
                class="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 text-slate-950 border border-amber-400 disabled:border-slate-800 cursor-pointer transition-all flex items-center gap-1.5 shadow"
              >
                <mat-icon class="text-sm" [class.animate-spin]="syncService.isSyncing()">sync</mat-icon>
                <span>{{ syncService.isSyncing() ? 'Synchronizowanie...' : 'Synchronizuj teraz' }}</span>
              </button>
            </div>
          </div>

          <!-- Główna zawartość z przewijaniem -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Sekcja 1: Oczekujące operacje w kolejce -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <mat-icon class="text-amber-400 text-base">pending_actions</mat-icon>
                  Kolejka oczekujących zmian lokalnych ({{ syncService.pendingCount() }})
                </h3>

                @if (syncService.queue().length > 0) {
                  <button
                    type="button"
                    (click)="syncService.clearQueue()"
                    class="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <mat-icon class="text-xs">delete_sweep</mat-icon>
                    Wyczyść całą kolejkę
                  </button>
                }
              </div>

              @if (syncService.queue().length === 0) {
                <div class="p-8 text-center bg-slate-950/40 border border-slate-800/80 rounded-xl">
                  <mat-icon class="text-3xl text-emerald-400 mb-2">done_all</mat-icon>
                  <p class="text-sm font-semibold text-slate-200">Wszystkie dane są w pełni zsynchronizowane</p>
                  <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Każda notatka kancelaryjna lub sprawa zmodyfikowana w trybie offline automatycznie trafi do tej kolejki i zostanie natychmiast uzgodniona z bazą po wykryciu połączenia.
                  </p>
                </div>
              } @else {
                <div class="space-y-2.5">
                  @for (item of syncService.queue(); track item.id) {
                    <div
                      class="p-3.5 bg-slate-950/80 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      [class.border-slate-800]="item.status === 'pending'"
                      [class.border-amber-500/40]="item.status === 'syncing'"
                      [class.border-red-500/40]="item.status === 'failed'"
                    >
                      <div class="flex items-start gap-3">
                        <span
                          class="p-2 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                          [class.bg-sky-500/20]="item.entityType === 'note'"
                          [class.text-sky-300]="item.entityType === 'note'"
                          [class.bg-indigo-500/20]="item.entityType === 'case'"
                          [class.text-indigo-300]="item.entityType === 'case'"
                        >
                          <mat-icon class="text-base">{{ item.entityType === 'note' ? 'description' : 'folder' }}</mat-icon>
                        </span>

                        <div class="space-y-1">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span
                              class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                              [class.bg-emerald-500/20]="item.operation === 'CREATE'"
                              [class.text-emerald-300]="item.operation === 'CREATE'"
                              [class.border-emerald-500/30]="item.operation === 'CREATE'"
                              [class.bg-amber-500/20]="item.operation === 'UPDATE'"
                              [class.text-amber-300]="item.operation === 'UPDATE'"
                              [class.border-amber-500/30]="item.operation === 'UPDATE'"
                              [class.bg-rose-500/20]="item.operation === 'DELETE'"
                              [class.text-rose-300]="item.operation === 'DELETE'"
                              [class.border-rose-500/30]="item.operation === 'DELETE'"
                            >
                              {{ item.operation }}
                            </span>
                            <span class="text-xs font-bold text-slate-200">
                              {{ item.payload['title'] || item.entityId }}
                            </span>
                            <span class="text-[11px] text-slate-500 font-mono">
                              ID: {{ item.entityId }}
                            </span>
                          </div>

                          <div class="text-[11px] text-slate-400">
                            {{ formatTimestamp(item.timestamp) }}
                            @if (item.retryCount > 0) {
                              <span class="text-amber-400 ml-2">Próby ponowienia: {{ item.retryCount }}</span>
                            }
                            @if (item.errorMessage) {
                              <span class="text-rose-400 ml-2">Błąd: {{ item.errorMessage }}</span>
                            }
                          </div>
                        </div>
                      </div>

                      <!-- Przyciski akcji dla elementu kolejki -->
                      <div class="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          (click)="syncService.retryItem(item.id)"
                          class="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                          title="Ponów natychmiast"
                        >
                          <mat-icon class="text-xs text-amber-400">replay</mat-icon>
                          <span>Ponów</span>
                        </button>
                        <button
                          type="button"
                          (click)="syncService.discardQueueItem(item.id)"
                          class="px-2.5 py-1 text-xs bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                          title="Odrzuć operację"
                        >
                          <mat-icon class="text-xs">delete</mat-icon>
                          <span>Odrzuć</span>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Sekcja 2: Dziennik Zdarzeń Synchronizacji (Audit Log) -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <mat-icon class="text-sky-400 text-base">format_list_bulleted</mat-icon>
                  Dziennik zdarzeń uzgadniania (Sync Audit Log)
                </h3>

                @if (syncService.syncLog().length > 0) {
                  <button
                    type="button"
                    (click)="syncService.clearLogs()"
                    class="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Wyczyść dziennik
                  </button>
                }
              </div>

              <div class="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3 max-h-52 overflow-y-auto space-y-1.5 font-mono text-xs">
                @if (syncService.syncLog().length === 0) {
                  <p class="text-slate-600 text-center py-4">Brak wpisów w dzienniku synchronizacji.</p>
                }
                @for (log of syncService.syncLog(); track log.id) {
                  <div class="flex items-start gap-2 py-0.5 leading-snug">
                    <span class="text-slate-500 shrink-0">[{{ log.timestamp }}]</span>
                    <span
                      class="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0"
                      [class.bg-emerald-500/20]="log.type === 'success'"
                      [class.text-emerald-400]="log.type === 'success'"
                      [class.bg-sky-500/20]="log.type === 'info'"
                      [class.text-sky-400]="log.type === 'info'"
                      [class.bg-amber-500/20]="log.type === 'warning'"
                      [class.text-amber-400]="log.type === 'warning'"
                      [class.bg-rose-500/20]="log.type === 'error'"
                      [class.text-rose-400]="log.type === 'error'"
                    >
                      {{ log.type }}
                    </span>
                    <span class="text-slate-300 break-words flex-1">{{ log.message }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Sekcja 3: Zasady uzgadniania konfliktów (Conflict Resolution Strategy) -->
            <div class="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-2">
              <div class="font-bold text-slate-200 flex items-center gap-1.5">
                <mat-icon class="text-amber-400 text-sm">security</mat-icon>
                Strategia Bezpieczeństwa i Rozwiązywania Konfliktów (LWW + Audyt)
              </div>
              <p>
                Aplikacja wykorzystuje hybrydowy model <strong>Offline-First z optymistyczną aktualizacją interfejsu (Optimistic UI)</strong>. Wszelkie modyfikacje są natychmiast zapisywane w bezpiecznym magazynie przeglądarki, a po odzyskaniu łączności kolejka jest przetwarzana sekwencyjnie.
              </p>
              <p>
                W przypadku współbieżnych edycji z wielu urządzeń stosowana jest strategia <strong>Last-Write-Wins (LWW)</strong> z weryfikacją znaczników czasu i automatycznym wersjonowaniem bazy centralnej.
              </p>
            </div>
          </div>

          <!-- Stopka okna z przyciskiem zamknięcia -->
          <div class="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              (click)="syncService.closeModal()"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Zamknij okno
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineSyncManagerModal {
  readonly syncService = inject(OfflineSyncService);

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).id === 'offline-sync-modal-backdrop') {
      this.syncService.closeModal();
    }
  }

  formatTimestamp(epochMs: number): string {
    const d = new Date(epochMs);
    return d.toLocaleString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: 'numeric',
      month: 'short',
    });
  }
}
