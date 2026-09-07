import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ExtractedCourtCaseInfo, OcrScannerService } from '../services/ocr-scanner.service';
import { LegalDataService } from '../services/legal-data.service';

@Component({
  selector: 'app-document-scanner-modal',
  imports: [CommonModule, MatIconModule],
  template: `
    @if (isOpen()) {
      <div
        id="modal-document-scanner"
        class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-5 shadow-2xl space-y-5 my-auto max-h-[95vh] flex flex-col">
          <!-- Nagłówek -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <mat-icon class="text-xl">document_scanner</mat-icon>
              </div>
              <div>
                <h3 class="font-bold text-white text-base flex items-center gap-2">
                  Lokalny Skaner Dokumentów Procesowych (OCR)
                  <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    100% Offline / WASM
                  </span>
                </h3>
                <p class="text-xs text-slate-400">
                  Rozpoznawanie pism, wyroków i pouczeń bezpośrednio w Twojej przeglądarce bez wysyłania do chmury.
                </p>
              </div>
            </div>
            <button
              (click)="close()"
              class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Zamknij"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Główny obszar roboczy skanera -->
          <div class="flex-1 overflow-y-auto space-y-4 pr-1">
            <!-- Zakładki wyboru źródła: Kamera vs Plik -->
            <div class="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                (click)="switchMode('camera')"
                [class]="mode() === 'camera' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                class="px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <mat-icon class="text-sm">videocam</mat-icon>
                <span>Kamera na żywo (Ramka A4)</span>
              </button>
              <button
                type="button"
                (click)="switchMode('file')"
                [class]="mode() === 'file' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                class="px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <mat-icon class="text-sm">upload_file</mat-icon>
                <span>Wczytaj plik (Skan / Zdjęcie)</span>
              </button>
            </div>

            <!-- Widok kamery -->
            @if (mode() === 'camera') {
              <div class="relative bg-black rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
                <video
                  #videoPlayer
                  autoplay
                  playsinline
                  class="w-full max-h-[420px] object-contain"
                ></video>

                <!-- Nakładka kadrowania dokumentu A4 -->
                <div class="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                  <div class="w-[70%] max-w-[340px] aspect-[1/1.414] border-2 border-dashed border-amber-400/70 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] relative flex flex-col justify-between p-2">
                    <div class="text-[10px] text-amber-300 font-mono bg-slate-950/80 px-2 py-0.5 rounded self-start border border-amber-500/30">
                      Ramka formatu A4
                    </div>
                    <div class="text-[10px] text-slate-300 font-medium bg-slate-950/80 px-2 py-0.5 rounded text-center border border-slate-700">
                      Dopasuj pismo sądowe do ramki
                    </div>
                  </div>
                </div>

                <!-- Kontrolki kamery -->
                <div class="absolute bottom-3 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    (click)="captureFrameAndScan()"
                    [disabled]="ocrService.isProcessing()"
                    class="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <mat-icon class="text-base">photo_camera</mat-icon>
                    <span>Wykonaj zdjęcie i skanuj</span>
                  </button>
                </div>
              </div>
            }

            <!-- Widok uploadu pliku -->
            @if (mode() === 'file') {
              <div
                (dragover)="$event.preventDefault()"
                (drop)="handleFileDrop($event)"
                class="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-8 text-center bg-slate-950/50 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer"
                (click)="fileInput.click()"
              >
                <input
                  #fileInput
                  type="file"
                  accept="image/*,application/pdf"
                  class="hidden"
                  (change)="handleFileSelect($event)"
                />
                <div class="p-3 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                  <mat-icon class="text-3xl">add_photo_alternate</mat-icon>
                </div>
                <div>
                  <div class="text-sm font-semibold text-white">Przeciągnij plik pisma procesowego lub kliknij</div>
                  <div class="text-xs text-slate-400 mt-1">Obsługiwane formaty: PNG, JPEG, WEBP</div>
                </div>
              </div>
            }

            <!-- Pasek postępu lokalnego OCR -->
            @if (ocrService.isProcessing()) {
              <div class="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-2 animate-pulse">
                <div class="flex items-center justify-between text-xs text-amber-300 font-mono">
                  <span>{{ ocrService.statusMessage() }}</span>
                  <span>{{ ocrService.progressPercentage() }}%</span>
                </div>
                <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    class="bg-amber-500 h-2 transition-all duration-300 rounded-full"
                    [style.width.%]="ocrService.progressPercentage()"
                  ></div>
                </div>
              </div>
            }

            <!-- Wyniki rozpoznania i ekstrakcji prawnej -->
            @if (extractedData(); as data) {
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span class="text-xs font-bold text-white flex items-center gap-1.5">
                    <mat-icon class="text-amber-400 text-sm">fact_check</mat-icon>
                    Wyniki analizy procesowej pisma
                  </span>
                  <span class="text-[11px] font-mono text-slate-400">
                    Pewność OCR: {{ data.confidence | number:'1.0-0' }}%
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <!-- Sygnatura -->
                  <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div class="text-[11px] font-mono text-slate-400 mb-1">Wyekstrahowana sygnatura akt:</div>
                    <div class="text-sm font-bold text-amber-300 font-mono">
                      {{ data.caseSignature || 'Nie wykryto jednoznacznie' }}
                    </div>
                  </div>

                  <!-- Kwalifikacja / Artykuły -->
                  <div class="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div class="text-[11px] font-mono text-slate-400 mb-1">Zidentyfikowane artykuły:</div>
                    <div class="flex flex-wrap gap-1">
                      @for (art of data.articles; track art) {
                        <span class="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                          {{ art }}
                        </span>
                      } @empty {
                        <span class="text-xs text-slate-500">Brak powołań na k.k./k.p.k.</span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Terminy zawite -->
                @if (data.deadlines.length > 0) {
                  <div class="space-y-2">
                    <div class="text-xs font-semibold text-rose-300 flex items-center gap-1">
                      <mat-icon class="text-xs">timer</mat-icon>
                      Wykryte terminy zawite / środki zaskarżenia:
                    </div>
                    <div class="space-y-1.5">
                      @for (dl of data.deadlines; track dl.title) {
                        <div class="bg-rose-950/20 border border-rose-500/30 rounded-lg p-2.5 text-xs text-rose-200 flex items-start justify-between gap-2">
                          <div>
                            <div class="font-bold flex items-center gap-1.5">
                              <span>{{ dl.title }}</span>
                              <span class="text-[10px] font-mono bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/40 text-rose-300">
                                {{ dl.basis }}
                              </span>
                            </div>
                            <div class="text-[11px] text-slate-400 mt-0.5">{{ dl.description }}</div>
                          </div>
                          <span class="font-bold text-sm text-rose-400 font-mono whitespace-nowrap">
                            {{ dl.days }} DNI
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Rozpoznana treść tekstowa -->
                <div>
                  <label class="text-[11px] font-semibold text-slate-400 block mb-1">
                    Rozpoznana treść pisma (surowy tekst):
                  </label>
                  <textarea
                    rows="5"
                    [value]="data.rawText"
                    readonly
                    class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono leading-relaxed"
                  ></textarea>
                </div>

                <!-- Akcje eksportu -->
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    (click)="saveToNotes(data)"
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <mat-icon class="text-sm">save</mat-icon>
                    <span>Zapisz w Notatkach Kancelaryjnych</span>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Ukryty canvas do przechwytywania klatek -->
          <canvas #hiddenCanvas class="hidden"></canvas>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentScannerModalComponent implements OnDestroy {
  readonly ocrService = inject(OcrScannerService);
  private readonly legalData = inject(LegalDataService);

  readonly isOpen = input<boolean>(false);
  readonly closeModal = output<void>();
  readonly documentSavedToNotes = output<void>();

  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;
  @ViewChild('hiddenCanvas') hiddenCanvas?: ElementRef<HTMLCanvasElement>;

  readonly mode = signal<'camera' | 'file'>('camera');
  readonly extractedData = signal<ExtractedCourtCaseInfo | null>(null);

  private mediaStream: MediaStream | null = null;

  switchMode(newMode: 'camera' | 'file'): void {
    this.mode.set(newMode);
    if (newMode === 'camera') {
      this.initCamera();
    } else {
      this.stopCamera();
    }
  }

  async initCamera(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    try {
      this.stopCamera();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (this.videoPlayer?.nativeElement) {
        this.videoPlayer.nativeElement.srcObject = this.mediaStream;
      }
    } catch (err) {
      console.warn('Brak dostępu do kamery lub odmowa uprawnień:', err);
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
  }

  async captureFrameAndScan(): Promise<void> {
    const video = this.videoPlayer?.nativeElement;
    const canvas = this.hiddenCanvas?.nativeElement;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      const result = await this.ocrService.recognizeDocument(canvas);
      this.extractedData.set(result);
    } catch (err: any) {
      alert(err.message || 'Błąd skanowania klatki kamery.');
    }
  }

  async handleFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      await this.processFile(input.files[0]);
    }
  }

  async handleFileDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      await this.processFile(event.dataTransfer.files[0]);
    }
  }

  private async processFile(file: File): Promise<void> {
    try {
      const result = await this.ocrService.recognizeDocument(file);
      this.extractedData.set(result);
    } catch (err: any) {
      alert(err.message || 'Błąd rozpoznawania pliku.');
    }
  }

  async saveToNotes(data: ExtractedCourtCaseInfo): Promise<void> {
    const title = data.caseSignature ? `Skan pisma: ${data.caseSignature}` : 'Skan pisma procesowego';
    const linkedArticle = data.articles.length > 0 ? data.articles[0] : undefined;

    let content = data.rawText;
    if (data.deadlines.length > 0) {
      content = `--- WYKRYTE TERMINY ZAWITE ---\n` +
        data.deadlines.map((d) => `• ${d.title} (${d.days} dni, ${d.basis})`).join('\n') +
        `\n\n--- TREŚĆ PISMA ---\n` +
        content;
    }

    try {
      await this.legalData.saveNote({
        title,
        content,
        category: 'Sprawa klienta',
        linkedArticle,
        tags: ['OCR', data.caseSignature || 'Sąd'].filter(Boolean),
      });

      alert('Pomyślnie zapisano pismo do zaszyfrowanych notatek kancelaryjnych!');
      this.documentSavedToNotes.emit();
      this.close();
    } catch (err: any) {
      alert(err.message || 'Nie udało się zapisać notatki.');
    }
  }

  close(): void {
    this.stopCamera();
    this.extractedData.set(null);
    this.closeModal.emit();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
