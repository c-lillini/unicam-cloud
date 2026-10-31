import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LANGUAGE_SAMPLES, LanguageSample } from '../tokenizers/samples';
import { ratio } from '../tokenizers/text-stats';
import { TokenizerService } from '../tokenizers/tokenizer.service';
import { TokenView } from './token-view';
import { TokenizerStatus } from './tokenizer-status';

interface Cell {
  tokens: number | null;
  /** Token rispetto alla frase inglese con lo stesso tokenizer (solo per le traduzioni). */
  vsEnglish: number | null;
}

/** Vista "Confronta lingue": la stessa frase in più lingue, contata da tutti i tokenizer. */
@Component({
  selector: 'app-compare-view',
  imports: [TokenView, TokenizerStatus, DecimalPipe],
  templateUrl: './compare-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompareView {
  protected readonly tokenizers = inject(TokenizerService);

  protected readonly samples = signal<LanguageSample[]>([...LANGUAGE_SAMPLES]);
  protected readonly selected = signal<{ code: string; tokenizer: string }>({
    code: 'it',
    tokenizer: this.tokenizers.catalog[0].id,
  });

  /** Tabella righe (lingue) × colonne (tokenizer). */
  protected readonly table = computed(() => {
    const rows = this.samples();
    const english = rows.find((r) => r.code === 'en')!;
    return rows.map((row) => ({
      row,
      cells: this.tokenizers.catalog.map((t): Cell => {
        const n = this.tokenizers.encode(t.id, row.text)?.length ?? null;
        const en = this.tokenizers.encode(t.id, english.text)?.length ?? null;
        return {
          tokens: n,
          vsEnglish: n !== null && en !== null && row.translation ? ratio(n, en) : null,
        };
      }),
    }));
  });

  protected readonly detail = computed(() => {
    const { code, tokenizer } = this.selected();
    const sample = this.samples().find((s) => s.code === code)!;
    return {
      sample,
      def: this.tokenizers.def(tokenizer),
      pieces: this.tokenizers.encode(tokenizer, sample.text),
    };
  });

  constructor() {
    // Il confronto usa tutti i tokenizer: li carichiamo subito.
    for (const t of this.tokenizers.catalog) void this.tokenizers.load(t.id);
  }

  protected edit(code: string, event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.samples.update((rows) => rows.map((r) => (r.code === code ? { ...r, text } : r)));
  }

  protected reset(): void {
    this.samples.set([...LANGUAGE_SAMPLES]);
  }

  protected select(code: string, tokenizer: string): void {
    this.selected.set({ code, tokenizer });
  }

  protected isSelected(code: string, tokenizer: string): boolean {
    const s = this.selected();
    return s.code === code && s.tokenizer === tokenizer;
  }

  /** Classe di colore in base a quanto la lingua "costa" rispetto all'inglese. */
  protected heat(r: number | null): string {
    if (r === null) return '';
    if (r < 1.2) return 'heat-0';
    if (r < 1.6) return 'heat-1';
    if (r < 2.2) return 'heat-2';
    return 'heat-3';
  }
}
