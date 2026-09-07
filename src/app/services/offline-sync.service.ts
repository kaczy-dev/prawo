import { Injectable, computed, signal } from '@angular/core';
import {
  SyncConflict,
  SyncEntityType,
  SyncItemStatus,
  SyncLogEntry,
  SyncOperationType,
  SyncQueueItem,
} from '../models/legal.model';

@Injectable({
  providedIn: 'root',
})
export class OfflineSyncService {
  private readonly QUEUE_STORAGE_KEY = 'prawnbot_sync_queue_v1';
  private readonly LOGS_STORAGE_KEY = 'prawnbot_sync_logs_v1';
  private readonly LAST_SYNC_KEY = 'prawnbot_last_sync_time_v1';

  // Stan połączenia sieciowego
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly isSimulatedOffline = signal<boolean>(false);
  
  // Efektywny stan sieci (uwzględnia symulację offline dla testów)
  readonly effectiveOnline = computed(() => this.isOnline() && !this.isSimulatedOffline());

  // Kolejka operacji offline
  readonly queue = signal<SyncQueueItem[]>([]);
  readonly pendingCount = computed(() =>
    this.queue().filter((i) => i.status === 'pending' || i.status === 'failed').length
  );

  // Status procesu synchronizacji
  readonly isSyncing = signal<boolean>(false);
  readonly lastSyncTime = signal<string | null>(null);
  readonly syncLog = signal<SyncLogEntry[]>([]);
  readonly conflicts = signal<SyncConflict[]>([]);
  readonly isModalOpen = signal<boolean>(false);

  constructor() {
    this.initNetworkListeners();
    this.loadQueueFromStorage();
    this.loadLogsFromStorage();
    this.loadLastSyncTime();

    // Jeśli startujemy w trybie online i mamy oczekujące elementy, przeprowadź synchronizację
    if (this.effectiveOnline() && this.pendingCount() > 0) {
      setTimeout(() => this.syncPendingQueue(), 1200);
    }
  }

