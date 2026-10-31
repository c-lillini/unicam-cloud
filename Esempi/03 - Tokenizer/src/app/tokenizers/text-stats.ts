/** Statistiche di un testo, indipendenti dal tokenizer. */
export interface TextStats {
  /** Caratteri "percepiti" (grafemi): "☁️" o "è" contano 1 anche se sono più code point. */
  chars: number;
  /** Parole, secondo le regole Unicode della lingua (funziona anche per cinese e giapponese). */
  words: number;
  /** Byte occupati in UTF-8. */
  bytes: number;
}

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
const utf8 = new TextEncoder();

export function countChars(text: string): number {
  let n = 0;
  for (const _ of graphemes.segment(text)) n++;
  return n;
}

export function countWords(text: string): number {
  let n = 0;
  for (const s of wordSegmenter.segment(text)) if (s.isWordLike) n++;
  return n;
}

export function textStats(text: string): TextStats {
  return { chars: countChars(text), words: countWords(text), bytes: utf8.encode(text).length };
}

/** Rapporto a/b, oppure null se non si può calcolare. */
export function ratio(a: number, b: number): number | null {
  return b > 0 ? a / b : null;
}
