# Catalog Items Service

Applicazione Express che espone endpoint REST per leggere ed inserire articoli in MongoDB.

## Configurazione

1. Copiare `.env.example` in `.env` e aggiornare le variabili:
   ```bash
   cp .env.example .env
   ```
2. Impostare in `.env` la stringa di connessione `MONGODB_URI` e, se necessario, nome database (`MONGODB_DB`) e collection (`MONGODB_COLLECTION`).

## Installazione

```bash
npm install
```

## Avvio

```bash
npm start
```

Endpoint disponibili:

- `GET /items` restituisce la lista degli articoli (campi `code` e `description`).
- `POST /items` inserisce un nuovo articolo. Body JSON atteso:
  ```json
  {
    "code": "ABC123",
    "description": "Descrizione articolo"
  }
  ```
