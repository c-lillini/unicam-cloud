## Catalog Service

Servizio Node.js/Express che espone un catalogo di item persistiti su MongoDB. Il repository contiene sia il backend sia la configurazione Docker per avviarlo rapidamente.

### Prerequisiti
- Docker e Docker Compose

### Avvio rapido con Docker Compose
1. Posizionati nella cartella `Esercitazioni/04 - Docker/Catalog`.
2. Copia il file `.env.example` in `.env` e personalizza le credenziali se necessario. 
3. Avvia i servizi:
   ```bash
   docker compose up -d
   ```
4. L'API sara' raggiungibile su `http://localhost:3000/items`. MongoDB e' disponibile solo sulla rete interna del compose.

Per fermare lo stack:
```bash
docker compose down
```
Il volume `mongo_data` conserva i dati; aggiungi `-v` se vuoi rimuoverlo.

### Variabili d'ambiente principali
| Variabile | Descrizione |
|-----------|-------------|
| `MONGODB_DB` | Nome del database | `catalog` |
| `MONGODB_COLLECTION` | Collezione utilizzata per gli item |
| `MONGODB_USERNAME` | Username MongoDB |
| `MONGODB_PASSWORD` | Password MongoDB |

### Endpoint principali
- `GET /items` -> restituisce l'elenco degli item (campi `code`, `description`).
- `POST /items` -> inserisce un nuovo item. Richiede payload JSON:
  ```json
  {
    "code": "ABC-123",
    "description": "Item description"
  }
  ```

### Pulizia
Per rimuovere immagini o volumi residui:
```bash
docker compose down -v
```
