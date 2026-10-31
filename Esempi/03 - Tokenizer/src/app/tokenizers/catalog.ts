export type TokenizerSource =
  /** Vocabolario OpenAI incluso nell'app (libreria js-tiktoken). */
  | { kind: 'tiktoken'; encoding: 'o200k_base' | 'cl100k_base' }
  /** Vocabolario scaricato da Hugging Face al primo uso (libreria @huggingface/tokenizers). */
  | { kind: 'huggingface'; repo: string; revision: string; sizeMb: number };

export interface TokenizerDef {
  id: string;
  /** Nome breve, usato nelle intestazioni. */
  name: string;
  vendor: string;
  /** Modelli che usano questo vocabolario. */
  models: string;
  /** Numero di token nel vocabolario. */
  vocabSize: number;
  source: TokenizerSource;
}

export const TOKENIZERS: readonly TokenizerDef[] = [
  {
    id: 'o200k',
    name: 'GPT-4o / GPT-5',
    vendor: 'OpenAI',
    models: 'GPT-4o, GPT-4.1, GPT-5, o1, o3, o4-mini',
    vocabSize: 200_019,
    source: { kind: 'tiktoken', encoding: 'o200k_base' },
  },
  {
    id: 'cl100k',
    name: 'GPT-4 / GPT-3.5',
    vendor: 'OpenAI',
    models: 'GPT-4, GPT-4 Turbo, GPT-3.5 Turbo',
    vocabSize: 100_277,
    source: { kind: 'tiktoken', encoding: 'cl100k_base' },
  },
  {
    id: 'llama3',
    name: 'Llama 3',
    vendor: 'Meta',
    models: 'Llama 3, 3.1, 3.2, 3.3',
    vocabSize: 128_256,
    source: {
      kind: 'huggingface',
      repo: 'Xenova/llama3-tokenizer-new',
      revision: '566fd99122febe940eaa6518324e934fb0a06e5b',
      sizeMb: 9,
    },
  },
  {
    id: 'gemma3',
    name: 'Gemma 3',
    vendor: 'Google',
    models: 'Gemma 3 (stesso vocabolario di Gemini 2.0)',
    vocabSize: 262_144,
    source: {
      kind: 'huggingface',
      repo: 'onnx-community/gemma-3-270m-it-ONNX',
      revision: '2dbbfdb1b59bd034eb959428c6a7da9dd7ea27f0',
      sizeMb: 20,
    },
  },
];
