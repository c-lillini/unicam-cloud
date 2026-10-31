import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TokenizerService } from '../tokenizers/tokenizer.service';

/** Messaggio di caricamento / errore (con "Riprova") per un tokenizer non ancora pronto. */
@Component({
  selector: 'app-tokenizer-status',
  template: `
    @switch (status()) {
      @case ('error') {
        <span class="status error small">
          Impossibile caricare il tokenizer: {{ tokenizers.error(id()) }}
          <button type="button" class="small" (click)="tokenizers.load(id())">Riprova</button>
        </span>
      }
      @default {
        <span class="status loading small">Caricamento del vocabolario…</span>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenizerStatus {
  protected readonly tokenizers = inject(TokenizerService);
  readonly id = input.required<string>();

  protected readonly status = computed(() => this.tokenizers.status(this.id()));
}
