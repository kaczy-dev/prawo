import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChatMessage, EncryptedNote, ChatPersona } from '../models/legal.model';
import { PrawnBotAiService } from '../services/prawn-bot-ai.service';
import { SpeechDictationService } from '../services/speech-dictation.service';
import { LocalWebLLMService } from '../services/local-web-llm.service';
import { TextToSpeechService } from '../services/text-to-speech.service';
import { PdfExportService } from '../services/pdf-export.service';
import { LegalDataService } from '../services/legal-data.service';
import { CryptoService } from '../services/crypto.service';

@Component({
  selector: 'app-legal-chat',
  imports: [CommonModule, MatIconModule],
  template: `
    <section id="section-ai-chat" class="space-y-4">
      <div class="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col h-[calc(100dvh-180px)] md:h-[760px] max-h-[860px] relative overflow-hidden">
        <div class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"></div>

        <!-- Nagłówek czatu z oznaczeniem bezpieczeństwa, trybem silnika i WebGPU -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 shrink-0">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg md:text-xl font-bold text-white flex items-center gap-2 font-serif tracking-tight">
                <mat-icon class="text-amber-400">smart_toy</mat-icon>
                Prawnik z <span class="text-amber-300">Łuczniczej</span> – Asystent Prawny
              </h2>
              @if (useWebGPU() && webLLM.status() === 'ready') {
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  WebGPU Aktywny
                </span>
              }
            </div>
            <p class="text-xs text-slate-400 mt-0.5 font-sans">
              100% lokalny silnik kwalifikacji prawno-karnej. Obsługuje dyktowanie głosem oraz lokalny model WebGPU.
            </p>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <!-- Eksport zapisu do PDF -->
            <button
              type="button"
              (click)="exportConversationPdf()"
              class="btn-tactile bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              title="Pobierz protokół konsultacji prawnej w formacie PDF A4"
            >
              <mat-icon class="text-xs text-amber-400">picture_as_pdf</mat-icon>
              <span>Drukuj Protokół PDF</span>
            </button>

            <!-- Przełącznik WebGPU Model -->
            <button
              type="button"
              (click)="toggleWebGPUMode()"
              [class]="useWebGPU()
                ? 'bg-purple-600/30 text-purple-200 border-purple-500/50 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'"
              class="btn-tactile px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Przełącz między wbudowanym silnikiem a lokalnym modelem WebGPU"
            >
              <mat-icon class="text-xs">{{ useWebGPU() ? 'memory' : 'speed' }}</mat-icon>
              <span>{{ useWebGPU() ? 'Silnik WebGPU' : 'Szybki Silnik Wbudowany' }}</span>
            </button>

            @if (speech.isSupported()) {
              <span class="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl flex items-center gap-1 font-mono">
                <mat-icon class="text-xs">mic</mat-icon>
                <span>Dyktowanie</span>
              </span>
            }
            <button
              (click)="resetConversation()"
              class="btn-tactile text-xs text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              title="Wyczyść historię rozmowy"
            >
              <mat-icon class="text-xs">restart_alt</mat-icon>
              <span>Reset</span>
            </button>
          </div>
        </div>

        <!-- Pasek stanu ładowania WebGPU -->
        @if (useWebGPU() && webLLM.status() === 'downloading') {
          <div class="bg-purple-950/40 border border-purple-500/30 p-2.5 rounded-xl text-xs space-y-1.5 shrink-0">
            <div class="flex items-center justify-between text-purple-200">
              <span class="flex items-center gap-1.5 font-semibold">
                <mat-icon class="text-xs animate-spin">sync</mat-icon>
                Ładowanie wag modelu do pamięci karty graficznej (VRAM)...
              </span>
              <span class="font-mono">{{ webLLM.downloadProgress().progress }}%</span>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div class="bg-purple-500 h-1.5 transition-all duration-300" [style.width.%]="webLLM.downloadProgress().progress"></div>
            </div>
            <p class="text-[10px] text-purple-300/80">{{ webLLM.downloadProgress().text }}</p>
          </div>
        }

        @if (useWebGPU() && webLLM.status() === 'webgpu_unsupported') {
          <div class="bg-amber-950/40 border border-amber-500/30 p-2 rounded-xl text-xs text-amber-200 flex items-center gap-2 shrink-0">
            <mat-icon class="text-sm text-amber-400 shrink-0">info</mat-icon>
            <span>Przeglądarka lub sprzęt nie obsługuje WebGPU. Automatycznie aktywowano niezawodny silnik lokalny.</span>
          </div>
        }

        <!-- Powiadomienie o akcjach (kopiowanie, sejf, PDF) -->
        @if (actionNotification(); as notif) {
          <div
            class="px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shrink-0 transition-all animate-fade-in shadow-md"
            [class]="notif.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/80 border border-amber-500/40 text-amber-200'"
          >
            <mat-icon class="text-sm" [class.text-emerald-400]="notif.type === 'success'" [class.text-amber-400]="notif.type === 'warn'">
              {{ notif.type === 'success' ? 'check_circle' : 'warning' }}
            </mat-icon>
            <span class="font-medium">{{ notif.text }}</span>
          </div>
        }

        <!-- Przełącznik trybu / persony asystenta (Citizen / Counsel / Interrogator) -->
        <div class="pt-2.5 pb-1 px-1 border-b border-slate-800/80 shrink-0 flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-1.5 text-xs">
            <span class="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <mat-icon class="text-xs text-amber-400">psychology</mat-icon> Rola asystenta:
            </span>
            <div class="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800/90 shadow-inner">
              <button
                type="button"
                (click)="setPersona('citizen')"
                [class]="selectedPersona() === 'citizen'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'"
                class="px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Prosty, zrozumiały język, praktyczne rady dla każdego bez żargonu"
              >
                <span>🤝</span>
                <span>Dla Obywatela</span>
              </button>

              <button
                type="button"
                (click)="setPersona('counsel')"
                [class]="selectedPersona() === 'counsel'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'"
                class="px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Twardy język procesowy, weryfikacja błędów k.p.k., tezy SN, taktyka obrony"
              >
                <span>⚖️</span>
                <span>Dla Obrońcy</span>
              </button>

              <button
                type="button"
                (click)="setPersona('interrogator')"
                [class]="selectedPersona() === 'interrogator'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'"
                class="px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Symulacja przesłuchania śledczego: dociekliwe pytania i sprawdzanie spójności wersji"
              >
                <span>🚨</span>
                <span>Symulator Przesłuchania</span>
              </button>
            </div>
          </div>

          <span class="text-[10px] text-slate-500 font-mono hidden sm:inline">
            @if (selectedPersona() === 'citizen') {
              Tryb: Prosty język & bezpieczne kroki
            } @else if (selectedPersona() === 'counsel') {
              Tryb: Profesjonalna taktyka adwokacka
            } @else {
              Tryb: Przygotowanie do zeznań na policji
            }
          </span>
        </div>

        <!-- Szybkie zapytania "Co mi grozi?" (Quick Prompts Chips) -->
        <div class="py-2 px-1 border-b border-slate-800/80 shrink-0">
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span class="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1 mr-1">
              <mat-icon class="text-xs text-amber-400">tips_and_updates</mat-icon> Zadaj pytanie:
            </span>
            @for (quick of currentPersonaSuggestions(); track quick) {
              <button
                type="button"
                (click)="sendMessage(quick)"
                class="bg-slate-950 hover:bg-amber-500/15 text-slate-300 hover:text-amber-200 border border-slate-800 hover:border-amber-500/40 px-3 py-1 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer shadow-sm"
              >
                {{ quick }}
              </button>
            }
          </div>
        </div>

        <!-- Obszar wiadomości -->
        <div #scrollContainer class="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          @for (msg of chatMessages(); track msg.id) {
            <div
              [class]="msg.sender === 'user' ? 'flex justify-end' : 'flex justify-start'"
              class="w-full"
            >
              <div
                [class]="msg.sender === 'user'
                  ? 'bg-gradient-to-br from-amber-500/20 via-amber-600/15 to-slate-900 border border-amber-500/35 text-amber-50 max-w-[85%] sm:max-w-xl rounded-2xl rounded-tr-sm p-4 sm:p-5 shadow-lg'
                  : 'bg-slate-950/90 border border-slate-800/90 hover:border-slate-700/80 text-slate-200 max-w-[95%] sm:max-w-2xl rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-xl relative'"
              >
                <!-- Nagłówek wiadomości -->
                <div class="flex items-center justify-between gap-3 text-xs mb-2.5 pb-2 border-b border-slate-800/60 opacity-85">
                  <span class="font-semibold flex items-center gap-1.5 font-serif">
                    @if (msg.sender === 'assistant') {
                      <mat-icon class="text-xs text-amber-400">
                        {{ msg.persona === 'interrogator' ? 'local_police' : msg.persona === 'counsel' ? 'gavel' : 'balance' }}
                      </mat-icon>
                      <span class="text-amber-300">Prawnik z Łuczniczej</span>
                      @if (msg.persona) {
                        <span class="text-[9px] font-sans px-1.5 py-0.2 rounded-md"
                          [class]="msg.persona === 'interrogator' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : msg.persona === 'counsel' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'">
                          {{ msg.persona === 'interrogator' ? 'Śledczy' : msg.persona === 'counsel' ? 'Obrońca' : 'Obywatel' }}
                        </span>
                      }
                    } @else {
                      <mat-icon class="text-xs text-amber-200">person</mat-icon>
                      <span class="text-slate-300">Pytanie klienta</span>
                    }
                  </span>
                  <div class="flex items-center gap-2">
                    @if (msg.sender === 'assistant') {
                      <button
                        type="button"
                        (click)="speakMessage(msg)"
                        class="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                        [title]="tts.isPlaying() && tts.currentTextId() === msg.id ? 'Zatrzymaj lektora' : 'Odsłuchaj opinię na głos (Lektor mowy)'"
                      >
                        <mat-icon class="text-xs">{{ tts.isPlaying() && tts.currentTextId() === msg.id ? 'volume_off' : 'volume_up' }}</mat-icon>
                      </button>
                      <button
                        type="button"
                        (click)="copyMessageText(msg)"
                        class="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Kopiuj treść do schowka"
                      >
                        <mat-icon class="text-xs">content_copy</mat-icon>
                      </button>
                      <button
                        type="button"
                        (click)="saveResponseToVault(msg)"
                        class="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Zapisz jako notatkę w zaszyfrowanym Sejfie Akt"
                      >
                        <mat-icon class="text-xs">enhanced_encryption</mat-icon>
                      </button>
                    }
                    <span class="font-mono text-[10px] text-slate-500">{{ msg.timestamp }}</span>
                  </div>
                </div>

                <!-- Etykieta kategorii prawnej (jeśli wykryto) -->
                @if (msg.legalCategoryBadge) {
                  <div class="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold font-mono">
                    <mat-icon class="text-xs text-amber-400">gavel</mat-icon>
                    <span>{{ msg.legalCategoryBadge }}</span>
                  </div>
                }

                <!-- Treść wiadomości -->
                <div class="text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-200">
                  {{ msg.text }}
                  @if (isGenerating() && currentGeneratingId() === msg.id) {
                    <span class="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle rounded-sm shadow-[0_0_8px_#f59e0b]"></span>
                  }
                </div>

                <!-- Odesłania do artykułów prawnych -->
                @if (msg.referencedArticles && msg.referencedArticles.length > 0) {
                  <div class="mt-3.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
                    <span class="text-slate-400 flex items-center gap-1 text-[11px] font-mono">
                      <mat-icon class="text-xs text-amber-400">menu_book</mat-icon> Powiązane przepisy:
                    </span>
                    @for (art of msg.referencedArticles; track art) {
                      <button
                        type="button"
                        (click)="inspectArticle.emit(art)"
                        class="bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white border border-slate-700/80 hover:border-amber-500/40 px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer transition-colors active:scale-95"
                        title="Kliknij, aby otworzyć przepis w Kodeksie Karnym"
                      >
                        {{ art }}
                      </button>
                    }
                  </div>
                }

                <!-- Przycisk bezpośredniego przeliczenia w kalkulatorze "Co mi grozi?" -->
                @if (msg.actionQuery) {
                  <div class="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      type="button"
                      (click)="openCalculator.emit(msg.actionQuery)"
                      class="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <mat-icon class="text-sm">calculate</mat-icon>
                      <span>Otwórz w Kalkulatorze "Co mi grozi?"</span>
                    </button>
                  </div>
                }

                <!-- Proponowane pytania pomocnicze -->
                @if (msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0) {
                  <div class="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-1.5">
                    <span class="text-[11px] text-slate-500 w-full mb-1">Sugerowane pytania:</span>
                    @for (sugg of msg.suggestedFollowUps; track sugg) {
                      <button
                        (click)="sendMessage(sugg)"
                        class="text-xs bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-200 border border-slate-700/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        {{ sugg }}
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Bąbelek oczekiwania / myślenia asystenta -->
          @if (isGenerating() && !currentGeneratingId()) {
            <div class="flex justify-start w-full animate-fade-in">
              <div class="bg-slate-950/90 border border-amber-500/30 text-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-xl flex items-center gap-3">
                <mat-icon class="text-amber-400 animate-spin text-sm">hourglass_top</mat-icon>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs text-amber-300 font-medium">Prawnik z Łuczniczej analizuje przepisy k.k.</span>
                  <span class="flex gap-1 items-center ml-1">
                    <span class="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></span>
                    <span class="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span class="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Pasek dyktowania na żywo (jeśli mowa jest w toku) -->
        @if (speech.isListening() && speech.activeTarget() === 'legal-chat-input') {
          <div class="mb-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200 animate-pulse">
            <div class="flex items-center gap-2">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span class="font-semibold">Dyktowanie na żywo (Web Speech API pl-PL)...</span>
              <span class="italic text-slate-300">„{{ speech.currentInterim() || 'Mów do mikrofonu...' }}”</span>
            </div>
            <button
              (click)="stopDictation()"
              class="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-2 py-0.5 rounded border border-red-500/30 cursor-pointer text-[11px]"
            >
              Zatrzymaj
            </button>
          </div>
        }

        <!-- Pasek wprowadzania zapytania z mikrofonem -->
        <div class="pt-3 border-t border-slate-800/80 shrink-0">
          <div class="flex items-center gap-2.5">
            <!-- Przycisk Web Speech API dyktowania -->
            <button
              id="btn-chat-speech-dictation"
              type="button"
              (click)="toggleChatDictation()"
              [class]="isDictating()
                ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30'
                : 'bg-slate-950 text-slate-300 hover:text-amber-300 hover:bg-slate-800 border-slate-800 hover:border-amber-500/40'"
              class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
              [title]="isDictating() ? 'Zatrzymaj dyktowanie' : 'Dyktuj zapytanie prawnicze głosem (Web Speech API)'"
            >
              <mat-icon class="text-lg">{{ isDictating() ? 'mic' : 'mic_none' }}</mat-icon>
            </button>

            <!-- Pole tekstowe -->
            <div class="relative flex-1">
              <input
                id="input-chat-message"
                type="text"
                [value]="inputText()"
                (input)="inputText.set($any($event.target).value)"
                (keydown.enter)="sendMessage()"
                placeholder="Wpisz lub podyktuj pytanie: np. 'Co grozi za art. 278 k.k.?', 'Czy grozi konfiskata auta?'..."
                class="w-full bg-slate-950/90 border border-slate-700/80 hover:border-slate-600 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
              />
              @if (inputText()) {
                <button
                  type="button"
                  (click)="inputText.set('')"
                  class="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                  title="Wyczyść"
                >
                  <mat-icon class="text-base">close</mat-icon>
                </button>
              }
            </div>

            <!-- Przycisk wysłania lub zatrzymania generowania -->
            @if (isGenerating()) {
              <button
                id="btn-stop-generating"
                type="button"
                (click)="stopGenerating()"
                class="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
                title="Zatrzymaj generowanie odpowiedzi"
              >
                <mat-icon class="text-base text-red-400">stop_circle</mat-icon>
                <span class="hidden sm:inline">Zatrzymaj</span>
              </button>
            } @else {
              <button
                id="btn-send-chat-message"
                type="button"
                (click)="sendMessage()"
                class="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-950/40 shrink-0 active:scale-95"
              >
                <mat-icon class="text-base">send</mat-icon>
                <span class="hidden sm:inline">Wyślij</span>
              </button>
            }
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1 font-mono">
            <span class="flex items-center gap-1">
              <mat-icon class="text-[12px] text-emerald-400">lock</mat-icon>
              100% offline (lokalne przetwarzanie w pamięci RAM/VRAM)
            </span>
            <span class="hidden md:inline">Skróty dyktowania: „kropka”, „przecinek”, „artykuł”, „paragraf”</span>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalChat {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  readonly speech = inject(SpeechDictationService);
  readonly webLLM = inject(LocalWebLLMService);
  readonly tts = inject(TextToSpeechService);
  readonly pdfService = inject(PdfExportService);
  readonly legalData = inject(LegalDataService);
  readonly cryptoService = inject(CryptoService);
  private readonly aiService = inject(PrawnBotAiService);

  readonly openCalculator = output<string>();
  readonly inspectArticle = output<string>();

  readonly useWebGPU = signal<boolean>(false);
  readonly actionNotification = signal<{ text: string; type: 'success' | 'warn' } | null>(null);

  async toggleWebGPUMode(): Promise<void> {
    const nextState = !this.useWebGPU();
    this.useWebGPU.set(nextState);

    if (nextState && this.webLLM.status() === 'uninitialized') {
      await this.webLLM.initializeLocalLLM();
    }
  }

  readonly selectedPersona = signal<ChatPersona>('citizen');

  setPersona(persona: ChatPersona): void {
    this.selectedPersona.set(persona);
    const label = persona === 'citizen' ? 'Dla Obywatela' : persona === 'counsel' ? 'Dla Obrońcy' : 'Symulator Przesłuchania';
    this.showNotification(`Zmieniono rolę asystenta na: ${label}`, 'success');
  }

  readonly currentPersonaSuggestions = computed(() => {
    switch (this.selectedPersona()) {
      case 'counsel':
        return [
          'Zarzuty apelacyjne z art. 438 k.p.k.',
          'Wniosek o umorzenie przed rozprawą (art. 339 k.p.k.)',
          'Legalność przeszukania i art. 168a k.p.k.',
          'Nadzwyczajne złagodzenie kary (art. 60 k.k.)',
          'SDE zamiast więzienia (art. 43a k.k.w.)',
          'Zbieg przestępstw i kara łączna (art. 85 k.k.)',
        ];
      case 'interrogator':
        return [
          'Co mówić na pierwszym przesłuchaniu?',
          'Policja wzywa mnie na świadka, a podejrzewa o czyn',
          'Czy odmowa odpowiedzi na pytania pogorszy moją sytuację?',
          'Kiedy prokurator składa wniosek o areszt (art. 249 k.p.k.)?',
          'Przeszukanie telefonu i komputera przez policję',
          'Podpisanie protokołu z nieścisłościami',
        ];
      default:
        return [
          'Co mi grozi za zakłócanie ciszy nocnej?',
          'Jazda bez uprawnień (art. 94 k.w.)',
          'Posiadanie marihuany na własny użytek',
          'Hejt w internecie i opinie google (art. 212 k.k.)',
          'Porysowanie auta na parkingu (art. 288 k.k.)',
          'Jazda po 2 piwach (konfiskata auta)',
          'Płatność cudzą kartą zbliżeniową',
        ];
    }
  });

  readonly inputText = signal<string>('');
  readonly chatMessages = signal<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      timestamp: '11:00',
      text: 'Dzień dobry. Jestem **Prawnik z Łuczniczej** – asystent prawa karnego. Działam w 100% lokalnie i bezpiecznie na Twoim urządzeniu, gwarantując bezwzględną poufność danych. Możesz pisać lub **dyktować zapytania głosem** za pomocą mikrofonu.\n\nW czym mogę pomóc Twojej kancelarii lub w Twojej sprawie karnej?',
      suggestedFollowUps: [
        'Co grozi za jazdę z 1.5 promila?',
        'Jak działa warunkowe umorzenie postępowania?',
        'Kiedy przysługuje dozór elektroniczny (SDE)?',
        'Nowy próg kradzieży 800 zł',
      ],
    },
  ]);

  isDictating(): boolean {
    return this.speech.isListening() && this.speech.activeTarget() === 'legal-chat-input';
  }

  toggleChatDictation(): void {
    if (this.isDictating()) {
      this.speech.stop();
      return;
    }

    this.speech.start('legal-chat-input', (chunk: string, isFinal: boolean) => {
      if (isFinal) {
        const current = this.inputText().trim();
        const separator = current ? ' ' : '';
        this.inputText.set(`${current}${separator}${chunk}`.trim());
      }
    });
  }

  stopDictation(): void {
    this.speech.stop();
  }

  speakMessage(msg: ChatMessage): void {
    if (!this.tts.isSupported()) {
      this.showNotification('Synteza mowy (TTS) nie jest wspierana w tej przeglądarce.', 'warn');
      return;
    }

    if (this.tts.isPlaying() && this.tts.currentTextId() === msg.id) {
      this.tts.stop();
      return;
    }

    const cleanText = msg.text.replace(/\*\*/g, '').replace(/###\s*/g, '').replace(/---\s*/g, '');
    this.tts.startPlayback(
      msg.id,
      msg.legalCategoryBadge || 'Opinia Prawna AI',
      'Prawnik z Łuczniczej (Lektor Mowy)',
      cleanText
    );
  }

  async copyMessageText(msg: ChatMessage): Promise<void> {
    const cleanText = msg.text.replace(/\*\*/g, '');
    try {
      await navigator.clipboard.writeText(cleanText);
      this.showNotification('Treść porady skopiowana do schowka', 'success');
    } catch {
      this.showNotification('Nie udało się skopiować tekstu do schowka.', 'warn');
    }
  }

  async saveResponseToVault(msg: ChatMessage): Promise<void> {
    if (!this.cryptoService.isAuthenticated()) {
      this.showNotification('Sejf akt jest zablokowany. Odblokuj Sejf hasłem w prawym górnym rogu.', 'warn');
      return;
    }

    try {
      const cleanContent = msg.text.replace(/\*\*/g, '');
      const firstLine = cleanContent.split('\n')[0] || 'Porada Prawna AI';
      const title = firstLine.slice(0, 48) + (firstLine.length > 48 ? '...' : '');

      await this.legalData.saveNote({
        title: `Konsultacja AI: ${title}`,
        content: cleanContent,
        category: 'Analiza prawna',
        linkedArticle: msg.referencedArticles?.[0] || 'Porada karna AI',
        tags: ['asystent-ai', 'konsultacja-karna', msg.legalCategoryBadge || 'k.k.'].filter(Boolean),
      });

      this.showNotification('Pomyślnie zapisano poradę w zaszyfrowanym Sejfie Akt (AES-256)', 'success');
    } catch (e: any) {
      this.showNotification(e?.message || 'Błąd zapisu do sejfu.', 'warn');
    }
  }

  exportConversationPdf(): void {
    const messagesToExport = this.chatMessages().map((m) => ({
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp,
      legalCategoryBadge: m.legalCategoryBadge,
    }));

    if (messagesToExport.length === 0) {
      this.showNotification('Brak wiadomości do wyeksportowania.', 'warn');
      return;
    }

    try {
      this.pdfService.exportChatConversationToPdf(messagesToExport);
      this.showNotification('Pobrano protokół konsultacji prawnej PDF A4', 'success');
    } catch (e: any) {
      this.showNotification('Błąd generowania dokumentu PDF: ' + (e?.message || ''), 'warn');
    }
  }

  private showNotification(text: string, type: 'success' | 'warn'): void {
    this.actionNotification.set({ text, type });
    setTimeout(() => {
      this.actionNotification.set(null);
    }, 4000);
  }

  readonly isGenerating = signal<boolean>(false);
  readonly currentGeneratingId = signal<string | null>(null);
  private abortStreaming = false;

  stopGenerating(): void {
    this.abortStreaming = true;
    this.isGenerating.set(false);
    this.currentGeneratingId.set(null);
  }

  async sendMessage(customText?: string): Promise<void> {
    if (this.isGenerating()) {
      return;
    }

    if (this.isDictating()) {
      this.speech.stop();
    }

    const textToSend = customText || this.inputText().trim();
    if (!textToSend) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      text: textToSend,
    };

    this.chatMessages.update((msgs) => [...msgs, userMsg]);
    this.inputText.set('');
    this.scrollToBottom();

    this.isGenerating.set(true);
    this.currentGeneratingId.set(null);
    this.abortStreaming = false;

    // 1. Ścieżka WebGPU Model
    if (this.useWebGPU() && this.webLLM.status() === 'ready') {
      try {
        const fullResponseText = await this.webLLM.generateResponse(textToSend);
        await this.streamAssistantResponse(
          fullResponseText,
          `Lokalny Model WebGPU (${this.selectedPersona() === 'counsel' ? 'Obrońca' : this.selectedPersona() === 'interrogator' ? 'Śledczy' : 'Obywatel'})`,
          [],
          ['Jakie są terminy przedawnienia?', 'Czy można złożyć wniosek o dozór SDE?']
        );
        return;
      } catch (err) {
        console.warn('WebGPU generation error, falling back to local rule-engine:', err);
      }
    }

    // 2. Ścieżka lokalnego silnika prawno-karnego (Typewriter Streaming z wybraną personą)
    setTimeout(async () => {
      if (this.abortStreaming) return;
      const response = this.aiService.generateChatResponse(textToSend, this.selectedPersona());

      await this.streamAssistantResponse(
        response.text,
        response.legalCategoryBadge,
        response.referencedArticles,
        response.suggestedFollowUps,
        response.actionQuery
      );
    }, 180);
  }

  /**
   * Płynne strumieniowanie odpowiedzi asystenta (efekt maszynopisania token po tokenie)
   */
  private async streamAssistantResponse(
    fullText: string,
    categoryBadge?: string,
    referencedArticles?: string[],
    suggestedFollowUps?: string[],
    actionQuery?: string
  ): Promise<void> {
    const assistantMsgId = `assistant-msg-${Date.now()}`;
    this.currentGeneratingId.set(assistantMsgId);

    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      text: '',
      persona: this.selectedPersona(),
      legalCategoryBadge: categoryBadge,
      referencedArticles: [],
      suggestedFollowUps: [],
      actionQuery: undefined,
    };

    this.chatMessages.update((msgs) => [...msgs, initialAssistantMsg]);
    this.scrollToBottom();

    // Podział tekstu na zwarte kęsy słów (tokeny)
    const tokens = fullText.split(/(?<=\s+)|(?<=[.,;:!?\n])/g);
    let accumulatedText = '';

    for (let i = 0; i < tokens.length; i++) {
      if (this.abortStreaming) {
        break;
      }

      accumulatedText += tokens[i];

      // Aktualizujemy treść w bąbelku
      this.chatMessages.update((msgs) =>
        msgs.map((m) => (m.id === assistantMsgId ? { ...m, text: accumulatedText } : m))
      );

      this.scrollToBottom();

      // Drobne opóźnienie maszynopisania dla naturalnego rytmu
      const delay = tokens[i].includes('\n') ? 35 : tokens[i].length > 4 ? 18 : 10;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Na koniec odsłaniamy odesłania do artykułów i sugerowane pytania
    this.chatMessages.update((msgs) =>
      msgs.map((m) =>
        m.id === assistantMsgId
          ? {
              ...m,
              text: accumulatedText,
              referencedArticles,
              suggestedFollowUps,
              actionQuery,
            }
          : m
      )
    );

    this.isGenerating.set(false);
    this.currentGeneratingId.set(null);
    this.scrollToBottom();
  }

  resetConversation(): void {
    this.chatMessages.set([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        text: 'Historia rozmowy została zresetowana. Jakie zagadnienie prawno-karne chciałbyś przeanalizować?',
        suggestedFollowUps: [
          'Obrona konieczna w domu (art. 25 k.k.)',
          'Przepadek samochodu za alkohol',
          'Zbieg przestępstw i kara łączna',
        ],
      },
    ]);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer?.nativeElement) {
        this.scrollContainer.nativeElement.scrollHeight;
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }
}
