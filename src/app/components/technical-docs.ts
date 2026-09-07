import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-technical-docs',
  imports: [CommonModule, MatIconModule],
  template: `
    <section id="section-technical-docs" class="space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <mat-icon class="text-amber-400">terminal</mat-icon>
              Dokumentacja Architektury, Konteneryzacji & CI/CD
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Specyfikacja wdrożenia dla kancelarii prawnej: Docker, Nginx SSL, Web Speech API, szyfrowanie AES-256 i pipeline CI/CD.
            </p>
          </div>
          <span class="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg font-mono">
            v1.2.0 Decomposed
          </span>
        </div>

        <!-- Nowość: Web Speech API w Kancelarii -->
        <div class="bg-slate-950/80 border border-amber-500/30 rounded-xl p-5">
          <h3 class="text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
            <mat-icon class="text-base text-amber-400">mic</mat-icon>
            Integracja Web Speech API (pl-PL) – Dyktowanie w Trybie Offline
          </h3>
          <p class="text-xs text-slate-300 leading-relaxed mb-3">
            System integruje natywny interfejs <code class="text-amber-300 font-mono">window.SpeechRecognition</code> z wbudowanym formatowaniem
            terminologii karnistycznej. Prawnik może dyktować notatki ze spotkań, protokoły rozpraw oraz zapytania do chatbota bez odrywania rąk.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div class="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span class="font-bold text-slate-200 block mb-1">01. Zero Chmury</span>
              <p class="text-slate-400">Dźwięk przetwarzany jest na poziomie silnika przeglądarki lub lokalnego modelu OS, bez wysyłania nagrań na obce serwery.</p>
            </div>
            <div class="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span class="font-bold text-slate-200 block mb-1">02. Punctuation Parser</span>
              <p class="text-slate-400">Automatyczna translacja komend <em>„kropka”</em>, <em>„przecinek”</em>, <em>„nowy akapit”</em>, <em>„paragraf”</em> na znaki interpunkcyjne.</p>
            </div>
            <div class="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span class="font-bold text-slate-200 block mb-1">03. Real-time Stream</span>
              <p class="text-slate-400">Dwustopniowa prezentacja transkrypcji: wyniki pośrednie (interim) i zatwierdzone frazy (final) w reaktywnych sygnałach Angulara.</p>
            </div>
          </div>
        </div>

        <!-- Porównanie Architektoniczne Web vs Python/Streamlit -->
        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
          <h3 class="text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
            <mat-icon class="text-base">compare_arrows</mat-icon>
            Analiza Architektoniczna: TypeScript Web Engine vs Python + Streamlit + ChromaDB
          </h3>
          <p class="text-xs text-slate-300 leading-relaxed mb-3">
            W architekturze dla kancelarii prawnych kluczowe jest spełnienie wymogu <strong>tajemnicy zawodowej</strong> oraz <strong>100% działania offline na laptopie mecenasa na sali sądowej</strong>:
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="bg-slate-900 p-3.5 rounded-lg border border-emerald-500/30">
              <span class="font-bold text-emerald-400 block mb-1">✓ Wybrane rozwiązanie (prawnBot Web Engine):</span>
              <ul class="space-y-1 text-slate-300 list-disc list-inside">
                <li>0ms opóźnienia, natychmiastowe ładowanie bez przeładowywania interfejsu</li>
                <li>Kryptografia AES-GCM 256-bit w pamięci RAM sesji (Web Crypto API)</li>
                <li>Działa offline bez konieczności instalowania Pythona i bibliotek C++</li>
                <li>Gotowy kontener Docker produkcyjny (wielostopniowy Alpine Linux)</li>
              </ul>
            </div>
            <div class="bg-slate-900 p-3.5 rounded-lg border border-slate-800">
              <span class="font-bold text-slate-400 block mb-1">Alternatywa Python/Streamlit:</span>
              <ul class="space-y-1 text-slate-400 list-disc list-inside">
                <li>Streamlit odświeża całą aplikację przy każdej zmianie pola (mniej ergonomiczne na rozprawie)</li>
                <li>ChromaDB wymaga kompilatorów C++ i dużej ilości pamięci RAM (2-4 GB)</li>
                <li>Ryzyko niezaszyfrowanych danych w plikach sqlite</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Instrukcja Uruchomienia Kontenera Docker -->
        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <mat-icon class="text-base text-amber-400">developer_board</mat-icon>
            Polecenia Uruchomienia w Kontenerze Docker (docker-compose.yml):
          </h3>
          <div class="bg-slate-900 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-amber-300">
            <span class="text-slate-500"># Zbudowanie i uruchomienie kontenera w tle:</span><br>
            docker compose up -d --build<br><br>
            <span class="text-slate-500"># Podgląd logów aplikacji w czasie rzeczywistym:</span><br>
            docker compose logs -f<br><br>
            <span class="text-slate-500"># Zatrzymanie kontenera:</span><br>
            docker compose down
          </div>
        </div>

        <!-- Konfiguracja Bezpieczeństwa SSL NGINX -->
        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <mat-icon class="text-base text-amber-400">https</mat-icon>
            Konfiguracja Bezpieczeństwa SSL/TLS & Nagłówki HTTP (nginx.conf):
          </h3>
          <ul class="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li><strong>Wymuszenie protokołów:</strong> Wyłącznie TLS 1.2 oraz nowoczesny TLS 1.3 z szyframi ECDHE-AES-GCM</li>
            <li><strong>Nagłówki bezpieczeństwa:</strong> Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Content-Type-Options, X-Frame-Options</li>
            <li><strong>Ochrona przed DoS:</strong> Moduł Rate Limiting (limit_req) ograniczający intensywność zapytań</li>
          </ul>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalDocs {}
