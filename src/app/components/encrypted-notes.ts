import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CourtRuling, EncryptedNote, PenalArticle } from '../models/legal.model';
import { LegalDataService } from '../services/legal-data.service';
import { CryptoService } from '../services/crypto.service';
import { PdfExportService } from '../services/pdf-export.service';
import { SpeechDictationService } from '../services/speech-dictation.service';

@Component({
  selector: 'app-encrypted-notes',
  imports: [CommonModule, MatIconModule],
  template: `
    <section id="section-notes" class="space-y-6">
      <!-- Nagłówek i status skarbca (Warm Obsidian & Gilded Seal Header) -->
      <div class="relative overflow-hidden bg-gradient-to-b from-[#141928] via-[#0f1422] to-[#0a0d16] border border-amber-500/25 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/60 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        <!-- Złota linia akcentująca u góry karty -->
        <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"></div>

        <div class="relative z-10 max-w-2xl">
          <div class="flex items-center gap-2.5 mb-2 flex-wrap">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-900/30 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <mat-icon class="text-lg">lock</mat-icon>
            </div>
            <h2 class="text-lg sm:text-xl font-serif font-bold text-white tracking-wide flex items-center gap-2 drop-shadow-sm">
              Notatnik Kancelaryjny <span class="text-amber-400 font-sans font-normal text-xs sm:text-sm tracking-normal">(AES-256-GCM)</span>
            </h2>

            <!-- Pieczęć kryptograficzna / Stan Sejfu -->
            @if (cryptoService.isAuthenticated()) {
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/70 border border-emerald-400/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                title="Kryptograficzny skarbiec odblokowany. Szyfrowanie po stronie klienta."
                role="status"
              >
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>AES-GCM Sejf Aktywny</span>
              </span>
            } @else {
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/60 border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                title="Notatnik działa w lokalnej pamięci. Kliknij 'Odblokuj Sejf', aby zaszyfrować dane hasłem."
                role="status"
              >
                <mat-icon class="text-xs text-amber-400">lock_open</mat-icon>
                <span>Tryb lokalny jawny</span>
              </span>
            }
          </div>
          <p class="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
            Wszystkie tezy obrończe, notatki ze spotkań oraz dane objęte tajemnicą adwokacką są przetwarzane w 100% lokalnie.
            Wbudowane <strong class="text-amber-300 font-semibold">inteligentne dyktowanie głosem (Web Speech API)</strong> automatycznie formatuje terminologię k.k. i k.p.k.
          </p>
        </div>

        <div class="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <input #backupFileInput type="file" accept=".json" class="hidden" (change)="handleBackupFile($event)" />

          <button
            type="button"
            (click)="downloadVaultBackup()"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#111624] hover:bg-[#1a2136] text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            title="Eksportuj zaszyfrowaną kopię zapasową wszystkich notatek do pliku JSON"
            aria-label="Pobierz kopię zapasową skarbca"
          >
            <mat-icon class="text-sm">file_download</mat-icon>
            <span>Kopia (.json)</span>
          </button>

          <button
            type="button"
            (click)="triggerImportBackup(backupFileInput)"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#111624] hover:bg-[#1a2136] text-slate-200 border border-slate-700/80 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            title="Przywróć notatki z pliku kopii zapasowej JSON"
            aria-label="Przywróć notatki z pliku JSON"
          >
            <mat-icon class="text-sm">file_upload</mat-icon>
            <span>Przywróć</span>
          </button>

          <button
            type="button"
            (click)="navigateToCases.emit()"
            class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#111624] hover:bg-[#1a2136] text-slate-200 border border-slate-700/80 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            title="Powrót do dossier i aktywnych spraw"
            aria-label="Powrót do dossier i aktywnych spraw"
          >
            <mat-icon class="text-sm text-amber-400">arrow_back</mat-icon>
            <span>Dossier</span>
          </button>

          @if (!showNoteForm()) {
            <button
              id="btn-create-new-note"
              type="button"
              (click)="resetNoteForm(); showNoteForm.set(true)"
              class="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-amber-500/25 border border-amber-300/40 transition-all cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              aria-label="Utwórz nową notatkę procesową"
            >
              <mat-icon class="text-base">add</mat-icon>
              <span>Nowa Notatka</span>
            </button>
          }
        </div>
      </div>

      <!-- Formularz tworzenia / edycji notatki (Judicial Docket Form) -->
      @if (showNoteForm()) {
        <div class="relative overflow-hidden bg-gradient-to-b from-[#141828] to-[#0d101a] border border-amber-500/35 rounded-2xl p-5 sm:p-7 shadow-2xl shadow-black/70 space-y-5 animate-fade-in">
          <!-- Dekoracyjny pasek aktowy -->
          <div class="flex items-center justify-between border-b border-amber-500/20 pb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300">
                <mat-icon class="text-base">edit_note</mat-icon>
              </div>
              <h3 class="text-sm sm:text-base font-serif font-bold text-amber-200 tracking-wide">
                {{ editingNoteId() ? 'Edycja Notatki Sprawy' : 'Sporządzanie Nowego Dokumentu / Notatki' }}
              </h3>
            </div>
            <button
              type="button"
              (click)="resetNoteForm()"
              class="text-slate-300 hover:text-white text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-700 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              aria-label="Anuluj edycję notatki"
            >
              <mat-icon class="text-sm">close</mat-icon>
              <span>Anuluj</span>
            </button>
          </div>

          <!-- Banner informacyjny o aktywnym dyktowaniu (Acoustic Indicator) -->
          @if (speech.isListening() && (speech.activeTarget() === 'note-title' || speech.activeTarget() === 'note-content')) {
            <div
              class="p-3.5 rounded-xl bg-gradient-to-r from-red-950/60 via-amber-950/50 to-red-950/60 border border-amber-500/40 flex items-center justify-between gap-3 text-xs text-amber-200 shadow-lg shadow-black/40"
              role="region"
              aria-live="polite"
              aria-label="Panel dyktowania mowy"
            >
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1">
                  <span class="w-1 h-3.5 bg-red-500 rounded-full animate-pulse"></span>
                  <span class="w-1 h-5 bg-amber-400 rounded-full animate-pulse delay-75"></span>
                  <span class="w-1 h-3.5 bg-red-500 rounded-full animate-pulse delay-150"></span>
                </div>
                <div>
                  <div class="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>Rejestracja mowy w toku: {{ speech.activeTarget() === 'note-title' ? 'Tytuł / Sygnatura' : 'Treść merytoryczna' }}</span>
                  </div>
                  <div class="italic text-slate-100 mt-0.5 max-w-xl truncate">
                    „{{ speech.currentInterim() || 'Mów do mikrofonu (polski słownik prawny)...' }}”
                  </div>
                </div>
              </div>
              <button
                type="button"
                (click)="speech.stop()"
                class="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg border border-red-400/50 cursor-pointer text-xs font-semibold flex items-center gap-1 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                aria-label="Zatrzymaj dyktowanie głosem"
              >
                <mat-icon class="text-xs">stop</mat-icon>
                <span>Zakończ</span>
              </button>
            </div>
          }

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Tytuł notatki z dyktowaniem -->
            <div class="md:col-span-2 space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="input-note-title" class="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>Tytuł notatki / Sygnatura akt:</span>
                  <span class="text-amber-400">*</span>
                </label>
                <button
                  type="button"
                  (click)="toggleTitleDictation()"
                  [class]="isDictatingTitle()
                    ? 'text-red-400 font-bold bg-red-950/50 border border-red-500/40 px-2 py-0.5 rounded-md'
                    : 'text-slate-300 hover:text-amber-300 px-2 py-0.5 rounded-md hover:bg-slate-800'"
                  class="text-[11px] flex items-center gap-1 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  title="Dyktuj tytuł notatki za pomocą mikrofonu"
                  aria-label="Dyktuj tytuł notatki"
                >
                  <mat-icon class="text-xs">{{ isDictatingTitle() ? 'mic' : 'mic_none' }}</mat-icon>
                  <span>{{ isDictatingTitle() ? 'Słucham...' : 'Dyktuj tytuł' }}</span>
                </button>
              </div>
              <input
                id="input-note-title"
                type="text"
                [value]="noteTitle()"
                (input)="noteTitle.set($any($event.target).value)"
                placeholder="np. Kowalski Jan – Obrona z art. 178a k.k., badanie alkomatem"
                class="w-full bg-[#0a0d16] border border-slate-700 hover:border-amber-500/50 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30 transition-all shadow-inner"
              />
            </div>

            <!-- Kategoria -->
            <div class="space-y-1.5">
              <label for="select-note-category" class="block text-xs font-semibold text-slate-200">Kategoria aktowa:</label>
              <select
                id="select-note-category"
                [value]="noteCategory()"
                (change)="noteCategory.set($any($event.target).value)"
                class="w-full bg-[#0a0d16] border border-slate-700 hover:border-amber-500/50 focus:border-amber-400 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30 cursor-pointer transition-all shadow-inner"
              >
                <option value="Sprawa klienta">Sprawa klienta</option>
                <option value="Analiza prawna">Analiza prawna</option>
                <option value="Wniosek dowodowy">Wniosek dowodowy</option>
                <option value="Notatka z rozprawy">Notatka z rozprawy</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Powiązany artykuł -->
            <div class="space-y-1.5">
              <label for="input-note-linked-art" class="block text-xs font-semibold text-slate-200">Powiązany artykuł k.k. / k.p.k.:</label>
              <input
                id="input-note-linked-art"
                type="text"
                [value]="noteLinkedArticle()"
                (input)="noteLinkedArticle.set($any($event.target).value)"
                placeholder="np. Art. 178a § 1 k.k."
                class="w-full bg-[#0a0d16] border border-slate-700 hover:border-amber-500/50 focus:border-amber-400 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30 transition-all shadow-inner"
              />
            </div>

            <!-- Tagi -->
            <div class="md:col-span-2 space-y-1.5">
              <label for="input-note-tags" class="block text-xs font-semibold text-slate-200">Tagi wyszukiwawcze (oddzielone przecinkami):</label>
              <input
                id="input-note-tags"
                type="text"
                [value]="noteTagsInput()"
                (input)="noteTagsInput.set($any($event.target).value)"
                placeholder="np. alkomat, konfiskata pojazdu, linia obrony, świadek kluczowy"
                class="w-full bg-[#0a0d16] border border-slate-700 hover:border-amber-500/50 focus:border-amber-400 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30 transition-all shadow-inner"
              />
            </div>
          </div>

          <!-- Pasek szablonów procesowych ("Docket Stamps" Bar) -->
          <div class="p-3 bg-[#0a0d16] rounded-xl border border-amber-500/20 shadow-inner">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-serif font-semibold text-amber-300 flex items-center gap-1.5">
                <mat-icon class="text-xs text-amber-400">history_edu</mat-icon>
                <span>Przybornik Pism Procesowych (Wstaw Szablon):</span>
              </span>
              <span class="text-[10px] text-slate-400 hidden sm:inline">Gotowa struktura wniosków i memorandów</span>
            </div>
            <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
              <button
                type="button"
                (click)="applyTemplate('wniosek-uzasadnienie')"
                class="px-3 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 hover:text-amber-100 text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                title="Wstaw wniosek o sporządzenie i doręczenie uzasadnienia wyroku (art. 422 k.p.k. - termin zawity 7 dni)"
              >
                <mat-icon class="text-xs text-amber-400">schedule</mat-icon>
                <span>Uzasadnienie wyroku (art. 422 k.p.k.)</span>
              </button>

              <button
                type="button"
                (click)="applyTemplate('sprzeciw-nakazowy')"
                class="px-3 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 hover:text-amber-100 text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                title="Wstaw sprzeciw od wyroku nakazowego (art. 506 k.p.k. - termin 7 dni)"
              >
                <mat-icon class="text-xs text-amber-400">cancel</mat-icon>
                <span>Sprzeciw od nakazowego (art. 506 k.p.k.)</span>
              </button>

              <button
                type="button"
                (click)="applyTemplate('zazalenie-areszt')"
                class="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 hover:text-rose-100 text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                title="Wstaw zażalenie na postanowienie o zastosowaniu tymczasowego aresztowania (art. 252 k.p.k.)"
              >
                <mat-icon class="text-xs text-rose-400">lock_reset</mat-icon>
                <span>Zażalenie na areszt (art. 252 k.p.k.)</span>
              </button>

              <button
                type="button"
                (click)="applyTemplate('dobrowolne-podst')"
                class="px-3 py-1.5 rounded-lg bg-[#14192b] hover:bg-[#1d243d] border border-amber-500/30 hover:border-amber-400 text-slate-200 hover:text-amber-200 text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                title="Wstaw wniosek o dobrowolne poddanie się odpowiedzialności karnej (art. 387 k.p.k.)"
              >
                <mat-icon class="text-xs text-amber-400">handshake</mat-icon>
                <span>Dobrowolne skazanie (art. 387 k.p.k.)</span>
              </button>

              <button
                type="button"
                (click)="applyTemplate('warunkowe-umorzenie')"
                class="px-3 py-1.5 rounded-lg bg-[#14192b] hover:bg-[#1d243d] border border-amber-500/30 hover:border-amber-400 text-slate-200 hover:text-amber-200 text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                title="Wstaw strukturę wniosku o warunkowe umorzenie postępowania (art. 66 k.k.)"
              >
                <mat-icon class="text-xs text-amber-400">verified</mat-icon>
                <span>Warunkowe umorzenie (art. 66)</span>
              </button>

              <button
                type="button"
                (click)="applyTemplate('wniosek-dowodowy')"
                class="px-3 py-1.5 rounded-lg bg-[#14192b] hover:bg-[#1d243d] border border-amber-500/30 hover:border-amber-400 text-slate-200 hover:text-amber-200 text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                title="Wstaw wniosek dowodowy o dopuszczenie dowodu (art. 169 k.p.k.)"
              >
                <mat-icon class="text-xs text-amber-400">inventory</mat-icon>
                <span>Wniosek dowodowy (art. 169 k.p.k.)</span>
              </button>

              <button
                type="button"
                (click)="applyTemplate('zazalenie-zatrzymanie')"
                class="px-3 py-1.5 rounded-lg bg-[#14192b] hover:bg-[#1d243d] border border-amber-500/30 hover:border-amber-400 text-slate-200 hover:text-amber-200 text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                title="Wstaw wzór zażalenia na zatrzymanie prawa jazdy / pojazdu"
              >
                <mat-icon class="text-xs text-amber-400">warning_amber</mat-icon>
                <span>Zażalenie (zatrzymanie prawa jazdy)</span>
              </button>

              <button
                type="button"
                (click)="applyTemplate('nadzwyczajne-zlagodzenie')"
                class="px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 hover:text-emerald-100 text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                title="Wstaw wniosek o nadzwyczajne złagodzenie kary (art. 60 § 2 k.k.)"
              >
                <mat-icon class="text-xs text-emerald-400">trending_down</mat-icon>
                <span>Nadzwyczajne złagodzenie (art. 60)</span>
              </button>

              <button
                type="button"
                (click)="applyTemplate('umorzenie-narkotyki')"
                class="px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 hover:text-emerald-100 text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                title="Wstaw wniosek o umorzenie z art. 62a UoPN (posiadanie nieznacznej ilości)"
              >
                <mat-icon class="text-xs text-emerald-400">eco</mat-icon>
                <span>Umorzenie art. 62a UoPN</span>
              </button>

              <button
                type="button"
                (click)="applyTemplate('linia-obrony')"
                class="px-3 py-1.5 rounded-lg bg-[#14192b] hover:bg-[#1d243d] border border-amber-500/30 hover:border-amber-400 text-slate-200 hover:text-amber-200 text-xs whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                title="Wstaw konspekt memorandum strategii procesowej"
              >
                <mat-icon class="text-xs text-amber-400">shield</mat-icon>
                <span>Memorandum linii obrony</span>
              </button>
            </div>
          </div>

          <!-- Treść notatki z dyktowaniem Web Speech API -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label for="textarea-note-content" class="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span>Treść merytoryczna / Ustalenia z klientem / Tezy obrończe:</span>
                <span class="text-amber-400">*</span>
              </label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="toggleContentDictation()"
                  [class]="isDictatingContent()
                    ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-md shadow-red-500/40 border border-red-300/50'
                    : 'bg-[#14192b] hover:bg-[#1e253e] text-slate-200 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/50'"
                  class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  [title]="isDictatingContent() ? 'Zatrzymaj dyktowanie' : 'Dyktuj treść notatki głosem (Web Speech API)'"
                  aria-label="Dyktuj treść notatki głosem"
                >
                  <mat-icon class="text-xs text-amber-400">{{ isDictatingContent() ? 'mic' : 'mic_none' }}</mat-icon>
                  <span>{{ isDictatingContent() ? 'Zatrzymaj dyktowanie' : 'Dyktuj głosem (pl-PL)' }}</span>
                </button>
              </div>
            </div>

            <div class="relative">
              <textarea
                id="textarea-note-content"
                rows="9"
                [value]="noteContent()"
                (input)="noteContent.set($any($event.target).value)"
                placeholder="Wpisz treść lub naciśnij 'Dyktuj głosem' i dyktuj swobodnie. System automatycznie rozpoznaje komendy: 'kropka', 'przecinek', 'nowy akapit', 'artykuł 178a', 'paragraf 1'..."
                class="w-full bg-[#0a0d16] border border-slate-700 hover:border-amber-500/50 focus:border-amber-400 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30 font-sans leading-relaxed transition-all shadow-inner"
              ></textarea>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
              <div class="flex items-center gap-1.5">
                <mat-icon class="text-xs text-amber-400">tips_and_updates</mat-icon>
                <span>Komendy głosowe: <em class="text-slate-300">„kropka”</em>, <em class="text-slate-300">„przecinek”</em>, <em class="text-slate-300">„nowy akapit”</em>, <em class="text-slate-300">„artykuł [nr]”</em>, <em class="text-slate-300">„paragraf [nr]”</em></span>
              </div>
              <span class="font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{{ noteContent().length }} znaków</span>
            </div>
          </div>

          <!-- Przyciski akcji (Tactile Action Buttons) -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-amber-500/20">
            <button
              type="button"
              (click)="resetNoteForm()"
              class="px-4 py-2.5 bg-[#111624] hover:bg-[#1a2136] text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700/80 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              Anuluj
            </button>
            <button
              id="btn-save-note"
              type="button"
              (click)="saveCurrentNote()"
              [disabled]="!noteTitle().trim() || !noteContent().trim()"
              class="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/25 border border-amber-300/40 transition-all cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            >
              <mat-icon class="text-sm">save</mat-icon>
              <span>Zapisz w Skarbcu</span>
            </button>
          </div>
        </div>
      }

      <!-- Filtry i wyszukiwarka notatek (Judicial Docket Filters) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-gradient-to-r from-[#101423] to-[#0c0f1a] p-3.5 rounded-xl border border-slate-800/90 shadow-md">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <span class="text-xs font-semibold text-slate-300 whitespace-nowrap flex items-center gap-1 mr-1">
            <mat-icon class="text-xs text-amber-400">filter_alt</mat-icon>
            <span>Kategoria:</span>
          </span>
          <button
            type="button"
            (click)="selectedCategoryFilter.set('all')"
            [class]="selectedCategoryFilter() === 'all'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm font-semibold'
              : 'bg-[#0a0d16] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'"
            class="text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            Wszystkie ({{ legalData.notes().length }})
          </button>
          <button
            type="button"
            (click)="selectedCategoryFilter.set('Sprawa klienta')"
            [class]="selectedCategoryFilter() === 'Sprawa klienta'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm font-semibold'
              : 'bg-[#0a0d16] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'"
            class="text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            Sprawy klienta
          </button>
          <button
            type="button"
            (click)="selectedCategoryFilter.set('Analiza prawna')"
            [class]="selectedCategoryFilter() === 'Analiza prawna'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm font-semibold'
              : 'bg-[#0a0d16] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'"
            class="text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            Analizy prawne
          </button>
          <button
            type="button"
            (click)="selectedCategoryFilter.set('Wniosek dowodowy')"
            [class]="selectedCategoryFilter() === 'Wniosek dowodowy'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm font-semibold'
              : 'bg-[#0a0d16] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'"
            class="text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            Wnioski dowodowe
          </button>
        </div>

        <div class="relative w-full sm:w-72">
          <mat-icon class="absolute left-3 top-2.5 text-amber-400/80 text-sm pointer-events-none">search</mat-icon>
          <input
            type="text"
            [value]="notesSearchQuery()"
            (input)="notesSearchQuery.set($any($event.target).value)"
            placeholder="Szukaj w aktach i notatkach..."
            class="w-full pl-9 pr-3.5 py-1.5 bg-[#0a0d16] border border-slate-700 hover:border-amber-500/50 focus:border-amber-400 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30 transition-all shadow-inner"
            aria-label="Wyszukaj w notatkach kancelaryjnych"
          />
        </div>
      </div>

      <!-- Siatka notatek (Warm Obsidian Judicial Dossier Cards) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        @for (note of filteredNotes(); track note.id) {
          <div class="group relative overflow-hidden bg-gradient-to-b from-[#131828] to-[#0c0f1a] border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:shadow-black/60 transition-all flex flex-col justify-between">
            <!-- Akcentowa złota krawędź lewa -->
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500/60 via-amber-600/30 to-transparent group-hover:from-amber-400 group-hover:via-amber-500 transition-all"></div>

            <div>
              <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3.5">
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#0a0d16] border border-amber-500/30 text-amber-300">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>{{ note.category }}</span>
                </span>
                <span class="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <mat-icon class="text-xs text-slate-500">schedule</mat-icon>
                  <span>{{ note.updatedAt }}</span>
                </span>
              </div>

              <h4 class="text-sm sm:text-base font-serif font-bold text-white group-hover:text-amber-200 transition-colors mb-2.5 leading-snug">
                {{ note.title }}
              </h4>

              @if (note.linkedArticle) {
                <div class="mb-3">
                  <span class="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-500/30 font-mono font-medium shadow-sm">
                    <mat-icon class="text-xs">gavel</mat-icon>
                    <span>{{ note.linkedArticle }}</span>
                  </span>
                </div>
              }

              <!-- Blok treści notatki imitujący wyciąg z akt sprawy -->
              <p class="text-xs sm:text-sm text-slate-300 whitespace-pre-line line-clamp-5 mb-4 leading-relaxed bg-[#0a0d16]/90 p-3.5 rounded-xl border border-slate-800/80 shadow-inner font-sans selection:bg-amber-500/30">
                {{ note.content }}
              </p>

              @if (note.tags.length > 0) {
                <div class="flex flex-wrap gap-1.5 mb-4">
                  @for (tag of note.tags; track tag) {
                    <span class="text-[10px] bg-[#101423] text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md font-mono">
                      #{{ tag }}
                    </span>
                  }
                </div>
              }
            </div>

            <!-- Pasek akcji: Eksport do PDF, Edycja, Usunięcie -->
            <div class="flex items-center justify-between gap-2 pt-3.5 border-t border-slate-800/80">
              <button
                type="button"
                (click)="exportNoteToPdf(note)"
                class="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 hover:border-amber-400/60 text-amber-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                title="Pobierz oficjalny odpis notatki w formacie PDF"
                aria-label="Pobierz odpis notatki w formacie PDF"
              >
                <mat-icon class="text-sm text-amber-400">picture_as_pdf</mat-icon>
                <span>Eksportuj do PDF</span>
              </button>

              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  (click)="editNote(note)"
                  class="text-slate-300 hover:text-amber-300 p-2 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  title="Edytuj treść notatki"
                  aria-label="Edytuj treść notatki"
                >
                  <mat-icon class="text-sm">edit</mat-icon>
                </button>
                <button
                  type="button"
                  (click)="deleteNote(note.id)"
                  class="text-slate-400 hover:text-red-400 p-2 rounded-xl hover:bg-red-950/40 border border-transparent hover:border-red-900/50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                  title="Usuń notatkę z sejfu"
                  aria-label="Usuń notatkę z sejfu"
                >
                  <mat-icon class="text-sm">delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="md:col-span-2 text-center py-14 px-4 text-slate-400 text-sm bg-[#0c0f1a]/80 rounded-2xl border border-dashed border-amber-500/25 shadow-inner">
            <mat-icon class="text-3xl text-amber-400/60 mb-2">inventory_2</mat-icon>
            <p class="font-serif font-bold text-base text-slate-200 mb-1">Brak zapisanych notatek w dossier</p>
            <p class="text-xs text-slate-400 max-w-md mx-auto">
              Utwórz nową notatkę sprawy lub podyktuj ustalenia z klientem za pomocą przycisku <strong class="text-amber-300">„Nowa Notatka”</strong> powyżej.
            </p>
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncryptedNotes {
  readonly legalData = inject(LegalDataService);
  readonly cryptoService = inject(CryptoService);
  readonly pdfService = inject(PdfExportService);
  readonly speech = inject(SpeechDictationService);

  readonly requestUnlockVault = output<void>();
  readonly navigateToCases = output<void>();

  readonly showNoteForm = signal<boolean>(false);
  readonly editingNoteId = signal<string | null>(null);
  readonly noteTitle = signal<string>('');
  readonly noteCategory = signal<EncryptedNote['category']>('Sprawa klienta');
  readonly noteLinkedArticle = signal<string>('');
  readonly noteContent = signal<string>('');
  readonly noteTagsInput = signal<string>('');

  readonly selectedCategoryFilter = signal<string>('all');
  readonly notesSearchQuery = signal<string>('');

  readonly filteredNotes = computed(() => {
    const cat = this.selectedCategoryFilter();
    const query = this.notesSearchQuery().toLowerCase().trim();
    let list = this.legalData.notes();

    if (cat !== 'all') {
      list = list.filter((n) => n.category === cat);
    }

    if (query) {
      list = list.filter((n) =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        (n.linkedArticle && n.linkedArticle.toLowerCase().includes(query)) ||
        n.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return list;
  });

  insertTemplate(tmpl: string): void {
    this.showNoteForm.set(true);
    if (tmpl === 'art66' || tmpl === 'warunkowe-umorzenie') {
      this.applyTemplate('warunkowe-umorzenie');
    } else if (tmpl === 'art60' || tmpl === 'nadzwyczajne-zlagodzenie') {
      this.applyTemplate('nadzwyczajne-zlagodzenie');
    } else if (tmpl === 'uopn62a' || tmpl === 'umorzenie-narkotyki') {
      this.applyTemplate('umorzenie-narkotyki');
    } else if (tmpl === 'art169' || tmpl === 'wniosek-dowodowy') {
      this.applyTemplate('wniosek-dowodowy');
    } else if (tmpl === 'driving' || tmpl === 'zazalenie-zatrzymanie') {
      this.applyTemplate('zazalenie-zatrzymanie');
    } else {
      this.applyTemplate('linia-obrony');
    }
  }

  applyTemplate(type: 'warunkowe-umorzenie' | 'nadzwyczajne-zlagodzenie' | 'umorzenie-narkotyki' | 'wniosek-dowodowy' | 'zazalenie-zatrzymanie' | 'linia-obrony' | 'wniosek-uzasadnienie' | 'sprzeciw-nakazowy' | 'zazalenie-areszt' | 'dobrowolne-podst'): void {
    switch (type) {
      case 'wniosek-uzasadnienie':
        this.noteTitle.set('Wniosek o sporządzenie i doręczenie uzasadnienia wyroku (art. 422 k.p.k.)');
        this.noteCategory.set('Sprawa klienta');
        this.noteLinkedArticle.set('Art. 422 § 1 k.p.k.');
        this.noteTagsInput.set('uzasadnienie, art 422 kpk, termin zawity, wyrok, zapowiedź apelacji');
        this.noteContent.set(
`SĄD REJONOWY W: [Miejscowość]
Wydział [Numer, np. II] Karny
Sygn. akt: [Sygnatura akt sprawy]

Oskarżony: [Imię i Nazwisko]
Obrońca: [Imię i Nazwisko Adwokata/Radcy Prawnego]

WNIOSEK O SPORZĄDZENIE I DORĘCZENIE UZASADNIENIA WYROKU
(art. 422 § 1 i § 2 k.p.k.)

Działając w imieniu oskarżonego, wnoszę o:
1. Sporządzenie na piśmie uzasadnienia wyroku tutejszego Sądu wydanego i ogłoszonego w dniu [Data ogłoszenia wyroku].
2. Doręczenie odpisu wyroku wraz z pisemnym uzasadnieniem na adres kancelarii obrońcy.

Wskazuję, iż wniosek dotyczy uzasadnienia wyroku w całości / w części dotyczącej rozstrzygnięcia o karze.

[Miejscowość, Data] ____________________________
(podpis obrońcy / oskarżonego)`
        );
        break;

      case 'sprzeciw-nakazowy':
        this.noteTitle.set('Sprzeciw od wyroku nakazowego (art. 506 k.p.k.)');
        this.noteCategory.set('Sprawa klienta');
        this.noteLinkedArticle.set('Art. 506 § 1 k.p.k.');
        this.noteTagsInput.set('sprzeciw, wyrok nakazowy, art 506 kpk, utrata mocy, rozprawa');
        this.noteContent.set(
`SĄD REJONOWY W: [Miejscowość]
Wydział [Numer] Karny
Sygn. akt: [Sygnatura sprawy, np. II K ...]

Oskarżony: [Imię i Nazwisko, PESEL, Adres]

SPRZECIW OD WYROKU NAKAZOWEGO
(art. 506 § 1 k.p.k.)

Działając osobiście / przez ustanowionego obrońcę, niniejszym:
WNIOŚCIE SPRZECIW
od wyroku nakazowego Sądu Rejonowego w [Miejscowość] z dnia [Data wydania wyroku], sygn. akt [Sygnatura], doręczonego w dniu [Data doręczenia].

UZASADNIENIE
Oskarżony nie zgadza się z przypisanym mu czynem oraz wymierzoną karą. Okoliczności czynu oraz wina budzą istotne wątpliwości wymagające przeprowadzenia postępowania dowodowego na rozprawie głównej (art. 500 § 1 k.p.k. a contrario).
Zgodnie z art. 506 § 3 k.p.k. w razie wniesienia sprzeciwu wyrok nakazowy traci moc, a sprawa podlega rozpoznaniu na zasadach ogólnych.

[Miejscowość, Data] ____________________________
(podpis)`
        );
        break;

      case 'zazalenie-areszt':
        this.noteTitle.set('Zażalenie na postanowienie o zastosowaniu tymczasowego aresztowania (art. 252 k.p.k.)');
        this.noteCategory.set('Sprawa klienta');
        this.noteLinkedArticle.set('Art. 252 § 1 w zw. z art. 257/258 k.p.k.');
        this.noteTagsInput.set('zażalenie, areszt, art 252 kpk, art 257 kpk, poręczenie, wolność');
        this.noteContent.set(
`SĄD OKRĘGOWY W: [Miejscowość]
Wydział Karny Odwoławczy
za pośrednictwem: Sąd Rejonowy w [Miejscowość]
Sygn. akt: [Sygnatura sprawy aresztowej, np. II Kp ...]

Podejrzany: [Imię i Nazwisko]
Obrońca: [Imię i Nazwisko Adwokata]

ZAŻALENIE OBROŃCY NA POSTANOWIENIE O ZASTOSOWANIU TYMCZASOWEGO ARESZTOWANIA
(art. 252 § 1 k.p.k. w zw. z art. 460 k.p.k.)

Działając jako obrońca podejrzanego, zaskarżam w całości postanowienie Sądu Rejonowego w [Miejscowość] z dnia [Data], w przedmiocie zastosowania tymczasowego aresztowania na okres [np. 3 miesięcy].

ZARZUTY:
1. Obrazę przepisów postępowania, tj. art. 257 § 1 k.p.k. (zasady subsydiarności), poprzez błędne uznanie, że jedynie izolacyjny środek zapobiegawczy zabezpieczy prawidłowy tok śledztwa, podczas gdy w pełni wystarczające byłoby orzeczenie dozoru Policji i poręczenia majątkowego.
2. Naruszenie art. 258 § 1 pkt 2 k.p.k. poprzez bezpodstawne przyjęcie obawy matactwa w sytuacji, gdy kluczowe dowody z dokumentów i nośników zostały już zabezpieczone.
3. Naruszenie art. 259 § 1 k.p.k. poprzez pominięcie okoliczności, że pozbawienie wolności pociągnie za sobą wyjątkowo ciężkie skutki dla chorej matki podejrzanego, nad którą sprawuje wyłączną opiekę.

WNIOSEK:
Wnoszę o zmianę zaskarżonego postanowienia poprzez uchylenie tymczasowego aresztowania, ewentualnie zastosowanie w jego miejsce środków o charakterze nieizolacyjnym (art. 266 k.p.k. oraz art. 275 k.p.k.).`
        );
        break;

      case 'dobrowolne-podst':
        this.noteTitle.set('Wniosek o wydanie wyroku skazującego bez postępowania dowodowego (art. 387 k.p.k.)');
        this.noteCategory.set('Sprawa klienta');
        this.noteLinkedArticle.set('Art. 387 k.p.k.');
        this.noteTagsInput.set('art 387 kpk, dobrowolne poddanie się karze, konsensus, porozumienie');
        this.noteContent.set(
`SĄD REJONOWY W: [Miejscowość]
Wydział Karny
Sygn. akt: [Sygnatura sprawy]

Oskarżony: [Imię i Nazwisko]

WNIOSEK O WYDANIE WYROKU SKAZUJĄCEGO
(art. 387 § 1 k.p.k.)

Działając w imieniu oskarżonego, przed zakończeniem pierwszego przesłuchania wszystkich oskarżonych na rozprawie głównej, wnoszę o:
1. Wydanie wyroku skazującego i orzeczenie uzgodnionej kary:
   - kary [grzywny / ograniczenia wolności / pozbawienia wolności z warunkowym zawieszeniem]
   - obowiązku naprawienia szkody (art. 46 § 1 k.k.) w kwocie [...] zł
   - bez przeprowadzania postępowania dowodowego.

UZASADNIENIE
Okoliczności popełnienia przestępstwa i wina oskarżonego nie budzą wątpliwości. Postawa oskarżonego wskazuje, że cele postępowania zostaną osiągnięte mimo nieprzeprowadzenia rozprawy w całości. Wniosek został uzgodniony z prokuratorem.`
        );
        break;
      case 'nadzwyczajne-zlagodzenie':
        this.noteTitle.set('Wniosek o nadzwyczajne złagodzenie kary (art. 60 § 2 k.k.)');
        this.noteCategory.set('Analiza prawna');
        this.noteLinkedArticle.set('Art. 60 § 2 i § 6 k.k.');
        this.noteTagsInput.set('art 60 kk, nadzwyczajne złagodzenie, pojednanie, naprawienie szkody, wniosek');
        this.noteContent.set(
`SĄD REJONOWY W: [Miejscowość, Wydział Karny]
Sygn. akt: [Sygnatura akt sprawy]

Oskarżony: [Imię i Nazwisko]
Obrońca: [Imię i Nazwisko Adwokata]

WNIOSEK OBROŃCY O ZASTOSOWANIE NADZWYCZAJNEGO ZŁAGODZENIA KARY
(art. 60 § 2 pkt 1 i § 6 k.k.)

Działając jako obrońca oskarżonego, na zasadzie art. 60 § 2 pkt 1 k.k. w zw. z art. 60 § 6 pkt 3/4 k.k., wnoszę o:
1. Zastosowanie wobec oskarżonego dobrodziejstwa nadzwyczajnego złagodzenia kary.
2. Wymierzenie kary wolnościowej w postaci grzywny albo kary ograniczenia wolności, ewentualnie kary pozbawienia wolności z warunkowym zawieszeniem jej wykonania (art. 69 § 1 k.k.).

UZASADNIENIE
1. POJEDNANIE I NAPRAWIENIE SZKODY: Oskarżony przed otwarciem przewodu sądowego w całości zrekompensował szkodę materialną wyrządzoną przestępstwem oraz zawarł z pokrzywdzonym ugodę pojednawczą.
2. POSTAWA SPRAWCY: Oskarżony szczerze wyraził skruchę, złożył wyczerpujące wyjaśnienia i współpracował z organami ścigania.
3. Zgodnie z utrwalonym orzecznictwem Sądu Najwyższego (m.in. I KZP 12/20) całkowite naprawienie szkody i pojednanie z pokrzywdzonym stanowi samodzielną podstawę do odstąpienia od kary izolacyjnej.`
        );
        break;

      case 'umorzenie-narkotyki':
        this.noteTitle.set('Wniosek o umorzenie postępowania na podst. art. 62a UoPN');
        this.noteCategory.set('Wniosek dowodowy');
        this.noteLinkedArticle.set('Art. 62a UoPN');
        this.noteTagsInput.set('uopn, art 62a, marihuana, własny użytek, nieznaczna ilość, umorzenie');
        this.noteContent.set(
`PROKURATURA REJONOWA W: [Miejscowość] / KOMENDA POLICJI
Sygn. akt: [Sygnatura dochodzenia / śledztwa]

Podejrzany: [Imię i Nazwisko]
Obrońca: [Imię i Nazwisko Adwokata]

WNIOSEK O UMORZENIE POSTĘPOWANIA PRZED WYDANIEM POSTANOWIENIA O WSZCZĘCIU
(art. 62a Ustawy o przeciwdziałaniu narkomanii)

Działając imieniem podejrzanego, na podstawie art. 62a UoPN, wnoszę o:
1. Umorzenie postępowania karnego w przedmiocie zarzutu z art. 62 ust. 1 UoPN.
2. Orzeczenie przepadku zabezpieczonych substancji odurzających.

UZASADNIENIE
1. ILOŚĆ NIEZNACZNA: Przedmiotem zabezpieczenia była minimalna ilość suszu ([...] grama), stanowiąca co najwyżej jedną porcję konsumpcyjną.
2. WŁASNY UŻYTEK: W toku przeszukania nie ujawniono wag elektronicznych, woreczków strunowych ani gotówki wskazującej na dystrybucję.
3. BEZCELOWOŚĆ KARANIA: Podejrzany jest osobą młodą, dotychczas niekaraną, pracującą/uczącą się. Stopień społecznej szkodliwości czynu jest znikomy, a orzeczenie kary byłoby sprzeczne z celami wychowawczymi.`
        );
        break;

      case 'warunkowe-umorzenie':
        this.noteTitle.set('Wniosek o warunkowe umorzenie postępowania karnego (art. 66 k.k.)');
        this.noteCategory.set('Analiza prawna');
        this.noteLinkedArticle.set('Art. 66 k.k.');
        this.noteTagsInput.set('warunkowe umorzenie, art. 66 k.k., niekaralność, wniosek');
        this.noteContent.set(
`SĄD REJONOWY W: [Miejscowość, Wydział Karny]
Sygn. akt: [Wpisz sygnaturę akt sprawy]

Podejrzany / Oskarżony: [Imię i Nazwisko]
Obrońca: [Imię i Nazwisko Adwokata / Radcy]

WNIOSEK O WARUNKOWE UMORZENIE POSTĘPOWANIA KARNEGO
Działając jako obrońca oskarżonego [Imię Nazwisko], na podstawie art. 66 § 1 i 2 k.k. oraz art. 67 § 1 k.k. wnoszę o:

1. Warunkowe umorzenie postępowania karnego wobec oskarżonego na okres próby wynoszący [1 rok / 2 lata].
2. Orzeczenie świadczenia pieniężnego na rzecz Funduszu Pomocy Pokrzywdzonym w kwocie [np. 1000 - 3000 zł].
3. Odstąpienie od orzekania zakazu prowadzenia pojazdów na podstawie art. 67 § 3 k.k.

UZASADNIENIE
1. Dotychczasowa niekaralność sprawcy za przestępstwo umyślne (brak wpisu w KRK).
2. Wina i społeczna szkodliwość czynu nie są znaczne: [wskazać okoliczności łagodzące, np. incydentalny charakter, współpraca z policją].
3. Postawa sprawcy i pozytywna prognoza kryminologiczna: sprawca prowadzi ustabilizowany tryb życia, pracuje zawodowo, posiada pozytywną opinię środowiskową.`
        );
        break;

      case 'wniosek-dowodowy':
        this.noteTitle.set('Wniosek dowodowy o dopuszczenie dowodu (art. 169 k.p.k.)');
        this.noteCategory.set('Wniosek dowodowy');
        this.noteLinkedArticle.set('Art. 169 k.p.k.');
        this.noteTagsInput.set('wniosek dowodowy, kpk, dowody, teza dowodowa');
        this.noteContent.set(
`ORGAN PROWADZĄCY: [Prokuratura Rejonowa / Sąd Rejonowy]
Sygn. akt: [Wpisz sygnaturę]

WNIOSEK DOWODOWY OBROŃCY (art. 169 k.p.k.)
Działając imieniem oskarżonego, wnoszę o:

1. Dopuszczenie i przeprowadzenie dowodu z:
   - [ ] Dokumentu / nagrania monitoringu z dnia [...]
   - [ ] Zeznań świadka: [Imię, nazwisko, adres zamieszkania]
   - [ ] Opinii biegłego z zakresu [...]

2. TEZA DOWODOWA:
   Dowód ten powoływany jest na okoliczność wykazania, że [dokładny opis faktu, który ma być udowodniony, np. brak zamiaru bezpośredniego, stan wyższej konieczności, błąd pomiarowy urządzenia].

UZASADNIENIE
Przeprowadzenie wskazanego dowodu ma kluczowe znaczenie dla rozstrzygnięcia sprawy i nie spowoduje nieuzasadnionej zwłoki w postępowaniu (art. 170 § 1 k.p.k.).`
        );
        break;

      case 'zazalenie-zatrzymanie':
        this.noteTitle.set('Zażalenie na postanowienie o zatrzymaniu prawa jazdy / rzeczy');
        this.noteCategory.set('Wniosek dowodowy');
        this.noteLinkedArticle.set('Art. 135 ust. 1 Prd / art. 217 k.p.k.');
        this.noteTagsInput.set('zażalenie, zatrzymanie prawa jazdy, art. 135 prd, środek przymusu');
        this.noteContent.set(
`DO: Sąd Rejonowy w [Miejscowość]
za pośrednictwem: [Prokuratura / Komenda Policji]
Sygn. akt: [Sygnatura sprawy]

ZAŻALENIE NA POSTANOWIENIE O ZATRZYMANIU
Działając w imieniu podejrzanego, zaskarżam w całości postanowienie z dnia [...] w przedmiocie zatrzymania prawa jazdy / rzeczy.

ZARZUTY:
1. Błąd w ustaleniach faktycznych polegający na przyjęciu, że zachodzi wysokie prawdopodobieństwo orzeczenia środka karnego w postaci zakazu prowadzenia pojazdów.
2. Naruszenie zasady proporcjonalności: zatrzymanie dokumentu uniemożliwia podejrzanemu wykonywanie jedynego źródła zarobkowania niezbędnego do utrzymania rodziny.

WNIOSEK:
Wnoszę o uchylenie zaskarżonego postanowienia i niezwłoczny zwrot dokumentu podejrzanemu.`
        );
        break;

      case 'linia-obrony':
        this.noteTitle.set('Memorandum Strategii Procesowej i Linii Obrony');
        this.noteCategory.set('Sprawa klienta');
        this.noteTagsInput.set('strategia, linia obrony, analiza ryzyka, memorandum');
        this.noteContent.set(
`MEMORANDUM STRATEGICZNE SPRAWY KARNEJ
Klient: [Imię i Nazwisko / Sygnatura wewnętrzna]
Zarzut: [Kwalifikacja prawna z k.k. / k.w.]

I. STAN FAKTYCZNY WEDŁUG KLIENTA:
[Chronologiczny opis zdarzeń ze spotkania z klientem]

II. DOWODY OSKARŻENIA I ICH SŁABE PUNKTY:
- Dowód A: [np. protokół badania alkomatem – weryfikacja świadectwa wzorcowania i czasu próby]
- Dowód B: [np. zeznania świadków – sprzeczności w relacjach]

III. PLANOWANE KROKI OBROŃCZE:
1. Przesłuchanie w postępowaniu przygotowawczym (odmowa składania wyjaśnień vs złożenie wyjaśnień na piśmie).
2. Wnioski dowodowe w trybie art. 169 k.p.k.
3. Wariant A: Walka o uniewinnienie lub zmianę kwalifikacji na wypadek mniejszej wagi.
4. Wariant B: Wniosek o warunkowe umorzenie (art. 66 k.k.) lub konsensualne zakończenie (art. 387 k.p.k.).`
        );
        break;
    }
  }

  isDictatingTitle(): boolean {
    return this.speech.isListening() && this.speech.activeTarget() === 'note-title';
  }

  isDictatingContent(): boolean {
    return this.speech.isListening() && this.speech.activeTarget() === 'note-content';
  }

  toggleTitleDictation(): void {
    if (this.isDictatingTitle()) {
      this.speech.stop();
      return;
    }

    this.speech.start('note-title', (chunk: string, isFinal: boolean) => {
      if (isFinal) {
        const current = this.noteTitle().trim();
        const sep = current ? ' ' : '';
        this.noteTitle.set(`${current}${sep}${chunk}`.trim());
      }
    });
  }

  toggleContentDictation(): void {
    if (this.isDictatingContent()) {
      this.speech.stop();
      return;
    }

    this.speech.start('note-content', (chunk: string, isFinal: boolean) => {
      if (isFinal) {
        const current = this.noteContent().trim();
        const sep = current ? (chunk.startsWith('.') || chunk.startsWith(',') ? '' : ' ') : '';
        this.noteContent.set(`${current}${sep}${chunk}`);
      }
    });
  }

  async saveCurrentNote(): Promise<void> {
    if (this.isDictatingTitle() || this.isDictatingContent()) {
      this.speech.stop();
    }

    const title = this.noteTitle().trim();
    const content = this.noteContent().trim();
    if (!title || !content) return;

    const tags = this.noteTagsInput()
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await this.legalData.saveNote(
        {
          title,
          content,
          category: this.noteCategory(),
          linkedArticle: this.noteLinkedArticle().trim() || undefined,
          tags,
        },
        this.editingNoteId() || undefined
      );
      this.resetNoteForm();
    } catch (e: unknown) {
      const err = e as Error;
      if (!this.cryptoService.isAuthenticated()) {
        this.requestUnlockVault.emit();
      } else {
        alert(err.message || 'Błąd zapisu notatki.');
      }
    }
  }

  editNote(note: EncryptedNote): void {
    this.editingNoteId.set(note.id);
    this.noteTitle.set(note.title);
    this.noteCategory.set(note.category);
    this.noteLinkedArticle.set(note.linkedArticle || '');
    this.noteContent.set(note.content);
    this.noteTagsInput.set(note.tags.join(', '));
    this.showNoteForm.set(true);
  }

  async deleteNote(id: string): Promise<void> {
    await this.legalData.deleteNote(id);
  }

  exportNoteToPdf(note: EncryptedNote): void {
    this.pdfService.exportNoteToPdf(note);
  }

  resetNoteForm(): void {
    if (this.speech.isListening()) {
      this.speech.stop();
    }
    this.editingNoteId.set(null);
    this.noteTitle.set('');
    this.noteLinkedArticle.set('');
    this.noteContent.set('');
    this.noteTagsInput.set('');
    this.showNoteForm.set(false);
  }

  // Metoda publiczna umożliwiająca zainicjowanie notatki z zewnątrz (np. z artykułu lub orzeczenia)
  initNoteFromExternal(title: string, content: string, linkedArticle?: string, tags?: string[]): void {
    this.resetNoteForm();
    this.noteTitle.set(title);
    this.noteContent.set(content);
    if (linkedArticle) this.noteLinkedArticle.set(linkedArticle);
    if (tags) this.noteTagsInput.set(tags.join(', '));
    this.showNoteForm.set(true);
  }

  openCreateFormForArticle(art: PenalArticle): void {
    this.initNoteFromExternal(
      `Notatka prawna – Art. ${art.number}${art.suffix || ''} k.k.`,
      `Stan faktyczny / uwagi do wykładni art. ${art.number} k.k. (${art.title}):\n\n`,
      `Art. ${art.number}${art.suffix || ''} k.k.`,
      [`art ${art.number}`, 'kodeks karny', 'orzecznictwo']
    );
  }

  openCreateFormForRuling(ruling: CourtRuling): void {
    this.initNoteFromExternal(
      `Notatka do orzeczenia ${ruling.signature}`,
      `Sygnatura: ${ruling.signature}\nTeza: ${ruling.thesis}\nWyrok: ${ruling.sanctionImposed}\nUwagi do sprawy klienta: \n\n`,
      ruling.articleRef,
      ['orzecznictwo', ruling.court.toLowerCase(), 'precedens']
    );
  }

  // --- Kopia Zapasowa Skarbca (Backup & Restore) ---
  downloadVaultBackup(): void {
    try {
      const json = this.legalData.exportVaultBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prawnik-kopia-sejfu-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Błąd eksportu kopii zapasowej: ' + (e.message || 'Nieznany błąd'));
    }
  }

  triggerImportBackup(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  async handleBackupFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
      const text = await file.text();
      const count = this.legalData.importVaultBackup(text);
      alert(`Pomyślnie zaimportowano ${count} notatek do skarbca.`);
    } catch (e: any) {
      alert(e.message || 'Błąd importu pliku kopii zapasowej.');
    } finally {
      input.value = '';
    }
  }
}

