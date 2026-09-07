import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TextToSpeechService } from '../services/text-to-speech.service';

@Component({
  selector: 'app-read-aloud-player',
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tts.isPlaying() || tts.isPaused()) {
      <aside
        id="read-aloud-floating-player"
        role="region"
        aria-label="Odtwarzacz syntezatora mowy lektora"
        aria-live="polite"
        class="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl shadow-2xl shadow-black/80 p-3 sm:p-4 text-slate-100 transition-all duration-300"
      >
        <!-- Pasek postępu odczytu aktu prawnego -->
        <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
          <div
            class="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300 rounded-full"
            [style.width.%]="tts.progressPercent()"
          ></div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <!-- Informacja o czytanym artykule lub orzeczeniu -->
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <!-- Animowana ikona fali dźwiękowej -->
            <div
              class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400"
              [title]="tts.isPlaying() && !tts.isPaused() ? 'Trwa odczytywanie na głos' : 'Wstrzymano odczyt'"
            >
              @if (tts.isPlaying() && !tts.isPaused()) {
                <div class="flex items-end gap-0.5 h-4">
                  <span class="w-1 bg-amber-400 rounded-full animate-[bounce_0.8s_ease-in-out_infinite]"></span>
                  <span class="w-1 bg-amber-400 rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.2s]"></span>
                  <span class="w-1 bg-amber-400 rounded-full animate-[bounce_0.9s_ease-in-out_infinite_0.4s]"></span>
                </div>
              } @else {
                <mat-icon class="text-xl">volume_up</mat-icon>
              }
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-mono uppercase tracking-wider font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Lektor AI (Web Speech)
                </span>
                <span class="text-xs text-slate-400 font-mono">
                  Fragment {{ tts.currentChunkIndex() + 1 }} z {{ tts.totalChunks() }} ({{ tts.progressPercent() }}%)
                </span>
              </div>
              <h4 class="text-sm font-bold truncate text-white mt-0.5" [title]="tts.currentTitle()">
                {{ tts.currentTitle() }}
              </h4>
              <p class="text-xs text-slate-400 truncate hidden sm:block">
                {{ tts.currentSubtitle() }}
              </p>
            </div>
          </div>

          <!-- Główne kontrolki sterowania odtwarzaniem -->
          <div class="flex items-center gap-1 sm:gap-2">
            <!-- Poprzedni segment -->
            <button
              id="btn-tts-prev-chunk"
              (click)="tts.prevChunk()"
              [disabled]="tts.currentChunkIndex() <= 0"
              class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Poprzedni akapit / zdanie"
              aria-label="Cofnij do poprzedniego fragmentu"
            >
              <mat-icon class="text-lg">skip_previous</mat-icon>
            </button>

            <!-- Play / Pauza -->
            @if (tts.isPlaying() && !tts.isPaused()) {
              <button
                id="btn-tts-pause"
                (click)="tts.pause()"
                class="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md transition-all cursor-pointer"
                title="Wstrzymaj czytanie"
                aria-label="Wstrzymaj czytanie lektora"
              >
                <mat-icon class="text-2xl">pause</mat-icon>
              </button>
            } @else {
              <button
                id="btn-tts-resume"
                (click)="tts.resume()"
                class="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md transition-all cursor-pointer"
                title="Wznów czytanie"
                aria-label="Wznów czytanie lektora"
              >
                <mat-icon class="text-2xl">play_arrow</mat-icon>
              </button>
            }

            <!-- Następny segment -->
            <button
              id="btn-tts-next-chunk"
              (click)="tts.nextChunk()"
              [disabled]="tts.currentChunkIndex() >= tts.totalChunks() - 1"
              class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Następny akapit / zdanie"
              aria-label="Przejdź do następnego fragmentu"
            >
              <mat-icon class="text-lg">skip_next</mat-icon>
            </button>

            <!-- Przełącznik Prędkości Mowy (0.8x - 1.5x) -->
            <div class="relative">
              <button
                id="btn-tts-speed"
                (click)="isSpeedMenuOpen.set(!isSpeedMenuOpen())"
                class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer"
                title="Zmień tempo czytania lektora"
                aria-label="Prędkość odtwarzania"
              >
                {{ tts.playbackRate() }}x
              </button>

              @if (isSpeedMenuOpen()) {
                <div class="absolute bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 min-w-[70px] z-50">
                  @for (speed of [0.75, 1.0, 1.25, 1.5, 1.75]; track speed) {
                    <button
                      (click)="setRate(speed)"
                      [class]="tts.playbackRate() === speed ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'"
                      class="px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer text-center font-mono"
                    >
                      {{ speed }}x
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Zatrzymaj i zamknij odtwarzacz -->
            <button
              id="btn-tts-stop"
              (click)="tts.stop()"
              class="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors cursor-pointer ml-1"
              title="Zatrzymaj i wyłącz lektora"
              aria-label="Zatrzymaj odczyt i zamknij odtwarzacz"
            >
              <mat-icon class="text-lg">close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Opcjonalny wybór głosu (jeśli dostępnych jest wiele głosów) -->
        @if (showVoiceSelector() && tts.polishVoices().length > 1) {
          <div class="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span class="flex items-center gap-1">
              <mat-icon class="text-xs text-amber-400">record_voice_over</mat-icon>
              Głos lektora:
            </span>
            <select
              [value]="tts.selectedVoice()?.name"
              (change)="onVoiceChange($any($event.target).value)"
              class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              @for (v of tts.polishVoices(); track v.name) {
                <option [value]="v.name">
                  {{ v.name }} ({{ v.lang }})
                </option>
              }
            </select>
          </div>
        }
      </aside>
    }
  `,
})
export class ReadAloudPlayer {
  readonly tts = inject(TextToSpeechService);
  readonly isSpeedMenuOpen = signal<boolean>(false);
  readonly showVoiceSelector = signal<boolean>(false);

  setRate(rate: number): void {
    this.tts.setRate(rate);
    this.isSpeedMenuOpen.set(false);
  }

  onVoiceChange(voiceName: string): void {
    const voice = this.tts.availableVoices().find((v) => v.name === voiceName);
    if (voice) {
      this.tts.setVoice(voice);
    }
  }
}
