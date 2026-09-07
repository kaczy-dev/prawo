import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LegalDataService } from '../services/legal-data.service';
import { PenalArticle } from '../models/legal.model';
import { CryptoService } from '../services/crypto.service';

export interface PaletteCommand {
  id: string;
  category: 'article' | 'action' | 'template' | 'navigation';
  title: string;
  subtitle?: string;
  badge?: string;
  icon: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette-modal',
  imports: [CommonModule, MatIconModule],
  template: `
    <div
      id="modal-command-palette"
      class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-fade-in"
      (click)="onBackdropClick($event)"
      (keydown.escape)="close.emit()"
      tabindex="-1"
    >
      <div
        class="bg-slate-900 border border-amber-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] border-t-2 border-t-amber-400"
        (click)="$event.stopPropagation()"
      >
        <!-- Pasek wyszukiwania Spotlight -->
        <div class="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/70 flex items-center gap-3">
          <mat-icon class="text-amber-400 text-xl pointer-events-none">manage_search</mat-icon>
          <input
            #searchInput
            id="input-command-palette"
            type="text"
            [value]="searchQuery()"
            (input)="onSearchInput($any($event.target).value)"
            (keydown)="handleInputKeyDown($event)"
            placeholder="Szukaj artykułu k.k. (np. 178a, 278), pisma procesowego lub akcji..."
            class="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none text-sm sm:text-base font-sans"
          />
          <kbd class="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">ESC</kbd>
        </div>

        <!-- Lista poleceń -->
        <div class="overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40 max-h-[60vh]">
          @for (cmd of filteredCommands(); track cmd.id; let i = $index) {
            <button
              type="button"
              (click)="executeCommand(cmd)"
              (mouseenter)="selectedIndex.set(i)"
              [class]="selectedIndex() === i
                ? 'bg-amber-500/15 border-amber-500/40 text-white'
                : 'hover:bg-slate-800/60 border-transparent text-slate-300'"
              class="w-full text-left px-3 py-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors cursor-pointer group"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div
                  [class]="selectedIndex() === i ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400 group-hover:text-amber-300'"
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                >
                  <mat-icon class="text-base">{{ cmd.icon }}</mat-icon>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-xs sm:text-sm font-semibold truncate">{{ cmd.title }}</span>
                    @if (cmd.badge) {
                      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 shrink-0">
                        {{ cmd.badge }}
                      </span>
                    }
                  </div>
                  @if (cmd.subtitle) {
                    <p class="text-[11px] text-slate-400 truncate mt-0.5">{{ cmd.subtitle }}</p>
                  }
                </div>
              </div>
              <mat-icon class="text-sm text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</mat-icon>
            </button>
          } @empty {
            <div class="text-center py-10 text-slate-500 text-sm">
              <mat-icon class="text-3xl text-slate-600 block mx-auto mb-1">search_off</mat-icon>
              Brak poleceń pasujących do zapytania.
            </div>
          }
        </div>

        <!-- Stopka ze skrótami klawiszowymi -->
        <div class="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <div class="flex items-center gap-3">
            <span><kbd class="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300">↑↓</kbd> Nawiguj</span>
            <span><kbd class="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300">Enter</kbd> Wybierz</span>
            <span><kbd class="font-mono bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300">Esc</kbd> Zamknij</span>
          </div>
          <span class="text-amber-400/80 font-mono text-[10px]">Spotlight Command Palette</span>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteModal {
  readonly legalData = inject(LegalDataService);
  readonly cryptoService = inject(CryptoService);

  readonly close = output<void>();
  readonly navigateToTab = output<string>();
  readonly selectArticle = output<PenalArticle>();
  readonly toggleVault = output<void>();
  readonly openTemplate = output<string>();
  readonly openScanner = output<void>();

  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  readonly searchQuery = signal<string>('');
  readonly selectedIndex = signal<number>(0);

  constructor() {
    setTimeout(() => {
      this.searchInput()?.nativeElement.focus();
    }, 60);
  }

  onSearchInput(val: string): void {
    this.searchQuery.set(val);
    this.selectedIndex.set(0);
  }

  onBackdropClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) {
      this.close.emit();
    }
  }

  readonly allCommands = computed<PaletteCommand[]>(() => {
    const commands: PaletteCommand[] = [
      {
        id: 'nav-threat',
        category: 'navigation',
        title: 'Kalkulator Zagrożenia Karnego (Co mi grozi?)',
        subtitle: 'Symulacja sankcji, środki karne, orzecznictwo SN',
        icon: 'gavel',
        badge: 'Moduł',
        action: () => this.navigateToTab.emit('threat-calc'),
      },
      {
        id: 'nav-cases',
        category: 'navigation',
        title: 'Pulpit Kancelaryjny: Aktywne Sprawy & Dossier',
        subtitle: 'Zarządzanie sprawami, przypięte artykuły k.k. i historia analiz',
        icon: 'folder_shared',
        badge: 'Moduł',
        action: () => this.navigateToTab.emit('cases'),
      },
      {
        id: 'nav-code',
        category: 'navigation',
        title: 'Kodeks Karny (Baza Artykułów)',
        subtitle: 'Przeglądaj artykuły, nowelizacje 2023/2024, tryb skupienia',
        icon: 'menu_book',
        badge: 'Moduł',
        action: () => this.navigateToTab.emit('penal-code'),
      },
      {
        id: 'nav-chat',
        category: 'navigation',
        title: 'Asystent Prawny AI (Czat obrończy)',
        subtitle: 'Zadaj pytanie radcy prawnemu z pełnym kontekstem k.k.',
        icon: 'smart_toy',
        badge: 'Moduł',
        action: () => this.navigateToTab.emit('legal-chat'),
      },
      {
        id: 'nav-vault',
        category: 'navigation',
        title: this.cryptoService.isAuthenticated() ? 'Zablokuj Sejf AES-256 (Ctrl+Shift+L)' : 'Odblokuj Sejf Kancelaryjny',
        subtitle: 'Zaszyfrowane notatki klienta, dossier sprawy',
        icon: this.cryptoService.isAuthenticated() ? 'lock_open' : 'lock',
        badge: 'Bezpieczeństwo',
        action: () => this.toggleVault.emit(),
      },
      {
        id: 'nav-scanner',
        category: 'navigation',
        title: 'Skaner Dokumentów Procesowych (100% Offline OCR)',
        subtitle: 'Rozpoznawanie sygnatur, terminów zawitych k.p.k. i pism z kamery/pliku',
        icon: 'document_scanner',
        badge: 'OCR WASM',
        action: () => this.openScanner.emit(),
      },
      {
        id: 'tmpl-art66',
        category: 'template',
        title: 'Wzór: Wniosek o warunkowe umorzenie (art. 66 k.k.)',
        subtitle: 'Gotowy szablon obrończy z uzasadnieniem i wnioskami dowodowymi',
        icon: 'description',
        badge: 'Wzór Pisma',
        action: () => {
          this.navigateToTab.emit('encrypted-notes');
          this.openTemplate.emit('art66');
        },
      },
      {
        id: 'tmpl-art169',
        category: 'template',
        title: 'Wzór: Wniosek dowodowy w śledztwie (art. 169 k.p.k.)',
        subtitle: 'Wniosek o powołanie biegłego lub przesłuchanie świadka',
        icon: 'post_add',
        badge: 'Wzór Pisma',
        action: () => {
          this.navigateToTab.emit('encrypted-notes');
          this.openTemplate.emit('art169');
        },
      },
      {
        id: 'tmpl-driving',
        category: 'template',
        title: 'Wzór: Zażalenie na zatrzymanie prawa jazdy',
        subtitle: 'Art. 135b ustawy Prawo o ruchu drogowym w zw. z k.p.k.',
        icon: 'drive_eta',
        badge: 'Wzór Pisma',
        action: () => {
          this.navigateToTab.emit('encrypted-notes');
          this.openTemplate.emit('driving');
        },
      },
      {
        id: 'tmpl-art60',
        category: 'template',
        title: 'Wzór: Wniosek o nadzwyczajne złagodzenie kary (art. 60 § 2 k.k.)',
        subtitle: 'Pojednanie z pokrzywdzonym, naprawienie szkody i wniosek o karę wolnościową',
        icon: 'balance',
        badge: 'Wzór Pisma',
        action: () => {
          this.navigateToTab.emit('encrypted-notes');
          this.openTemplate.emit('art60');
        },
      },
      {
        id: 'tmpl-uopn62a',
        category: 'template',
        title: 'Wzór: Wniosek o umorzenie postępowania z art. 62a UoPN',
        subtitle: 'Posiadanie nieznacznej ilości na własny użytek – wniosek do prokuratury',
        icon: 'medication',
        badge: 'Wzór UoPN',
        action: () => {
          this.navigateToTab.emit('encrypted-notes');
          this.openTemplate.emit('uopn62a');
        },
      },
    ];

    for (const art of this.legalData.articles()) {
      const prefix = art.codePrefix || 'k.k.';
      commands.push({
        id: 'art-' + art.id,
        category: 'article',
        title: `Art. ${art.number}${art.suffix || ''} ${prefix} – ${art.title}`,
        subtitle: art.content.slice(0, 80) + '...',
        badge: art.recentAmendment ? 'Nowela 2024' : prefix,
        icon: 'gavel',
        action: () => {
          this.selectArticle.emit(art);
          this.navigateToTab.emit('penal-code');
        },
      });
    }

    return commands;
  });

  readonly filteredCommands = computed<PaletteCommand[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.allCommands().slice(0, 15);

    return this.allCommands()
      .filter((cmd) => {
        return (
          cmd.title.toLowerCase().includes(q) ||
          (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
          (cmd.badge && cmd.badge.toLowerCase().includes(q))
        );
      })
      .slice(0, 25);
  });

  handleInputKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close.emit();
      return;
    }
    const total = this.filteredCommands().length;
    if (total === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex.set((this.selectedIndex() + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex.set((this.selectedIndex() - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = this.filteredCommands()[this.selectedIndex()];
      if (current) {
        this.executeCommand(current);
      }
    }
  }

  executeCommand(cmd: PaletteCommand): void {
    cmd.action();
    this.close.emit();
  }
}
