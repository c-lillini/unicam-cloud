import { Injectable, signal } from '@angular/core';
import { TOKENIZERS, TokenizerDef } from './catalog';
import {
  RawToken,
  TokenPiece,
  byteLevelTokenToBytes,
  sentencePieceTokenToBytes,
  toPieces,
} from './token-bytes';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Un tokenizer caricato: sa solo trasformare un testo in token. */
interface Engine {
  encode(text: string): RawToken[];
}

const CACHE_NAME = 'tokenizer-demo-v1';

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
        this.errors.update((e) => ({ ...e, [id]: describeError(err) }));
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
    const src = def.source;
    if (src.kind === 'tiktoken') {
      // I vocabolari OpenAI sono inclusi nell'app, in file separati caricati solo quando servono.
      const [{ Tiktoken }, ranks] = await Promise.all([
        import('js-tiktoken/lite'),
        src.encoding === 'o200k_base'
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
          enc
            .encode(text, [], [])
            .map((id) => ({ id, bytes: textMap.get(id) ?? new Uint8Array() })),
      };
    }

    const base = `https://huggingface.co/${src.repo}/resolve/${src.revision}`;
    const [{ Tokenizer }, json, config] = await Promise.all([
      import('@huggingface/tokenizers'),
      fetchJson(`${base}/tokenizer.json`),
      fetchJson(`${base}/tokenizer_config.json`),
    ]);
    const tokenizer = new Tokenizer(json, config);
    const decoderType = (json as { decoder?: { type?: string } }).decoder?.type;
    const toBytes = decoderType === 'ByteLevel' ? byteLevelTokenToBytes : sentencePieceTokenToBytes;
    return {
      encode: (text) => {
        const e = tokenizer.encode(text, { add_special_tokens: false });
        return e.ids.map((id, i) => ({ id, bytes: toBytes(e.tokens[i]) }));
      },
    };
  }
}

/** Scarica un JSON passando dalla Cache Storage del browser: dopo la prima volta non serve la rete. */
async function fetchJson(url: string): Promise<object> {
  let cache: Cache | undefined;
  try {
    cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(url);
    if (hit) return (await hit.json()) as object;
  } catch {
    cache = undefined; // Cache Storage non disponibile (es. pagina non in HTTPS): si scarica e basta
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} scaricando ${url}`);
  if (cache) {
    try {
      await cache.put(url, res.clone());
    } catch {
      // cache piena o non disponibile: non è un problema
    }
  }
  return (await res.json()) as object;
}

function describeError(err: unknown): string {
  if (err instanceof TypeError)
    return 'Hugging Face non è raggiungibile: controlla la connessione.';
  return err instanceof Error ? err.message : String(err);
}
