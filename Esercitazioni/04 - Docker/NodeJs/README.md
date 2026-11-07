## Machine Info Service

Servizio Node.js/Express che restituisce informazioni sulla macchina (o sul container) in cui e' in esecuzione: hostname, indirizzo IP, piattaforma, uptime e memoria.

### Avvio con Docker
Dalla cartella `Esercitazioni/04 - Docker/NodeJs`:
```bash
docker build -t machine-info .
docker run --rm -p 3000:3000 machine-info
```
Il servizio risponde su `http://localhost:3000/` con un JSON, ad esempio:
```json
{
  "hostname": "3f2a1c9d8b7e",
  "ipAddress": "172.17.0.2",
  "platform": "linux",
  "release": "6.6.87",
  "uptimeSeconds": 1234,
  "totalMemoryMB": 7851,
  "freeMemoryMB": 6120
}
```
La porta interna e' configurabile con la variabile `PORT` (default `3000`).
