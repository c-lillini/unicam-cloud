# Sito del modulo Cloud Computing su Netlify

Sito statico di presentazione del modulo Cloud Computing (corso Applicazioni Web, Mobile e Cloud, A.A. 2026/2027), usato per mostrare il deploy di un sito statico su una piattaforma PaaS.

Il sito è composto solo da HTML, CSS e JavaScript: **non c'è nessun build** da eseguire, Netlify si limita a pubblicare i file così come sono e a distribuirli tramite la propria CDN.

---

## Struttura del progetto

```
.
├── index.html     contenuto della pagina
├── styles.css     foglio di stile
└── scripts.js     animazioni, anno nel footer e pulsante "Top"
```

---

## Esecuzione in locale

Essendo un sito statico è sufficiente aprire `index.html` nel browser.

In alternativa, per servirlo tramite un piccolo server HTTP (comportamento più simile a quello di produzione):

```bash
npx serve .
```

Il sito è raggiungibile all'indirizzo indicato nel terminale (di default `http://localhost:3000`).

---

## Deploy su Netlify

### Requisiti

- Un account [Netlify](https://www.netlify.com) (il piano Free è sufficiente)
- Per il deploy da Git: il repository pubblicato su GitHub (o GitLab/Bitbucket/Azure DevOps)

Di seguito tre modalità, dalla più consigliata alla più rapida.

### Opzione 1 – Deploy continuo da repository Git (consigliata)

1. Dalla dashboard di Netlify: **Add new project → Import an existing project**.
2. Scegliere il provider Git, autorizzare Netlify e selezionare il repository.
3. Configurare il build:
   - **Branch to deploy**: `main`
   - **Base directory**: `Esercitazioni/03 - Servizi PaaS/Netlify` (il sito non si trova nella radice del repository)
   - **Build command**: lasciare vuoto (non c'è nulla da compilare)
   - **Publish directory**: la stessa cartella della base directory (`Esercitazioni/03 - Servizi PaaS/Netlify`)
4. Nessuna variabile d'ambiente da impostare.
5. Avviare il deploy e attendere il completamento.

Al termine il sito è raggiungibile a `https://<nome-progetto>.netlify.app`. Il nome generato casualmente può essere cambiato dalle impostazioni del progetto (**Project configuration → General → Project details → Change project name**).

Ogni push sul branch collegato avvia automaticamente un nuovo deploy. Le pull request generano inoltre dei **Deploy Preview** con un URL dedicato, utili per verificare le modifiche prima del merge.

### Opzione 2 – Drag & drop (Netlify Drop)

1. Aprire [app.netlify.com/drop](https://app.netlify.com/drop).
2. Trascinare nella pagina la cartella `Netlify` (quella che contiene `index.html`).
3. Il sito viene pubblicato in pochi secondi su un URL `*.netlify.app`.

Comodo per una prova veloce, ma **non c'è deploy continuo**: a ogni modifica la cartella va ricaricata a mano.

### Opzione 3 – Netlify CLI

```bash
npm install -g netlify-cli
netlify login                 # autenticazione tramite browser
netlify deploy --dir .        # deploy di anteprima (draft URL)
netlify deploy --dir . --prod # deploy in produzione
```

I comandi vanno eseguiti dall'interno di questa cartella. Al primo `netlify deploy` la CLI chiede se collegarsi a un progetto esistente o crearne uno nuovo.

---

## Verifica del deploy

- Aprire l'URL `https://<nome-progetto>.netlify.app` e controllare che stili e animazioni siano caricati (se la pagina appare senza stile, la **Publish directory** non è corretta).
- Nella sezione **Deploys** della dashboard sono elencati tutti i deploy, con log e possibilità di tornare a una versione precedente (**Publish deploy** su un deploy passato) senza toccare il repository.
