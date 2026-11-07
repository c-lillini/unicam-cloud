## WordPress + MariaDB

Stack Docker Compose con WordPress (Apache) e database MariaDB.

### Avvio rapido
1. Posizionati nella cartella `Esercitazioni/04 - Docker/Wordpress`.
2. Copia `.env.example` in `.env` e personalizza le credenziali se necessario.
3. Avvia i servizi:
   ```bash
   docker compose up -d
   ```
4. Apri `http://localhost:8080` e completa l'installazione guidata di WordPress.

### Variabili d'ambiente
| Variabile | Descrizione | Default (`.env.example`) |
|-----------|-------------|---------|
| `MYSQL_ROOT_PASSWORD` | Password root di MariaDB | `rootpass` |
| `MYSQL_DATABASE` | Nome del database | `wordpress` |
| `MYSQL_USER` | Utente applicativo | `wordpress` |
| `MYSQL_PASSWORD` | Password utente applicativo | `wordpresspass` |

### Arresto e pulizia
```bash
docker compose down      # ferma i servizi, conserva i dati
docker compose down -v   # rimuove anche i volumi (db_data, wordpress_data)
```
