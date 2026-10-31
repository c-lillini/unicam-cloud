import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DEFAULT_TEXT } from '../tokenizers/samples';
import { ratio, textStats } from '../tokenizers/text-stats';
import { TokenizerService } from '../tokenizers/tokenizer.service';
import { TokenView } from './token-view';
import { TokenizerStatus } from './tokenizer-status';

/** Vista "Tokenizza": un testo libero diviso in token dal tokenizer scelto. */
@Component({
  selector: 'app-tokenize-view',
  imports: [TokenView, TokenizerStatus, DecimalPipe],
  templateUrl: './tokenize-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenizeView {
  protected readonly tokenizers = inject(TokenizerService);

  protected readonly text = signal(DEFAULT_TEXT);
  protected readonly selected = signal(this.tokenizers.catalog[0].id);
  protected readonly showIds = signal(false);

  protected readonly def = computed(() => this.tokenizers.def(this.selected()));
  protected readonly pieces = computed(() => this.tokenizers.encode(this.selected(), this.text()));
  protected readonly stats = computed(() => textStats(this.text()));
  protected readonly tokensPerWord = computed(() =>
    ratio(this.pieces()?.length ?? 0, this.stats().words),
  );
  protected readonly fragments = computed(
    () => this.pieces()?.filter((p) => p.partial).length ?? 0,
  );

  constructor() {
    void this.tokenizers.load(this.selected());
  }

  protected select(id: string): void {
    this.selected.set(id);
    void this.tokenizers.load(id);
  }

  protected onInput(event: Event): void {
    this.text.set((event.target as HTMLTextAreaElement).value);
  }

  protected reset(): void {
    this.text.set(DEFAULT_TEXT);
  }
}
