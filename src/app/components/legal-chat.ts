import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChatMessage } from '../models/legal.model';
import { PrawnBotAiService } from '../services/prawn-bot-ai.service';
import { SpeechDictationService } from '../services/speech-dictation.service';

@Component({
  selector: 'app-legal-chat',
  imports: [CommonModule, MatIconModule],
  template: `
    <section id="section-ai-chat" class="space-y-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-6 shadow-xl flex flex-col h-[calc(100dvh-180px)] md:h-[740px] max-h-[850px]">
        <!-- Nagłówek czatu z oznaczeniem bezpieczeństwa i głosu -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 shrink-0">
          <div>
            <h2 class="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <mat-icon class="text-amber-400">smart_toy</mat-icon>
              prawnBot – Asystent Prawny Kancelarii
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              100% lokalny silnik kwalifikacji prawno-karnej. Obsługuje dyktowanie głosem (Web Speech API).
            </p>
          </div>

          <div class="flex items-center gap-2">
            @if (speech.isSupported()) {
              <span class="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <mat-icon class="text-xs">mic</mat-icon>
                <span>Dyktowanie aktywne</span>
              </span>
            } @else {
              <span class="text-[11px] bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1" title="Zalecana przeglądarka Chrome lub Edge">
                <mat-icon class="text-xs text-slate-500">mic_off</mat-icon>
                <span>Głos niedostępny</span>
              </span>
            }
            <button
              (click)="resetConversation()"
              class="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Wyczyść historię rozmowy"
            >
              <mat-icon class="text-xs">restart_alt</mat-icon>
              <span>Reset</span>
            </button>
          </div>
        </div>

        <!-- Szybkie zapytania "Co mi grozi?" (Quick Prompts Chips) -->
        <div class="py-2.5 px-1 border-b border-slate-800/80 shrink-0">
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span class="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1 mr-1">
              <mat-icon class="text-xs text-amber-400">tips_and_updates</mat-icon> Zapytaj prawnBota:
            </span>
            @for (quick of quickPromptSuggestions; track quick) {
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
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-100 max-w-[85%] sm:max-w-xl rounded-2xl rounded-tr-sm p-4'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 max-w-[95%] sm:max-w-2xl rounded-2xl rounded-tl-sm p-4 shadow-md'"
              >
                <!-- Nagłówek wiadomości -->
                <div class="flex items-center justify-between gap-3 text-xs mb-2 opacity-75">
                  <span class="font-semibold flex items-center gap-1">
                    @if (msg.sender === 'assistant') {
                      <mat-icon class="text-xs text-amber-400">balance</mat-icon>
                      <span>prawnBot (AI Kancelaria)</span>
                    } @else {
                      <mat-icon class="text-xs text-amber-300">person</mat-icon>
                      <span>Prawnik / Użytkownik</span>
                    }
                  </span>
                  <span class="font-mono text-[10px]">{{ msg.timestamp }}</span>
                </div>

                <!-- Etykieta kategorii prawnej (jeśli wykryto) -->
                @if (msg.legalCategoryBadge) {
                  <div class="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    <mat-icon class="text-xs text-amber-400">gavel</mat-icon>
                    <span>{{ msg.legalCategoryBadge }}</span>
                  </div>
                }

                <!-- Treść wiadomości -->
                <div class="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {{ msg.text }}
                </div>

                <!-- Odesłania do artykułów prawnych -->
                @if (msg.referencedArticles && msg.referencedArticles.length > 0) {
                  <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
                    <span class="text-slate-400 flex items-center gap-1 text-[11px]">
                      <mat-icon class="text-xs text-amber-400">menu_book</mat-icon> Powiązane przepisy:
                    </span>
                    @for (art of msg.referencedArticles; track art) {
                      <button
                        type="button"
                        (click)="inspectArticle.emit(art)"
                        class="bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-700/80 px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors"
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
        <div class="pt-3 border-t border-slate-800 shrink-0">
          <div class="flex items-center gap-2">
            <!-- Przycisk Web Speech API dyktowania -->
            <button
              id="btn-chat-speech-dictation"
              type="button"
              (click)="toggleChatDictation()"
              [class]="isDictating()
                ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30'
                : 'bg-slate-800 text-slate-300 hover:text-amber-300 hover:bg-slate-700'"
              class="p-3 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0"
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
                class="w-full bg-slate-950 border border-slate-700/90 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              @if (inputText()) {
                <button
                  type="button"
                  (click)="inputText.set('')"
                  class="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                  title="Wyczyść"
                >
                  <mat-icon class="text-base">close</mat-icon>
                </button>
              }
            </div>

            <!-- Przycisk wysłania -->
            <button
              id="btn-send-chat-message"
              (click)="sendMessage()"
              class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
            >
              <mat-icon class="text-base">send</mat-icon>
              <span class="hidden sm:inline">Wyślij</span>
            </button>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <span>Działa w 100% offline bez wysyłania danych do chmury.</span>
            <span>Skróty dyktowania: „kropka”, „przecinek”, „artykuł”, „paragraf”.</span>
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
  private readonly aiService = inject(PrawnBotAiService);

  readonly openCalculator = output<string>();
  readonly inspectArticle = output<string>();

  readonly quickPromptSuggestions = [
    'Co mi grozi za zakłócanie ciszy nocnej?',
    'Jazda bez uprawnień (art. 94 k.w.)',
    'Posiadanie marihuany na własny użytek',
    'Hejt w internecie i opinie google (art. 212 k.k.)',
    'Porysowanie auta na parkingu (art. 288 k.k.)',
    'Jazda po 2 piwach (konfiskata auta)',
    'Płatność cudzą kartą zbliżeniową',
  ];

  readonly inputText = signal<string>('');
  readonly chatMessages = signal<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      timestamp: '11:00',
      text: 'Dzień dobry. Jestem **prawnBot** – asystent prawa karnego. Działam w 100% lokalnie i bezpiecznie na Twoim urządzeniu, gwarantując bezwzględną poufność danych. Możesz pisać lub **dyktować zapytania głosem** za pomocą mikrofonu.\n\nW czym mogę pomóc Twojej kancelarii lub w Twojej sprawie karnej?',
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

  sendMessage(customText?: string): void {
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

    // Lokalna odpowiedź asystenta prawnBot
    setTimeout(() => {
      const response = this.aiService.generateChatResponse(textToSend);
      this.chatMessages.update((msgs) => [...msgs, response]);
      this.scrollToBottom();
    }, 150);
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
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }
}
