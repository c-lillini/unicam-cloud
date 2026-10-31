# Tokenizer: come un LLM legge il testo

Simulatore didattico (Angular 21) che mostra come un modello linguistico divide il testo in **token**,
usando i **tokenizer reali** di GPT, Llama e Gemma, e quanto il numero di token cambia da una lingua
all'altra.

## Avvio

```bash
npm install
npm start          # http://localhost:4200
```

Altri comandi: `npm test` (unit test con Vitest), `npm run build` (build di produzione in `dist/`).

> Richiede Node.js ≥ 20.19 (Angular 21).

## I tokenizer

| Tokenizer | Modelli | Vocabolario | Da dove arriva |
| --- | --- | --- | --- |
| `o200k_base` (OpenAI) | GPT-4o, GPT-4.1, GPT-5, o1, o3, o4-mini | 200.019 token | incluso nell'app ([js-tiktoken](https://github.com/dqbd/tiktoken)) |
| `cl100k_base` (OpenAI) | GPT-4, GPT-4 Turbo, GPT-3.5 Turbo | 100.277 token | incluso nell'app (js-tiktoken) |
| Llama 3 (Meta) | Llama 3, 3.1, 3.2, 3.3 | 128.256 token | scaricato da Hugging Face al primo uso (≈ 9 MB) |
| Gemma 3 (Google) | Gemma 3, stesso vocabolario di Gemini 2.0 | 262.144 token | scaricato da Hugging Face al primo uso (≈ 20 MB) |

I vocabolari di Llama e Gemma vengono letti con
[@huggingface/tokenizers](https://github.com/huggingface/tokenizers.js) dai repository pubblici
`Xenova/llama3-tokenizer-new` e `onnx-community/gemma-3-270m-it-ONNX`, fissati a una revisione precisa,
e poi salvati nella Cache Storage del browser: dopo il primo download funzionano anche senza rete.
Se Hugging Face non è raggiungibile l'app lo segnala, offre un pulsante "Riprova" e continua a
funzionare con i tokenizer OpenAI.

**Claude non c'è** perché il tokenizer di Claude 3 e successivi non è pubblico: il conteggio esatto si
ottiene solo dall'API `count_tokens`, che richiede una chiave e quindi un backend. L'app lo spiega in un
riquadro dedicato.

## Cosa si può fare

**Tokenizza**

- scrivere o incollare un testo e vederlo diviso in token, come blocchetti colorati (spazio = `·`,
  a capo = `↵`); passando il mouse su un token se ne vedono ID e byte;
- passare da un tokenizer all'altro e confrontare i conteggi: caratteri, parole, byte UTF-8, token,
  token per parola;
- mostrare gli **ID** al posto del testo: è la sequenza di numeri che il modello riceve davvero;
- osservare i **frammenti di carattere** (bordo tratteggiato): emoji e ideogrammi rari vengono spezzati
  in più token, ognuno dei quali contiene solo alcuni byte UTF-8 del carattere.

**Confronta lingue**

- la stessa frase in inglese, italiano, spagnolo, tedesco, cinese, giapponese e arabo, più una riga di
  codice e una di emoji, tutte modificabili;
- una tabella lingue × tokenizer con il numero di token e il rapporto rispetto all'inglese (colorato
  in base a quanto la lingua "costa" di più);
- cliccando una cella si vedono i token di quella frase con quel tokenizer.

In fondo a ogni vista una breve sezione teorica spiega cosa sono i token, come funziona il BPE e perché
alcune lingue richiedono più token.

## Struttura

```
src/app/
├── tokenizers/
│   ├── catalog.ts              # elenco dei tokenizer: modelli, vocabolario, sorgente
│   ├── tokenizer.service.ts    # caricamento (con cache) e codifica del testo
│   ├── token-bytes.ts          # byte di ogni token, frammenti di carattere, spazi visibili
│   ├── text-stats.ts           # caratteri, parole, byte UTF-8
│   ├── samples.ts              # testo di esempio e frasi nelle varie lingue
│   └── *.spec.ts               # test della logica
├── components/
│   ├── tokenize-view.*         # vista "Tokenizza"
│   ├── compare-view.*          # vista "Confronta lingue"
│   ├── token-view.*            # blocchetti colorati dei token
│   └── tokenizer-status.ts     # stato di caricamento / errore / "Riprova"
└── app.*                       # intestazione e schede
```
