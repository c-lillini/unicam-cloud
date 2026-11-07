# Catalog Items Service

Applicazione Express che espone endpoint REST per leggere ed inserire articoli in MongoDB.

## Configurazione

1. Copiare `.env.example` in `.env` e aggiornare le variabili:
   ```bash
   cp .env.example .env
   ```
2. Uso standalone (senza Docker Compose): impostare in `.env` la stringa di connessione `MONGODB_URI` e, se necessario, `MONGODB_DB`, `MONGODB_COLLECTION`, `MONGODB_USERNAME` e `MONGODB_PASSWORD`. Con Docker Compose, `MONGODB_URI` e' gia' impostata da `docker-compose.yaml` e basta il `.env` nella cartella superiore.

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
