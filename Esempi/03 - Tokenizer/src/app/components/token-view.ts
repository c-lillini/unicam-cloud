import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TokenPiece, hexBytes } from '../tokenizers/token-bytes';

/** Mostra una sequenza di token come blocchetti colorati. */
@Component({
  selector: 'app-token-view',
  templateUrl: './token-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenView {
  readonly pieces = input.required<TokenPiece[]>();
  /** Mostra gli ID numerici al posto del testo (è ciò che il modello "vede" davvero). */
  readonly showIds = input(false);

  protected tooltip(p: TokenPiece): string {
    const head = `ID ${p.id} · ${p.bytes.length} byte (${hexBytes(p.bytes)})`;
    return p.partial
      ? `${head}\nFrammento: questi byte sono solo una parte del carattere «${p.chars}»`
      : head;
  }
}
