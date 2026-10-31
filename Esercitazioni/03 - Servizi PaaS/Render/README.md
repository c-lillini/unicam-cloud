# Il sondaggio che sparisce

Applicazione web Node.js per un sondaggio in tempo reale: i partecipanti votano dal telefono e i risultati compaiono come barre su una pagina da proiettare, aggiornata automaticamente.

I voti sono conservati **solo in memoria**: a ogni riavvio del processo (nuovo deploy, sospensione del servizio, riavvio manuale) il sondaggio riparte da zero.

Realizzata con **Express**, **EJS** e **qrcode**.

---

## Struttura del progetto

```
.
├── app.js                  server Express e definizione delle rotte
├── modello/
│   └── sondaggio.js        domanda, opzioni e conteggio dei voti (in memoria)
├── views/
│   ├── telefono.ejs        pagina di voto per i partecipanti
│   └── schermo.ejs         pagina dei risultati da proiettare
├── public/
│   └── stile.css           foglio di stile condiviso
└── package.json
```

### Rotte

| Metodo | Rotta | Descrizione |
|---|---|---|
| `GET` | `/` | Pagina di voto: la domanda e un bottone per ogni opzione |
| `POST` | `/voto/:opzione` | Registra un voto. Risponde `200` se accettato, `400` se l'opzione non esiste |
| `GET` | `/schermo` | Pagina dei risultati con QR code per votare, aggiornata ogni 1,5 secondi |
| `GET` | `/stato` | Stato corrente del sondaggio in formato JSON |

---

## Esecuzione in locale

### Requisiti

- Node.js **20** o superiore

### Avvio

```bash
npm install
npm start
```

L'applicazione è in ascolto sulla porta `3000` (o su quella indicata dalla variabile d'ambiente `PORT`):

- `http://localhost:3000` → pagina di voto
- `http://localhost:3000/schermo` → pagina dei risultati

Per votare da un telefono collegato alla stessa rete, sostituire `localhost` con l'indirizzo IP del computer (es. `http://192.168.1.20:3000`). Lo stesso vale per la pagina dei risultati: il QR code riporta l'indirizzo con cui è stata aperta, quindi aprendola da `localhost` il QR non sarebbe raggiungibile dai telefoni.

---

## Deploy su Render

### Requisiti

- Un account [Render](https://render.com)
- Il repository pubblicato su GitHub (o GitLab/Bitbucket)

### Procedura

1. Dalla dashboard di Render: **New → Web Service**, quindi collegare il repository.
2. **Root Directory**: `Esercitazioni/03 - Servizi PaaS/Render` (l'applicazione non si trova nella radice del repository).
3. **Runtime**: Node, riconosciuto automaticamente da `package.json`.
4. Comandi:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Instance Type**: Free.
6. Nessuna variabile d'ambiente da impostare: `PORT` viene assegnata da Render.
7. **Create Web Service** e attendere il completamento del deploy.

Al termine l'applicazione è raggiungibile a:

- `https://<nome-servizio>.onrender.com` → pagina di voto
- `https://<nome-servizio>.onrender.com/schermo` → pagina dei risultati

Ogni push sul branch collegato avvia automaticamente un nuovo deploy.

> Sul piano Free il servizio viene sospeso dopo un periodo senza traffico: la prima richiesta successiva richiede alcuni secondi e, poiché il processo viene ricreato, i voti vengono azzerati.

---

## Utilizzo

1. Aprire la pagina **`/schermo`** sul dispositivo collegato al proiettore. In alto a destra compare un **QR code** che porta alla pagina di voto; accanto alla domanda è indicato anche l'indirizzo da digitare.
2. I partecipanti inquadrano il QR code (oppure aprono la pagina **`/`**) dal telefono e toccano una delle opzioni. Ogni pagina consente un solo voto; ricaricandola si può votare di nuovo.
3. Sullo schermo le barre e il totale dei voti si aggiornano automaticamente.

### Riga di diagnostica

In fondo alla pagina `/schermo` sono mostrati:

- **processo** — PID del processo Node che sta servendo l'applicazione
- **acceso da** — secondi trascorsi dall'avvio del processo
- **richieste servite** — numero di richieste HTTP ricevute dall'avvio

Se il PID cambia e il tempo di accensione riparte da pochi secondi, il processo è stato riavviato e i voti precedenti sono andati persi.

### Modificare domanda e opzioni

La domanda e le opzioni sono definite in `modello/sondaggio.js`:

```js
const DOMANDA = 'Quale di queste piattaforme hai già usato?';
const OPZIONI = ['Vercel', 'Netlify', 'Render', 'Nessuna'];
```

Dopo la modifica, riavviare l'applicazione in locale oppure fare push per un nuovo deploy su Render.

### Interrogare lo stato via API

```bash
curl https://<nome-servizio>.onrender.com/stato
```

```json
{
  "domanda": "Quale di queste piattaforme hai già usato?",
  "voti": { "Vercel": 3, "Netlify": 5, "Render": 2, "Nessuna": 1 },
  "totale": 11,
  "uptimeSecondi": 842,
  "richiesteServite": 317,
  "pid": 57
}
```
