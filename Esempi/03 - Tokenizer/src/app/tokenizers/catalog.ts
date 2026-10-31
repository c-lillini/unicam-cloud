export type Encoding = 'o200k_base' | 'cl100k_base';

export interface TokenizerDef {
  id: string;
  /** Nome del tokenizer (encoding), come lo chiama OpenAI. */
  encoding: Encoding;
  /** Famiglia di modelli, usata come etichetta breve. */
  family: string;
  vendor: string;
  /** Modelli che usano questo vocabolario. */
  models: string;
  /** Numero di token nel vocabolario. */
  vocabSize: number;
}

/** Tokenizer OpenAI inclusi nell'app (libreria js-tiktoken). */
export const TOKENIZERS: readonly TokenizerDef[] = [
  {
    id: 'o200k',
    encoding: 'o200k_base',
    family: 'GPT-4o / GPT-5',
    vendor: 'OpenAI',
    models: 'GPT-4o, GPT-4.1, GPT-5, o1, o3, o4-mini',
    vocabSize: 200_019,
  },
  {
    id: 'cl100k',
    encoding: 'cl100k_base',
    family: 'GPT-4 / GPT-3.5',
    vendor: 'OpenAI',
    models: 'GPT-4, GPT-4 Turbo, GPT-3.5 Turbo',
    vocabSize: 100_277,
  },
];
