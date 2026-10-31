import { countChars, countWords, ratio, textStats } from './text-stats';

describe('countChars', () => {
  it('conta i caratteri percepiti, non i code point', () => {
    expect(countChars('ciao')).toBe(4);
    expect(countChars('☁️')).toBe(1); // nuvola + selettore di variante
    expect(countChars('👩‍💻')).toBe(1); // sequenza ZWJ
    expect(countChars('🇮🇹')).toBe(1); // bandiera = due indicatori regionali
  });
});

describe('countWords', () => {
  it('ignora punteggiatura e spazi', () => {
    expect(countWords('Ciao, mondo!  Come va?')).toBe(4);
  });

  it('conta le parole anche nelle lingue senza spazi', () => {
    expect(countWords('云计算让你按需租用计算资源')).toBeGreaterThan(1);
  });
});

describe('textStats', () => {
  it('riporta anche i byte UTF-8', () => {
    expect(textStats('è🚀')).toEqual({ chars: 2, words: 1, bytes: 6 });
  });
});

describe('ratio', () => {
  it('calcola il rapporto, o null se il denominatore è zero', () => {
    expect(ratio(3, 2)).toBe(1.5);
    expect(ratio(3, 0)).toBeNull();
  });
});
