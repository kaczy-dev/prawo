import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LegalDictionaryService } from '../services/legal-dictionary.service';

@Component({
  selector: 'app-legal-context-tooltip',
  imports: [CommonModule, MatIconModule],
  template: `
    @if (dict.activeTooltip(); as tooltip) {
      <div
        id="legal-context-tooltip"
        class="fixed z-[60] bg-slate-900/95 border border-amber-500/60 rounded-xl p-3.5 shadow-2xl max-w-xs sm:max-w-sm backdrop-blur-md animate-fade-in text-left pointer-events-auto"
        [style.left.px]="tooltip.x"
        [style.top.px]="tooltip.y"
      >
        <div class="flex items-start justify-between gap-2 mb-1.5">
          <div class="flex items-center gap-1.5">
            <mat-icon class="text-amber-400 text-sm">auto_stories</mat-icon>
            <span class="font-bold text-xs text-white">{{ tooltip.term.term }}</span>
          </div>
          <button
            type="button"
            (click)="closeTooltip($event)"
            class="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            title="Zamknij"
          >
            <mat-icon class="text-xs">close</mat-icon>
          </button>
        </div>

        <p class="text-[11px] text-slate-300 line-clamp-3 leading-relaxed mb-2.5">
          {{ tooltip.term.plainDefinition }}
        </p>

        <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-[10px]">
          <span class="text-slate-400 font-mono">{{ tooltip.term.legalBasis }}</span>
          <button
            type="button"
            (click)="openFullDefinition(tooltip.term.id, $event)"
            class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Otwórz Słownik</span>
            <mat-icon class="text-[12px]">open_in_new</mat-icon>
          </button>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalContextTooltip {
  readonly dict = inject(LegalDictionaryService);

  closeTooltip(e: MouseEvent): void {
    e.stopPropagation();
    this.dict.hideTooltip();
  }

  openFullDefinition(termId: string, e: MouseEvent): void {
    e.stopPropagation();
    this.dict.openModal(termId);
  }
}
