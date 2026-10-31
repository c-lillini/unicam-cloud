/** Un token prodotto da un tokenizer: il suo ID nel vocabolario e i byte UTF-8 che rappresenta. */
export interface RawToken {
  id: number;
  bytes: Uint8Array;
}

/** Un token pronto per essere mostrato a video. */
export interface TokenPiece {
  id: number;
  bytes: Uint8Array;
  /** Testo del token con gli spazi resi visibili (o i byte in esadecimale se è un frammento). */
  label: string;
  /** Il token non è UTF-8 valido da solo: contiene solo una parte di un carattere. */
  partial: boolean;
  /** I caratteri completi a cui appartengono i byte del token (utile per i frammenti). */
  chars: string;
  /** Il token contiene un a capo: dopo di lui la visualizzazione va a capo. */
  newline: boolean;
}

const utf8 = new TextEncoder();
const strictDecoder = new TextDecoder('utf-8', { fatal: true });

// --- Byte-level BPE (GPT-2, Llama 3) -----------------------------------------

/**
 * I tokenizer "byte-level" (GPT-2, Llama 3...) rappresentano ogni byte con un carattere Unicode
 * stampabile: i byte "visibili" restano se stessi, gli altri (spazi, controlli, byte ≥ 0x7F) vengono
 * spostati a partire da U+0100. Per questo lo spazio diventa "Ġ" (U+0120) e l'a capo "Ċ" (U+010A).
 */
function buildByteLevelDecoder(): Map<string, number> {
  const visible: number[] = [];
  const range = (from: number, to: number) => {
    for (let b = from; b <= to; b++) visible.push(b);
  };
  range(0x21, 0x7e); // da '!' a '~'
  range(0xa1, 0xac); // da '¡' a '¬'
  range(0xae, 0xff); // da '®' a 'ÿ'

  const map = new Map<string, number>();
  let shifted = 0;
  for (let b = 0; b < 256; b++) {
    const ch = visible.includes(b) ? b : 256 + shifted++;
    map.set(String.fromCodePoint(ch), b);
  }
  return map;
}

const byteLevelDecoder = buildByteLevelDecoder();

/** Converte un token byte-level (es. "Ġmondo") nei byte che rappresenta. */
export function byteLevelTokenToBytes(token: string): Uint8Array {
  const out: number[] = [];
  for (const ch of token) {
    const b = byteLevelDecoder.get(ch);
    if (b === undefined) {
      out.push(...utf8.encode(ch)); // token aggiunto a mano (es. token speciali): testo normale
    } else {
      out.push(b);
    }
  }
  return Uint8Array.from(out);
}

// --- SentencePiece con byte fallback (Gemma, Gemini) ------------------------

const BYTE_FALLBACK = /^<0x([0-9A-Fa-f]{2})>$/;

/**
 * I tokenizer SentencePiece (Gemma...) scrivono lo spazio come "▁" (U+2581) e, per i caratteri che
 * non hanno nel vocabolario, ripiegano su token che valgono un singolo byte, scritti "<0xE4>".
 */
export function sentencePieceTokenToBytes(token: string): Uint8Array {
  const m = BYTE_FALLBACK.exec(token);
  if (m) return Uint8Array.of(parseInt(m[1], 16));
  return utf8.encode(token.replaceAll('▁', ' '));
}

// --- Visualizzazione ---------------------------------------------------------

/** Rende visibili spazi, tabulazioni e a capo. */
export function showWhitespace(text: string): string {
  return text.replaceAll(' ', '·').replaceAll('\t', '⇥').replaceAll('\r', '').replaceAll('\n', '↵');
}

/** Byte in esadecimale, es. "F0 9F". */
export function hexBytes(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

/** Restituisce il testo del token se i suoi byte sono UTF-8 valido, altrimenti null. */
export function decodeStrict(bytes: Uint8Array): string | null {
  try {
    return strictDecoder.decode(bytes);
  } catch {
    return null;
  }
}

/** Numero di byte UTF-8 necessari per un code point. */
function utf8Length(codePoint: number): number {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}

/**
 * Trasforma la sequenza di token in "pezzi" da visualizzare.
 *
 * Un token può contenere solo una parte dei byte di un carattere (tipico di emoji e ideogrammi:
 * "🚀" sono 4 byte, che possono finire in 2 o 3 token diversi). Questi frammenti non sono testo
 * valido da soli: li mostriamo come byte esadecimali e indichiamo a quale carattere appartengono.
 */
export function toPieces(tokens: RawToken[]): TokenPiece[] {
  // Posizione (in byte) di ogni carattere del testo completo.
  const total = tokens.reduce((n, t) => n + t.bytes.length, 0);
  const all = new Uint8Array(total);
  let offset = 0;
  for (const t of tokens) {
    all.set(t.bytes, offset);
    offset += t.bytes.length;
  }
  const text = new TextDecoder('utf-8').decode(all);
  const chars: { start: number; end: number; ch: string }[] = [];
  let pos = 0;
  for (const ch of text) {
    const len = ch === '�' ? 1 : utf8Length(ch.codePointAt(0)!);
    chars.push({ start: pos, end: pos + len, ch });
    pos += len;
  }

  const pieces: TokenPiece[] = [];
  let start = 0;
  let c = 0;
  for (const t of tokens) {
    const end = start + t.bytes.length;
    while (c < chars.length && chars[c].end <= start) c++;
    let owned = '';
    for (let k = c; k < chars.length && chars[k].start < end; k++) owned += chars[k].ch;

    const decoded = decodeStrict(t.bytes);
    pieces.push({
      id: t.id,
      bytes: t.bytes,
      label: decoded === null ? hexBytes(t.bytes) : showWhitespace(decoded),
      partial: decoded === null,
      chars: owned,
      newline: decoded !== null && decoded.includes('\n'),
    });
    start = end;
  }
  return pieces;
}
