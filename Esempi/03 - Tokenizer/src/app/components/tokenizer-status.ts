import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TokenizerService } from '../tokenizers/tokenizer.service';

/** Messaggio di caricamento / errore (con "Riprova") per un tokenizer non ancora pronto. */
@Component({
  selector: 'app-tokenizer-status',
  template: `
    @switch (status()) {
      @case ('idle') {
        <button type="button" class="small" (click)="tokenizers.load(id())">
          Scarica{{ sizeMb() ? ' (≈' + sizeMb() + ' MB)' : '' }}
        </button>
      }
      @case ('loading') {
        <span class="status loading small">
          {{ sizeMb() ? 'Scaricamento da Hugging Face (≈' + sizeMb() + ' MB)…' : 'Caricamento…' }}
        </span>
      }
      @case ('error') {
        <span class="status error small">
          {{ tokenizers.error(id()) }}
          <button type="button" class="small" (click)="tokenizers.load(id())">Riprova</button>
        </span>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenizerStatus {
  protected readonly tokenizers = inject(TokenizerService);
  readonly id = input.required<string>();

  protected readonly status = computed(() => this.tokenizers.status(this.id()));
  protected readonly sizeMb = computed(() => {
    const src = this.tokenizers.def(this.id()).source;
    return src.kind === 'huggingface' ? src.sizeMb : 0;
  });
}