  // --- Inicjalizacja nasłuchiwania zdarzeń sieciowych przeglądarki ---
  private initNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.addLog('info', 'Wykryto przywrócenie połączenia z Internetem (zdarzenie online browsera).');
      if (this.effectiveOnline()) {
        this.syncPendingQueue();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      this.addLog('warning', 'Utracono połączenie sieciowe. Przełączono w bezpieczny tryb Offline-First.');
    });
  }

  // --- Przełącznik symulacji trybu Offline (dla wygody testowania) ---
  toggleSimulatedOffline(): void {
    const nextState = !this.isSimulatedOffline();
    this.isSimulatedOffline.set(nextState);

    if (nextState) {
      this.addLog('warning', 'Aktywowano symulację trybu OFFLINE. Wszystkie zmiany będą bezpiecznie kolejkowane lokalnie.');
    } else {
      this.addLog('success', 'Wyłączono symulację trybu offline. Przywrócono łączność z bazą główną.');
      if (this.effectiveOnline() && this.pendingCount() > 0) {
        this.syncPendingQueue();
      }
    }
  }

  // --- Dodawanie operacji do kolejki synchronizacji ---
  enqueueChange(
    entityType: SyncEntityType,
    operation: SyncOperationType,
    entityId: string,
    payload: Record<string, unknown> | object
  ): void {
    const normPayload = payload as Record<string, unknown>;
    const currentQueue = this.queue();

    // Optymalizacja kolejki: Sprawdź czy dla danego rekordu jest już oczekująca akcja
    const existingIndex = currentQueue.findIndex(
      (item) => item.entityId === entityId && (item.status === 'pending' || item.status === 'failed')
    );

    let updatedQueue: SyncQueueItem[];

    if (existingIndex !== -1) {
      const existing = currentQueue[existingIndex];

      if (existing.operation === 'CREATE' && operation === 'UPDATE') {
        // Zaktualizuj payload pierwotnego utworzenia
        const merged: SyncQueueItem = {
          ...existing,
          payload: { ...existing.payload, ...normPayload },
          timestamp: Date.now(),
        };
        updatedQueue = [...currentQueue];
        updatedQueue[existingIndex] = merged;
      } else if (existing.operation === 'CREATE' && operation === 'DELETE') {
        // Jeśli utworzono offline i usunięto offline, usuń całkowicie z kolejki
        updatedQueue = currentQueue.filter((_, idx) => idx !== existingIndex);
      } else {
        // Nadpisz kolejną operacją
        const newItem: SyncQueueItem = {
          id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          entityType,
          operation,
          entityId,
          payload: normPayload,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
        };
        updatedQueue = [...currentQueue.filter((_, idx) => idx !== existingIndex), newItem];
      }
    } else {
      const newItem: SyncQueueItem = {
        id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        entityType,
        operation,
        entityId,
        payload: normPayload,
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0,
      };
      updatedQueue = [...currentQueue, newItem];
    }

    this.queue.set(updatedQueue);
    this.saveQueueToStorage(updatedQueue);

    const entityName = entityType === 'note' ? 'Notatka' : 'Sprawa';
    const opName = operation === 'CREATE' ? 'utworzenie' : operation === 'UPDATE' ? 'edycja' : 'usunięcie';
    this.addLog(
      'info',
      `Zakolejkowano ${opName} (${entityName}: ${normPayload['title'] || entityId}). Status: ${this.effectiveOnline() ? 'synchronizacja w toku' : 'oczekuje na sieć'}.`,
      entityType,
      entityId,
      operation
    );

    // Jeśli jesteśmy online, uruchom natychmiast uzgadnianie
    if (this.effectiveOnline()) {
      this.syncPendingQueue();
    }
  }

  // --- Główna metoda uzgadniania (Reconciliation Engine) ---
  async syncPendingQueue(): Promise<boolean> {
    if (!this.effectiveOnline() || this.isSyncing()) {
      return false;
    }

    const pending = this.queue().filter((i) => i.status === 'pending' || i.status === 'failed');
    if (pending.length === 0) {
      this.updateLastSyncTime();
      return true;
    }

    this.isSyncing.set(true);
    this.addLog('info', `Rozpoczęto uzgadnianie ${pending.length} zakolejkowanych operacji z bazą centralną...`);

    try {
      // Oznacz jako syncing
      const updatedAsSyncing = this.queue().map((item) =>
        pending.some((p) => p.id === item.id) ? { ...item, status: 'syncing' as SyncItemStatus } : item
      );
      this.queue.set(updatedAsSyncing);

      // Żądanie do punktu końcowego serwera /api/sync/reconcile
      const response = await fetch('/api/sync/reconcile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: pending,
          clientTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Błąd odpowiedzi serwera (${response.status}: ${response.statusText})`);
      }

      const data = await response.json();

      if (data.success) {
        const processedIds: string[] = data.processedIds || [];

        // Usuń pomyślnie przetworzone z kolejki
        const remainingQueue = this.queue().filter((item) => !processedIds.includes(item.id));
        this.queue.set(remainingQueue);
        this.saveQueueToStorage(remainingQueue);

        this.updateLastSyncTime();
        this.addLog(
          'success',
          `Pomyślnie uzgodniono i zsynchronizowano ${processedIds.length} zmian z główną bazą danych.`
        );

        this.isSyncing.set(false);
        return true;
      } else {
        throw new Error(data.error || 'Nieznany błąd podczas uzgadniania bazy');
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.warn('Błąd podczas synchronizacji offline z serwerem:', err);

      // Przywróć status jako failed z inkrementacją retryCount
      const reverted = this.queue().map((item) => {
        if (pending.some((p) => p.id === item.id)) {
          return {
            ...item,
            status: 'failed' as SyncItemStatus,
            retryCount: item.retryCount + 1,
            errorMessage: err.message || 'Błąd połączenia',
          };
        }
        return item;
      });

      this.queue.set(reverted);
      this.saveQueueToStorage(reverted);

      this.addLog(
        'error',
        `Niepowodzenie synchronizacji: ${err.message || 'Brak łączności z serwerem centralnym'}. Zmiany pozostają bezpieczne w kolejce lokalnej.`
      );

      this.isSyncing.set(false);
      return false;
    }
  }

  // --- Ponowienie próby dla pojedynczego elementu ---
  retryItem(itemId: string): void {
    const updated = this.queue().map((i) =>
      i.id === itemId ? { ...i, status: 'pending' as SyncItemStatus, retryCount: 0 } : i
    );
    this.queue.set(updated);
    this.saveQueueToStorage(updated);
    if (this.effectiveOnline()) {
      this.syncPendingQueue();
    }
  }

  // --- Usunięcie elementu z kolejki bez synchronizacji ---
  discardQueueItem(itemId: string): void {
    const updated = this.queue().filter((i) => i.id !== itemId);
    this.queue.set(updated);
    this.saveQueueToStorage(updated);
    this.addLog('warning', `Ręcznie odrzucono operację z kolejki (ID: ${itemId}).`);
  }

  // --- Czyszczenie całej kolejki ---
  clearQueue(): void {
    this.queue.set([]);
    this.saveQueueToStorage([]);
    this.addLog('warning', 'Wyczyszczono wszystkie zakolejkowane operacje offline.');
  }

  // --- Zarządzanie logami ---
  addLog(
    type: SyncLogEntry['type'],
    message: string,
    entityType?: SyncEntityType,
    entityId?: string,
    operation?: SyncOperationType
  ): void {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newLog: SyncLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: timeStr,
      type,
      message,
      entityType,
      entityId,
      operation,
    };

    const updated = [newLog, ...this.syncLog()].slice(0, 30);
    this.syncLog.set(updated);
    this.saveLogsToStorage(updated);
  }

  clearLogs(): void {
    this.syncLog.set([]);
    this.saveLogsToStorage([]);
  }

  openModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  // --- Persystencja lokalna w localStorage ---
  private loadQueueFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(this.QUEUE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.queue.set(parsed);
        }
      }
    } catch (e) {
      console.warn('Błąd ładowania kolejki synchronizacji:', e);
    }
  }

  private saveQueueToStorage(items: SyncQueueItem[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.QUEUE_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Błąd zapisu kolejki synchronizacji:', e);
    }
  }

  private loadLogsFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = localStorage.getItem(this.LOGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.syncLog.set(parsed);
        }
      }
    } catch (e) {
      console.warn('Błąd ładowania logów synchronizacji:', e);
    }
  }

  private saveLogsToStorage(logs: SyncLogEntry[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Błąd zapisu logów synchronizacji:', e);
    }
  }

  private loadLastSyncTime(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const val = localStorage.getItem(this.LAST_SYNC_KEY);
      if (val) this.lastSyncTime.set(val);
    } catch (e) {
      console.warn('Błąd ładowania czasu synchronizacji:', e);
    }
  }

  private updateLastSyncTime(): void {
    const now = new Date();
    const formatted = now.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this.lastSyncTime.set(formatted);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.LAST_SYNC_KEY, formatted);
    }
  }
}
