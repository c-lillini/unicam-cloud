import { showWhitespace, toPieces } from './token-bytes';

const bytes = (s: string) => new TextEncoder().encode(s);

describe('showWhitespace', () => {
  it('rende visibili spazi, tabulazioni e a capo', () => {
    expect(showWhitespace(' a\tb\r\n')).toBe('·a⇥b↵');
  });
});

describe('toPieces', () => {
  it('mostra i token completi come testo', () => {
    const pieces = toPieces([
      { id: 1, bytes: bytes('Ciao') },
      { id: 2, bytes: bytes(' mondo\n') },
    ]);
    expect(pieces.map((p) => p.label)).toEqual(['Ciao', '·mondo↵']);
    expect(pieces.map((p) => p.partial)).toEqual([false, false]);
    expect(pieces[1].newline).toBe(true);
  });

  it('riconosce i frammenti di un carattere diviso fra più token', () => {
    // "🚀" = F0 9F 9A 80, diviso in due token come fanno i tokenizer reali.
    const rocket = bytes('🚀');
    const pieces = toPieces([
      { id: 1, bytes: bytes(' ') },
      { id: 2, bytes: rocket.slice(0, 2) },
      { id: 3, bytes: rocket.slice(2) },
      { id: 4, bytes: bytes('ok') },
    ]);
    expect(pieces.map((p) => p.partial)).toEqual([false, true, true, false]);
    expect(pieces[1].label).toBe('F0 9F');
    expect(pieces[2].label).toBe('9A 80');
    expect(pieces[1].chars).toBe('🚀');
    expect(pieces[2].chars).toBe('🚀');
    expect(pieces[3].chars).toBe('ok');
  });

  it('associa ogni frammento al carattere giusto anche con caratteri vicini', () => {
    // "è" (C3 A8) seguito da "云" (E4 BA 91), con un token che li attraversa.
    const all = bytes('è云');
    const pieces = toPieces([
      { id: 1, bytes: all.slice(0, 1) },
      { id: 2, bytes: all.slice(1, 3) },
      { id: 3, bytes: all.slice(3) },
    ]);
    expect(pieces.map((p) => p.chars)).toEqual(['è', 'è云', '云']);
  });

  it('restituisce una lista vuota per un testo vuoto', () => {
    expect(toPieces([])).toEqual([]);
  });
});
