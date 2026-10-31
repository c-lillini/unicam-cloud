# Cloud AI APIs - collection Bruno

Collection didattica per il corso di **Cloud Computing** (laurea triennale in Informatica, Università di Camerino).
Serve a osservare, senza SDK e senza librerie di mezzo, come si dialoga con servizi cloud di tipo *API-as-a-Service*:
le API di **OpenAI (ChatGPT)** - sia **Responses** (attuale) sia **Chat Completions** (storica) - e quella di **Anthropic (Claude)**.

## Come si apre

Questa è una collection in formato nativo Bruno (una cartella di file `.bru`): si apre con **Open Collection** e si seleziona la cartella.
*Import Collection* non è la voce giusta: accetta solo file singoli (Postman, Insomnia, OpenAPI, ZIP).

1. Installare Bruno (<https://www.usebruno.com>).
2. **Open Collection** → scegliere questa cartella.
3. Creare le API key (vedi sotto) copiando `.env.example` in `.env` e inserendo le proprie chiavi.
4. Eseguire le richieste in ordine, cartella per cartella.

## API key: il file `.env`

Le chiavi **non** stanno nella collection né nell'environment: Bruno le legge dal file `.env` nella radice della collection
(variabili `process.env.*`), che è escluso da Git tramite `.gitignore`.

```bash
cp .env.example .env     # poi editare .env con le proprie chiavi
```

```dotenv
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

- `.env.example` è il modello (senza valori reali) e **è versionato**; `.env` contiene le chiavi vere e **non va mai committato**.
- Le variabili `openaiApiKey` e `anthropicApiKey` sono definite nel `folder.bru` di ciascun provider come `{{process.env.OPENAI_API_KEY}}` / `{{process.env.ANTHROPIC_API_KEY}}`.
- Dopo aver modificato `.env`, riaprire la collection in Bruno per ricaricare le variabili.

## Contenuto

| Cartella | API | Chi conserva lo stato della conversazione |
|---|---|---|
| `01 - OpenAI / A - Responses (Statefull)` | `POST /v1/responses` | **Il server** (opzionale), tramite `previous_response_id` |
| `01 - OpenAI / B - Chat Completions (Stateless)` | `POST /v1/chat/completions` | Il client |
| `02 - Anthropic` | `POST /v1/messages` | Il client |

Scenari: **01 Hello World**, **02-03-04 Multi-turno** (turno 1, turno 2 con contesto, controprova senza contesto).

## Filo conduttore

L'esperimento multi-turno mostra due modi di gestire lo stato di una conversazione:

- **Stato nel client** (Chat Completions, Messages): si rispedisce tutta la cronologia a ogni chiamata. Servizio stateless, facile da scalare; il client paga il trasporto del contesto.
- **Stato sul server** (Responses con `previous_response_id`): si rimanda solo la nuova domanda e un id. Client più semplice, ma la conversazione vive nel cloud del provider
  (lock-in, retention, privacy). **Il costo in token non sparisce**: il contesto viene comunque elaborato e fatturato come input.

Collegamenti al corso: scalabilità orizzontale e stateless, costo e modello pay-per-use, vendor lock-in e portabilità, governance dei dati.

## Variabili

Le variabili sono definite a livello di **cartella** (`folder.bru` di ciascun provider), non nell'environment.

| Cartella | Variabile | Valore |
|---|---|---|
| `01 - OpenAI` | `openaiBaseUrl` | `https://api.openai.com/v1/` |
| | `openaiModel` | `gpt-6-luna` |
| | `openaiApiKey` | `{{process.env.OPENAI_API_KEY}}` (da `.env`) |
| `02 - Anthropic` | `anthropicBaseUrl` | `https://api.anthropic.com/v1/` |
| | `anthropicModel` | `claude-haiku-5-5` |
| | `anthropicVersion` | `2026-10-21` |
| | `anthropicApiKey` | `{{process.env.ANTHROPIC_API_KEY}}` (da `.env`) |

I nomi dei modelli cambiano nel tempo: se una richiesta dà errore sul modello, interrogare `GET /models` e aggiornare la variabile.

## Documentazione

- OpenAI - <https://developers.openai.com/docs/api-reference>
- Anthropic - <https://platform.claude.com/docs/en/api/messages/create>
