import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CryptoService } from '../services/crypto.service';

@Component({
  selector: 'app-vault-modal',
  imports: [CommonModule, MatIconModule],
  template: `
    @if (isOpen()) {
      <div
        id="modal-crypto-vault"
        class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <mat-icon class="text-xl">lock</mat-icon>
              </div>
              <h3 class="font-bold text-white text-base">Skarbiec Notatek (AES-256-GCM)</h3>
            </div>
            <button
              (click)="onClose()"
              class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Zamknij"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <p class="text-xs text-slate-400 leading-relaxed">
            Wpisz hasło główne kancelarii. Klucz szyfrujący zostanie wyprowadzony lokalnie algorytmem
            <strong class="text-amber-300 font-mono">PBKDF2 (100 000 rund, SHA-256)</strong>.
            Żadne dane ani hasło nie opuszczają Twojego urządzenia.
          </p>

          @if (errorMessage()) {
            <div class="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-1.5">
              <mat-icon class="text-sm text-red-400">error</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <div>
            <label for="input-vault-password" class="block text-xs font-semibold text-slate-300 mb-1">
              Hasło główne skarbca:
            </label>
            <input
              id="input-vault-password"
              type="password"
              [value]="passwordInput()"
              (input)="passwordInput.set($any($event.target).value)"
              (keydown.enter)="handleAuth()"
              placeholder="Wpisz min. 4 znaki..."
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              (click)="onClose()"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Anuluj
            </button>
            <button
              id="btn-submit-vault-auth"
              (click)="handleAuth()"
              class="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <mat-icon class="text-xs">key</mat-icon>
              <span>Odblokuj Skarbiec</span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VaultModal {
  private readonly cryptoService = inject(CryptoService);

  readonly isOpen = input<boolean>(true);
  readonly closeModal = output<void>();

  readonly passwordInput = signal<string>('');
  readonly errorMessage = signal<string | null>(null);

  onClose(): void {
    this.passwordInput.set('');
    this.errorMessage.set(null);
    this.closeModal.emit();
  }

  async handleAuth(): Promise<void> {
    const pwd = this.passwordInput().trim();
    if (pwd.length < 4) {
      this.errorMessage.set('Hasło musi mieć co najmniej 4 znaki.');
      return;
    }

    const success = await this.cryptoService.login(pwd);
    if (success) {
      this.onClose();
    } else {
      this.errorMessage.set('Nieprawidłowe hasło skarbca lokalnego.');
    }
  }
}
