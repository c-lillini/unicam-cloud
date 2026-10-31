import { Injectable, signal } from '@angular/core';
import { TOKENIZERS, TokenizerDef } from './catalog';
import { RawToken, TokenPiece, toPieces } from './token-bytes';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Un tokenizer caricato: sa solo trasformare un testo in token. */
interface Engine {
  encode(text: string): RawToken[];
}

/**
 * Carica i tokenizer (al primo uso) e trasforma i testi in token.
 * Lo stato di caricamento è un signal, così l'interfaccia si aggiorna da sola.
 */
@Injectable({ providedIn: 'root' })
export class TokenizerService {
  readonly catalog = TOKENIZERS;

  private readonly engines = new Map<string, Engine>();
  private readonly pending = new Map<string, Promise<void>>();
  private readonly statuses = signal<Record<string, LoadStatus>>({});
  private readonly errors = signal<Record<string, string>>({});

  def(id: string): TokenizerDef {
    const d = this.catalog.find((t) => t.id === id);
    if (!d) throw new Error(`Tokenizer sconosciuto: ${id}`);
    return d;
  }

  status(id: string): LoadStatus {
    return this.statuses()[id] ?? 'idle';
  }

  error(id: string): string | undefined {
    return this.errors()[id];
  }

  /** Carica il tokenizer, se non è già caricato o in caricamento. */
  load(id: string): Promise<void> {
    if (this.engines.has(id)) return Promise.resolve();
    const running = this.pending.get(id);
    if (running) return running;

    this.setStatus(id, 'loading');
    const p = this.createEngine(this.def(id))
      .then((engine) => {
        this.engines.set(id, engine);
        this.setStatus(id, 'ready');
      })
      .catch((err: unknown) => {
        console.error(err);
        const message = err instanceof Error ? err.message : String(err);
        this.errors.update((e) => ({ ...e, [id]: message }));
        this.setStatus(id, 'error');
      })
      .finally(() => this.pending.delete(id));
    this.pending.set(id, p);
    return p;
  }

  /**
   * Divide il testo in token. Restituisce null se il tokenizer non è ancora pronto.
   * Legge lo stato tramite signal: dentro un `computed` il risultato si aggiorna a caricamento finito.
   */
  encode(id: string, text: string): TokenPiece[] | null {
    if (this.status(id) !== 'ready') return null;
    const engine = this.engines.get(id);
    return engine ? toPieces(engine.encode(text)) : null;
  }

  private setStatus(id: string, s: LoadStatus): void {
    this.statuses.update((all) => ({ ...all, [id]: s }));
    if (s !== 'error') this.errors.update(({ [id]: _, ...rest }) => rest);
  }

  private async createEngine(def: TokenizerDef): Promise<Engine> {
    // I vocabolari sono inclusi nell'app, in file separati (1-2 MB) caricati solo quando servono.
    const [{ Tiktoken }, ranks] = await Promise.all([
      import('js-tiktoken/lite'),
      def.encoding === 'o200k_base'
        ? import('js-tiktoken/ranks/o200k_base')
        : import('js-tiktoken/ranks/cl100k_base'),
    ]);
    const enc = new Tiktoken(ranks.default);
    // `textMap` (ID → byte) è interna a js-tiktoken ma è l'unico modo di avere i byte di un token:
    // `decode([id])` di un frammento di carattere restituirebbe solo "�".
    const textMap = (enc as unknown as { textMap: Map<number, Uint8Array> }).textMap;
    return {
      // [] / []: eventuali "<|endoftext|>" nel testo sono trattati come testo normale.
      encode: (text) =>
        enc.encode(text, [], []).map((id) => ({ id, bytes: textMap.get(id) ?? new Uint8Array() })),
    };
  }
}
