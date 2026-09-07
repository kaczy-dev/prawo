import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { SpeechDictationService } from './speech-dictation.service';
import { TextToSpeechService } from './text-to-speech.service';
import { CourtRuling, PenalArticle } from '../models/legal.model';

export type VoiceInteractionMode = 'idle' | 'listening' | 'speaking' | 'barge_in';

@Injectable({
  providedIn: 'root',
})
export class VoiceOrchestratorService {
  private readonly speech = inject(SpeechDictationService);
  private readonly tts = inject(TextToSpeechService);
  private readonly destroyRef = inject(DestroyRef);

  // Statusy reaktywne całego pipeline'u głosowego
  readonly isBargeInEnabled = signal<boolean>(true);
  readonly voiceActivityLevel = signal<number>(0);
  readonly isVadListening = signal<boolean>(false);
  readonly lastVoiceEvent = signal<string>('');

  // Audio Context & Analyser dla natywnego Web Audio API VAD
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;
  private vadAnimationId: number | null = null;
  private speechEventListener: (() => void) | null = null;
  private consecutiveVoiceHits = 0;

  // Próg czułości VAD (wartość RMS od 0 do 100)
  private readonly VAD_RMS_THRESHOLD = 18;
  private readonly VAD_CONSECUTIVE_REQUIRED = 2;

  readonly isSpeaking = computed(() => this.tts.isPlaying() && !this.tts.isPaused());
  readonly isListening = computed(() => this.speech.isListening());

  readonly interactionMode = computed<VoiceInteractionMode>(() => {
    if (this.speech.isListening()) {
      return 'listening';
    }
    if (this.tts.isPlaying()) {
      return 'speaking';
    }
    return 'idle';
  });

  constructor() {
    this.setupBargeInHooks();
    this.destroyRef.onDestroy(() => {
      this.cleanupAllResources();
    });
  }

  /**
   * Rejestruje nasłuch rozpoznawania mowy – gdy użytkownik zaczyna mówić do mikrofonu,
   * a lektor odtwarza artykuł/orzeczenie, natychmiast przerywamy mowę lektora (Barge-in).
   */
  private setupBargeInHooks(): void {
    if (typeof window !== 'undefined') {
      this.speechEventListener = () => {
        if (this.isBargeInEnabled() && this.tts.isPlaying()) {
          this.triggerBargeIn('speech-recognition');
        }
      };
      window.addEventListener('prawnbot-speech-detected', this.speechEventListener);
    }
  }

  /**
   * Włącza ciągły monitor VAD (Voice Activity Detection) z mikrofonu przez Web Audio API.
   * 100% lokalny, zero kosztów, opóźnienie poniżej 50 ms.
   */
  async startVadMonitoring(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioCtx();
      }

      if (this.sourceNode) {
        this.sourceNode.disconnect();
      }
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;
      this.sourceNode.connect(this.analyser);

      this.isVadListening.set(true);
      this.loopVadDetection();
      return true;
    } catch (e) {
      console.warn('[VoiceOrchestrator] Nie udało się zainicjalizować VAD przez Web Audio API:', e);
      this.isVadListening.set(false);
      return false;
    }
  }

  private loopVadDetection = (): void => {
    if (!this.isVadListening() || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = Math.round(sum / dataArray.length);
    this.voiceActivityLevel.set(average);

    // Jeśli lektor mówi, a użytkownik zaczyna mówić z odpowiednią głośnością -> BARGE-IN!
    if (this.isBargeInEnabled() && this.tts.isPlaying() && !this.tts.isPaused()) {
      if (average > this.VAD_RMS_THRESHOLD) {
        this.consecutiveVoiceHits++;
        if (this.consecutiveVoiceHits >= this.VAD_CONSECUTIVE_REQUIRED) {
          this.triggerBargeIn('audio-vad');
          this.consecutiveVoiceHits = 0;
        }
      } else {
        this.consecutiveVoiceHits = Math.max(0, this.consecutiveVoiceHits - 1);
      }
    }

    this.vadAnimationId = requestAnimationFrame(this.loopVadDetection);
  };

  /**
   * Zatrzymuje monitoring VAD
   */
  stopVadMonitoring(): void {
    if (this.vadAnimationId) {
      cancelAnimationFrame(this.vadAnimationId);
      this.vadAnimationId = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // Ignoruj błąd rozłączenia węzła
      }
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // Ignoruj błąd zamknięcia
      }
      this.audioContext = null;
    }

    this.isVadListening.set(false);
    this.voiceActivityLevel.set(0);
  }

  private cleanupAllResources(): void {
    this.stopVadMonitoring();
    if (typeof window !== 'undefined' && this.speechEventListener) {
      window.removeEventListener('prawnbot-speech-detected', this.speechEventListener);
      this.speechEventListener = null;
    }
  }

  /**
   * Wykonanie natychmiastowego przerwania mowy lektora (Barge-In)
   */
  triggerBargeIn(source: 'audio-vad' | 'speech-recognition' | 'manual'): void {
    this.tts.stop();
    this.lastVoiceEvent.set(`Barge-in wyzwolony przez ${source}`);
  }

  toggleBargeIn(): void {
    this.isBargeInEnabled.update((v) => !v);
  }

  /**
   * Odsłuchanie artykułu lub orzeczenia z aktywnym barge-in
   */
  speakArticle(article: PenalArticle): void {
    if (!this.isVadListening()) {
      this.startVadMonitoring().catch(() => {});
    }
    this.tts.speakArticle(article);
  }

  speakRuling(ruling: CourtRuling): void {
    if (!this.isVadListening()) {
      this.startVadMonitoring().catch(() => {});
    }
    this.tts.speakRuling(ruling);
  }

  stopAll(): void {
    this.tts.stop();
    this.speech.stop();
  }
}
